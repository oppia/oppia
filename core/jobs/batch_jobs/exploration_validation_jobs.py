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

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class GetExpWithInvalidCategoryJob(base_jobs.JobBase):
    """Job that returns explorations with categories not in constants.ts"""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid explorations with their id and
        category.

        Returns:
            PCollection. Returns PCollection of invalid explorations with
            their id and category.
        """
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
                lambda exp: exp.first_published_msec is not None
            )
        )

        exp_ids_with_category_not_in_contants = (
            published_explorations
            | 'Combine exp id and category' >> beam.Map(
                lambda exp: (exp.id, exp.category))
            | 'Filter exploraton with category not in constants.ts' >>
                beam.Filter(lambda exp: not exp[1] in constants.ALL_CATEGORIES)
        )

        report_number_of_exps_queried = (
            published_explorations
            | 'Report count of published exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_invalid_exps = (
            exp_ids_with_category_not_in_contants
            | 'Report count of invalid exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_their_category = (
            exp_ids_with_category_not_in_contants
            | 'Save info on invalid exps' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and its category is %s'
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


class GetExpWithInvalidRatingJob(base_jobs.JobBase):
    """Job that returns exploration having invalid scaled avg rating."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid explorations with their id and
        scaled average rating.

        Returns:
            PCollection. Returns PCollection of invalid explorations with
            their id and scaled avg rating.
        """
        total_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExpSummaryModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_summary_from_model)
        )

        exp_ids_with_invalid_rating = (
            total_explorations
            | 'Combine exploration ids and scaled avg ratings' >> beam.Map(
                lambda exp: (exp.id, exp.scaled_average_rating))
            | 'Filter exploratons with invalid scaled avg ratings' >>
                beam.Filter(lambda exp: exp[1] > 5 or exp[1] < 0)
        )

        report_number_of_exps_queried = (
            total_explorations
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_invalid_exps = (
            exp_ids_with_invalid_rating
            | 'Report count of invalid exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_their_scaled_avg_rating = (
            exp_ids_with_invalid_rating
            | 'Save info on invalid exps' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and its scaled avg rating is %s'
                    % (objects[0], objects[1])
                ))
        )

        return (
            (
                report_number_of_exps_queried,
                report_number_of_invalid_exps,
                report_invalid_ids_and_their_scaled_avg_rating
            )
            | 'Combine results' >> beam.Flatten()
        )
