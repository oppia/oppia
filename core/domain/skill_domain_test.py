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
from core.domain import state_domain
from core.tests import test_utils
import feconf
import utils


class SkillDomainUnitTests(test_utils.GenericTestBase):
    """Test the skill domain object."""

    SKILL_ID = 'skill_id'
    MISCONCEPTION_ID = 0

    def setUp(self):
        super(SkillDomainUnitTests, self).setUp()
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', 'Explanation'), [
                    state_domain.SubtitledHtml('2', 'Example 1')],
            {'1': {}, '2': {}})
        misconceptions = [skill_domain.Misconception(
            self.MISCONCEPTION_ID, 'name', 'notes', 'default_feedback')]
        self.skill = skill_domain.Skill(
            self.SKILL_ID, 'Description', misconceptions,
            skill_contents, feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION, 'en', 0, 1,
            None, False
        )

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the skill passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.skill.validate()

    def _assert_valid_skill_id(self, expected_error_substring, skill_id):
        """Checks that the skill passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            skill_domain.Skill.require_valid_skill_id(skill_id)

    def test_valid_skill_id(self):
        self._assert_valid_skill_id('Skill id should be a string', 10)
        self._assert_valid_skill_id('Invalid skill id', 'abc')

    def test_description_validation(self):
        self.skill.description = 0
        self._assert_validation_error('Description should be a string')

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

        self.skill.skill_contents.worked_examples = [1]
        self._assert_validation_error(
            'Expected worked example to be a SubtitledHtml object')

        self.skill.skill_contents.explanation = 'explanation'
        self._assert_validation_error(
            'Expected skill explanation to be a SubtitledHtml object')

        self.skill.skill_contents = ''
        self._assert_validation_error(
            'Expected skill_contents to be a SkillContents object')

    def test_skill_contents_audio_validation(self):
        self.skill.skill_contents.worked_examples = [
            state_domain.SubtitledHtml('content_id_1', '<p>Hello</p>'),
            state_domain.SubtitledHtml('content_id_2', '<p>Hello 2</p>')
        ]
        self.skill.skill_contents.content_ids_to_audio_translations = {
            'content_id_3': {}
        }
        self._assert_validation_error(
            'Expected content_ids_to_audio_translations to contain only '
            'content_ids in worked examples and explanation.')

        self.skill.skill_contents.worked_examples = [
            state_domain.SubtitledHtml('content_id_1', '<p>Hello</p>'),
            state_domain.SubtitledHtml('content_id_1', '<p>Hello 2</p>')
        ]

        self._assert_validation_error('Found a duplicate content id')

    def test_misconception_id_validation(self):
        self.skill.misconceptions = [
            skill_domain.Misconception(
                self.MISCONCEPTION_ID, 'name', 'notes', 'default_feedback'),
            skill_domain.Misconception(
                self.MISCONCEPTION_ID, 'name 2', 'notes 2', 'default_feedback')]
        self._assert_validation_error('Duplicate misconception ID found')

    def test_skill_migration_validation(self):
        self.skill.superseding_skill_id = 'TestSkillId'
        self.skill.all_questions_merged = None
        self._assert_validation_error(
            'Expected a value for all_questions_merged when '
            'superseding_skill_id is set.')
        self.skill.superseding_skill_id = None
        self.skill.all_questions_merged = True
        self._assert_validation_error(
            'Expected a value for superseding_skill_id when '
            'all_questions_merged is True.')

    def test_create_default_skill(self):
        """Test the create_default_skill function."""
        skill = skill_domain.Skill.create_default_skill(
            self.SKILL_ID, 'Description')
        expected_skill_dict = {
            'id': self.SKILL_ID,
            'description': 'Description',
            'misconceptions': [],
            'skill_contents': {
                'explanation': {
                    'html': feconf.DEFAULT_SKILL_EXPLANATION,
                    'content_id': 'explanation'
                },
                'content_ids_to_audio_translations': {'explanation': {}},
                'worked_examples': []
            },
            'misconceptions_schema_version': (
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION
            ),
            'skill_contents_schema_version': (
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION
            ),
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'next_misconception_id': 0,
            'version': 0,
            'superseding_skill_id': None,
            'all_questions_merged': False
        }
        self.assertEqual(skill.to_dict(), expected_skill_dict)

    def test_conversion_to_and_from_dict(self):
        """Test that to_dict and from_dict preserve all data within a
        skill_contents and misconception object.
        """
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml('1', 'Explanation'), [
                state_domain.SubtitledHtml('2', 'Example 1')],
            {'1': {}, '2': {}})
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

    def test_skill_mastery_to_dict(self):
        expected_skill_mastery_dict = {
            'user_id': 'user',
            'skill_id': 'skill_id',
            'degree_of_mastery': '0.5'
        }
        observed_skill_mastery = skill_domain.UserSkillMastery.from_dict(
            expected_skill_mastery_dict)
        self.assertDictEqual(
            expected_skill_mastery_dict,
            observed_skill_mastery.to_dict())

    def test_skill_rights_to_dict(self):
        expected_dict = {
            'creator_id': 'user',
            'skill_is_private': True,
            'skill_id': 'skill_id'
        }
        skill_rights = skill_domain.SkillRights('skill_id', True, 'user')
        self.assertDictEqual(expected_dict, skill_rights.to_dict())

    def test_skill_rights_is_creator(self):
        skill_rights = skill_domain.SkillRights(self.SKILL_ID, True, 'user')
        self.assertTrue(skill_rights.is_creator('user'))
        self.assertFalse(skill_rights.is_creator('fakeuser'))
