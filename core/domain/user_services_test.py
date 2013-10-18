# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Jeremy Emerson'

from core.domain import user_services

import test_utils


class EventHandlerUnitTests(test_utils.GenericTestBase):
    """Test the event handler methods."""

    def test_set_and_get_username(self):
        user_id = 'someUser'
        username = 'username'
        user_services.set_username(user_id, username)
        self.assertEquals(username, user_services.get_username(user_id))

    def test_get_username_none(self):
        self.assertEquals(None, user_services.get_username('fakeUser'))

    def test_is_username_taken_false(self):
        self.assertFalse(user_services.is_username_taken('fakeUsername'))

    def test_is_username_taken_true(self):
        user_id = 'someUser'
        username = 'newUsername'
        user_services.set_username(user_id, username)
        self.assertTrue(user_services.is_username_taken(username))

    def test_is_username_taken_different_case(self):
        user_id = 'someUser'
        username = 'camelCase'
        user_services.set_username(user_id, username)
        self.assertTrue(user_services.is_username_taken(username.lower()))
