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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core import jobs
from core.domain import exp_services
from core.domain import recommendations_services
from core.domain import rights_domain
from core.platform import models
import python_utils

(exp_models, recommendations_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.recommendations])
datastore_services = models.Registry.import_datastore_services()

MAX_RECOMMENDATIONS = 10
# Note: There is a threshold so that bad recommendations will be
# discarded even if an exploration has few similar explorations.
SIMILARITY_SCORE_THRESHOLD = 3.0


class ExplorationRecommendationsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job that computes a list of recommended explorations to play
    after completing an exploration.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(ExplorationRecommendationsOneOffJob, cls).enqueue(
            job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExpSummaryModel]

    @staticmethod
    def map(item):
        # Only process the exploration if it is not private.
        if item.status == rights_domain.ACTIVITY_STATUS_PRIVATE:
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
        for compared_exp_id, compared_exp_summary in exp_summaries_dict.items():
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

        recommendations_services.set_exploration_recommendations(
            key, recommended_exploration_ids)


class DeleteAllExplorationRecommendationsOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """A one-off job that deletes all instances of
    ExplorationRecommendationsModel.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(DeleteAllExplorationRecommendationsOneOffJob, cls).enqueue(
            job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [recommendations_models.ExplorationRecommendationsModel]

    @staticmethod
    def map(model):
        model.delete()
        yield ('DELETED', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))


class CleanUpExplorationRecommendationsOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Cleans up ExplorationRecommendationsModel.

    This is done by:
        1. Removing exploration ids from recommendation list of model if
        exploration model is deleted.
        2. Deleting the recommendations model if the exploration for which it
        was created is deleted.

    NOTE TO DEVELOPERS: Do not delete this job until issue #10809 is fixed.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [recommendations_models.ExplorationRecommendationsModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exp_model = exp_models.ExplorationModel.get_by_id(item.id)
        if exp_model is None or exp_model.deleted:
            yield ('Removed recommendation model', item.id)
            item.delete()
            return

        fetched_exploration_model_instances = (
            datastore_services.fetch_multiple_entities_by_ids_and_models(
                [('ExplorationModel', item.recommended_exploration_ids)]))[0]

        exp_ids_removed = []
        for exp_id, exp_instance in list(python_utils.ZIP(
                item.recommended_exploration_ids,
                fetched_exploration_model_instances)):
            if exp_instance is None or exp_instance.deleted:
                exp_ids_removed.append(exp_id)
                item.recommended_exploration_ids.remove(exp_id)
        if exp_ids_removed:
            item.update_timestamps()
            item.put()
            yield ('Removed deleted exp ids from recommendations', item.id)

    @staticmethod
    def reduce(key, values):
        yield (key, values)
