
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

"""Validation Jobs for title exploration"""

from __future__ import annotations

from core.domain import question_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(question_models, ) = models.Registry.import_models([models.NAMES.question])


class GetQuestionsWithInvalidSchemaVersionJob(base_jobs.JobBase):
    """Job that returns questions having state data schema version
    less than 27
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid questions with thier id and actual
        schema version number.

        Returns:
            PCollection. Returns PCollection of invalid questions with thier
            id and actual state data schema version number.
        """
        total_questions = (
            self.pipeline
            | 'Get all QuestionModels' >> ndb_io.GetModels(
                question_models.QuestionModel.get_all())
            | 'Get question from model' >> beam.Map(
                question_fetchers.get_question_from_model)
        )

        question_ids_with_less_schema_version = (
            total_questions
            | 'Combine exploration title and ids' >> beam.Map(
                lambda question: (
                    question.id,
                    question.question_state_data_schema_version)
                )
            | 'Filter questions with schema version less than 27' >>
                beam.Filter(lambda question: int(question[1]) < 27)
        )

        report_number_of_questions_queried = (
            total_questions
            | 'Report count of question models' >> (
                job_result_transforms.CountObjectsToJobRunResult('QUESTIONS'))
        )

        report_number_of_invalid_questions = (
            question_ids_with_less_schema_version
            | 'Report count of invalid questions models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_thier_actual_schema_value = (
            question_ids_with_less_schema_version
            | 'Save info of invalid questions' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                  'The id of question is %s and its actual schema version is %s'
                    % (objects[0], objects[1])))
        )

        return (
            (
                report_number_of_questions_queried,
                report_number_of_invalid_questions,
                report_invalid_ids_and_thier_actual_schema_value
            )
            | 'Combine results' >> beam.Flatten()
        )
