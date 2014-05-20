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

__author__ = 'Sean Lip'

import os
import StringIO
import zipfile

from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import rights_manager
import feconf
import test_utils


class EditorTest(test_utils.GenericTestBase):

    TAGS = [test_utils.TestTags.SLOW_TEST]

    def test_editor_page(self):
        """Test access to editor pages for the sample exploration."""
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        # Check that non-editors cannot access the editor page.
        response = self.testapp.get('/create/0')
        self.assertEqual(response.status_int, 302)

        # Register and login as an editor.
        self.register_editor('editor@example.com')
        self.login('editor@example.com')

        # Check that it is now possible to access the editor page.
        response = self.testapp.get('/create/0')
        self.assertEqual(response.status_int, 200)
        self.assertIn('Stats', response.body)
        self.assertIn('History', response.body)
        # Test that the value generator JS is included.
        self.assertIn('RandomSelector', response.body)

        self.logout()

    def test_request_new_state_template(self):
        """Test requesting a new state template when adding a new state."""
        # Register and log in as an admin.
        self.register_editor('editor@example.com')
        self.login('editor@example.com')

        EXP_ID = 'eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            EXP_ID, 'A title', 'A category')
        exploration.states[exploration.init_state_name].widget.handlers[
            0].rule_specs[0].dest = feconf.END_DEST
        exp_services.save_new_exploration(
            self.get_current_logged_in_user_id(), exploration)

        response = self.testapp.get('/create/%s' % EXP_ID)
        csrf_token = self.get_csrf_token_from_response(response)

        # Add a new state called 'New valid state name'.
        response_dict = self.post_json(
            '/createhandler/new_state_template/%s' % EXP_ID, {
                'state_name': 'New valid state name'
            }, csrf_token)

        self.assertDictContainsSubset({
            'content': [{'type': 'text', 'value': ''}],
            'unresolved_answers': {}
        }, response_dict['new_state'])
        self.assertTrue('widget' in response_dict['new_state'])

        self.logout()

    def test_add_new_state_error_cases(self):
        """Test the error cases for adding a new state to an exploration."""
        exp_services.delete_demo('0')
        exp_services.load_demo('0')
        CURRENT_VERSION = 1

        # Register and log in as an admin.
        self.register_editor('editor@example.com')
        self.login('editor@example.com')

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

        # A request with a state name of feconf.END_DEST is invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload(feconf.END_DEST, CURRENT_VERSION))
        self.assertIn('Invalid state name', response_dict['error'])

        # Even if feconf.END_DEST is mixed case, it is still invalid.
        response_dict = _put_and_expect_400_error(
            _get_payload('eNd', CURRENT_VERSION))
        self.assertEqual('eNd'.lower(), feconf.END_DEST.lower())
        self.assertIn('Invalid state name', response_dict['error'])

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
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        # In the reader perspective, submit the first multiple-choice answer,
        # then submit 'blah' once, 'blah2' twice and 'blah3' three times.
        # TODO(sll): Use the ExplorationPlayer in reader_test for this.
        exploration_dict = self.get_json(
            '%s/0' % feconf.EXPLORATION_INIT_URL_PREFIX)
        self.assertEqual(exploration_dict['title'], 'Welcome to Oppia!')

        state_name = exploration_dict['state_name']
        exploration_dict = self.post_json(
            '%s/0/%s' % (feconf.EXPLORATION_TRANSITION_URL_PREFIX, state_name),
            {
                'answer': '0', 'handler': 'submit',
                'state_history': exploration_dict['state_history'],
            }
        )

        state_name = exploration_dict['state_name']
        exploration_dict = self.post_json(
            '%s/0/%s' % (feconf.EXPLORATION_TRANSITION_URL_PREFIX, state_name),
            {
                'answer': 'blah', 'handler': 'submit',
                'state_history': exploration_dict['state_history'],
            }
        )

        for _ in range(2):
            exploration_dict = self.post_json(
                '%s/0/%s' % (
                    feconf.EXPLORATION_TRANSITION_URL_PREFIX, state_name), {
                    'answer': 'blah2', 'handler': 'submit',
                    'state_history': exploration_dict['state_history'],
                }
            )

        for _ in range(3):
            exploration_dict = self.post_json(
                '%s/0/%s' % (
                    feconf.EXPLORATION_TRANSITION_URL_PREFIX, state_name), {
                    'answer': 'blah3', 'handler': 'submit',
                    'state_history': exploration_dict['state_history'],
                }
            )

        # Register and log in as an editor.
        self.register_editor('editor@example.com')
        self.login('editor@example.com')

        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)
        url = str('/createhandler/resolved_answers/0/%s' % state_name)

        def _get_unresolved_answers():
            return stats_domain.StateRuleAnswerLog.get(
                '0', state_name, exp_services.SUBMIT_HANDLER_NAME,
                exp_domain.DEFAULT_RULESPEC_STR
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


class StatsIntegrationTest(test_utils.GenericTestBase):
    """Test statistics recording using the default exploration."""

    def test_state_stats_for_default_exploration(self):
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        EXPLORATION_STATISTICS_URL = '/createhandler/statistics/0'

        # Check, from the editor perspective, that no stats have been recorded.
        self.register_editor('editor@example.com')
        self.login('editor@example.com')

        editor_exploration_dict = self.get_json(EXPLORATION_STATISTICS_URL)
        self.assertEqual(editor_exploration_dict['num_visits'], 0)
        self.assertEqual(editor_exploration_dict['num_completions'], 0)

        # Switch to the reader perspective. First submit the first
        # multiple-choice answer, then submit 'blah'.
        self.logout()
        exploration_dict = self.get_json(
            '%s/0' % feconf.EXPLORATION_INIT_URL_PREFIX)
        self.assertEqual(exploration_dict['title'], 'Welcome to Oppia!')

        state_name = exploration_dict['state_name']
        exploration_dict = self.post_json(
            '%s/0/%s' % (feconf.EXPLORATION_TRANSITION_URL_PREFIX, state_name),
            {
                'answer': '0', 'handler': 'submit',
                'state_history': exploration_dict['state_history'],
            }
        )
        state_name = exploration_dict['state_name']
        self.post_json(
            '%s/0/%s' % (feconf.EXPLORATION_TRANSITION_URL_PREFIX, state_name),
            {
                'answer': 'blah', 'handler': 'submit',
                'state_history': exploration_dict['state_history']
            }
        )

        # Now switch back to the editor perspective.
        self.login('editor@example.com')

        editor_exploration_dict = self.get_json(EXPLORATION_STATISTICS_URL)
        self.assertEqual(editor_exploration_dict['num_visits'], 1)
        self.assertEqual(editor_exploration_dict['num_completions'], 0)

        # TODO(sll): Add more checks here.

        self.logout()


class ExplorationDownloadIntegrationTest(test_utils.GenericTestBase):
    """Test handler for exploration download."""

    def test_exploration_download_handler_for_default_exploration(self):

        # Register and log in as an editor.
        self.register_editor('editor@example.com')
        self.login('editor@example.com')
        self.OWNER_ID = self.get_user_id_from_email('editor@example.com')

        # Create a simple exploration
        EXP_ID = 'eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            EXP_ID, 'The title for ZIP download handler test!',
            'This is just a test category')
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exp_services.save_new_exploration(self.OWNER_ID, exploration)
        exploration.rename_state('State 2', 'State B')
        exploration.delete_state('State 3')
        exp_services._save_exploration(self.OWNER_ID, exploration, '', [])
        response = self.testapp.get('/create/%s' % EXP_ID)

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
                'oppia-ThetitleforZIPdownloadhandlertest!-v2-gold.zip')) as f:
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

        self.logout()


class ExplorationDeletionRightsTest(test_utils.GenericTestBase):

    def setUp(self):
        """Creates dummy users."""
        super(ExplorationDeletionRightsTest, self).setUp()
        self.admin_email = 'admin@example.com'
        self.owner_email = 'owner@example.com'
        self.editor_email = 'editor@example.com'
        self.viewer_email = 'viewer@example.com'

        # Usernames containing the string 'admin' are reserved.
        self.register_editor(self.admin_email, username='adm')
        self.register_editor(self.owner_email, username='owner')
        self.register_editor(self.editor_email, username='editor')
        self.register_editor(self.viewer_email, username='viewer')

        self.admin_id = self.get_user_id_from_email(self.admin_email)
        self.owner_id = self.get_user_id_from_email(self.owner_email)
        self.editor_id = self.get_user_id_from_email(self.editor_email)
        self.viewer_id = self.get_user_id_from_email(self.viewer_email)

        config_services.set_property(
            feconf.ADMIN_COMMITTER_ID, 'admin_emails', ['admin@example.com'])

    def test_deletion_rights_for_unpublished_exploration(self):
        """Test rights management for deletion of unpublished explorations."""
        UNPUBLISHED_EXP_ID = 'unpublished_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            UNPUBLISHED_EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.owner_id, exploration)

        rights_manager.assign_role(
            self.owner_id, UNPUBLISHED_EXP_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)

        self.login(self.editor_email)
        response = self.testapp.delete(
            '/createhandler/data/%s' % UNPUBLISHED_EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.viewer_email)
        response = self.testapp.delete(
            '/createhandler/data/%s' % UNPUBLISHED_EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.owner_email)
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

        rights_manager.assign_role(
            self.owner_id, PUBLISHED_EXP_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)
        rights_manager.publish_exploration(self.owner_id, PUBLISHED_EXP_ID)

        self.login(self.editor_email)
        response = self.testapp.delete(
            '/createhandler/data/%s' % PUBLISHED_EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.viewer_email)
        response = self.testapp.delete(
            '/createhandler/data/%s' % PUBLISHED_EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.owner_email)
        response = self.testapp.delete(
            '/createhandler/data/%s' % PUBLISHED_EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        self.login(self.admin_email)
        response = self.testapp.delete(
            '/createhandler/data/%s' % PUBLISHED_EXP_ID)
        self.assertEqual(response.status_int, 200)
        self.logout()


class VersioningIntegrationTest(test_utils.GenericTestBase):
    """Test retrieval of and reverting to old exploration versions."""

    def setUp(self):
        """Create exploration with two versions"""
        super(VersioningIntegrationTest, self).setUp()

        self.EXP_ID = '0'

        exp_services.delete_demo(self.EXP_ID)
        exp_services.load_demo(self.EXP_ID)

        EDITOR_EMAIL = 'editor@example.com'
        self.register_editor(EDITOR_EMAIL)
        self.login(EDITOR_EMAIL)

        # In version 2, change the objective and the initial state content.
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exp_services.update_exploration(
           EDITOR_EMAIL, self.EXP_ID, [{
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
            self.assertIn('ABC', reader_dict['init_html'])
            self.assertNotIn('Hi, welcome to Oppia!', reader_dict['init_html'])

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
        self.assertNotIn('ABC', reader_dict['init_html'])
        self.assertIn('Hi, welcome to Oppia!', reader_dict['init_html'])


    def test_versioning_for_default_exploration(self):
        """Test retrieval of old exploration versions."""
        # The latest version contains 'ABC'.
        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
        self.assertIn('ABC', reader_dict['init_html'])
        self.assertNotIn('Hi, welcome to Oppia!', reader_dict['init_html'])

        # v1 contains 'Hi, welcome to Oppia!'.
        reader_dict = self.get_json(
            '%s/%s?v=1' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
        self.assertIn('Hi, welcome to Oppia!', reader_dict['init_html'])
        self.assertNotIn('ABC', reader_dict['init_html'])

        # v2 contains 'ABC'.
        reader_dict = self.get_json(
            '%s/%s?v=2' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))
        self.assertIn('ABC', reader_dict['init_html'])
        self.assertNotIn('Hi, welcome to Oppia!', reader_dict['init_html'])

        # v3 does not exist.
        response = self.testapp.get(
            '%s/%s?v=3' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)


class ExplorationEditRightsTest(test_utils.GenericTestBase):
    """Test the handling of edit rights for explorations."""

    def test_user_banning(self):
        """Test that banned users are banned."""
        EXP_ID = '0'
        exp_services.delete_demo(EXP_ID)
        exp_services.load_demo(EXP_ID)

        # Register new editors Joe and Sandra.
        self.register_editor('joe@example.com', username='joe')
        self.register_editor('sandra@example.com', username='sandra')

        # Joe logs in.
        self.login('joe@example.com')

        response = self.testapp.get('/contribute', expect_errors=True)
        self.assertEqual(response.status_int, 200)
        response = self.testapp.get('/create/%s' % EXP_ID)
        self.assertEqual(response.status_int, 200)

        # Ban joe.
        config_services.set_property(
            feconf.ADMIN_COMMITTER_ID, 'banned_usernames', ['joe'])

        # Test that Joe is banned.
        response = self.testapp.get('/contribute', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        response = self.testapp.get('/create/%s' % EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)

        # Joe logs out.
        self.logout()

        # Sandra logs in and is unaffected.
        self.login('sandra@example.com')
        response = self.testapp.get('/create/%s' % EXP_ID)
        self.assertEqual(response.status_int, 200)
        self.logout()


class ExplorationRightsIntegrationTest(test_utils.GenericTestBase):
    """Test the handler for managing exploration editing rights."""

    def test_exploration_rights_handler(self):
        """Test exploration rights handler."""

        # Create several users
        self.admin_email = 'admin@example.com'
        self.owner_email = 'owner@example.com'
        self.collaborator_email = 'collaborator@example.com'
        self.collaborator2_email = 'collaborator2@example.com'
        self.viewer_email = 'viewer@example.com'
        self.viewer2_email = 'viewer2@example.com'

        self.register_editor(self.admin_email, username='adm')
        self.register_editor(self.owner_email, username='owner')
        self.register_editor(self.collaborator_email, username='collab')
        self.register_editor(self.viewer_email, username='viewer')

        self.admin_id = self.get_user_id_from_email(self.admin_email)
        self.owner_id = self.get_user_id_from_email(self.owner_email)
        self.collaborator_id = self.get_user_id_from_email(
            self.collaborator_email)
        self.viewer_id = self.get_user_id_from_email(self.viewer_email)

        config_services.set_property(
            feconf.ADMIN_COMMITTER_ID, 'admin_emails', ['admin@example.com'])

        self.viewer_role = rights_manager.ROLE_VIEWER
        self.collaborator_role = rights_manager.ROLE_EDITOR

        # Owner creates exploration
        self.login(self.owner_email)
        EXP_ID = 'eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            EXP_ID, 'Title for rights handler test!',
            'My category')
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exp_services.save_new_exploration(self.owner_id, exploration)

        response = self.testapp.get(
            '%s/%s' % (feconf.EDITOR_URL_PREFIX, EXP_ID))
        csrf_token = self.get_csrf_token_from_response(response)

        # Owner adds rights for other users
        rights_url = '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, EXP_ID)
        response_dict = self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_email': self.viewer_email,
                'new_member_role': self.viewer_role
            }, csrf_token)
        response_dict = self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_email': self.collaborator_email,
                'new_member_role': self.collaborator_role
            }, csrf_token)

        self.logout()

        # Check that viewer cannot access editor page
        self.login(self.viewer_email)
        response = self.testapp.get('/create/%s' % EXP_ID, expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        # Check that collaborator can access editor page
        self.login(self.collaborator_email)
        response = self.testapp.get('/create/%s' % EXP_ID)
        self.assertEqual(response.status_int, 200)
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
                'new_member_email': self.viewer2_email,
                'new_member_role': self.viewer_role
            }, csrf_token, expect_errors=True, expected_status_int=401)
        self.assertEqual(response_dict['code'], 401)

        response_dict = self.put_json(
            rights_url, {
                'version': exploration.version,
                'new_member_email': self.collaborator2_email,
                'new_member_role': self.collaborator_role,
                }, csrf_token, expect_errors=True, expected_status_int=401)
        self.assertEqual(response_dict['code'], 401)

        self.logout()


class ResolvedFeedbackIntegrationTest(test_utils.GenericTestBase):
    """Test the handler for resolving feedback."""

    # TODO(msl): other tests should also call this method
    def setUp(self):
        """Create dummy users."""
        super(ResolvedFeedbackIntegrationTest, self).setUp()
        # Create several users
        self.admin_email = 'admin@example.com'
        self.editor_email = 'editor@example.com'
        self.viewer_email = 'viewer@example.com'

        self.register_editor(self.admin_email, username='adm')
        self.register_editor(self.editor_email, username='editor')

        self.admin_id = self.get_user_id_from_email(self.admin_email)
        self.editor_id = self.get_user_id_from_email(self.editor_email)
        self.viewer_id = self.get_user_id_from_email(self.viewer_email)

        config_services.set_property(
            feconf.ADMIN_COMMITTER_ID, 'admin_emails', ['admin@example.com'])

    def test_resolved_feedback_handler(self):
        """Test resolved feedback handler."""
        # Editor loads exploration
        self.login(self.editor_email)
        EXP_ID = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')
        exploration = exp_services.get_exploration_by_id(EXP_ID)
        exp_version = exploration.version
        self.logout()

        # Viewer opens exploration
        self.login(self.viewer_email)
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, EXP_ID))
        state_name1 = exploration_dict['state_name']

        # Viewer gives 1st feedback
        feedback_dict = self.post_json(
            '/explorehandler/give_feedback/%s/%s' % (EXP_ID, state_name1),
            {
                'feedback': 'This is a feedback message.',
                'state_history': exploration_dict['state_history'],
                'version': exp_version
            }
        )

        # Viewer submits answer '0'
        exploration_dict = self.post_json(
            '%s/%s/%s' % (feconf.EXPLORATION_TRANSITION_URL_PREFIX,
                          EXP_ID,
                          state_name1),
            {
                'answer': '0', 'handler': 'submit',
                'state_history': exploration_dict['state_history']
            }
        )
        state_name2 = exploration_dict['state_name']

        # Viewer gives 2nd feedback
        feedback_dict = self.post_json(
            '/explorehandler/give_feedback/%s/%s' % (EXP_ID, state_name2),
            {
                'feedback': 'This is a 2nd feedback message.',
                'state_history': exploration_dict['state_history'],
                'version': exp_version
            }
        )
        self.logout()

        # Editor resolves 1st feedback
        self.login(self.editor_email)
        response = self.testapp.get(
            '%s/%s' % (feconf.EDITOR_URL_PREFIX, EXP_ID))
        csrf_token = self.get_csrf_token_from_response(response)
        # get feedback_id
        stats = stats_services.get_state_stats_for_exploration(EXP_ID)
        self.assertEqual(len(stats[state_name1]['readerFeedback']), 1)
        feedback_id = stats[state_name1]['readerFeedback'].keys()[0]
        resolve_dict = self.put_json(
            '/createhandler/resolved_feedback/%s/%s' % (EXP_ID, state_name1),
            {
                'feedback_id': feedback_id,
                'new_status': stats_services.STATUS_FIXED
            }, csrf_token)
        # check if resolved
        stats = stats_services.get_state_stats_for_exploration(EXP_ID)
        self.assertEqual(stats[state_name1]['readerFeedback'], {})
        self.logout()

        # Continue as admin
        self.login(self.admin_email)
        response = self.testapp.get(
            '%s/%s' % (feconf.EDITOR_URL_PREFIX, EXP_ID))
        csrf_token = self.get_csrf_token_from_response(response)
        self.assertEqual(len(stats[state_name2]['readerFeedback']), 1)
        feedback_id = stats[state_name2]['readerFeedback'].keys()[0]

        # Cannot resolve non-existing feedback
        invalid_id = feedback_id + '/'
        resolve_dict = self.put_json(
            '/createhandler/resolved_feedback/%s/%s' % (EXP_ID, state_name2),
            {
                'feedback_id': invalid_id,
                'new_status': stats_services.STATUS_FIXED
            }, csrf_token, expect_errors=True, expected_status_int=500)
        self.assertEqual(
            'Entity for class FeedbackItemModel with id ' \
            + invalid_id + ' not found', 
            resolve_dict['error'])

        # Cannot set to invalid status
        invalid_status = 'an_invalid_status'
        resolve_dict = self.put_json(
            '/createhandler/resolved_feedback/%s/%s' % (EXP_ID, state_name2),
            {
                'feedback_id': feedback_id,
                'new_status': invalid_status
            }, csrf_token, expect_errors=True, expected_status_int=500)
        self.assertEqual('Unexpected status: ' + invalid_status, 
                         resolve_dict['error'])
        
        # Resolve 2nd feedback
        self.assertEqual(len(stats[state_name2]['readerFeedback']), 1)
        resolve_dict = self.put_json(
            '/createhandler/resolved_feedback/%s/%s' % (EXP_ID, state_name2),
            {
                'feedback_id': feedback_id,
                'new_status': stats_services.STATUS_FIXED
            }, csrf_token)
        # check if resolved
        stats = stats_services.get_state_stats_for_exploration(EXP_ID)
        self.assertEqual(stats[state_name2]['readerFeedback'], {})
        self.logout()

        # Check that no unresolved feedbacks remain
        for key in stats:
            self.assertEqual(stats[key]['readerFeedback'], {})
