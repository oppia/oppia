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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_fetchers
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseCollectionEditorControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for self.EDITOR_EMAIL."""
        super(BaseCollectionEditorControllerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.json_dict = {
            'version': 1,
            'commit_message': 'changed title',
            'change_list': [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'A new title'
            }]
        }


class CollectionEditorTests(BaseCollectionEditorControllerTests):
    COLLECTION_ID = '0'

    def setUp(self):
        super(CollectionEditorTests, self).setUp()
        system_user = user_services.get_system_user()

        collection_services.load_demo(self.COLLECTION_ID)
        rights_manager.release_ownership_of_collection(
            system_user, self.COLLECTION_ID)

    def test_access_collection_editor_page(self):
        """Test access to editor pages for the sample collection."""
        whitelisted_usernames = [self.EDITOR_USERNAME]
        self.set_collection_editors(whitelisted_usernames)

        # Check that it is possible to access a page.
        self.get_json(
            '%s/%s' % (
                feconf.COLLECTION_DATA_URL_PREFIX,
                self.COLLECTION_ID))

        # Check that non-editors cannot access the editor page. This is due
        # to them not being whitelisted.
        self.get_html_response(
            '%s/%s' % (
                feconf.COLLECTION_EDITOR_URL_PREFIX,
                self.COLLECTION_ID), expected_status_int=302)

        # Check that whitelisted users can access and edit in the editor page.
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(
            '%s/%s' % (
                feconf.COLLECTION_EDITOR_URL_PREFIX,
                self.COLLECTION_ID))

        json_response = self.get_json(
            '%s/%s' % (feconf.COLLECTION_RIGHTS_PREFIX, self.COLLECTION_ID))
        self.assertTrue(json_response['can_edit'])
        self.logout()

    def test_editable_collection_handler_get(self):
        whitelisted_usernames = [self.EDITOR_USERNAME]
        self.set_collection_editors(whitelisted_usernames)

        # Check that non-editors cannot access the editor data handler.
        # This is due to them not being whitelisted.
        self.get_json(
            '%s/%s' % (
                feconf.COLLECTION_EDITOR_DATA_URL_PREFIX,
                self.COLLECTION_ID), expected_status_int=401)

        # Check that whitelisted users can access the data
        # from the editable_collection_data_handler.
        self.login(self.EDITOR_EMAIL)

        json_response = self.get_json(
            '%s/%s' % (
                feconf.COLLECTION_EDITOR_DATA_URL_PREFIX,
                self.COLLECTION_ID))
        self.assertEqual(self.COLLECTION_ID, json_response['collection']['id'])
        self.logout()

    def test_editable_collection_handler_put_with_invalid_payload_version(self):
        whitelisted_usernames = [self.EDITOR_USERNAME, self.VIEWER_USERNAME]
        self.set_collection_editors(whitelisted_usernames)

        rights_manager.create_new_collection_rights(
            self.COLLECTION_ID, self.owner_id)
        rights_manager.assign_role_for_collection(
            self.admin, self.COLLECTION_ID, self.editor_id,
            rights_domain.ROLE_EDITOR)
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)

        self.login(self.EDITOR_EMAIL)

        # Call get handler to return the csrf token.
        csrf_token = self.get_new_csrf_token()

        # Raises error as version is None.
        json_response = self.put_json(
            '%s/%s' % (
                feconf.COLLECTION_EDITOR_DATA_URL_PREFIX,
                self.COLLECTION_ID),
            {'version': None}, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Invalid POST request: a version must be specified.')

        # Raises error as version from payload does not match the collection
        # version.
        json_response = self.put_json(
            '%s/%s' % (
                feconf.COLLECTION_EDITOR_DATA_URL_PREFIX,
                self.COLLECTION_ID),
            {'version': 2}, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Trying to update version 1 of collection from version 2, '
            'which is too old. Please reload the page and try again.')

        self.logout()

    def test_editable_collection_handler_put_cannot_access(self):
        """Check that non-editors cannot access editable put handler."""
        whitelisted_usernames = [self.EDITOR_USERNAME, self.VIEWER_USERNAME]
        self.set_collection_editors(whitelisted_usernames)

        # Assign viewer role to collection.
        rights_manager.create_new_collection_rights(
            self.COLLECTION_ID, self.owner_id)
        rights_manager.assign_role_for_collection(
            self.admin, self.COLLECTION_ID, self.viewer_id,
            rights_domain.ROLE_VIEWER)
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)

        self.login(self.VIEWER_EMAIL)

        # Call get handler to return the csrf token.
        csrf_token = self.get_new_csrf_token()

        # Ensure viewers do not have access to the PUT Handler.
        self.put_json(
            '%s/%s' % (
                feconf.COLLECTION_EDITOR_DATA_URL_PREFIX,
                self.COLLECTION_ID),
            self.json_dict, csrf_token=csrf_token,
            expected_status_int=401)

        self.logout()

    def test_editable_collection_handler_put_can_access(self):
        """Check that editors can access put handler."""
        whitelisted_usernames = [self.EDITOR_USERNAME, self.VIEWER_USERNAME]
        self.set_collection_editors(whitelisted_usernames)

        rights_manager.create_new_collection_rights(
            self.COLLECTION_ID, self.owner_id)
        rights_manager.assign_role_for_collection(
            self.admin, self.COLLECTION_ID, self.editor_id,
            rights_domain.ROLE_EDITOR)
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)

        self.login(self.EDITOR_EMAIL)

        # Call get handler to return the csrf token.
        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s/%s' % (
                feconf.COLLECTION_EDITOR_DATA_URL_PREFIX,
                self.COLLECTION_ID),
            self.json_dict, csrf_token=csrf_token)

        self.assertEqual(self.COLLECTION_ID, json_response['collection']['id'])
        self.assertEqual(2, json_response['collection']['version'])

        self.logout()

    def test_cannot_put_long_commit_message(self):
        """Check that putting a long commit message is denied."""
        rights_manager.create_new_collection_rights(
            self.COLLECTION_ID, self.owner_id)
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)

        self.login(self.OWNER_EMAIL)

        long_message_dict = self.json_dict.copy()
        long_message_dict['commit_message'] = (
            'a' * (constants.MAX_COMMIT_MESSAGE_LENGTH + 1))

        # Call get handler to return the csrf token.
        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s/%s' % (
                feconf.COLLECTION_EDITOR_DATA_URL_PREFIX,
                self.COLLECTION_ID),
            long_message_dict, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Commit messages must be at most 375 characters long.'
        )

        self.logout()

    def test_collection_rights_handler(self):
        collection_id = 'collection_id'
        collection = collection_domain.Collection.create_default_collection(
            collection_id, title='A title',
            category='A Category', objective='An Objective')
        collection_services.save_new_collection(self.owner_id, collection)

        # Check that collection is published correctly.
        rights_manager.assign_role_for_collection(
            self.owner, collection_id, self.editor_id,
            rights_domain.ROLE_EDITOR)
        rights_manager.publish_collection(self.owner, collection_id)

        # Check that collection cannot be unpublished by non admin.
        with self.assertRaisesRegexp(
            Exception, 'This collection cannot be unpublished.'):
            rights_manager.unpublish_collection(self.owner, collection_id)
        collection_rights = rights_manager.get_collection_rights(collection_id)
        self.assertEqual(
            collection_rights.status,
            rights_domain.ACTIVITY_STATUS_PUBLIC)

        # Check that collection can be unpublished by admin.
        rights_manager.unpublish_collection(self.admin, collection_id)
        collection_rights = rights_manager.get_collection_rights(collection_id)
        self.assertEqual(
            collection_rights.status,
            rights_domain.ACTIVITY_STATUS_PRIVATE)

    def test_get_collection_rights(self):
        whitelisted_usernames = [self.OWNER_USERNAME]
        self.set_collection_editors(whitelisted_usernames)

        self.login(self.OWNER_EMAIL)

        collection_id = 'collection_id'
        collection = collection_domain.Collection.create_default_collection(
            collection_id, title='A title',
            category='A Category', objective='An Objective')
        collection_services.save_new_collection(self.owner_id, collection)

        # Check that collection is published correctly.
        rights_manager.publish_collection(self.owner, collection_id)

        json_response = self.get_json(
            '%s/%s' % (feconf.COLLECTION_RIGHTS_PREFIX, self.COLLECTION_ID))

        self.assertTrue(json_response['can_edit'])
        self.assertFalse(json_response['can_unpublish'])
        self.assertEqual(self.COLLECTION_ID, json_response['collection_id'])
        self.assertFalse(json_response['is_private'])
        self.logout()

    def test_can_not_publish_collection_with_invalid_payload_version(self):
        self.set_collection_editors([self.OWNER_USERNAME])

        # Login as owner and try to publish a collection with a public
        # exploration.
        self.login(self.OWNER_EMAIL)
        collection_id = collection_services.get_new_collection_id()
        exploration_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(exploration_id, self.owner_id)
        self.save_new_valid_collection(
            collection_id, self.owner_id, exploration_id=exploration_id)
        rights_manager.publish_exploration(self.owner, exploration_id)
        csrf_token = self.get_new_csrf_token()

        # Raises error as version is None.
        response_dict = self.put_json(
            '/collection_editor_handler/publish/%s' % collection_id,
            {'version': None}, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response_dict['error'],
            'Invalid POST request: a version must be specified.')

        # Raises error as version from payload does not match the collection
        # version.
        response_dict = self.put_json(
            '/collection_editor_handler/publish/%s' % collection_id,
            {'version': 2}, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response_dict['error'],
            'Trying to update version 1 of collection from version 2, '
            'which is too old. Please reload the page and try again.')

        self.logout()

    def test_can_not_unpublish_collection_with_invalid_payload_version(self):
        self.set_collection_editors([self.OWNER_USERNAME])

        # Login as owner and publish a collection with a public exploration.
        self.login(self.OWNER_EMAIL)
        collection_id = collection_services.get_new_collection_id()
        exploration_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(exploration_id, self.owner_id)
        self.save_new_valid_collection(
            collection_id, self.owner_id, exploration_id=exploration_id)
        rights_manager.publish_exploration(self.owner, exploration_id)
        collection = collection_services.get_collection_by_id(collection_id)
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/collection_editor_handler/publish/%s' % collection_id,
            {'version': collection.version},
            csrf_token=csrf_token)
        self.assertFalse(response_dict['is_private'])
        self.logout()

        # Login as admin and try to unpublish the collection.
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Raises error as version is None.
        response_dict = self.put_json(
            '/collection_editor_handler/unpublish/%s' % collection_id,
            {'version': None}, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response_dict['error'],
            'Invalid POST request: a version must be specified.')

        # Raises error as version from payload does not match the collection
        # version.
        response_dict = self.put_json(
            '/collection_editor_handler/unpublish/%s' % collection_id,
            {'version': 2}, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response_dict['error'],
            'Trying to update version 1 of collection from version 2, '
            'which is too old. Please reload the page and try again.')

        self.logout()

    def test_publish_unpublish_collection(self):
        self.set_collection_editors([self.OWNER_USERNAME])
        self.set_admins([self.ADMIN_USERNAME])

        # Login as owner and publish a collection with a public exploration.
        self.login(self.OWNER_EMAIL)
        collection_id = 'collection_id'
        exploration_id = 'exp_id'
        self.save_new_valid_exploration(exploration_id, self.owner_id)
        self.save_new_valid_collection(
            collection_id, self.owner_id, exploration_id=exploration_id)
        rights_manager.publish_exploration(self.owner, exploration_id)
        collection = collection_services.get_collection_by_id(collection_id)
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/collection_editor_handler/publish/%s' % collection_id,
            {'version': collection.version},
            csrf_token=csrf_token)
        self.assertFalse(response_dict['is_private'])
        self.logout()

        # Login as admin and unpublish the collection.
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/collection_editor_handler/unpublish/%s' % collection_id,
            {'version': collection.version},
            csrf_token=csrf_token)
        self.assertTrue(response_dict['is_private'])
        self.logout()
