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

import unittest

from core.domain import exp_services
import feconf
import test_utils

if feconf.PLATFORM == 'gae':
    import core.storage.exploration.gae_models as exp_models
    import core.storage.image.gae_models as image_models
    from google.appengine.ext import db


@unittest.skipIf(feconf.PLATFORM != 'gae',
                 'not running on GAE')
class StateModelUnitTests(test_utils.GenericTestBase):
    """Test the state model."""

    pass


@unittest.skipIf(feconf.PLATFORM != 'gae',
                 'not running on GAE')
class ExplorationModelUnitTests(test_utils.GenericTestBase):
    """Test the exploration model."""

    def test_exploration_class(self):
        """Test the Exploration model class."""
        exploration = exp_models.ExplorationModel(id='The exploration hash id')

        # A new exploration should have a default title property.
        self.assertEqual(exploration.title, 'New exploration')

        # A new exploration should have a default is_public property.
        self.assertEqual(exploration.is_public, False)

        state = exp_models.StateModel(
            exploration_id=exploration.id,
            id='The state hash id',
            value={
                'name': 'name', 'content': [], 'param_changes': [],
                'widget': None
            })
        state.put()

        # The 'state_ids' property must be a list of strings.
        with self.assertRaises(db.BadValueError):
            exploration.state_ids = 'A string'
        with self.assertRaises(db.BadValueError):
            exploration.state_ids = [state]
        exploration.state_ids = [state.id]

        # An Exploration must have a category.
        with self.assertRaises(db.BadValueError):
            exploration.put('A user id', {})
        exploration.category = 'The category'

        # The 'param_specs' property must be a dict of param_spec dicts.
        with self.assertRaises(db.BadValueError):
            exploration.param_specs = 'A string'
            exploration.put('A user id', {})

        with self.assertRaises(db.BadValueError):
            exploration.param_specs = {
                'has_values': {
                    'obj_type': 'Int',
                    'values': [6]
                }
            }
            exploration.put('A user id', {})

        exploration.param_specs = {'theParameter': {'obj_type': 'Int'}}

        # The 'is_public' property must be a boolean.
        with self.assertRaises(db.BadValueError):
            exploration.is_public = 'true'
        exploration.is_public = True

        # The 'image_id' property must be a string.
        image = image_models.Image(id='The image')
        with self.assertRaises(db.BadValueError):
            exploration.image_id = image
        with self.assertRaises(db.BadValueError):
            exploration.image_id = image.key
        exploration.image_id = 'A string'

        exploration.editor_ids = ['A user id']

        # Put and retrieve the exploration.
        exploration.put('A user id', {})

        retrieved_exploration = exp_services.get_exploration_by_id(
            'The exploration hash id')
        self.assertEqual(retrieved_exploration.category, 'The category')
        self.assertEqual(retrieved_exploration.title, 'New exploration')

        self.assertEqual(len(retrieved_exploration.states), 1)
        retrieved_state = retrieved_exploration.states[0]
        self.assertEqual(retrieved_state.id, state.id)

        self.assertEqual(len(retrieved_exploration.param_specs), 1)
        self.assertEqual(
            retrieved_exploration.param_specs.keys()[0], 'theParameter')

        self.assertEqual(retrieved_exploration.is_public, True)
        self.assertEqual(retrieved_exploration.image_id, 'A string')
        self.assertEqual(retrieved_exploration.editor_ids, ['A user id'])


@unittest.skipIf(feconf.PLATFORM != 'gae',
                 'not running on GAE')
class ExplorationSnapshotModelUnitTests(test_utils.GenericTestBase):
    """Test the exploration snapshot model."""

    def get_snapshot_id(self, exploration_id, version_number):
        return (
            exp_models.ExplorationSnapshotModel._get_snapshot_id(
                exploration_id, version_number))

    def test_version_number_changes_only_after_exp_publication(self):
        USER_ID = 'user_id'
        EXP_ID = 'exp_id'

        exp_services.create_new(USER_ID, 'A title', 'A category', EXP_ID)

        exploration_model = exp_models.ExplorationModel.get(EXP_ID)
        self.assertEqual(exploration_model.version, 0)
        self.assertEqual(exploration_model.title, 'A title')

        snapshot_id = self.get_snapshot_id(EXP_ID, 0)
        snapshot_model = exp_models.ExplorationSnapshotModel.get(
            snapshot_id, strict=False)
        self.assertIsNone(snapshot_model)

        # The exploration is not public, so new versions are not created.
        exploration = exp_services.get_exploration_by_id(EXP_ID)
        exploration.title = 'New title'
        exp_services.save_exploration(USER_ID, exploration)

        exploration_model = exp_models.ExplorationModel.get(EXP_ID)
        self.assertEqual(exploration_model.version, 0)
        self.assertEqual(exploration_model.title, 'New title')

        snapshot_id = self.get_snapshot_id(EXP_ID, 0)
        snapshot_model = exp_models.ExplorationSnapshotModel.get(
            snapshot_id, strict=False)
        self.assertIsNone(snapshot_model)

        snapshot_id = self.get_snapshot_id(EXP_ID, 1)
        snapshot_model = exp_models.ExplorationSnapshotModel.get(
            snapshot_id, strict=False)
        self.assertIsNone(snapshot_model)

        # The exploration is made public, so a new version is created.
        exploration = exp_services.get_exploration_by_id(EXP_ID)
        exploration.title = 'Newer title'
        exploration.is_public = True
        exp_services.save_exploration(USER_ID, exploration)

        exploration_model = exp_models.ExplorationModel.get(EXP_ID)
        self.assertEqual(exploration_model.version, 1)
        self.assertEqual(exploration_model.title, 'Newer title')

        snapshot_id = self.get_snapshot_id(EXP_ID, 0)
        snapshot_model = exp_models.ExplorationSnapshotModel.get(
            snapshot_id, strict=False)
        self.assertIsNone(snapshot_model)

        snapshot_id = self.get_snapshot_id(EXP_ID, 1)
        snapshot_content_model = exp_models.ExplorationSnapshotContentModel.get(
            snapshot_id, strict=False)
        self.assertIsNotNone(snapshot_content_model)
        self.assertIsNotNone(snapshot_content_model.content)
        self.assertEqual(snapshot_content_model.format, 'full')
