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

import datetime
import json
import os
import StringIO
import zipfile

from core.controllers import dashboard
from core.controllers import editor
from core.domain import config_services
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import rights_manager
from core.platform import models
from core.tests import test_utils
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])


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

        self.set_admins([self.ADMIN_USERNAME])

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
        self.assertIn('Help others learn new things.', response.body)
        self.assert_cannot_edit(response.body)

        # Log in as an editor.
        self.login(self.EDITOR_EMAIL)

        # Check that it is now possible to access and edit the editor page.
        response = self.testapp.get('/create/0')
        self.assertIn('Help others learn new things.', response.body)
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

    def test_that_default_exploration_cannot_be_published(self):
        """Test that publishing a default exploration raises an error
        due to failing strict validation.
        """
        self.login(self.EDITOR_EMAIL)

        response = self.testapp.get(feconf.DASHBOARD_URL)
        self.assertEqual(response.status_int, 200)
        csrf_token = self.get_csrf_token_from_response(response)
        exp_id = self.post_json(
            feconf.NEW_EXPLORATION_URL, {}, csrf_token
        )[dashboard.EXPLORATION_ID_KEY]

        response = self.testapp.get('/create/%s' % exp_id)
        csrf_token = self.get_csrf_token_from_response(response)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
        self.put_json(rights_url, {
            'is_public': True,
        }, csrf_token, expect_errors=True, expected_status_int=400)

        self.logout()

    def test_add_new_state_error_cases(self):
        """Test the error cases for adding a new state to an exploration."""
        current_version = 1

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
            _get_payload('', current_version))
        self.assertIn('should be between 1 and 50', response_dict['error'])

        # A request with a really long state name is invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('a' * 100, current_version))
        self.assertIn('should be between 1 and 50', response_dict['error'])

        # A request with a state name containing invalid characters is
        # invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('[Bad State Name]', current_version))
        self.assertIn('Invalid character [', response_dict['error'])

        # A name cannot have spaces at the front or back.
        response_dict = _put_and_expect_400_error(
            _get_payload('  aa', current_version))
        self.assertIn('start or end with whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('aa\t', current_version))
        self.assertIn('end with whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('\n', current_version))
        self.assertIn('end with whitespace', response_dict['error'])

        # A name cannot have consecutive whitespace.
        response_dict = _put_and_expect_400_error(
            _get_payload('The   B', current_version))
        self.assertIn('Adjacent whitespace', response_dict['error'])
        response_dict = _put_and_expect_400_error(
            _get_payload('The\t\tB', current_version))
        self.assertIn('Adjacent whitespace', response_dict['error'])

        self.logout()

    def test_resolved_answers_handler(self):
        # As a learner, submit the first multiple-choice answer, then submit
        # 'blah' once, 'blah2' twice and 'blah3' three times.
        exp_id = '0'
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        self.assertEqual(
            exploration_dict['exploration']['title'], 'Welcome to Oppia!')

        first_state_name = exploration_dict['exploration']['init_state_name']
        event_services.AnswerSubmissionEventHandler.record(
            exp_id, 1, first_state_name, exp_domain.DEFAULT_RULESPEC_STR, 0)

        second_state_name = 'What language'
        event_services.AnswerSubmissionEventHandler.record(
            exp_id, 1, second_state_name, exp_domain.DEFAULT_RULESPEC_STR,
            'blah')
        for _ in range(2):
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, second_state_name, exp_domain.DEFAULT_RULESPEC_STR,
                'blah2')
        for _ in range(3):
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, second_state_name, exp_domain.DEFAULT_RULESPEC_STR,
                'blah3')

        # Log in as an editor.
        self.login(self.EDITOR_EMAIL)

        response = self.testapp.get('/create/%s' % exp_id)
        csrf_token = self.get_csrf_token_from_response(response)
        url = str('/createhandler/resolved_answers/%s/%s' % (
            exp_id, second_state_name))

        def _get_unresolved_answers():
            return stats_domain.StateRuleAnswerLog.get(
                exp_id, second_state_name, exp_domain.DEFAULT_RULESPEC_STR
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

            # Load the string classifier demo exploration.
            exp_id = '15'
            exp_services.load_demo(exp_id)
            rights_manager.release_ownership_of_exploration(
                feconf.SYSTEM_COMMITTER_ID, exp_id)

            exploration_dict = self.get_json(
                '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
            self.assertEqual(
                exploration_dict['exploration']['title'],
                'Demonstrating string classifier')

            # This test uses the interaction which supports numeric input.
            state_name = 'text'

            self.assertIn(
                state_name, exploration_dict['exploration']['states'])
            self.assertEqual(
                exploration_dict['exploration']['states'][state_name][
                    'interaction']['id'], 'TextInput')

            answer_groups = exp_services.get_exploration_by_id('15').states[
                state_name].interaction.answer_groups
            explicit_rule_spec_string = (
                answer_groups[0].rule_specs[0].stringify_classified_rule())
            classifier_rule_spec_string = (
                answer_groups[1].rule_specs[0].stringify_classified_rule())

            # Input happy since there is an explicit rule checking for that.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, state_name, explicit_rule_spec_string, 'happy')

            # Input text not at all similar to happy (default outcome).
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, state_name, exp_domain.DEFAULT_RULESPEC_STR, 'sad')

            # Input cheerful: this is current training data and falls under the
            # classifier.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, state_name, classifier_rule_spec_string, 'cheerful')

            # Input joyful: this is not training data but will be classified
            # under the classifier.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, state_name, classifier_rule_spec_string, 'joyful')

            # Log in as an editor.
            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get('/create/%s' % exp_id)
            csrf_token = self.get_csrf_token_from_response(response)
            url = str(
                '/createhandler/training_data/%s/%s' % (exp_id, state_name))

            exploration_dict = self.get_json(
                '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))

            # Only two of the four submitted answers should be unhandled.
            response_dict = self.get_json(url)
            self.assertEqual(
                response_dict['unhandled_answers'],
                _create_training_data('joyful', 'sad'))

            # If the confirmed unclassified answers is trained for one of the
            # values, it should no longer show up in unhandled answers.
            self.put_json('/createhandler/data/%s' % exp_id, {
                'change_list': [{
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': state_name,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_UNCLASSIFIED_ANSWERS),
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
                '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))

            # If one of the values is added to the training data of the
            # classifier, then it should not be returned as an unhandled answer.
            state = exploration_dict['exploration']['states'][state_name]
            answer_group = state['interaction']['answer_groups'][1]
            rule_spec = answer_group['rule_specs'][0]
            self.assertEqual(
                rule_spec['rule_type'], exp_domain.CLASSIFIER_RULESPEC_STR)
            rule_spec['inputs']['training_data'].append('joyful')

            self.put_json('/createhandler/data/%s' % exp_id, {
                'change_list': [{
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': state_name,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_UNCLASSIFIED_ANSWERS),
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
                '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))

            # If both are classified, then nothing should be returned
            # unhandled.
            self.put_json('/createhandler/data/%s' % exp_id, {
                'change_list': [{
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': state_name,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_UNCLASSIFIED_ANSWERS),
                    'new_value': ['sad']
                }],
                'commit_message': 'Update confirmed unclassified answers',
                'version': exploration_dict['version'],
            }, csrf_token)
            response_dict = self.get_json(url)
            self.assertEqual(response_dict['unhandled_answers'], [])

            exploration_dict = self.get_json(
                '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))

            # If one of the existing training data elements in the classifier
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
        'State A': ("""content:
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
        'State B': ("""content:
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

    SAMPLE_STATE_STRING = ("""content:
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
        owner_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # Create a simple exploration
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
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exploration.states['State A'].update_interaction_id('TextInput')
        exploration.states['State 2'].update_interaction_id('TextInput')
        exploration.states['State 3'].update_interaction_id('TextInput')
        exploration.rename_state('State 2', 'State B')
        exploration.delete_state('State 3')
        exp_services._save_exploration(  # pylint: disable=protected-access
            owner_id, exploration, '', [])
        response = self.testapp.get('/create/%s' % exp_id)

        # Check download to zip file
        # Download to zip file using download handler
        download_url = '/createhandler/download/%s' % exp_id
        response = self.testapp.get(download_url)

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
                'The title for ZIP download handler test!.yaml').read(),
            zf_gold.open(
                'The title for ZIP download handler test!.yaml').read())

        # Check download to JSON
        exploration.update_objective('Test JSON download')
        exp_services._save_exploration(  # pylint: disable=protected-access
            owner_id, exploration, '', [])

        # Download to JSON string using download handler
        self.maxDiff = None
        download_url = (
            '/createhandler/download/%s?output_format=%s&width=50' %
            (exp_id, feconf.OUTPUT_FORMAT_JSON))
        response = self.get_json(download_url)

        # Check downloaded dict
        self.assertEqual(self.SAMPLE_JSON_CONTENT, response)

        self.logout()

    def test_state_yaml_handler(self):
        self.login(self.EDITOR_EMAIL)
        owner_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # Create a simple exploration
        exp_id = 'eid'
        self.save_new_valid_exploration(
            exp_id, owner_id,
            title='The title for states download handler test!',
            category='This is just a test category')

        exploration = exp_services.get_exploration_by_id(exp_id)
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exploration.states['State A'].update_interaction_id('TextInput')

        download_url = (
            '/createhandler/state_yaml?'
            'stringified_state=%s&stringified_width=50' %
            json.dumps(exploration.states['State A'].to_dict()))
        response = self.get_json(download_url)
        self.assertEqual({
            'yaml': self.SAMPLE_STATE_STRING
        }, response)

        self.logout()


class ExplorationDeletionRightsTest(BaseEditorControllerTest):

    def test_deletion_rights_for_unpublished_exploration(self):
        """Test rights management for deletion of unpublished explorations."""
        unpublished_exp_id = 'unpublished_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            unpublished_exp_id)
        exp_services.save_new_exploration(self.owner_id, exploration)

        rights_manager.assign_role_for_exploration(
            self.owner_id, unpublished_exp_id, self.editor_id,
            rights_manager.ROLE_EDITOR)

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % unpublished_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % unpublished_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.OWNER_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % unpublished_exp_id)
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_deletion_rights_for_published_exploration(self):
        """Test rights management for deletion of published explorations."""
        published_exp_id = 'published_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            published_exp_id, title='A title', category='A category')
        exp_services.save_new_exploration(self.owner_id, exploration)

        rights_manager.assign_role_for_exploration(
            self.owner_id, published_exp_id, self.editor_id,
            rights_manager.ROLE_EDITOR)
        rights_manager.publish_exploration(self.owner_id, published_exp_id)

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % published_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % published_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.OWNER_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % published_exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.ADMIN_EMAIL)
        response = self.testapp.delete(
            '/createhandler/data/%s' % published_exp_id)
        self.assertEqual(response.status_int, 200)
        self.logout()


class VersioningIntegrationTest(BaseEditorControllerTest):
    """Test retrieval of and reverting to old exploration versions."""

    EXP_ID = '0'

    def setUp(self):
        """Create exploration with two versions"""
        super(VersioningIntegrationTest, self).setUp()

        exp_services.load_demo(self.EXP_ID)
        rights_manager.release_ownership_of_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID)

        self.login(self.EDITOR_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        # In version 2, change the objective and the initial state content.
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exp_services.update_exploration(
            self.editor_id, self.EXP_ID, [{
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

        exp_id = '0'
        exp_services.load_demo(exp_id)
        rights_manager.release_ownership_of_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp_id)

        # Sign-up new editors Joe and Sandra.
        self.signup('joe@example.com', 'joe')
        self.signup('sandra@example.com', 'sandra')

        # Joe logs in.
        self.login('joe@example.com')

        response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
        self.assertEqual(response.status_int, 200)
        response = self.testapp.get('/create/%s' % exp_id)
        self.assertEqual(response.status_int, 200)
        self.assert_can_edit(response.body)

        # Ban joe.
        config_services.set_property(
            feconf.SYSTEM_COMMITTER_ID, 'banned_usernames', ['joe'])

        # Test that Joe is banned. (He can still access the library page.)
        response = self.testapp.get(
            feconf.LIBRARY_INDEX_URL, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        response = self.testapp.get('/create/%s' % exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.assert_cannot_edit(response.body)

        # Joe logs out.
        self.logout()

        # Sandra logs in and is unaffected.
        self.login('sandra@example.com')
        response = self.testapp.get('/create/%s' % exp_id)
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

        # Owner creates exploration
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

        response = self.testapp.get(
            '%s/%s' % (feconf.EDITOR_URL_PREFIX, exp_id))
        csrf_token = self.get_csrf_token_from_response(response)

        # Owner adds rights for other users
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
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
        response = self.testapp.get('/create/%s' % exp_id, expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.assert_cannot_edit(response.body)
        self.logout()

        # Check that collaborator can access editor page and can edit.
        self.login(self.COLLABORATOR_EMAIL)
        response = self.testapp.get('/create/%s' % exp_id)
        self.assertEqual(response.status_int, 200)
        self.assert_can_edit(response.body)
        csrf_token = self.get_csrf_token_from_response(response)

        # Check that collaborator can add a new state called 'State 4'
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

        # Check that collaborator cannot add new members
        exploration = exp_services.get_exploration_by_id(exp_id)
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_id)
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
        response = self.testapp.get('/create/%s' % exp_id)
        self.assertEqual(response.status_int, 200)
        self.assert_can_edit(response.body)
        csrf_token = self.get_csrf_token_from_response(response)

        # Check that collaborator2 can add a new state called 'State 5'
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
        response_dict = self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_username': self.COLLABORATOR3_USERNAME,
                'new_member_role': rights_manager.ROLE_EDITOR,
                }, csrf_token, expect_errors=True, expected_status_int=401)
        self.assertEqual(response_dict['code'], 401)

        self.logout()


class ModeratorEmailsTest(test_utils.GenericTestBase):
    """Integration test for post-moderator action emails."""

    EXP_ID = 'eid'

    def setUp(self):
        super(ModeratorEmailsTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

        # The editor publishes an exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, title='My Exploration',
            end_state_name='END')
        rights_manager.publish_exploration(self.editor_id, self.EXP_ID)

        # Set the default email config.
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        config_services.set_property(
            self.admin_id, 'publicize_exploration_email_html_body',
            'Default publicization email body')
        config_services.set_property(
            self.admin_id, 'unpublish_exploration_email_html_body',
            'Default unpublishing email body')

    def test_error_cases_for_email_sending(self):
        with self.swap(
            feconf, 'REQUIRE_EMAIL_ON_MODERATOR_ACTION', True
            ), self.swap(
                feconf, 'CAN_SEND_EMAILS_TO_USERS', False):
            # Log in as a moderator.
            self.login(self.MODERATOR_EMAIL)

            # Go to the exploration editor page.
            response = self.testapp.get('/create/%s' % self.EXP_ID)
            self.assertEqual(response.status_int, 200)
            csrf_token = self.get_csrf_token_from_response(response)

            # Submit an invalid action. This should cause an error.
            response_dict = self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID, {
                    'action': 'random_action',
                    'email_body': None,
                    'version': 1,
                }, csrf_token, expect_errors=True, expected_status_int=400)
            self.assertEqual(
                response_dict['error'], 'Invalid moderator action.')

            # Try to publicize the exploration without an email body. This
            # should cause an error.
            response_dict = self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID, {
                    'action': feconf.MODERATOR_ACTION_PUBLICIZE_EXPLORATION,
                    'email_body': None,
                    'version': 1,
                }, csrf_token, expect_errors=True, expected_status_int=400)
            self.assertIn(
                'Moderator actions should include an email',
                response_dict['error'])

            response_dict = self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID, {
                    'action': feconf.MODERATOR_ACTION_PUBLICIZE_EXPLORATION,
                    'email_body': '',
                    'version': 1,
                }, csrf_token, expect_errors=True, expected_status_int=400)
            self.assertIn(
                'Moderator actions should include an email',
                response_dict['error'])

            # Try to publicize the exploration even if the relevant feconf
            # flags are not set. This should cause a system error.
            valid_payload = {
                'action': feconf.MODERATOR_ACTION_PUBLICIZE_EXPLORATION,
                'email_body': 'Your exploration is featured!',
                'version': 1,
            }
            self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID,
                valid_payload, csrf_token, expect_errors=True,
                expected_status_int=500)

            with self.swap(feconf, 'CAN_SEND_EMAILS_TO_USERS', True):
                # Now the email gets sent with no error.
                self.put_json(
                    '/createhandler/moderatorrights/%s' % self.EXP_ID,
                    valid_payload, csrf_token)

            # Log out.
            self.logout()

    def test_email_is_sent_correctly_when_publicizing(self):
        with self.swap(
            feconf, 'REQUIRE_EMAIL_ON_MODERATOR_ACTION', True
            ), self.swap(
                feconf, 'CAN_SEND_EMAILS_TO_USERS', True):
            # Log in as a moderator.
            self.login(self.MODERATOR_EMAIL)

            # Go to the exploration editor page.
            response = self.testapp.get('/create/%s' % self.EXP_ID)
            self.assertEqual(response.status_int, 200)
            csrf_token = self.get_csrf_token_from_response(response)

            new_email_body = 'Your exploration is featured!'

            valid_payload = {
                'action': feconf.MODERATOR_ACTION_PUBLICIZE_EXPLORATION,
                'email_body': new_email_body,
                'version': 1,
            }

            self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID,
                valid_payload, csrf_token)

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
                'Your Oppia exploration "My Exploration" has been featured!')
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

    def test_email_is_sent_correctly_when_unpublishing(self):
        with self.swap(
            feconf, 'REQUIRE_EMAIL_ON_MODERATOR_ACTION', True
            ), self.swap(
                feconf, 'CAN_SEND_EMAILS_TO_USERS', True):
            # Log in as a moderator.
            self.login(self.MODERATOR_EMAIL)

            # Go to the exploration editor page.
            response = self.testapp.get('/create/%s' % self.EXP_ID)
            self.assertEqual(response.status_int, 200)
            csrf_token = self.get_csrf_token_from_response(response)

            new_email_body = 'Your exploration is unpublished :('

            valid_payload = {
                'action': feconf.MODERATOR_ACTION_UNPUBLISH_EXPLORATION,
                'email_body': new_email_body,
                'version': 1,
            }

            self.put_json(
                '/createhandler/moderatorrights/%s' % self.EXP_ID,
                valid_payload, csrf_token)

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
                feconf, 'CAN_SEND_EMAILS_TO_USERS', True):
            # Log in as a non-moderator.
            self.login(self.EDITOR_EMAIL)

            # Go to the exploration editor page.
            response = self.testapp.get('/create/%s' % self.EXP_ID)
            self.assertEqual(response.status_int, 200)
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
                valid_payload, csrf_token, expect_errors=True,
                expected_status_int=401)

            self.logout()


class EditorAutosaveTest(BaseEditorControllerTest):
    """Test the handling of editor autosave actions."""

    EXP_ID1 = '1'
    EXP_ID2 = '2'
    EXP_ID3 = '3'
    NEWER_DATETIME = datetime.datetime.strptime('2017-03-16', '%Y-%m-%d')
    OLDER_DATETIME = datetime.datetime.strptime('2015-03-16', '%Y-%m-%d')
    DRAFT_CHANGELIST = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'new_value': 'Updated title'}]
    NEW_CHANGELIST = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'new_value': 'New title'}]
    INVALID_CHANGELIST = [{
        'cmd': 'edit_exploration_property',
        'property_name': 'title',
        'new_value': 1}]

    def _create_explorations_for_tests(self):
        self.save_new_valid_exploration(self.EXP_ID1, self.owner_id)
        exploration = exp_services.get_exploration_by_id(self.EXP_ID1)
        exploration.add_states(['State A'])
        exploration.states['State A'].update_interaction_id('TextInput')
        self.save_new_valid_exploration(self.EXP_ID2, self.owner_id)
        self.save_new_valid_exploration(self.EXP_ID3, self.owner_id)

    def _create_exp_user_data_model_objects_for_tests(self):
        # Explorations with draft set.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.owner_id, self.EXP_ID1), user_id=self.owner_id,
            exploration_id=self.EXP_ID1,
            draft_change_list=self.DRAFT_CHANGELIST,
            draft_change_list_last_updated=self.NEWER_DATETIME,
            draft_change_list_exp_version=1).put()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.owner_id, self.EXP_ID2), user_id=self.owner_id,
            exploration_id=self.EXP_ID2,
            draft_change_list=self.DRAFT_CHANGELIST,
            draft_change_list_last_updated=self.OLDER_DATETIME,
            draft_change_list_exp_version=1).put()

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
        response = self.testapp.get('/create/%s' % self.EXP_ID1)
        self.csrf_token = self.get_csrf_token_from_response(response)

    def test_exploration_loaded_with_draft_applied(self):
        response = self.get_json(
            '/createhandler/data/%s' % self.EXP_ID2, {'apply_draft': True})
        # Title updated because chanhe list was applied.
        self.assertEqual(response['title'], 'Updated title')
        self.assertTrue(response['is_version_of_draft_valid'])
        # Draft changes passed to UI.
        self.assertEqual(response['draft_changes'], self.DRAFT_CHANGELIST)

    def test_exploration_loaded_without_draft_when_draft_version_invalid(self):
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        exp_user_data.draft_change_list_exp_version = 20
        exp_user_data.put()
        response = self.get_json(
            '/createhandler/data/%s' % self.EXP_ID2, {'apply_draft': True})
        # Title not updated because change list not applied.
        self.assertEqual(response['title'], 'A title')
        self.assertFalse(response['is_version_of_draft_valid'])
        # Draft changes passed to UI even when version is invalid.
        self.assertEqual(response['draft_changes'], self.DRAFT_CHANGELIST)

    def test_exploration_loaded_without_draft_as_draft_does_not_exist(self):
        response = self.get_json(
            '/createhandler/data/%s' % self.EXP_ID3, {'apply_draft': True})
        # Title not updated because change list not applied.
        self.assertEqual(response['title'], 'A title')
        self.assertIsNone(response['is_version_of_draft_valid'])
        # Draft changes None.
        self.assertIsNone(response['draft_changes'])

    def test_draft_not_updated_because_newer_draft_exists(self):
        payload = {
            'change_list': self.NEW_CHANGELIST,
            'version': 1,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID1, payload,
            self.csrf_token)
        # Check that draft change list hasn't been updated.
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID1))
        self.assertEqual(
            exp_user_data.draft_change_list, self.DRAFT_CHANGELIST)
        self.assertTrue(response['is_version_of_draft_valid'])

    def test_draft_not_updated_validation_error(self):
        self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, {
                'change_list': self.DRAFT_CHANGELIST,
                'version': 1,
            }, self.csrf_token)
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, {
                'change_list': self.INVALID_CHANGELIST,
                'version': 2,
            }, self.csrf_token, expect_errors=True, expected_status_int=400)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertEqual(
            exp_user_data.draft_change_list, self.DRAFT_CHANGELIST)
        self.assertEqual(
            response, {'code': 400,
                       'error': 'Expected title to be a string, received 1'})

    def test_draft_updated_version_valid(self):
        payload = {
            'change_list': self.NEW_CHANGELIST,
            'version': 1,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, payload,
            self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertEqual(exp_user_data.draft_change_list, self.NEW_CHANGELIST)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 1)
        self.assertTrue(response['is_version_of_draft_valid'])

    def test_draft_updated_version_invalid(self):
        payload = {
            'change_list': self.NEW_CHANGELIST,
            'version': 10,
        }
        response = self.put_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, payload,
            self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertEqual(exp_user_data.draft_change_list, self.NEW_CHANGELIST)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 10)
        self.assertFalse(response['is_version_of_draft_valid'])

    def test_discard_draft(self):
        self.post_json(
            '/createhandler/autosave_draft/%s' % self.EXP_ID2, {},
            self.csrf_token)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.owner_id, self.EXP_ID2))
        self.assertIsNone(exp_user_data.draft_change_list)
        self.assertIsNone(exp_user_data.draft_change_list_last_updated)
        self.assertIsNone(exp_user_data.draft_change_list_exp_version)
