# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for Skill models."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import rights_manager
from core.platform import models
from core.tests import test_utils

(base_models, skill_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.skill])


class SkillModelUnitTest(test_utils.GenericTestBase):
    """Test the SkillModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            skill_models.SkillModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        self.save_new_skill('skill_id', 'owner_id', 'description')
        self.assertTrue(
            skill_models.SkillModel.has_reference_to_user_id('owner_id'))
        self.assertFalse(
            skill_models.SkillModel.has_reference_to_user_id('x_id'))


class SkillCommitLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Tests the SkillCommitLogEntryModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            skill_models.SkillCommitLogEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        commit = skill_models.SkillCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'username', 'msg',
            'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False
        )
        commit.skill_id = 'b'
        commit.put()
        self.assertTrue(
            skill_models.SkillCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            skill_models.SkillCommitLogEntryModel
            .has_reference_to_user_id('x_id'))


class SkillSummaryModelUnitTest(test_utils.GenericTestBase):
    """Test the SkillSummaryModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            skill_models.SkillSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        self.assertFalse(
            skill_models.SkillSummaryModel.has_reference_to_user_id('any_id'))


class SkillRightsModelUnitTest(test_utils.GenericTestBase):
    """Test the SkillRightsModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            skill_models.SkillRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def setUp(self):
        super(SkillRightsModelUnitTest, self).setUp()

        # The user_ids in commits differ from creator_ids because we need to
        # be able to detect these ids separately both in the rights model and
        # in the commits to the rights model.
        skill_models.SkillRightsModel(
            id='id_1',
            creator_id='user_1_id',
            skill_is_private=True
        ).commit(
            'user_3_id', 'Created new skill rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        skill_models.SkillRightsModel(
            id='id_2',
            creator_id='user_1_id',
            skill_is_private=True
        ).commit(
            'user_3_id', 'Edited skill rights',
            [{'cmd': rights_manager.CMD_CHANGE_ROLE}])
        skill_models.SkillRightsModel(
            id='id_3',
            creator_id='user_2_id',
            skill_is_private=False
        ).commit(
            'user_4_id', 'Created new skill rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        skill_models.SkillRightsModel(
            id='id_4',
            creator_id='user_2_id',
            skill_is_private=True
        ).commit(
            'user_4_id', 'Created new skill rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        skill_models.SkillRightsModel(
            id='id_5',
            creator_id='user_5_id',
            skill_is_private=True
        ).commit(
            'user_6_id', 'Created new skill rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])

    def test_has_reference_to_user_id(self):
        with self.swap(base_models, 'FETCH_BATCH_SIZE', 1):
            self.assertTrue(
                skill_models.SkillRightsModel
                .has_reference_to_user_id('user_1_id'))
            self.assertTrue(
                skill_models.SkillRightsModel
                .has_reference_to_user_id('user_2_id'))
            self.assertTrue(
                skill_models.SkillRightsModel
                .has_reference_to_user_id('user_3_id'))
            self.assertTrue(
                skill_models.SkillRightsModel
                .has_reference_to_user_id('user_4_id'))
            self.assertFalse(
                skill_models.SkillRightsModel
                .has_reference_to_user_id('x_id'))

            # We change the creator_id to to verify that the user_5_id is still
            # found in SkillRightsSnapshotContentModel.
            skill_model = skill_models.SkillRightsModel.get('id_5')
            skill_model.creator_id = 'user_7_id'
            skill_model.commit(
                'user_6_id',
                'Update skill rights',
                [{'cmd': rights_manager.CMD_CHANGE_ROLE}])

            self.assertTrue(
                skill_models.SkillRightsModel.has_reference_to_user_id(
                    'user_5_id'))
            self.assertTrue(
                skill_models.SkillRightsModel.has_reference_to_user_id(
                    'user_7_id'))

    def test_get_unpublished_by_creator_id(self):
        results = (
            skill_models.SkillRightsModel
            .get_unpublished_by_creator_id('user_1_id').fetch(2))
        self.assertEqual(len(results), 2)

    def test_get_unpublished_by_creator_id_should_ignore_public_skills(self):
        results = (
            skill_models.SkillRightsModel
            .get_unpublished_by_creator_id('user_2_id').fetch(2))
        self.assertEqual(len(results), 1)

    def test_get_unpublished_fetches_all_unpublished_skills(self):
        self.assertEqual(
            len(skill_models.SkillRightsModel.get_unpublished().fetch(5)), 4)
