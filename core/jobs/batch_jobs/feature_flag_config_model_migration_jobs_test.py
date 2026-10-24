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

import datetime

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
        self.assert_job_output_is_empty()

    def test_migrates_legacy_feature_flag_config_model(self) -> None:
        """Legacy datastore entries should be migrated to the web config model."""
        legacy_model = config_models.FeatureFlagConfigModel(
            id='feature_flag_a',
            force_enable_for_all_users=True,
            rollout_percentage=25,
            user_group_ids=['group_1', 'group_2'],
            created_on=datetime.datetime(2020, 1, 2),
            last_updated=datetime.datetime(2021, 3, 4),
        )
        legacy_model.update_timestamps(update_last_updated_time=False)
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
        self.assertEqual(migrated_model.key.id(), legacy_model.key.id())
        self.assertTrue(migrated_model.force_enable_for_all_users)
        self.assertEqual(migrated_model.rollout_percentage, 25)
        self.assertEqual(
            migrated_model.user_group_ids,
            ['group_1', 'group_2'],
        )
        self.assertEqual(
            migrated_model.created_on, datetime.datetime(2020, 1, 2)
        )
        self.assertEqual(
            migrated_model.last_updated, datetime.datetime(2021, 3, 4)
        )

        self.assertIsNotNone(
            config_models.FeatureFlagConfigModel.get(
                'feature_flag_a', strict=False
            )
        )

    def test_skips_legacy_model_when_web_model_already_exists(self) -> None:
        legacy_model = config_models.FeatureFlagConfigModel(
            id='feature_flag_a',
            force_enable_for_all_users=False,
            rollout_percentage=20,
            user_group_ids=['legacy_group'],
        )
        legacy_model.update_timestamps()
        legacy_model.put()
        web_model = config_models.WebFeatureFlagConfigModel(
            id='feature_flag_a',
            force_enable_for_all_users=True,
            rollout_percentage=80,
            user_group_ids=['web_group'],
        )
        web_model.update_timestamps()
        web_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED FEATURE FLAG CONFIG MODEL COUNT: 0.'
                ),
            ]
        )

        stored_web_model = config_models.WebFeatureFlagConfigModel.get(
            'feature_flag_a'
        )
        assert stored_web_model is not None
        self.assertTrue(stored_web_model.force_enable_for_all_users)
        self.assertEqual(stored_web_model.rollout_percentage, 80)
        self.assertEqual(stored_web_model.user_group_ids, ['web_group'])


class AuditFeatureFlagConfigModelsMigrationJobTests(job_test_utils.JobTestBase):
    """Tests for AuditFeatureFlagConfigModelsMigrationJob."""

    JOB_CLASS: Type[
        feature_flag_config_model_migration_jobs.AuditFeatureFlagConfigModelsMigrationJob
    ] = (
        feature_flag_config_model_migration_jobs.AuditFeatureFlagConfigModelsMigrationJob
    )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

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

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'LEGACY FEATURE FLAG CONFIG MODEL COUNT: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'WEB FEATURE FLAG CONFIG MODEL COUNT: 0.'
                ),
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
            config_models.WebFeatureFlagConfigModel.get(
                'feature_flag_b', strict=False
            )
        )
