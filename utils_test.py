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
import utils
from models.state import State


class FakeEntity(object):

    def __init__(self, name, entity_id, ancestor=None, user=None):
        self.__name__ = name
        self.name = name
        self.id = entity_id
        self.key = entity_id
        if ancestor:
            self.ancestor = ancestor
        if user:
            self.user = user
        self.param = True

    def get_by_id(self, query_id):
        if query_id == self.id:
            return self

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


class UtilsTests(test_utils.AppEngineTestBase):
    """Test the exploration model."""

    def test_create_enum_method(self):
        """Test create_enum Method."""
        o = utils.create_enum('first', 'second', 'third')
        self.assertEqual(o.first, 'first')
        self.assertEqual(o.second, 'second')
        self.assertEqual(o.third, 'third')
        with self.assertRaises(AttributeError):
            o.fourth

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
