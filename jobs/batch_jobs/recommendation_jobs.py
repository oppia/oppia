# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Batch jobs for indexing activities."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import typing

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import rights_domain
from core.domain import recommendations_services
from core.platform import models
from jobs import base_jobs
from jobs.io import ndb_io
from jobs.types import job_run_result

import apache_beam as beam

(exp_models, recommendations_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.recommendations])


class ExplorationRecommendationsJob(base_jobs.JobBase):
    """Updates the recommended follow-up explorations for each exploration."""

    def run(self):
        exp_recommendation_models = (
            self.pipeline
            | beam.Create([])
            | GetUniqueExplorationSummaries()
            | GetAllExplorationSummaryPairs()
            | ComputeSimilarityBetweenExplorationSummaries()
            | ComputeTopRecommendations()
            | CreateExplorationRecommendationsModels()
        )

        _ = exp_recommendation_models | ndb_io.PutModels(self.datastoreio_stub)

        return (
            exp_recommendation_models
            | beam.combiners.Count.Globally()
            | beam.Map(lambda n: '%d recommendations computed' % n)
            | beam.Map(job_run_result.JobRunResult.as_stdout)
        )


@beam.typehints.with_output_types(exp_domain.ExplorationSummary)
class GetUniqueExplorationSummaries(beam.PTransform):
    """Returns the unique ExplorationSummaries from the given NDB models."""

    def expand(self, exp_summary_models):
        return (
            exp_summary_models
            | beam.Map(exp_fetchers.get_exploration_summary_from_model)
            | beam.GroupBy(lambda exp_summary: exp_summary.id)
            | beam.Values()
            | beam.Filter(lambda exp_summary_list: len(exp_summary_list) > 0)
            | beam.Map(lambda exp_summary_list: exp_summary_list[0])
        )


@beam.typehints.with_input_types(exp_domain.ExplorationSummary)
@beam.typehints.with_output_types(
    typing.Tuple[exp_domain.ExplorationSummary, exp_domain.ExplorationSummary])
class GetAllExplorationSummaryPairs(beam.PTransform):
    """Returns all pairings of ExplorationSummaries from the input set."""

    def expand(self, exp_summary_pcoll):
        exp_summary_iter = beam.pvalue.AsIter(exp_summary_pcoll)
        return (
            exp_summary_pcoll
            | beam.FlatMap(self.get_pairings, exp_summary_iter)
        )

    def get_pairings(self, exp_summary, other_exp_summaries):
        """Returns the given ExplorationSummary paired with all other instances.

        Args:
            exp_summary: ExplorationSummary. The instance to pair with others.
            other_exp_summaries: iterable(ExplorationSummary). The other
                instances to pair with. This iterable will include the primary
                instance being paired.

        Yields:
            tuple(ExplorationSummary, ExplorationSummary). The pairs of
            ExplorationSummary instances.
        """
        for other_exp_summary in other_exp_summaries:
            if exp_summary.id != other_exp_summary.id:
                yield (exp_summary, other_exp_summary)


@beam.typehints.with_input_types(
    typing.Tuple[exp_domain.ExplorationSummary, exp_domain.ExplorationSummary])
@beam.typehints.with_output_types(typing.Tuple[str, typing.Dict])
class ComputeSimilarityBetweenExplorationSummaries(beam.PTransform):
    """Computes the similarities of each pair of ExplorationSummaries."""

    SIMILARITY_SCORE_THRESHOLD = 3.0

    def expand(self, exp_summaries_to_compare):
        return (
            exp_summaries_to_compare
            | beam.FlatMapTuple(self.compute_similarities)
        )

    def compute_similarities(self, reference_exp_summary, compared_exp_summary):
        """Computes the similarity between the two input ExplorationSummaries.

        Args:
            reference_exp_summary: ExplorationSummary. The exploration used as a
                reference.
            compared_exp_summary: ExplorationSummary. The exploration being
                compared to.

        Yields:
            tuple(str, dict). The referenced exploration's ID paired with a
            summary of the similarity it shares with the other exploration. If
            the two explorations aren't similar enough (score falls below the
            threshold), then nothing is yielded.
        """
        similarity_score = recommendations_services.get_item_similarity(
            reference_exp_summary.category,
            reference_exp_summary.language_code,
            reference_exp_summary.owner_ids,
            compared_exp_summary.category,
            compared_exp_summary.language_code,
            compared_exp_summary.exploration_model_last_updated,
            compared_exp_summary.owner_ids,
            compared_exp_summary.status)

        if similarity_score >= self.SIMILARITY_SCORE_THRESHOLD:
            yield (
                reference_exp_summary.id,
                {
                    'similarity_score': similarity_score,
                    'exp_id': compared_exp_summary.id,
                })


@beam.typehints.with_input_types(typing.Tuple[str, typing.Dict])
@beam.typehints.with_output_types(typing.Tuple[str, typing.List[str]])
class ComputeTopRecommendations(beam.PTransform):
    """Returns the top N explorations scored by their similarities."""

    MAX_RECOMMENDATIONS = 10

    def expand(self, exp_similarities):
        return (
            exp_similarities
            | beam.GroupByKey()
            | beam.MapTuple(self.get_top_exp_similarities)
        )

    def get_top_exp_similarities(self, exp_id, similarity_dicts):
        """Returns the exploration IDs most similar to the given exploration.

        Args:
            exp_id: str. The exploration.
            similarity_dicts: list(dict). Dict representations of how similar
                the exploration is to others.

        Returns:
            tuple(str, list(str)). The exploration ID and the IDs of the most
            similar explorations found in the similarity_dicts.
        """
        sorted_exp_similarities = sorted(
            similarity_dicts,
            key=lambda similarity_dict: similarity_dict['similarity_score'],
            reverse=True)
        recommended_exp_ids = [
            s['exp_id']
            for s in sorted_exp_similarities[:self.MAX_RECOMMENDATIONS]
        ]
        return (exp_id, recommended_exp_ids)


@beam.typehints.with_input_types(typing.Tuple[str, typing.List[str]])
@beam.typehints.with_output_types(
    recommendations_models.ExplorationRecommendationsModel)
class CreateExplorationRecommendationsModels(beam.PTransform):
    """Returns ExplorationRecommendationsModels from the computation results."""

    def expand(self, top_exp_similarities):
        return (
            top_exp_similarities
            | beam.MapTuple(self.create_exploration_recommendations_model)
        )

    def create_exploration_recommendations_model(
            self, exp_id, recommended_exp_ids):
        """Returns an ExplorationRecommendationsModel for the given input.

        Args:
            exp_id: str. The ID of the exploration.
            recommended_exp_ids: list(str). The recommended explorations to
                follow the input.

        Returns:
            ExplorationRecommendationsModel. A recommendation model.
        """
        return recommendations_models.ExplorationRecommendationsModel(
            id=exp_id, recommended_exp_ids=recommended_exp_ids)
