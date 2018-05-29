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
import utils


class SkillDomainUnitTests(test_utils.GenericTestBase):
    """Test the skill domain object."""

    SKILL_ID = 'skill_id'
    MISCONCEPTION_ID = 'misconception_id'

    def setUp(self):
        super(SkillDomainUnitTests, self).setUp()
        skill_contents = skill_domain.SkillContents(
            'Explanation', ['Example 1'])
        misconceptions = [skill_domain.Misconception(
            self.MISCONCEPTION_ID, 'name', 'notes', 'default_feedback')]
        self.skill = skill_domain.Skill(
            self.SKILL_ID, 'Description', misconceptions,
            skill_contents, feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION, 'en', 0
        )

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the skill passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.skill.validate()

    def test_description_validation(self):
        self.skill.description = 0
        self._assert_validation_error('Expected description to be a string')

    def test_language_code_validation(self):
        self.skill.language_code = 0
        self._assert_validation_error('Expected language code to be a string')

        self.skill.language_code = 'xz'
        self._assert_validation_error('Invalid language code')

    def test_schema_versions_validation(self):
        self.skill.skill_contents_schema_version = 100
        self._assert_validation_error(
            'Expected skill contents schema version to be %s' %
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION)

        self.skill.skill_contents_schema_version = 'a'
        self._assert_validation_error(
            'Expected skill contents schema version to be an integer')

        self.skill.misconceptions_schema_version = 100
        self._assert_validation_error(
            'Expected misconceptions schema version to be %s' %
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION)

        self.skill.misconceptions_schema_version = 'a'
        self._assert_validation_error(
            'Expected misconceptions schema version to be an integer')

    def test_misconception_validation(self):
        self.skill.misconceptions[0].feedback = 0
        self._assert_validation_error(
            'Expected misconception feedback to be a string')

        self.skill.misconceptions[0].notes = 0
        self._assert_validation_error(
            'Expected misconception notes to be a string')

        self.skill.misconceptions[0].name = 0
        self._assert_validation_error(
            'Expected misconception name to be a string')

        self.skill.misconceptions = ['']
        self._assert_validation_error(
            'Expected each misconception to be a Misconception object')

        self.skill.misconceptions = ''
        self._assert_validation_error('Expected misconceptions to be a list')

    def test_skill_contents_validation(self):
        self.skill.skill_contents.worked_examples = ''
        self._assert_validation_error('Expected worked examples to be a list')

        self.skill.skill_contents.explanation = 0
        self._assert_validation_error(
            'Expected skill explanation to be a string')

        self.skill.skill_contents = ''
        self._assert_validation_error(
            'Expected skill_contents to be a SkillContents object')

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

    def test_conversion_to_and_from_dict(self):
        """Test that to_dict and from_dict preserve all data within a
        skill_contents and misconception object.
        """
        skill_contents = skill_domain.SkillContents(
            'Explanation', ['example_1'])
        skill_contents_dict = skill_contents.to_dict()
        skill_contents_from_dict = skill_domain.SkillContents.from_dict(
            skill_contents_dict)

        misconceptions = skill_domain.Misconception(
            self.MISCONCEPTION_ID, 'Tag Name', 'Description', 'Feedback')
        misconceptions_dict = misconceptions.to_dict()
        misconceptions_from_dict = skill_domain.Misconception.from_dict(
            misconceptions_dict)
        self.assertEqual(
            skill_contents_from_dict.to_dict(), skill_contents_dict)
        self.assertEqual(
            misconceptions_from_dict.to_dict(), misconceptions_dict)
