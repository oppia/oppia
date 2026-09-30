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

"""Tests for web_platform_parameter_config_migration_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import web_platform_parameter_config_migration_jobs
from core.jobs.types import job_run_result
from core.storage.config import gae_models as config_models

from typing import Type


class MigrateWebPlatformParameterConfigJobTests(job_test_utils.JobTestBase):
    """Tests for MigrateWebPlatformParameterConfigJob."""

    JOB_CLASS: Type[
        web_platform_parameter_config_migration_jobs.MigrateWebPlatformParameterConfigJob
    ] = (
        web_platform_parameter_config_migration_jobs.MigrateWebPlatformParameterConfigJob
    )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_migrates_legacy_model(self) -> None:
        legacy_model = config_models.PlatformParameterModel.create(
            param_name='parameter_name',
            rule_dicts=[{'filters': [], 'value_when_matched': False}],
            rule_schema_version=1,
            default_value=False,
        )
        legacy_model.update_timestamps()
        self.put_multi([legacy_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED WEB PLATFORM PARAMETER CONFIG MODEL COUNT: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED WEB PLATFORM PARAMETER CONFIG MODEL: '
                    'parameter_name.'
                ),
            ]
        )

        migrated_model = config_models.WebPlatformParameterConfigModel.get(
            'parameter_name'
        )
        self.assertIsNotNone(migrated_model)
        self.assertEqual(migrated_model.version, legacy_model.version)
        self.assertEqual(
            migrated_model.rules,
            [{'filters': [], 'value_when_matched': False}],
        )
        self.assertEqual(migrated_model.rule_schema_version, 1)
        self.assertFalse(migrated_model.default_value)
        self.assertIsNone(
            config_models.PlatformParameterModel.get(
                'parameter_name', strict=False
            )
        )

    def test_migrates_legacy_version_history(self) -> None:
        legacy_model = config_models.PlatformParameterModel.create(
            param_name='parameter_name',
            rule_dicts=[{'filters': [], 'value_when_matched': False}],
            rule_schema_version=1,
            default_value=False,
        )
        legacy_model.commit('committer_id', 'initial', [])
        legacy_model.rules = [{'filters': [], 'value_when_matched': True}]
        legacy_model.commit('committer_id', 'update', [])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED WEB PLATFORM PARAMETER CONFIG MODEL COUNT: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED WEB PLATFORM PARAMETER CONFIG MODEL: '
                    'parameter_name.'
                ),
            ]
        )

        migrated_model = config_models.WebPlatformParameterConfigModel.get(
            'parameter_name'
        )
        self.assertIsNotNone(migrated_model)
        self.assertEqual(migrated_model.version, 2)
        first_version = (
            config_models.WebPlatformParameterConfigModel.get_version(
                'parameter_name', 1
            )
        )
        self.assertIsNotNone(first_version)
        self.assertEqual(
            first_version.rules,
            [{'filters': [], 'value_when_matched': False}],
        )


class AuditMigrateWebPlatformParameterConfigJobTests(
    job_test_utils.JobTestBase
):
    """Tests for AuditMigrateWebPlatformParameterConfigJob."""

    JOB_CLASS: Type[
        web_platform_parameter_config_migration_jobs.AuditMigrateWebPlatformParameterConfigJob
    ] = (
        web_platform_parameter_config_migration_jobs.AuditMigrateWebPlatformParameterConfigJob
    )

    def test_audit_job_does_not_mutate_storage(self) -> None:
        legacy_model = config_models.PlatformParameterModel.create(
            param_name='parameter_name',
            rule_dicts=[{'filters': [], 'value_when_matched': False}],
            rule_schema_version=1,
            default_value=False,
        )
        legacy_model.update_timestamps()
        self.put_multi([legacy_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED WEB PLATFORM PARAMETER CONFIG MODEL COUNT: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED WEB PLATFORM PARAMETER CONFIG MODEL: '
                    'parameter_name.'
                ),
            ]
        )

        self.assertIsNotNone(
            config_models.PlatformParameterModel.get('parameter_name')
        )
        self.assertIsNone(
            config_models.WebPlatformParameterConfigModel.get(
                'parameter_name', strict=False
            )
        )
