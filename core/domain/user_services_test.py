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

__author__ = 'Stephanie Federwisch'

from core.domain import user_services
from core.tests import test_utils
import utils


class UserServicesUnitTests(test_utils.GenericTestBase):
    """Test the user services methods."""

    def test_set_and_get_username(self):
        user_id = 'someUser'
        username = 'username'
        with self.assertRaisesRegexp(Exception, 'User not found.'):
            user_services.set_username(user_id, username)

        user_services._create_user(user_id, 'email@email.com')

        user_services.set_username(user_id, username)
        self.assertEquals(username, user_services.get_username(user_id))

    def test_get_username_for_nonexistent_user(self):
        with self.assertRaisesRegexp(Exception, 'User not found.'):
            user_services.get_username('fakeUser')

    def test_get_username_none(self):
        user_services._create_user('fakeUser', 'email@email.com')
        self.assertEquals(None, user_services.get_username('fakeUser'))

    def test_is_username_taken_false(self):
        self.assertFalse(user_services.is_username_taken('fakeUsername'))

    def test_is_username_taken_true(self):
        user_id = 'someUser'
        username = 'newUsername'
        user_services._create_user(user_id, 'email@email.com')
        user_services.set_username(user_id, username)
        self.assertTrue(user_services.is_username_taken(username))

    def test_is_username_taken_different_case(self):
        user_id = 'someUser'
        username = 'camelCase'
        user_services._create_user(user_id, 'email@email.com')
        user_services.set_username(user_id, username)
        self.assertTrue(user_services.is_username_taken('CaMeLcAsE'))

    def test_set_invalid_usernames(self):
        user_id = 'someUser'
        user_services._create_user(user_id, 'email@email.com')
        bad_usernames = [
            ' bob ', '@', '', 'a' * 100, 'ADMIN', 'admin', 'AdMiN2020']
        for username in bad_usernames:
            with self.assertRaises(utils.ValidationError):
                user_services.set_username(user_id, username)

    def test_invalid_emails(self):
        bad_email_addresses = ['@', '@@', 'abc', '', None, ['a', '@', 'b.com']]
        for email in bad_email_addresses:
            with self.assertRaises(utils.ValidationError):
                user_services.get_or_create_user('user_id', email)

    def test_email_truncation(self):
        email_addresses = [
            ('a@b.c', '..@b.c'),
            ('ab@c.d', 'a..@c.d'),
            ('abc@def.gh', 'a..@def.gh'),
            ('abcd@efg.h', 'a..@efg.h'),
            ('abcdefgh@efg.h', 'abcde..@efg.h'),
        ]
        for ind, (actual_email, expected_email) in enumerate(email_addresses):
            user_settings = user_services.get_or_create_user(
                str(ind), actual_email)
            self.assertEqual(user_settings.truncated_email, expected_email)

    def test_get_email_from_username(self):
        user_id = 'someUser'
        username = 'username'
        user_email = 'email@email.com'

        user_services._create_user(user_id, user_email)
        user_services.set_username(user_id, username)
        self.assertEquals(user_services.get_username(user_id), username)

        # Handle usernames that exist.
        self.assertEquals(
            user_services.get_email_from_username(username), user_email)

        # Handle usernames in the same equivalence class correctly.
        self.assertEquals(
            user_services.get_email_from_username('USERNAME'), user_email)

        # Return None for usernames which don't exist.
        self.assertIsNone(
            user_services.get_email_from_username('fakeUsername'))

    def test_get_user_id_from_username(self):
        user_id = 'someUser'
        username = 'username'
        user_email = 'email@email.com'

        user_services._create_user(user_id, user_email)
        user_services.set_username(user_id, username)
        self.assertEquals(user_services.get_username(user_id), username)

        # Handle usernames that exist.
        self.assertEquals(
            user_services.get_user_id_from_username(username), user_id)

        # Handle usernames in the same equivalence class correctly.
        self.assertEquals(
            user_services.get_user_id_from_username('USERNAME'), user_id)

        # Return None for usernames which don't exist.
        self.assertIsNone(
            user_services.get_user_id_from_username('fakeUsername'))
