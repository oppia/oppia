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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

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

        self.save_new_skill(
            self.skill_id1, self.admin_id, description='Skill 1')
        self.save_new_skill(
            self.skill_id2, self.admin_id, description='Skill 2')

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'public_topic_name',
            'public-topic-name', 'description')
        self.topic.subtopics.append(topic_domain.Subtopic(
            1, 'subtopic_name', [self.skill_id1], 'image.svg',
            constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
            'subtopic-name-one'))
        self.topic.subtopics.append(topic_domain.Subtopic(
            2, 'subtopic_name_2', [self.skill_id2], 'image.svg',
            constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
            'subtopic-name-two'))
        self.topic.next_subtopic_id = 3
        self.topic.thumbnail_filename = 'Topic.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        topic_services.save_new_topic(self.admin_id, self.topic)

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id_1, 'private_topic_name',
            'private-topic-name', 'description')
        self.topic.thumbnail_filename = 'Topic.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        topic_services.save_new_topic(self.admin_id, self.topic)

        topic_services.publish_topic(self.topic_id, self.admin_id)


class PracticeSessionsPageTests(BasePracticeSessionsControllerTests):

    def test_any_user_can_access_practice_sessions_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '/learn/staging/public-topic-name/practice/session?'
                'selected_subtopic_ids=1,2')

    def test_no_user_can_access_unpublished_topic_practice_session_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '/learn/staging/private-topic-name/practice/session?'
                'selected_subtopic_ids=1,2',
                expected_status_int=404)

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_html_response(
                '/learn/staging/public-topic-name/practice/session?'
                'selected_subtopic_ids=1,2',
                expected_status_int=404)

    def test_get_fails_when_topic_doesnt_exist(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_html_response(
                '/learn/staging/invalid/practice/session?'
                'selected_subtopic_ids=1,2',
                expected_status_int=302)


class PracticeSessionsPageDataHandlerTests(BasePracticeSessionsControllerTests):

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_json(
                '%s/staging/%s?selected_subtopic_ids=1,2' % (
                    feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                    'public-topic-name'),
                expected_status_int=404)

    def test_get_fails_when_skill_ids_dont_exist(self):
        topic = topic_domain.Topic.create_default_topic(
            'topic_id_3', 'topic_without_skills', 'noskills', 'description')
        topic.thumbnail_filename = 'Topic.svg'
        topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        topic.subtopics.append(topic_domain.Subtopic(
            1, 'subtopic_name', ['non_existent_skill'], 'image.svg',
            constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
            'subtopic-name-three'))
        topic.next_subtopic_id = 2
        topic_services.save_new_topic(self.admin_id, topic)
        topic_services.publish_topic('topic_id_3', self.admin_id)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/staging/%s?selected_subtopic_ids=1' % (
                    feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                    'noskills'),
                expected_status_int=404)

    def test_any_user_can_access_practice_sessions_data(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            # Adding invalid subtopic IDs as well, which should get ignored.
            json_response = self.get_json(
                '%s/staging/%s?selected_subtopic_ids=1,2,3,4' % (
                    feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                    'public-topic-name'))
            self.assertEqual(json_response['topic_name'], 'public_topic_name')
            self.assertEqual(
                len(json_response['skill_ids_to_descriptions_map']), 2)
            self.assertEqual(
                json_response['skill_ids_to_descriptions_map']['skill_id_1'],
                'Skill 1')
            self.assertEqual(
                json_response['skill_ids_to_descriptions_map']['skill_id_2'],
                'Skill 2')

    def test_no_user_can_access_unpublished_topic_practice_session_data(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/staging/%s?selected_subtopic_ids=1,2' % (
                    feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                    'private-topic-name'),
                expected_status_int=404)

    def test_get_fails_when_topic_doesnt_exist(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/staging/%s?selected_subtopic_ids=1,2' % (
                    feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                    'invalid'),
                expected_status_int=404)
