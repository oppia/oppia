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

"""Tests for skill domain objects and methods defined on them."""

from constants import constants
from core.domain import skill_domain
from core.tests import test_utils
import feconf


class SkillDomainUnitTests(test_utils.GenericTestBase):
    """Test the skill domain object."""

    SKILL_ID = 'skill_id'

    def test_create_default_skill(self):
        """Test the create_default_skill function.
        """
        skill = skill_domain.Skill.create_default_skill(self.SKILL_ID)
        expected_skill_dict = {
            'id': self.SKILL_ID,
            'description': feconf.DEFAULT_SKILL_DESCRIPTION,
            'misconceptions': [],
            'skill_contents': {
                'explanation': feconf.DEFAULT_SKILL_EXPLANATION,
                'worked_examples': []
            },
            'misconceptions_schema_version': (
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION
            ),
            'skill_contents_schema_version': (
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION
            ),
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }
        self.assertEqual(skill.to_dict(), expected_skill_dict)

    def test_export_import(self):
        """Test that to_dict and from_dict preserve all data within a
        skill_contents and misconception object.
        """
        skill_contents = skill_domain.SkillContents(
            'Explanation', ['example_1'])
        skill_contents_dict = skill_contents.to_dict()
        skill_contents_from_dict = skill_domain.SkillContents.from_dict(
            skill_contents_dict)

        misconceptions = skill_domain.Misconception(
            'Tag Name', 'Description', 'Feedback')
        misconceptions_dict = misconceptions.to_dict()
        misconceptions_from_dict = skill_domain.Misconception.from_dict(
            misconceptions_dict)
        self.assertEqual(
            skill_contents_from_dict.to_dict(), skill_contents_dict)
        self.assertEqual(
            misconceptions_from_dict.to_dict(), misconceptions_dict)
