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

"""Jobs for open feedback threads."""

from core import jobs
from core.platform import models
(base_models, feedback_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.feedback, models.NAMES.exploration
])
transaction_services = models.Registry.import_transaction_services()
import feconf
import utils

from google.appengine.ext import ndb


class OpenFeedbacksRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    pass


class OpenFeedbacksStatisticsAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that computes the number of open feedbacks
    for explorations.

    This job does not have a realtime component. There will be a delay in
    propagating new updates to the dashboard; the length of the delay will be
    approximately the time it takes a batch job to run.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        return []

    @classmethod
    def _get_realtime_datastore_class(cls):
        return OpenFeedbacksRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return OpenFeedbacksMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        pass

    # Public query methods.
    @classmethod
    def get_num_of_open_feedbacks(cls, exploration_id):
        """
        Args:
          - exploration_id: id of the exploration to get statistics for

        Returns the number of open feedbacks.
        """

        feedback_thread_analytics_model = feedback_models.OpenFeedbacksModel.get(
            exploration_id, strict=False)
        return feedback_thread_analytics_model.num_of_open_feedbacks \
            if exp_model else None


class OpenFeedbacksMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job that creates OpenFeedbackModels for explorations by calculating the
       number of open feedback threads per exploration.
       Includes:
       * number of open feedbacks for an exploration.
    """

    @classmethod
    def _get_continuous_computation_class(cls):
        return OpenFeedbacksStatisticsAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.FeedbackThreadModel]

    @staticmethod
    def map(item):
        if (item.status == feedback_models.STATUS_CHOICES_OPEN):
            yield ('%s:%s' % (item.exploration_id, 1))

    @staticmethod
    def reduce(key, stringified_values):
        feedback_models.OpenFeedbacksModel.create(
                key, len(stringified_values))
