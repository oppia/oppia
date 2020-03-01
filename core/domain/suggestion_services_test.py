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
from core.domain import rights_manager
from core.domain import state_domain
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

(suggestion_models, feedback_models) = models.Registry.import_models([
    models.NAMES.suggestion, models.NAMES.feedback])


class SuggestionServicesUnitTests(test_utils.GenericTestBase):
    """Test the functions in suggestion_services."""

    score_category = (
        suggestion_models.SCORE_TYPE_CONTENT +
        suggestion_models.SCORE_CATEGORY_DELIMITER + 'Algebra')

    target_id = 'exp1'
    target_version_at_submission = 1
    change = {
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
        'state_name': 'state_1',
        'new_value': 'new suggestion content'
    }

    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    NORMAL_USER_EMAIL = 'normal@example.com'

    THREAD_ID = 'exploration.exp1.thread_1'

    COMMIT_MESSAGE = 'commit message'
    EMPTY_COMMIT_MESSAGE = ' '

    suggestion_id = THREAD_ID

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

    def mock_generate_new_thread_id(self, unused_entity_type, unused_entity_id):
        return self.THREAD_ID

    class MockExploration(python_utils.OBJECT):
        """Mocks an exploration. To be used only for testing."""
        def __init__(self, exploration_id, states):
            self.id = exploration_id
            self.states = states
            self.category = 'Algebra'

    # All mock explorations created for testing.
    explorations = [
        MockExploration('exp1', {'state_1': {}, 'state_2': {}})
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
            'final_reviewer_id': self.reviewer_id,
            'change': {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'state_1',
                'new_value': 'new suggestion content',
                'old_value': None
            },
            'score_category': self.score_category
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
                    self.author_id, self.change, 'test description',
                    self.reviewer_id)

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
                self.author_id, self.change, 'test description',
                self.reviewer_id)

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
                self.author_id, add_translation_change_dict, 'test description',
                self.reviewer_id)

    def test_get_all_stale_suggestions(self):
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, self.change, 'test description',
            self.reviewer_id)

        with self.swap(
            suggestion_models, 'THRESHOLD_TIME_BEFORE_ACCEPT_IN_MSECS', 0):
            self.assertEqual(
                len(suggestion_services.get_all_stale_suggestions()), 1)

        with self.swap(
            suggestion_models, 'THRESHOLD_TIME_BEFORE_ACCEPT_IN_MSECS',
            7 * 24 * 60 * 60 * 1000):
            self.assertEqual(
                len(suggestion_services.get_all_stale_suggestions()), 0)

    def test_cannot_mark_review_completed_with_invalid_status(self):
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, self.change, 'test description',
            self.reviewer_id)

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', self.target_id)])[0]

        with self.assertRaisesRegexp(Exception, 'Invalid status after review.'):
            suggestion_services.mark_review_completed(
                suggestion, 'invalid_status', self.reviewer_id)


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
            self.author_id, self.change, 'test description',
            self.reviewer_id)

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', self.target_id)])[0]

        with self.assertRaisesRegexp(
            Exception, 'Review message cannot be empty.'):
            suggestion_services.reject_suggestion(
                suggestion, self.reviewer_id, '')

    def test_email_is_not_sent_to_unregistered_user(self):
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, self.change, 'test description',
            self.reviewer_id)

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', self.target_id)])[0]

        self.assertFalse(
            suggestion_services.check_if_email_has_been_sent_to_user(
                'unregistered_user_id', suggestion.score_category))

    def test_cannot_mark_email_has_been_sent_to_user_with_no_user_scoring_model(
            self):
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, self.change, 'test description',
            self.reviewer_id)

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', self.target_id)])[0]

        with self.assertRaisesRegexp(
            Exception, 'Expected user scoring model to exist for user'):
            suggestion_services.mark_email_has_been_sent_to_user(
                'unregistered_user_id', suggestion.score_category)

    def test_accept_suggestion_and_send_email_to_author(self):
        enable_recording_of_scores_swap = self.swap(
            feconf, 'ENABLE_RECORDING_OF_SCORES', True)
        send_suggestion_review_related_emails_swap = self.swap(
            feconf, 'SEND_SUGGESTION_REVIEW_RELATED_EMAILS', True)

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
            self.author_id, change_dict, 'test description',
            self.reviewer_id)

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', self.target_id)])[0]
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_IN_REVIEW)
        self.assertFalse(
            suggestion_services.check_if_email_has_been_sent_to_user(
                self.author_id, suggestion.score_category))

        suggestion_services.increment_score_for_user(
            self.author_id, suggestion.score_category, 10)

        with enable_recording_of_scores_swap, (
            send_suggestion_review_related_emails_swap):
            suggestion_services.accept_suggestion(
                suggestion, self.reviewer_id, self.COMMIT_MESSAGE,
                'review message')

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', self.target_id)])[0]
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_ACCEPTED)
        self.assertTrue(
            suggestion_services.check_if_email_has_been_sent_to_user(
                self.author_id, suggestion.score_category))


    def test_accept_suggestion_successfully(self):
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
                    self.author_id, self.change, 'test description',
                    self.reviewer_id)

        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

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
                            suggestion, self.reviewer_id,
                            self.COMMIT_MESSAGE, 'review message')
            suggestion = suggestion_services.get_suggestion_by_id(
                self.suggestion_id)
            self.assertEqual(
                suggestion.status, suggestion_models.STATUS_ACCEPTED)
            self.assertEqual(
                suggestion.final_reviewer_id, self.reviewer_id)
            thread_messages = feedback_services.get_messages(self.THREAD_ID)
            last_message = thread_messages[len(thread_messages) - 1]
            self.assertEqual(
                last_message.text, 'review message')

    def test_accept_suggestion_handled_suggestion_failure(self):
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
                    self.author_id, self.change, 'test description',
                    self.reviewer_id)

        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

        suggestion.status = suggestion_models.STATUS_ACCEPTED
        suggestion_services._update_suggestion(suggestion) # pylint: disable=protected-access
        with self.assertRaisesRegexp(
            Exception,
            'The suggestion has already been accepted/rejected.'):
            suggestion_services.accept_suggestion(
                suggestion, self.reviewer_id, self.COMMIT_MESSAGE, None)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_ACCEPTED)
        suggestion.status = suggestion_models.STATUS_REJECTED
        suggestion_services._update_suggestion(suggestion) # pylint: disable=protected-access

        with self.assertRaisesRegexp(
            Exception,
            'The suggestion has already been accepted/rejected.'):
            suggestion_services.accept_suggestion(
                suggestion, self.reviewer_id, self.COMMIT_MESSAGE, None)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_REJECTED)

    def test_accept_suggestion_invalid_suggestion_failure(self):
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
                    self.author_id, self.change, 'test description',
                    self.reviewer_id)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

        # Invalidating the suggestion.
        suggestion.score_category = 'invalid_score_category'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected score_category to be of the form '
                                   'score_type.score_sub_type, received '
                                   'invalid_score_category'):
            suggestion_services._update_suggestion(suggestion) # pylint: disable=protected-access

        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

    def test_accept_suggestion_no_commit_message_failure(self):
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
                    self.author_id, self.change, 'test description',
                    self.reviewer_id)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

        with self.assertRaisesRegexp(
            Exception, 'Commit message cannot be empty.'):
            suggestion_services.accept_suggestion(
                suggestion, self.reviewer_id, self.EMPTY_COMMIT_MESSAGE, None)

    def test_reject_suggestion_successfully(self):
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
                    self.author_id, self.change, 'test description',
                    self.reviewer_id)

        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        suggestion_services.reject_suggestion(
            suggestion, self.reviewer_id, 'reject review message')
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_REJECTED)
        self.assertEqual(
            suggestion.final_reviewer_id, self.reviewer_id)

        thread_messages = feedback_services.get_messages(self.THREAD_ID)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(last_message.text, 'reject review message')

    def test_reject_suggestion_handled_suggestion_failure(self):
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
                    self.author_id, self.change, 'test description',
                    self.reviewer_id)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

        suggestion.status = suggestion_models.STATUS_ACCEPTED
        suggestion_services._update_suggestion(suggestion) # pylint: disable=protected-access
        with self.assertRaisesRegexp(
            Exception,
            'The suggestion has already been accepted/rejected.'):
            suggestion_services.reject_suggestion(
                suggestion, self.reviewer_id, 'reject review message')

        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_ACCEPTED)

        suggestion.status = suggestion_models.STATUS_REJECTED
        suggestion_services._update_suggestion(suggestion) # pylint: disable=protected-access

        with self.assertRaisesRegexp(
            Exception,
            'The suggestion has already been accepted/rejected.'):
            suggestion_services.reject_suggestion(
                suggestion, self.reviewer_id, 'reject review message')
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_REJECTED)

    def test_resubmit_rejected_suggestion_success(self):
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
                    self.author_id, self.change, 'test description',
                    self.reviewer_id)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        suggestion_services.reject_suggestion(
            suggestion, self.reviewer_id, 'reject review message')
        suggestion_services.resubmit_rejected_suggestion(
            suggestion, 'resubmit summary message', self.author_id)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_IN_REVIEW)

    def test_resubmit_rejected_suggestion_failure(self):
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
                    self.author_id, self.change, 'test description',
                    self.reviewer_id)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)
        with self.assertRaisesRegexp(
            Exception, 'Summary message cannot be empty.'):
            suggestion_services.resubmit_rejected_suggestion(
                suggestion, '', self.author_id)
        with self.assertRaisesRegexp(
            Exception, 'The suggestion is not yet handled.'):
            suggestion_services.resubmit_rejected_suggestion(
                suggestion, 'resubmit summary message', self.author_id)

    def test_resubmit_accepted_suggestion_failure(self):
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
                    self.author_id, self.change, 'test description',
                    self.reviewer_id)
                suggestion = suggestion_services.get_suggestion_by_id(
                    self.suggestion_id)
                with self.swap(
                    suggestion_registry.SuggestionEditStateContent,
                    'accept', self.mock_accept_does_nothing):
                    suggestion_services.accept_suggestion(
                        suggestion, self.reviewer_id,
                        self.COMMIT_MESSAGE, 'review message')
                suggestion = suggestion_services.get_suggestion_by_id(
                    self.suggestion_id)
                with self.assertRaisesRegexp(
                    Exception,
                    'The suggestion was accepted. Only rejected suggestions '
                    'can be resubmitted.'):
                    suggestion_services.resubmit_rejected_suggestion(
                        suggestion, 'resubmit summary message', self.author_id)

    def test_check_can_resubmit_suggestion(self):
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
                    self.author_id, self.change, 'test description',
                    self.reviewer_id)
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

    class MockExploration(python_utils.OBJECT):
        """Mocks an exploration. To be used only for testing."""
        def __init__(self, exploration_id, states):
            self.id = exploration_id
            self.states = states
            self.category = 'Algebra'

    # All mock explorations created for testing.
    explorations = [
        MockExploration('exp1', {'state_1': {}, 'state_2': {}}),
        MockExploration('exp2', {'state_1': {}, 'state_2': {}})
    ]

    def mock_get_exploration_by_id(self, exp_id):
        for exp in self.explorations:
            if exp.id == exp_id:
                return exp

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
                self.author_id_1, self.change, 'test description',
                self.reviewer_id_1)

            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, self.change, 'test description', None)

            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, self.change, 'test description', None)

            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_2, self.change, 'test description',
                self.reviewer_id_2)

            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_2, self.target_version_at_submission,
                self.author_id_2, self.change, 'test description',
                self.reviewer_id_2)

    def test_get_by_author(self):
        queries = [('author_id', self.author_id_1)]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 3)
        queries = [('author_id', self.author_id_2)]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 2)

    def test_get_by_reviewer(self):
        queries = [('final_reviewer_id', self.reviewer_id_1)]
        self.assertEqual(len(suggestion_services.query_suggestions(queries)), 1)
        queries = [('final_reviewer_id', self.reviewer_id_2)]
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

    def test_query_suggestions_that_can_be_reviewed_by_user(self):
        suggestion_services.create_new_user_contribution_scoring_model(
            'user1', 'category1', 15)
        suggestion_services.create_new_user_contribution_scoring_model(
            'user1', 'category2', 15)
        suggestion_services.create_new_user_contribution_scoring_model(
            'user1', 'category3', 5)
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            'exp1', 1, suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change, 'category1', 'exploration.exp1.thread_1')
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change, 'category2', 'exploration.exp1.thread_2')
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change, 'category3', 'exploration.exp1.thread_3')
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_REJECTED, 'author_3',
            'reviewer_2', self.change, 'category1', 'exploration.exp1.thread_4')
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, 'exp1', 1,
            suggestion_models.STATUS_IN_REVIEW, 'author_3',
            'reviewer_2', self.change, 'category2', 'exploration.exp1.thread_5')
        self.assertEqual(len(
            suggestion_services
            .get_all_suggestions_that_can_be_reviewed_by_user('user1')), 3)
        self.assertEqual(len(
            suggestion_services
            .get_all_suggestions_that_can_be_reviewed_by_user('user2')), 0)



class SuggestionIntegrationTests(test_utils.GenericTestBase):

    EXP_ID = 'exp1'
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
                'default_outcome': {}
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
            rights_manager.ROLE_EDITOR)

        self.new_content = state_domain.SubtitledHtml(
            'content', '<p>new content</p>').to_dict()

        self.change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'State 1',
            'new_value': self.new_content
        }

        self.target_version_at_submission = exploration.version

    def test_create_and_accept_suggestion(self):
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change, 'test description', None)

        suggestion_id = self.THREAD_ID
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

        suggestion_services.accept_suggestion(
            suggestion, self.reviewer_id, self.COMMIT_MESSAGE, None)

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)

        self.assertEqual(
            exploration.states['State 1'].content.html,
            '<p>new content</p>')

        self.assertEqual(suggestion.status, suggestion_models.STATUS_ACCEPTED)

    def test_create_and_reject_suggestion(self):
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change, 'test description', None)

        suggestion_id = self.THREAD_ID
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

        suggestion_services.reject_suggestion(
            suggestion, self.reviewer_id, 'Reject message')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        thread_messages = feedback_services.get_messages(self.THREAD_ID)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(
            last_message.text, 'Reject message')
        self.assertEqual(
            exploration.states['State 1'].content.html,
            '<p>old content</p>')

        self.assertEqual(suggestion.status, suggestion_models.STATUS_REJECTED)

    def test_create_and_accept_suggestion_with_message(self):
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change, 'test description', None)

        suggestion_id = self.THREAD_ID
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

        suggestion_services.accept_suggestion(
            suggestion, self.reviewer_id, self.COMMIT_MESSAGE,
            'Accept message')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        thread_messages = feedback_services.get_messages(self.THREAD_ID)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(
            last_message.text, 'Accept message')

        self.assertEqual(
            exploration.states['State 1'].content.html,
            '<p>new content</p>')

        self.assertEqual(suggestion.status, suggestion_models.STATUS_ACCEPTED)


class UserContributionScoringUnitTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UserContributionScoringUnitTests, self).setUp()
        suggestion_services.create_new_user_contribution_scoring_model(
            'user1', 'category1', 0)
        suggestion_services.create_new_user_contribution_scoring_model(
            'user1', 'category2', 0)
        suggestion_services.create_new_user_contribution_scoring_model(
            'user2', 'category1', 0)

        self.signup('user_a@example.com', 'userA')
        self.signup('user_b@example.com', 'userB')
        self.signup('user_c@example.com', 'userC')
        self.user_a_id = self.get_user_id_from_email('user_a@example.com')
        self.user_b_id = self.get_user_id_from_email('user_b@example.com')
        self.user_c_id = self.get_user_id_from_email('user_c@example.com')

    def test_update_score_for_user(self):
        suggestion_services.increment_score_for_user('user1', 'category1', 1)
        suggestion_services.increment_score_for_user('user2', 'category1', 5)
        suggestion_services.increment_score_for_user('user1', 'category2', 15.2)
        suggestion_services.increment_score_for_user('user2', 'category2', 2)
        suggestion_services.increment_score_for_user('user1', 'category1', -1)

        scores1 = suggestion_services.get_all_scores_of_user('user1')
        self.assertEqual(scores1['category1'], 0)
        self.assertEqual(scores1['category2'], 15.2)

        scores2 = suggestion_services.get_all_scores_of_user('user2')
        self.assertEqual(scores2['category1'], 5)
        self.assertEqual(scores2['category2'], 2)

        scores3 = suggestion_services.get_all_scores_of_user('invalid_user')
        self.assertDictEqual(scores3, {})

    def test_get_all_user_ids_who_are_allowed_to_review(self):
        suggestion_services.increment_score_for_user('user1', 'category1', 1)
        suggestion_services.increment_score_for_user('user2', 'category1', 5)
        suggestion_services.increment_score_for_user('user1', 'category2', 15.2)
        suggestion_services.increment_score_for_user('user2', 'category2', 2)
        with self.swap(feconf, 'MINIMUM_SCORE_REQUIRED_TO_REVIEW', 10):
            user_ids = (
                suggestion_services.get_all_user_ids_who_are_allowed_to_review(
                    'category1'))
            self.assertEqual(user_ids, [])
            user_ids = (
                suggestion_services.get_all_user_ids_who_are_allowed_to_review(
                    'category2'))
            self.assertEqual(user_ids, ['user1'])

            self.assertTrue(
                suggestion_services.check_user_can_review_in_category(
                    'user1', 'category2'))
            self.assertFalse(
                suggestion_services.check_user_can_review_in_category(
                    'user2', 'category1'))
            self.assertFalse(
                suggestion_services.check_user_can_review_in_category(
                    'user_1', 'category_new'))
            self.assertFalse(
                suggestion_services.check_user_can_review_in_category(
                    'invalid_user', 'category1'))

    def test_check_if_email_has_been_sent_to_user(self):
        suggestion_services.create_new_user_contribution_scoring_model(
            self.user_a_id, 'category_a', 15)
        self.assertFalse(
            suggestion_services.check_if_email_has_been_sent_to_user(
                self.user_a_id, 'category_a'))
        suggestion_services.mark_email_has_been_sent_to_user(
            self.user_a_id, 'category_a')
        self.assertTrue(
            suggestion_services.check_if_email_has_been_sent_to_user(
                self.user_a_id, 'category_a'))


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
