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

from __future__ import absolute_import
from __future__ import unicode_literals

import datetime

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import opportunity_services
from core.domain import question_domain
from core.domain import suggestion_jobs_one_off
from core.domain import suggestion_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


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
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'State 1',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': exploration.states['State 1'].content.html,
            'translation_html': '<p>This is translated html.</p>',
            'data_format': 'html'
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


class TranslationSuggestionUnicodeAuditOneOffJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    QUESTION_ID = 'question_id'

    def setUp(self):
        super(TranslationSuggestionUnicodeAuditOneOffJobTests, self).setUp()

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
            .TranslationSuggestionUnicodeAuditOneOffJob.create_new())
        (
            suggestion_jobs_one_off
            .TranslationSuggestionUnicodeAuditOneOffJob.enqueue(job_id)
        )
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off
            .TranslationSuggestionUnicodeAuditOneOffJob.get_output(job_id))

        self.assertItemsEqual(actual_output, expected_output)

    def test_non_translation_suggestions_are_skipped(self):
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

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, self.skill_id, 1,
            self.albert_id, suggestion_change, 'test description')

        self._run_job_and_verify_output([])

    def test_translation_suggestions_with_invalid_state_names_are_skipped(self):
        exp_id = 'EXP_ID'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='title', category='category',
            language_code='bn')
        self.set_interaction_for_state(
            exploration.states[exploration.init_state_name], 'Continue')
        exp_services.save_new_exploration(self.albert_id, exploration)
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'ca_buttonText_0',
            'language_code': 'bn',
            'content_html': 'Continue',
            'translation_html': '<p>চালিয়ে যান</p>',
            'data_format': 'html'
        }

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id, exploration.version,
            self.albert_id, add_translation_change_dict,
            'test description')
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'Introduction',
            'new_state_name': 'Renamed state'
        })]
        exp_services.update_exploration(
            self.albert_id, exp_id, change_list, '')

        self._run_job_and_verify_output([])

    def test_reports_invalid_unicode_translations(self):
        exp_id = 'EXP_ID'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='title', category='category',
            language_code='bn')
        self.set_interaction_for_state(
            exploration.states[exploration.init_state_name], 'Continue')
        exp_services.save_new_exploration(self.albert_id, exploration)
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'ca_buttonText_0',
            'language_code': 'bn',
            'content_html': 'Continue',
            'translation_html': '<p>চালিয়ে যান</p>',
            'data_format': 'html'
        }

        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id, exploration.version,
            self.albert_id, add_translation_change_dict,
            'test description')
        expected_output = [
            u'[u\'FOUND\', [u\'%s | ca_buttonText_0\']]'
            % suggestion.suggestion_id,
            u'[u\'PROCESSED\', 1]'
        ]
        self._run_job_and_verify_output(expected_output)


class TranslationSuggestionUnicodeFixOneOffJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    QUESTION_ID = 'question_id'

    def setUp(self):
        super(TranslationSuggestionUnicodeFixOneOffJobTests, self).setUp()

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
            .TranslationSuggestionUnicodeFixOneOffJob.create_new())
        (
            suggestion_jobs_one_off
            .TranslationSuggestionUnicodeFixOneOffJob.enqueue(job_id)
        )
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off
            .TranslationSuggestionUnicodeFixOneOffJob.get_output(job_id))

        self.assertItemsEqual(actual_output, expected_output)

    def test_non_translation_suggestions_are_skipped(self):
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

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, self.skill_id, 1,
            self.albert_id, suggestion_change, 'test description')

        self._run_job_and_verify_output([])

    def test_translation_suggestions_with_invalid_state_names_are_skipped(self):
        exp_id = 'EXP_ID'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='title', category='category',
            language_code='bn')
        self.set_interaction_for_state(
            exploration.states[exploration.init_state_name], 'Continue')
        exp_services.save_new_exploration(self.albert_id, exploration)
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'ca_buttonText_0',
            'language_code': 'bn',
            'content_html': 'Continue',
            'translation_html': '<p>চালিয়ে যান</p>',
            'data_format': 'html'
        }

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id, exploration.version,
            self.albert_id, add_translation_change_dict,
            'test description')
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'Introduction',
            'new_state_name': 'Renamed state'
        })]
        exp_services.update_exploration(
            self.albert_id, exp_id, change_list, '')

        self._run_job_and_verify_output([])

    def test_fixes_invalid_unicode_translations(self):
        exp_id = 'EXP_ID'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='title', category='category',
            language_code='bn')
        self.set_interaction_for_state(
            exploration.states[exploration.init_state_name], 'Continue')
        exp_services.save_new_exploration(self.albert_id, exploration)
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'ca_buttonText_0',
            'language_code': 'bn',
            'content_html': 'Continue',
            'translation_html': '<p>চালিয়ে যান</p>',
            'data_format': 'html'
        }

        invalid_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id, exploration.version,
            self.albert_id, add_translation_change_dict,
            'test description')
        self.assertEqual(invalid_suggestion.change.data_format, 'html')
        self.assertEqual(
            invalid_suggestion.change.translation_html, '<p>চালিয়ে যান</p>')

        expected_output = [
            u'[u\'UPDATED\', [u\'%s | ca_buttonText_0\']]'
            % invalid_suggestion.suggestion_id,
            u'[u\'PROCESSED\', 1]'
        ]
        self._run_job_and_verify_output(expected_output)

        valid_suggestion = suggestion_services.get_suggestion_by_id(
            invalid_suggestion.suggestion_id)
        self.assertEqual(valid_suggestion.change.data_format, 'unicode')
        self.assertEqual(
            valid_suggestion.change.translation_html, 'চালিয়ে যান')


class TranslationSuggestionSvgDiagramOneOffJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    QUESTION_ID = 'question_id'

    def setUp(self):
        super(TranslationSuggestionSvgDiagramOneOffJobTests, self).setUp()

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
            .TranslationSuggestionSvgDiagramOneOffJob.create_new())
        (
            suggestion_jobs_one_off
            .TranslationSuggestionSvgDiagramOneOffJob.enqueue(job_id)
        )
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off
            .TranslationSuggestionSvgDiagramOneOffJob.get_output(job_id))

        self.assertItemsEqual(actual_output, expected_output)

    def test_non_translation_suggestions_are_skipped(self):
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

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, self.skill_id, 1,
            self.albert_id, suggestion_change, 'test description')

        self._run_job_and_verify_output([])

    def test_replaces_svgdiagram_tag_with_image_tag(self):
        exp_id = 'EXP_ID'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='title', category='category',
            language_code='bn')
        self.set_interaction_for_state(
            exploration.states[exploration.init_state_name], 'Continue')
        exp_services.save_new_exploration(self.albert_id, exploration)
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'bn',
            'content_html': '',
            'translation_html': (
                '<oppia-noninteractive-svgdiagram '
                'svg_filename-with-value="&quot;img1.svg&quot;"'
                ' alt-with-value="&quot;Image&quot;">'
                '</oppia-noninteractive-svgdiagram>'
            ),
            'data_format': 'html'
        }

        invalid_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id, exploration.version,
            self.albert_id, add_translation_change_dict,
            'test description')
        self.assertEqual(
            invalid_suggestion.change.translation_html,
            '<oppia-noninteractive-svgdiagram '
            'svg_filename-with-value="&quot;img1.svg&quot;"'
            ' alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-svgdiagram>')

        expected_output = [
            u'[u\'UPDATED\', [u\'%s | content\']]'
            % invalid_suggestion.suggestion_id,
        ]
        self._run_job_and_verify_output(expected_output)

        valid_suggestion = suggestion_services.get_suggestion_by_id(
            invalid_suggestion.suggestion_id)
        self.assertEqual(
            valid_suggestion.change.translation_html,
            '<oppia-noninteractive-image alt-with-value=\'\"Image\"\''
            ' caption-with-value="&amp;quot;&amp;quot;" '
            'filepath-with-value=\'\"img1.svg\"\'>'
            '</oppia-noninteractive-image>')

    def test_skips_modifying_suggestions_without_svgdiagram_tag(self):
        exp_id = 'EXP_ID'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='title', category='category',
            language_code='bn')
        self.set_interaction_for_state(
            exploration.states[exploration.init_state_name], 'Continue')
        exp_services.save_new_exploration(self.albert_id, exploration)
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'bn',
            'content_html': '',
            'translation_html': (
                '<oppia-noninteractive-image '
                'filename-with-value="&quot;img1.svg&quot;"'
                ' alt-with-value="&quot;Image&quot;">'
                '</oppia-noninteractive-image>'
            ),
            'data_format': 'html'
        }

        valid_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id, exploration.version,
            self.albert_id, add_translation_change_dict,
            'test description')
        self.assertEqual(
            valid_suggestion.change.translation_html,
            '<oppia-noninteractive-image '
            'filename-with-value="&quot;img1.svg&quot;"'
            ' alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image>')

        expected_output = [u'[u\'SKIPPED\', 1]']
        self._run_job_and_verify_output(expected_output)

        valid_suggestion = suggestion_services.get_suggestion_by_id(
            valid_suggestion.suggestion_id)
        self.assertEqual(
            valid_suggestion.change.translation_html,
            '<oppia-noninteractive-image '
            'filename-with-value="&quot;img1.svg&quot;"'
            ' alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image>')


class PopulateTranslationContributionStatsOneOffJobTests(
        test_utils.GenericTestBase):

    target_id = 'exp1'
    topic_id = 'topic1'
    target_version_at_submission = 1
    language_code = 'hi'
    AUTHOR_EMAIL = 'author1@example.com'
    REVIEWER_EMAIL = 'reviewer@community.org'
    COMMIT_MESSAGE = 'commit message'
    CONTENT_HTML = (
        '<p>This is html to translate.</p>'
        '<oppia-noninteractive-image></oppia-noninteractive-image>')

    class MockExploration(python_utils.OBJECT):
        """Mocks an exploration. To be used only for testing."""

        def __init__(self, exploration_id, states):
            self.id = exploration_id
            self.states = states
            self.category = 'Algebra'

        def get_content_html(self, unused_state_name, unused_content_id):
            """Used to mock the get_content_html method for explorations."""
            return '<p>This is html to translate.</p>'

    class MockOpportunity(python_utils.OBJECT):
        """Mocks an exploration opportunity. To be used only for testing."""

        def __init__(self, exploration_id, topic_id):
            self.id = exploration_id
            self.topic_id = topic_id

    explorations = [
        MockExploration(target_id, {'state_1': {}, 'state_2': {}})
    ]

    opportunities = {
        target_id: MockOpportunity(target_id, topic_id)
    }

    def mock_get_exploration_by_id(self, exp_id):
        for exp in self.explorations:
            if exp.id == exp_id:
                return exp

    def mock_update_exploration(
            self, unused_user_id, unused_exploration_id, unused_change_list,
            unused_commit_message, is_suggestion):
        self.assertTrue(is_suggestion)

    def mock_get_opportunities(self, unused_exploration_ids):
        return self.opportunities

    def _accept_suggestion(self, suggestion_id, reviewer_id):
        """Accepts a suggestion."""
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
                        suggestion_id, reviewer_id, 'commit_message',
                        'review_message'
                    )

    def _create_translation_suggestion(self, language_code):
        """Creates a translation suggestion."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'state_1',
            'content_id': 'content',
            'language_code': language_code,
            'content_html': '<p>This is html to translate.</p>',
            'translation_html': '<p>This is translated html.</p>',
            'data_format': 'html'
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

    def _run_job_and_verify_output(self, expected_output):
        """Runs the PopulateTranslationContributionStatsOneOffJob and verifies
        that the output matches the expected output.

        Args:
            expected_output: list(str). The expected output from the one off
                job.
        """
        job_id = (
            suggestion_jobs_one_off
            .PopulateTranslationContributionStatsOneOffJob.create_new())
        (
            suggestion_jobs_one_off
            .PopulateTranslationContributionStatsOneOffJob
            .enqueue(job_id)
        )
        self.process_and_flush_pending_tasks()
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off
            .PopulateTranslationContributionStatsOneOffJob
            .get_output(job_id)
        )

        self.assertEqual(len(actual_output), len(expected_output))
        self.assertEqual(sorted(actual_output), sorted(expected_output))

    def setUp(self):
        super(PopulateTranslationContributionStatsOneOffJobTests, self).setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer1')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)

        self.process_and_flush_pending_tasks()

    def test_job_updates_counts_for_accepted_translation_suggestions(self):
        # Create two translations suggestions and accept the second.
        self._create_translation_suggestion(self.language_code)
        suggestion_2 = self._create_translation_suggestion(self.language_code)
        self._accept_suggestion(suggestion_2.suggestion_id, self.reviewer_id)
        expected_output = [
            '[u\'%s.%s.%s\', 2]' % (
                self.language_code, self.author_id, self.topic_id)
        ]

        # Run the job.
        with self.swap(
            opportunity_services,
            'get_exploration_opportunity_summaries_by_ids',
            self.mock_get_opportunities):
            self._run_job_and_verify_output(expected_output)

        # Assert the job updated the stats model.
        translation_contribution_stats = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.language_code, self.author_id, self.topic_id)
        )
        self.assertEqual(
            translation_contribution_stats.submitted_translations_count, 2)
        # NOTE: len("This is html to translate") * 2 = 10. HTML tags/attributes
        # are not considered part of the word count.
        self.assertEqual(
            translation_contribution_stats.submitted_translation_word_count, 10)
        self.assertEqual(
            translation_contribution_stats.accepted_translations_count, 1)
        self.assertEqual(
            translation_contribution_stats
            .accepted_translations_without_reviewer_edits_count, 1)
        # NOTE: len("This is html to translate") = 5.
        self.assertEqual(
            translation_contribution_stats.accepted_translation_word_count, 5)
        self.assertEqual(
            translation_contribution_stats.rejected_translations_count, 0)
        self.assertEqual(
            translation_contribution_stats.rejected_translation_word_count, 0)
        # NOTE: We only persist unique dates.
        self.assertEqual(
            translation_contribution_stats.contribution_dates,
            [datetime.datetime.now().date()])

        # Run the job a second time.
        with self.swap(
            opportunity_services,
            'get_exploration_opportunity_summaries_by_ids',
            self.mock_get_opportunities):
            self._run_job_and_verify_output(expected_output)

        # Assert the model is the same as after the first run.
        translation_contribution_stats = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.language_code, self.author_id, self.topic_id)
        )
        self.assertEqual(
            translation_contribution_stats.submitted_translations_count, 2)
        # NOTE: len("This is html to translate") * 2 = 10.
        self.assertEqual(
            translation_contribution_stats.submitted_translation_word_count, 10)
        self.assertEqual(
            translation_contribution_stats.accepted_translations_count, 1)
        self.assertEqual(
            translation_contribution_stats
            .accepted_translations_without_reviewer_edits_count, 1)
        # NOTE: len("This is html to translate") = 5.
        self.assertEqual(
            translation_contribution_stats.accepted_translation_word_count, 5)
        self.assertEqual(
            translation_contribution_stats.rejected_translations_count, 0)
        self.assertEqual(
            translation_contribution_stats.rejected_translation_word_count, 0)
        self.assertEqual(
            translation_contribution_stats.contribution_dates,
            [datetime.datetime.now().date()])

    def test_job_updates_counts_for_rejected_translation_suggestions(self):
        suggestion = self._create_translation_suggestion(self.language_code)
        suggestion_services.reject_suggestion(
            suggestion.suggestion_id, self.reviewer_id, 'review_message'
        )
        expected_output = [
            '[u\'%s.%s.%s\', 1]' % (
                self.language_code, self.author_id, self.topic_id)
        ]

        with self.swap(
            opportunity_services,
            'get_exploration_opportunity_summaries_by_ids',
            self.mock_get_opportunities):
            self._run_job_and_verify_output(expected_output)

        translation_contribution_stats = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.language_code, self.author_id, self.topic_id)
        )
        self.assertEqual(
            translation_contribution_stats.submitted_translations_count, 1)
        # NOTE: len("This is html to translate") = 5. HTML tags/attributes
        # are not considered part of the word count.
        self.assertEqual(
            translation_contribution_stats.submitted_translation_word_count, 5)
        self.assertEqual(
            translation_contribution_stats.accepted_translations_count, 0)
        self.assertEqual(
            translation_contribution_stats
            .accepted_translations_without_reviewer_edits_count, 0)
        # NOTE: len("This is html to translate") = 5.
        self.assertEqual(
            translation_contribution_stats.accepted_translation_word_count, 0)
        self.assertEqual(
            translation_contribution_stats.rejected_translations_count, 1)
        self.assertEqual(
            translation_contribution_stats.rejected_translation_word_count, 5)
        self.assertEqual(
            translation_contribution_stats.contribution_dates,
            [datetime.datetime.now().date()])

    def test_job_only_processes_translation_suggestions(self):
        skill_id = 'skill_id'
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
                'linked_skill_ids': [skill_id],
                'inapplicable_skill_misconception_ids': []
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            self.author_id, suggestion_change, 'test description')

        self._run_job_and_verify_output([])
