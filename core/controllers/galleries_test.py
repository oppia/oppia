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

"""Tests for the gallery pages."""

__author__ = 'Sean Lip'

from core.controllers import galleries
from core.domain import config_services
from core.domain import exp_jobs
from core.domain import exp_services
from core.domain import rights_manager
from core.tests import test_utils
import feconf


CAN_EDIT_STR = 'can_edit'


class GalleryPageTest(test_utils.GenericTestBase):

    def setUp(self):
        super(GalleryPageTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.EDITOR_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.ADMIN_ID = self.get_user_id_from_email(self.ADMIN_EMAIL)

    def test_gallery_page(self):
        """Test access to the gallery page."""
        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain('Gallery', 'Categories')

    def test_gallery_handler_demo_exploration(self):
        """Test the gallery data handler on demo explorations."""
        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual({
            'is_admin': False,
            'is_moderator': False,
            'is_super_admin': False,
            'explorations_list': [],
            'search_cursor': None,
            'profile_picture_data_url': None,
            'preferred_language_codes': [feconf.DEFAULT_LANGUAGE_CODE],
        }, response_dict)

        # Load a public demo exploration.
        exp_services.load_demo('0')

        # Test gallery
        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual(len(response_dict['explorations_list']), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'Welcome',
            'title': 'Welcome to Oppia!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['explorations_list'][0])

        # Publicize the demo exploration.
        self.set_admins([self.ADMIN_EMAIL])
        rights_manager.publicize_exploration(self.ADMIN_ID, '0')

        # Run migration job to create exploration summaries.
        # This is not necessary, but serves as additional check that
        # the migration job works well and gives correct galleries.
        self.process_and_flush_pending_tasks()
        job_id = (exp_jobs.ExpSummariesCreationOneOffJob.create_new())
        exp_jobs.ExpSummariesCreationOneOffJob.enqueue(job_id)
        self.assertGreaterEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self.count_jobs_in_taskqueue(), 0)

        # change title and category
        exp_services.update_exploration(
            self.EDITOR_ID, '0', [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'A new title!'
            }, {
                'cmd': 'edit_exploration_property',
                'property_name': 'category',
                'new_value': 'A new category'
            }],
            'Change title and category')

        # Test gallery
        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual(len(response_dict['explorations_list']), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'A new category',
            'title': 'A new title!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_manager.ACTIVITY_STATUS_PUBLICIZED,
        }, response_dict['explorations_list'][0])

    def test_gallery_handler_for_created_explorations(self):
        """Test the gallery data handler for manually created explirations."""
        self.set_admins([self.ADMIN_EMAIL])

        self.login(self.ADMIN_EMAIL)
        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual({
            'is_admin': True,
            'is_moderator': True,
            'is_super_admin': False,
            'explorations_list': [],
            'user_email': self.ADMIN_EMAIL,
            'username': self.ADMIN_USERNAME,
            'search_cursor': None,
            'profile_picture_data_url': None,
            'preferred_language_codes': [feconf.DEFAULT_LANGUAGE_CODE],
        }, response_dict)

        # Create exploration A
        exploration = self.save_new_valid_exploration(
            'A', self.ADMIN_ID, title='Title A', category='Category A',
            objective='Objective A')
        exp_services._save_exploration(
            self.ADMIN_ID, exploration, 'Exploration A', [])

        # Test that the private exploration isn't displayed.
        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual(response_dict['explorations_list'], [])

        # Create exploration B
        exploration = self.save_new_valid_exploration(
            'B', self.ADMIN_ID, title='Title B', category='Category B',
            objective='Objective B')
        exp_services._save_exploration(
            self.ADMIN_ID, exploration, 'Exploration B', [])
        rights_manager.publish_exploration(self.ADMIN_ID, 'B')
        rights_manager.publicize_exploration(self.ADMIN_ID, 'B')

        # Publish exploration A
        rights_manager.publish_exploration(self.ADMIN_ID, 'A')

        exp_services.index_explorations_given_ids(['A', 'B'])

        # Test gallery
        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual(len(response_dict['explorations_list']), 2)
        self.assertDictContainsSubset({
            'id': 'B',
            'category': 'Category B',
            'title': 'Title B',
            'language_code': 'en',
            'objective': 'Objective B',
            'status': rights_manager.ACTIVITY_STATUS_PUBLICIZED,
        }, response_dict['explorations_list'][0])
        self.assertDictContainsSubset({
            'id': 'A',
            'category': 'Category A',
            'title': 'Title A',
            'language_code': 'en',
            'objective': 'Objective A',
            'status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['explorations_list'][1])

        # Delete exploration A
        exp_services.delete_exploration(self.ADMIN_ID, 'A')

        # Test gallery
        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual(len(response_dict['explorations_list']), 1)
        self.assertDictContainsSubset({
            'id': 'B',
            'category': 'Category B',
            'title': 'Title B',
            'language_code': 'en',
            'objective': 'Objective B',
            'status': rights_manager.ACTIVITY_STATUS_PUBLICIZED,
        }, response_dict['explorations_list'][0])

    def test_new_exploration_ids(self):
        """Test generation of exploration ids."""
        self.login(self.EDITOR_EMAIL)

        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        csrf_token = self.get_csrf_token_from_response(response)
        EXP_A_DICT = {
            'title': self.UNICODE_TEST_STRING,
            'category': self.UNICODE_TEST_STRING,
            'objective': 'Learn how to generate exploration ids.',
            'language_code': feconf.DEFAULT_LANGUAGE_CODE}
        exp_a_id = self.post_json(
            feconf.NEW_EXPLORATION_URL, EXP_A_DICT, csrf_token
        )[galleries.EXPLORATION_ID_KEY]
        self.assertEqual(len(exp_a_id), 12)

        self.logout()

    def test_exploration_upload_button(self):
        """Test that the exploration upload button appears when appropriate."""
        self.login(self.EDITOR_EMAIL)

        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(no=['Upload Exploration'])

        config_services.set_property(
            feconf.SYSTEM_COMMITTER_ID, 'allow_yaml_file_upload', True)

        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain('Upload Exploration')

        self.logout()
