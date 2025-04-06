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

"""Tests for the exploration voice artist work."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class BaseVoiceArtistControllerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        """Completes the sign-up process for self.VOICE_ARTIST_EMAIL."""
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.signup('voiceoveradmin@app.com', 'voiceoverManager')

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)

        self.voiceover_admin_id = self.get_user_id_from_email(
            'voiceoveradmin@app.com')
        self.add_user_role('voiceoverManager', feconf.ROLE_ID_VOICEOVER_ADMIN)
        self.voiceover_admin = user_services.get_user_actions_info(
            self.voiceover_admin_id)


class VoiceArtistTest(BaseVoiceArtistControllerTests):
    """Test the handling of saving translation work."""

    EXP_ID: Final = 'exp1'
    RECORDED_VOICEOVERS: Final = {
        'voiceovers_mapping': {
            'ca_placeholder_2': {},
            'content_0': {
                'en': {
                    'filename': 'testFile.mp3',
                    'file_size_bytes': 12200,
                    'needs_update': False,
                    'duration_secs': 4.5
                }
            },
            'default_outcome_1': {}
        }
    }

    def setUp(self) -> None:
        super().setUp()
        self.login(self.OWNER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End card')
        self.publish_exploration(self.owner_id, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.voiceover_admin,
            self.EXP_ID,
            self.voice_artist_id,
            rights_domain.ROLE_VOICE_ARTIST
        )
        self.logout()

        self.login(self.VOICE_ARTIST_EMAIL)
        # Generate CSRF token.
        self.csrf_token = self.get_new_csrf_token()

    def test_put_with_no_payload_version_raises_error(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Missing key in handler args: version.'):
            self.put_json(
                '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, self.EXP_ID), {
                    'change_list': [{
                        'cmd': 'edit_state_property',
                        'state_name': feconf.DEFAULT_INIT_STATE_NAME,
                        'property_name': 'recorded_voiceovers',
                        'new_value': self.RECORDED_VOICEOVERS
                    }],
                    'commit_message': 'Translated first state content'
                }, csrf_token=self.csrf_token)

    def test_put_with_payload_version_different_from_exp_version_raises_error(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Trying to update version 1 of exploration from version'
            ' 3, which is not possible. Please reload the page and try again.'):

            self.put_json(
                '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, self.EXP_ID), {
                    'change_list': [{
                        'cmd': 'edit_state_property',
                        'state_name': feconf.DEFAULT_INIT_STATE_NAME,
                        'property_name': 'recorded_voiceovers',
                        'new_value': self.RECORDED_VOICEOVERS
                    }],
                    'commit_message': 'Translated first state content',
                    'version': 3
                }, csrf_token=self.csrf_token)

    def test_voice_artist_can_save_valid_change_list(self) -> None:
        response = self.put_json(
            '/createhandler/data/%s' % self.EXP_ID, {
                'change_list': [{
                    'cmd': 'edit_state_property',
                    'state_name': feconf.DEFAULT_INIT_STATE_NAME,
                    'property_name': 'recorded_voiceovers',
                    'new_value': self.RECORDED_VOICEOVERS
                }],
                'commit_message': 'Translated first state content',
                'version': 1
            }, csrf_token=self.csrf_token)
        # Checking the response to have audio translations.
        self.assertEqual(
            response['states'][feconf.DEFAULT_INIT_STATE_NAME]
            ['recorded_voiceovers'],
            self.RECORDED_VOICEOVERS)

    def test_voice_artist_cannot_save_invalid_change_list(self) -> None:
        # Trying to change exploration objective.
        response = self.put_json(
            '/createhandler/data/%s' % self.EXP_ID, {
                'change_list': [{
                    'cmd': 'edit_exploration_property',
                    'property_name': 'objective',
                    'new_value': 'the objective',
                }],
                'commit_message': 'Changed exp objective',
                'version': 1
            }, csrf_token=self.csrf_token,
            expected_status_int=400)
        # Checking the response to have error.
        self.assertEqual(
            response, {'status_code': 400,
                       'error': (
                           'Voice artist does not have permission to make'
                           ' some changes in the change list.')
                      })


class VoiceArtistAutosaveTest(BaseVoiceArtistControllerTests):
    """Test the handling of voice artist autosave actions."""

    EXP_ID: Final = 'expId'
    # 30 days into the future.
    NEWER_DATETIME: Final = datetime.datetime.utcnow() + datetime.timedelta(30)
    # A date in the past.
    OLDER_DATETIME: Final = datetime.datetime.strptime('2015-03-16', '%Y-%m-%d')
    RECORDED_VOICEOVERS: Final = {
        'voiceovers_mapping': {
            'ca_placeholder_2': {},
            'content_0': {
                'en': {
                    'filename': 'testFile.mp3',
                    'file_size_bytes': 12200,
                    'needs_update': False,
                    'duration_secs': 4.5
                }
            },
            'default_outcome_1': {}
        }
    }
    VALID_DRAFT_CHANGELIST: Final = [{
        'cmd': 'edit_state_property',
        'state_name': feconf.DEFAULT_INIT_STATE_NAME,
        'property_name': 'recorded_voiceovers',
        'old_value': None,
        'new_value': RECORDED_VOICEOVERS}]
    INVALID_DRAFT_CHANGELIST: Final = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'old_value': None,
        'new_value': 'New title'}]

    def setUp(self) -> None:
        super().setUp()
        self.login(self.OWNER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        self.publish_exploration(self.owner_id, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.voiceover_admin,
            self.EXP_ID,
            self.voice_artist_id,
            rights_domain.ROLE_VOICE_ARTIST
        )
        self.logout()

        self.login(self.VOICE_ARTIST_EMAIL)
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.voice_artist_id, self.EXP_ID),
            user_id=self.voice_artist_id, exploration_id=self.EXP_ID,
            draft_change_list=self.VALID_DRAFT_CHANGELIST,
            draft_change_list_last_updated=self.OLDER_DATETIME,
            draft_change_list_exp_version=1,
            draft_change_list_id=1).put()

        # Generate CSRF token.
        self.csrf_token = self.get_new_csrf_token()

    def test_draft_updated_version_valid(self) -> None:
        payload = {
            'change_list': self.VALID_DRAFT_CHANGELIST,
            'version': 1,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID,
            payload, csrf_token=self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.voice_artist_id, self.EXP_ID))
        self.assertEqual(
            exp_user_data.draft_change_list, self.VALID_DRAFT_CHANGELIST)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 1)
        self.assertTrue(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 2)

    def test_draft_not_updated_validation_error(self) -> None:
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID, {
                'change_list': self.INVALID_DRAFT_CHANGELIST,
                'version': 1,
            }, csrf_token=self.csrf_token, expected_status_int=400)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.voice_artist_id, self.EXP_ID))
        self.assertEqual(
            exp_user_data.draft_change_list, self.VALID_DRAFT_CHANGELIST)
        self.assertEqual(exp_user_data.draft_change_list_id, 1)
        self.assertEqual(
            response, {'status_code': 400,
                       'error': (
                           'Voice artist does not have permission to make'
                           ' some changes in the change list.')
                      })

    def test_draft_updated_version_invalid(self) -> None:
        payload = {
            'change_list': self.VALID_DRAFT_CHANGELIST,
            'version': 10,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID,
            payload, csrf_token=self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.voice_artist_id, self.EXP_ID))
        self.assertEqual(
            exp_user_data.draft_change_list, self.VALID_DRAFT_CHANGELIST)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 10)
        self.assertFalse(response['is_version_of_draft_valid'])
        self.assertFalse(response['changes_are_mergeable'])
        self.assertEqual(response['draft_change_list_id'], 2)

    def test_discard_draft(self) -> None:
        self.post_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID, {},
            csrf_token=self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.voice_artist_id, self.EXP_ID))
        self.assertIsNone(exp_user_data.draft_change_list)
        self.assertIsNone(exp_user_data.draft_change_list_last_updated)
        self.assertIsNone(exp_user_data.draft_change_list_exp_version)


class TranslationFirstTimeTutorialTest(BaseVoiceArtistControllerTests):
    """This controller tests the first time tutorial for translations."""

    EXP_ID: Final = 'exp1'

    def setUp(self) -> None:
        super().setUp()
        self.login(self.OWNER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        self.publish_exploration(self.owner_id, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.voiceover_admin,
            self.EXP_ID,
            self.voice_artist_id,
            rights_domain.ROLE_VOICE_ARTIST
        )
        self.logout()

        self.login(self.VOICE_ARTIST_EMAIL)
        # Generate CSRF token.
        self.csrf_token = self.get_new_csrf_token()

    def test_firsttime_translation_tutorial(self) -> None:
        """Testing of the firsttime translation tutorial http requests."""
        # Check if method returns 200 http status.
        self.post_json(
            '/createhandler/started_translation_tutorial_event/%s'
            % self.EXP_ID, {}, csrf_token=self.csrf_token,
            expected_status_int=200)

    def test_cannot_start_translation_tutorial_if_user_is_not_logged_in(
        self
    ) -> None:
        self.logout()
        response = self.post_json(
            '/createhandler/started_translation_tutorial_event/%s'
            % self.EXP_ID, {}, csrf_token=self.get_new_csrf_token(),
            expected_status_int=401
        )
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.'
        )


class VoiceArtistManagementTests(test_utils.GenericTestBase):

    published_exp_id_1 = 'exp_1'
    published_exp_id_2 = 'exp_2'
    private_exp_id_1 = 'exp_3'
    private_exp_id_2 = 'exp_4'

    def setUp(self) -> None:
        """Completes the sign-up process for self.VOICE_ARTIST_EMAIL."""
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.voiceover_admin_id = self.get_user_id_from_email(
            self.VOICEOVER_ADMIN_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.save_new_valid_exploration(
            self.published_exp_id_1, self.owner_id)
        self.save_new_valid_exploration(
            self.published_exp_id_2, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id_1, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id_2, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id_1)
        rights_manager.publish_exploration(self.owner, self.published_exp_id_2)
        user_services.add_user_role(
            self.voiceover_admin_id, feconf.ROLE_ID_VOICEOVER_ADMIN)

    def test_owner_cannot_assign_voice_artist(self) -> None:
        self.login(self.OWNER_EMAIL)
        params = {
            'username': self.VOICE_ARTIST_USERNAME
        }
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/voice_artist_management_handler/exploration/%s'
            % self.published_exp_id_1, params,
            csrf_token=csrf_token, expected_status_int=401)
        self.logout()

    def test_voiceover_admin_can_manage_voice_artist(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        params = {
            'username': self.VOICE_ARTIST_USERNAME
        }
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/voice_artist_management_handler/exploration/%s'
            % self.published_exp_id_1, params, csrf_token=csrf_token)
        self.logout()

    def test_voiceover_admin_can_deassign_voice_artist(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        params = {
            'username': self.VOICE_ARTIST_USERNAME
        }
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/voice_artist_management_handler/exploration/%s'
            % self.published_exp_id_1, params, csrf_token=csrf_token)
        self.delete_json(
            '/voice_artist_management_handler/exploration/%s'
            % self.published_exp_id_1, params={
                'voice_artist': self.VOICE_ARTIST_USERNAME})
        self.logout()

    def test_cannot_assign_voice_artist_to_random_user(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        params = {
            'username': 'random_user'
        }
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/voice_artist_management_handler/exploration/%s'
            % self.published_exp_id_1, params,
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn(
            'Schema validation for \'username\' failed: Validation failed:',
            response['error']
        )
        self.logout()

    def test_cannot_deassign_random_user_from_voice_artist(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        params = {
            'username': self.VOICE_ARTIST_USERNAME
        }
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/voice_artist_management_handler/exploration/%s'
            % self.published_exp_id_1, params, csrf_token=csrf_token)
        response = self.delete_json(
            '/voice_artist_management_handler/exploration/%s'
            % self.published_exp_id_1, params={
                'voice_artist': 'random_user'}, expected_status_int=400)
        self.assertIn(
            'Schema validation for \'voice_artist\' failed: Validation failed:',
            response['error']
        )
        self.logout()

    def test_cannot_assign_voice_artist_to_invalid_user(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        params = {
            'username': 'invalid'
        }
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/voice_artist_management_handler/exploration/%s'
            % self.published_exp_id_1, params, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'],
            'Sorry, we could not find the specified user.'
        )

        self.logout()
