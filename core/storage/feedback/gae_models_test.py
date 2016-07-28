# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

from core.platform import models
from core.tests import test_utils

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])

CREATED_ON_FIELD = 'created_on'
LAST_UPDATED_FIELD = 'last_updated'
DELETED_FIELD = 'deleted'
FIELDS_NOT_REQUIRED = [CREATED_ON_FIELD, LAST_UPDATED_FIELD, DELETED_FIELD]


class SuggestionModelTest(test_utils.GenericTestBase):
    """Tests the SuggestionModel class."""

    def setUp(self):
        super(SuggestionModelTest, self).setUp()
        feedback_models.SuggestionModel.create('exp_id1', 'thread_id1',
                                               'author_id', 1, 'state_name',
                                               'description',
                                               {'old_content': {}})
        feedback_models.SuggestionModel.create('exp_id1', 'thread_id2',
                                               'author_id', 1, 'state_name',
                                               'description',
                                               {'old_content': {}})
        feedback_models.SuggestionModel.create('exp_id2', 'thread_id2',
                                               'author_id', 1, 'state_name',
                                               'description',
                                               {'old_content': {}})

    def _get_suggestion_models_for_test(self, suggestions_list):
        """Removes fields that are set to default values in the base model and
        are thus not explicitly verified in tests."""

        updated_suggestions_list = []
        for suggestion in suggestions_list:
            suggestion_dict = suggestion.to_dict()
            for field in FIELDS_NOT_REQUIRED:
                if field in suggestion_dict:
                    suggestion_dict.pop(field)
            updated_suggestions_list.append(suggestion_dict)
        return updated_suggestions_list

    def test_create_new_object_runs_successfully(self):
        feedback_models.SuggestionModel.create('exp_id3', 'thread_id2',
                                               'author_id', 1, 'state_name',
                                               'description',
                                               {'old_content': {}})
        suggestion = (
            feedback_models.SuggestionModel.get_by_exploration_and_thread_id(
                'exp_id3', 'thread_id2'))

        self.assertEqual(suggestion.exploration_id, 'exp_id3')
        self.assertEqual(suggestion.author_id, 'author_id')
        self.assertEqual(suggestion.exploration_version, 1)
        self.assertEqual(suggestion.state_name, 'state_name')
        self.assertEqual(suggestion.description, 'description')
        self.assertEqual(suggestion.state_content, {'old_content': {}})

    def test_create_suggestion_fails_if_thread_already_has_suggestion(self):
        with self.assertRaisesRegexp(Exception, 'There is already a feedback '
                                     'thread with the given thread id: '
                                     'exp_id1.thread_id1'):
            feedback_models.SuggestionModel.create('exp_id1',
                                                   'thread_id1', 'author_id', 1,
                                                   'state_name',
                                                   'description',
                                                   {'old_content': {}})

    def test_get_by_exploration_and_thread_id_suggestion_present(self):
        actual_suggestion = [(
            feedback_models.SuggestionModel.get_by_exploration_and_thread_id(
                'exp_id1', 'thread_id1'))]
        expected_suggestion = [feedback_models.SuggestionModel(
            id='exp_id1.thread_id1',
            author_id='author_id',
            exploration_id='exp_id1',
            exploration_version=1,
            state_name='state_name',
            description='description',
            state_content={'old_content': {}})]

        self.assertEqual(len(self._get_suggestion_models_for_test(
            actual_suggestion)), 1)
        self.assertEqual(
            self._get_suggestion_models_for_test(expected_suggestion),
            self._get_suggestion_models_for_test(actual_suggestion))

    def test_get_by_exploration_and_thread_id_no_suggestion(self):
        actual_suggestion = (
            feedback_models.SuggestionModel.get_by_exploration_and_thread_id(
                'invalid_exp_id', 'thread_id1'))

        self.assertIsNone(actual_suggestion)


class UnsentFeedbackEmailModelTest(test_utils.GenericTestBase):
    """Tests for FeedbackMessageEmailDataModel class"""

    def test_new_instances_stores_correct_data(self):
        user_id = 'A'
        message_reference_dict = {
            'exploration_id': 'ABC123',
            'thread_id': 'thread_id1',
            'message_id': 'message_id1'
        }
        email_instance = feedback_models.UnsentFeedbackEmailModel(
            id=user_id, feedback_message_references=[message_reference_dict])
        email_instance.put()

        retrieved_instance = (
            feedback_models.UnsentFeedbackEmailModel.get_by_id(id=user_id))

        self.assertEqual(
            retrieved_instance.feedback_message_references,
            [message_reference_dict])
        self.assertEqual(retrieved_instance.retries, 0)
