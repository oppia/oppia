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

"""Tests the methods defined in skill services."""

from core.domain import skill_domain
from core.domain import skill_services
from core.platform import models
from core.tests import test_utils

(skill_models,) = models.Registry.import_models([models.NAMES.skill])


class SkillServicesUnitTests(test_utils.GenericTestBase):
    """Test the skill services module."""

    SKILL_ID = None
    SKILL_IDS = []
    USER_ID = 'user'
    DEGREE_OF_MASTERY = 0.0
    MISCONCEPTION_ID_1 = 'misconception_id_1'
    MISCONCEPTION_ID_2 = 'misconception_id_2'

    def setUp(self):
        super(SkillServicesUnitTests, self).setUp()
        skill_contents = skill_domain.SkillContents(
            'Explanation', ['Example 1'])
        misconceptions = [skill_domain.Misconception(
            self.MISCONCEPTION_ID_1, 'name', 'description', 'default_feedback')]
        self.SKILL_ID = skill_services.get_new_skill_id()
        self.SKILL_ID1 = skill_services.get_new_skill_id()
        self.SKILL_IDS = [self.SKILL_ID, self.SKILL_ID1]
        self.skill = self.save_new_skill(
            self.SKILL_ID, self.USER_ID, 'Description', misconceptions,
            skill_contents
        )
        skill_services.create_skill_mastery(
            self.USER_ID, self.SKILL_ID, self.DEGREE_OF_MASTERY)
        skill_services.create_skill_mastery(
            self.USER_ID, self.SKILL_ID1, self.DEGREE_OF_MASTERY)

    def test_compute_summary(self):
        skill_summary = skill_services.compute_summary_of_skill(self.skill)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)

    def test_get_new_skill_id(self):
        new_skill_id = skill_services.get_new_skill_id()

        self.assertEqual(len(new_skill_id), 12)
        self.assertEqual(skill_models.SkillModel.get_by_id(new_skill_id), None)

    def test_get_skill_from_model(self):
        skill_model = skill_models.SkillModel.get(self.SKILL_ID)
        skill = skill_services.get_skill_from_model(skill_model)

        self.assertEqual(skill.to_dict(), self.skill.to_dict())

    def test_get_skill_summary_from_model(self):
        skill_summary_model = skill_models.SkillSummaryModel.get(self.SKILL_ID)
        skill_summary = skill_services.get_skill_summary_from_model(
            skill_summary_model)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)

    def test_get_skill_by_id(self):
        expected_skill = self.skill.to_dict()
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(skill.to_dict(), expected_skill)

    def test_commit_log_entry(self):
        skill_commit_log_entry = (
            skill_models.SkillCommitLogEntryModel.get_commit(self.SKILL_ID, 1)
        )
        self.assertEqual(skill_commit_log_entry.commit_type, 'create')
        self.assertEqual(skill_commit_log_entry.skill_id, self.SKILL_ID)
        self.assertEqual(skill_commit_log_entry.user_id, self.USER_ID)

    def test_get_skill_summary_by_id(self):
        skill_summary = skill_services.get_skill_summary_by_id(self.SKILL_ID)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)

    def test_get_skill_mastery(self):
        degree_of_mastery = skill_services.get_skill_mastery(
            self.USER_ID, self.SKILL_ID)

        self.assertEqual(degree_of_mastery, self.DEGREE_OF_MASTERY)

    def test_get_multi_skill_mastery(self):
        degree_of_mastery = skill_services.get_multi_skill_mastery(
            self.USER_ID, self.SKILL_IDS)

        self.assertEqual(
            degree_of_mastery, [self.DEGREE_OF_MASTERY, self.DEGREE_OF_MASTERY])

    def test_get_all_skill_mastery(self):
        degree_of_mastery = skill_services.get_all_skill_mastery(self.USER_ID)

        self.assertEqual(
            degree_of_mastery, [self.DEGREE_OF_MASTERY, self.DEGREE_OF_MASTERY])

    def test_update_skill(self):
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_ADD_SKILL_MISCONCEPTION,
                'id': self.MISCONCEPTION_ID_2
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NAME),
                'id': self.MISCONCEPTION_ID_2,
                'old_value': '',
                'new_value': 'Name'
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Updated misconception name.')
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        skill_summary = skill_services.get_skill_summary_by_id(self.SKILL_ID)
        self.assertEqual(skill_summary.misconception_count, 2)
        self.assertEqual(skill_summary.version, 2)
        self.assertEqual(skill.version, 2)
        self.assertEqual(skill.misconceptions[1].name, 'Name')

    def test_delete_skill(self):
        skill_services.delete_skill(self.USER_ID, self.SKILL_ID)
        self.assertEqual(
            skill_services.get_skill_by_id(self.SKILL_ID, False), None)
        self.assertEqual(
            skill_services.get_skill_summary_by_id(self.SKILL_ID, False), None)
