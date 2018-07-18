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
from core.domain import rights_manager
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

    def setUp(self):
        super(SuggestionUnitTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.AUTHOR_EMAIL_2, 'author2')
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.author_id_2 = self.get_user_id_from_email(self.AUTHOR_EMAIL_2)
        self.reviewer_id = self.editor_id

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
            self.login(self.AUTHOR_EMAIL)
            response = self.testapp.get('/explore/%s' % self.EXP_ID)
            csrf_token = self.get_csrf_token_from_response(response)

            self.post_json(
                '%s/' % feconf.GENERAL_SUGGESTION_URL_PREFIX, {
                    'suggestion_type': (
                        suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                    'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
                    'target_id': 'exp1',
                    'target_version_at_submission': exploration.version,
                    'change_cmd': {
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
                        suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                    'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
                    'target_id': 'exp1',
                    'target_version_at_submission': exploration.version,
                    'change_cmd': {
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
                        suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                    'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
                    'target_id': 'exp1',
                    'target_version_at_submission': exploration.version,
                    'change_cmd': {
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
            self.login(self.AUTHOR_EMAIL_2)
            response = self.testapp.get('/explore/%s' % self.EXP_ID)
            csrf_token = self.get_csrf_token_from_response(response)
            exploration = exp_services.get_exploration_by_id(self.EXP_ID)

            self.post_json(
                '%s/' % feconf.GENERAL_SUGGESTION_URL_PREFIX, {
                    'suggestion_type': (
                        suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                    'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
                    'target_id': 'exp1',
                    'target_version_at_submission': exploration.version,
                    'change_cmd': {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'State 3',
                        'new_value': self.new_content
                    },
                    'description': 'change again to state 3',
                }, csrf_token=csrf_token)
            suggestions = self.get_json(
                '%s?list_type=author&author_id=%s' % (
                    feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                    self.author_id_2))['suggestions']
            self.assertEqual(len(suggestions), 3)
            self.logout()

    def test_accept_suggestion(self):
        with self.swap(constants, 'USE_NEW_SUGGESTION_FRAMEWORK', True):
            exploration = exp_services.get_exploration_by_id(self.EXP_ID)
            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get('/explore/%s' % self.EXP_ID)
            csrf_token = self.get_csrf_token_from_response(response)

            suggestion_to_accept = self.get_json(
                '%s?list_type=author&author_id=%s' % (
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
                '%s?list_type=id&suggestion_id=%s' % (
                    feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
                    suggestion_to_accept['suggestion_id']))['suggestions'][0]
            self.assertEqual(
                suggestion_post_accept['status'],
                suggestion_models.STATUS_ACCEPTED)
            exploration = exp_services.get_exploration_by_id(self.EXP_ID)
            self.assertEqual(
                exploration.states[suggestion_to_accept[
                    'change_cmd']['state_name']].content.html,
                suggestion_to_accept['change_cmd']['new_value']['html'])
            self.logout()
