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

import os

from constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import fs_domain
from core.domain import opportunity_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_domain
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
import python_utils

(suggestion_models, feedback_models) = models.Registry.import_models([
    models.NAMES.suggestion, models.NAMES.feedback])


class SuggestionUnitTests(test_utils.GenericTestBase):

    IMAGE_UPLOAD_URL_PREFIX = '/createhandler/imageupload'
    ASSET_HANDLER_URL_PREFIX = '/assetsdevhandler'
    EXP_ID = 'exp1'
    TRANSLATION_LANGUAGE_CODE = 'en'

    AUTHOR_EMAIL = 'author@example.com'
    AUTHOR_EMAIL_2 = 'author2@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    TRANSLATOR_EMAIL = 'translator@example.com'
    NORMAL_USER_EMAIL = 'user@example.com'

    def setUp(self):
        super(SuggestionUnitTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.AUTHOR_EMAIL_2, 'author2')
        self.signup(self.NORMAL_USER_EMAIL, 'normalUser')
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.signup(self.TRANSLATOR_EMAIL, 'translator')

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.author_id_2 = self.get_user_id_from_email(self.AUTHOR_EMAIL_2)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.translator_id = self.get_user_id_from_email(self.TRANSLATOR_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'hi')
        self.editor = user_services.get_user_actions_info(self.editor_id)

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
            self.editor, self.EXP_ID, self.owner_id, rights_domain.ROLE_EDITOR)

        self.new_content = state_domain.SubtitledHtml(
            'content', '<p>new content html</p>').to_dict()
        self.resubmit_change_content = state_domain.SubtitledHtml(
            'content', '<p>resubmit change content html</p>').to_dict()

        self.logout()

        # Create some suggestions in the backend.
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp1', exploration.version,
            self.author_id, {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'State 1',
                'old_value': self.old_content,
                'new_value': self.new_content
            },
            'change to state 1')
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp1', exploration.version,
            self.author_id_2, {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'State 2',
                'old_value': self.old_content,
                'new_value': self.new_content
            },
            'change to state 2')
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp1', exploration.version,
            self.author_id_2, {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'State 3',
                'old_value': self.old_content,
                'new_value': self.new_content
            },
            'change to state 3')

        self.login(self.TRANSLATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': 'exp1',
                'target_version_at_submission': exploration.version,
                'change': {
                    'cmd': exp_domain.CMD_ADD_TRANSLATION,
                    'state_name': 'State 3',
                    'content_id': 'content',
                    'language_code': 'hi',
                    'content_html': '<p>old content html</p>',
                    'translation_html': '<p>In Hindi</p>'
                },
                'description': 'change to state 3',
            }, csrf_token=csrf_token)
        self.logout()

    def test_edit_state_content_suggestion_is_not_allowed(self):
        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': 'exp1',
                'target_version_at_submission': 2,
                'change': {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'State 1',
                    'old_value': self.old_content,
                    'new_value': self.new_content
                },
                'description': 'change to state 1',
            }, csrf_token=csrf_token, expected_status_int=400)
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
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': ['skill_id'],
            'inapplicable_skill_misconception_ids': ['skillid12345-1']
        }

        exp_id = 'new_exp_id'
        self.save_new_default_exploration(exp_id, self.editor_id)

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_TOPIC, exp_id, 1,
            self.author_id, {
                'cmd': (
                    question_domain
                    .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                'question_dict': question_dict,
                'skill_id': None,
                'skill_difficulty': 0.3
            }, None)

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
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, exp_id, 1,
            self.editor_id, change_cmd, 'sample description')

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

    def test_suggestion_to_exploration_handler_with_long_commit_mesage(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]

        csrf_token = self.get_new_csrf_token()
        response = self.put_json('%s/exploration/%s/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX,
            suggestion_to_accept['target_id'],
            suggestion_to_accept['suggestion_id']), {
                'action': u'accept',
                'commit_message':
                    u'a' * (constants.MAX_COMMIT_MESSAGE_LENGTH + 1),
                'review_message': u'Accepted'
            }, csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(
            response['error'],
            'Commit messages must be at most 375 characters long.'
        )

    def test_accept_suggestion(self):
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)

        # Test editor can accept successfully.
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions'][0]

        # By default, when a suggestion is accepted and the recording of scores
        # is enabled, the score of the author of that suggestion is increased
        # by 1. Therefore, by setting that increment to the minimum score
        # required to review, we can ensure that the author of this suggestion
        # has a high enough score to review suggestions in this category. This
        # will be used to test whether the author can review a suggestion in
        # the same category because of the author's high score in a later test.
        enable_recording_of_scores_swap = self.swap(
            feconf, 'ENABLE_RECORDING_OF_SCORES', True)
        increment_score_of_author_swap = self.swap(
            suggestion_models, 'INCREMENT_SCORE_OF_AUTHOR_BY',
            feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW)

        with enable_recording_of_scores_swap, increment_score_of_author_swap:
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
        # The score of this author was increased to the review threshold amount
        # when the editor accepted a suggestion that was authored by this user.
        self.login(self.AUTHOR_EMAIL)

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
                feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID)
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
            suggestion.suggestion_id, self.reviewer_id, 'reject message')
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

    def test_translation_accept_suggestion_by_reviewer(self):
        # Test reviewer can accept successfully.
        self.login(self.REVIEWER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.translator_id))['suggestions'][0]

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
                self.translator_id))['suggestions'][0]
        self.assertEqual(
            suggestion_post_accept['status'],
            suggestion_models.STATUS_ACCEPTED)
        self.logout()

    def test_translation_suggestion_creation_with_new_images(self):
        exp_id = '12345678exp1'
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                exp_id, self.editor_id, ['State 1'],
                ['EndExploration'], category='Algebra'))

        state_content_dict = {
            'content_id': 'content',
            'html': (
                '<oppia-noninteractive-image filepath-with-value='
                '"&quot;img.png&quot;" caption-with-value="&quot;&quot;" '
                'alt-with-value="&quot;Image&quot;">'
                '</oppia-noninteractive-image>')
        }
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None) as f:
            raw_image = f.read()
        self.post_json(
            '%s/exploration/%s' % (self.IMAGE_UPLOAD_URL_PREFIX, exp_id),
            {'filename': 'img.png'},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),))
        exp_services.update_exploration(
            self.editor_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'State 1',
                'new_value': state_content_dict
            })], 'Changes content.')
        rights_manager.publish_exploration(self.editor, exp_id)

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        text_to_translate = exploration.states['State 1'].content.html
        self.logout()

        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id))

        self.assertTrue(fs.isfile('image/img.png'))

        self.login(self.TRANSLATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': exp_id,
                'target_version_at_submission': exploration.version,
                'change': {
                    'cmd': exp_domain.CMD_ADD_TRANSLATION,
                    'state_name': 'State 1',
                    'content_id': 'content',
                    'language_code': 'hi',
                    'content_html': text_to_translate,
                    'translation_html': (
                        '<oppia-noninteractive-image filepath-with-value='
                        '"&quot;translation_image.png&quot;" '
                        'caption-with-value="&quot;&quot;" '
                        'alt-with-value="&quot;Image&quot;">'
                        '</oppia-noninteractive-image>')
                },
            }, csrf_token=csrf_token,
            upload_files=(
                ('translation_image.png', 'translation_image.png', raw_image), )
            )

        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.IMAGE_CONTEXT_EXPLORATION_SUGGESTIONS, exp_id))

        self.assertTrue(fs.isfile('image/img.png'))
        self.assertTrue(fs.isfile('image/img_compressed.png'))
        self.assertTrue(fs.isfile('image/translation_image.png'))
        self.assertTrue(fs.isfile('image/img_compressed.png'))

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.translator_id))['suggestions'][0]
        self.logout()

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.put_json('%s/exploration/%s/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX,
            suggestion_to_accept['target_id'],
            suggestion_to_accept['suggestion_id']), {
                'action': u'accept',
                'commit_message': u'Translated content of State 1',
                'review_message': u'This looks good!',
            }, csrf_token=csrf_token)

        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id))
        self.assertTrue(fs.isfile('image/img.png'))
        self.assertTrue(fs.isfile('image/translation_image.png'))
        self.assertTrue(fs.isfile('image/img_compressed.png'))


class QuestionSuggestionTests(test_utils.GenericTestBase):

    AUTHOR_EMAIL = 'author@example.com'

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
            'linked_skill_ids': [self.SKILL_ID],
            'inapplicable_skill_misconception_ids': ['skillid12345-1']
        }
        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': self.SKILL_ID,
                    'skill_difficulty': 0.3
                },
                'description': 'Add new question to skill'
            }, csrf_token=csrf_token)
        self.logout()

    def test_create_question_suggestion(self):
        self.login(self.AUTHOR_EMAIL)
        suggestions = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions']
        self.assertEqual(len(suggestions), 1)
        self.logout()

    def test_query_question_suggestions(self):
        suggestions = self.get_json(
            '%s?suggestion_type=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                feconf.SUGGESTION_TYPE_ADD_QUESTION)
            )['suggestions']
        self.assertEqual(len(suggestions), 1)
        suggestion = suggestions[0]
        self.assertEqual(
            suggestion['suggestion_type'],
            feconf.SUGGESTION_TYPE_ADD_QUESTION)
        self.assertEqual(suggestion['target_id'], self.SKILL_ID)
        self.assertEqual(
            suggestion['target_type'], feconf.ENTITY_TYPE_SKILL)
        self.assertEqual(
            suggestion['change']['cmd'],
            question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION)

    def test_accept_question_suggestion(self):
        suggestion_to_accept = self.get_json(
            '%s?suggestion_type=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                feconf.SUGGESTION_TYPE_ADD_QUESTION)
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
                feconf.SUGGESTION_TYPE_ADD_QUESTION)
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

    def test_create_suggestion_invalid_target_version_input(self):
        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 'invalid_target_version',
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': self.SKILL_ID,
                    'skill_difficulty': 0.3
                },
                'description': 'Add new question to skill'
            }, csrf_token=csrf_token, expected_status_int=400)
        suggestions = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions']

        self.assertEqual(
            response['error'],
            'Expected target_version_at_submission to be an int, received <type'
            ' \'unicode\'>')
        self.assertEqual(len(suggestions), 1)
        self.logout()

    def test_suggestion_creation_with_valid_images(self):
        self.save_new_skill(
            'skill_id2', self.admin_id, description='description')
        question_state_data_dict = self._create_valid_question_data(
            'default_state').to_dict()
        valid_html = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n-1)(x - a_n)&amp;quot;, &amp;quot;svg_filenam'
            'e&amp;quot;: &amp;quot;file.svg&amp;quot;}"></oppia-noninte'
            'ractive-math>'
        )
        question_state_data_dict['content']['html'] = valid_html
        self.question_dict = {
            'question_state_data': question_state_data_dict,
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': ['skill_id2'],
            'inapplicable_skill_misconception_ids': []
        }
        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None) as f:
            raw_image = f.read()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': self.SKILL_ID,
                    'skill_difficulty': 0.3
                },
                'description': 'Add new question to skill'
            }, csrf_token=csrf_token, upload_files=(
                ('file.svg', 'file.svg', raw_image), ))
        self.logout()

    def test_suggestion_creation_when_images_are_not_provided(self):
        self.save_new_skill(
            'skill_id2', self.admin_id, description='description')
        question_state_data_dict = self._create_valid_question_data(
            'default_state').to_dict()
        valid_html = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n-1)(x - a_n)&amp;quot;, &amp;quot;svg_filenam'
            'e&amp;quot;: &amp;quot;file.svg&amp;quot;}"></oppia-noninte'
            'ractive-math>'
        )
        question_state_data_dict['content']['html'] = valid_html
        self.question_dict = {
            'question_state_data': question_state_data_dict,
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': ['skill_id2'],
            'inapplicable_skill_misconception_ids': []
        }
        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response_dict = self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': self.SKILL_ID,
                    'skill_difficulty': 0.3
                },
                'description': 'Add new question to skill'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertIn(
            'No image data provided for file with name file.svg.',
            response_dict['error'])
        self.logout()

    def test_suggestion_creation_when_images_are_not_valid(self):
        self.save_new_skill(
            'skill_id2', self.admin_id, description='description')
        question_state_data_dict = self._create_valid_question_data(
            'default_state').to_dict()
        valid_html = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n-1)(x - a_n)&amp;quot;, &amp;quot;svg_filenam'
            'e&amp;quot;: &amp;quot;file.svg&amp;quot;}"></oppia-noninte'
            'ractive-math>'
        )
        question_state_data_dict['content']['html'] = valid_html
        self.question_dict = {
            'question_state_data': question_state_data_dict,
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': ['skill_id2'],
            'inapplicable_skill_misconception_ids': []
        }
        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        large_image = '<svg><path d="%s" /></svg>' % (
            'M150 0 L75 200 L225 200 Z ' * 4000)

        response_dict = self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': self.SKILL_ID,
                    'skill_difficulty': 0.3
                },
                'description': 'Add new question to skill'
            }, csrf_token=csrf_token,
            upload_files=(
                ('file.svg', 'file.svg', large_image),),
            expected_status_int=400)

        self.assertIn(
            'Image exceeds file size limit of 100 KB.',
            response_dict['error'])
        self.logout()


class SkillSuggestionTests(test_utils.GenericTestBase):

    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'

    def setUp(self):
        super(SkillSuggestionTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.REVIEWER_EMAIL, 'reviewer')

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        user_services.allow_user_to_review_question(self.reviewer_id)

        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Description')

        self.question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state').to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [self.skill_id],
            'inapplicable_skill_misconception_ids': ['skillid12345-1']
        }

        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.skill_id,
                'target_version_at_submission': 1,
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': self.skill_id,
                    'skill_difficulty': 0.3
                },
                'description': 'Add new question to skill'
            }, csrf_token=csrf_token)

        self.logout()

    def test_cannot_access_suggestion_to_skill_handler(self):
        self.login(self.ADMIN_EMAIL)

        thread_id = feedback_services.create_thread(
            feconf.ENTITY_TYPE_QUESTION, self.skill_id,
            self.author_id, 'description', '', has_suggestion=True)

        csrf_token = self.get_new_csrf_token()

        self.put_json(
            '%s/skill/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX, self.skill_id,
                thread_id), {
                    'action': u'reject',
                    'review_message': u'Rejected!'
                }, csrf_token=csrf_token, expected_status_int=400)

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
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, exp_id, 1,
            self.author_id, change_cmd, 'sample description')

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

    def test_reviewer_accept_suggestion_to_skill(self):
        self.login(self.REVIEWER_EMAIL)
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
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'
        self.EXP_ID = 'exp1'
        # Needs to be 12 characters long.
        self.SKILL_ID = 'skill1234567'
        self.SKILL_DESCRIPTION = 'skill to link question to'
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, title='Exploration title',
            category='Algebra', end_state_name='End State',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.owner_id, self.EXP_ID)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'topic', 'abbrev', 'description')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_333'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(self.TOPIC_ID, self.admin_id)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A story', 'Description', self.TOPIC_ID, 'story-a')
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID)
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id)

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
        self.editor = user_services.get_user_actions_info(self.editor_id)

        # Login and create exploration and suggestions.
        self.login(self.EDITOR_EMAIL)

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
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': (feconf.ENTITY_TYPE_EXPLORATION),
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
            }, csrf_token=csrf_token)

        self.question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state').to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [self.SKILL_ID],
            'inapplicable_skill_misconception_ids': ['skillid12345-1']
        }

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': None,
                    'skill_difficulty': 0.3
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

    def test_question_suggestions_data_for_deleted_opportunities(self):
        self.login(self.AUTHOR_EMAIL)

        opportunity_services.delete_skill_opportunity(self.SKILL_ID)
        response = self.get_json(
            '/getsubmittedsuggestions/skill/add_question')
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        self.assertEqual(
            response['target_id_to_opportunity_dict'][self.SKILL_ID], None)

    def test_translation_suggestions_data_for_deleted_opportunities(self):
        self.login(self.AUTHOR_EMAIL)

        opportunity_services.delete_exploration_opportunities([self.EXP_ID])
        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content')
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        self.assertEqual(
            response['target_id_to_opportunity_dict'][self.EXP_ID], None)

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
        self.REVIEWER_EMAIL = 'reviewer@example.com'
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.editor = user_services.get_user_actions_info(self.editor_id)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'
        self.EXP_ID = 'exp1'
        # Needs to be 12 characters long.
        self.SKILL_ID = 'skill1234567'
        self.SKILL_DESCRIPTION = 'skill to link question to'
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, title='Exploration title',
            category='Algebra', end_state_name='End State',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.owner_id, self.EXP_ID)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'topic', 'abbrev', 'description')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_333'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(self.TOPIC_ID, self.admin_id)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A story', 'Description', self.TOPIC_ID, 'story-b')
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID)
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id)

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

        user_services.allow_user_to_review_question(self.reviewer_id)
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'hi')
        # Login and update exploration and suggestions.
        self.login(self.EDITOR_EMAIL)

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
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': (feconf.ENTITY_TYPE_EXPLORATION),
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
            }, csrf_token=csrf_token)

        self.question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state').to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [self.SKILL_ID],
            'inapplicable_skill_misconception_ids': ['skillid12345-1']
        }

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': None,
                    'skill_difficulty': 0.3
                },
                'description': 'Add new question to skill'
            }, csrf_token=csrf_token)

        self.logout()

    def test_exploration_handler_returns_data(self):
        self.login(self.REVIEWER_EMAIL)

        response = self.get_json(
            '/getreviewablesuggestions/exploration/translate_content')
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        response = self.get_json(
            '/getreviewablesuggestions/topic/translate_content')
        self.assertEqual(response, {})

    def test_skill_handler_returns_data(self):
        self.login(self.REVIEWER_EMAIL)

        response = self.get_json(
            '/getreviewablesuggestions/skill/add_question')
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        response = self.get_json(
            '/getreviewablesuggestions/topic/add_question')
        self.assertEqual(response, {})

    def test_handler_with_invalid_suggestion_type_raise_error(self):
        self.login(self.REVIEWER_EMAIL)

        response = self.get_json(
            '/getreviewablesuggestions/exploration/translate_content')
        self.assertEqual(len(response['suggestions']), 1)

        self.get_json(
            '/getreviewablesuggestions/exploration/invalid_suggestion_type',
            expected_status_int=404)

    def test_handler_with_invalid_target_type_raise_error(self):
        self.login(self.REVIEWER_EMAIL)

        response = self.get_json(
            '/getreviewablesuggestions/exploration/translate_content')
        self.assertEqual(len(response['suggestions']), 1)

        self.get_json(
            '/getreviewablesuggestions/invalid_target_type'
            '/translate_content', expected_status_int=400)
