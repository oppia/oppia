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
import datetime

from core import jobs
from core.domain import exp_services
from core.platform import models
(base_models, stats_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.statistics])
transaction_services = models.Registry.import_transaction_services()
import feconf
import utils

from google.appengine.ext import ndb



class StatisticsRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    num_starts = ndb.IntegerProperty(default=0)
    num_completions = ndb.IntegerProperty(default=0)


class StatisticsAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that counts 'start exploration' and
    'complete exploration' events.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        return [
            feconf.EVENT_TYPE_START_EXPLORATION,
            feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION]

    @classmethod
    def _get_realtime_datastore_class(cls):
        return StatisticsRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return StatisticsMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        exp_id = args[0]

        def _increment_visit_counter():
            realtime_class = cls._get_realtime_datastore_class()
            realtime_model_id = realtime_class.get_realtime_id(
                active_realtime_layer, exp_id)

            model = realtime_class.get(realtime_model_id, strict=False)
            if model is None:
                realtime_class(
                    id=realtime_model_id, num_starts=1,
                    realtime_layer=active_realtime_layer).put()
            else:
                model.num_starts += 1
                model.put()

        def _increment_completion_counter():
            realtime_class = cls._get_realtime_datastore_class()
            realtime_model_id = realtime_class.get_realtime_id(
                active_realtime_layer, exp_id)

            model = realtime_class.get(realtime_model_id, strict=False)
            if model is None:
                realtime_class(
                    id=realtime_model_id, num_completions=1,
                    realtime_layer=active_realtime_layer).put()
            else:
                model.num_completions += 1
                model.put()

        if event_type == feconf.EVENT_TYPE_START_EXPLORATION:
            transaction_services.run_in_transaction(
                _increment_visit_counter)
        else:
            transaction_services.run_in_transaction(
                _increment_completion_counter)

    # Public query method.
    @classmethod
    def get_statistics(cls, exploration_id):
        """Returns a dict with two keys: 'start_exploration_count' and
        'complete_exploration_count'. The corresponding values are the
        number of times the given exploration was started and completed,
        respectively.
        """
        mr_model = stats_models.ExplorationAnnotationsModel.get(
            exploration_id, strict=False)
        realtime_model = cls._get_realtime_datastore_class().get(
            cls.get_active_realtime_layer_id(exploration_id), strict=False)

        num_starts = 0
        if mr_model is not None:
            num_starts += mr_model.num_starts
        if realtime_model is not None:
            num_starts += realtime_model.num_starts

        num_completions = 0
        if mr_model is not None:
            num_completions += mr_model.num_completions
        if realtime_model is not None:
            num_completions += realtime_model.num_completions

        return {
            'start_exploration_count': num_starts,
            'complete_exploration_count': num_completions,
        }


class StatisticsMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job that calculates and creates stats models for exploration view.
       Includes: * number of visits to the exploration
                 * number of completions of the exploration
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        return StatisticsAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StartExplorationEventLogEntryModel,
                stats_models.MaybeLeaveExplorationEventLogEntryModel]

    @staticmethod
    def map(item):
        if StatisticsMRJobManager._entity_created_before_job_queued(item):
            yield (item.exploration_id, {
                'event_type': item.event_type,
                'session_id': item.session_id,
                'state_name': item.state_name})

    @staticmethod
    def reduce(key, stringified_values):
        started_count = 0
        complete_count = 0
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if value['event_type'] == feconf.EVENT_TYPE_START_EXPLORATION:
                started_count += 1
            elif (value['event_type'] ==
                  feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION):
                if value['state_name'] == feconf.END_DEST:
                    complete_count += 1
        stats_models.ExplorationAnnotationsModel(
            id=key,
            num_starts=started_count,
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
            exploration = exp_services.get_exploration_by_id(exp_id, strict=False)
            if exploration is None:
                # Note that some explorations may have been deleted since their
                # corresponding StateCounterModel entry was created.
                return
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
                created_on = datetime.datetime.fromtimestamp(
                    value['created_on'] / 1000)
                if state_name != feconf.END_DEST:
                    start_event_entity = (
                        stats_models.StartExplorationEventLogEntryModel(
                            event_type=feconf.EVENT_TYPE_START_EXPLORATION,
                            exploration_id=value['exp_id'],
                            exploration_version=version,
                            state_name=value['state_name'],
                            session_id=None,
                            client_time_spent_in_secs=0.0,
                            params=None,
                            play_type=feconf.PLAY_TYPE_NORMAL,
                            event_schema_version=0))
                    start_event_entity.created_on = created_on
                    start_event_entity.put()
                else:
                    leave_event_entity = (
                        stats_models.MaybeLeaveExplorationEventLogEntryModel(
                            event_type=(
                                feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION),
                            exploration_id=value['exp_id'],
                            exploration_version=version,
                            state_name=state_name,
                            session_id=None,
                            client_time_spent_in_secs=None,
                            params=None,
                            play_type=feconf.PLAY_TYPE_NORMAL,
                            event_schema_version=0))
                    leave_event_entity.created_on = created_on
                    leave_event_entity.put()
