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

from core.jobs import job_test_utils
from core.jobs.io import firebase_io
from core.jobs.types import firebase_adapters
from core.platform import models
from core.platform.auth import firebase_auth_services_test

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

        with self.assertRaisesRegex(
            ValueError, 'need EXACTLY ONE of each model'
        ):
            self.assert_pcoll_equal(
                self.pipeline | firebase_io.GetWeakRecords(), []
            )

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

        with self.assertRaisesRegex(
            ValueError, 'need EXACTLY ONE of each model'
        ):
            self.assert_pcoll_equal(
                self.pipeline | firebase_io.GetWeakRecords(), []
            )
