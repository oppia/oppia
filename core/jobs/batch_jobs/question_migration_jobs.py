# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Jobs used for migrating the question models."""

from __future__ import annotations

import logging

from core.domain import question_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.transforms import results_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import question_models

(base_models, question_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.QUESTION])
datastore_services = models.Registry.import_datastore_services()


class PopulateQuestionSummaryVersionOneOffJob(base_jobs.JobBase):
    """Job that adds a version field to QuestionSummary models."""

    @staticmethod
    def _update_and_validate_summary_model(
        question_version: int,
        question_summary_model: question_models.QuestionSummaryModel
    ) -> result.Result[Tuple[str, question_models.QuestionSummaryModel],
        Tuple[str, Exception]
    ]:
        """Transform question summary model into question summary object,
        add a version field and return the populated summary model.

        Args:
            question_version: int. The version number in the corresponding
                question domain object.
            question_summary_model: QuestionSummaryModel. The question summary
                model to migrate.

        Returns:
            Result((str, QuestionSummaryModel), (str, Exception)). Result
            containing tuple that consist of question ID and either question
            summary model object or Exception. Question summary model is
            returned when the migration was successful and Exception is
            returned otherwise.
        """
        try:
            with datastore_services.get_ndb_context():
                question_summary = (
                    question_services.get_question_summary_from_model(
                        question_summary_model
                    )
                )
            question_summary.version = question_version
            question_summary.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((question_summary.id, e))

        with datastore_services.get_ndb_context():
            question_summary_model = question_models.QuestionSummaryModel(
                id=question_summary.id,
                question_model_last_updated=question_summary.last_updated,
                question_model_created_on=question_summary.created_on,
                question_content=question_summary.question_content,
                misconception_ids=question_summary.misconception_ids,
                interaction_id=question_summary.interaction_id,
                version=question_summary.version
            )
        question_summary_model.update_timestamps()
        return result.Ok((question_summary_model.id, question_summary_model))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the question summary
        migration.

        Returns:
            PCollection. A PCollection of results from the
            question summary migration.
        """
        all_question_versions = (
            self.pipeline
            | 'Get all non-deleted question models' >> (
                ndb_io.GetModels(question_models.QuestionModel.get_all()))
            # Pylint disable is needed becasue pylint is not able to correclty
            # detect that the value is passed through the pipe.
            | 'Add question keys and extract version' >> beam.Map( # pylint: disable=no-value-for-parameter
                lambda model: (model.id, model.version)
            )
        )

        question_summary_models = (
            self.pipeline
            | 'Get all non-deleted question summary models' >> (
                ndb_io.GetModels(
                    question_models.QuestionSummaryModel.get_all())
                )
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add question summary keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda question_summary_model: question_summary_model.id)
        )

        all_updated_question_summary_results = (
            {
                'version': all_question_versions,
                'question_summary_model': question_summary_models,
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
            | 'Reorganize the objects' >> beam.Map(lambda objects: {
                    'version': objects['version'][0],
                    'question_summary_model': objects[
                        'question_summary_model'][0],
                })
            | 'Update question summary models' >> beam.Map(
                lambda objects: self._update_and_validate_summary_model(
                    objects['version'],
                    objects['question_summary_model']
            ))
        )

        updated_question_summary_results = (
            all_updated_question_summary_results
            | 'Generates results' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'QUESTION SUMMARY PROCESSED'))
        )

        filtered_question_summary_models = (
            all_updated_question_summary_results
            | 'Filter migration results' >> (
                results_transforms.DrainResultsOnError())
        )

        question_summary_models_to_put = (
            filtered_question_summary_models
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
            | 'Remove ID' >> beam.Values() # pylint: disable=no-value-for-parameter
        )

        unused_put_results = (
            question_summary_models_to_put
            | 'Put models into datastore' >> ndb_io.PutModels()
        )

        return updated_question_summary_results


class AuditPopulateQuestionSummaryVersionOneOffJob(base_jobs.JobBase):
    """Job that audits PopulateQuestionSummaryVersionOneOffJob."""

    @staticmethod
    def _update_and_validate_summary_model(
        question_version: int,
        question_summary_model: question_models.QuestionSummaryModel
    ) -> result.Result[Tuple[str, question_models.QuestionSummaryModel],
        Tuple[str, Exception]
    ]:
        """Transform question summary model into question summary object,
        add a version field and return the populated summary model.

        Args:
            question_version: int. The version number in the corresponding
                question domain object.
            question_summary_model: QuestionSummaryModel. The question summary
                model to migrate.

        Returns:
            Result((str, QuestionSummaryModel), (str, Exception)). Result
            containing tuple that consist of question ID and either question
            summary model object or Exception. Question summary object is
            returned when the migration was successful and Exception is
            returned otherwise.
        """
        try:
            with datastore_services.get_ndb_context():
                question_summary = (
                    question_services.get_question_summary_from_model(
                        question_summary_model
                    )
                )
            question_summary.version = question_version
            question_summary.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((question_summary.id, e))

        with datastore_services.get_ndb_context():
            question_summary_model = question_models.QuestionSummaryModel(
                id=question_summary.id,
                question_model_last_updated=question_summary.last_updated,
                question_model_created_on=question_summary.created_on,
                question_content=question_summary.question_content,
                misconception_ids=question_summary.misconception_ids,
                interaction_id=question_summary.interaction_id,
                version=question_summary.version
            )
        question_summary_model.update_timestamps()
        return result.Ok((question_summary.id, question_summary_model))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the question migration.

        Returns:
            PCollection. A PCollection of results from the question
            migration.
        """
        all_question_versions = (
            self.pipeline
            | 'Get all non-deleted question models' >> (
                ndb_io.GetModels(question_models.QuestionModel.get_all()))
            # Pylint disable is needed becasue pylint is not able to correclty
            # detect that the value is passed through the pipe.
            | 'Add question keys and extract version' >> beam.Map( # pylint: disable=no-value-for-parameter
                lambda model: (model.id, model.version)
            )
        )

        question_summary_models = (
            self.pipeline
            | 'Get all non-deleted question summary models' >> (
                ndb_io.GetModels(
                    question_models.QuestionSummaryModel.get_all())
                )
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add question summary keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda question_summary_model: question_summary_model.id)
        )

        question_objects = (
            {
                'version': all_question_versions,
                'question_summary_model': question_summary_models,
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
            | 'Reorganize the objects' >> beam.Map(lambda objects: {
                'version': objects['version'][0],
                'question_summary_model': objects[
                'question_summary_model'][0],
            })
        )

        all_updated_question_summary_results = (
            question_objects
            | 'Update question summary models' >> beam.Map(
                lambda objects: self._update_and_validate_summary_model(
                    objects['version'],
                    objects['question_summary_model']
            ))
        )

        updated_question_summary_results = (
            all_updated_question_summary_results
            | 'Generates results' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'QUESTION SUMMARY PROCESSED'))
        )
        unused_updated_question_summary = (
            all_updated_question_summary_results
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )

        return updated_question_summary_results
