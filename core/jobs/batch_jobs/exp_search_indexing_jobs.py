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

"""Jobs that are run by CRON scheduler."""

from __future__ import annotations

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import search_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result

from typing import Final, Iterable, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import search_services as platform_search_services

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])

platform_search_services = models.Registry.import_search_services()


class IndexExplorationsInSearchJob(base_jobs.JobBase):
    """Job that indexes the explorations in Elastic Search."""

    MAX_BATCH_SIZE: Final = 1000

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        the Elastic Search.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            the Elastic Search.
        """
        return (
            self.pipeline
            | 'Get all non-deleted models' >> (
                ndb_io.GetModels(
                    exp_models.ExpSummaryModel.get_all(include_deleted=False)))
            | 'Convert ExpSummaryModels to domain objects' >> beam.Map(
                exp_fetchers.get_exploration_summary_from_model)
            | 'Split models into batches' >> beam.transforms.util.BatchElements(
                max_batch_size=self.MAX_BATCH_SIZE)
            | 'Index batches of models' >> beam.ParDo(
                IndexExplorationSummaries())
            | 'Count the output' >> (
                job_result_transforms.ResultsToJobRunResults())
        )


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class IndexExplorationSummaries(beam.DoFn): # type: ignore[misc]
    """DoFn to index exploration summaries."""

    def process(
        self, exp_summary: List[exp_domain.ExplorationSummary]
    ) -> Iterable[result.Result[None, Exception]]:
        """Index exploration summaries and catch any errors.

        Args:
            exp_summary: list(ExplorationSummary). List of Exp Summary domain
                objects to be indexed.

        Yields:
            JobRunResult. List containing one element, which is either SUCCESS,
            or FAILURE.
        """
        try:
            search_services.index_exploration_summaries(exp_summary)
            for _ in exp_summary:
                yield result.Ok()
        except platform_search_services.SearchException as e:
            yield result.Err(e)
