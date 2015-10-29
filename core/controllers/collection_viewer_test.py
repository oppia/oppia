# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Tests for the page that allows learners to play through a collection."""

__author__ = 'Ben Henning'

from core.controllers import collection_viewer
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import rights_manager
from core.tests import test_utils
import feconf


class CollectionViewerPermissionsTest(test_utils.GenericTestBase):
    """Test permissions for learners to view collections."""

    COL_ID = 'cid'

    def setUp(self):
        """Before each individual test, create a dummy collection."""
        super(CollectionViewerPermissionsTest, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.EDITOR_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.VIEWER_ID = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.save_new_valid_collection(self.COL_ID, self.EDITOR_ID)

    def test_unpublished_collections_are_invisible_to_logged_out_users(self):
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COL_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_unpublished_collections_are_invisible_to_unconnected_users(self):
        self.login(self.VIEWER_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COL_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()

    def test_unpublished_collections_are_invisible_to_other_editors(self):
        OTHER_EDITOR_EMAIL = 'another@example.com'
        self.signup(OTHER_EDITOR_EMAIL, 'othereditorusername')

        other_collection = self.save_new_valid_collection(
          'cid2', OTHER_EDITOR_EMAIL)

        self.login(OTHER_EDITOR_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COL_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()

    def test_unpublished_collections_are_visible_to_their_editors(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COL_ID))
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_unpublished_collections_are_visible_to_admins(self):
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_EMAIL])
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COL_ID))
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_published_collections_are_visible_to_guests(self):
        rights_manager.publish_collection(self.EDITOR_ID, self.COL_ID)

        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COL_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 200)

    def test_published_collections_are_visible_to_anyone_logged_in(self):
        rights_manager.publish_collection(self.EDITOR_ID, self.COL_ID)

        self.login(self.VIEWER_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COL_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 200)


class CollectionViewerControllerEndToEndTests(test_utils.GenericTestBase):
    """Test the collection viewer controller using a sample collection."""

    def setUp(self):
        super(CollectionViewerControllerEndToEndTests, self).setUp()

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.VIEWER_ID = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_welcome_collection(self):
        """Test a learner's progression through the default collection."""
        collection_services.load_demo('0')

        # Login as the user who will play the collection.
        self.login(self.VIEWER_EMAIL)

        # Request the collection from the data handler.
        response_dict = self.get_json(
            '%s/0' % feconf.COLLECTION_DATA_URL_PREFIX)
        collection_dict = response_dict['collection']

        # Verify the collection was properly loaded.
        self.assertEqual(
            collection_dict['objective'],
            'To introduce collections using demo explorations.')
        self.assertEqual(collection_dict['category'], 'Welcome')
        self.assertEqual(
            collection_dict['title'], 'Welcome to Collections in Oppia!')

        # Verify there are 5 explorations in this collection, the initial
        # explorations to be completed, and that there are no explorations
        # currently completed within the context of this collection.
        self.assertEqual(len(collection_dict['nodes']), 5)
        self.assertEqual(collection_dict['next_exploration_ids'], ['0'])
        self.assertEqual(collection_dict['completed_exploration_ids'], [])

        # 'Complete' the first exploration. This should lead to 3 more being
        # suggested to the learner.
        collection_services.record_played_exploration_in_collection_context(
            self.VIEWER_ID, '0', '0')
        response_dict = self.get_json(
            '%s/0' % feconf.COLLECTION_DATA_URL_PREFIX)
        collection_dict = response_dict['collection']

        self.assertEqual(
            collection_dict['next_exploration_ids'], ['13', '4', '14'])
        self.assertEqual(collection_dict['completed_exploration_ids'], ['0'])

        # Completing the 'Solar System' exploration results in no branching.
        collection_services.record_played_exploration_in_collection_context(
            self.VIEWER_ID, '0', '13')
        response_dict = self.get_json(
            '%s/0' % feconf.COLLECTION_DATA_URL_PREFIX)
        collection_dict = response_dict['collection']

        self.assertEqual(
            collection_dict['next_exploration_ids'], ['4', '14'])
        self.assertEqual(
            collection_dict['completed_exploration_ids'], ['0', '13'])

        # Completing the 'About Oppia' exploration results in another
        # exploration being suggested.
        collection_services.record_played_exploration_in_collection_context(
            self.VIEWER_ID, '0', '14')
        response_dict = self.get_json(
            '%s/0' % feconf.COLLECTION_DATA_URL_PREFIX)
        collection_dict = response_dict['collection']

        self.assertEqual(
            collection_dict['next_exploration_ids'], ['4', '15'])
        self.assertEqual(
            collection_dict['completed_exploration_ids'], ['0', '13', '14'])

        # Completing all explorations should lead to no other suggestions.
        collection_services.record_played_exploration_in_collection_context(
            self.VIEWER_ID, '0', '15')
        collection_services.record_played_exploration_in_collection_context(
            self.VIEWER_ID, '0', '4')
        response_dict = self.get_json(
            '%s/0' % feconf.COLLECTION_DATA_URL_PREFIX)
        collection_dict = response_dict['collection']

        self.assertEqual(collection_dict['next_exploration_ids'], [])
        self.assertEqual(
            collection_dict['completed_exploration_ids'],
            ['0', '13', '14', '15', '4'])
