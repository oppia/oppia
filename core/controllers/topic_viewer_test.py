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

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import question_services
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import translation_domain
from core.domain import user_services
from core.tests import test_utils


class BaseTopicViewerControllerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.topic_id = 'topic'
        self.story_id_1 = 'story_id_1'
        self.story_id_2 = 'story_id_2'
        self.skill_id_1 = skill_services.get_new_skill_id()
        self.skill_id_2 = skill_services.get_new_skill_id()

        self.story_1 = story_domain.Story.create_default_story(
            self.story_id_1, 'story_title', 'description', self.topic_id,
            'story-frag-one')
        self.story_1.description = 'story_description'

        self.story_2 = story_domain.Story.create_default_story(
            self.story_id_2, 'story_title', 'description', self.topic_id,
            'story-frag-two')
        self.story_2.description = 'story_description'

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'public_topic_name', 'public', 'description',
            'fragm')
        self.topic.uncategorized_skill_ids.append(self.skill_id_1)
        self.topic.subtopics.append(topic_domain.Subtopic(
            1, 'subtopic_name', [self.skill_id_2], 'image.svg',
            constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
            'subtopic-name'))
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
        self.topic.meta_tag_content = 'topic meta content'
        self.topic.page_title_fragment_for_web = 'topic page title'
        self.topic.skill_ids_for_diagnostic_test = [self.skill_id_2]

        topic_services.save_new_topic(self.admin_id, self.topic)
        story_services.save_new_story(self.admin_id, self.story_1)
        story_services.save_new_story(self.admin_id, self.story_2)

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

    def test_any_user_can_access_topic_viewer_page(self) -> None:
        self.get_html_response('/learn/staging/%s' % 'public')

    def test_accessibility_of_unpublished_topic_viewer_page(self) -> None:
        topic = topic_domain.Topic.create_default_topic(
            'topic_id_1', 'private_topic_name',
            'private_topic_name', 'description', 'fragm')
        topic.thumbnail_filename = 'Image.svg'
        topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        topic.url_fragment = 'private'
        topic_services.save_new_topic(self.admin_id, topic)

        self.get_html_response(
            '/learn/staging/%s' % 'private',
            expected_status_int=404)
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.get_html_response('/learn/staging/%s' % 'private')
        self.logout()


class TopicPageDataHandlerTests(
        BaseTopicViewerControllerTests, test_utils.EmailTestBase):

    def test_get_with_no_user_logged_in(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s' % (feconf.TOPIC_DATA_HANDLER, 'public'))
        expected_dict = {
            'topic_name': 'public_topic_name',
            'topic_id': self.topic_id,
            'canonical_story_dicts': [{
                'id': self.story_1.id,
                'title': self.story_1.title,
                'description': self.story_1.description,
                'node_titles': [],
                'thumbnail_filename': None,
                'thumbnail_bg_color': None,
                'story_is_published': True,
                'completed_node_titles': [],
                'url_fragment': 'story-frag-one',
                'all_node_dicts': []
            }],
            'additional_story_dicts': [{
                'id': self.story_2.id,
                'title': self.story_2.title,
                'description': self.story_2.description,
                'node_titles': [],
                'thumbnail_filename': None,
                'thumbnail_bg_color': None,
                'story_is_published': True,
                'completed_node_titles': [],
                'url_fragment': 'story-frag-two',
                'all_node_dicts': []
            }],
            'uncategorized_skill_ids': [self.skill_id_1],
            'subtopics': [{
                u'thumbnail_filename': u'image.svg',
                u'thumbnail_bg_color': u'#FFFFFF',
                u'thumbnail_size_in_bytes': 21131,
                u'skill_ids': [self.skill_id_2],
                u'id': 1,
                u'title': u'subtopic_name',
                u'url_fragment': u'subtopic-name'}],
            'degrees_of_mastery': {
                self.skill_id_1: None,
                self.skill_id_2: None
            },
            'skill_descriptions': {
                self.skill_id_1: 'Skill Description 1',
                self.skill_id_2: 'Skill Description 2'
            },
            'practice_tab_is_displayed': False
        }
        self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_with_user_logged_in(self) -> None:
        skill_services.delete_skill(self.admin_id, self.skill_id_1)
        self.login(self.NEW_USER_EMAIL)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 0)
            json_response = self.get_json(
                '%s/staging/%s' % (feconf.TOPIC_DATA_HANDLER, 'public'))
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            expected_email_html_body = (
                'The deleted skills: %s are still'
                ' present in topic with id %s' % (
                    self.skill_id_1, self.topic_id))
            self.assertEqual(len(messages), 1)
            self.assertIn(expected_email_html_body, messages[0].html)
            expected_dict = {
                'topic_name': 'public_topic_name',
                'topic_id': self.topic_id,
                'canonical_story_dicts': [{
                    'id': self.story_1.id,
                    'title': self.story_1.title,
                    'description': self.story_1.description,
                    'node_titles': [],
                    'thumbnail_filename': None,
                    'thumbnail_bg_color': None,
                    'story_is_published': True,
                    'completed_node_titles': [],
                    'url_fragment': 'story-frag-one',
                    'all_node_dicts': []
                }],
                'additional_story_dicts': [{
                    'id': self.story_2.id,
                    'title': self.story_2.title,
                    'description': self.story_2.description,
                    'node_titles': [],
                    'thumbnail_filename': None,
                    'thumbnail_bg_color': None,
                    'story_is_published': True,
                    'completed_node_titles': [],
                    'url_fragment': 'story-frag-two',
                    'all_node_dicts': []
                }],
                'uncategorized_skill_ids': [self.skill_id_1],
                'subtopics': [{
                    u'thumbnail_filename': u'image.svg',
                    u'thumbnail_bg_color': u'#FFFFFF',
                    u'thumbnail_size_in_bytes': 21131,
                    u'skill_ids': [self.skill_id_2],
                    u'id': 1,
                    u'title': u'subtopic_name',
                    u'url_fragment': u'subtopic-name'}],
                'degrees_of_mastery': {
                    self.skill_id_1: 0.3,
                    self.skill_id_2: 0.5
                },
                'skill_descriptions': {
                    self.skill_id_2: 'Skill Description 2'
                },
                'practice_tab_is_displayed': False
            }
            self.assertDictContainsSubset(expected_dict, json_response)

        self.logout()

    def test_get_with_meta_tag_content(self) -> None:
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'topic_with_meta',
            'topic-with-meta', 'description', 'fragm')
        self.topic.meta_tag_content = 'meta content'
        topic_services.save_new_topic(self.admin_id, self.topic)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        json_response = self.get_json(
            '%s/staging/%s' % (feconf.TOPIC_DATA_HANDLER, 'topic-with-meta'))
        expected_meta_tag_content = 'meta content'
        self.assertEqual(
            expected_meta_tag_content, json_response['meta_tag_content'])

    def test_get_with_page_title_fragment_for_web(self) -> None:
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'topic_with_page_title_fragment_for_web',
            'topic-page-title', 'description', 'topic page title')
        topic_services.save_new_topic(self.admin_id, self.topic)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        json_response = self.get_json(
            '%s/staging/%s' % (
                feconf.TOPIC_DATA_HANDLER, 'topic-page-title'))
        expected_page_title_fragment_for_web = 'topic page title'
        self.assertEqual(
            expected_page_title_fragment_for_web,
            json_response['page_title_fragment_for_web'])

    def test_get_with_no_skills_ids(self) -> None:
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'topic_with_no_skills',
            'topic-with-no-skills', 'description', 'fragm')
        topic_services.save_new_topic(self.admin_id, self.topic)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        json_response = self.get_json(
            '%s/staging/%s' % (
                feconf.TOPIC_DATA_HANDLER, 'topic-with-no-skills'))
        expected_dict = {
            'topic_name': 'topic_with_no_skills',
            'topic_id': self.topic_id,
            'canonical_story_dicts': [],
            'additional_story_dicts': [],
            'uncategorized_skill_ids': [],
            'subtopics': [],
            'degrees_of_mastery': {},
            'skill_descriptions': {},
            'practice_tab_is_displayed': False
        }
        self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_with_five_or_more_questions(self) -> None:
        number_of_questions = 6
        self.topic_id = 'new_topic'
        self.skill_id_1 = skill_services.get_new_skill_id()
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'new_topic', 'new-topic', 'description',
            'fragm')
        self.topic.uncategorized_skill_ids.append(self.skill_id_1)
        self.topic.thumbnail_filename = 'Image.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.topic.practice_tab_is_displayed = True
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = [self.skill_id_2]
        subtopic_1.url_fragment = 'sub-one-frag'
        self.topic.subtopics = [subtopic_1]
        self.topic.next_subtopic_id = 2
        self.topic.skill_ids_for_diagnostic_test = [self.skill_id_2]
        topic_services.save_new_topic(self.admin_id, self.topic)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        self.save_new_skill(
            self.skill_id_1, self.admin_id, description='Skill Description 1')
        for index in range(number_of_questions):
            question_id = question_services.get_new_question_id()
            content_id_generator = translation_domain.ContentIdGenerator()
            default_dest_state_name = '%s' % index
            self.save_new_question(
                question_id, self.admin_id,
                self._create_valid_question_data(
                    default_dest_state_name, content_id_generator),
                [self.skill_id_1],
                content_id_generator.next_content_id_index)
            question_services.create_new_question_skill_link(
                self.admin_id, question_id, self.skill_id_1, 0.5)
        json_response = self.get_json(
            '%s/staging/%s' % (feconf.TOPIC_DATA_HANDLER, 'new-topic'))
        expected_dict = {
            'topic_name': 'new_topic',
            'topic_id': self.topic_id,
            'canonical_story_dicts': [],
            'additional_story_dicts': [],
            'uncategorized_skill_ids': [self.skill_id_1],
            'subtopics': [subtopic_1.to_dict()],
            'degrees_of_mastery': {
                self.skill_id_1: None,
                self.skill_id_2: None
            },
            'skill_descriptions': {
                self.skill_id_1: 'Skill Description 1'
            },
            'practice_tab_is_displayed': True
        }
        self.assertDictContainsSubset(expected_dict, json_response)
        self.logout()

    def test_get_with_twenty_or_more_questions(self) -> None:
        number_of_questions = 50
        self.topic_id = 'new_topic'
        self.skill_id_1 = skill_services.get_new_skill_id()
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'new_topic', 'new-topic', 'description',
            'fragm')
        self.topic.uncategorized_skill_ids.append(self.skill_id_1)
        self.topic.thumbnail_filename = 'Image.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.topic.practice_tab_is_displayed = True
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = [self.skill_id_2]
        subtopic_1.url_fragment = 'sub-one-frag'
        self.topic.subtopics = [subtopic_1]
        self.topic.next_subtopic_id = 2
        self.topic.skill_ids_for_diagnostic_test = [self.skill_id_2]
        topic_services.save_new_topic(self.admin_id, self.topic)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        self.save_new_skill(
            self.skill_id_1, self.admin_id, description='Skill Description 1')
        for index in range(number_of_questions):
            default_dest_state_name = '%s' % index
            question_id = question_services.get_new_question_id()
            content_id_generator = translation_domain.ContentIdGenerator()
            self.save_new_question(
                question_id, self.admin_id,
                self._create_valid_question_data(
                    default_dest_state_name, content_id_generator),
                [self.skill_id_1],
                content_id_generator.next_content_id_index)
            question_services.create_new_question_skill_link(
                self.admin_id, question_id, self.skill_id_1, 0.5)
        json_response = self.get_json(
            '%s/staging/%s' % (feconf.TOPIC_DATA_HANDLER, 'new-topic'))
        expected_dict = {
            'topic_name': 'new_topic',
            'topic_id': self.topic_id,
            'canonical_story_dicts': [],
            'additional_story_dicts': [],
            'uncategorized_skill_ids': [self.skill_id_1],
            'subtopics': [subtopic_1.to_dict()],
            'degrees_of_mastery': {
                self.skill_id_1: None,
                self.skill_id_2: None
            },
            'skill_descriptions': {
                self.skill_id_1: 'Skill Description 1',
            },
            'practice_tab_is_displayed': True
        }
        self.assertDictContainsSubset(expected_dict, json_response)
        self.logout()

    def test_get_with_twenty_or_more_questions_with_multiple_skills(
        self
    ) -> None:
        number_of_skills = 3
        number_of_questions = [1, 2, 2]
        self.topic_id = 'new_topic'
        skill_ids = (
            [skill_services.get_new_skill_id() for _ in range(
                number_of_skills)])
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'new_topic', 'new-topic', 'description', 'fragm')
        for index in range(number_of_skills):
            self.topic.uncategorized_skill_ids.append(skill_ids[index])
        self.topic.thumbnail_filename = 'Image.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.topic.practice_tab_is_displayed = True
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.topic.subtopics = [subtopic_1]
        self.topic.next_subtopic_id = 2
        self.topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.admin_id, self.topic)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        for i in range(number_of_skills):
            self.save_new_skill(
                skill_ids[i], self.admin_id,
                description='Skill Description')
        for i in range(number_of_skills):
            for j in range(number_of_questions[i]):
                question_id = question_services.get_new_question_id()
                content_id_generator = translation_domain.ContentIdGenerator()
                default_dest_state_name = '%s' % j
                self.save_new_question(
                    question_id, self.admin_id,
                    self._create_valid_question_data(
                        default_dest_state_name, content_id_generator),
                    [skill_ids[i]],
                    content_id_generator.next_content_id_index)
                question_services.create_new_question_skill_link(
                    self.admin_id, question_id, skill_ids[i], 0.5)

        json_response = self.get_json(
            '%s/staging/%s' % (feconf.TOPIC_DATA_HANDLER, 'new-topic'))
        expected_dict = {
            'topic_name': 'new_topic',
            'topic_id': self.topic_id,
            'canonical_story_dicts': [],
            'additional_story_dicts': [],
            'practice_tab_is_displayed': True
        }
        self.assertDictContainsSubset(expected_dict, json_response)
        self.logout()

    def test_get_with_lesser_questions_with_fifty_or_more_skills(
        self
    ) -> None:
        number_of_skills = 60
        number_of_questions = [0] * 60
        number_of_questions[46] = 2
        self.topic_id = 'new_topic'
        skill_ids = (
            [skill_services.get_new_skill_id() for _ in range(
                number_of_skills)])
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'new_topic', 'new-topic', 'description', 'fragm')
        for index in range(number_of_skills):
            self.topic.uncategorized_skill_ids.append(skill_ids[index])
        self.topic.thumbnail_filename = 'Image.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.topic.practice_tab_is_displayed = False
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.topic.subtopics = [subtopic_1]
        self.topic.next_subtopic_id = 2
        self.topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.admin_id, self.topic)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        for i in range(number_of_skills):
            self.save_new_skill(
                skill_ids[i], self.admin_id,
                description='Skill Description')
        for i in range(number_of_skills):
            for j in range(number_of_questions[i]):
                default_dest_state_name = '%s' % j
                question_id = question_services.get_new_question_id()
                content_id_generator = translation_domain.ContentIdGenerator()
                self.save_new_question(
                    question_id, self.admin_id,
                    self._create_valid_question_data(
                        default_dest_state_name, content_id_generator),
                    [skill_ids[i]],
                    content_id_generator.next_content_id_index)
                question_services.create_new_question_skill_link(
                    self.admin_id, question_id, skill_ids[i], 0.5)

        json_response = self.get_json(
            '%s/staging/%s' % (feconf.TOPIC_DATA_HANDLER, 'new-topic'))
        expected_dict = {
            'topic_name': 'new_topic',
            'topic_id': self.topic_id,
            'canonical_story_dicts': [],
            'additional_story_dicts': [],
            'practice_tab_is_displayed': False
        }
        self.assertDictContainsSubset(expected_dict, json_response)
        self.logout()

    def test_get_with_more_questions_with_fifty_or_more_skills(self) -> None:
        number_of_skills = 60
        number_of_questions = [0] * 60
        number_of_questions[46] = 2
        number_of_questions[20] = 3
        number_of_questions[29] = 10
        self.topic_id = 'new_topic'
        skill_ids = (
            [skill_services.get_new_skill_id() for _ in range(
                number_of_skills)])
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'new_topic', 'new-topic', 'description', 'fragm')
        for index in range(number_of_skills):
            self.topic.uncategorized_skill_ids.append(skill_ids[index])
        self.topic.thumbnail_filename = 'Image.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.topic.practice_tab_is_displayed = True
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.topic.subtopics = [subtopic_1]
        self.topic.next_subtopic_id = 2
        self.topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.admin_id, self.topic)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        for i in range(number_of_skills):
            self.save_new_skill(
                skill_ids[i], self.admin_id,
                description='Skill Description')
        for i in range(number_of_skills):
            for j in range(number_of_questions[i]):
                default_dest_state_name = '%s' % j
                question_id = question_services.get_new_question_id()
                content_id_generator = translation_domain.ContentIdGenerator()
                self.save_new_question(
                    question_id, self.admin_id,
                    self._create_valid_question_data(
                        default_dest_state_name, content_id_generator),
                    [skill_ids[i]],
                    content_id_generator.next_content_id_index)
                question_services.create_new_question_skill_link(
                    self.admin_id, question_id, skill_ids[i], 0.5)

        json_response = self.get_json(
            '%s/staging/%s' % (feconf.TOPIC_DATA_HANDLER, 'new-topic'))
        expected_dict = {
            'topic_name': 'new_topic',
            'topic_id': self.topic_id,
            'canonical_story_dicts': [],
            'additional_story_dicts': [],
            'practice_tab_is_displayed': True
        }
        self.assertDictContainsSubset(expected_dict, json_response)
        self.logout()
