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

"""Tests for role-query audit domain objects."""

from __future__ import annotations

from core import feconf, utils
from core.domain import role_domain
from core.tests import test_utils

from typing import List


class RoleQueryAuditUnitTests(test_utils.GenericTestBase):
    """Tests the audit payload's format-only validation."""

    def test_valid_intents(self) -> None:
        for intent in (
            feconf.ROLE_ACTION_ADD,
            feconf.ROLE_ACTION_REMOVE,
            feconf.ROLE_ACTION_VIEW_BY_ROLE,
            feconf.ROLE_ACTION_VIEW_BY_USERNAME,
        ):
            with self.subTest(intent=intent):
                audit = role_domain.RoleQueryAudit(
                    'uid_%s' % ('a' * 32), intent
                )
                audit.validate()
                self.assertEqual(audit.user_id, 'uid_%s' % ('a' * 32))
                self.assertEqual(audit.intent, intent)
                self.assertIsNone(audit.role)
                self.assertIsNone(audit.username)

    def test_invalid_user_id_types(self) -> None:
        # Here we use object because invalid values span unrelated types.
        invalid_values: List[object] = [None, 1, False, [], {}]
        for value in invalid_values:
            with self.subTest(value=value):
                audit = role_domain.RoleQueryAudit(
                    'uid_%s' % ('a' * 32), feconf.ROLE_ACTION_ADD
                )
                # Deliberately replace a typed property to test runtime validation.
                setattr(audit, 'user_id', value)
                with self.assertRaisesRegex(
                    utils.ValidationError, 'user_id must'
                ):
                    audit.validate()

    def test_invalid_user_id_formats(self) -> None:
        for user_id in (
            '',
            'TEST_USER',
            'pid_%s' % ('a' * 32),
            feconf.SYSTEM_COMMITTER_ID,
            'uid_%s' % ('a' * 31),
            'uid_%s' % ('a' * 33),
            'uid_%sA' % ('a' * 31),
            'uid_%s1' % ('a' * 31),
            'uid_%s!' % ('a' * 31),
            'xuid_%s' % ('a' * 32),
            'uid_%sx' % ('a' * 32),
            'uid_%s\n' % ('a' * 32),
        ):
            with self.subTest(user_id=user_id):
                audit = role_domain.RoleQueryAudit(
                    user_id, feconf.ROLE_ACTION_ADD
                )
                with self.assertRaisesRegex(
                    utils.ValidationError, 'wrong format'
                ):
                    audit.validate()

    def test_invalid_intent_types(self) -> None:
        # Here we use object because invalid values span unrelated types.
        invalid_values: List[object] = [None, 1, False, [], {}]
        for value in invalid_values:
            with self.subTest(value=value):
                audit = role_domain.RoleQueryAudit(
                    'uid_%s' % ('a' * 32), feconf.ROLE_ACTION_ADD
                )
                # Deliberately replace a typed property to test runtime validation.
                setattr(audit, 'intent', value)
                with self.assertRaisesRegex(
                    utils.ValidationError, 'intent must'
                ):
                    audit.validate()

    def test_invalid_intent_values(self) -> None:
        for intent in ('', 'unknown', feconf.DEPRECATED_ROLE_ACTION_UPDATE):
            with self.subTest(intent=intent):
                audit = role_domain.RoleQueryAudit(
                    'uid_%s' % ('a' * 32), intent
                )
                with self.assertRaisesRegex(
                    utils.ValidationError, 'Invalid role-query intent'
                ):
                    audit.validate()

    def test_optional_strings_are_preserved(self) -> None:
        for role in (None, '', 'historical role'):
            for username in (None, '', ' nonexistent/query '):
                with self.subTest(role=role, username=username):
                    audit = role_domain.RoleQueryAudit(
                        'uid_%s' % ('a' * 32),
                        feconf.ROLE_ACTION_ADD,
                        role,
                        username,
                    )
                    audit.validate()
                    self.assertEqual(audit.role, role)
                    self.assertEqual(audit.username, username)

    def test_invalid_optional_field_types(self) -> None:
        # Here we use object because invalid values span unrelated types.
        invalid_values: List[object] = [1, False, [], {}]
        for field in ('role', 'username'):
            for value in invalid_values:
                with self.subTest(field=field, value=value):
                    audit = role_domain.RoleQueryAudit(
                        'uid_%s' % ('a' * 32), feconf.ROLE_ACTION_ADD
                    )
                    # Deliberately replace a typed property for validation tests.
                    setattr(audit, field, value)
                    with self.assertRaisesRegex(
                        utils.ValidationError, '%s must' % field
                    ):
                        audit.validate()
