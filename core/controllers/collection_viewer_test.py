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

from core.domain import collection_services
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils
import feconf


class CollectionViewerPermissionsTest(test_utils.GenericTestBase):
    """Test permissions for learners to view collections."""

    COLLECTION_ID = 'cid'
    OTHER_EDITOR_EMAIL = 'another@example.com'

    def setUp(self):
        """Before each individual test, create a dummy collection."""
        super(CollectionViewerPermissionsTest, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.UserActionsInfo(self.editor_id)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.save_new_valid_collection(self.COLLECTION_ID, self.editor_id)

    def test_unpublished_collections_are_invisible_to_logged_out_users(self):
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COLLECTION_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_unpublished_collections_are_invisible_to_unconnected_users(self):
        self.login(self.NEW_USER_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COLLECTION_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()

    def test_unpublished_collections_are_invisible_to_other_editors(self):
        self.signup(self.OTHER_EDITOR_EMAIL, 'othereditorusername')

        self.save_new_valid_collection('cid2', self.OTHER_EDITOR_EMAIL)

        self.login(self.OTHER_EDITOR_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COLLECTION_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()

    def test_unpublished_collections_are_visible_to_their_editors(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COLLECTION_ID))
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_unpublished_collections_are_visible_to_admins(self):
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COLLECTION_ID))
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_published_collections_are_visible_to_logged_out_users(self):
        rights_manager.publish_collection(self.editor, self.COLLECTION_ID)

        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COLLECTION_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 200)

    def test_published_collections_are_visible_to_logged_in_users(self):
        rights_manager.publish_collection(self.editor, self.COLLECTION_ID)

        self.login(self.NEW_USER_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX, self.COLLECTION_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 200)


class CollectionViewerControllerEndToEndTests(test_utils.GenericTestBase):
    """Test the collection viewer controller using a sample collection."""

    def setUp(self):
        super(CollectionViewerControllerEndToEndTests, self).setUp()

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

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
            collection_dict['title'], 'Introduction to Collections in Oppia')

        # Verify there are 4 explorations in this collection, the initial
        # explorations to be completed, and that there are no explorations
        # currently completed within the context of this collection.
        self.assertEqual(len(collection_dict['nodes']), 4)

        playthrough_dict = collection_dict['playthrough_dict']
        self.assertEqual(playthrough_dict['next_exploration_id'], '19')
        self.assertEqual(playthrough_dict['completed_exploration_ids'], [])

        # 'Complete' the first exploration. This should lead to 1 new one being
        # suggested to the learner.
        collection_services.record_played_exploration_in_collection_context(
            self.viewer_id, '0', '19')
        response_dict = self.get_json(
            '%s/0' % feconf.COLLECTION_DATA_URL_PREFIX)
        collection_dict = response_dict['collection']

        playthrough_dict = collection_dict['playthrough_dict']
        self.assertEqual(
            playthrough_dict['next_exploration_id'], '20')
        self.assertEqual(playthrough_dict['completed_exploration_ids'], ['19'])

        # Completing the next exploration results in a third suggested exp.
        collection_services.record_played_exploration_in_collection_context(
            self.viewer_id, '0', '20')
        response_dict = self.get_json(
            '%s/0' % feconf.COLLECTION_DATA_URL_PREFIX)
        collection_dict = response_dict['collection']

        playthrough_dict = collection_dict['playthrough_dict']
        self.assertEqual(
            playthrough_dict['next_exploration_id'], '21')
        self.assertEqual(
            playthrough_dict['completed_exploration_ids'], ['19', '20'])

        # Completing the next exploration results in a fourth and final
        # suggested exp.
        collection_services.record_played_exploration_in_collection_context(
            self.viewer_id, '0', '21')
        response_dict = self.get_json(
            '%s/0' % feconf.COLLECTION_DATA_URL_PREFIX)
        collection_dict = response_dict['collection']

        playthrough_dict = collection_dict['playthrough_dict']
        self.assertEqual(
            playthrough_dict['next_exploration_id'], '0')
        self.assertEqual(
            playthrough_dict['completed_exploration_ids'], ['19', '20', '21'])

        # Completing the final exploration should result in no new suggestions.
        collection_services.record_played_exploration_in_collection_context(
            self.viewer_id, '0', '0')
        response_dict = self.get_json(
            '%s/0' % feconf.COLLECTION_DATA_URL_PREFIX)
        collection_dict = response_dict['collection']

        playthrough_dict = collection_dict['playthrough_dict']
        self.assertEqual(playthrough_dict['next_exploration_id'], None)
        self.assertEqual(
            playthrough_dict['completed_exploration_ids'],
            ['19', '20', '21', '0'])
