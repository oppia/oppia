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


class SuggestionModelTest(test_utils.GenericTestBase):
    """Tests the SuggestionModel class."""

    def load_suggestions(self):
        feedback_models.SuggestionModel.create('exp_id', 'thread_id1',
                                               'author_id', 1, 'state_name',
                                               {'old_content': {}})
        feedback_models.SuggestionModel.create('exp_id', 'thread_id2',
                                               'author_id', 1, 'state_name',
                                               {'old_content': {}},
                                               feedback_models.STATUS_ACCEPTED)

    def test_create_success(self):
        self.load_suggestions()        
    
        suggestion = feedback_models.SuggestionModel.get_all().fetch()[0]
 
        self.assertEqual(suggestion.exploration_id, 'exp_id')
        self.assertEqual(suggestion.author_id, 'author_id')
        self.assertEqual(suggestion.exploration_version, 1)
        self.assertEqual(suggestion.state_name, 'state_name')
        self.assertEqual(suggestion.state_content, {'old_content': {}})
        self.assertEqual(suggestion.status, feedback_models.STATUS_NEW)

    def test_create_failure(self):
        self.load_suggestions()        

        with self.assertRaises(Exception):
            feedback_models.SuggestionModel.create('exp_id', 
                                                   'thread_id1', 'author_id', 1, 
                                                   'state_name', 
                                                   {'old_content': {}})

    def test_get_by_exp_id_and_status_status_set(self):
        self.load_suggestions() 

        expected_suggestions = (feedback_models.SuggestionModel.get_all().filter(
            feedback_models.SuggestionModel.status == 
            feedback_models.STATUS_ACCEPTED).fetch())
        actual_suggestions = (feedback_models.SuggestionModel
            .get_by_exp_id_and_status('exp_id', 
                                      feedback_models.STATUS_ACCEPTED))
        
        self.assertEqual(expected_suggestions, actual_suggestions)

    def test_get_by_exp_id_and_status_status_not_set(self):
        self.load_suggestions() 

        expected_suggestions = feedback_models.SuggestionModel.get_all().fetch()
        actual_suggestions = (feedback_models.SuggestionModel
            .get_by_exp_id_and_status('exp_id'))

        self.assertEqual(expected_suggestions, actual_suggestions)

    def test_get_by_exp_id_and_status_empty_list(self):
        self.load_suggestions() 

        actual_suggestions = (feedback_models.SuggestionModel
            .get_by_exp_id_and_status('exp_id2'))

        self.assertEqual([], actual_suggestions)
