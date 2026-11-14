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

from core import utils
from core.domain import user_domain
from core.jobs.batch_jobs.datastore_audit import base_validation_jobs
from core.jobs.types import (
    base_validation_errors,
    job_run_result,
    model_property,
    user_validation_errors,
)
from core.platform import models

from typing import Callable, Iterator, List, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        base_models,
        datastore_services,
        exp_models,
        user_models,
    )

(base_models, exp_models, user_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.EXPLORATION, models.Names.USER]
)

datastore_services = models.Registry.import_datastore_services()


class ExpUserLastPlaythroughModelValidationJob(
    base_validation_jobs.BaseValidationJob
):
    """Validates ExpUserLastPlaythroughModel instances."""

    def get_model_class(
        self,
    ) -> Type[user_models.ExpUserLastPlaythroughModel]:
        return user_models.ExpUserLastPlaythroughModel

    def get_validation_fns(
        self,
    ) -> List[
        Callable[[base_models.BaseModel], Iterator[job_run_result.JobRunResult]]
    ]:
        return [
            self.validate_model_id,
            self.validate_user_relation,
            self.validate_exploration_relation,
            self.validate_exploration_marked_incomplete,
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
        """Validates the ExpUserLastPlaythrough domain object of the model.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            ModelDomainObjectValidateError. The domain validation error.
        """
        assert isinstance(model, user_models.ExpUserLastPlaythroughModel)
        domain_object = user_domain.ExpUserLastPlaythrough(
            model.user_id,
            model.exploration_id,
            model.last_played_exp_version,
            model.last_updated,
            model.last_played_state_name,
        )
        try:
            domain_object.validate()
        except utils.ValidationError as e:
            yield base_validation_errors.ModelDomainObjectValidateError(
                model, str(e)
            )

    def validate_model_id(
        self, model: base_models.BaseModel
    ) -> Iterator[user_validation_errors.InvalidExpUserLastPlaythroughIdError]:
        """Validates that the model ID is "[user_id].[exploration_id]". The
        domain object builds its ID from these two fields, so domain
        validation cannot catch a mismatch.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            InvalidExpUserLastPlaythroughIdError. The error for a mismatched
            ID.
        """
        assert isinstance(model, user_models.ExpUserLastPlaythroughModel)
        if model.id != '%s.%s' % (model.user_id, model.exploration_id):
            yield user_validation_errors.InvalidExpUserLastPlaythroughIdError(
                model
            )

    def validate_user_relation(
        self, model: base_models.BaseModel
    ) -> Iterator[base_validation_errors.ModelRelationshipError]:
        """Validates that a UserSettingsModel exists for the user_id.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            ModelRelationshipError. The error for a missing user.
        """
        assert isinstance(model, user_models.ExpUserLastPlaythroughModel)
        with datastore_services.get_ndb_context():
            user_settings_model = user_models.UserSettingsModel.get(
                model.user_id, strict=False
            )
        if user_settings_model is None:
            yield base_validation_errors.ModelRelationshipError(
                model_property.ModelProperty(
                    user_models.ExpUserLastPlaythroughModel,
                    user_models.ExpUserLastPlaythroughModel.user_id,
                ),
                model,
                'UserSettingsModel',
                model.user_id,
            )

    def validate_exploration_relation(
        self, model: base_models.BaseModel
    ) -> Iterator[job_run_result.JobRunResult]:
        """Validates that the exploration exists, that last_played_exp_version
        is at most its current version, and that last_played_state_name is a
        state of the exploration at last_played_exp_version.

        The state is looked up in the version which the learner played, not
        the latest one, because states can be renamed or deleted after the
        learner leaves the exploration.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            JobRunResult. The error for a missing exploration, an invalid
            version or an invalid state name.
        """
        assert isinstance(model, user_models.ExpUserLastPlaythroughModel)
        with datastore_services.get_ndb_context():
            exploration_model = exp_models.ExplorationModel.get(
                model.exploration_id, strict=False
            )
        if exploration_model is None:
            yield base_validation_errors.ModelRelationshipError(
                model_property.ModelProperty(
                    user_models.ExpUserLastPlaythroughModel,
                    user_models.ExpUserLastPlaythroughModel.exploration_id,
                ),
                model,
                'ExplorationModel',
                model.exploration_id,
            )
            return

        last_played_exp_version = model.last_played_exp_version
        # Versions that are not integers >= 1 are reported by the domain
        # object validation, and cannot be used to fetch an exploration.
        if (
            isinstance(last_played_exp_version, bool)
            or not isinstance(last_played_exp_version, int)
            or last_played_exp_version < 1
        ):
            return

        if last_played_exp_version > exploration_model.version:
            yield user_validation_errors.LastPlayedExpVersionTooHighError(
                model, exploration_model.version
            )
            return

        with datastore_services.get_ndb_context():
            played_exploration_model = exp_models.ExplorationModel.get_version(
                model.exploration_id, last_played_exp_version, strict=False
            )
        if played_exploration_model is None:
            yield user_validation_errors.LastPlayedExpVersionNotFoundError(
                model
            )
        elif model.last_played_state_name not in (
            played_exploration_model.states
        ):
            yield user_validation_errors.LastPlayedStateNotInExplorationError(
                model
            )

    def validate_exploration_marked_incomplete(
        self, model: base_models.BaseModel
    ) -> Iterator[user_validation_errors.ExplorationNotMarkedIncompleteError]:
        """Validates that the exploration is in the user's incomplete
        explorations. The model is only created when an exploration is marked
        as incomplete, and is deleted when the exploration is removed from the
        incomplete list.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            ExplorationNotMarkedIncompleteError. The error for an exploration
            that is not marked as incomplete.
        """
        assert isinstance(model, user_models.ExpUserLastPlaythroughModel)
        with datastore_services.get_ndb_context():
            incomplete_activities_model = (
                user_models.IncompleteActivitiesModel.get(
                    model.user_id, strict=False
                )
            )
        if (
            incomplete_activities_model is None
            or model.exploration_id
            not in incomplete_activities_model.exploration_ids
        ):
            yield user_validation_errors.ExplorationNotMarkedIncompleteError(
                model
            )
