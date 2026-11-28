# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for opportunity model validation jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs.datastore_audit import (
    base_validation_jobs,
    opportunity_jobs,
)
from core.jobs.types import (
    base_validation_errors,
    model_property,
    opportunity_validation_errors,
)
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        base_models,
        opportunity_models,
        question_models,
        skill_models,
    )

(base_models, opportunity_models, question_models, skill_models) = (
    models.Registry.import_models(
        [
            models.Names.BASE_MODEL,
            models.Names.OPPORTUNITY,
            models.Names.QUESTION,
            models.Names.SKILL,
        ]
    )
)


class SkillOpportunityModelValidationJobTests(job_test_utils.JobTestBase):
    """Tests for SkillOpportunityModelValidationJob."""

    JOB_CLASS: Type[base_validation_jobs.BaseValidationJob] = (
        opportunity_jobs.SkillOpportunityModelValidationJob
    )

    SKILL_ID: Final = 'skill_id_123'
    SKILL_DESCRIPTION: Final = 'Skill description'
    QUESTION_1_ID: Final = 'question_id_1'
    QUESTION_2_ID: Final = 'question_id_2'

    def _create_skill_model(
        self,
        skill_id: str = SKILL_ID,
        description: str = SKILL_DESCRIPTION,
        deleted: bool = False,
    ) -> skill_models.SkillModel:
        """Creates a valid SkillModel instance for tests."""
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=skill_id,
            description=description,
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
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION
            ),
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION
            ),
            superseding_skill_id='blah',
            all_questions_merged=False,
            prerequisite_skill_ids=[],
            deleted=deleted,
        )
        skill_model.update_timestamps()
        return skill_model

    def _create_question_model(
        self, question_id: str, deleted: bool = False
    ) -> question_models.QuestionModel:
        """Creates a valid QuestionModel instance for tests."""
        question_model = self.create_model(
            question_models.QuestionModel,
            id=question_id,
            question_state_data={
                'content': {'html': '<p>Question</p>', 'content_id': 'content'}
            },
            question_state_data_schema_version=(
                feconf.CURRENT_STATE_SCHEMA_VERSION
            ),
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            linked_skill_ids=[self.SKILL_ID],
            deleted=deleted,
        )
        question_model.update_timestamps()
        return question_model

    def _create_skill_opportunity_model(
        self,
        skill_id: str = SKILL_ID,
        skill_description: str = SKILL_DESCRIPTION,
        question_count: int = 0,
    ) -> opportunity_models.SkillOpportunityModel:
        """Creates a SkillOpportunityModel instance for tests."""
        model = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id=skill_id,
            skill_description=skill_description,
            question_count=question_count,
        )
        model.update_timestamps()
        return model

    def test_valid_skill_opportunity_without_questions_produces_no_errors(
        self,
    ) -> None:
        skill_model = self._create_skill_model()
        opportunity_model = self._create_skill_opportunity_model(
            question_count=0
        )
        self.put_multi([skill_model, opportunity_model])

        self.assert_job_output_is([])

    def test_valid_skill_opportunity_counts_unique_non_deleted_questions(
        self,
    ) -> None:
        skill_model = self._create_skill_model()
        question_1 = self._create_question_model(self.QUESTION_1_ID)
        deleted_question = self._create_question_model(
            self.QUESTION_2_ID, deleted=True
        )
        link_1 = self.create_model(
            question_models.QuestionSkillLinkModel,
            id='%s:%s' % (self.QUESTION_1_ID, self.SKILL_ID),
            question_id=self.QUESTION_1_ID,
            skill_id=self.SKILL_ID,
            skill_difficulty=0.5,
        )
        link_1.update_timestamps()
        # Duplicate question_id via separate link entity and a deleted question.
        link_1_dup = self.create_model(
            question_models.QuestionSkillLinkModel,
            id='%s:dup' % self.QUESTION_1_ID,
            question_id=self.QUESTION_1_ID,
            skill_id=self.SKILL_ID,
            skill_difficulty=0.6,
        )
        link_1_dup.update_timestamps()
        link_deleted = self.create_model(
            question_models.QuestionSkillLinkModel,
            id='%s:%s' % (self.QUESTION_2_ID, self.SKILL_ID),
            question_id=self.QUESTION_2_ID,
            skill_id=self.SKILL_ID,
            skill_difficulty=0.5,
        )
        link_deleted.update_timestamps()
        opportunity_model = self._create_skill_opportunity_model(
            question_count=1
        )
        self.put_multi(
            [
                skill_model,
                question_1,
                deleted_question,
                link_1,
                link_1_dup,
                link_deleted,
                opportunity_model,
            ]
        )

        self.assert_job_output_is([])

    def test_non_skill_opportunity_models_are_ignored(self) -> None:
        base_model = self.create_model(base_models.BaseModel, id='base_id')
        base_model.update_timestamps()
        skill_model = self._create_skill_model()
        self.put_multi([base_model, skill_model])

        self.assert_job_output_is([])

    def test_missing_skill_model_produces_relationship_error(self) -> None:
        opportunity_model = self._create_skill_opportunity_model(
            question_count=0
        )
        self.put_multi([opportunity_model])

        expected_error = base_validation_errors.ModelRelationshipError(
            id_property=model_property.ModelProperty(
                opportunity_models.SkillOpportunityModel,
                opportunity_models.SkillOpportunityModel.id,
            ),
            model=opportunity_model,
            target_kind='SkillModel',
            target_id=self.SKILL_ID,
        )
        self.assert_job_output_is(
            [{'ModelRelationshipError': [expected_error.stderr]}]
        )

    def test_deleted_skill_model_produces_relationship_error(self) -> None:
        skill_model = self._create_skill_model(deleted=True)
        opportunity_model = self._create_skill_opportunity_model(
            question_count=0
        )
        self.put_multi([skill_model, opportunity_model])

        expected_error = base_validation_errors.ModelRelationshipError(
            id_property=model_property.ModelProperty(
                opportunity_models.SkillOpportunityModel,
                opportunity_models.SkillOpportunityModel.id,
            ),
            model=opportunity_model,
            target_kind='SkillModel',
            target_id=self.SKILL_ID,
        )
        self.assert_job_output_is(
            [{'ModelRelationshipError': [expected_error.stderr]}]
        )

    def test_mismatched_skill_description_produces_error(self) -> None:
        skill_model = self._create_skill_model(description='Updated skill desc')
        opportunity_model = self._create_skill_opportunity_model(
            skill_description='Stale skill desc', question_count=0
        )
        self.put_multi([skill_model, opportunity_model])

        expected_error = (
            opportunity_validation_errors.InconsistentSkillDescriptionError(
                opportunity_model, 'Updated skill desc'
            )
        )
        self.assert_job_output_is(
            [{'InconsistentSkillDescriptionError': [expected_error.stderr]}]
        )

    def test_mismatched_question_count_produces_error(self) -> None:
        skill_model = self._create_skill_model()
        question_1 = self._create_question_model(self.QUESTION_1_ID)
        link_1 = self.create_model(
            question_models.QuestionSkillLinkModel,
            id='%s:%s' % (self.QUESTION_1_ID, self.SKILL_ID),
            question_id=self.QUESTION_1_ID,
            skill_id=self.SKILL_ID,
            skill_difficulty=0.5,
        )
        link_1.update_timestamps()
        opportunity_model = self._create_skill_opportunity_model(
            question_count=3
        )
        self.put_multi([skill_model, question_1, link_1, opportunity_model])

        expected_error = (
            opportunity_validation_errors.InconsistentQuestionCountError(
                opportunity_model, 1
            )
        )
        self.assert_job_output_is(
            [{'InconsistentQuestionCountError': [expected_error.stderr]}]
        )

    def test_invalid_domain_object_produces_error(self) -> None:
        skill_model = self._create_skill_model()
        opportunity_model = self._create_skill_opportunity_model(
            question_count=-1
        )
        self.put_multi([skill_model, opportunity_model])

        expected_domain_error = (
            base_validation_errors.ModelDomainObjectValidateError(
                opportunity_model,
                'Expected question_count to be a non-negative integer, '
                'received -1',
            )
        )
        expected_count_error = (
            opportunity_validation_errors.InconsistentQuestionCountError(
                opportunity_model, 0
            )
        )
        self.assert_job_output_is(
            [
                {
                    'ModelDomainObjectValidateError': [
                        expected_domain_error.stderr
                    ]
                },
                {
                    'InconsistentQuestionCountError': [
                        expected_count_error.stderr
                    ]
                },
            ]
        )

    def test_empty_skill_description_triggers_strict_domain_error(
        self,
    ) -> None:
        skill_model = self._create_skill_model(description='')
        opportunity_model = self._create_skill_opportunity_model(
            skill_description='', question_count=0
        )
        self.put_multi([skill_model, opportunity_model])

        expected_domain_error = (
            base_validation_errors.ModelDomainObjectValidateError(
                opportunity_model,
                'Expected skill_description to be a non-empty string, '
                'received \'\'',
            )
        )
        self.assert_job_output_is(
            [{'ModelDomainObjectValidateError': [expected_domain_error.stderr]}]
        )

    def test_inconsistent_timestamps_produces_error(self) -> None:
        now = datetime.datetime.now()
        skill_model = self._create_skill_model()
        opportunity_model = self._create_skill_opportunity_model(
            question_count=0
        )
        opportunity_model.created_on = now + datetime.timedelta(days=1)
        opportunity_model.last_updated = now
        self.put_multi([skill_model, opportunity_model])

        expected_error = base_validation_errors.InconsistentTimestampsError(
            opportunity_model
        )
        self.assert_job_output_is(
            [{'InconsistentTimestampsError': [expected_error.stderr]}]
        )
