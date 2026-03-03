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

"""Unit tests for firebase_validation_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import firebase_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.platform.auth import firebase_auth_services_test

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


class FirebaseAuditRecordsJobTests(
    job_test_utils.JobTestBase,
    firebase_auth_services_test.FirebaseAuthServicesTestBase,
):

    JOB_CLASS = firebase_validation_jobs.FirebaseAuditRecordsJob

    def test_run_with_no_data_produces_no_output(self) -> None:
        self.assert_job_output_is_empty()

    def test_run_with_matching_records_reports_correct(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='fb_a', email='a@a.com', disabled=False
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

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='CORRECT: 1')],
        )

    def test_run_with_missing_firebase_record_reports_corrupt(self) -> None:
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

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'FIXABLE: Oppia user (user_id=\'uid_a\') linked to '
                        'non-existent Firebase record (firebase_id=\'fb_a\')'
                    )
                ),
            ],
        )

    def test_run_with_extra_firebase_record_reports_corrupt(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='fb_a', email='a@a.com', disabled=False
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'FIXABLE: Firebase record (firebase_id=\'fb_a\') '
                        'linked to non-existent Oppia user'
                    )
                ),
            ],
        )

    def test_run_with_duplicate_oppia_emails_reports_collision(self) -> None:
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
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id='uid_b',
                    firebase_auth_id='fb_b',
                ),
                self.create_model(
                    user_models.UserSettingsModel,
                    id='uid_b',
                    email='a@a.com',
                ),
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'CORRUPT: OPPIA USERS '
                        '(user_ids=[\'uid_a\', \'uid_b\']) ARE USING THE SAME '
                        'EMAIL! A server admin must manually resolve these '
                        'collisions by giving each user a UNIQUE email.'
                    )
                ),
            ],
        )

    def test_run_with_duplicate_firebase_emails_reports_collision(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='fb_a', email='a@a.com', disabled=False
        )
        self.firebase_sdk_stub.create_user(
            uid='fb_b', email='a@a.com', disabled=False
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'FIXABLE: Firebase records share email: '
                        'firebase_ids=[\'fb_a\', \'fb_b\']'
                    )
                ),
            ],
        )

    def test_run_with_mismatched_disabled_reports_detailed_corrupt(
        self,
    ) -> None:
        self.firebase_sdk_stub.create_user(
            uid='fb_a', email='a@a.com', disabled=True
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

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'FIXABLE: Oppia user (user_id=\'uid_a\') is '
                        'inconsistent with its Firebase record '
                        '(firebase_id=\'fb_a\'): \'disabled\' is False in '
                        'Oppia but True in Firebase'
                    )
                ),
            ],
        )

    def test_run_with_collision_skips_difference_checks(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='fb_a', email='a@a.com', disabled=False
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
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id='uid_b',
                    firebase_auth_id='fb_b',
                ),
                self.create_model(
                    user_models.UserSettingsModel,
                    id='uid_b',
                    email='a@a.com',
                ),
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'CORRUPT: OPPIA USERS '
                        '(user_ids=[\'uid_a\', \'uid_b\']) ARE USING THE SAME '
                        'EMAIL! A server admin must manually resolve these '
                        'collisions by giving each user a UNIQUE email.'
                    )
                ),
            ],
        )

    def test_run_with_both_oppia_and_firebase_collisions_reports_both_corrupt(
        self,
    ) -> None:
        self.firebase_sdk_stub.create_user(
            uid='fb_a', email='a@a.com', disabled=False
        )
        self.firebase_sdk_stub.create_user(
            uid='fb_b', email='a@a.com', disabled=False
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
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id='uid_b',
                    firebase_auth_id='fb_b',
                ),
                self.create_model(
                    user_models.UserSettingsModel,
                    id='uid_b',
                    email='a@a.com',
                ),
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'FIXABLE: Firebase records share email: '
                        'firebase_ids=[\'fb_a\', \'fb_b\']'
                    )
                ),
                job_run_result.JobRunResult(
                    stderr=(
                        'CORRUPT: OPPIA USERS '
                        '(user_ids=[\'uid_a\', \'uid_b\']) ARE USING THE SAME '
                        'EMAIL! A server admin must manually resolve these '
                        'collisions by giving each user a UNIQUE email.'
                    )
                ),
            ],
        )

    def test_run_with_multi_field_mismatch_reports_all_differences(
        self,
    ) -> None:
        self.firebase_sdk_stub.create_user(
            uid='fb_x', email='a@a.com', disabled=True
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

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'FIXABLE: Oppia user (user_id=\'uid_a\') is '
                        'inconsistent with its Firebase record '
                        '(firebase_id=\'fb_x\'): \'auth_id\' is \'fb_a\' in '
                        'Oppia but \'fb_x\' in Firebase, \'disabled\' is False '
                        'in Oppia but True in Firebase'
                    )
                ),
            ],
        )

    def test_run_with_mixed_outcomes_reports_correct_and_corrupt(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='fb_a', email='a@a.com', disabled=False
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
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id='uid_b',
                    firebase_auth_id='fb_b',
                ),
                self.create_model(
                    user_models.UserSettingsModel,
                    id='uid_b',
                    email='b@b.com',
                ),
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(stdout='CORRECT: 1'),
                job_run_result.JobRunResult(
                    stderr=(
                        'FIXABLE: Oppia user (user_id=\'uid_b\') linked to '
                        'non-existent Firebase record (firebase_id=\'fb_b\')'
                    )
                ),
            ],
        )

    def test_run_with_disabled_records_matching_reports_correct(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='fb_a', email='a@a.com', disabled=True
        )
        self.put_multi(
            [
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id='uid_a',
                    firebase_auth_id='fb_a',
                    deleted=True,
                ),
                self.create_model(
                    user_models.UserSettingsModel,
                    id='uid_a',
                    email='a@a.com',
                    deleted=True,
                ),
            ]
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='CORRECT: 1')],
        )

    def test_run_with_multiple_emails_reports_each(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='fb_a', email='a@a.com', disabled=False
        )
        self.firebase_sdk_stub.create_user(
            uid='fb_b', email='b@b.com', disabled=False
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
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id='uid_b',
                    firebase_auth_id='fb_b',
                ),
                self.create_model(
                    user_models.UserSettingsModel,
                    id='uid_b',
                    email='b@b.com',
                ),
            ]
        )

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='CORRECT: 2')],
        )
