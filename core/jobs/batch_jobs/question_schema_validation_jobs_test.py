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

"""Unit tests for jobs.batch_jobs.question_schema_validation_jobs."""

from __future__ import annotations

from core.domain import question_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import question_schema_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(question_models, ) = models.Registry.import_models([models.NAMES.question])


class GetQuestionsWithInvalidStateDataSchemaVersionJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = (
    question_schema_validation_jobs.GetQuestionsWithInvalidSchemaVersionJob)

    QUESTION_ID_1 = '1'
    QUESTION_ID_2 = '2'
    QUESTION_ID_3 = '3'

    def setUp(self):
        super().setUp()

        question_state_data_1 = (
            question_domain.Question.create_default_question_state().to_dict())

        question_state_data_1['content_ids_to_audio_translations'] = {
            'content': {},
            'default_outcome': {}
        }

        question_state_data_2 = question_state_data_1

        self.question_1 = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_ID_1,
            question_state_data=question_state_data_1,
            question_state_data_schema_version=49,
            language_code='en',
            linked_skill_ids=['skill1'],
            inapplicable_skill_misconception_ids=['skill2']
        )

        self.question_2 = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_ID_2,
            question_state_data=question_state_data_2,
            question_state_data_schema_version=27,
            language_code='en',
            linked_skill_ids=['skill1'],
            inapplicable_skill_misconception_ids=['skill2']
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.question_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('QUESTIONS SUCCESS: 1')
        ])

    def test_run_with_multi_valid_model(self) -> None:
        self.put_multi([self.question_1, self.question_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('QUESTIONS SUCCESS: 2')
        ])
