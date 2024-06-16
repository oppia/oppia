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

"""Tests for suggestion related services."""

from __future__ import annotations

import datetime
import random
import string

from core import feconf
from core import utils
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import question_domain
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import skill_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import taskqueue_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import translation_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List, Mapping, Union

MYPY = False
if MYPY:  # pragma: no cover
    from core.domain import change_domain
    from mypy_imports import feedback_models
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models
    from mypy_imports import user_models

(suggestion_models, feedback_models, opportunity_models, user_models) = (
    models.Registry.import_models(
        [
            models.Names.SUGGESTION,
            models.Names.FEEDBACK,
            models.Names.OPPORTUNITY,
            models.Names.USER
        ]
    )
)


class SuggestionServicesUnitTests(test_utils.GenericTestBase):
    """Test the functions in suggestion_services."""

    score_category: str = ('%s%sAlgebra' % (
        suggestion_models.SCORE_TYPE_CONTENT,
        suggestion_models.SCORE_CATEGORY_DELIMITER)
    )

    target_id: str = 'exp1'
    target_id_2: str = 'exp2'
    target_id_3: str = 'exp3'
    target_version_at_submission: int = 1
    change_cmd: Dict[str, Union[str, Dict[str, str]]] = {
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
        'state_name': 'state_1',
        'new_value': {
            'content_id': 'content_0',
            'html': 'new suggestion content'
        }
    }

    AUTHOR_EMAIL: Final = 'author@example.com'
    REVIEWER_EMAIL: Final = 'reviewer@example.com'
    NORMAL_USER_EMAIL: Final = 'normal@example.com'

    THREAD_ID: Final = 'exploration.exp1.thread_1'

    COMMIT_MESSAGE: Final = 'commit message'
    EMPTY_COMMIT_MESSAGE: Final = ' '

    suggestion_id: str = THREAD_ID
    suggestion_id_2: str = 'exploration.exp2.thread_2'
    suggestion_id_3: str = 'exploration.exp3.thread_3'

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.signup(self.NORMAL_USER_EMAIL, 'normaluser')
        self.normal_user_id = self.get_user_id_from_email(
            self.NORMAL_USER_EMAIL)
        self.exploration = self.save_new_valid_exploration(
            self.target_id, self.author_id, category='Algebra')

    def assert_suggestion_status(self, suggestion_id: str, status: str) -> None:
        """Assert the status of the suggestion with suggestion_id."""
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        self.assertEqual(suggestion.status, status)

    def mock_accept_suggestion(
        self,
        suggestion_id: str,
        reviewer_id: str,
        commit_message: str,
        review_message: str
    ) -> None:
        """Sets up the appropriate mocks to successfully call
        accept_suggestion.
        """
        with self.swap(
            exp_services, 'update_exploration', self.mock_update_exploration):
            with self.swap(
                exp_fetchers, 'get_exploration_by_id',
                self.mock_get_exploration_by_id):
                with self.swap(
                    suggestion_registry.SuggestionEditStateContent,
                    'pre_accept_validate',
                    self.mock_pre_accept_validate_does_nothing):
                    with self.swap(
                        suggestion_registry.SuggestionEditStateContent,
                        '_get_change_list_for_accepting_edit_state_content_suggestion',  # pylint: disable=line-too-long
                        self.mock_get_change_list_does_nothing
                    ):
                        suggestion_services.accept_suggestion(
                            suggestion_id, reviewer_id,
                            commit_message, review_message)

    def mock_create_suggestion(self, target_id: str) -> None:
        """Sets up the appropriate mocks to successfully call
        create_suggestion.
        """
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            with self.swap(
                exp_fetchers, 'get_exploration_by_id',
                self.mock_get_exploration_by_id):
                suggestion_services.create_suggestion(
                    feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                    feconf.ENTITY_TYPE_EXPLORATION,
                    target_id, self.target_version_at_submission,
                    self.author_id, self.change_cmd, 'test description')

    def mock_generate_new_thread_id(
        self, entity_type: str, exp_id: str
    ) -> str:
        thread_id = 'thread_%s' % exp_id[-1]
        return '.'.join([entity_type, exp_id, thread_id])

    class MockExploration:
        """Mocks an exploration. To be used only for testing."""

        def __init__(
            self, exploration_id: str, states: Dict[str, Dict[str, str]]
        ) -> None:
            self.id = exploration_id
            self.states = states
            self.category = 'Algebra'

    # All mock explorations created for testing.
    explorations = [
        MockExploration('exp1', {'state_1': {}, 'state_2': {}}),
        MockExploration('exp2', {'state_1': {}, 'state_2': {}}),
        MockExploration('exp3', {'state_1': {}, 'state_2': {}})
    ]

    def mock_get_exploration_by_id(self, exp_id: str) -> MockExploration:
        for exp in self.explorations:
            if exp.id == exp_id:
                mock_exp = exp
        return mock_exp

    def mock_pre_accept_validate_does_nothing(self) -> None:
        pass

    def mock_get_change_list_does_nothing(self) -> None:
        pass

    def mock_accept_does_nothing(self, unused_arg: str) -> None:
        pass

    def edit_before_pre_accept_validate(
        self, suggestion: suggestion_registry.BaseSuggestion
    ) -> None:
        """Edits suggestion immediately before pre-accept validation."""
        suggestion.score_category = 'invalid_score_category'
        suggestion.pre_accept_validate()

    def test_create_new_suggestion_successfully(self) -> None:
        expected_suggestion_dict = {
            'suggestion_id': 'exploration.exp1.thread_1',
            'suggestion_type': (
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            'target_type': feconf.ENTITY_TYPE_EXPLORATION,
            'target_id': self.target_id,
            'target_version_at_submission': self.target_version_at_submission,
            'status': suggestion_models.STATUS_IN_REVIEW,
            'author_name': 'author',
            'change_cmd': {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'state_1',
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'new suggestion content'
                },
                'old_value': None
            },
            'score_category': self.score_category,
            'language_code': None
        }
        self.mock_create_suggestion(self.target_id)

        observed_suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        self.assertDictContainsSubset(
            expected_suggestion_dict, observed_suggestion.to_dict())

    def test_cannot_create_suggestion_with_invalid_suggestion_type(
        self
    ) -> None:
        with self.assertRaisesRegex(Exception, 'Invalid suggestion type'):
            suggestion_services.create_suggestion(
                'invalid_suggestion_type',
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, self.change_cmd, 'test description')

    def test_cannot_create_suggestion_with_invalid_author_id(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Expected author_id to be in a valid user ID format'):
            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                'invalid author ID', self.change_cmd, 'test description')

    def test_cannot_create_translation_suggestion_with_invalid_content_html_raise_error(  # pylint: disable=line-too-long
        self
    ) -> None:
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>The invalid content html</p>',
            'translation_html': '<p>Translation for invalid content.</p>',
            'data_format': 'html'
        }
        with self.assertRaisesRegex(
            Exception,
            'The Exploration content has changed since this translation '
            'was submitted.'):
            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, add_translation_change_dict, 'test description')

    def test_get_submitted_submissions(self) -> None:
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, self.change_cmd, '')
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, self.change_cmd, 'test_description')
        suggestions = suggestion_services.get_submitted_suggestions(
            self.author_id, feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)
        self.assertEqual(len(suggestions), 2)
        self.assertEqual(suggestions[0].author_id, self.author_id)
        self.assertEqual(suggestions[1].author_id, self.author_id)

    def test_get_all_stale_suggestion_ids(self) -> None:
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, self.change_cmd, 'test description')

        with self.swap(
            suggestion_models, 'THRESHOLD_TIME_BEFORE_ACCEPT_IN_MSECS', 0):
            self.assertEqual(
                len(suggestion_services.get_all_stale_suggestion_ids()), 1)

        with self.swap(
            suggestion_models, 'THRESHOLD_TIME_BEFORE_ACCEPT_IN_MSECS',
            7 * 24 * 60 * 60 * 1000):
            self.assertEqual(
                len(suggestion_services.get_all_stale_suggestion_ids()), 0)

    def mock_update_exploration(
        self,
        unused_user_id: str,
        unused_exploration_id: str,
        unused_change_list: str,
        commit_message: str,
    ) -> None:
        self.assertEqual(
            commit_message, 'Accepted suggestion by %s: %s' % (
                'author', self.COMMIT_MESSAGE))

    def test_cannot_reject_suggestion_with_empty_review_message(self) -> None:
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, self.change_cmd, 'test description')

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', self.target_id)])[0]
        self.assert_suggestion_status(
            suggestion.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

        with self.assertRaisesRegex(
            Exception, 'Review message cannot be empty.'):
            suggestion_services.reject_suggestion(
                suggestion.suggestion_id, self.reviewer_id, '')

        # Assert that the suggestion was not rejected.
        self.assert_suggestion_status(
            suggestion.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

    def test_accept_suggestion_and_send_email_to_author(self) -> None:
        new_suggestion_content = state_domain.SubtitledHtml(
            'content', '<p>new suggestion content html</p>').to_dict()
        change_dict: Dict[str, Union[str, state_domain.SubtitledHtmlDict]] = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Introduction',
            'new_value': new_suggestion_content
        }

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, change_dict, 'test description')

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', self.target_id)])[0]
        self.assert_suggestion_status(
            suggestion.suggestion_id, suggestion_models.STATUS_IN_REVIEW)
        # Create a user proficiency model to verify that the
        # score and onboarding_email_sent fields have changed after the
        # suggestion has been accepted.
        user_models.UserContributionProficiencyModel.create(
            self.author_id, suggestion.score_category, 0)

        # An email is sent to users the first time that they pass the score
        # required to review a suggestion category. By default, when a
        # suggestion is accepted and the recording of scores is enabled, the
        # score of the author of that suggestion is increased by 1. Therefore,
        # by setting that increment to minimum score required to review, we can
        # ensure that the email is sent.
        with self.swap(feconf, 'ENABLE_RECORDING_OF_SCORES', True):
            with self.swap(
                feconf, 'SEND_SUGGESTION_REVIEW_RELATED_EMAILS', True):
                with self.swap(
                    suggestion_models, 'INCREMENT_SCORE_OF_AUTHOR_BY',
                    feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW):
                    suggestion_services.accept_suggestion(
                        suggestion.suggestion_id, self.reviewer_id,
                        self.COMMIT_MESSAGE, 'review message')

        # Assert that the suggestion is now accepted.
        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', self.target_id)])[0]
        self.assert_suggestion_status(
            suggestion.suggestion_id, suggestion_models.STATUS_ACCEPTED)
        # Assert that the email was sent and that the score increased by the
        # correct amount.
        user_proficiency_model = (
            user_models.UserContributionProficiencyModel.get(
                self.author_id, suggestion.score_category
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert user_proficiency_model is not None
        self.assertTrue(user_proficiency_model.onboarding_email_sent)
        self.assertEqual(
            user_proficiency_model.score,
            feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW)

    def test_accept_suggestion_does_not_send_email_if_users_score_is_too_low(
        self
    ) -> None:
        self.mock_create_suggestion(self.target_id)
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)
        # Create the user proficiency model to verify the score and
        # that the onboarding_email_sent field does not change after the
        # suggestion is accepted.
        user_models.UserContributionProficiencyModel.create(
            self.author_id, self.score_category, 0)

        # An email is sent to users the first time that they pass the score
        # required to review a suggestion category. By default, when a
        # suggestion is accepted and the recording of scores is enabled, the
        # score of the author of that suggestion is increased by 1. This is
        # less than the minimum score required to review so an email should not
        # be sent.
        with self.swap(feconf, 'ENABLE_RECORDING_OF_SCORES', True):
            with self.swap(
                feconf, 'SEND_SUGGESTION_REVIEW_RELATED_EMAILS', True):
                self.mock_accept_suggestion(
                    self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE,
                    'review message')

        # Assert that the suggestion is now accepted.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_ACCEPTED)

        user_proficiency_model = (
            user_models.UserContributionProficiencyModel.get(
                self.author_id, self.score_category
            )
        )
        # Assert that the users score was updated correctly.
        # Ruling out the possibility of None for mypy type checking.
        assert user_proficiency_model is not None
        self.assertEqual(
            user_proficiency_model.score,
            suggestion_models.INCREMENT_SCORE_OF_AUTHOR_BY)
        # Assert that their score is not high enough to review the category.
        self.assertLess(
            user_proficiency_model.score,
            feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW)
        # Assert that the onboarding new reviewer email was not sent.
        self.assertFalse(user_proficiency_model.onboarding_email_sent)

    def test_accept_suggestion_creates_user_proficiency_model_if_it_is_none(
        self
    ) -> None:
        self.mock_create_suggestion(self.target_id)
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

        # Verify that a user proficiency model does not exist.
        self.assertIsNone(user_models.UserContributionProficiencyModel.get(
            self.author_id, self.score_category))

        with self.swap(feconf, 'ENABLE_RECORDING_OF_SCORES', True):
            self.mock_accept_suggestion(
                self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE,
                'review message')

        # Verify that a user proficiency model now exists.
        self.assertIsNotNone(user_models.UserContributionProficiencyModel.get(
            self.author_id, self.score_category))

    def test_accept_suggestion_successfully(self) -> None:
        self.mock_create_suggestion(self.target_id)
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

        self.mock_accept_suggestion(
            self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE,
            'review message')

        # Assert that the suggestion is now accepted.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_ACCEPTED)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        self.assertEqual(
            suggestion.final_reviewer_id, self.reviewer_id)

        thread_messages = feedback_services.get_messages(self.THREAD_ID)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(
            last_message.text, 'review message')

    def test_accept_suggestion_raises_exception_if_suggestion_does_not_exist(
        self
    ) -> None:
        expected_exception_regexp = (
            'You cannot accept the suggestion with id %s because it does not '
            'exist.' % (self.suggestion_id)
        )
        with self.assertRaisesRegex(Exception, expected_exception_regexp):
            self.mock_accept_suggestion(
                self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE,
                'review message')

    def test_accept_suggestion_with_invalid_math_fails(self) -> None:
        """Test that the method for accepting suggestions raises error when
        a suggestion with invalid math-tags is tried to be accepted.
        """
        change_dict: Dict[str, Union[str, state_domain.SubtitledHtmlDict]] = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': {
                'content_id': 'content_0',
                'html': (
                    '<oppia-noninteractive-math raw_latex-with-value="&am'
                    'p;quot;(x - a_1)(x - a_2)(x - a_3)...(x - a_n)&amp;q'
                    'uot;"></oppia-noninteractive-math>')
            }
        }
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            with self.swap(
                exp_fetchers, 'get_exploration_by_id',
                self.mock_get_exploration_by_id):
                suggestion_services.create_suggestion(
                    feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                    feconf.ENTITY_TYPE_EXPLORATION,
                    self.target_id, self.target_version_at_submission,
                    self.author_id, change_dict, 'test description')
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

        expected_exception_regexp = (
            'Invalid math tags found in the suggestion with id %s.' % (
                self.suggestion_id)
        )
        with self.assertRaisesRegex(Exception, expected_exception_regexp):
            self.mock_accept_suggestion(
                self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE,
                'review message')

        # Assert that the status of the suggestion hasn't changed.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

    def test_raises_exception_for_invalid_suggestion_id_with_strict_true(
        self
    ) -> None:
        with self.assertRaisesRegex(Exception, 'No suggestion model exists'):
            suggestion_services.get_suggestion_by_id('invalid_id')

    def test_accept_suggestion_raises_exception_if_suggestion_already_accepted(
        self
    ) -> None:
        self.mock_create_suggestion(self.target_id)
        # Accept the suggestion.
        self.mock_accept_suggestion(
            self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE, '')
        # Assert that the suggestion has been accepted.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_ACCEPTED)

        expected_exception_regexp = (
            'The suggestion with id %s has already been accepted/rejected.' % (
                self.suggestion_id)
        )
        with self.assertRaisesRegex(Exception, expected_exception_regexp):
            suggestion_services.accept_suggestion(
                self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE, '')

    def test_accept_suggestion_raises_exception_if_suggestion_already_rejected(
        self
    ) -> None:
        self.mock_create_suggestion(self.target_id)
        # Reject the suggestion.
        suggestion_services.reject_suggestion(
            self.suggestion_id, self.reviewer_id, 'reject review message'
        )
        # Assert that the suggestion has been rejected.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_REJECTED)

        expected_exception_regexp = (
            'The suggestion with id %s has already been accepted/rejected.' % (
                self.suggestion_id)
        )
        with self.assertRaisesRegex(Exception, expected_exception_regexp):
            suggestion_services.accept_suggestion(
                self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE, '')

        # Assert that the suggestion is still rejected.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_REJECTED)

    def test_accept_suggestion_invalid_suggestion_failure(self) -> None:
        self.mock_create_suggestion(self.target_id)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected score_category to be of the form '
                                   'score_type.score_sub_type, received '
                                   'invalid_score_category'):
            self.edit_before_pre_accept_validate(suggestion)
            suggestion_services.accept_suggestion(
                self.suggestion_id, self.reviewer_id,
                self.COMMIT_MESSAGE, '')

    def test_accept_suggestion_no_commit_message_failure(self) -> None:
        self.mock_create_suggestion(self.target_id)
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

        with self.assertRaisesRegex(
            Exception, 'Commit message cannot be empty.'):
            suggestion_services.accept_suggestion(
                self.suggestion_id, self.reviewer_id,
                self.EMPTY_COMMIT_MESSAGE, '')

        # Assert that the status of the suggestion didn't change.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

    def test_reject_suggestion_successfully(self) -> None:
        self.mock_create_suggestion(self.target_id)
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

        suggestion_services.reject_suggestion(
            self.suggestion_id, self.reviewer_id, 'reject review message')

        # Assert that the suggestion has been rejected.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_REJECTED)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        self.assertEqual(
            suggestion.final_reviewer_id, self.reviewer_id)

        thread_messages = feedback_services.get_messages(self.THREAD_ID)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(last_message.text, 'reject review message')

    def test_reject_suggestions_successfully(self) -> None:
        # Create the first suggestion to be rejected.
        self.mock_create_suggestion(self.target_id_2)
        self.assert_suggestion_status(
            self.suggestion_id_2, suggestion_models.STATUS_IN_REVIEW)
        # Create another suggestion to be rejected.
        self.mock_create_suggestion(self.target_id_3)
        self.assert_suggestion_status(
            self.suggestion_id_3, suggestion_models.STATUS_IN_REVIEW)
        suggestion_ids = [self.suggestion_id_2, self.suggestion_id_3]

        suggestion_services.reject_suggestions(
            suggestion_ids, self.reviewer_id, 'reject review message')

        for suggestion_id in suggestion_ids:
            # Assert that the statuses changed to rejected.
            self.assert_suggestion_status(
                suggestion_id, suggestion_models.STATUS_REJECTED)
            # Assert that the final reviewer id was updated.
            suggestion = suggestion_services.get_suggestion_by_id(
                suggestion_id)
            self.assertEqual(
                suggestion.final_reviewer_id, self.reviewer_id)
            # Assert that the messages were updated.
            thread_messages = feedback_services.get_messages(suggestion_id)
            last_message = thread_messages[len(thread_messages) - 1]
            self.assertEqual(
                last_message.text, 'reject review message')

    def test_reject_suggestion_raises_exception_if_suggestion_does_not_exist(
        self
    ) -> None:
        expected_exception_regexp = (
            'You cannot reject the suggestion with id %s because it does not '
            'exist.' % (self.suggestion_id)
        )
        with self.assertRaisesRegex(Exception, expected_exception_regexp):
            suggestion_services.reject_suggestion(
                self.suggestion_id, self.reviewer_id, 'review message')

    def test_reject_suggestion_raises_exception_if_suggestion_already_accepted(
        self
    ) -> None:
        self.mock_create_suggestion(self.target_id)
        # Accept the suggestion.
        self.mock_accept_suggestion(
            self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE, '')
        # Assert that the suggestion has been accepted.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_ACCEPTED)

        # Rejecting the suggestion should not work because the suggestion has
        # already been accepted.
        expected_exception_regexp = (
            'The suggestion with id %s has already been accepted/rejected.' % (
                self.suggestion_id)
        )
        with self.assertRaisesRegex(Exception, expected_exception_regexp):
            suggestion_services.reject_suggestion(
                self.suggestion_id, self.reviewer_id, 'reject review message')

        # Assert that the suggestion's status did not change.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_ACCEPTED)

    def test_reject_suggestion_raises_exception_if_suggestion_already_rejected(
        self
    ) -> None:
        self.mock_create_suggestion(self.target_id)
        # Reject the suggestion.
        suggestion_services.reject_suggestion(
            self.suggestion_id, self.reviewer_id, 'reject review message')
        # Assert that the suggestion has been rejected.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_REJECTED)

        # Rejecting the suggestion should not work because the suggestion has
        # already been rejected.
        expected_exception_regexp = (
            'The suggestion with id %s has already been accepted/rejected.' % (
                self.suggestion_id)
        )
        with self.assertRaisesRegex(Exception, expected_exception_regexp):
            suggestion_services.reject_suggestion(
                self.suggestion_id, self.reviewer_id, 'reject review message')

    def test_resubmit_rejected_suggestion_success(self) -> None:
        self.mock_create_suggestion(self.target_id)
        # Reject the suggestion.
        suggestion_services.reject_suggestion(
            self.suggestion_id, self.reviewer_id, 'reject review message')
        # Assert that the suggestion has been rejected.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_REJECTED)
        # Create the new change for the resubmitted suggestion.
        resubmit_change_content = state_domain.SubtitledHtml(
            'content', '<p>resubmit change content html</p>').to_dict()
        resubmit_change = exp_domain.ExplorationChange(
            {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'state_1',
                'new_value': resubmit_change_content,
                'old_value': self.change_cmd['new_value']
            }
        )

        # Resubmit rejected suggestion.
        suggestion_services.resubmit_rejected_suggestion(
            self.suggestion_id, 'resubmit summary message', self.author_id,
            resubmit_change)

        # The suggestion's status should now be in review instead of rejected.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)
        # The suggestion's change should be updated.
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        new_value = suggestion.change_cmd.new_value
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(new_value, dict)
        self.assertEqual(new_value['html'], resubmit_change_content['html'])

    def test_resubmit_rejected_suggestion_raises_exception_for_empty_message(
        self
    ) -> None:
        self.mock_create_suggestion(self.target_id)
        resubmit_change = exp_domain.ExplorationChange(
            {
                'cmd': exp_domain.CMD_RENAME_STATE,
                'new_state_name': '',
                'old_state_name': '',
            }
        )

        # Can't resubmit a rejected suggestion if the summary message is empty.
        with self.assertRaisesRegex(
            Exception, 'Summary message cannot be empty.'):
            suggestion_services.resubmit_rejected_suggestion(
                self.suggestion_id, '', self.author_id, resubmit_change)

    def test_resubmit_rejected_suggestion_raises_exception_for_unhandled_input(
        self
    ) -> None:
        self.mock_create_suggestion(self.target_id)

        # Can't resubmit a rejected suggestion if the suggestion hasn't been
        # rejected yet.
        expected_exception_regexp = (
            'The suggestion with id %s is not yet handled.' % (
                self.suggestion_id)
        )
        resubmit_change = exp_domain.ExplorationChange(
            {
                'cmd': exp_domain.CMD_RENAME_STATE,
                'new_state_name': '',
                'old_state_name': '',
            }
        )
        with self.assertRaisesRegex(Exception, expected_exception_regexp):
            suggestion_services.resubmit_rejected_suggestion(
                self.suggestion_id, 'resubmit summary message',
                self.author_id, resubmit_change
            )

    def test_resubmit_rejected_suggestion_raises_excep_for_accepted_suggestion(
        self
    ) -> None:
        self.mock_create_suggestion(self.target_id)
        # Accept the suggestion.
        self.mock_accept_suggestion(
            self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE,
            'review message')
        # Verfiy that the suggestion has been accepted.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_ACCEPTED)

        # Can't resubmit the suggestion if it's already accepted.
        expected_exception_regexp = (
            'The suggestion with id %s was accepted. Only rejected '
            'suggestions can be resubmitted.' % (
                self.suggestion_id)
        )
        resubmit_change = exp_domain.ExplorationChange(
            {
                'cmd': exp_domain.CMD_RENAME_STATE,
                'new_state_name': '',
                'old_state_name': '',
            }
        )
        with self.assertRaisesRegex(
            Exception, expected_exception_regexp):
            suggestion_services.resubmit_rejected_suggestion(
                self.suggestion_id, 'resubmit summary message',
                self.author_id, resubmit_change
            )

        # Verfiy that the suggestion is still accepted.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_ACCEPTED)

    def test_check_can_resubmit_suggestion(self) -> None:
        self.mock_create_suggestion(self.target_id)
        can_resubmit = suggestion_services.check_can_resubmit_suggestion(
            self.suggestion_id, self.author_id)
        self.assertEqual(can_resubmit, True)
        can_resubmit = suggestion_services.check_can_resubmit_suggestion(
            self.suggestion_id, self.normal_user_id)
        self.assertEqual(can_resubmit, False)

    def test_update_translation_suggestion_to_change_translation_html(
        self
    ) -> None:
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                'exploration1', self.author_id, ['state 1'], ['TextInput'],
                category='Algebra'))
        old_content = state_domain.SubtitledHtml(
            'content', '<p>old content html</p>').to_dict()
        exploration.states['state 1'].update_content(
            state_domain.SubtitledHtml.from_dict(old_content))
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state 1',
            'new_value': {
                'content_id': 'content_0',
                'html': '<p>old content html</p>'
            }
        })]
        exp_services.update_exploration(
            self.author_id, exploration.id, change_list, '')
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'state 1',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>old content html</p>',
            'translation_html': '<p>Translation for original content.</p>',
            'data_format': 'html'
        }
        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exploration1', self.target_version_at_submission,
            self.author_id, add_translation_change_dict, 'test description')

        suggestion_services.update_translation_suggestion(
            suggestion.suggestion_id, '<p>Updated translation</p>'
        )
        updated_suggestion = suggestion_services.get_suggestion_by_id(
            suggestion.suggestion_id)

        self.assertEqual(
            updated_suggestion.change_cmd.translation_html,
            '<p>Updated translation</p>')

    def test_update_question_suggestion_to_change_question_state(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        state = self._create_valid_question_data(
            'default_state', content_id_generator)
        suggestion_change: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': state.to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }

        new_solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': False,
            'correct_answer': 'Solution',
            'explanation': {
                'content_id': 'solution_2',
                'html': '<p>This is the updated solution.</p>',
            },
        }
        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            self.author_id, suggestion_change, 'test description')
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(suggestion_change['question_dict'], dict)
        test_question_dict: question_domain.QuestionDict = (
            suggestion_change['question_dict']
        )

        question_state_data = test_question_dict['question_state_data']
        question_state_data['content']['html'] = '<p>Updated question</p>'
        question_state_data['interaction']['solution'] = new_solution_dict
        question_state_data['recorded_voiceovers'] = (
            state.recorded_voiceovers.to_dict())

        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(suggestion.change_cmd.skill_difficulty, float)
        suggestion_services.update_question_suggestion(
            suggestion.suggestion_id,
            suggestion.change_cmd.skill_difficulty,
            question_state_data,
            content_id_generator.next_content_id_index)
        updated_suggestion = suggestion_services.get_suggestion_by_id(
            suggestion.suggestion_id)
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(updated_suggestion.change_cmd.question_dict, dict)
        question_dict: question_domain.QuestionDict = (
            updated_suggestion.change_cmd.question_dict
        )
        new_question_state_data = question_dict[
            'question_state_data']

        self.assertEqual(
            new_question_state_data['content'][
                'html'],
            '<p>Updated question</p>')
        self.assertEqual(
            new_question_state_data['interaction'][
                'solution'],
            new_solution_dict)

    def test_wrong_suggestion_raise_error_while_updating_translation_suggestion(
        self
    ) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index),
                'inapplicable_skill_misconception_ids': ['skillid12345-1']
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            self.author_id, suggestion_change, 'test description')

        with self.assertRaisesRegex(
            Exception,
            'Expected SuggestionTranslateContent suggestion'
            ' but found: SuggestionAddQuestion.'
        ):
            suggestion_services.update_translation_suggestion(
                suggestion.suggestion_id, 'test_translation'
            )

    def test_wrong_suggestion_raise_error_when_updating_add_question_suggestion(
        self
    ) -> None:
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                'exploration1', self.author_id, ['state 1'], ['TextInput'],
                category='Algebra'))
        audio_language_codes = set(
            language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES)
        model = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exploration1',
            topic_id='topic_id',
            topic_name='topic_name',
            story_id='story_id',
            story_title='story_title',
            chapter_title='chapter_title',
            content_count=2,
            incomplete_translation_language_codes=(
                audio_language_codes - set(['en'])),
            translation_counts={},
            language_codes_needing_voice_artists=audio_language_codes,
            language_codes_with_assigned_voice_artists=[]
        )
        model.update_timestamps()
        model.put()

        old_content = state_domain.SubtitledHtml(
            'content_0', '<p>old content html</p>').to_dict()
        exploration.states['state 1'].update_content(
            state_domain.SubtitledHtml.from_dict(old_content))
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state 1',
            'new_value': {
                'content_id': 'content_0',
                'html': '<p>old content html</p>'
            }
        })]
        exp_services.update_exploration(
            self.author_id, exploration.id, change_list, '')
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'state 1',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>old content html</p>',
            'translation_html': '<p>Translation for original content.</p>',
            'data_format': 'html'
        }
        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exploration1', self.target_version_at_submission,
            self.author_id, add_translation_change_dict, 'test description')

        with self.assertRaisesRegex(
            Exception,
            'Expected SuggestionAddQuestion suggestion but '
            'found: SuggestionTranslateContent.'
        ):
            suggestion_services.update_question_suggestion(
                suggestion.suggestion_id,
                0.1,
                exploration.states['state 1'].to_dict(),
                5
            )

    def test_update_question_suggestion_to_change_skill_difficulty(
        self
    ) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index
                )
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            self.author_id, suggestion_change, 'test description')
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(suggestion.change_cmd.question_dict, dict)
        change_question_dict = suggestion.change_cmd.question_dict
        question_state_data = change_question_dict[
            'question_state_data']

        suggestion_services.update_question_suggestion(
            suggestion.suggestion_id,
            0.6,
            question_state_data,
            content_id_generator.next_content_id_index)
        updated_suggestion = suggestion_services.get_suggestion_by_id(
            suggestion.suggestion_id)

        self.assertEqual(
            updated_suggestion.change_cmd.skill_difficulty,
            0.6)


class SuggestionGetServicesUnitTests(test_utils.GenericTestBase):
    score_category: str = '%s%sEnglish' % (
        suggestion_models.SCORE_TYPE_TRANSLATION,
        suggestion_models.SCORE_CATEGORY_DELIMITER
    )

    target_id_1: str = 'exp1'
    target_id_2: str = 'exp2'
    target_id_3: str = 'exp3'
    target_version_at_submission: int = 1
    change_cmd: Dict[str, str] = {
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
        'state_name': 'state_1',
        'new_value': 'new suggestion content'
    }

    AUTHOR_EMAIL_1: Final = 'author1@example.com'
    REVIEWER_EMAIL_1: Final = 'reviewer1@example.com'

    AUTHOR_EMAIL_2: Final = 'author2@example.com'
    REVIEWER_EMAIL_2: Final = 'reviewer2@example.com'

    add_translation_change_dict: Dict[str, str] = {
        'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
        'state_name': 'state_1',
        'content_id': 'content_0',
        'language_code': 'hi',
        'content_html': '<p>State name: state_1, Content id: content_0</p>',
        'translation_html': '<p>This is translated html.</p>',
        'data_format': 'html'
    }

    class MockExploration:
        """Mocks an exploration. To be used only for testing."""

        def __init__(
            self, exploration_id: str, states: Dict[str, Dict[str, str]]
        ) -> None:
            self.id = exploration_id
            self.states = states
            self.category = 'Algebra'

        def get_content_html(self, state_name: str, content_id: str) -> str:
            """Used to mock the get_content_html method for explorations."""
            # state_name and content_id are used here to suppress the unused
            # arguments warning. The main goal of this method is to just
            # produce content html for the tests.
            return '<p>State name: %s, Content id: %s</p>' % (
                state_name, content_id
            )

    # All mock explorations created for testing.
    explorations = [
        MockExploration('exp1', {'state_1': {}, 'state_2': {}}),
        MockExploration('exp2', {'state_1': {}, 'state_2': {}}),
        MockExploration('exp3', {'state_1': {}, 'state_2': {}}),
    ]

    def mock_get_exploration_by_id(self, exp_id: str) -> MockExploration:
        for exp in self.explorations:
            if exp.id == exp_id:
                mock_exp = exp
        return mock_exp

    def _create_question_suggestion_with_skill_id(
        self, skill_id: str
    ) -> suggestion_registry.SuggestionAddQuestion:
        """Creates a question suggestion with the given skill_id."""
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            self.author_id_1, suggestion_change, 'test description'
        )

    def _create_translation_suggestion_with_language_code(
        self, language_code: str
    ) -> suggestion_registry.SuggestionTranslateContent:
        """Creates a translation suggestion with the language code given."""
        return self._create_translation_suggestion(
            language_code, self.target_id_1)

    def _create_translation_suggestion(
        self, language_code: str, target_id: str
    ) -> suggestion_registry.SuggestionTranslateContent:
        """Creates a translation suggestion for the supplied language code and
        target ID.
        """

        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'state_1',
            'content_id': 'content_0',
            'language_code': language_code,
            'content_html': (
                '<p>State name: state_1, Content id: content_0</p>'),
            'translation_html': '<p>This is translated html.</p>',
            'data_format': 'html'
        }

        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html
            ):
                translation_suggestion = suggestion_services.create_suggestion(
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    feconf.ENTITY_TYPE_EXPLORATION,
                    target_id, 1, self.author_id_1,
                    add_translation_change_dict, 'test description')

        return translation_suggestion

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.AUTHOR_EMAIL_1, 'author1')
        self.author_id_1 = self.get_user_id_from_email(self.AUTHOR_EMAIL_1)
        self.signup(self.REVIEWER_EMAIL_1, 'reviewer1')
        self.reviewer_id_1 = self.get_user_id_from_email(self.REVIEWER_EMAIL_1)

        self.signup(self.AUTHOR_EMAIL_2, 'author2')
        self.author_id_2 = self.get_user_id_from_email(self.AUTHOR_EMAIL_2)
        self.signup(self.REVIEWER_EMAIL_2, 'reviewer2')
        self.reviewer_id_2 = self.get_user_id_from_email(self.REVIEWER_EMAIL_2)
        self.opportunity_summary_ids = [
            self.explorations[0].id, self.explorations[1].id,
            self.explorations[2].id]
        self.topic_name = 'topic'

        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):

            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, self.change_cmd, 'test description')

            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, self.change_cmd, 'test description')

            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, self.change_cmd, 'test description')

            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_2, self.change_cmd, 'test description')

            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id_2, self.target_version_at_submission,
                self.author_id_2, self.change_cmd, 'test description')

    def test_get_by_author(self) -> None:
        queries = [('author_id', self.author_id_1)]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 3)
        queries = [('author_id', self.author_id_2)]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 2)

    def test_get_translation_suggestions_in_review_by_exp_ids(self) -> None:
        suggestions = (
            suggestion_services
            .get_translation_suggestions_in_review_by_exp_ids(
                [
                    self.target_id_1,
                    self.target_id_2,
                    self.target_id_3
                ],
                'en'
            )
        )
        self.assertEqual(len(suggestions), 0)
        self._create_translation_suggestion_with_language_code('en')
        suggestions = (
            suggestion_services
            .get_translation_suggestions_in_review_by_exp_ids(
                [self.target_id_1],
                'en'
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert suggestions[0] is not None
        self.assertEqual(suggestions[0].author_id, self.author_id_1)
        self.assertEqual(suggestions[0].language_code, 'en')
        self.assertEqual(suggestions[0].target_id, self.target_id_1)

    def test_get_by_target_id(self) -> None:
        queries = [
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', self.target_id_1)
        ]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 4)
        queries = [
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', self.target_id_2)
        ]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 1)

    def test_get_by_status(self) -> None:
        queries = [('status', suggestion_models.STATUS_IN_REVIEW)]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 5)

    def test_get_by_type(self) -> None:
        queries = [(
            'suggestion_type',
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 5)

    def test_query_suggestions(self) -> None:
        queries = [
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', self.target_id_1),
            ('author_id', self.author_id_2)
        ]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 1)

        queries = [
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', self.target_id_1),
            ('author_id', self.author_id_1),
            ('status', suggestion_models.STATUS_IN_REVIEW)
        ]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 3)

        queries = [
            ('target_type', feconf.ENTITY_TYPE_EXPLORATION),
            ('target_id', self.target_id_1),
            ('invalid_field', 'value')
        ]
        with self.assertRaisesRegex(
            Exception, 'Not allowed to query on field invalid_field'):
            suggestion_services.query_suggestions(queries)

    def test_get_translation_suggestion_ids_with_exp_ids_with_one_exp(
        self
    ) -> None:
        # Create the translation suggestion associated with exploration id
        # target_id_1.
        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html):
                suggestion_services.create_suggestion(
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    feconf.ENTITY_TYPE_EXPLORATION,
                    self.target_id_1, 1, self.author_id_1,
                    self.add_translation_change_dict, 'test description')

        # Assert that there is one translation suggestion with the given
        # exploration id found.
        self.assertEqual(
            len(
                suggestion_services
                .get_translation_suggestion_ids_with_exp_ids(
                    [self.target_id_1])), 1)

    def test_get_translation_suggestion_ids_with_exp_ids_with_multiple_exps(
        self
    ) -> None:
        # Create the translation suggestion associated with exploration id
        # target_id_2.
        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html):
                suggestion_services.create_suggestion(
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    feconf.ENTITY_TYPE_EXPLORATION,
                    self.target_id_2, 1, self.author_id_1,
                    self.add_translation_change_dict, 'test description')
        # Create the translation suggestion associated with exploration id
        # target_id_3.
        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html):
                suggestion_services.create_suggestion(
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    feconf.ENTITY_TYPE_EXPLORATION,
                    self.target_id_3, 1, self.author_id_1,
                    self.add_translation_change_dict, 'test description')

        # Assert that there are two translation suggestions with the given
        # exploration ids found.
        self.assertEqual(
            len(
                suggestion_services
                .get_translation_suggestion_ids_with_exp_ids(
                    [self.target_id_2, self.target_id_3])), 2)

    def test_get_translation_suggestion_ids_with_exp_ids_with_invalid_exp(
        self
    ) -> None:
        # Assert that there are no translation suggestions with an invalid
        # exploration id found.
        self.assertEqual(
            len(
                suggestion_services
                .get_translation_suggestion_ids_with_exp_ids(
                    ['invalid_exp_id'])), 0)

    def test_get_translation_suggestion_ids_with_exp_ids_with_empty_exp_list(
        self
    ) -> None:
        # Assert that there are no translation suggestions found when we
        # use an empty exp_ids list.
        self.assertEqual(
            len(
                suggestion_services
                .get_translation_suggestion_ids_with_exp_ids([])), 0)

    def test_get_submitted_suggestions_by_offset(self) -> None:
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('pt')
        question_1_skill_id = 'skill1'
        question_2_skill_id = 'skill2'
        self._create_question_suggestion_with_skill_id(question_1_skill_id)
        self._create_question_suggestion_with_skill_id(question_2_skill_id)

        # Fetch submitted translation suggestions.
        translatable_suggestions, offset = (
            suggestion_services.get_submitted_suggestions_by_offset(
                user_id=self.author_id_1,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                limit=constants.OPPORTUNITIES_PAGE_SIZE,
                offset=0,
                sort_key=constants.SUGGESTIONS_SORT_KEY_DATE))

        self.assertEqual(len(translatable_suggestions), 2)
        self.assertEqual(offset, 2)
        self.assertEqual(
            translatable_suggestions[0].target_id, self.target_id_1
        )
        self.assertEqual(
            translatable_suggestions[0].suggestion_type,
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.assertEqual(
            translatable_suggestions[0].status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(
            translatable_suggestions[1].target_id, self.target_id_1
        )
        self.assertEqual(
            translatable_suggestions[1].suggestion_type,
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.assertEqual(
            translatable_suggestions[1].status,
            suggestion_models.STATUS_IN_REVIEW)

        # Fetch submitted question suggestions.
        question_suggestions, offset = (
            suggestion_services.get_submitted_suggestions_by_offset(
                user_id=self.author_id_1,
                suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                limit=constants.OPPORTUNITIES_PAGE_SIZE,
                offset=0,
                sort_key=constants.SUGGESTIONS_SORT_KEY_DATE))

        self.assertEqual(len(question_suggestions), 2)
        self.assertEqual(offset, 2)
        self.assertEqual(
            question_suggestions[0].target_id, question_2_skill_id
        )
        self.assertEqual(
            question_suggestions[0].suggestion_type,
            feconf.SUGGESTION_TYPE_ADD_QUESTION)
        self.assertEqual(
            question_suggestions[0].status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(
            question_suggestions[1].target_id, question_1_skill_id
        )
        self.assertEqual(
            question_suggestions[1].suggestion_type,
            feconf.SUGGESTION_TYPE_ADD_QUESTION)
        self.assertEqual(
            question_suggestions[1].status,
            suggestion_models.STATUS_IN_REVIEW)

    def test_get_translation_suggestions_in_review(self) -> None:
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('hi')

        suggestions = (
            suggestion_services
            .get_translation_suggestions_in_review(self.target_id_1))

        # Ruling out the possibility of None for mypy type checking.
        assert suggestions[0] is not None
        self.assertEqual(len(suggestions), 2)
        self.assertEqual(suggestions[0].target_id, self.target_id_1)
        self.assertEqual(
            suggestions[0].suggestion_type,
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.assertEqual(
            suggestions[0].status,
            suggestion_models.STATUS_IN_REVIEW)
        # Ruling out the possibility of None for mypy type checking.
        assert suggestions[1] is not None
        self.assertEqual(suggestions[1].target_id, self.target_id_1)
        self.assertEqual(
            suggestions[1].suggestion_type,
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.assertEqual(
            suggestions[1].status,
            suggestion_models.STATUS_IN_REVIEW)

    def test_get_translation_suggestions_in_review_by_exploration(self) -> None:
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('hi')

        suggestions = (
            suggestion_services
            .get_translation_suggestions_in_review_by_exploration(
                self.target_id_1, 'hi'))

        # Ruling out the possibility of None for mypy type checking.
        assert suggestions[0] is not None
        self.assertEqual(len(suggestions), 2)
        self.assertEqual(suggestions[0].target_id, self.target_id_1)
        self.assertEqual(
            suggestions[0].suggestion_type,
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.assertEqual(
            suggestions[0].status,
            suggestion_models.STATUS_IN_REVIEW)
        # Ruling out the possibility of None for mypy type checking.
        assert suggestions[1] is not None
        self.assertEqual(suggestions[1].target_id, self.target_id_1)
        self.assertEqual(
            suggestions[1].suggestion_type,
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.assertEqual(
            suggestions[1].status,
            suggestion_models.STATUS_IN_REVIEW)

    def test_get_translation_suggestions_in_review_by_exploration_returns_only_suggestions_with_supplied_language_code(  # pylint: disable=line-too-long
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('pt')

        suggestions = (
            suggestion_services
            .get_translation_suggestions_in_review_by_exploration(
                self.target_id_1, 'pt'))

        self.assertEqual(len(suggestions), 1)

    def test_get_reviewable_translation_suggestions_with_valid_exp_ids(
        self
    ) -> None:
        # Add a few translation suggestions in different languages.
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('pt')
        self._create_translation_suggestion_with_language_code('bn')
        self._create_translation_suggestion_with_language_code('bn')
        # Add few question suggestions.
        self._create_question_suggestion_with_skill_id('skill1')
        self._create_question_suggestion_with_skill_id('skill2')
        # Provide the user permission to review suggestions in particular
        # languages.
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'pt')

        # Get all reviewable translation suggestions.
        suggestions, offset = (
            suggestion_services.
            get_reviewable_translation_suggestions_by_offset(
                self.reviewer_id_1, self.opportunity_summary_ids,
                constants.OPPORTUNITIES_PAGE_SIZE, 0, None))

        # Expect that the results correspond to translation suggestions that the
        # user has rights to review.
        self.assertEqual(len(suggestions), 3)
        self.assertEqual(offset, 3)
        actual_language_code_list = [
            suggestion.change_cmd.language_code
            for suggestion in suggestions
        ]
        expected_language_code_list = ['hi', 'hi', 'pt']
        self.assertEqual(actual_language_code_list, expected_language_code_list)

    def test_get_reviewable_translation_suggestions_for_single_exploration( # pylint: disable=line-too-long
        self
    ) -> None:
         # Add a few translation suggestions in different languages.
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('pt')
        self._create_translation_suggestion_with_language_code('bn')
        self._create_translation_suggestion_with_language_code('bn')
        # Provide the user permission to review suggestions in particular
        # languages.
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'hi')
        user_settings = user_services.get_user_settings(self.reviewer_id_1)
        user_settings.preferred_translation_language_code = 'hi'
        user_services.save_user_settings(user_settings)
       # Get all reviewable translation suggestions.
        opportunity_summary_id = self.opportunity_summary_ids[0]
        suggestions, _ = suggestion_services.get_reviewable_translation_suggestions_for_single_exp( # pylint: disable=line-too-long
            self.reviewer_id_1, opportunity_summary_id, 'hi')
        self.assertEqual(len(suggestions), 2)

    def test_get_reviewable_translation_suggestions_for_single_exploration__with_no_reviewable_languages( # pylint: disable=line-too-long
        self
    ) -> None:
        # Add a few translation suggestions in different languages.
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('pt')
        self._create_translation_suggestion_with_language_code('bn')
        self._create_translation_suggestion_with_language_code('bn')

        # Get all reviewable translation suggestions.
        opportunity_summary_id = self.opportunity_summary_ids[0]
        suggestions, _ = (
            suggestion_services.
            get_reviewable_translation_suggestions_for_single_exp(
                self.reviewer_id_1, opportunity_summary_id, 'hi'))

        # The user does not have rights to review any languages, so expect an
        # empty result.
        self.assertEqual(len(suggestions), 0)

    def test_get_reviewable_translation_suggestions_with_empty_exp_ids( # pylint: disable=line-too-long
        self
    ) -> None:
        # Add a few translation suggestions in different languages.
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('pt')
        self._create_translation_suggestion_with_language_code('bn')
        self._create_translation_suggestion_with_language_code('bn')
        # Provide the user permission to review suggestions in particular
        # languages.
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'pt')

        # Get all reviewable translation suggestions.
        suggestions, offset = suggestion_services.get_reviewable_translation_suggestions_by_offset(
            self.reviewer_id_1, [],
            constants.OPPORTUNITIES_PAGE_SIZE, 0, None)

        self.assertEqual(offset, 0)
        self.assertEqual(len(suggestions), 0)

    def test_get_reviewable_translation_suggestions_with_none_exp_ids(
        self
    ) -> None:
        # Add a few translation suggestions in different languages.
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('pt')
        self._create_translation_suggestion_with_language_code('bn')
        self._create_translation_suggestion_with_language_code('bn')
        # Provide the user permission to review suggestions in particular
        # languages.
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'pt')

        # Get all reviewable translation suggestions.
        suggestions, offset = (
            suggestion_services.
            get_reviewable_translation_suggestions_by_offset(
                self.reviewer_id_1, None,
                constants.OPPORTUNITIES_PAGE_SIZE, 0, None))

        self.assertEqual(len(suggestions), 3)
        self.assertEqual(offset, 3)
        actual_language_code_list = [
            suggestion.change_cmd.language_code
            for suggestion in suggestions
        ]
        expected_language_code_list = ['hi', 'hi', 'pt']
        self.assertEqual(actual_language_code_list, expected_language_code_list)

    def test_get_reviewable_translation_suggestions_with_no_reviewable_languages( # pylint: disable=line-too-long
        self
    ) -> None:
        # Add a few translation suggestions in different languages.
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('pt')
        self._create_translation_suggestion_with_language_code('bn')
        self._create_translation_suggestion_with_language_code('bn')

        # Get all reviewable translation suggestions.
        suggestions, offset = (
            suggestion_services.
            get_reviewable_translation_suggestions_by_offset(
                self.reviewer_id_1, None,
                constants.OPPORTUNITIES_PAGE_SIZE, 0, None))

        # The user does not have rights to review any languages, so expect an
        # empty result.
        self.assertEqual(len(suggestions), 0)
        self.assertEqual(offset, 0)

    def test_get_reviewable_translation_suggestions_with_language_filter(
        self
    ) -> None:
        # Add a few translation suggestions in different languages.
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('pt')
        self._create_translation_suggestion_with_language_code('bn')
        self._create_translation_suggestion_with_language_code('bn')
        # Provide the user permission to review suggestions in particular
        # languages.
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'pt')

        # Get reviewable translation suggestions in Hindi.
        language_to_filter = 'hi'
        suggestions, _ = (
            suggestion_services.
            get_reviewable_translation_suggestions_by_offset(
                self.reviewer_id_1, self.opportunity_summary_ids,
                constants.OPPORTUNITIES_PAGE_SIZE, 0, None, language_to_filter))

        # Expect that the results correspond to translation suggestions that the
        # user has rights to review.
        self.assertEqual(len(suggestions), 2)
        self.assertEqual(suggestions[0].change_cmd.language_code, 'hi')
        self.assertEqual(suggestions[1].change_cmd.language_code, 'hi')

        # Get reviewable translation suggestions in Spanish (there are none).
        language_to_filter = 'es'
        suggestions, _ = (
            suggestion_services.
            get_reviewable_translation_suggestions_by_offset(
                self.reviewer_id_1, self.opportunity_summary_ids,
                constants.OPPORTUNITIES_PAGE_SIZE, 0, None, language_to_filter))

        # Expect that the results correspond to translation suggestions that the
        # user has rights to review.
        self.assertEqual(len(suggestions), 0)
        actual_language_code_list = [
            suggestion.change_cmd.language_code
            for suggestion in suggestions
        ]
        expected_language_code_list: List[str] = []
        self.assertEqual(actual_language_code_list, expected_language_code_list)

    def test_get_target_ids_of_reviewable_translation_suggestions_for_user(
        self
    ) -> None:
        language_code = 'hi'
        fetched_target_id_1, fetched_target_id_2 = ('exp1', 'exp2')
        self._create_translation_suggestion(language_code, fetched_target_id_1)
        self._create_translation_suggestion(language_code, fetched_target_id_2)
        self._create_translation_suggestion(language_code, fetched_target_id_2)
        self._create_translation_suggestion('bn', 'exp3')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'hi'
        )

        target_ids = (
            suggestion_services.
            get_reviewable_translation_suggestion_target_ids(
                self.reviewer_id_1, language_code
            )
        )

        self.assertCountEqual(
            target_ids, [fetched_target_id_1, fetched_target_id_2]
        )

    def test_get_target_ids_of_translations_in_user_reviewable_languages_when_not_filtering_by_language( # pylint: disable=line-too-long
        self
    ) -> None:
        fetched_target_id_1, fetched_target_id_2 = ('exp1', 'exp2')
        self._create_translation_suggestion('hi', fetched_target_id_1)
        self._create_translation_suggestion('fr', fetched_target_id_2)
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'hi'
        )
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'fr'
        )
        language_code = None

        target_ids = (
            suggestion_services.
            get_reviewable_translation_suggestion_target_ids(
                self.reviewer_id_1, language_code
            )
        )

        self.assertCountEqual(
            target_ids, [fetched_target_id_1, fetched_target_id_2]
        )

    def test_get_no_translation_target_ids_when_user_cannot_review_in_given_language( # pylint: disable=line-too-long
        self
    ) -> None:
        language_code = 'cs'
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'hi'
        )

        target_ids = (
            suggestion_services.
            get_reviewable_translation_suggestion_target_ids(
                self.reviewer_id_1, language_code
            )
        )

        self.assertCountEqual(target_ids, [])

    def test_get_reviewable_question_suggestions(self) -> None:
        # Add a few translation suggestions in different languages.
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('pt')
        self._create_translation_suggestion_with_language_code('bn')
        self._create_translation_suggestion_with_language_code('bn')
        # Add a few question suggestions.
        self._create_question_suggestion_with_skill_id('skill1')
        self._create_question_suggestion_with_skill_id('skill2')
        self._create_question_suggestion_with_skill_id('skill3')
        # Provide the user permission to review suggestions in particular
        # languages.
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id_1, 'pt')
        # Provide the user permission to review question suggestions.
        user_services.allow_user_to_review_question(self.reviewer_id_1)

        # Get all reviewable question suggestions.
        suggestions, offset = (
            suggestion_services.get_reviewable_question_suggestions_by_offset(
                self.reviewer_id_1,
                limit=constants.OPPORTUNITIES_PAGE_SIZE,
                offset=0,
                sort_key=constants.SUGGESTIONS_SORT_KEY_DATE,
                skill_ids=['skill1', 'skill2']))

        # Expect that the results correspond to question suggestions.
        self.assertEqual(len(suggestions), 2)
        self.assertEqual(offset, 3)
        expected_suggestion_type_list = ['skill2', 'skill1']
        actual_suggestion_type_list = [
            suggestion.change_cmd.skill_id
            for suggestion in suggestions
        ]
        self.assertEqual(
            actual_suggestion_type_list, expected_suggestion_type_list)

    def test_get_translation_suggestions_waiting_longest_for_review_per_lang(
        self
    ) -> None:
        suggestion_1 = self._create_translation_suggestion_with_language_code(
            'hi')
        suggestion_2 = self._create_translation_suggestion_with_language_code(
            'hi')
        suggestion_3 = self._create_translation_suggestion_with_language_code(
            'hi')

        suggestions = (
            suggestion_services
            .get_translation_suggestions_waiting_longest_for_review(
                'hi'))

        # Assert that the suggestions are in the order that they were created.
        self.assertEqual(len(suggestions), 3)
        self.assertEqual(
            suggestions[0].suggestion_id, suggestion_1.suggestion_id)
        self.assertEqual(
            suggestions[1].suggestion_id, suggestion_2.suggestion_id)
        self.assertEqual(
            suggestions[2].suggestion_id, suggestion_3.suggestion_id)
        for i in range(len(suggestions) - 1):
            self.assertLessEqual(
                suggestions[i].last_updated, suggestions[i + 1].last_updated)

    def test_get_translation_suggestions_waiting_longest_for_review_wrong_lang(
        self
    ) -> None:
        suggestions = (
            suggestion_services
            .get_translation_suggestions_waiting_longest_for_review(
                'wrong_language_code'))

        self.assertEqual(len(suggestions), 0)

    def test_get_question_suggestions_waiting_longest_for_review_keeps_order(
        self
    ) -> None:
        """This test makes sure that if a suggestion is rejected and is then
        resubmitted, we count the time that the suggestion has been waiting for
        review from when it was resubmitted, not from when it was first
        submitted.
        """
        suggestion_1 = self._create_question_suggestion_with_skill_id('skill1')
        suggestion_2 = self._create_question_suggestion_with_skill_id('skill2')
        # Verify that both suggestions are returned and in the right order.
        suggestions = (
            suggestion_services
            .get_question_suggestions_waiting_longest_for_review()
        )
        self.assertEqual(len(suggestions), 2)
        self.assertEqual(
            suggestions[0].suggestion_id, suggestion_1.suggestion_id)
        self.assertEqual(
            suggestions[1].suggestion_id, suggestion_2.suggestion_id)
        self.assertLessEqual(
            suggestions[0].last_updated, suggestions[1].last_updated)

        # Reject the suggestion that was created first since it is the one that
        # has been waiting the longest for review.
        suggestion_services.reject_suggestion(
            suggestion_1.suggestion_id, self.reviewer_id_1, 'Reject message')

        # Verify that only the suggestion that was created second is returned.
        suggestions = (
            suggestion_services
            .get_question_suggestions_waiting_longest_for_review()
        )
        self.assertEqual(len(suggestions), 1)
        self.assertEqual(
            suggestions[0].suggestion_id, suggestion_2.suggestion_id)

        # Change the question_dict of the question suggestion that got rejected
        # so we can resubmit the suggestion for review.
        resubmit_question_change = suggestion_1.change_cmd
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(resubmit_question_change.question_dict, dict)
        resubmit_question_change.question_dict['linked_skill_ids'] = ['skill1']

        # Resubmit the rejected question suggestion.
        suggestion_services.resubmit_rejected_suggestion(
            suggestion_1.suggestion_id, 'resubmit summary message',
            self.author_id_1, resubmit_question_change
        )

        # Verify that both suggestions are returned again and the suggestion
        # that was created second is now the first suggestion in the returned
        # list, since it has been waiting longer (due to it not being updated).
        suggestions = (
            suggestion_services
            .get_question_suggestions_waiting_longest_for_review()
        )
        self.assertEqual(len(suggestions), 2)
        self.assertEqual(
            suggestions[0].suggestion_id, suggestion_2.suggestion_id)
        self.assertEqual(
            suggestions[1].suggestion_id, suggestion_1.suggestion_id)
        self.assertLessEqual(
            suggestions[0].last_updated, suggestions[1].last_updated)

    def test_get_question_suggestions_waiting_longest_for_review(self) -> None:
        suggestion_1 = self._create_question_suggestion_with_skill_id('skill1')
        suggestion_2 = self._create_question_suggestion_with_skill_id('skill2')
        suggestion_3 = self._create_question_suggestion_with_skill_id('skill3')

        suggestions = (
            suggestion_services
            .get_question_suggestions_waiting_longest_for_review()
        )

        # Assert that the suggestions are in the order that they were created.
        self.assertEqual(len(suggestions), 3)
        self.assertEqual(
            suggestions[0].suggestion_id, suggestion_1.suggestion_id)
        self.assertEqual(
            suggestions[1].suggestion_id, suggestion_2.suggestion_id)
        self.assertEqual(
            suggestions[2].suggestion_id, suggestion_3.suggestion_id)
        for i in range(len(suggestions) - 1):
            self.assertLessEqual(
                suggestions[i].last_updated, suggestions[i + 1].last_updated)

    def test_query_suggestions_that_can_be_reviewed_by_user(self) -> None:
        # User proficiency models for user1.
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category1', 15)
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category2', 15)
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category3', 5)
        # User proficiency models for user2.
        user_models.UserContributionProficiencyModel.create(
            'user2', 'category1', 5)
        user_models.UserContributionProficiencyModel.create(
            'user2', 'category2', 5)
        user_models.UserContributionProficiencyModel.create(
            'user2', 'category3', 5)

        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', 1, suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category1',
            'exploration.exp1.thread_1', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category2',
            'exploration.exp1.thread_2', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category3',
            'exploration.exp1.thread_3', None)
        # This suggestion does not count as a suggestion that can be reviewed
        # by a user because it has already been rejected.
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_REJECTED, 'author_3',
            'reviewer_2', self.change_cmd, 'category1',
            'exploration.exp1.thread_4', None)
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change_cmd, 'category2',
            'exploration.exp1.thread_5', None)

        self.assertEqual(len(
            suggestion_services
            .get_all_suggestions_that_can_be_reviewed_by_user('user1')), 3)
        self.assertEqual(len(
            suggestion_services
            .get_all_suggestions_that_can_be_reviewed_by_user('user2')), 0)


class SuggestionIntegrationTests(test_utils.GenericTestBase):

    EXP_ID: Final = 'exp1'
    TOPIC_ID: Final = 'topic1'
    STORY_ID: Final = 'story1'
    TRANSLATION_LANGUAGE_CODE: Final = 'en'

    AUTHOR_EMAIL: Final = 'author@example.com'

    score_category: str = ('%s%s%s' % (
        suggestion_models.SCORE_TYPE_CONTENT,
        suggestion_models.SCORE_CATEGORY_DELIMITER, 'Algebra')
    )

    THREAD_ID: Final = 'exploration.exp1.thread_1'

    COMMIT_MESSAGE: Final = 'commit message'

    def mock_generate_new_thread_id(
        self, unused_entity_type: str, unused_entity_id: str
    ) -> str:
        return self.THREAD_ID

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.reviewer_id = self.editor_id

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.editor = user_services.get_user_actions_info(self.editor_id)

        # Login and create exploration and suggestions.
        self.login(self.EDITOR_EMAIL)

        # Create exploration.
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                self.EXP_ID, self.editor_id,
                ['State 1', 'State 2', 'End State'],
                ['TextInput'], category='Algebra'))

        self.old_content = state_domain.SubtitledHtml(
            'content_0', '<p>old content</p>').to_dict()
        recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
            'voiceovers_mapping': {
                'content_0': {
                    self.TRANSLATION_LANGUAGE_CODE: {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 42.43
                    }
                },
                'default_outcome_1': {},
                'ca_placeholder_6': {}
            }
        }
        self.old_recorded_voiceovers = (
            state_domain.RecordedVoiceovers.from_dict(recorded_voiceovers_dict))
        # Create content in State A with a single audio subtitle.
        content_change = exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'State 1',
            'new_value': self.old_content,
        })
        recorded_voiceovers_change = exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS,
            'state_name': 'State 1',
            'new_value': recorded_voiceovers_dict,
        })
        exp_services.update_exploration(
            self.editor_id, exploration.id,
            [content_change, recorded_voiceovers_change], '')

        rights_manager.publish_exploration(self.editor, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.editor, self.EXP_ID, self.owner_id,
            rights_domain.ROLE_EDITOR)

        self.new_content = state_domain.SubtitledHtml(
            'content', '<p>new content</p>').to_dict()

        self.change_cmd: Dict[
            str, Union[str, state_domain.SubtitledHtmlDict]
        ] = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'State 1',
            'new_value': self.new_content
        }

        self.target_version_at_submission = exploration.version

        # Set up for testing translation suggestions. Translation suggestions
        # correspond to a given topic, story and exploration.

        self.save_new_topic(self.TOPIC_ID, self.owner_id)

        self.save_new_story(
            self.STORY_ID, self.owner_id, self.TOPIC_ID, title='A story',
            description='Description', notes='Notes')

        # Adds the story to the topic.
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID)

        # Adds the exploration to the story.
        story_change_list_to_add_an_exp = [
            story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': self.EXP_ID
            })
        ]
        story_services.update_story(
            self.owner_id, self.STORY_ID,
            story_change_list_to_add_an_exp, 'Added exploration.')

    def create_translation_suggestion_associated_with_exp(
        self, exp_id: str, author_id: str
    ) -> None:
        """Creates a translation suggestion that is associated with an
        exploration with id exp_id. The author of the created suggestion is
        author_id.
        """
        # Gets the html content in the exploration to be translated.
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        content_html = exploration.states['State 1'].content.html
        content_id = exploration.states['State 1'].content.content_id

        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'State 1',
            'content_id': content_id,
            'language_code': 'hi',
            'content_html': content_html,
            'translation_html': '<p>This is translated html.</p>',
            'data_format': 'html'
        }

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id, 1, author_id, add_translation_change_dict,
            'test description')

    def assert_created_suggestion_is_valid(
        self, target_id: str, author_id: str
    ) -> None:
        """Assert that the created suggestion is in review and that only one
        suggestion with the given target_id and author_id exists.
        """
        suggestions = suggestion_services.query_suggestions(
            [('author_id', author_id), ('target_id', target_id)])
        self.assertEqual(len(suggestions), 1)
        self.assertEqual(
            suggestions[0].status, suggestion_models.STATUS_IN_REVIEW)

    def test_create_and_accept_suggestion(self) -> None:
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change_cmd, 'test description')

        suggestion_id = self.THREAD_ID

        suggestion_services.accept_suggestion(
            suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE, '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)

        self.assertEqual(
            exploration.states['State 1'].content.html,
            '<p>new content</p>')

        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        self.assertEqual(suggestion.status, suggestion_models.STATUS_ACCEPTED)

    def test_create_translation_contribution_stats_from_model(self) -> None:
        suggestion_models.TranslationContributionStatsModel.create(
            language_code='es',
            contributor_user_id='user_id',
            topic_id='topic_id',
            submitted_translations_count=2,
            submitted_translation_word_count=100,
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=50,
            rejected_translations_count=0,
            rejected_translation_word_count=0,
            contribution_dates=[
                datetime.date.fromtimestamp(1616173836),
                datetime.date.fromtimestamp(1616173837)
            ]
        )
        translation_suggestion = suggestion_services.get_all_translation_contribution_stats( # pylint: disable=line-too-long
            'user_id')
        self.assertEqual(len(translation_suggestion), 1)
        self.assertEqual(translation_suggestion[0].language_code, 'es')
        self.assertEqual(
            translation_suggestion[0].contributor_user_id,
            'user_id'
        )

    def test_fetch_all_contribution_stats(self) -> None:
        suggestion_models.TranslationContributionStatsModel.create(
            language_code='es',
            contributor_user_id='user_id',
            topic_id='topic_id',
            submitted_translations_count=2,
            submitted_translation_word_count=100,
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=50,
            rejected_translations_count=0,
            rejected_translation_word_count=0,
            contribution_dates=[
                datetime.date.fromtimestamp(1616173836),
                datetime.date.fromtimestamp(1616173837)
            ]
        )
        suggestion_models.TranslationReviewStatsModel.create(
            language_code='es',
            reviewer_user_id='user_id',
            topic_id='topic_id',
            reviewed_translations_count=1,
            reviewed_translation_word_count=1,
            accepted_translations_count=1,
            accepted_translations_with_reviewer_edits_count=0,
            accepted_translation_word_count=1,
            first_contribution_date=datetime.date.fromtimestamp(1616173836),
            last_contribution_date=datetime.date.fromtimestamp(1616173836)
        )
        suggestion_models.QuestionContributionStatsModel.create(
            contributor_user_id='user_id',
            topic_id='topic_id',
            submitted_questions_count=1,
            accepted_questions_count=1,
            accepted_questions_without_reviewer_edits_count=0,
            first_contribution_date=datetime.date.fromtimestamp(1616173836),
            last_contribution_date=datetime.date.fromtimestamp(1616173836)
        )
        suggestion_models.QuestionReviewStatsModel.create(
            reviewer_user_id='user_id',
            topic_id='topic_id',
            reviewed_questions_count=1,
            accepted_questions_count=1,
            accepted_questions_with_reviewer_edits_count=1,
            first_contribution_date=datetime.date.fromtimestamp(1616173836),
            last_contribution_date=datetime.date.fromtimestamp(1616173836)
        )

        stats = suggestion_services.get_all_contributor_stats( # pylint: disable=line-too-long
            'user_id')

        self.assertEqual(stats.contributor_user_id, 'user_id')
        self.assertEqual(len(stats.translation_contribution_stats), 1)
        self.assertEqual(
            stats.translation_contribution_stats[0].language_code, 'es')
        self.assertEqual(len(stats.question_contribution_stats), 1)
        self.assertEqual(
            stats.question_contribution_stats[0].contributor_user_id, 'user_id')
        self.assertEqual(len(stats.translation_review_stats), 1)
        self.assertEqual(
            stats.translation_review_stats[0].contributor_user_id, 'user_id')
        self.assertEqual(len(stats.question_review_stats), 1)
        self.assertEqual(
            stats.question_review_stats[0].contributor_user_id, 'user_id')

    def _publish_valid_topic(
        self, topic: topic_domain.Topic,
        uncategorized_skill_ids: List[str]) -> None:
        """Saves and publishes a valid topic with linked skills and subtopic.

        Args:
            topic: Topic. The topic to be saved and published.
            uncategorized_skill_ids: list(str). List of uncategorized skills IDs
                to add to the supplied topic.
        """
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        subtopic_id = 1
        subtopic_skill_id = 'subtopic_skill_id' + topic.id
        topic.subtopics = [
            topic_domain.Subtopic(
                subtopic_id, 'Title', [subtopic_skill_id], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = [subtopic_skill_id]
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                subtopic_id, topic.id))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample',
                'url_fragment': 'sample-fragment'
            })]
        )
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(topic.id, self.admin_id)

        for skill_id in uncategorized_skill_ids:
            self.save_new_skill(
                skill_id, self.admin_id, description='skill_description')
            topic_services.add_uncategorized_skill(
                self.admin_id, topic.id, skill_id)

    def _set_up_topics_and_stories_for_translations(self) -> Mapping[
        str, change_domain.AcceptableChangeDictTypes]:
        """Sets up required topics and stories for translations. It does the
        following.
        1. Create 2 explorations and publish them.
        2. Create a default topic.
        3. Publish the topic with two story IDs.
        4. Create 2 stories for translation opportunities.

        Returns:
            Mapping[str, change_domain.AcceptableChangeDictTypes]. A dictionary
            of the change_cmd object for the translations.
        """
        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            category=constants.ALL_CATEGORIES[i],
            end_state_name='End State'
        ) for i in range(3)]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)
            exp_services.update_exploration(
                self.owner_id, exp.id, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'Introduction',
                    'new_value': {
                        'content_id': 'content_0',
                        'html': '<p>A content to translate.</p>'
                    }
                })], 'Changes content.')

        topic_id = '0'
        topic = topic_domain.Topic.create_default_topic(
            topic_id, 'topic_name', 'abbrev', 'description', 'fragm')
        skill_id_0 = 'skill_id_0'
        skill_id_1 = 'skill_id_1'
        self._publish_valid_topic(topic, [skill_id_0, skill_id_1])

        self.create_story_for_translation_opportunity(
            self.owner_id, self.admin_id, 'story_id_01', topic_id, '0')
        self.create_story_for_translation_opportunity(
            self.owner_id, self.admin_id, 'story_id_02', topic_id, '1')

        return {
            'cmd': 'add_written_translation',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>A content to translate.</p>',
            'state_name': 'Introduction',
            'translation_html': '<p>Translation for content.</p>',
            'data_format': 'html'
        }

    def _set_up_topics_and_100_stories_for_translations(self) -> Mapping[
        str, change_domain.AcceptableChangeDictTypes]:
        """Sets up required topics and stories for translations. It does the
        following.
        1. Create 2 explorations and publish them.
        2. Create a default topic.
        3. Publish the topic with two story IDs.
        4. Create 100 stories for translation opportunities.

        Returns:
            Mapping[str, change_domain.AcceptableChangeDictTypes]. A dictionary
            of the change_cmd object for the translations.
        """
        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            category='Algebra',
            end_state_name='End State'
        ) for i in range(103)]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)
            exp_services.update_exploration(
                self.owner_id, exp.id, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'Introduction',
                    'new_value': {
                        'content_id': 'content_0',
                        'html': '<p>A content to translate.</p>'
                    }
                })], 'Changes content.')

        topic_id = '0'
        topic = topic_domain.Topic.create_default_topic(
            topic_id, 'topic_name', 'abbrev', 'description', 'fragm')
        skill_id_0 = 'skill_id_0'
        skill_id_1 = 'skill_id_1'
        self._publish_valid_topic(topic, [skill_id_0, skill_id_1])

        for i in range(103):
            self.create_story_for_translation_opportunity(
                self.owner_id, self.admin_id, ('story_id_%s' % (i)), topic_id,
                '%s' % i)

        return {
            'cmd': 'add_written_translation',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>A content to translate.</p>',
            'state_name': 'Introduction',
            'translation_html': '<p>Translation for content.</p>',
            'data_format': 'html'
        }

    def _set_up_a_topic_and_stories_for_translations(self) -> Mapping[
        str, change_domain.AcceptableChangeDictTypes]:
        """Sets up required topics and stories for translations. It does the
        following.
        1. Create 2 explorations and publish them.
        2. Create a topic with topic_id A.
        3. Publish the topic with one story ID.
        4. Create 1 story for translation opportunities.

        Returns:
            Mapping[str, change_domain.AcceptableChangeDictTypes]. A dictionary
            of the change_cmd object for the translations.
        """
        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            category=constants.ALL_CATEGORIES[i],
            end_state_name='End State'
        ) for i in range(2, 4)]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)
            exp_services.update_exploration(
                self.owner_id, exp.id, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'Introduction',
                    'new_value': {
                        'content_id': 'content_0',
                        'html': '<p>A content to translate.</p>'
                    }
                })], 'Changes content.')

        topic_id = 'A'
        topic = topic_domain.Topic.create_default_topic(
            topic_id, 'topic_name_a', 'abbrev-a', 'description', 'fragm-a')
        skill_id_2 = 'skill_id_2'
        skill_id_3 = 'skill_id_3'
        self._publish_valid_topic(topic, [skill_id_2, skill_id_3])

        self.create_story_for_translation_opportunity(
            self.owner_id, self.admin_id, 'story_id_03', topic_id, '2')

        return {
            'cmd': 'add_written_translation',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>A content to translate.</p>',
            'state_name': 'Introduction',
            'translation_html': '<p>Translation for content.</p>',
            'data_format': 'html'
        }

    def _get_change_with_normalized_string(self) -> Mapping[
        str, change_domain.AcceptableChangeDictTypes]:
        """Provides change_cmd dictionary with normalized translation html.

        Returns:
            Mapping[str, change_domain.AcceptableChangeDictTypes]. A dictionary
            of the change_cmd object for the translations.
        """
        return {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>A content to translate.</p>',
            'state_name': 'Introduction',
            'translation_html': ['translated text1', 'translated text2'],
            'data_format': 'set_of_normalized_string'
        }

    def test_get_translation_contribution_stats_for_invalid_id_with_strict_true(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'The stats models do not exist for the stats_id invalid_id.'):
            suggestion_services.get_translation_contribution_stats_models(
                ['invalid_id'])

    def test_get_translation_contribution_stats_for_strict_false(
        self
    ) -> None:
        stats_models = (
            suggestion_services
            .get_translation_contribution_stats_models
        )(
            ['invalid_id'], strict=False)

        self.assertEqual(stats_models, [None])

    def test_get_translation_review_stats_for_strict_false(
        self
    ) -> None:
        stats_models = (
            suggestion_services
            .get_translation_review_stats_models
        )(
            ['invalid_id'], strict=False)

        self.assertEqual(stats_models, [None])

    def test_get_question_contribution_stats_for_strict_false(
        self
    ) -> None:
        stats_models = (
            suggestion_services.get_question_contribution_stats_models
        )(
            ['invalid_id'], strict=False)

        self.assertEqual(stats_models, [None])

    def test_get_question_review_stats_for_strict_false(
        self
    ) -> None:
        stats_models = suggestion_services.get_question_review_stats_models(
            ['invalid_id'], strict=False)

        self.assertEqual(stats_models, [None])

    def test_get_translation_review_stats_for_invalid_id_with_strict_true(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'The stats models do not exist for the stats_id invalid_id.'):
            suggestion_services.get_translation_review_stats_models(
                ['invalid_id'])

    def test_get_question_contribution_stats_for_invalid_id_with_strict_true(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'The stats models do not exist for the stats_id invalid_id.'):
            suggestion_services.get_question_contribution_stats_models(
                ['invalid_id'])

    def test_get_question_review_stats_for_invalid_id_with_strict_true(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'The stats models do not exist for the stats_id invalid_id.'):
            suggestion_services.get_question_review_stats_models(
                ['invalid_id'])

    def test_update_translation_contribution_stats_when_submitting(
        self) -> None:
        # Steps required in the setup phase before testing.
        # 1. Create and publish explorations.
        # 2. Create and publish topics.
        # 3. Create stories for translation opportunities.
        # 4. Save translation suggestions.
        change_dict = self._set_up_topics_and_stories_for_translations()
        initial_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '0', 1, self.author_id, change_dict, 'description')
        new_change_dict = self._get_change_with_normalized_string()
        latest_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '1', 1, self.author_id, new_change_dict, 'description')

        change_dict_for_a_topic = (
            self._set_up_a_topic_and_stories_for_translations())
        topic_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '2', 1, self.author_id, change_dict_for_a_topic, 'description')

        suggestion_services.update_translation_contribution_stats_at_submission(
            initial_suggestion
        )
        suggestion_services.update_translation_contribution_stats_at_submission(
            latest_suggestion
        )

        translation_contribution_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                'hi', self.author_id, '0'
            )
        )
        # Assert translation contribution stats.
        # At this point we can confirm that there should be an associated
        # translation contribution stat object for the given IDs since we have
        # called update_translation_contribution_stats_at_submission function
        # to create/update translation contribution stats.
        assert translation_contribution_stats_model is not None
        self.assertEqual(
            translation_contribution_stats_model.submitted_translations_count,
            2
        )
        self.assertEqual(
            (
                translation_contribution_stats_model
                .submitted_translation_word_count
            ),
            7
        )
        self.assertEqual(
            translation_contribution_stats_model.accepted_translations_count,
            0
        )

        translation_submitter_total_stats_model = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get(
                'hi', self.author_id
            )
        )
        assert translation_submitter_total_stats_model is not None
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .submitted_translations_count
            ),
            2
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .submitted_translation_word_count
            ),
            7
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .accepted_translations_count
            ),
            0
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .topic_ids_with_translation_submissions
            ),
            ['0']
        )

        suggestion_services.update_translation_contribution_stats_at_submission(
            topic_suggestion
        )
        updated_translation_submitter_total_stats_model = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get(
                'hi', self.author_id
            )
        )
        assert updated_translation_submitter_total_stats_model is not None
        self.assertItemsEqual(
            (
                updated_translation_submitter_total_stats_model
                .topic_ids_with_translation_submissions
            ),
            ['0', 'A']
        )

    def test_update_translation_review_stats_when_suggestion_is_accepted(
        self) -> None:
        # This test case will check stats of the reviewer and the submitter
        # when a translation suggestion is accepted.
        # Steps required in the setup phase before testing.
        # 1. Create and publish explorations.
        # 2. Create and publish topics.
        # 3. Create stories for translation opportunities.
        # 4. Save translation suggestions.
        change_dict = self._set_up_topics_and_stories_for_translations()
        initial_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '0', 1, self.author_id, change_dict, 'description')
        new_change_dict = self._get_change_with_normalized_string()
        latest_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '1', 1, self.author_id, new_change_dict, 'description')
        change_dict_for_a_topic = (
            self._set_up_a_topic_and_stories_for_translations())
        topic_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '2', 1, self.author_id, change_dict_for_a_topic, 'description')

        suggestion_services.update_translation_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                initial_suggestion.suggestion_id)
        )
        suggestion_services.update_translation_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )

        suggestion_services.accept_suggestion(
            initial_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted')
        suggestion_services.accept_suggestion(
            latest_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted')

        suggestion_services.update_translation_review_stats(
            suggestion_services.get_suggestion_by_id(
                initial_suggestion.suggestion_id)
        )
        suggestion_services.update_translation_review_stats(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )

        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                'hi', self.reviewer_id, '0'
            )
        )
        translation_contribution_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                'hi', self.author_id, '0'
            )
        )
        # Assert translation review stats after the review.
        # At this point we can confirm that there should be an associated
        # translation review stat object for the given IDs since we have
        # called update_translation_review_stats function to create/update
        # translation review stats.
        assert translation_review_stats_model is not None
        self.assertEqual(
            translation_review_stats_model.accepted_translations_count,
            2
        )
        self.assertEqual(
            (
                translation_review_stats_model
                .reviewed_translation_word_count
            ),
            7
        )
        assert translation_contribution_stats_model is not None
        self.assertEqual(
            (
                translation_contribution_stats_model
                .accepted_translation_word_count
            ),
            7
        )
        self.assertEqual(
            translation_contribution_stats_model.accepted_translations_count,
            2
        )

        translation_reviewer_total_stats_model = (
            suggestion_models.TranslationReviewerTotalContributionStatsModel
            .get(
                'hi', self.reviewer_id
            )
        )
        translation_submitter_total_stats_model = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get(
                'hi', self.author_id
            )
        )
        # Assert translation review stats after the review.
        # At this point we can confirm that there should be an associated
        # translation review stat object for the given IDs since we have
        # called update_translation_review_stats function to create/update
        # translation review stats.
        assert translation_reviewer_total_stats_model is not None
        self.assertEqual(
            translation_reviewer_total_stats_model.accepted_translations_count,
            2
        )
        self.assertEqual(
            (
                translation_reviewer_total_stats_model
                .reviewed_translations_count
            ),
            2
        )
        assert translation_submitter_total_stats_model is not None
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .accepted_translation_word_count
            ),
            7
        )
        self.assertEqual(
            translation_submitter_total_stats_model.accepted_translations_count,
            2
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .recent_review_outcomes
            ),
            ['accepted', 'accepted']
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .recent_performance
            ),
            2
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .overall_accuracy
            ),
            100.0
        )

        suggestion_services.accept_suggestion(
            topic_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted')
        suggestion_services.update_translation_review_stats(
            suggestion_services.get_suggestion_by_id(
                topic_suggestion.suggestion_id)
        )
        translation_reviewer_total_stats_model_for_a_topic = (
            suggestion_models.TranslationReviewerTotalContributionStatsModel
            .get(
                'hi', self.reviewer_id
            )
        )
        translation_submitter_total_stats_model_for_a_topic = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get(
                'hi', self.author_id
            )
        )
        assert translation_reviewer_total_stats_model_for_a_topic is not None
        assert translation_submitter_total_stats_model_for_a_topic is not None
        self.assertItemsEqual(
            translation_reviewer_total_stats_model_for_a_topic.
            topic_ids_with_translation_reviews,
            ['0', 'A']
        )

        self.assertItemsEqual(
            translation_submitter_total_stats_model_for_a_topic.
            topic_ids_with_translation_submissions,
            ['0', 'A']
        )

    def test_update_translation_review_stats_when_suggestion_is_rejected(
        self) -> None:
        # This test case will check stats of the reviewer and the submitter
        # when a translation suggestion is rejected.
        # Steps required in the setup phase before testing.
        # 1. Create and publish explorations.
        # 2. Create and publish topics.
        # 3. Create stories for translation opportunities.
        # 4. Save translation suggestions.
        change_dict = self._set_up_topics_and_stories_for_translations()
        initial_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '0', 1, self.author_id, change_dict, 'description')
        latest_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '1', 1, self.author_id, change_dict, 'description')
        suggestion_services.reject_suggestion(
            initial_suggestion.suggestion_id, self.reviewer_id, 'Rejected')
        suggestion_services.reject_suggestion(
            latest_suggestion.suggestion_id, self.reviewer_id, 'Rejected')

        suggestion_services.update_translation_review_stats(
            suggestion_services.get_suggestion_by_id(
                initial_suggestion.suggestion_id)
        )
        suggestion_services.update_translation_review_stats(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )

        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                'hi', self.reviewer_id, '0'
            )
        )
        translation_contribution_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                'hi', self.author_id, '0'
            )
        )
        # Assert translation review stats after the review.
        # At this point we can confirm that there should be an associated
        # translation review stat object for the given IDs since we have
        # called update_translation_review_stats function to create/update
        # translation review stats.
        assert translation_review_stats_model is not None
        self.assertEqual(
            translation_review_stats_model.reviewed_translations_count,
            2
        )
        self.assertEqual(
            translation_review_stats_model.accepted_translations_count,
            0
        )
        self.assertEqual(
            translation_review_stats_model.accepted_translation_word_count,
            0
        )
        self.assertEqual(
            (
                translation_review_stats_model
                .reviewed_translation_word_count
            ),
            6
        )
        assert translation_contribution_stats_model is not None
        self.assertEqual(
            translation_contribution_stats_model.rejected_translations_count,
            2
        )
        self.assertEqual(
            (
                translation_contribution_stats_model
                .rejected_translations_count
            ),
            2
        )
        self.assertEqual(
            translation_contribution_stats_model.accepted_translations_count,
            0
        )

        translation_reviewer_total_stats_model = (
            suggestion_models.TranslationReviewerTotalContributionStatsModel
            .get(
                'hi', self.reviewer_id
            )
        )
        translation_submitter_total_stats_model = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get(
                'hi', self.author_id
            )
        )

        # Assert translation review stats after the review.
        # At this point we can confirm that there should be an associated
        # translation review stat object for the given IDs since we have
        # called update_translation_review_stats function to create/update
        # translation review stats.
        assert translation_reviewer_total_stats_model is not None
        self.assertEqual(
            translation_reviewer_total_stats_model.reviewed_translations_count,
            2
        )
        self.assertEqual(
            translation_reviewer_total_stats_model.accepted_translations_count,
            0
        )
        self.assertEqual(
            (
                translation_reviewer_total_stats_model
                .accepted_translation_word_count
            ),
            0
        )
        assert translation_submitter_total_stats_model is not None
        self.assertEqual(
            translation_submitter_total_stats_model.rejected_translations_count,
            2
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .rejected_translations_count
            ),
            2
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .accepted_translations_count
            ),
            0
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .recent_review_outcomes
            ),
            ['rejected', 'rejected']
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .recent_performance
            ),
            -4
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .overall_accuracy
            ),
            0.0
        )

    def test_update_translation_review_stats_without_a_reviewer_id(
        self) -> None:
        change_dict = self._set_up_topics_and_stories_for_translations()
        translation_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '0', 1, self.author_id, change_dict, 'description')

        with self.assertRaisesRegex(
            Exception,
            'The final_reviewer_id in the suggestion should not be None.'):
            suggestion_services.update_translation_review_stats(
                translation_suggestion)

    def test_update_question_review_stats_without_a_reviewer_id(
        self) -> None:
        skill_id_1 = self._create_skill()
        skill_id_2 = self._create_skill()
        self._create_topic(skill_id_1, skill_id_2)
        initial_suggestion = self._create_question_suggestion(skill_id_1)
        suggestion_services.update_question_contribution_stats_at_submission(
            initial_suggestion
        )

        with self.assertRaisesRegex(
            Exception,
            'The final_reviewer_id in the suggestion should not be None.'):
            suggestion_services.update_question_review_stats(
                initial_suggestion
            )

    def test_update_translation_review_stats_when_suggestion_is_edited(
        self) -> None:
        # This test case will check stats of the reviewer and the submitter
        # when a translation suggestion is accepted with reviewer edits.
        # Steps required in the setup phase before testing.
        # 1. Create and publish explorations.
        # 2. Create and publish topics.
        # 3. Create stories for translation opportunities.
        # 4. Save translation suggestions.
        change_dict = self._set_up_topics_and_stories_for_translations()
        initial_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '0', 1, self.author_id, change_dict, 'description')
        latest_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '1', 1, self.author_id, change_dict, 'description')
        # Contributor's stats are updated manually since contributor's stats are
        # checked later.
        suggestion_services.update_translation_contribution_stats_at_submission(
            initial_suggestion
        )
        suggestion_services.update_translation_contribution_stats_at_submission(
            latest_suggestion
        )
        suggestion_services.update_translation_suggestion(
            initial_suggestion.suggestion_id, 'Edited')
        suggestion_services.update_translation_suggestion(
            latest_suggestion.suggestion_id, 'Edited')
        suggestion_services.accept_suggestion(
            initial_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted')
        suggestion_services.accept_suggestion(
            latest_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted')

        suggestion_services.update_translation_review_stats(
            suggestion_services.get_suggestion_by_id(
                initial_suggestion.suggestion_id)
        )
        suggestion_services.update_translation_review_stats(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )

        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                'hi', self.reviewer_id, '0'
            )
        )
        translation_contribution_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                'hi', self.author_id, '0'
            )
        )
        # Assert translation review stats after the review.
        # At this point we can confirm that there should be an associated
        # translation review stat object for the given IDs since we have
        # called update_translation_review_stats function to create/update
        # translation review stats.
        assert translation_review_stats_model is not None
        self.assertEqual(
            translation_review_stats_model.accepted_translations_count,
            2
        )
        self.assertEqual(
            translation_review_stats_model.accepted_translation_word_count,
            2
        )
        self.assertEqual(
            (
                translation_review_stats_model
                .reviewed_translation_word_count
            ),
            2
        )
        self.assertEqual(
            translation_review_stats_model
            .accepted_translations_with_reviewer_edits_count,
            2
        )
        assert translation_contribution_stats_model is not None
        self.assertEqual(
            translation_contribution_stats_model.submitted_translations_count,
            2
        )
        self.assertEqual(
            (
                translation_contribution_stats_model
                .submitted_translation_word_count
            ),
            6
        )
        self.assertEqual(
            translation_contribution_stats_model.accepted_translations_count,
            2
        )
        self.assertEqual(
            (
                translation_contribution_stats_model
                .accepted_translations_without_reviewer_edits_count
            ),
            0
        )

        translation_reviewer_total_stats_model = (
            suggestion_models.TranslationReviewerTotalContributionStatsModel
            .get(
                'hi', self.reviewer_id
            )
        )
        translation_submitter_total_stats_model = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get(
                'hi', self.author_id
            )
        )
        # Assert translation review stats after the review.
        # At this point we can confirm that there should be an associated
        # translation review stat object for the given IDs since we have
        # called update_translation_review_stats function to create/update
        # translation review stats.
        assert translation_reviewer_total_stats_model is not None
        self.assertEqual(
            translation_reviewer_total_stats_model.accepted_translations_count,
            2
        )
        self.assertEqual(
            (
                translation_reviewer_total_stats_model
                .accepted_translation_word_count
            ),
            2
        )
        self.assertEqual(
            translation_reviewer_total_stats_model
            .accepted_translations_with_reviewer_edits_count,
            2
        )
        assert translation_submitter_total_stats_model is not None
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .submitted_translations_count
            ),
            2
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .submitted_translation_word_count
            ),
            6
        )
        self.assertEqual(
            translation_submitter_total_stats_model.recent_performance,
            2
        )
        self.assertEqual(
            translation_submitter_total_stats_model.overall_accuracy,
            100.0
        )
        self.assertEqual(
            translation_submitter_total_stats_model.accepted_translations_count,
            2
        )
        self.assertEqual(
            (
                translation_submitter_total_stats_model
                .accepted_translations_without_reviewer_edits_count
            ),
            0
        )

    def test_increment_translation_stats_for_than_100_suggestions_accepted(
        self) -> None:

        change_dict = self._set_up_topics_and_100_stories_for_translations()
        initial_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '0', 0, self.author_id, change_dict, 'description')
        suggestion_services.update_translation_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                initial_suggestion.suggestion_id)
        )
        for i in range(1, 102):
            common_change_dict = self._get_change_with_normalized_string()
            suggestion = suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                ('%s' % (i)), i, self.author_id, common_change_dict,
                'description')
            suggestion_services.update_translation_contribution_stats_at_submission( # pylint: disable=line-too-long
                suggestion_services.get_suggestion_by_id(
                    suggestion.suggestion_id))
            suggestion_services.accept_suggestion(
                suggestion.suggestion_id, self.reviewer_id, 'Accepted',
                'Accepted')
            suggestion_services.update_translation_review_stats(
                suggestion_services.get_suggestion_by_id(
                    suggestion.suggestion_id)
            )

        updated_translation_submitter_total_stats_model = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get(
                'hi', self.author_id
            )
        )
        assert updated_translation_submitter_total_stats_model is not None
        self.assertEqual(
            len(
                updated_translation_submitter_total_stats_model
                .recent_review_outcomes),
            100
        )

        new_change_dict = self._get_change_with_normalized_string()
        latest_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '102', 102, self.author_id, new_change_dict, 'description')
        suggestion_services.update_translation_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )
        suggestion_services.reject_suggestion(
            latest_suggestion.suggestion_id, self.reviewer_id, 'Rejected'
        )

        suggestion_services.update_translation_review_stats(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )

        rejected_translation_submitter_total_stats_model = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get(
                'hi', self.author_id
            )
        )
        assert rejected_translation_submitter_total_stats_model is not None

        self.assertEqual(
            len(
                rejected_translation_submitter_total_stats_model
                .recent_review_outcomes),
            100
        )

        self.assertEqual(
            rejected_translation_submitter_total_stats_model
            .recent_review_outcomes[99],
            suggestion_models.REVIEW_OUTCOME_REJECTED
        )

    def test_increment_translation_stats_for_than_100_suggestions_rejected(
        self) -> None:

        change_dict = self._set_up_topics_and_100_stories_for_translations()
        initial_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '0', 0, self.author_id, change_dict, 'description')
        suggestion_services.update_translation_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                initial_suggestion.suggestion_id)
        )
        for i in range(1, 102):
            common_change_dict = self._get_change_with_normalized_string()
            suggestion = suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                ('%s' % (i)), i, self.author_id, common_change_dict,
                'description')
            suggestion_services.update_translation_contribution_stats_at_submission( # pylint: disable=line-too-long
                suggestion_services.get_suggestion_by_id(
                    suggestion.suggestion_id))
            suggestion_services.reject_suggestion(
                suggestion.suggestion_id, self.reviewer_id, 'Rejected')
            suggestion_services.update_translation_review_stats(
                suggestion_services.get_suggestion_by_id(
                    suggestion.suggestion_id)
            )

        updated_translation_submitter_total_stats_model = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get(
                'hi', self.author_id
            )
        )
        assert updated_translation_submitter_total_stats_model is not None
        self.assertEqual(
            len(
                updated_translation_submitter_total_stats_model
                .recent_review_outcomes),
            100
        )

        new_change_dict = self._get_change_with_normalized_string()
        latest_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '102', 102, self.author_id, new_change_dict, 'description')
        suggestion_services.update_translation_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )
        suggestion_services.accept_suggestion(
            latest_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted'
        )

        suggestion_services.update_translation_review_stats(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )

        accepted_translation_submitter_total_stats_model = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get(
                'hi', self.author_id
            )
        )
        assert accepted_translation_submitter_total_stats_model is not None
        self.assertEqual(
            len(
                accepted_translation_submitter_total_stats_model
                .recent_review_outcomes),
            100
        )

        self.assertEqual(
            accepted_translation_submitter_total_stats_model
            .recent_review_outcomes[99],
            suggestion_models.REVIEW_OUTCOME_ACCEPTED
        )

    def _create_question_suggestion(
        self,
        skill_id: str
    ) -> suggestion_registry.SuggestionAddQuestion:
        """Creates a question suggestion corresponding to the supplied skill.

        Args:
            skill_id: str. ID of the skill.

        Returns:
            SuggestionAddQuestion. A new question suggestion.
        """
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str,
            Union[str, float, Dict[str, Union[
                str, List[str], int, state_domain.StateDict]]]] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_2'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index
                ),
                'inapplicable_skill_misconception_ids': ['skillid12345-1']
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            self.author_id, suggestion_change, 'test description')

    def _create_skill(self) -> str:
        """Creates a skill for a question.

        Returns:
            str. A skill ID.
        """
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        return skill_id

    def _create_topic(self, first_skill_id: str, second_skill_id: str) -> str:
        """Creates a topic for a question.

        Args:
            first_skill_id: str. ID of the first skill.
            second_skill_id: str. ID of the second skill.

        Returns:
            str. A topic ID.
        """
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, 'topic_admin', name='Topic1',
            abbreviated_name='topic-three', url_fragment='topic-three',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[first_skill_id, second_skill_id],
            subtopics=[], next_subtopic_id=1)
        return topic_id

    def test_update_question_contribution_stats_when_submitting(self) -> None:
        # Steps required in the setup phase before testing.
        # 1. Save new skills.
        # 2. Save a topic assigning skills for it.
        # 3. Create a question suggestion.
        skill_id_1 = self._create_skill()
        skill_id_2 = self._create_skill()
        skill_id_3 = self._create_skill()
        skill_id_4 = self._create_skill()
        topic_id = self._create_topic(skill_id_1, skill_id_2)
        topic_id_2 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id_2, 'topic_admin', name='Topic2',
            abbreviated_name='topic-three-1', url_fragment='topic-three-a',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[skill_id_3, skill_id_4],
            subtopics=[], next_subtopic_id=1)
        initial_suggestion = self._create_question_suggestion(skill_id_1)
        latest_suggestion = self._create_question_suggestion(skill_id_2)
        topic_id_2_suggestion = self._create_question_suggestion(skill_id_3)

        # Action to update question contribution stats.
        suggestion_services.update_question_contribution_stats_at_submission(
            initial_suggestion
        )
        suggestion_services.update_question_contribution_stats_at_submission(
            latest_suggestion
        )

        question_contribution_stats_model = (
            suggestion_models.QuestionContributionStatsModel.get(
                self.author_id, topic_id
            )
        )
        # Assert question contribution stats before the review.
        # At this point we can confirm that there should be an associated
        # question contribution stat object for the given IDs since we have
        # called update_question_contribution_stats_at_submission function to
        # create/update question contribution stats.
        assert question_contribution_stats_model is not None
        self.assertEqual(
            question_contribution_stats_model.submitted_questions_count,
            2
        )
        self.assertEqual(
            question_contribution_stats_model.accepted_questions_count,
            0
        )

        question_submitter_total_stats_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(
                self.author_id
            )
        )
        # Assert question contribution stats before the review.
        # At this point we can confirm that there should be an associated
        # question contribution stat object for the given IDs since we have
        # called update_question_contribution_stats_at_submission function to
        # create/update question contribution stats.
        assert question_submitter_total_stats_model is not None
        self.assertEqual(
            question_submitter_total_stats_model.submitted_questions_count,
            2
        )
        self.assertEqual(
            question_submitter_total_stats_model.accepted_questions_count,
            0
        )
        self.assertEqual(
            question_submitter_total_stats_model.recent_review_outcomes,
            []
        )
        self.assertEqual(
            question_submitter_total_stats_model.recent_performance,
            0
        )
        self.assertEqual(
            question_submitter_total_stats_model.overall_accuracy,
            0.0
        )

        suggestion_services.update_question_contribution_stats_at_submission(
            topic_id_2_suggestion
        )
        question_submitter_total_stats_model_with_topic_id_2 = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(
                self.author_id
            )
        )

        self.assertItemsEqual(
            (
                question_submitter_total_stats_model_with_topic_id_2.
                topic_ids_with_question_submissions
            ),
            [topic_id, topic_id_2]
        )

    def test_update_question_stats_when_suggestion_is_accepted(
        self) -> None:
        # This test case will check stats of the reviewer and the submitter
        # when a question suggestion is accepted.
        # Steps required in the setup phase before testing.
        # 1. Save new skills.
        # 2. Save a topic assigning skills for it.
        # 3. Create a question suggestion.
        skill_id_1 = self._create_skill()
        skill_id_2 = self._create_skill()
        skill_id_3 = self._create_skill()
        skill_id_4 = self._create_skill()
        topic_id = self._create_topic(skill_id_1, skill_id_2)
        topic_id_2 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id_2, 'topic_admin', name='Topic2',
            abbreviated_name='topic-three-1', url_fragment='topic-three-a',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[skill_id_3, skill_id_4],
            subtopics=[], next_subtopic_id=1)
        initial_suggestion = self._create_question_suggestion(skill_id_1)
        latest_suggestion = self._create_question_suggestion(skill_id_2)

        suggestion_services.update_question_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                initial_suggestion.suggestion_id
            )
        )
        suggestion_services.update_question_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id
            )
        )

        suggestion_services.accept_suggestion(
            initial_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted')
        suggestion_services.accept_suggestion(
            latest_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted')

        # Action to update stats when reviewing.
        suggestion_services.update_question_review_stats(
            suggestion_services.get_suggestion_by_id(
                initial_suggestion.suggestion_id)
        )
        suggestion_services.update_question_review_stats(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )

        question_review_stats_model = (
            suggestion_models.QuestionReviewStatsModel.get(
                self.reviewer_id, topic_id
            )
        )
        question_contribution_stats_model = (
            suggestion_models.QuestionContributionStatsModel.get(
                self.author_id, topic_id
            )
        )
        # Assert question review stats after the review.
        # At this point we can confirm that there should be an associated
        # question review stat object for the given IDs since we have
        # called update_question_review_stats function to create/update question
        # review stats.
        assert question_review_stats_model is not None
        self.assertEqual(
            question_review_stats_model.accepted_questions_count,
            2
        )
        self.assertEqual(
            (
                question_review_stats_model
                .reviewed_questions_count
            ),
            2
        )
        assert question_contribution_stats_model is not None
        self.assertEqual(
            question_contribution_stats_model.accepted_questions_count,
            2
        )
        self.assertEqual(
            (
                question_contribution_stats_model
                .accepted_questions_without_reviewer_edits_count
            ),
            2
        )

        question_reviewer_total_stats_model = (
            suggestion_models.QuestionReviewerTotalContributionStatsModel
            .get_by_id(
                self.reviewer_id
            )
        )
        question_submitter_total_stats_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(
                self.author_id
            )
        )
        # Assert question review stats after the review.
        # At this point we can confirm that there should be an associated
        # question review stat object for the given IDs since we have
        # called update_question_review_stats function to create/update question
        # review stats.
        assert question_reviewer_total_stats_model is not None
        self.assertEqual(
            question_reviewer_total_stats_model.accepted_questions_count,
            2
        )
        self.assertEqual(
            (
                question_reviewer_total_stats_model
                .reviewed_questions_count
            ),
            2
        )
        assert question_submitter_total_stats_model is not None
        self.assertEqual(
            question_submitter_total_stats_model.submitted_questions_count,
            2
        )
        self.assertEqual(
            question_submitter_total_stats_model.accepted_questions_count,
            2
        )
        self.assertEqual(
            (
                question_submitter_total_stats_model
                .accepted_questions_without_reviewer_edits_count
            ),
            2
        )
        self.assertEqual(
            (
                question_submitter_total_stats_model
                .recent_review_outcomes
            ),
            ['accepted', 'accepted']
        )
        self.assertEqual(
            question_submitter_total_stats_model.recent_performance,
            2
        )
        self.assertEqual(
            question_submitter_total_stats_model.overall_accuracy,
            100.0
        )

        topic_id_2_suggestion = self._create_question_suggestion(skill_id_3)
        suggestion_services.accept_suggestion(
            topic_id_2_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted')
        suggestion_services.update_question_review_stats(
            suggestion_services.get_suggestion_by_id(
                topic_id_2_suggestion.suggestion_id)
        )
        question_reviewer_total_stats_model_with_topic_id_2 = (
            suggestion_models.QuestionReviewerTotalContributionStatsModel
            .get_by_id(
                self.reviewer_id
            )
        )

        self.assertItemsEqual(
            (
                question_reviewer_total_stats_model_with_topic_id_2
                .topic_ids_with_question_reviews
            ),
            [topic_id, topic_id_2]
        )

    def test_update_question_stats_when_suggestion_is_rejected(
        self) -> None:
        # This test case will check stats of the reviewer and the submitter
        # when a question suggestion is rejected.
        # Steps required in the setup phase before testing.
        # 1. Save new skills.
        # 2. Save a topic assigning skills for it.
        # 3. Create a question suggestion.
        skill_id_1 = self._create_skill()
        skill_id_2 = self._create_skill()
        topic_id = self._create_topic(skill_id_1, skill_id_2)
        initial_suggestion = self._create_question_suggestion(skill_id_1)
        latest_suggestion = self._create_question_suggestion(skill_id_2)
        suggestion_services.reject_suggestion(
            initial_suggestion.suggestion_id, self.reviewer_id, 'Rejected')
        suggestion_services.reject_suggestion(
            latest_suggestion.suggestion_id, self.reviewer_id, 'Rejected')

        # Action to update stats when revieweing.
        suggestion_services.update_question_review_stats(
            suggestion_services.get_suggestion_by_id(
                initial_suggestion.suggestion_id)
        )
        suggestion_services.update_question_review_stats(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )

        question_review_stats_model = (
            suggestion_models.QuestionReviewStatsModel.get(
                self.reviewer_id, topic_id
            )
        )
        question_contribution_stats_model = (
            suggestion_models.QuestionContributionStatsModel.get(
                self.author_id, topic_id
            )
        )
        # Assert question review stats after the review.
        # At this point we can confirm that there should be an associated
        # question review stat object for the given IDs since we have
        # called update_question_review_stats function to create/update question
        # review stats.
        assert question_review_stats_model is not None
        self.assertEqual(
            question_review_stats_model.reviewed_questions_count,
            2
        )
        self.assertEqual(
            question_review_stats_model.accepted_questions_count,
            0
        )
        self.assertEqual(
            (
                question_review_stats_model
                .reviewed_questions_count
            ),
            2
        )
        assert question_contribution_stats_model is not None
        self.assertEqual(
            question_contribution_stats_model.accepted_questions_count,
            0
        )
        self.assertEqual(
            (
                question_contribution_stats_model
                .accepted_questions_without_reviewer_edits_count
            ),
            0
        )

        question_reviewer_total_stats_model = (
            suggestion_models.QuestionReviewerTotalContributionStatsModel
            .get_by_id(
                self.reviewer_id
            )
        )
        question_submitter_total_stats_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(
                self.author_id
            )
        )
        # Assert question review stats after the review.
        # At this point we can confirm that there should be an associated
        # question review stat object for the given IDs since we have
        # called update_question_review_stats function to create/update question
        # review stats.
        assert question_reviewer_total_stats_model is not None
        self.assertEqual(
            question_reviewer_total_stats_model.reviewed_questions_count,
            2
        )
        self.assertEqual(
            question_reviewer_total_stats_model.accepted_questions_count,
            0
        )
        self.assertEqual(
            question_reviewer_total_stats_model.rejected_questions_count,
            2
        )
        self.assertEqual(
            (
                question_reviewer_total_stats_model
                .reviewed_questions_count
            ),
            2
        )
        assert question_submitter_total_stats_model is not None
        self.assertEqual(
            question_submitter_total_stats_model.accepted_questions_count,
            0
        )
        self.assertEqual(
            question_submitter_total_stats_model.rejected_questions_count,
            2
        )
        self.assertEqual(
            (
                question_submitter_total_stats_model
                .accepted_questions_without_reviewer_edits_count
            ),
            0
        )
        self.assertEqual(
            question_submitter_total_stats_model.recent_performance,
            -4
        )
        self.assertEqual(
            question_submitter_total_stats_model.overall_accuracy,
            0.0
        )

    def test_update_question_stats_when_suggestion_is_edited(
        self
    ) -> None:
        # This test case will check stats of the reviewer and the submitter
        # when a question suggestion is accepted with reviewer edits.
        # Steps required in the setup phase before testing.
        # 1. Save new skills.
        # 2. Save a topic assigning skills for it.
        # 3. Create a question suggestion.
        skill_id_1 = self._create_skill()
        skill_id_2 = self._create_skill()
        topic_id = self._create_topic(skill_id_1, skill_id_2)
        initial_suggestion = self._create_question_suggestion(skill_id_1)
        latest_suggestion = self._create_question_suggestion(skill_id_2)
        content_id_generator = translation_domain.ContentIdGenerator()
        question_state_data = self._create_valid_question_data(
            'default_state', content_id_generator).to_dict()
        suggestion_services.update_question_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                initial_suggestion.suggestion_id)
        )
        suggestion_services.update_question_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )
        suggestion_services.accept_suggestion(
            initial_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted')
        suggestion_services.accept_suggestion(
            latest_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted')
        suggestion_services.update_question_suggestion(
            initial_suggestion.suggestion_id, 0.6, question_state_data,
            content_id_generator.next_content_id_index)
        suggestion_services.update_question_suggestion(
            latest_suggestion.suggestion_id, 0.6, question_state_data,
            content_id_generator.next_content_id_index)

        # Actual action to update stats when reviewing.
        suggestion_services.update_question_review_stats(
            suggestion_services.get_suggestion_by_id(
                initial_suggestion.suggestion_id)
        )
        suggestion_services.update_question_review_stats(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )

        question_review_stats_model = (
            suggestion_models.QuestionReviewStatsModel.get(
                self.reviewer_id, topic_id
            )
        )
        question_contribution_stats_model = (
            suggestion_models.QuestionContributionStatsModel.get(
                self.author_id, topic_id
            )
        )
        # Assert question review stats.
        # At this point we can confirm that there should be an associated
        # question review stat object for the given IDs since we have
        # called update_question_review_stats function to create/update question
        # review stats.
        assert question_review_stats_model is not None
        self.assertEqual(
            question_review_stats_model.reviewed_questions_count,
            2
        )
        self.assertEqual(
            question_review_stats_model.accepted_questions_count,
            2
        )
        self.assertEqual(
            (
                question_review_stats_model
                .accepted_questions_with_reviewer_edits_count
            ),
            2
        )
        assert question_contribution_stats_model is not None
        self.assertEqual(
            question_contribution_stats_model.accepted_questions_count,
            2
        )
        self.assertEqual(
            (
                question_contribution_stats_model
                .accepted_questions_without_reviewer_edits_count
            ),
            0
        )

        question_reviewer_total_stats_model = (
            suggestion_models.QuestionReviewerTotalContributionStatsModel
            .get_by_id(
                self.reviewer_id
            )
        )
        question_submitter_total_stats_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(
                self.author_id
            )
        )
        # Assert question review stats.
        # At this point we can confirm that there should be an associated
        # question review stat object for the given IDs since we have
        # called update_question_review_stats function to create/update question
        # review stats.
        assert question_reviewer_total_stats_model is not None
        self.assertEqual(
            question_reviewer_total_stats_model.reviewed_questions_count,
            2
        )
        self.assertEqual(
            question_reviewer_total_stats_model.accepted_questions_count,
            2
        )
        self.assertEqual(
            (
                question_reviewer_total_stats_model
                .accepted_questions_with_reviewer_edits_count
            ),
            2
        )
        assert question_submitter_total_stats_model is not None
        self.assertEqual(
            question_submitter_total_stats_model.submitted_questions_count,
            2
        )
        self.assertEqual(
            question_submitter_total_stats_model.accepted_questions_count,
            2
        )
        self.assertEqual(
            (
                question_submitter_total_stats_model
                .accepted_questions_without_reviewer_edits_count
            ),
            0
        )
        self.assertEqual(
            (
                question_submitter_total_stats_model
                .recent_review_outcomes
            ),
            ['accepted_with_edits', 'accepted_with_edits']
        )
        self.assertEqual(
            question_submitter_total_stats_model.recent_performance,
            2
        )
        self.assertEqual(
            question_submitter_total_stats_model.overall_accuracy,
            100.0
        )

    def generate_random_string(self, length: int) -> str:
        """Generate a random string of given length.

        Args:
            length: int. Length of the string to be generated.

        Returns:
            str. Generated string.
        """
        letters = string.ascii_letters
        return (''.join(random.choice(letters) for _ in range(length))).lower()

    def test_increment_question_stats_for_than_100_suggestions_accepted(
        self) -> None:

        for i in range(102):
            skill_id = self._create_skill()
            topic_id = topic_fetchers.get_new_topic_id()
            self.save_new_topic(
                topic_id, 'topic_admin', name='Topic %s' % (i),
                abbreviated_name='topic-three-1',
                url_fragment=self.generate_random_string(20),
                description='Description',
                canonical_story_ids=[],
                additional_story_ids=[],
                uncategorized_skill_ids=[skill_id],
                subtopics=[], next_subtopic_id=i)
            suggestion = self._create_question_suggestion(skill_id)
            suggestion_services.update_question_contribution_stats_at_submission( # pylint: disable=line-too-long
                suggestion_services.get_suggestion_by_id(
                    suggestion.suggestion_id
                )
            )
            suggestion_services.accept_suggestion(
                suggestion.suggestion_id, self.reviewer_id, 'Accepted',
                'Accepted')
            suggestion_services.update_question_review_stats(
                suggestion_services.get_suggestion_by_id(
                    suggestion.suggestion_id)
            )

        updated_question_submitter_total_stats_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(self.author_id)
        )

        self.assertEqual(
            len(
                updated_question_submitter_total_stats_model
                .recent_review_outcomes),
            100
        )

        new_skill_id = self._create_skill()
        new_topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            new_topic_id, 'topic_admin', name='New Topic Rejected',
            abbreviated_name='topic-three-1',
            url_fragment=self.generate_random_string(20),
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[new_skill_id],
            subtopics=[], next_subtopic_id=102)
        latest_suggestion = self._create_question_suggestion(new_skill_id)
        suggestion_services.update_question_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id
            )
        )
        suggestion_services.reject_suggestion(
            latest_suggestion.suggestion_id, self.reviewer_id, 'Rejected')

        suggestion_services.update_question_review_stats(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )

        rejected_question_submitter_total_stats_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(self.author_id)
        )

        self.assertEqual(
            len(
                rejected_question_submitter_total_stats_model
                .recent_review_outcomes),
            100
        )

        self.assertEqual(
            rejected_question_submitter_total_stats_model
            .recent_review_outcomes[99],
            suggestion_models.REVIEW_OUTCOME_REJECTED
        )

    def test_increment_question_stats_for_than_100_suggestions_rejected(
        self) -> None:

        for i in range(102):
            skill_id = self._create_skill()
            topic_id = topic_fetchers.get_new_topic_id()
            self.save_new_topic(
                topic_id, 'topic_admin', name='Topic %s' % (i),
                abbreviated_name='topic-three-1',
                url_fragment=self.generate_random_string(20),
                description='Description',
                canonical_story_ids=[],
                additional_story_ids=[],
                uncategorized_skill_ids=[skill_id],
                subtopics=[], next_subtopic_id=i)
            suggestion = self._create_question_suggestion(skill_id)
            suggestion_services.update_question_contribution_stats_at_submission( # pylint: disable=line-too-long
                suggestion_services.get_suggestion_by_id(
                    suggestion.suggestion_id
                )
            )
            suggestion_services.reject_suggestion(
                suggestion.suggestion_id, self.reviewer_id, 'Rejected')
            suggestion_services.update_question_review_stats(
                suggestion_services.get_suggestion_by_id(
                    suggestion.suggestion_id)
            )

        updated_question_submitter_total_stats_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(self.author_id)
        )

        self.assertEqual(
            len(
                updated_question_submitter_total_stats_model
                .recent_review_outcomes),
            100
        )

        new_skill_id = self._create_skill()
        new_topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            new_topic_id, 'topic_admin', name='New Topic Rejected',
            abbreviated_name='topic-three-1',
            url_fragment=self.generate_random_string(20),
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[new_skill_id],
            subtopics=[], next_subtopic_id=102)
        latest_suggestion = self._create_question_suggestion(new_skill_id)
        suggestion_services.update_question_contribution_stats_at_submission(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id
            )
        )
        suggestion_services.accept_suggestion(
            latest_suggestion.suggestion_id, self.reviewer_id, 'Accepted',
            'Accepted')
        suggestion_services.update_question_review_stats(
            suggestion_services.get_suggestion_by_id(
                latest_suggestion.suggestion_id)
        )

        accepted_question_submitter_total_stats_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(self.author_id)
        )

        self.assertEqual(
            len(
                accepted_question_submitter_total_stats_model
                .recent_review_outcomes),
            100
        )

        self.assertEqual(
            accepted_question_submitter_total_stats_model
            .recent_review_outcomes[99],
            suggestion_models.REVIEW_OUTCOME_ACCEPTED
        )

    def test_create_and_reject_suggestion(self) -> None:
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change_cmd, 'test description')

        suggestion_id = self.THREAD_ID

        suggestion_services.reject_suggestion(
            suggestion_id, self.reviewer_id, 'Reject message')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        thread_messages = feedback_services.get_messages(self.THREAD_ID)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(
            last_message.text, 'Reject message')
        self.assertEqual(
            exploration.states['State 1'].content.html,
            '<p>old content</p>')

        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        self.assertEqual(suggestion.status, suggestion_models.STATUS_REJECTED)

    def test_create_and_accept_suggestion_with_message(self) -> None:
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change_cmd, 'test description')

        suggestion_id = self.THREAD_ID

        suggestion_services.accept_suggestion(
            suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE,
            'Accept message')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        thread_messages = feedback_services.get_messages(self.THREAD_ID)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(
            last_message.text, 'Accept message')

        self.assertEqual(
            exploration.states['State 1'].content.html,
            '<p>new content</p>')

        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        self.assertEqual(suggestion.status, suggestion_models.STATUS_ACCEPTED)

    def test_auto_reject_translation_suggestions_for_content_ids(self) -> None:
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            self.create_translation_suggestion_associated_with_exp(
                self.EXP_ID, self.author_id)
        suggestion_id = self.THREAD_ID

        suggestion_services.auto_reject_translation_suggestions_for_content_ids(
            self.EXP_ID, {'content_0'})

        thread_messages = feedback_services.get_messages(self.THREAD_ID)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(
            last_message.text,
            constants.OBSOLETE_TRANSLATION_SUGGESTION_REVIEW_MSG)
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        self.assertEqual(
            suggestion.final_reviewer_id, feconf.SUGGESTION_BOT_USER_ID)
        self.assertEqual(suggestion.status, suggestion_models.STATUS_REJECTED)

    def test_delete_skill_rejects_question_suggestion(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            self.author_id, suggestion_change, 'test description')
        self.assert_created_suggestion_is_valid(skill_id, self.author_id)

        skill_services.delete_skill(self.author_id, skill_id)

        # Suggestion should be rejected after corresponding skill is deleted.
        suggestions = suggestion_services.query_suggestions(
            [('author_id', self.author_id), ('target_id', skill_id)])
        self.assertEqual(len(suggestions), 1)
        self.assertEqual(
            suggestions[0].status, suggestion_models.STATUS_REJECTED)

    def test_delete_topic_rejects_translation_suggestion(self) -> None:
        self.create_translation_suggestion_associated_with_exp(
            self.EXP_ID, self.author_id)
        self.assert_created_suggestion_is_valid(self.EXP_ID, self.author_id)

        topic_services.delete_topic(self.author_id, self.TOPIC_ID)

        # Suggestion should be rejected after the topic is deleted.
        suggestions = suggestion_services.query_suggestions(
            [('author_id', self.author_id), ('target_id', self.EXP_ID)])
        self.assertEqual(len(suggestions), 1)
        self.assertEqual(
            suggestions[0].status, suggestion_models.STATUS_REJECTED)

    def test_delete_story_rejects_translation_suggestion(self) -> None:
        self.create_translation_suggestion_associated_with_exp(
            self.EXP_ID, self.author_id)
        self.assert_created_suggestion_is_valid(self.EXP_ID, self.author_id)

        story_services.delete_story(self.author_id, self.STORY_ID)

        # Suggestion should be rejected after the story is deleted.
        suggestions = suggestion_services.query_suggestions(
            [('author_id', self.author_id), ('target_id', self.EXP_ID)])
        self.assertEqual(len(suggestions), 1)
        self.assertEqual(
            suggestions[0].status, suggestion_models.STATUS_REJECTED)

    def test_swap_exp_from_story_rejects_translation_suggestion(self) -> None:
        self.create_translation_suggestion_associated_with_exp(
            self.EXP_ID, self.author_id)
        self.assert_created_suggestion_is_valid(self.EXP_ID, self.author_id)

        # Swaps the exploration from the story.
        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': self.EXP_ID,
                'new_value': 'another_exp_id'
            })], 'Changed exploration.')

        # Suggestion should be rejected after exploration is swapped in the
        # story.
        suggestions = suggestion_services.query_suggestions(
            [('author_id', self.author_id), ('target_id', self.EXP_ID)])
        self.assertEqual(len(suggestions), 1)
        self.assertEqual(
            suggestions[0].status, suggestion_models.STATUS_REJECTED)

    def test_get_suggestions_with_translatable_explorations(self) -> None:
        # Create a translation suggestion for (state_name, content_id) =
        # (State 2, content).
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        state_name = 'State 2'
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': state_name,
            'content_id': exploration.states[state_name].content.content_id,
            'language_code': 'hi',
            'content_html': exploration.states[state_name].content.html,
            'translation_html': '<p>This is translated html.</p>',
            'data_format': 'html'
        }
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_ID, 1, self.author_id, add_translation_change_dict,
            'test description')
        suggestions = suggestion_services.query_suggestions(
            [('author_id', self.author_id), ('target_id', self.EXP_ID)])
        self.assertEqual(len(suggestions), 1)

        translatable_suggestions = []
        for suggestion in suggestions:
            assert isinstance(
                suggestion, suggestion_registry.SuggestionTranslateContent
            )
            translatable_suggestions.append(suggestion)

        # Should return the created translation suggestion.
        filtered_translatable_suggestions = (
            suggestion_services.get_suggestions_with_editable_explorations(
                translatable_suggestions
            )
        )
        self.assertEqual(len(filtered_translatable_suggestions), 1)

        # Disable exploration editing.
        exp_services.set_exploration_edits_allowed(self.EXP_ID, False)

        # Should not return the created translation suggestion.
        filtered_translatable_suggestions = (
            suggestion_services.get_suggestions_with_editable_explorations(
                translatable_suggestions
            )
        )
        self.assertEqual(len(filtered_translatable_suggestions), 0)


class UserContributionProficiencyUnitTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup('user1@example.com', 'user1')
        self.signup('user2@example.com', 'user2')
        self.user_1_id = self.get_user_id_from_email('user1@example.com')
        self.user_2_id = self.get_user_id_from_email('user2@example.com')

    def test_get_all_user_ids_who_are_allowed_to_review(self) -> None:
        user_models.UserContributionProficiencyModel.create(
            self.user_1_id, 'category1', 0)
        user_models.UserContributionProficiencyModel.create(
            self.user_1_id, 'category2',
            feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW)
        user_models.UserContributionProficiencyModel.create(
            self.user_2_id, 'category1', 0)
        user_models.UserContributionProficiencyModel.create(
            self.user_2_id, 'category2', 0)

        user_ids = (
            suggestion_services.get_all_user_ids_who_are_allowed_to_review(
                'category1'))
        self.assertEqual(user_ids, [])
        user_ids = (
            suggestion_services.get_all_user_ids_who_are_allowed_to_review(
                'category2'))
        self.assertEqual(user_ids, [self.user_1_id])

        self.assertFalse(suggestion_services.can_user_review_category(
            self.user_1_id, 'category1'))
        self.assertTrue(suggestion_services.can_user_review_category(
            self.user_1_id, 'category2'))
        self.assertFalse(suggestion_services.can_user_review_category(
            self.user_2_id, 'category1'))
        self.assertFalse(suggestion_services.can_user_review_category(
            self.user_2_id, 'category1'))

    def test_get_all_scores_of_the_user_with_multiple_scores(self) -> None:
        user_models.UserContributionProficiencyModel.create(
            self.user_1_id, 'category1', 1)
        user_models.UserContributionProficiencyModel.create(
            self.user_1_id, 'category2', 2)
        user_models.UserContributionProficiencyModel.create(
            self.user_1_id, 'category3', 3)

        expected_scores_dict = {}
        for index in range(1, 4):
            key = 'category%s' % str(index)
            expected_scores_dict[key] = index

        scores_dict = suggestion_services.get_all_scores_of_user(
            self.user_1_id)

        self.assertEqual(len(scores_dict), 3)
        self.assertDictEqual(scores_dict, expected_scores_dict)

    def test_get_all_scores_of_the_user_when_no_scores_exist(self) -> None:
        scores_dict = suggestion_services.get_all_scores_of_user(
            self.user_1_id)

        self.assertEqual(len(scores_dict), 0)
        self.assertDictEqual(scores_dict, {})


class ReviewableSuggestionEmailInfoUnitTests(
        test_utils.GenericTestBase):
    """Tests the methods related to the ReviewableSuggestionEmailInfo class.
    """

    target_id: str = 'exp1'
    skill_id: str = 'skill1'
    language_code: str = 'en'
    AUTHOR_EMAIL: Final = 'author1@example.com'
    REVIEWER_EMAIL: Final = 'reviewer@community.org'
    COMMIT_MESSAGE: Final = 'commit message'

    def _create_translation_suggestion_with_translation_html(
        self, translation_html: str
    ) -> suggestion_registry.SuggestionTranslateContent:
        """Creates a translation suggestion with the given translation_html."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': self.language_code,
            'content_html': feconf.DEFAULT_STATE_CONTENT_STR,
            'translation_html': translation_html,
            'data_format': 'html'
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_translation_change_dict,
            'test description'
        )

    def _create_question_suggestion_with_question_html_content(
        self, question_html_content: str
    ) -> suggestion_registry.SuggestionAddQuestion:
        """Creates a question suggestion with the html content used for the
        question in the question suggestion.
        """
        with self.swap(
            feconf, 'DEFAULT_STATE_CONTENT_STR', question_html_content):
            content_id_generator = translation_domain.ContentIdGenerator()
            add_question_change_dict: Dict[
                str, Union[str, float, question_domain.QuestionDict]
            ] = {
                'cmd': (
                    question_domain
                    .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                'question_dict': {
                    'id': 'test_id',
                    'version': 12,
                    'question_state_data': self._create_valid_question_data(
                        'default_state', content_id_generator).to_dict(),
                    'language_code': self.language_code,
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_1'],
                    'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                    'next_content_id_index': (
                        content_id_generator.next_content_id_index)
                },
                'skill_id': self.skill_id,
                'skill_difficulty': 0.3
            }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            self.skill_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_question_change_dict,
            'test description'
        )

    def _create_edit_state_content_suggestion(
        self
    ) -> suggestion_registry.SuggestionEditStateContent:
        """Creates an "edit state content" suggestion."""

        edit_state_content_change_dict: Dict[
            str, Union[str, Dict[str, str]]
        ] = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Introduction',
            'new_value': {
                'content_id': 'content_0',
                'html': 'new html content'
            },
            'old_value': {
                'content_id': 'content_0',
                'html': 'old html content'
            }
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, edit_state_content_change_dict,
            None)

    def _assert_reviewable_suggestion_email_infos_are_equal(
        self,
        reviewable_suggestion_email_info: (
            suggestion_registry.ReviewableSuggestionEmailInfo
        ),
        expected_reviewable_suggestion_email_info: (
            suggestion_registry.ReviewableSuggestionEmailInfo
        )
    ) -> None:
        """Asserts that the reviewable suggestion email info is equal to the
        expected reviewable suggestion email info.
        """
        self.assertEqual(
            reviewable_suggestion_email_info.suggestion_type,
            expected_reviewable_suggestion_email_info.suggestion_type)
        self.assertEqual(
            reviewable_suggestion_email_info.language_code,
            expected_reviewable_suggestion_email_info.language_code)
        self.assertEqual(
            reviewable_suggestion_email_info.suggestion_content,
            expected_reviewable_suggestion_email_info.suggestion_content)
        self.assertEqual(
            reviewable_suggestion_email_info.submission_datetime,
            expected_reviewable_suggestion_email_info.submission_datetime)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(
            self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(
            self.REVIEWER_EMAIL)
        self.save_new_valid_exploration(self.target_id, self.author_id)

    def test_create_raises_for_suggestion_type_not_on_contributor_dashboard(
        self
    ) -> None:
        edit_state_content_suggestion = (
            self._create_edit_state_content_suggestion())
        # Mocking the SUGGESTION_EMPHASIZED_TEXT_GETTER_FUNCTIONS dict in
        # suggestion services so that this test still passes if the
        # "edit state content" suggestion type is added to the Contributor
        # Dashboard in the future.
        suggestion_emphasized_text_getter_functions_mock: Dict[str, str] = {}

        with self.swap(
            suggestion_services, 'SUGGESTION_EMPHASIZED_TEXT_GETTER_FUNCTIONS',
            suggestion_emphasized_text_getter_functions_mock):
            with self.assertRaisesRegex(
                Exception,
                'Expected suggestion type to be offered on the Contributor '
                'Dashboard, received: %s.' % (
                    feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)):
                (
                    suggestion_services
                    .create_reviewable_suggestion_email_info_from_suggestion(
                        edit_state_content_suggestion)
                )

    def test_contributor_suggestion_types_are_in_suggestion_text_getter_dict(
        self
    ) -> None:
        # This test will fail if a new suggestion type is added to the
        # Contributor Dashboard but hasn't been added to
        # SUGGESTION_EMPHASIZED_TEXT_GETTER_FUNCTIONS.
        sorted_text_getter_dict_suggestion_types = sorted(
            suggestion_services
            .SUGGESTION_EMPHASIZED_TEXT_GETTER_FUNCTIONS.keys())
        sorted_contributor_dashboard_suggestion_types = sorted(
            feconf.CONTRIBUTOR_DASHBOARD_SUGGESTION_TYPES)

        self.assertListEqual(
            sorted_text_getter_dict_suggestion_types,
            sorted_contributor_dashboard_suggestion_types)

    def test_create_from_suggestion_returns_info_for_question_suggestion(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_content(
                '<p>default question content</p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                question_suggestion.suggestion_type,
                question_suggestion.language_code,
                'default question content',
                question_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_from_suggestion_returns_info_for_translation_suggestion(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_with_translation_html(
                '<p>default translation content</p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                translation_suggestion.suggestion_type,
                translation_suggestion.language_code,
                'default translation content',
                translation_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_from_suggestion_returns_info_for_empty_html(self) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_with_translation_html(
                ''))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                translation_suggestion.suggestion_type,
                translation_suggestion.language_code, '',
                translation_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_from_suggestion_returns_info_with_no_trailing_whitespace(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_with_translation_html(
                ' <p>          test whitespace     </p>    '))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                translation_suggestion.suggestion_type,
                translation_suggestion.language_code,
                'test whitespace',
                translation_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_translation_suggestion_if_html_math_rte(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_with_translation_html(
                '<p> translation with rte'
                '<oppia-noninteractive-math math_content-with-value=\''
                '{&amp;quot;raw_latex&amp;quot;:&amp;quot;+,-,-,+&amp;'
                'quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;'
                'mathImg.svg&amp;quot;}\'></oppia-noninteractive-math></p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                translation_suggestion.suggestion_type,
                translation_suggestion.language_code,
                'translation with rte [Math]',
                translation_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_translation_suggestion_if_html_image_rte(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_with_translation_html(
                '<p> translation with rte'
                '<oppia-noninteractive-image alt-with-value=\'&amp;quot;'
                'test&amp;quot;\' caption-with-value=\'&amp;quot;&amp;'
                'quot;\' filepath-with-value=\'&amp;quot;img.svg&amp;quot;'
                '\'></oppia-noninteractive-image></p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                translation_suggestion.suggestion_type,
                translation_suggestion.language_code,
                'translation with rte [Image]',
                translation_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_translation_suggestion_if_html_link_rte(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_with_translation_html(
                '<p> translation with rte'
                '<oppia-noninteractive-link text-with-value=\'&amp;quot;'
                'codebase&amp;quot;\' url-with-value=\'&amp;quot;'
                'https://github.com/oppia/oppia/&amp;quot;\'>'
                '</oppia-noninteractive-link></p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                translation_suggestion.suggestion_type,
                translation_suggestion.language_code,
                'translation with rte [Link]',
                translation_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_translation_suggestion_if_html_rte_repeats(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_with_translation_html(
                '<p> translation with rte'
                '<oppia-noninteractive-link text-with-value=\'&amp;quot;'
                'codebase&amp;quot;\' url-with-value=\'&amp;quot;'
                'https://github.com/oppia/oppia/&amp;quot;\'>'
                '</oppia-noninteractive-link></p>'
                '<oppia-noninteractive-link text-with-value=\'&amp;quot;'
                'codebase&amp;quot;\' url-with-value=\'&amp;quot;'
                'https://github.com/oppia/oppia/&amp;quot;\'>'
                '</oppia-noninteractive-link>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                translation_suggestion.suggestion_type,
                translation_suggestion.language_code,
                'translation with rte [Link] [Link]',
                translation_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_translation_suggestion_if_html_multi_rte(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_with_translation_html(
                '<p> translation with rte'
                '<oppia-noninteractive-link text-with-value=\'&amp;quot;'
                'codebase&amp;quot;\' url-with-value=\'&amp;quot;'
                'https://github.com/oppia/oppia/&amp;quot;\'>'
                '</oppia-noninteractive-link></p>'
                '<oppia-noninteractive-math math_content-with-value=\''
                '{&amp;quot;raw_latex&amp;quot;:&amp;quot;+,-,-,+&amp;'
                'quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;'
                'mathImg.svg&amp;quot;}\'></oppia-noninteractive-math>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                translation_suggestion.suggestion_type,
                translation_suggestion.language_code,
                'translation with rte [Link] [Math]',
                translation_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_translation_suggestion_if_html_rte_value(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_with_translation_html(
                '<p><oppia-noninteractive-link text-with-value="&amp;quot;Test '
                'a tag&amp;quot;" url-with-value="&amp;quot;somelink&amp;'
                'quot;"></oppia-noninteractive-link></p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                translation_suggestion.suggestion_type,
                translation_suggestion.language_code,
                '[Link]',
                translation_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_question_suggestion_if_html_has_math_rte(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_content(
                '<p> question with rte'
                '<oppia-noninteractive-math math_content-with-value=\''
                '{&amp;quot;raw_latex&amp;quot;:&amp;quot;+,-,-,+&amp;'
                'quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;'
                'mathImg.svg&amp;quot;}\'></oppia-noninteractive-math></p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                question_suggestion.suggestion_type,
                question_suggestion.language_code,
                'question with rte [Math]',
                question_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_question_suggestion_if_html_has_image_rte(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_content(
                '<p> question with rte'
                '<oppia-noninteractive-image alt-with-value=\'&amp;quot;'
                'testing&amp;quot;\' caption-with-value=\'&amp;quot;&amp;'
                'quot;\' filepath-with-value=\'&amp;quot;img.svg&amp;quot;'
                '\'></oppia-noninteractive-image></p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                question_suggestion.suggestion_type,
                question_suggestion.language_code,
                'question with rte [Image]',
                question_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info)

    def test_create_returns_info_for_question_suggestion_if_html_has_link_rte(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_content(
                '<p> question with rte'
                '<oppia-noninteractive-link text-with-value=\'&amp;quot;'
                'codebase&amp;quot;\' url-with-value=\'&amp;quot;'
                'https://github.com/oppia/oppia/&amp;quot;\'>'
                '</oppia-noninteractive-link></p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                question_suggestion.suggestion_type,
                question_suggestion.language_code,
                'question with rte [Link]',
                question_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_question_suggestion_if_html_has_repeat_rte(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_content(
                '<p> question with rte'
                '<oppia-noninteractive-link text-with-value=\'&amp;quot;'
                'codebase&amp;quot;\' url-with-value=\'&amp;quot;'
                'https://github.com/oppia/oppia/&amp;quot;\'>'
                '</oppia-noninteractive-link></p>'
                '<oppia-noninteractive-link text-with-value=\'&amp;quot;'
                'codebase&amp;quot;\' url-with-value=\'&amp;quot;'
                'https://github.com/oppia/oppia/&amp;quot;\'>'
                '</oppia-noninteractive-link>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                question_suggestion.suggestion_type,
                question_suggestion.language_code,
                'question with rte [Link] [Link]',
                question_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_question_suggestion_if_html_has_multi_rte(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_content(
                '<p> question with rte'
                '<oppia-noninteractive-link text-with-value=\'&amp;quot;'
                'codebase&amp;quot;\' url-with-value=\'&amp;quot;'
                'https://github.com/oppia/oppia/&amp;quot;\'>'
                '</oppia-noninteractive-link></p>'
                '<oppia-noninteractive-math math_content-with-value=\''
                '{&amp;quot;raw_latex&amp;quot;:&amp;quot;+,-,-,+&amp;'
                'quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;'
                'mathImg.svg&amp;quot;}\'></oppia-noninteractive-math>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                question_suggestion.suggestion_type,
                question_suggestion.language_code,
                'question with rte [Link] [Math]',
                question_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_question_suggestion_if_html_has_rte_value(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_content(
                '<p><oppia-noninteractive-link text-with-value="&amp;quot;Test '
                'a tag&amp;quot;" url-with-value="&amp;quot;somelink&amp;'
                'quot;"></oppia-noninteractive-link></p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                question_suggestion.suggestion_type,
                question_suggestion.language_code,
                '[Link]',
                question_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_suggestion_if_html_has_rte_with_text(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_content(
                '<p><oppia-noninteractive-link text-with-value="&amp;quot;Test '
                'a tag&amp;quot;" url-with-value="&amp;quot;somelink&amp;'
                'quot;">text</oppia-noninteractive-link></p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                question_suggestion.suggestion_type,
                question_suggestion.language_code,
                '[Link]',
                question_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_suggestion_if_html_has_rte_with_html(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_content(
                '<p><oppia-noninteractive-link text-with-value="&amp;quot;Test '
                'a tag&amp;quot;" url-with-value="&amp;quot;somelink&amp;'
                'quot;"><p>text</p></oppia-noninteractive-link></p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                question_suggestion.suggestion_type,
                question_suggestion.language_code,
                '[Link]',
                question_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )

    def test_create_returns_info_for_suggestion_if_html_has_rte_with_multi_word(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_content(
                '<p><oppia-noninteractive-link-test text-with-value='
                '"&amp;quot;Test a tag&amp;quot;" url-with-value="&amp;quot;'
                'somelink&amp;quot;"><p>text</p>'
                '</oppia-noninteractive-link-test></p>'))
        expected_reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                question_suggestion.suggestion_type,
                question_suggestion.language_code,
                '[Link Test]',
                question_suggestion.last_updated
            ))

        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion)
        )

        self._assert_reviewable_suggestion_email_infos_are_equal(
            reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info
        )


class GetSuggestionsWaitingForReviewInfoToNotifyReviewersUnitTests(
        test_utils.GenericTestBase):
    """Test the ability of the
    get_suggestions_waitng_for_review_info_to_notify_reviewers method
    in suggestion services, which is used to retrieve the information required
    to notify reviewers that there are suggestions that need review.
    """

    target_id: str = 'exp1'
    skill_id: str = 'skill_123456'
    language_code: str = 'en'
    AUTHOR_EMAIL: Final = 'author1@example.com'
    REVIEWER_1_EMAIL: Final = 'reviewer1@community.org'
    REVIEWER_2_EMAIL: Final = 'reviewer2@community.org'
    COMMIT_MESSAGE: Final = 'commit message'

    def _create_translation_suggestion_with_language_code_and_author(
        self, language_code: str, author_id: str
    ) -> suggestion_registry.SuggestionTranslateContent:
        """Creates a translation suggestion in the given language_code with the
        given author id.
        """
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': language_code,
            'content_html': feconf.DEFAULT_STATE_CONTENT_STR,
            'translation_html': '<p>This is the translated content.</p>',
            'data_format': 'html'
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            author_id, add_translation_change_dict,
            'test description'
        )

    def _create_question_suggestion_with_skill_id_and_author_id(
        self, skill_id: str, author_id: str
    ) -> suggestion_registry.SuggestionAddQuestion:
        """Creates a question suggestion with the given skill_id."""
        content_id_generator = translation_domain.ContentIdGenerator()
        add_question_change_dict: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': self.language_code,
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            skill_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            author_id, add_question_change_dict,
            'test description'
        )

    def _create_reviewable_suggestion_email_infos_from_suggestions(
        self, suggestions: List[suggestion_registry.BaseSuggestion]
    ) -> List[suggestion_registry.ReviewableSuggestionEmailInfo]:
        """Creates a list of ReviewableSuggestionEmailInfo objects from
        the given suggestions.
        """

        return [
            (
                suggestion_services
                .create_reviewable_suggestion_email_info_from_suggestion(
                    suggestion)
            ) for suggestion in suggestions
        ]

    def _assert_reviewable_suggestion_email_infos_are_in_correct_order(
        self,
        reviewable_suggestion_email_infos: (
            List[suggestion_registry.ReviewableSuggestionEmailInfo]
        ),
        expected_reviewable_suggestion_email_infos: (
            List[suggestion_registry.ReviewableSuggestionEmailInfo]
        )
    ) -> None:
        """Asserts that the reviewable suggestion email infos are equal to the
        expected reviewable suggestion email infos and that the reviewable
        suggestion email infos are sorted in descending order according to
        review wait time.
        """
        self.assertEqual(
            len(reviewable_suggestion_email_infos),
            len(expected_reviewable_suggestion_email_infos)
        )
        for index, reviewable_suggestion_email_info in enumerate(
                reviewable_suggestion_email_infos):
            self.assertEqual(
                reviewable_suggestion_email_info.suggestion_type,
                expected_reviewable_suggestion_email_infos[
                    index].suggestion_type)
            self.assertEqual(
                reviewable_suggestion_email_info.language_code,
                expected_reviewable_suggestion_email_infos[
                    index].language_code)
            self.assertEqual(
                reviewable_suggestion_email_info.suggestion_content,
                expected_reviewable_suggestion_email_infos[
                    index].suggestion_content)
            self.assertEqual(
                reviewable_suggestion_email_info.submission_datetime,
                expected_reviewable_suggestion_email_infos[
                    index].submission_datetime)
        for index in range(len(reviewable_suggestion_email_infos) - 1):
            self.assertLessEqual(
                reviewable_suggestion_email_infos[index].submission_datetime,
                reviewable_suggestion_email_infos[
                    index + 1].submission_datetime
            )

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(
            self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_1_EMAIL, 'reviewer1')
        self.reviewer_1_id = self.get_user_id_from_email(
            self.REVIEWER_1_EMAIL)
        self.signup(self.REVIEWER_2_EMAIL, 'reviewer2')
        self.reviewer_2_id = self.get_user_id_from_email(
            self.REVIEWER_2_EMAIL)
        exploration = self.save_new_valid_exploration(
            self.target_id, self.author_id)
        audio_language_codes = set(
            language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES)
        model = opportunity_models.ExplorationOpportunitySummaryModel(
            id=exploration.id,
            topic_id='topic_id',
            topic_name='topic_name',
            story_id='story_id',
            story_title='story_title',
            chapter_title='chapter_title',
            content_count=2,
            incomplete_translation_language_codes=(
                audio_language_codes - set(['en'])),
            translation_counts={},
            language_codes_needing_voice_artists=audio_language_codes,
            language_codes_with_assigned_voice_artists=[]
        )
        model.update_timestamps()
        model.put()

        self.save_new_skill(self.skill_id, self.author_id)

    def test_get_returns_empty_for_reviewers_who_authored_the_suggestions(
        self
    ) -> None:
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        self._create_question_suggestion_with_skill_id_and_author_id(
            'skill_1', self.reviewer_1_id)
        self._create_translation_suggestion_with_language_code_and_author(
            'hi', self.reviewer_1_id)

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id]))

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self.assertEqual(reviewable_suggestion_email_infos, [[]])

    def test_get_returns_empty_for_question_reviewers_if_only_translation_exist(
        self
    ) -> None:
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        self._create_translation_suggestion_with_language_code_and_author(
            'hi', self.author_id)

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id]))

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self.assertEqual(reviewable_suggestion_email_infos, [[]])

    def test_get_returns_empty_for_translation_reviewers_if_only_question_exist(
        self
    ) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        self._create_question_suggestion_with_skill_id_and_author_id(
            'skill_1', self.reviewer_1_id)

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id]))

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self.assertEqual(reviewable_suggestion_email_infos, [[]])

    def test_get_returns_empty_for_accepted_suggestions(self) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        translation_suggestion = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        suggestion_services.accept_suggestion(
            translation_suggestion.suggestion_id, self.reviewer_1_id,
            self.COMMIT_MESSAGE, 'review message')

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id]))

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self.assertEqual(reviewable_suggestion_email_infos, [[]])

    def test_get_returns_empty_for_rejected_suggestions(self) -> None:
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        translation_suggestion = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        suggestion_services.reject_suggestion(
            translation_suggestion.suggestion_id, self.reviewer_1_id,
            'review message')

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id]))

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self.assertEqual(reviewable_suggestion_email_infos, [[]])

    def test_get_returns_suggestion_infos_for_a_translation_reviewer_same_lang(
        self
    ) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        translation_suggestion_1 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        translation_suggestion_2 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        expected_reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [translation_suggestion_1, translation_suggestion_2]))

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id]))

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[0],
            expected_reviewable_suggestion_email_infos)

    def test_get_returns_empty_for_a_translation_reviewer_with_diff_lang_rights(
        self
    ) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        self._create_translation_suggestion_with_language_code_and_author(
            'hi', self.author_id)

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id]))

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self.assertEqual(reviewable_suggestion_email_infos, [[]])

    def test_get_returns_suggestion_infos_for_translation_reviewer_multi_lang(
        self
    ) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        translation_suggestion_1 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        translation_suggestion_2 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'en', self.author_id))
        translation_suggestion_3 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        expected_reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [
                    translation_suggestion_1, translation_suggestion_2,
                    translation_suggestion_3]))

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id]
            )
        )

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[0],
            expected_reviewable_suggestion_email_infos)

    def test_get_returns_infos_for_translation_reviewer_past_limit_same_lang(
        self
    ) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        translation_suggestion_1 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        # Create another translation suggestion so that we pass the
        # MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER limit.
        self._create_translation_suggestion_with_language_code_and_author(
            'hi', self.author_id)
        expected_reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [translation_suggestion_1]))

        with self.swap(
            suggestion_services,
            'MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER', 1):
            reviewable_suggestion_email_infos = (
                suggestion_services
                .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                    [self.reviewer_1_id]))

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[0],
            expected_reviewable_suggestion_email_infos)

    def test_get_returns_infos_for_translation_reviewer_past_limit_diff_lang(
        self
    ) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        translation_suggestion_1 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        translation_suggestion_2 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'en', self.author_id))
        # Create another hindi and english translation suggestion so that we
        # reach the MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER limit for each
        # language code but continue to update which suggestions have been
        # waiting the longest (since the top two suggestions waiting the
        # longest are from different language codes).
        self._create_translation_suggestion_with_language_code_and_author(
            'en', self.author_id)
        self._create_translation_suggestion_with_language_code_and_author(
            'hi', self.author_id)
        expected_reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [translation_suggestion_1, translation_suggestion_2]))

        with self.swap(
            suggestion_services,
            'MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER', 2):
            reviewable_suggestion_email_infos = (
                suggestion_services
                .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                    [self.reviewer_1_id]))

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[0],
            expected_reviewable_suggestion_email_infos)

    def test_get_returns_suggestion_infos_for_multiple_translation_reviewers(
        self
    ) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, 'hi')
        translation_suggestion_1 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        translation_suggestion_2 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'en', self.author_id))
        translation_suggestion_3 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        expected_reviewable_suggestion_email_infos_reviewer_1 = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [
                    translation_suggestion_1, translation_suggestion_2,
                    translation_suggestion_3]))
        expected_reviewable_suggestion_email_infos_reviewer_2 = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [translation_suggestion_1, translation_suggestion_3]))

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id, self.reviewer_2_id]
            )
        )

        self.assertEqual(len(reviewable_suggestion_email_infos), 2)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[0],
            expected_reviewable_suggestion_email_infos_reviewer_1)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[1],
            expected_reviewable_suggestion_email_infos_reviewer_2)

    def test_get_returns_suggestion_infos_for_reviewer_with_multi_review_rights(
        self
    ) -> None:
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        suggestion_1 = (
            self._create_question_suggestion_with_skill_id_and_author_id(
                'skill_1', self.author_id))
        suggestion_2 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        suggestion_3 = (
            self._create_question_suggestion_with_skill_id_and_author_id(
                'skill_2', self.author_id))
        suggestion_4 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        suggestion_5 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'en', self.author_id))
        expected_reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [
                    suggestion_1, suggestion_2, suggestion_3, suggestion_4,
                    suggestion_5]))

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id]
            )
        )

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[0],
            expected_reviewable_suggestion_email_infos)

    def test_get_returns_suggestion_infos_for_a_question_reviewer(self) -> None:
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        question_suggestion_1 = (
            self._create_question_suggestion_with_skill_id_and_author_id(
                'skill_1', self.author_id))
        question_suggestion_2 = (
            self._create_question_suggestion_with_skill_id_and_author_id(
                'skill_2', self.author_id))
        expected_reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [question_suggestion_1, question_suggestion_2]))

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id]
            )
        )

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[0],
            expected_reviewable_suggestion_email_infos)

    def test_get_returns_suggestion_infos_for_multi_question_reviewers(
        self
    ) -> None:
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        user_services.allow_user_to_review_question(self.reviewer_2_id)
        question_suggestion_1 = (
            self._create_question_suggestion_with_skill_id_and_author_id(
                'skill_1', self.author_id))
        question_suggestion_2 = (
            self._create_question_suggestion_with_skill_id_and_author_id(
                'skill_2', self.author_id))
        expected_reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [question_suggestion_1, question_suggestion_2]))

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id, self.reviewer_2_id]
            )
        )

        self.assertEqual(len(reviewable_suggestion_email_infos), 2)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[0],
            expected_reviewable_suggestion_email_infos)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[1],
            expected_reviewable_suggestion_email_infos)

    def test_get_returns_suggestion_infos_for_question_reviewer_past_limit(
        self
    ) -> None:
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        question_suggestion_1 = (
            self._create_question_suggestion_with_skill_id_and_author_id(
                'skill_1', self.author_id))
        self._create_question_suggestion_with_skill_id_and_author_id(
            'skill_2', self.author_id)
        expected_reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [question_suggestion_1]))

        with self.swap(
            suggestion_services,
            'MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER', 1):
            reviewable_suggestion_email_infos = (
                suggestion_services
                .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                    [self.reviewer_1_id]
                )
            )

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[0],
            expected_reviewable_suggestion_email_infos)

    def test_get_returns_suggestion_infos_for_multi_reviewers_with_multi_rights(
        self
    ) -> None:
        # Reviewer 1's permissions.
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        # Reviewer 2's permissions.
        user_services.allow_user_to_review_question(self.reviewer_2_id)
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, 'fr')
        suggestion_1 = (
            self._create_question_suggestion_with_skill_id_and_author_id(
                'skill_1', self.author_id))
        suggestion_2 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        suggestion_3 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'fr', self.author_id))
        suggestion_4 = (
            self._create_question_suggestion_with_skill_id_and_author_id(
                'skill_2', self.author_id))
        suggestion_5 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        suggestion_6 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'en', self.author_id))
        expected_reviewable_suggestion_email_infos_reviewer_1 = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [
                    suggestion_1, suggestion_2, suggestion_4, suggestion_5,
                    suggestion_6]))
        expected_reviewable_suggestion_email_infos_reviewer_2 = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [
                    suggestion_1, suggestion_2, suggestion_3, suggestion_4,
                    suggestion_5]))

        reviewable_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                [self.reviewer_1_id, self.reviewer_2_id]
            )
        )

        self.assertEqual(len(reviewable_suggestion_email_infos), 2)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[0],
            expected_reviewable_suggestion_email_infos_reviewer_1)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[1],
            expected_reviewable_suggestion_email_infos_reviewer_2)

    def test_get_returns_infos_for_reviewer_with_multi_rights_past_limit(
        self
    ) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        translation_suggestion_1 = (
            self._create_translation_suggestion_with_language_code_and_author(
                'hi', self.author_id))
        # Create additional suggestions so that we pass the
        # MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER limit regardless of
        # suggestion type.
        self._create_question_suggestion_with_skill_id_and_author_id(
            'skill_1', self.author_id)
        self._create_translation_suggestion_with_language_code_and_author(
            'hi', self.author_id)
        self._create_question_suggestion_with_skill_id_and_author_id(
            'skill_1', self.author_id)
        expected_reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [translation_suggestion_1]))

        with self.swap(
            suggestion_services,
            'MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER', 1):
            reviewable_suggestion_email_infos = (
                suggestion_services
                .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                    [self.reviewer_1_id]))

        self.assertEqual(len(reviewable_suggestion_email_infos), 1)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            reviewable_suggestion_email_infos[0],
            expected_reviewable_suggestion_email_infos)


class CommunityContributionStatsUnitTests(test_utils.GenericTestBase):
    """Test the functionality related to updating the community contribution
    stats.

    TODO(#10957): It is currently not possible to resubmit a rejected
    translation suggestion for review. As a result, there isn't a test for
    that case in this test class. If the functionality is added, a new test
    should be added here to cover that case. If the functionality is not going
    to be added then this can be removed. See issue #10957 for more context.
    """

    target_id: str = 'exp1'
    skill_id: str = 'skill_123456'
    language_code: str = 'en'
    AUTHOR_EMAIL: Final = 'author@example.com'
    REVIEWER_EMAIL: Final = 'reviewer@community.org'
    COMMIT_MESSAGE: Final = 'commit message'

    def _create_translation_suggestion_with_language_code(
        self, language_code: str
    ) -> suggestion_registry.SuggestionTranslateContent:
        """Creates a translation suggestion in the given language_code."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': language_code,
            'content_html': feconf.DEFAULT_STATE_CONTENT_STR,
            'translation_html': '<p>This is the translated content.</p>',
            'data_format': 'html'
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_translation_change_dict,
            'test description'
        )

    def _create_question_suggestion(
        self
    ) -> suggestion_registry.SuggestionAddQuestion:
        """Creates a question suggestion."""
        content_id_generator = translation_domain.ContentIdGenerator()
        add_question_change_dict: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': self.language_code,
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': self.skill_id,
            'skill_difficulty': 0.3
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            self.skill_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_question_change_dict,
            'test description'
        )

    def _create_edit_state_content_suggestion(
        self
    ) -> suggestion_registry.SuggestionEditStateContent:
        """Creates an "edit state content" suggestion."""

        edit_state_content_change_dict: Dict[
            str, Union[str, Dict[str, str]]
        ] = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Introduction',
            'new_value': {
                'content_id': 'content_0',
                'html': 'new html content'
            },
            'old_value': {
                'content_id': 'content_0',
                'html': 'old html content'
            }
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, edit_state_content_change_dict,
            'test description'
        )

    def _assert_community_contribution_stats_is_in_default_state(self) -> None:
        """Checks if the community contribution stats is in its default
        state.
        """
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )

        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code
            ), {})
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code
            ), {})
        self.assertEqual(
            community_contribution_stats.question_reviewer_count, 0)
        self.assertEqual(
            community_contribution_stats.question_suggestion_count, 0)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(
            self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(
            self.REVIEWER_EMAIL)
        exploration = self.save_new_valid_exploration(
            self.target_id, self.author_id)
        audio_language_codes = set(
            language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES)
        model = opportunity_models.ExplorationOpportunitySummaryModel(
            id=exploration.id,
            topic_id='topic_id',
            topic_name='topic_name',
            story_id='story_id',
            story_title='story_title',
            chapter_title='chapter_title',
            content_count=2,
            incomplete_translation_language_codes=(
                audio_language_codes - set(['en'])),
            translation_counts={},
            language_codes_needing_voice_artists=audio_language_codes,
            language_codes_with_assigned_voice_artists=[]
        )
        model.update_timestamps()
        model.put()

        self.save_new_skill(self.skill_id, self.author_id)

    def test_create_edit_state_content_suggestion_does_not_change_the_counts(
        self
    ) -> None:
        self._create_edit_state_content_suggestion()

        self._assert_community_contribution_stats_is_in_default_state()

    def test_accept_edit_state_content_suggestion_does_not_change_the_counts(
        self
    ) -> None:
        edit_state_content_suggestion = (
            self._create_edit_state_content_suggestion())
        self._assert_community_contribution_stats_is_in_default_state()

        suggestion_services.accept_suggestion(
            edit_state_content_suggestion.suggestion_id, self.reviewer_id,
            self.COMMIT_MESSAGE, 'review message')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_reject_edit_state_content_suggestion_does_not_change_the_counts(
        self
    ) -> None:
        edit_state_content_suggestion = (
            self._create_edit_state_content_suggestion())
        self._assert_community_contribution_stats_is_in_default_state()

        suggestion_services.reject_suggestion(
            edit_state_content_suggestion.suggestion_id, self.reviewer_id,
            'review message')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_reject_edit_state_content_suggestions_does_not_change_the_counts(
        self
    ) -> None:
        edit_state_content_suggestion_1 = (
            self._create_edit_state_content_suggestion())
        edit_state_content_suggestion_2 = (
            self._create_edit_state_content_suggestion())
        self._assert_community_contribution_stats_is_in_default_state()

        suggestion_services.reject_suggestions(
            [
                edit_state_content_suggestion_1.suggestion_id,
                edit_state_content_suggestion_2.suggestion_id
            ], self.reviewer_id, 'review message')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_resubmit_edit_state_content_suggestion_does_not_change_the_counts(
        self
    ) -> None:
        edit_state_content_suggestion = (
            self._create_edit_state_content_suggestion())
        suggestion_services.reject_suggestion(
            edit_state_content_suggestion.suggestion_id, self.reviewer_id,
            'review message')
        self._assert_community_contribution_stats_is_in_default_state()
        # Change the new_value of the html of the suggestion that got rejected
        # so we can resubmit the suggestion for review.
        resubmit_suggestion_change = edit_state_content_suggestion.change_cmd
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(resubmit_suggestion_change.new_value, dict)
        resubmit_suggestion_change.new_value['html'] = 'new html to resubmit'

        # Resubmit the rejected "edit state content" suggestion.
        suggestion_services.resubmit_rejected_suggestion(
            edit_state_content_suggestion.suggestion_id,
            'resubmit summary message', self.author_id,
            resubmit_suggestion_change)

        self._assert_community_contribution_stats_is_in_default_state()

    def test_create_question_suggestion_increases_question_suggestion_count(
        self
    ) -> None:
        self._create_question_suggestion()

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 1)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_create_multi_question_suggestions_increases_question_count(
        self
    ) -> None:
        self._create_question_suggestion()
        self._create_question_suggestion()

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 2)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_accept_question_suggestion_decreases_question_suggestion_count(
        self
    ) -> None:
        question_suggestion = self._create_question_suggestion()
        # Assert that the question suggestion count increased.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 1)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        suggestion_services.accept_suggestion(
            question_suggestion.suggestion_id, self.reviewer_id,
            self.COMMIT_MESSAGE, 'review message')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_reject_question_suggestion_decreases_question_suggestion_count(
        self
    ) -> None:
        question_suggestion = self._create_question_suggestion()
        # Assert that the question suggestion count increased.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 1)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        suggestion_services.reject_suggestion(
            question_suggestion.suggestion_id, self.reviewer_id,
            'review message')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_reject_question_suggestions_decreases_question_suggestion_count(
        self
    ) -> None:
        question_suggestion_1 = self._create_question_suggestion()
        question_suggestion_2 = self._create_question_suggestion()
        # Assert that the question suggestion count increased.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 2)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        suggestion_services.reject_suggestions(
            [
                question_suggestion_1.suggestion_id,
                question_suggestion_2.suggestion_id
            ], self.reviewer_id, 'review message')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_resubmit_question_suggestion_increases_question_suggestion_count(
        self
    ) -> None:
        question_suggestion = self._create_question_suggestion()
        # Assert that the question suggestion count increased.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 1)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})
        suggestion_services.reject_suggestion(
            question_suggestion.suggestion_id, self.reviewer_id,
            'review message')
        # Assert that the question suggestion decreased because the suggestion
        # was rejected.
        self._assert_community_contribution_stats_is_in_default_state()
        # Change the question_dict of the question suggestion that got rejected
        # so we can resubmit the suggestion for review.
        resubmit_question_change = question_suggestion.change_cmd
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(resubmit_question_change.question_dict, dict)
        resubmit_question_change.question_dict['linked_skill_ids'] = ['skill1']

        # Resubmit the rejected question suggestion.
        suggestion_services.resubmit_rejected_suggestion(
            question_suggestion.suggestion_id, 'resubmit summary message',
            self.author_id, resubmit_question_change
        )

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 1)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_create_translation_suggestion_raises_translation_suggestion_count(
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code(
            self.language_code)

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code,
            {self.language_code: 1})

    def test_create_translation_suggestions_diff_lang_raises_translation_counts(
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('en')

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code,
            {'hi': 1, 'en': 1})

    def test_create_translation_suggestions_eq_lang_increases_translation_count(
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('hi')

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {'hi': 2})

    def test_accept_translation_suggestion_lowers_translation_suggestion_count(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_with_language_code(
                self.language_code))
        # Assert that the translation suggestion count increased.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code,
            {self.language_code: 1})

        suggestion_services.accept_suggestion(
            translation_suggestion.suggestion_id, self.reviewer_id,
                self.COMMIT_MESSAGE, 'review message')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_reject_translation_suggestion_lowers_translation_suggestion_count(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_with_language_code(
                self.language_code))
        # Assert that the translation suggestion count increased.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code,
            {self.language_code: 1})

        suggestion_services.reject_suggestion(
            translation_suggestion.suggestion_id, self.reviewer_id,
            'review message')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_reject_one_translation_suggestion_diff_lang_lowers_only_one_count(
        self
    ) -> None:
        translation_suggestion_1 = (
            self._create_translation_suggestion_with_language_code('hi'))
        # Create a translation suggestion in a different language that won't be
        # rejected.
        self._create_translation_suggestion_with_language_code('en')
        # Assert that the translation suggestion count increased.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code,
            {'hi': 1, 'en': 1})

        suggestion_services.reject_suggestion(
            translation_suggestion_1.suggestion_id, self.reviewer_id,
            'review message')

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {'en': 1})

    def test_reject_translation_suggestions_diff_lang_lowers_translation_count(
        self
    ) -> None:
        translation_suggestion_1 = (
            self._create_translation_suggestion_with_language_code('hi'))
        translation_suggestion_2 = (
            self._create_translation_suggestion_with_language_code('en'))
        # Assert that the translation suggestion count increased.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code,
            {'hi': 1, 'en': 1})

        suggestion_services.reject_suggestions(
            [
                translation_suggestion_1.suggestion_id,
                translation_suggestion_2.suggestion_id
            ], self.reviewer_id, 'review message')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_reject_translation_suggestions_same_lang_lowers_translation_count(
        self
    ) -> None:
        translation_suggestion_1 = (
            self._create_translation_suggestion_with_language_code(
                self.language_code))
        translation_suggestion_2 = (
            self._create_translation_suggestion_with_language_code(
                self.language_code))
        # Assert that the translation suggestion count increased.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code,
            {self.language_code: 2})

        suggestion_services.reject_suggestions(
            [
                translation_suggestion_1.suggestion_id,
                translation_suggestion_2.suggestion_id
            ], self.reviewer_id, 'review message')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_reject_suggestions_diff_type_decreases_suggestion_counts(
        self
    ) -> None:
        suggestion_1 = (
            self._create_translation_suggestion_with_language_code('hi'))
        suggestion_2 = (
            self._create_translation_suggestion_with_language_code('en'))
        suggestion_3 = self._create_edit_state_content_suggestion()
        suggestion_4 = self._create_question_suggestion()
        # Assert that the suggestion counts increased.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 1)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code,
            {'hi': 1, 'en': 1})

        suggestion_services.reject_suggestions(
            [
                suggestion_1.suggestion_id, suggestion_2.suggestion_id,
                suggestion_3.suggestion_id, suggestion_4.suggestion_id
            ], self.reviewer_id, 'review message')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_create_suggestions_diff_type_increases_suggestion_counts(
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('en')
        self._create_question_suggestion()

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 1)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code,
            {'hi': 1, 'en': 1})


class GetSuggestionsWaitingTooLongForReviewInfoForAdminsUnitTests(
        test_utils.GenericTestBase):
    """Test the ability of the
    get_info_about_suggestions_waiting_too_long_for_review method in suggestion
    services, which is used to retrieve the information required to notify
    admins if there are suggestions that have waited longer than
    suggestion_models.SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS days for a
    review on the Contributor Dashboard.
    """

    target_id: str = 'exp1'
    skill_id: str = 'skill_123456'
    language_code: str = 'en'
    AUTHOR_EMAIL: str = 'author@example.com'
    REVIEWER_1_EMAIL: str = 'reviewer1@community.org'
    REVIEWER_2_EMAIL: str = 'reviewer2@community.org'
    COMMIT_MESSAGE: str = 'commit message'
    mocked_datetime_utcnow: datetime.datetime = (
        datetime.datetime(2020, 6, 15, 5)
    )

    def _create_translation_suggestion(
        self
    ) -> suggestion_registry.SuggestionTranslateContent:
        """Creates a translation suggestion."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': self.language_code,
            'content_html': feconf.DEFAULT_STATE_CONTENT_STR,
            'translation_html': '<p>This is the translated content.</p>',
            'data_format': 'html'
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_translation_change_dict,
            'test description'
        )

    def _create_question_suggestion(
        self
    ) -> suggestion_registry.SuggestionAddQuestion:
        """Creates a question suggestion."""
        content_id_generator = translation_domain.ContentIdGenerator()
        add_question_change_dict: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': self.language_code,
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': self.skill_id,
            'skill_difficulty': 0.3
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            self.skill_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_question_change_dict,
            'test description'
        )

    def _create_reviewable_suggestion_email_infos_from_suggestions(
        self, suggestions: List[suggestion_registry.BaseSuggestion]
    ) -> List[suggestion_registry.ReviewableSuggestionEmailInfo]:
        """Creates a list of ReviewableSuggestionEmailInfo objects from
        the given suggestions.
        """

        return [
            (
                suggestion_services
                .create_reviewable_suggestion_email_info_from_suggestion(
                    suggestion)
            ) for suggestion in suggestions
        ]

    def _assert_reviewable_suggestion_email_infos_are_in_correct_order(
        self, reviewable_suggestion_email_infos: List[
            suggestion_registry.ReviewableSuggestionEmailInfo
        ],
        expected_reviewable_suggestion_email_infos: List[
            suggestion_registry.ReviewableSuggestionEmailInfo
        ]
    ) -> None:
        """Asserts that the reviewable suggestion email infos are equal to the
        expected reviewable suggestion email infos and that the reviewable
        suggestion email infos are sorted in descending order according to
        review wait time.
        """
        self.assertEqual(
            len(reviewable_suggestion_email_infos),
            len(expected_reviewable_suggestion_email_infos)
        )
        for index, reviewable_suggestion_email_info in enumerate(
                reviewable_suggestion_email_infos):
            self.assertEqual(
                reviewable_suggestion_email_info.suggestion_type,
                expected_reviewable_suggestion_email_infos[
                    index].suggestion_type)
            self.assertEqual(
                reviewable_suggestion_email_info.language_code,
                expected_reviewable_suggestion_email_infos[
                    index].language_code)
            self.assertEqual(
                reviewable_suggestion_email_info.suggestion_content,
                expected_reviewable_suggestion_email_infos[
                    index].suggestion_content)
            self.assertEqual(
                reviewable_suggestion_email_info.submission_datetime,
                expected_reviewable_suggestion_email_infos[
                    index].submission_datetime)
        for index in range(len(reviewable_suggestion_email_infos) - 1):
            self.assertLessEqual(
                reviewable_suggestion_email_infos[index].submission_datetime,
                reviewable_suggestion_email_infos[
                    index + 1].submission_datetime
            )

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_1_EMAIL, 'reviewer1')
        self.reviewer_1_id = self.get_user_id_from_email(
            self.REVIEWER_1_EMAIL)
        self.signup(self.REVIEWER_2_EMAIL, 'reviewer2')
        self.reviewer_2_id = self.get_user_id_from_email(
            self.REVIEWER_2_EMAIL)
        self.save_new_valid_exploration(self.target_id, self.author_id)
        self.save_new_skill(self.skill_id, self.author_id)

    def test_get_returns_empty_for_suggestion_type_not_on_contributor_dashboard(
        self
    ) -> None:
        self._create_translation_suggestion()
        # This mocked list cannot be empty because then the storage query in the
        # get_suggestions_waiting_too_long_for_review method will fail.
        mocked_contributor_dashboard_suggestion_types = [
            feconf.SUGGESTION_TYPE_ADD_QUESTION]

        with self.swap(
            feconf, 'CONTRIBUTOR_DASHBOARD_SUGGESTION_TYPES',
            mocked_contributor_dashboard_suggestion_types):
            with self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0):
                info_about_suggestions_waiting_too_long_for_review = (
                    suggestion_services
                    .get_info_about_suggestions_waiting_too_long_for_review()
                )

        self.assertEqual(
            len(info_about_suggestions_waiting_too_long_for_review), 0)

    def test_get_returns_empty_if_suggestion_review_wait_time_diff_is_negative(
        self
    ) -> None:
        self._create_translation_suggestion()

        # Make sure the threshold is nonzero.
        with self.swap(
            suggestion_models,
            'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 1):
            info_about_suggestions_waiting_too_long_for_review = (
                suggestion_services
                .get_info_about_suggestions_waiting_too_long_for_review()
            )

        self.assertEqual(
            len(info_about_suggestions_waiting_too_long_for_review), 0)

    def test_get_returns_empty_if_suggestions_have_waited_less_than_threshold(
        self
    ) -> None:
        with self.mock_datetime_utcnow(self.mocked_datetime_utcnow):
            self._create_translation_suggestion()
            self._create_question_suggestion()
        mocked_threshold_review_wait_time_in_days = 2
        mocked_datetime_less_than_review_wait_time_threshold = (
            self.mocked_datetime_utcnow + datetime.timedelta(days=1))

        with self.mock_datetime_utcnow(
            mocked_datetime_less_than_review_wait_time_threshold):
            with self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS',
                mocked_threshold_review_wait_time_in_days):
                info_about_suggestions_waiting_too_long_for_review = (
                    suggestion_services
                    .get_info_about_suggestions_waiting_too_long_for_review()
                )

        self.assertEqual(
            len(info_about_suggestions_waiting_too_long_for_review), 0)

    def test_get_new_suggestions_for_reviewer_notifications_past_threshold(
        self) -> None:
        max_suggestions = 3
        threshold_days = 2
        creation_time = datetime.datetime(2020, 6, 14, 5)
        creation_time_in_millisecs = int(creation_time.timestamp() * 1000)
        mock_value = creation_time_in_millisecs

        mock_get_current_time_in_millisecs = lambda: mock_value

        with self.swap(
            utils, 'get_current_time_in_millisecs',
            mock_get_current_time_in_millisecs):
            with self.mock_datetime_utcnow(self.mocked_datetime_utcnow):

                # Create and save new suggestion models.
                suggestions = []
                for _ in range(1, max_suggestions + 1):
                    suggestion = self._create_translation_suggestion()
                    suggestions.append(suggestion)

                # Set the review wait time threshold.
                with self.swap(
                    suggestion_models,
                    'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS',
                    threshold_days):
                    suggestion_info = (
                        suggestion_services.
                            get_new_suggestions_for_reviewer_notifications())

                # Assert that the correct number of suggestions is returned.
                self.assertEqual(len(suggestion_info), 3)

    def test_get_returns_empty_if_suggestions_have_waited_threshold_review_time(
        self
    ) -> None:
        with self.mock_datetime_utcnow(self.mocked_datetime_utcnow):
            self._create_translation_suggestion()
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
                info_about_suggestions_waiting_too_long_for_review = (
                    suggestion_services
                    .get_info_about_suggestions_waiting_too_long_for_review()
                )

        self.assertEqual(
            len(info_about_suggestions_waiting_too_long_for_review), 0)

    def test_get_returns_suggestion_waited_long_if_their_wait_is_past_threshold(
        self
    ) -> None:
        with self.mock_datetime_utcnow(self.mocked_datetime_utcnow):
            translation_suggestion = self._create_translation_suggestion()
        # Give the question suggestion a slightly different review submission
        # time so that the suggestions are not indistinguishable, in terms of
        # their review submission time.
        with self.mock_datetime_utcnow(
            self.mocked_datetime_utcnow + datetime.timedelta(minutes=5)):
            question_suggestion = self._create_question_suggestion()
        expected_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [translation_suggestion, question_suggestion]))
        mocked_threshold_review_wait_time_in_days = 1
        mocked_datetime_past_review_wait_time_threshold = (
            self.mocked_datetime_utcnow + datetime.timedelta(days=2))

        with self.mock_datetime_utcnow(
            mocked_datetime_past_review_wait_time_threshold):
            with self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS',
                mocked_threshold_review_wait_time_in_days):
                info_about_suggestions_waiting_too_long_for_review = (
                    suggestion_services
                    .get_info_about_suggestions_waiting_too_long_for_review()
                )

        self.assertEqual(
            len(info_about_suggestions_waiting_too_long_for_review), 2)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            info_about_suggestions_waiting_too_long_for_review,
            expected_suggestion_email_infos
        )

    def test_get_only_returns_suggestions_that_have_waited_past_wait_threshold(
        self
    ) -> None:
        with self.mock_datetime_utcnow(self.mocked_datetime_utcnow):
            translation_suggestion = self._create_translation_suggestion()
        with self.mock_datetime_utcnow(
            self.mocked_datetime_utcnow + datetime.timedelta(days=2)):
            self._create_question_suggestion()
        expected_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [translation_suggestion]))
        mocked_threshold_review_wait_time_in_days = 3
        mocked_datetime_past_review_wait_time_threshold = (
            self.mocked_datetime_utcnow + datetime.timedelta(days=4))

        with self.mock_datetime_utcnow(
            mocked_datetime_past_review_wait_time_threshold):
            with self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS',
                mocked_threshold_review_wait_time_in_days):
                info_about_suggestions_waiting_too_long_for_review = (
                    suggestion_services
                    .get_info_about_suggestions_waiting_too_long_for_review()
                )

        # The question suggestion was created 2 days after the translation
        # suggestion, so it has only waited 1 day for a review, which is less
        # than 3, the mocked review wait time threshold. Therefore, only the
        # translation suggestion has waited too long for review.
        self.assertEqual(
            len(info_about_suggestions_waiting_too_long_for_review), 1)
        self._assert_reviewable_suggestion_email_infos_are_in_correct_order(
            info_about_suggestions_waiting_too_long_for_review,
            expected_suggestion_email_infos
        )


class GetSuggestionTypesThatNeedReviewersUnitTests(test_utils.GenericTestBase):
    """Tests for the get_suggestion_types_that_need_reviewers method."""

    sample_language_code: str = 'en'
    target_id: str = 'exp1'
    skill_id: str = 'skill_123456'
    language_code: str = 'en'
    AUTHOR_EMAIL: Final = 'author@example.com'
    REVIEWER_EMAIL: Final = 'reviewer@community.org'

    def _create_translation_suggestion_with_language_code(
        self, language_code: str
    ) -> suggestion_registry.SuggestionTranslateContent:
        """Creates a translation suggestion in the given language_code."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': language_code,
            'content_html': feconf.DEFAULT_STATE_CONTENT_STR,
            'translation_html': '<p>This is the translated content.</p>',
            'data_format': 'html'
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_translation_change_dict,
            'test description'
        )

    def _create_question_suggestion(
        self
    ) -> suggestion_registry.SuggestionAddQuestion:
        """Creates a question suggestion."""
        content_id_generator = translation_domain.ContentIdGenerator()
        add_question_change_dict: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': constants.DEFAULT_LANGUAGE_CODE,
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': self.skill_id,
            'skill_difficulty': 0.3
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            self.skill_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_question_change_dict,
            'test description'
        )

    def _assert_community_contribution_stats_is_in_default_state(
        self
    ) -> None:
        """Checks if the community contribution stats is in its default
        state.
        """
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats())
        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code
            ), {})
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code
            ), {})
        self.assertEqual(
            community_contribution_stats.question_reviewer_count, 0)
        self.assertEqual(
            community_contribution_stats.question_suggestion_count, 0)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.save_new_valid_exploration(self.target_id, self.author_id)
        self.save_new_skill(self.skill_id, self.author_id)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(
            self.REVIEWER_EMAIL)

    def test_get_returns_no_reviewers_needed_if_no_suggestions_exist(
        self
    ) -> None:
        self._assert_community_contribution_stats_is_in_default_state()

        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())

        self.assertDictEqual(suggestion_types_needing_reviewers, {})

    def test_get_returns_no_reviewers_needed_if_question_reviewer_no_question(
        self
    ) -> None:
        user_services.allow_user_to_review_question(self.reviewer_id)
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())

        self.assertDictEqual(suggestion_types_needing_reviewers, {})

    def test_get_returns_not_needed_if_translation_reviewers_but_no_translation(
        self
    ) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'en')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'fr')
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'en': 1, 'fr': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())

        self.assertDictEqual(suggestion_types_needing_reviewers, {})

    def test_get_returns_no_reviewers_needed_if_enough_translation_reviewers(
        self
    ) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'en')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'fr')
        self._create_translation_suggestion_with_language_code('en')
        self._create_translation_suggestion_with_language_code('fr')
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'en': 1, 'fr': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {
                'en': 1, 'fr': 1})

        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())

        self.assertDictEqual(suggestion_types_needing_reviewers, {})

    def test_get_returns_no_reviewers_needed_if_enough_question_reviewers(
        self
    ) -> None:
        user_services.allow_user_to_review_question(self.reviewer_id)
        self._create_question_suggestion()
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 1)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())

        self.assertDictEqual(suggestion_types_needing_reviewers, {})

    def test_get_returns_reviewers_needed_if_question_but_no_reviewers(
        self
    ) -> None:
        self._create_question_suggestion()
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 1)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())

        self.assertDictEqual(
            suggestion_types_needing_reviewers,
            {feconf.SUGGESTION_TYPE_ADD_QUESTION: set()})

    def test_get_returns_reviewers_needed_if_translation_for_a_lang_no_reviewer(
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code(
            self.sample_language_code)
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {
                self.sample_language_code: 1})

        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())

        self.assertDictEqual(
            suggestion_types_needing_reviewers,
            {feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: {
                self.sample_language_code}})

    def test_get_returns_reviewers_needed_if_translation_for_langs_no_reviewers(
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code('en')
        self._create_translation_suggestion_with_language_code('fr')
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {
                'en': 1, 'fr': 1})

        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())

        self.assertDictEqual(
            suggestion_types_needing_reviewers,
            {feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: {'en', 'fr'}})

    def test_get_returns_reviewers_needed_if_multi_suggestion_types_no_reviewer(
        self
    ) -> None:
        self._create_question_suggestion()
        self._create_translation_suggestion_with_language_code('en')
        self._create_translation_suggestion_with_language_code('fr')
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 1)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code,
            {'en': 1, 'fr': 1})

        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())

        self.assertDictEqual(
            suggestion_types_needing_reviewers,
            {
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: {
                    'en', 'fr'},
                feconf.SUGGESTION_TYPE_ADD_QUESTION: set()
            })


class EmailsTaskqueueTests(test_utils.GenericTestBase):
    """Tests for tasks in emails taskqueue."""

    def test_create_new_instant_task(self) -> None:
        user_id = 'user'
        (
            suggestion_services
            .enqueue_contributor_ranking_notification_email_task(
                user_id, feconf.CONTRIBUTION_TYPE_TRANSLATION,
                feconf.CONTRIBUTION_SUBTYPE_ACCEPTANCE, 'hi',
                'Initial Contributor'
            ))

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_EMAILS),
            1)

        tasks = self.get_pending_tasks(
            queue_name=taskqueue_services.QUEUE_NAME_EMAILS)
        self.assertEqual(
            tasks[0].url,
            feconf
            .TASK_URL_CONTRIBUTOR_DASHBOARD_ACHIEVEMENT_NOTIFICATION_EMAILS)
        # Ruling out the possibility of None for mypy type checking.
        assert tasks[0].payload is not None
        self.assertEqual(
            tasks[0].payload['contributor_user_id'], user_id)
        self.assertEqual(
            tasks[0].payload['contribution_type'],
            feconf.CONTRIBUTION_TYPE_TRANSLATION)
        self.assertEqual(
            tasks[0].payload['contribution_sub_type'],
            feconf.CONTRIBUTION_SUBTYPE_ACCEPTANCE)
        self.assertEqual(tasks[0].payload['language_code'], 'hi')
        self.assertEqual(
            tasks[0].payload['rank_name'], 'Initial Contributor')

    def test_create_email_task_raises_exception_for_invalid_language_code(
        self
    ) -> None:
        user_id = 'user'
        with self.assertRaisesRegex(
            Exception,
            'Not supported language code: error'):
            (
                suggestion_services
                .enqueue_contributor_ranking_notification_email_task
            )(
                user_id, feconf.CONTRIBUTION_TYPE_TRANSLATION,
                feconf.CONTRIBUTION_SUBTYPE_ACCEPTANCE, 'error',
                'Initial Contributor'
            )

    def test_create_email_task_raises_exception_for_invalid_contribution_type(
        self
    ) -> None:
        user_id = 'user'
        with self.assertRaisesRegex(
            Exception,
            'Invalid contribution type: test'):
            (
                suggestion_services
                .enqueue_contributor_ranking_notification_email_task
            )(
                user_id, 'test',
                feconf.CONTRIBUTION_SUBTYPE_ACCEPTANCE, 'hi',
                'Initial Contributor'
            )

    def test_create_email_task_raises_exception_for_wrong_contribution_subtype(
        self
    ) -> None:
        user_id = 'user'
        with self.assertRaisesRegex(
            Exception,
            'Invalid contribution subtype: test'):
            (
                suggestion_services
                .enqueue_contributor_ranking_notification_email_task
            )(
                user_id, feconf.CONTRIBUTION_TYPE_TRANSLATION,
                'test', 'hi',
                'Initial Contributor'
            )


class ContributorCertificateTests(test_utils.GenericTestBase):
    """Tests for contributor certificate generation."""

    AUTHOR_EMAIL: Final = 'author@example.com'

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.username = user_services.get_username(self.author_id)
        self.from_date = datetime.datetime.today() - datetime.timedelta(days=1)
        self.to_date = datetime.datetime.today() + datetime.timedelta(days=1)

    def _get_change_with_normalized_string(self) -> Mapping[
        str, change_domain.AcceptableChangeDictTypes]:
        """Provides change_cmd dictionary with normalized translation html.

        Returns:
            Mapping[str, change_domain.AcceptableChangeDictTypes]. A dictionary
            of the change_cmd object for the translations.
        """
        return {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>A content to translate.</p>',
            'state_name': 'Introduction',
            'translation_html': ['translated text1', 'translated text2'],
            'data_format': 'set_of_normalized_string'
        }

    def _calculate_translation_contribution_hours(
        self, numer_of_words: int
    ) -> str:
        """Provides translatoin contribution hours when number of translated
        words are provided. We calculate the time taken to translate
        a word according to the following document.
        https://docs.google.com/spreadsheets/d/1ykSNwPLZ5qTCkuO21VLdtm_2SjJ5QJ0z0PlVjjSB4ZQ/edit#gid=0

        Args:
            numer_of_words: int. The number of translated words.

        Returns:
            str. A string that represent the translatoin contribution hours.
        """
        return str(round(numer_of_words / 300, 2))

    def _calculate_question_contribution_hours(
        self, images_included: bool
    ) -> str:
        """Provides question contribution hours when number of questions
        are provided. We calculate the time taken to submit
        a question according to the following document.
        https://docs.google.com/spreadsheets/d/1ykSNwPLZ5qTCkuO21VLdtm_2SjJ5QJ0z0PlVjjSB4ZQ/edit#gid=0

        Args:
            images_included: bool. A flag that says whether the question
                contains images.

        Returns:
            str. A string that represent the question contribution hours.
        """
        minutes_contributed = 0

        if images_included:
            minutes_contributed += 20
        else:
            minutes_contributed += 12
        return str(round(minutes_contributed / 60, 2))

    def test_create_translation_contributor_certificate(self) -> None:
        score_category: str = ('%s%sEnglish' % (
            suggestion_models.SCORE_TYPE_TRANSLATION,
            suggestion_models.SCORE_CATEGORY_DELIMITER)
        )
        change_cmd = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': '',
            'state_name': 'Introduction',
            'translation_html': '<p>Translation for content.</p>',
            'data_format': 'html'
        }
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', 1, suggestion_models.STATUS_ACCEPTED, self.author_id,
            'reviewer_1', change_cmd, score_category,
            'exploration.exp1.thread_6', 'hi')

        certificate_data = (
            suggestion_services.generate_contributor_certificate_data(
                self.username,
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                'hi',
                self.from_date,
                self.to_date,
            ))

        # Ruling out the possibility of None for mypy type checking.
        assert certificate_data is not None

        self.assertEqual(
            certificate_data['contribution_hours'],
            self._calculate_translation_contribution_hours(3)
        )
        self.assertEqual(certificate_data['language'], 'Hindi')

    def test_create_translation_contributor_certificate_for_rule_translation(
        self
    ) -> None:
        score_category: str = '%s%sEnglish' % (
            suggestion_models.SCORE_TYPE_TRANSLATION,
            suggestion_models.SCORE_CATEGORY_DELIMITER
        )

        change_cmd = self._get_change_with_normalized_string()
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', 1, suggestion_models.STATUS_ACCEPTED, self.author_id,
            'reviewer_1', change_cmd, score_category,
            'exploration.exp1.thread_6', 'hi')

        certificate_data = (
            suggestion_services.generate_contributor_certificate_data(
                self.username,
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                'hi',
                self.from_date,
                self.to_date,
            ))

        # Ruling out the possibility of None for mypy type checking.
        assert certificate_data is not None

        self.assertEqual(
            certificate_data['contribution_hours'],
            self._calculate_translation_contribution_hours(4)
        )
        self.assertEqual(certificate_data['language'], 'Hindi')

    def test_create_translation_contributor_certificate_for_english(
        self
    ) -> None:
        score_category: str = '%s%sEnglish' % (
            suggestion_models.SCORE_TYPE_TRANSLATION,
            suggestion_models.SCORE_CATEGORY_DELIMITER
        )

        change_cmd = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'content_id': 'content',
            'language_code': 'en',
            'content_html': '',
            'state_name': 'Introduction',
            'translation_html': '<p>Translation for content.</p>',
            'data_format': 'html'
        }
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', 1, suggestion_models.STATUS_ACCEPTED, self.author_id,
            'reviewer_1', change_cmd, score_category,
            'exploration.exp1.thread_6', 'en')

        certificate_data = (
            suggestion_services.generate_contributor_certificate_data(
                self.username,
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                'en',
                self.from_date,
                self.to_date,
            ))

        # Ruling out the possibility of None for mypy type checking.
        assert certificate_data is not None

        self.assertEqual(
            certificate_data['contribution_hours'],
            self._calculate_translation_contribution_hours(3)
        )
        self.assertEqual(certificate_data['language'], 'English')

    def test_create_question_contributor_certificate(self) -> None:
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': 1,
            'skill_difficulty': 0.3
        }
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(suggestion_change['question_dict'], dict)
        test_question_dict: question_domain.QuestionDict = (
            suggestion_change['question_dict']
        )

        question_state_data = test_question_dict['question_state_data']
        question_state_data['content']['html'] = '<p>No image content</p>'
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'skill_1', 1,
            suggestion_models.STATUS_ACCEPTED, self.author_id,
            'reviewer_2', suggestion_change, 'category1',
            'thread_1', 'en')

        certificate_data = (
            suggestion_services.generate_contributor_certificate_data(
                self.username,
                feconf.SUGGESTION_TYPE_ADD_QUESTION,
                None,
                self.from_date,
                self.to_date,
            ))

        # Ruling out the possibility of None for mypy type checking.
        assert certificate_data is not None

        self.assertEqual(
            certificate_data['contribution_hours'],
            self._calculate_question_contribution_hours(False)
        )

    def test_create_question_contributor_certificate_with_image_content(
        self
    ) -> None:
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': 1,
            'skill_difficulty': 0.3
        }
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(suggestion_change['question_dict'], dict)
        test_question_dict: question_domain.QuestionDict = (
            suggestion_change['question_dict']
        )

        question_state_data = test_question_dict['question_state_data']
        question_state_data['content']['html'] = (
            '<oppia-noninteractive-image></oppia-noninteractive-image>')
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            'skill_1', 1,
            suggestion_models.STATUS_ACCEPTED, self.author_id,
            'reviewer_2', suggestion_change, 'category1',
            'thread_1', 'en')

        certificate_data = (
            suggestion_services.generate_contributor_certificate_data(
                self.username,
                feconf.SUGGESTION_TYPE_ADD_QUESTION,
                None,
                self.from_date,
                self.to_date,
            ))

        # Ruling out the possibility of None for mypy type checking.
        assert certificate_data is not None

        self.assertEqual(
            certificate_data['contribution_hours'],
            self._calculate_question_contribution_hours(True)
        )

    def test_create_certificate_returns_none_for_no_translation_suggestions(
        self
    ) -> None:
        certificate_data = (
            suggestion_services.generate_contributor_certificate_data(
                self.username,
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                'hi',
                self.from_date,
                self.to_date,
            ))

        self.assertIsNone(certificate_data)

    def test_create_certificate_returns_none_for_no_question_suggestions(
        self
    ) -> None:
        certificate_data = (
            suggestion_services.generate_contributor_certificate_data(
                self.username,
                feconf.SUGGESTION_TYPE_ADD_QUESTION,
                None,
                self.from_date,
                self.to_date,
            ))

        self.assertIsNone(certificate_data)

    def test_create_contributor_certificate_raises_exception_for_wrong_language(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'The provided language is invalid.'
        ):
            suggestion_services.generate_contributor_certificate_data(
                self.username,
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                'test',
                self.from_date,
                self.to_date,
            )

    def test_create_contributor_certificate_raises_exception_for_wrong_username(
        self
    ) -> None:
        username = 'wrong_user'

        with self.assertRaisesRegex(
            Exception, 'There is no user for the given username.'
        ):
            suggestion_services.generate_contributor_certificate_data(
                username,
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                'hi',
                self.from_date,
                self.to_date,
            )

    def test_create_contributor_certificate_raises_exception_for_wrong_type(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'The suggestion type is invalid.'
        ):
            suggestion_services.generate_contributor_certificate_data(
                self.username,
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                'test',
                self.from_date,
                self.to_date,
            )
