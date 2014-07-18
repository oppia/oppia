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
import logging
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
        started_session_ids = set()
        last_maybe_leave_by_session_id = {}
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if value['event_type'] == feconf.EVENT_TYPE_START:
                started_session_ids.add(value['session_id'])
            elif value['event_type'] == feconf.EVENT_TYPE_LEAVE:
                session_id = value['session_id']
                if (session_id not in last_maybe_leave_by_session_id or
                    value['created_on'] > 
                    last_maybe_leave_by_session_id[session_id]['created_on']):
                    last_maybe_leave_by_session_id[session_id] = value
        complete_events = [e for 
                           e in last_maybe_leave_by_session_id.values() 
                           if e['state_name'] == feconf.END_DEST]
        stats_models.ExplorationAnnotationsModel(
            id=key,
            num_visits=len(started_session_ids),
            num_completions=len(complete_events)).put()

class TranslateStartAndCompleteEventsJobManager(jobs.BaseMapReduceJobManager):
    """Job that finds old versions of feedback events and translates them."""
    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateCounterModel,
                stats_models.StartExplorationEventLogEntryModel,
                stats_models.MaybeLeaveExplorationEventLogEntryModel]

    @staticmethod
    def map(item):
        key_fmt = '%s:%s'
        if isinstance(item, stats_models.StateCounterModel):
            exp_id, state_name = item.key.id().split('.')
            exploration = exp_services.get_exploration_by_id(exp_id)
            start_state_name = exploration.init_state_name
            if (state_name != feconf.END_DEST and
                state_name != start_state_name):
                return
            map_value = {'type': 'StateCounterModel',
                         'exp_id': exp_id,
                         'state_name': state_name,
                         'created_on': int(utils.get_time_in_millisecs(item.created_on)),
                         'count': item.first_entry_count}
            yield (key_fmt % (exp_id, state_name), map_value)
        if isinstance(item, stats_models.StartExplorationEventLogEntryModel):
            map_value = {'type': 'StartExploration',
                         'exp_id': item.exploration_id,
                         'created_on': int(utils.get_time_in_millisecs(item.created_on)),
                         'state_name': item.state_name}
            yield (key_fmt % (item.exploration_id, item.state_name), map_value)
        if isinstance(item, stats_models.MaybeLeaveExplorationEventLogEntryModel):
            if item.state_name != feconf.END_DEST:
                return
            map_value = {'type': 'EndExploration',
                         'exp_id': item.exploration_id,
                         'created_on': int(utils.get_time_in_millisecs(item.created_on)),
                         'state_name': item.state_name}
            yield (key_fmt % (item.exploration_id, item.state_name), map_value)

    @staticmethod
    def reduce(key, stringified_values):
        events_count = 0
        _, state_name = key.split(':')
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if ((value['type'] == 'StartExploration' 
                     and state_name != feconf.END_DEST)
                 or (value['type'] == 'EndExploration'
                     and state_name == feconf.END_DEST)): 
               events_count += 1
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if value['type'] == 'StateCounterModel':
                missing_events = value['count'] - events_count
                for i in range(missing_events):
                    version = exp_services.get_exploration_by_id(value['exp_id']).version
                    created_on = datetime.fromtimestamp(value['created_on']/1000)
                    if state_name != feconf.END_DEST:
                        start = stats_models.StartExplorationEventLogEntryModel(
                            event_type=feconf.EVENT_TYPE_START,
                            exploration_id=value['exp_id'],
                            exploration_version=version,
                            state_name=value['state_name'],
                            session_id=None,
                            client_time_spent_in_secs=0.0,
                            params=None,
                            play_type=feconf.PLAY_TYPE_NORMAL,
                            version=0)
                        start.created_on = created_on
                        start.put()
                    if state_name == feconf.END_DEST:
                        leave_event_entity = stats_models.MaybeLeaveExplorationEventLogEntryModel(
                            event_type=feconf.EVENT_TYPE_LEAVE,
                            exploration_id=value['exp_id'],
                            exploration_version=version,
                            state_name=state_name,
                            session_id=None,
                            client_time_spent_in_secs=None,
                            params=None,
                            play_type=feconf.PLAY_TYPE_NORMAL,
                            version=0)
                        leave_event_entity.created_on = created_on
                        leave_event_entity.put()
