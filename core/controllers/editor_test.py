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

__author__ = 'Sean Lip'

import os
import StringIO
import zipfile

from core.controllers import editor
from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import rights_manager
from core.domain import rule_domain
from core.tests import test_utils
import feconf


class BaseEditorControllerTest(test_utils.GenericTestBase):

    CAN_EDIT_STR = 'GLOBALS.can_edit = JSON.parse(\'true\');'
    CANNOT_EDIT_STR = 'GLOBALS.can_edit = JSON.parse(\'false\');'

    def setUp(self):
        """Completes the sign-up process for self.EDITOR_EMAIL."""
        super(BaseEditorControllerTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.set_admins([self.ADMIN_EMAIL])

    def assert_can_edit(self, response_body):
        """Returns True if the response body indicates that the exploration is
        editable."""
        self.assertIn(self.CAN_EDIT_STR, response_body)
        self.assertNotIn(self.CANNOT_EDIT_STR, response_body)

    def assert_cannot_edit(self, response_body):
        """Returns True if the response body indicates that the exploration is
        not editable."""
        self.assertIn(self.CANNOT_EDIT_STR, response_body)
        self.assertNotIn(self.CAN_EDIT_STR, response_body)


class EditorTest(BaseEditorControllerTest):

    def setUp(self):
        super(EditorTest, self).setUp()
        exp_services.load_demo('0')
        rights_manager.release_ownership_of_exploration(
            feconf.SYSTEM_COMMITTER_ID, '0')

    def test_editor_page(self):
        """Test access to editor pages for the sample exploration."""

        # Check that non-editors can access, but not edit, the editor page.
        response = self.testapp.get('/create/0')
        self.assertEqual(response.status_int, 200)
        self.assertIn('Welcome to Oppia!', response.body)
        self.assert_cannot_edit(response.body)

        # Log in as an editor.
        self.login(self.EDITOR_EMAIL)

        # Check that it is now possible to access and edit the editor page.
        response = self.testapp.get('/create/0')
        self.assertIn('Welcome to Oppia!', response.body)
        self.assertEqual(response.status_int, 200)
        self.assert_can_edit(response.body)
        self.assertIn('Stats', response.body)
        self.assertIn('History', response.body)
        # Test that the value generator JS is included.
        self.assertIn('RandomSelector', response.body)

        self.logout()

    def test_new_state_template(self):
        """Test the validity of the NEW_STATE_TEMPLATE."""

        exploration = exp_services.get_exploration_by_id('0')
        exploration.add_states([feconf.DEFAULT_INIT_STATE_NAME])
        new_state_dict = exploration.states[
            feconf.DEFAULT_INIT_STATE_NAME].to_dict()
        new_state_dict['unresolved_answers'] = {}
        self.assertEqual(new_state_dict, editor.NEW_STATE_TEMPLATE)

    def test_add_new_state_error_cases(self):
        """Test the error cases for adding a new state to an exploration."""
        CURRENT_VERSION = 1

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        def _get_payload(new_state_name, version=None):
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
            return self.put_json(
                '/createhandler/data/0', payload, csrf_token,
                expect_errors=True, expected_status_int=400)

        # A request with no version number is invalid.
        response_dict = _put_and_expect_400_error(_get_payload('New state'))
        self.assertIn('a version must be specified', response_dict['error'])

        # A request with the wrong version number is invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('New state', 123))
        self.assertIn('which is too old', response_dict['error'])

        # A request with an empty state name is invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('', CURRENT_VERSION))
        self.assertIn('should be between 1 and 50', response_dict['error'])

        # A request with a really long state name is invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('a' * 100, CURRENT_VERSION))
        self.assertIn('should be between 1 and 50', response_dict['error'])

        # A request with a state name containing invalid characters is
        # invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('[Bad State Name]', CURRENT_VERSION))
        self.assertIn('Invalid character [', response_dict['error'])

        # A name cannot have spaces at the front or back.
        response_dict = _put_and_expect_400_error(
            _get_payload('  aa', CURRENT_VERSION))
        self.assertIn('start or end with whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('aa\t', CURRENT_VERSION))
        self.assertIn('end with whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('\n', CURRENT_VERSION))
        self.assertIn('end with whitespace', response_dict['error'])

        # A name cannot have consecutive whitespace.
        response_dict = _put_and_expect_400_error(
            _get_payload('The   B', CURRENT_VERSION))
        self.assertIn('Adjacent whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('The\t\tB', CURRENT_VERSION))
        self.assertIn('Adjacent whitespace', response_dict['error'])

        self.logout()

    def test_resolved_answers_handler(self):
        # In the reader perspective, submit the first multiple-choice answer,
        # then submit 'blah' once, 'blah2' twice and 'blah3' three times.
        # TODO(sll): Use the ExplorationPlayer in reader_test for this.
        exploration_dict = self.get_json(
            '%s/0' % feconf.EXPLORATION_INIT_URL_PREFIX)
        self.assertEqual(
            exploration_dict['exploration']['title'], 'Welcome to Oppia!')

        state_name = exploration_dict['exploration']['init_state_name']
        result_dict = self.submit_answer('0', state_name, '0')

        state_name = result_dict['state_name']
        self.submit_answer('0', state_name, 'blah')
        for _ in range(2):
            self.submit_answer('0', state_name, 'blah2')
        for _ in range(3):
            self.submit_answer('0', state_name, 'blah3')

        # Log in as an editor.
        self.login(self.EDITOR_EMAIL)

        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)
        url = str('/createhandler/resolved_answers/0/%s' % state_name)

        def _get_unresolved_answers():
            return stats_domain.StateRuleAnswerLog.get(
                '0', state_name, exp_domain.DEFAULT_RULESPEC_STR
            ).answers

        self.assertEqual(
            _get_unresolved_answers(), {'blah': 1, 'blah2': 2, 'blah3': 3})

        # An empty request should result in an error.
        response_dict = self.put_json(
            url, {'something_else': []}, csrf_token,
            expect_errors=True, expected_status_int=400)
        self.assertIn('Expected a list', response_dict['error'])

        # A request of the wrong type should result in an error.
        response_dict = self.put_json(
            url, {'resolved_answers': 'this_is_a_string'}, csrf_token,
            expect_errors=True, expected_status_int=400)
        self.assertIn('Expected a list', response_dict['error'])

        # Trying to remove an answer that wasn't submitted has no effect.
        response_dict = self.put_json(
            url, {'resolved_answers': ['not_submitted_answer']}, csrf_token)
        self.assertEqual(
            _get_unresolved_answers(), {'blah': 1, 'blah2': 2, 'blah3': 3})

        # A successful request should remove the answer in question.
        response_dict = self.put_json(
            url, {'resolved_answers': ['blah']}, csrf_token)
        self.assertEqual(
            _get_unresolved_answers(), {'blah2': 2, 'blah3': 3})

        # It is possible to remove more than one answer at a time.
        response_dict = self.put_json(
            url, {'resolved_answers': ['blah2', 'blah3']}, csrf_token)
        self.assertEqual(_get_unresolved_answers(), {})

        self.logout()

    def test_untrained_answers_handler(self):
        with self.swap(feconf, 'SHOW_TRAINABLE_UNRESOLVED_ANSWERS', True):
            def _create_answer(value, count=1):
                return {'value': value, 'count': count}
            def _create_training_data(*arg):
                return [_create_answer(value) for value in arg]

            # Load the fuzzy rules demo exploration.
            exp_services.load_demo('15')
            rights_manager.release_ownership_of_exploration(
                feconf.SYSTEM_COMMITTER_ID, '15')

            exploration_dict = self.get_json(
                '%s/15' % feconf.EXPLORATION_INIT_URL_PREFIX)
            self.assertEqual(
                exploration_dict['exploration']['title'],
                'Demonstrating fuzzy rules')

            # This test uses the interaction which supports numeric input.
            state_name = 'text'

            self.assertIn(
                state_name, exploration_dict['exploration']['states'])
            self.assertEqual(
                exploration_dict['exploration']['states'][state_name][
                    'interaction']['id'], 'TextInput')

            # Input happy since there is an explicit rule checking for that.
            result_dict = self.submit_answer('15', state_name, 'happy')

            # Input text not at all similar to happy (default outcome).
            self.submit_answer('15', state_name, 'sad')

            # Input cheerful: this is current training data and falls under the
            # fuzzy rule.
            self.submit_answer('15', state_name, 'cheerful')

            # Input joyful: this is not training data but will be classified
            # under the fuzzy rule.
            self.submit_answer('15', state_name, 'joyful')

            # Log in as an editor.
            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get('/create/15')
            csrf_token = self.get_csrf_token_from_response(response)
            url = str('/createhandler/training_data/15/%s' % state_name)

            exploration_dict = self.get_json(
                '%s/15' % feconf.EXPLORATION_INIT_URL_PREFIX)

            # Only two of the four submitted answers should be unhandled.
            response_dict = self.get_json(url)
            self.assertEqual(
                response_dict['unhandled_answers'],
                _create_training_data('joyful', 'sad'))

            # If the confirmed unclassified answers is trained for one of the
            # values, it should no longer show up in unhandled answers.
            self.put_json('/createhandler/data/15', {
                    'change_list': [{
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': state_name,
                        'property_name': (
                            exp_domain.STATE_PROPERTY_INTERACTION_UNCLASSIFIED_ANSWERS),
                        'new_value': ['sad']
                    }],
                    'commit_message': 'Update confirmed unclassified answers',
                    'version': exploration_dict['version'],
                }, csrf_token)
            response_dict = self.get_json(url)
            self.assertEqual(
                response_dict['unhandled_answers'],
                _create_training_data('joyful'))

            exploration_dict = self.get_json(
                '%s/15' % feconf.EXPLORATION_INIT_URL_PREFIX)

            # If one of the values is added to the training data of a fuzzy
            # rule, then it should not be returned as an unhandled answer.
            state = exploration_dict['exploration']['states'][state_name]
            answer_group = state['interaction']['answer_groups'][1]
            rule_spec = answer_group['rule_specs'][0]
            self.assertEqual(
                rule_spec['rule_type'], rule_domain.FUZZY_RULE_TYPE)
            rule_spec['inputs']['training_data'].append('joyful')

            self.put_json('/createhandler/data/15', {
                    'change_list': [{
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': state_name,
                        'property_name': (
                            exp_domain.STATE_PROPERTY_INTERACTION_UNCLASSIFIED_ANSWERS),
                        'new_value': []
                    }, {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': state_name,
                        'property_name': (
                            exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
                        'new_value': state['interaction']['answer_groups']
                    }],
                    'commit_message': 'Update confirmed unclassified answers',
                    'version': exploration_dict['version'],
                }, csrf_token)
            response_dict = self.get_json(url)
            self.assertEqual(
                response_dict['unhandled_answers'],
                _create_training_data('sad'))

            exploration_dict = self.get_json(
                '%s/15' % feconf.EXPLORATION_INIT_URL_PREFIX)

            # If both are classified, then nothing should be returned
            # unhandled.
            self.put_json('/createhandler/data/15', {
                    'change_list': [{
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': state_name,
                        'property_name': (
                            exp_domain.STATE_PROPERTY_INTERACTION_UNCLASSIFIED_ANSWERS),
                        'new_value': ['sad']
                    }],
                    'commit_message': 'Update confirmed unclassified answers',
                    'version': exploration_dict['version'],
                }, csrf_token)
            response_dict = self.get_json(url)
            self.assertEqual(response_dict['unhandled_answers'], [])

            exploration_dict = self.get_json(
                '%s/15' % feconf.EXPLORATION_INIT_URL_PREFIX)

            # If one of the existing training data elements in the fuzzy rule
            # is removed (5 in this case), but it is not backed up by an
            # answer, it will not be returned as potential training data.
            state = exploration_dict['exploration']['states'][state_name]
            answer_group = state['interaction']['answer_groups'][1]
            rule_spec = answer_group['rule_specs'][0]
            del rule_spec['inputs']['training_data'][1]
            self.put_json('/createhandler/data/15', {
                    'change_list': [{
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': state_name,
                        'property_name': (
                            exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
                        'new_value': state['interaction']['answer_groups']
                    }],
                    'commit_message': 'Update confirmed unclassified answers',
                    'version': exploration_dict['version'],
                }, csrf_token)
            response_dict = self.get_json(url)
            self.assertEqual(response_dict['unhandled_answers'], [])

            self.logout()


class DownloadIntegrationTest(BaseEditorControllerTest):
    """Test handler for exploration and state download."""

    SAMPLE_JSON_CONTENT = {
        "State A": ("""content:
- type: text
  value: ''
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
    feedback: []
    param_changes: []
  fallbacks: []
  id: TextInput
param_changes: []
"""),
        "State B": ("""content:
- type: text
  value: ''
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
    feedback: []
    param_changes: []
  fallbacks: []
  id: TextInput
param_changes: []
"""),
        feconf.DEFAULT_INIT_STATE_NAME: ("""content:
- type: text
  value: ''
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
    feedback: []
    param_changes: []
  fallbacks: []
  id: TextInput
param_changes: []
""") % feconf.DEFAULT_INIT_STATE_NAME
    }

    SAMPLE_STATE_STRING = (
"""content:
- type: text
  value: ''
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
    feedback: []
    param_changes: []
  fallbacks: []
  id: TextInput
param_changes: []
""")

    def test_exploration_download_handler_for_default_exploration(self):
        self.login(self.EDITOR_EMAIL)
        self.OWNER_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # Create a simple exploration
        EXP_ID = 'eid'
        self.save_new_valid_exploration(
            EXP_ID, self.OWNER_ID,
            title='The title for ZIP download handler test!',
            category='This is just a test category',
            objective='')

        exploration = exp_services.get_exploration_by_id(EXP_ID)
        init_state = exploration.states[exploration.init_state_name]
        init_interaction = init_state.interaction
        init_interaction.default_outcome.dest = exploration.init_state_name
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exploration.states['State A'].update_interaction_id('TextInput')
        exploration.states['State 2'].update_interaction_id('TextInput')
        exploration.states['State 3'].update_interaction_id('TextInput')
        exploration.rename_state('State 2', 'State B')
        exploration.delete_state('State 3')
        exp_services._save_exploration(self.OWNER_ID, exploration, '', [])
        response = self.testapp.get('/create/%s' % EXP_ID)

        # Check download to zip file
        # Download to zip file using download handler
        EXPLORATION_DOWNLOAD_URL = '/createhandler/download/%s' % EXP_ID
        response = self.testapp.get(EXPLORATION_DOWNLOAD_URL)

        # Check downloaded zip file
        self.assertEqual(response.headers['Content-Type'], 'text/plain')
        filename = 'oppia-ThetitleforZIPdownloadhandlertest!-v2.zip'
        self.assertEqual(response.headers['Content-Disposition'],
                         'attachment; filename=%s' % str(filename))
        zf_saved = zipfile.ZipFile(StringIO.StringIO(response.body))
        self.assertEqual(
            zf_saved.namelist(),
            ['The title for ZIP download handler test!.yaml'])

        # Load golden zip file
        with open(os.path.join(
                feconf.TESTS_DATA_DIR,
                'oppia-ThetitleforZIPdownloadhandlertest!-v2-gold.zip'),
                'rb') as f:
            golden_zipfile = f.read()
        zf_gold = zipfile.ZipFile(StringIO.StringIO(golden_zipfile))

        # Compare saved with golden file
        self.assertEqual(
            zf_saved.open(
                'The title for ZIP download handler test!.yaml'
                ).read(),
            zf_gold.open(
                'The title for ZIP download handler test!.yaml'
                ).read())

        # Check download to JSON
        exploration.update_objective('Test JSON download')
        exp_services._save_exploration(self.OWNER_ID, exploration, '', [])

        # Download to JSON string using download handler
        self.maxDiff = None
        EXPLORATION_DOWNLOAD_URL = (
            '/createhandler/download/%s?output_format=%s&width=50' %
            (EXP_ID, feconf.OUTPUT_FORMAT_JSON))
        response = self.get_json(EXPLORATION_DOWNLOAD_URL)

        # Check downloaded dict
        self.assertEqual(self.SAMPLE_JSON_CONTENT, response)

        self.logout()

    def test_state_download_handler_for_default_exploration(self):

        self.login(self.EDITOR_EMAIL)
        self.OWNER_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # Create a simple exploration
        EXP_ID = 'eid'
        self.save_new_valid_exploration(
            EXP_ID, self.OWNER_ID,
            title='The title for states download handler test!',
            category='This is just a test category')

        exploration = exp_services.get_exploration_by_id(EXP_ID)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exploration.states['State A'].update_interaction_id('TextInput')
        exploration.states['State 2'].update_interaction_id('TextInput')
        exploration.states['State 3'].update_interaction_id('TextInput')
        exploration.rename_state('State 2', 'State B')
        exploration.delete_state('State 3')
        exp_services._save_exploration(self.OWNER_ID, exploration, '', [])
        response = self.testapp.get('/create/%s' % EXP_ID)

        # Check download state as YAML string
        self.maxDiff = None
        state_name = 'State%20A'
        EXPLORATION_DOWNLOAD_URL = (
            '/createhandler/download_state/%s?state=%s&width=50' %
            (EXP_ID, state_name))
        response = self.testapp.get(EXPLORATION_DOWNLOAD_URL)
        self.assertEqual(self.SAMPLE_STATE_STRING, response.body)

        self.logout()


class ExplorationDeletionRightsTest(BaseEditorControllerTest):

    def test_deletion_rights_for_unpublished_exploration(self):
        """Test rights management for deletion of unpublished explorations."""
        UNPUBLISHED_EXP_ID = 'unpublished_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            UNPUBLISHED_EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.owner_id, exploration)

        rights_manager.assign_role_for_exploration(
            self.owner_id, UNPUBLISHED_EXP_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % UNPUBLISHED_EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % UNPUBLISHED_EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.OWNER_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % UNPUBLISHED_EXP_ID)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_deletion_rights_for_published_exploration(self):
        """Test rights management for deletion of published explorations."""
        PUBLISHED_EXP_ID = 'published_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            PUBLISHED_EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.owner_id, exploration)

        rights_manager.assign_role_for_exploration(
            self.owner_id, PUBLISHED_EXP_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)
        rights_manager.publish_exploration(self.owner_id, PUBLISHED_EXP_ID)

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % PUBLISHED_EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % PUBLISHED_EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.OWNER_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % PUBLISHED_EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.ADMIN_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % PUBLISHED_EXP_ID)
        self.assertEqual(response.status_int, 200)
        self.logout()


class VersioningIntegrationTest(BaseEditorControllerTest):
    """Test retrieval of and reverting to old exploration versions."""

    def setUp(self):
        """Create exploration with two versions"""
        super(VersioningIntegrationTest, self).setUp()

        self.EXP_ID = '0'

        exp_services.load_demo(self.EXP_ID)
        rights_manager.release_ownership_of_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID)

        self.login(self.EDITOR_EMAIL)

        # In version 2, change the objective and the initial state content.
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exp_services.update_exploration(
            self.EDITOR_EMAIL, self.EXP_ID, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective',
            }, {
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'state_name': exploration.init_state_name,
                'new_value': [{'type': 'text', 'value': 'ABC'}],
            }], 'Change objective and init state content')

    def test_reverting_to_old_exploration(self):
        """Test reverting to old exploration versions."""
        # Open editor page
        response = self.testapp.get(
            '%s/%s' % (feconf.EDITOR_URL_PREFIX, self.EXP_ID))
        csrf_token = self.get_csrf_token_from_response(response)

        # May not revert to any version that's not 1
        for rev_version in (-1, 0, 2, 3, 4, '1', ()):
            response_dict = self.post_json(
                '/createhandler/revert/%s' % self.EXP_ID, {
                    'current_version': 2,
                    'revert_to_version': rev_version
                }, csrf_token, expect_errors=True, expected_status_int=400)

            # Check error message
            if not isinstance(rev_version, int):
                self.assertIn('Expected an integer', response_dict['error'])
            else:
                self.assertIn('Cannot revert to version',
                              response_dict['error'])

            # Check that exploration is really not reverted to old version
            reader_dict = self.get_json(
                '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
            init_state_name = reader_dict['exploration']['init_state_name']
            init_state_data = (
                reader_dict['exploration']['states'][init_state_name])
            init_content = init_state_data['content'][0]['value']
            self.assertIn('ABC', init_content)
            self.assertNotIn('Hi, welcome to Oppia!', init_content)

        # Revert to version 1
        rev_version = 1
        response_dict = self.post_json(
            '/createhandler/revert/%s' % self.EXP_ID, {
                'current_version': 2,
                'revert_to_version': rev_version
            }, csrf_token)

        # Check that exploration is really reverted to version 1
        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))

        init_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][init_state_name])
        init_content = init_state_data['content'][0]['value']
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
        init_content = init_state_data['content'][0]['value']
        self.assertIn('ABC', init_content)
        self.assertNotIn('Hi, welcome to Oppia!', init_content)

        # v1 contains 'Hi, welcome to Oppia!'.
        reader_dict = self.get_json(
            '%s/%s?v=1' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
        init_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][init_state_name])
        init_content = init_state_data['content'][0]['value']
        self.assertIn('Hi, welcome to Oppia!', init_content)
        self.assertNotIn('ABC', init_content)

        # v2 contains 'ABC'.
        reader_dict = self.get_json(
            '%s/%s?v=2' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
        init_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][init_state_name])
        init_content = init_state_data['content'][0]['value']
        self.assertIn('ABC', init_content)
        self.assertNotIn('Hi, welcome to Oppia!', init_content)

        # v3 does not exist.
        response = self.testapp.get(
            '%s/%s?v=3' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)


class ExplorationEditRightsTest(BaseEditorControllerTest):
    """Test the handling of edit rights for explorations."""

    def test_user_banning(self):
        """Test that banned users are banned."""

        EXP_ID = '0'
        exp_services.load_demo(EXP_ID)
        rights_manager.release_ownership_of_exploration(
            feconf.SYSTEM_COMMITTER_ID, EXP_ID)

        # Sign-up new editors Joe and Sandra.
        self.signup('joe@example.com', 'joe')
        self.signup('sandra@example.com', 'sandra')

        # Joe logs in.
        self.login('joe@example.com')

        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response = self.testapp.get('/create/%s' % EXP_ID)
        self.assertEqual(response.status_int, 200)
        self.assert_can_edit(response.body)

        # Ban joe.
        config_services.set_property(
            feconf.SYSTEM_COMMITTER_ID, 'banned_usernames', ['joe'])

        # Test that Joe is banned. (He can still access the gallery.)
        response = self.testapp.get(feconf.GALLERY_URL, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        response = self.testapp.get('/create/%s' % EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.assert_cannot_edit(response.body)

        # Joe logs out.
        self.logout()

        # Sandra logs in and is unaffected.
        self.login('sandra@example.com')
        response = self.testapp.get('/create/%s' % EXP_ID)
        self.assertEqual(response.status_int, 200)
        self.assert_can_edit(response.body)
        self.logout()


class ExplorationRightsIntegrationTest(BaseEditorControllerTest):
    """Test the handler for managing exploration editing rights."""

    COLLABORATOR_EMAIL = 'collaborator@example.com'
    COLLABORATOR_USERNAME = 'collab'
    COLLABORATOR2_EMAIL = 'collaborator2@example.com'
    COLLABORATOR2_USERNAME = 'collab2'
    COLLABORATOR3_EMAIL = 'collaborator3@example.com'
    COLLABORATOR3_USERNAME = 'collab3'

    def test_exploration_rights_handler(self):
        """Test exploration rights handler."""

        # Create several users
        self.signup(
            self.COLLABORATOR_EMAIL, username=self.COLLABORATOR_USERNAME)
        self.signup(
            self.COLLABORATOR2_EMAIL, username=self.COLLABORATOR2_USERNAME)
        self.signup(
            self.COLLABORATOR3_EMAIL, username=self.COLLABORATOR3_USERNAME)

        self.collaborator_id = self.get_user_id_from_email(
            self.COLLABORATOR_EMAIL)

        # Owner creates exploration
        self.login(self.OWNER_EMAIL)
        EXP_ID = 'eid'
        self.save_new_valid_exploration(
            EXP_ID, self.owner_id, title='Title for rights handler test!',
            category='My category')

        exploration = exp_services.get_exploration_by_id(EXP_ID)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exploration.states['State A'].update_interaction_id('TextInput')
        exploration.states['State 2'].update_interaction_id('TextInput')
        exploration.states['State 3'].update_interaction_id('TextInput')

        response = self.testapp.get(
            '%s/%s' % (feconf.EDITOR_URL_PREFIX, EXP_ID))
        csrf_token = self.get_csrf_token_from_response(response)

        # Owner adds rights for other users
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, EXP_ID)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.VIEWER_USERNAME,
                'new_member_role': rights_manager.ROLE_VIEWER
            }, csrf_token)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR_USERNAME,
                'new_member_role': rights_manager.ROLE_EDITOR
            }, csrf_token)
        self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR2_USERNAME,
                'new_member_role': rights_manager.ROLE_EDITOR
            }, csrf_token)

        self.logout()

        # Check that viewer can access editor page but cannot edit.
        self.login(self.VIEWER_EMAIL)
        response = self.testapp.get('/create/%s' % EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.assert_cannot_edit(response.body)
        self.logout()

        # Check that collaborator can access editor page and can edit.
        self.login(self.COLLABORATOR_EMAIL)
        response = self.testapp.get('/create/%s' % EXP_ID)
        self.assertEqual(response.status_int, 200)
        self.assert_can_edit(response.body)
        csrf_token = self.get_csrf_token_from_response(response)

        # Check that collaborator can add a new state called 'State 4'
        add_url = '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, EXP_ID)
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

        # Check that collaborator cannot add new members
        exploration = exp_services.get_exploration_by_id(EXP_ID)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, EXP_ID)
        response_dict = self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR3_USERNAME,
                'new_member_role': rights_manager.ROLE_EDITOR,
            }, csrf_token, expect_errors=True, expected_status_int=401)
        self.assertEqual(response_dict['code'], 401)

        self.logout()

        # Check that collaborator2 can access editor page and can edit.
        self.login(self.COLLABORATOR2_EMAIL)
        response = self.testapp.get('/create/%s' % EXP_ID)
        self.assertEqual(response.status_int, 200)
        self.assert_can_edit(response.body)
        csrf_token = self.get_csrf_token_from_response(response)

        # Check that collaborator2 can add a new state called 'State 5'
        add_url = '%s/%s' % (feconf.EXPLORATION_DATA_PREFIX, EXP_ID)
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

        # Check that collaborator2 cannot add new members
        exploration = exp_services.get_exploration_by_id(EXP_ID)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, EXP_ID)
        response_dict = self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR3_USERNAME,
                'new_member_role': rights_manager.ROLE_EDITOR,
                }, csrf_token, expect_errors=True, expected_status_int=401)
        self.assertEqual(response_dict['code'], 401)

        self.logout()
