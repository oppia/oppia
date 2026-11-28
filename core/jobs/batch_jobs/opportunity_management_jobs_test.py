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

"""Unit tests for jobs.batch_jobs.opportunity_management_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import opportunity_management_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        datastore_services,
        opportunity_models,
        question_models,
        skill_models,
    )

(
    opportunity_models,
    skill_models,
    question_models,
) = models.Registry.import_models(
    [
        models.Names.OPPORTUNITY,
        models.Names.SKILL,
        models.Names.QUESTION,
    ]
)

datastore_services = models.Registry.import_datastore_services()


class DeleteSkillOpportunityModelJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        opportunity_management_jobs.DeleteSkillOpportunityModelJob
    ] = opportunity_management_jobs.DeleteSkillOpportunityModelJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_job_deletes_all_opportunities(self) -> None:
        skill_opportunity_model_1 = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id='opportunity_id1',
            skill_description='A skill description',
            question_count=20,
        )
        skill_opportunity_model_1.update_timestamps()
        skill_opportunity_model_1.put()
        skill_opportunity_model_2 = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id='opportunity_id2',
            skill_description='A skill description',
            question_count=20,
        )
        skill_opportunity_model_2.update_timestamps()
        skill_opportunity_model_2.put()

        all_skill_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all()
        )
        self.assertEqual(len(all_skill_opportunity_models), 2)

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='SUCCESS: 2')]
        )

        all_skill_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all()
        )
        self.assertEqual(len(all_skill_opportunity_models), 0)


class GenerateSkillOpportunityModelJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        opportunity_management_jobs.GenerateSkillOpportunityModelJob
    ] = opportunity_management_jobs.GenerateSkillOpportunityModelJob

    SKILL_1_ID: Final = 'skill_1'
    SKILL_1_DESCRIPTION: Final = 'skill 1'
    SKILL_2_ID: Final = 'skill_2'
    SKILL_2_DESCRIPTION: Final = 'skill 2'
    QUESTION_1_ID: Final = 'question_1'
    QUESTION_2_ID: Final = 'question_2'

    def setUp(self) -> None:
        super().setUp()

        question_skill_link_model_1 = self.create_model(
            question_models.QuestionSkillLinkModel,
            question_id=self.QUESTION_1_ID,
            skill_id=self.SKILL_1_ID,
            skill_difficulty=1,
        )

        question_skill_link_model_2 = self.create_model(
            question_models.QuestionSkillLinkModel,
            question_id=self.QUESTION_2_ID,
            skill_id=self.SKILL_2_ID,
            skill_difficulty=1,
        )
        question_skill_link_model_1.update_timestamps()
        question_skill_link_model_2.update_timestamps()

        skill_1_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description=self.SKILL_1_DESCRIPTION,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            misconceptions=[],
            rubrics=[],
            skill_contents={
                'explanation': {
                    'html': 'test explanation',
                    'content_id': 'explanation',
                },
                'recorded_voiceovers': {'voiceovers_mapping': {}},
                'written_translations': {
                    'translations_mapping': {
                        'content': {},
                        'default_outcome': {},
                    }
                },
            },
            next_misconception_id=0,
            misconceptions_schema_version=feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            skill_contents_schema_version=feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            superseding_skill_id='blah',
            all_questions_merged=False,
            prerequisite_skill_ids=[],
        )

        skill_2_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_2_ID,
            description=self.SKILL_2_DESCRIPTION,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            misconceptions=[],
            rubrics=[],
            skill_contents={
                'explanation': {
                    'html': 'test explanation',
                    'content_id': 'explanation',
                },
                'recorded_voiceovers': {'voiceovers_mapping': {}},
                'written_translations': {
                    'translations_mapping': {
                        'content': {},
                        'default_outcome': {},
                    }
                },
            },
            next_misconception_id=0,
            misconceptions_schema_version=feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            skill_contents_schema_version=feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            superseding_skill_id='blah',
            all_questions_merged=False,
            prerequisite_skill_ids=[],
        )
        skill_1_model.update_timestamps()
        skill_2_model.update_timestamps()

        datastore_services.put_multi(
            [
                skill_1_model,
                skill_2_model,
                question_skill_link_model_1,
                question_skill_link_model_2,
            ]
        )

    def test_generation_job_creates_new_models(self) -> None:
        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all()
        )
        self.assertEqual(len(all_opportunity_models), 0)

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='SUCCESS: 2')]
        )

        opportunity_model_1 = opportunity_models.SkillOpportunityModel.get(
            self.SKILL_1_ID
        )
        # Ruling out the possibility of None for mypy type checking.
        assert opportunity_model_1 is not None
        self.assertEqual(opportunity_model_1.id, self.SKILL_1_ID)
        self.assertEqual(
            opportunity_model_1.skill_description, self.SKILL_1_DESCRIPTION
        )
        self.assertEqual(opportunity_model_1.question_count, 1)

        opportunity_model_2 = opportunity_models.SkillOpportunityModel.get(
            self.SKILL_2_ID
        )
        assert opportunity_model_2 is not None
        self.assertEqual(opportunity_model_2.id, self.SKILL_2_ID)
        self.assertEqual(
            opportunity_model_2.skill_description, self.SKILL_2_DESCRIPTION
        )
        self.assertEqual(opportunity_model_2.question_count, 1)

    def test_generation_job_does_not_count_duplicate_question_ids(self) -> None:
        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all()
        )
        self.assertEqual(len(all_opportunity_models), 0)

        question_1_duplicate_skilllinkmodel = self.create_model(
            question_models.QuestionSkillLinkModel,
            question_id=self.QUESTION_1_ID,
            skill_id=self.SKILL_1_ID,
            skill_difficulty=1,
        )
        question_1_duplicate_skilllinkmodel.update_timestamps()
        datastore_services.put_multi([question_1_duplicate_skilllinkmodel])

        all_skill_link_models = list(
            question_models.QuestionSkillLinkModel.get_all()
        )
        self.assertEqual(len(all_skill_link_models), 3)

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='SUCCESS: 2')]
        )

        opportunity_model_1 = opportunity_models.SkillOpportunityModel.get(
            self.SKILL_1_ID
        )
        # Ruling out the possibility of None for mypy type checking.
        assert opportunity_model_1 is not None
        self.assertEqual(opportunity_model_1.id, self.SKILL_1_ID)
        self.assertEqual(
            opportunity_model_1.skill_description, self.SKILL_1_DESCRIPTION
        )
        self.assertEqual(opportunity_model_1.question_count, 1)

        opportunity_model_2 = opportunity_models.SkillOpportunityModel.get(
            self.SKILL_2_ID
        )
        assert opportunity_model_2 is not None
        self.assertEqual(opportunity_model_2.id, self.SKILL_2_ID)
        self.assertEqual(
            opportunity_model_2.skill_description, self.SKILL_2_DESCRIPTION
        )
        self.assertEqual(opportunity_model_2.question_count, 1)

    def test_generation_job_counts_multiple_questions(self) -> None:
        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all()
        )
        self.assertEqual(len(all_opportunity_models), 0)

        question_skill_link_model_1 = self.create_model(
            question_models.QuestionSkillLinkModel,
            question_id=self.QUESTION_1_ID,
            skill_id=self.SKILL_2_ID,
            skill_difficulty=1,
        )
        question_skill_link_model_1.update_timestamps()
        datastore_services.put_multi([question_skill_link_model_1])

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='SUCCESS: 2')]
        )

        opportunity_model_1 = opportunity_models.SkillOpportunityModel.get(
            self.SKILL_1_ID
        )
        # Ruling out the possibility of None for mypy type checking.
        assert opportunity_model_1 is not None
        self.assertEqual(opportunity_model_1.id, self.SKILL_1_ID)
        self.assertEqual(
            opportunity_model_1.skill_description, self.SKILL_1_DESCRIPTION
        )
        self.assertEqual(opportunity_model_1.question_count, 1)

        opportunity_model_2 = opportunity_models.SkillOpportunityModel.get(
            self.SKILL_2_ID
        )
        assert opportunity_model_2 is not None
        self.assertEqual(opportunity_model_2.id, self.SKILL_2_ID)
        self.assertEqual(
            opportunity_model_2.skill_description, self.SKILL_2_DESCRIPTION
        )
        self.assertEqual(opportunity_model_2.question_count, 2)

    def test_generation_job_fails_when_validation_failure(self) -> None:
        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all()
        )
        self.assertEqual(len(all_opportunity_models), 0)

        with self.swap(
            opportunity_management_jobs.GenerateSkillOpportunityModelJob,
            '_count_unique_question_ids',
            lambda _: -1,
        ):

            self.assert_job_output_is(
                [
                    job_run_result.JobRunResult(
                        stdout='',
                        stderr='ERROR: \"Expected question_count to be '
                        'a non-negative integer, received -1\": 2',
                    )
                ]
            )
