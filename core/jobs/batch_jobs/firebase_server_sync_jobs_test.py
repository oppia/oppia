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

from core.jobs import job_test_utils
from core.jobs.batch_jobs import firebase_server_sync_jobs
from core.jobs.types import firebase_domain, job_run_result
from core.platform import models
from core.platform.auth import firebase_auth_services_test

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


class AuditFirebaseServerSyncJobTests(FirebaseServerSyncJobTestBase):
    JOB_CLASS = firebase_server_sync_jobs.AuditFirebaseServerSyncJob

    def test_empty_storage_produces_no_output(self) -> None:
        self.assert_job_output_is_empty()

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

    def test_user_missing_from_firebase_is_reported_not_created(self) -> None:
        self.create_oppia_user(
            user_id='uid_b', firebase_auth_id='aid_b', email='b@b.com'
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('WOULD CREATE SUCCESS: 1')]
        )

        self.firebase_sdk_stub.assert_is_not_user('aid_b')

    def test_user_missing_from_oppia_is_reported_not_deleted(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='aid_c', email='c@c.com', disabled=False
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('WOULD DELETE SUCCESS: 1')]
        )

        self.firebase_sdk_stub.assert_is_user('aid_c')

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

    def test_duplicate_email_is_reported_as_corrupt(self) -> None:
        duplicate_email = 'dup@dup.com'
        record_x = firebase_domain.FirebaseRecord(
            auth_id='aid_x', email=duplicate_email, disabled=False
        )
        record_y = firebase_domain.FirebaseRecord(
            auth_id='aid_y', email=duplicate_email, disabled=False
        )
        self.create_oppia_user(
            user_id='uid_x',
            firebase_auth_id=record_x.auth_id,
            email=duplicate_email,
        )
        self.create_oppia_user(
            user_id='uid_y',
            firebase_auth_id=record_y.auth_id,
            email=duplicate_email,
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'EMAIL_CONFLICT: Oppia users '
                        '(user_ids=[\'uid_x\', \'uid_y\']) are sharing the'
                        ' same email'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'WOULD CREATE SUCCESS: 2'
                ),
            ]
        )

    def test_duplicate_auth_id_is_reported_as_corrupt(self) -> None:
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
                        'AUTH_ID_CONFLICT: Oppia users '
                        '(user_ids=[\'uid_x\', \'uid_y\']) are sharing the'
                        ' same Firebase account (auth_id=\'aid_shared\')'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'WOULD CREATE SUCCESS: 2'
                ),
            ]
        )
