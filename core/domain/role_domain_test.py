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

"""tests for role_domain"""

import string

from core.domain import role_domain
from core.tests import test_utils


class RoleDomainUnitTests(test_utils.GenericTestBase):
    """test the role domain"""
    HIERARCHY = role_domain.ROLE_HIERARCHY
    ACTIONS = role_domain.ROLE_ACTIONS

    def test_dicts_have_same_keys(self):
        """test that ROLE_HIERARCHY and ROLE_ACTIONS have same keys
        in same order.
        """
        self.assertEqual(self.HIERARCHY.keys(), self.ACTIONS.keys())

    def test_dicts_have_list_value(self):
        """test that ROLE_HIERARCHY and ROLE_ACTIONS, both have list as value
        to all the keys
        """
        for i in self.HIERARCHY:
            self.assertTrue(isinstance(self.HIERARCHY[i], list))

        for i in self.ACTIONS:
            self.assertTrue(isinstance(self.ACTIONS[i], list))

    def test_valid_names(self):
        """strings with UPPERCASE alphabets and underscores are allowed. This
        test checks whether all entries comply with this rule.
        """

        def valid_character(character):
            if (character in string.ascii_uppercase) or (character == '_'):
                return True
            return False

        for role_name in self.HIERARCHY:
            for i in role_name:
                self.assertTrue(valid_character(i))

            for action_name in self.HIERARCHY[role_name]:
                for i in action_name:
                    self.assertTrue(valid_character(i))

    def test_every_dict_entry_is_string(self):
        """test that all keys and values(elements in lists) in ROLE_HIERARCHY
        and ROLE_ACTIONS are string.
        """

        # checking the keys in ROLE_HIERARCHY.
        for i in self.HIERARCHY:
            self.assertTrue(isinstance(i, str))

            # checking the values in list corresponding to key.
            for j in self.HIERARCHY[i]:
                self.assertTrue(isinstance(j, str))

        # checking the keys in ACTIONS.
        for i in self.ACTIONS:
            self.assertTrue(isinstance(i, str))

            # checking the values in list corresponding to key.
            for j in self.ACTIONS[i]:
                self.assertTrue(isinstance(j, str))

    def test_valid_parents(self):
        """test that all the roles present in value list for any key in
        ROLE_HIERARCHY are valid(i.e there exists a key with that name)
        """
        valid_roles = self.HIERARCHY.keys()

        for i in self.HIERARCHY:
            for j in self.HIERARCHY[i]:
                self.assertTrue(j in valid_roles)

    def test_no_cycles(self):
        """Visits each role and checks that there is no cycle from that
        role"""
        visited = set()

        def check_cycle(source, parents):
            """checks if there is a cycle starting from source
            args : source -> the starting role to check
                   parents -> list of neighbours
            """
            if len(parents) == 0:
                return

            for i in parents:
                self.assertNotEqual(i, source)
                if i not in visited:
                    visited.add(i)
                    check_cycle(source, self.HIERARCHY[i])

        for i in self.HIERARCHY:
            visited = set()
            check_cycle(i, self.HIERARCHY[i])

    def test_get_all_actions_is_working(self):
        """test that get_all_actions is working correctly."""

        # case when wrong input is given
        with self.assertRaisesRegexp(Exception,
                                     "no role with name TEST_ROLE exists."):
            role_domain.get_all_actions('TEST_ROLE')

        # case for collection editor actions
        collection_editor_actions = list(
            set(role_domain.ROLE_ACTIONS['EXPLORATION_EDITOR']) |
            set(role_domain.ROLE_ACTIONS['BANNED_USER']) |
            set(role_domain.ROLE_ACTIONS['GUEST']) |
            set(role_domain.ROLE_ACTIONS['COLLECTION_EDITOR']))

        self.assertEqual(collection_editor_actions,
                         role_domain.get_all_actions('COLLECTION_EDITOR'))
