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

"""Unit tests for jobs.io.firebase_io."""

from __future__ import annotations

from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.io import firebase_io
from core.jobs.types import firebase_adapters, job_run_result
from core.platform import models
from core.platform.auth import firebase_auth_services_test
from core.tests import test_utils

import apache_beam as beam
import firebase_admin.auth as firebase_auth
import firebase_admin.exceptions as firebase_exceptions

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


class AuthIoTestBase(
    job_test_utils.JobTestBase,
    firebase_auth_services_test.FirebaseAuthServicesTestBase,
):
    """Base class for firebase_io tests."""

    pass


class GetStrongRecordsTests(AuthIoTestBase):

    def test_get_with_no_firebase_users_returns_empty(self) -> None:
        self.assert_pcoll_empty(self.pipeline | firebase_io.GetStrongRecords())

    def test_get_with_multiple_firebase_users_returns_all(self) -> None:
        self.firebase_sdk_stub.create_user(
            uid='uid_a', email='a@a.com', disabled=False
        )
        self.firebase_sdk_stub.create_user(
            uid='uid_b', email='b@b.com', disabled=False
        )
        self.firebase_sdk_stub.create_user(
            uid='uid_c', email='c@c.com', disabled=True
        )

        self.assert_pcoll_equal(
            self.pipeline | firebase_io.GetStrongRecords(),
            [
                firebase_adapters.StrongRecord('uid_a', 'a@a.com', False),
                firebase_adapters.StrongRecord('uid_b', 'b@b.com', False),
                firebase_adapters.StrongRecord('uid_c', 'c@c.com', True),
            ],
        )


class GetWeakRecordsTests(AuthIoTestBase):

    def test_get_with_no_oppia_models_returns_empty(self) -> None:
        self.assert_pcoll_empty(self.pipeline | firebase_io.GetWeakRecords())

    def test_get_with_single_model_pair_returns_record(self) -> None:
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

        self.assert_pcoll_equal(
            self.pipeline | firebase_io.GetWeakRecords(),
            [firebase_adapters.WeakRecord('fb_a', 'a@a.com', False, 'uid_a')],
        )

    def test_get_with_deleted_model_returns_disabled_record(self) -> None:
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

        self.assert_pcoll_equal(
            self.pipeline | firebase_io.GetWeakRecords(),
            [firebase_adapters.WeakRecord('fb_a', 'a@a.com', True, 'uid_a')],
        )

    def test_get_with_multiple_model_pairs_returns_all(self) -> None:
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

        self.assert_pcoll_equal(
            self.pipeline | firebase_io.GetWeakRecords(),
            [
                firebase_adapters.WeakRecord('fb_a', 'a@a.com', False, 'uid_a'),
                firebase_adapters.WeakRecord('fb_b', 'b@b.com', False, 'uid_b'),
            ],
        )

    def test_get_with_profile_user_excludes_it(self) -> None:
        self.put_multi(
            [
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id='uid_a',
                    firebase_auth_id='fb_a',
                    parent_user_id=None,
                ),
                self.create_model(
                    user_models.UserSettingsModel,
                    id='uid_a',
                    email='a@a.com',
                ),
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id='uid_b',
                    firebase_auth_id=None,
                    parent_user_id='uid_a',
                ),
                self.create_model(
                    user_models.UserSettingsModel,
                    id='uid_b',
                    email='b@b.com',
                ),
            ]
        )

        self.assert_pcoll_equal(
            self.pipeline | firebase_io.GetWeakRecords(),
            [firebase_adapters.WeakRecord('fb_a', 'a@a.com', False, 'uid_a')],
        )


class BatchFnTests(test_utils.TestBase):

    def test_call_batch_fn_without_override_raises_not_implemented(
        self,
    ) -> None:
        batch_fn = firebase_io.BatchFn()
        with self.assertRaisesRegex(
            NotImplementedError, 'Subclasses must override call_batch_fn'
        ):
            batch_fn.call_batch_fn([])


class ImportRecordsTests(AuthIoTestBase):

    def test_import_with_records_reports_ok(self) -> None:
        imported_records = [
            firebase_adapters.WeakRecord('fb_a', 'a@a.com', False, 'uid_a'),
            firebase_adapters.WeakRecord('fb_b', 'b@b.com', False, 'uid_b'),
            firebase_adapters.WeakRecord('fb_c', 'c@c.com', True, 'uid_c'),
        ]

        with self.swap(constants, 'EMULATOR_MODE', False):
            self.assert_pcoll_equal(
                self.pipeline
                | beam.Create(imported_records)
                | firebase_io.ImportRecords(),
                [job_run_result.JobRunResult(stdout='IMPORT OK: 3')],
            )

    def test_import_with_emulator_mode_reports_ok(self) -> None:
        imported_records = [
            firebase_adapters.WeakRecord('fb_a', 'a@a.com', False, 'uid_a'),
            firebase_adapters.WeakRecord('fb_b', 'b@b.com', False, 'uid_b'),
        ]

        with self.swap(constants, 'EMULATOR_MODE', True):
            self.assert_pcoll_equal(
                self.pipeline
                | beam.Create(imported_records)
                | firebase_io.ImportRecords(),
                [job_run_result.JobRunResult(stdout='IMPORT OK: 2')],
            )

    def test_import_with_batch_failure_reports_error(self) -> None:
        imported_records = [
            firebase_adapters.WeakRecord('fb_a', 'a@a.com', False, 'uid_a'),
        ]

        with (
            self.swap(constants, 'EMULATOR_MODE', False),
            self.firebase_sdk_stub.mock_import_users_error(
                batch_error_pattern=(
                    firebase_exceptions.FirebaseError(
                        message='error', code='E111'
                    ),
                ),
            ),
        ):
            self.assert_pcoll_equal(
                self.pipeline
                | beam.Create(imported_records)
                | firebase_io.ImportRecords(),
                [
                    job_run_result.JobRunResult(
                        stderr='IMPORT ERROR: slice=0:1: error'
                    ),
                ],
            )

    def test_import_with_value_error_reports_error(self) -> None:
        imported_records = [
            firebase_adapters.WeakRecord('fb_a', 'a@a.com', False, 'uid_a'),
        ]

        with (
            self.swap(constants, 'EMULATOR_MODE', False),
            self.swap_to_always_raise(
                firebase_auth, 'import_users', ValueError('invalid records')
            ),
        ):
            self.assert_pcoll_equal(
                self.pipeline
                | beam.Create(imported_records)
                | firebase_io.ImportRecords(),
                [
                    job_run_result.JobRunResult(
                        stderr='IMPORT ERROR: slice=0:1: invalid records'
                    ),
                ],
            )

    def test_import_with_emulator_create_user_value_error_reports_error(
        self,
    ) -> None:
        imported_records = [
            firebase_adapters.WeakRecord('fb_a', 'a@a.com', False, 'uid_a'),
        ]

        with (
            self.swap(constants, 'EMULATOR_MODE', True),
            self.swap_to_always_raise(
                firebase_auth, 'create_user', ValueError('invalid records')
            ),
        ):
            self.assert_pcoll_equal(
                self.pipeline
                | beam.Create(imported_records)
                | firebase_io.ImportRecords(),
                [
                    job_run_result.JobRunResult(
                        stderr='IMPORT ERROR: slice=0:1: invalid records'
                    ),
                ],
            )

    def test_import_with_no_records_produces_no_output(self) -> None:
        with self.swap(constants, 'EMULATOR_MODE', False):
            self.assert_pcoll_empty(
                self.pipeline | beam.Create([]) | firebase_io.ImportRecords(),
            )

    def test_import_with_individual_failure_reports_error(self) -> None:
        imported_records = [
            firebase_adapters.WeakRecord('fb_a', 'a@a.com', False, 'uid_a'),
        ]

        with (
            self.swap(constants, 'EMULATOR_MODE', False),
            self.firebase_sdk_stub.mock_import_users_error(
                individual_error_pattern=('bad record',),
            ),
        ):
            self.assert_pcoll_equal(
                self.pipeline
                | beam.Create(imported_records)
                | firebase_io.ImportRecords(),
                [
                    job_run_result.JobRunResult(
                        stderr='IMPORT ERROR: index=0: bad record'
                    ),
                ],
            )


class DeleteRecordsTests(AuthIoTestBase):

    def test_delete_with_records_reports_ok(self) -> None:
        self.firebase_sdk_stub.create_user(uid='uid_a', email='a@a.com')
        self.firebase_sdk_stub.create_user(uid='uid_b', email='b@b.com')
        self.firebase_sdk_stub.create_user(uid='uid_c', email='c@c.com')

        self.assert_pcoll_equal(
            self.pipeline
            | beam.Create(
                [
                    firebase_adapters.StrongRecord('uid_a', 'a@a.com', False),
                    firebase_adapters.StrongRecord('uid_b', 'b@b.com', False),
                ]
            )
            | firebase_io.DeleteRecords(),
            [job_run_result.JobRunResult(stdout='DELETE OK: 2')],
        )

    def test_delete_with_value_error_reports_error(self) -> None:
        deleted_records = [
            firebase_adapters.StrongRecord('uid_a', 'a@a.com', False),
        ]

        with self.swap_to_always_raise(
            firebase_auth, 'delete_users', ValueError('invalid uids')
        ):
            self.assert_pcoll_equal(
                self.pipeline
                | beam.Create(deleted_records)
                | firebase_io.DeleteRecords(),
                [
                    job_run_result.JobRunResult(
                        stderr='DELETE ERROR: slice=0:1: invalid uids'
                    ),
                ],
            )

    def test_delete_with_no_records_produces_no_output(self) -> None:
        self.assert_pcoll_empty(
            self.pipeline | beam.Create([]) | firebase_io.DeleteRecords(),
        )

    def test_delete_with_batch_failure_reports_error(self) -> None:
        deleted_records = [
            firebase_adapters.StrongRecord('uid_a', 'a@a.com', False),
        ]

        with self.firebase_sdk_stub.mock_delete_users_error(
            batch_error_pattern=(
                firebase_exceptions.FirebaseError(message='error', code='E111'),
            ),
        ):
            self.assert_pcoll_equal(
                self.pipeline
                | beam.Create(deleted_records)
                | firebase_io.DeleteRecords(),
                [
                    job_run_result.JobRunResult(
                        stderr='DELETE ERROR: slice=0:1: error'
                    ),
                ],
            )

    def test_delete_with_individual_failure_reports_error(self) -> None:
        deleted_records = [
            firebase_adapters.StrongRecord('uid_a', 'a@a.com', False),
        ]

        with self.firebase_sdk_stub.mock_delete_users_error(
            individual_error_pattern=('bad uid',),
        ):
            self.assert_pcoll_equal(
                self.pipeline
                | beam.Create(deleted_records)
                | firebase_io.DeleteRecords(),
                [
                    job_run_result.JobRunResult(
                        stderr='DELETE ERROR: index=0: bad uid'
                    ),
                ],
            )
