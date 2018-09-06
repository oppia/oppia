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
from core.domain import state_domain
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
    change = {
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
        'state_name': 'state_1',
        'new_value': 'new suggestion content'
    }

    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'

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

    def generate_thread_id(self, unused_entity_type, unused_entity_id):
        return self.THREAD_ID

    class MockExploration(object):
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
            'generate_new_thread_id', self.generate_thread_id):
            with self.swap(
                exp_services, 'get_exploration_by_id',
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

    def check_commit_message(
            self, unused_user_id, unused_exploration_id, unused_change_list,
            commit_message, is_suggestion):
        self.assertTrue(is_suggestion)
        self.assertEqual(
            commit_message, 'Accepted suggestion by %s: %s' % (
                'author', self.COMMIT_MESSAGE))

    def test_accept_suggestion_successfully(self):
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            with self.swap(
                exp_services, 'get_exploration_by_id',
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
            'generate_new_thread_id', self.generate_thread_id):
            with self.swap(
                exp_services, 'get_exploration_by_id',
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
            'generate_new_thread_id', self.generate_thread_id):
            with self.swap(
                exp_services, 'get_exploration_by_id',
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
            suggestion_services.accept_suggestion(
                suggestion, self.reviewer_id, self.COMMIT_MESSAGE, None)

        suggestion = suggestion_services.get_suggestion_by_id(
            self.suggestion_id)

    def test_accept_suggestion_no_commit_message_failure(self):
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            with self.swap(
                exp_services, 'get_exploration_by_id',
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
            'generate_new_thread_id', self.generate_thread_id):
            with self.swap(
                exp_services, 'get_exploration_by_id',
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
            'generate_new_thread_id', self.generate_thread_id):
            with self.swap(
                exp_services, 'get_exploration_by_id',
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

    def generate_thread_id(self, unused_entity_type, unused_entity_id):
        return self.THREAD_ID

    class MockExploration(object):
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
        return None

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
            exp_services, 'get_exploration_by_id',
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

    def generate_thread_id(self, unused_entity_type, unused_entity_id):
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
            'content', 'old content').to_dict()
        self.old_content_ids_to_audio_translations = {
            'content': {
                self.TRANSLATION_LANGUAGE_CODE: state_domain.AudioTranslation(
                    'filename.mp3', 20, False).to_dict()
            },
            'default_outcome': {}
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

        self.new_content = state_domain.SubtitledHtml(
            'content', 'new content').to_dict()

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
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change, 'test description', None)

        suggestion_id = self.THREAD_ID
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
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.EXP_ID, self.target_version_at_submission,
                self.author_id, self.change, 'test description', None)

        suggestion_id = self.THREAD_ID
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
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.generate_thread_id):
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

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        thread_messages = feedback_services.get_messages(self.THREAD_ID)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(
            last_message.text, 'Accept message')

        self.assertEqual(
            exploration.states['State 1'].content.html,
            'new content')

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

    def get_all_user_ids_who_are_allowed_to_review(self):
        suggestion_services.increment_score_for_user('user1', 'category1', 1)
        suggestion_services.increment_score_for_user('user2', 'category1', 5)
        suggestion_services.increment_score_for_user('user1', 'category2', 15.2)
        suggestion_services.increment_score_for_user('user2', 'category2', 2)
        with self.swap(
            suggestion_models, 'MINIMUM_SCORE_REQUIRED_TO_REVIEW', 10):
            user_ids = (
                suggestion_services.get_all_user_ids_who_are_allowed_to_review(
                    'category1'))
            self.assertEqual(user_ids, [])
            user_ids = (
                suggestion_services.get_all_user_ids_who_are_allowed_to_review(
                    'category2'))
            self.assertEqual(user_ids, ['user2'])

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

    def test_get_next_user_in_rotation(self):
        suggestion_services.create_new_user_contribution_scoring_model(
            self.user_a_id, 'category_a', 15)
        suggestion_services.create_new_user_contribution_scoring_model(
            self.user_b_id, 'category_a', 15)
        suggestion_services.create_new_user_contribution_scoring_model(
            self.user_c_id, 'category_a', 15)

        user_ids = [self.user_a_id, self.user_b_id, self.user_c_id]
        user_ids.sort()
        self.assertEqual(suggestion_services.get_next_user_in_rotation(
            'category_a'), user_ids[0])
        self.assertEqual(
            suggestion_models.ReviewerRotationTrackingModel.get_by_id(
                'category_a').current_position_in_rotation, user_ids[0])

        self.assertEqual(suggestion_services.get_next_user_in_rotation(
            'category_a'), user_ids[1])
        self.assertEqual(
            suggestion_models.ReviewerRotationTrackingModel.get_by_id(
                'category_a').current_position_in_rotation, user_ids[1])

        self.assertEqual(suggestion_services.get_next_user_in_rotation(
            'category_a'), user_ids[2])
        self.assertEqual(
            suggestion_models.ReviewerRotationTrackingModel.get_by_id(
                'category_a').current_position_in_rotation, user_ids[2])

        # Rotates back.
        self.assertEqual(suggestion_services.get_next_user_in_rotation(
            'category_a'), user_ids[0])
        self.assertEqual(
            suggestion_models.ReviewerRotationTrackingModel.get_by_id(
                'category_a').current_position_in_rotation, user_ids[0])

        self.assertEqual(suggestion_services.get_next_user_in_rotation(
            'category_invalid'), None)
