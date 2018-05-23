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

"""One-off jobs for recommendations."""

import ast

from core import jobs
from core.domain import exp_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.platform import models

(exp_models, recommendations_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.recommendations])

MAX_RECOMMENDATIONS = 10
# Note: There is a threshold so that bad recommendations will be
# discarded even if an exploration has few similar explorations.
SIMILARITY_SCORE_THRESHOLD = 3.0


class ExplorationRecommendationsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job that computes a list of recommended explorations to play
    after completing an exploration.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExpSummaryModel]

    @staticmethod
    def map(item):
        # Only process the exploration if it is not private.
        if item.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
            return

        exp_summary_id = item.id
        exp_summaries_dict = (
            exp_services.get_non_private_exploration_summaries())

        # Note: This is needed because the exp_summaries_dict is sometimes
        # different from the summaries in the datastore, especially when
        # new explorations are added.
        if exp_summary_id not in exp_summaries_dict:
            return

        reference_exp_summary = exp_summaries_dict[exp_summary_id]
        exp_summaries_items = exp_summaries_dict.iteritems()
        for compared_exp_id, compared_exp_summary in exp_summaries_items:
            if compared_exp_id != exp_summary_id:
                similarity_score = (
                    recommendations_services.get_item_similarity(
                        reference_exp_summary.category,
                        reference_exp_summary.language_code,
                        reference_exp_summary.owner_ids,
                        compared_exp_summary.category,
                        compared_exp_summary.language_code,
                        compared_exp_summary.exploration_model_last_updated,
                        compared_exp_summary.owner_ids,
                        compared_exp_summary.status))
                if similarity_score >= SIMILARITY_SCORE_THRESHOLD:
                    yield (
                        exp_summary_id, {
                            'similarity_score': similarity_score,
                            'exp_id': compared_exp_id
                        })

    @staticmethod
    def reduce(key, stringified_values):
        other_exploration_similarities = sorted(
            [ast.literal_eval(v) for v in stringified_values],
            reverse=True,
            key=lambda x: x['similarity_score'])

        recommended_exploration_ids = [
            item['exp_id']
            for item in other_exploration_similarities[:MAX_RECOMMENDATIONS]]

        recommendations_services.set_recommendations(
            key, recommended_exploration_ids)
