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

"""Unit tests for Oppia."""

__author__ = 'Jeremy Emerson'

import unittest
from models.exploration import Exploration
from models.models import AugmentedUser, GenericWidget, Image, Widget
from models.state import State
from google.appengine.ext import ndb
from google.appengine.ext import testbed
from google.appengine.api import users


class ModelsUnitTests(unittest.TestCase):
    """Test models."""

    def setUp(self):
        self.testbed = testbed.Testbed()
        self.testbed.activate()
        self.testbed.init_datastore_v3_stub()
        self.testbed.init_user_stub()

    def tearDown(self):
        self.testbed.deactivate()

    def test_Image_Class(self):
        """Test Image Class."""
        o = Image()
        o.hash_id = "The hash id"
        o.image = "The image"
        self.assertEquals(o.hash_id, "The hash id")
        self.assertEquals(o.image, "The image")

    def test_Widget_Class(self):
        """Test Widget Class."""
        o = Widget()
        o.hash_id = "The hash id"
        o.raw = "Some code here"
        self.assertEqual(o.hash_id, "The hash id")
        self.assertEqual(o.raw, "Some code here")

    def test_GenericWidget_Class(self):
        """Test GenericWidget Class."""
        o = GenericWidget()
        o.hash_id = "The hash id"
        o.name = "The name"
        o.category = "The category"
        o.description = "The description"
        o.raw = "Some code here"
        o.prams = "Some JsonProperties here"
        self.assertEqual(o.hash_id, "The hash id")
        self.assertEqual(o.name, "The name")
        self.assertEqual(o.category, "The category")
        self.assertEqual(o.description, "The description")
        self.assertEqual(o.raw, "Some code here")
        self.assertEqual(o.prams, "Some JsonProperties here")

    def test_State_Class(self):
        """Test State Class."""
        o = State()
        o.hash_id = "The hash id"
        o.name = "The name"
        o.content = ["The content"]
        self.assertEqual(o.hash_id, "The hash id")
        self.assertEqual(o.name, "The name")
        self.assertEqual(o.content, ["The content"])

    def test_Exploration_Class(self):
        """Test Exploration Class."""
        u = users.get_current_user()
        o = Exploration()
        o.hash_id = "The hash id"
        o.owner = u
        o.category = "The category"
        o.title = "The title"
        o.init_state = ndb.Key(State, 3)
        o.states = [ndb.Key(State, 4)]
        o.is_public = False
        o.image_id = "The image id"
        self.assertEqual(o.hash_id, "The hash id")
        self.assertEqual(o.owner, u)
        self.assertEqual(o.category, "The category")
        self.assertEqual(o.title, "The title")
        self.assertEqual(o.init_state, ndb.Key(State, 3))
        self.assertEqual(o.states, [ndb.Key(State, 4)])
        self.assertEqual(o.is_public, False)
        self.assertEqual(o.image_id, "The image id")

    def test_AugmentedUser_Class(self):
        """Test AugmentedUser Class."""
        u = users.get_current_user()
        o = AugmentedUser()
        o.user = u
        o.states = [ndb.Key(Exploration, 5)]
        self.assertEqual(o.user, u)
        self.assertEqual(o.states, [ndb.Key(Exploration, 5)])
