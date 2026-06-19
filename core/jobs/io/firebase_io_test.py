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

from unittest import mock

from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.io import firebase_io
from core.jobs.types import firebase_domain, job_run_result
from core.platform import models
from core.platform.auth import (
    firebase_auth_services,
    firebase_auth_services_test,
)

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


class FirebaseConnectionTestBase(
    job_test_utils.JobTestBase,
    firebase_auth_services_test.FirebaseAuthServicesTestBase,
):
    """Base class for transforms that connect to Firebase.

    These transforms read from or write to Firebase, so the connection is
    mocked out to avoid establishing a real one during testing.
    """

    def setUp(self) -> None:
        super().setUp()
        establish_connection_patcher = mock.patch.object(
            firebase_auth_services, 'establish_firebase_connection'
        )
        self.establish_firebase_connection_mock = (
            establish_connection_patcher.start()
        )
        self.addCleanup(establish_connection_patcher.stop)


class GetRecordsDirectlyFromFirebaseTests(FirebaseConnectionTestBase):
    def test_get_with_no_firebase_users_returns_empty(self) -> None:
        self.assert_pcoll_empty(
            self.pipeline | firebase_io.GetRecordsDirectlyFromFirebase()
        )
        self.establish_firebase_connection_mock.assert_called_once()

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
            self.pipeline | firebase_io.GetRecordsDirectlyFromFirebase(),
            [
                firebase_domain.FirebaseRecord(
                    auth_id='uid_a', email='a@a.com', disabled=False
                ),
                firebase_domain.FirebaseRecord(
                    auth_id='uid_b', email='b@b.com', disabled=False
                ),
                firebase_domain.FirebaseRecord(
                    auth_id='uid_c', email='c@c.com', disabled=True
                ),
            ],
        )
        self.establish_firebase_connection_mock.assert_called_once()


class RecreateRecordsFromOppiaModelsTests(job_test_utils.JobTestBase):
    def get_tagged_outputs(
        self,
    ) -> tuple[
        beam.PCollection[firebase_domain.FirebaseRecord],
        beam.PCollection[tuple[str, str]],
    ]:
        """Applies the transform and returns just the recreated records."""

        output = (
            self.pipeline
            | 'Recreate records' >> firebase_io.RecreateRecordsFromOppiaModels()
        )
        return (
            output[firebase_io.RecreateRecordsFromOppiaModels.TAG_RECORDS],
            output[firebase_io.RecreateRecordsFromOppiaModels.TAG_AUTH_PAIRS],
        )

    def test_run_without_oppia_models_returns_empty_records(self) -> None:
        records, _ = self.get_tagged_outputs()
        self.assert_pcoll_empty(records)

    def test_run_without_oppia_models_returns_empty_auth_pairs(self) -> None:
        _, auth_pairs = self.get_tagged_outputs()
        self.assert_pcoll_empty(auth_pairs)

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

        records, _ = self.get_tagged_outputs()
        self.assert_pcoll_equal(
            records,
            [
                firebase_domain.FirebaseRecord(
                    auth_id='fb_a',
                    email='a@a.com',
                    disabled=False,
                )
            ],
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

        records, _ = self.get_tagged_outputs()
        self.assert_pcoll_equal(
            records,
            [
                firebase_domain.FirebaseRecord(
                    auth_id='fb_a',
                    email='a@a.com',
                    disabled=True,
                )
            ],
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

        records, _ = self.get_tagged_outputs()
        self.assert_pcoll_equal(
            records,
            [
                firebase_domain.FirebaseRecord(
                    auth_id='fb_a',
                    email='a@a.com',
                    disabled=False,
                ),
                firebase_domain.FirebaseRecord(
                    auth_id='fb_b',
                    email='b@b.com',
                    disabled=False,
                ),
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

        records, _ = self.get_tagged_outputs()
        self.assert_pcoll_equal(
            records,
            [
                firebase_domain.FirebaseRecord(
                    auth_id='fb_a',
                    email='a@a.com',
                    disabled=False,
                )
            ],
        )

    def test_auth_pairs_emits_only_firebase_linked_users(self) -> None:
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

        _, auth_pairs = self.get_tagged_outputs()
        self.assert_pcoll_equal(auth_pairs, [('fb_a', 'uid_a')])

    def test_get_with_missing_auth_details_raises_value_error(self) -> None:
        self.put_multi(
            [
                self.create_model(
                    user_models.UserSettingsModel,
                    id='uid_a',
                    email='a@a.com',
                ),
            ]
        )

        with self.assertRaisesRegex(ValueError, 'needs exactly one'):
            records, _ = self.get_tagged_outputs()
            self.assert_pcoll_equal(records, [])

    def test_get_with_missing_settings_raises_value_error(self) -> None:
        self.put_multi(
            [
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id='uid_a',
                    firebase_auth_id='fb_a',
                ),
            ]
        )

        with self.assertRaisesRegex(ValueError, 'needs exactly one'):
            records, _ = self.get_tagged_outputs()
            self.assert_pcoll_equal(records, [])

    def test_get_with_inconsistent_deleted_status_raises_value_error(
        self,
    ) -> None:
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
                    deleted=False,
                ),
            ]
        )

        with self.assertRaisesRegex(ValueError, 'Failed to rebuild record'):
            records, _ = self.get_tagged_outputs()
            self.assert_pcoll_equal(records, [])


class CreateFirebaseRecordsTests(FirebaseConnectionTestBase):
    def test_create_with_no_records_produces_no_output(self) -> None:
        self.assert_pcoll_empty(
            self.pipeline
            | beam.Create([])
            | firebase_io.CreateFirebaseRecords()
        )
        self.establish_firebase_connection_mock.assert_not_called()

    def test_create_outside_emulator_uses_import_users(self) -> None:
        with self.swap(constants, 'EMULATOR_MODE', False):
            self.assert_pcoll_equal(
                (
                    self.pipeline
                    | beam.Create(
                        [
                            firebase_domain.FirebaseRecord(
                                auth_id='uid_a',
                                email='uid_a@a.com',
                                disabled=False,
                            ),
                            firebase_domain.FirebaseRecord(
                                auth_id='uid_b',
                                email='uid_b@a.com',
                                disabled=False,
                            ),
                        ]
                    )
                    | firebase_io.CreateFirebaseRecords()
                ),
                [job_run_result.JobRunResult(stdout='CREATE OK: 2')],
            )
        self.establish_firebase_connection_mock.assert_called_once()

    def test_create_within_emulator_uses_create_user(self) -> None:
        with self.swap(constants, 'EMULATOR_MODE', True):
            self.assert_pcoll_equal(
                (
                    self.pipeline
                    | beam.Create(
                        [
                            firebase_domain.FirebaseRecord(
                                auth_id='uid_a',
                                email='uid_a@a.com',
                                disabled=False,
                            ),
                            firebase_domain.FirebaseRecord(
                                auth_id='uid_b',
                                email='uid_b@a.com',
                                disabled=False,
                            ),
                        ]
                    )
                    | firebase_io.CreateFirebaseRecords()
                ),
                [job_run_result.JobRunResult(stdout='CREATE OK: 2')],
            )
        self.establish_firebase_connection_mock.assert_called_once()

    def test_create_within_emulator_reports_per_record_failure(self) -> None:
        self.firebase_sdk_stub.create_user(uid='uid_a', email='uid_a@a.com')

        with self.swap(constants, 'EMULATOR_MODE', True):
            self.assert_pcoll_equal(
                (
                    self.pipeline
                    | beam.Create(
                        [
                            firebase_domain.FirebaseRecord(
                                auth_id='uid_a',
                                email='uid_a@a.com',
                                disabled=False,
                            ),
                        ]
                    )
                    | firebase_io.CreateFirebaseRecords()
                ),
                [
                    job_run_result.JobRunResult(
                        stderr=(
                            'CREATE ERROR: at index=[0]: uid=\'uid_a\' '
                            'already exists'
                        )
                    ),
                ],
            )
        self.establish_firebase_connection_mock.assert_called_once()


class DeleteFirebaseRecordsTests(FirebaseConnectionTestBase):
    def test_delete_with_no_records_produces_no_output(self) -> None:
        self.assert_pcoll_empty(
            self.pipeline
            | beam.Create([])
            | firebase_io.DeleteFirebaseRecords()
        )
        self.establish_firebase_connection_mock.assert_not_called()

    def test_delete_reports_success_count(self) -> None:
        self.firebase_sdk_stub.create_user(uid='uid_a', email='a@a.com')
        self.firebase_sdk_stub.create_user(uid='uid_b', email='b@b.com')

        self.assert_pcoll_equal(
            (
                self.pipeline
                | beam.Create(
                    [
                        firebase_domain.FirebaseRecord(
                            auth_id='uid_a', email='uid_a@a.com', disabled=False
                        ),
                        firebase_domain.FirebaseRecord(
                            auth_id='uid_b', email='uid_b@a.com', disabled=False
                        ),
                    ]
                )
                | firebase_io.DeleteFirebaseRecords()
            ),
            [job_run_result.JobRunResult(stdout='DELETE OK: 2')],
        )
        self.establish_firebase_connection_mock.assert_called_once()
