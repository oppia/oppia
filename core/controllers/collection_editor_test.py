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

__author__ = 'Abraham Mgowano'

from core.domain import collection_services
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

        self.set_admins([self.ADMIN_EMAIL])

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

        # Check that it is possible to access a page with specific version
        # number.
        response = self.testapp.get(
            '%s/%s?v=1' % (feconf.COLLECTION_DATA_URL_PREFIX,
                           self.COLLECTION_ID))
        self.assertEqual(response.status_int, 200)
        self.assertIn('Introduction to Collections in Oppia', response.body)

        # Check that non-editors can access, but not edit, the editor page.
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_EDITOR_URL_PREFIX,
                       self.COLLECTION_ID))
        self.assertEqual(response.status_int, 200)
        self.assertIn('Introduction to Collections in Oppia', response.body)
        self.assert_cannot_edit(response.body)

        # Check that it is now possible to access and edit the editor page.
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.COLLECTION_EDITOR_URL_PREFIX,
                       self.COLLECTION_ID))
        self.assertEqual(response.status_int, 200)
        self.assertIn('Introduction to Collections in Oppia', response.body)
        self.assert_can_edit(response.body)
        self.logout()
