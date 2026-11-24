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

"""Validation jobs for user models."""

from __future__ import annotations

from core import feconf, utils
from core.domain import user_domain
from core.jobs.batch_jobs.datastore_audit import base_validation_jobs
from core.jobs.types import (
    base_validation_errors,
    job_run_result,
    model_property,
    user_validation_errors,
)
from core.platform import models

from typing import Callable, Iterator, List, Optional, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, story_models, user_models

(base_models, story_models, user_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.STORY, models.Names.USER]
)


class StoryProgressModelValidationJob(base_validation_jobs.BaseValidationJob):
    """Job that validates StoryProgressModel instances in Datastore."""

    def get_validation_fns(
        self,
    ) -> List[
        Callable[[base_models.BaseModel], Iterator[job_run_result.JobRunResult]]
    ]:
        return [
            self.validate_model_id,
            self.validate_user_settings_relationship,
            self.validate_story_relationship,
        ]

    def get_validate_domain_object_fn(
        self,
    ) -> Callable[
        [base_models.BaseModel], Iterator[job_run_result.JobRunResult]
    ]:
        return self.validate_domain_object

    def validate_domain_object(
        self, model: base_models.BaseModel
    ) -> Iterator[base_validation_errors.ModelDomainObjectValidateError]:
        """Validates that the domain object for StoryProgressModel is valid.

        Args:
            model: base_models.BaseModel. The model to validate.

        Yields:
            JobRunResult. The result of the validation (if any error is found).
        """
        if not isinstance(model, user_models.StoryProgressModel):
            return

        domain_object = user_domain.StoryProgress(
            model.user_id, model.story_id, model.completed_node_ids
        )
        try:
            domain_object.validate()
        except utils.ValidationError as e:
            yield base_validation_errors.ModelDomainObjectValidateError(
                model, str(e)
            )

    def validate_model_id(
        self, model: base_models.BaseModel
    ) -> Iterator[user_validation_errors.StoryProgressModelIdMismatchError]:
        """Validates that the model ID matches [user_id].[story_id].

        Args:
            model: base_models.BaseModel. The model to validate.

        Yields:
            JobRunResult. The result of the validation (if any error is found).
        """
        if not isinstance(model, user_models.StoryProgressModel):
            return

        expected_id = '%s.%s' % (model.user_id, model.story_id)
        if model.id != expected_id:
            yield user_validation_errors.StoryProgressModelIdMismatchError(
                model
            )

    def validate_user_settings_relationship(
        self, model: base_models.BaseModel
    ) -> Iterator[base_validation_errors.ModelRelationshipError]:
        """Validates that the user_id corresponds to an existing UserSettingsModel.

        Args:
            model: base_models.BaseModel. The model to validate.

        Yields:
            JobRunResult. The result of the validation (if any error is found).
        """
        if not isinstance(model, user_models.StoryProgressModel):
            return

        if model.user_id not in feconf.SYSTEM_USERS:
            user_settings = user_models.UserSettingsModel.get(
                model.user_id, strict=False
            )
            if user_settings is None or user_settings.deleted:
                yield base_validation_errors.ModelRelationshipError(
                    id_property=model_property.ModelProperty(
                        user_models.StoryProgressModel,
                        user_models.StoryProgressModel.user_id,
                    ),
                    model=model,
                    target_kind='UserSettingsModel',
                    target_id=model.user_id,
                )

    def validate_story_relationship(
        self, model: base_models.BaseModel
    ) -> Iterator[
        Union[
            base_validation_errors.ModelRelationshipError,
            user_validation_errors.NonexistentCompletedNodeIdError,
        ]
    ]:
        """Validates that the story_id corresponds to an existing StoryModel,
        and that completed_node_ids belong to the story.

        Args:
            model: base_models.BaseModel. The model to validate.

        Yields:
            JobRunResult. The result of the validation (if any error is found).
        """
        if not isinstance(model, user_models.StoryProgressModel):
            return

        story_model: Optional[story_models.StoryModel] = (
            story_models.StoryModel.get_by_id(model.story_id)
        )
        if story_model is None:
            yield base_validation_errors.ModelRelationshipError(
                id_property=model_property.ModelProperty(
                    user_models.StoryProgressModel,
                    user_models.StoryProgressModel.story_id,
                ),
                model=model,
                target_kind='StoryModel',
                target_id=model.story_id,
            )
        elif not story_model.deleted:
            story_nodes = story_model.story_contents.get('nodes', [])
            valid_node_ids = {
                node['id'] for node in story_nodes if 'id' in node
            }
            nonexistent_node_ids = [
                node_id
                for node_id in model.completed_node_ids
                if node_id not in valid_node_ids
            ]
            if nonexistent_node_ids:
                yield user_validation_errors.NonexistentCompletedNodeIdError(
                    model, nonexistent_node_ids
                )
