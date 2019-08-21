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
            self.valid_exp_opp_summary = (
                opportunity_domain.ExplorationOpportunitySummary.from_dict({
                    'id': 'exp_1',
                    'topic_id': 'topic_1',
                    'topic_name': 'A topic',
                    'story_id': 'story_1',
                    'story_title': 'A new story',
                    'chapter_title': 'A new chapter',
                    'content_count': 5,
                    'incomplete_translation_language_codes': ['hi-en'],
                    'translation_counts': {},
                    'need_voice_artist_in_language_codes': ['en'],
                    'assigned_voice_artist_in_language_codes': ['hi']
                }))
        # Re-initializing this swap, so that we can use this in test method.
        self.mock_supported_audio_languages_context = self.swap(
            constants, 'SUPPORTED_AUDIO_LANGUAGES',
            self.mock_supported_audio_languages)

    def test_to_and_from_dict_works_correctly(self):
        exploration_opportunity_summary_dict = {
            'id': 'exp_1',
            'topic_id': 'topic_1',
            'topic_name': 'A topic',
            'story_id': 'story_1',
            'story_title': 'A new story',
            'chapter_title': 'A new chapter',
            'content_count': 5,
            'incomplete_translation_language_codes': ['hi-en', 'hi'],
            'translation_counts': {},
            'need_voice_artist_in_language_codes': ['en'],
            'assigned_voice_artist_in_language_codes': []
        }

        with self.mock_supported_audio_languages_context:
            obj = opportunity_domain.ExplorationOpportunitySummary.from_dict(
                exploration_opportunity_summary_dict)

        self.assertTrue(isinstance(
            obj, opportunity_domain.ExplorationOpportunitySummary))
        self.assertEqual(obj.to_dict(), {
            'id': 'exp_1',
            'topic_name': 'A topic',
            'story_title': 'A new story',
            'chapter_title': 'A new chapter',
            'content_count': 5,
            'translation_counts': {},
        })

    def test_invalid_topic_id_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opp_summary.topic_id, basestring))
        with self.mock_supported_audio_languages_context:
            # Object with topic_id as string passes the validation check.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.topic_id = 5
            # Object with topic_id as int fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected topic_id to be a string, received 5')

    def test_invalid_topic_name_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opp_summary.topic_name, basestring))

        with self.mock_supported_audio_languages_context:
            # Object with topic_name as string passes the validation check.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.topic_name = True
            # Object with topic_id as bool fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected topic_name to be a string, received True')

    def test_invalid_story_id_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opp_summary.story_id, basestring))
        with self.mock_supported_audio_languages_context:
            # Object with story_id as string passes the validation check.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.story_id = 5
            # Object with story_id as int fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected story_id to be a string, received 5')

    def test_invalid_story_title_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opp_summary.story_title, basestring))

        with self.mock_supported_audio_languages_context:
            # Object with story_title as string passes the validation check.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.story_title = True
            # Object with story_id as bool fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected story_title to be a string, received True')

    def test_invalid_chapter_title_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opp_summary.chapter_title, basestring))

        with self.mock_supported_audio_languages_context:
            # Object with chapter_title as string passes the validation check.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.chapter_title = True
            # Object with chapter_id as bool fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected chapter_title to be a string, received True')

    def test_invalid_content_count_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opp_summary.content_count, int))

        with self.mock_supported_audio_languages_context:
            # Object with content_count as int passes the validation check.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.content_count = '123abc'
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected content_count to be an integer, received 123abc')

    def test_negative_content_count_fails_validation_check(self):
        self.assertTrue(isinstance(
            self.valid_exp_opp_summary.content_count, int))

        with self.mock_supported_audio_languages_context:
            # Object with content_count as int passes the validation check.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.content_count = -5
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected content_count to be a non-negative integer, '
                'received -5')

    def test_same_language_for_need_and_assigend_voice_artist_fails_validation(
            self):
        need_voice_artist_languages = (
            self.valid_exp_opp_summary.need_voice_artist_in_language_codes)
        assigned_voice_artist_languages = (
            self.valid_exp_opp_summary.assigned_voice_artist_in_language_codes
            )

        self.assertTrue(
            set(need_voice_artist_languages).isdisjoint(
                assigned_voice_artist_languages))
        with self.mock_supported_audio_languages_context:
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.need_voice_artist_in_language_codes = [
                'hi']
            valid_exp_opp_summary = self.valid_exp_opp_summary
            valid_exp_opp_summary.assigned_voice_artist_in_language_codes = [
                'hi', 'en']
            need_voice_artist_languages = (
                valid_exp_opp_summary.need_voice_artist_in_language_codes)
            assigned_voice_artist_languages = (
                valid_exp_opp_summary.assigned_voice_artist_in_language_codes)
            self.assertFalse(
                set(need_voice_artist_languages).isdisjoint(
                    assigned_voice_artist_languages))

            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected voice_artist "needed" and "assigned" list of '
                'languages to be disjoint, received: '
                r'\[\'hi\'\], \[\'hi\', \'en\'\]')

    def test_translation_counts_with_invalid_language_code_fails_validation(
            self):
        self.valid_exp_opp_summary.translation_counts = {
            'hi': 4
        }
        with self.mock_supported_audio_languages_context:
            # Object with valid language_code in translation_counts passes the
            # validation.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.translation_counts = {
                'invalid_language_code': 4
            }
            # Object with chapter_id as boolean fails the validation check.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Invalid language_code: invalid_language_code')

    def test_translation_counts_with_invalid_count_fails_validation(
            self):
        self.valid_exp_opp_summary.translation_counts = {
            'hi': 4
        }
        with self.mock_supported_audio_languages_context:
            # Object with valid language_code in translation_counts passes the
            # validation.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.translation_counts = {
                'hi': -5
            }
            # Object with invalid language_code in translation_counts fails the
            # validation.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected count for language_code hi to be a non-negative '
                'integer, received -5')

    def test_translation_counts_with_invalid_count_type_fails_validation(
            self):
        self.valid_exp_opp_summary.translation_counts = {
            'hi': 4
        }
        with self.mock_supported_audio_languages_context:
            # Object with valid count in translation_counts passes the
            # validation.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.translation_counts = {
                'hi': '12ab'
            }
            # Object with invalid count in translation_counts fails the
            # validation.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected count for language_code hi to be an integer, '
                'received 12ab')

    def test_translation_counts_with_invalid_count_value_fails_validation(
            self):
        self.valid_exp_opp_summary.content_count = 5
        self.valid_exp_opp_summary.translation_counts = {
            'hi': 4
        }
        with self.mock_supported_audio_languages_context:
            # Object with valid count value i.e, less than or equal to
            # content_count in translation_counts passes the validation.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.translation_counts = {
                'hi': 8
            }
            # Object with invalid count value i.e, more than content_count
            # in translation_counts fails the validation.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected translation count for language_code hi to be '
                r'less than or equal to content_count\(5\), received 8')

    def test_invalid_lang_code_in_incomplete_translation_langs_fails_validation(
            self):
        self.valid_exp_opp_summary.incomplete_translation_language_codes = [
            'hi-en']
        with self.mock_supported_audio_languages_context:
            # Object with valid language code inside
            # incomplete_translation_language_codes passes the validation.
            self.valid_exp_opp_summary.validate()
            valid_exp_opp_summary = self.valid_exp_opp_summary
            valid_exp_opp_summary.incomplete_translation_language_codes = [
                'invalid_language_code']
            # Object with invalid language code inside
            # incomplete_translation_language_codes fails the validation.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Invalid language_code: invalid_language_code')

    def test_invalid_lang_code_in_need_voice_artist_languages_fails_validation(
            self):
        self.valid_exp_opp_summary.need_voice_artist_in_language_codes = ['en']
        with self.mock_supported_audio_languages_context:
            # Object with valid language code inside
            # need_voice_artist_in_language_codes passes the validation.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.need_voice_artist_in_language_codes = [
                'invalid_language_code']
            # Object with invalid language code inside
            # need_voice_artist_in_language_codes fails the validation.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Invalid language_code: invalid_language_code')

    def test_invalid_lang_code_in_assigned_voice_artist_langs_fails_validation(
            self):
        self.valid_exp_opp_summary.assigned_voice_artist_in_language_codes = [
            'hi']
        with self.mock_supported_audio_languages_context:
            # Object with valid language code inside
            # assigned_voice_artist_in_language_codes passes the validation.
            self.valid_exp_opp_summary.validate()
            valid_exp_opp_summary = self.valid_exp_opp_summary
            valid_exp_opp_summary.assigned_voice_artist_in_language_codes = [
                'invalid_language_code']
            # Object with invalid language code inside
            # assigned_voice_artist_in_language_codes fails the validation.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Invalid language_code: invalid_language_code')

    def test_all_languages_in_summary_equals_supported_languages(self):
        self.valid_exp_opp_summary.assigned_voice_artist_in_language_codes = [
            'hi-en']
        self.valid_exp_opp_summary.need_voice_artist_in_language_codes = ['hi']
        self.valid_exp_opp_summary.incomplete_translation_language_codes = [
            'en']
        with self.mock_supported_audio_languages_context:
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.need_voice_artist_in_language_codes = [
                'en']
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected set of all languages available in '
                'incomplete_translation, needs_voiceover and assigned_voiceover'
                ' to be the same as the supported audio languages, '
                r'received \[\'en\', \'hi-en\'\]')
