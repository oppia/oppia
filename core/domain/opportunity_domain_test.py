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

from __future__ import annotations

import re

from core.constants import constants
from core.domain import opportunity_domain
from core.tests import test_utils


class ExplorationOpportunitySummaryDomainTests(test_utils.GenericTestBase):
    """Test the ExplorationOpportunitySummary domain."""

    def setUp(self) -> None:
        super().setUp()
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
                    'language_codes_needing_voice_artists': ['en'],
                    'language_codes_with_assigned_voice_artists': ['hi'],
                    'translation_in_review_counts': {},
                    'is_pinned': False
                }))
        # Re-initializing this swap, so that we can use this in test method.
        self.mock_supported_audio_languages_context = self.swap(
            constants, 'SUPPORTED_AUDIO_LANGUAGES',
            self.mock_supported_audio_languages)

    def test_to_and_from_dict_works_correctly(self) -> None:
        exploration_opportunity_summary_dict: (
            opportunity_domain.ExplorationOpportunitySummaryDict
        ) = {
            'id': 'exp_1',
            'topic_id': 'topic_1',
            'topic_name': 'A topic',
            'story_id': 'story_1',
            'story_title': 'A new story',
            'chapter_title': 'A new chapter',
            'content_count': 5,
            'incomplete_translation_language_codes': ['hi-en', 'hi'],
            'translation_counts': {},
            'language_codes_needing_voice_artists': ['en'],
            'language_codes_with_assigned_voice_artists': [],
            'translation_in_review_counts': {},
            'is_pinned': False
        }

        with self.mock_supported_audio_languages_context:
            obj = opportunity_domain.ExplorationOpportunitySummary.from_dict(
                exploration_opportunity_summary_dict)

        self.assertIsInstance(
            obj, opportunity_domain.ExplorationOpportunitySummary)
        self.assertEqual(obj.to_dict(), {
            'id': 'exp_1',
            'topic_name': 'A topic',
            'story_title': 'A new story',
            'chapter_title': 'A new chapter',
            'content_count': 5,
            'translation_counts': {},
            'translation_in_review_counts': {},
            'is_pinned': False
        })

    def test_negative_content_count_fails_validation_check(self) -> None:
        self.assertTrue(isinstance(
            self.valid_exp_opp_summary.content_count, int))

        with self.mock_supported_audio_languages_context:
            # Object with content_count as int passes the validation check.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.content_count = -5
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Expected content_count to be a non-negative integer, '
                'received -5'
            )

    def test_same_language_for_need_and_assigend_voice_artist_fails_validation(
        self
    ) -> None:
        need_voice_artist_languages = (
            self.valid_exp_opp_summary.language_codes_needing_voice_artists)
        assigned_voice_artist_languages = (
            self.valid_exp_opp_summary.
            language_codes_with_assigned_voice_artists)

        self.assertTrue(
            set(need_voice_artist_languages).isdisjoint(
                assigned_voice_artist_languages))
        with self.mock_supported_audio_languages_context:
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.language_codes_needing_voice_artists = [
                'hi']
            valid_exp_opp_summary = self.valid_exp_opp_summary
            valid_exp_opp_summary.language_codes_with_assigned_voice_artists = [
                'hi', 'en']
            need_voice_artist_languages = (
                valid_exp_opp_summary.language_codes_needing_voice_artists)
            assigned_voice_artist_languages = (
                valid_exp_opp_summary.
                language_codes_with_assigned_voice_artists)
            self.assertFalse(
                set(need_voice_artist_languages).isdisjoint(
                    assigned_voice_artist_languages))

            self._assert_validation_error(
                self.valid_exp_opp_summary,
                re.escape(
                    'Expected voice_artist "needed" and "assigned" list of '
                    'languages to be disjoint, received: '
                    '[\'hi\'], [\'hi\', \'en\']'
                )
            )

    def test_translation_counts_with_invalid_language_code_fails_validation(
        self
    ) -> None:
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
                'Invalid language_code: invalid_language_code'
            )

    def test_translation_counts_with_invalid_count_fails_validation(
        self
    ) -> None:
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
                'integer, received -5'
            )

    def test_translation_counts_with_invalid_count_value_fails_validation(
        self
    ) -> None:
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
                r'less than or equal to content_count\(5\), received 8'
            )

    def test_invalid_lang_code_in_incomplete_translation_langs_fails_validation(
        self
    ) -> None:
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
                'Invalid language_code: invalid_language_code'
            )

    def test_invalid_lang_code_in_need_voice_artist_languages_fails_validation(
        self
    ) -> None:
        self.valid_exp_opp_summary.language_codes_needing_voice_artists = ['en']
        with self.mock_supported_audio_languages_context:
            # Object with valid language code inside
            # language_codes_needing_voice_artists passes the validation.
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.language_codes_needing_voice_artists = [
                'invalid_language_code']
            # Object with invalid language code inside
            # language_codes_needing_voice_artists fails the validation.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Invalid language_code: invalid_language_code'
            )

    def test_invalid_lang_code_in_assigned_voice_artist_langs_fails_validation(
        self
    ) -> None:
        (
            self.valid_exp_opp_summary.
            language_codes_with_assigned_voice_artists) = ['hi']
        with self.mock_supported_audio_languages_context:
            # Object with valid language code inside
            # language_codes_with_assigned_voice_artists passes the validation.
            self.valid_exp_opp_summary.validate()
            valid_exp_opp_summary = self.valid_exp_opp_summary
            valid_exp_opp_summary.language_codes_with_assigned_voice_artists = [
                'invalid_language_code']
            # Object with invalid language code inside
            # language_codes_with_assigned_voice_artists fails the validation.
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                'Invalid language_code: invalid_language_code'
            )

    def test_all_languages_in_summary_equals_supported_languages(self) -> None:
        (
            self.valid_exp_opp_summary
            .language_codes_with_assigned_voice_artists
        ) = ['hi-en']
        self.valid_exp_opp_summary.language_codes_needing_voice_artists = ['hi']
        self.valid_exp_opp_summary.incomplete_translation_language_codes = [
            'en']
        with self.mock_supported_audio_languages_context:
            self.valid_exp_opp_summary.validate()
            self.valid_exp_opp_summary.language_codes_needing_voice_artists = [
                'en']
            self._assert_validation_error(
                self.valid_exp_opp_summary,
                re.escape(
                    'Expected set of all languages available in '
                    'incomplete_translation, needs_voiceover and '
                    'assigned_voiceover to be the same as the supported audio '
                    'languages, received [\'en\', \'hi-en\']'
                )
            )


class SkillOpportunityDomainTest(test_utils.GenericTestBase):
    """Tests for the SkillOpportunity domain object."""

    def setUp(self) -> None:
        super().setUp()
        valid_skill_opportunity_dict: (
            opportunity_domain.SkillOpportunityDict
        ) = {
            'id': 'skill_1',
            'skill_description': 'A new skill',
            'question_count': 5,
        }
        self.valid_skill_opportunity = (
            opportunity_domain.SkillOpportunity.from_dict(
                valid_skill_opportunity_dict
        ))

    def test_to_and_from_dict_works_correctly(self) -> None:
        skill_opportunity_dict: opportunity_domain.SkillOpportunityDict = {
            'id': 'skill_1',
            'skill_description': 'A new skill',
            'question_count': 5,
        }

        skill_opportunity = opportunity_domain.SkillOpportunity.from_dict(
            skill_opportunity_dict)

        self.assertTrue(isinstance(
            skill_opportunity, opportunity_domain.SkillOpportunity))
        self.assertEqual(skill_opportunity.to_dict(), {
            'id': 'skill_1',
            'skill_description': 'A new skill',
            'question_count': 5,
        })

    def test_negative_question_count_fails_validation_check(self) -> None:
        self.assertTrue(isinstance(
            self.valid_skill_opportunity.question_count, int))

        # Object with question_count as int passes the validation check.
        self.valid_skill_opportunity.validate()
        self.valid_skill_opportunity.question_count = -5
        self._assert_validation_error(
            self.valid_skill_opportunity,
            'Expected question_count to be a non-negative integer, '
            'received -5'
        )


class PinnedOpportunityDomainTest(test_utils.GenericTestBase):
    """Tests for the PinnedOpportunity domain object."""

    def setUp(self) -> None:
        super().setUp()
        valid_pinned_opportunity_dict: opportunity_domain.PinnedOpportunityDict = { # pylint: disable=line-too-long
            'language_code': 'en',
            'topic_id': 'topic_id_1',
            'opportunity_id': 'opportunity_id1'
        }
        self.valid_pinned_opportunity = opportunity_domain.PinnedOpportunity.from_dict( # pylint: disable=line-too-long
            valid_pinned_opportunity_dict
        )

    def test_to_and_from_dict_works_correctly(self) -> None:
        pinned_opportunity_dict: opportunity_domain.PinnedOpportunityDict = {
            'language_code': 'en',
            'topic_id': 'topic_id_1',
            'opportunity_id': 'opportunity_id1'
        }

        pinned_opportunity = (
            opportunity_domain.PinnedOpportunity.
                from_dict(pinned_opportunity_dict))

        self.assertTrue(isinstance(
            pinned_opportunity, opportunity_domain.PinnedOpportunity))
        self.assertEqual(pinned_opportunity.to_dict(), {
            'language_code': 'en',
            'topic_id': 'topic_id_1',
            'opportunity_id': 'opportunity_id1'
        })
