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

"""Tests for feature_flag_config_model_migration_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import feature_flag_config_model_migration_jobs
from core.jobs.types import job_run_result
from core.storage.config import gae_models as config_models

from typing import Type


class MigrateFeatureFlagConfigModelsJobTests(job_test_utils.JobTestBase):
    """Tests for MigrateFeatureFlagConfigModelsJob."""

    JOB_CLASS: Type[
        feature_flag_config_model_migration_jobs.MigrateFeatureFlagConfigModelsJob
    ] = (
        feature_flag_config_model_migration_jobs.MigrateFeatureFlagConfigModelsJob
    )

    def test_empty_storage(self) -> None:
        """The job should emit a zero-count result when no legacy models exist."""
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED FEATURE FLAG CONFIG MODEL COUNT: 0.'
                )
            ]
        )

    def test_migrates_legacy_feature_flag_config_model(self) -> None:
        """Legacy datastore entries should be migrated to the web config model."""
        legacy_model = config_models.FeatureFlagConfigModel(
            id='feature_flag_a',
            force_enable_for_all_users=True,
            rollout_percentage=25,
            user_group_ids=['group_1', 'group_2'],
        )
        legacy_model.update_timestamps()
        legacy_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED FEATURE FLAG CONFIG MODEL COUNT: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED FEATURE FLAG CONFIG MODEL: feature_flag_a'
                ),
            ]
        )

        migrated_model = config_models.WebFeatureFlagConfigModel.get(
            'feature_flag_a'
        )
        assert migrated_model is not None
        self.assertTrue(migrated_model.force_enable_for_all_users)
        self.assertEqual(migrated_model.rollout_percentage, 25)
        self.assertEqual(
            migrated_model.user_group_ids,
            ['group_1', 'group_2'],
        )

        self.assertIsNone(
            config_models.FeatureFlagConfigModel.get('feature_flag_a')
        )

    def test_audit_job_does_not_write_new_models(self) -> None:
        """The audit job should report the legacy items without mutating storage."""
        legacy_model = config_models.FeatureFlagConfigModel(
            id='feature_flag_b',
            force_enable_for_all_users=False,
            rollout_percentage=40,
            user_group_ids=['group_3'],
        )
        legacy_model.update_timestamps()
        legacy_model.put()

        audit_job = feature_flag_config_model_migration_jobs.AuditFeatureFlagConfigModelsMigrationJob(
            self.pipeline
        )
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED FEATURE FLAG CONFIG MODEL COUNT: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED FEATURE FLAG CONFIG MODEL: feature_flag_b'
                ),
            ]
        )

        self.assertIsNotNone(
            config_models.FeatureFlagConfigModel.get('feature_flag_b')
        )
        self.assertIsNone(
            config_models.WebFeatureFlagConfigModel.get('feature_flag_b')
        )
