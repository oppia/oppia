# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

from core import jobs
from core.domain import feedback_domain
from core.platform import models
import feconf

from google.appengine.ext import ndb

(base_models, feedback_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.feedback, models.NAMES.exploration
])
transaction_services = models.Registry.import_transaction_services()


class FeedbackAnalyticsRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    num_open_threads = ndb.IntegerProperty(default=0)
    num_total_threads = ndb.IntegerProperty(default=0)


class FeedbackAnalyticsAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that computes analytics for feedback
    threads of explorations."""

    @classmethod
    def get_event_types_listened_to(cls):
        return [feconf.EVENT_TYPE_NEW_THREAD_CREATED,
                feconf.EVENT_TYPE_THREAD_STATUS_CHANGED]

    @classmethod
    def _get_realtime_datastore_class(cls):
        return FeedbackAnalyticsRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return FeedbackAnalyticsMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        exp_id = args[0]

        def _increment_open_threads_count():
            realtime_class = cls._get_realtime_datastore_class()
            realtime_model_id = realtime_class.get_realtime_id(
                active_realtime_layer, exp_id)

            model = realtime_class.get(realtime_model_id, strict=False)
            if model is None:
                realtime_class(
                    id=realtime_model_id, num_open_threads=1,
                    realtime_layer=active_realtime_layer).put()
            else:
                model.num_open_threads += 1
                model.put()

        def _increment_total_threads_count():
            realtime_class = cls._get_realtime_datastore_class()
            realtime_model_id = realtime_class.get_realtime_id(
                active_realtime_layer, exp_id)

            model = realtime_class.get(realtime_model_id, strict=False)
            if model is None:
                realtime_class(
                    id=realtime_model_id, num_total_threads=1,
                    realtime_layer=active_realtime_layer).put()
            else:
                model.num_total_threads += 1
                model.put()

        def _decrement_open_threads_count():
            realtime_class = cls._get_realtime_datastore_class()
            realtime_model_id = realtime_class.get_realtime_id(
                active_realtime_layer, exp_id)

            model = realtime_class.get(realtime_model_id, strict=False)
            if model is None:
                realtime_class(
                    id=realtime_model_id, num_open_threads=-1,
                    realtime_layer=active_realtime_layer).put()
            else:
                model.num_open_threads -= 1
                model.put()

        if event_type == feconf.EVENT_TYPE_NEW_THREAD_CREATED:
            transaction_services.run_in_transaction(
                _increment_total_threads_count)
            transaction_services.run_in_transaction(
                _increment_open_threads_count)
        elif event_type == feconf.EVENT_TYPE_THREAD_STATUS_CHANGED:
            old_status = args[1]
            updated_status = args[2]
            # Status changed from closed to open.
            if (old_status != feedback_models.STATUS_CHOICES_OPEN
                    and updated_status == feedback_models.STATUS_CHOICES_OPEN):
                transaction_services.run_in_transaction(
                    _increment_open_threads_count)
            # Status changed from open to closed.
            elif (old_status == feedback_models.STATUS_CHOICES_OPEN
                  and updated_status != feedback_models.STATUS_CHOICES_OPEN):
                transaction_services.run_in_transaction(
                    _decrement_open_threads_count)

    # Public query methods.
    @classmethod
    def get_thread_analytics_multi(cls, exploration_ids):
        """
        Args:
          - exploration_ids: ids of the explorations to get statistics for.

        Returns a list of dicts, each with two keys: 'num_open_threads' and
        'num_total_threads', representing the counts of open and all feedback
        threads, respectively.
        """
        realtime_model_ids = cls.get_multi_active_realtime_layer_ids(
            exploration_ids)
        realtime_models = cls._get_realtime_datastore_class().get_multi(
            realtime_model_ids)
        feedback_thread_analytics_models = (
            feedback_models.FeedbackAnalyticsModel.get_multi(
                exploration_ids))

        return [feedback_domain.FeedbackAnalytics(
            exploration_ids[i],
            (realtime_models[i].num_open_threads
             if realtime_models[i] is not None else 0) +
            (feedback_thread_analytics_models[i].num_open_threads
             if feedback_thread_analytics_models[i] is not None else 0),
            (realtime_models[i].num_total_threads
             if realtime_models[i] is not None else 0) +
            (feedback_thread_analytics_models[i].num_total_threads
             if feedback_thread_analytics_models[i] is not None else 0)
        ) for i in range(len(exploration_ids))]

    @classmethod
    def get_thread_analytics(cls, exploration_id):
        """
        Args:
         - exploration_id: id of exploration to get statistics for

        Calls get_thread_analytics_multi internally and returns a dict with two
        keys - 'num_open_threads' and 'num_total_threads'.

        """
        return FeedbackAnalyticsAggregator.get_thread_analytics_multi(
            [exploration_id])[0]


class FeedbackAnalyticsMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job that creates FeedbackAnalyticsModels for explorations by calculating
    various analytics for feedback threads corresponding to an exploration.

    Currently, this job calculates the number of open feedback threads, as well
    as the total feedback thread count for each exploration.
    """

    @classmethod
    def _get_continuous_computation_class(cls):
        return FeedbackAnalyticsAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.FeedbackThreadModel]

    @staticmethod
    def map(item):
        yield (item.exploration_id, item.status)

    @staticmethod
    def reduce(key, stringified_values):
        num_open_threads = stringified_values.count(
            feedback_models.STATUS_CHOICES_OPEN)
        num_total_threads = len(stringified_values)

        feedback_models.FeedbackAnalyticsModel.create(
            key, num_open_threads, num_total_threads)
