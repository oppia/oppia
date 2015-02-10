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

    EDITOR_EMAIL = 'editor@example.com'
    OWNER_EMAIL = 'owner@example.com'

    def test_gallery_page(self):
        """Test access to the gallery page."""
        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain('Gallery', 'Categories')

    def test_gallery_handler_demo_exploration(self):
        """Test the gallery data handler on demo explorations."""

        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_EMAIL])

        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual({
            'is_admin': False,
            'is_moderator': False,
            'is_super_admin': False,
            'public': [],
            'featured': [],
            'search_cursor': None,
        }, response_dict)

        # Load a public demo exploration.
        exp_services.load_demo('0')

        # Test gallery
        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual(response_dict['featured'], [])
        self.assertEqual(len(response_dict['public']), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'Welcome',
            'title': 'Welcome to Oppia!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_manager.EXPLORATION_STATUS_PUBLIC,
        }, response_dict['public'][0])

        # Publicize the demo exploration.
        rights_manager.publicize_exploration(owner_id, '0')

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
            owner_id, '0', [{
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
        self.assertEqual(response_dict['public'], [])
        self.assertEqual(len(response_dict['featured']), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'A new category',
            'title': 'A new title!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_manager.EXPLORATION_STATUS_PUBLICIZED,
        }, response_dict['featured'][0])

    def test_gallery_handler_for_created_explorations(self):
        """Test the gallery data handler for manually created explirations."""

        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_EMAIL])

        self.register_editor(self.OWNER_EMAIL)
        self.login(self.OWNER_EMAIL)

        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual({
            'is_admin': True,
            'is_moderator': True,
            'is_super_admin': False,
            'public': [],
            'featured': [],
            'user_email': self.OWNER_EMAIL,
            'username': 'defaultusername',
            'search_cursor': None,
        }, response_dict)

        # Create exploration A
        exploration = self.save_new_valid_exploration(
            'A', owner_id, title='Title A', category='Category A',
            objective='Objective A')
        exp_services._save_exploration(
            owner_id, exploration, 'Exploration A', [])

        # Test that the private exploration isn't displayed.
        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual(response_dict['public'], [])
        self.assertEqual(response_dict['featured'], [])

        # Create exploration B
        exploration = self.save_new_valid_exploration(
            'B', owner_id, title='Title B', category='Category B',
            objective='Objective B')
        exp_services._save_exploration(
            owner_id, exploration, 'Exploration B', [])
        rights_manager.publish_exploration(owner_id, 'B')
        rights_manager.publicize_exploration(owner_id, 'B')

        # Publish exploration A
        rights_manager.publish_exploration(owner_id, 'A')

        # Test gallery
        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual(len(response_dict['public']), 1)
        self.assertEqual(len(response_dict['featured']), 1)
        self.assertDictContainsSubset({
            'id': 'A',
            'category': 'Category A',
            'title': 'Title A',
            'language_code': 'en',
            'objective': 'Objective A',
            'status': rights_manager.EXPLORATION_STATUS_PUBLIC,
        }, response_dict['public'][0])
        self.assertDictContainsSubset({
            'id': 'B',
            'category': 'Category B',
            'title': 'Title B',
            'language_code': 'en',
            'objective': 'Objective B',
            'status': rights_manager.EXPLORATION_STATUS_PUBLICIZED,
        }, response_dict['featured'][0])

        # Delete exploration A
        exp_services.delete_exploration(owner_id, 'A')

        # Test gallery
        response_dict = self.get_json(feconf.GALLERY_DATA_URL)
        self.assertEqual(response_dict['public'], [])
        self.assertEqual(len(response_dict['featured']), 1)
        self.assertDictContainsSubset({
            'id': 'B',
            'category': 'Category B',
            'title': 'Title B',
            'language_code': 'en',
            'objective': 'Objective B',
            'status': rights_manager.EXPLORATION_STATUS_PUBLICIZED,
        }, response_dict['featured'][0])

    def test_new_exploration_ids(self):
        """Test generation of exploration ids."""
        self.register_editor(self.EDITOR_EMAIL)
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

    def test_exploration_upload_button(self):
        """Test that the exploration upload button appears when appropriate."""
        self.register_editor(self.EDITOR_EMAIL)
        self.login(self.EDITOR_EMAIL)

        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(no=['Upload Existing Exploration'])

        config_services.set_property(
            feconf.ADMIN_COMMITTER_ID, 'allow_yaml_file_upload', True)

        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain('Upload Existing Exploration')

        self.logout()
