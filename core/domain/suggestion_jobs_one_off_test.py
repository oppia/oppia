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

from core.domain import exp_domain
from core.domain import question_domain
from core.domain import suggestion_jobs_one_off
from core.domain import suggestion_services
from core.platform import models
from core.tests import test_utils
import feconf

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
