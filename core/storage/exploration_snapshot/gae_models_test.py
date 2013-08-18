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

__author__ = 'Sean Lip'

import unittest

from core.domain import exp_services
import feconf
import test_utils

if feconf.PLATFORM == 'gae':
    import core.storage.exploration.gae_models as exp_models
    import core.storage.exploration_snapshot.gae_models as exp_snapshot_models


@unittest.skipIf(feconf.PLATFORM != 'gae',
                 'not running on GAE')
class ExplorationSnapshotModelUnitTests(test_utils.GenericTestBase):
    """Test the exploration snapshot model."""

    def get_snapshot_id(self, exploration_id, version_number):
        return (
            exp_snapshot_models.ExplorationSnapshotModel._get_snapshot_id(
                exploration_id, version_number))

    def test_version_number_changes_only_after_exp_publication(self):
        USER_ID = 'user_id'
        EXP_ID = 'exp_id'

        exp_services.create_new(USER_ID, 'A title', 'A category', EXP_ID)

        exploration_model = exp_models.ExplorationModel.get(EXP_ID)
        self.assertEqual(exploration_model.version, 0)
        self.assertEqual(exploration_model.title, 'A title')

        snapshot_id = self.get_snapshot_id(EXP_ID, 0)
        snapshot_model = exp_snapshot_models.ExplorationSnapshotModel.get(
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
        snapshot_model = exp_snapshot_models.ExplorationSnapshotModel.get(
            snapshot_id, strict=False)
        self.assertIsNone(snapshot_model)

        snapshot_id = self.get_snapshot_id(EXP_ID, 1)
        snapshot_model = exp_snapshot_models.ExplorationSnapshotModel.get(
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
        snapshot_model = exp_snapshot_models.ExplorationSnapshotModel.get(
            snapshot_id, strict=False)
        self.assertIsNone(snapshot_model)

        snapshot_id = self.get_snapshot_id(EXP_ID, 1)
        snapshot_model = exp_snapshot_models.ExplorationSnapshotModel.get(
            snapshot_id, strict=False)
        self.assertIsNotNone(snapshot_model)
        self.assertIsNotNone(snapshot_model.serialized_exploration)
        self.assertIsNone(snapshot_model.diff_from_previous_version)
