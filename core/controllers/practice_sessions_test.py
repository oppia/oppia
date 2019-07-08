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

"""Tests for the practice sessions page."""

from constants import constants
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class BasePracticeSessionsControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BasePracticeSessionsControllerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)

        self.topic_id = 'topic'
        self.topic_id_1 = 'topic1'
        self.skill_id1 = 'skill_id_1'
        self.skill_id2 = 'skill_id_2'

        self.save_new_skill(self.skill_id1, self.admin_id, 'Skill 1')
        self.save_new_skill(self.skill_id2, self.admin_id, 'Skill 2')

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'public_topic_name')
        self.topic.uncategorized_skill_ids.append(self.skill_id1)
        self.topic.subtopics.append(topic_domain.Subtopic(
            1, 'subtopic_name', [self.skill_id2]))
        self.topic.next_subtopic_id = 2
        topic_services.save_new_topic(self.admin_id, self.topic)

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id_1, 'private_topic_name')
        topic_services.save_new_topic(self.admin_id, self.topic)

        topic_services.publish_topic(self.topic_id, self.admin_id)


class PracticeSessionsPageTests(BasePracticeSessionsControllerTests):

    def test_any_user_can_access_practice_sessions_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s' % (
                    feconf.PRACTICE_SESSION_URL_PREFIX,
                    'public_topic_name'))


    def test_no_user_can_access_unpublished_topic_practice_session_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s' % (
                    feconf.PRACTICE_SESSION_URL_PREFIX, 'private_topic_name'),
                expected_status_int=404)


    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_html_response(
                '%s/%s' % (
                    feconf.PRACTICE_SESSION_URL_PREFIX,
                    'public_topic_name'),
                expected_status_int=404)

    def test_get_fails_when_topic_doesnt_exist(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_html_response(
                '%s/%s' % (
                    feconf.PRACTICE_SESSION_URL_PREFIX,
                    'non_existent_topic_name'),
                expected_status_int=404)


class PracticeSessionsPageDataHandlerTests(BasePracticeSessionsControllerTests):

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_json(
                '%s/%s' % (
                    feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                    'public_topic_name'),
                expected_status_int=404)

    def test_get_fails_when_skill_ids_dont_exist(self):
        topic = topic_domain.Topic.create_default_topic(
            'topic_id_3', 'topic_without_skills')
        topic.uncategorized_skill_ids.append('non_existent_skill')
        topic_services.save_new_topic(self.admin_id, topic)
        topic_services.publish_topic('topic_id_3', self.admin_id)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (
                    feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                    'topic_without_skills'),
                expected_status_int=404)


    def test_any_user_can_access_practice_sessions_data(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            json_response = self.get_json(
                '%s/%s' % (
                    feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                    'public_topic_name'))
            self.assertEqual(json_response['topic_name'], 'public_topic_name')
            self.assertEqual(len(json_response['skill_descriptions']), 2)
            self.assertEqual(
                json_response['skill_descriptions']['skill_id_1'],
                'Skill 1')
            self.assertEqual(
                json_response['skill_descriptions']['skill_id_2'],
                'Skill 2')

    def test_no_user_can_access_unpublished_topic_practice_session_data(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (
                    feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                    'private_topic_name'),
                expected_status_int=404)

    def test_get_fails_when_topic_doesnt_exist(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (
                    feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                    'non_existent_topic_name'),
                expected_status_int=404)
