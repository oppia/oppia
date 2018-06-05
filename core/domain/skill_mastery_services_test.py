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

from core.domain import skill_services
from core.tests import test_utils

class SkillMasteryServicesUnitTests(test_utils.GenericTestBase):
    """Test the skill services module."""

    SKILL_IDS = []
    USER_ID = 'user'
    DEGREE_OF_MASTERY = 0.0
    DEGREE_OF_MASTERY_1 = 0.5

    def setUp(self):
        super(SkillMasteryServicesUnitTests, self).setUp()
        self.SKILL_ID = skill_services.get_new_skill_id()
        self.SKILL_ID_1 = skill_services.get_new_skill_id()
        self.SKILL_IDS = [self.SKILL_ID, self.SKILL_ID_1]
        skill_services.create_user_skill_mastery(
            self.USER_ID, self.SKILL_ID, self.DEGREE_OF_MASTERY)
        skill_services.create_user_skill_mastery(
            self.USER_ID, self.SKILL_ID_1, self.DEGREE_OF_MASTERY_1)

    def test_get_skill_mastery(self):
        degree_of_mastery = skill_services.get_skill_mastery(
            self.USER_ID, self.SKILL_ID)

        self.assertEqual(degree_of_mastery, self.DEGREE_OF_MASTERY)

    def test_get_multi_skill_mastery(self):
        degree_of_mastery = skill_services.get_multi_skill_mastery(
            self.USER_ID, self.SKILL_IDS)

        self.assertEqual(degree_of_mastery, ([
            self.DEGREE_OF_MASTERY, self.DEGREE_OF_MASTERY_1]))

    def get_mastery_for_all_skills(self):
        degree_of_mastery = skill_services.get_all_skill_mastery(self.USER_ID)

        self.assertEqual(degree_of_mastery, ({
            self.SKILL_ID_1: self.DEGREE_OF_MASTERY_1,
            self.SKILL_ID: self.DEGREE_OF_MASTERY
        }))
