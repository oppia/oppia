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

"""Jobs that are ran by CRON scheduler."""

from __future__ import absolute_import
from __future__ import annotations
from __future__ import unicode_literals

from core.domain import recommendations_services
from core.domain import search_services
from core.platform import models
from jobs import base_jobs
from jobs.io import ndb_io
from jobs.types import job_run_result

import apache_beam as beam

from typing import Dict, List, Union, cast # isort:skip

MYPY = False
if MYPY:
    from mypy_imports import datastore_services
    from mypy_imports import exp_models


(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
platform_search_services = models.Registry.import_search_services()

MAX_RECOMMENDATIONS = 10
# Note: There is a threshold so that bad recommendations will be
# discarded even if an exploration has few similar explorations.
SIMILARITY_SCORE_THRESHOLD = 3.0



class IndexExplorationsInSearch(base_jobs.JobBase):
    """Job that indexes the explorations in Elastic Search."""

    MAX_BATCH_SIZE = 1000

    @staticmethod
    def _index_exploration_summaries(
            exp_summary_models: List[datastore_services.Model]
    ) -> List[job_run_result.JobRunResult]:
        """Index exploration summaries and catch any errors.

        Args:
            exp_summary_models: list(Model). Models to index.

        Returns:
            list(str). List containing one element, which is either SUCCESS,
            or FAILURE.
        """
        try:
            search_services.index_exploration_summaries( # type: ignore[no-untyped-call]
                cast(List[exp_models.ExpSummaryModel], exp_summary_models))
            return [job_run_result.JobRunResult(
                stdout='SUCCESS %s models indexed' % len(exp_summary_models)
            )]
        except platform_search_services.SearchException: # type: ignore[attr-defined]
            return [job_run_result.JobRunResult(
                stderr='FAILURE %s models not indexed' % len(exp_summary_models)
            )]

    def run(self) -> beam.PCollection:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        the Elastic Search.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            the Elastic Search.
        """
        return (
            self.pipeline
            | 'Get all non-deleted models' >> (
                ndb_io.GetModels(exp_models.ExpSummaryModel.get_all())) # type: ignore[no-untyped-call]
            | 'Split models into batches' >> beam.transforms.util.BatchElements(
                max_batch_size=self.MAX_BATCH_SIZE)
            | 'Index batches of models' >> beam.ParDo(
                self._index_exploration_summaries)
        )


class ComputeExplorationRecommendations(base_jobs.JobBase):
    """Job that indexes the explorations in Elastic Search."""

    @staticmethod
    def _compute_similarity(
            reference_exp_summary_model: datastore_services.Model,
            exp_summary_models: List[datastore_services.Model]
    ) -> List[job_run_result.JobRunResult]:
        """Index exploration summaries and catch any errors.

        Args:
            exp_summary_models: list(Model). Models to index.

        Returns:
            list(str). List containing one element, which is either SUCCESS,
            or FAILURE.
        """
        for compared_exp_summary_model in exp_summary_models:
            if compared_exp_summary_model.id == reference_exp_summary_model.id:
                continue
            similarity_score = recommendations_services.get_item_similarity(
                reference_exp_summary_model, compared_exp_summary_model
            )
            if similarity_score >= SIMILARITY_SCORE_THRESHOLD:
                yield (
                    reference_exp_summary_model.id, {
                        'similarity_score': similarity_score,
                        'exp_id': compared_exp_summary_model.id
                    }
                )

    @staticmethod
    def _sort_and_slice_similarities(
            similarities: Dict[str, Union[int, str]]
    ) -> List[str]:
        """"""
        sorted_similarities = sorted(
            similarities, reverse=True, key=lambda x: x['similarity_score'])

        return [
            item['exp_id'] for item in sorted_similarities
        ][:MAX_RECOMMENDATIONS]

    def run(self) -> beam.PCollection:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        the Elastic Search.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            the Elastic Search.
        """

        exp_summary_models = (
            self.pipeline
            | 'Get all non-deleted models' >> (
                ndb_io.GetModels(exp_models.ExpSummaryModel.get_all()))  # type: ignore[no-untyped-call]
        )

        exp_summary_iter = beam.pvalue.AsIter(exp_summary_models)

        return (
            exp_summary_models
            | 'Compute similarity' >> beam.ParDo(
                self._compute_similarity, exp_summary_iter)
            | 'Group similarities per exploration ID' >> beam.GroupByKey()
            | beam.MapTuple(
                lambda exp_id, similarities: (exp_id, _sort_and_slice_similarities(similarities)))
            | 
        )
