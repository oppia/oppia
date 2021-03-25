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

"""Continuous computation jobs for feedback system."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core.domain import feedback_domain
from core.platform import models
import feconf
import python_utils

(base_models, feedback_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.feedback, models.NAMES.exploration
])

datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()


class FeedbackAnalyticsRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    """A continuous-computation job that sets the number of open threads
    and the total number of threads to the default integer value of zero
    in the realtime layer.
    """

    num_open_threads = datastore_services.IntegerProperty(default=0)
    num_total_threads = datastore_services.IntegerProperty(default=0)


class FeedbackAnalyticsAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that computes analytics for feedback
    threads of explorations.
    """

    @classmethod
    def get_event_types_listened_to(cls):
        """Get the event types that this class is subscribed to.

        Returns:
            list(str). List of event types that this class is subscribed to.
        """
        return [feconf.EVENT_TYPE_NEW_THREAD_CREATED,
                feconf.EVENT_TYPE_THREAD_STATUS_CHANGED]

    @classmethod
    def _get_realtime_datastore_class(cls):
        """Get the realtime datastore class used by the realtime layer.

        Returns:
            datastore_services.MetaModel. Datastore class used by the realtime
            layer, which should be a subclass of
            BaseRealtimeDatastoreClassForContinuousComputations.
        """
        return FeedbackAnalyticsRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        """Get manager class for the continuously-running batch job.

        Returns:
            type. Manager class for continuous-running batch job.
        """
        return FeedbackAnalyticsMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        """Records thread analytics in the given realtime layer.

        Args:
            active_realtime_layer: int. The currently active realtime
                datastore layer.
            event_type: str. The event triggered by the student.
            *args: list(*). Variable length argument list. The
                first element of *args corresponds to the id
                of the exploration currently being played.
        """
        exp_id = args[0]

        @transaction_services.run_in_transaction_wrapper
        def _increment_open_threads_count_transactional():
            """Increments count of open threads by one."""
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
                model.update_timestamps()
                model.put()

        @transaction_services.run_in_transaction_wrapper
        def _increment_total_threads_count_transactional():
            """Increments count of total threads by one."""
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
                model.update_timestamps()
                model.put()

        @transaction_services.run_in_transaction_wrapper
        def _decrement_open_threads_count_transactional():
            """Decrements count of open threads by one."""
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
                model.update_timestamps()
                model.put()

        if event_type == feconf.EVENT_TYPE_NEW_THREAD_CREATED:
            _increment_total_threads_count_transactional()
            _increment_open_threads_count_transactional()
        elif event_type == feconf.EVENT_TYPE_THREAD_STATUS_CHANGED:
            old_status = args[1]
            updated_status = args[2]
            # Status changed from closed to open.
            if (old_status != feedback_models.STATUS_CHOICES_OPEN
                    and updated_status == feedback_models.STATUS_CHOICES_OPEN):
                _increment_open_threads_count_transactional()
            # Status changed from open to closed.
            elif (old_status == feedback_models.STATUS_CHOICES_OPEN
                  and updated_status != feedback_models.STATUS_CHOICES_OPEN):
                _decrement_open_threads_count_transactional()

    # Public query methods.
    @classmethod
    def get_thread_analytics_multi(cls, exploration_ids):
        """Gets the thread analytics for the explorations specified by the
        exploration_ids.

        Args:
            exploration_ids: list(str). IDs of the explorations to get analytics
                for.

        Returns:
            list(dict). Each dict in this list corresponds to an
            exploration ID in the input list, and has two keys:
            - num_open_threads: int. The count of open feedback threads
              for this exploration.
            - num_total_threads: int. The count of all feedback threads
              for this exploration.
        """
        realtime_model_ids = cls.get_multi_active_realtime_layer_ids(
            exploration_ids)
        realtime_models = cls._get_realtime_datastore_class().get_multi(
            realtime_model_ids)

        feedback_thread_analytics_models = (
            feedback_models.FeedbackAnalyticsModel.get_multi(exploration_ids))
        return [feedback_domain.FeedbackAnalytics(
            feconf.ENTITY_TYPE_EXPLORATION, exploration_ids[i],
            (
                realtime_models[i].num_open_threads
                if realtime_models[i] is not None else 0) +
            (
                feedback_thread_analytics_models[i].num_open_threads
                if feedback_thread_analytics_models[i] is not None else 0),
            (
                realtime_models[i].num_total_threads
                if realtime_models[i] is not None else 0) +
            (
                feedback_thread_analytics_models[i].num_total_threads
                if feedback_thread_analytics_models[i] is not None else 0)
        ) for i in python_utils.RANGE(len(exploration_ids))]

    @classmethod
    def get_thread_analytics(cls, exploration_id):
        """Retrieves the analytics for feedback threads.

        Args:
            exploration_id: str. ID of the exploration to get analytics for.

        Returns:
            dict. Contains two keys:
                - num_open_threads: int. The count of open feedback threads for
                    this exploration.
                - num_total_threads: int. The count of all feedback
                    threads for this exploration.
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
        """Get class for continuous computaion that computes analytics
        for feedback threads of explorations.

        Returns:
            type. Class for continuous computaion of analytics.
        """
        return FeedbackAnalyticsAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        """Get the list of classes that this class maps over

        Returns:
            list(GeneralFeedbackThreadModel). List of classes of feedback
            thread models.
        """
        return [feedback_models.GeneralFeedbackThreadModel]

    @staticmethod
    def map(item):
        """Map function.

        Args:
            item: GeneralFeedbackThreadModel. A general feedback thread model
                instance.

        Yields:
            2-tuple of (entity_id, status). Where:
                - entity_id: str. The exploration id associated to the feedback
                    thread.
                - status: str. The feedback thread's status.
        """
        yield (item.entity_id, item.status)

    @staticmethod
    def reduce(key, stringified_values):
        """Reduce function.

        Args:
            key: str. The exploration ID.
            stringified_values: list(str). List of all statuses from all
                mappers tagged with the given key.
      """
        num_open_threads = stringified_values.count(
            feedback_models.STATUS_CHOICES_OPEN)
        num_total_threads = len(stringified_values)

        feedback_models.FeedbackAnalyticsModel.create(
            key, num_open_threads, num_total_threads)
