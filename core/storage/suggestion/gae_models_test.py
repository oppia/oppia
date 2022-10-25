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

from __future__ import annotations

import datetime

from core import feconf
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, Mapping

MYPY = False
if MYPY: # pragma: no cover
    # Here, change domain is imported only for type checking.
    from core.domain import change_domain  # pylint: disable=invalid-import # isort:skip
    from mypy_imports import base_models
    from mypy_imports import suggestion_models

(base_models, suggestion_models, user_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.SUGGESTION, models.Names.USER
])


class SuggestionModelUnitTests(test_utils.GenericTestBase):
    """Tests for the suggestionModel class."""

    score_category: str = (
        suggestion_models.SCORE_TYPE_TRANSLATION +
        suggestion_models.SCORE_CATEGORY_DELIMITER + 'English')

    topic_name = 'topic'
    target_id = 'exp1'
    target_version_at_submission = 1
    change_cmd: Mapping[
        str, change_domain.AcceptableChangeDictTypes
    ] = {}
    # Language code that would normally be derived from the change_cmd.
    translation_language_code = 'en'
    # Language code that would normally be derived from the question_dict in
    # the change_cmd.
    question_language_code = 'en'
    mocked_datetime_utcnow = datetime.datetime(2020, 6, 15, 5)

    def setUp(self) -> None:
        super().setUp()
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_1',
            'reviewer_1', self.change_cmd, self.score_category,
            'exploration.exp1.thread_1', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_ACCEPTED, 'author_2',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_2', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_ACCEPTED, 'author_2',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_3', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_REJECTED, 'author_2',
            'reviewer_3', self.change_cmd, self.score_category,
            'exploration.exp1.thread_4', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_REJECTED, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_5', None)

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            suggestion_models.GeneralSuggestionModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            suggestion_models.GeneralSuggestionModel
            .has_reference_to_user_id('author_1')
        )
        self.assertTrue(
            suggestion_models.GeneralSuggestionModel
            .has_reference_to_user_id('author_2')
        )
        self.assertTrue(
            suggestion_models.GeneralSuggestionModel
            .has_reference_to_user_id('author_3')
        )
        self.assertTrue(
            suggestion_models.GeneralSuggestionModel
            .has_reference_to_user_id('reviewer_1')
        )
        self.assertTrue(
            suggestion_models.GeneralSuggestionModel
            .has_reference_to_user_id('reviewer_2')
        )
        self.assertTrue(
            suggestion_models.GeneralSuggestionModel
            .has_reference_to_user_id('reviewer_3')
        )
        self.assertFalse(
            suggestion_models.GeneralSuggestionModel
            .has_reference_to_user_id('id_x')
        )

    def test_score_type_contains_delimiter(self) -> None:
        for score_type in suggestion_models.SCORE_TYPE_CHOICES:
            self.assertTrue(
                suggestion_models.SCORE_CATEGORY_DELIMITER not in score_type)

    def test_create_new_object_succesfully(self) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_3', self.change_cmd, self.score_category,
            'exploration.exp1.thread_6', None)

        suggestion_id = 'exploration.exp1.thread_6'

        observed_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(suggestion_id))

        self.assertEqual(
            observed_suggestion_model.suggestion_type,
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)
        self.assertEqual(
            observed_suggestion_model.target_type,
            feconf.ENTITY_TYPE_EXPLORATION)
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
            observed_suggestion_model.final_reviewer_id, 'reviewer_3')
        self.assertEqual(
            observed_suggestion_model.score_category, self.score_category)
        self.assertEqual(observed_suggestion_model.change_cmd, self.change_cmd)

    def test_create_suggestion_fails_if_id_collides_with_existing_one(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'There is already a suggestion with the given id: '
                       'exploration.exp1.thread_1'):
            suggestion_models.GeneralSuggestionModel.create(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                suggestion_models.STATUS_IN_REVIEW, 'author_3',
                'reviewer_3', self.change_cmd,
                self.score_category, 'exploration.exp1.thread_1', None)

    def test_get_suggestions_by_type(self) -> None:
        queries = [(
            'suggestion_type',
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 5)
        queries = [('suggestion_type', 'invalid_suggestion_type')]

        with self.assertRaisesRegex(
            Exception, 'Value \'invalid_suggestion_type\' for property'
                       ' suggestion_type is not an allowed choice'):
            suggestion_models.GeneralSuggestionModel.query_suggestions(queries)

    def test_get_suggestion_by_author(self) -> None:
        queries = [('author_id', 'author_1')]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 1)
        queries = [('author_id', 'author_2')]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 3)
        queries = [('author_id', 'author_3')]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 1)
        queries = [('author_id', 'author_invalid')]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 0)

    def test_get_suggestion_by_reviewer(self) -> None:
        queries = [('final_reviewer_id', 'reviewer_1')]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 1)
        queries = [('final_reviewer_id', 'reviewer_2')]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 3)
        queries = [('final_reviewer_id', 'reviewer_3')]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 1)
        queries = [('final_reviewer_id', 'reviewer_invalid')]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 0)

    def test_get_suggestions_by_status(self) -> None:
        queries = [('status', suggestion_models.STATUS_IN_REVIEW)]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 1)
        queries = [('status', suggestion_models.STATUS_REJECTED)]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 2)
        queries = [('status', suggestion_models.STATUS_ACCEPTED)]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 2)

    def test_get_suggestions_by_target_id(self) -> None:
        queries = [
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', self.target_id)
        ]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 5)
        queries = [
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', 'exp_invalid')
        ]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 0)

    def test_query_suggestions(self) -> None:
        queries = [
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', self.target_id)
        ]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 5)

        queries = [
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', self.target_id),
            ('author_id', 'author_2')
        ]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 3)

        queries = [
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', self.target_id),
            ('author_id', 'author_2'),
            ('status', suggestion_models.STATUS_ACCEPTED)
        ]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 2)

        queries = [
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', self.target_id),
            ('invalid_field', 'value')
        ]
        with self.assertRaisesRegex(
            Exception, 'Not allowed to query on field invalid_field'):
            suggestion_models.GeneralSuggestionModel.query_suggestions(queries)

        queries = [
            (
                'suggestion_type',
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', self.target_id),
            ('status', suggestion_models.STATUS_IN_REVIEW),
            ('author_id', 'author_1'),
            ('final_reviewer_id', 'reviewer_1'),
            ('score_category', self.score_category)
        ]
        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 1)

    def test_query_suggestions_by_language(self) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_6', self.translation_language_code)

        queries = [('language_code', self.translation_language_code)]

        self.assertEqual(
            len(suggestion_models.GeneralSuggestionModel.query_suggestions(
                queries)), 1)

    def test_get_in_review_translation_suggestions(self) -> None:
        # Create two in-review translation suggestions.
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_6', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_7', self.translation_language_code)
        # Create accepted and rejected suggestions that should not be returned.
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_ACCEPTED, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_8', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_REJECTED, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_9', self.translation_language_code)

        suggestions = (
            suggestion_models.GeneralSuggestionModel
            .get_in_review_translation_suggestions(
                'exp1', [self.translation_language_code]))

        self.assertEqual(len(suggestions), 2)
        self.assertEqual(suggestions[0].target_id, 'exp1')
        self.assertEqual(
            suggestions[0].suggestion_type,
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.assertEqual(
            suggestions[0].status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(suggestions[1].target_id, 'exp1')
        self.assertEqual(
            suggestions[1].suggestion_type,
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.assertEqual(
            suggestions[1].status,
            suggestion_models.STATUS_IN_REVIEW)

    def test_get_translation_suggestions_in_review_with_valid_exp(self) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_6', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_7', self.translation_language_code)

        suggestions = (
            suggestion_models.GeneralSuggestionModel
            .get_translation_suggestions_in_review_with_exp_id(
                'exp1', self.translation_language_code))

        self.assertEqual(len(suggestions), 2)
        self.assertEqual(suggestions[0].target_id, 'exp1')
        self.assertEqual(
            suggestions[0].suggestion_type,
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.assertEqual(
            suggestions[0].status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(suggestions[1].target_id, 'exp1')

    def test_get_translation_suggestions_in_review_with_exp_ids_by_offset(
        self
    ) -> None:
        limit = 1
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_6', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_7', self.translation_language_code)

        suggestions, offset_1 = (
            suggestion_models
                .GeneralSuggestionModel
                .get_in_review_translation_suggestions_with_exp_ids_by_offset(
                    limit, 0, 'author_4',
                    [self.translation_language_code], ['exp1']))

        self.assertEqual(len(suggestions), 1)
        self.assertEqual(suggestions[0].target_id, 'exp1')
        self.assertEqual(offset_1, 1)
        self.assertEqual(
            suggestions[0].suggestion_type,
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.assertEqual(
            suggestions[0].status,
            suggestion_models.STATUS_IN_REVIEW)

    def test_get_in_review_translation_suggestions_by_offset(self) -> None:
        suggestion_1_id = 'exploration.exp1.thread_6'
        suggestion_2_id = 'exploration.exp1.thread_7'
        user_id = 'author1'
        limit = 1
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            suggestion_1_id, self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            suggestion_2_id, self.translation_language_code)

        results, offset_1 = (
            suggestion_models.GeneralSuggestionModel
            .get_in_review_translation_suggestions_by_offset(
                limit=limit,
                offset=0,
                user_id=user_id,
                language_codes=[self.translation_language_code]))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), limit)
        self.assertEqual(results[0].id, suggestion_1_id)
        self.assertEqual(offset_1, 1)

        results, offset_2 = (
            suggestion_models.GeneralSuggestionModel
            .get_in_review_translation_suggestions_by_offset(
                limit=limit,
                offset=offset_1,
                user_id=user_id,
                language_codes=[self.translation_language_code]))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), limit)
        self.assertEqual(results[0].id, suggestion_2_id)
        self.assertEqual(offset_2, 2)

        results, offset_3 = (
            suggestion_models.GeneralSuggestionModel
            .get_in_review_translation_suggestions_by_offset(
                limit=limit,
                offset=offset_2,
                user_id=user_id,
                language_codes=[self.translation_language_code]))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 0)
        self.assertEqual(offset_3, 2)

    def test_get_in_review_translation_suggestions_by_offset_no_limit(
        self
    ) -> None:
        suggestion_1_id = 'exploration.exp1.thread_6'
        suggestion_2_id = 'exploration.exp1.thread_7'
        user_id = 'author1'
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            suggestion_1_id, self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            suggestion_2_id, self.translation_language_code)

        results, offset = (
            suggestion_models.GeneralSuggestionModel
            .get_in_review_translation_suggestions_by_offset(
                limit=None,
                offset=0,
                user_id=user_id,
                language_codes=[self.translation_language_code]))

        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].id, suggestion_1_id)
        self.assertEqual(results[1].id, suggestion_2_id)
        self.assertEqual(offset, 2)

    def test_get_in_review_question_suggestions_by_offset(self) -> None:
        suggestion_1_id = 'skill1.thread1'
        suggestion_2_id = 'skill1.thread2'
        user_id = 'author1'
        limit = 1
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'skill_1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category1',
            suggestion_1_id, self.question_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'skill_1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_4',
            'reviewer_2', self.change_cmd, 'category1',
            suggestion_2_id, self.question_language_code)

        results, offset_1 = (
            suggestion_models.GeneralSuggestionModel
            .get_in_review_question_suggestions_by_offset(
                limit=limit,
                offset=0,
                user_id=user_id))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), limit)
        self.assertEqual(results[0].id, suggestion_1_id)
        self.assertEqual(offset_1, 1)

        results, offset_2 = (
            suggestion_models.GeneralSuggestionModel
            .get_in_review_question_suggestions_by_offset(
                limit=limit,
                offset=offset_1,
                user_id=user_id))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), limit)
        self.assertEqual(results[0].id, suggestion_2_id)
        self.assertEqual(offset_2, 2)

        results, offset_3 = (
            suggestion_models.GeneralSuggestionModel
            .get_in_review_question_suggestions_by_offset(
                limit=limit,
                offset=offset_2,
                user_id=user_id))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 0)
        self.assertEqual(offset_3, 2)

    def test_user_created_suggestions_by_offset(self) -> None:
        authored_translation_suggestion_id = 'exploration.exp1.thread_6'
        non_authored_translation_suggestion_id = 'exploration.exp1.thread_7'
        authored_question_suggestion_id = 'skill1.thread1'
        user_id = 'author1'
        limit = 1
        # User created translation suggestion.
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, user_id,
            'reviewer_2', self.change_cmd, self.score_category,
            authored_translation_suggestion_id, self.translation_language_code)
        # Translation suggestion created by a different user.
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            non_authored_translation_suggestion_id,
            self.translation_language_code)
        # User created question suggestion.
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'skill_1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, user_id,
            'reviewer_2', self.change_cmd, 'category1',
            authored_question_suggestion_id, self.question_language_code)

        results, translation_suggestion_offset = (
            suggestion_models.GeneralSuggestionModel
            .get_user_created_suggestions_by_offset(
                limit=limit,
                offset=0,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                user_id=user_id))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), limit)
        self.assertEqual(results[0].id, authored_translation_suggestion_id)
        self.assertEqual(translation_suggestion_offset, 1)

        results, question_suggestion_offset = (
            suggestion_models.GeneralSuggestionModel
            .get_user_created_suggestions_by_offset(
                limit=limit,
                offset=0,
                suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                user_id=user_id))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), limit)
        self.assertEqual(results[0].id, authored_question_suggestion_id)
        self.assertEqual(question_suggestion_offset, 1)

    def test_get_translation_suggestions_in_review_with_exp_id_with_invalid_exp(
            self
    ) -> None:
        suggestions = (
            suggestion_models.GeneralSuggestionModel
            .get_translation_suggestions_in_review_with_exp_id(
                'invalid_exp', 'hi'))
        self.assertEqual(len(suggestions), 0)

    def test_get_translation_suggestion_ids_with_exp_ids_with_one_exp(
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_6', self.translation_language_code)

        # Assert that there is one translation suggestion with the given
        # exploration id found.
        self.assertEqual(len(
            suggestion_models.GeneralSuggestionModel
            .get_translation_suggestion_ids_with_exp_ids(
                ['exp1'])), 1)

    def test_get_exp_translation_suggestions_in_review_returns_limited_values(
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_6', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_7', self.translation_language_code)

        with self.swap(feconf, 'DEFAULT_SUGGESTION_QUERY_LIMIT', 1):
            suggestions = (
                suggestion_models.GeneralSuggestionModel
                .get_translation_suggestions_in_review_with_exp_id(
                    'exp1', self.translation_language_code))

        self.assertEqual(len(suggestions), 1)

    def test_get_exp_translation_suggestions_in_review_for_resolved_suggestion_returns_no_items( # pylint: disable=line-too-long
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_REJECTED, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_6', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_ACCEPTED, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_7', self.translation_language_code)

        suggestions = (
            suggestion_models.GeneralSuggestionModel
            .get_translation_suggestions_in_review_with_exp_id(
                'exp1', self.translation_language_code))

        self.assertEqual(len(suggestions), 0)

    def test_get_exp_translation_suggestions_in_review_for_non_translation_suggestion_returns_no_items( # pylint: disable=line-too-long
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_6', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_7', self.translation_language_code)

        suggestions = (
            suggestion_models.GeneralSuggestionModel
            .get_translation_suggestions_in_review_with_exp_id(
                'exp1', self.translation_language_code))

        self.assertEqual(len(suggestions), 0)

    def test_get_exp_translation_suggestions_in_review_for_different_language_code_returns_no_items( # pylint: disable=line-too-long
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_4',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_7', 'hi')

        suggestions = (
            suggestion_models.GeneralSuggestionModel
            .get_translation_suggestions_in_review_with_exp_id('exp1', 'pt'))

        self.assertEqual(len(suggestions), 0)

    def test_get_translation_suggestion_ids_with_exp_ids_with_multiple_exps(
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp2', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_7', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp3', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_8', self.translation_language_code)

        # Assert that there are two translation suggestions with the given
        # exploration ids found.
        self.assertEqual(len(
            suggestion_models.GeneralSuggestionModel
            .get_translation_suggestion_ids_with_exp_ids(
                ['exp2', 'exp3'])), 2)

    def test_get_translation_suggestion_ids_with_exp_ids_with_invalid_exp(
        self
    ) -> None:
        # Assert that there are no translation suggestions with an invalid
        # exploration id found.
        self.assertEqual(len(
            suggestion_models.GeneralSuggestionModel
            .get_translation_suggestion_ids_with_exp_ids(
                ['invalid_exp'])), 0)

    def test_get_translation_suggestion_ids_with_exp_ids_past_default_query(
            self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp4', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_9', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp5', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread_10', self.translation_language_code)

        with self.swap(feconf, 'DEFAULT_SUGGESTION_QUERY_LIMIT', 1):
            suggestion_model_results = (
                suggestion_models
                .GeneralSuggestionModel
                .get_translation_suggestion_ids_with_exp_ids(
                    ['exp4', 'exp5'])
            )

        # Assert that there are two translation suggestions with the given
        # exploration ids found. There should be two fetch_page calls.
        self.assertEqual(len(suggestion_model_results), 2)

    def test_get_all_stale_suggestion_ids(self) -> None:
        with self.swap(
            suggestion_models, 'THRESHOLD_TIME_BEFORE_ACCEPT_IN_MSECS', 0):
            self.assertEqual(len(
                suggestion_models.GeneralSuggestionModel
                .get_all_stale_suggestion_ids()), 1)

        with self.swap(
            suggestion_models, 'THRESHOLD_TIME_BEFORE_ACCEPT_IN_MSECS',
            7 * 24 * 60 * 60 * 1000):
            self.assertEqual(len(
                suggestion_models.GeneralSuggestionModel
                .get_all_stale_suggestion_ids()), 0)

    def test_get__suggestions_waiting_too_long_raises_if_suggestion_types_empty(
        self
    ) -> None:
        with self.swap(
            feconf, 'CONTRIBUTOR_DASHBOARD_SUGGESTION_TYPES', []):
            with self.assertRaisesRegex(
                Exception,
                'Expected the suggestion types offered on the Contributor '
                'Dashboard to be nonempty.'):
                (
                    suggestion_models.GeneralSuggestionModel
                    .get_suggestions_waiting_too_long_for_review()
                )

    def test_get_suggestions_waiting_too_long_if_not_contributor_suggestion(
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_REJECTED, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread1', None)
        # This mocked list cannot be empty because then the query will fail.
        mocked_contributor_dashboard_suggestion_types = [
            feconf.SUGGESTION_TYPE_ADD_QUESTION]

        with self.swap(
            feconf, 'CONTRIBUTOR_DASHBOARD_SUGGESTION_TYPES',
            mocked_contributor_dashboard_suggestion_types):
            with self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0):
                suggestions_waiting_too_long_for_review = (
                    suggestion_models.GeneralSuggestionModel
                    .get_suggestions_waiting_too_long_for_review()
                )

        self.assertEqual(len(suggestions_waiting_too_long_for_review), 0)

    def test_get_suggestions_waiting_too_long_returns_empty_if_neg_timedelta(
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread1', self.translation_language_code)

        # Make sure the threshold is nonzero.
        with self.swap(
            suggestion_models,
            'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 1):
            suggestions_waiting_too_long_for_review = (
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_waiting_too_long_for_review()
            )

        self.assertEqual(len(suggestions_waiting_too_long_for_review), 0)

    def test_get_suggestions_waiting_too_long_if_suggestions_waited_less_limit(
        self
    ) -> None:
        with self.mock_datetime_utcnow(self.mocked_datetime_utcnow):
            suggestion_models.GeneralSuggestionModel.create(
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                'exp1', self.target_version_at_submission,
                suggestion_models.STATUS_IN_REVIEW, 'author_3',
                'reviewer_2', self.change_cmd, self.score_category,
                'exploration.exp1.thread1', self.translation_language_code)
        mocked_threshold_review_wait_time_in_days = 2
        mocked_datetime_less_than_review_wait_time_threshold = (
            self.mocked_datetime_utcnow + datetime.timedelta(days=1))

        with self.mock_datetime_utcnow(
            mocked_datetime_less_than_review_wait_time_threshold):
            with self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS',
                mocked_threshold_review_wait_time_in_days):
                suggestions_waiting_too_long_for_review = (
                    suggestion_models.GeneralSuggestionModel
                    .get_suggestions_waiting_too_long_for_review()
                )

        self.assertEqual(len(suggestions_waiting_too_long_for_review), 0)

    def test_get_suggestions_waiting_too_long_if_suggestion_waited_limit(
        self
    ) -> None:
        with self.mock_datetime_utcnow(self.mocked_datetime_utcnow):
            suggestion_models.GeneralSuggestionModel.create(
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                'exp1', self.target_version_at_submission,
                suggestion_models.STATUS_IN_REVIEW, 'author_3',
                'reviewer_2', self.change_cmd, self.score_category,
                'exploration.exp1.thread1', self.translation_language_code)
        mocked_threshold_review_wait_time_in_days = 2
        mocked_datetime_eq_review_wait_time_threshold = (
            self.mocked_datetime_utcnow + datetime.timedelta(
                days=mocked_threshold_review_wait_time_in_days))

        with self.mock_datetime_utcnow(
            mocked_datetime_eq_review_wait_time_threshold):
            with self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS',
                mocked_threshold_review_wait_time_in_days):
                suggestions_waiting_too_long_for_review = (
                    suggestion_models.GeneralSuggestionModel
                    .get_suggestions_waiting_too_long_for_review()
                )

        self.assertEqual(len(suggestions_waiting_too_long_for_review), 0)

    def test_get_suggestions_waiting_too_long_if_suggestion_waited_past_limit(
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread1', self.translation_language_code)

        with self.swap(
            suggestion_models,
            'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0):
            suggestions_waiting_too_long_for_review = (
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_waiting_too_long_for_review()
            )

        self.assertEqual(len(suggestions_waiting_too_long_for_review), 1)

    def test_get_suggestions_waiting_too_long_with_diff_review_wait_times(
        self
    ) -> None:
        with self.mock_datetime_utcnow(self.mocked_datetime_utcnow):
            suggestion_models.GeneralSuggestionModel.create(
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                'exp1', self.target_version_at_submission,
                suggestion_models.STATUS_IN_REVIEW, 'author_3',
                'reviewer_2', self.change_cmd, self.score_category,
                'exploration.exp1.thread1', self.translation_language_code)
        with self.mock_datetime_utcnow(
            self.mocked_datetime_utcnow + datetime.timedelta(days=2)):
            suggestion_models.GeneralSuggestionModel.create(
                feconf.SUGGESTION_TYPE_ADD_QUESTION,
                feconf.ENTITY_TYPE_SKILL,
                'skill_1', self.target_version_at_submission,
                suggestion_models.STATUS_IN_REVIEW, 'author_3',
                'reviewer_2', self.change_cmd, 'category1',
                'skill1.thread1', self.question_language_code)
        mocked_threshold_review_wait_time_in_days = 3
        mocked_datetime_past_review_wait_time_threshold = (
            self.mocked_datetime_utcnow + datetime.timedelta(days=4))

        with self.mock_datetime_utcnow(
            mocked_datetime_past_review_wait_time_threshold):
            with self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS',
                mocked_threshold_review_wait_time_in_days):
                suggestions_waiting_too_long_for_review = (
                    suggestion_models.GeneralSuggestionModel
                    .get_suggestions_waiting_too_long_for_review())

        # The question suggestion was created 2 days after the translation
        # suggestion, so it has only waited 1 day for a review, which is less
        # than 3, the mocked review wait time threshold. Therefore, only the
        # translation suggestion has waited too long for a review.
        self.assertEqual(len(suggestions_waiting_too_long_for_review), 1)
        self.assertEqual(
            suggestions_waiting_too_long_for_review[0].id,
            'exploration.exp1.thread1')

    def test_get_suggestions_waiting_too_long_returns_in_correct_wait_order(
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread1', 'fr')
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp2', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp2.thread1', 'en')
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp3', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp3.thread1', 'hi')

        with self.swap(
            suggestion_models,
            'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0):
            suggestions_waiting_too_long_for_review = (
                suggestion_models.GeneralSuggestionModel
                .get_suggestions_waiting_too_long_for_review()
            )

        self.assertEqual(len(suggestions_waiting_too_long_for_review), 3)
        # Assert that the order of the returned suggestion models represents
        # the suggestions sorted in descending order, based on how long each
        # suggestion has been waiting for review.
        self.assertEqual(
            suggestions_waiting_too_long_for_review[0].id,
            'exploration.exp1.thread1')
        self.assertEqual(
            suggestions_waiting_too_long_for_review[1].id,
            'exploration.exp2.thread1')
        self.assertEqual(
            suggestions_waiting_too_long_for_review[2].id,
            'exploration.exp3.thread1')

    def test_get_in_review_suggestions_in_score_categories(self) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category1',
            'exploration.exp1.thread_6', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_2',
            'reviewer_2', self.change_cmd, 'category2',
            'exploration.exp1.thread_7', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_2',
            'reviewer_2', self.change_cmd, 'category3',
            'exploration.exp1.thread_8', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_REJECTED, 'author_2',
            'reviewer_2', self.change_cmd, 'category1',
            'exploration.exp1.thread_9', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category2',
            'exploration.exp1.thread_10', None)

        self.assertEqual(len(
            suggestion_models.GeneralSuggestionModel
            .get_in_review_suggestions_in_score_categories(
                ['category1'], 'author_3')), 0)
        self.assertEqual(len(
            suggestion_models.GeneralSuggestionModel
            .get_in_review_suggestions_in_score_categories(
                ['category1'], 'author_2')), 1)
        self.assertEqual(len(
            suggestion_models.GeneralSuggestionModel
            .get_in_review_suggestions_in_score_categories(
                ['category2'], 'author_2')), 1)
        self.assertEqual(len(
            suggestion_models.GeneralSuggestionModel
            .get_in_review_suggestions_in_score_categories(
                ['category1', 'category2'], 'author_3')), 1)
        self.assertEqual(len(
            suggestion_models.GeneralSuggestionModel
            .get_in_review_suggestions_in_score_categories(
                ['category1', 'category2', 'category3'], 'author_1')), 4)
        self.assertEqual(len(
            suggestion_models.GeneralSuggestionModel
            .get_in_review_suggestions_in_score_categories(
                ['category1', 'category_invalid'], 'author_2')), 1)
        with self.assertRaisesRegex(
            Exception, 'Received empty list of score categories'):
            self.assertEqual(len(
                suggestion_models.GeneralSuggestionModel
                .get_in_review_suggestions_in_score_categories(
                    [], 'author_1')), 0)

    def test_get_all_score_categories(self) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category1',
            'exploration.exp1.thread_11', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_REJECTED, 'author_3',
            'reviewer_2', self.change_cmd, 'category2',
            'exploration.exp1.thread_12', None)
        score_categories = (
            suggestion_models.GeneralSuggestionModel.get_all_score_categories())
        self.assertIn(self.score_category, score_categories)
        self.assertIn('category1', score_categories)
        self.assertIn('category2', score_categories)

    def test_get_question_suggestions_waiting_longest_for_review(self) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'skill_1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category1',
            'skill1.thread1', self.question_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'skill_2', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category2',
            'skill2.thread1', self.question_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'skill_3', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category2',
            'skill3.thread1', self.question_language_code)

        question_suggestion_models = (
            suggestion_models.GeneralSuggestionModel
            .get_question_suggestions_waiting_longest_for_review()
        )

        self.assertEqual(len(question_suggestion_models), 3)
        # Assert that the order of the returned suggestion models represents
        # the suggestions sorted in descending order, based on how long each
        # suggestion has been waiting for review.
        self.assertEqual(question_suggestion_models[0].id, 'skill1.thread1')
        self.assertEqual(question_suggestion_models[1].id, 'skill2.thread1')
        self.assertEqual(question_suggestion_models[2].id, 'skill3.thread1')

    def test_get_translation_suggestions_waiting_longest_for_review_per_lang(
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread1', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp2', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp2.thread1', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp3', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp3.thread1', self.translation_language_code)
        # Create a translation suggestion that has a different language code.
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp4', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp4.thread1', 'fr')

        translation_suggestion_models = (
            suggestion_models.GeneralSuggestionModel
            .get_translation_suggestions_waiting_longest_for_review(
                self.translation_language_code
            )
        )

        self.assertEqual(len(translation_suggestion_models), 3)
        # Assert that the order of the returned suggestion models represents
        # the suggestions sorted in descending order, based on how long each
        # suggestion has been waiting for review.
        self.assertEqual(
            translation_suggestion_models[0].id, 'exploration.exp1.thread1')
        self.assertEqual(
            translation_suggestion_models[1].id, 'exploration.exp2.thread1')
        self.assertEqual(
            translation_suggestion_models[2].id, 'exploration.exp3.thread1')

        translation_suggestion_models_with_different_lang_code = (
            suggestion_models.GeneralSuggestionModel
            .get_translation_suggestions_waiting_longest_for_review(
                'fr'
            )
        )

        self.assertEqual(len(
            translation_suggestion_models_with_different_lang_code), 1)
        self.assertEqual(
            translation_suggestion_models_with_different_lang_code[0].id,
            'exploration.exp4.thread1')

    def test_get_translation_suggestions_waiting_longest_for_review_wrong_lang(
        self
    ) -> None:
        translation_suggestion_models = (
            suggestion_models.GeneralSuggestionModel
            .get_translation_suggestions_waiting_longest_for_review(
                'wrong_language_code'
            )
        )

        self.assertEqual(len(translation_suggestion_models), 0)

    def test_get_translation_suggestions_waiting_longest_for_review_max_fetch(
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp1.thread1', self.translation_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp2', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, self.score_category,
            'exploration.exp2.thread1', self.translation_language_code)

        with self.swap(
            suggestion_models,
            'MAX_TRANSLATION_SUGGESTIONS_TO_FETCH_FOR_REVIEWER_EMAILS', 1):
            translation_suggestion_models = (
                suggestion_models.GeneralSuggestionModel.
                get_translation_suggestions_waiting_longest_for_review(
                    self.translation_language_code)
            )

        # There should only be one translation suggestion returned since we
        # changed the maximum translations to fetch to 1.
        self.assertEqual(len(translation_suggestion_models), 1)
        self.assertEqual(
            translation_suggestion_models[0].id, 'exploration.exp1.thread1')

    def test_get_question_suggestions_waiting_longest_for_review_max_fetch(
        self
    ) -> None:
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'skill_1', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category1',
            'skill1.thread1', self.question_language_code)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'skill_2', self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category2',
            'skill2.thread1', self.question_language_code)

        with self.swap(
            suggestion_models,
            'MAX_QUESTION_SUGGESTIONS_TO_FETCH_FOR_REVIEWER_EMAILS', 1):
            question_suggestion_models = (
                suggestion_models.GeneralSuggestionModel
                .get_question_suggestions_waiting_longest_for_review()
            )

        # There should only be one question suggestion returned since we
        # changed the maximum questions to fetch to 1.
        self.assertEqual(len(question_suggestion_models), 1)
        self.assertEqual(question_suggestion_models[0].id, 'skill1.thread1')

    def test_export_data_trivial(self) -> None:
        user_data = (
            suggestion_models.GeneralSuggestionModel
            .export_data('non_existent_user'))
        test_data: Dict[str, str] = {}
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self) -> None:
        test_export_suggestion_type = (
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)
        test_export_target_type = feconf.ENTITY_TYPE_EXPLORATION
        test_export_target_id = self.target_id
        test_export_target_version = self.target_version_at_submission
        test_export_status = suggestion_models.STATUS_IN_REVIEW
        test_export_author = 'test_export_author'
        test_export_reviewer = 'test_export_reveiwer'
        test_export_change_cmd = self.change_cmd
        test_export_score_category = 'category1'
        test_export_thread_id = 'exploration.exp1.thread_export'
        test_export_language_code = 'en'
        test_export_edited_by_reviewer = False

        suggestion_models.GeneralSuggestionModel.create(
            test_export_suggestion_type,
            test_export_target_type,
            test_export_target_id,
            test_export_target_version,
            test_export_status,
            test_export_author,
            test_export_reviewer,
            test_export_change_cmd,
            test_export_score_category,
            test_export_thread_id,
            test_export_language_code
        )

        user_data = (
            suggestion_models.GeneralSuggestionModel
            .export_data('test_export_author'))

        test_data = {
            test_export_thread_id: {
                'suggestion_type': test_export_suggestion_type,
                'target_type': test_export_target_type,
                'target_id': test_export_target_id,
                'target_version_at_submission': test_export_target_version,
                'status': test_export_status,
                'change_cmd': test_export_change_cmd,
                'language_code': test_export_language_code,
                'edited_by_reviewer': test_export_edited_by_reviewer
            },

        }

        self.assertEqual(user_data, test_data)


class GeneralVoiceoverApplicationModelUnitTests(test_utils.GenericTestBase):
    """Tests for the GeneralVoiceoverApplicationModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            suggestion_models.GeneralSuggestionModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id_author(self) -> None:
        self.assertFalse(
            suggestion_models.GeneralVoiceoverApplicationModel
            .has_reference_to_user_id('author_1'))

        suggestion_models.GeneralVoiceoverApplicationModel(
            id='application_id',
            target_type='exploration',
            target_id='exp_id',
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='author_1',
            final_reviewer_id=None,
            language_code='en',
            filename='application_audio.mp3',
            content='<p>Some content</p>',
            rejection_message=None).put()

        self.assertTrue(
            suggestion_models.GeneralVoiceoverApplicationModel
            .has_reference_to_user_id('author_1'))
        self.assertFalse(
            suggestion_models.GeneralVoiceoverApplicationModel
            .has_reference_to_user_id('author_2'))

    def test_get_user_voiceover_applications(self) -> None:
        author_id = 'author'
        applicant_models = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .get_user_voiceover_applications(author_id))
        self.assertEqual(applicant_models, [])

        suggestion_models.GeneralVoiceoverApplicationModel(
            id='application_id',
            target_type='exploration',
            target_id='exp_id',
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id=author_id,
            final_reviewer_id=None,
            language_code='en',
            filename='application_audio.mp3',
            content='<p>Some content</p>',
            rejection_message=None).put()
        applicant_models = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .get_user_voiceover_applications(author_id))
        self.assertEqual(len(applicant_models), 1)
        self.assertEqual(applicant_models[0].id, 'application_id')

    def test_get_user_voiceover_applications_with_status(self) -> None:
        author_id = 'author'
        applicant_models = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .get_user_voiceover_applications(
                author_id, status=suggestion_models.STATUS_IN_REVIEW))
        self.assertEqual(applicant_models, [])

        suggestion_models.GeneralVoiceoverApplicationModel(
            id='application_id',
            target_type='exploration',
            target_id='exp_id',
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id=author_id,
            final_reviewer_id=None,
            language_code='en',
            filename='application_audio.mp3',
            content='<p>Some content</p>',
            rejection_message=None).put()
        applicant_models = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .get_user_voiceover_applications(
                author_id, status=suggestion_models.STATUS_IN_REVIEW))
        self.assertEqual(len(applicant_models), 1)
        self.assertEqual(applicant_models[0].id, 'application_id')

        applicant_models = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .get_user_voiceover_applications(
                author_id, status=suggestion_models.STATUS_REJECTED))
        self.assertEqual(applicant_models, [])

    def test_get_reviewable_voiceover_applications(self) -> None:
        author_id = 'author'
        reviewer_id = 'reviewer_id'
        applicant_models = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .get_reviewable_voiceover_applications(reviewer_id))
        self.assertEqual(applicant_models, [])
        applicant_models = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .get_reviewable_voiceover_applications(author_id))
        self.assertEqual(applicant_models, [])

        suggestion_models.GeneralVoiceoverApplicationModel(
            id='application_id',
            target_type='exploration',
            target_id='exp_id',
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id=author_id,
            final_reviewer_id=None,
            language_code='en',
            filename='application_audio.mp3',
            content='<p>Some content</p>',
            rejection_message=None).put()
        applicant_models = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .get_reviewable_voiceover_applications(reviewer_id))
        self.assertEqual(len(applicant_models), 1)
        self.assertEqual(applicant_models[0].id, 'application_id')

        applicant_models = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .get_reviewable_voiceover_applications(author_id))
        self.assertEqual(applicant_models, [])

    def test_get_voiceover_applications(self) -> None:
        suggestion_models.GeneralVoiceoverApplicationModel(
            id='application_id',
            target_type='exploration',
            target_id='exp_id',
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='author_id',
            final_reviewer_id=None,
            language_code='en',
            filename='application_audio.mp3',
            content='<p>Some content</p>',
            rejection_message=None).put()

        applicant_models = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .get_voiceover_applications('exploration', 'exp_id', 'en'))
        self.assertEqual(len(applicant_models), 1)
        self.assertEqual(applicant_models[0].id, 'application_id')

        applicant_models = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .get_voiceover_applications('exploration', 'exp_id', 'hi'))
        self.assertEqual(len(applicant_models), 0)

    def test_export_data_trivial(self) -> None:
        user_data = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .export_data('non_existent_user'))
        test_data: Dict[str, str] = {}
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self) -> None:
        suggestion_models.GeneralVoiceoverApplicationModel(
            id='application_1_id',
            target_type='exploration',
            target_id='exp_id',
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='author_1',
            final_reviewer_id='reviewer_id',
            language_code='en',
            filename='application_audio.mp3',
            content='<p>Some content</p>',
            rejection_message=None).put()

        suggestion_models.GeneralVoiceoverApplicationModel(
            id='application_2_id',
            target_type='exploration',
            target_id='exp_id',
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='author_1',
            final_reviewer_id=None,
            language_code='en',
            filename='application_audio.mp3',
            content='<p>Some content</p>',
            rejection_message=None).put()

        expected_data = {
            'application_1_id': {
                'target_type': 'exploration',
                'target_id': 'exp_id',
                'status': 'review',
                'language_code': 'en',
                'filename': 'application_audio.mp3',
                'content': '<p>Some content</p>',
                'rejection_message': None
            },
            'application_2_id': {
                'target_type': 'exploration',
                'target_id': 'exp_id',
                'status': 'review',
                'language_code': 'en',
                'filename': 'application_audio.mp3',
                'content': '<p>Some content</p>',
                'rejection_message': None
            }
        }
        user_data = (
            suggestion_models.GeneralVoiceoverApplicationModel
            .export_data('author_1'))
        self.assertEqual(expected_data, user_data)


class CommunityContributionStatsModelUnitTests(test_utils.GenericTestBase):
    """Tests the CommunityContributionStatsModel class."""

    translation_reviewer_counts_by_lang_code: Dict[str, int] = {
        'hi': 0,
        'en': 1
    }

    translation_suggestion_counts_by_lang_code: Dict[str, int] = {
        'fr': 6,
        'en': 5
    }

    question_reviewer_count: int = 1
    question_suggestion_count: int = 4

    def test_get_returns_community_contribution_stats_model_when_it_exists(
        self
    ) -> None:
        suggestion_models.CommunityContributionStatsModel(
            id=suggestion_models.COMMUNITY_CONTRIBUTION_STATS_MODEL_ID,
            translation_reviewer_counts_by_lang_code=(
                self.translation_reviewer_counts_by_lang_code),
            translation_suggestion_counts_by_lang_code=(
                self.translation_suggestion_counts_by_lang_code),
            question_reviewer_count=self.question_reviewer_count,
            question_suggestion_count=self.question_suggestion_count
        ).put()

        community_contribution_stats_model = (
            suggestion_models.CommunityContributionStatsModel.get()
        )

        self.assertEqual(
            community_contribution_stats_model.id,
            suggestion_models.COMMUNITY_CONTRIBUTION_STATS_MODEL_ID
        )
        self.assertEqual(
            (
                community_contribution_stats_model
                .translation_reviewer_counts_by_lang_code
            ),
            self.translation_reviewer_counts_by_lang_code
        )
        self.assertEqual(
            (
                community_contribution_stats_model
                .translation_suggestion_counts_by_lang_code
            ),
            self.translation_suggestion_counts_by_lang_code
        )
        self.assertEqual(
            community_contribution_stats_model.question_reviewer_count,
            self.question_reviewer_count
        )
        self.assertEqual(
            community_contribution_stats_model.question_suggestion_count,
            self.question_suggestion_count
        )

    def test_get_returns_new_community_contribution_stats_model_if_not_found(
        self
    ) -> None:
        """If the model has not been created yet, get should create the model
        with default values.
        """
        community_contribution_stats_model = (
            suggestion_models.CommunityContributionStatsModel.get()
        )
        self.assertEqual(
            community_contribution_stats_model.id,
            suggestion_models.COMMUNITY_CONTRIBUTION_STATS_MODEL_ID
        )
        self.assertEqual(
            (
                community_contribution_stats_model
                .translation_reviewer_counts_by_lang_code
            ), {}
        )
        self.assertEqual(
            (
                community_contribution_stats_model
                .translation_suggestion_counts_by_lang_code
            ), {}
        )
        self.assertEqual(
            community_contribution_stats_model.question_reviewer_count, 0
        )
        self.assertEqual(
            community_contribution_stats_model.question_suggestion_count, 0
        )

    def test_get_deletion_policy_returns_not_applicable(self) -> None:
        self.assertEqual(
            (
                suggestion_models.CommunityContributionStatsModel
                .get_deletion_policy()
            ),
            base_models.DELETION_POLICY.NOT_APPLICABLE
        )


class TranslationContributionStatsModelUnitTests(test_utils.GenericTestBase):
    """Tests the TranslationContributionStatsModel class."""

    LANGUAGE_CODE: Final = 'es'
    CONTRIBUTOR_USER_ID: Final = 'uid_01234567890123456789012345678912'
    TOPIC_ID: Final = 'topic_id'
    SUBMITTED_TRANSLATIONS_COUNT: Final = 2
    SUBMITTED_TRANSLATION_WORD_COUNT: Final = 100
    ACCEPTED_TRANSLATIONS_COUNT: Final = 1
    ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT: Final = 0
    ACCEPTED_TRANSLATION_WORD_COUNT: Final = 50
    REJECTED_TRANSLATIONS_COUNT: Final = 0
    REJECTED_TRANSLATION_WORD_COUNT: Final = 0
    # Timestamp dates in sec since epoch for Mar 19 2021 UTC.
    CONTRIBUTION_DATES: Final = [
        datetime.date.fromtimestamp(1616173836),
        datetime.date.fromtimestamp(1616173837)
    ]

    def test_get_returns_model_when_it_exists(self) -> None:
        suggestion_models.TranslationContributionStatsModel.create(
            language_code=self.LANGUAGE_CODE,
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            topic_id=self.TOPIC_ID,
            submitted_translations_count=self.SUBMITTED_TRANSLATIONS_COUNT,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_without_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=self.REJECTED_TRANSLATIONS_COUNT,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT),
            contribution_dates=self.CONTRIBUTION_DATES
        )

        translation_contribution_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANGUAGE_CODE, self.CONTRIBUTOR_USER_ID, self.TOPIC_ID
            )
        )

        # Ruling out the possibility of None for mypy type checking.
        assert translation_contribution_stats_model is not None
        self.assertEqual(
            translation_contribution_stats_model.language_code,
            self.LANGUAGE_CODE
        )
        self.assertEqual(
            translation_contribution_stats_model.contributor_user_id,
            self.CONTRIBUTOR_USER_ID
        )
        self.assertEqual(
            translation_contribution_stats_model.submitted_translations_count,
            self.SUBMITTED_TRANSLATIONS_COUNT
        )
        self.assertEqual(
            (
                translation_contribution_stats_model
                .submitted_translation_word_count
            ),
            self.SUBMITTED_TRANSLATION_WORD_COUNT
        )
        self.assertEqual(
            translation_contribution_stats_model.accepted_translations_count,
            self.ACCEPTED_TRANSLATIONS_COUNT
        )
        self.assertEqual(
            (
                translation_contribution_stats_model
                .accepted_translations_without_reviewer_edits_count
            ),
            self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT
        )
        self.assertEqual(
            (
                translation_contribution_stats_model
                .accepted_translation_word_count
            ),
            self.ACCEPTED_TRANSLATION_WORD_COUNT
        )
        self.assertEqual(
            translation_contribution_stats_model.rejected_translations_count,
            self.REJECTED_TRANSLATIONS_COUNT
        )
        self.assertEqual(
            (
                translation_contribution_stats_model
                .rejected_translation_word_count
            ),
            self.REJECTED_TRANSLATION_WORD_COUNT
        )
        self.assertEqual(
            translation_contribution_stats_model.contribution_dates,
            self.CONTRIBUTION_DATES
        )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            (
                suggestion_models.TranslationContributionStatsModel
                .get_deletion_policy()
            ),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self) -> None:
        suggestion_models.TranslationContributionStatsModel.create(
            language_code=self.LANGUAGE_CODE,
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            topic_id=self.TOPIC_ID,
            submitted_translations_count=self.SUBMITTED_TRANSLATIONS_COUNT,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_without_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=self.REJECTED_TRANSLATIONS_COUNT,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT),
            contribution_dates=self.CONTRIBUTION_DATES
        )
        self.assertTrue(
            suggestion_models.TranslationContributionStatsModel
            .has_reference_to_user_id(self.CONTRIBUTOR_USER_ID))

        (
            suggestion_models.TranslationContributionStatsModel
            .apply_deletion_policy(self.CONTRIBUTOR_USER_ID)
        )

        self.assertFalse(
            suggestion_models.TranslationContributionStatsModel
            .has_reference_to_user_id(self.CONTRIBUTOR_USER_ID))

    def test_export_data_trivial(self) -> None:
        user_data = (
            suggestion_models.TranslationContributionStatsModel
            .export_data('non_existent_user'))
        self.assertEqual(user_data, {})

    def test_export_data_nontrivial(self) -> None:
        topic_id_2 = 'topic ID 2'
        # Seed translation stats data for two different topics.
        model_1_id = suggestion_models.TranslationContributionStatsModel.create(
            language_code=self.LANGUAGE_CODE,
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            topic_id=self.TOPIC_ID,
            submitted_translations_count=self.SUBMITTED_TRANSLATIONS_COUNT,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_without_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=self.REJECTED_TRANSLATIONS_COUNT,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT),
            contribution_dates=self.CONTRIBUTION_DATES
        )
        model_2_id = suggestion_models.TranslationContributionStatsModel.create(
            language_code=self.LANGUAGE_CODE,
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            topic_id=topic_id_2,
            submitted_translations_count=self.SUBMITTED_TRANSLATIONS_COUNT,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_without_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=self.REJECTED_TRANSLATIONS_COUNT,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT),
            contribution_dates=self.CONTRIBUTION_DATES
        )
        dates_in_iso_format = [
            date.isoformat() for date in self.CONTRIBUTION_DATES]
        model_1_id_without_user_id = model_1_id.replace(
            '.%s.' % self.CONTRIBUTOR_USER_ID, '.'
        )
        model_2_id_without_user_id = model_2_id.replace(
            '.%s.' % self.CONTRIBUTOR_USER_ID, '.'
        )
        expected_data = {
            model_1_id_without_user_id: {
                'language_code': self.LANGUAGE_CODE,
                'topic_id': self.TOPIC_ID,
                'submitted_translations_count': (
                    self.SUBMITTED_TRANSLATIONS_COUNT),
                'submitted_translation_word_count': (
                    self.SUBMITTED_TRANSLATION_WORD_COUNT),
                'accepted_translations_count': (
                    self.ACCEPTED_TRANSLATIONS_COUNT),
                'accepted_translations_without_reviewer_edits_count': (
                    self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
                'accepted_translation_word_count': (
                    self.ACCEPTED_TRANSLATION_WORD_COUNT),
                'rejected_translations_count': (
                    self.REJECTED_TRANSLATIONS_COUNT),
                'rejected_translation_word_count': (
                    self.REJECTED_TRANSLATION_WORD_COUNT),
                'contribution_dates': dates_in_iso_format
            },
            model_2_id_without_user_id: {
                'language_code': self.LANGUAGE_CODE,
                'topic_id': topic_id_2,
                'submitted_translations_count': (
                    self.SUBMITTED_TRANSLATIONS_COUNT),
                'submitted_translation_word_count': (
                    self.SUBMITTED_TRANSLATION_WORD_COUNT),
                'accepted_translations_count': (
                    self.ACCEPTED_TRANSLATIONS_COUNT),
                'accepted_translations_without_reviewer_edits_count': (
                    self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
                'accepted_translation_word_count': (
                    self.ACCEPTED_TRANSLATION_WORD_COUNT),
                'rejected_translations_count': (
                    self.REJECTED_TRANSLATIONS_COUNT),
                'rejected_translation_word_count': (
                    self.REJECTED_TRANSLATION_WORD_COUNT),
                'contribution_dates': dates_in_iso_format
            }
        }

        user_data = (
            suggestion_models.TranslationContributionStatsModel
            .export_data(self.CONTRIBUTOR_USER_ID))

        self.assertEqual(expected_data, user_data)


class TranslationReviewStatsModelUnitTests(test_utils.GenericTestBase):
    """Tests the TranslationContributionStatsModel class."""

    LANGUAGE_CODE = 'es'
    REVIEWER_USER_ID = 'uid_01234567890123456789012345678912'
    TOPIC_ID = 'topic_id'
    REVIEWED_TRANSLATIONS_COUNT = 2
    REVIEWED_TRANSLATION_WORD_COUNT = 100
    ACCEPTED_TRANSLATIONS_COUNT = 1
    ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT = 0
    ACCEPTED_TRANSLATION_WORD_COUNT = 50
    FIRST_CONTRIBUTION_DATE = datetime.date.fromtimestamp(1616173836)
    LAST_CONTRIBUTION_DATE = datetime.date.fromtimestamp(1616173836)

    def test_get_returns_model_when_it_exists(self) -> None:
        suggestion_models.TranslationReviewStatsModel.create(
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id=self.REVIEWER_USER_ID,
            topic_id=self.TOPIC_ID,
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                self.LANGUAGE_CODE, self.REVIEWER_USER_ID, self.TOPIC_ID
            )
        )

        # Ruling out the possibility of None for mypy type checking.
        assert translation_review_stats_model is not None
        self.assertEqual(
            translation_review_stats_model.language_code,
            self.LANGUAGE_CODE
        )
        self.assertEqual(
            translation_review_stats_model.reviewer_user_id,
            self.REVIEWER_USER_ID
        )
        self.assertEqual(
            translation_review_stats_model.reviewed_translations_count,
            self.REVIEWED_TRANSLATIONS_COUNT
        )
        self.assertEqual(
            (
                translation_review_stats_model
                .reviewed_translation_word_count
            ),
            self.REVIEWED_TRANSLATION_WORD_COUNT
        )
        self.assertEqual(
            translation_review_stats_model.accepted_translations_count,
            self.ACCEPTED_TRANSLATIONS_COUNT
        )
        self.assertEqual(
            (
                translation_review_stats_model
                .accepted_translations_with_reviewer_edits_count
            ),
            self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT
        )
        self.assertEqual(
            (
                translation_review_stats_model
                .accepted_translation_word_count
            ),
            self.ACCEPTED_TRANSLATION_WORD_COUNT
        )
        self.assertEqual(
            translation_review_stats_model.first_contribution_date,
            self.FIRST_CONTRIBUTION_DATE
        )
        self.assertEqual(
            translation_review_stats_model.last_contribution_date,
            self.LAST_CONTRIBUTION_DATE
        )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            (
                suggestion_models.TranslationReviewStatsModel
                .get_deletion_policy()
            ),
            base_models.DELETION_POLICY.DELETE)

    def test_get_all_by_user_id(self) -> None:
        suggestion_models.TranslationReviewStatsModel.create(
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id=self.REVIEWER_USER_ID,
            topic_id=self.TOPIC_ID,
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        translation_review_stats_models = (
            suggestion_models.TranslationReviewStatsModel.get_all_by_user_id(
                self.REVIEWER_USER_ID
            )
        )

        # Ruling out the possibility of None for mypy type checking.
        assert translation_review_stats_models is not None

        self.assertEqual(
            len(translation_review_stats_models),
            1
        )

        translation_review_stats_model = translation_review_stats_models[0]

        self.assertEqual(
            translation_review_stats_model.language_code,
            self.LANGUAGE_CODE
        )
        self.assertEqual(
            translation_review_stats_model.reviewer_user_id,
            self.REVIEWER_USER_ID
        )
        self.assertEqual(
            translation_review_stats_model.reviewed_translations_count,
            self.REVIEWED_TRANSLATIONS_COUNT
        )
        self.assertEqual(
            (
                translation_review_stats_model
                .reviewed_translation_word_count
            ),
            self.REVIEWED_TRANSLATION_WORD_COUNT
        )
        self.assertEqual(
            translation_review_stats_model.accepted_translations_count,
            self.ACCEPTED_TRANSLATIONS_COUNT
        )
        self.assertEqual(
            (
                translation_review_stats_model
                .accepted_translations_with_reviewer_edits_count
            ),
            self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT
        )
        self.assertEqual(
            (
                translation_review_stats_model
                .accepted_translation_word_count
            ),
            self.ACCEPTED_TRANSLATION_WORD_COUNT
        )
        self.assertEqual(
            translation_review_stats_model.first_contribution_date,
            self.FIRST_CONTRIBUTION_DATE
        )
        self.assertEqual(
            translation_review_stats_model.last_contribution_date,
            self.LAST_CONTRIBUTION_DATE
        )

    def test_apply_deletion_policy(self) -> None:
        suggestion_models.TranslationReviewStatsModel.create(
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id=self.REVIEWER_USER_ID,
            topic_id=self.TOPIC_ID,
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )
        self.assertTrue(
            suggestion_models.TranslationReviewStatsModel
            .has_reference_to_user_id(self.REVIEWER_USER_ID))

        (
            suggestion_models.TranslationReviewStatsModel
            .apply_deletion_policy(self.REVIEWER_USER_ID)
        )

        self.assertFalse(
            suggestion_models.TranslationReviewStatsModel
            .has_reference_to_user_id(self.REVIEWER_USER_ID))

    def test_export_data_trivial(self) -> None:
        user_data = (
            suggestion_models.TranslationReviewStatsModel
            .export_data('non_existent_user'))
        self.assertEqual(user_data, {})

    def test_export_data_nontrivial(self) -> None:
        topic_id_2 = 'topic ID 2'
        # Seed translation stats data for two different topics.
        model_1_id = suggestion_models.TranslationReviewStatsModel.create(
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id=self.REVIEWER_USER_ID,
            topic_id=self.TOPIC_ID,
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )
        model_2_id = suggestion_models.TranslationReviewStatsModel.create(
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id=self.REVIEWER_USER_ID,
            topic_id=topic_id_2,
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )
        model_1_id_without_user_id = model_1_id.replace(
            '.%s.' % self.REVIEWER_USER_ID, '.'
        )
        model_2_id_without_user_id = model_2_id.replace(
            '.%s.' % self.REVIEWER_USER_ID, '.'
        )
        expected_data = {
            model_1_id_without_user_id: {
                'language_code': self.LANGUAGE_CODE,
                'topic_id': self.TOPIC_ID,
                'reviewed_translations_count': (
                    self.REVIEWED_TRANSLATIONS_COUNT),
                'reviewed_translation_word_count': (
                    self.REVIEWED_TRANSLATION_WORD_COUNT),
                'accepted_translations_count': (
                    self.ACCEPTED_TRANSLATIONS_COUNT),
                'accepted_translations_with_reviewer_edits_count': (
                    self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
                'accepted_translation_word_count': (
                    self.ACCEPTED_TRANSLATION_WORD_COUNT),
                'first_contribution_date': (
                    self.FIRST_CONTRIBUTION_DATE.isoformat()),
                'last_contribution_date': (
                    self.LAST_CONTRIBUTION_DATE.isoformat())
            },
            model_2_id_without_user_id: {
                'language_code': self.LANGUAGE_CODE,
                'topic_id': topic_id_2,
                'reviewed_translations_count': (
                    self.REVIEWED_TRANSLATIONS_COUNT),
                'reviewed_translation_word_count': (
                    self.REVIEWED_TRANSLATION_WORD_COUNT),
                'accepted_translations_count': (
                    self.ACCEPTED_TRANSLATIONS_COUNT),
                'accepted_translations_with_reviewer_edits_count': (
                    self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
                'accepted_translation_word_count': (
                    self.ACCEPTED_TRANSLATION_WORD_COUNT),
                'first_contribution_date': (
                    self.FIRST_CONTRIBUTION_DATE.isoformat()),
                'last_contribution_date': (
                    self.LAST_CONTRIBUTION_DATE.isoformat())
            }
        }

        user_data = (
            suggestion_models.TranslationReviewStatsModel
            .export_data(self.REVIEWER_USER_ID))

        self.assertEqual(expected_data, user_data)


class QuestionContributionStatsModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionContributionStatsModel class."""

    CONTRIBUTOR_USER_ID = 'uid_01234567890123456789012345678912'
    TOPIC_ID = 'topic_id'
    SUBMITTED_QUESTION_COUNT = 2
    ACCEPTED_QUESTIONS_COUNT = 1
    ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT = 0
    FIRST_CONTRIBUTION_DATE = datetime.date.fromtimestamp(1616173836)
    LAST_CONTRIBUTION_DATE = datetime.date.fromtimestamp(1616173836)

    def test_get_returns_model_when_it_exists(self) -> None:
        suggestion_models.QuestionContributionStatsModel.create(
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            topic_id=self.TOPIC_ID,
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        question_contribution_stats_model = (
            suggestion_models.QuestionContributionStatsModel.get(
                self.CONTRIBUTOR_USER_ID, self.TOPIC_ID
            )
        )

        # Ruling out the possibility of None for mypy type checking.
        assert question_contribution_stats_model is not None
        self.assertEqual(
            question_contribution_stats_model.contributor_user_id,
            self.CONTRIBUTOR_USER_ID
        )
        self.assertEqual(
            question_contribution_stats_model.submitted_questions_count,
            self.SUBMITTED_QUESTION_COUNT
        )
        self.assertEqual(
            question_contribution_stats_model.accepted_questions_count,
            self.ACCEPTED_QUESTIONS_COUNT
        )
        self.assertEqual(
            (
                question_contribution_stats_model
                .accepted_questions_without_reviewer_edits_count
            ),
            self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT
        )
        self.assertEqual(
            question_contribution_stats_model.first_contribution_date,
            self.FIRST_CONTRIBUTION_DATE
        )
        self.assertEqual(
            question_contribution_stats_model.last_contribution_date,
            self.LAST_CONTRIBUTION_DATE
        )

    def test_get_all_by_user_id(self) -> None:
        suggestion_models.QuestionContributionStatsModel.create(
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            topic_id=self.TOPIC_ID,
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        question_contribution_stats_models = (
            suggestion_models.QuestionContributionStatsModel.get_all_by_user_id(
                self.CONTRIBUTOR_USER_ID
            )
        )

        # Ruling out the possibility of None for mypy type checking.
        assert question_contribution_stats_models is not None

        self.assertEqual(
            len(question_contribution_stats_models),
            1
        )

        question_contribution_stats_model = question_contribution_stats_models[
            0]

        # Ruling out the possibility of None for mypy type checking.
        assert question_contribution_stats_model is not None
        self.assertEqual(
            question_contribution_stats_model.contributor_user_id,
            self.CONTRIBUTOR_USER_ID
        )
        self.assertEqual(
            question_contribution_stats_model.submitted_questions_count,
            self.SUBMITTED_QUESTION_COUNT
        )
        self.assertEqual(
            question_contribution_stats_model.accepted_questions_count,
            self.ACCEPTED_QUESTIONS_COUNT
        )
        self.assertEqual(
            (
                question_contribution_stats_model
                .accepted_questions_without_reviewer_edits_count
            ),
            self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT
        )
        self.assertEqual(
            question_contribution_stats_model.first_contribution_date,
            self.FIRST_CONTRIBUTION_DATE
        )
        self.assertEqual(
            question_contribution_stats_model.last_contribution_date,
            self.LAST_CONTRIBUTION_DATE
        )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            (
                suggestion_models.QuestionContributionStatsModel
                .get_deletion_policy()
            ),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self) -> None:
        suggestion_models.QuestionContributionStatsModel.create(
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            topic_id=self.TOPIC_ID,
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )
        self.assertTrue(
            suggestion_models.QuestionContributionStatsModel
            .has_reference_to_user_id(self.CONTRIBUTOR_USER_ID))

        (
            suggestion_models.QuestionContributionStatsModel
            .apply_deletion_policy(self.CONTRIBUTOR_USER_ID)
        )

        self.assertFalse(
            suggestion_models.QuestionContributionStatsModel
            .has_reference_to_user_id(self.CONTRIBUTOR_USER_ID))

    def test_export_data_trivial(self) -> None:
        user_data = (
            suggestion_models.QuestionContributionStatsModel
            .export_data('non_existent_user'))
        self.assertEqual(user_data, {})

    def test_export_data_nontrivial(self) -> None:
        topic_id_2 = 'topic ID 2'
        # Seed question stats data for two different topics.
        suggestion_models.QuestionContributionStatsModel.create(
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            topic_id=self.TOPIC_ID,
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )
        suggestion_models.QuestionContributionStatsModel.create(
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            topic_id=topic_id_2,
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )
        model_1_id_without_user_id = self.TOPIC_ID
        model_2_id_without_user_id = topic_id_2
        expected_data = {
            model_1_id_without_user_id: {
                'topic_id': self.TOPIC_ID,
                'submitted_questions_count': (
                    self.SUBMITTED_QUESTION_COUNT),
                'accepted_questions_count': (
                    self.ACCEPTED_QUESTIONS_COUNT),
                'accepted_questions_without_reviewer_edits_count': (
                    self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
                'first_contribution_date': (
                    self.FIRST_CONTRIBUTION_DATE.isoformat()),
                'last_contribution_date': (
                    self.LAST_CONTRIBUTION_DATE.isoformat())
            },
            model_2_id_without_user_id: {
                'topic_id': topic_id_2,
                'submitted_questions_count': (
                    self.SUBMITTED_QUESTION_COUNT),
                'accepted_questions_count': (
                    self.ACCEPTED_QUESTIONS_COUNT),
                'accepted_questions_without_reviewer_edits_count': (
                    self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
                'first_contribution_date': (
                    self.FIRST_CONTRIBUTION_DATE.isoformat()),
                'last_contribution_date': (
                    self.LAST_CONTRIBUTION_DATE.isoformat())
            }
        }

        user_data = (
            suggestion_models.QuestionContributionStatsModel
            .export_data(self.CONTRIBUTOR_USER_ID))

        self.assertEqual(expected_data, user_data)


class QuestionReviewStatsModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionReviewStatsModel class."""

    REVIEWER_USER_ID = 'uid_01234567890123456789012345678912'
    TOPIC_ID = 'topic_id'
    REVIEWED_QUESTIONS_COUNT = 2
    ACCEPTED_QUESTIONS_COUNT = 1
    ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT = 0
    FIRST_CONTRIBUTION_DATE = datetime.date.fromtimestamp(1616173836)
    LAST_CONTRIBUTION_DATE = datetime.date.fromtimestamp(1616173836)

    def test_get_returns_model_when_it_exists(self) -> None:
        suggestion_models.QuestionReviewStatsModel.create(
            reviewer_user_id=self.REVIEWER_USER_ID,
            topic_id=self.TOPIC_ID,
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        question_review_stats_model = (
            suggestion_models.QuestionReviewStatsModel.get(
                self.REVIEWER_USER_ID, self.TOPIC_ID
            )
        )

        # Ruling out the possibility of None for mypy type checking.
        assert question_review_stats_model is not None
        self.assertEqual(
            question_review_stats_model.reviewer_user_id,
            self.REVIEWER_USER_ID
        )
        self.assertEqual(
            question_review_stats_model.reviewed_questions_count,
            self.REVIEWED_QUESTIONS_COUNT
        )
        self.assertEqual(
            question_review_stats_model.accepted_questions_count,
            self.ACCEPTED_QUESTIONS_COUNT
        )
        self.assertEqual(
            (
                question_review_stats_model
                .accepted_questions_with_reviewer_edits_count
            ),
            self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT
        )
        self.assertEqual(
            question_review_stats_model.first_contribution_date,
            self.FIRST_CONTRIBUTION_DATE
        )
        self.assertEqual(
            question_review_stats_model.last_contribution_date,
            self.LAST_CONTRIBUTION_DATE
        )

    def test_get_all_by_user_id(self) -> None:
        suggestion_models.QuestionReviewStatsModel.create(
            reviewer_user_id=self.REVIEWER_USER_ID,
            topic_id=self.TOPIC_ID,
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        question_review_stats_models = (
            suggestion_models.QuestionReviewStatsModel.get_all_by_user_id(
                self.REVIEWER_USER_ID
            )
        )

        # Ruling out the possibility of None for mypy type checking.
        assert question_review_stats_models is not None

        question_review_stats_model = question_review_stats_models[0]

        self.assertEqual(
            question_review_stats_model.reviewer_user_id,
            self.REVIEWER_USER_ID
        )
        self.assertEqual(
            question_review_stats_model.reviewed_questions_count,
            self.REVIEWED_QUESTIONS_COUNT
        )
        self.assertEqual(
            question_review_stats_model.accepted_questions_count,
            self.ACCEPTED_QUESTIONS_COUNT
        )
        self.assertEqual(
            (
                question_review_stats_model
                .accepted_questions_with_reviewer_edits_count
            ),
            self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT
        )
        self.assertEqual(
            question_review_stats_model.first_contribution_date,
            self.FIRST_CONTRIBUTION_DATE
        )
        self.assertEqual(
            question_review_stats_model.last_contribution_date,
            self.LAST_CONTRIBUTION_DATE
        )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            (
                suggestion_models.QuestionReviewStatsModel
                .get_deletion_policy()
            ),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self) -> None:
        suggestion_models.QuestionReviewStatsModel.create(
            reviewer_user_id=self.REVIEWER_USER_ID,
            topic_id=self.TOPIC_ID,
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )
        self.assertTrue(
            suggestion_models.QuestionReviewStatsModel
            .has_reference_to_user_id(self.REVIEWER_USER_ID))

        (
            suggestion_models.QuestionReviewStatsModel
            .apply_deletion_policy(self.REVIEWER_USER_ID)
        )

        self.assertFalse(
            suggestion_models.QuestionReviewStatsModel
            .has_reference_to_user_id(self.REVIEWER_USER_ID))

    def test_export_data_trivial(self) -> None:
        user_data = (
            suggestion_models.QuestionReviewStatsModel
            .export_data('non_existent_user'))
        self.assertEqual(user_data, {})

    def test_export_data_nontrivial(self) -> None:
        topic_id_2 = 'topic ID 2'
        # Seed question stats data for two different topics.
        suggestion_models.QuestionReviewStatsModel.create(
            reviewer_user_id=self.REVIEWER_USER_ID,
            topic_id=self.TOPIC_ID,
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )
        suggestion_models.QuestionReviewStatsModel.create(
            reviewer_user_id=self.REVIEWER_USER_ID,
            topic_id=topic_id_2,
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )
        model_1_id_without_user_id = self.TOPIC_ID
        model_2_id_without_user_id = topic_id_2
        expected_data = {
            model_1_id_without_user_id: {
                'topic_id': self.TOPIC_ID,
                'reviewed_questions_count': (
                    self.REVIEWED_QUESTIONS_COUNT),
                'accepted_questions_count': (
                    self.ACCEPTED_QUESTIONS_COUNT),
                'accepted_questions_with_reviewer_edits_count': (
                    self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
                'first_contribution_date': (
                    self.FIRST_CONTRIBUTION_DATE.isoformat()),
                'last_contribution_date': (
                    self.LAST_CONTRIBUTION_DATE.isoformat())
            },
            model_2_id_without_user_id: {
                'topic_id': topic_id_2,
                'reviewed_questions_count': (
                    self.REVIEWED_QUESTIONS_COUNT),
                'accepted_questions_count': (
                    self.ACCEPTED_QUESTIONS_COUNT),
                'accepted_questions_with_reviewer_edits_count': (
                    self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
                'first_contribution_date': (
                    self.FIRST_CONTRIBUTION_DATE.isoformat()),
                'last_contribution_date': (
                    self.LAST_CONTRIBUTION_DATE.isoformat())
            }
        }

        user_data = (
            suggestion_models.QuestionReviewStatsModel
            .export_data(self.REVIEWER_USER_ID))

        self.assertEqual(expected_data, user_data)
