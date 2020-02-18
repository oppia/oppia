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
        self.save_new_skill('skill_id', 'owner_id', description='description')
        self.assertTrue(
            skill_models.SkillModel.has_reference_to_user_id('owner_id'))
        self.assertFalse(
            skill_models.SkillModel.has_reference_to_user_id('x_id'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            skill_models.SkillModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE)


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

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            skill_models.SkillSummaryModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE)
