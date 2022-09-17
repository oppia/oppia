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

"""Beam DoFns and PTransforms to provide validation of question models."""

from __future__ import annotations

from core.domain import question_domain
from core.jobs import job_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import base_validation
from core.jobs.types import model_property
from core.platform import models

from typing import Iterator, List, Optional, Tuple, Type, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import question_models
    from mypy_imports import skill_models

(question_models, skill_models) = models.Registry.import_models(
    [models.Names.QUESTION, models.Names.SKILL])

datastore_services = models.Registry.import_datastore_services()


@validation_decorators.AuditsExisting(
    question_models.QuestionSnapshotMetadataModel)
class ValidateQuestionSnapshotMetadataModel(
    base_validation.BaseValidateCommitCmdsSchema[
        question_models.QuestionSnapshotMetadataModel
    ]
):
    """Overrides _get_change_domain_class for QuestionSnapshotMetadataModel."""

    def _get_change_domain_class(
        self, input_model: question_models.QuestionSnapshotMetadataModel  # pylint: disable=unused-argument
    ) -> Type[question_domain.QuestionChange]:
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            question_domain.QuestionChange. A domain object class for the
            changes made by commit commands of the model.
        """
        return question_domain.QuestionChange


@validation_decorators.RelationshipsOf(question_models.QuestionSkillLinkModel)
def question_skill_link_model_relationships(
    model: Type[question_models.QuestionSkillLinkModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[Union[
            question_models.QuestionModel, skill_models.SkillModel
        ]]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.id, [question_models.QuestionModel]
    yield model.skill_id, [skill_models.SkillModel]


@validation_decorators.RelationshipsOf(
    question_models.QuestionCommitLogEntryModel)
def question_commit_log_entry_model_relationships(
    model: Type[question_models.QuestionCommitLogEntryModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[question_models.QuestionModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.question_id, [question_models.QuestionModel]


@validation_decorators.RelationshipsOf(question_models.QuestionSummaryModel)
def question_summary_model_relationships(
    model: Type[question_models.QuestionSummaryModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[question_models.QuestionModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.id, [question_models.QuestionModel]


@validation_decorators.AuditsExisting(
    question_models.QuestionCommitLogEntryModel)
class ValidateQuestionCommitLogEntryModel(
    base_validation.BaseValidateCommitCmdsSchema[
        question_models.QuestionCommitLogEntryModel
    ]
):
    """Overrides _get_change_domain_class for QuestionCommitLogEntryModel."""

    # Here we use MyPy ignore because the signature of this method doesn't
    # match with super class's _get_change_domain_class() method.
    def _get_change_domain_class(  # type: ignore[override]
        self, input_model: question_models.QuestionCommitLogEntryModel  # pylint: disable=unused-argument
    ) -> Optional[Type[question_domain.QuestionChange]]:
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            question_domain.QuestionChange. A domain object class for the
            changes made by commit commands of the model.
        """
        model = job_utils.clone_model(input_model)

        if model.id.startswith('question'):
            return question_domain.QuestionChange
        else:
            return None
