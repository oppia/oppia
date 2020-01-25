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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_manager
from core.domain import skill_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_services
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

        self.old_content = state_domain.SubtitledHtml(
            'content', '<p>old content html</p>').to_dict()
        exploration.states['State 1'].update_content(
            state_domain.SubtitledHtml.from_dict(self.old_content))
        exploration.states['State 2'].update_content(
            state_domain.SubtitledHtml.from_dict(self.old_content))
        exploration.states['State 3'].update_content(
            state_domain.SubtitledHtml.from_dict(self.old_content))
        exp_services._save_exploration(self.editor_id, exploration, '', [])  # pylint: disable=protected-access

        rights_manager.publish_exploration(self.editor, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.editor, self.EXP_ID, self.owner_id,
            rights_manager.ROLE_EDITOR)

        self.new_content = state_domain.SubtitledHtml(
            'content', '<p>new content html</p>').to_dict()
        self.resubmit_change_content = state_domain.SubtitledHtml(
            'content', '<p>resubmit change content html</p>').to_dict()

        self.logout()

        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
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
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
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
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
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
        self.login(self.AUTHOR_EMAIL_2)
        csrf_token = self.get_new_csrf_token()
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
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
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id_2))['suggestions']
        self.assertEqual(len(suggestions), 3)
        self.logout()

    def test_suggestion_to_exploration_handler_with_invalid_suggestion_id(self):
        self.login(self.EDITOR_EMAIL)

        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]

        csrf_token = self.get_new_csrf_token()

        # Invalid format of suggestion id.
        response = self.put_json(
            '%s/exploration/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion_to_accept['target_id'], 'invalid_suggestion_id'), {
                    'action': u'reject',
                    'review_message': u'Rejected!'
                }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Invalid format for suggestion_id. It must contain 3 parts '
            'separated by \'.\'')

        csrf_token = self.get_new_csrf_token()

        # Suggestion does not exist.
        self.put_json(
            '%s/exploration/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion_to_accept['target_id'],
                'exploration.target_id.id'), {
                    'action': u'reject',
                    'review_message': u'Rejected!'
                }, csrf_token=csrf_token,
            expected_status_int=404)

        self.logout()

    def test_suggestion_to_exploration_handler_with_invalid_target_type(self):
        self.login(self.EDITOR_EMAIL)

        question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state').to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION)
        }

        exp_id = 'new_exp_id'
        self.save_new_default_exploration(exp_id, self.editor_id)

        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
            suggestion_models.TARGET_TYPE_TOPIC, exp_id, 1,
            self.author_id, {
                'cmd': (
                    question_domain
                    .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                'question_dict': question_dict,
                'skill_id': None
            }, None, None)

        suggestion_id = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', exp_id)])[0].suggestion_id

        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '%s/exploration/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX, exp_id,
                suggestion_id), {
                    'action': u'reject',
                    'review_message': u'Rejected!'
                }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'This handler allows actions only on suggestions to explorations.')

        self.logout()

    def test_suggestion_to_exploration_handler_with_invalid_target_id(self):
        self.login(self.EDITOR_EMAIL)

        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]

        self.save_new_default_exploration('exp_id', self.editor_id)

        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '%s/exploration/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX, 'exp_id',
                suggestion_to_accept['suggestion_id']), {
                    'action': u'reject',
                    'review_message': u'Rejected!'
                }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'The exploration id provided does not match the exploration id '
            'present as part of the suggestion_id')

        self.logout()

    def test_owner_of_exploration_cannot_repond_to_own_suggestion(self):
        self.login(self.EDITOR_EMAIL)

        exp_id = 'new_exp_id'
        self.save_new_default_exploration(exp_id, self.editor_id)

        new_content = state_domain.SubtitledHtml(
            'content', '<p>new content html</p>').to_dict()
        change_cmd = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'State 1',
            'new_value': new_content
        }
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, exp_id, 1,
            self.editor_id, change_cmd, 'sample description', None)

        suggestion_id = suggestion_services.query_suggestions(
            [('author_id', self.editor_id), (
                'target_id', exp_id)])[0].suggestion_id

        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '%s/exploration/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                exp_id, suggestion_id), {
                    'action': u'reject',
                    'review_message': u'Rejected!'
                }, csrf_token=csrf_token, expected_status_int=401)

        self.assertEqual(
            response['error'], 'You cannot accept/reject your own suggestion.')

        self.logout()

    def test_suggestion_to_exploration_handler_with_invalid_action(self):
        self.login(self.EDITOR_EMAIL)

        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]

        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '%s/exploration/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion_to_accept['target_id'],
                suggestion_to_accept['suggestion_id']),
            {'action': 'invalid_action'}, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid action.')

        self.logout()

    def test_reject_suggestion_to_exploration(self):
        self.login(self.EDITOR_EMAIL)

        csrf_token = self.get_new_csrf_token()

        suggestion_to_reject = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_to_reject['suggestion_id'])

        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_IN_REVIEW)

        csrf_token = self.get_new_csrf_token()

        self.put_json('%s/exploration/%s/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX,
            suggestion_to_reject['target_id'],
            suggestion_to_reject['suggestion_id']), {
                'action': u'reject',
                'review_message': u'Rejected!'
            }, csrf_token=csrf_token)

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_to_reject['suggestion_id'])

        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_REJECTED)

        self.logout()

    def test_accept_suggestion(self):
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)

        # Test editor can accept successfully.
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]

        csrf_token = self.get_new_csrf_token()
        self.put_json('%s/exploration/%s/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX,
            suggestion_to_accept['target_id'],
            suggestion_to_accept['suggestion_id']), {
                'action': u'accept',
                'commit_message': u'commit message',
                'review_message': u'Accepted'
            }, csrf_token=csrf_token)
        suggestion_post_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]
        self.assertEqual(
            suggestion_post_accept['status'],
            suggestion_models.STATUS_ACCEPTED)
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(
            exploration.states[suggestion_to_accept[
                'change']['state_name']].content.html,
            suggestion_to_accept['change']['new_value']['html'])
        self.logout()

        # Testing user without permissions cannot accept.
        self.login(self.NORMAL_USER_EMAIL)
        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id_2))['suggestions'][0]

        csrf_token = self.get_new_csrf_token()
        self.put_json('%s/exploration/%s/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX,
            suggestion_to_accept['target_id'],
            suggestion_to_accept['suggestion_id']), {
                'action': u'accept',
                'commit_message': u'commit message',
                'review_message': u'Accepted'
            }, csrf_token=csrf_token, expected_status_int=401)
        self.logout()

        # Testing that author cannot accept own suggestion.
        self.login(self.AUTHOR_EMAIL_2)
        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id_2))['suggestions'][0]

        csrf_token = self.get_new_csrf_token()
        self.put_json('%s/exploration/%s/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX,
            suggestion_to_accept['target_id'],
            suggestion_to_accept['suggestion_id']), {
                'action': u'accept',
                'commit_message': u'commit message',
                'review_message': u'Accepted'
            }, csrf_token=csrf_token, expected_status_int=401)

        # Testing users with scores above threshold can accept.
        self.login(self.AUTHOR_EMAIL)
        suggestion_services.increment_score_for_user(
            self.author_id, 'content.Algebra', 15)

        csrf_token = self.get_new_csrf_token()
        self.put_json('%s/exploration/%s/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX,
            suggestion_to_accept['target_id'],
            suggestion_to_accept['suggestion_id']), {
                'action': u'accept',
                'commit_message': u'commit message',
                'review_message': u'Accepted'
            }, csrf_token=csrf_token)

        suggestion_post_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id_2))['suggestions'][0]
        self.assertEqual(
            suggestion_post_accept['status'],
            suggestion_models.STATUS_ACCEPTED)
        self.logout()

        # Testing admins can accept suggestions.
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id_2))['suggestions'][1]
        self.put_json('%s/exploration/%s/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX,
            suggestion_to_accept['target_id'],
            suggestion_to_accept['suggestion_id']), {
                'action': u'accept',
                'commit_message': u'commit message',
                'review_message': u'Accepted'
            }, csrf_token=csrf_token)
        suggestion_post_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id_2))['suggestions'][1]
        self.assertEqual(
            suggestion_post_accept['status'],
            suggestion_models.STATUS_ACCEPTED)
        self.logout()

    def test_suggestion_list_handler_with_invalid_query_field(self):
        response = self.get_json(
            '%s?invalid_query_field=value' % (
                feconf.SUGGESTION_LIST_URL_PREFIX), expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Not allowed to query on field invalid_query_field')

    def test_suggestion_list_handler(self):
        suggestions = self.get_json(
            '%s?author_id=%s&target_type=%s&target_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.author_id_2,
                suggestion_models.TARGET_TYPE_EXPLORATION, self.EXP_ID)
            )['suggestions']
        self.assertEqual(len(suggestions), 2)

    def test_cannot_resubmit_suggestion_with_invalid_suggestion_id(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '%s/resubmit/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX, 'invalid_suggestion_id'), {
                    'action': u'reject',
                    'review_message': u'Rejected!'
                }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'No suggestion found with given suggestion id')

    def test_resubmit_rejected_suggestion(self):

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), ('target_id', self.EXP_ID)])[0]
        suggestion_services.reject_suggestion(
            suggestion, self.reviewer_id, 'reject message')
        self.logout()

        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.put_json('%s/resubmit/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX, suggestion.suggestion_id), {
                'summary_message': 'summary message',
                'action': u'resubmit',
                'change': {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'State 1',
                    'new_value': self.resubmit_change_content,
                    'old_value': self.old_content
                }
            }, csrf_token=csrf_token)

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), ('target_id', self.EXP_ID)])[0]
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(
            suggestion.change.new_value['html'],
            self.resubmit_change_content['html'])
        self.assertEqual(
            suggestion.change.cmd, exp_domain.CMD_EDIT_STATE_PROPERTY)
        self.assertEqual(
            suggestion.change.property_name, exp_domain.STATE_PROPERTY_CONTENT)
        self.assertEqual(
            suggestion.change.state_name, 'State 1')
        self.logout()


class QuestionSuggestionTests(test_utils.GenericTestBase):

    AUTHOR_EMAIL = 'author@example.com'
    AUTHOR_EMAIL_2 = 'author2@example.com'

    # Needs to be 12 characters long.
    SKILL_ID = 'skill1234567'

    SKILL_DESCRIPTION = 'skill to link question to'

    def setUp(self):
        super(QuestionSuggestionTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.save_new_skill(
            self.SKILL_ID, self.admin_id, description=self.SKILL_DESCRIPTION)
        self.question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state').to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [self.SKILL_ID]
        }
        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    suggestion_models.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': suggestion_models.TARGET_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': None
                },
                'description': 'Add new question to skill'
            }, csrf_token=csrf_token)
        self.logout()

    def test_query_question_suggestions(self):
        suggestions = self.get_json(
            '%s?suggestion_type=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                suggestion_models.SUGGESTION_TYPE_ADD_QUESTION)
            )['suggestions']
        self.assertEqual(len(suggestions), 1)
        suggestion = suggestions[0]
        self.assertEqual(
            suggestion['suggestion_type'],
            suggestion_models.SUGGESTION_TYPE_ADD_QUESTION)
        self.assertEqual(suggestion['target_id'], self.SKILL_ID)
        self.assertEqual(
            suggestion['target_type'], suggestion_models.TARGET_TYPE_SKILL)
        self.assertEqual(
            suggestion['change']['cmd'],
            question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION)

    def test_accept_question_suggestion(self):
        suggestion_to_accept = self.get_json(
            '%s?suggestion_type=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                suggestion_models.SUGGESTION_TYPE_ADD_QUESTION)
            )['suggestions'][0]

        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            self.put_json('%s/skill/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion_to_accept['target_id'],
                suggestion_to_accept['suggestion_id']), {
                    'action': u'accept',
                    'commit_message': u'commit message',
                    'review_message': u'This looks good!',
                    'skill_id': self.SKILL_ID
                }, csrf_token=csrf_token)

        suggestion_post_accept = self.get_json(
            '%s?suggestion_type=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                suggestion_models.SUGGESTION_TYPE_ADD_QUESTION)
            )['suggestions'][0]
        self.assertEqual(
            suggestion_post_accept['status'],
            suggestion_models.STATUS_ACCEPTED)
        (
            questions, merged_question_skill_links, _) = (
                question_services.get_displayable_question_skill_link_details(
                    1, [self.SKILL_ID], ''))
        self.assertEqual(len(questions), 1)
        self.assertEqual(
            merged_question_skill_links[0].skill_descriptions,
            [self.SKILL_DESCRIPTION])
        self.assertEqual(
            merged_question_skill_links[0].skill_difficulties, [0.3])
        self.assertEqual(
            questions[0].question_content,
            self.question_dict['question_state_data']['content']['html']
        )
        thread_messages = feedback_services.get_messages(
            suggestion_to_accept['suggestion_id'])
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(last_message.text, 'This looks good!')


class SkillSuggestionTests(test_utils.GenericTestBase):

    AUTHOR_EMAIL = 'author@example.com'

    def setUp(self):
        super(SkillSuggestionTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Description')

        self.question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state').to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [self.skill_id]
        }

        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    suggestion_models.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': suggestion_models.TARGET_TYPE_SKILL,
                'target_id': self.skill_id,
                'target_version_at_submission': 1,
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': None
                },
                'description': 'Add new question to skill'
            }, csrf_token=csrf_token)

        self.logout()

    def test_cannot_access_suggestion_to_skill_handler(self):
        self.login(self.ADMIN_EMAIL)

        thread_id = feedback_services.create_thread(
            suggestion_models.TARGET_TYPE_QUESTION, self.skill_id,
            self.author_id, 'description', '', has_suggestion=True)

        csrf_token = self.get_new_csrf_token()

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', False):
            self.put_json(
                '%s/skill/%s/%s' % (
                    feconf.SUGGESTION_ACTION_URL_PREFIX, self.skill_id,
                    thread_id), {
                        'action': u'reject',
                        'review_message': u'Rejected!'
                    }, csrf_token=csrf_token, expected_status_int=404)

        self.logout()

    def test_suggestion_to_skill_handler_with_invalid_target_type(self):
        self.login(self.ADMIN_EMAIL)

        exp_id = 'new_exp_id'
        self.save_new_default_exploration(exp_id, self.admin_id)

        new_content = state_domain.SubtitledHtml(
            'content', '<p>new content html</p>').to_dict()
        change_cmd = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'State 1',
            'new_value': new_content
        }
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, exp_id, 1,
            self.author_id, change_cmd, 'sample description', None)

        suggestion_id = suggestion_services.query_suggestions(
            [('author_id', self.author_id), (
                'target_id', exp_id)])[0].suggestion_id

        csrf_token = self.get_new_csrf_token()

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            response = self.put_json(
                '%s/skill/%s/%s' % (
                    feconf.SUGGESTION_ACTION_URL_PREFIX,
                    self.skill_id, suggestion_id), {
                        'action': u'reject',
                        'review_message': u'Rejected!'
                    }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'This handler allows actions only on suggestions to skills.')

        self.logout()

    def test_suggestion_to_skill_handler_with_invalid_target_id(self):
        self.login(self.ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]

        csrf_token = self.get_new_csrf_token()

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            response = self.put_json(
                '%s/skill/%s/%s' % (
                    feconf.SUGGESTION_ACTION_URL_PREFIX,
                    'skill_id', suggestion_to_accept['suggestion_id']),
                {
                    'action': u'reject',
                    'review_message': u'Rejected!'
                },
                csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'The skill id provided does not match the skill id '
            'present as part of the suggestion_id')

        self.logout()

    def test_suggestion_to_skill_handler_with_invalid_action(self):
        self.login(self.ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]

        csrf_token = self.get_new_csrf_token()

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            response = self.put_json(
                '%s/skill/%s/%s' % (
                    feconf.SUGGESTION_ACTION_URL_PREFIX,
                    suggestion_to_accept['target_id'],
                    suggestion_to_accept['suggestion_id']),
                {'action': 'invalid_action'}, csrf_token=csrf_token,
                expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid action.')

        self.logout()

    def test_reject_suggestion_to_skill(self):
        self.login(self.ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()

        suggestion_to_reject = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_to_reject['suggestion_id'])

        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_IN_REVIEW)

        csrf_token = self.get_new_csrf_token()

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            self.put_json('%s/skill/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion_to_reject['target_id'],
                suggestion_to_reject['suggestion_id']), {
                    'action': u'reject',
                    'review_message': u'Rejected!'
                }, csrf_token=csrf_token)

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_to_reject['suggestion_id'])

        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_REJECTED)

        self.logout()

    def test_accept_suggestion_to_skill(self):
        self.login(self.ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_to_accept['suggestion_id'])

        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_IN_REVIEW)

        csrf_token = self.get_new_csrf_token()

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            self.put_json('%s/skill/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion_to_accept['target_id'],
                suggestion_to_accept['suggestion_id']), {
                    'action': u'accept',
                    'commit_message': u'commit message',
                    'review_message': u'Accepted!',
                    'skill_id': self.skill_id
                }, csrf_token=csrf_token)

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_to_accept['suggestion_id'])

        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_ACCEPTED)

        self.logout()


class UserSubmittedSuggestionsHandlerTest(test_utils.GenericTestBase):
    """Unit test for the UserSubmittedSuggestionsHandler."""
    AUTHOR_EMAIL = 'author@example.com'

    def setUp(self):
        super(UserSubmittedSuggestionsHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'
        self.EXP_ID = 'exp1'
        # Needs to be 12 characters long.
        self.SKILL_ID = 'skill1234567'
        self.SKILL_DESCRIPTION = 'skill to link question to'
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='Exploration title')
        exp_services.save_new_exploration(self.owner_id, exploration)

        topic = topic_domain.Topic.create_default_topic(
            topic_id=self.TOPIC_ID, name='topic', abbreviated_name='abbrev')
        topic_services.save_new_topic(self.owner_id, topic)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, title='A story',
            corresponding_topic_id=self.TOPIC_ID)
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID)

        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': self.EXP_ID
            })], 'Changes.')

        self.save_new_skill(
            self.SKILL_ID, self.owner_id, description=self.SKILL_DESCRIPTION)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.reviewer_id = self.editor_id

        self.set_admins([self.ADMIN_USERNAME])
        self.editor = user_services.UserActionsInfo(self.editor_id)

        # Login and create exploration and suggestions.
        self.login(self.EDITOR_EMAIL)
        self.save_new_linear_exp_with_state_names_and_interactions(
            self.EXP_ID, self.editor_id, ['State 1', 'State 2', 'State 3'],
            ['TextInput'], category='Algebra')

        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'Introduction',
                    'new_value': {
                        'content_id': 'content',
                        'html': '<p>new content html</p>'
                    }
                })], 'Add content')

        self.logout()

        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': (suggestion_models.TARGET_TYPE_EXPLORATION),
                'target_id': self.EXP_ID,
                'target_version_at_submission': exploration.version,
                'change': {
                    'cmd': exp_domain.CMD_ADD_TRANSLATION,
                    'state_name': 'Introduction',
                    'content_id': 'content',
                    'language_code': 'hi',
                    'content_html': '<p>new content html</p>',
                    'translation_html': '<p>new content html in Hindi</p>'
                },
                'description': 'Adds translation',
                'final_reviewer_id': None
            }, csrf_token=csrf_token)

        self.question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state').to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [self.SKILL_ID]
        }

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    suggestion_models.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': suggestion_models.TARGET_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': None
                },
                'description': 'Add new question to skill'
            }, csrf_token=csrf_token)

        self.logout()

    def test_exploration_handler_returns_data(self):
        self.login(self.AUTHOR_EMAIL)

        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content')
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        response = self.get_json(
            '/getsubmittedsuggestions/topic/translate_content')
        self.assertEqual(response, {})

    def test_skill_handler_returns_data(self):
        self.login(self.AUTHOR_EMAIL)

        response = self.get_json(
            '/getsubmittedsuggestions/skill/add_question')
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        response = self.get_json(
            '/getsubmittedsuggestions/topic/add_question')
        self.assertEqual(response, {})

    def test_handler_with_invalid_suggestion_type_raise_error(self):
        self.login(self.AUTHOR_EMAIL)

        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content')
        self.assertEqual(len(response['suggestions']), 1)

        self.get_json(
            '/getsubmittedsuggestions/exploration/invalid_suggestion_type',
            expected_status_int=400)

    def test_handler_with_invalid_target_type_raise_error(self):
        self.login(self.AUTHOR_EMAIL)

        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content')
        self.assertEqual(len(response['suggestions']), 1)

        self.get_json(
            '/getsubmittedsuggestions/invalid_target_type'
            '/translate_content', expected_status_int=400)


class ReviewableSuggestionsHandlerTest(test_utils.GenericTestBase):
    """Unit test for the ReviewableSuggestionsHandler."""

    def setUp(self):
        super(ReviewableSuggestionsHandlerTest, self).setUp()
        self.AUTHOR_EMAIL = 'author@example.com'
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'
        self.EXP_ID = 'exp1'
        # Needs to be 12 characters long.
        self.SKILL_ID = 'skill1234567'
        self.SKILL_DESCRIPTION = 'skill to link question to'
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='Exploration title')
        exp_services.save_new_exploration(self.owner_id, exploration)

        topic = topic_domain.Topic.create_default_topic(
            topic_id=self.TOPIC_ID, name='topic', abbreviated_name='abbrev')
        topic_services.save_new_topic(self.owner_id, topic)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, title='A story',
            corresponding_topic_id=self.TOPIC_ID)
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID)

        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': self.EXP_ID
            })], 'Changes.')

        self.save_new_skill(
            self.SKILL_ID, self.owner_id, description=self.SKILL_DESCRIPTION)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.reviewer_id = self.editor_id

        self.set_admins([self.ADMIN_USERNAME])
        self.editor = user_services.UserActionsInfo(self.editor_id)

        # Login and create exploration and suggestions.
        self.login(self.EDITOR_EMAIL)
        self.save_new_linear_exp_with_state_names_and_interactions(
            self.EXP_ID, self.editor_id, ['State 1', 'State 2', 'State 3'],
            ['TextInput'], category='Algebra')

        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'Introduction',
                    'new_value': {
                        'content_id': 'content',
                        'html': '<p>new content html</p>'
                    }
                })], 'Add content')

        self.logout()

        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': (suggestion_models.TARGET_TYPE_EXPLORATION),
                'target_id': self.EXP_ID,
                'target_version_at_submission': exploration.version,
                'change': {
                    'cmd': exp_domain.CMD_ADD_TRANSLATION,
                    'state_name': 'Introduction',
                    'content_id': 'content',
                    'language_code': 'hi',
                    'content_html': '<p>new content html</p>',
                    'translation_html': '<p>new content html in Hindi</p>'
                },
                'description': 'Adds translation',
                'final_reviewer_id': None
            }, csrf_token=csrf_token)

        self.question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state').to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [self.SKILL_ID]
        }

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    suggestion_models.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': suggestion_models.TARGET_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': None
                },
                'description': 'Add new question to skill'
            }, csrf_token=csrf_token)

        self.logout()

    def test_exploration_handler_returns_data(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        response = self.get_json(
            '/getreviewablesuggestions/exploration/translate_content')
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        response = self.get_json(
            '/getreviewablesuggestions/topic/translate_content')
        self.assertEqual(response, {})

    def test_skill_handler_returns_data(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        response = self.get_json(
            '/getreviewablesuggestions/skill/add_question')
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        response = self.get_json(
            '/getreviewablesuggestions/topic/add_question')
        self.assertEqual(response, {})

    def test_handler_with_invalid_suggestion_type_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        response = self.get_json(
            '/getreviewablesuggestions/exploration/translate_content')
        self.assertEqual(len(response['suggestions']), 1)

        self.get_json(
            '/getreviewablesuggestions/exploration/invalid_suggestion_type',
            expected_status_int=400)

    def test_handler_with_invalid_target_type_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        response = self.get_json(
            '/getreviewablesuggestions/exploration/translate_content')
        self.assertEqual(len(response['suggestions']), 1)

        self.get_json(
            '/getreviewablesuggestions/invalid_target_type'
            '/translate_content', expected_status_int=400)
