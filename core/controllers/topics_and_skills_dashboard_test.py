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

"""Tests for the topics and skills dashboard page."""

from core.domain import skill_services
from core.domain import topic_services
from core.tests import test_utils
import feconf


class BaseTopicsAndSkillsDashboardTest(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseTopicsAndSkillsDashboardTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.TOPIC_MANAGER_EMAIL, self.TOPIC_MANAGER_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.topic_manager_id = self.get_user_id_from_email(
            self.TOPIC_MANAGER_EMAIL)
        self.new_user_id = self.get_user_id_from_email(
            self.NEW_USER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([self.TOPIC_MANAGER_USERNAME])
        self.topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.admin_id, 'Name', 'Description', [], [], [],
            [], 1)


class TopicsAndSkillsDashboardPageDataHandlerTest(
        BaseTopicsAndSkillsDashboardTest):

    def test_get(self):
        # Check that non-admins or non-topic managers cannot access the
        # topics and skills dashboard data.
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.admin_id, 'Description')
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(
                '%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD_DATA_URL,
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            # Check that admins can access the topics and skills dashboard data.
            self.login(self.ADMIN_EMAIL)
            json_response = self.get_json(
                '%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD_DATA_URL)
            self.assertEqual(len(json_response['topic_summary_dicts']), 1)
            self.assertEqual(
                json_response['topic_summary_dicts'][0]['can_edit_topic'],
                True)
            self.assertEqual(
                json_response['topic_summary_dicts'][0]['id'], self.topic_id)
            self.assertEqual(
                len(json_response['untriaged_skill_summary_dicts']), 1)
            self.assertEqual(
                json_response['untriaged_skill_summary_dicts'][0]['id'],
                skill_id)
            self.logout()

            # Check that topic managers can access the topics and skills
            # dashboard editable topic data.
            self.login(self.TOPIC_MANAGER_EMAIL)
            json_response = self.get_json(
                '%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD_DATA_URL)
            self.assertEqual(len(json_response['topic_summary_dicts']), 1)
            self.assertEqual(
                json_response['topic_summary_dicts'][0]['can_edit_topic'],
                False)
            self.assertEqual(
                json_response['topic_summary_dicts'][0]['id'], self.topic_id)
            self.assertEqual(
                json_response['topic_summary_dicts'][0]['id'], self.topic_id)
            self.assertEqual(
                len(json_response['untriaged_skill_summary_dicts']), 1)
            self.assertEqual(
                json_response['untriaged_skill_summary_dicts'][0]['id'],
                skill_id)
            self.logout()


class NewTopicHandlerTest(BaseTopicsAndSkillsDashboardTest):

    def test_topic_creation(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            json_response = self.post_json(
                '%s' % feconf.NEW_TOPIC_URL, {'name': 'Topic name'},
                csrf_token=csrf_token)
            topic_id = json_response['topicId']
            self.assertEqual(len(topic_id), 12)
            self.assertIsNotNone(
                topic_services.get_topic_by_id(topic_id, strict=False))
        self.logout()


class NewSkillHandlerTest(BaseTopicsAndSkillsDashboardTest):

    def test_skill_creation(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            json_response = self.post_json(
                '%s' % feconf.NEW_SKILL_URL,
                {'description': 'Skill Description'}, csrf_token=csrf_token)
            skill_id = json_response['skillId']
            self.assertEqual(len(skill_id), 12)
            self.assertIsNotNone(
                skill_services.get_skill_by_id(skill_id, strict=False))
            self.logout()

    def test_skill_creation_in_invalid_topic(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            json_response = self.post_json(
                '%s' % feconf.NEW_SKILL_URL,
                {'description': 'Skill Description', 'topic_id': 'topic'},
                csrf_token=csrf_token, expect_errors=True,
                expected_status_int=400)
            self.assertEqual(json_response['status_code'], 400)
            self.logout()

    def test_skill_creation_in_valid_topic(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            json_response = self.post_json(
                '%s' % feconf.NEW_SKILL_URL,
                {'description': 'Skill Description', 'topic_id': self.topic_id},
                csrf_token=csrf_token)
            skill_id = json_response['skillId']
            self.assertEqual(len(skill_id), 12)
            self.assertIsNotNone(
                skill_services.get_skill_by_id(skill_id, strict=False))
            topic = topic_services.get_topic_by_id(self.topic_id)
            self.assertEqual(topic.uncategorized_skill_ids, [skill_id])
            self.logout()
