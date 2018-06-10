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

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
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
    change_cmd = {
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
        'state_name': 'state_1',
        'new_value': 'new suggestion content'
    }

    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    ASSIGNED_REVIEWER_EMAIL = 'assigned_reviewer@example.com'

    THREAD_ID = 'exp1.thread_1'

    COMMIT_MESSAGE = 'commit message'
    EMPTY_COMMIT_MESSAGE = ' '

    suggestion_id = '.'.join(
        [suggestion_models.TARGET_TYPE_EXPLORATION, THREAD_ID])

    def setUp(self):
        super(SuggestionServicesUnitTests, self).setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.signup(self.ASSIGNED_REVIEWER_EMAIL, 'assignedReviewer')
        self.assigned_reviewer_id = self.get_user_id_from_email(
            self.ASSIGNED_REVIEWER_EMAIL)

    def generate_thread_id(self, unused_exp_id):
        return self.THREAD_ID

    class MockExploration(object):
        """Mocks an exploration. To be used only for testing."""
        def __init__(self, exploration_id, states):
            self.id = exploration_id
            self.states = states

    # All mock explorations created for testing.
    explorations = [
        MockExploration('exp1', {'state_1': {}, 'state_2': {}})
    ]

    def mock_get_exploration_by_id(self, exp_id):
        for exp in self.explorations:
            if exp.id == exp_id:
                return exp
        return None

    def null_function(self):
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
            'author_id': self.author_id,
            'final_reviewer_id': self.reviewer_id,
            'assigned_reviewer_id': self.assigned_reviewer_id,
            'change_cmd': {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'state_1',
                'new_value': 'new suggestion content',
                'old_value': None
            },
            'score_category': self.score_category
        }
        with self.swap(
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, self.change_cmd, self.score_category,
                'test description', self.assigned_reviewer_id, self.reviewer_id)

            observed_suggestion = suggestion_services.get_suggestion_by_id(
                self.suggestion_id)
            self.assertDictEqual(
                expected_suggestion_dict, observed_suggestion.to_dict())

    def check_commit_message(
            self, unused_user_id, unused_exploration_id, unused_change_list,
            commit_message, is_suggestion):
        self.assertTrue(is_suggestion)
        self.assertEqual(
            commit_message, 'Accepted suggestion by %s: %s' % (
                'author', self.COMMIT_MESSAGE))

    def test_accept_suggestion_successfully(self):
        with self.swap(
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, self.change_cmd, self.score_category,
                'test description', self.assigned_reviewer_id, self.reviewer_id)

        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

        with self.swap(
            exp_services, 'update_exploration', self.check_commit_message):
            with self.swap(
                exp_services, 'get_exploration_by_id',
                self.mock_get_exploration_by_id):
                with self.swap(
                    suggestion_registry.SuggestionEditStateContent,
                    'pre_accept_validate', self.null_function):
                    with self.swap(
                        suggestion_registry.SuggestionEditStateContent,
                        'get_change_list_for_accepting_suggestion',
                        self.null_function):
                        suggestion_services.accept_suggestion(
                            suggestion, self.reviewer_id, self.COMMIT_MESSAGE,
                            'review message')
            suggestion = suggestion_services.get_suggestion_by_id(
                self.suggestion_id)
            self.assertEqual(
                suggestion.status, suggestion_models.STATUS_ACCEPTED)
            self.assertEqual(
                suggestion.final_reviewer_id, self.reviewer_id)
            self.assertEqual(suggestion.assigned_reviewer_id, None)
            thread_messages = feedback_services.get_messages(self.THREAD_ID)
            last_message = thread_messages[len(thread_messages) - 1]
            self.assertEqual(
                last_message.text, 'review message')

    def test_accept_suggestion_handled_suggestion_failure(self):
        with self.swap(
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, self.change_cmd, self.score_category,
                'test description', self.assigned_reviewer_id, self.reviewer_id)

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
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, self.change_cmd, self.score_category,
                'test description', self.assigned_reviewer_id, self.reviewer_id)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

        # Invalidating the suggestion.
        suggestion.score_category = 'invalid_score_category'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected score_category to be of the form '
                                   'score_type.score_sub_type, received '
                                   'invalid_score_category'):
            suggestion_services._update_suggestion(suggestion) # pylint: disable=protected-access
            suggestion_services.accept_suggestion(
                suggestion, self.reviewer_id, self.COMMIT_MESSAGE, None)

        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

    def test_accept_suggestion_no_commit_message_failure(self):
        with self.swap(
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, self.change_cmd, self.score_category,
                'test description', self.assigned_reviewer_id, self.reviewer_id)
        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

        with self.assertRaisesRegexp(
            Exception, 'Commit message cannot be empty.'):
            suggestion_services.accept_suggestion(
                suggestion, self.reviewer_id, self.EMPTY_COMMIT_MESSAGE, None)

    def test_reject_suggestion_successfully(self):
        with self.swap(
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, self.change_cmd, self.score_category,
                'test description', self.assigned_reviewer_id, self.reviewer_id)
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
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, self.change_cmd, self.score_category,
                'test description', self.assigned_reviewer_id, self.reviewer_id)
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


class SuggestionGetServicesUnitTests(test_utils.GenericTestBase):
    score_category = (
        suggestion_models.SCORE_TYPE_TRANSLATION +
        suggestion_models.SCORE_CATEGORY_DELIMITER + 'English')

    target_id_1 = 'exp1'
    target_id_2 = 'exp2'
    target_version_at_submission = 1
    change_cmd = {
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
        'state_name': 'state_1',
        'new_value': 'new suggestion content'
    }


    AUTHOR_EMAIL_1 = 'author1@example.com'
    REVIEWER_EMAIL_1 = 'reviewer1@example.com'
    ASSIGNED_REVIEWER_EMAIL_1 = 'assigned_reviewer1@example.com'

    AUTHOR_EMAIL_2 = 'author2@example.com'
    REVIEWER_EMAIL_2 = 'reviewer2@example.com'
    ASSIGNED_REVIEWER_EMAIL_2 = 'assigned_reviewer2@example.com'

    def setUp(self):
        super(SuggestionGetServicesUnitTests, self).setUp()

        self.signup(self.AUTHOR_EMAIL_1, 'author1')
        self.author_id_1 = self.get_user_id_from_email(self.AUTHOR_EMAIL_1)
        self.signup(self.REVIEWER_EMAIL_1, 'reviewer1')
        self.reviewer_id_1 = self.get_user_id_from_email(self.REVIEWER_EMAIL_1)
        self.signup(self.ASSIGNED_REVIEWER_EMAIL_1, 'assignedReviewer1')
        self.assigned_reviewer_id_1 = self.get_user_id_from_email(
            self.ASSIGNED_REVIEWER_EMAIL_1)


        self.signup(self.AUTHOR_EMAIL_2, 'author2')
        self.author_id_2 = self.get_user_id_from_email(self.AUTHOR_EMAIL_2)
        self.signup(self.REVIEWER_EMAIL_2, 'reviewer2')
        self.reviewer_id_2 = self.get_user_id_from_email(self.REVIEWER_EMAIL_2)
        self.signup(self.ASSIGNED_REVIEWER_EMAIL_2, 'assignedReviewer2')
        self.assigned_reviewer_id_2 = self.get_user_id_from_email(
            self.ASSIGNED_REVIEWER_EMAIL_2)


        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id_1, self.target_version_at_submission,
            self.author_id_1, self.change_cmd, self.score_category,
            'test description', self.assigned_reviewer_id_1, self.reviewer_id_1)

        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id_1, self.target_version_at_submission,
            self.author_id_1, self.change_cmd, self.score_category,
            'test description', self.assigned_reviewer_id_1, None)

        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id_1, self.target_version_at_submission,
            self.author_id_1, self.change_cmd, self.score_category,
            'test description', None, None)

        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id_1, self.target_version_at_submission,
            self.author_id_2, self.change_cmd, self.score_category,
            'test description', self.assigned_reviewer_id_1, self.reviewer_id_2)

        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id_2, self.target_version_at_submission,
            self.author_id_2, self.change_cmd, self.score_category,
            'test description', self.assigned_reviewer_id_2, self.reviewer_id_2)

    def test_get_by_author(self):
        self.assertEqual(len(suggestion_services.get_suggestions_by_author(
            self.author_id_1)), 3)
        self.assertEqual(len(suggestion_services.get_suggestions_by_author(
            self.author_id_2)), 2)

    def test_get_by_reviewer(self):
        self.assertEqual(len(suggestion_services.get_suggestions_reviewed_by(
            self.reviewer_id_1)), 1)
        self.assertEqual(len(suggestion_services.get_suggestions_reviewed_by(
            self.reviewer_id_2)), 2)

    def test_get_by_assigned_reviewer(self):
        self.assertEqual(
            len(suggestion_services.get_suggestions_assigned_to_reviewer(
                self.assigned_reviewer_id_1)), 3)
        self.assertEqual(
            len(suggestion_services.get_suggestions_assigned_to_reviewer(
                self.assigned_reviewer_id_2)), 1)

    def test_get_by_target_id(self):
        self.assertEqual(len(suggestion_services.get_suggestions_by_target_id(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.target_id_1)), 4)
        self.assertEqual(len(suggestion_services.get_suggestions_by_target_id(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.target_id_2)), 1)

    def test_get_by_status(self):
        self.assertEqual(len(suggestion_services.get_suggestions_by_status(
            suggestion_models.STATUS_IN_REVIEW)), 4)
        self.assertEqual(len(suggestion_services.get_suggestions_by_status(
            suggestion_models.STATUS_RECEIVED)), 1)

    def test_get_by_type(self):
        self.assertEqual(len(suggestion_services.get_suggestion_by_type(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT)), 5)


class SuggestionIntegrationTests(test_utils.GenericTestBase):

    EXP_ID = 'exp1'
    TRANSLATION_LANGUAGE_CODE = 'en'

    AUTHOR_EMAIL = 'author@example.com'
    ASSIGNED_REVIEWER_EMAIL = 'assigned_reviewer@example.com'

    score_category = (
        suggestion_models.SCORE_TYPE_CONTENT +
        suggestion_models.SCORE_CATEGORY_DELIMITER + 'Algebra')

    THREAD_ID = 'exp1.thread_1'

    COMMIT_MESSAGE = 'commit message'

    def generate_thread_id(self, unused_exp_id):
        return self.THREAD_ID

    def setUp(self):
        super(SuggestionIntegrationTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.ASSIGNED_REVIEWER_EMAIL, 'assignedReviewer')
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.reviewer_id = self.editor_id
        self.assigned_reviewer_id = self.get_user_id_from_email(
            self.ASSIGNED_REVIEWER_EMAIL)

        self.editor = user_services.UserActionsInfo(self.editor_id)

        # Login and create exploration and suggestions.
        self.login(self.EDITOR_EMAIL)

        # Create exploration.
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                self.EXP_ID, self.editor_id, ['State 1', 'State 2'],
                ['TextInput'], category='Algebra'))

        self.old_content = exp_domain.SubtitledHtml(
            'content', 'old content').to_dict()
        self.old_content_ids_to_audio_translations = {
            'content': {
                self.TRANSLATION_LANGUAGE_CODE: exp_domain.AudioTranslation(
                    'filename.mp3', 20, False).to_dict()
            }
        }
        # Create content in State A with a single audio subtitle.
        exploration.states['State 1'].update_content(self.old_content)
        exploration.states['State 1'].update_content_ids_to_audio_translations(
            self.old_content_ids_to_audio_translations)
        exp_services._save_exploration(self.editor_id, exploration, '', [])  # pylint: disable=protected-access

        rights_manager.publish_exploration(self.editor, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.editor, self.EXP_ID, self.owner_id,
            rights_manager.ROLE_EDITOR)

        self.new_content = exp_domain.SubtitledHtml(
            'content', 'new content').to_dict()

        self.change_cmd = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'State 1',
            'new_value': self.new_content
        }

        self.target_version_at_submission = exploration.version

    def test_create_and_accept_suggestion(self):
        with self.swap(
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change_cmd, self.score_category,
                'test description', self.assigned_reviewer_id, None)

        suggestion_id = 'exploration.' + self.THREAD_ID
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

        suggestion_services.accept_suggestion(
            suggestion, self.reviewer_id, self.COMMIT_MESSAGE, None)

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)

        self.assertEqual(
            exploration.states['State 1'].content.html,
            'new content')

        self.assertEqual(suggestion.status, suggestion_models.STATUS_ACCEPTED)

    def test_create_and_reject_suggestion(self):
        with self.swap(
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change_cmd, self.score_category,
                'test description', self.assigned_reviewer_id, None)

        suggestion_id = 'exploration.' + self.THREAD_ID
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

        suggestion_services.reject_suggestion(
            suggestion, self.reviewer_id, 'Reject message')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        thread_messages = feedback_services.get_messages(self.THREAD_ID)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(
            last_message.text, 'Reject message')
        self.assertEqual(
            exploration.states['State 1'].content.html,
            'old content')

        self.assertEqual(suggestion.status, suggestion_models.STATUS_REJECTED)

    def test_create_and_accept_suggestion_with_message(self):
        with self.swap(
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change_cmd, self.score_category,
                'test description', self.assigned_reviewer_id, None)

        suggestion_id = 'exploration.' + self.THREAD_ID
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

        suggestion_services.accept_suggestion(
            suggestion, self.reviewer_id, self.COMMIT_MESSAGE, 'Accept message')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        thread_messages = feedback_services.get_messages(self.THREAD_ID)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(
            last_message.text, 'Accept message')

        self.assertEqual(
            exploration.states['State 1'].content.html,
            'new content')

        self.assertEqual(suggestion.status, suggestion_models.STATUS_ACCEPTED)
