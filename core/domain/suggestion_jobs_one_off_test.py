# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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


""" Tests for Suggestion-related one-off jobs"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import os

from constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import question_domain
from core.domain import suggestion_jobs_one_off
from core.domain import suggestion_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

(suggestion_models, feedback_models, user_models,) = (
    models.Registry.import_models([
        models.NAMES.suggestion, models.NAMES.feedback, models.NAMES.user]))


class QuestionSuggestionMigrationJobManagerTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    QUESTION_ID = 'question_id'

    def setUp(self):
        super(QuestionSuggestionMigrationJobManagerTests, self).setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()
        self.skill_id = 'skill_id'
        self.save_new_skill(
            self.skill_id, self.albert_id, description='Skill Description')

    def _run_job_and_verify_output(self, expected_output):
        """Runs the QuestionSuggestionMigrationJobManager and
        verifies that the output matches the expected output.

        Args:
            expected_output: list(str). The expected output from the one off
                job.
        """
        job_id = (
            suggestion_jobs_one_off
            .QuestionSuggestionMigrationJobManager.create_new())
        (
            suggestion_jobs_one_off
            .QuestionSuggestionMigrationJobManager.enqueue(job_id)
        )
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off
            .QuestionSuggestionMigrationJobManager.get_output(job_id))

        self.assertItemsEqual(actual_output, expected_output)

    def test_migration_job_does_not_convert_up_to_date_suggestion(self):
        suggestion_change = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': [self.skill_id],
                'inapplicable_skill_misconception_ids': []
            },
            'skill_id': self.skill_id,
            'skill_difficulty': 0.3
        }

        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, self.skill_id, 1,
            self.albert_id, suggestion_change, 'test description')

        self.assertEqual(
            suggestion.change.question_dict[
                'question_state_data_schema_version'],
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        expected_output = [u'[u\'SUCCESS\', 1]']
        self._run_job_and_verify_output(expected_output)

        updated_suggestion = suggestion_services.get_suggestion_by_id(
            suggestion.suggestion_id)
        self.assertEqual(
            updated_suggestion.change.question_dict[
                'question_state_data_schema_version'],
            feconf.CURRENT_STATE_SCHEMA_VERSION)

    def test_migration_job_after_deleting_question_suggestion(self):
        suggestion_id = (
            self.save_new_question_suggestion_with_state_data_schema_v27(
                self.albert_id, self.skill_id))
        suggestion_models.GeneralSuggestionModel.delete_by_id(suggestion_id)

        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        self.assertEqual(suggestion, None)

        expected_output = []
        self._run_job_and_verify_output(expected_output)

    def test_migration_job_converts_old_question_suggestion(self):
        suggestion_id = (
            self.save_new_question_suggestion_with_state_data_schema_v27(
                self.albert_id, self.skill_id))
        old_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(suggestion_id))
        self.assertEqual(
            old_suggestion_model.change_cmd['question_dict'][
                'question_state_data_schema_version'], 27)

        expected_output = [u'[u\'SUCCESS\', 1]']
        self._run_job_and_verify_output(expected_output)

        updated_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(suggestion_id))
        self.assertEqual(
            updated_suggestion_model.change_cmd['question_dict'][
                'question_state_data_schema_version'],
            feconf.CURRENT_STATE_SCHEMA_VERSION)

    def test_migration_job_output_with_invalid_question_suggestion(self):
        suggestion_id = (
            self.save_new_question_suggestion_with_state_data_schema_v27(
                self.albert_id, self.skill_id, suggestion_id='suggestion456'))

        suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(suggestion_id))

        # Adding some invalid values in suggestion.
        suggestion_model.language_code = None
        suggestion_model.update_timestamps(update_last_updated_time=False)
        suggestion_model.put()

        expected_output = [
            u'[u\'POST_MIGRATION_VALIDATION_FALIURE\', '
            '[u"(\'suggestion456\', '
            'ValidationError(u\'Expected language_code '
            'to be en, received None\',))"]]'
        ]
        self._run_job_and_verify_output(expected_output)

    def test_migration_job_yields_no_output_for_non_question_suggestion(self):
        exp_id = 'expId1'
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                exp_id, self.albert_id, ['State 1', 'State 2'],
                ['TextInput'], category='Algebra'))

        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_TRANSLATION,
            'state_name': 'State 1',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': exploration.states['State 1'].content.html,
            'translation_html': '<p>This is translated html.</p>'
        }

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id, 1, self.albert_id, add_translation_change_dict,
            'test description')

        expected_output = []
        self._run_job_and_verify_output(expected_output)

    def test_migration_job_yields_exception_message(self):
        def mock_raise_expection_method(item):
            raise Exception(item.id)

        suggestion_id = 'suggestion456'
        self.save_new_question_suggestion_with_state_data_schema_v27(
            self.albert_id, self.skill_id, suggestion_id=suggestion_id)

        with self.swap(
            suggestion_services, 'get_suggestion_from_model',
            mock_raise_expection_method):
            expected_output = [
                u'[u\'MIGRATION_FAILURE\', [u"(\'suggestion456\', '
                'Exception(\'suggestion456\',))"]]']
            self._run_job_and_verify_output(expected_output)


class PopulateContributionStatsOneOffJobTests(
        test_utils.GenericTestBase):

    target_id = 'exp1'
    target_version_at_submission = 1
    sample_language_code = 'hi'
    AUTHOR_EMAIL = 'author1@example.com'
    REVIEWER_1_EMAIL = 'reviewer1@community.org'
    REVIEWER_2_EMAIL = 'reviewer2@community.org'
    COMMIT_MESSAGE = 'commit message'

    class MockExploration(python_utils.OBJECT):
        """Mocks an exploration. To be used only for testing."""

        def __init__(self, exploration_id, states):
            self.id = exploration_id
            self.states = states
            self.category = 'Algebra'

        def get_content_html(self, unused_state_name, unused_content_id):
            """Used to mock the get_content_html method for explorations."""
            return '<p>This is html to translate.</p>'

    # A mock exploration created for testing.
    explorations = [
        MockExploration('exp1', {'state_1': {}, 'state_2': {}})
    ]

    def mock_get_exploration_by_id(self, exp_id):
        for exp in self.explorations:
            if exp.id == exp_id:
                return exp

    def mock_update_exploration(
            self, unused_user_id, unused_exploration_id, unused_change_list,
            commit_message, is_suggestion):
        self.assertTrue(is_suggestion)
        self.assertEqual(
            commit_message, 'Accepted suggestion by %s: %s' % (
                'author', self.COMMIT_MESSAGE))

    def mock_accept_suggestion(
            self, suggestion_id, reviewer_id, commit_message, review_message):
        """Sets up the appropriate mocks to successfully call
        accept_suggestion.
        """
        with self.swap(
            exp_services, 'update_exploration',
            self.mock_update_exploration):
            with self.swap(
                exp_fetchers, 'get_exploration_by_id',
                self.mock_get_exploration_by_id):
                with self.swap(
                    exp_domain.Exploration, 'get_content_html',
                    self.MockExploration.get_content_html):
                    suggestion_services.accept_suggestion(
                        suggestion_id, reviewer_id, commit_message,
                        review_message
                    )

    def _create_edit_state_content_suggestion(self):
        """Creates an "edit state content" suggestion."""

        edit_state_content_change_dict = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Introduction',
            'new_value': {
                'content_id': 'content',
                'html': 'new html content'
            },
            'old_value': {
                'content_id': 'content',
                'html': 'old html content'
            }
        }

        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            edit_state_content_suggestion = (
                suggestion_services.create_suggestion(
                    feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                    feconf.ENTITY_TYPE_EXPLORATION,
                    self.target_id, self.target_version_at_submission,
                    self.author_id, edit_state_content_change_dict,
                    'test description')
            )

        return edit_state_content_suggestion

    def _create_translation_suggestion_with_language_code(self, language_code):
        """Creates a translation suggestion in the given language_code."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_TRANSLATION,
            'state_name': 'state_1',
            'content_id': 'content',
            'language_code': language_code,
            'content_html': '<p>This is html to translate.</p>',
            'translation_html': '<p>This is translated html.</p>'
        }

        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html):
                translation_suggestion = (
                    suggestion_services.create_suggestion(
                        feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                        feconf.ENTITY_TYPE_EXPLORATION,
                        self.target_id, self.target_version_at_submission,
                        self.author_id, add_translation_change_dict,
                        'test description')
                )

        return translation_suggestion

    def _create_question_suggestion_with_skill_id(self, skill_id):
        """Creates a question suggestion with the given skill_id."""
        add_question_change_dict = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1']
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }

        question_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            skill_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_question_change_dict,
            'test description')

        return question_suggestion

    def _run_job_and_verify_output(self, expected_output):
        """Runs the PopulateContributionStatsOneOffJob and verifies
        that the output matches the expected output.

        Args:
            expected_output: list(str). The expected output from the one off
                job.
        """
        job_id = (
            suggestion_jobs_one_off
            .PopulateContributionStatsOneOffJob.create_new())
        (
            suggestion_jobs_one_off
            .PopulateContributionStatsOneOffJob
            .enqueue(job_id)
        )
        self.process_and_flush_pending_tasks()
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off
            .PopulateContributionStatsOneOffJob
            .get_output(job_id)
        )

        self.assertEqual(len(actual_output), len(expected_output))
        self.assertEqual(sorted(actual_output), sorted(expected_output))

    def setUp(self):
        super(
            PopulateContributionStatsOneOffJobTests,
            self).setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_1_EMAIL, 'reviewer1')
        self.reviewer_1_id = self.get_user_id_from_email(
            self.REVIEWER_1_EMAIL)
        self.signup(self.REVIEWER_2_EMAIL, 'reviewer2')
        self.reviewer_2_id = self.get_user_id_from_email(
            self.REVIEWER_2_EMAIL)

        self.process_and_flush_pending_tasks()

    def test_no_action_is_performed_for_suggestions_that_are_marked_deleted(
            self):
        question_suggestion = self._create_question_suggestion_with_skill_id(
            'skill_1')
        expected_output = []

        suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
            question_suggestion.suggestion_id
        )
        suggestion_model.deleted = True
        suggestion_model.update_timestamps()
        suggestion_model.put()

        self._run_job_and_verify_output(expected_output)

    def test_no_action_is_performed_for_suggestion_that_has_been_deleted(self):
        question_suggestion = self._create_question_suggestion_with_skill_id(
            'skill_1')
        expected_output = []

        suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
            question_suggestion.suggestion_id
        )
        suggestion_model.delete()

        self._run_job_and_verify_output(expected_output)

    def test_no_action_is_performed_for_user_contribution_rights_marked_deleted(
            self):
        # Allowing the reviewer to review questions will create an associated
        # user contribution rights model, if it doesn't already exist.
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        expected_output = []

        user_contribution_rights_model = (
            user_models.UserContributionRightsModel.get_by_id(
                self.reviewer_1_id)
        )
        user_contribution_rights_model.deleted = True
        user_contribution_rights_model.update_timestamps()
        user_contribution_rights_model.put()

        self._run_job_and_verify_output(expected_output)

    def test_no_action_is_performed_for_deleted_user_contribution_rights(self):
        # Allowing the reviewer to review questions will create an associated
        # user contribution rights model, if it doesn't already exist.
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        expected_output = []

        # Removing the contribution reviewer deletes their user contribution
        # rights model.
        user_services.remove_contribution_reviewer(self.reviewer_1_id)

        self._run_job_and_verify_output(expected_output)

    def test_no_action_taken_for_suggestions_not_on_the_contributor_dashboard(
            self):
        self._create_edit_state_content_suggestion()
        expected_output = []

        self._run_job_and_verify_output(expected_output)

    def test_no_action_is_performed_for_rejected_suggestions(self):
        question_suggestion = self._create_question_suggestion_with_skill_id(
            'skill_1'
        )
        expected_output = []
        suggestion_services.reject_suggestion(
            question_suggestion.suggestion_id, self.reviewer_1_id,
            'reject message'
        )

        self._run_job_and_verify_output(expected_output)

    def test_no_action_is_performed_for_accepted_suggestions(self):
        translation_suggestion = (
            self._create_translation_suggestion_with_language_code(
                self.sample_language_code)
        )
        expected_output = []

        self.mock_accept_suggestion(
            translation_suggestion.suggestion_id, self.reviewer_1_id,
            'commit message', 'review message'
        )

        self._run_job_and_verify_output(expected_output)

    def test_job_updates_counts_for_translation_suggestions_in_same_lang_code(
            self):
        self._create_translation_suggestion_with_language_code(
            self.sample_language_code)
        self._create_translation_suggestion_with_language_code(
            self.sample_language_code)
        expected_output = [
            '[u\'suggestion.translate_content.%s\', 2]' % (
                self.sample_language_code)
        ]

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code[
                    self.sample_language_code]
            ), 2)

    def test_job_updates_counts_for_translation_suggestions_in_diff_lang_code(
            self):
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('en')
        expected_output = [
            '[u\'suggestion.translate_content.hi\', 1]',
            '[u\'suggestion.translate_content.en\', 1]'
        ]

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code['hi']
            ), 1)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code['en']
            ), 1)

    def test_job_updates_counts_for_translation_reviewers_in_same_lang_code(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, self.sample_language_code)
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, self.sample_language_code)
        expected_output = [
            '[u\'reviewer.translation.%s\', 2]' % self.sample_language_code
        ]

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code[
                    self.sample_language_code]
            ), 2)

    def test_job_updates_counts_for_translation_reviewers_in_diff_lang_code(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, 'en')
        expected_output = [
            '[u\'reviewer.translation.hi\', 1]',
            '[u\'reviewer.translation.en\', 1]'
        ]

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code['hi']
            ), 1)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code['en']
            ), 1)

    def test_job_updates_question_suggestion_count(self):
        self._create_question_suggestion_with_skill_id('skill_1')
        self._create_question_suggestion_with_skill_id('skill_2')
        expected_output = ['[u\'suggestion.add_question.en\', 2]']

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            community_contribution_stats.question_suggestion_count, 2
        )

    def test_job_updates_question_reviewer_count(
            self):
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        user_services.allow_user_to_review_question(self.reviewer_2_id)
        expected_output = ['[u\'reviewer.question.en\', 2]']

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            community_contribution_stats.question_reviewer_count, 2)

    def test_job_updates_both_reviewer_and_suggestion_counts(self):
        # Create two question suggestions.
        self._create_question_suggestion_with_skill_id('skill_1')
        self._create_question_suggestion_with_skill_id('skill_2')
        # Create three translation suggestions.
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('en')
        self._create_translation_suggestion_with_language_code('en')
        # Create question reviewers.
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        user_services.allow_user_to_review_question(self.reviewer_2_id)
        # Create translation reviewers.
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, 'en')
        expected_output = [
            '[u\'reviewer.translation.en\', 1]',
            '[u\'reviewer.translation.hi\', 2]',
            '[u\'reviewer.question.en\', 2]',
            '[u\'suggestion.add_question.en\', 2]',
            '[u\'suggestion.translate_content.en\', 2]',
            '[u\'suggestion.translate_content.hi\', 1]'
        ]

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            community_contribution_stats.question_suggestion_count, 2)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code['hi']
            ), 1)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code['en']
            ), 2)
        self.assertEqual(
            community_contribution_stats.question_reviewer_count, 2)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code['hi']
            ), 2)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code['en']
            ), 1)
