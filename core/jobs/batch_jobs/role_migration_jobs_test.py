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

"""Unit tests for jobs.batch_jobs.role_migration_jobs."""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import role_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class MigrateWebReleaseCoordinatorRoleJobTests(job_test_utils.JobTestBase):
    """Tests for MigrateWebReleaseCoordinatorRoleJob."""

    JOB_CLASS: Type[role_migration_jobs.MigrateWebReleaseCoordinatorRoleJob] = (
        role_migration_jobs.MigrateWebReleaseCoordinatorRoleJob
    )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_migrates_legacy_role_and_preserves_other_roles(self) -> None:
        legacy_user = self.create_model(
            user_models.UserSettingsModel,
            id='legacy_user',
            email='legacy@example.com',
            role=feconf.ROLE_ID_RELEASE_COORDINATOR,
        )
        android_user = self.create_model(
            user_models.UserSettingsModel,
            id='android_user',
            email='android@example.com',
            role=feconf.ROLE_ID_ANDROID_RELEASE_COORDINATOR,
        )
        self.put_multi([legacy_user, android_user])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Migrated release coordinator role: '
                        'user_id=legacy_user'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout='migrated_web_release_coordinator_role_count: 1'
                ),
            ]
        )

        migrated_user = user_models.UserSettingsModel.get_by_id('legacy_user')
        self.assertIsNotNone(migrated_user)
        assert migrated_user is not None
        self.assertEqual(
            migrated_user.role, feconf.ROLE_ID_WEB_RELEASE_COORDINATOR
        )

        unchanged_user = user_models.UserSettingsModel.get_by_id('android_user')
        self.assertIsNotNone(unchanged_user)
        assert unchanged_user is not None
        self.assertEqual(
            unchanged_user.role, feconf.ROLE_ID_ANDROID_RELEASE_COORDINATOR
        )


class AuditWebReleaseCoordinatorRoleJobTests(job_test_utils.JobTestBase):
    """Tests for AuditWebReleaseCoordinatorRoleJob."""

    JOB_CLASS: Type[role_migration_jobs.AuditWebReleaseCoordinatorRoleJob] = (
        role_migration_jobs.AuditWebReleaseCoordinatorRoleJob
    )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_audits_legacy_role_without_migrating(self) -> None:
        user = self.create_model(
            user_models.UserSettingsModel,
            id='legacy_user',
            email='legacy@example.com',
            role=feconf.ROLE_ID_RELEASE_COORDINATOR,
        )
        self.put_multi([user])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'User has legacy release coordinator role: '
                        'user_id=legacy_user'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout=(
                        'users_with_legacy_release_coordinator_role_count: 1'
                    )
                ),
            ]
        )

        unchanged_user = user_models.UserSettingsModel.get_by_id('legacy_user')
        self.assertIsNotNone(unchanged_user)
        assert unchanged_user is not None
        self.assertEqual(
            unchanged_user.role, feconf.ROLE_ID_RELEASE_COORDINATOR
        )
