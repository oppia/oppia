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

"""Tests for the collection editor page."""

from core.domain import collection_services
from core.domain import collection_domain
from core.domain import config_domain
from core.domain import rights_manager
from core.tests import test_utils
import feconf


class BaseCollectionEditorControllerTest(test_utils.GenericTestBase):

    CAN_EDIT_STR = 'GLOBALS.canEdit = JSON.parse(\'true\');'
    CANNOT_EDIT_STR = 'GLOBALS.canEdit = JSON.parse(\'false\');'

    def setUp(self):
        """Completes the sign-up process for self.EDITOR_EMAIL."""
        super(BaseCollectionEditorControllerTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

        self.json_dict = {
            'version' : 1,
            'commit_message' : 'changed title',
            'change_list' : [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'A new title'
            }]
        }

    def assert_can_edit(self, response_body):
        """Returns True if the response body indicates that the collection is
        editable.
        """
        self.assertIn(self.CAN_EDIT_STR, response_body)
        self.assertNotIn(self.CANNOT_EDIT_STR, response_body)

    def assert_cannot_edit(self, response_body):
        """Returns True if the response body indicates that the collection is
        not editable.
        """
        self.assertIn(self.CANNOT_EDIT_STR, response_body)
        self.assertNotIn(self.CAN_EDIT_STR, response_body)


class CollectionEditorTest(BaseCollectionEditorControllerTest):
    COLLECTION_ID = '0'

    def setUp(self):
        super(CollectionEditorTest, self).setUp()

        collection_services.load_demo(self.COLLECTION_ID)
        rights_manager.release_ownership_of_collection(
            feconf.SYSTEM_COMMITTER_ID, self.COLLECTION_ID)

    def test_access_collection_editor_page(self):
        """Test access to editor pages for the sample collection."""
        whitelisted_usernames = [self.EDITOR_USERNAME]
        self.set_config_property(
            config_domain.WHITELISTED_COLLECTION_EDITOR_USERNAMES,
            whitelisted_usernames)

        # Check that it is possible to access a page with specific version
        # number.
        response = self.testapp.get(
            '%s/%s?v=1' % (feconf.COLLECTION_DATA_URL_PREFIX,
                           self.COLLECTION_ID))
        self.assertEqual(response.status_int, 200)
        self.assertIn('Introduction to Collections in Oppia', response.body)

        # Check that non-editors cannot access the editor page. This is due
        # to them not being whitelisted.
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_EDITOR_URL_PREFIX,
                       self.COLLECTION_ID))
        self.assertEqual(response.status_int, 302)

        # Check that whitelisted users can access and edit in the editor page.
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_EDITOR_URL_PREFIX,
                       self.COLLECTION_ID))
        self.assertEqual(response.status_int, 200)
        self.assertIn('Introduction to Collections in Oppia', response.body)
        self.assert_can_edit(response.body)
        self.logout()

    def test_editable_collection_handler_get(self):
        whitelisted_usernames = [self.EDITOR_USERNAME]
        self.set_config_property(
            config_domain.WHITELISTED_COLLECTION_EDITOR_USERNAMES,
            whitelisted_usernames)

        # Check that non-editors cannot access the editor data handler.
        # This is due to them not being whitelisted.
        response = self.testapp.get(
            '%s/%s' % (feconf.EDITABLE_COLLECTION_DATA_URL_PREFIX,
                       self.COLLECTION_ID))
        self.assertEqual(response.status_int, 302)

        # Check that whitelisted users can access the data
        # from the editable_collection_data_handler
        self.login(self.EDITOR_EMAIL)

        json_response = self.get_json(
            '%s/%s' % (feconf.EDITABLE_COLLECTION_DATA_URL_PREFIX,
                       self.COLLECTION_ID))
        self.assertEqual(self.COLLECTION_ID, json_response['collection']['id'])
        self.assertEqual(
            'Introduction to Collections in Oppia',
            json_response['collection']['title'])
        self.logout()

    def test_editable_collection_handler_put_cannot_access(self):
        """Check that non-editors cannot access editable put handler"""
        whitelisted_usernames = [self.EDITOR_USERNAME, self.VIEWER_USERNAME]
        self.set_config_property(
            config_domain.WHITELISTED_COLLECTION_EDITOR_USERNAMES,
            whitelisted_usernames)

        # Assign viewer role to collection.
        rights_manager.create_new_collection_rights(
            self.COLLECTION_ID, self.owner_id)
        rights_manager.assign_role_for_collection(
            self.admin_id, self.COLLECTION_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        rights_manager.publish_collection(self.owner_id, self.COLLECTION_ID)

        self.login(self.VIEWER_EMAIL)

        # Call get handler to return the csrf token.
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX,
                       self.COLLECTION_ID))
        csrf_token = self.get_csrf_token_from_response(response)

        # Ensure viewers do not have access to the PUT Handler.
        json_response = self.put_json(
            '%s/%s' % (feconf.EDITABLE_COLLECTION_DATA_URL_PREFIX,
                       self.COLLECTION_ID),
            self.json_dict, expect_errors=True,
            csrf_token=csrf_token, expected_status_int=401)

        self.assertEqual(json_response['code'], 401)
        self.logout()

    def test_editable_collection_handler_put_can_access(self):
        """Check that editors can access put handler"""
        whitelisted_usernames = [self.EDITOR_USERNAME, self.VIEWER_USERNAME]
        self.set_config_property(
            config_domain.WHITELISTED_COLLECTION_EDITOR_USERNAMES,
            whitelisted_usernames)

        rights_manager.create_new_collection_rights(
            self.COLLECTION_ID, self.owner_id)
        rights_manager.assign_role_for_collection(
            self.admin_id, self.COLLECTION_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)
        rights_manager.publish_collection(self.owner_id, self.COLLECTION_ID)

        self.login(self.EDITOR_EMAIL)

        # Call get handler to return the csrf token.
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_URL_PREFIX,
                       self.COLLECTION_ID))
        csrf_token = self.get_csrf_token_from_response(response)

        json_response = self.put_json(
            '%s/%s' % (feconf.EDITABLE_COLLECTION_DATA_URL_PREFIX,
                       self.COLLECTION_ID),
            self.json_dict, csrf_token=csrf_token)

        self.assertEqual(self.COLLECTION_ID, json_response['collection']['id'])
        self.assertEqual(2, json_response['collection']['version'])
        self.assertEqual(
            'A new title', json_response['collection']['title'])
        self.logout()

    def test_collection_rights_handler(self):
        collection_id = 'collection_id'
        collection = collection_domain.Collection.create_default_collection(
            collection_id, 'A title', 'A Category', 'An Objective')
        collection_services.save_new_collection(self.owner_id, collection)

        # Check that collection is published correctly.
        rights_manager.assign_role_for_collection(
            self.owner_id, collection_id, self.editor_id,
            rights_manager.ROLE_EDITOR)
        rights_manager.publish_collection(self.owner_id, collection_id)

        # Check that collection cannot be unpublished by non admin.
        with self.assertRaisesRegexp(
            Exception, 'This collection cannot be unpublished.'):
            rights_manager.unpublish_collection(self.owner_id, collection_id)
        collection_rights = rights_manager.get_collection_rights(collection_id)
        self.assertEqual(collection_rights.status,
                         rights_manager.ACTIVITY_STATUS_PUBLIC)

        # Check that collection can be unpublished by admin.
        rights_manager.unpublish_collection(self.admin_id, collection_id)
        collection_rights = rights_manager.get_collection_rights(collection_id)
        self.assertEqual(collection_rights.status,
                         rights_manager.ACTIVITY_STATUS_PRIVATE)
