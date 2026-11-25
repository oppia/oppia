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

"""Error classes for opportunity model audits."""

from __future__ import annotations

from core import utils
from core.jobs.types import base_validation_errors
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import opportunity_models

(opportunity_models,) = models.Registry.import_models(
    [models.Names.OPPORTUNITY]
)


class InconsistentSkillDescriptionError(
    base_validation_errors.BaseValidationError
):
    """Error class for SkillOpportunityModels whose skill_description does not
    match the corresponding SkillModel's description.
    """

    def __init__(
        self,
        model: opportunity_models.SkillOpportunityModel,
        expected_description: str,
    ) -> None:
        message = (
            'skill_description=%s does not match SkillModel.description=%s'
            % (
                utils.quoted(model.skill_description),
                utils.quoted(expected_description),
            )
        )
        super().__init__(message, model)


class InconsistentQuestionCountError(
    base_validation_errors.BaseValidationError
):
    """Error class for SkillOpportunityModels whose question_count does not
    match the count of unique non-deleted linked questions.
    """

    def __init__(
        self,
        model: opportunity_models.SkillOpportunityModel,
        expected_question_count: int,
    ) -> None:
        message = (
            'question_count=%s does not match expected linked question '
            'count=%s' % (model.question_count, expected_question_count)
        )
        super().__init__(message, model)
