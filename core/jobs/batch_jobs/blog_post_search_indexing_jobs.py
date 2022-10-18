# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

from core.domain import blog_domain
from core.domain import blog_services
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
    from mypy_imports import blog_models
    from mypy_imports import search_services as platform_search_services

(blog_models,) = models.Registry.import_models([models.Names.BLOG])

platform_search_services = models.Registry.import_search_services()


class IndexBlogPostsInSearchJob(base_jobs.JobBase):
    """Job that indexes the blog posts in Elastic Search."""

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
                    blog_models.BlogPostSummaryModel.get_all(
                        include_deleted=False
                    )
                ))
            | 'Convert BlogPostSummaryModels to domain objects' >> beam.Map(
                blog_services.get_blog_post_summary_from_model)
            | 'Split models into batches' >> beam.transforms.util.BatchElements(
                max_batch_size=self.MAX_BATCH_SIZE)
            | 'Index batches of models' >> beam.ParDo(
                IndexBlogPostSummaries())
            | 'Count the output' >> (
                job_result_transforms.ResultsToJobRunResults())
        )


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class IndexBlogPostSummaries(beam.DoFn): # type: ignore[misc]
    """DoFn to index blog post summaries."""

    def process(
        self, blog_post_summaries: List[blog_domain.BlogPostSummary]
    ) -> Iterable[result.Result[None, Exception]]:
        """Index blog post summaries and catch any errors.

        Args:
            blog_post_summaries: list(BlogPostSummaries). List of Blog Post
                Summary domain objects to be indexed.

        Yields:
            JobRunResult. List containing one element, which is either SUCCESS,
            or FAILURE.
        """
        try:
            search_services.index_blog_post_summaries(
                blog_post_summaries)
            for _ in blog_post_summaries:
                yield result.Ok()
        except platform_search_services.SearchException as e:
            yield result.Err(e)
