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

import datetime

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
                '1', '<p>Explanation</p>'), [
                    state_domain.SubtitledHtml('2', '<p>Example 1</p>')],
            {'1': {}, '2': {}}, state_domain.WrittenTranslations.from_dict(
                {'translations_mapping': {'1': {}, '2': {}}}))
        misconceptions = [skill_domain.Misconception(
            self.MISCONCEPTION_ID, 'name', '<p>notes</p>',
            '<p>default_feedback</p>')]
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

    def test_valid_misconception_id(self):
        self.skill.next_misconception_id = 'invalid_id'
        self._assert_validation_error(
            'Expected misconception ID to be an integer')

    def test_valid_content_ids_to_audio_translations(self):
        self.skill.skill_contents.content_ids_to_audio_translations = []
        self._assert_validation_error(
            'Expected state content_ids_to_audio_translations to be a dict')

    def test_valid_content_id(self):
        self.skill.skill_contents.content_ids_to_audio_translations = {
            1: {}
        }
        self._assert_validation_error('Expected content_id to be a string')

    def test_valid_audio_translations(self):
        self.skill.skill_contents.content_ids_to_audio_translations = {
            'content_id': []
        }
        self._assert_validation_error(
            'Expected audio_translations to be a dict')

    def test_valid_language_code_type(self):
        self.skill.skill_contents.content_ids_to_audio_translations = {
            'content_id': {
                1: state_domain.WrittenTranslations.from_dict(
                    {'translations_mapping': {'1': {}, '2': {}}})
            }
        }
        self._assert_validation_error('Expected language code to be a string')

    def test_valid_language_code(self):
        self.skill.skill_contents.content_ids_to_audio_translations = {
            'content_id': {
                'invalid_language_code': (
                    state_domain.WrittenTranslations.from_dict(
                        {'translations_mapping': {'1': {}, '2': {}}}))
            }
        }
        self._assert_validation_error('Unrecognized language code')

    def test_valid_translation(self):
        self.skill.skill_contents.content_ids_to_audio_translations = {
            'content_id': {
                'en': state_domain.AudioTranslation.from_dict({
                    'filename': 'file.mp3',
                    'file_size_bytes': 'size',
                    'needs_update': True
                })
            }
        }

        self._assert_validation_error('Expected file size to be an int')

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

    def test_misconception_validation_with_invalid_html_in_notes(self):
        self.skill.misconceptions[0].notes = '<a>Test</a>'
        self._assert_validation_error(
            'Invalid html: <a>Test</a> for rte with invalid tags and '
            'strings: {\'invalidTags\': \\[u\'a\'], '
            '\'strings\': \\[\'<a>Test</a>\']}')

    def test_misconception_validation_with_invalid_customization_args_in_notes(
            self):
        self.skill.misconceptions[0].notes = (
            '<oppia-noninteractive-image></oppia-noninteractive-image>')
        self._assert_validation_error(
            'Invalid html: <oppia-noninteractive-image>'
            '</oppia-noninteractive-image> due to errors in '
            'customization_args: {"Missing attributes: '
            '\\[u\'alt-with-value\', u\'caption-with-value\', '
            'u\'filepath-with-value\'], Extra attributes: \\[]": '
            '\\[\'<oppia-noninteractive-image>'
            '</oppia-noninteractive-image>\']}')

    def test_misconception_validation_with_invalid_html_in_feedback(self):
        self.skill.misconceptions[0].feedback = '<a>Test</a>'
        self._assert_validation_error(
            'Invalid html: <a>Test</a> for rte with invalid tags and '
            'strings: {\'invalidTags\': \\[u\'a\'], '
            '\'strings\': \\[\'<a>Test</a>\']}')

    def test_misconception_validation_with_invalid_customization_args_in_feedback(self): # pylint: disable=line-too-long
        self.skill.misconceptions[0].feedback = (
            '<oppia-noninteractive-image></oppia-noninteractive-image>')
        self._assert_validation_error(
            'Invalid html: <oppia-noninteractive-image>'
            '</oppia-noninteractive-image> due to errors in '
            'customization_args: {"Missing attributes: '
            '\\[u\'alt-with-value\', u\'caption-with-value\', '
            'u\'filepath-with-value\'], Extra attributes: \\[]": '
            '\\[\'<oppia-noninteractive-image>'
            '</oppia-noninteractive-image>\']}')

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
        self.skill.update_worked_examples([
            {
                'content_id': 'content_id_1',
                'html': '<p>Hello</p>'
            },
            {
                'content_id': 'content_id_2',
                'html': '<p>Hello 2</p>'
            }
        ])
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
                self.MISCONCEPTION_ID, 'name', '<p>notes</p>',
                '<p>default_feedback</p>'),
            skill_domain.Misconception(
                self.MISCONCEPTION_ID, 'name 2', '<p>notes 2</p>',
                '<p>default_feedback</p>')]
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
                'content_ids_to_audio_translations': {
                    'explanation': {}
                },
                'written_translations': {
                    'translations_mapping': {
                        'explanation': {}
                    }
                },
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
            state_domain.SubtitledHtml('1', '<p>Explanation</p>'), [
                state_domain.SubtitledHtml('2', '<p>Example 1</p>')],
            {'1': {}, '2': {}}, state_domain.WrittenTranslations.from_dict(
                {'translations_mapping': {'1': {}, '2': {}}}))
        skill_contents_dict = skill_contents.to_dict()
        skill_contents_from_dict = skill_domain.SkillContents.from_dict(
            skill_contents_dict)

        misconceptions = skill_domain.Misconception(
            self.MISCONCEPTION_ID, 'Tag Name', '<p>Description</p>',
            '<p>Feedback</p>')
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

    def test_require_valid_description_with_empty_description_raise_error(self):
        with self.assertRaisesRegexp(
            Exception, 'Description field should not be empty'):
            self.skill.require_valid_description('')

    def test_misconception_id_range(self):
        self.skill.misconceptions[0].id = 5
        self._assert_validation_error(
            'The misconception with id 5 is out of bounds')


class SkillChangeTests(test_utils.GenericTestBase):

    def test_skill_change_object_with_missing_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'):
            skill_domain.SkillChange({'invalid': 'data'})

    def test_skill_change_object_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'):
            skill_domain.SkillChange({'cmd': 'invalid'})

    def test_skill_change_object_with_missing_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_value, old_value')):
            skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'name',
            })

    def test_skill_change_object_with_extra_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            skill_domain.SkillChange({
                'cmd': 'add_skill_misconception',
                'new_misconception_dict': {
                    'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
                    'feedback': '<p>default_feedback</p>'},
                'invalid': 'invalid'
            })

    def test_skill_change_object_with_invalid_skill_property(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd update_skill_property: '
                'invalid is not allowed')):
            skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_skill_change_object_with_invalid_skill_misconception_property(
            self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd '
                'update_skill_misconceptions_property: invalid is not '
                'allowed')):
            skill_domain.SkillChange({
                'cmd': 'update_skill_misconceptions_property',
                'misconception_id': 'id',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_skill_change_object_with_invalid_skill_contents_property(
            self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd '
                'update_skill_contents_property: invalid is not allowed')):
            skill_domain.SkillChange({
                'cmd': 'update_skill_contents_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_skill_change_object_with_add_skill_misconception(self):
        skill_change_object = skill_domain.SkillChange({
            'cmd': 'add_skill_misconception',
            'new_misconception_dict': {
                'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
                'feedback': '<p>default_feedback</p>'},
        })

        self.assertEqual(skill_change_object.cmd, 'add_skill_misconception')
        self.assertEqual(
            skill_change_object.new_misconception_dict, {
                'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
                'feedback': '<p>default_feedback</p>'})

    def test_skill_change_object_with_delete_skill_misconception(self):
        skill_change_object = skill_domain.SkillChange({
            'cmd': 'delete_skill_misconception',
            'misconception_id': 'id'
        })

        self.assertEqual(
            skill_change_object.cmd, 'delete_skill_misconception')
        self.assertEqual(skill_change_object.misconception_id, 'id')

    def test_skill_change_object_with_update_skill_misconceptions_property(
            self):
        skill_change_object = skill_domain.SkillChange({
            'cmd': 'update_skill_misconceptions_property',
            'misconception_id': 'id',
            'property_name': 'name',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(
            skill_change_object.cmd, 'update_skill_misconceptions_property')
        self.assertEqual(skill_change_object.misconception_id, 'id')
        self.assertEqual(skill_change_object.property_name, 'name')
        self.assertEqual(skill_change_object.new_value, 'new_value')
        self.assertEqual(skill_change_object.old_value, 'old_value')

    def test_skill_change_object_with_update_skill_property(
            self):
        skill_change_object = skill_domain.SkillChange({
            'cmd': 'update_skill_property',
            'property_name': 'description',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(skill_change_object.cmd, 'update_skill_property')
        self.assertEqual(skill_change_object.property_name, 'description')
        self.assertEqual(skill_change_object.new_value, 'new_value')
        self.assertEqual(skill_change_object.old_value, 'old_value')

    def test_skill_change_object_with_update_skill_contents_property(
            self):
        skill_change_object = skill_domain.SkillChange({
            'cmd': 'update_skill_contents_property',
            'property_name': 'explanation',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(
            skill_change_object.cmd, 'update_skill_contents_property')
        self.assertEqual(skill_change_object.property_name, 'explanation')
        self.assertEqual(skill_change_object.new_value, 'new_value')
        self.assertEqual(skill_change_object.old_value, 'old_value')

    def test_skill_change_object_with_create_new(self):
        skill_change_object = skill_domain.SkillChange({
            'cmd': 'create_new'
        })

        self.assertEqual(skill_change_object.cmd, 'create_new')

    def test_skill_change_object_with_migrate_contents_schema_to_latest_version(
            self):
        skill_change_object = skill_domain.SkillChange({
            'cmd': 'migrate_contents_schema_to_latest_version',
            'from_version': 'from_version',
            'to_version': 'to_version',
        })

        self.assertEqual(
            skill_change_object.cmd,
            'migrate_contents_schema_to_latest_version')
        self.assertEqual(skill_change_object.from_version, 'from_version')
        self.assertEqual(skill_change_object.to_version, 'to_version')

    def test_skill_change_object_with_migrate_misconceptions_schema_to_latest_version( # pylint: disable=line-too-long
            self):
        skill_change_object = skill_domain.SkillChange({
            'cmd': 'migrate_misconceptions_schema_to_latest_version',
            'from_version': 'from_version',
            'to_version': 'to_version'
        })

        self.assertEqual(
            skill_change_object.cmd,
            'migrate_misconceptions_schema_to_latest_version')
        self.assertEqual(skill_change_object.from_version, 'from_version')
        self.assertEqual(skill_change_object.to_version, 'to_version')

    def test_to_dict(self):
        skill_change_dict = {
            'cmd': 'migrate_misconceptions_schema_to_latest_version',
            'from_version': 'from_version',
            'to_version': 'to_version'
        }
        skill_change_object = skill_domain.SkillChange(skill_change_dict)
        self.assertEqual(skill_change_object.to_dict(), skill_change_dict)


class SkillRightsChangeTests(test_utils.GenericTestBase):

    def test_skill_rights_change_object_with_missing_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'):
            skill_domain.SkillRightsChange({'invalid': 'data'})

    def test_skill_change_rights_object_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'):
            skill_domain.SkillRightsChange({'cmd': 'invalid'})

    def test_skill_rights_change_object_with_extra_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            skill_domain.SkillRightsChange({
                'cmd': 'publish_skill',
                'invalid': 'invalid'
            })

    def test_skill_rights_change_object_with_create_new(self):
        skill_rights_change_object = skill_domain.SkillRightsChange({
            'cmd': 'create_new'
        })

        self.assertEqual(skill_rights_change_object.cmd, 'create_new')

    def test_skill_rights_change_object_with_publish_skill(self):
        skill_rights_change_object = skill_domain.SkillRightsChange({
            'cmd': 'publish_skill'
        })

        self.assertEqual(skill_rights_change_object.cmd, 'publish_skill')

    def test_to_dict(self):
        skill_rights_change_dict = {
            'cmd': 'publish_skill'
        }
        skill_rights_change_object = skill_domain.SkillRightsChange(
            skill_rights_change_dict)
        self.assertEqual(
            skill_rights_change_object.to_dict(), skill_rights_change_dict)


class SkillSummaryTests(test_utils.GenericTestBase):

    def setUp(self):
        super(SkillSummaryTests, self).setUp()
        current_time = datetime.datetime.utcnow()
        time_in_millisecs = utils.get_time_in_millisecs(current_time)
        self.skill_summary_dict = {
            'id': 'skill_id',
            'description': 'description',
            'language_code': 'en',
            'version': 1,
            'misconception_count': 1,
            'worked_examples_count': 1,
            'skill_model_created_on': time_in_millisecs,
            'skill_model_last_updated': time_in_millisecs
        }

        self.skill_summary = skill_domain.SkillSummary(
            'skill_id', 'description', 'en', 1, 1, 1,
            current_time, current_time)

    def test_skill_summary_gets_created(self):
        self.assertEqual(
            self.skill_summary.to_dict(), self.skill_summary_dict)

    def test_validation_passes_with_valid_properties(self):
        self.skill_summary.validate()

    def test_validation_fails_with_invalid_description(self):
        self.skill_summary.description = 0
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Description should be a string.'):
            self.skill_summary.validate()

    def test_validation_fails_with_empty_description(self):
        self.skill_summary.description = ''
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Description field should not be empty'):
            self.skill_summary.validate()

    def test_validation_fails_with_invalid_language_code(self):
        self.skill_summary.language_code = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected language code to be a string, received 0'):
            self.skill_summary.validate()

    def test_validation_fails_with_unallowed_language_code(self):
        self.skill_summary.language_code = 'invalid'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid language code: invalid'):
            self.skill_summary.validate()

    def test_validation_fails_with_invalid_misconception_count(self):
        self.skill_summary.misconception_count = '10'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected misconception_count to be an int, received \'10\''):
            self.skill_summary.validate()

    def test_validation_fails_with_negative_misconception_count(self):
        self.skill_summary.misconception_count = -1
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Expected misconception_count to be non-negative, '
                'received \'-1\'')):
            self.skill_summary.validate()

    def test_validation_fails_with_invalid_worked_examples_count(self):
        self.skill_summary.worked_examples_count = '10'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected worked_examples_count to be an int, received \'10\''):
            self.skill_summary.validate()

    def test_validation_fails_with_negative_worked_examples_count(self):
        self.skill_summary.worked_examples_count = -1
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Expected worked_examples_count to be non-negative, '
                'received \'-1\'')):
            self.skill_summary.validate()
