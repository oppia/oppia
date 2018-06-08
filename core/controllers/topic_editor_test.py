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
from core.domain import topic_domain
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
            self.topic_id, self.admin_id, 'Name', 'Description', [], [], [],
            [], 1)
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title'
        })]
        topic_services.update_topic(
            self.admin_id, self.topic_id, changelist, 'Added subtopic.')


class NewStoryHandlerTest(BaseTopicEditorControllerTest):

    def test_story_creation(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)
            json_response = self.post_json(
                '%s/%s' % (feconf.NEW_STORY_URL, self.topic_id),
                {'title': 'Story title'},
                csrf_token=csrf_token)
            topic = topic_services.get_topic_by_id(self.topic_id)
            story_id = json_response['storyId']
            self.assertEqual(len(story_id), 12)
            self.assertEqual(topic.canonical_story_ids, [story_id])
            self.assertIsNotNone(
                story_services.get_story_by_id(story_id, strict=False))
        self.logout()


class SubtopicPageEditorTest(BaseTopicEditorControllerTest):

    def test_editable_subtopic_page_get(self):
        # Check that non-admins and non-topic managers cannot access the
        # editable subtopic data.
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 1),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            # Check that topic managers not assigned to this topic cannot
            # access its subtopics.
            self.login(self.TOPIC_MANAGER_EMAIL)
            response = self.testapp.get(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 1),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            topic_services.assign_role(
                self.admin, self.topic_manager, topic_domain.ROLE_MANAGER,
                self.topic_id)

            # Check that topic managers assigned to this topic can access its
            # subtopics.
            self.login(self.TOPIC_MANAGER_EMAIL)
            json_response = self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 1))
            self.assertEqual('', json_response['subtopic_page']['html_data'])
            self.logout()

            # Check that admins can access the editable subtopic data.
            self.login(self.ADMIN_EMAIL)
            json_response = self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 1))
            self.assertEqual('', json_response['subtopic_page']['html_data'])
            self.logout()

    def test_editable_subtopic_page_put(self):
        # Check that admins can edit a topic.
        change_cmd = {
            'version': 1,
            'commit_message': 'Updated html data.',
            'change_dicts': [{
                'cmd': 'update_subtopic_page_property',
                'property_name': 'html_data',
                'old_value': '',
                'new_value': '<p>New Data</p>'
            }]
        }
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)

            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 1),
                change_cmd, csrf_token=csrf_token)
            self.assertTrue(json_response['updated_subtopic_page'])
            self.logout()

            # Check that topic managers of that haven't been assigned this
            # topic cannot edit its subtopic.
            self.login(self.TOPIC_MANAGER_EMAIL)
            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 1),
                change_cmd, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)
            self.logout()

            # Check that topic managers of that have been assigned this
            # topic can edit its subtopic.
            topic_services.assign_role(
                self.admin, self.topic_manager, topic_domain.ROLE_MANAGER,
                self.topic_id)

            self.login(self.TOPIC_MANAGER_EMAIL)
            change_cmd['version'] = 2
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)
            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 1),
                change_cmd, csrf_token=csrf_token)
            self.assertTrue(json_response['updated_subtopic_page'])
            self.logout()

            # Check that anyone else cannot edit a topic.
            self.login(self.NEW_USER_EMAIL)
            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 1),
                change_cmd, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)
            self.logout()


class TopicEditorTest(BaseTopicEditorControllerTest):

    def test_access_topic_editor_page(self):
        """Test access to editor pages for the sample topic."""

        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that non-admin and topic_manager cannot access the editor
            # page.
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            # Check that admins can access and edit in the editor page.
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            self.assertEqual(response.status_int, 200)
            self.logout()

            # Assign TOPIC_MANAGER_USERNAME as a topic_manager for topic_id.
            topic_services.assign_role(
                self.admin, self.topic_manager, topic_domain.ROLE_MANAGER,
                self.topic_id)
            # Check that a topic manager for a topic can access and edit in the
            # editor page.
            self.login(self.TOPIC_MANAGER_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            self.assertEqual(response.status_int, 200)
            self.logout()

            # Create a new topic, and assign another user as its topic manager.
            topic_id_2 = topic_services.get_new_topic_id()
            self.save_new_topic(
                topic_id_2, self.admin_id, 'Name', 'Description',
                [], [], [], [], 1)
            self.signup('topicmanager2@example.com', 'topicmanager2')
            topic_manager_id_2 = self.get_user_id_from_email(
                'topicmanager2@example.com')
            self.set_topic_managers(['topicmanager2'])
            topic_manager_2 = user_services.UserActionsInfo(
                topic_manager_id_2)
            topic_services.assign_role(
                self.admin, topic_manager_2, topic_domain.ROLE_MANAGER,
                topic_id_2)

            # Verify that the second topic manager can edit their
            # assigned topic.
            self.login('topicmanager2@example.com')
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, topic_id_2))
            self.assertEqual(response.status_int, 200)
            self.logout()

            # Check that a topic manager for one topic cannot edit the other
            # one and vice-versa.
            self.login(self.TOPIC_MANAGER_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, topic_id_2),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()
            self.login('topicmanager2@example.com')
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

    def test_editable_topic_handler_get(self):
        # Check that non-admins cannot access the editable topic data.
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            # Check that admins can access the editable topic data.
            self.login(self.ADMIN_EMAIL)

            json_response = self.get_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id))
            self.assertEqual(self.topic_id, json_response['topic']['id'])
            self.logout()

    def test_editable_topic_handler_put(self):
        # Check that admins can edit a topic.
        change_cmd = {
            'version': 2,
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
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
                change_cmd, csrf_token=csrf_token)
            self.assertEqual(self.topic_id, json_response['topic']['id'])
            self.assertEqual('A new name', json_response['topic']['name'])
            self.logout()

            # Check that non-admins cannot edit a topic.
            json_response = self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
                change_cmd, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)

    def test_editable_topic_handler_delete(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that admins can delete a topic.
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.delete(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id))
            self.assertEqual(response.status_int, 200)
            self.logout()

            # Check that non-admins cannot delete a topic.
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.delete(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()


class TopicManagerRightsHandlerTest(BaseTopicEditorControllerTest):

    def test_assign_topic_manager_role(self):
        """Test the assign topic manager role for a topic functionality.
        """
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)

            # Test for when assignee does not have sufficient rights to become a
            # manager for a topic.
            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.TOPIC_MANAGER_RIGHTS_URL_PREFIX, self.topic_id,
                    self.new_user_id),
                {}, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)

            # Test for valid case.
            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.TOPIC_MANAGER_RIGHTS_URL_PREFIX, self.topic_id,
                    self.topic_manager_id),
                {}, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=200)
            self.assertEqual(json_response['role_updated'], True)
            self.logout()

            # Test for when committer doesn't have sufficient rights to assign
            # someone as manager.
            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.TOPIC_MANAGER_RIGHTS_URL_PREFIX, self.topic_id,
                    self.new_user_id),
                {}, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)
