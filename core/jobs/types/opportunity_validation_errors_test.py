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

"""Unit tests for opportunity model validation errors."""

from __future__ import annotations

from core.jobs.types import (
    base_validation_errors,
    base_validation_errors_test,
    opportunity_validation_errors,
)
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import opportunity_models

(opportunity_models,) = models.Registry.import_models(
    [models.Names.OPPORTUNITY]
)


class InconsistentSkillDescriptionErrorTests(
    base_validation_errors_test.AuditErrorsTestBase
):
    """Tests for InconsistentSkillDescriptionError."""

    def test_message_and_inheritance(self) -> None:
        model = opportunity_models.SkillOpportunityModel(
            id='skill_id_123',
            skill_description='Old description',
            question_count=0,
        )
        error = opportunity_validation_errors.InconsistentSkillDescriptionError(
            model, 'New description'
        )

        self.assertTrue(
            issubclass(
                opportunity_validation_errors.InconsistentSkillDescriptionError,
                base_validation_errors.BaseValidationError,
            )
        )
        self.assertEqual(
            error.stderr,
            'InconsistentSkillDescriptionError in '
            'SkillOpportunityModel(id="skill_id_123"): '
            'skill_description="Old description" does not match '
            'SkillModel.description="New description"',
        )


class InconsistentQuestionCountErrorTests(
    base_validation_errors_test.AuditErrorsTestBase
):
    """Tests for InconsistentQuestionCountError."""

    def test_message_and_inheritance(self) -> None:
        model = opportunity_models.SkillOpportunityModel(
            id='skill_id_123',
            skill_description='Skill description',
            question_count=3,
        )
        error = opportunity_validation_errors.InconsistentQuestionCountError(
            model, 1
        )

        self.assertTrue(
            issubclass(
                opportunity_validation_errors.InconsistentQuestionCountError,
                base_validation_errors.BaseValidationError,
            )
        )
        self.assertEqual(
            error.stderr,
            'InconsistentQuestionCountError in '
            'SkillOpportunityModel(id="skill_id_123"): '
            'question_count=3 does not match expected linked question count=1',
        )
