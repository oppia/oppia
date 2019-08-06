# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for the exploration editor page."""

import StringIO
import datetime
import logging
import os
import zipfile

from constants import constants
from core.controllers import creator_dashboard
from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import question_services
from core.domain import rights_manager
from core.domain import stats_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(exp_models, user_models, stats_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.user, models.NAMES.statistics])


class BaseEditorControllerTests(test_utils.GenericTestBase):

    CAN_EDIT_STR = 'GLOBALS.can_edit = JSON.parse(\'true\');'
    CANNOT_EDIT_STR = 'GLOBALS.can_edit = JSON.parse(\'false\');'
    CAN_VOICEOVER_STR = 'GLOBALS.can_voiceover = JSON.parse(\'true\');'
    CANNOT_VOICEOVER_STR = 'GLOBALS.can_voiceover = JSON.parse(\'false\');'

    def setUp(self):
        """Completes the sign-up process for self.EDITOR_EMAIL."""
        super(BaseEditorControllerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])

        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.system_user = user_services.get_system_user()
        self.editor = user_services.UserActionsInfo(self.editor_id)

    def assert_can_edit(self, response_body):
        """Returns True if the response body indicates that the exploration is
        editable.
        """
        self.assertIn(self.CAN_EDIT_STR, response_body)
        self.assertNotIn(self.CANNOT_EDIT_STR, response_body)

    def assert_cannot_edit(self, response_body):
        """Returns True if the response body indicates that the exploration is
        not editable.
        """
        self.assertIn(self.CANNOT_EDIT_STR, response_body)
        self.assertNotIn(self.CAN_EDIT_STR, response_body)

    def assert_can_voiceover(self, response_body):
        """Returns True if the response body indicates that the exploration can
        be voiceovered.
        """
        self.assertIn(self.CAN_VOICEOVER_STR, response_body)
        self.assertNotIn(self.CANNOT_VOICEOVER_STR, response_body)

    def assert_cannot_voiceover(self, response_body):
        """Returns True if the response body indicates that the exploration can
        not be voiceovered.
        """
        self.assertIn(self.CANNOT_VOICEOVER_STR, response_body)
        self.assertNotIn(self.CAN_VOICEOVER_STR, response_body)


class EditorTests(BaseEditorControllerTests):

    def setUp(self):
        super(EditorTests, self).setUp()
        exp_services.load_demo('0')

        rights_manager.release_ownership_of_exploration(
            self.system_user, '0')

    def test_editor_page(self):
        """Test access to editor pages for the sample exploration."""

        # Check that non-editors can access, but not edit, the editor page.
        response = self.get_html_response('/create/0')
        self.assertIn('Help others learn new things.', response.body)
        self.assert_cannot_edit(response.body)

        # Log in as an editor.
        self.login(self.EDITOR_EMAIL)

        # Check that it is now possible to access and edit the editor page.
        response = self.get_html_response('/create/0')
        self.assertIn('Help others learn new things.', response.body)
        self.assert_can_edit(response.body)

        self.logout()

    def test_new_state_template(self):
        """Test the validity of the NEW_STATE_TEMPLATE."""

        exploration = exp_fetchers.get_exploration_by_id('0')
        exploration.add_states([feconf.DEFAULT_INIT_STATE_NAME])
        new_state_dict = exploration.states[
            feconf.DEFAULT_INIT_STATE_NAME].to_dict()
        self.assertEqual(new_state_dict, constants.NEW_STATE_TEMPLATE)
        # Validates if the current NEW_STATE_TEMPLATE is the latest version
        # by validating it.
        exploration.states[feconf.DEFAULT_INIT_STATE_NAME].validate(None, True)


    def test_that_default_exploration_cannot_be_published(self):
        """Test that publishing a default exploration raises an error
        due to failing strict validation.
        """
        self.login(self.EDITOR_EMAIL)

        csrf_token = self.get_new_csrf_token()
        exp_id = self.post_json(
            feconf.NEW_EXPLORATION_URL, {}, csrf_token=csrf_token
        )[creator_dashboard.EXPLORATION_ID_KEY]

        csrf_token = self.get_new_csrf_token()
        publish_url = '%s/%s' % (feconf.EXPLORATION_STATUS_PREFIX, exp_id)
        self.put_json(
            publish_url, {
                'make_public': True,
            }, csrf_token=csrf_token, expected_status_int=400)

        self.logout()

    def test_add_new_state_error_cases(self):
        """Test the error cases for adding a new state to an exploration."""
        current_version = 1

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        def _get_payload(new_state_name, version=None):
            """Gets the payload in the dict format."""
            result = {
                'change_list': [{
                    'cmd': 'add_state',
                    'state_name': new_state_name
                }],
                'commit_message': 'Add new state',
            }
            if version is not None:
                result['version'] = version
            return result

        def _put_and_expect_400_error(payload):
            """Puts a request with no version number and hence, expects 400
            error.
            """
            return self.put_json(
                '/createhandler/data/0', payload,
                csrf_token=csrf_token, expected_status_int=400)

        # A request with no version number is invalid.
        response_dict = _put_and_expect_400_error(_get_payload('New state'))
        self.assertIn('a version must be specified', response_dict['error'])

        # A request with the wrong version number is invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('New state', version=123))
        self.assertIn('which is too old', response_dict['error'])

        # A request with an empty state name is invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('', version=current_version))
        self.assertIn('should be between 1 and 50', response_dict['error'])

        # A request with a really long state name is invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('a' * 100, version=current_version))
        self.assertIn('should be between 1 and 50', response_dict['error'])

        # A request with a state name containing invalid characters is
        # invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('[Bad State Name]', version=current_version))
        self.assertIn('Invalid character [', response_dict['error'])

        # A name cannot have spaces at the front or back.
        response_dict = _put_and_expect_400_error(
            _get_payload('  aa', version=current_version))
        self.assertIn('start or end with whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('aa\t', version=current_version))
        self.assertIn('end with whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('\n', version=current_version))
        self.assertIn('end with whitespace', response_dict['error'])

        # A name cannot have consecutive whitespace.
        response_dict = _put_and_expect_400_error(
            _get_payload('The   B', version=current_version))
        self.assertIn('Adjacent whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('The\t\tB', version=current_version))
        self.assertIn('Adjacent whitespace', response_dict['error'])

        self.logout()

    def test_publish_exploration(self):
        self.login(self.ADMIN_EMAIL)

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(
            exp_id, self.admin_id, end_state_name='end state')
        csrf_token = self.get_new_csrf_token()
        publish_url = '%s/%s' % (feconf.EXPLORATION_STATUS_PREFIX, exp_id)

        exploration_rights = self.put_json(
            publish_url, payload={},
            csrf_token=csrf_token)['rights']

        self.assertEqual(exploration_rights['status'], 'private')

        exploration_rights = self.put_json(
            publish_url, payload={'make_public': True},
            csrf_token=csrf_token)['rights']

        self.assertEqual(exploration_rights['status'], 'public')

        self.logout()


class ExplorationEditorLogoutTest(BaseEditorControllerTests):
    """Test handler for logout from exploration editor page."""

    def test_logout_from_unpublished_exploration_editor(self):
        """Logout from unpublished exploration should redirect
        to library page.
        """

        unpublished_exp_id = '_unpublished_eid123'
        exploration = exp_domain.Exploration.create_default_exploration(
            unpublished_exp_id)
        exp_services.save_new_exploration(self.owner_id, exploration)

        current_page_url = '%s/%s' % (
            feconf.EDITOR_URL_PREFIX, unpublished_exp_id)
        self.login(self.OWNER_EMAIL)
        response = self.get_html_response(current_page_url)

        response = self.get_html_response('/logout', expected_status_int=302)
        self.assertEqual(response.status_int, 302)
        self.assertEqual(
            response.headers['location'], 'https://www.google.com/accounts' +
            '/Logout?continue=http%3A//localhost/')
        self.logout()

    def test_logout_from_published_exploration_editor(self):
        """Logout from published exploration should redirect
        to same page.
        """

        published_exp_id = 'published_eid-123'
        exploration = exp_domain.Exploration.create_default_exploration(
            published_exp_id)
        exp_services.save_new_exploration(self.owner_id, exploration)

        current_page_url = '%s/%s' % (
            feconf.EDITOR_URL_PREFIX, published_exp_id)
        self.login(self.OWNER_EMAIL)
        response = self.get_html_response(current_page_url)

        rights_manager.publish_exploration(self.owner, published_exp_id)

        response = self.get_html_response('/logout', expected_status_int=302)
        self.assertEqual(response.status_int, 302)
        self.assertEqual(
            response.headers['location'], 'https://www.google.com/accounts' +
            '/Logout?continue=http%3A//localhost/')
        self.logout()


class DownloadIntegrationTest(BaseEditorControllerTests):
    """Test handler for exploration and state download."""

    SAMPLE_JSON_CONTENT = {
        'State A': ("""classifier_model_id: null
content:
  content_id: content
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    placeholder:
      value: ''
    rows:
      value: 1
  default_outcome:
    dest: State A
    feedback:
      content_id: default_outcome
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    content: {}
    default_outcome: {}
solicit_answer_details: false
written_translations:
  translations_mapping:
    content: {}
    default_outcome: {}
"""),
        'State B': ("""classifier_model_id: null
content:
  content_id: content
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    placeholder:
      value: ''
    rows:
      value: 1
  default_outcome:
    dest: State B
    feedback:
      content_id: default_outcome
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    content: {}
    default_outcome: {}
solicit_answer_details: false
written_translations:
  translations_mapping:
    content: {}
    default_outcome: {}
"""),
        feconf.DEFAULT_INIT_STATE_NAME: ("""classifier_model_id: null
content:
  content_id: content
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    placeholder:
      value: ''
    rows:
      value: 1
  default_outcome:
    dest: %s
    feedback:
      content_id: default_outcome
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    content: {}
    default_outcome: {}
solicit_answer_details: false
written_translations:
  translations_mapping:
    content: {}
    default_outcome: {}
""") % feconf.DEFAULT_INIT_STATE_NAME
    }

    SAMPLE_STATE_STRING = ("""classifier_model_id: null
content:
  content_id: content
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    placeholder:
      value: ''
    rows:
      value: 1
  default_outcome:
    dest: State A
    feedback:
      content_id: default_outcome
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    content: {}
    default_outcome: {}
solicit_answer_details: false
written_translations:
  translations_mapping:
    content: {}
    default_outcome: {}
""")

    def test_can_not_download_exploration_with_disabled_exp_id(self):
        download_url = '/createhandler/download/5'
        self.get_json(download_url, expected_status_int=404)

    def test_exploration_download_handler_for_default_exploration(self):
        self.login(self.EDITOR_EMAIL)
        owner_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # Create a simple exploration.
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, owner_id,
            title='The title for ZIP download handler test!',
            category='This is just a test category',
            objective='')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        init_state = exploration.states[exploration.init_state_name]
        init_interaction = init_state.interaction
        init_interaction.default_outcome.dest = exploration.init_state_name
        exp_services.update_exploration(
            owner_id, exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State A',
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State 2',
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State 3',
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'State A',
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'State 2',
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'State 3',
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_RENAME_STATE,
                    'old_state_name': 'State 2',
                    'new_state_name': 'State B'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_DELETE_STATE,
                    'state_name': 'State 3',
                })], 'changes')
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        response = self.get_html_response('/create/%s' % exp_id)

        # Check download to zip file.
        # Download to zip file using download handler.
        download_url = '/createhandler/download/%s' % exp_id
        response = self.get_custom_response(download_url, 'text/plain')

        # Check downloaded zip file.
        filename = 'oppia-ThetitleforZIPdownloadhandlertest!-v2.zip'
        self.assertEqual(response.headers['Content-Disposition'],
                         'attachment; filename=%s' % str(filename))
        zf_saved = zipfile.ZipFile(StringIO.StringIO(response.body))
        self.assertEqual(
            zf_saved.namelist(),
            ['The title for ZIP download handler test!.yaml'])

        # Load golden zip file.
        with open(os.path.join(
            feconf.TESTS_DATA_DIR,
            'oppia-ThetitleforZIPdownloadhandlertest!-v2-gold.zip'),
                  'rb') as f:
            golden_zipfile = f.read()
        zf_gold = zipfile.ZipFile(StringIO.StringIO(golden_zipfile))
        # Compare saved with golden file.
        self.assertEqual(
            zf_saved.open(
                'The title for ZIP download handler test!.yaml').read(),
            zf_gold.open(
                'The title for ZIP download handler test!.yaml').read())

        # Check download to JSON.
        exploration.update_objective('Test JSON download')
        exp_services._save_exploration(  # pylint: disable=protected-access
            owner_id, exploration, '', [])

        # Download to JSON string using download handler.
        self.maxDiff = None
        download_url = (
            '/createhandler/download/%s?output_format=%s&width=50' %
            (exp_id, feconf.OUTPUT_FORMAT_JSON))
        response = self.get_json(download_url)

        # Check downloaded dict.
        self.assertEqual(self.SAMPLE_JSON_CONTENT, response)

        # Check downloading a specific version.
        download_url = (
            '/createhandler/download/%s?output_format=%s&v=1' %
            (exp_id, feconf.OUTPUT_FORMAT_JSON))
        response = self.get_json(download_url)
        self.assertEqual(['Introduction'], response.keys())

        # Check downloading an invalid version results in downloading the
        # latest version.
        download_url = (
            '/createhandler/download/%s?output_format=%s&v=xxx' %
            (exp_id, feconf.OUTPUT_FORMAT_JSON))
        response = self.get_json(download_url)
        self.assertEqual(self.SAMPLE_JSON_CONTENT, response)
        self.assertEqual(
            ['Introduction', 'State A', 'State B'], response.keys())

        self.logout()

    def test_state_yaml_handler(self):
        self.login(self.EDITOR_EMAIL)
        owner_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # Create a simple exploration.
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, owner_id,
            title='The title for states download handler test!',
            category='This is just a test category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exploration.states['State A'].update_interaction_id('TextInput')

        csrf_token = self.get_new_csrf_token()
        response = self.post_json('/createhandler/state_yaml/%s' % exp_id, {
            'state_dict': exploration.states['State A'].to_dict(),
            'width': 50,
        }, csrf_token=csrf_token)
        self.assertEqual({
            'yaml': self.SAMPLE_STATE_STRING
        }, response)

        self.logout()

    def test_state_yaml_handler_with_no_state_dict_raises_error(self):
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration(exp_id, owner_id)

        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '/createhandler/state_yaml/%s' % exp_id, {},
            csrf_token=csrf_token, expected_status_int=404)

        self.logout()

    def test_exploration_download_handler_with_invalid_exploration_id(self):
        self.login(self.OWNER_EMAIL)

        self.get_json(
            '/createhandler/download/invalid_exploration_id',
            expected_status_int=404)

        self.logout()

    def test_guest_cannot_access_exploration_download_handler(self):
        self.save_new_valid_exploration('exp_id', 'owner_id')
        self.get_json('/createhandler/download/exp_id', expected_status_int=404)

    def test_exploration_download_handler_with_invalid_output_format(self):
        self.login(self.OWNER_EMAIL)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        exp_id = 'exp_id1'

        self.save_new_valid_exploration(exp_id, owner_id)

        response = self.get_json(
            '/createhandler/download/%s?output_format=invalid_output_format'
            % (exp_id), expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Unrecognized output format invalid_output_format')

        self.logout()


class ExplorationSnapshotsHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationSnapshotsHandlerTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_get_with_invalid_exploration_id_raises_error(self):
        self.login(self.OWNER_EMAIL)

        self.get_json(
            '/createhandler/snapshots/invalid_exploration_id',
            expected_status_int=404)

        self.logout()

    def test_get_exploration_snapshot_history(self):
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.save_new_valid_exploration(exp_id, owner_id)

        snapshots = exp_services.get_exploration_snapshots_metadata(exp_id)

        # Patch `snapshots` to use the editor's display name.
        for snapshot in snapshots:
            snapshot.update({
                'committer_id': 'owner'
            })

        response = self.get_json('/createhandler/snapshots/%s' % (exp_id))

        self.assertEqual(response['snapshots'], snapshots)

        exp_services.update_exploration(
            owner_id, exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State A',
                })], 'Addes state')

        snapshots = exp_services.get_exploration_snapshots_metadata(exp_id)

        # Patch `snapshots` to use the editor's display name.
        for snapshot in snapshots:
            snapshot.update({
                'committer_id': 'owner'
            })

        response = self.get_json('/createhandler/snapshots/%s' % (exp_id))

        self.assertEqual(response['snapshots'], snapshots)

        self.logout()


class ExplorationStatisticsHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationStatisticsHandlerTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_get_with_invalid_exploration_id_raises_error(self):
        self.login(self.OWNER_EMAIL)

        self.get_json(
            '/createhandler/statistics/invalid_exploration_id',
            expected_status_int=404)

        self.logout()

    def test_guest_cannot_access_exploration_statistics_handler(self):
        self.save_new_valid_exploration('exp_id', 'owner_id')
        self.get_json(
            '/createhandler/statistics/exp_id', expected_status_int=404)

    def test_get_exploration_statistics(self):
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exploration = self.save_new_valid_exploration(exp_id, owner_id)
        exp_stats = stats_services.get_exploration_stats(
            exp_id, exploration.version)

        response = self.get_json('/createhandler/statistics/%s' % (exp_id))

        self.assertEqual(response, exp_stats.to_frontend_dict())

        exp_services.update_exploration(
            owner_id, exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State A',
                })], 'Addes state')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exp_stats = stats_services.get_exploration_stats(
            exp_id, exploration.version)

        response = self.get_json('/createhandler/statistics/%s' % (exp_id))

        self.assertEqual(response, exp_stats.to_frontend_dict())

        self.logout()


class StartedTutorialEventHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StartedTutorialEventHandlerTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_record_user_saw_tutorial(self):
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.save_new_valid_exploration(exp_id, owner_id)

        csrf_token = self.get_new_csrf_token()

        user_settings = user_services.get_user_settings(owner_id)

        self.assertFalse(user_settings.last_started_state_editor_tutorial)

        self.post_json(
            '/createhandler/started_tutorial_event/%s' % (exp_id), {},
            csrf_token=csrf_token)

        user_settings = user_services.get_user_settings(owner_id)

        self.assertTrue(user_settings.last_started_state_editor_tutorial)

        self.logout()


class TopUnresolvedAnswersHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(TopUnresolvedAnswersHandlerTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.exp_id = 'exp_id'
        self.exploration = self.save_new_valid_exploration(
            self.exp_id, self.owner_id)

    def test_cannot_get_unresolved_answers_with_no_state_name(self):
        self.login(self.OWNER_EMAIL)

        self.get_json(
            '/createhandler/get_top_unresolved_answers/%s' % self.exp_id,
            expected_status_int=404)

        self.logout()

    def test_get_top_unresolved_answers(self):
        self.login(self.OWNER_EMAIL)

        answers = stats_services.get_top_state_unresolved_answers(
            self.exp_id, self.exploration.init_state_name)

        response = self.get_json(
            '/createhandler/get_top_unresolved_answers/%s?state_name=%s'
            % (self.exp_id, self.exploration.init_state_name))

        self.assertEqual(response['unresolved_answers'], answers)

        self.logout()


class StateRulesStatsHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StateRulesStatsHandlerTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_get_with_invalid_exploration_id_raises_error(self):
        self.login(self.OWNER_EMAIL)

        self.get_json(
            '/createhandler/state_rules_stats/invalid_exp_id/state_name',
            expected_status_int=404)

        self.logout()

    def test_cannot_get_learner_answer_statistics_with_invalid_state_name(
            self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)

        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.save_new_valid_exploration(exp_id, owner_id)

        with logging_swap:
            self.get_json(
                '/createhandler/state_rules_stats/%s/invalid_state_name'
                % (exp_id), expected_status_int=404)

        self.assertEqual(
            observed_log_messages,
            [
                'Could not find state: invalid_state_name',
                'Available states: [u\'Introduction\']'
            ]
        )

        self.logout()

    def test_get_learner_answer_statistics_for_state(self):
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exploration = self.save_new_valid_exploration(exp_id, owner_id)

        response = self.get_json(
            '/createhandler/state_rules_stats/%s/%s'
            % (exp_id, exploration.init_state_name))

        visualizations_info = stats_services.get_visualizations_info(
            exploration.id, 'Introduction',
            exploration.states[exploration.init_state_name].interaction.id)

        self.assertEqual(
            response['visualizations_info'], visualizations_info)

        exploration.add_states(['new_state_name'])

        exploration.update_init_state_name('new_state_name')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        response = self.get_json(
            '/createhandler/state_rules_stats/%s/%s'
            % (exp_id, exploration.init_state_name))

        visualizations_info = stats_services.get_visualizations_info(
            exploration.id, 'new_state_name',
            exploration.states[exploration.init_state_name].interaction.id)

        self.assertEqual(
            response['visualizations_info'], visualizations_info)

        self.logout()


class ExplorationDeletionRightsTests(BaseEditorControllerTests):

    def test_deletion_rights_for_unpublished_exploration(self):
        """Test rights management for deletion of unpublished explorations."""
        unpublished_exp_id = 'unpublished_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            unpublished_exp_id)
        exp_services.save_new_exploration(self.owner_id, exploration)

        rights_manager.assign_role_for_exploration(
            self.owner, unpublished_exp_id, self.editor_id,
            rights_manager.ROLE_EDITOR)

        rights_manager.assign_role_for_exploration(
            self.owner, unpublished_exp_id, self.voice_artist_id,
            rights_manager.ROLE_VOICE_ARTIST)

        self.login(self.EDITOR_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % unpublished_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % unpublished_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.VOICE_ARTIST_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % unpublished_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.OWNER_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % unpublished_exp_id,
            expected_status_int=200)
        self.logout()

    def test_deletion_rights_for_published_exploration(self):
        """Test rights management for deletion of published explorations."""
        published_exp_id = 'published_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            published_exp_id, title='A title', category='A category')
        exp_services.save_new_exploration(self.owner_id, exploration)

        rights_manager.assign_role_for_exploration(
            self.owner, published_exp_id, self.editor_id,
            rights_manager.ROLE_EDITOR)
        rights_manager.assign_role_for_exploration(
            self.owner, published_exp_id, self.voice_artist_id,
            rights_manager.ROLE_VOICE_ARTIST)
        rights_manager.publish_exploration(self.owner, published_exp_id)

        self.login(self.EDITOR_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % published_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % published_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.VOICE_ARTIST_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % published_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.OWNER_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % published_exp_id,
            expected_status_int=401)
        self.logout()

        self.login(self.ADMIN_EMAIL)
        self.delete_json(
            '/createhandler/data/%s' % published_exp_id,
            expected_status_int=200)
        self.logout()

    def test_logging_info_after_deletion(self):
        """Test correctness of logged statements while deleting exploration."""
        observed_log_messages = []

        def mock_logging_function(msg, *_):
            # Message logged by function clear_all_pending() in
            # oppia_tools/google_appengine_1.9.67/google_appengine/google/
            # appengine/ext/ndb/tasklets.py, not to be checked here.
            log_from_google_app_engine = 'all_pending: clear %s'

            if msg != log_from_google_app_engine:
                observed_log_messages.append(msg)

        with self.swap(logging, 'info', mock_logging_function), self.swap(
            logging, 'debug', mock_logging_function):
            # Checking for non-moderator/non-admin.
            exp_id = 'unpublished_eid'
            exploration = exp_domain.Exploration.create_default_exploration(
                exp_id)
            exp_services.save_new_exploration(self.owner_id, exploration)

            self.login(self.OWNER_EMAIL)
            self.delete_json(
                '/createhandler/data/%s' % exp_id)

            # Observed_log_messages[1] is 'Attempting to delete documents
            # from index %s, ids: %s' % (index.name, ', '.join(doc_ids)). It
            # is logged by function delete_documents_from_index in
            # oppia/core/platform/search/gae_search_services.py,
            # not to be checked here (same for admin and moderator).
            self.assertEqual(len(observed_log_messages), 3)
            self.assertEqual(
                observed_log_messages[0],
                '(%s) %s tried to delete exploration %s' %
                (feconf.ROLE_ID_EXPLORATION_EDITOR, self.owner_id, exp_id))
            self.assertEqual(
                observed_log_messages[2],
                '(%s) %s deleted exploration %s' %
                (feconf.ROLE_ID_EXPLORATION_EDITOR, self.owner_id, exp_id))
            self.logout()

            # Checking for admin.
            observed_log_messages = []
            exp_id = 'unpublished_eid2'
            exploration = exp_domain.Exploration.create_default_exploration(
                exp_id)
            exp_services.save_new_exploration(self.admin_id, exploration)

            self.login(self.ADMIN_EMAIL)
            self.delete_json('/createhandler/data/%s' % exp_id)
            self.assertEqual(len(observed_log_messages), 3)
            self.assertEqual(
                observed_log_messages[0],
                '(%s) %s tried to delete exploration %s' %
                (feconf.ROLE_ID_ADMIN, self.admin_id, exp_id))
            self.assertEqual(
                observed_log_messages[2],
                '(%s) %s deleted exploration %s' %
                (feconf.ROLE_ID_ADMIN, self.admin_id, exp_id))
            self.logout()

            # Checking for moderator.
            observed_log_messages = []
            exp_id = 'unpublished_eid3'
            exploration = exp_domain.Exploration.create_default_exploration(
                exp_id)
            exp_services.save_new_exploration(self.moderator_id, exploration)

            self.login(self.MODERATOR_EMAIL)
            self.delete_json('/createhandler/data/%s' % exp_id)
            self.assertEqual(len(observed_log_messages), 3)
            self.assertEqual(
                observed_log_messages[0],
                '(%s) %s tried to delete exploration %s' %
                (feconf.ROLE_ID_MODERATOR, self.moderator_id, exp_id))
            self.assertEqual(
                observed_log_messages[2],
                '(%s) %s deleted exploration %s' %
                (feconf.ROLE_ID_MODERATOR, self.moderator_id, exp_id))
            self.logout()


class VersioningIntegrationTest(BaseEditorControllerTests):
    """Test retrieval of and reverting to old exploration versions."""

    EXP_ID = '0'

    def setUp(self):
        """Create exploration with two versions."""
        super(VersioningIntegrationTest, self).setUp()

        exp_services.load_demo(self.EXP_ID)
        rights_manager.release_ownership_of_exploration(
            self.system_user, self.EXP_ID)

        self.login(self.EDITOR_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # In version 2, change the objective and the initial state content.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        exp_services.update_exploration(
            self.editor_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective',
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'state_name': exploration.init_state_name,
                'new_value': {
                    'content_id': 'content',
                    'html': '<p>ABC</p>'
                },
            })], 'Change objective and init state content')

    def test_get_with_disabled_exploration_id_raises_error(self):
        self.get_html_response(
            '%s/%s' % (
                feconf.EDITOR_URL_PREFIX, feconf.DISABLED_EXPLORATION_IDS[0]),
            expected_status_int=404)

    def test_reverting_to_old_exploration(self):
        """Test reverting to old exploration versions."""
        # Open editor page.
        csrf_token = self.get_new_csrf_token()

        # May not revert to any version that's not 1.
        for rev_version in (-1, 0, 2, 3, 4, '1', ()):
            response_dict = self.post_json(
                '/createhandler/revert/%s' % self.EXP_ID, {
                    'current_version': 2,
                    'revert_to_version': rev_version
                }, csrf_token=csrf_token, expected_status_int=400)

            # Check error message.
            if not isinstance(rev_version, int):
                self.assertIn('Expected an integer', response_dict['error'])
            else:
                self.assertIn('Cannot revert to version',
                              response_dict['error'])

            # Check that exploration is really not reverted to old version.
            reader_dict = self.get_json(
                '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
            init_state_name = reader_dict['exploration']['init_state_name']
            init_state_data = (
                reader_dict['exploration']['states'][init_state_name])
            init_content = init_state_data['content']['html']
            self.assertIn('ABC', init_content)
            self.assertNotIn('Hi, welcome to Oppia!', init_content)

        # Revert to version 1.
        rev_version = 1
        response_dict = self.post_json(
            '/createhandler/revert/%s' % self.EXP_ID, {
                'current_version': 2,
                'revert_to_version': rev_version
            }, csrf_token=csrf_token)

        # Check that exploration is really reverted to version 1.
        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))

        init_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][init_state_name])
        init_content = init_state_data['content']['html']
        self.assertNotIn('ABC', init_content)
        self.assertIn('Hi, welcome to Oppia!', init_content)

    def test_versioning_for_default_exploration(self):
        """Test retrieval of old exploration versions."""
        # The latest version contains 'ABC'.
        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
        init_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][init_state_name])
        init_content = init_state_data['content']['html']
        self.assertIn('ABC', init_content)
        self.assertNotIn('Hi, welcome to Oppia!', init_content)

        # v1 contains 'Hi, welcome to Oppia!'.
        reader_dict = self.get_json(
            '%s/%s?v=1' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
        init_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][init_state_name])
        init_content = init_state_data['content']['html']
        self.assertIn('Hi, welcome to Oppia!', init_content)
        self.assertNotIn('ABC', init_content)

        # v2 contains 'ABC'.
        reader_dict = self.get_json(
            '%s/%s?v=2' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
        init_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][init_state_name])
        init_content = init_state_data['content']['html']
        self.assertIn('ABC', init_content)
        self.assertNotIn('Hi, welcome to Oppia!', init_content)

        # v3 does not exist.
        self.get_json(
            '%s/%s?v=3' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID),
            expected_status_int=404)

    def test_revert_with_invalid_current_version_raises_error(self):
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/createhandler/revert/%s' % self.EXP_ID, {
                'current_version': 'invalid_version',
                'revert_to_version': 1
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Expected an integer current version; received invalid_version.')


class ExplorationEditRightsTest(BaseEditorControllerTests):
    """Test the handling of edit rights for explorations."""

    def test_user_banning(self):
        """Test that banned users are banned."""

        exp_id = '0'
        exp_services.load_demo(exp_id)
        rights_manager.release_ownership_of_exploration(
            self.system_user, exp_id)

        # Sign-up new editors Joe and Sandra.
        self.signup('joe@example.com', 'joe')
        self.signup('sandra@example.com', 'sandra')

        # Joe logs in.
        self.login('joe@example.com')

        response = self.get_html_response(feconf.LIBRARY_INDEX_URL)
        response = self.get_html_response('/create/%s' % exp_id)
        self.assert_can_edit(response.body)

        # Ban joe.
        self.set_banned_users(['joe'])

        # Test that Joe is banned (He can still access the library page).
        response = self.get_html_response(feconf.LIBRARY_INDEX_URL)
        response = self.get_html_response('/create/%s' % exp_id)
        self.assert_cannot_edit(response.body)

        # Joe logs out.
        self.logout()

        # Sandra logs in and is unaffected.
        self.login('sandra@example.com')
        response = self.get_html_response('/create/%s' % exp_id)
        self.assert_can_edit(response.body)
        self.logout()


class ExplorationRightsIntegrationTest(BaseEditorControllerTests):
    """Test the handler for managing exploration editing rights."""

    COLLABORATOR_EMAIL = 'collaborator@example.com'
    COLLABORATOR_USERNAME = 'collab'
    COLLABORATOR2_EMAIL = 'collaborator2@example.com'
    COLLABORATOR2_USERNAME = 'collab2'
    COLLABORATOR3_EMAIL = 'collaborator3@example.com'
    COLLABORATOR3_USERNAME = 'collab3'
    RANDOM_USER_EMAIL = 'randomuser@example.com'
    RANDOM_USER_USERNAME = 'randomuser'

    def test_for_assign_role_for_exploration(self):
        """Test exploration rights handler for assign role for exploration."""
        # Create several users.
        self.signup(
            self.COLLABORATOR_EMAIL, username=self.COLLABORATOR_USERNAME)
        self.signup(
            self.COLLABORATOR2_EMAIL, username=self.COLLABORATOR2_USERNAME)
        self.signup(
            self.COLLABORATOR3_EMAIL, username=self.COLLABORATOR3_USERNAME)

        # Owner creates exploration.
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exploration.states['State A'].update_interaction_id('TextInput')
        exploration.states['State 2'].update_interaction_id('TextInput')
        exploration.states['State 3'].update_interaction_id('TextInput')

        csrf_token = self.get_new_csrf_token()

        # Owner adds rights for other users.
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.VIEWER_USERNAME,
                'new_member_role': rights_manager.ROLE_VIEWER
            }, csrf_token=csrf_token)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.VOICE_ARTIST_USERNAME,
                'new_member_role': rights_manager.ROLE_VOICE_ARTIST
            }, csrf_token=csrf_token)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR_USERNAME,
                'new_member_role': rights_manager.ROLE_EDITOR
            }, csrf_token=csrf_token)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR2_USERNAME,
                'new_member_role': rights_manager.ROLE_EDITOR
            }, csrf_token=csrf_token)

        self.logout()

        # Check that viewer can access editor page but cannot edit.
        self.login(self.VIEWER_EMAIL)
        response = self.get_html_response('/create/%s' % exp_id)
        self.assert_cannot_edit(response.body)
        self.assert_cannot_voiceover(response.body)
        self.logout()

        # Check that collaborator can access editor page and can edit.
        self.login(self.COLLABORATOR_EMAIL)
        response = self.get_html_response('/create/%s' % exp_id)
        self.assert_can_edit(response.body)
        self.assert_can_voiceover(response.body)
        csrf_token = self.get_new_csrf_token()

        # Check that collaborator can add a new state called 'State 4'.
        add_url = '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id)
        response_dict = self.put_json(
            add_url,
            {
                'version': exploration.version,
                'commit_message': 'Added State 4',
                'change_list': [{
                    'cmd': 'add_state',
                    'state_name': 'State 4'
                }, {
                    'cmd': 'edit_state_property',
                    'state_name': 'State 4',
                    'property_name': 'widget_id',
                    'new_value': 'TextInput',
                }]
            },
            csrf_token=csrf_token,
            expected_status_int=200
        )
        self.assertIn('State 4', response_dict['states'])

        # Check that collaborator cannot add new members.
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR3_USERNAME,
                'new_member_role': rights_manager.ROLE_EDITOR,
            }, csrf_token=csrf_token,
            expected_status_int=401)

        self.logout()

        # Check that collaborator2 can access editor page and can edit.
        self.login(self.COLLABORATOR2_EMAIL)
        response = self.get_html_response('/create/%s' % exp_id)
        self.assert_can_edit(response.body)
        csrf_token = self.get_new_csrf_token()

        # Check that collaborator2 can add a new state called 'State 5'.
        add_url = '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id)
        response_dict = self.put_json(
            add_url,
            {
                'version': exploration.version,
                'commit_message': 'Added State 5',
                'change_list': [{
                    'cmd': 'add_state',
                    'state_name': 'State 5'
                }, {
                    'cmd': 'edit_state_property',
                    'state_name': 'State 5',
                    'property_name': 'widget_id',
                    'new_value': 'TextInput',
                }]
            },
            csrf_token=csrf_token,
            expected_status_int=200
        )
        self.assertIn('State 5', response_dict['states'])

        # Check that collaborator2 cannot add new members.
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR3_USERNAME,
                'new_member_role': rights_manager.ROLE_EDITOR,
                }, csrf_token=csrf_token, expected_status_int=401)

        self.logout()

        # Check that voice artist can access editor page and can only voiceover.
        self.login(self.VOICE_ARTIST_EMAIL)
        response = self.get_html_response('/create/%s' % exp_id)
        self.assert_cannot_edit(response.body)
        self.assert_can_voiceover(response.body)
        csrf_token = self.get_new_csrf_token()

        # Check that voice artist cannot add new members.
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR3_USERNAME,
                'new_member_role': rights_manager.ROLE_EDITOR,
                }, csrf_token=csrf_token, expected_status_int=401)

        self.logout()

    def test_transfering_ownership_to_the_community(self):
        """Test exploration rights handler for transfering ownership to the
        community.
        """
        # Owner creates an exploration.
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='My Exploration',
            end_state_name='END')
        csrf_token = self.get_new_csrf_token()
        rights_manager.publish_exploration(self.owner, exp_id)

        # Owner transfers ownership to the community.
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'make_community_owned': True
            }, csrf_token=csrf_token)

        self.logout()

        # Create a random user.
        self.signup(
            self.RANDOM_USER_EMAIL, username=self.RANDOM_USER_USERNAME)

        # Check community_owned_status value.
        exp_summary = exp_fetchers.get_exploration_summary_by_id(exp_id)
        community_owned_status = exp_summary.community_owned
        self.assertTrue(community_owned_status)

        # Check that any random user can access editor page and can edit.
        self.login(self.RANDOM_USER_EMAIL)
        response = self.get_html_response('/create/%s' % exp_id)
        self.assert_can_edit(response.body)

        self.logout()

    def test_cannot_transfer_ownership_of_invalid_exp_to_the_community(self):
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'

        rights_manager.create_new_exploration_rights(exp_id, self.owner_id)
        model = exp_models.ExplorationModel(
            id=exp_id,
            category='category',
            title='title',
            language_code='invalid_language_code',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME
        )
        commit_cmd = exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_CREATE_NEW,
            'title': 'title',
            'category': 'category',
        })
        commit_cmds_dict = [commit_cmd.to_dict()]
        model.commit(self.owner_id, 'commit_message', commit_cmds_dict)

        # The exploration is now invalid due to invalid language code.
        # Therefore, the following PUT request will raise an exception after
        # creating a domain object from the exploration model and validating it.
        csrf_token = self.get_new_csrf_token()

        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        response = self.put_json(
            rights_url, {
                'version': 1,
                'make_community_owned': True
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid_language_code')

    def test_get_with_invalid_version_raises_error(self):
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id),
            params={'v': 'invalid_version'}, expected_status_int=404)
        self.logout()

    def test_put_with_invalid_new_member_raises_error(self):
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        csrf_token = self.get_new_csrf_token()
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        response = self.put_json(
            '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id),
            payload={
                'version': exploration.version,
                'new_member_username': 'invalid_new_member_username'},
            csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Sorry, we could not find the specified user.')

    def test_make_private_exploration_viewable(self):
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        csrf_token = self.get_new_csrf_token()
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration_rights = rights_manager.get_exploration_rights(exp_id)
        self.assertFalse(exploration_rights.viewable_if_private)
        self.put_json(
            '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id),
            payload={
                'version': exploration.version,
                'viewable_if_private': True}, csrf_token=csrf_token)
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        exploration_rights = rights_manager.get_exploration_rights(exp_id)
        self.assertTrue(exploration_rights.viewable_if_private)

    def test_put_with_no_specified_changes_raise_error(self):
        self.login(self.OWNER_EMAIL)
        exp_id = 'exp_id'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        csrf_token = self.get_new_csrf_token()
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        response = self.put_json(
            '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id),
            payload={'version': exploration.version}, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            response['error'], 'No change was made to this exploration.')


class UserExplorationEmailsIntegrationTest(BaseEditorControllerTests):
    """Test the handler for user email notification preferences."""

    def test_user_exploration_emails_handler(self):
        """Test user exploration emails handler."""

        # Owner creates exploration.
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, self.owner_id, title='Title for emails handler test!',
            category='Category')

        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        csrf_token = self.get_new_csrf_token()
        exp_email_preferences = (
            user_services.get_email_preferences_for_exploration(
                self.owner_id, exp_id))
        self.assertFalse(exp_email_preferences.mute_feedback_notifications)
        self.assertFalse(exp_email_preferences.mute_suggestion_notifications)

        # Owner changes email preferences.
        emails_url = '%s/%s' % (feconf.USER_EXPLORATION_EMAILS_PREFIX, exp_id)
        self.put_json(
            emails_url, {
                'version': exploration.version,
                'mute': True,
                'message_type': 'feedback'
            }, csrf_token=csrf_token)

        exp_email_preferences = (
            user_services.get_email_preferences_for_exploration(
                self.owner_id, exp_id))
        self.assertTrue(exp_email_preferences.mute_feedback_notifications)
        self.assertFalse(exp_email_preferences.mute_suggestion_notifications)

        self.put_json(
            emails_url, {
                'version': exploration.version,
                'mute': True,
                'message_type': 'suggestion'
            }, csrf_token=csrf_token)
        self.put_json(
            emails_url, {
                'version': exploration.version,
                'mute': False,
                'message_type': 'feedback'
            }, csrf_token=csrf_token)

        exp_email_preferences = (
            user_services.get_email_preferences_for_exploration(
                self.owner_id, exp_id))
        self.assertFalse(exp_email_preferences.mute_feedback_notifications)
        self.assertTrue(exp_email_preferences.mute_suggestion_notifications)

        self.logout()

    def test_put_with_invalid_message_type_raises_error(self):
        self.login(self.OWNER_EMAIL)
        exp_id = 'eid'
        self.save_new_valid_exploration(exp_id, self.owner_id)
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '%s/%s' % (feconf.USER_EXPLORATION_EMAILS_PREFIX, exp_id),
            payload={'message_type': 'invalid_message_type'},
            csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid message type.')

        self.logout()


class ModeratorEmailsTests(test_utils.GenericTestBase):
    """Integration test for post-moderator action emails."""

    EXP_ID = 'eid'

    def setUp(self):
        super(ModeratorEmailsTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.UserActionsInfo(self.editor_id)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

        # The editor publishes an exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, title='My Exploration',
            end_state_name='END')
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

        # Set the default email config.
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        config_services.set_property(
            self.admin_id, 'unpublish_exploration_email_html_body',
            'Default unpublishing email body')

    def test_error_cases_for_email_sending(self):
        with self.swap(
            feconf, 'REQUIRE_EMAIL_ON_MODERATOR_ACTION', True
            ), self.swap(
                feconf, 'CAN_SEND_EMAILS', False):
            # Log in as a moderator.
            self.login(self.MODERATOR_EMAIL)

            # Get csrf token.
            csrf_token = self.get_new_csrf_token()

            # Try to unpublish the exploration without an email body. This
            # should cause an error.
            response_dict = self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID, {
                    'email_body': None,
                    'version': 1,
                }, csrf_token=csrf_token, expected_status_int=400)
            self.assertIn(
                'Moderator actions should include an email',
                response_dict['error'])

            response_dict = self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID, {
                    'email_body': '',
                    'version': 1,
                }, csrf_token=csrf_token, expected_status_int=400)
            self.assertIn(
                'Moderator actions should include an email',
                response_dict['error'])

            # Try to unpublish the exploration even if the relevant feconf
            # flags are not set. This should cause a system error.
            valid_payload = {
                'action': feconf.MODERATOR_ACTION_UNPUBLISH_EXPLORATION,
                'email_body': 'Your exploration is featured!',
                'version': 1,
            }
            self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID,
                valid_payload, csrf_token=csrf_token,
                expected_status_int=500)

            with self.swap(feconf, 'CAN_SEND_EMAILS', True):
                # Now the email gets sent with no error.
                self.put_json(
                    '/createhandler/moderatorrights/%s' % self.EXP_ID,
                    valid_payload, csrf_token=csrf_token)

            # Log out.
            self.logout()

    def test_email_is_sent_correctly_when_unpublishing(self):
        with self.swap(
            feconf, 'REQUIRE_EMAIL_ON_MODERATOR_ACTION', True
            ), self.swap(
                feconf, 'CAN_SEND_EMAILS', True):
            # Log in as a moderator.
            self.login(self.MODERATOR_EMAIL)

            # Go to the exploration editor page.
            csrf_token = self.get_new_csrf_token()

            new_email_body = 'Your exploration is unpublished :('

            valid_payload = {
                'action': feconf.MODERATOR_ACTION_UNPUBLISH_EXPLORATION,
                'email_body': new_email_body,
                'version': 1,
            }

            self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID,
                valid_payload, csrf_token=csrf_token)

            # Check that an email was sent with the correct content.
            messages = self.mail_stub.get_sent_messages(
                to=self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

            self.assertEqual(
                messages[0].sender,
                'Site Admin <%s>' % feconf.SYSTEM_EMAIL_ADDRESS)
            self.assertEqual(messages[0].to, self.EDITOR_EMAIL)
            self.assertFalse(hasattr(messages[0], 'cc'))
            self.assertEqual(messages[0].bcc, feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(
                messages[0].subject,
                'Your Oppia exploration "My Exploration" has been unpublished')
            self.assertEqual(messages[0].body.decode(), (
                'Hi %s,\n\n'
                '%s\n\n'
                'Thanks!\n'
                '%s (Oppia moderator)\n\n'
                'You can change your email preferences via the Preferences '
                'page.' % (
                    self.EDITOR_USERNAME,
                    new_email_body,
                    self.MODERATOR_USERNAME)))
            self.assertEqual(messages[0].html.decode(), (
                'Hi %s,<br><br>'
                '%s<br><br>'
                'Thanks!<br>'
                '%s (Oppia moderator)<br><br>'
                'You can change your email preferences via the '
                '<a href="https://www.example.com">Preferences</a> page.' % (
                    self.EDITOR_USERNAME,
                    new_email_body,
                    self.MODERATOR_USERNAME)))

            self.logout()

    def test_email_functionality_cannot_be_used_by_non_moderators(self):
        with self.swap(
            feconf, 'REQUIRE_EMAIL_ON_MODERATOR_ACTION', True
            ), self.swap(
                feconf, 'CAN_SEND_EMAILS', True):
            # Log in as a non-moderator.
            self.login(self.EDITOR_EMAIL)

            # Go to the exploration editor page.
            csrf_token = self.get_new_csrf_token()

            new_email_body = 'Your exploration is unpublished :('

            valid_payload = {
                'action': feconf.MODERATOR_ACTION_UNPUBLISH_EXPLORATION,
                'email_body': new_email_body,
                'version': 1,
            }

            # The user should receive an 'unauthorized user' error.
            self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID,
                valid_payload, csrf_token=csrf_token,
                expected_status_int=401)

            self.logout()


class FetchIssuesPlaythroughHandlerTests(test_utils.GenericTestBase):
    """Test the handling of request to fetch issues and playthroughs."""

    EXP_ID = 'exp_id1'

    def setUp(self):
        super(FetchIssuesPlaythroughHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.UserActionsInfo(self.editor_id)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

        # The editor publishes an exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, title='My Exploration',
            end_state_name='END')
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

        self.playthrough_id1 = stats_models.PlaythroughModel.create(
            self.EXP_ID, 1, 'EarlyQuit',
            {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }])
        self.playthrough_id2 = stats_models.PlaythroughModel.create(
            self.EXP_ID, 1, 'MultipleIncorrectSubmissions',
            {
                'state_name': {
                    'value': 'state_name1'
                },
                'num_times_answered_incorrectly': {
                    'value': 7
                }
            },
            [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }])
        stats_models.ExplorationIssuesModel.create(
            self.EXP_ID, 1,
            [{
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': [self.playthrough_id1],
                'schema_version': 1,
                'is_valid': True
            }, {
                'issue_type': 'MultipleIncorrectSubmissions',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'num_times_answered_incorrectly': {
                        'value': 7
                    }
                },
                'playthrough_ids': [self.playthrough_id2],
                'schema_version': 1,
                'is_valid': True
            }]
        )

    def test_cannot_fetch_issues_with_invalid_version(self):
        self.get_json(
            '/issuesdatahandler/%s' % self.EXP_ID,
            params={'exp_version': 2}, expected_status_int=404)

    def test_cannot_fetch_playthrough_with_invalid_playthrough_id(self):
        self.get_json(
            '/playthroughdatahandler/%s/%s' % (
                self.EXP_ID, 'invalid_playthrough_id'), expected_status_int=404)

    def test_fetch_issues_handler_with_disabled_exp_id(self):
        self.get_json('/issuesdatahandler/5', expected_status_int=404)

    def test_fetch_issues_handler(self):
        """Test that all issues get fetched correctly."""
        response = self.get_json(
            '/issuesdatahandler/%s' % self.EXP_ID,
            params={'exp_version': 1})
        self.assertEqual(len(response), 2)
        self.assertEqual(response[0]['issue_type'], 'EarlyQuit')
        self.assertEqual(
            response[1]['issue_type'], 'MultipleIncorrectSubmissions')

    def test_invalid_issues_are_not_retrieved(self):
        """Test that invalid issues are not retrieved."""
        exp_issues_model = stats_models.ExplorationIssuesModel.get_model(
            self.EXP_ID, 1)
        exp_issues_model.unresolved_issues[1]['is_valid'] = False
        exp_issues_model.put()

        response = self.get_json(
            '/issuesdatahandler/%s' % self.EXP_ID,
            params={'exp_version': 1})
        self.assertEqual(len(response), 1)
        self.assertEqual(response[0]['issue_type'], 'EarlyQuit')

    def test_fetch_playthrough_handler(self):
        """Test that the playthrough gets fetched correctly."""
        response = self.get_json(
            '/playthroughdatahandler/%s/%s' % (
                self.EXP_ID, self.playthrough_id1))
        self.assertEqual(response['exp_id'], self.EXP_ID)
        self.assertEqual(response['exp_version'], 1)
        self.assertEqual(response['issue_type'], 'EarlyQuit')
        self.assertEqual(
            response['issue_customization_args'], {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            })
        self.assertEqual(
            response['actions'], [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }])


class ResolveIssueHandlerTests(test_utils.GenericTestBase):
    """Test the handler for resolving issues."""

    EXP_ID = 'exp_id1'

    def setUp(self):
        super(ResolveIssueHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.UserActionsInfo(self.editor_id)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

        # The editor publishes an exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, title='My Exploration',
            end_state_name='END')
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

        self.playthrough_id1 = stats_models.PlaythroughModel.create(
            self.EXP_ID, 1, 'EarlyQuit',
            {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }])
        self.playthrough_id2 = stats_models.PlaythroughModel.create(
            self.EXP_ID, 1, 'EarlyQuit',
            {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name2'
                    }
                },
                'schema_version': 1
            }])

        stats_models.ExplorationIssuesModel.create(
            self.EXP_ID, 1,
            [{
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': [self.playthrough_id1, self.playthrough_id2],
                'schema_version': 1,
                'is_valid': True
            }]
        )

        self.exp_issue_dict = {
            'issue_type': 'EarlyQuit',
            'issue_customization_args': {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            'playthrough_ids': [self.playthrough_id1, self.playthrough_id2],
            'schema_version': 1,
            'is_valid': True
        }


    def test_resolve_issue_handler(self):
        """Test that resolving an issue deletes associated playthroughs."""
        with self.login_context(self.MODERATOR_EMAIL):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/resolveissuehandler/%s' % (self.EXP_ID),
                {
                    'exp_issue_dict': self.exp_issue_dict,
                    'exp_version': 1
                }, csrf_token=csrf_token)

        exp_issues = stats_services.get_exp_issues(self.EXP_ID, 1)
        self.assertEqual(exp_issues.unresolved_issues, [])

        playthrough_instances = stats_models.PlaythroughModel.get_multi(
            [self.playthrough_id1, self.playthrough_id2])
        self.assertEqual(playthrough_instances, [None, None])

    def test_error_on_passing_invalid_exp_issue_dict(self):
        """Test that error is raised on passing invalid exploration issue
        dict.
        """
        del self.exp_issue_dict['issue_type']
        # Since we deleted the 'issue_type' key in the exploration issue dict,
        # the dict is invalid now and exception should be raised.

        with self.login_context(self.MODERATOR_EMAIL):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/resolveissuehandler/%s' % (self.EXP_ID),
                {
                    'exp_issue_dict': self.exp_issue_dict,
                    'exp_version': 1
                }, csrf_token=csrf_token,
                expected_status_int=404)

    def test_error_on_passing_non_matching_exp_issue_dict(self):
        """Test that error is raised on passing an exploration issue dict that
        doesn't match an issue in the exploration issues model.
        """
        self.exp_issue_dict['issue_customization_args']['state_name'][
            'value'] = 'state_name2'

        with self.login_context(self.MODERATOR_EMAIL):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/resolveissuehandler/%s' % (self.EXP_ID),
                {
                    'exp_issue_dict': self.exp_issue_dict,
                    'exp_version': 1
                }, csrf_token=csrf_token,
                expected_status_int=404)

    def test_error_on_passing_invalid_exploration_version(self):

        with self.login_context(self.MODERATOR_EMAIL):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/resolveissuehandler/%s' % (self.EXP_ID),
                {
                    'exp_issue_dict': self.exp_issue_dict,
                    'exp_version': 2
                }, csrf_token=csrf_token, expected_status_int=404)


class EditorAutosaveTest(BaseEditorControllerTests):
    """Test the handling of editor autosave actions."""

    EXP_ID1 = '1'
    EXP_ID2 = '2'
    EXP_ID3 = '3'
    # 30 days into the future.
    NEWER_DATETIME = datetime.datetime.utcnow() + datetime.timedelta(30)
    # A date in the past.
    OLDER_DATETIME = datetime.datetime.strptime('2015-03-16', '%Y-%m-%d')
    DRAFT_CHANGELIST = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'old_value': None,
        'new_value': 'Updated title'}]
    NEW_CHANGELIST = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'old_value': None,
        'new_value': 'New title'}]
    INVALID_CHANGELIST = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'new_value': 1}]

    def _create_explorations_for_tests(self):
        """Creates the mock explorations for testing."""
        self.save_new_valid_exploration(self.EXP_ID1, self.owner_id)
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID1)
        exploration.add_states(['State A'])
        exploration.states['State A'].update_interaction_id('TextInput')
        self.save_new_valid_exploration(self.EXP_ID2, self.owner_id)
        self.save_new_valid_exploration(self.EXP_ID3, self.owner_id)

    def _create_exp_user_data_model_objects_for_tests(self):
        """Creates the ExplorationUserDataModel objects for testing."""
        # Explorations with draft set.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.owner_id, self.EXP_ID1), user_id=self.owner_id,
            exploration_id=self.EXP_ID1,
            draft_change_list=self.DRAFT_CHANGELIST,
            draft_change_list_last_updated=self.NEWER_DATETIME,
            draft_change_list_exp_version=1,
            draft_change_list_id=1).put()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.owner_id, self.EXP_ID2), user_id=self.owner_id,
            exploration_id=self.EXP_ID2,
            draft_change_list=self.DRAFT_CHANGELIST,
            draft_change_list_last_updated=self.OLDER_DATETIME,
            draft_change_list_exp_version=1,
            draft_change_list_id=1).put()

        # Exploration with no draft.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.owner_id, self.EXP_ID3), user_id=self.owner_id,
            exploration_id=self.EXP_ID3).put()

    def setUp(self):
        super(EditorAutosaveTest, self).setUp()
        self.login(self.OWNER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self._create_explorations_for_tests()
        self._create_exp_user_data_model_objects_for_tests()

        # Generate CSRF token.
        self.csrf_token = self.get_new_csrf_token()

    def test_exploration_loaded_with_draft_applied(self):
        response = self.get_json(
            '/createhandler/data/%s' % self.EXP_ID2,
            params={'apply_draft': True})
        # Title updated because change list was applied.
        self.assertEqual(response['title'], 'Updated title')
        self.assertTrue(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 1)
        # Draft changes passed to UI.
        self.assertEqual(response['draft_changes'], self.DRAFT_CHANGELIST)

    def test_exploration_loaded_without_draft_when_draft_version_invalid(self):
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        exp_user_data.draft_change_list_exp_version = 20
        exp_user_data.put()
        response = self.get_json(
            '/createhandler/data/%s' % self.EXP_ID2,
            params={'apply_draft': True})
        # Title not updated because change list not applied.
        self.assertEqual(response['title'], 'A title')
        self.assertFalse(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 1)
        # Draft changes passed to UI even when version is invalid.
        self.assertEqual(response['draft_changes'], self.DRAFT_CHANGELIST)

    def test_exploration_loaded_without_draft_as_draft_does_not_exist(self):
        response = self.get_json(
            '/createhandler/data/%s' % self.EXP_ID3,
            params={'apply_draft': True})
        # Title not updated because change list not applied.
        self.assertEqual(response['title'], 'A title')
        self.assertIsNone(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 0)
        # Draft changes None.
        self.assertIsNone(response['draft_changes'])

    def test_draft_not_updated_because_newer_draft_exists(self):
        payload = {
            'change_list': self.NEW_CHANGELIST,
            'version': 1,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID1, payload,
            csrf_token=self.csrf_token)
        # Check that draft change list hasn't been updated.
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID1))
        self.assertEqual(
            exp_user_data.draft_change_list, self.DRAFT_CHANGELIST)
        self.assertTrue(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 1)

    def test_draft_not_updated_validation_error(self):
        self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, {
                'change_list': self.DRAFT_CHANGELIST,
                'version': 1,
            }, csrf_token=self.csrf_token)
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, {
                'change_list': self.INVALID_CHANGELIST,
                'version': 2,
            }, csrf_token=self.csrf_token,
            expected_status_int=400)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertEqual(
            exp_user_data.draft_change_list, self.DRAFT_CHANGELIST)
        # ID is incremented the first time but not the second.
        self.assertEqual(exp_user_data.draft_change_list_id, 2)
        self.assertEqual(
            response, {'status_code': 400,
                       'error': 'Expected title to be a string, received 1'})

    def test_draft_updated_version_valid(self):
        payload = {
            'change_list': self.NEW_CHANGELIST,
            'version': 1,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, payload,
            csrf_token=self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertEqual(exp_user_data.draft_change_list, self.NEW_CHANGELIST)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 1)
        self.assertTrue(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 2)

    def test_draft_updated_version_invalid(self):
        payload = {
            'change_list': self.NEW_CHANGELIST,
            'version': 10,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, payload,
            csrf_token=self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertEqual(exp_user_data.draft_change_list, self.NEW_CHANGELIST)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 10)
        self.assertFalse(response['is_version_of_draft_valid'])
        self.assertEqual(response['draft_change_list_id'], 2)

    def test_discard_draft(self):
        self.post_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, {},
            csrf_token=self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertIsNone(exp_user_data.draft_change_list)
        self.assertIsNone(exp_user_data.draft_change_list_last_updated)
        self.assertIsNone(exp_user_data.draft_change_list_exp_version)


class HasSeenTutorialTests(BaseEditorControllerTests):

    def test_get_user_has_seen_editor_tutorial(self):
        self.login(self.OWNER_EMAIL)

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(exp_id, self.owner_id)

        response = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertTrue(response['show_state_editor_tutorial_on_load'])

        user_services.record_user_started_state_editor_tutorial(
            self.owner_id)

        response = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertFalse(response['show_state_editor_tutorial_on_load'])

        self.logout()

    def test_get_user_has_seen_translation_tutorial(self):
        self.login(self.OWNER_EMAIL)

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(exp_id, self.owner_id)

        response = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertTrue(response['show_state_translation_tutorial_on_load'])

        user_services.record_user_started_state_translation_tutorial(
            self.owner_id)

        response = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, exp_id))
        self.assertFalse(response['show_state_translation_tutorial_on_load'])

        self.logout()


class StateAnswerStatisticsHandlerTests(BaseEditorControllerTests):

    def test_get_invalid_exploration_id(self):
        with self.login_context(self.OWNER_EMAIL):
            illegal_id = '@#$%^&*'
            self.get_json(
                '%s/%s' % (
                    feconf.EXPLORATION_STATE_ANSWER_STATS_PREFIX, illegal_id),
                expected_status_int=404)

    def test_get_missing_exploration_id(self):
        with self.login_context(self.OWNER_EMAIL):
            missing_id = '0'
            self.get_json(
                '%s/%s' % (
                    feconf.EXPLORATION_STATE_ANSWER_STATS_PREFIX, missing_id),
                expected_status_int=404)

    def test_get_returns_empty_values_from_unvisited_exploration(self):
        with self.login_context(self.OWNER_EMAIL) as owner_id:
            exp_id = exp_fetchers.get_new_exploration_id()
            self.save_new_valid_exploration(exp_id, owner_id)

            state_stats = self.get_json(
                '%s/%s' % (
                    feconf.EXPLORATION_STATE_ANSWER_STATS_PREFIX, exp_id))

        self.assertEqual(state_stats['answers'], {'Introduction': []})

    def test_get_returns_assigned_interaction_ids_of_exploration_states(self):
        with self.login_context(self.OWNER_EMAIL) as owner_id:
            exp_id = exp_fetchers.get_new_exploration_id()
            self.save_new_linear_exp_with_state_names_and_interactions(
                exp_id, owner_id,
                ['A', 'B', 'End'], ['FractionInput', 'TextInput'])

            state_stats = self.get_json(
                '%s/%s' % (
                    feconf.EXPLORATION_STATE_ANSWER_STATS_PREFIX, exp_id))

        self.assertEqual(
            state_stats['interaction_ids'],
            {'A': 'FractionInput', 'B': 'TextInput', 'End': 'EndExploration'})

    def test_get_returns_recorded_answers_from_exploration(self):
        with self.login_context(self.OWNER_EMAIL) as owner_id:
            exp_id = exp_fetchers.get_new_exploration_id()
            exp = self.save_new_valid_exploration(exp_id, owner_id)

        def mock_get_top_state_answer_stats(exploration_id, state_name):
            """Returns a fake list of top answers for a particular state.

            Args:
                exploration_id: str. The exploration ID.
                state_name: str. The name of the state to fetch answers for.

            Returns:
                list(dict(str: *)). A list of the top 10 answers, sorted by
                decreasing frequency.
            """
            if (exploration_id, state_name) == (exp_id, exp.init_state_name):
                return [
                    {'answer': 'C', 'frequency': 12},
                    {'answer': 'B', 'frequency': 11},
                    {'answer': 'A', 'frequency': 10},
                ]

        swap_get_answers = self.swap(
            stats_services, 'get_top_state_answer_stats',
            mock_get_top_state_answer_stats)

        with self.login_context(self.OWNER_EMAIL), swap_get_answers:
            state_stats = self.get_json(
                '%s/%s' % (
                    feconf.EXPLORATION_STATE_ANSWER_STATS_PREFIX, exp_id))

        self.assertEqual(
            state_stats['answers'], {
                exp.init_state_name: [
                    {'answer': 'C', 'frequency': 12},
                    {'answer': 'B', 'frequency': 11},
                    {'answer': 'A', 'frequency': 10},
                ],
            })


class LearnerAnswerInfoHandlerTests(BaseEditorControllerTests):

    def setUp(self):
        super(LearnerAnswerInfoHandlerTests, self).setUp()
        self.login(self.OWNER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(self.exp_id, self.owner_id)

        self.entity_type = feconf.ENTITY_TYPE_EXPLORATION
        self.exploration = exp_fetchers.get_exploration_by_id(self.exp_id)

        self.state_name = self.exploration.init_state_name
        self.interaction_id = self.exploration.states[
            self.state_name].interaction.id
        self.answer = 'This is an answer'
        self.answer_details = 'These are the answer details'
        self.state_reference = (
            stats_services.get_state_reference_for_exploration(
                self.exp_id, self.state_name))
        stats_services.record_learner_answer_info(
            self.entity_type, self.state_reference, self.interaction_id,
            self.answer, self.answer_details)

    def test_get_learner_answer_details_of_exploration_states(self):
        response = self.get_json(
            '%s/%s/%s?state_name=%s' % (
                feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                feconf.ENTITY_TYPE_EXPLORATION, self.exp_id,
                self.state_name), expected_status_int=404)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', True):
            learner_answer_details = stats_services.get_learner_answer_details(
                self.entity_type, self.state_reference)
            learner_answer_info_dict_list = {'learner_answer_info_dict_list': [
                learner_answer_info.to_dict() for learner_answer_info in
                learner_answer_details.learner_answer_info_list]}
            response = self.get_json(
                '%s/%s/%s?state_name=%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id,
                    self.state_name))
            self.assertEqual(response, learner_answer_info_dict_list)
            state_name_1 = 'new'
            self.get_json(
                '%s/%s/%s?state_name=%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id,
                    state_name_1), expected_status_int=500)
            self.get_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id),
                expected_status_int=400)

    def test_get_learner_answer_details_of_question_states(self):
        question_id = question_services.get_new_question_id()
        question = self.save_new_question(
            question_id, self.owner_id,
            self._create_valid_question_data('ABC'), ['skill_1'])
        self.assertNotEqual(question, None)
        state_reference = (
            stats_services.get_state_reference_for_question(question_id))
        self.assertEqual(state_reference, question_id)
        stats_services.record_learner_answer_info(
            feconf.ENTITY_TYPE_QUESTION, state_reference, self.interaction_id,
            self.answer, self.answer_details)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', True):
            learner_answer_details = stats_services.get_learner_answer_details(
                feconf.ENTITY_TYPE_QUESTION, state_reference)
            learner_answer_info_dict_list = {'learner_answer_info_dict_list': [
                learner_answer_info.to_dict() for learner_answer_info in
                learner_answer_details.learner_answer_info_list]}
            response = self.get_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_QUESTION, question_id))
            self.assertEqual(response, learner_answer_info_dict_list)

    def test_delete_learner_answer_info_of_exploration_states(self):
        self.delete_json(
            '%s/%s/%s?state_name=%s&learner_answer_info_id=%s' % (
                feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                feconf.ENTITY_TYPE_EXPLORATION, self.exp_id, self.state_name,
                'learner_answer_info_id'), expected_status_int=404)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', True):
            learner_answer_details = stats_services.get_learner_answer_details(
                self.entity_type, self.state_reference)
            self.assertEqual(
                len(learner_answer_details.learner_answer_info_list), 1)
            learner_answer_info_id = (
                learner_answer_details.learner_answer_info_list[0].id)
            self.assertNotEqual(learner_answer_info_id, None)
            self.delete_json(
                '%s/%s/%s?state_name=%s&learner_answer_info_id=%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id,
                    self.state_name, learner_answer_info_id))
            learner_answer_details = stats_services.get_learner_answer_details(
                self.entity_type, self.state_reference)
            self.assertEqual(
                len(learner_answer_details.learner_answer_info_list), 0)
            self.delete_json(
                '%s/%s/%s?learner_answer_info_id=%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id,
                    learner_answer_info_id), expected_status_int=400)
            self.delete_json(
                '%s/%s/%s?state_name=%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_EXPLORATION, self.exp_id,
                    self.state_name), expected_status_int=404)

    def test_delete_learner_answer_info_of_question_states(self):
        question_id = question_services.get_new_question_id()
        question = self.save_new_question(
            question_id, self.owner_id,
            self._create_valid_question_data('ABC'), ['skill_1'])
        self.assertNotEqual(question, None)
        state_reference = (
            stats_services.get_state_reference_for_question(question_id))
        self.assertEqual(state_reference, question_id)
        stats_services.record_learner_answer_info(
            feconf.ENTITY_TYPE_QUESTION, state_reference, self.interaction_id,
            self.answer, self.answer_details)
        with self.swap(
            constants, 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE', True):
            learner_answer_details = stats_services.get_learner_answer_details(
                feconf.ENTITY_TYPE_QUESTION, state_reference)
            self.assertEqual(
                len(learner_answer_details.learner_answer_info_list), 1)
            learner_answer_info_id = (
                learner_answer_details.learner_answer_info_list[0].id)
            self.assertNotEqual(learner_answer_info_id, None)
            self.delete_json(
                '%s/%s/%s?learner_answer_info_id=%s' % (
                    feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
                    feconf.ENTITY_TYPE_QUESTION, question_id,
                    learner_answer_info_id))
            learner_answer_details = stats_services.get_learner_answer_details(
                feconf.ENTITY_TYPE_QUESTION, state_reference)
            self.assertEqual(
                len(learner_answer_details.learner_answer_info_list), 0)
