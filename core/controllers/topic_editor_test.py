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

from core.domain import question_services
from core.domain import skill_services
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
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(self.skill_id, self.admin_id, 'Skill Description')
        self.topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.admin_id, 'Name', 'Description', [], [],
            [self.skill_id], [], 1)
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title',
            'subtopic_id': 1
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.admin_id, self.topic_id, changelist, 'Added subtopic.')


class TopicEditorStoryHandlerTest(BaseTopicEditorControllerTest):

    def test_story_creation(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)
            json_response = self.post_json(
                '%s/%s' % (feconf.TOPIC_EDITOR_STORY_URL, self.topic_id),
                {'title': 'Story title'},
                csrf_token=csrf_token)
            story_id = json_response['storyId']
            self.assertEqual(len(story_id), 12)
            self.assertIsNotNone(
                story_services.get_story_by_id(story_id, strict=False))
        self.logout()


class TopicEditorQuestionHandlerTest(BaseTopicEditorControllerTest):

    def test_question_creation(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)
            json_response = self.post_json(
                '%s/%s' % (feconf.TOPIC_EDITOR_QUESTION_URL, self.topic_id),
                {}, csrf_token=csrf_token)
            question_id = json_response['questionId']
            self.assertEqual(len(question_id), 12)
            self.assertIsNotNone(
                question_services.get_question_by_id(question_id, strict=False))
            self.logout()

            self.login(self.TOPIC_MANAGER_EMAIL)
            response = self.testapp.post(
                '%s/%s' % (feconf.TOPIC_EDITOR_QUESTION_URL, self.topic_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            topic_services.assign_role(
                self.admin, self.topic_manager, topic_domain.ROLE_MANAGER,
                self.topic_id)

            self.login(self.TOPIC_MANAGER_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)
            json_response = self.post_json(
                '%s/%s' % (feconf.TOPIC_EDITOR_QUESTION_URL, self.topic_id),
                {}, csrf_token=csrf_token)
            new_question_id = json_response['questionId']
            self.assertEqual(len(new_question_id), 12)
            self.assertIsNotNone(
                question_services.get_question_by_id(
                    new_question_id, strict=False))
            self.logout()

            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.post(
                '%s/%s' % (feconf.TOPIC_EDITOR_QUESTION_URL, self.topic_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
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

            # Check that topic managers not assigned to this topic can
            # access its subtopic pages.
            self.login(self.TOPIC_MANAGER_EMAIL)
            json_response = self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 1))
            self.assertEqual('', json_response['subtopic_page']['html_data'])
            self.logout()

            topic_services.assign_role(
                self.admin, self.topic_manager, topic_domain.ROLE_MANAGER,
                self.topic_id)

            # Check that topic managers can access the subtopic page.
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

            # Check that admins can access the editor page.
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            self.assertEqual(response.status_int, 200)
            self.logout()

            # Check that any topic manager can access the editor page.
            self.login(self.TOPIC_MANAGER_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            self.assertEqual(response.status_int, 200)
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
            self.assertEqual(self.topic_id, json_response['topic_dict']['id'])
            self.assertEqual(
                'Skill Description',
                json_response['skill_id_to_description_dict'][self.skill_id])
            self.logout()

    def test_editable_topic_handler_put(self):
        # Check that admins can edit a topic.
        change_cmd = {
            'version': 2,
            'commit_message': 'Some changes and added a subtopic.',
            'topic_and_subtopic_page_change_dicts': [{
                'change_affects_subtopic_page': False,
                'cmd': 'update_topic_property',
                'property_name': 'name',
                'old_value': '',
                'new_value': 'A new name'
            }, {
                'change_affects_subtopic_page': True,
                'cmd': 'update_subtopic_page_property',
                'property_name': 'html_data',
                'old_value': '',
                'subtopic_id': 1,
                'new_value': '<p>New Data</p>'
            }, {
                'change_affects_subtopic_page': False,
                'cmd': 'add_subtopic',
                'subtopic_id': 2,
                'title': 'Title2'
            }, {
                'change_affects_subtopic_page': True,
                'cmd': 'update_subtopic_page_property',
                'property_name': 'html_data',
                'old_value': '',
                'new_value': '<p>New Value</p>',
                'subtopic_id': 2
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
            self.assertEqual(self.topic_id, json_response['topic_dict']['id'])
            self.assertEqual('A new name', json_response['topic_dict']['name'])
            self.assertEqual(2, len(json_response['topic_dict']['subtopics']))
            self.assertEqual(
                'Skill Description',
                json_response['skill_id_to_description_dict'][self.skill_id])

            # Test if the corresponding subtopic pages were created.
            json_response = self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 1))
            self.assertEqual(
                '<p>New Data</p>', json_response['subtopic_page']['html_data'])
            json_response = self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 2))
            self.assertEqual(
                '<p>New Value</p>', json_response['subtopic_page']['html_data'])
            self.logout()

            # Test that any topic manager cannot edit the topic.
            self.login(self.TOPIC_MANAGER_EMAIL)
            json_response = self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
                change_cmd, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)
            self.logout()

            # Check that non-admins and non-topic managers cannot edit a topic.
            json_response = self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
                change_cmd, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)

    def test_editable_topic_handler_put_for_assigned_topic_manager(self):
        change_cmd = {
            'version': 2,
            'commit_message': 'Some changes and added a subtopic.',
            'topic_and_subtopic_page_change_dicts': [{
                'change_affects_subtopic_page': False,
                'cmd': 'update_topic_property',
                'property_name': 'name',
                'old_value': '',
                'new_value': 'A new name'
            }, {
                'change_affects_subtopic_page': True,
                'cmd': 'update_subtopic_page_property',
                'property_name': 'html_data',
                'old_value': '',
                'subtopic_id': 1,
                'new_value': '<p>New Data</p>'
            }, {
                'change_affects_subtopic_page': False,
                'cmd': 'add_subtopic',
                'subtopic_id': 2,
                'title': 'Title2'
            }, {
                'change_affects_subtopic_page': True,
                'cmd': 'update_subtopic_page_property',
                'property_name': 'html_data',
                'old_value': '',
                'new_value': '<p>New Value</p>',
                'subtopic_id': 2
            }]
        }
        # Assign the topic manager to the topic.
        topic_services.assign_role(
            self.admin, self.topic_manager, topic_domain.ROLE_MANAGER,
            self.topic_id)

        self.login(self.TOPIC_MANAGER_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)
            # Check that the topic manager can edit the topic now.
            json_response = self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
                change_cmd, csrf_token=csrf_token)
            self.assertEqual(self.topic_id, json_response['topic_dict']['id'])
            self.assertEqual('A new name', json_response['topic_dict']['name'])
            self.assertEqual(2, len(json_response['topic_dict']['subtopics']))
            self.logout()

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
        """Test the assign topic manager role for a topic functionality."""
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


class TopicRightsHandlerTest(BaseTopicEditorControllerTest):

    def test_get_topic_rights(self):
        """Test the get topic rights functionality."""
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Test whether admin can access topic rights.
            json_response = self.get_json(
                '%s/%s' % (
                    feconf.TOPIC_RIGHTS_URL_PREFIX, self.topic_id))
            self.assertEqual(json_response['published'], False)
            self.assertEqual(json_response['can_publish_topic'], True)
            self.logout()

            self.login(self.NEW_USER_EMAIL)
            # Test that other users cannot access topic rights.
            response = self.testapp.get(
                '%s/%s' % (
                    feconf.TOPIC_RIGHTS_URL_PREFIX, self.topic_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()


class TopicPublishHandlerTest(BaseTopicEditorControllerTest):

    def test_publish_and_unpublish_topic(self):
        """Test the publish and unpublish functionality."""
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)
            # Test whether admin can publish and unpublish a topic.
            json_response = self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
                {'publish_status': True}, csrf_token=csrf_token)
            topic_rights = topic_services.get_topic_rights(self.topic_id)
            self.assertTrue(topic_rights.topic_is_published)

            json_response = self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
                {'publish_status': False}, csrf_token=csrf_token)
            topic_rights = topic_services.get_topic_rights(self.topic_id)
            self.assertFalse(topic_rights.topic_is_published)
            self.logout()

            self.login(self.NEW_USER_EMAIL)
            # Test that other users cannot access topic rights.
            json_response = self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
                {'publish_status': False}, csrf_token=csrf_token,
                expect_errors=True, expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)
            self.logout()
