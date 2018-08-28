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

from core.domain import rights_manager
from core.platform import models
from core.tests import test_utils

(skill_models,) = models.Registry.import_models(
    [models.NAMES.skill])


class SkillRightsModelUnitTest(test_utils.GenericTestBase):
    """Test the SkillRightsModel class."""

    def setUp(self):
        super(SkillRightsModelUnitTest, self).setUp()

        skill_models.SkillRightsModel(
            id='id_1',
            creator_id='janet',
            skill_is_private=True
        ).commit(
            'janet', 'Created new skill rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        skill_models.SkillRightsModel(
            id='id_2',
            creator_id='janet',
            skill_is_private=True
        ).commit(
            'janet', 'Edited skill rights',
            [{'cmd': rights_manager.CMD_CHANGE_ROLE}])
        skill_models.SkillRightsModel(
            id='id_3',
            creator_id='joe',
            skill_is_private=False
        ).commit(
            'joe', 'Created new skill rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        skill_models.SkillRightsModel(
            id='id_4',
            creator_id='joe',
            skill_is_private=True
        ).commit(
            'joe', 'Created new skill rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])

    def test_get_unpublished_by_creator_id(self):
        results = (
            skill_models.SkillRightsModel
            .get_unpublished_by_creator_id('janet').fetch(2))
        self.assertEqual(len(results), 2)

    def test_get_unpublished_by_creator_id_should_ignore_public_skills(self):
        results = (
            skill_models.SkillRightsModel
            .get_unpublished_by_creator_id('joe').fetch(2))
        self.assertEqual(len(results), 1)

    def test_get_unpublished_fetches_all_unpublished_skills(self):
        self.assertEqual(
            len(skill_models.SkillRightsModel.get_unpublished().fetch(4)), 3)
