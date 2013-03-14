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

from exploration import Exploration
from models import Image, Widget, GenericWidget, AugmentedUser
import test_utils

from google.appengine.api import users
from google.appengine.ext import ndb


class ModelsUnitTests(test_utils.AppEngineTestBase):
    """Test models."""

    def testImageClass(self):
        """Test Image Class."""
        o = Image()
        o.hash_id = 'The hash id'
        o.image = 'The image'
        self.assertEquals(o.hash_id, 'The hash id')
        self.assertEquals(o.image, 'The image')

    def testWidgetClass(self):
        """Test Widget Class."""
        o = Widget()
        o.hash_id = 'The hash id'
        o.raw = 'Some code here'
        self.assertEqual(o.hash_id, 'The hash id')
        self.assertEqual(o.raw, 'Some code here')

    def testGenericWidgetClass(self):
        """Test GenericWidget Class."""
        o = GenericWidget()
        o.hash_id = 'The hash id'
        o.name = 'The name'
        o.category = 'The category'
        o.description = 'The description'
        o.raw = 'Some code here'
        o.prams = 'Some JsonProperties here'
        self.assertEqual(o.hash_id, 'The hash id')
        self.assertEqual(o.name, 'The name')
        self.assertEqual(o.category, 'The category')
        self.assertEqual(o.description, 'The description')
        self.assertEqual(o.raw, 'Some code here')
        self.assertEqual(o.prams, 'Some JsonProperties here')

    def testAugmentedUserClass(self):
        """Test AugmentedUser Class."""
        u = users.get_current_user()
        o = AugmentedUser()
        o.user = u
        o.states = [ndb.Key(Exploration, 5)]
        self.assertEqual(o.user, u)
        self.assertEqual(o.states, [ndb.Key(Exploration, 5)])
