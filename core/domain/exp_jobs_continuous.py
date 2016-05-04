# coding: utf-8
#
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

"""Continuous computations for explorations."""

from core import jobs
from core.domain import exp_services
from core.platform import models
(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration])


class SearchRankerRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    pass


class SearchRanker(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that refreshes the search ranking.

    This job does not have a realtime component. There will be a delay in
    propagating new updates to the search result pages; the length of the delay
    will be approximately the time it takes a batch job to run.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        return []

    @classmethod
    def _get_realtime_datastore_class(cls):
        return SearchRankerRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return SearchRankerMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        pass


class SearchRankerMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Manager for a MapReduce job that iterates through all explorations and
    recomputes their search rankings.
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        return SearchRanker

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        exp_services.index_explorations_given_ids([item.id])

    @staticmethod
    def reduce(key, stringified_values):
        pass
