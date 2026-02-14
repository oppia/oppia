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

"""Unit tests for the firebase_adapters module."""

from __future__ import annotations

import unittest
from unittest import mock

from core.jobs.types import firebase_adapters
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


class StrongRecordTests(unittest.TestCase):

    def test_init_with_valid_args_sets_fields(self) -> None:
        record = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        self.assertEqual(record.auth_id, 'aid')
        self.assertEqual(record.email, 'a@a.com')
        self.assertFalse(record.disabled)

    def test_from_export_with_exported_record_sets_fields(self) -> None:
        export_record = mock.Mock(uid='uid', email='a@a.com', disabled=False)
        record = firebase_adapters.StrongRecord.from_export(export_record)
        self.assertEqual(record.auth_id, 'uid')
        self.assertEqual(record.email, 'a@a.com')
        self.assertFalse(record.disabled)

    def test_from_export_with_disabled_record_sets_disabled_to_true(
        self,
    ) -> None:
        export_record = mock.Mock(uid='uid', email='a@a.com', disabled=True)
        record = firebase_adapters.StrongRecord.from_export(export_record)
        self.assertEqual(record.auth_id, 'uid')
        self.assertEqual(record.email, 'a@a.com')
        self.assertTrue(record.disabled)

    def test_into_import_returns_matching_import_user_record(self) -> None:
        record = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        import_record = record.into_import()
        self.assertEqual(import_record.uid, 'aid')
        self.assertEqual(import_record.email, 'a@a.com')
        self.assertFalse(import_record.disabled)

    def test_into_import_with_disabled_record_preserves_disabled(self) -> None:
        record = firebase_adapters.StrongRecord('aid', 'a@a.com', True)
        import_record = record.into_import()
        self.assertEqual(import_record.uid, 'aid')
        self.assertEqual(import_record.email, 'a@a.com')
        self.assertTrue(import_record.disabled)


class WeakRecordTests(test_utils.GenericTestBase):

    def test_init_with_valid_args_sets_fields(self) -> None:
        record = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid')
        self.assertEqual(record.auth_id, 'aid')
        self.assertEqual(record.email, 'a@a.com')
        self.assertFalse(record.disabled)
        self.assertEqual(record.user_id, 'uid')

    def test_from_export_raises_type_error(self) -> None:
        export_record = mock.Mock(uid='uid', email='a@a.com', disabled=False)
        with self.assertRaisesRegex(TypeError, 'records have no Oppia User ID'):
            firebase_adapters.WeakRecord.from_export(export_record)

    def test_from_oppia_models_with_matching_ids_creates_record(self) -> None:
        record = firebase_adapters.WeakRecord.from_oppia_models(
            user_models.UserSettingsModel(id='uid', email='a@a.com'),
            auth_models.UserAuthDetailsModel(id='uid', firebase_auth_id='fid'),
        )
        self.assertIsNotNone(record)
        assert record is not None
        self.assertEqual(record.auth_id, 'fid')
        self.assertEqual(record.email, 'a@a.com')
        self.assertFalse(record.disabled)
        self.assertEqual(record.user_id, 'uid')

    def test_from_oppia_models_with_deleted_model_sets_disabled_to_true(
        self,
    ) -> None:
        record = firebase_adapters.WeakRecord.from_oppia_models(
            user_models.UserSettingsModel(
                id='uid', email='a@a.com', deleted=True
            ),
            auth_models.UserAuthDetailsModel(
                id='uid', firebase_auth_id='fid', deleted=True
            ),
        )
        self.assertIsNotNone(record)
        assert record is not None
        self.assertEqual(record.auth_id, 'fid')
        self.assertEqual(record.email, 'a@a.com')
        self.assertTrue(record.disabled)
        self.assertEqual(record.user_id, 'uid')

    def test_from_oppia_models_with_mismatched_ids_raises_value_error(
        self,
    ) -> None:
        settings = user_models.UserSettingsModel(id='a', email='a@a.com')
        auth_details = auth_models.UserAuthDetailsModel(
            id='b', firebase_auth_id='b'
        )
        with self.assertRaisesRegex(ValueError, 'does not match'):
            firebase_adapters.WeakRecord.from_oppia_models(
                settings, auth_details
            )

    def test_from_oppia_models_with_parent_user_id_returns_none(self) -> None:
        settings = user_models.UserSettingsModel(id='a', email='a@a.com')
        auth_details = auth_models.UserAuthDetailsModel(
            id='a', firebase_auth_id='a', parent_user_id='p'
        )
        record = firebase_adapters.WeakRecord.from_oppia_models(
            settings, auth_details
        )
        self.assertIsNone(record)

    def test_into_import_returns_matching_import_user_record(self) -> None:
        record = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid')
        import_record = record.into_import()
        self.assertEqual(import_record.uid, 'aid')
        self.assertEqual(import_record.email, 'a@a.com')
        self.assertFalse(import_record.disabled)


class RecordEqualityTests(unittest.TestCase):

    def test_strong_record_is_not_instance_of_weak_record(self) -> None:
        record = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        self.assertNotIsInstance(record, firebase_adapters.WeakRecord)

    def test_weak_record_is_instance_of_strong_record(self) -> None:
        record = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid')
        self.assertIsInstance(record, firebase_adapters.StrongRecord)

    def test_equal_records_have_equal_hashes(self) -> None:
        strong = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        weak = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid')
        self.assertEqual(hash(strong), hash(weak))

    def test_equality_is_symmetric_across_record_types(self) -> None:
        strong = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        weak = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid')
        self.assertEqual(weak, strong)
        self.assertEqual(strong, weak)

    def test_equality_is_transitive_across_record_types(self) -> None:
        strong = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        weak1 = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid1')
        weak2 = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid2')
        self.assertEqual(weak1, strong)
        self.assertEqual(strong, weak2)
        self.assertEqual(weak1, weak2)

    def test_weak_records_with_different_user_ids_are_equal(self) -> None:
        weak1 = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid1')
        weak2 = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid2')
        self.assertEqual(weak1, weak2)

    def test_records_with_different_auth_ids_are_not_equal(self) -> None:
        a = firebase_adapters.StrongRecord('aid1', 'a@a.com', False)
        b = firebase_adapters.StrongRecord('aid2', 'a@a.com', False)
        self.assertNotEqual(a, b)

    def test_records_with_different_emails_are_not_equal(self) -> None:
        a = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        b = firebase_adapters.StrongRecord('aid', 'b@b.com', False)
        self.assertNotEqual(a, b)

    def test_records_with_different_disabled_are_not_equal(self) -> None:
        a = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        b = firebase_adapters.StrongRecord('aid', 'a@a.com', True)
        self.assertNotEqual(a, b)

    def test_compare_with_unrelated_type_is_not_equal(self) -> None:
        record = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        self.assertNotEqual(record, 'not a record')
        self.assertNotEqual(record, ('aid', 'a@a.com', False))


class RecordSetAndDictTests(unittest.TestCase):

    def test_set_deduplicates_across_record_types(self) -> None:
        strong = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        weak = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid')
        self.assertEqual(len({strong, weak}), 1)

    def test_set_difference_finds_mismatched_records(self) -> None:
        strong = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        weak = firebase_adapters.WeakRecord('aid2', 'b@b.com', False, 'uid')
        self.assertIn(weak, {weak}.difference({strong}))
        self.assertIn(strong, {strong}.difference({weak}))

    def test_set_intersection_finds_matched_records(self) -> None:
        strong = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        weak = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid')
        self.assertIn(strong, {weak}.intersection({strong}))

    def test_dict_lookup_works_across_record_types(self) -> None:
        strong = firebase_adapters.StrongRecord('aid', 'a@a.com', False)
        weak = firebase_adapters.WeakRecord('aid', 'a@a.com', False, 'uid')
        self.assertIn(weak, {strong: 'found'})
        self.assertIn(strong, {weak: 'found'})
