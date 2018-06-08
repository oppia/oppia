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

from core.controllers import suggestion
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
    REVIEWER_EMAIL = 'reviewer@example.com'
    ASSIGNED_REVIEWER_EMAIL = 'assigned_reviewer@example.com'

    def setUp(self):
        super(SuggestionUnitTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.AUTHOR_EMAIL_2, 'author2')
        self.signup(self.ASSIGNED_REVIEWER_EMAIL, 'assignedReviewer')
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.author_id_2 = self.get_user_id_from_email(self.AUTHOR_EMAIL_2)
        self.reviewer_id = self.editor_id
        self.assigned_reviewer_id = self.get_user_id_from_email(
            self.ASSIGNED_REVIEWER_EMAIL)

        self.editor = user_services.UserActionsInfo(self.editor_id)

        # Login and create exploration and suggestions.
        self.login(self.EDITOR_EMAIL)

        # Create exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id,
            title='Exploration for suggestions',
            category='This is just a test category',
            objective='Test a suggestion.')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        init_state = exploration.states[exploration.init_state_name]
        init_interaction = init_state.interaction
        init_interaction.default_outcome.dest = exploration.init_state_name
        exploration.add_states(['State 1', 'State 2', 'State 3'])
        exploration.states['State 1'].update_interaction_id('TextInput')

        self.old_content = exp_domain.SubtitledHtml('old content', {
            self.TRANSLATION_LANGUAGE_CODE: exp_domain.AudioTranslation(
                'filename.mp3', 20, False)
        }).to_dict()

        # Create content in State A with a single audio subtitle.
        exploration.states['State 1'].update_content(self.old_content)
        exploration.states['State 2'].update_content(self.old_content)
        exploration.states['State 3'].update_content(self.old_content)
        exploration.states['State 2'].update_interaction_id('TextInput')
        exploration.states['State 3'].update_interaction_id('TextInput')
        exp_services._save_exploration(self.editor_id, exploration, '', [])  # pylint: disable=protected-access
        rights_manager.publish_exploration(self.editor, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.editor, self.EXP_ID, self.owner_id,
            rights_manager.ROLE_EDITOR)

        response = self.testapp.get('/explore/%s' % self.EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)

        self.new_content = exp_domain.SubtitledHtml('new content', {
            self.TRANSLATION_LANGUAGE_CODE: exp_domain.AudioTranslation(
                'filename.mp3', 20, False)
        }).to_dict()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
                'target_id': 'exp1',
                'target_version_at_submission': 1,
                'author_id': self.author_id,
                'change_cmd': {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'state 1',
                    'old_value': self.old_content,
                    'new_value': self.new_content
                },
                'score_category': 'content.Algebra',
                'description': 'change to state 1',
                'final_reviewer_id': self.reviewer_id,
                'assigned_reviewer_id': self.assigned_reviewer_id
            }, self.csrf_token)

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
                'target_id': 'exp1',
                'target_version_at_submission': 1,
                'author_id': self.author_id,
                'change_cmd': {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'state 2',
                    'old_value': self.old_content,
                    'new_value': self.new_content
                },
                'score_category': 'content.Algebra',
                'description': 'change to state 2',
                'final_reviewer_id': self.reviewer_id,
                'assigned_reviewer_id': self.assigned_reviewer_id
            }, self.csrf_token)

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
                'target_id': 'exp1',
                'target_version_at_submission': 1,
                'author_id': self.author_id,
                'change_cmd': {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'state 3',
                    'old_value': self.old_content,
                    'new_value': self.new_content
                },
                'score_category': 'content.Algebra',
                'description': 'change to state 3',
                'final_reviewer_id': self.reviewer_id,
                'assigned_reviewer_id': self.assigned_reviewer_id
            }, self.csrf_token)

    def test_create_suggestion(self):
        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
                'target_id': 'exp1',
                'target_version_at_submission': 1,
                'author_id': self.author_id_2,
                'change_cmd': {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'state 3',
                    'old_value': self.old_content,
                    'new_value': self.new_content
                },
                'score_category': 'content.Algebra',
                'desgicription': 'change again to state 3',
            }, self.csrf_token)
        suggestions = self.get_json(
            '%s?list_type=author&author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id_2))['suggestions']
        self.assertEqual(len(suggestions), 1)

