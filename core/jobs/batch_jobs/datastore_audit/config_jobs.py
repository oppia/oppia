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

"""Validation jobs for config models."""

from __future__ import annotations

from core import feature_flag_list, utils
from core.domain import feature_flag_domain
from core.jobs.batch_jobs.datastore_audit import base_validation_jobs
from core.jobs.types import (
    base_validation_errors,
    config_validation_errors,
    job_run_result,
    model_property,
)
from core.platform import models

from typing import Callable, Iterator, List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, config_models, user_models

(base_models, config_models, user_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.CONFIG, models.Names.USER]
)

ACTIVE_FEATURE_NAMES = (
    feature_flag_list.FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE
)
DEPRECATED_FEATURE_NAMES = {
    feature_name.value
    for feature_name in feature_flag_list.DEPRECATED_FEATURE_NAMES
}


class FeatureFlagConfigModelValidationJob(
    base_validation_jobs.BaseValidationJob
):
    """Validates FeatureFlagConfigModel instances."""

    def get_validation_fns(
        self,
    ) -> List[
        Callable[[base_models.BaseModel], Iterator[job_run_result.JobRunResult]]
    ]:
        return [
            self.validate_feature_flag_id,
            self.validate_user_group_ids,
        ]

    def validate_feature_flag_id(
        self, model: base_models.BaseModel
    ) -> Iterator[config_validation_errors.InvalidFeatureFlagIdError]:
        """Validates that a config ID belongs to an active or deprecated flag.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            InvalidFeatureFlagIdError. The error for an unknown flag ID.
        """
        if not isinstance(model, config_models.FeatureFlagConfigModel):
            return

        if (
            model.id not in ACTIVE_FEATURE_NAMES
            and model.id not in DEPRECATED_FEATURE_NAMES
        ):
            yield config_validation_errors.InvalidFeatureFlagIdError(model)

    def validate_user_group_ids(
        self, model: base_models.BaseModel
    ) -> Iterator[base_validation_errors.ModelRelationshipError]:
        """Validates that all referenced user groups exist.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            ModelRelationshipError. The error for each missing user group.
        """
        if not isinstance(model, config_models.FeatureFlagConfigModel):
            return

        user_group_models = user_models.UserGroupModel.get_multi(
            model.user_group_ids
        )
        for user_group_id, user_group_model in zip(
            model.user_group_ids, user_group_models
        ):
            if user_group_model is None:
                yield base_validation_errors.ModelRelationshipError(
                    id_property=model_property.ModelProperty(
                        config_models.FeatureFlagConfigModel,
                        config_models.FeatureFlagConfigModel.user_group_ids,
                    ),
                    model=model,
                    target_kind='UserGroupModel',
                    target_id=user_group_id,
                )

    def validate_domain_object(
        self, model: base_models.BaseModel
    ) -> Iterator[base_validation_errors.ModelDomainObjectValidateError]:
        """Validates the domain object represented by a feature flag config.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            ModelDomainObjectValidateError. The domain validation error.
        """
        if not isinstance(model, config_models.FeatureFlagConfigModel):
            return

        feature_spec = ACTIVE_FEATURE_NAMES.get(model.id)
        # Deprecated configs can remain in production, but their old feature
        # stages are no longer retained in the active registry. Treating them
        # as production-stage configs preserves domain validation without
        # rejecting them only because their registry entry was retired.
        feature_stage = (
            feature_spec[1]
            if feature_spec is not None
            else feature_flag_domain.ServerMode.PROD
        )
        domain_object = feature_flag_domain.FeatureFlagConfig(
            model.force_enable_for_all_users,
            model.rollout_percentage,
            model.user_group_ids,
            model.last_updated,
        )
        try:
            domain_object.validate(feature_stage)
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
