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

from __future__ import annotations

import base64
import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import fs_services
from core.domain import opportunity_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import skill_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import translation_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, Union, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import suggestion_models

datastore_services = models.Registry.import_datastore_services()
(suggestion_models,) = models.Registry.import_models([
    models.Names.SUGGESTION
])


class SuggestionUnitTests(test_utils.GenericTestBase):

    ASSET_HANDLER_URL_PREFIX: Final = '/assetsdevhandler'
    TOPIC_ID = 'topic'
    STORY_ID = 'story'
    EXP_ID: Final = 'exp1'
    SKILL_ID = 'skill1234567'
    SKILL_DESCRIPTION = 'skill to link question to'
    TRANSLATION_LANGUAGE_CODE: Final = 'en'

    AUTHOR_EMAIL: Final = 'author@example.com'
    AUTHOR_EMAIL_2: Final = 'author2@example.com'
    REVIEWER_EMAIL: Final = 'reviewer@example.com'
    TRANSLATOR_EMAIL: Final = 'translator@example.com'
    STRINGS_TRANSLATOR_EMAIL: Final = 'translator1@example.com'
    NORMAL_USER_EMAIL: Final = 'user@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.AUTHOR_EMAIL_2, 'author2')
        self.signup(self.NORMAL_USER_EMAIL, 'normalUser')
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.signup(self.TRANSLATOR_EMAIL, 'translator')
        self.signup(self.STRINGS_TRANSLATOR_EMAIL, 'stranslator')

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.author_id_2 = self.get_user_id_from_email(self.AUTHOR_EMAIL_2)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.translator_id = self.get_user_id_from_email(self.TRANSLATOR_EMAIL)
        self.strings_translator_id = self.get_user_id_from_email(
            self.STRINGS_TRANSLATOR_EMAIL)
        self.normal_useer_id = self.get_user_id_from_email(
            self.NORMAL_USER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'hi')
        user_services.allow_user_to_review_question(self.reviewer_id)
        self.editor = user_services.get_user_actions_info(self.editor_id)

        # Login and create exploration and suggestions.
        self.login(self.EDITOR_EMAIL)
        self.exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                self.EXP_ID, self.editor_id, ['State 1', 'State 2', 'State 3'],
                ['TextInput'], category='Algebra'))
        self.old_content_html = '<p>old content html</p>'
        self.exploration.states['State 1'].content.html = self.old_content_html
        self.exploration.states['State 2'].content.html = self.old_content_html
        self.exploration.states['State 3'].content.html = self.old_content_html
        exp_models = (
            exp_services._compute_models_for_updating_exploration( # pylint: disable=protected-access
                self.editor_id,
                self.exploration,
                '',
                []
            )
        )
        datastore_services.update_timestamps_multi(exp_models)
        datastore_services.put_multi(exp_models)

        rights_manager.publish_exploration(self.editor, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.editor, self.EXP_ID, self.owner_id, rights_domain.ROLE_EDITOR)

        self.new_content_html = '<p>new content html</p>'

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'topic', 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_333'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_333']
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

        self.logout()

        # Create some suggestions in the backend.
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID,
            self.exploration.version,
            self.author_id, {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'State 1',
                'old_value': {
                    'content_id': (
                        self.exploration.states['State 1'].content.content_id),
                    'html': self.old_content_html
                },
                'new_value': {
                    'content_id': (
                        self.exploration.states['State 1'].content.content_id),
                    'html': self.new_content_html
                }
            },
            'change to state 1')
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID,
            self.exploration.version,
            self.author_id_2, {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'State 2',
                'old_value': {
                    'content_id': (
                        self.exploration.states['State 2'].content.content_id),
                    'html': self.old_content_html
                },
                'new_value': {
                    'content_id': (
                        self.exploration.states['State 2'].content.content_id),
                    'html': self.new_content_html
                }
            },
            'change to state 2')
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID,
            self.exploration.version,
            self.author_id_2, {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'State 3',
                'old_value': {
                    'content_id': (
                        self.exploration.states['State 3'].content.content_id),
                    'html': self.old_content_html
                },
                'new_value': {
                    'content_id': (
                        self.exploration.states['State 3'].content.content_id),
                    'html': self.new_content_html
                }
            },
            'change to state 3')

        self.login(self.TRANSLATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': self.EXP_ID,
                'target_version_at_submission': self.exploration.version,
                'change_cmd': {
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'State 3',
                    'content_id': (
                        self.exploration.states['State 3'].content.content_id),
                    'language_code': 'hi',
                    'content_html': '<p>old content html</p>',
                    'translation_html': '<p>In हिन्दी (Hindi)</p>',
                    'data_format': 'html'
                },
                'description': 'change to state 3',
            }, csrf_token=csrf_token)
        self.logout()

    def test_edit_state_content_suggestion_is_not_allowed(self) -> None:
        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': 'exp1',
                'target_version_at_submission': 2,
                'change_cmd': {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'State 1',
                    'old_value': {
                        'content_id': (
                            self.exploration.states['State 3']
                            .content.content_id),
                        'html': self.old_content_html
                    },
                    'new_value': {
                        'content_id': (
                            self.exploration.states['State 3']
                            .content.content_id),
                        'html': self.new_content_html
                    }
                },
                'description': 'change to state 1',
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_suggestion_to_exploration_handler_with_invalid_suggestion_id(
        self
    ) -> None:
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
                    'action': 'reject',
                    'review_message': 'Rejected!'
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
                    'action': 'reject',
                    'review_message': 'Rejected!'
                }, csrf_token=csrf_token,
            expected_status_int=404)

        self.logout()

    def test_suggestion_to_exploration_handler_with_invalid_target_type(
        self
    ) -> None:
        self.login(self.EDITOR_EMAIL)
        content_id_generator = translation_domain.ContentIdGenerator()
        question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state', content_id_generator).to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': ['skill_id'],
            'inapplicable_skill_misconception_ids': ['skillid12345-1'],
            'next_content_id_index': content_id_generator.next_content_id_index
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
                    'action': 'reject',
                    'review_message': 'Rejected!'
                }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'This handler allows actions only on suggestions to explorations.')

        self.logout()

    def test_accepting_suggestions_for_exp_without_commit_message_raises_error(
        self
    ) -> None:
        self.login(self.EDITOR_EMAIL)

        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id
            )
        )['suggestions'][0]

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_to_accept['suggestion_id'])

        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_IN_REVIEW)

        csrf_token = self.get_new_csrf_token()

        response = self.put_json('%s/exploration/%s/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX,
            suggestion_to_accept['target_id'],
            suggestion_to_accept['suggestion_id']), {
                'action': u'accept',
                'review_message': u'suggestion accepted!'
            },
            csrf_token=csrf_token,
            expected_status_int=500
        )
        self.assertEqual(
            response['error'],
            'The \'commit_message\' must be provided when the action '
            'is \'accept suggestion\'.'
        )
        self.logout()

    def test_suggestion_to_exploration_handler_with_invalid_target_id(
        self
    ) -> None:
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
                    'action': 'reject',
                    'review_message': 'Rejected!'
                }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'The exploration id provided does not match the exploration id '
            'present as part of the suggestion_id')

        self.logout()

    def test_owner_of_exploration_cannot_repond_to_own_suggestion(self) -> None:
        self.login(self.EDITOR_EMAIL)

        exp_id = 'new_exp_id'
        self.save_new_default_exploration(exp_id, self.editor_id)

        new_content = state_domain.SubtitledHtml(
            'content', '<p>new content html</p>').to_dict()
        change_cmd: Dict[str, Union[str, state_domain.SubtitledHtmlDict]] = {
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
                    'action': 'reject',
                    'review_message': 'Rejected!'
                }, csrf_token=csrf_token, expected_status_int=401)

        self.assertEqual(
            response['error'], 'You cannot accept/reject your own suggestion.')

        self.logout()

    def test_suggestion_to_exploration_handler_with_invalid_action(
        self
    ) -> None:
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

        self.assertIn(
            'Received invalid_action which is not in the allowed '
            'range of choices',
            response['error']
        )

        self.logout()

    def test_reject_suggestion_to_exploration(self) -> None:
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
                'action': 'reject',
                'review_message': 'Rejected!'
            }, csrf_token=csrf_token)

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_to_reject['suggestion_id'])

        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_REJECTED)

        self.logout()

    def test_suggestion_to_exploration_handler_with_long_commit_mesage(
        self
    ) -> None:
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
                'action': 'accept',
                'commit_message':
                    'a' * (constants.MAX_COMMIT_MESSAGE_LENGTH + 1),
                'review_message': 'Accepted'
            }, csrf_token=csrf_token, expected_status_int=400)
        self.assertIn(
            'Schema validation for \'commit_message\' failed: Validation '
            'failed: has_length_at_most',
            response['error']
        )

    def test_accept_suggestion(self) -> None:
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
                    'action': 'accept',
                    'commit_message': 'commit message',
                    'review_message': 'Accepted'
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
                'change_cmd']['state_name']].content.html,
            suggestion_to_accept['change_cmd']['new_value']['html'])
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
                'action': 'accept',
                'commit_message': 'commit message',
                'review_message': 'Accepted'
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
                'action': 'accept',
                'commit_message': 'commit message',
                'review_message': 'Accepted'
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
                'action': 'accept',
                'commit_message': 'commit message',
                'review_message': 'Accepted'
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
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id_2))['suggestions'][1]
        self.put_json('%s/exploration/%s/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX,
            suggestion_to_accept['target_id'],
            suggestion_to_accept['suggestion_id']), {
                'action': 'accept',
                'commit_message': 'commit message',
                'review_message': 'Accepted'
            }, csrf_token=csrf_token)
        suggestion_post_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id_2))['suggestions'][1]
        self.assertEqual(
            suggestion_post_accept['status'],
            suggestion_models.STATUS_ACCEPTED)
        self.logout()

    def test_suggestion_list_handler_with_invalid_query_field(self) -> None:
        response = self.get_json(
            '%s?invalid_query_field=value' % (
                feconf.SUGGESTION_LIST_URL_PREFIX), expected_status_int=400)

        self.assertIn(
            'Found extra args: [\'invalid_query_field\']', response['error']
        )

    def test_suggestion_list_handler(self) -> None:
        suggestions = self.get_json(
            '%s?author_id=%s&target_type=%s&target_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.author_id_2,
                feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID)
            )['suggestions']
        self.assertEqual(len(suggestions), 2)

    def test_cannot_resubmit_suggestion_with_invalid_suggestion_id(
        self
    ) -> None:
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '%s/resubmit/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX, 'invalid_suggestion_id'), {
                    'summary_message': 'summary message',
                    'action': u'resubmit',
                    'change_cmd': {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'State 1',
                        'old_value': {
                            'content_id': (
                                self.exploration.states['State 1']
                                .content.content_id),
                            'html': self.old_content_html
                        },
                        'new_value': {
                            'content_id': (
                                self.exploration.states['State 1']
                                .content.content_id),
                            'html': ''
                        }
                    }
                }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'No suggestion found with given suggestion id')

    def test_resubmit_rejected_suggestion(self) -> None:

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), ('target_id', self.EXP_ID)])[0]
        suggestion_services.reject_suggestion(
            suggestion.suggestion_id, self.reviewer_id, 'reject message')
        self.logout()

        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        resubmit_change_content_html = (
            '<p>resubmit change content html</p>')
        self.put_json('%s/resubmit/%s' % (
            feconf.SUGGESTION_ACTION_URL_PREFIX, suggestion.suggestion_id), {
                'summary_message': 'summary message',
                'action': 'resubmit',
                'change_cmd': {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'State 1',
                    'old_value': {
                        'content_id': (
                            self.exploration.states['State 1']
                            .content.content_id),
                        'html': self.old_content_html
                    },
                    'new_value': {
                        'content_id': (
                            self.exploration.states['State 1']
                            .content.content_id),
                        'html': resubmit_change_content_html
                    }
                }
            }, csrf_token=csrf_token)

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.author_id), ('target_id', self.EXP_ID)])[0]
        assert isinstance(
            suggestion, suggestion_registry.SuggestionEditStateContent
        )
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(
            suggestion.change_cmd.new_value['html'],
            resubmit_change_content_html)
        self.assertEqual(
            suggestion.change_cmd.cmd, exp_domain.CMD_EDIT_STATE_PROPERTY)
        self.assertEqual(
            suggestion.change_cmd.property_name,
            exp_domain.STATE_PROPERTY_CONTENT)
        self.assertEqual(
            suggestion.change_cmd.state_name, 'State 1')
        self.logout()

    def test_translation_accept_suggestion_by_reviewer(self) -> None:
        # Test reviewer can accept successfully.
        self.login(self.REVIEWER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.translator_id))['suggestions'][0]

        csrf_token = self.get_new_csrf_token()
        with self.swap(
            opportunity_services,
            'update_translation_opportunity_with_accepted_suggestion',
            lambda x, _: x
        ):
            self.put_json('%s/exploration/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion_to_accept['target_id'],
                suggestion_to_accept['suggestion_id']), {
                    'action': 'accept',
                    'commit_message': 'commit message',
                    'review_message': 'Accepted'
                }, csrf_token=csrf_token)
        suggestion_post_accept = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.translator_id))['suggestions'][0]
        self.assertEqual(
            suggestion_post_accept['status'],
            suggestion_models.STATUS_ACCEPTED)
        self.logout()

    def test_translation_suggestion_creation_with_new_images(self) -> None:
        exp_id = '12345678exp1'
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                exp_id, self.editor_id, ['State 1'],
                ['EndExploration'], category='Algebra'))

        state_content_dict = {
            'content_id': 'content_0',
            'html': (
                '<oppia-noninteractive-image filepath-with-value='
                '"&quot;img.png&quot;" caption-with-value="&quot;&quot;" '
                'alt-with-value="&quot;Image&quot;">'
                '</oppia-noninteractive-image>')
        }
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        self.post_json(
            '%s/exploration/%s' % (
                feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX, exp_id),
            {'filename': 'img.png'},
            csrf_token=csrf_token,
            upload_files=[('image', 'unused_filename', raw_image)]
        )
        exp_services.update_exploration(
            self.editor_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'State 1',
                'new_value': state_content_dict
            })], 'Changes content.')
        rights_manager.publish_exploration(self.editor, exp_id)

        story = story_domain.Story.create_default_story(
            'story_123', 'A story', 'Description', self.TOPIC_ID, 'story-a')
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, 'story_123')
        topic_services.publish_story(
            self.TOPIC_ID, 'story_123', self.admin_id)

        story_services.update_story(
            self.owner_id, 'story_123', [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': exp_id
            })], 'Changes.')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        text_to_translate = exploration.states['State 1'].content.html
        self.logout()

        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id)

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
                'change_cmd': {
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'State 1',
                    'content_id': 'content_0',
                    'language_code': 'hi',
                    'content_html': text_to_translate,
                    'translation_html': (
                        '<oppia-noninteractive-image filepath-with-value='
                        '"&quot;translation_image.png&quot;" '
                        'caption-with-value="&quot;&quot;" '
                        'alt-with-value="&quot;Image&quot;">'
                        '</oppia-noninteractive-image>'),
                    'data_format': 'html'
                },
                'description': 'test',
                'files': {
                    'translation_image.png': (
                        base64.b64encode(raw_image).decode('utf-8'))
                 },
            },
            csrf_token=csrf_token
        )

        fs = fs_services.GcsFileSystem(
            feconf.IMAGE_CONTEXT_EXPLORATION_SUGGESTIONS, exp_id)

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

        with self.swap(
            opportunity_services,
            'update_translation_opportunity_with_accepted_suggestion',
            lambda x, _: x
        ):
            self.put_json('%s/exploration/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion_to_accept['target_id'],
                suggestion_to_accept['suggestion_id']), {
                    'action': 'accept',
                    'commit_message': 'Translated content of State 1',
                    'review_message': 'This looks good!',
                }, csrf_token=csrf_token)

        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id)
        self.assertTrue(fs.isfile('image/img.png'))
        self.assertTrue(fs.isfile('image/translation_image.png'))
        self.assertTrue(fs.isfile('image/img_compressed.png'))

    def test_set_of_strings_translation_suggestion_creation(self) -> None:
        self.login(self.TRANSLATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': self.EXP_ID,
                'target_version_at_submission': self.exploration.version,
                'change_cmd': {
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'State 1',
                    'content_id': 'content_0',
                    'language_code': 'hi',
                    'content_html': '<p>old content html</p>',
                    'translation_html': ['test1', 'test2'],
                    'data_format': (
                        translation_domain.WrittenTranslation
                        .DATA_FORMAT_SET_OF_NORMALIZED_STRING
                    ),
                },
                'description': 'description',
            }, csrf_token=csrf_token)
        self.logout()

        suggestions = self.get_json(
            '%s?author_id=%s&target_type=%s&target_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.translator_id,
                feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID)
            )['suggestions']
        self.assertEqual(len(suggestions), 2)

    def test_set_of_strings_translation_suggestion_review(self) -> None:
        self.login(self.STRINGS_TRANSLATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': self.EXP_ID,
                'target_version_at_submission': self.exploration.version,
                'change_cmd': {
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'State 1',
                    'content_id': 'content_0',
                    'language_code': 'hi',
                    'content_html': '<p>old content html</p>',
                    'translation_html': ['test1', 'test2'],
                    'data_format': (
                        translation_domain.WrittenTranslation
                        .DATA_FORMAT_SET_OF_NORMALIZED_STRING
                    ),
                },
                'description': 'description',
            }, csrf_token=csrf_token)
        self.logout()

        suggestions = self.get_json(
            '%s?author_id=%s&target_type=%s&target_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.strings_translator_id,
                feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID)
            )['suggestions']
        self.assertEqual(len(suggestions), 1)

        # Test reviewer can accept successfully.
        self.login(self.REVIEWER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        suggestion_to_accept = suggestions[0]

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
                self.strings_translator_id))['suggestions'][0]
        self.assertEqual(
            suggestion_post_accept['status'],
            suggestion_models.STATUS_ACCEPTED)
        self.logout()

    def test_update_suggestion_updates_translation_html(self) -> None:
        self.login(self.TRANSLATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.translator_id), ('target_id', self.EXP_ID)])[0]
        self.logout()

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.put_json('%s/%s' % (
            feconf.UPDATE_TRANSLATION_SUGGESTION_URL_PREFIX,
            suggestion.suggestion_id), {
                'translation_html': '<p>Updated In Hindi</p>'
            }, csrf_token=csrf_token)

        suggestion = suggestion_services.query_suggestions(
            [('author_id', self.translator_id), ('target_id', self.EXP_ID)])[0]
        self.assertEqual(
            suggestion.change_cmd.translation_html, '<p>Updated In Hindi</p>')
        self.logout()

    def test_cannot_update_already_handled_translation(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>old content html</p>',
            'state_name': 'State 1',
            'translation_html': '<p>Translation for content.</p>',
            'data_format': 'html'
        }

        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', 1, self.translator_id, change_dict, 'description')
        with self.swap(
            opportunity_services,
            'update_translation_opportunity_with_accepted_suggestion',
            lambda x, _: x
        ):
            suggestion_services.accept_suggestion(
                suggestion.suggestion_id, self.reviewer_id, 'Accepted', 'Done'
            )

        csrf_token = self.get_new_csrf_token()
        response = self.put_json('%s/%s' % (
            feconf.UPDATE_TRANSLATION_SUGGESTION_URL_PREFIX,
            suggestion.suggestion_id), {
                'translation_html': '<p>Updated In Hindi</p>'
            }, csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(
            response['error'],
            'The suggestion with id %s has been accepted or rejected' % (
                suggestion.suggestion_id))
        self.logout()

    def test_cannot_update_translations_without_translation_html(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>old content html</p>',
            'state_name': 'State 1',
            'translation_html': '<p>Translation for content.</p>',
            'data_format': 'html'
        }

        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', 1, self.translator_id, change_dict, 'description')

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '%s/%s' % (
                feconf.UPDATE_TRANSLATION_SUGGESTION_URL_PREFIX,
                suggestion.suggestion_id), {},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'],
            'Missing key in handler args: translation_html.')
        self.logout()

    def test_cannot_update_translation_with_invalid_translation_html(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>old content html</p>',
            'state_name': 'State 1',
            'translation_html': '<p>Translation for content.</p>',
            'data_format': 'html'
        }

        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', 1, self.translator_id, change_dict, 'description')

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '%s/%s' % (
                feconf.UPDATE_TRANSLATION_SUGGESTION_URL_PREFIX,
                suggestion.suggestion_id), {
                    'translation_html': 12
                },
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertIn(
            'failed: Expected string, received 12',
            response['error']
        )
        self.logout()

    def test_update_suggestion_updates_question_suggestion_content(
        self
    ) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, question_domain.QuestionSuggestionChangeDict, float]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index),
                'id': None,
                'version': 40
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

        question_state_data = suggestion.change_cmd.question_dict[
            'question_state_data']
        question_state_data['content']['html'] = (
            '<p>Updated question</p>'
            '<oppia-noninteractive-image filepath-with-value='
            '"&quot;img.png&quot;" caption-with-value="&quot;&quot;" '
            'alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image>')
        question_state_data['interaction']['solution'] = new_solution_dict

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/%s' % (
                feconf.UPDATE_QUESTION_SUGGESTION_URL_PREFIX,
                suggestion.suggestion_id
            ), {
                'question_state_data': question_state_data,
                'skill_difficulty': 0.6,
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            csrf_token=csrf_token
        )

        updated_suggestion = suggestion_services.get_suggestion_by_id(
            suggestion.suggestion_id)
        assert isinstance(
            updated_suggestion, suggestion_registry.SuggestionAddQuestion
        )
        new_question_state_data = updated_suggestion.change_cmd.question_dict[
            'question_state_data']

        self.assertEqual(
            new_question_state_data['content']['html'],
            '<p>Updated question</p>'
            '<oppia-noninteractive-image filepath-with-value='
            '"&quot;img.png&quot;" caption-with-value="&quot;&quot;" '
            'alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image>'
        )
        self.assertEqual(
            new_question_state_data['interaction']['solution'],
            new_solution_dict)
        self.logout()

    def test_cannot_update_question_with_invalid_skill_difficulty(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, question_domain.QuestionSuggestionChangeDict, float]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index),
                'id': None,
                'version': 40
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            self.author_id, suggestion_change, 'test description')

        question_state_data = suggestion.change_cmd.question_dict[
            'question_state_data']
        question_state_data['content']['html'] = '<p>Updated question</p>'
        new_solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': False,
            'correct_answer': 'Solution',
            'explanation': {
                'content_id': 'solution_2',
                'html': '<p>This is the updated solution.</p>',
            },
        }
        question_state_data['interaction']['solution'] = new_solution_dict

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '%s/%s' % (
                feconf.UPDATE_QUESTION_SUGGESTION_URL_PREFIX,
                suggestion.suggestion_id
            ),
            {
                'question_state_data': question_state_data,
                'skill_difficulty': 'string_value',
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )

        self.assertIn(
            'Schema validation for \'skill_difficulty\' failed: Could '
            'not convert str to float',
            response['error']
        )
        self.logout()

    def test_cannot_update_question_without_state_data(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, question_domain.QuestionSuggestionChangeDict, float]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index),
                'id': None,
                'version': 40
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

        question_state_data = suggestion.change_cmd.question_dict[
            'question_state_data']
        question_state_data['content']['html'] = '<p>Updated question</p>'
        question_state_data['interaction']['solution'] = new_solution_dict

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '%s/%s' % (
                feconf.UPDATE_QUESTION_SUGGESTION_URL_PREFIX,
                suggestion.suggestion_id
            ),
            {
                'skill_difficulty': 0.6,
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )

        self.assertEqual(
            response['error'],
            'Missing key in handler args: question_state_data.'
        )
        self.logout()

    def test_cannot_update_question_without_skill_difficulty(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, question_domain.QuestionSuggestionChangeDict, float]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index),
                'id': None,
                'version': 40
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

        question_state_data = suggestion.change_cmd.question_dict[
            'question_state_data']
        question_state_data['content']['html'] = '<p>Updated question</p>'
        question_state_data['interaction']['solution'] = new_solution_dict

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '%s/%s' % (
                feconf.UPDATE_QUESTION_SUGGESTION_URL_PREFIX,
                suggestion.suggestion_id
            ),
            {
                'question_state_data': question_state_data,
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )

        self.assertEqual(
            response['error'],
            'Missing key in handler args: skill_difficulty.'
        )

        self.logout()

    def test_cannot_update_question_without_next_content_id_index(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, question_domain.QuestionSuggestionChangeDict, float]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index),
                'id': None,
                'version': 40
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

        question_state_data = suggestion.change_cmd.question_dict[
            'question_state_data']
        question_state_data['content']['html'] = '<p>Updated question</p>'
        question_state_data['interaction']['solution'] = new_solution_dict

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '%s/%s' % (
                feconf.UPDATE_QUESTION_SUGGESTION_URL_PREFIX,
                suggestion.suggestion_id
            ),
            {
                'question_state_data': question_state_data,
                'skill_difficulty': 0.6
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )

        self.assertEqual(
            response['error'],
            'Missing key in handler args: next_content_id_index.'
        )
        self.logout()

    def test_cannot_update_already_handled_question(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, question_domain.QuestionSuggestionChangeDict, float]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index),
                'id': None,
                'version': 40
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
        suggestion_services.accept_suggestion(
            suggestion.suggestion_id, self.reviewer_id, 'Accepted', 'Done'
        )

        question_state_data = suggestion.change_cmd.question_dict[
            'question_state_data']
        question_state_data['content']['html'] = '<p>Updated question</p>'
        question_state_data['interaction']['solution'] = new_solution_dict

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '%s/%s' % (
                feconf.UPDATE_QUESTION_SUGGESTION_URL_PREFIX,
                suggestion.suggestion_id
            ),
            {
                'question_state_data': question_state_data,
                'skill_difficulty': '0.6',
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )

        self.assertEqual(
            response['error'],
            'The suggestion with id %s has been accepted or rejected' % (
                suggestion.suggestion_id
            )
        )
        self.logout()

    def test_cannot_update_question_when_provided_state_data_is_invalid(
        self
    ) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        suggestion_change: Dict[
            str, Union[str, question_domain.QuestionSuggestionChangeDict, float]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index),
                'id': None,
                'version': 40
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            self.author_id, suggestion_change, 'test description')

        invalid_question_state_data: Dict[str, str] = {}

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '%s/%s' % (
                feconf.UPDATE_QUESTION_SUGGESTION_URL_PREFIX,
                suggestion.suggestion_id
            ),
            {
                'question_state_data': invalid_question_state_data,
                'skill_difficulty': '0.6',
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        self.logout()

    def test_suggestion_creation_when_images_are_not_provided(self) -> None:
        exp_id = '12345678exp1'
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                exp_id, self.editor_id, ['State 1'],
                ['EndExploration'], category='Algebra'))

        state_content_dict = {
            'content_id': 'content_0',
            'html': (
                '<oppia-noninteractive-image filepath-with-value='
                '"&quot;img.png&quot;" caption-with-value="&quot;&quot;" '
                'alt-with-value="&quot;Image&quot;">'
                '</oppia-noninteractive-image>')
        }
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        self.post_json(
            '%s/exploration/%s' % (
                feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX, exp_id),
            {'filename': 'img.png'},
            csrf_token=csrf_token,
            upload_files=[('image', 'unused_filename', raw_image)])
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

        valid_html = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n-1)(x - a_n)&amp;quot;, &amp;quot;svg_filenam'
            'e&amp;quot;: &amp;quot;file.svg&amp;quot;}"></oppia-noninte'
            'ractive-math>'
        )
        self.login(self.TRANSLATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response_dict = self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': exp_id,
                'target_version_at_submission': exploration.version,
                'change_cmd': {
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'State 1',
                    'content_id': 'content_0',
                    'language_code': 'hi',
                    'content_html': text_to_translate,
                    'translation_html': valid_html,
                    'data_format': 'html'
                },
                'files': {'file.svg': None},
                'description': 'test'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertIn('No image supplied', response_dict['error'])
        self.logout()

    def test_suggestion_creation_when_images_are_not_valid(self) -> None:
        exp_id = '12345678exp1'
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                exp_id, self.editor_id, ['State 1'],
                ['EndExploration'], category='Algebra'))

        state_content_dict = {
            'content_id': 'content_0',
            'html': (
                '<oppia-noninteractive-image filepath-with-value='
                '"&quot;img.png&quot;" caption-with-value="&quot;&quot;" '
                'alt-with-value="&quot;Image&quot;">'
                '</oppia-noninteractive-image>')
        }
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        self.post_json(
            '%s/exploration/%s' % (
                feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX, exp_id),
            {'filename': 'img.png'},
            csrf_token=csrf_token,
            upload_files=[('image', 'unused_filename', raw_image)])
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

        valid_html = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n-1)(x - a_n)&amp;quot;, &amp;quot;svg_filenam'
            'e&amp;quot;: &amp;quot;file.svg&amp;quot;}"></oppia-noninte'
            'ractive-math>'
        )
        large_image = '<svg><path d="%s" /></svg>' % (
             'M150 0 L75 200 L225 200 Z ' * 4000)
        self.login(self.TRANSLATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response_dict = self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': exp_id,
                'target_version_at_submission': exploration.version,
                'change_cmd': {
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'State 1',
                    'content_id': 'content_0',
                    'language_code': 'hi',
                    'content_html': text_to_translate,
                    'translation_html': valid_html,
                    'data_format': 'html'
                },
                'description': 'test',
                'files': {'file.svg': large_image},
            }, csrf_token=csrf_token, expected_status_int=400,
        )

        self.assertIn(
            'Image exceeds file size limit of 100 KB.',
            response_dict['error'])
        self.logout()


class QuestionSuggestionTests(test_utils.GenericTestBase):

    AUTHOR_EMAIL: Final = 'author@example.com'

    # Needs to be 12 characters long.
    SKILL_ID: Final = 'skill1234567'

    SKILL_DESCRIPTION: Final = 'skill to link question to'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.save_new_skill(
            self.SKILL_ID, self.admin_id, description=self.SKILL_DESCRIPTION)
        content_id_generator = translation_domain.ContentIdGenerator()
        self.question_dict: question_domain.QuestionSuggestionChangeDict = {
            'question_state_data': self._create_valid_question_data(
                'default_state', content_id_generator).to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [self.SKILL_ID],
            'inapplicable_skill_misconception_ids': ['skillid12345-1'],
            'next_content_id_index': content_id_generator.next_content_id_index,
            'id': None,
            'version': 40
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
                'change_cmd': {
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

    def test_create_question_suggestion(self) -> None:
        self.login(self.AUTHOR_EMAIL)
        suggestions = self.get_json(
            '%s?author_id=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                self.author_id))['suggestions']
        self.assertEqual(len(suggestions), 1)
        self.logout()

    def test_query_question_suggestions(self) -> None:
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
            suggestion['change_cmd']['cmd'],
            question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION)

    def test_accept_question_suggestion(self) -> None:
        suggestion_to_accept = self.get_json(
            '%s?suggestion_type=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX,
                feconf.SUGGESTION_TYPE_ADD_QUESTION)
            )['suggestions'][0]

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            self.put_json('%s/skill/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion_to_accept['target_id'],
                suggestion_to_accept['suggestion_id']), {
                    'action': u'accept',
                    'review_message': u'This looks good!',
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
            questions, merged_question_skill_links) = (
                question_services.get_displayable_question_skill_link_details(
                    1, [self.SKILL_ID], 0))
        self.assertEqual(len(questions), 1)
        self.assertEqual(
            merged_question_skill_links[0].skill_descriptions,
            [self.SKILL_DESCRIPTION])
        self.assertEqual(
            merged_question_skill_links[0].skill_difficulties, [0.3])
        assert questions[0] is not None
        self.assertEqual(
            questions[0].question_content,
            self.question_dict['question_state_data']['content']['html']
        )
        thread_messages = feedback_services.get_messages(
            suggestion_to_accept['suggestion_id'])
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(last_message.text, 'This looks good!')
        self.logout()

    def test_accept_question_suggestion_with_image_region_interactions(
        self
    ) -> None:
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            original_image_content = f.read()

        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.admin_id, description='Description')

        fs_services.save_original_and_compressed_versions_of_image(
            'image.png', 'question_suggestions', skill_id,
            original_image_content, 'image', True)
        question_state_dict: state_domain.StateDict = {
            'content': {
                'html': '<p>Text</p>',
                'content_id': 'content_0'
            },
            'classifier_model_id': None,
            'linked_skill_id': None,
            'interaction': {
                'answer_groups': [
                    {
                        'rule_specs': [
                            {
                                'rule_type': 'IsInRegion',
                                'inputs': {'x': 'Region1'}
                            }
                        ],
                        'outcome': {
                            'dest': None,
                            'dest_if_really_stuck': None,
                            'feedback': {
                                'html': '<p>assas</p>',
                                'content_id': 'feedback_2'
                            },
                            'labelled_as_correct': True,
                            'param_changes': [],
                            'refresher_exploration_id': None,
                            'missing_prerequisite_skill_id': None
                        },
                        'training_data': [],
                        'tagged_skill_misconception_id': None
                    }
                ],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'imageAndRegions': {
                        'value': {
                            'imagePath': 'image.png',
                            'labeledRegions': [
                                {
                                    'label': 'Region1',
                                    'region': {
                                        'regionType': 'Rectangle',
                                        'area': [
                                            [
                                                0.2644628099173554,
                                                0.21807065217391305
                                            ],
                                            [
                                                0.9201101928374655,
                                                0.8847373188405797
                                            ]
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    'highlightRegionsOnHover': {
                        'value': False
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'html': '<p>wer</p>',
                        'content_id': 'default_outcome_1'
                    },
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [
                    {
                        'hint_content': {
                            'html': '<p>assaas</p>',
                            'content_id': 'hint_3'
                        }
                    }
                ],
                'id': 'ImageClickInput', 'solution': None
            },
            'param_changes': [],
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content_0': {},
                    'default_outcome_1': {},
                    'feedback_2': {},
                    'hint_3': {}
                }
            },
            'solicit_answer_details': False,
            'card_is_checkpoint': False
        }
        question_dict: question_domain.QuestionSuggestionChangeDict = {
            'question_state_data': question_state_dict,
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [skill_id],
            'inapplicable_skill_misconception_ids': ['skillid12345-1'],
            'next_content_id_index': 4,
            'id': None,
            'version': 40
        }
        suggestion_change: Dict[
            str, Union[str, question_domain.QuestionSuggestionChangeDict, float]
        ] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': question_dict,
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }

        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            self.author_id, suggestion_change, 'test description')

        self.assertEqual(
            suggestion.status,
            suggestion_models.STATUS_IN_REVIEW)

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            self.put_json('%s/skill/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion.target_id,
                suggestion.suggestion_id), {
                    'action': u'accept',
                    'review_message': u'This looks good!',
                }, csrf_token=csrf_token)

        self.logout()

        suggestion_post_accept = suggestion_services.get_suggestion_by_id(
            suggestion.suggestion_id)
        question = question_services.get_questions_by_skill_ids(
            1, [skill_id], False)[0]
        self.assertEqual(
            suggestion_post_accept.status,
            suggestion_models.STATUS_ACCEPTED)
        # Checks whether image of the Image Region interaction is accessible
        # from the question player. Pre checks can not be added to check there
        # are no images in the given directory before accepting the question
        # suggestion since the directory is created only after the suggestion
        # is accepted.
        destination_fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_QUESTION, question.id)
        self.assertTrue(destination_fs.isfile('image/%s' % 'image.png'))

    def test_create_suggestion_invalid_target_version_input(self) -> None:
        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 'invalid_target_version',
                'change_cmd': {
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
            'Schema validation for \'target_version_at_submission\' failed: '
            'Could not convert str to int: invalid_target_version'
        )
        self.assertEqual(len(suggestions), 1)
        self.logout()

    def test_suggestion_creation_with_valid_images(self) -> None:
        self.save_new_skill(
            'skill_id2', self.admin_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        question_state_data_dict = self._create_valid_question_data(
            'default_state', content_id_generator).to_dict()
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
            'inapplicable_skill_misconception_ids': [],
            'next_content_id_index': (
                content_id_generator.next_content_id_index),
            'id': None,
            'version': 40
        }
        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change_cmd': {
                    'cmd': (
                        question_domain
                        .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                    'question_dict': self.question_dict,
                    'skill_id': self.SKILL_ID,
                    'skill_difficulty': 0.3
                },
                'description': 'Add new question to skill',
                'files': {
                    'file.svg': (
                        base64.b64encode(raw_image).decode('utf-8'))
                }
            }, csrf_token=csrf_token,)
        self.logout()


class SkillSuggestionTests(test_utils.GenericTestBase):

    AUTHOR_EMAIL: Final = 'author@example.com'
    REVIEWER_EMAIL: Final = 'reviewer@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.REVIEWER_EMAIL, 'reviewer')

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        user_services.allow_user_to_review_question(self.reviewer_id)

        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Description')
        content_id_generator = translation_domain.ContentIdGenerator()
        self.question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state', content_id_generator).to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [self.skill_id],
            'inapplicable_skill_misconception_ids': ['skillid12345-1'],
            'next_content_id_index': content_id_generator.next_content_id_index
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
                'change_cmd': {
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

    def test_cannot_access_suggestion_to_skill_handler(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        thread_id = feedback_services.create_thread(
            feconf.ENTITY_TYPE_QUESTION, self.skill_id,
            self.author_id, 'description', '', has_suggestion=True)

        csrf_token = self.get_new_csrf_token()

        self.put_json(
            '%s/skill/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX, self.skill_id,
                thread_id), {
                    'action': 'reject',
                    'review_message': 'Rejected!'
                }, csrf_token=csrf_token, expected_status_int=400)

        self.logout()

    def test_suggestion_to_skill_handler_with_invalid_target_type(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        exp_id = 'new_exp_id'
        self.save_new_default_exploration(exp_id, self.admin_id)

        new_content = state_domain.SubtitledHtml(
            'content', '<p>new content html</p>').to_dict()
        change_cmd: Dict[str, Union[str, state_domain.SubtitledHtmlDict]] = {
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
                        'action': 'reject',
                        'review_message': 'Rejected!'
                    }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'This handler allows actions only on suggestions to skills.')

        self.logout()

    def test_suggestion_to_skill_handler_with_invalid_target_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

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
                    'action': 'reject',
                    'review_message': 'Rejected!'
                },
                csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'The skill id provided does not match the skill id '
            'present as part of the suggestion_id')

        self.logout()

    def test_suggestion_to_skill_handler_with_invalid_action(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
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

        self.assertIn(
            'Received invalid_action which is not in the allowed range '
            'of choices',
            response['error']
        )
        self.logout()

    def test_reject_suggestion_to_skill(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
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
                    'action': 'reject',
                    'review_message': 'Rejected!'
                }, csrf_token=csrf_token)

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_to_reject['suggestion_id'])
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_REJECTED)
        self.logout()

    def test_accept_suggestion_to_skill(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
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
                    'review_message': u'Accepted!',
                }, csrf_token=csrf_token)

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_to_accept['suggestion_id'])
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_ACCEPTED)

        self.logout()

    def test_reviewer_accept_suggestion_to_skill(self) -> None:
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
                    'review_message': u'Accepted!'
                }, csrf_token=csrf_token)

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_to_accept['suggestion_id'])
        self.assertEqual(
            suggestion.status, suggestion_models.STATUS_ACCEPTED)
        self.logout()


class UserSubmittedSuggestionsHandlerTest(test_utils.GenericTestBase):
    """Unit test for the UserSubmittedSuggestionsHandler."""

    AUTHOR_EMAIL: Final = 'author@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'
        self.EXP_ID = 'exp1'
        # Needs to be 12 characters long.
        self.SKILL_ID = 'skill1234567'
        self.SKILL_DESCRIPTION = 'skill to link question to'
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, title='Exploration title',
            category='Algebra', end_state_name='End State')
        self.publish_exploration(self.owner_id, self.EXP_ID)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'topic', 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_333'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_333']
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
                        'content_id': 'content_0',
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
                'change_cmd': {
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'Introduction',
                    'content_id': 'content_0',
                    'language_code': 'hi',
                    'content_html': '<p>new content html</p>',
                    'translation_html': '<p>new content html in Hindi</p>',
                    'data_format': 'html'
                },
                'description': 'Adds translation',
            }, csrf_token=csrf_token)
        content_id_generator = translation_domain.ContentIdGenerator()
        self.question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state', content_id_generator).to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [self.SKILL_ID],
            'inapplicable_skill_misconception_ids': ['skillid12345-1'],
            'next_content_id_index': (
                content_id_generator.next_content_id_index)
        }

        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change_cmd': {
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

    def test_suggestion_not_included_when_exploration_is_not_editable(
        self
    ) -> None:
        self.login(self.AUTHOR_EMAIL)

        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(len(response['suggestions']), 1)

        exp_services.set_exploration_edits_allowed(self.EXP_ID, False)

        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })

        self.assertEqual(len(response['suggestions']), 0)

    def test_exploration_handler_returns_data(self) -> None:
        self.login(self.AUTHOR_EMAIL)

        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        self.assertEqual(response['next_offset'], 1)

        response = self.get_json(
            '/getsubmittedsuggestions/topic/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(response, {})

    def test_skill_handler_returns_data(self) -> None:
        self.login(self.AUTHOR_EMAIL)

        response = self.get_json(
            '/getsubmittedsuggestions/skill/add_question', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        self.assertEqual(response['next_offset'], 1)

        response = self.get_json(
            '/getsubmittedsuggestions/topic/add_question', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(response, {})

    def test_question_suggestions_data_for_deleted_opportunities(
        self
    ) -> None:
        self.login(self.AUTHOR_EMAIL)

        opportunity_services.delete_skill_opportunity(self.SKILL_ID)
        response = self.get_json(
            '/getsubmittedsuggestions/skill/add_question', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        self.assertEqual(response['next_offset'], 1)
        self.assertEqual(
            response['target_id_to_opportunity_dict'][self.SKILL_ID], None)

    def test_translation_suggestions_data_for_deleted_opportunities(
        self
    ) -> None:
        self.login(self.AUTHOR_EMAIL)

        opportunity_services.delete_exploration_opportunities([self.EXP_ID])
        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(len(response['target_id_to_opportunity_dict']), 1)
        self.assertEqual(response['next_offset'], 1)
        self.assertEqual(
            response['target_id_to_opportunity_dict'][self.EXP_ID], None)

    def test_get_translation_suggestions_returns_null_exploration_content_html_for_obsolete_suggestions( # pylint: disable=line-too-long
        self
    ) -> None:
        # Create a new exploration and linked story.
        self.login(self.EDITOR_EMAIL)
        continue_state_name = 'continue state'
        exp_100 = self.save_new_linear_exp_with_state_names_and_interactions(
            '100',
            self.owner_id,
            ['Introduction', continue_state_name, 'End state'],
            ['TextInput', 'Continue'],
            category='Algebra'
        )
        self.publish_exploration(self.owner_id, exp_100.id)
        self.create_story_for_translation_opportunity(
            self.owner_id, self.admin_id, 'story_id_100', self.TOPIC_ID,
            exp_100.id)
        self.logout()

        # Create a translation suggestion for the Continue button text.
        self.login(self.AUTHOR_EMAIL)
        continue_state = exp_100.states['continue state']
        # Here we use cast because we are narrowing down the type from various
        # customization args value types to 'SubtitledUnicode' type, and this
        # is done because here we are accessing 'buttontext' key from continue
        # customization arg whose value is always of SubtitledUnicode type.
        subtitled_unicode_of_continue_button_text = cast(
            state_domain.SubtitledUnicode,
            continue_state.interaction.customization_args['buttonText'].value
        )
        content_id_of_continue_button_text = (
            subtitled_unicode_of_continue_button_text.content_id
        )
        change_dict = {
            'cmd': 'add_translation',
            'content_id': content_id_of_continue_button_text,
            'language_code': 'hi',
            'content_html': 'Continue',
            'state_name': continue_state_name,
            'translation_html': '<p>Translation for content.</p>'
        }
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_100.id, 1, self.author_id, change_dict, 'description')

        # Handler should return the new suggestion.
        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(len(response['suggestions']), 2)
        self.assertEqual(response['next_offset'], 2)
        suggestion = response['suggestions'][0]
        self.assertEqual(suggestion['exploration_content_html'], 'Continue')
        self.logout()

        # Replace the Continue button text content ID.
        self.login(self.EDITOR_EMAIL)
        exp_services.update_exploration(
            self.owner_id, exp_100.id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': continue_state_name,
                    'new_value': {
                        'buttonText': {
                            'value': {
                                'content_id': 'new_content_id',
                                'unicode_str': 'Continua'
                            }
                        }
                    }
                })], 'Change continue button content ID')
        self.logout()

        self.login(self.AUTHOR_EMAIL)
        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(len(response['suggestions']), 2)
        self.assertEqual(response['next_offset'], 2)
        suggestion = response['suggestions'][0]
        self.assertIsNone(suggestion['exploration_content_html'])

    def test_translation_suggestions_fetches_extra_page_if_filtered_result_is_empty( # pylint: disable=line-too-long
        self
    ) -> None:
        # Create a new exploration, link a new story, and create a corresponding
        # translation suggestion.
        self.login(self.AUTHOR_EMAIL)
        exp_id = 'exp2'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Exploration title',
            category='Algebra', end_state_name='End State')
        self.publish_exploration(self.owner_id, exp_id)
        self.create_story_for_translation_opportunity(
            self.owner_id, self.admin_id, 'story_id_2', self.TOPIC_ID, exp_id)
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '',
            'translation_html': 'translation2',
            'data_format': 'html'
        }
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id, 1, self.author_id, add_translation_change_dict,
            'test description')
        # Disable the new exploration so that its corresponding translation
        # suggestion is filtered out.
        exp_services.set_exploration_edits_allowed(exp_id, False)

        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content', {
                'limit': 1,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })

        # The new translation suggestion is returned first, but because it is
        # filtered out, the controller performs another fetch.
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(
            response['suggestions'][0]['change_cmd']['translation_html'],
            '<p>new content html in Hindi</p>')
        # Offset reflects the extra fetch.
        self.assertEqual(response['next_offset'], 2)

    def test_handler_with_invalid_suggestion_type_raise_error(self) -> None:
        self.login(self.AUTHOR_EMAIL)

        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(len(response['suggestions']), 1)

        self.get_json(
            '/getsubmittedsuggestions/exploration/invalid_suggestion_type', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            },
            expected_status_int=400)

    def test_handler_with_invalid_target_type_raise_error(self) -> None:
        self.login(self.AUTHOR_EMAIL)

        response = self.get_json(
            '/getsubmittedsuggestions/exploration/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(len(response['suggestions']), 1)

        self.get_json(
            '/getsubmittedsuggestions/invalid_target_type/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            }, expected_status_int=400)


class ReviewableSuggestionsHandlerTest(test_utils.GenericTestBase):
    """Unit test for the ReviewableSuggestionsHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.AUTHOR_EMAIL = 'author@example.com'
        self.REVIEWER_EMAIL = 'reviewer@example.com'
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
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
            category='Algebra', end_state_name='End State')
        self.publish_exploration(self.owner_id, self.EXP_ID)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'topic', 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', [self.SKILL_ID], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = [self.SKILL_ID]
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
                        'content_id': 'content_0',
                        'html': '<p>new content html</p>'
                    }
                })], 'Add content')

        self.logout()

        self.login(self.AUTHOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.translate_suggestion_change = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>new content html</p>',
            'translation_html': '<p>new content html in Hindi</p>',
            'data_format': 'html'
        }
        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': self.EXP_ID,
                'target_version_at_submission': exploration.version,
                'change_cmd': self.translate_suggestion_change,
                'description': 'Adds translation',
            }, csrf_token=csrf_token
        )
        content_id_generator = translation_domain.ContentIdGenerator()
        self.question_dict = {
            'question_state_data': self._create_valid_question_data(
                'default_state', content_id_generator).to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': [self.SKILL_ID],
            'inapplicable_skill_misconception_ids': ['skillid12345-1'],
            'next_content_id_index': (
                content_id_generator.next_content_id_index)
        }
        self.translate_question_change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': self.question_dict,
            'skill_id': None,
            'skill_difficulty': 0.3
        }
        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': 'skill_without_topic',
                'target_version_at_submission': 1,
                'change_cmd': self.translate_question_change,
                'description': 'Add question for a skill without topic'
            }, csrf_token=csrf_token)
        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX, {
                'suggestion_type': (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION),
                'target_type': feconf.ENTITY_TYPE_SKILL,
                'target_id': self.SKILL_ID,
                'target_version_at_submission': 1,
                'change_cmd': self.translate_question_change,
                'description': 'Add new question for a skill with topic'
            }, csrf_token=csrf_token)

        self.logout()
        self.login(self.REVIEWER_EMAIL)

    def test_exploration_handler_returns_data_with_no_exploration_id(
        self
    ) -> None:
        # If no exploration ID is provided, no suggestions are returned.
        response = self.get_json(
            '/getreviewablesuggestions/exploration/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(len(response['suggestions']), 0)
        self.assertEqual(response['next_offset'], 0)

    def test_exploration_handler_returns_data_with_valid_exploration_id(
        self
    ) -> None:
        response = self.get_json(
            '/getreviewablesuggestions/exploration/translate_content', params={
                'exploration_id': self.EXP_ID,
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(len(response['suggestions']), 1)
        self.assertEqual(response['next_offset'], 1)
        suggestion = response['suggestions'][0]
        self.assertDictEqual(
            suggestion['change_cmd'], self.translate_suggestion_change)
        self.assertEqual(
            suggestion['suggestion_type'],
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
        )
        self.assertEqual(
            suggestion['target_type'], feconf.ENTITY_TYPE_EXPLORATION)
        self.assertEqual(suggestion['target_id'], self.EXP_ID)
        self.assertEqual(suggestion['language_code'], 'hi')
        self.assertEqual(suggestion['author_name'], 'author')
        self.assertEqual(suggestion['status'], 'review')
        self.assertDictEqual(
            response['target_id_to_opportunity_dict'],
            {
                'exp1': {
                    'chapter_title': 'Node1',
                    'content_count': 1,
                    'id': 'exp1',
                    'is_pinned': False,
                    'story_title': 'A story',
                    'topic_name': 'topic',
                    'translation_counts': {},
                    'translation_in_review_counts': {}
                }
            }
        )
        self.assertEqual(response['next_offset'], 1)

    def test_topic_translate_handler_returns_no_data(self) -> None:
        response = self.get_json(
            '/getreviewablesuggestions/topic/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(response, {})

    def test_skill_handler_returns_data(self) -> None:
        response = self.get_json(
            '/getreviewablesuggestions/skill/add_question', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE,
            })
        self.assertEqual(len(response['suggestions']), 2)
        suggestion = response['suggestions'][0]
        self.assertDictEqual(
            suggestion['change_cmd'], self.translate_question_change)
        self.assertEqual(
            suggestion['suggestion_type'], feconf.SUGGESTION_TYPE_ADD_QUESTION)
        self.assertEqual(
            suggestion['target_type'], feconf.ENTITY_TYPE_SKILL)
        self.assertEqual(suggestion['target_id'], self.SKILL_ID)
        self.assertEqual(suggestion['language_code'], 'en')
        self.assertEqual(suggestion['author_name'], 'author')
        self.assertEqual(suggestion['status'], 'review')
        self.assertDictEqual(
            response['target_id_to_opportunity_dict'][self.SKILL_ID],
            {
                'id': self.SKILL_ID,
                'question_count': 0,
                'skill_description': 'skill to link question to',
                'skill_rubrics': [
                    {
                        'difficulty': 'Easy',
                        'explanations': ['Explanation 1']
                    }, {
                        'difficulty': 'Medium',
                        'explanations': ['Explanation 2']
                    }, {
                        'difficulty': 'Hard',
                        'explanations': ['Explanation 3']
                    }
                ]
            }
        )

    def test_skill_handler_with_topic_filter_returns_one_question(self) -> None:
        response = self.get_json(
            '/getreviewablesuggestions/skill/add_question', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE,
                'topic_name': self.TOPIC_ID,
            })
        self.assertEqual(len(response['suggestions']), 1)

    def test_skill_handler_with_all_topics_filter_returns_one_question(
            self
        ) -> None:
        response = self.get_json(
            '/getreviewablesuggestions/skill/add_question', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE,
                'topic_name': 'All',
            })
        self.assertEqual(len(response['suggestions']), 2)

    def test_topic_question_handler_returns_no_data(self) -> None:
        response = self.get_json(
            '/getreviewablesuggestions/topic/add_question', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })
        self.assertEqual(response, {})

    def test_handler_with_non_existent_topic_raise_error(self) -> None:
        self.get_json(
            '/getreviewablesuggestions/topic/add_question', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE,
                'topic_name': 'non_existent_topic'
            },
            expected_status_int=400
        )

    def test_handler_with_invalid_suggestion_type_raise_error(self) -> None:
        self.get_json(
            '/getreviewablesuggestions/exploration/invalid_suggestion_type', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            },
            expected_status_int=404
        )

    def test_exploration_handler_returns_data_with_no_limit(self) -> None:
        user_settings = user_services.get_user_settings(self.reviewer_id)
        user_settings.preferred_translation_language_code = 'hi'
        user_services.save_user_settings(user_settings)

        response = self.get_json(
            '/getreviewablesuggestions/exploration/translate_content', params={
                'exploration_id': self.EXP_ID,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            })

        self.assertEqual(len(response['suggestions']), 1)

    def test_skill_handler_with_no_limit_raise_error(self) -> None:
        self.get_json(
            '/getreviewablesuggestions/skill/add_question', {
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            },
            expected_status_int=500
        )

    def test_handler_with_invalid_target_type_raise_error(self) -> None:
        self.get_json(
            '/getreviewablesuggestions/invalid_target_type/translate_content', {
                'limit': constants.OPPORTUNITIES_PAGE_SIZE,
                'offset': 0,
                'sort_key': constants.SUGGESTIONS_SORT_KEY_DATE
            },
            expected_status_int=400
        )
