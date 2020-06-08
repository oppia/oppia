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
from core.domain import question_services
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf
import python_utils


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
        self.story_id_1 = 'story_id_1'
        self.story_id_2 = 'story_id_2'
        self.topic_id_1 = 'topic1'
        self.topic_id_2 = 'topic2'
        self.skill_id_1 = skill_services.get_new_skill_id()
        self.skill_id_2 = skill_services.get_new_skill_id()

        self.story_1 = story_domain.Story.create_default_story(
            self.story_id_1, 'story_title', self.topic_id_1)
        self.story_1.description = 'story_description'
        self.story_1.node_titles = []

        self.story_2 = story_domain.Story.create_default_story(
            self.story_id_2, 'story_title', self.topic_id_2)
        self.story_2.description = 'story_description'
        self.story_2.node_titles = []

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'public_topic_name', 'abbrev', 'description')
        self.topic.uncategorized_skill_ids.append(self.skill_id_1)
        self.topic.subtopics.append(topic_domain.Subtopic(
            1, 'subtopic_name', [self.skill_id_2], 'image.svg',
            constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0]))
        self.topic.next_subtopic_id = 2
        self.topic.thumbnail_filename = 'Image.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.topic.canonical_story_references.append(
            topic_domain.StoryReference.create_default_story_reference(
                self.story_id_1))
        self.topic.additional_story_references.append(
            topic_domain.StoryReference.create_default_story_reference(
                self.story_id_2))

        topic_services.save_new_topic(self.admin_id, self.topic)
        story_services.save_new_story(self.admin_id, self.story_1)
        story_services.save_new_story(self.admin_id, self.story_2)

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id_1, 'private_topic_name', 'abbrev', 'description')
        self.topic.thumbnail_filename = 'Image.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        topic_services.save_new_topic(self.admin_id, self.topic)

        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id_1, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id_2, self.admin_id)

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
                    'id': self.story_1.id,
                    'title': self.story_1.title,
                    'description': self.story_1.description,
                    'node_titles': self.story_1.node_titles,
                    'thumbnail_filename': None,
                    'thumbnail_bg_color': None,
                    'published': True
                }],
                'additional_story_dicts': [{
                    'id': self.story_2.id,
                    'title': self.story_2.title,
                    'description': self.story_2.description,
                    'node_titles': self.story_2.node_titles,
                    'thumbnail_filename': None,
                    'thumbnail_bg_color': None,
                    'published': True
                }],
                'uncategorized_skill_ids': [self.skill_id_1],
                'subtopics': [{
                    u'thumbnail_filename': u'image.svg',
                    u'thumbnail_bg_color': u'#FFFFFF',
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
                },
                'train_tab_should_be_displayed': False
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
                        'id': self.story_1.id,
                        'title': self.story_1.title,
                        'description': self.story_1.description,
                        'node_titles': self.story_1.node_titles,
                        'thumbnail_filename': None,
                        'thumbnail_bg_color': None,
                        'published': True
                    }],
                    'additional_story_dicts': [{
                        'id': self.story_2.id,
                        'title': self.story_2.title,
                        'description': self.story_2.description,
                        'node_titles': self.story_2.node_titles,
                        'thumbnail_filename': None,
                        'thumbnail_bg_color': None,
                        'published': True
                    }],
                    'uncategorized_skill_ids': [self.skill_id_1],
                    'subtopics': [{
                        u'thumbnail_filename': u'image.svg',
                        u'thumbnail_bg_color': u'#FFFFFF',
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
                    },
                    'train_tab_should_be_displayed': False
                }
                self.assertDictContainsSubset(expected_dict, json_response)

            self.logout()

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_json(
                '%s/%s' % (feconf.TOPIC_DATA_HANDLER, 'public_topic_name'),
                expected_status_int=404)

    def test_get_with_no_skills_ids(self):
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'topic_with_no_skills', 'abbrev', 'description')
        topic_services.save_new_topic(self.admin_id, self.topic)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            json_response = self.get_json(
                '%s/%s' % (feconf.TOPIC_DATA_HANDLER, 'topic_with_no_skills'))
            expected_dict = {
                'topic_name': 'topic_with_no_skills',
                'topic_id': self.topic_id,
                'canonical_story_dicts': [],
                'additional_story_dicts': [],
                'uncategorized_skill_ids': [],
                'subtopics': [],
                'degrees_of_mastery': {},
                'skill_descriptions': {},
                'train_tab_should_be_displayed': False
            }
            self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_with_five_or_more_questions(self):
        number_of_questions = 6
        self.topic_id = 'new_topic'
        self.skill_id_1 = skill_services.get_new_skill_id()
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'new_topic', 'abbrev', 'description')
        self.topic.uncategorized_skill_ids.append(self.skill_id_1)
        self.topic.thumbnail_filename = 'Image.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        topic_services.save_new_topic(self.admin_id, self.topic)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        self.save_new_skill(
            self.skill_id_1, self.admin_id, description='Skill Description 1')
        for index in python_utils.RANGE(number_of_questions):
            question_id = question_services.get_new_question_id()
            self.save_new_question(
                question_id, self.admin_id,
                self._create_valid_question_data(index), [self.skill_id_1])
            question_services.create_new_question_skill_link(
                self.admin_id, question_id, self.skill_id_1, 0.5)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            json_response = self.get_json(
                '%s/%s' % (feconf.TOPIC_DATA_HANDLER, 'new_topic'))
            expected_dict = {
                'topic_name': 'new_topic',
                'topic_id': self.topic_id,
                'canonical_story_dicts': [],
                'additional_story_dicts': [],
                'uncategorized_skill_ids': [self.skill_id_1],
                'subtopics': [],
                'degrees_of_mastery': {
                    self.skill_id_1: None
                },
                'skill_descriptions': {
                    self.skill_id_1: 'Skill Description 1'
                },
                'train_tab_should_be_displayed': True
            }
            self.assertDictContainsSubset(expected_dict, json_response)
        self.logout()
