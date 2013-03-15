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

from exploration import Exploration
from state import State

from google.appengine.api import users
from google.appengine.ext import ndb


class ExplorationModelUnitTests(test_utils.AppEngineTestBase):
    """Test the exploration model."""

    def testExplorationClass(self):
        """Test Exploration Class."""
        u = users.get_current_user()
        o = Exploration(id='The hash id')
        o.owner = u
        o.category = 'The category'
        o.title = 'The title'
        o.init_state = ndb.Key(State, 3)
        o.states = [ndb.Key(State, 4)]
        o.is_public = False
        o.image_id = 'The image id'
        self.assertEqual(o.id, 'The hash id')
        self.assertEqual(o.owner, u)
        self.assertEqual(o.category, 'The category')
        self.assertEqual(o.title, 'The title')
        self.assertEqual(o.init_state, ndb.Key(State, 3))
        self.assertEqual(o.states, [ndb.Key(State, 4)])
        self.assertEqual(o.is_public, False)
        self.assertEqual(o.image_id, 'The image id')
