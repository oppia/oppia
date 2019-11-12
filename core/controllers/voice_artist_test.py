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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import os

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.domain import voiceover_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


class BaseVoiceArtistControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for self.VOICE_ARTIST_EMAIL."""
        super(BaseVoiceArtistControllerTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)

        self.owner = user_services.UserActionsInfo(self.owner_id)


class VoiceArtistTest(BaseVoiceArtistControllerTests):
    """Test the handling of saving translation work."""

    EXP_ID = 'exp1'

    RECORDED_VOICEOVERS = {
        'voiceovers_mapping': {
            'content': {
                'en': {
                    'filename': 'testFile.mp3',
                    'file_size_bytes': 12200,
                    'needs_update': False
                }
            },
            'default_outcome': {}
        }
    }

    def setUp(self):
        super(VoiceArtistTest, self).setUp()
        self.login(self.OWNER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_ID, self.voice_artist_id,
            rights_manager.ROLE_VOICE_ARTIST)
        self.logout()

        self.login(self.VOICE_ARTIST_EMAIL)
        # Generate CSRF token.
        self.csrf_token = self.get_new_csrf_token()

    def test_put_with_no_payload_version_raises_error(self):
        with self.assertRaisesRegexp(
            Exception, 'Invalid POST request: a version must be specified.'):
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
            self):
        with self.assertRaisesRegexp(
            Exception, 'Trying to update version 1 of exploration from version'
            ' 3, which is too old. Please reload the page and try again.'):

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

    def test_voice_artist_can_save_valid_change_list(self):
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

    def test_voice_artist_cannot_save_invalid_change_list(self):
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

    EXP_ID = 'expId'
    # 30 days into the future.
    NEWER_DATETIME = datetime.datetime.utcnow() + datetime.timedelta(30)
    # A date in the past.
    OLDER_DATETIME = datetime.datetime.strptime('2015-03-16', '%Y-%m-%d')
    RECORDED_VOICEOVERS = {
        'voiceovers_mapping': {
            'content': {
                'en': {
                    'filename': 'testFile.mp3',
                    'file_size_bytes': 12200,
                    'needs_update': False
                }
            },
            'default_outcome': {}
        }
    }
    VALID_DRAFT_CHANGELIST = [{
        'cmd': 'edit_state_property',
        'state_name': feconf.DEFAULT_INIT_STATE_NAME,
        'property_name': 'recorded_voiceovers',
        'old_value': None,
        'new_value': RECORDED_VOICEOVERS}]
    INVALID_DRAFT_CHANGELIST = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'old_value': None,
        'new_value': 'New title'}]

    def setUp(self):
        super(VoiceArtistAutosaveTest, self).setUp()
        self.login(self.OWNER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_ID, self.voice_artist_id,
            rights_manager.ROLE_VOICE_ARTIST)
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

    def test_draft_updated_version_valid(self):
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

    def test_draft_not_updated_validation_error(self):
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

    def test_draft_updated_version_invalid(self):
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
        self.assertEqual(response['draft_change_list_id'], 2)

    def test_discard_draft(self):
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
    EXP_ID = 'exp1'

    def setUp(self):
        super(TranslationFirstTimeTutorialTest, self).setUp()
        self.login(self.OWNER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_ID, self.voice_artist_id,
            rights_manager.ROLE_VOICE_ARTIST)
        self.logout()

        self.login(self.VOICE_ARTIST_EMAIL)
        # Generate CSRF token.
        self.csrf_token = self.get_new_csrf_token()

    def test_firsttime_translation_tutorial(self):
        """Testing of the firsttime translation tutorial http requests."""
        # Check if method returns 200 http status.
        self.post_json(
            '/createhandler/started_translation_tutorial_event/%s'
            % self.EXP_ID, {}, csrf_token=self.csrf_token,
            expected_status_int=200)


class VoiceoverApplicationHandlerUnitTest(test_utils.GenericTestBase):
    """Unit text for voiceover application handlers."""
    applicant_username = 'applicant'
    applicant_email = 'applicant@example.com'
    reviewer_username = 'reviewer'
    reviewer_email = 'reviewer@example.com'
    TEST_AUDIO_FILE_MP3 = 'cafe.mp3'

    def setUp(self):
        super(VoiceoverApplicationHandlerUnitTest, self).setUp()
        self.signup(self.applicant_email, self.applicant_username)
        self.signup(self.reviewer_email, self.reviewer_username)

        self.set_admins([self.reviewer_username])
        self.applicant_id = self.get_user_id_from_email(self.applicant_email)
        self.reviewer_id = self.get_user_id_from_email(self.reviewer_email)

        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', title='title', category='category')
        exp_services.save_new_exploration(self.reviewer_id, exploration)

        topic = topic_domain.Topic.create_default_topic(
            topic_id=self.TOPIC_ID, name='topic')
        topic_services.save_new_topic(self.reviewer_id, topic)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, title='A story',
            corresponding_topic_id=self.TOPIC_ID)
        story_services.save_new_story(self.reviewer_id, story)
        topic_services.add_canonical_story(
            self.reviewer_id, self.TOPIC_ID, self.STORY_ID)
        story_services.update_story(
            self.reviewer_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': 'exp_id'
            })], 'Changes.')

        voiceover_services.create_new_voiceover_application(
            'exploration', 'exp_id', 'en', '<p>Some content</p>', 'audio.mp3',
            self.applicant_id)
        self.voiceover_application = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id)[0])

    def test_get_text_for_voiceover_application(self):
        self.login(self.reviewer_email)
        response = self.get_json(
            '/voiceoverapplicationtext/exploration/exp_id',
            params={
                'language_code': 'en'
            })
        self.assertEqual(response['text'], '')

    def test_get_text_for_voiceover_application_for_invalid_lang_raise_error(
            self):
        self.login(self.reviewer_email)
        response = self.get_json(
            '/voiceoverapplicationtext/exploration/exp_id',
            params={
                'language_code': 'invalid'
            }, expected_status_int=400)
        self.assertEqual(
            response['error'],
            'Translation for the give content_id content does not exist'
            ' in invalid language code')

    def test_guest_cannot_submit_voiceover_application(self):
        csrf_token = self.get_new_csrf_token()

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
            mode='rb', encoding=None) as f:
            raw_audio = f.read()

        response = self.post_json(
            '/createvoiceoverapplicationhandler', {
                'target_type': 'exploration',
                'target_id': '0',
                'language_code': 'en',
                'voiceover_content': '<p>Some content</p>',
            }, csrf_token=csrf_token,
            upload_files=[('raw_audio_file', 'unused_filename', raw_audio)],
            expected_status_int=401
        )
        self.assertEqual(
            response['error'],
            'You must be logged in to submit voiceover application.')

    def test_users_can_submit_voiceover_application(self):
        self.signup('contributor@community.com', 'contributor')
        self.login('contributor@community.com')
        csrf_token = self.get_new_csrf_token()

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
            mode='rb', encoding=None) as f:
            raw_audio = f.read()

        self.post_json(
            '/createvoiceoverapplicationhandler', {
                'target_type': 'exploration',
                'target_id': '0',
                'language_code': 'en',
                'voiceover_content': '<p>Some content</p>',
            }, csrf_token=csrf_token,
            upload_files=[('raw_audio_file', 'unused_filename', raw_audio)]
        )
        self.logout()

    def test_users_cannot_submit_voiceover_application_for_invalid_lang(self):
        self.signup('contributor@community.com', 'contributor')
        self.login('contributor@community.com')
        csrf_token = self.get_new_csrf_token()

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
            mode='rb', encoding=None) as f:
            raw_audio = f.read()

        response = self.post_json(
            '/createvoiceoverapplicationhandler', {
                'target_type': 'exploration',
                'target_id': '0',
                'language_code': 'invalid',
                'voiceover_content': '<p>Some content</p>',
            }, csrf_token=csrf_token,
            upload_files=[('raw_audio_file', 'unused_filename', raw_audio)],
            expected_status_int=400
        )
        self.assertEqual(response['error'], 'Invalid language_code: invalid')

    def test_admin_can_accept_voiceover_application(self):
        self.login(self.reviewer_email)
        csrf_token = self.get_new_csrf_token()

        self.put_json(
            '/voiceoverappplicationactionhandler/%s' % (
                self.voiceover_application.voiceover_application_id),
            {'action': 'accept'}, csrf_token=csrf_token)

        voiceover_application = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id)[0])
        self.assertEqual(voiceover_application.status, 'accepted')

    def test_admin_can_reject_voiceover_application(self):
        self.login(self.reviewer_email)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/voiceoverappplicationactionhandler/%s' % (
                self.voiceover_application.voiceover_application_id), {
                    'action': 'reject',
                    'review_message': 'Rejected'
                }, csrf_token=csrf_token)
        voiceover_application = (
            voiceover_services.get_user_submitted_voiceover_applications(
                self.applicant_id)[0])
        self.assertEqual(voiceover_application.status, 'rejected')
        self.assertEqual(voiceover_application.rejection_message, 'Rejected')

    def test_admin_cannot_perform_invalid_action_on_voiceover_application(self):
        self.login(self.reviewer_email)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/voiceoverappplicationactionhandler/%s' % (
                self.voiceover_application.voiceover_application_id),
            {'action': 'invalid'}, csrf_token=csrf_token,
            expected_status_int=400)

    def test_get_voiceover_application_for_review_purpose(self):
        self.login(self.reviewer_email)
        response = self.get_json('/getsubmittedvoiceoverapplication/review')
        self.assertEqual(len(response['voiceover_applications']), 1)
        response_voiceover_application = response['voiceover_applications'][0]
        self.assertEqual(
            response_voiceover_application['voiceover_application_id'],
            self.voiceover_application.voiceover_application_id)

    def test_get_voiceover_application_for_status_purpose(self):
        self.login(self.applicant_email)
        response = self.get_json('/getsubmittedvoiceoverapplication/status')
        self.assertEqual(len(response['voiceover_applications']), 1)
        response_voiceover_application = response['voiceover_applications'][0]
        self.assertEqual(
            response_voiceover_application['voiceover_application_id'],
            self.voiceover_application.voiceover_application_id)

    def test_get_voiceover_application_for_unknown_purpose(self):
        self.login(self.reviewer_email)
        self.get_json(
            '/getsubmittedvoiceoverapplication/invalid',
            expected_status_int=404)
