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

"""Validation jobs for exploration models."""

from __future__ import annotations

from core.constants import constants
from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(exp_models, story_models, ) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.story])


class GetExpWithInvalidCategoryJob(base_jobs.JobBase):
    """Job that returns explorations with categories not in constants.ts"""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid explorations with their id and
        category.

        Returns:
            PCollection. Returns PCollection of invalid explorations with
            their id and category.
        """
        all_curated_exploration_ids = (
            self.pipeline
            | 'Get all StoryModels' >> ndb_io.GetModels(
                story_models.StoryModel.get_all(include_deleted=False))
            | 'Get chapters' >> beam.FlatMap(
                lambda x: x.story_contents['nodes'])
            | 'Get exploration ids' >> beam.Map(lambda x: x['exploration_id'])
        )

        total_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExpSummaryModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_summary_from_model)
        )

        published_explorations = (
            total_explorations
            | 'Get published explorations' >> beam.Filter(
                lambda exp: exp.status == constants.ACTIVITY_STATUS_PUBLIC
            )
        )

        curated_lessons = (
            published_explorations
            | 'Filter out all curated lessons' >> beam.Filter(
                lambda x,
                all_curated_lessons: x.id in all_curated_lessons,
                all_curated_lessons=beam.pvalue.AsIter(all_curated_lessons)
            )
        )

        exp_ids_with_category_not_in_constants = (
            curated_lessons
            | 'Combine exp id and category' >> beam.Map(
                lambda exp: (exp.id, exp.category))
            | 'Filter exploraton with category not in constants.ts' >>
                beam.Filter(lambda exp: exp[1] not in constants.ALL_CATEGORIES)
        )

        report_number_of_exps_queried = (
            curated_lessons
            | 'Report count of curated exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_invalid_exps = (
            exp_ids_with_category_not_in_constants
            | 'Report count of invalid exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_their_category = (
            exp_ids_with_category_not_in_constants
            | 'Save info on invalid exps' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is "%s" and its category is "%s"'
                    % (objects[0], objects[1])
                ))
        )

        return (
            (
                report_number_of_exps_queried,
                report_number_of_invalid_exps,
                report_invalid_ids_and_their_category
            )
            | 'Combine results' >> beam.Flatten()
        )
