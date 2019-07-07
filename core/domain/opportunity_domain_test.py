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

"""Tests for opportunity domain objects."""

from constants import constants
from core.domain import opportunity_domain
from core.tests import test_utils


class ExplorationOpportunitySummaryDomainTests(test_utils.GenericTestBase):
    """Test the ExplorationOpportunitySummary domain."""

    def setUp(self):
        super(ExplorationOpportunitySummaryDomainTests, self).setUp()
        self.mock_supported_audio_languages = [{
            'id': 'en'
        }, {
            'id': 'hi'
        }, {
            'id': 'hi-en'
        }]
        self.mock_supported_audio_languages_context = self.swap(
            constants, 'SUPPORTED_AUDIO_LANGUAGES',
            self.mock_supported_audio_languages)

        with self.mock_supported_audio_languages_context:
            self.valid_exp_opprtunity_summary = (
                opportunity_domain.ExplorationOpportunitySummary.from_dict({
                    'id': 'exp_1',
                    'topic_id': 'topic_1',
                    'topic_name': 'A topic',
                    'story_id': 'story_1',
                    'story_title': 'A new story',
                    'chapter_title': 'A new chapter',
                    'content_count': 5,
                    'incomplete_translation_languages': ['hi-en'],
                    'translation_count': {},
                    'need_voiceartist_in_languages': ['en'],
                    'assigned_voiceartist_in_languages': ['hi']
                }))
        # Re-initializing this swap, so that we can use this in test method.
        self.mock_supported_audio_languages_context = self.swap(
            constants, 'SUPPORTED_AUDIO_LANGUAGES',
            self.mock_supported_audio_languages)

    def test_from_dict_created_object_correctly(self):
        exploration_opportunity_summary_dict = {
            'id': 'exp_1',
            'topic_id': 'topic_1',
            'topic_name': 'A topic',
            'story_id': 'story_1',
            'story_title': 'A new story',
            'chapter_title': 'A new chapter',
            'content_count': 5,
            'incomplete_translation_languages': ['hi-en', 'hi'],
            'translation_count': {},
            'need_voiceartist_in_languages': ['en'],
            'assigned_voiceartist_in_languages': []
        }

        with self.mock_supported_audio_languages_context:
            obj = opportunity_domain.ExplorationOpportunitySummary.from_dict(
                exploration_opportunity_summary_dict)

        self.assertTrue(isinstance(
            obj, opportunity_domain.ExplorationOpportunitySummary))

    def test_invalid_topic_id_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opprtunity_summary.topic_id, basestring))
        with self.mock_supported_audio_languages_context:
            # Object with topic_id as string passes the validation check.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.topic_id = 5
            # Object with topic_id as int fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Expected topic_id to be a string, received 5')

    def test_invalid_topic_name_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opprtunity_summary.topic_name, basestring))

        with self.mock_supported_audio_languages_context:
            # Object with topic_name as string passes the validation check.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.topic_name = True
            # Object with topic_id as bool fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Expected topic_name to be a string, received True')

    def test_invalid_story_id_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opprtunity_summary.story_id, basestring))
        with self.mock_supported_audio_languages_context:
            # Object with story_id as string passes the validation check.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.story_id = 5
            # Object with story_id as int fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Expected story_id to be a string, received 5')

    def test_invalid_story_title_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opprtunity_summary.story_title, basestring))

        with self.mock_supported_audio_languages_context:
            # Object with story_title as string passes the validation check.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.story_title = True
            # Object with story_id as bool fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Expected story_title to be a string, received True')

    def test_invalid_chapter_title_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opprtunity_summary.chapter_title, basestring))

        with self.mock_supported_audio_languages_context:
            # Object with chapter_title as string passes the validation check.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.chapter_title = True
            # Object with chapter_id as bool fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Expected chapter_title to be a string, received True')

    def test_invalid_content_count_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opprtunity_summary.content_count, int))

        with self.mock_supported_audio_languages_context:
            # Object with content_count as int passes the validation check.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.content_count = '123abc'
            # Object with chapter_id as string fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Expected content_count to be an integer, received 123abc')

    def test_same_language_for_need_and_assigend_voiceartist_fails_validation(
            self):
        need_voiceartist_languages = (
            self.valid_exp_opprtunity_summary.need_voiceartist_in_languages)
        assigned_voiceartist_languages = (
            self.valid_exp_opprtunity_summary.assigned_voiceartist_in_languages)

        self.assertTrue(
            set(need_voiceartist_languages).isdisjoint(
                assigned_voiceartist_languages))
        with self.mock_supported_audio_languages_context:
            self.valid_exp_opprtunity_summary.validate()

            self.valid_exp_opprtunity_summary.need_voiceartist_in_languages = [
                'hi']
            self.valid_exp_opprtunity_summary.assigned_voiceartist_in_languages = [ # pylint: disable=line-too-long
                'hi', 'en']

            need_voiceartist_languages = (
                self.valid_exp_opprtunity_summary.need_voiceartist_in_languages)
            assigned_voiceartist_languages = (
                self.valid_exp_opprtunity_summary.assigned_voiceartist_in_languages) # pylint: disable=line-too-long
            self.assertFalse(
                set(need_voiceartist_languages).isdisjoint(
                    assigned_voiceartist_languages))

            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Expected voiceartist need and assigned list of languages '
                r'to be unique, received: \[\'hi\'\], \[\'hi\', \'en\'\]')

    def test_translation_count_with_invalid_language_code_fails_validation(
            self):
        self.valid_exp_opprtunity_summary.translation_count = {
            'hi': 4
        }
        with self.mock_supported_audio_languages_context:
            # Object with valid language_code in translation_count passes the
            # validation.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.translation_count = {
                'invalid_language_code': 4
            }
            # Object with chapter_id as boolean fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Invalid language_code: invalid_language_code')

    def test_translation_count_with_invalid_count_fails_validation(
            self):
        self.valid_exp_opprtunity_summary.translation_count = {
            'hi': 4
        }
        with self.mock_supported_audio_languages_context:
            # Object with valid language_code in translation_count passes the
            # validation.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.translation_count = {
                'hi': '12ab'
            }
            # Object with invalid language_code in translation_count fails the
            # validation.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Expected count for language_code hi to be an integer, '
                'received 12ab')

    def test_translation_count_with_invalid_count_type_fails_validation(
            self):
        self.valid_exp_opprtunity_summary.translation_count = {
            'hi': 4
        }
        with self.mock_supported_audio_languages_context:
            # Object with valid count in translation_count passes the
            # validation.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.translation_count = {
                'hi': '12ab'
            }
            # Object with invalid count in translation_count fails the
            # validation.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Expected count for language_code hi to be an integer, '
                'received 12ab')

    def test_translation_count_with_invalid_count_value_fails_validation(
            self):
        self.valid_exp_opprtunity_summary.content_count = 5
        self.valid_exp_opprtunity_summary.translation_count = {
            'hi': 4
        }
        with self.mock_supported_audio_languages_context:
            # Object with valid count value i.e, less than or equal to
            # content_count in translation_count passes the validation.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.translation_count = {
                'hi': 8
            }
            # Object with invalid count value i.e, more than content_count
            # in translation_count fails the validation.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Expected translation count for language_code hi to be an '
                r'less than or equal to content_count\(5\), received 8')

    def test_incomplete_translation_languages_with_invalid_language_code_fails_validation( # pylint: disable=line-too-long
            self):
        self.valid_exp_opprtunity_summary.incomplete_translation_languages = [
            'hi-en']
        with self.mock_supported_audio_languages_context:
            # Object with valid language code inside
            # incomplete_translation_languages passes the validation.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.incomplete_translation_languages = [ # pylint: disable=line-too-long
                'invalid_language_code']
            # Object with invalid language code inside
            # incomplete_translation_languages fails the validation.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Invalid language_code: invalid_language_code')

    def test_need_voiceartist_in_languages_with_invalid_language_code_fails_validation( # pylint: disable=line-too-long
            self):
        self.valid_exp_opprtunity_summary.need_voiceartist_in_languages = ['en']
        with self.mock_supported_audio_languages_context:
            # Object with valid language code inside
            # need_voiceartist_in_languages passes the validation.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.need_voiceartist_in_languages = [
                'invalid_language_code']
            # Object with invalid language code inside
            # need_voiceartist_in_languages fails the validation.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Invalid language_code: invalid_language_code')

    def test_assigned_voiceartist_in_languages_with_invalid_language_code_fails_validation( # pylint: disable=line-too-long
            self):
        self.valid_exp_opprtunity_summary.assigned_voiceartist_in_languages = [
            'hi']
        with self.mock_supported_audio_languages_context:
            # Object with valid language code inside
            # assigned_voiceartist_in_languages passes the validation.
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.assigned_voiceartist_in_languages = [ # pylint: disable=line-too-long
                'invalid_language_code']
            # Object with invalid language code inside
            # assigned_voiceartist_in_languages fails the validation.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Invalid language_code: invalid_language_code')

    def test_all_languages_in_summary_equals_supported_languages(self):
        self.valid_exp_opprtunity_summary.assigned_voiceartist_in_languages = [
            'hi-en']
        self.valid_exp_opprtunity_summary.need_voiceartist_in_languages = ['hi']
        self.valid_exp_opprtunity_summary.incomplete_translation_languages = [
            'en']
        with self.mock_supported_audio_languages_context:
            self.valid_exp_opprtunity_summary.validate()
            self.valid_exp_opprtunity_summary.need_voiceartist_in_languages = [
                'en']
            # Object with invalid language code inside
            # assigned_voiceartist_in_languages fails the validation.
            self._assert_validation_error(
                self.valid_exp_opprtunity_summary,
                'Expected set of all languages available in '
                'incomplete_translation, needs_voiceover and assigned_voiceover'
                ' to be the same as the supported audio languages, '
                r'received \[\'en\', \'hi-en\'\]')
