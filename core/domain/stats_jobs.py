# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Jobs for statistics views."""

import ast
from datetime import datetime

from core import jobs
from core.domain import exp_services
from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])
import feconf
import logging
import utils


class StatisticsPageJobManager(jobs.BaseMapReduceJobManager):
    """Job that calculates and creates stats models for exploration view.
       Includes: * number of visits to the exploration
                 * number of completions of the exploration
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StartExplorationEventLogEntryModel,
                stats_models.MaybeLeaveExplorationEventLogEntryModel]

    @staticmethod
    def map(item):
        map_value = {'event_type': item.event_type,
                     'session_id': item.session_id,
                     'created_on': int(utils.get_time_in_millisecs(item.created_on)),
                     'state_name': item.state_name}
        yield (item.exploration_id, map_value)

    @staticmethod
    def reduce(key, stringified_values):
        started_count = 0
        complete_count = 0
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if value['event_type'] == feconf.EVENT_TYPE_START:
                started_count += 1
            elif value['event_type'] == feconf.EVENT_TYPE_LEAVE:
                if value['state_name'] == feconf.END_DEST:
                    complete_count += 1
        stats_models.ExplorationAnnotationsModel(
            id=key,
            num_visits=started_count,
            num_completions=complete_count).put()


class TranslateStartAndCompleteEventsJobManager(jobs.BaseMapReduceJobManager):
    """Job that finds old versions of feedback events and translates them."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateCounterModel,
                stats_models.StartExplorationEventLogEntryModel,
                stats_models.MaybeLeaveExplorationEventLogEntryModel]

    TYPE_COUNTER = 'StateCounterModel'
    TYPE_START = 'StartExploration'
    TYPE_END = 'EndExploration'
    KEY_FORMAT = '%s:%s'

    @staticmethod
    def map(item):
        """Aggregates existing datastore items for a state in an exploration."""
        # A key representing the (exploration, state) pair.
        created_on_msec = int(utils.get_time_in_millisecs(item.created_on))

        if isinstance(item, stats_models.StateCounterModel):
            exp_id, state_name = item.get_exploration_id_and_state_name()
            exploration = exp_services.get_exploration_by_id(exp_id)
            if state_name in [feconf.END_DEST, exploration.init_state_name]:
                item_key = TranslateStartAndCompleteEventsJobManager.KEY_FORMAT % (
                    exp_id, state_name)
                yield (item_key, {
                    'type': (
                        TranslateStartAndCompleteEventsJobManager.TYPE_COUNTER),
                    'exp_id': exp_id,
                    'state_name': state_name,
                    'created_on': created_on_msec,
                    'count': item.first_entry_count
                })
        elif isinstance(item, stats_models.StartExplorationEventLogEntryModel):
            if item.state_name != feconf.END_DEST:
                item_key = TranslateStartAndCompleteEventsJobManager.KEY_FORMAT % (
                    item.exploration_id, item.state_name)
                yield (item_key, {
                    'type': (
                        TranslateStartAndCompleteEventsJobManager.TYPE_START),
                    'exp_id': item.exploration_id,
                    'created_on': created_on_msec,
                    'state_name': item.state_name
                })
        elif isinstance(
                item, stats_models.MaybeLeaveExplorationEventLogEntryModel):
            if item.state_name == feconf.END_DEST:
                item_key = TranslateStartAndCompleteEventsJobManager.KEY_FORMAT % (
                    item.exploration_id, item.state_name)
                yield (item_key, {
                    'type': TranslateStartAndCompleteEventsJobManager.TYPE_END,
                    'exp_id': item.exploration_id,
                    'created_on': created_on_msec,
                    'state_name': item.state_name
                })

    @staticmethod
    def reduce(key, stringified_values):
        _, state_name = key.split(':')
        if state_name == feconf.END_DEST:
            expected_new_event_type = (
                TranslateStartAndCompleteEventsJobManager.TYPE_END)
        else:
            expected_new_event_type = (
                TranslateStartAndCompleteEventsJobManager.TYPE_START)

        events_count = sum([
            1 if ast.literal_eval(v)['type'] == expected_new_event_type else 0
            for v in stringified_values])

        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if value['type'] != (
                    TranslateStartAndCompleteEventsJobManager.TYPE_COUNTER):
                continue

            # Create additional events in the new classes so that the counts
            # for the new events match those given by StateCounterModel.
            missing_events_count = value['count'] - events_count
            for _ in range(missing_events_count):
                version = exp_services.get_exploration_by_id(
                    value['exp_id']).version
                created_on = datetime.fromtimestamp(
                    value['created_on'] / 1000)
                if state_name != feconf.END_DEST:
                    start_event_entity = (
                        stats_models.StartExplorationEventLogEntryModel(
                            event_type=feconf.EVENT_TYPE_START,
                            exploration_id=value['exp_id'],
                            exploration_version=version,
                            state_name=value['state_name'],
                            session_id=None,
                            client_time_spent_in_secs=0.0,
                            params=None,
                            play_type=feconf.PLAY_TYPE_NORMAL,
                            version=0))
                    start_event_entity.created_on = created_on
                    start_event_entity.put()
                else:
                    leave_event_entity = (
                        stats_models.MaybeLeaveExplorationEventLogEntryModel(
                            event_type=feconf.EVENT_TYPE_LEAVE,
                            exploration_id=value['exp_id'],
                            exploration_version=version,
                            state_name=state_name,
                            session_id=None,
                            client_time_spent_in_secs=None,
                            params=None,
                            play_type=feconf.PLAY_TYPE_NORMAL,
                            version=0))
                    leave_event_entity.created_on = created_on
                    leave_event_entity.put()
