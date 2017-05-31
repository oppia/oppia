# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Test functions relating to roles and actions"""

import string

from core.domain import role_domain
from core.tests import test_utils
import feconf


class RoleDomainUnitTests(test_utils.GenericTestBase):
    """Tests for role hierarchy and actions."""
    HIERARCHY = role_domain.ROLE_HIERARCHY
    ACTIONS = role_domain.ROLE_ACTIONS

    def test_dicts_have_same_keys(self):
        """Test that ROLE_HIERARCHY and ROLE_ACTIONS have same keys.
        """
        self.assertEqual(self.HIERARCHY.keys(), self.ACTIONS.keys())

    def test_dicts_have_list_value(self):
        """Test that ROLE_HIERARCHY and ROLE_ACTIONS, both have list as value
        to all the keys.
        """
        for role_name in self.HIERARCHY:
            self.assertTrue(isinstance(self.HIERARCHY[role_name], list))

        for role_name in self.ACTIONS:
            self.assertTrue(isinstance(self.ACTIONS[role_name], list))

    def test_valid_names(self):
        """Strings with UPPERCASE alphabets and underscores are allowed. This
        test checks whether all entries comply with this rule.
        """

        def valid_character(character):
            if (character in string.ascii_uppercase) or (character == '_'):
                return True
            return False

        for role_name in self.HIERARCHY:
            for character in role_name:
                self.assertTrue(valid_character(character))

            for action_name in self.HIERARCHY[role_name]:
                for character in action_name:
                    self.assertTrue(valid_character(character))

    def test_every_dict_entry_is_string(self):
        """Test that all keys and values(elements in lists) in ROLE_HIERARCHY
        and ROLE_ACTIONS are string.
        """
        for role_name in self.HIERARCHY:
            self.assertTrue(isinstance(role_name, str))

            for role in self.HIERARCHY[role_name]:
                self.assertTrue(isinstance(role, str))

        for role_name in self.ACTIONS:
            self.assertTrue(isinstance(role_name, str))

            for action_name in self.ACTIONS[role_name]:
                self.assertTrue(isinstance(action_name, str))

    def test_valid_parents(self):
        """Test that all the roles present in value list for any key in
        ROLE_HIERARCHY are valid(i.e there exists a key with that name).
        """
        valid_roles = self.HIERARCHY.keys()

        for role_name in self.HIERARCHY:
            for role in self.HIERARCHY[role_name]:
                self.assertIn(role, valid_roles)

    def test_that_role_graph_has_no_directed_cycles(self):
        """Visits each role and checks that there is no cycle from that
        role.
        """
        visited = set()

        def check_cycle(source, roles):
            """Checks that source is not reachable from any of the given roles.

            Args :
                source: str. Role that should not be reachable via any path
                        from roles.
                parents: list. List of roles that should not be able to reach
                         source.
            """
            for role in roles:
                self.assertNotEqual(role, source)
                if role not in visited:
                    visited.add(role)
                    check_cycle(source, self.HIERARCHY[role])

            return

        for role_name in self.HIERARCHY:
            visited = set()
            check_cycle(role_name, self.HIERARCHY[role_name])

    def test_get_all_actions(self):
        """Test that get_all_actions is working correctly."""

        # Case when wrong input is given.
        with self.assertRaisesRegexp(
            Exception, "no role with name TEST_ROLE exists."):
            role_domain.get_all_actions('TEST_ROLE')

        # Case for collection editor is checked.
        collection_editor_actions = list(
            set(role_domain.ROLE_ACTIONS[feconf.ROLE_EXPLORATION_EDITOR]) |
            set(role_domain.ROLE_ACTIONS[feconf.ROLE_BANNED_USER]) |
            set(role_domain.ROLE_ACTIONS[feconf.ROLE_GUEST]) |
            set(role_domain.ROLE_ACTIONS[feconf.ROLE_COLLECTION_EDITOR]))

        self.assertEqual(collection_editor_actions,
                         role_domain.get_all_actions(
                             feconf.ROLE_COLLECTION_EDITOR))
