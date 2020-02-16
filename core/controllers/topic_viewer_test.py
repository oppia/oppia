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

"""Tests for the topic viewer page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseTopicViewerControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseTopicViewerControllerTests, self).setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)

        self.topic_id = 'topic'
        self.story_id = 'story'
        self.topic_id_1 = 'topic1'
        self.skill_id_1 = skill_services.get_new_skill_id()
        self.skill_id_2 = skill_services.get_new_skill_id()

        self.story = story_domain.Story.create_default_story(
            self.story_id, 'story_title', self.topic_id_1)
        self.story.description = 'story_description'

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'public_topic_name', 'abbrev')
        self.topic.uncategorized_skill_ids.append(self.skill_id_1)
        self.topic.subtopics.append(topic_domain.Subtopic(
            1, 'subtopic_name', [self.skill_id_2]))
        self.topic.next_subtopic_id = 2
        self.topic.canonical_story_references.append(
            topic_domain.StoryReference.create_default_story_reference(
                self.story_id))
        topic_services.save_new_topic(self.admin_id, self.topic)
        story_services.save_new_story(self.admin_id, self.story)

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id_1, 'private_topic_name', 'abbrev')
        topic_services.save_new_topic(self.admin_id, self.topic)

        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id, self.admin_id)

        self.save_new_skill(
            self.skill_id_1, self.user_id, description='Skill Description 1')
        self.save_new_skill(
            self.skill_id_2, self.user_id, description='Skill Description 2')
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_1, 0.3)
        skill_services.create_user_skill_mastery(
            self.user_id, self.skill_id_2, 0.5)


class TopicViewerPageTests(BaseTopicViewerControllerTests):

    def test_any_user_can_access_topic_viewer_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s' % (feconf.TOPIC_VIEWER_URL_PREFIX, 'public_topic_name'))


    def test_accessibility_of_unpublished_topic_viewer_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s' % (
                    feconf.TOPIC_VIEWER_URL_PREFIX, 'private_topic_name'),
                expected_status_int=404)
            self.login(self.ADMIN_EMAIL)
            self.get_html_response(
                '%s/%s' % (
                    feconf.TOPIC_VIEWER_URL_PREFIX, 'private_topic_name'))
            self.logout()


    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_html_response(
                '%s/%s' % (feconf.TOPIC_VIEWER_URL_PREFIX, 'public_topic_name'),
                expected_status_int=404)


class TopicPageDataHandlerTests(BaseTopicViewerControllerTests):

    def test_get_with_no_user_logged_in(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            json_response = self.get_json(
                '%s/%s' % (feconf.TOPIC_DATA_HANDLER, 'public_topic_name'))
            expected_dict = {
                'topic_name': 'public_topic_name',
                'topic_id': self.topic_id,
                'canonical_story_dicts': [{
                    'id': self.story.id,
                    'title': self.story.title,
                    'description': self.story.description
                }],
                'additional_story_dicts': [],
                'uncategorized_skill_ids': [self.skill_id_1],
                'subtopics': [{
                    u'skill_ids': [self.skill_id_2],
                    u'id': 1,
                    u'title': u'subtopic_name'}],
                'degrees_of_mastery': {
                    self.skill_id_1: None,
                    self.skill_id_2: None
                },
                'skill_descriptions': {
                    self.skill_id_1: 'Skill Description 1',
                    self.skill_id_2: 'Skill Description 2'
                }
            }
            self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_with_user_logged_in(self):
        skill_services.delete_skill(self.admin_id, self.skill_id_1)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.login(self.NEW_USER_EMAIL)
            with self.swap(feconf, 'CAN_SEND_EMAILS', True):
                messages = self.mail_stub.get_sent_messages(
                    to=feconf.ADMIN_EMAIL_ADDRESS)
                self.assertEqual(len(messages), 0)
                json_response = self.get_json(
                    '%s/%s' % (feconf.TOPIC_DATA_HANDLER, 'public_topic_name'))
                messages = self.mail_stub.get_sent_messages(
                    to=feconf.ADMIN_EMAIL_ADDRESS)
                expected_email_html_body = (
                    'The deleted skills: %s are still'
                    ' present in topic with id %s' % (
                        self.skill_id_1, self.topic_id))
                self.assertEqual(len(messages), 1)
                self.assertIn(
                    expected_email_html_body,
                    messages[0].html.decode())
                expected_dict = {
                    'topic_name': 'public_topic_name',
                    'topic_id': self.topic_id,
                    'canonical_story_dicts': [{
                        'id': self.story.id,
                        'title': self.story.title,
                        'description': self.story.description
                    }],
                    'additional_story_dicts': [],
                    'uncategorized_skill_ids': [self.skill_id_1],
                    'subtopics': [{
                        u'skill_ids': [self.skill_id_2],
                        u'id': 1,
                        u'title': u'subtopic_name'}],
                    'degrees_of_mastery': {
                        self.skill_id_1: 0.3,
                        self.skill_id_2: 0.5
                    },
                    'skill_descriptions': {
                        self.skill_id_1: None,
                        self.skill_id_2: 'Skill Description 2'
                    }
                }
                self.assertDictContainsSubset(expected_dict, json_response)

            self.logout()

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_json(
                '%s/%s' % (feconf.TOPIC_DATA_HANDLER, 'public_topic_name'),
                expected_status_int=404)
