# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Test functions relating to roles and actions."""

from __future__ import annotations

from core import feconf
from core.domain import role_services
from core.storage.audit import gae_models
from core.tests import test_utils


class RolesAndActionsServicesUnitTests(test_utils.GenericTestBase):
    """Tests for roles and actions."""

    def test_get_role_actions_return_value_in_correct_schema(self) -> None:
        role_actions = role_services.get_role_actions()

        self.assertTrue(isinstance(role_actions, dict))
        for role_name, allotted_actions in role_actions.items():
            self.assertTrue(isinstance(role_name, str))
            self.assertTrue(isinstance(allotted_actions, list))
            self.assertEqual(len(set(allotted_actions)), len(allotted_actions))
            for action_name in allotted_actions:
                self.assertTrue(isinstance(action_name, str))

    def test_get_all_actions(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Role TEST_ROLE does not exist.'):
            role_services.get_all_actions(['TEST_ROLE'])

        self.assertEqual(
            role_services.get_all_actions([feconf.ROLE_ID_GUEST]),
            [role_services.ACTION_PLAY_ANY_PUBLIC_ACTIVITY])

    def test_action_allocated_to_all_allowed_roles(self) -> None:
        role_actions = role_services.get_role_actions()

        self.assertItemsEqual(
            list(role_actions), feconf.ALLOWED_USER_ROLES)

    def test_log_role_query(self) -> None:
        self.assertEqual(
            gae_models.RoleQueryAuditModel.has_reference_to_user_id(
                'TEST_USER'),
            False)
        role_services.log_role_query(
            'TEST_USER', feconf.ROLE_ACTION_ADD, role='GUEST')
        self.assertEqual(
            gae_models.RoleQueryAuditModel.has_reference_to_user_id(
                'TEST_USER'),
            True)
