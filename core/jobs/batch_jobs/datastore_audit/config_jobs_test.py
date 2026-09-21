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

"""Tests for config model validation jobs."""

from __future__ import annotations

import datetime

from core import feature_flag_list
from core.jobs import job_test_utils
from core.jobs.batch_jobs.datastore_audit import config_jobs
from core.jobs.types import (
    base_validation_errors,
    config_validation_errors,
    model_property,
)
from core.platform import models

from typing import List, Optional, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import config_models, user_models

(config_models, user_models) = models.Registry.import_models(
    [models.Names.CONFIG, models.Names.USER]
)

ACTIVE_FEATURE_NAME = (
    feature_flag_list.FeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS.value
)


class FeatureFlagConfigModelValidationJobTests(job_test_utils.JobTestBase):
    """Tests FeatureFlagConfigModelValidationJob."""

    JOB_CLASS: Type[config_jobs.FeatureFlagConfigModelValidationJob] = (
        config_jobs.FeatureFlagConfigModelValidationJob
    )

    def create_feature_flag_config_model(
        self,
        feature_flag_name: str,
        rollout_percentage: int = 0,
        user_group_ids: Optional[List[str]] = None,
    ) -> config_models.FeatureFlagConfigModel:
        """Creates a feature flag config model for a job test.

        Args:
            feature_flag_name: str. The feature flag config model ID.
            rollout_percentage: int. The configured rollout percentage.
            user_group_ids: list(str)|None. Referenced user group IDs.

        Returns:
            FeatureFlagConfigModel. The new model.
        """
        return self.create_model(
            config_models.FeatureFlagConfigModel,
            id=feature_flag_name,
            force_enable_for_all_users=False,
            rollout_percentage=rollout_percentage,
            user_group_ids=user_group_ids or [],
        )

    def test_valid_active_feature_flag_config_produces_no_errors(self) -> None:
        model = self.create_feature_flag_config_model(
            ACTIVE_FEATURE_NAME
        )
        self.put_multi([model])

        self.assert_job_output_is([])

    def test_deprecated_feature_flag_config_produces_no_errors(self) -> None:
        model = self.create_feature_flag_config_model(
            feature_flag_list.FeatureNames.ANDROID_BETA_LANDING_PAGE.value
        )
        self.put_multi([model])

        self.assert_job_output_is([])

    def test_unknown_feature_flag_id_produces_error(self) -> None:
        model = self.create_feature_flag_config_model('unknown_feature_flag')
        self.put_multi([model])

        self.assert_job_output_is(
            [
                {
                    'InvalidFeatureFlagIdError': [
                        config_validation_errors.InvalidFeatureFlagIdError(
                            model
                        ).stderr
                    ]
                }
            ]
        )

    def test_missing_user_group_produces_relationship_error(self) -> None:
        model = self.create_feature_flag_config_model(
            ACTIVE_FEATURE_NAME,
            user_group_ids=['missing_group'],
        )
        self.put_multi([model])
        expected_error = base_validation_errors.ModelRelationshipError(
            id_property=model_property.ModelProperty(
                config_models.FeatureFlagConfigModel,
                config_models.FeatureFlagConfigModel.user_group_ids,
            ),
            model=model,
            target_kind='UserGroupModel',
            target_id='missing_group',
        )

        self.assert_job_output_is(
            [{'ModelRelationshipError': [expected_error.stderr]}]
        )

    def test_existing_user_group_produces_no_errors(self) -> None:
        user_group_model = self.create_model(
            user_models.UserGroupModel,
            id='group_id',
            name='Group name',
            user_ids=[],
        )
        model = self.create_feature_flag_config_model(
            ACTIVE_FEATURE_NAME,
            user_group_ids=['group_id'],
        )
        self.put_multi([user_group_model, model])

        self.assert_job_output_is([])

    def test_invalid_domain_object_produces_error(self) -> None:
        model = self.create_feature_flag_config_model(
            ACTIVE_FEATURE_NAME,
            rollout_percentage=101,
        )
        self.put_multi([model])
        expected_error = base_validation_errors.ModelDomainObjectValidateError(
            model,
            'Feature flag rollout-percentage should be between 0 and 100 '
            'inclusive.',
        )

        self.assert_job_output_is(
            [{'ModelDomainObjectValidateError': [expected_error.stderr]}]
        )

    def test_inconsistent_timestamps_produces_error(self) -> None:
        now = datetime.datetime.now()
        model = self.create_feature_flag_config_model(
            ACTIVE_FEATURE_NAME
        )
        model.created_on = now + datetime.timedelta(days=1)
        model.last_updated = now
        self.put_multi([model])

        self.assert_job_output_is(
            [
                {
                    'InconsistentTimestampsError': [
                        base_validation_errors.InconsistentTimestampsError(
                            model
                        ).stderr
                    ]
                }
            ]
        )
