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

from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import firebase_sync_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.platform.auth import firebase_auth_services_test

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

    def test_run_with_existing_data_deletes_and_reimports_records(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='old_fb', email='old@old.com', disabled=False
        )

        self.put_multi(
            [
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id='uid_a',
                    firebase_auth_id='fb_a',
                ),
                self.create_model(
                    user_models.UserSettingsModel,
                    id='uid_a',
                    email='a@a.com',
                ),
            ]
        )

        with self.swap(constants, 'EMULATOR_MODE', False):
            self.assert_job_output_is(
                [
                    job_run_result.JobRunResult(stdout='DELETE OK: 1'),
                    job_run_result.JobRunResult(stdout='IMPORT OK: 1'),
                ],
            )
