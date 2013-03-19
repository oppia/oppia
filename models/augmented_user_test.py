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

import test_utils

from augmented_user import AugmentedUser
from exploration import Exploration

from google.appengine.api import users
from google.appengine.ext.db import BadValueError
from google.appengine.ext import ndb


class AugmentedUserUnitTests(test_utils.AppEngineTestBase):
    """Test AugmentedUser class."""

    def testAugmentedUserClass(self):
        """Test AugmentedUser Class."""
        # The user field of an AugmentedUser instance must be set.
        au = AugmentedUser()
        with self.assertRaises(BadValueError):
            au.put()

        # Create and save an actual AugmentedUser instance.
        user = users.User(email='first@test.com')
        au.user = user
        au.editable_explorations = [ndb.Key(Exploration, 5)]
        au.put()

        retrieved_au = AugmentedUser.get(user)
        self.assertEqual(retrieved_au.user, user)
        self.assertEqual(
            retrieved_au.editable_explorations, [ndb.Key(Exploration, 5)])

        # There should be just one AugmentedUser in the datastore.
        self.assertEqual(AugmentedUser.query().count(), 1)

        # Querying for a non-existent user returns a new AugmentedUser entity.
        new_user = users.User(email='new@example.com')
        new_au = AugmentedUser.get(new_user)
        self.assertEqual(new_au.user, new_user)

        # There should now be two AugmentedUsers in the datastore.
        self.assertEqual(AugmentedUser.query().count(), 2)
