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

"""Tests for the exploration translator work."""


import datetime

from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])


class BaseTranslatorControllerTest(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for self.TRANSLATOR_EMAIL."""
        super(BaseTranslatorControllerTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.TRANSLATOR_EMAIL, self.TRANSLATOR_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.translator_id = self.get_user_id_from_email(self.TRANSLATOR_EMAIL)

        self.owner = user_services.UserActionsInfo(self.owner_id)


class TranslatorTest(BaseTranslatorControllerTest):
    """Test the handling of saving translation work."""

    EXP_ID = 'exp1'

    CONTENT_IDS_TO_AUDIO_TRANSLATION = {
        'content': {
            'en': {
                'filename': 'testFile.mp3',
                'file_size_bytes': 12200,
                'needs_update': False
            }
        },
        'default_outcome': {}
    }

    def setUp(self):
        super(TranslatorTest, self).setUp()
        self.login(self.OWNER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_ID, self.translator_id,
            rights_manager.ROLE_TRANSLATOR)
        self.logout()

        self.login(self.TRANSLATOR_EMAIL)
        # Generate CSRF token.
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)

    def test_transator_can_save_valid_change_list(self):
        state_name = feconf.DEFAULT_INIT_STATE_NAME
        response = self.put_json(
            '/createhandler/translate/%s' % self.EXP_ID, {
                'change_list': [{
                    'cmd': 'edit_state_property',
                    'state_name': state_name,
                    'property_name': 'content_ids_to_audio_translations',
                    'new_value': self.CONTENT_IDS_TO_AUDIO_TRANSLATION
                }],
                'commit_message': 'Translated first state content',
                'version': 1
            }, self.csrf_token)
        # Checking the response to have audio tarnslations.
        self.assertEqual(
            response['states'][state_name]['content_ids_to_audio_translations'],
            self.CONTENT_IDS_TO_AUDIO_TRANSLATION)

    def test_transator_cannot_save_invalid_change_list(self):
        # Trying to change exploration objective.
        response = self.put_json(
            '/createhandler/translate/%s' % self.EXP_ID, {
                'change_list': [{
                    'cmd': 'edit_exploration_property',
                    'property_name': 'objective',
                    'new_value': 'the objective',
                }],
                'commit_message': 'Chnaged exp objective',
                'version': 1
            }, self.csrf_token, expect_errors=True, expected_status_int=400)
        # Checking the response to have error.
        self.assertEqual(
            response, {'status_code': 400,
                       'error': (
                           'Translator does not have permission to make'
                           ' some changes in the change list.')
                      })


class TranslatorAutosaveTest(BaseTranslatorControllerTest):
    """Test the handling of translator autosave actions."""

    EXP_ID = 'expId'
    # 30 days into the future.
    NEWER_DATETIME = datetime.datetime.utcnow() + datetime.timedelta(30)
    # A date in the past.
    OLDER_DATETIME = datetime.datetime.strptime('2015-03-16', '%Y-%m-%d')
    CONTENT_IDS_TO_AUDIO_TRANSLATION = {
        'content': {
            'en': {
                'filename': 'testFile.mp3',
                'file_size_bytes': 12200,
                'needs_update': False
            }
        },
        'default_outcome': {}
    }
    VALID_DRAFT_CHANGELIST = [{
        'cmd': 'edit_state_property',
        'state_name': feconf.DEFAULT_INIT_STATE_NAME,
        'property_name': 'content_ids_to_audio_translations',
        'old_value': None,
        'new_value': CONTENT_IDS_TO_AUDIO_TRANSLATION}]
    INVALID_DRAFT_CHANGELIST = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'old_value': None,
        'new_value': 'New title'}]

    def setUp(self):
        super(TranslatorAutosaveTest, self).setUp()
        self.login(self.OWNER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_ID, self.translator_id,
            rights_manager.ROLE_TRANSLATOR)
        self.logout()

        self.login(self.TRANSLATOR_EMAIL)
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.translator_id, self.EXP_ID),
            user_id=self.translator_id, exploration_id=self.EXP_ID,
            draft_change_list=self.VALID_DRAFT_CHANGELIST,
            draft_change_list_last_updated=self.OLDER_DATETIME,
            draft_change_list_exp_version=1,
            draft_change_list_id=1).put()

        # Generate CSRF token.
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)

    def test_draft_updated_version_valid(self):
        payload = {
            'change_list': self.VALID_DRAFT_CHANGELIST,
            'version': 1,
        }
        response = self.put_json(
            '/createhandler/autosave_translation_draft/%s' % self.EXP_ID,
            payload, self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.translator_id, self.EXP_ID))
        self.assertEqual(
            exp_user_data.draft_change_list, self.VALID_DRAFT_CHANGELIST)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 1)
        self.assertTrue(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 2)

    def test_draft_not_updated_validation_error(self):
        response = self.put_json(
            '/createhandler/autosave_translation_draft/%s' % self.EXP_ID, {
                'change_list': self.INVALID_DRAFT_CHANGELIST,
                'version': 1,
            }, self.csrf_token, expect_errors=True, expected_status_int=400)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.translator_id, self.EXP_ID))
        self.assertEqual(
            exp_user_data.draft_change_list, self.VALID_DRAFT_CHANGELIST)
        # id is incremented the first time but not the second.
        self.assertEqual(exp_user_data.draft_change_list_id, 1)
        self.assertEqual(
            response, {'status_code': 400,
                       'error': (
                           'Translator does not have permission to make'
                           ' some changes in the change list.')
                      })

    def test_draft_updated_version_invalid(self):
        payload = {
            'change_list': self.VALID_DRAFT_CHANGELIST,
            'version': 10,
        }
        response = self.put_json(
            '/createhandler/autosave_translation_draft/%s' % self.EXP_ID,
            payload, self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.translator_id, self.EXP_ID))
        self.assertEqual(
            exp_user_data.draft_change_list, self.VALID_DRAFT_CHANGELIST)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 10)
        self.assertFalse(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 2)

    def test_discard_draft(self):
        self.post_json(
            '/createhandler/autosave_translation_draft/%s' % self.EXP_ID, {},
            self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.translator_id, self.EXP_ID))
        self.assertIsNone(exp_user_data.draft_change_list)
        self.assertIsNone(exp_user_data.draft_change_list_last_updated)
        self.assertIsNone(exp_user_data.draft_change_list_exp_version)
