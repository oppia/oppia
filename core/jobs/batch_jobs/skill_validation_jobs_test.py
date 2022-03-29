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

from core.constants import constants
from core.domain import skill_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import skill_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(skill_models, ) = models.Registry.import_models([models.NAMES.skill])


class GetInvalidSkillMediumRubricsJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = (
        skill_validation_jobs.GetInvalidSkillMediumRubricsJob
    )

    def setUp(self):
        super().setUp()

        self.valid_rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1],
                ['<p> Explanation Medium </p>'] * 3
            )
        ]

        self.invalid_rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0],
                ['<p> Explanation Easy </p>'] * 3
            )
        ]

        # Skill model with invalid rubrics.
        self.skill_model_1 = skill_models.SkillModel(
            id='skill_id_1',
            description='description 1',
            language_code='en',
            misconceptions=[],
            rubrics=[
                rubric.to_dict() for rubric in self.invalid_rubrics
            ],
            next_misconception_id=0,
            misconceptions_schema_version=2,
            rubric_schema_version=2,
            skill_contents_schema_version=2,
            all_questions_merged=False,
        )

        # Skill model with valid rubrics.
        self.skill_model_2 = skill_models.SkillModel(
            id='skill_id_2',
            description='description 2',
            language_code='en',
            misconceptions=[],
            rubrics=[
                rubric.to_dict() for rubric in self.valid_rubrics
            ],
            next_misconception_id=0,
            misconceptions_schema_version=2,
            rubric_schema_version=2,
            skill_contents_schema_version=2,
            all_questions_merged=False,
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.skill_model_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('SKILLS SUCCESS: 1')
        ])

    def test_run_with_single_invalid_model(self) -> None:
        self.put_multi([self.skill_model_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('SKILLS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                'The id of the skill is %s'
                % ('skill_id_1'))
        ])

    def test_run_with_mixed_models(self) -> None:
        self.put_multi([
            self.skill_model_1, self.skill_model_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('SKILLS SUCCESS: 2'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                'The id of the skill is %s'
                % ('skill_id_1')),
            job_run_result.JobRunResult.as_stderr(
                'The id of the skill is %s'
                % ('skill_id_2'))
        ])
