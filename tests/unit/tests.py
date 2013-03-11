# Copyright 2012 Google Inc. All Rights Reserved.
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

"""Unit tests for Oppia."""

__author__ = 'Jeremy Emerson'

import os
from subprocess import call
import unittest

from models.exploration import Exploration
from models.models import AugmentedUser, GenericWidget, Image, Widget
from models.state import State
from models.parameter import Parameter
from models.stats import Counter, Journal
import suite
import utils

from google.appengine.ext import ndb
from google.appengine.ext import testbed
from google.appengine.api import users


class ClassifiersUnitTests(suite.TestBase):
    """Test classifiers."""

    def test_classifiers(self):
        """Run all classifier tests."""
        for root, dirname, files in os.walk('data/classifiers'):
            for filename in files:
                if filename.endswith('_test.py') or filename.endswith('Tests.py'):
                    ret = call(['python', os.path.join(root, filename)])
                    if ret != 0:
                        raise Exception(
                            'Tests for %s failed, returning with exit code '
                            '%s. See the traceback above for details.' %
                            (filename, ret))


class ModelsUnitTests(suite.TestBase):
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
        o.hash_id = 'The hash id'
        o.image = 'The image'
        self.assertEquals(o.hash_id, 'The hash id')
        self.assertEquals(o.image, 'The image')

    def test_Widget_Class(self):
        """Test Widget Class."""
        o = Widget()
        o.hash_id = 'The hash id'
        o.raw = 'Some code here'
        self.assertEqual(o.hash_id, 'The hash id')
        self.assertEqual(o.raw, 'Some code here')

    def test_GenericWidget_Class(self):
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

    def test_State_Class(self):
        """Test State Class."""
        o = State()
        o.hash_id = 'The hash id'
        o.name = 'The name'
        o.content = ['The content']
        self.assertEqual(o.hash_id, 'The hash id')
        self.assertEqual(o.name, 'The name')
        self.assertEqual(o.content, ['The content'])

    def test_Exploration_Class(self):
        """Test Exploration Class."""
        u = users.get_current_user()
        o = Exploration()
        o.hash_id = 'The hash id'
        o.owner = u
        o.category = 'The category'
        o.title = 'The title'
        o.init_state = ndb.Key(State, 3)
        o.states = [ndb.Key(State, 4)]
        o.is_public = False
        o.image_id = 'The image id'
        self.assertEqual(o.hash_id, 'The hash id')
        self.assertEqual(o.owner, u)
        self.assertEqual(o.category, 'The category')
        self.assertEqual(o.title, 'The title')
        self.assertEqual(o.init_state, ndb.Key(State, 3))
        self.assertEqual(o.states, [ndb.Key(State, 4)])
        self.assertEqual(o.is_public, False)
        self.assertEqual(o.image_id, 'The image id')

    def test_AugmentedUser_Class(self):
        """Test AugmentedUser Class."""
        u = users.get_current_user()
        o = AugmentedUser()
        o.user = u
        o.states = [ndb.Key(Exploration, 5)]
        self.assertEqual(o.user, u)
        self.assertEqual(o.states, [ndb.Key(Exploration, 5)])

    def test_Parameter_Class(self):
        """Test Parameter Class."""
        o = Parameter()
        o.name = 'The name'
        o.starting_values = ['The values']
        self.assertEqual(o.name, 'The name')
        self.assertEqual(o.starting_values, ['The values'])

    def test_Counter_Class(self):
        """Test Counter Class."""
        o = Counter()
        o.name = 'The name'
        o.value = 2
        self.assertEqual(o.name, 'The name')
        self.assertEqual(o.value, 2)

    def test_Journal_Class(self):
        """Test Journal Class."""
        o = Journal()
        o.name = 'The name'
        o.values = ['The values']
        self.assertEqual(o.name, 'The name')
        self.assertEqual(o.values, ['The values'])


class FakeEntity(object):

    def __init__(self, name, hash_id, ancestor=None, user=None):
        self.__name__ = name
        self.name = name
        self.hash_id = hash_id
        self.key = hash_id
        if ancestor:
            self.ancestor = ancestor
        if user:
            self.user = user
        self.param = True

    def query(self, ancestor=None):
        if not ancestor:
            return self
        if self.ancestor.key == ancestor:
            return self
        return None

    def filter(self, param):
        self.param = param
        return self

    def get(self):
        if self.param:
            return self
        return None


class FakeAugmentedUser(object):

    def __init__(self, exploration):
        self.user = exploration.user
        self.exploration = exploration
        self.editable_explorations = []

    def get_augmented_user(self, user):
        self.editable_explorations = []
        if user == self.user:
            self.editable_explorations = [self.exploration.key]
        return self


class UtilsUnitTests(suite.TestBase):
    """Test utils."""

    def test_create_enum_method(self):
        """Test create_enum Method."""
        o = utils.create_enum('first', 'second', 'third')
        self.assertEqual(o.first, 'first')
        self.assertEqual(o.second, 'second')
        self.assertEqual(o.third, 'third')
        with self.assertRaises(AttributeError):
            o.fourth

    def test_get_entity_method(self):
        """Test get_entity Method."""
        entity = FakeEntity("The_fake_entity", 1)
        with self.assertRaises(AttributeError):
            utils.get_entity(None, None)
        with self.assertRaises(utils.EntityIdNotFoundError):
            utils.get_entity(entity, None)
        o = utils.get_entity(entity, 1)
        self.assertEqual(o.hash_id, 1)
        with self.assertRaises(utils.EntityIdNotFoundError):
            utils.get_entity(entity, 2)

    def test_check_existence_of_name_method(self):
        """Test check_existence_of_name Method."""
        ancestor = FakeEntity('The_ancestor', 2)
        entity = FakeEntity('The_fake_entity', 1, ancestor)
        with self.assertRaises(AttributeError):
            utils.check_existence_of_name(None, None)
        with self.assertRaises(utils.EntityIdNotFoundError):
            utils.check_existence_of_name(entity, None)
        self.assertTrue(utils.check_existence_of_name(
            entity, 'The_fake_entity'))
        self.assertFalse(utils.check_existence_of_name(
            entity, 'The_not_found_entity'))
        self.assertTrue(utils.check_existence_of_name(
            entity, 'The_fake_entity', ancestor))
        with self.assertRaises(KeyError):
            utils.check_existence_of_name(State, 'The_fake_entity', None)

    def test_get_state_by_name_method(self):
        """Test get_state_by_name_method Method."""
        exploration = FakeEntity('The_fake_exploration', 1)
        fake_state = FakeEntity('The_fake_state', 2, exploration)
        backup_query = utils.State.query
        utils.State.query = fake_state.query
        with self.assertRaises(utils.EntityIdNotFoundError):
            utils.get_state_by_name(None, None)
        with self.assertRaises(KeyError):
            utils.get_state_by_name('The_fake_entity', None)
        self.assertEqual(fake_state, utils.get_state_by_name(
            'The_fake_entity', exploration))
        utils.State.query = backup_query
