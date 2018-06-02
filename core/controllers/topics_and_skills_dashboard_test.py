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
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])


class NewTopicHandlerTest(BaseTopicsAndSkillsDashboardTest):

    def test_topic_creation(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD)
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
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD)
            csrf_token = self.get_csrf_token_from_response(response)

            json_response = self.post_json(
                '%s' % feconf.NEW_SKILL_URL, {}, csrf_token=csrf_token)
            skill_id = json_response['skillId']
            self.assertEqual(len(skill_id), 12)
            self.assertIsNotNone(
                skill_services.get_skill_by_id(skill_id, strict=False))
            self.logout()
