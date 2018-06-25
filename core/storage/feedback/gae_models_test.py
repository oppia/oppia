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
import feconf

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])

CREATED_ON_FIELD = 'created_on'
LAST_UPDATED_FIELD = 'last_updated'
DELETED_FIELD = 'deleted'
FIELDS_NOT_REQUIRED = [CREATED_ON_FIELD, LAST_UPDATED_FIELD, DELETED_FIELD]


class FeedbackThreadModelTest(test_utils.GenericTestBase):
    """Tests for the FeedbackThreadModel class."""

    def test_put_function(self):
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            feedback_thread_model = feedback_models.FeedbackThreadModel(
                exploration_id='exp_id_1')
            feedback_thread_model.put()
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            feedback_thread_model = feedback_models.FeedbackThreadModel(
                entity_type='exploration', entity_id='exp_id_1')
            feedback_thread_model.put()

        last_updated = feedback_thread_model.last_updated

        # If we do not wish to update the last_updated time, we should set
        # the update_last_updated_time argument to False in the put function.
        feedback_thread_model.put(update_last_updated_time=False)
        self.assertEqual(feedback_thread_model.last_updated, last_updated)

        # If we do wish to change it however, we can simply use the put function
        # as the default value of update_last_updated_time is True.
        feedback_thread_model.put()
        self.assertNotEqual(feedback_thread_model.last_updated, last_updated)


class FeedbackThreadUserModelTest(test_utils.GenericTestBase):
    """Tests for the FeedbackThreadUserModel class."""

    def test_create_new_object(self):
        feedback_models.FeedbackThreadUserModel.create(
            'user_id', 'exp_id.thread_id')
        feedback_thread_user_model = (
            feedback_models.FeedbackThreadUserModel.get(
                'user_id', 'exp_id.thread_id'))

        self.assertEqual(
            feedback_thread_user_model.id, 'user_id.exp_id.thread_id')
        self.assertEqual(
            feedback_thread_user_model.message_ids_read_by_user, [])

    def test_get_object(self):
        feedback_models.FeedbackThreadUserModel.create(
            'user_id', 'exp_id.thread_id')
        expected_model = feedback_models.FeedbackThreadUserModel(
            id='user_id.exp_id.thread_id',
            message_ids_read_by_user=[])

        actual_model = (
            feedback_models.FeedbackThreadUserModel.get(
                'user_id', 'exp_id.thread_id'))

        self.assertEqual(actual_model.id, expected_model.id)
        self.assertEqual(
            actual_model.message_ids_read_by_user,
            expected_model.message_ids_read_by_user)

    def test_get_multi(self):
        feedback_models.FeedbackThreadUserModel.create(
            'user_id', 'exp_id.thread_id_1')
        feedback_models.FeedbackThreadUserModel.create(
            'user_id', 'exp_id.thread_id_2')

        expected_model_1 = feedback_models.FeedbackThreadUserModel(
            id='user_id.exp_id.thread_id_1',
            message_ids_read_by_user=[])
        expected_model_2 = feedback_models.FeedbackThreadUserModel(
            id='user_id.exp_id.thread_id_2',
            message_ids_read_by_user=[])

        actual_models = feedback_models.FeedbackThreadUserModel.get_multi(
            'user_id', ['exp_id.thread_id_1', 'exp_id.thread_id_2'])

        actual_model_1 = actual_models[0]
        actual_model_2 = actual_models[1]

        self.assertEqual(actual_model_1.id, expected_model_1.id)
        self.assertEqual(
            actual_model_1.message_ids_read_by_user,
            expected_model_1.message_ids_read_by_user)

        self.assertEqual(actual_model_2.id, expected_model_2.id)
        self.assertEqual(
            actual_model_2.message_ids_read_by_user,
            expected_model_2.message_ids_read_by_user)


class SuggestionModelTest(test_utils.GenericTestBase):
    """Tests the SuggestionModel class."""

    def setUp(self):
        super(SuggestionModelTest, self).setUp()
        feedback_models.SuggestionModel.create(
            'exp_id1', 'exp_id1.thread_id1', 'author_id', 1, 'state_name',
            'description', 'suggestion_text')
        feedback_models.SuggestionModel.create(
            'exp_id1', 'exp_id1.thread_id2', 'author_id', 1, 'state_name',
            'description', 'suggestion_text')
        feedback_models.SuggestionModel.create(
            'exp_id2', 'exp_id2.thread_id2', 'author_id', 1, 'state_name',
            'description', 'suggestion_text')

    def _get_suggestion_models_for_test(self, suggestions_list):
        """Removes fields that are set to default values in the base model and
        are thus not explicitly verified in tests.
        """

        updated_suggestions_list = []
        for suggestion in suggestions_list:
            suggestion_dict = suggestion.to_dict()
            for field in FIELDS_NOT_REQUIRED:
                if field in suggestion_dict:
                    suggestion_dict.pop(field)
            updated_suggestions_list.append(suggestion_dict)
        return updated_suggestions_list

    def test_create_new_object_runs_successfully(self):
        feedback_models.SuggestionModel.create(
            'exp_id3', 'exp_id3.thread_id2', 'author_id', 1, 'state_name',
            'description', 'suggestion_text')
        suggestion = (
            feedback_models.SuggestionModel.get_by_id('exp_id3.thread_id2'))

        self.assertEqual(suggestion.exploration_id, 'exp_id3')
        self.assertEqual(suggestion.author_id, 'author_id')
        self.assertEqual(suggestion.exploration_version, 1)
        self.assertEqual(suggestion.state_name, 'state_name')
        self.assertEqual(suggestion.description, 'description')
        self.assertEqual(
            suggestion.state_content, {
                'type': 'text',
                'value': 'suggestion_text',
            })

    def test_create_suggestion_fails_if_thread_already_has_suggestion(self):
        with self.assertRaisesRegexp(Exception, 'There is already a feedback '
                                     'thread with the given thread id: '
                                     'exp_id1.thread_id1'):
            feedback_models.SuggestionModel.create(
                'exp_id1', 'exp_id1.thread_id1', 'author_id', 1, 'state_name',
                'description', 'suggestion_text')

    def test_get_by_exploration_and_thread_id_suggestion_present(self):
        actual_suggestion = [(
            feedback_models.SuggestionModel.get_by_id('exp_id1.thread_id1'))]
        expected_suggestion = [feedback_models.SuggestionModel(
            id='exp_id1.thread_id1',
            author_id='author_id',
            exploration_id='exp_id1',
            exploration_version=1,
            state_name='state_name',
            description='description',
            state_content={
                'type': 'text',
                'value': 'suggestion_text'
            }
        )]

        self.assertEqual(len(self._get_suggestion_models_for_test(
            actual_suggestion)), 1)
        self.assertEqual(
            self._get_suggestion_models_for_test(expected_suggestion),
            self._get_suggestion_models_for_test(actual_suggestion))

    def test_get_by_exploration_and_thread_id_no_suggestion(self):
        actual_suggestion = (
            feedback_models.SuggestionModel.get_by_id(
                'invalid_exp_id.thread_id1'))

        self.assertIsNone(actual_suggestion)

    def test_get_suggestion_html(self):
        suggestion = (
            feedback_models.SuggestionModel.get_by_id('exp_id2.thread_id2'))
        self.assertEqual(suggestion.get_suggestion_html(), 'suggestion_text')


class UnsentFeedbackEmailModelTest(test_utils.GenericTestBase):
    """Tests for FeedbackMessageEmailDataModel class."""

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
