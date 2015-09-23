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

__author__ = 'Shantanu Bhowmik'

from core.platform import models
(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])
import test_utils


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
                                               {'old_content': {}})
        feedback_models.SuggestionModel.create('exp_id1', 'thread_id2',
                                               'author_id', 1, 'state_name',
                                               {'old_content': {}},
                                               feedback_models.
                                                   SUGGESTION_STATUS_ACCEPTED)
        feedback_models.SuggestionModel.create('exp_id2', 'thread_id2',
                                               'author_id', 1, 'state_name',
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
                                               {'old_content': {}})
        suggestions = feedback_models.SuggestionModel.get_by_exp_id_and_status(
            'exp_id3')
        suggestion = suggestions[0]

        self.assertEqual(len(suggestions), 1) 
        self.assertEqual(suggestion.exploration_id, 'exp_id3')
        self.assertEqual(suggestion.author_id, 'author_id')
        self.assertEqual(suggestion.exploration_version, 1)
        self.assertEqual(suggestion.state_name, 'state_name')
        self.assertEqual(suggestion.state_content, {'old_content': {}})
        self.assertEqual(suggestion.status, 
                         feedback_models.SUGGESTION_STATUS_NEW)

    def test_create_suggestion_fails_if_thread_already_has_suggestion(self):
        with self.assertRaisesRegexp(Exception, 'There is already a feedback '
                                     'thread with the given thread id: '
                                     'exp_id1.thread_id1'):
            feedback_models.SuggestionModel.create('exp_id1', 
                                                   'thread_id1', 'author_id', 1, 
                                                   'state_name', 
                                                   {'old_content': {}})

    def test_get_by_exp_id_and_status_status_set(self):
        expected_suggestions = [feedback_models.SuggestionModel(
            id='exp_id1.thread_id2',
            author_id='author_id',
            exploration_id='exp_id1',
            exploration_version=1,
            state_name='state_name',
            state_content={'old_content': {}},
            status='accepted')]
        actual_suggestions = (
            feedback_models.SuggestionModel.get_by_exp_id_and_status(
                'exp_id1', status=feedback_models.SUGGESTION_STATUS_ACCEPTED))
        
        self.assertEqual(
            self._get_suggestion_models_for_test(expected_suggestions),
            self._get_suggestion_models_for_test(actual_suggestions))

    def test_get_by_exp_id_and_status_status_not_set(self):
        expected_suggestions = [feedback_models.SuggestionModel(
            id='exp_id1.thread_id1',
            author_id='author_id',
            exploration_id='exp_id1',
            exploration_version=1,
            state_name='state_name',
            state_content={'old_content': {}},
            status='new'), feedback_models.SuggestionModel(
            id='exp_id1.thread_id2',
            author_id='author_id',
            exploration_id='exp_id1',
            exploration_version=1,
            state_name='state_name',
            state_content={'old_content': {}},
            status='accepted')]
        actual_suggestions = (feedback_models.SuggestionModel
            .get_by_exp_id_and_status('exp_id1'))

        self.assertEqual(
            self._get_suggestion_models_for_test(expected_suggestions),
            self._get_suggestion_models_for_test(actual_suggestions))

    def test_get_by_exp_id_and_status_empty_list(self):
        actual_suggestions = (feedback_models.SuggestionModel
            .get_by_exp_id_and_status('exp_id3'))

        self.assertEqual([], actual_suggestions)
