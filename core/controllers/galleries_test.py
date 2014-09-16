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

from core import jobs_registry
from core.controllers import galleries
from core.domain import config_services
from core.domain import exp_jobs_test
from core.domain import exp_services
from core.domain import rights_manager
from core.tests import test_utils
import feconf


CAN_EDIT_STR = 'can_edit'


class GalleryPageTest(test_utils.GenericTestBase):

    EDITOR_EMAIL = 'editor@example.com'
    EXP_ID = 'eid'
    EXP_TITLE = 'title'
    OWNER_EMAIL = 'owner@example.com'

    def test_gallery_page(self):
        """Test access to the gallery page."""
        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain('Gallery', 'Categories')

        # Test that the correct navbar tab is active.
        self.assertRegexpMatches(
            response.body,
            r'class="active">\s+<a href="%s">Gallery' % feconf.GALLERY_URL)

    def test_gallery_handler(self):
        """Test the gallery data handler."""

        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                [exp_jobs_test.ModifiedExpSummaryAggregator]):

            owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
            self.save_new_default_exploration(
                self.EXP_ID, owner_id, title=self.EXP_TITLE)
            self.set_admins([self.OWNER_EMAIL])

            # run batch job
            self.process_and_flush_pending_tasks()
            exp_jobs_test.ModifiedExpSummaryAggregator.start_computation()
            self.assertGreaterEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(self.count_jobs_in_taskqueue(), 0)
            # need to stop computation here, otherwise cannot start new
            # computation below. todo: undertand this better
            exp_jobs_test.ModifiedExpSummaryAggregator.stop_computation(owner_id)

            response_dict = self.get_json(feconf.GALLERY_DATA_URL)
            self.assertEqual({
                'is_admin': False,
                'is_moderator': False,
                'is_super_admin': False,
                'private': [],
                'beta': [],
                'released': [],
            }, response_dict)

            # Load a public demo exploration.
            exp_services.load_demo('0')

            # run batch job
            exp_jobs_test.ModifiedExpSummaryAggregator.start_computation()
            self.assertGreaterEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(self.count_jobs_in_taskqueue(), 0)
            exp_jobs_test.ModifiedExpSummaryAggregator.stop_computation(owner_id)

            response_dict = self.get_json(feconf.GALLERY_DATA_URL)
            self.assertEqual(response_dict['released'], [])
            self.assertEqual(len(response_dict['beta']), 1)
            self.assertDictContainsSubset({
                'id': '0',
                'category': 'Welcome',
                'title': 'Welcome to Oppia!',
                'language_code': 'en',
                'objective': 'become familiar with Oppia\'s capabilities',
                'status': rights_manager.EXPLORATION_STATUS_PUBLIC,
            }, response_dict['beta'][0])

            # Publicize the demo exploration.
            rights_manager.publicize_exploration(owner_id, '0')

            # run batch job
            exp_jobs_test.ModifiedExpSummaryAggregator.start_computation()
            self.assertGreaterEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            response_dict = self.get_json(feconf.GALLERY_DATA_URL)
            self.assertEqual(response_dict['beta'], [])
            self.assertEqual(len(response_dict['released']), 1)
            self.assertDictContainsSubset({
                'id': '0',
                'category': 'Welcome',
                'title': 'Welcome to Oppia!',
                'language_code': 'en',
                'objective': 'become familiar with Oppia\'s capabilities',
                'status': rights_manager.EXPLORATION_STATUS_PUBLICIZED,
            }, response_dict['released'][0])

    def test_new_exploration_ids(self):
        """Test generation of exploration ids."""
        self.register_editor(self.EDITOR_EMAIL)
        self.login(self.EDITOR_EMAIL)

        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        csrf_token = self.get_csrf_token_from_response(response)
        EXP_A_DICT = {'title': 'A', 'category': 'Test Explorations'}
        exp_a_id = self.post_json(
            feconf.NEW_EXPLORATION_URL, EXP_A_DICT, csrf_token
        )[galleries.EXPLORATION_ID_KEY]
        self.assertEqual(len(exp_a_id), 12)

    def test_exploration_upload_button(self):
        """Test that the exploration upload button appears when appropriate."""
        self.register_editor('editor@example.com')
        self.login('editor@example.com')

        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(no=['Upload Existing Exploration'])

        config_services.set_property(
            feconf.ADMIN_COMMITTER_ID, 'allow_yaml_file_upload', True)

        response = self.testapp.get(feconf.GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain('Upload Existing Exploration')

        self.logout()
