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

"""Tests for suggestion controllers."""

from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_manager
from core.domain import suggestion_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(suggestion_models, feedback_models) = models.Registry.import_models([
    models.NAMES.suggestion, models.NAMES.feedback])


class SuggestionUnitTests(test_utils.GenericTestBase):

    EXP_ID = 'exp1'
    TRANSLATION_LANGUAGE_CODE = 'en'

    AUTHOR_EMAIL = 'author@example.com'
    AUTHOR_EMAIL_2 = 'author2@example.com'
    NORMAL_USER_EMAIL = 'user@example.com'

    def setUp(self):
        super(SuggestionUnitTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.AUTHOR_EMAIL_2, 'author2')
        self.signup(self.NORMAL_USER_EMAIL, 'normalUser')

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.author_id_2 = self.get_user_id_from_email(self.AUTHOR_EMAIL_2)
        self.reviewer_id = self.editor_id

        self.set_admins([self.ADMIN_USERNAME])
        self.editor = user_services.UserActionsInfo(self.editor_id)

        # Login and create exploration and suggestions.
        self.login(self.EDITOR_EMAIL)
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                self.EXP_ID, self.editor_id, ['State 1', 'State 2', 'State 3'],
                ['TextInput'], category='Algebra'))

        self.old_content = exp_domain.SubtitledHtml(
            'content', 'old content html').to_dict()

        exploration.states['State 1'].update_content(self.old_content)
        exploration.states['State 2'].update_content(self.old_content)
        exploration.states['State 3'].update_content(self.old_content)
        exp_services._save_exploration(self.editor_id, exploration, '', [])  # pylint: disable=protected-access

        rights_manager.publish_exploration(self.editor, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.editor, self.EXP_ID, self.owner_id,
            rights_manager.ROLE_EDITOR)

        self.new_content = exp_domain.SubtitledHtml(
            'content', 'new content html').to_dict()

        self.logout()

        with self.swap(constants, 'USE_NEW_SUGGESTION_FRAMEWORK', True):
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                self.login(self.AUTHOR_EMAIL)
                response = self.testapp.get('/explore/%s' % self.EXP_ID)
                csrf_token = self.get_csrf_token_from_response(response)

                self.post_json(
                    '%s/' % feconf.GENERAL_SUGGESTION_URL_PREFIX, {
                        'suggestion_type': (
                            suggestion_models
                            .SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                        'target_type': (
                            suggestion_models.TARGET_TYPE_EXPLORATION),
                        'target_id': 'exp1',
                        'target_version_at_submission': exploration.version,
                        'change': {
                            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                            'state_name': 'State 1',
                            'old_value': self.old_content,
                            'new_value': self.new_content
                        },
                        'description': 'change to state 1',
                        'final_reviewer_id': self.reviewer_id,
                    }, csrf_token=csrf_token)
                self.logout()

                self.login(self.AUTHOR_EMAIL_2)
                response = self.testapp.get('/explore/%s' % self.EXP_ID)
                csrf_token = self.get_csrf_token_from_response(response)

                self.post_json(
                    '%s/' % feconf.GENERAL_SUGGESTION_URL_PREFIX, {
                        'suggestion_type': (
                            suggestion_models
                            .SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                        'target_type': (
                            suggestion_models.TARGET_TYPE_EXPLORATION),
                        'target_id': 'exp1',
                        'target_version_at_submission': exploration.version,
                        'change': {
                            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                            'state_name': 'State 2',
                            'old_value': self.old_content,
                            'new_value': self.new_content
                        },
                        'description': 'change to state 2',
                        'final_reviewer_id': self.reviewer_id,
                    }, csrf_token=csrf_token)

                self.post_json(
                    '%s/' % feconf.GENERAL_SUGGESTION_URL_PREFIX, {
                        'suggestion_type': (
                            suggestion_models
                            .SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                        'target_type': (
                            suggestion_models.TARGET_TYPE_EXPLORATION),
                        'target_id': 'exp1',
                        'target_version_at_submission': exploration.version,
                        'change': {
                            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                            'state_name': 'State 3',
                            'old_value': self.old_content,
                            'new_value': self.new_content
                        },
                        'description': 'change to state 3',
                        'final_reviewer_id': self.reviewer_id,
                    }, csrf_token=csrf_token)
                self.logout()

    def test_create_suggestion(self):
        with self.swap(constants, 'USE_NEW_SUGGESTION_FRAMEWORK', True):
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                self.login(self.AUTHOR_EMAIL_2)
                response = self.testapp.get('/explore/%s' % self.EXP_ID)
                csrf_token = self.get_csrf_token_from_response(response)
                exploration = exp_services.get_exploration_by_id(self.EXP_ID)

                self.post_json(
                    '%s/' % feconf.GENERAL_SUGGESTION_URL_PREFIX, {
                        'suggestion_type': (
                            suggestion_models
                            .SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                        'target_type': (
                            suggestion_models.TARGET_TYPE_EXPLORATION),
                        'target_id': 'exp1',
                        'target_version_at_submission': exploration.version,
                        'change': {
                            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                            'state_name': 'State 3',
                            'new_value': self.new_content
                        },
                        'description': 'change again to state 3',
                    }, csrf_token=csrf_token)
                suggestions = self.get_json(
                    '%s?author_id=%s' % (
                        feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                        self.author_id_2))['suggestions']
                self.assertEqual(len(suggestions), 3)
                self.logout()

    def test_accept_suggestion(self):
        with self.swap(constants, 'USE_NEW_SUGGESTION_FRAMEWORK', True):
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                exploration = exp_services.get_exploration_by_id(self.EXP_ID)

                # Test editor can accept successfully.
                self.login(self.EDITOR_EMAIL)
                response = self.testapp.get('/explore/%s' % self.EXP_ID)
                csrf_token = self.get_csrf_token_from_response(response)

                suggestion_to_accept = self.get_json(
                    '%s?author_id=%s' % (
                        feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                        self.author_id))['suggestions'][0]

                response = self.testapp.get('/explore/%s' % self.EXP_ID)
                csrf_token = self.get_csrf_token_from_response(response)
                self.put_json('%s/exploration/%s/%s' % (
                    feconf.GENERAL_SUGGESTION_ACTION_URL_PREFIX,
                    suggestion_to_accept['target_id'],
                    suggestion_to_accept['suggestion_id']), {
                        'action': u'accept',
                        'commit_message': u'commit message',
                        'review_message': u'Accepted'
                    }, csrf_token=csrf_token)
                suggestion_post_accept = self.get_json(
                    '%s?author_id=%s' % (
                        feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                        self.author_id))['suggestions'][0]
                self.assertEqual(
                    suggestion_post_accept['status'],
                    suggestion_models.STATUS_ACCEPTED)
                exploration = exp_services.get_exploration_by_id(self.EXP_ID)
                self.assertEqual(
                    exploration.states[suggestion_to_accept[
                        'change']['state_name']].content.html,
                    suggestion_to_accept['change']['new_value']['html'])
                self.logout()

                # Testing user without permissions cannot accept.
                self.login(self.NORMAL_USER_EMAIL)
                suggestion_to_accept = self.get_json(
                    '%s?author_id=%s' % (
                        feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                        self.author_id_2))['suggestions'][0]

                response = self.testapp.get('/explore/%s' % self.EXP_ID)
                csrf_token = self.get_csrf_token_from_response(response)
                self.put_json('%s/exploration/%s/%s' % (
                    feconf.GENERAL_SUGGESTION_ACTION_URL_PREFIX,
                    suggestion_to_accept['target_id'],
                    suggestion_to_accept['suggestion_id']), {
                        'action': u'accept',
                        'commit_message': u'commit message',
                        'review_message': u'Accepted'
                    }, csrf_token=csrf_token, expect_errors=True,
                              expected_status_int=401)
                self.logout()

                # Testing that author cannot accept own suggestion.
                self.login(self.AUTHOR_EMAIL_2)
                suggestion_to_accept = self.get_json(
                    '%s?author_id=%s' % (
                        feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                        self.author_id_2))['suggestions'][0]

                response = self.testapp.get('/explore/%s' % self.EXP_ID)
                csrf_token = self.get_csrf_token_from_response(response)
                self.put_json('%s/exploration/%s/%s' % (
                    feconf.GENERAL_SUGGESTION_ACTION_URL_PREFIX,
                    suggestion_to_accept['target_id'],
                    suggestion_to_accept['suggestion_id']), {
                        'action': u'accept',
                        'commit_message': u'commit message',
                        'review_message': u'Accepted'
                    }, csrf_token=csrf_token, expect_errors=True,
                              expected_status_int=401)

                # Testing users with scores above threshold can accept.
                self.login(self.AUTHOR_EMAIL)
                suggestion_services.increment_score_for_user(
                    self.author_id, 'content.Algebra', 15)

                response = self.testapp.get('/explore/%s' % self.EXP_ID)
                csrf_token = self.get_csrf_token_from_response(response)
                self.put_json('%s/exploration/%s/%s' % (
                    feconf.GENERAL_SUGGESTION_ACTION_URL_PREFIX,
                    suggestion_to_accept['target_id'],
                    suggestion_to_accept['suggestion_id']), {
                        'action': u'accept',
                        'commit_message': u'commit message',
                        'review_message': u'Accepted'
                    }, csrf_token=csrf_token)

                suggestion_post_accept = self.get_json(
                    '%s?author_id=%s' % (
                        feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                        self.author_id_2))['suggestions'][0]
                self.assertEqual(
                    suggestion_post_accept['status'],
                    suggestion_models.STATUS_ACCEPTED)
                self.logout()

                # Testing admins can accept suggestions.
                self.login(self.ADMIN_EMAIL)
                response = self.testapp.get('/explore/%s' % self.EXP_ID)
                csrf_token = self.get_csrf_token_from_response(response)
                suggestion_to_accept = self.get_json(
                    '%s?author_id=%s' % (
                        feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                        self.author_id_2))['suggestions'][1]
                self.put_json('%s/exploration/%s/%s' % (
                    feconf.GENERAL_SUGGESTION_ACTION_URL_PREFIX,
                    suggestion_to_accept['target_id'],
                    suggestion_to_accept['suggestion_id']), {
                        'action': u'accept',
                        'commit_message': u'commit message',
                        'review_message': u'Accepted'
                    }, csrf_token=csrf_token)
                suggestion_post_accept = self.get_json(
                    '%s?author_id=%s' % (
                        feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                        self.author_id_2))['suggestions'][1]
                self.assertEqual(
                    suggestion_post_accept['status'],
                    suggestion_models.STATUS_ACCEPTED)
                self.logout()

    def test_suggestion_list_handler(self):
        with self.swap(constants, 'USE_NEW_SUGGESTION_FRAMEWORK', True):
            suggestions = self.get_json(
                '%s?author_id=%s&target_type=%s&target_id=%s' % (
                    feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX, self.author_id_2,
                    suggestion_models.TARGET_TYPE_EXPLORATION, self.EXP_ID)
                )['suggestions']
            self.assertEqual(len(suggestions), 2)


class QuestionSuggestionTests(test_utils.GenericTestBase):

    AUTHOR_EMAIL = 'author@example.com'
    AUTHOR_EMAIL_2 = 'author2@example.com'

    # Needs to be 12 characters long.
    SKILL_ID = 'skill1234567'

    SKILL_DESCRIPTION = 'skill to link question to'
    TOPIC_ID = 'topic'

    def setUp(self):
        super(QuestionSuggestionTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.save_new_skill(
            self.SKILL_ID, self.admin_id, self.SKILL_DESCRIPTION)
        self.question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state').to_dict(),
            'language_code': 'en',
            'question_state_schema_version': (
                feconf.CURRENT_STATES_SCHEMA_VERSION)
        }
        with self.swap(constants, 'USE_NEW_SUGGESTION_FRAMEWORK', True):
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                self.login(self.AUTHOR_EMAIL)
                response = self.testapp.get(feconf.CREATOR_DASHBOARD_URL)
                csrf_token = self.get_csrf_token_from_response(response)

                self.post_json(
                    '%s/' % feconf.GENERAL_SUGGESTION_URL_PREFIX, {
                        'suggestion_type': (
                            suggestion_models.SUGGESTION_TYPE_ADD_QUESTION),
                        'target_type': suggestion_models.TARGET_TYPE_TOPIC,
                        'target_id': self.TOPIC_ID,
                        'target_version_at_submission': 1,
                        'change': {
                            'cmd': (
                                question_domain
                                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                            'question_dict': self.question_dict,
                            'skill_id': self.SKILL_ID
                        },
                        'description': 'Add new question to skill'
                    }, csrf_token=csrf_token)
                self.logout()

    def test_query_question_suggestions(self):
        with self.swap(constants, 'USE_NEW_SUGGESTION_FRAMEWORK', True):
            suggestions = self.get_json(
                '%s?suggestion_type=%s' % (
                    feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                    suggestion_models.SUGGESTION_TYPE_ADD_QUESTION)
                )['suggestions']
            self.assertEqual(len(suggestions), 1)
            suggestion = suggestions[0]
            self.assertEqual(
                suggestion['suggestion_type'],
                suggestion_models.SUGGESTION_TYPE_ADD_QUESTION)
            self.assertEqual(suggestion['target_id'], self.TOPIC_ID)
            self.assertEqual(
                suggestion['target_type'], suggestion_models.TARGET_TYPE_TOPIC)
            self.assertEqual(
                suggestion['change']['cmd'],
                question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION)

    def test_accept_question_suggestion(self):
        with self.swap(constants, 'USE_NEW_SUGGESTION_FRAMEWORK', True):
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                suggestion_to_accept = self.get_json(
                    '%s?suggestion_type=%s' % (
                        feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                        suggestion_models.SUGGESTION_TYPE_ADD_QUESTION)
                    )['suggestions'][0]

                self.login(self.ADMIN_EMAIL)
                response = self.testapp.get(feconf.CREATOR_DASHBOARD_URL)
                csrf_token = self.get_csrf_token_from_response(response)
                with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
                    self.put_json('%s/topic/%s/%s' % (
                        feconf.GENERAL_SUGGESTION_ACTION_URL_PREFIX,
                        suggestion_to_accept['target_id'],
                        suggestion_to_accept['suggestion_id']), {
                            'action': u'accept',
                            'commit_message': u'commit message',
                            'review_message': u'This looks good!'
                        }, csrf_token=csrf_token)

                suggestion_post_accept = self.get_json(
                    '%s?suggestion_type=%s' % (
                        feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                        suggestion_models.SUGGESTION_TYPE_ADD_QUESTION)
                    )['suggestions'][0]
                self.assertEqual(
                    suggestion_post_accept['status'],
                    suggestion_models.STATUS_ACCEPTED)
                questions, _ = (
                    question_services.get_question_summaries_linked_to_skills(
                        1, [self.SKILL_ID], ''))
                self.assertEqual(len(questions), 1)
                self.assertEqual(questions[0].creator_id, self.author_id)
                self.assertEqual(
                    questions[0].question_content,
                    self.question_dict['question_state_data']['content']['html']
                )
                thread_messages = feedback_services.get_messages(
                    suggestion_to_accept['suggestion_id'])
            last_message = thread_messages[len(thread_messages) - 1]
            self.assertEqual(last_message.text, 'This looks good!')
