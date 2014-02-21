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

from core.controllers import galleries
from core.domain import config_services
from core.domain import exp_services
import feconf
import test_utils
import unittest

CAN_EDIT_STR = 'can_edit'
CAN_CLONE_STR = 'can_clone'


class LearnGalleryTest(test_utils.GenericTestBase):

    def test_learn_gallery_page(self):
        """Test access to the learners' gallery page."""
        response = self.testapp.get(feconf.LEARN_GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Gallery', 'Categories',
            # Test that no edit/copy links are shown (at least in the HTML
            # template; a full test should check what happens after the JS is
            # loaded and data is fetched from the backend).
            no=[CAN_EDIT_STR, CAN_CLONE_STR, 'Create New Exploration']
        )

        # Test that the correct navbar tab is active.
        self.assertRegexpMatches(
            response.body, r'class="active">\s+<a href="/learn">Learn')

    def test_learn_gallery_handler(self):
        """Test access to the learners' gallery data handler."""
        # Load a demo exploration.
        exp_services.load_demo('0')

        response_dict = self.get_json(feconf.LEARN_GALLERY_DATA_URL)
        self.assertEqual({
            'is_admin': False,
            'is_moderator': False,
            'is_super_admin': False,
            'categories': {
                'Welcome': [{
                    'to_playtest': False,
                    'id': '0',
                    'title': 'Welcome to Oppia!'
                }]
            }
        }, response_dict)

    def test_login_message(self):
        """Test that the login message appears when appropriate."""
        response = self.testapp.get(feconf.LEARN_GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'To create new explorations or edit existing ones, you must',
            self.get_expected_login_url(feconf.CONTRIBUTE_GALLERY_URL),
            no=['To create new explorations or edit existing ones, visit the'])

        USER_EMAIL = 'user@example.com'
        self.login(USER_EMAIL)

        response = self.testapp.get(feconf.LEARN_GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'To create new explorations or edit existing ones, visit the',
            no=['To create new explorations or edit existing ones, you must',
                self.get_expected_login_url(feconf.CONTRIBUTE_GALLERY_URL)])

        self.logout()

    def test_can_see_explorations_to_playtest(self):
        """Test viewability of playtestable explorations."""
        EDITOR_EMAIL = 'editor@example.com'
        PLAYTESTER_A_EMAIL = 'pa@example.com'
        PLAYTESTER_B_EMAIL = 'pb@example.com'
        VIEWER_ROLE = 'viewer'

        # E registers and logs in as an editor.
        self.register_editor(EDITOR_EMAIL)
        self.login(EDITOR_EMAIL)

        # E creates new explorations A and B.
        response = self.testapp.get(feconf.CONTRIBUTE_GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        csrf_token = self.get_csrf_token_from_response(response)
        EXP_A_DICT = {'title': 'A', 'category': 'Test Explorations'}
        EXP_B_DICT = {'title': 'B', 'category': 'Test Explorations'}
        exp_a_id = self.post_json(
            feconf.NEW_EXPLORATION_URL, EXP_A_DICT, csrf_token
        )[galleries.EXPLORATION_ID_KEY]
        exp_b_id = self.post_json(
            feconf.NEW_EXPLORATION_URL, EXP_B_DICT, csrf_token
        )[galleries.EXPLORATION_ID_KEY]

        # E allows PA to playtest exploration A, and allows PB to playtest
        # exploration B.
        response = self.testapp.get(
            '%s/%s' % (feconf.EDITOR_URL_PREFIX, exp_a_id))
        self.assertEqual(response.status_int, 200)
        csrf_token = self.get_csrf_token_from_response(response)
        self.put_json(
            '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_a_id), {
                'version': 1,
                'new_member_email': PLAYTESTER_A_EMAIL,
                'new_member_role': VIEWER_ROLE
            }, csrf_token)
        self.put_json(
            '%s/%s' % (feconf.EXPLORATION_RIGHTS_PREFIX, exp_b_id), {
                'version': 1,
                'new_member_email': PLAYTESTER_B_EMAIL,
                'new_member_role': VIEWER_ROLE
            }, csrf_token)

        # E logs out.
        self.logout()

        # An anonymous user sees nothing to playtest on the Learn page.
        response_dict = self.get_json(feconf.LEARN_GALLERY_DATA_URL)
        self.assertEqual({
            'is_admin': False,
            'is_moderator': False,
            'is_super_admin': False,
            'categories': {}
        }, response_dict)

        # If PA logs in, he sees exploration A but not exploration B on the
        # Learn page.
        self.login(PLAYTESTER_A_EMAIL)
        response_dict = self.get_json(feconf.LEARN_GALLERY_DATA_URL)
        self.assertEqual({
            'is_admin': False,
            'is_moderator': False,
            'is_super_admin': False,
            'categories': {
                'Test Explorations': [{
                    'to_playtest': True,
                    'id': exp_a_id,
                    'title': 'A'
                }]
            },
            'user_email': PLAYTESTER_A_EMAIL,
            'username': None,
        }, response_dict)
        self.logout()

        # E does not see either exploration on the Learn page.
        self.login(EDITOR_EMAIL)
        response_dict = self.get_json(feconf.LEARN_GALLERY_DATA_URL)
        self.assertDictContainsSubset({
            'is_admin': False,
            'is_moderator': False,
            'is_super_admin': False,
            'categories': {},
        }, response_dict)
        self.logout()


class ContributeGalleryTest(test_utils.GenericTestBase):

    def test_contribute_gallery_page(self):
        """Test access to the contributors' gallery page."""
        # If the user is not logged in, redirect to a login page.
        response = self.testapp.get(feconf.CONTRIBUTE_GALLERY_URL)
        self.assertEqual(response.status_int, 302)
        self.assertEqual(
            response.location,
            self.get_expected_login_url(feconf.CONTRIBUTE_GALLERY_URL))

        # The user is logged in, but has not registered. Redirect to the
        # editor prerequisites page.
        self.login('editor@example.com')
        response = self.testapp.get(feconf.CONTRIBUTE_GALLERY_URL)
        self.assertEqual(response.status_int, 302)
        self.assertIn(
            feconf.EDITOR_PREREQUISITES_URL, response.headers['location'])
        response = response.follow()
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'A few notes before you start editing',
            'My preferred Oppia username')
        self.logout()

        # The user registers as an editor, and can now see the contributors'
        # gallery.
        self.register_editor('editor@example.com')
        self.login('editor@example.com')
        response = self.testapp.get(feconf.CONTRIBUTE_GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Categories', 'Create New Exploration', CAN_EDIT_STR,
            CAN_CLONE_STR)
        # Test that the correct navbar tab is active.
        self.assertRegexpMatches(
            response.body,
            r'class="active">\s+<a href="/contribute">Contribute')
        self.logout()

    def test_contribute_gallery_handler(self):
        """Test the contribute gallery data handler."""
        # Visit the splash page to make the demo exploration load.
        self.testapp.get('/')

        # If the user is not logged in, redirect to a login page.
        response = self.testapp.get(feconf.CONTRIBUTE_GALLERY_URL)
        self.assertEqual(response.status_int, 302)
        self.assertEqual(
            response.location,
            self.get_expected_login_url(feconf.CONTRIBUTE_GALLERY_URL))

        # The user is logged in, but has not registered. Redirect to the editor
        # prerequisites page.
        self.login('editor@example.com')
        response = self.testapp.get(feconf.CONTRIBUTE_GALLERY_URL)
        self.assertEqual(response.status_int, 302)
        self.assertIn(
            feconf.EDITOR_PREREQUISITES_URL, response.headers['location'])
        response = response.follow()
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'A few notes before you start editing',
            'My preferred Oppia username')
        self.logout()

        # The user registers as an editor, and can now access the contributors'
        # gallery data handler.
        self.register_editor('editor@example.com')
        self.login('editor@example.com')
        response_dict = self.get_json(feconf.CONTRIBUTE_GALLERY_DATA_URL)
        # Users may not edit the sample exploration for the splash page.
        self.assertDictContainsSubset({
            'is_admin': False,
            'is_super_admin': False,
            'categories': {}
        }, response_dict)
        self.logout()

    def test_exploration_upload_button(self):
        """Test that the exploration upload button appears when appropriate."""
        self.register_editor('editor@example.com')
        self.login('editor@example.com')

        response = self.testapp.get(feconf.CONTRIBUTE_GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(no=['Upload Existing Exploration'])

        config_services.set_property(
            feconf.ADMIN_COMMITTER_ID, 'allow_yaml_file_upload', True)

        response = self.testapp.get(feconf.CONTRIBUTE_GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain('Upload Existing Exploration')

        self.logout()
