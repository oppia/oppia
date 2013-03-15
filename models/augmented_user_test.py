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
from google.appengine.ext import ndb


class UserUnitTests(test_utils.AppEngineTestBase):
    """Test AugmentedUser class."""

    def testAugmentedUserClass(self):
        """Test AugmentedUser Class."""
        u = users.get_current_user()
        o = AugmentedUser()
        o.user = u
        o.states = [ndb.Key(Exploration, 5)]
        self.assertEqual(o.user, u)
        self.assertEqual(o.states, [ndb.Key(Exploration, 5)])
