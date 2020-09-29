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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

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
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

(suggestion_models, feedback_models, user_models) = (
    models.Registry.import_models(
        [models.NAMES.suggestion, models.NAMES.feedback, models.NAMES.user]
    )
)


class SuggestionServicesUnitTests(test_utils.GenericTestBase):
    """Test the functions in suggestion_services."""

    score_category = (
        suggestion_models.SCORE_TYPE_CONTENT +
        suggestion_models.SCORE_CATEGORY_DELIMITER + 'Algebra')

    target_id = 'exp1'
    target_id_2 = 'exp2'
    target_id_3 = 'exp3'
    target_version_at_submission = 1
    change = {
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
        'state_name': 'state_1',
        'new_value': {
            'content_id': 'content',
            'html': 'new suggestion content'
        }
    }

    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    NORMAL_USER_EMAIL = 'normal@example.com'

    THREAD_ID = 'exploration.exp1.thread_1'

    COMMIT_MESSAGE = 'commit message'
    EMPTY_COMMIT_MESSAGE = ' '

    suggestion_id = THREAD_ID
    suggestion_id_2 = 'exploration.exp2.thread_2'
    suggestion_id_3 = 'exploration.exp3.thread_3'

    def setUp(self):
        super(SuggestionServicesUnitTests, self).setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.signup(self.NORMAL_USER_EMAIL, 'normaluser')
        self.normal_user_id = self.get_user_id_from_email(
            self.NORMAL_USER_EMAIL)
        self.save_new_valid_exploration(
            self.target_id, self.author_id, category='Algebra')

    def assert_suggestion_status(self, suggestion_id, status):
        """Assert the status of the suggestion with suggestion_id."""
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        self.assertEqual(suggestion.status, status)

    def mock_accept_suggestion(
            self, suggestion_id, reviewer_id, commit_message, review_message):
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
                        'get_change_list_for_accepting_suggestion',
                        self.mock_get_change_list_does_nothing):
                        suggestion_services.accept_suggestion(
                            suggestion_id, reviewer_id,
                            commit_message, review_message)

    def mock_create_suggestion(self, target_id):
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
                    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                    suggestion_models.TARGET_TYPE_EXPLORATION,
                    target_id, self.target_version_at_submission,
                    self.author_id, self.change, 'test description')

    def mock_generate_new_thread_id(self, entity_type, exp_id):
        thread_id = 'thread_%s' % exp_id[-1]
        return '.'.join([entity_type, exp_id, thread_id])

    class MockExploration(python_utils.OBJECT):
        """Mocks an exploration. To be used only for testing."""

        def __init__(self, exploration_id, states):
            self.id = exploration_id
            self.states = states
            self.category = 'Algebra'

    # All mock explorations created for testing.
    explorations = [
        MockExploration('exp1', {'state_1': {}, 'state_2': {}}),
        MockExploration('exp2', {'state_1': {}, 'state_2': {}}),
        MockExploration('exp3', {'state_1': {}, 'state_2': {}})
    ]

    def mock_get_exploration_by_id(self, exp_id):
        for exp in self.explorations:
            if exp.id == exp_id:
                return exp

    def mock_pre_accept_validate_does_nothing(self):
        pass

    def mock_get_change_list_does_nothing(self):
        pass

    def mock_accept_does_nothing(self, unused_arg):
        pass

    def test_create_new_suggestion_successfully(self):
        expected_suggestion_dict = {
            'suggestion_id': 'exploration.exp1.thread_1',
            'suggestion_type': (
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
            'target_id': self.target_id,
            'target_version_at_submission': self.target_version_at_submission,
            'status': suggestion_models.STATUS_IN_REVIEW,
            'author_name': 'author',
            'change': {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'state_1',
                'new_value': {
                    'content_id': 'content',
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

    def test_cannot_create_suggestion_with_invalid_suggestion_type(self):
        with self.assertRaisesRegexp(Exception, 'Invalid suggestion type'):
            suggestion_services.create_suggestion(
                'invalid_suggestion_type',
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, self.change, 'test description')

    def test_cannot_create_suggestion_with_invalid_author_id(self):
        with self.assertRaisesRegexp(
            Exception, 'Expected author_id to be in a valid user ID format'):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                'invalid author ID', self.change, 'test description')

    def test_cannot_create_translation_suggestion_with_invalid_content_html_raise_error(self): # pylint: disable=line-too-long
        add_translation_change_dict = {
            'cmd': 'add_translation',
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': '<p>The invalid content html</p>',
            'translation_html': '<p>Translation for invalid content.</p>'
        }
        with self.assertRaisesRegexp(
            Exception,
            'The given content_html does not match the content of the '
            'exploration.'):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, add_translation_change_dict, 'test description')

    def test_get_all_stale_suggestion_ids(self):
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, self.change, 'test description')

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
            self, unused_user_id, unused_exploration_id, unused_change_list,
            commit_message, is_suggestion):
        self.assertTrue(is_suggestion)
        self.assertEqual(
            commit_message, 'Accepted suggestion by %s: %s' % (
                'author', self.COMMIT_MESSAGE))

    def test_cannot_reject_suggestion_with_empty_review_message(self):
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, self.change, 'test description')

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', self.target_id)])[0]
        self.assert_suggestion_status(
            suggestion.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

        with self.assertRaisesRegexp(
            Exception, 'Review message cannot be empty.'):
            suggestion_services.reject_suggestion(
                suggestion.suggestion_id, self.reviewer_id, '')

        # Assert that the suggestion was not rejected.
        self.assert_suggestion_status(
            suggestion.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

    def test_accept_suggestion_and_send_email_to_author(self):
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'state 1',
        })]
        exp_services.update_exploration(
            self.author_id, self.target_id, change_list, 'Add state.')

        new_suggestion_content = state_domain.SubtitledHtml(
            'content', '<p>new suggestion content html</p>').to_dict()
        change_dict = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state 1',
            'new_value': new_suggestion_content
        }

        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
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
        self.assertTrue(user_proficiency_model.onboarding_email_sent)
        self.assertEqual(
            user_proficiency_model.score,
            feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW)

    def test_accept_suggestion_does_not_send_email_if_users_score_is_too_low(
            self):
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
            self):
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

    def test_accept_suggestion_successfully(self):
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
            self):
        expected_exception_regexp = (
            'You cannot accept the suggestion with id %s because it does not '
            'exist.' % (self.suggestion_id)
        )
        with self.assertRaisesRegexp(Exception, expected_exception_regexp):
            self.mock_accept_suggestion(
                self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE,
                'review message')

    def test_accept_suggestion_with_invalid_math_fails(self):
        """Test that the method for accepting suggestions raises error when
        a suggestion with invalid math-tags is tried to be accepted.
        """
        change_dict = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': {
                'content_id': 'content',
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
                    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                    suggestion_models.TARGET_TYPE_EXPLORATION,
                    self.target_id, self.target_version_at_submission,
                    self.author_id, change_dict, 'test description')
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

        expected_exception_regexp = (
            'Invalid math tags found in the suggestion with id %s.' % (
                self.suggestion_id)
        )
        with self.assertRaisesRegexp(Exception, expected_exception_regexp):
            self.mock_accept_suggestion(
                self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE,
                'review message')

        # Assert that the status of the suggestion hasn't changed.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

    def test_accept_suggestion_raises_exception_if_suggestion_already_accepted(
            self):
        self.mock_create_suggestion(self.target_id)
        # Accept the suggestion.
        self.mock_accept_suggestion(
            self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE, None)
        # Assert that the suggestion has been accepted.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_ACCEPTED)

        expected_exception_regexp = (
            'The suggestion with id %s has already been accepted/rejected.' % (
                self.suggestion_id)
        )
        with self.assertRaisesRegexp(Exception, expected_exception_regexp):
            suggestion_services.accept_suggestion(
                self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE, None)

    def test_accept_suggestion_raises_exception_if_suggestion_already_rejected(
            self):
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
        with self.assertRaisesRegexp(Exception, expected_exception_regexp):
            suggestion_services.accept_suggestion(
                self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE, None)

        # Assert that the suggestion is still rejected.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_REJECTED)

    def test_accept_suggestion_invalid_suggestion_failure(self):
        self.mock_create_suggestion(self.target_id)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

        # Invalidating the suggestion.
        suggestion.score_category = 'invalid_score_category'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected score_category to be of the form '
                                   'score_type.score_sub_type, received '
                                   'invalid_score_category'):
            suggestion_services._update_suggestion(suggestion) # pylint: disable=protected-access

    def test_accept_suggestion_no_commit_message_failure(self):
        self.mock_create_suggestion(self.target_id)
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

        with self.assertRaisesRegexp(
            Exception, 'Commit message cannot be empty.'):
            suggestion_services.accept_suggestion(
                self.suggestion_id, self.reviewer_id,
                self.EMPTY_COMMIT_MESSAGE, None)

        # Assert that the status of the suggestion didn't change.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_IN_REVIEW)

    def test_reject_suggestion_successfully(self):
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

    def test_reject_suggestions_successfully(self):
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
            self):
        expected_exception_regexp = (
            'You cannot reject the suggestion with id %s because it does not '
            'exist.' % (self.suggestion_id)
        )
        with self.assertRaisesRegexp(Exception, expected_exception_regexp):
            suggestion_services.reject_suggestion(
                self.suggestion_id, self.reviewer_id, 'review message')

    def test_reject_suggestion_raises_exception_if_suggestion_already_accepted(
            self):
        self.mock_create_suggestion(self.target_id)
        # Accept the suggestion.
        self.mock_accept_suggestion(
            self.suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE, None)
        # Assert that the suggestion has been accepted.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_ACCEPTED)

        # Rejecting the suggestion should not work because the suggestion has
        # already been accepted.
        expected_exception_regexp = (
            'The suggestion with id %s has already been accepted/rejected.' % (
                self.suggestion_id)
        )
        with self.assertRaisesRegexp(Exception, expected_exception_regexp):
            suggestion_services.reject_suggestion(
                self.suggestion_id, self.reviewer_id, 'reject review message')

        # Assert that the suggestion's status did not change.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_ACCEPTED)

    def test_reject_suggestion_raises_exception_if_suggestion_already_rejected(
            self):
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
        with self.assertRaisesRegexp(Exception, expected_exception_regexp):
            suggestion_services.reject_suggestion(
                self.suggestion_id, self.reviewer_id, 'reject review message')

    def test_resubmit_rejected_suggestion_success(self):
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
                'old_value': self.change['new_value']
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
        self.assertEqual(
            suggestion.change.new_value['html'],
            resubmit_change_content['html'])

    def test_resubmit_rejected_suggestion_raises_exception_for_empty_message(
            self):
        self.mock_create_suggestion(self.target_id)

        # Can't resubmit a rejected suggestion if the summary message is empty.
        with self.assertRaisesRegexp(
            Exception, 'Summary message cannot be empty.'):
            suggestion_services.resubmit_rejected_suggestion(
                self.suggestion_id, '', self.author_id, {})

    def test_resubmit_rejected_suggestion_raises_exception_for_unhandled_input(
            self):
        self.mock_create_suggestion(self.target_id)

        # Can't resubmit a rejected suggestion if the suggestion hasn't been
        # rejected yet.
        expected_exception_regexp = (
            'The suggestion with id %s is not yet handled.' % (
                self.suggestion_id)
        )
        with self.assertRaisesRegexp(Exception, expected_exception_regexp):
            suggestion_services.resubmit_rejected_suggestion(
                self.suggestion_id, 'resubmit summary message',
                self.author_id, {}
            )

    def test_resubmit_rejected_suggestion_raises_excep_for_accepted_suggestion(
            self):
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
        with self.assertRaisesRegexp(
            Exception, expected_exception_regexp):
            suggestion_services.resubmit_rejected_suggestion(
                self.suggestion_id, 'resubmit summary message',
                self.author_id, {}
            )

        # Verfiy that the suggestion is still accepted.
        self.assert_suggestion_status(
            self.suggestion_id, suggestion_models.STATUS_ACCEPTED)

    def test_check_can_resubmit_suggestion(self):
        self.mock_create_suggestion(self.target_id)
        can_resubmit = suggestion_services.check_can_resubmit_suggestion(
            self.suggestion_id, self.author_id)
        self.assertEqual(can_resubmit, True)
        can_resubmit = suggestion_services.check_can_resubmit_suggestion(
            self.suggestion_id, self.normal_user_id)
        self.assertEqual(can_resubmit, False)


class SuggestionGetServicesUnitTests(test_utils.GenericTestBase):
    score_category = (
        suggestion_models.SCORE_TYPE_TRANSLATION +
        suggestion_models.SCORE_CATEGORY_DELIMITER + 'English')

    target_id_1 = 'exp1'
    target_id_2 = 'exp2'
    target_id_3 = 'exp3'
    target_version_at_submission = 1
    change = {
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
        'state_name': 'state_1',
        'new_value': 'new suggestion content'
    }

    AUTHOR_EMAIL_1 = 'author1@example.com'
    REVIEWER_EMAIL_1 = 'reviewer1@example.com'

    AUTHOR_EMAIL_2 = 'author2@example.com'
    REVIEWER_EMAIL_2 = 'reviewer2@example.com'

    add_translation_change_dict = {
        'cmd': exp_domain.CMD_ADD_TRANSLATION,
        'state_name': 'state_1',
        'content_id': 'content',
        'language_code': 'hi',
        'content_html': '<p>State name: state_1, Content id: content</p>',
        'translation_html': '<p>This is translated html.</p>'
    }

    class MockExploration(python_utils.OBJECT):
        """Mocks an exploration. To be used only for testing."""

        def __init__(self, exploration_id, states):
            self.id = exploration_id
            self.states = states
            self.category = 'Algebra'

        def get_content_html(self, state_name, content_id):
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

    def mock_get_exploration_by_id(self, exp_id):
        for exp in self.explorations:
            if exp.id == exp_id:
                return exp

    def _create_question_suggestion_with_skill_id(self, skill_id):
        """Creates a question suggestion with the given skill_id."""
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
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1']
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }

        return suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
            suggestion_models.TARGET_TYPE_SKILL, skill_id, 1,
            self.author_id_1, suggestion_change, 'test description'
        )

    def setUp(self):
        super(SuggestionGetServicesUnitTests, self).setUp()

        self.signup(self.AUTHOR_EMAIL_1, 'author1')
        self.author_id_1 = self.get_user_id_from_email(self.AUTHOR_EMAIL_1)
        self.signup(self.REVIEWER_EMAIL_1, 'reviewer1')
        self.reviewer_id_1 = self.get_user_id_from_email(self.REVIEWER_EMAIL_1)

        self.signup(self.AUTHOR_EMAIL_2, 'author2')
        self.author_id_2 = self.get_user_id_from_email(self.AUTHOR_EMAIL_2)
        self.signup(self.REVIEWER_EMAIL_2, 'reviewer2')
        self.reviewer_id_2 = self.get_user_id_from_email(self.REVIEWER_EMAIL_2)

        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):

            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, self.change, 'test description')

            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, self.change, 'test description')

            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, self.change, 'test description')

            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_2, self.change, 'test description')

            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_2, self.target_version_at_submission,
                self.author_id_2, self.change, 'test description')

    def test_get_by_author(self):
        queries = [('author_id', self.author_id_1)]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 3)
        queries = [('author_id', self.author_id_2)]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 2)

    def test_get_by_target_id(self):
        queries = [
            ('target_type', suggestion_models.TARGET_TYPE_EXPLORATION),
            ('target_id', self.target_id_1)
        ]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 4)
        queries = [
            ('target_type', suggestion_models.TARGET_TYPE_EXPLORATION),
            ('target_id', self.target_id_2)
        ]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 1)

    def test_get_by_status(self):
        queries = [('status', suggestion_models.STATUS_IN_REVIEW)]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 5)

    def test_get_by_type(self):
        queries = [(
            'suggestion_type',
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT)]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 5)

    def test_query_suggestions(self):
        queries = [
            ('target_type', suggestion_models.TARGET_TYPE_EXPLORATION),
            ('target_id', self.target_id_1),
            ('author_id', self.author_id_2)
        ]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 1)

        queries = [
            ('target_type', suggestion_models.TARGET_TYPE_EXPLORATION),
            ('target_id', self.target_id_1),
            ('author_id', self.author_id_1),
            ('status', suggestion_models.STATUS_IN_REVIEW)
        ]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 3)

        queries = [
            ('target_type', suggestion_models.TARGET_TYPE_EXPLORATION),
            ('target_id', self.target_id_1),
            ('invalid_field', 'value')
        ]
        with self.assertRaisesRegexp(
            Exception, 'Not allowed to query on field invalid_field'):
            suggestion_services.query_suggestions(queries)

    def test_get_translation_suggestion_ids_with_exp_ids_with_one_exp(self):
        # Create the translation suggestion associated with exploration id
        # target_id_1.
        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html):
                suggestion_services.create_suggestion(
                    suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    suggestion_models.TARGET_TYPE_EXPLORATION,
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
            self):
        # Create the translation suggestion associated with exploration id
        # target_id_2.
        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html):
                suggestion_services.create_suggestion(
                    suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    suggestion_models.TARGET_TYPE_EXPLORATION,
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
                    suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    suggestion_models.TARGET_TYPE_EXPLORATION,
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
            self):
        # Assert that there are no translation suggestions with an invalid
        # exploration id found.
        self.assertEqual(
            len(
                suggestion_services
                .get_translation_suggestion_ids_with_exp_ids(
                    ['invalid_exp_id'])), 0)

    def test_get_translation_suggestion_ids_with_exp_ids_with_empty_exp_list(
            self):
        # Assert that there are no translation suggestions found when we
        # use an empty exp_ids list.
        self.assertEqual(
            len(
                suggestion_services
                .get_translation_suggestion_ids_with_exp_ids([])), 0)

    def test_get_translation_suggestions_waiting_longest_for_review_per_lang(
            self):
        # Create a Hindi translation suggestion associated with exploration id
        # target_id_1.
        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html):
                suggestion_1 = suggestion_services.create_suggestion(
                    suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    suggestion_models.TARGET_TYPE_EXPLORATION,
                    self.target_id_1, 1, self.author_id_1,
                    self.add_translation_change_dict, 'test description')
        # Create a Hindi translation suggestion associated with exploration id
        # target_id_2.
        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html):
                suggestion_2 = suggestion_services.create_suggestion(
                    suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    suggestion_models.TARGET_TYPE_EXPLORATION,
                    self.target_id_2, 1, self.author_id_1,
                    self.add_translation_change_dict, 'test description')
        # Create a Hindi translation suggestion associated with exploration id
        # target_id_3.
        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html):
                suggestion_3 = suggestion_services.create_suggestion(
                    suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    suggestion_models.TARGET_TYPE_EXPLORATION,
                    self.target_id_3, 1, self.author_id_1,
                    self.add_translation_change_dict, 'test description')

        suggestions = (
            suggestion_services
            .get_translation_suggestions_waiting_longest_for_review_per_lang(
                'hi'))

        # Assert that the suggestions are in the order that they were created.
        self.assertEqual(len(suggestions), 3)
        self.assertEqual(
            suggestions[0].suggestion_id, suggestion_1.suggestion_id)
        self.assertEqual(
            suggestions[1].suggestion_id, suggestion_2.suggestion_id)
        self.assertEqual(
            suggestions[2].suggestion_id, suggestion_3.suggestion_id)
        for i in python_utils.RANGE(len(suggestions) - 1):
            self.assertLess(
                suggestions[i].last_updated, suggestions[i + 1].last_updated)

    def test_get_translation_suggestions_waiting_longest_for_review_wrong_lang(
            self):
        suggestions = (
            suggestion_services
            .get_translation_suggestions_waiting_longest_for_review_per_lang(
                'wrong_language_code'))

        self.assertEqual(len(suggestions), 0)

    def test_get_question_suggestions_waiting_longest_for_review_keeps_order(
            self):
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
        self.assertLess(
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
        resubmit_question_change = suggestion_1.change
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
        self.assertLess(
            suggestions[0].last_updated, suggestions[1].last_updated)

    def test_get_question_suggestions_waiting_longest_for_review(self):
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
        for i in python_utils.RANGE(len(suggestions) - 1):
            self.assertLess(
                suggestions[i].last_updated, suggestions[i + 1].last_updated)

    def test_query_suggestions_that_can_be_reviewed_by_user(self):
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
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            'exp1', 1, suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change, 'category1',
            'exploration.exp1.thread_1', None)
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change, 'category2',
            'exploration.exp1.thread_2', None)
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change, 'category3',
            'exploration.exp1.thread_3', None)
        # This suggestion does not count as a suggestion that can be reviewed
        # by a user because it has already been rejected.
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_REJECTED, 'author_3',
            'reviewer_2', self.change, 'category1',
            'exploration.exp1.thread_4', None)
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change, 'category2',
            'exploration.exp1.thread_5', None)

        self.assertEqual(len(
            suggestion_services
            .get_all_suggestions_that_can_be_reviewed_by_user('user1')), 3)
        self.assertEqual(len(
            suggestion_services
            .get_all_suggestions_that_can_be_reviewed_by_user('user2')), 0)


class SuggestionIntegrationTests(test_utils.GenericTestBase):

    EXP_ID = 'exp1'
    TOPIC_ID = 'topic1'
    STORY_ID = 'story1'
    TRANSLATION_LANGUAGE_CODE = 'en'

    AUTHOR_EMAIL = 'author@example.com'

    score_category = (
        suggestion_models.SCORE_TYPE_CONTENT +
        suggestion_models.SCORE_CATEGORY_DELIMITER + 'Algebra')

    THREAD_ID = 'exploration.exp1.thread_1'

    COMMIT_MESSAGE = 'commit message'

    def mock_generate_new_thread_id(self, unused_entity_type, unused_entity_id):
        return self.THREAD_ID

    def setUp(self):
        super(SuggestionIntegrationTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.reviewer_id = self.editor_id

        self.editor = user_services.UserActionsInfo(self.editor_id)

        # Login and create exploration and suggestions.
        self.login(self.EDITOR_EMAIL)

        # Create exploration.
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                self.EXP_ID, self.editor_id, ['State 1', 'State 2'],
                ['TextInput'], category='Algebra'))

        self.old_content = state_domain.SubtitledHtml(
            'content', '<p>old content</p>').to_dict()
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    self.TRANSLATION_LANGUAGE_CODE: {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 42.43
                    }
                },
                'default_outcome': {},
                'ca_placeholder_0': {}
            }
        }
        self.old_recorded_voiceovers = (
            state_domain.RecordedVoiceovers.from_dict(recorded_voiceovers_dict))
        # Create content in State A with a single audio subtitle.
        exploration.states['State 1'].update_content(
            state_domain.SubtitledHtml.from_dict(self.old_content))
        exploration.states['State 1'].update_recorded_voiceovers(
            self.old_recorded_voiceovers)
        exp_services._save_exploration(self.editor_id, exploration, '', [])  # pylint: disable=protected-access

        rights_manager.publish_exploration(self.editor, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.editor, self.EXP_ID, self.owner_id,
            rights_domain.ROLE_EDITOR)

        self.new_content = state_domain.SubtitledHtml(
            'content', '<p>new content</p>').to_dict()

        self.change = {
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
            self, exp_id, author_id):
        """Creates a translation suggestion that is associated with an
        exploration with id exp_id. The author of the created suggestion is
        author_id.
        """
        # Gets the html content in the exploration to be translated.
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        content_html = exploration.states['State 1'].content.html

        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_TRANSLATION,
            'state_name': 'State 1',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': content_html,
            'translation_html': '<p>This is translated html.</p>'
        }

        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            exp_id, 1, author_id, add_translation_change_dict,
            'test description')

    def assert_created_suggestion_is_valid(self, target_id, author_id):
        """Assert that the created suggestion is in review and that only one
        suggestion with the given target_id and author_id exists.
        """
        suggestions = suggestion_services.query_suggestions(
            [('author_id', author_id), ('target_id', target_id)])
        self.assertEqual(len(suggestions), 1)
        self.assertEqual(
            suggestions[0].status, suggestion_models.STATUS_IN_REVIEW)

    def test_create_and_accept_suggestion(self):
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change, 'test description')

        suggestion_id = self.THREAD_ID

        suggestion_services.accept_suggestion(
            suggestion_id, self.reviewer_id, self.COMMIT_MESSAGE, None)

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)

        self.assertEqual(
            exploration.states['State 1'].content.html,
            '<p>new content</p>')

        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        self.assertEqual(suggestion.status, suggestion_models.STATUS_ACCEPTED)

    def test_create_and_reject_suggestion(self):
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change, 'test description')

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

    def test_create_and_accept_suggestion_with_message(self):
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change, 'test description')

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

    def test_delete_skill_rejects_question_suggestion(self):
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
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
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1']
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
            suggestion_models.TARGET_TYPE_SKILL, skill_id, 1,
            self.author_id, suggestion_change, 'test description')
        self.assert_created_suggestion_is_valid(skill_id, self.author_id)

        skill_services.delete_skill(self.author_id, skill_id)

        # Suggestion should be rejected after corresponding skill is deleted.
        suggestions = suggestion_services.query_suggestions(
            [('author_id', self.author_id), ('target_id', skill_id)])
        self.assertEqual(len(suggestions), 1)
        self.assertEqual(
            suggestions[0].status, suggestion_models.STATUS_REJECTED)

    def test_delete_topic_rejects_translation_suggestion(self):
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

    def test_delete_story_rejects_translation_suggestion(self):
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

    def test_remove_exp_from_story_rejects_translation_suggestion(self):
        self.create_translation_suggestion_associated_with_exp(
            self.EXP_ID, self.author_id)
        self.assert_created_suggestion_is_valid(self.EXP_ID, self.author_id)

        # Removes the exploration from the story.
        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': self.EXP_ID,
                'new_value': None
            })], 'Removed exploration.')

        # Suggestion should be rejected after exploration is removed from the
        # story.
        suggestions = suggestion_services.query_suggestions(
            [('author_id', self.author_id), ('target_id', self.EXP_ID)])
        self.assertEqual(len(suggestions), 1)
        self.assertEqual(
            suggestions[0].status, suggestion_models.STATUS_REJECTED)


class UserContributionProficiencyUnitTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UserContributionProficiencyUnitTests, self).setUp()
        self.signup('user1@example.com', 'user1')
        self.signup('user2@example.com', 'user2')
        self.user_1_id = self.get_user_id_from_email('user1@example.com')
        self.user_2_id = self.get_user_id_from_email('user2@example.com')

    def test_get_all_user_ids_who_are_allowed_to_review(self):
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

    def test_get_all_scores_of_the_user_with_multiple_scores(self):
        user_models.UserContributionProficiencyModel.create(
            self.user_1_id, 'category1', 1)
        user_models.UserContributionProficiencyModel.create(
            self.user_1_id, 'category2', 2)
        user_models.UserContributionProficiencyModel.create(
            self.user_1_id, 'category3', 3)

        expected_scores_dict = {}
        for index in python_utils.RANGE(1, 4):
            key = 'category%s' % python_utils.UNICODE(index)
            expected_scores_dict[key] = index

        scores_dict = suggestion_services.get_all_scores_of_user(
            self.user_1_id)

        self.assertEqual(len(scores_dict), 3)
        self.assertDictEqual(scores_dict, expected_scores_dict)

    def test_get_all_scores_of_the_user_when_no_scores_exist(self):
        scores_dict = suggestion_services.get_all_scores_of_user(
            self.user_1_id)

        self.assertEqual(len(scores_dict), 0)
        self.assertDictEqual(scores_dict, {})


class VoiceoverApplicationServiceUnitTest(test_utils.GenericTestBase):
    """Tests for the ExplorationVoiceoverApplication class."""

    def setUp(self):
        super(VoiceoverApplicationServiceUnitTest, self).setUp()
        self.signup('author@example.com', 'author')
        self.author_id = self.get_user_id_from_email('author@example.com')

        suggestion_models.GeneralVoiceoverApplicationModel(
            id='application_id',
            target_type='exploration',
            target_id='0',
            status='review',
            author_id=self.author_id,
            final_reviewer_id=None,
            language_code='en',
            filename='filename.mp3',
            content='<p>content</p>',
            rejection_message=None).put()
        self.voiceover_application_model = (
            suggestion_models.GeneralVoiceoverApplicationModel.get_by_id(
                'application_id'))

    def test_get_voiceover_application_from_model_with_invalid_type_raise_error(
            self):
        suggestion_services.get_voiceover_application(
            self.voiceover_application_model.id)

        self.voiceover_application_model.target_type = 'invalid_type'
        with self.assertRaisesRegexp(
            Exception,
            'Invalid target type for voiceover application: invalid_type'):
            suggestion_services.get_voiceover_application(
                self.voiceover_application_model.id)
