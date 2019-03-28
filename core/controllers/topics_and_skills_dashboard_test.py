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

from constants import constants
from core.domain import question_services
from core.domain import skill_services
from core.domain import topic_services
from core.tests import test_utils
import feconf


class BaseTopicsAndSkillsDashboardTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseTopicsAndSkillsDashboardTests, self).setUp()
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
        self.linked_skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.linked_skill_id, self.admin_id, 'Description 3')
        skill_services.publish_skill(self.linked_skill_id, self.admin_id)
        self.save_new_topic(
            self.topic_id, self.admin_id, 'Name', 'Description', [], [],
            [self.linked_skill_id], [], 1)

    def _get_csrf_token_for_put(self):
        """Gets the csrf token."""
        csrf_token = None
        url_prefix = feconf.TOPICS_AND_SKILLS_DASHBOARD_URL
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            response = self.get_html_response(url_prefix)
            csrf_token = self.get_csrf_token_from_response(response)
        return csrf_token


class TopicsAndSkillsDashboardPageTests(BaseTopicsAndSkillsDashboardTests):

    def test_get_fails_when_new_structures_not_enabled(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', False):
            url = feconf.TOPICS_AND_SKILLS_DASHBOARD_URL
            self.get_html_response(url, expected_status_int=404)
        self.logout()


class TopicsAndSkillsDashboardPageDataHandlerTests(
        BaseTopicsAndSkillsDashboardTests):

    def test_get(self):
        # Check that non-admins or non-topic managers cannot access the
        # topics and skills dashboard data.
        skill_id = skill_services.get_new_skill_id()
        skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.admin_id, 'Description')
        skill_services.publish_skill(skill_id, self.admin_id)
        self.save_new_skill(skill_id_2, self.admin_id, 'Description 2')
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            self.login(self.NEW_USER_EMAIL)
            self.get_json(
                feconf.TOPICS_AND_SKILLS_DASHBOARD_DATA_URL,
                expected_status_int=401)
            self.logout()

            # Check that admins can access the topics and skills dashboard data.
            self.login(self.ADMIN_EMAIL)
            json_response = self.get_json(
                feconf.TOPICS_AND_SKILLS_DASHBOARD_DATA_URL)
            self.assertEqual(len(json_response['topic_summary_dicts']), 1)
            self.assertEqual(
                json_response['topic_summary_dicts'][0]['can_edit_topic'],
                True)
            self.assertEqual(
                json_response['topic_summary_dicts'][0]['id'], self.topic_id)
            self.assertEqual(
                len(json_response['untriaged_skill_summary_dicts']), 1)
            self.assertEqual(
                len(json_response['mergeable_skill_summary_dicts']), 1)
            self.assertEqual(
                json_response['mergeable_skill_summary_dicts'][0]['id'],
                self.linked_skill_id)
            self.assertEqual(
                json_response['untriaged_skill_summary_dicts'][0]['id'],
                skill_id)
            self.assertEqual(
                len(json_response['unpublished_skill_summary_dicts']), 1)
            self.assertEqual(
                json_response['unpublished_skill_summary_dicts'][0]['id'],
                skill_id_2)
            self.assertEqual(
                json_response['can_delete_topic'], True)
            self.assertEqual(
                json_response['can_create_topic'], True)
            self.assertEqual(
                json_response['can_delete_skill'], True)
            self.assertEqual(
                json_response['can_create_skill'], True)
            self.logout()

            # Check that topic managers can access the topics and skills
            # dashboard editable topic data. Topic managers should not have
            # access to any unpublished skills.
            self.login(self.TOPIC_MANAGER_EMAIL)
            json_response = self.get_json(
                feconf.TOPICS_AND_SKILLS_DASHBOARD_DATA_URL)
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
                len(json_response['mergeable_skill_summary_dicts']), 1)
            self.assertEqual(
                json_response['mergeable_skill_summary_dicts'][0]['id'],
                self.linked_skill_id)
            self.assertEqual(
                json_response['untriaged_skill_summary_dicts'][0]['id'],
                skill_id)
            self.assertEqual(
                len(json_response['unpublished_skill_summary_dicts']), 0)
            self.assertEqual(
                json_response['can_delete_topic'], False)
            self.assertEqual(
                json_response['can_create_topic'], False)
            self.assertEqual(
                json_response['can_delete_skill'], False)
            self.assertEqual(
                json_response['can_create_skill'], False)
            self.logout()


class NewTopicHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def setUp(self):
        super(NewTopicHandlerTests, self).setUp()
        self.url = feconf.NEW_TOPIC_URL

    def test_topic_creation(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            csrf_token = self._get_csrf_token_for_put()

            json_response = self.post_json(
                self.url, {'name': 'Topic name'}, csrf_token=csrf_token)
            topic_id = json_response['topicId']
            self.assertEqual(len(topic_id), 12)
            self.assertIsNotNone(
                topic_services.get_topic_by_id(topic_id, strict=False))
        self.logout()

    def test_topic_creation_fails_when_new_structures_not_enabled(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', False):
            csrf_token = self._get_csrf_token_for_put()

            self.post_json(
                self.url, {}, csrf_token=csrf_token, expected_status_int=404)
        self.logout()


class NewSkillHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def setUp(self):
        super(NewSkillHandlerTests, self).setUp()
        self.url = feconf.NEW_SKILL_URL

    def test_skill_creation(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            csrf_token = self._get_csrf_token_for_put()

            json_response = self.post_json(
                self.url, {'description': 'Skill Description'},
                csrf_token=csrf_token)
            skill_id = json_response['skillId']
            self.assertEqual(len(skill_id), 12)
            self.assertIsNotNone(
                skill_services.get_skill_by_id(skill_id, strict=False))
            self.logout()

    def test_skill_creation_fails_when_new_structures_not_enabled(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', False):
            csrf_token = self._get_csrf_token_for_put()
            self.post_json(
                self.url, {}, csrf_token=csrf_token, expected_status_int=404)
        self.logout()

    def test_skill_creation_in_invalid_topic(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            csrf_token = self._get_csrf_token_for_put()
            payload = {
                'description': 'Skill Description',
                'linked_topic_ids': ['topic']
            }
            json_response = self.post_json(
                self.url, payload, csrf_token=csrf_token,
                expected_status_int=400)
            self.assertEqual(json_response['status_code'], 400)
            self.logout()

    def test_skill_creation_in_valid_topic(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            csrf_token = self._get_csrf_token_for_put()
            payload = {
                'description': 'Skill Description',
                'linked_topic_ids': [self.topic_id]
            }
            json_response = self.post_json(
                self.url, payload, csrf_token=csrf_token)
            skill_id = json_response['skillId']
            self.assertEqual(len(skill_id), 12)
            self.assertIsNotNone(
                skill_services.get_skill_by_id(skill_id, strict=False))
            topic = topic_services.get_topic_by_id(self.topic_id)
            self.assertEqual(
                topic.uncategorized_skill_ids,
                [self.linked_skill_id, skill_id])
            self.logout()


class MergeSkillHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def setUp(self):
        super(MergeSkillHandlerTests, self).setUp()
        self.url = feconf.MERGE_SKILLS_URL

        self.question_id = question_services.get_new_question_id()
        self.question = self.save_new_question(
            self.question_id, self.admin_id,
            self._create_valid_question_data('ABC'))
        question_services.create_new_question_skill_link(
            self.question_id, self.linked_skill_id, 0.5)

    def test_merge_skill(self):
        self.login(self.ADMIN_EMAIL)

        old_skill_id = self.linked_skill_id
        new_skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(new_skill_id, self.admin_id, 'Skill Description')
        old_links = question_services.get_question_skill_links_of_skill(
            old_skill_id, 'Old Description')
        new_links = question_services.get_question_skill_links_of_skill(
            new_skill_id, 'Skill Description')

        self.assertEqual(len(old_links), 1)
        self.assertEqual(old_links[0].skill_id, old_skill_id)
        self.assertEqual(len(new_links), 0)

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            csrf_token = self._get_csrf_token_for_put()
            payload = {
                'old_skill_id': old_skill_id,
                'new_skill_id': new_skill_id
            }
            json_response = self.post_json(
                self.url, payload, csrf_token=csrf_token)

            old_links = question_services.get_question_skill_links_of_skill(
                old_skill_id, 'Old Description')
            new_links = question_services.get_question_skill_links_of_skill(
                new_skill_id, 'Skill Description')

            self.assertEqual(json_response['merged_into_skill'], new_skill_id)
            self.assertEqual(len(old_links), 0)
            self.assertEqual(len(new_links), 1)
            self.assertEqual(new_links[0].skill_id, new_skill_id)

        self.logout()

    def test_merge_skill_fails_when_new_structures_not_enabled(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', False):
            csrf_token = self._get_csrf_token_for_put()
            self.post_json(
                self.url, {}, csrf_token=csrf_token, expected_status_int=404)
        self.logout()
