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

"""Unit tests for the firebase_domain module."""

from __future__ import annotations

from unittest import mock

from core.jobs.types import firebase_domain
from core.platform import models
from core.tests import test_utils

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


class FirebaseRecordTests(test_utils.GenericTestBase):
    def test_init(self) -> None:
        record = firebase_domain.FirebaseRecord(
            auth_id='aid', email='a@a.com', disabled=False
        )
        self.assertEqual(record.auth_id, 'aid')
        self.assertEqual(record.email, 'a@a.com')
        self.assertFalse(record.disabled)

    def test_to_import(self) -> None:
        record = firebase_domain.FirebaseRecord(
            auth_id='aid', email='a@a.com', disabled=False
        )
        import_record = record.to_import()
        self.assertEqual(import_record.uid, 'aid')
        self.assertEqual(import_record.email, 'a@a.com')
        self.assertFalse(import_record.disabled)

    def test_to_import_with_disabled_record(self) -> None:
        record = firebase_domain.FirebaseRecord(
            auth_id='aid', email='a@a.com', disabled=True
        )
        import_record = record.to_import()
        self.assertEqual(import_record.uid, 'aid')
        self.assertEqual(import_record.email, 'a@a.com')
        self.assertTrue(import_record.disabled)

    def test_from_export(self) -> None:
        export_record = mock.Mock(uid='uid', email='a@a.com', disabled=False)
        record = firebase_domain.FirebaseRecord.from_export(export_record)
        self.assertEqual(record.auth_id, 'uid')
        self.assertEqual(record.email, 'a@a.com')
        self.assertFalse(record.disabled)

    def test_from_export_with_disabled_record(self) -> None:
        export_record = mock.Mock(uid='uid', email='a@a.com', disabled=True)
        record = firebase_domain.FirebaseRecord.from_export(export_record)
        self.assertEqual(record.auth_id, 'uid')
        self.assertEqual(record.email, 'a@a.com')
        self.assertTrue(record.disabled)

    def test_from_export_with_missing_fields_raises_value_error(self) -> None:
        with (
            self.subTest('email is None'),
            self.assertRaisesRegex(ValueError, r'needs non-empty'),
        ):
            firebase_domain.FirebaseRecord.from_export(
                mock.Mock(uid='uid', email=None, disabled=False)
            )

        with (
            self.subTest('uid is None'),
            self.assertRaisesRegex(ValueError, r'needs non-empty'),
        ):
            firebase_domain.FirebaseRecord.from_export(
                mock.Mock(uid=None, email='a@a.com', disabled=False)
            )

        with (
            self.subTest('email is empty'),
            self.assertRaisesRegex(ValueError, r'needs non-empty'),
        ):
            firebase_domain.FirebaseRecord.from_export(
                mock.Mock(uid='uid', email='', disabled=False)
            )

        with (
            self.subTest('uid is empty'),
            self.assertRaisesRegex(ValueError, r'needs non-empty'),
        ):
            firebase_domain.FirebaseRecord.from_export(
                mock.Mock(uid='', email='a@a.com', disabled=False)
            )

    def test_from_oppia_models_with_matching_ids_and_deleted_returns_record(
        self,
    ) -> None:
        auth_details = auth_models.UserAuthDetailsModel(
            id='uid_a',
            firebase_auth_id='fb_a',
            deleted=False,
            parent_user_id=None,
        )
        settings = user_models.UserSettingsModel(
            id='uid_a', email='a@a.com', deleted=False
        )
        self.assertEqual(
            firebase_domain.FirebaseRecord.from_oppia_models(
                auth_details, settings
            ),
            firebase_domain.FirebaseRecord(
                auth_id='fb_a', email='a@a.com', disabled=False
            ),
        )

    def test_from_oppia_models_with_parent_user_id_returns_none(self) -> None:
        auth_details = auth_models.UserAuthDetailsModel(
            id='uid_a',
            firebase_auth_id='fb_a',
            deleted=False,
            parent_user_id='uid_parent',
        )
        settings = user_models.UserSettingsModel(
            id='uid_a', email='a@a.com', deleted=False
        )

        self.assertIsNone(
            firebase_domain.FirebaseRecord.from_oppia_models(
                auth_details, settings
            )
        )

    def test_from_oppia_models_with_mismatched_ids_raises_value_error(
        self,
    ) -> None:
        auth_details = auth_models.UserAuthDetailsModel(
            id='uid_a',
            firebase_auth_id='fb_a',
            deleted=False,
            parent_user_id=None,
        )
        settings = user_models.UserSettingsModel(
            id='uid_b', email='a@a.com', deleted=False
        )
        with self.assertRaisesRegex(ValueError, r'uid_a.*must match.*uid_b'):
            firebase_domain.FirebaseRecord.from_oppia_models(
                auth_details, settings
            )

    def test_from_oppia_models_with_mismatched_deleted_raises_value_error(
        self,
    ) -> None:
        auth_details = auth_models.UserAuthDetailsModel(
            id='uid_a',
            firebase_auth_id='fb_a',
            deleted=False,
            parent_user_id=None,
        )
        settings = user_models.UserSettingsModel(
            id='uid_a', email='a@a.com', deleted=True
        )
        with self.assertRaisesRegex(
            ValueError, r'deleted=False.*must match.*deleted=True'
        ):
            firebase_domain.FirebaseRecord.from_oppia_models(
                auth_details, settings
            )

    def test_from_oppia_models_with_none_firebase_auth_id_raises_value_error(
        self,
    ) -> None:
        auth_details = auth_models.UserAuthDetailsModel(
            id='uid_a',
            firebase_auth_id=None,
            deleted=False,
            parent_user_id=None,
        )
        settings = user_models.UserSettingsModel(
            id='uid_a', email='a@a.com', deleted=False
        )
        with self.assertRaisesRegex(ValueError, r'must have non-empty'):
            firebase_domain.FirebaseRecord.from_oppia_models(
                auth_details, settings
            )

    def test_from_oppia_models_with_empty_firebase_auth_id_raises_value_error(
        self,
    ) -> None:
        auth_details = auth_models.UserAuthDetailsModel(
            id='uid_a',
            firebase_auth_id='',
            deleted=False,
            parent_user_id=None,
        )
        settings = user_models.UserSettingsModel(
            id='uid_a', email='a@a.com', deleted=False
        )
        with self.assertRaisesRegex(ValueError, r'must have non-empty'):
            firebase_domain.FirebaseRecord.from_oppia_models(
                auth_details, settings
            )
