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

from core import jobs
from core.platform import models
(base_models, stats_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.statistics])
transaction_services = models.Registry.import_transaction_services()
import feconf

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
        from core.domain import stats_services
        # TODO(sll): Get this from
        # stats_services.get_exploration_start_count(key) if the exp_id
        # exists. (An exception will be thrown if it doesn't.)
        old_models_start_count = 0

        # TODO(sll): Get this from
        # stats_services.get_exploration_completed_count(key) if the exp_id
        # exists. (An exception will be thrown if it doesn't.)
        old_models_complete_count = 0

        new_models_start_count = 0
        new_models_complete_count = 0
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if value['event_type'] == feconf.EVENT_TYPE_START_EXPLORATION:
                new_models_start_count += 1
            elif (value['event_type'] ==
                  feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION):
                if value['state_name'] == feconf.END_DEST:
                    new_models_complete_count += 1

        num_starts = (
            old_models_start_count + new_models_start_count)
        num_completes = (
            old_models_complete_count + new_models_complete_count)

        stats_models.ExplorationAnnotationsModel(
            id=key,
            num_starts=num_starts,
            num_completions=num_completes).put()
