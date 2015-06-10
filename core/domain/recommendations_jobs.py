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

"""Jobs for recommendations."""

__author__ = 'Xinyu Wu'

import ast

from core import jobs
from core.platform import models
(exp_models, recommendations_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.recommendations])


class ExplorationRecommendationsRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    pass


class ExplorationRecommendationsAggregator(
        jobs.BaseContinuousComputationManager):
    """A continuous-computation job that computes recommendations for each
    exploration.

    This job does not have a realtime component. There will be a delay in
    propagating new updates to explorations; the length of the delay will be
    approximately the time it takes a batch job to run."""
    @classmethod
    def get_event_types_listened_to(cls):
        return []

    @classmethod
    def _get_realtime_datastore_class(cls):
        return ExplorationRecommendationsRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return ExplorationRecommendationsMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        pass


class ExplorationRecommendationsMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Manager for a MapReduce job that computes a list of recommended
    explorations to play after completing some exploration."""

    @classmethod
    def _get_continuous_computation_class(cls):
        return ExplorationRecommendationsAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExpSummaryModel]

    @staticmethod
    def map(item):
        from core.domain import recommendations_services
        from core.domain import exp_services

        SIMILARITY_SCORE_THRESHOLD = 4.0

        exp_summary_id = item.id
        exp_summaries_dict = exp_services.get_all_exploration_summaries()
        for compared_exp_id in exp_summaries_dict.keys():
            if compared_exp_id != exp_summary_id:
                similarity_score = (
                    recommendations_services.get_item_similarity(
                        exp_summary_id, compared_exp_id))
                if similarity_score >= SIMILARITY_SCORE_THRESHOLD:
                    yield (exp_summary_id, (similarity_score, compared_exp_id))

    @staticmethod
    def reduce(key, stringified_values):
        from core.domain import recommendations_services

        values = sorted(
            [ast.literal_eval(v) for v in stringified_values], reverse=True)
        del values[10:]

        recommended_exploration_ids = []
        for similarity_score, exp_id in values:
            recommended_exploration_ids.append(exp_id)

        recommendations_services.set_recommendations(
            key, recommended_exploration_ids)
