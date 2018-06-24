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

    score_category = (
        suggestion_models.SCORE_TYPE_TRANSLATION +
        suggestion_models.SCORE_CATEGORY_DELIMITER + 'English')

    target_id = 'exp1'
    target_version_at_submission = 1
    change_cmd = {}

    def setUp(self):
        super(SuggestionModelUnitTests, self).setUp()
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_1',
            'reviewer_1', 'reviewer_1', self.change_cmd, self.score_category,
            'exploration.exp1.thread_1')
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_ACCEPTED, 'author_2',
            'reviewer_2', 'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_2')
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_ACCEPTED, 'author_2',
            'reviewer_3', 'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_3')
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_REJECTED, 'author_2',
            'reviewer_2', 'reviewer_3', self.change_cmd, self.score_category,
            'exploration.exp1.thread_4')
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_REJECTED, 'author_3',
            'reviewer_3', 'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_5')

    def test_score_type_contains_delimiter(self):
        for score_type in suggestion_models.SCORE_TYPE_CHOICES:
            self.assertTrue(
                suggestion_models.SCORE_CATEGORY_DELIMITER not in score_type)

    def test_create_new_object_succesfully(self):
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_3', 'reviewer_3', self.change_cmd, self.score_category,
            'exploration.exp1.thread_6')

        suggestion_id = 'exploration.exp1.thread_6'

        observed_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(suggestion_id))


        self.assertEqual(
            observed_suggestion_model.suggestion_type,
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT)
        self.assertEqual(
            observed_suggestion_model.target_type,
            suggestion_models.TARGET_TYPE_EXPLORATION)
        self.assertEqual(
            observed_suggestion_model.target_id, self.target_id)
        self.assertEqual(
            observed_suggestion_model.target_version_at_submission,
            self.target_version_at_submission)
        self.assertEqual(
            observed_suggestion_model.status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(observed_suggestion_model.author_id, 'author_3')
        self.assertEqual(
            observed_suggestion_model.assigned_reviewer_id, 'reviewer_3')
        self.assertEqual(
            observed_suggestion_model.final_reviewer_id, 'reviewer_3')
        self.assertEqual(
            observed_suggestion_model.score_category, self.score_category)
        self.assertEqual(observed_suggestion_model.change_cmd, self.change_cmd)

    def test_create_suggestion_fails_if_id_collides_with_existing_one(self):
        with self.assertRaisesRegexp(
            Exception, 'There is already a suggestion with the given id: '
                       'exploration.exp1.thread_1'):
            suggestion_models.GeneralSuggestionModel.create(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                suggestion_models.STATUS_IN_REVIEW, 'author_3',
                'reviewer_3', 'reviewer_3', self.change_cmd,
                self.score_category, 'exploration.exp1.thread_1')

    def test_get_suggestions_by_type(self):
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_by_type(
                    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT)), 5)
        with self.assertRaisesRegexp(
            Exception, 'Value \'invalid_suggestion_type\' for property'
                       ' suggestion_type is not an allowed choice'):
            suggestion_models.GeneralSuggestionModel.get_suggestions_by_type(
                'invalid_suggestion_type')

    def test_get_suggestion_by_author(self):
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_by_author('author_1')), 1)
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_by_author('author_2')), 3)
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_by_author('author_3')), 1)
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_by_author('author_invalid')), 0)

    def test_get_suggestion_assigned_to_reviewer(self):
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_assigned_to_reviewer('reviewer_1')), 1)
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_assigned_to_reviewer('reviewer_2')), 2)
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel
                .get_suggestions_assigned_to_reviewer('reviewer_3')), 2)
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel
                .get_suggestions_assigned_to_reviewer('reviewer_invalid')), 0)

    def test_get_suggestion_by_reviewer(self):
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_reviewed_by('reviewer_1')), 1)
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_reviewed_by('reviewer_2')), 3)
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_reviewed_by('reviewer_3')), 1)
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_reviewed_by('reviewer_invalid')), 0)

    def test_get_suggestions_by_status(self):
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_by_status(
                    suggestion_models.STATUS_IN_REVIEW)), 1)
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_by_status(
                    suggestion_models.STATUS_REJECTED)), 2)
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_by_status(
                    suggestion_models.STATUS_ACCEPTED)), 2)
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_by_status(
                    suggestion_models.STATUS_RECEIVED)), 0)

    def test_get_suggestions_by_target_id(self):
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_by_target_id(
                    suggestion_models.TARGET_TYPE_EXPLORATION, self.target_id)),
            5)
        self.assertEqual(
            len(
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_by_target_id(
                    suggestion_models.TARGET_TYPE_EXPLORATION, 'exp_invalid')),
            0)
