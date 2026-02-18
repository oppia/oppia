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

"""Unit tests for firebase_sync_jobs."""

from __future__ import annotations

from core.domain import feature_flag_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import firebase_sync_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.platform.auth import firebase_auth_services_test

from firebase_admin import auth as firebase_auth
from firebase_admin import exceptions as firebase_exceptions

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


class FirebaseSyncRecordsJobTests(
    job_test_utils.JobTestBase,
    firebase_auth_services_test.FirebaseAuthServicesTestBase,
):

    JOB_CLASS = firebase_sync_jobs.FirebaseSyncRecordsJob

    def test_run_with_no_data_produces_no_output(self) -> None:
        self.assert_job_output_is_empty()

    def test_run_with_prod_server_mode_raises_permission_error(self) -> None:
        with (
            self.swap_to_always_return(
                feature_flag_domain,
                'get_server_mode',
                feature_flag_domain.ServerMode.PROD,
            ),
            self.assertRaisesRegex(
                PermissionError, 'must never be run in production'
            ),
        ):
            self.assert_job_output_is_empty()

    def test_run_with_existing_data_deletes_and_imports_records(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='old_fb', email='old@old.com', disabled=False
        )

        old_user = self.firebase_sdk_stub.get_user('old_fb')
        self.assertEqual(old_user.uid, 'old_fb')
        self.assertEqual(old_user.email, 'old@old.com')
        self.assertFalse(old_user.disabled)

        with self.assertRaisesRegex(
            firebase_auth.UserNotFoundError, 'not found'
        ):
            self.firebase_sdk_stub.get_user('new_fb')

        self.put_multi(
            [
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id='uid_a',
                    firebase_auth_id='new_fb',
                ),
                self.create_model(
                    user_models.UserSettingsModel,
                    id='uid_a',
                    email='new@new.com',
                ),
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(stdout='delete_users success: 1'),
                job_run_result.JobRunResult(stdout='import_users success: 1'),
            ],
        )

        with self.assertRaisesRegex(
            firebase_auth.UserNotFoundError, 'not found'
        ):
            self.firebase_sdk_stub.get_user('old_fb')

        new_user = self.firebase_sdk_stub.get_user('new_fb')
        self.assertEqual(new_user.uid, 'new_fb')
        self.assertEqual(new_user.email, 'new@new.com')
        self.assertFalse(new_user.disabled)

    def test_run_with_delete_failure_reports_error(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='fb1', email='a@a.com', disabled=False
        )

        error = firebase_exceptions.InternalError('service down')
        with self.firebase_sdk_stub.mock_delete_users_error(
            batch_error_pattern=(error,)
        ):
            self.assert_job_output_is(
                [
                    job_run_result.JobRunResult(
                        stderr='delete_users error at slice=[0:1]: service down'
                    ),
                ],
            )
