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

"""Unit tests for jobs.batch_jobs.firebase_server_sync_jobs."""

from __future__ import annotations

from unittest import mock

from core.domain import feature_flag_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import firebase_server_sync_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.platform.auth import (
    firebase_auth_services,
    firebase_auth_services_test,
)

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


class FirebaseServerSyncJobTestBase(
    job_test_utils.JobTestBase,
    firebase_auth_services_test.FirebaseAuthServicesTestBase,
):
    """Shared setup helpers for the Firebase server sync jobs."""

    def setUp(self) -> None:
        super().setUp()
        patcher = mock.patch.object(
            firebase_auth_services, 'establish_firebase_connection'
        )
        self.establish_firebase_connection_mock = patcher.start()
        self.addCleanup(patcher.stop)

    def create_oppia_user(
        self,
        user_id: str,
        firebase_auth_id: str | None,
        email: str,
        deleted: bool = False,
        parent_user_id: str | None = None,
    ) -> None:
        """Writes the UserAuthDetailsModel and UserSettingsModel pair of a user.

        Args:
            user_id: str. The Oppia user ID shared by both models.
            firebase_auth_id: str | None. The Firebase UID for the user.
            email: str. The user's email address.
            deleted: bool. Whether both models are soft-deleted.
            parent_user_id: str | None. The parent user ID; use this to make the
                user a profile user (which should be intentionally ignored).
        """
        self.put_multi(
            [
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id=user_id,
                    firebase_auth_id=firebase_auth_id,
                    parent_user_id=parent_user_id,
                    deleted=deleted,
                ),
                self.create_model(
                    user_models.UserSettingsModel,
                    id=user_id,
                    email=email,
                    deleted=deleted,
                ),
            ]
        )


class FirebaseServerSyncJobTests(FirebaseServerSyncJobTestBase):
    JOB_CLASS = firebase_server_sync_jobs.FirebaseServerSyncJob

    def test_prod_mode_job_raises_permission_error(self) -> None:
        with (
            self.swap_to_always_return(
                feature_flag_domain,
                'get_server_mode',
                feature_flag_domain.ServerMode.PROD,
            ),
            self.assertRaisesRegex(PermissionError, 'Refusing to mutate prod'),
        ):
            self.assert_job_output_is_empty()

    def test_empty_storage_produces_no_output(self) -> None:
        self.assert_job_output_is_empty()

    def test_in_sync_user_is_left_unchanged(self) -> None:
        self.create_oppia_user(
            user_id='uid_a', firebase_auth_id='aid_a', email='a@a.com'
        )
        self.firebase_sdk_stub.create_user(
            uid='aid_a', email='a@a.com', disabled=False
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('OK: 1')]
        )
        self.firebase_sdk_stub.assert_is_user('aid_a')

    def test_user_missing_from_firebase_is_created(self) -> None:
        self.create_oppia_user(
            user_id='uid_b', firebase_auth_id='aid_b', email='b@b.com'
        )
        self.firebase_sdk_stub.assert_is_not_user('aid_b')

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='CREATE OK: 1')]
        )
        self.firebase_sdk_stub.assert_is_user('aid_b')

    def test_user_missing_from_oppia_is_deleted(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='aid_c', email='c@c.com', disabled=False
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='DELETE OK: 1')]
        )
        self.firebase_sdk_stub.assert_is_not_user('aid_c')

    def test_deleted_oppia_user_in_sync_with_disabled_firebase_user(
        self,
    ) -> None:
        self.create_oppia_user(
            user_id='uid_d',
            firebase_auth_id='aid_d',
            email='d@d.com',
            deleted=True,
        )
        self.firebase_sdk_stub.create_user(
            uid='aid_d', email='d@d.com', disabled=True
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('OK: 1')]
        )
        self.firebase_sdk_stub.assert_is_user('aid_d')
        self.firebase_sdk_stub.assert_is_disabled('aid_d')

    def test_profile_users_are_ignored(self) -> None:
        self.create_oppia_user(
            user_id='uid_a', firebase_auth_id='aid_a', email='a@a.com'
        )
        self.firebase_sdk_stub.create_user(
            uid='aid_a', email='a@a.com', disabled=False
        )
        self.create_oppia_user(
            user_id='uid_p',
            firebase_auth_id=None,
            email='p@p.com',
            parent_user_id='uid_a',
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('OK: 1')]
        )

    def test_mixed_diff_applies_every_change(self) -> None:
        self.create_oppia_user(
            user_id='uid_a', firebase_auth_id='aid_a', email='a@a.com'
        )
        self.firebase_sdk_stub.create_user(
            uid='aid_a', email='a@a.com', disabled=False
        )

        self.create_oppia_user(
            user_id='uid_b', firebase_auth_id='aid_b', email='b@b.com'
        )

        self.firebase_sdk_stub.create_user(
            uid='aid_c', email='c@c.com', disabled=False
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout('OK: 1'),
                job_run_result.JobRunResult(stdout='CREATE OK: 1'),
                job_run_result.JobRunResult(stdout='DELETE OK: 1'),
            ]
        )
        self.firebase_sdk_stub.assert_is_user('aid_a')
        self.firebase_sdk_stub.assert_is_user('aid_b')
        self.firebase_sdk_stub.assert_is_not_user('aid_c')

    def test_oppia_email_collision_aborts_writes(self) -> None:
        duplicate_email = 'dup@dup.com'
        self.create_oppia_user(
            user_id='uid_x', firebase_auth_id='aid_x', email=duplicate_email
        )
        self.create_oppia_user(
            user_id='uid_y', firebase_auth_id='aid_y', email=duplicate_email
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'OPPIA_USER_COLLISION: Oppia users '
                        '(user_ids=[\'uid_x\', \'uid_y\']) are sharing the'
                        ' same email'
                    )
                ),
            ]
        )
        self.firebase_sdk_stub.assert_is_not_user('aid_x')
        self.firebase_sdk_stub.assert_is_not_user('aid_y')

    def test_oppia_collision_blocks_unrelated_valid_write(self) -> None:
        self.create_oppia_user(
            user_id='uid_b', firebase_auth_id='aid_b', email='b@b.com'
        )

        duplicate_email = 'dup@dup.com'
        self.create_oppia_user(
            user_id='uid_x', firebase_auth_id='aid_x', email=duplicate_email
        )
        self.create_oppia_user(
            user_id='uid_y', firebase_auth_id='aid_y', email=duplicate_email
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'OPPIA_USER_COLLISION: Oppia users '
                        '(user_ids=[\'uid_x\', \'uid_y\']) are sharing the'
                        ' same email'
                    )
                ),
            ]
        )
        self.firebase_sdk_stub.assert_is_not_user('aid_b')

    def test_firebase_account_collision_still_deletes(self) -> None:
        duplicate_email = 'dup@dup.com'
        self.firebase_sdk_stub.create_user(
            uid='aid_1', email=duplicate_email, disabled=False
        )
        self.firebase_sdk_stub.create_user(
            uid='aid_2', email=duplicate_email, disabled=False
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'FIREBASE_ACCOUNT_COLLISION: Firebase accounts '
                        '(auth_ids=[\'aid_1\', \'aid_2\']) are sharing the'
                        ' same email'
                    )
                ),
                job_run_result.JobRunResult(stdout='DELETE OK: 2'),
            ]
        )
        self.firebase_sdk_stub.assert_is_not_user('aid_1')
        self.firebase_sdk_stub.assert_is_not_user('aid_2')


class AuditFirebaseServerSyncJobTests(FirebaseServerSyncJobTestBase):
    JOB_CLASS = firebase_server_sync_jobs.AuditFirebaseServerSyncJob

    def test_prod_mode_job_is_ok(self) -> None:
        with self.swap_to_always_return(
            feature_flag_domain,
            'get_server_mode',
            feature_flag_domain.ServerMode.PROD,
        ):
            self.assert_job_output_is_empty()

    def test_empty_storage_produces_no_output(self) -> None:
        self.assert_job_output_is_empty()
        self.establish_firebase_connection_mock.assert_called_once()

    def test_in_sync_user_is_reported(self) -> None:
        self.create_oppia_user(
            user_id='uid_a', firebase_auth_id='aid_a', email='a@a.com'
        )
        self.firebase_sdk_stub.create_user(
            uid='aid_a', email='a@a.com', disabled=False
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('OK: 1')]
        )
        self.firebase_sdk_stub.assert_is_user('aid_a')
        self.establish_firebase_connection_mock.assert_called_once()

    def test_user_missing_from_firebase_is_reported_not_created(self) -> None:
        self.create_oppia_user(
            user_id='uid_b', firebase_auth_id='aid_b', email='b@b.com'
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('WOULD CREATE SUCCESS: 1')]
        )

        self.firebase_sdk_stub.assert_is_not_user('aid_b')
        self.establish_firebase_connection_mock.assert_called_once()

    def test_user_missing_from_oppia_is_reported_not_deleted(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='aid_c', email='c@c.com', disabled=False
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('WOULD DELETE SUCCESS: 1')]
        )

        self.firebase_sdk_stub.assert_is_user('aid_c')
        self.establish_firebase_connection_mock.assert_called_once()

    def test_mixed_diff_reports_counts_without_mutating(self) -> None:
        self.create_oppia_user(
            user_id='uid_a', firebase_auth_id='aid_a', email='a@a.com'
        )
        self.firebase_sdk_stub.create_user(
            uid='aid_a', email='a@a.com', disabled=False
        )
        self.create_oppia_user(
            user_id='uid_b', firebase_auth_id='aid_b', email='b@b.com'
        )
        self.firebase_sdk_stub.create_user(
            uid='aid_c', email='c@c.com', disabled=False
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout('OK: 1'),
                job_run_result.JobRunResult.as_stdout(
                    'WOULD CREATE SUCCESS: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'WOULD DELETE SUCCESS: 1'
                ),
            ]
        )
        self.firebase_sdk_stub.assert_is_user('aid_a')
        self.firebase_sdk_stub.assert_is_not_user('aid_b')
        self.firebase_sdk_stub.assert_is_user('aid_c')
        self.establish_firebase_connection_mock.assert_called_once()

    def test_oppia_email_collision_would_abort_writes(self) -> None:
        duplicate_email = 'dup@dup.com'
        self.create_oppia_user(
            user_id='uid_x', firebase_auth_id='aid_x', email=duplicate_email
        )
        self.create_oppia_user(
            user_id='uid_y', firebase_auth_id='aid_y', email=duplicate_email
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'OPPIA_USER_COLLISION: Oppia users '
                        '(user_ids=[\'uid_x\', \'uid_y\']) are sharing the'
                        ' same email'
                    )
                ),
            ]
        )
        self.establish_firebase_connection_mock.assert_called_once()

    def test_oppia_auth_id_collision_would_abort_writes(self) -> None:
        shared_auth_id = 'aid_shared'
        self.create_oppia_user(
            user_id='uid_x', firebase_auth_id=shared_auth_id, email='x@x.com'
        )
        self.create_oppia_user(
            user_id='uid_y', firebase_auth_id=shared_auth_id, email='y@y.com'
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'OPPIA_USER_COLLISION: Oppia users '
                        '(user_ids=[\'uid_x\', \'uid_y\']) are sharing the'
                        ' same Firebase account (auth_id=\'aid_shared\')'
                    )
                ),
            ]
        )
        self.establish_firebase_connection_mock.assert_called_once()

    def test_firebase_account_collision_does_not_abort_writes(self) -> None:
        duplicate_email = 'dup@dup.com'
        self.firebase_sdk_stub.create_user(
            uid='aid_1', email=duplicate_email, disabled=False
        )
        self.firebase_sdk_stub.create_user(
            uid='aid_2', email=duplicate_email, disabled=False
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'FIREBASE_ACCOUNT_COLLISION: Firebase accounts '
                        '(auth_ids=[\'aid_1\', \'aid_2\']) are sharing the'
                        ' same email'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'WOULD DELETE SUCCESS: 2'
                ),
            ]
        )
        self.establish_firebase_connection_mock.assert_called_once()
