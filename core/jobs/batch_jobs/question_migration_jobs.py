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

from core.domain import question_domain
from core.domain import question_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import question_models

(base_models, question_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.QUESTION])
datastore_services = models.Registry.import_datastore_services()


class PopulateQuestionSummaryVersionOneOffJob(base_jobs.JobBase):
    """Job that adds a version field to QuestionSummary models."""

    @staticmethod
    def _transform_question_summary(
        question_summary_id: str,
        question_summary_model: question_models.QuestionSummaryModel
    ) -> result.Result[Tuple[str, question_domain.QuestionSummary],
        Tuple[str, Exception]
    ]:
        """Transform question summary model into question summary object.

        Args:
            question_summary_id: str. The id of the question summary.
            question_summary_model: QuestionSummaryModel. The question model
                to migrate.

        Returns:
            Result((str, QuestionSummary), (str, Exception)). Result containing
            tuple that consist of question ID and either question summary
            object or Exception. Question summary object is returned when the
            migration was successful and Exception is returned otherwise.
        """
        try:
            question_summary = (
                question_services.get_question_summary_from_model(
                question_summary_model
                )
            )
            question_summary.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((question_summary_id, e))

        return result.Ok((question_summary_id, question_summary))

    @staticmethod
    def _update_question_summary(
        question: question_domain.Question,
        question_summary: question_domain.QuestionSummary,
        question_summary_model: question_models.QuestionSummaryModel
    ) -> question_models.QuestionSummaryModel:
        """Adds version to get an updated question summary model.

        Args:
            question: Question. The question domain object.
            question_summary: QuestionSummary. The question summary domain
                object.
            question_summary_model: QuestionSummaryModel. The question summary
                model to update.

        Returns:
            QuestionSummaryModel. The updated question summary model to put
            into the datastore.
        """
        question_summary_dict = {
            'interaction_id': question_summary.interaction_id,
            'question_content': question_summary.question_content,
            'question_model_last_updated': question_summary.last_updated,
            'question_model_created_on': question_summary.created_on,
            'misconception_ids': question_summary.misconception_ids,
            'version': question.version
        }

        if question_summary_model is not None:
            question_summary_model.populate(**question_summary_dict)
        else:
            question_summary_dict['id'] = question_summary.id
            question_summary_model = question_models.QuestionSummaryModel(
                **question_summary_dict)

        return question_summary_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the question migration.

        Returns:
            PCollection. A PCollection of results from the question
            migration.
        """
        all_question_models = (
            self.pipeline
            | 'Get all non-deleted question models' >> (
                ndb_io.GetModels(question_models.QuestionModel.get_all()))
            # Pylint disable is needed becasue pylint is not able to correclty
            # detect that the value is passed through the pipe.
            | 'Add question keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda question_model: question_model.id)
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

        all_transformed_question_summary_results = (
            question_summary_models
            | 'Transform model' >> beam.MapTuple(
                self._transform_question_summary)
        )

        transformed_question_summary_job_run_results = (
            all_transformed_question_summary_results
            | 'Generates results' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'QUESTION SUMMARY PROCESSED'))
        )

        transformed_question_summary = (
            all_transformed_question_summary_results
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )
        question_objects_list = (
            {
                'question': all_question_models,
                'question_summary': transformed_question_summary,
                'question_summary_model': question_summary_models,
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
        )

        question_objects = (
            question_objects_list
            | 'Reorganize the objects' >> beam.Map(lambda objects: {
                    'question': objects['question'][0],
                    'question_summary': objects['question_summary'][0],
                    'question_summary_model': objects[
                        'question_summary_model'][0],
                })
        )
        question_summary_models_to_put = (
            question_objects
            | 'Generate question summary to put' >> beam.Map(
                lambda question_objects: self._update_question_summary(
                    question_objects['question'],
                    question_objects['question_summary'],
                    question_objects['question_summary_model']
            ))
        )

        unused_put_results = (
            question_summary_models_to_put
            | 'Put models into datastore' >> ndb_io.PutModels()
        )

        return transformed_question_summary_job_run_results


class AuditPopulateQuestionSummaryVersionOneOffJob(base_jobs.JobBase):
    """Job that audits PopulateQuestionSummaryVersionOneOffJob."""

    @staticmethod
    def _transform_question_summary(
        question_summary_id: str,
        question_summary_model: question_models.QuestionSummaryModel
    ) -> result.Result[Tuple[str, question_domain.QuestionSummary],
        Tuple[str, Exception]
    ]:
        """Transform question summary model into question summary object.

        Args:
            question_summary_id: str. The id of the question summary.
            question_summary_model: QuestionSummaryModel. The question model
                to migrate.

        Returns:
            Result((str, QuestionSummary), (str, Exception)). Result containing
            tuple that consist of question ID and either question summary
            object or Exception. Question summary object is returned when the
            migration was successful and Exception is returned otherwise.
        """
        try:
            question_summary = (
                question_services.get_question_summary_from_model(
                question_summary_model
                )
            )
            question_summary.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((question_summary_id, e))

        return result.Ok((question_summary_id, question_summary))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the question migration.

        Returns:
            PCollection. A PCollection of results from the question
            migration.
        """
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

        all_transformed_question_summary_results = (
            question_summary_models
            | 'Transform model' >> beam.MapTuple(
                self._transform_question_summary)
        )

        transformed_question_summary_job_run_results = (
            all_transformed_question_summary_results
            | 'Generates results' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'QUESTION SUMMARY PROCESSED'))
        )

        return transformed_question_summary_job_run_results
