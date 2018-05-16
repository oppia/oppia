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

"""Tests for the suggestion gae_models."""

from core.platform import models
from core.tests import test_utils

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class SuggestionModelUnitTests(test_utils.GenericTestBase):
    """Tests for the suggestionModel class."""

    customization_args = {
        'contribution_type': 'translation',
        'contribution_language': 'English'
    }

    payload = {
        'entity_id': 'exp1',
        'entity_version_number': 1,
        'change_list': {}
    }

    def setUp(self):
        super(SuggestionModelUnitTests, self).setUp()
        suggestion_models.SuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT,
            suggestion_models.ENTITY_TYPE_EXPLORATION,
            suggestion_models.SUGGESTION_EDIT_STATE_CONTENT,
            suggestion_models.STATUS_IN_REVIEW, self.customization_args,
            'author_1', 'reviewer_1', 'thread_1', 'reviewer_1', self.payload)
        suggestion_models.SuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT,
            suggestion_models.ENTITY_TYPE_EXPLORATION,
            suggestion_models.SUGGESTION_EDIT_STATE_CONTENT,
            suggestion_models.STATUS_ACCEPTED, self.customization_args,
            'author_2', 'reviewer_2', 'thread_2', 'reviewer_2', self.payload)
        suggestion_models.SuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT,
            suggestion_models.ENTITY_TYPE_EXPLORATION,
            suggestion_models.SUGGESTION_EDIT_STATE_CONTENT,
            suggestion_models.STATUS_ACCEPTED, self.customization_args,
            'author_2', 'reviewer_2', 'thread_3', 'reviewer_3', self.payload)
        suggestion_models.SuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT,
            suggestion_models.ENTITY_TYPE_EXPLORATION,
            suggestion_models.SUGGESTION_EDIT_STATE_CONTENT,
            suggestion_models.STATUS_REJECTED, self.customization_args,
            'author_2', 'reviewer_3', 'thread_4', 'reviewer_2', self.payload)
        suggestion_models.SuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT,
            suggestion_models.ENTITY_TYPE_EXPLORATION,
            suggestion_models.SUGGESTION_EDIT_STATE_CONTENT,
            suggestion_models.STATUS_INVALID, self.customization_args,
            'author_3', 'reviewer_2', 'thread_5', 'reviewer_3', self.payload)

    def test_create_new_object_succesfully(self):
        suggestion_models.SuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT,
            suggestion_models.ENTITY_TYPE_EXPLORATION,
            suggestion_models.SUGGESTION_EDIT_STATE_CONTENT,
            suggestion_models.STATUS_IN_REVIEW, self.customization_args,
            'author_3', 'reviewer_3', 'thread_6', 'reviewer_3', self.payload)
        suggestion_id = suggestion_models.SuggestionModel.get_instance_id(
            suggestion_models.SUGGESTION_TYPE_EDIT,
            suggestion_models.ENTITY_TYPE_EXPLORATION,
            'thread_6', self.payload['entity_id'])

        observed_suggestion = suggestion_models.SuggestionModel.get_by_id(
            suggestion_id)

        self.assertEqual(
            observed_suggestion.suggestion_type,
            suggestion_models.SUGGESTION_TYPE_EDIT)
        self.assertEqual(
            observed_suggestion.entity_type,
            suggestion_models.ENTITY_TYPE_EXPLORATION)
        self.assertEqual(
            observed_suggestion.suggestion_sub_type,
            suggestion_models.SUGGESTION_EDIT_STATE_CONTENT)
        self.assertEqual(
            observed_suggestion.status, suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(
            observed_suggestion.suggestion_customization_args,
            self.customization_args)
        self.assertEqual(observed_suggestion.author_id, 'author_3')
        self.assertEqual(observed_suggestion.reviewer_id, 'reviewer_3')
        self.assertEqual(observed_suggestion.assigned_reviewer_id, 'reviewer_3')
        self.assertEqual(observed_suggestion.thread_id, 'thread_6')
        self.assertEqual(observed_suggestion.payload, self.payload)

    def test_fail_create_object(self):
        with self.assertRaisesRegexp(
            Exception, 'There is already a suggestion with the given id: '
                       'edit.exploration.thread_1.exp1'):
            suggestion_models.SuggestionModel.create(
                suggestion_models.SUGGESTION_TYPE_EDIT,
                suggestion_models.ENTITY_TYPE_EXPLORATION,
                suggestion_models.SUGGESTION_EDIT_STATE_CONTENT,
                suggestion_models.STATUS_IN_REVIEW, self.customization_args,
                'author_1', 'reviewer_1', 'thread_1', 'reviewer_1',
                self.payload)

    def test_get_suggestions_by_syb_type(self):
        self.assertEqual(
            len(suggestion_models.SuggestionModel.get_suggestions_by_sub_type(
                suggestion_models.SUGGESTION_EDIT_STATE_CONTENT)), 5)

    def test_get_suggestion_by_author(self):
        self.assertEqual(
            len(suggestion_models.SuggestionModel.get_suggestions_by_author(
                'author_1')), 1)
        self.assertEqual(
            len(suggestion_models.SuggestionModel.get_suggestions_by_author(
                'author_2')), 3)
        self.assertEqual(
            len(suggestion_models.SuggestionModel.get_suggestions_by_author(
                'author_3')), 1)

    def test_get_suggestion_assigned_to_reviwer(self):
        self.assertEqual(
            len(
                suggestion_models.SuggestionModel
                .get_suggestions_assigned_to_reviewer('reviewer_1')), 1)
        self.assertEqual(
            len(
                suggestion_models.SuggestionModel
                .get_suggestions_assigned_to_reviewer('reviewer_2')), 2)
        self.assertEqual(
            len(suggestion_models.SuggestionModel
                .get_suggestions_assigned_to_reviewer('reviewer_3')), 2)

    def test_get_suggestion_by_reviewer(self):
        self.assertEqual(
            len(suggestion_models.SuggestionModel.get_suggestions_reviewed_by(
                'reviewer_1')), 1)
        self.assertEqual(
            len(suggestion_models.SuggestionModel.get_suggestions_reviewed_by(
                'reviewer_2')), 3)
        self.assertEqual(
            len(suggestion_models.SuggestionModel.get_suggestions_reviewed_by(
                'reviewer_3')), 1)

    def test_get_suggestions_by_status(self):
        self.assertEqual(
            len(suggestion_models.SuggestionModel.get_suggestions_by_status(
                suggestion_models.STATUS_IN_REVIEW)), 1)
        self.assertEqual(
            len(suggestion_models.SuggestionModel.get_suggestions_by_status(
                suggestion_models.STATUS_REJECTED)), 1)
        self.assertEqual(
            len(suggestion_models.SuggestionModel.get_suggestions_by_status(
                suggestion_models.STATUS_INVALID)), 1)
        self.assertEqual(
            len(suggestion_models.SuggestionModel.get_suggestions_by_status(
                suggestion_models.STATUS_ACCEPTED)), 2)
