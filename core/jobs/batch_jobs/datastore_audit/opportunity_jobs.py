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

"""Validation jobs for opportunity models."""

from __future__ import annotations

from core import utils
from core.domain import opportunity_domain
from core.jobs.batch_jobs.datastore_audit import base_validation_jobs
from core.jobs.types import (
    base_validation_errors,
    job_run_result,
    model_property,
    opportunity_validation_errors,
)
from core.platform import models

from typing import Callable, Iterator, List

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


class SkillOpportunityModelValidationJob(base_validation_jobs.BaseValidationJob):
    """Validates SkillOpportunityModel instances."""

    def get_validation_fns(
        self,
    ) -> List[
        Callable[[base_models.BaseModel], Iterator[job_run_result.JobRunResult]]
    ]:
        return [
            self.validate_skill_model_and_description,
            self.validate_question_count,
        ]

    def validate_skill_model_and_description(
        self, model: base_models.BaseModel
    ) -> Iterator[job_run_result.JobRunResult]:
        """Validates that the referenced SkillModel exists and its description
        matches skill_description on SkillOpportunityModel.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            JobRunResult. A ModelRelationshipError if the referenced SkillModel
            is missing or deleted, or an InconsistentSkillDescriptionError if
            skill_description does not match SkillModel.description.
        """
        if not isinstance(model, opportunity_models.SkillOpportunityModel):
            return

        skill_model = (
            skill_models.SkillModel.get(model.id, strict=False)
            if model.id
            else None
        )
        if skill_model is None:
            yield base_validation_errors.ModelRelationshipError(
                id_property=model_property.ModelProperty(
                    opportunity_models.SkillOpportunityModel,
                    opportunity_models.SkillOpportunityModel.id,
                ),
                model=model,
                target_kind='SkillModel',
                target_id=model.id,
            )
            return

        if skill_model.description != model.skill_description:
            yield (
                opportunity_validation_errors.InconsistentSkillDescriptionError(
                    model, skill_model.description
                )
            )

    def validate_question_count(
        self, model: base_models.BaseModel
    ) -> Iterator[opportunity_validation_errors.InconsistentQuestionCountError]:
        """Validates that question_count matches the number of unique
        non-deleted questions linked to the skill.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            InconsistentQuestionCountError. The error when question_count
            does not match the count of unique linked non-deleted questions.
        """
        if not isinstance(model, opportunity_models.SkillOpportunityModel):
            return

        question_skill_links = (
            question_models.QuestionSkillLinkModel.get_models_by_skill_id(
                model.id
            )
        )
        question_ids = sorted({link.question_id for link in question_skill_links})
        if question_ids:
            linked_question_models = question_models.QuestionModel.get_multi(
                question_ids
            )
            expected_question_count = sum(
                1
                for question_model in linked_question_models
                if question_model is not None
            )
        else:
            expected_question_count = 0

        if model.question_count != expected_question_count:
            yield opportunity_validation_errors.InconsistentQuestionCountError(
                model, expected_question_count
            )

    def validate_domain_object(
        self, model: base_models.BaseModel
    ) -> Iterator[base_validation_errors.ModelDomainObjectValidateError]:
        """Validates the domain object represented by a SkillOpportunityModel.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            ModelDomainObjectValidateError. The domain validation error.
        """
        if not isinstance(model, opportunity_models.SkillOpportunityModel):
            return

        try:
            opportunity_domain.SkillOpportunity(
                model.id, model.skill_description, model.question_count
            )
        except utils.ValidationError as error:
            yield base_validation_errors.ModelDomainObjectValidateError(
                model, str(error)
            )

    def get_validate_domain_object_fn(
        self,
    ) -> Callable[
        [base_models.BaseModel], Iterator[job_run_result.JobRunResult]
    ]:
        return self.validate_domain_object
