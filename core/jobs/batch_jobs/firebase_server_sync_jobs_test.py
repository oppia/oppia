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
        # The sync jobs read from and write to Firebase, so mock out the
        # connection to avoid establishing a real one during testing.
        establish_connection_patcher = mock.patch.object(
            firebase_auth_services, 'establish_firebase_connection'
        )
        self.establish_firebase_connection_mock = (
            establish_connection_patcher.start()
        )
        self.addCleanup(establish_connection_patcher.stop)

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

    def test_empty_storage_produces_no_output(self) -> None:
        self.assert_job_output_is_empty()
        # Syncing makes one connection each to read, create, and delete records.
        self.assertEqual(self.establish_firebase_connection_mock.call_count, 3)

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
        # Syncing makes one connection each to read, create, and delete records.
        self.assertEqual(self.establish_firebase_connection_mock.call_count, 3)

    def test_user_missing_from_firebase_is_created(self) -> None:
        self.create_oppia_user(
            user_id='uid_b', firebase_auth_id='aid_b', email='b@b.com'
        )
        self.firebase_sdk_stub.assert_is_not_user('aid_b')

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='CREATE OK: 1')]
        )
        self.firebase_sdk_stub.assert_is_user('aid_b')
        # Syncing makes one connection each to read, create, and delete records.
        self.assertEqual(self.establish_firebase_connection_mock.call_count, 3)

    def test_user_missing_from_oppia_is_deleted(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='aid_c', email='c@c.com', disabled=False
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='DELETE OK: 1')]
        )
        self.firebase_sdk_stub.assert_is_not_user('aid_c')
        # Syncing makes one connection each to read, create, and delete records.
        self.assertEqual(self.establish_firebase_connection_mock.call_count, 3)

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
        # Syncing makes one connection each to read, create, and delete records.
        self.assertEqual(self.establish_firebase_connection_mock.call_count, 3)

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
        # Syncing makes one connection each to read, create, and delete records.
        self.assertEqual(self.establish_firebase_connection_mock.call_count, 3)

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
        # Syncing makes one connection each to read, create, and delete records.
        self.assertEqual(self.establish_firebase_connection_mock.call_count, 3)

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
                job_run_result.JobRunResult.as_stderr(
                    'WRITES ABORTED: 1 Oppia user collision(s) detected'
                ),
            ]
        )
        # The collision blocks all writes, so neither ambiguous account is
        # created.
        self.firebase_sdk_stub.assert_is_not_user('aid_x')
        self.firebase_sdk_stub.assert_is_not_user('aid_y')
        # Syncing makes one connection each to read, create, and delete records.
        self.assertEqual(self.establish_firebase_connection_mock.call_count, 3)

    def test_oppia_collision_blocks_unrelated_valid_write(self) -> None:
        # A valid user that would normally be created on its own...
        self.create_oppia_user(
            user_id='uid_b', firebase_auth_id='aid_b', email='b@b.com'
        )
        # ...is still NOT created while an unrelated Oppia collision exists,
        # because the gate is global.
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
                job_run_result.JobRunResult.as_stderr(
                    'WRITES ABORTED: 1 Oppia user collision(s) detected'
                ),
            ]
        )
        self.firebase_sdk_stub.assert_is_not_user('aid_b')
        # Syncing makes one connection each to read, create, and delete records.
        self.assertEqual(self.establish_firebase_connection_mock.call_count, 3)

    def test_firebase_account_collision_still_deletes(self) -> None:
        # Two Firebase accounts share an email but neither exists in Oppia. This
        # Firebase-side collision is resolved by ordinary deletes, so writes are
        # NOT aborted.
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
        # Syncing makes one connection each to read, create, and delete records.
        self.assertEqual(self.establish_firebase_connection_mock.call_count, 3)


class AuditFirebaseServerSyncJobTests(FirebaseServerSyncJobTestBase):
    JOB_CLASS = firebase_server_sync_jobs.AuditFirebaseServerSyncJob

    def test_empty_storage_produces_no_output(self) -> None:
        self.assert_job_output_is_empty()
        # The dry-run audit only reads from Firebase, so exactly one connection
        # is made (and nothing is written).
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
        # The dry-run audit only reads from Firebase, so exactly one connection
        # is made (and nothing is written).
        self.establish_firebase_connection_mock.assert_called_once()

    def test_user_missing_from_firebase_is_reported_not_created(self) -> None:
        self.create_oppia_user(
            user_id='uid_b', firebase_auth_id='aid_b', email='b@b.com'
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('WOULD CREATE SUCCESS: 1')]
        )

        self.firebase_sdk_stub.assert_is_not_user('aid_b')
        # The dry-run audit only reads from Firebase, so exactly one connection
        # is made (and nothing is written).
        self.establish_firebase_connection_mock.assert_called_once()

    def test_user_missing_from_oppia_is_reported_not_deleted(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='aid_c', email='c@c.com', disabled=False
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('WOULD DELETE SUCCESS: 1')]
        )

        self.firebase_sdk_stub.assert_is_user('aid_c')
        # The dry-run audit only reads from Firebase, so exactly one connection
        # is made (and nothing is written).
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
        # The dry-run audit only reads from Firebase, so exactly one connection
        # is made (and nothing is written).
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
                job_run_result.JobRunResult.as_stderr(
                    'WOULD ABORT WRITES: 1 Oppia user collision(s) detected'
                ),
            ]
        )
        # The dry-run audit only reads from Firebase, so exactly one connection
        # is made (and nothing is written).
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
                job_run_result.JobRunResult.as_stderr(
                    'WOULD ABORT WRITES: 1 Oppia user collision(s) detected'
                ),
            ]
        )
        # The dry-run audit only reads from Firebase, so exactly one connection
        # is made (and nothing is written).
        self.establish_firebase_connection_mock.assert_called_once()

    def test_firebase_account_collision_does_not_abort_writes(self) -> None:
        # Two Firebase accounts share an email but neither exists in Oppia. This
        # is a Firebase-side collision, which the diff resolves with ordinary
        # deletes, so it must NOT abort the writes.
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
        # The dry-run audit only reads from Firebase, so exactly one connection
        # is made (and nothing is written).
        self.establish_firebase_connection_mock.assert_called_once()
