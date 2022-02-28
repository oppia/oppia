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

"""Unit tests for jobs.batch_jobs.skill_validation_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import skill_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(skill_models, ) = models.Registry.import_models([models.NAMES.skill])


class GetSkillWithInvalidMisconceptionIDJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = skill_validation_jobs.GetSkillWithInvalidMisconceptionIDJob # pylint: disable=line-too-long

    SKILL_ID_1 = '1'
    SKILL_ID_2 = '2'
    SKILL_ID_3 = '3'

    def setUp(self):
        super().setUp()

        # This is an invalid skill with misconception id < 0.
        self.skill_1 = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_ID_1,
            description='Test',
            misconceptions_schema_version=5,
            rubric_schema_version=5,
            language_code='en',
            skill_contents_schema_version=3,
            next_misconception_id=-1,
            all_questions_merged=True,
        )

        # This is an valid model with misconception id >= 0.
        self.skill_2 = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_ID_2,
            description='Test',
            misconceptions_schema_version=5,
            rubric_schema_version=5,
            language_code='en',
            skill_contents_schema_version=3,
            next_misconception_id=1,
            all_questions_merged=True,
        )

        # This is an invalid skill with misconception id < 0.
        self.skill_3 = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_ID_3,
            description='Test',
            misconceptions_schema_version=5,
            rubric_schema_version=5,
            language_code='en',
            skill_contents_schema_version=3,
            next_misconception_id=-51,
            all_questions_merged=True,
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.skill_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('SKILLS SUCCESS: 1')
        ])

    def test_run_with_single_invalid_model(self) -> None:
        self.put_multi([self.skill_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('SKILLS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of skill is {self.SKILL_ID_1} and its '
                f'misconception id is {self.skill_1.next_misconception_id}'),
        ])

    def test_run_with_mixed_models(self) -> None:
        self.put_multi([self.skill_1, self.skill_2, self.skill_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('SKILLS SUCCESS: 3'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of skill is {self.SKILL_ID_1} and its '
                f'misconception id is {self.skill_1.next_misconception_id}'),
            job_run_result.JobRunResult.as_stderr(
                f'The id of skill is {self.SKILL_ID_3} and its '
                f'misconception id is {self.skill_3.next_misconception_id}'),
        ])
