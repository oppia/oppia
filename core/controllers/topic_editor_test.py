# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for the topic editor page."""

from core.domain import story_services
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseTopicEditorControllerTest(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseTopicEditorControllerTest, self).setUp()
        self.signup(self.TOPIC_MANAGER_EMAIL, self.TOPIC_MANAGER_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.topic_manager_id = self.get_user_id_from_email(
            self.TOPIC_MANAGER_EMAIL)
        self.new_user_id = self.get_user_id_from_email(
            self.NEW_USER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([self.TOPIC_MANAGER_USERNAME])

        self.topic_manager = user_services.UserActionsInfo(
            self.topic_manager_id)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.new_user = user_services.UserActionsInfo(self.new_user_id)
        self.topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.admin_id, 'Name', 'Description', [], [], [])


class NewStoryHandlerTest(BaseTopicEditorControllerTest):

    def test_story_creation(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)
            json_response = self.post_json(
                '%s' % feconf.NEW_STORY_URL, {'title': 'Story title'},
                csrf_token=csrf_token)
            story_id = json_response['storyId']
            self.assertEqual(len(story_id), 12)
            self.assertIsNotNone(
                story_services.get_story_by_id(story_id, strict=False))
        self.logout()


class TopicEditorTest(BaseTopicEditorControllerTest):

    def test_assign_topic_manager_role(self):
        """Test the assign topic manager role for a topic functionality.
        """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)

            # Test for when assignee does not have sufficient rights to become a
            # manager for a topic.
            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.TOPIC_MANAGER_PREFIX, self.topic_id,
                    self.new_user_id),
                {}, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)

            # Test for valid case.
            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.TOPIC_MANAGER_PREFIX, self.topic_id,
                    self.topic_manager_id),
                {}, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=200)
            self.assertEqual(json_response['role_updated'], True)
            self.logout()

            # Test for when committer doesn't have sufficient rights to assign
            # someone as manager.
            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.TOPIC_MANAGER_PREFIX, self.topic_id,
                    self.new_user_id),
                {}, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)

    def test_access_topic_editor_page(self):
        """Test access to editor pages for the sample topic."""

        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that non-admin and topic_manager cannot access the editor
            # page.
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            self.assertEqual(response.status_int, 302)

            # Check that topic admins can access and edit in the editor
            # page.
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            self.assertEqual(response.status_int, 200)
            self.logout()

    def test_editable_topic_handler_get(self):
        # Check that non-admins cannot access the editable topic data.
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (
                    feconf.EDITABLE_TOPIC_DATA_URL_PREFIX, self.topic_id))
            self.assertEqual(response.status_int, 302)

            # Check that admins can access the editable topic data.
            self.login(self.ADMIN_EMAIL)

            json_response = self.get_json(
                '%s/%s' % (
                    feconf.EDITABLE_TOPIC_DATA_URL_PREFIX, self.topic_id))
            self.assertEqual(self.topic_id, json_response['topic']['id'])
            self.logout()

    def test_editable_topic_handler_put(self):
        # Check that admins can edit a topic.
        change_cmd = {
            'version': 1,
            'commit_message': 'changed name',
            'change_dicts': [{
                'cmd': 'update_topic_property',
                'property_name': 'name',
                'old_value': '',
                'new_value': 'A new name'
            }]
        }
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)

            json_response = self.put_json(
                '%s/%s' % (
                    feconf.EDITABLE_TOPIC_DATA_URL_PREFIX, self.topic_id),
                change_cmd, csrf_token=csrf_token)
            self.assertEqual(self.topic_id, json_response['topic']['id'])
            self.assertEqual('A new name', json_response['topic']['name'])
            self.logout()

            # Check that non-admins cannot edit a topic.
            json_response = self.put_json(
                '%s/%s' % (
                    feconf.EDITABLE_TOPIC_DATA_URL_PREFIX, self.topic_id),
                change_cmd, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)

    def test_editable_topic_handler_delete(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that admins can delete a topic.
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.delete(
                '%s/%s' % (
                    feconf.EDITABLE_TOPIC_DATA_URL_PREFIX, self.topic_id))
            self.assertEqual(response.status_int, 200)
            self.logout()

            # Check that non-admins cannot delete a topic.
            response = self.testapp.delete(
                '%s/%s' % (
                    feconf.EDITABLE_TOPIC_DATA_URL_PREFIX, self.topic_id))
            self.assertEqual(response.status_int, 302)
