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
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import stats_jobs_continuous
from core.domain import stats_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(user_models, stats_models) = models.Registry.import_models(
    [models.NAMES.user, models.NAMES.statistics])


class BaseEditorControllerTests(test_utils.GenericTestBase):

    CAN_EDIT_STR = 'GLOBALS.can_edit = JSON.parse(\'true\');'
    CANNOT_EDIT_STR = 'GLOBALS.can_edit = JSON.parse(\'false\');'
    CAN_TRANSLATE_STR = 'GLOBALS.can_translate = JSON.parse(\'true\');'
    CANNOT_TRANSLATE_STR = 'GLOBALS.can_translate = JSON.parse(\'false\');'

    def setUp(self):
        """Completes the sign-up process for self.EDITOR_EMAIL."""
        super(BaseEditorControllerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.TRANSLATOR_EMAIL, self.TRANSLATOR_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.translator_id = self.get_user_id_from_email(self.TRANSLATOR_EMAIL)

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

    def assert_can_translate(self, response_body):
        """Returns True if the response body indicates that the exploration is
        translatable.
        """
        self.assertIn(self.CAN_TRANSLATE_STR, response_body)
        self.assertNotIn(self.CANNOT_TRANSLATE_STR, response_body)

    def assert_cannot_translate(self, response_body):
        """Returns True if the response body indicates that the exploration is
        not translatable.
        """
        self.assertIn(self.CANNOT_TRANSLATE_STR, response_body)
        self.assertNotIn(self.CAN_TRANSLATE_STR, response_body)


class MockInteractionAnswerSummariesAggregator(
        stats_jobs_continuous.InteractionAnswerSummariesAggregator):
    """A modified InteractionAnswerSummariesAggregator that does not start
    a new batch job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return MockInteractionAnswerSummariesMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class MockInteractionAnswerSummariesMRJobManager(
        stats_jobs_continuous.InteractionAnswerSummariesMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return MockInteractionAnswerSummariesAggregator


class EditorTests(BaseEditorControllerTests):

    ALL_CC_MANAGERS_FOR_TESTS = [MockInteractionAnswerSummariesAggregator]

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
        self.assertIn('Stats', response.body)
        self.assertIn('History', response.body)

        self.logout()

    def test_new_state_template(self):
        """Test the validity of the NEW_STATE_TEMPLATE."""

        exploration = exp_services.get_exploration_by_id('0')
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

        response = self.get_html_response(feconf.CREATOR_DASHBOARD_URL)
        csrf_token = self.get_csrf_token_from_response(response)
        exp_id = self.post_json(
            feconf.NEW_EXPLORATION_URL, {}, csrf_token=csrf_token
        )[creator_dashboard.EXPLORATION_ID_KEY]

        response = self.get_html_response('/create/%s' % exp_id)
        csrf_token = self.get_csrf_token_from_response(response)
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
        response = self.get_html_response('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

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


class ExplorationEditorLogoutTest(BaseEditorControllerTests):
    """Test handler for logout from exploration editor page."""

    def test_logout_from_invalid_url(self):
        """Logour from invalid url should redirect to library.
        To be caught by regex.
        """

        published_exp_id = '_published_exp_id-1200'
        exploration = exp_domain.Exploration.create_default_exploration(
            published_exp_id)
        exp_services.save_new_exploration(self.owner_id, exploration)
        rights_manager.publish_exploration(self.owner, published_exp_id)

        invalid_current_page = '/doesnotexit/%s' % published_exp_id
        invalid_logout_url = ('/exploration_editor_logout?return_url=%s' % (
            invalid_current_page))

        self.login(self.OWNER_EMAIL)
        response = self.get_html_response(
            invalid_logout_url, expected_status_int=302)
        self.assertEqual(response.status_int, 302)
        response.follow()
        self.assertEqual(response.status_int, 302)
        self.assertIn('library', response.headers['location'])
        self.logout()

    def test_logout_from_invalid_extra_url(self):
        """Logour from invalid url should redirect to library.
        To be caught by regex.
        """

        published_exp_id = '123-published_exp_id'
        exploration = exp_domain.Exploration.create_default_exploration(
            published_exp_id)
        exp_services.save_new_exploration(self.owner_id, exploration)
        rights_manager.publish_exploration(self.owner, published_exp_id)

        invalid_current_page = '%s/%s/extra' % (
            feconf.EDITOR_URL_PREFIX, published_exp_id)
        invalid_logout_url = ('/exploration_editor_logout?return_url=%s' % (
            invalid_current_page))

        self.login(self.OWNER_EMAIL)
        response = self.get_html_response(
            invalid_logout_url, expected_status_int=302)
        self.assertEqual(response.status_int, 302)
        response.follow()
        self.assertEqual(response.status_int, 302)
        self.assertIn('library', response.headers['location'])
        self.logout()

    def test_logout_from_invalid_regex_exp_id(self):
        """Logour from invalid url should redirect to library.
        To be caught by regex.
        """

        invalid_regex_exp_id = '1?23-inv@alid_ex#p_id'
        exploration = exp_domain.Exploration.create_default_exploration(
            invalid_regex_exp_id)
        exp_services.save_new_exploration(self.owner_id, exploration)
        rights_manager.publish_exploration(self.owner, invalid_regex_exp_id)

        invalid_current_page = '%s/%s' % (
            feconf.EDITOR_URL_PREFIX, invalid_regex_exp_id)
        invalid_logout_url = ('/exploration_editor_logout?return_url=%s' % (
            invalid_current_page))

        self.login(self.OWNER_EMAIL)
        response = self.get_html_response(
            invalid_logout_url, expected_status_int=302)
        self.assertEqual(response.status_int, 302)
        response.follow()
        self.assertEqual(response.status_int, 302)
        self.assertIn('library', response.headers['location'])
        self.logout()

    def test_logout_from_empty_url(self):
        """Logout from empty exploration id should redirect
        to library page.
        """
        empty_redirect_logout_url = '/exploration_editor_logout?return_url='

        self.login(self.OWNER_EMAIL)
        response = self.get_html_response(
            empty_redirect_logout_url, expected_status_int=302)
        self.assertEqual(response.status_int, 302)

        response.follow()
        self.assertEqual(response.status_int, 302)
        self.assertIn('library', response.headers['location'])
        self.logout()

    def test_logout_from_invalid_exploration_id(self):
        """Logout from invalid exploration id should redirect
        to library page.
        """

        invalid_current_page = '%s/%s' % (
            feconf.EDITOR_URL_PREFIX, 'invalid_eid')
        invalid_logout_url = (
            '/exploration_editor_logout?return_url=%s' % invalid_current_page)

        self.login(self.OWNER_EMAIL)
        response = self.get_html_response(
            invalid_logout_url, expected_status_int=302)
        self.assertEqual(response.status_int, 302)
        response.follow()
        self.assertEqual(response.status_int, 302)
        self.assertIn('library', response.headers['location'])
        self.logout()

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

        response = self.get_html_response(
            '/exploration_editor_logout?return_url=%s' % current_page_url,
            expected_status_int=302)
        self.assertEqual(response.status_int, 302)
        response = response.follow()
        self.assertEqual(response.status_int, 302)
        self.assertIn('library', response.headers['location'])
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

        response = self.get_html_response(
            '/exploration_editor_logout?return_url=%s' % current_page_url,
            expected_status_int=302)
        self.assertEqual(response.status_int, 302)
        response = response.follow()
        self.assertEqual(response.status_int, 302)
        self.assertIn(current_page_url, response.headers['location'])
        self.logout()


class DownloadIntegrationTest(BaseEditorControllerTests):
    """Test handler for exploration and state download."""

    SAMPLE_JSON_CONTENT = {
        'State A': ("""classifier_model_id: null
content:
  content_id: content
  html: ''
content_ids_to_audio_translations:
  content: {}
  default_outcome: {}
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
written_translations:
  translations_mapping:
    content: {}
    default_outcome: {}
"""),
        'State B': ("""classifier_model_id: null
content:
  content_id: content
  html: ''
content_ids_to_audio_translations:
  content: {}
  default_outcome: {}
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
written_translations:
  translations_mapping:
    content: {}
    default_outcome: {}
"""),
        feconf.DEFAULT_INIT_STATE_NAME: ("""classifier_model_id: null
content:
  content_id: content
  html: ''
content_ids_to_audio_translations:
  content: {}
  default_outcome: {}
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
content_ids_to_audio_translations:
  content: {}
  default_outcome: {}
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
written_translations:
  translations_mapping:
    content: {}
    default_outcome: {}
""")

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

        exploration = exp_services.get_exploration_by_id(exp_id)
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
        exploration = exp_services.get_exploration_by_id(exp_id)
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

        exploration = exp_services.get_exploration_by_id(exp_id)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exploration.states['State A'].update_interaction_id('TextInput')

        response = self.get_html_response(
            '%s/%s' % (feconf.EDITOR_URL_PREFIX, exp_id))
        csrf_token = self.get_csrf_token_from_response(response)
        response = self.post_json('/createhandler/state_yaml/%s' % exp_id, {
            'state_dict': exploration.states['State A'].to_dict(),
            'width': 50,
        }, csrf_token=csrf_token)
        self.assertEqual({
            'yaml': self.SAMPLE_STATE_STRING
        }, response)

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
            self.owner, unpublished_exp_id, self.translator_id,
            rights_manager.ROLE_TRANSLATOR)

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

        self.login(self.TRANSLATOR_EMAIL)
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
            self.owner, published_exp_id, self.translator_id,
            rights_manager.ROLE_TRANSLATOR)
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

        self.login(self.TRANSLATOR_EMAIL)
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
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
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
                    'html': 'ABC'
                },
            })], 'Change objective and init state content')

    def test_reverting_to_old_exploration(self):
        """Test reverting to old exploration versions."""
        # Open editor page.
        response = self.get_html_response(
            '%s/%s' % (feconf.EDITOR_URL_PREFIX, self.EXP_ID))
        csrf_token = self.get_csrf_token_from_response(response)

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

        exploration = exp_services.get_exploration_by_id(exp_id)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exploration.states['State A'].update_interaction_id('TextInput')
        exploration.states['State 2'].update_interaction_id('TextInput')
        exploration.states['State 3'].update_interaction_id('TextInput')

        response = self.get_html_response(
            '%s/%s' % (feconf.EDITOR_URL_PREFIX, exp_id))
        csrf_token = self.get_csrf_token_from_response(response)

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
                'new_member_username': self.TRANSLATOR_USERNAME,
                'new_member_role': rights_manager.ROLE_TRANSLATOR
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
        self.assert_cannot_translate(response.body)
        self.logout()

        # Check that collaborator can access editor page and can edit.
        self.login(self.COLLABORATOR_EMAIL)
        response = self.get_html_response('/create/%s' % exp_id)
        self.assert_can_edit(response.body)
        self.assert_can_translate(response.body)
        csrf_token = self.get_csrf_token_from_response(response)

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
        exploration = exp_services.get_exploration_by_id(exp_id)
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
        csrf_token = self.get_csrf_token_from_response(response)

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
        exploration = exp_services.get_exploration_by_id(exp_id)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR3_USERNAME,
                'new_member_role': rights_manager.ROLE_EDITOR,
                }, csrf_token=csrf_token, expected_status_int=401)

        self.logout()

        # Check that translator can access editor page and can only translate.
        self.login(self.TRANSLATOR_EMAIL)
        response = self.get_html_response('/create/%s' % exp_id)
        self.assert_cannot_edit(response.body)
        self.assert_can_translate(response.body)
        csrf_token = self.get_csrf_token_from_response(response)

        # Check that translator cannot add new members.
        exploration = exp_services.get_exploration_by_id(exp_id)
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
        response = self.get_html_response('/create/%s' % exp_id)
        csrf_token = self.get_csrf_token_from_response(response)
        rights_manager.publish_exploration(self.owner, exp_id)

        # Owner transfers ownership to the community.
        exploration = exp_services.get_exploration_by_id(exp_id)
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
        exp_summary = exp_services.get_exploration_summary_by_id(exp_id)
        community_owned_status = exp_summary.community_owned
        self.assertTrue(community_owned_status)

        # Check that any random user can access editor page and can edit.
        self.login(self.RANDOM_USER_EMAIL)
        response = self.get_html_response('/create/%s' % exp_id)
        self.assert_can_edit(response.body)

        self.logout()


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

        exploration = exp_services.get_exploration_by_id(exp_id)

        response = self.get_html_response(
            '%s/%s' % (feconf.EDITOR_URL_PREFIX, exp_id))
        csrf_token = self.get_csrf_token_from_response(response)

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

            # Go to the exploration editor page.
            response = self.get_html_response('/create/%s' % self.EXP_ID)
            csrf_token = self.get_csrf_token_from_response(response)

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
            response = self.get_html_response('/create/%s' % self.EXP_ID)
            csrf_token = self.get_csrf_token_from_response(response)

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
            response = self.get_html_response('/create/%s' % self.EXP_ID)
            csrf_token = self.get_csrf_token_from_response(response)

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

    def test_fetch_issues_handler(self):
        """Test that all issues get fetched correctly."""
        response = self.get_json(
            '/issuesdatahandler/%s' % (self.EXP_ID),
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
            '/issuesdatahandler/%s' % (self.EXP_ID),
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

        response = self.get_html_response('/create/%s' % self.EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)

    def test_resolve_issue_handler(self):
        """Test that resolving an issue deletes associated playthroughs."""
        self.post_json(
            '/resolveissuehandler/%s' % (self.EXP_ID),
            {
                'exp_issue_dict': self.exp_issue_dict,
                'exp_version': 1
            }, csrf_token=self.csrf_token)

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
        self.post_json(
            '/resolveissuehandler/%s' % (self.EXP_ID),
            {
                'exp_issue_dict': self.exp_issue_dict,
                'exp_version': 1
            }, csrf_token=self.csrf_token,
            expected_status_int=404)

    def test_error_on_passing_non_matching_exp_issue_dict(self):
        """Test that error is raised on passing an exploration issue dict that
        doesn't match an issue in the exploration issues model.
        """
        self.exp_issue_dict['issue_customization_args']['state_name'][
            'value'] = 'state_name2'
        self.post_json(
            '/resolveissuehandler/%s' % (self.EXP_ID),
            {
                'exp_issue_dict': self.exp_issue_dict,
                'exp_version': 1
            }, csrf_token=self.csrf_token,
            expected_status_int=404)


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
        exploration = exp_services.get_exploration_by_id(self.EXP_ID1)
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
        response = self.get_html_response('/create/%s' % self.EXP_ID1)
        self.csrf_token = self.get_csrf_token_from_response(response)

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
