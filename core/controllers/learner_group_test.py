# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Tests for the learner groups."""

from __future__ import annotations

import json

from core import feconf
from core.constants import constants
from core.domain import config_domain
from core.domain import config_services
from core.domain import learner_group_fetchers
from core.domain import learner_group_services
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import summary_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils


class CreateLearnerGroupHandlerTests(test_utils.GenericTestBase):

    USER1_EMAIL = 'user1@example.com'
    USER1_USERNAME = 'user1'
    USER2_EMAIL = 'user2@example.com'
    USER2_USERNAME = 'user2'

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.USER1_EMAIL, self.USER1_USERNAME)
        self.signup(self.USER2_EMAIL, self.USER2_USERNAME)

        self.facilitator_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

    def test_create_new_learner_group(self):
        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'group_title': 'Learner Group Title',
            'group_description': 'Learner Group Description',
            'invited_learner_usernames':
                [self.USER1_USERNAME, self.USER2_USERNAME],
            'subtopic_page_ids': ['subtopic_id_1', 'subtopic_id_2'],
            'story_ids': ['story_id_1', 'story_id_2']
        }
        response = self.post_json(
            '/create_learner_group_handler', payload, csrf_token=csrf_token)

        self.assertIsNotNone(response['id'])
        self.assertEqual(response['title'], 'Learner Group Title')
        self.assertEqual(response['description'], 'Learner Group Description')
        self.assertEqual(
            response['invited_learner_usernames'],
            [self.USER1_USERNAME, self.USER2_USERNAME])
        self.assertEqual(response['learner_usernames'], [])

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            response['id'])

        self.assertIsNotNone(learner_group)

        self.logout()


class LearnerGroupHandlerTests(test_utils.GenericTestBase):

    USER1_EMAIL = 'user1@example.com'
    USER1_USERNAME = 'user1'
    USER2_EMAIL = 'user2@example.com'
    USER2_USERNAME = 'user2'
    LEARNER_GROUP_ID = None

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.USER1_EMAIL, self.USER1_USERNAME)
        self.signup(self.USER2_EMAIL, self.USER2_USERNAME)

        self.user_id_1 = self.get_user_id_from_email(self.USER1_EMAIL)
        self.user_id_2 = self.get_user_id_from_email(self.USER2_EMAIL)
        self.facilitator_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        self.learner_group = learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Title', 'Description',
            [self.facilitator_id], [self.user_id_1],
            ['subtopic_id_1'], ['story_id_1'])

    def test_update_learner_group_as_facilitator(self):
        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'group_title': 'Updated Learner Group Title',
            'group_description': 'Learner Group Description',
            'learner_usernames': [],
            'invited_learner_usernames':
                [self.USER2_USERNAME],
            'subtopic_page_ids': ['subtopic_id_1', 'subtopic_id_2'],
            'story_ids': ['story_id_1', 'story_id_2']
        }
        response = self.put_json(
            '/update_learner_group_handler/%s' % (self.LEARNER_GROUP_ID),
            payload, csrf_token=csrf_token)

        self.assertEqual(response['id'], self.LEARNER_GROUP_ID)
        self.assertEqual(response['title'], 'Updated Learner Group Title')
        self.assertEqual(response['description'], 'Learner Group Description')
        self.assertEqual(
            response['invited_learner_usernames'], [self.USER2_USERNAME])
        self.assertEqual(response['learner_usernames'], [])
        self.assertEqual(
            response['subtopic_page_ids'], ['subtopic_id_1', 'subtopic_id_2'])
        self.assertEqual(response['story_ids'], ['story_id_1', 'story_id_2'])

        # Test bad learner group id.
        self.put_json(
            '/update_learner_group_handler/%s' % ('bad_learner_group_id'),
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.logout()

    def test_update_learner_group_as_invalid_facilitator(self):
        self.login(self.USER1_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'group_title': 'Updated Learner Group Title',
            'group_description': 'Learner Group Description',
            'learner_usernames': [],
            'invited_learner_usernames':
                [self.USER2_USERNAME],
            'subtopic_page_ids': ['subtopic_id_1', 'subtopic_id_2'],
            'story_ids': ['story_id_1', 'story_id_2']
        }
        response = self.put_json(
            '/update_learner_group_handler/%s' % (self.LEARNER_GROUP_ID),
            payload, csrf_token=csrf_token, expected_status_int=401)

        self.assertEqual(
            response['error'],
            'You are not a facilitator of this learner group.')

        self.logout()

    def test_delete_learner_group_as_facilitator(self):
        self.login(self.NEW_USER_EMAIL)

        response = self.delete_json(
            '/delete_learner_group_handler/%s' % (self.LEARNER_GROUP_ID))

        self.assertEqual(response['success'], True)

        # Test bad learner group id.
        self.delete_json(
            '/delete_learner_group_handler/%s' % ('bad_learner_group_id'),
            expected_status_int=400)

        self.logout()

    def test_delete_learner_group_as_invalid_facilitator(self):
        self.login(self.USER1_EMAIL)

        response = self.delete_json(
            '/delete_learner_group_handler/%s' % (self.LEARNER_GROUP_ID),
            expected_status_int=401)

        self.assertEqual(
            response['error'], 'You do not have the rights to delete this '
            'learner group as you are not its facilitator.')

        self.logout()


class FacilitatorDashboardHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)

        self.facilitator_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

    def test_get_teacher_dashboard_view(self):
        self.login(self.NEW_USER_EMAIL)

        # There are no learner groups created by new user yet.
        response = self.get_json('%s' % (feconf.FACILITATOR_DASHBOARD_HANDLER))

        self.assertEqual(response['learner_groups_list'], [])

        # Create a learner group.
        learner_group_id = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        learner_group = learner_group_services.create_learner_group(
            learner_group_id, 'Learner Group Title', 'Description',
            [self.facilitator_id], [], ['subtopic_id_1'], ['story_id_1'])

        response = self.get_json('%s' % (feconf.FACILITATOR_DASHBOARD_HANDLER))

        self.assertEqual(len(response['learner_groups_list']), 1)
        self.assertEqual(
            response['learner_groups_list'][0]['id'], learner_group.group_id)

        self.logout()


class LearnerGroupSearchSyllabusHandlerTests(test_utils.GenericTestBase):

    LEARNER_GROUP_ID = None
    LEARNER_ID = 'learner_user_1'
    TOPIC_ID_0 = 'topic_id_0'
    TOPIC_ID_1 = 'topic_id_1'
    STORY_ID_0 = 'story_id_0'
    STORY_ID_1 = 'story_id_1'

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.facilitator_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Name', 'Description',
            [self.facilitator_id], [self.LEARNER_ID], ['subtopic_id_1'],
            ['story_id_1'])

        # Set up topics, subtopics and stories for learner group syllabus.
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_0, 'Place Values', 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Naming Numbers', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.admin_id, topic)
        self.save_new_story(
            self.STORY_ID_0, self.admin_id, self.TOPIC_ID_0,
            'Story test 0')
        topic_services.add_canonical_story(
            self.admin_id, self.TOPIC_ID_0, self.STORY_ID_0)

        # Publish the topic and its stories.
        topic_services.publish_topic(self.TOPIC_ID_0, self.admin_id)
        topic_services.publish_story(
            self.TOPIC_ID_0, self.STORY_ID_0, self.admin_id)

        # Create another topic.
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_1, 'Negative Numbers', 'abbrev-one',
            'description 1', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Intro to negative numbers', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url-one')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']

        topic_services.save_new_topic(self.admin_id, topic)
        self.save_new_story(
            self.STORY_ID_1, self.admin_id, self.TOPIC_ID_1,
            'Story test 1')
        topic_services.add_canonical_story(
            self.admin_id, self.TOPIC_ID_1, self.STORY_ID_1)

        # Publish the topic and its stories.
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)

    def test_filter_learner_group_syllabus(self):
        self.login(self.NEW_USER_EMAIL)

        params = {
            'learner_group_id': self.LEARNER_GROUP_ID,
            'search_keyword': 'Place',
            'search_category': 'All',
            'search_language_code': constants.DEFAULT_LANGUAGE_CODE,
        }

        response = self.get_json(
            '/learner_group_search_syllabus_handler',
            params=params
        )

        self.assertEqual(response['learner_group_id'], self.LEARNER_GROUP_ID)
        story_summary_dicts = response['story_summary_dicts']
        self.assertEqual(len(story_summary_dicts), 1)
        self.assertEqual(story_summary_dicts[0]['id'], self.STORY_ID_0)
        self.assertEqual(story_summary_dicts[0]['title'], 'Story test 0')
        self.assertEqual(story_summary_dicts[0]['topic_name'], 'Place Values')

        subtopic_summary_dicts = response['subtopic_summary_dicts']
        self.assertEqual(len(subtopic_summary_dicts), 1)
        self.assertEqual(subtopic_summary_dicts[0]['subtopic_id'], 1)
        self.assertEqual(
            subtopic_summary_dicts[0]['subtopic_title'], 'Naming Numbers')
        self.assertEqual(
            subtopic_summary_dicts[0]['parent_topic_id'], self.TOPIC_ID_0)

        self.logout()


class ViewLearnerGroupInfoHandlerTests(test_utils.GenericTestBase):

    USER1_EMAIL = 'user1@example.com'
    USER1_USERNAME = 'user1'
    USER2_EMAIL = 'user2@example.com'
    USER2_USERNAME = 'user2'
    LEARNER_GROUP_ID = None

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.USER1_EMAIL, self.USER1_USERNAME)
        self.signup(self.USER2_EMAIL, self.USER2_USERNAME)

        self.user_id_1 = self.get_user_id_from_email(self.USER1_EMAIL)
        self.facilitator_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        self.learner_group = learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Title', 'Description',
            [self.facilitator_id], [self.user_id_1],
            ['subtopic_id_1'], ['story_id_1'])

    def test_facilitators_view_details_as_facilitator(self):
        self.login(self.NEW_USER_EMAIL)

        response = self.get_json(
            '/view_learner_group_info_handler/%s' % (
                self.LEARNER_GROUP_ID))

        self.assertEqual(response['id'], self.LEARNER_GROUP_ID)
        self.assertEqual(response['title'], self.learner_group.title)
        self.assertEqual(
            response['description'], self.learner_group.description)
        self.assertEqual(
            response['facilitator_usernames'], [self.NEW_USER_USERNAME])
        self.assertEqual(response['learner_usernames'], [])
        self.assertEqual(
            response['invited_learner_usernames'], [self.USER1_USERNAME])
        self.assertEqual(response['subtopic_page_ids'], ['subtopic_id_1'])
        self.assertEqual(response['story_ids'], ['story_id_1'])

        self.logout()

    def test_facilitators_view_details_as_invalid_facilitator(self):
        self.login(self.USER2_EMAIL)

        self.get_json(
            '/view_learner_group_info_handler/%s' % (
                self.LEARNER_GROUP_ID), expected_status_int=401)

        self.logout()


class LearnerGroupLearnerProgressHandlerTests(test_utils.GenericTestBase):

    LEARNER_1_EMAIL = 'user1@example.com'
    LEARNER_1_USERNAME = 'user1'
    LEARNER_2_EMAIL = 'user2@example.com'
    LEARNER_2_USERNAME = 'user2'
    TOPIC_ID_1 = 'topic_id_1'
    STORY_ID_1 = 'story_id_1'
    SUBTOPIC_PAGE_ID_1 = TOPIC_ID_1 + ':1'
    STORY_URL_FRAGMENT = 'title-one'
    STORY_URL_FRAGMENT_TWO = 'story-two'
    NODE_ID_1 = 'node_1'
    NODE_ID_2 = 'node_2'
    NODE_ID_3 = 'node_3'
    EXP_ID_0 = '0'
    EXP_ID_1 = '1'
    EXP_ID_7 = '7'
    DEGREE_OF_MASTERY_1 = 0.5
    DEGREE_OF_MASTERY_2 = 0.0

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.LEARNER_1_EMAIL, self.LEARNER_1_USERNAME)
        self.signup(self.LEARNER_2_EMAIL, self.LEARNER_2_USERNAME)

        self.LEARNER_ID_1 = self.get_user_id_from_email(self.LEARNER_1_EMAIL)
        self.LEARNER_ID_2 = self.get_user_id_from_email(self.LEARNER_2_EMAIL)
        self.facilitator_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Name', 'Description',
            [self.facilitator_id], [self.LEARNER_ID_1, self.LEARNER_ID_2],
            [self.SUBTOPIC_PAGE_ID_1], [self.STORY_ID_1])

        # Set up topics, subtopics and stories for learner group syllabus.
        self.save_new_valid_exploration(
            self.EXP_ID_0, self.admin_id, title='Title 1',
            end_state_name='End', correctness_feedback_enabled=True)
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.admin_id, title='Title 2',
            end_state_name='End', correctness_feedback_enabled=True)
        self.save_new_valid_exploration(
            self.EXP_ID_7, self.admin_id, title='Title 3',
            end_state_name='End', correctness_feedback_enabled=True)
        self.publish_exploration(self.admin_id, self.EXP_ID_0)
        self.publish_exploration(self.admin_id, self.EXP_ID_1)
        self.publish_exploration(self.admin_id, self.EXP_ID_7)

        story = story_domain.Story.create_default_story(
            self.STORY_ID_1, 'Title', 'Description', self.TOPIC_ID_1,
            self.STORY_URL_FRAGMENT)
        story.meta_tag_content = 'story meta content'

        exp_summary_dicts = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                [self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_7], user=self.admin
            )
        )
        self.node_1 = {
            'id': self.NODE_ID_1,
            'title': 'Title 1',
            'description': 'Description 1',
            'thumbnail_filename': 'image_1.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.EXP_ID_1,
            'exp_summary_dict': exp_summary_dicts[1],
            'completed': False
        }
        self.node_2 = {
            'id': self.NODE_ID_2,
            'title': 'Title 2',
            'description': 'Description 2',
            'thumbnail_filename': 'image_2.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'destination_node_ids': ['node_1'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.EXP_ID_0,
            'exp_summary_dict': exp_summary_dicts[0],
            'completed': True
        }
        self.node_3 = {
            'id': self.NODE_ID_3,
            'title': 'Title 3',
            'description': 'Description 3',
            'thumbnail_filename': 'image_3.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.EXP_ID_7,
            'exp_summary_dict': exp_summary_dicts[2],
            'completed': False
        }
        story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(self.node_1),
            story_domain.StoryNode.from_dict(self.node_2),
            story_domain.StoryNode.from_dict(self.node_3)
        ]
        self.nodes = story.story_contents.nodes
        story.story_contents.initial_node_id = 'node_2'
        story.story_contents.next_node_id = 'node_4'
        story_services.save_new_story(self.admin_id, story)
        self.subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'sub-one-frag')
        self.subtopic_2 = topic_domain.Subtopic.create_default_subtopic(
            2, 'Subtopic Title 2', 'sub-two-frag')
        self.SKILL_ID_1 = skill_services.get_new_skill_id()
        self.SKILL_ID_2 = skill_services.get_new_skill_id()
        self.subtopic_1.skill_ids = [self.SKILL_ID_1]
        self.subtopic_2.skill_ids = [self.SKILL_ID_2]
        self.save_new_topic(
            self.TOPIC_ID_1, 'user', name='Topic',
            description='A new topic', canonical_story_ids=[story.id],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_1, self.subtopic_2], next_subtopic_id=3)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)

        # Add the invited learners to the learner group.
        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID_1, True)

        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID_2, False)

        # Add some progress for the learners.
        story_services.record_completed_node_in_story_context(
            self.LEARNER_ID_1, self.STORY_ID_1, self.NODE_ID_1)
        story_services.record_completed_node_in_story_context(
            self.LEARNER_ID_1, self.STORY_ID_1, self.NODE_ID_2)
        story_services.record_completed_node_in_story_context(
            self.LEARNER_ID_2, self.STORY_ID_1, self.NODE_ID_3)

        self.SKILL_IDS = [self.SKILL_ID_1, self.SKILL_ID_2]
        skill_services.create_user_skill_mastery(
            self.LEARNER_ID_1, self.SKILL_ID_1, self.DEGREE_OF_MASTERY_1)
        skill_services.create_user_skill_mastery(
            self.LEARNER_ID_2, self.SKILL_ID_2, self.DEGREE_OF_MASTERY_2)

    def test_get_progress_of_learners(self):
        self.login(self.NEW_USER_EMAIL)

        params = {
            'learner_usernames': json.dumps([
                self.LEARNER_1_USERNAME, self.LEARNER_2_USERNAME])
        }

        response = self.get_json(
            '/learner_group_user_progress_handler/%s' % (
                self.LEARNER_GROUP_ID), params=params)

        learners_prog = response
        learner1_stories_prog = learners_prog[0]['stories_progress']
        learner2_stories_prog = learners_prog[1]['stories_progress']
        learner1_subtopics_prog = learners_prog[0]['subtopic_pages_progress']
        learner2_subtopics_prog = learners_prog[1]['subtopic_pages_progress']
        story_summary = story_fetchers.get_story_summaries_by_ids(
            [self.STORY_ID_1])[0]
        story = story_fetchers.get_story_by_id(self.STORY_ID_1)
        expected_story_prog_summary = story_summary.to_dict()
        expected_story_prog_summary['story_is_published'] = True
        expected_story_prog_summary['completed_node_titles'] = (
            ['Title 1', 'Title 2'])
        expected_story_prog_summary['topic_name'] = 'Topic'
        expected_story_prog_summary['topic_url_fragment'] = 'topic'
        expected_story_prog_summary['classroom_url_fragment'] = 'staging'
        expected_story_prog_summary['all_node_dicts'] = (
            [node.to_dict() for node in story.story_contents.nodes])

        expected_learner1_subtopics_prog = [{
            'subtopic_id': 1,
            'subtopic_title': 'Subtopic Title 1',
            'parent_topic_id': self.TOPIC_ID_1,
            'parent_topic_name': 'Topic',
            'thumbnail_filename': self.subtopic_1.thumbnail_filename,
            'thumbnail_bg_color': self.subtopic_1.thumbnail_bg_color,
            'subtopic_mastery': self.DEGREE_OF_MASTERY_1,
            'parent_topic_url_fragment': 'topic',
            'classroom_url_fragment': 'staging'
        }]

        self.assertEqual(len(learners_prog), 2)
        self.assertEqual(learners_prog[0]['username'], self.LEARNER_1_USERNAME)
        self.assertEqual(learners_prog[1]['username'], self.LEARNER_2_USERNAME)
        self.assertEqual(
            learners_prog[0]['progress_sharing_is_turned_on'], True)
        self.assertEqual(
            learners_prog[1]['progress_sharing_is_turned_on'], False)
        self.assertEqual(len(learner1_stories_prog), 1)
        self.assertEqual(learner1_stories_prog[0], expected_story_prog_summary)
        self.assertEqual(len(learner2_stories_prog), 0)
        self.assertEqual(len(learner1_subtopics_prog), 1)
        self.assertEqual(
            learner1_subtopics_prog, expected_learner1_subtopics_prog)
        self.assertEqual(len(learner2_subtopics_prog), 0)

    def test_get_progress_of_learners_with_invalid_group_id(self):
        self.login(self.NEW_USER_EMAIL)

        params = {
            'learner_usernames': json.dumps([
                self.LEARNER_1_USERNAME, self.LEARNER_2_USERNAME])
        }

        self.get_json(
            '/learner_group_user_progress_handler/%s' % (
                'invalidId'), params=params, expected_status_int=400)

        self.logout()


class LearnerGroupLearnerSpecificProgressHandlerTests(
    test_utils.GenericTestBase
):
    """Tests fetching of learner specific progress of a learner group."""

    LEARNER_1_EMAIL = 'user1@example.com'
    LEARNER_1_USERNAME = 'user1'
    TOPIC_ID_1 = 'topic_id_1'
    STORY_ID_1 = 'story_id_1'
    SUBTOPIC_PAGE_ID_1 = TOPIC_ID_1 + ':1'
    STORY_URL_FRAGMENT = 'title-one'
    STORY_URL_FRAGMENT_TWO = 'story-two'
    NODE_ID_1 = 'node_1'
    NODE_ID_2 = 'node_2'
    EXP_ID_0 = '0'
    EXP_ID_1 = '1'
    DEGREE_OF_MASTERY_1 = 0.5

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.LEARNER_1_EMAIL, self.LEARNER_1_USERNAME)

        self.LEARNER_ID_1 = self.get_user_id_from_email(self.LEARNER_1_EMAIL)
        self.facilitator_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )
        learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Name', 'Description',
            [self.facilitator_id], [self.LEARNER_ID_1],
            [self.SUBTOPIC_PAGE_ID_1], [self.STORY_ID_1])

        # Set up topics, subtopics and stories for learner group syllabus.
        self.save_new_valid_exploration(
            self.EXP_ID_0, self.admin_id, title='Title 1',
            end_state_name='End', correctness_feedback_enabled=True)
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.admin_id, title='Title 2',
            end_state_name='End', correctness_feedback_enabled=True)
        self.publish_exploration(self.admin_id, self.EXP_ID_0)
        self.publish_exploration(self.admin_id, self.EXP_ID_1)

        story = story_domain.Story.create_default_story(
            self.STORY_ID_1, 'Title', 'Description', self.TOPIC_ID_1,
            self.STORY_URL_FRAGMENT)
        story.meta_tag_content = 'story meta content'

        exp_summary_dicts = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                [self.EXP_ID_0, self.EXP_ID_1], user=self.admin
            )
        )
        self.node_1 = {
            'id': self.NODE_ID_1,
            'title': 'Title 1',
            'description': 'Description 1',
            'thumbnail_filename': 'image_1.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.EXP_ID_1,
            'exp_summary_dict': exp_summary_dicts[1],
            'completed': False
        }
        self.node_2 = {
            'id': self.NODE_ID_2,
            'title': 'Title 2',
            'description': 'Description 2',
            'thumbnail_filename': 'image_2.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'destination_node_ids': ['node_1'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.EXP_ID_0,
            'exp_summary_dict': exp_summary_dicts[0],
            'completed': True
        }
        story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(self.node_1),
            story_domain.StoryNode.from_dict(self.node_2)
        ]
        self.nodes = story.story_contents.nodes
        story.story_contents.initial_node_id = 'node_2'
        story.story_contents.next_node_id = 'node_4'
        story_services.save_new_story(self.admin_id, story)
        self.subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'sub-one-frag')
        self.subtopic_2 = topic_domain.Subtopic.create_default_subtopic(
            2, 'Subtopic Title 2', 'sub-two-frag')
        self.SKILL_ID_1 = skill_services.get_new_skill_id()
        self.SKILL_ID_2 = skill_services.get_new_skill_id()
        self.subtopic_1.skill_ids = [self.SKILL_ID_1]
        self.subtopic_2.skill_ids = [self.SKILL_ID_2]
        self.save_new_topic(
            self.TOPIC_ID_1, 'user', name='Topic',
            description='A new topic', canonical_story_ids=[story.id],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_1, self.subtopic_2], next_subtopic_id=3)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)

        # Add the invited learner to the learner group.
        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID_1, True)

        # Add some progress for the learner.
        story_services.record_completed_node_in_story_context(
            self.LEARNER_ID_1, self.STORY_ID_1, self.NODE_ID_1)
        story_services.record_completed_node_in_story_context(
            self.LEARNER_ID_1, self.STORY_ID_1, self.NODE_ID_2)

        self.SKILL_IDS = [self.SKILL_ID_1, self.SKILL_ID_2]
        skill_services.create_user_skill_mastery(
            self.LEARNER_ID_1, self.SKILL_ID_1, self.DEGREE_OF_MASTERY_1)

    def test_get_progress_of_learner(self):
        self.login(self.LEARNER_1_EMAIL)

        response = self.get_json(
            '/learner_group_learner_specific_progress_handler/%s' % (
                self.LEARNER_GROUP_ID))

        learner_prog = response
        learner1_stories_prog = learner_prog['stories_progress']
        learner1_subtopics_prog = learner_prog['subtopic_pages_progress']
        story_summary = story_fetchers.get_story_summaries_by_ids(
            [self.STORY_ID_1])[0]
        story = story_fetchers.get_story_by_id(self.STORY_ID_1)
        expected_story_prog_summary = story_summary.to_dict()
        expected_story_prog_summary['story_is_published'] = True
        expected_story_prog_summary['completed_node_titles'] = (
            ['Title 1', 'Title 2'])
        expected_story_prog_summary['topic_name'] = 'Topic'
        expected_story_prog_summary['topic_url_fragment'] = 'topic'
        expected_story_prog_summary['classroom_url_fragment'] = 'staging'
        expected_story_prog_summary['all_node_dicts'] = (
            [node.to_dict() for node in story.story_contents.nodes])

        expected_learner1_subtopics_prog = [{
            'subtopic_id': 1,
            'subtopic_title': 'Subtopic Title 1',
            'parent_topic_id': self.TOPIC_ID_1,
            'parent_topic_name': 'Topic',
            'thumbnail_filename': self.subtopic_1.thumbnail_filename,
            'thumbnail_bg_color': self.subtopic_1.thumbnail_bg_color,
            'subtopic_mastery': self.DEGREE_OF_MASTERY_1,
            'parent_topic_url_fragment': 'topic',
            'classroom_url_fragment': 'staging'
        }]

        self.assertEqual(learner_prog['username'], self.LEARNER_1_USERNAME)
        self.assertEqual(
            learner_prog['progress_sharing_is_turned_on'], True)
        self.assertEqual(len(learner1_stories_prog), 1)
        self.assertEqual(learner1_stories_prog[0], expected_story_prog_summary)
        self.assertEqual(
            learner1_subtopics_prog, expected_learner1_subtopics_prog)

    def test_get_progress_of_learners_with_invalid_group_id(self):
        self.login(self.LEARNER_1_EMAIL)

        self.get_json(
            '/learner_group_learner_specific_progress_handler/%s' % (
                'invalidId'), expected_status_int=400)

        self.logout()


class CreateLearnerGroupPageTests(test_utils.GenericTestBase):
    """Checks the access and rendering of the create learner group page."""

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.login(self.NEW_USER_EMAIL)

    def test_page_with_disabled_learner_groups_leads_to_404(self):
        config_services.set_property(
            'admin', 'learner_groups_are_enabled', False)
        self.get_html_response(
            feconf.CREATE_LEARNER_GROUP_PAGE_URL, expected_status_int=404)
        self.logout()

    def test_page_with_enabled_learner_groups_loads_correctly(self):
        config_services.set_property(
            'admin', 'learner_groups_are_enabled', True)
        response = self.get_html_response(feconf.CREATE_LEARNER_GROUP_PAGE_URL)
        response.mustcontain(
            '<oppia-create-learner-group-page>'
            '</oppia-create-learner-group-page>')
        self.logout()


class FacilitatorDashboardPageTests(test_utils.GenericTestBase):
    """Checks the access and rendering of the facilitator dashboard page."""

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.login(self.NEW_USER_EMAIL)

    def test_page_with_disabled_learner_groups_leads_to_404(self):
        config_services.set_property(
            'admin', 'learner_groups_are_enabled', False)
        self.get_html_response(
            feconf.FACILITATOR_DASHBOARD_PAGE_URL, expected_status_int=404)
        self.logout()

    def test_page_with_enabled_learner_groups_loads_correctly(self):
        config_services.set_property(
            'admin', 'learner_groups_are_enabled', True)
        response = self.get_html_response(
            feconf.FACILITATOR_DASHBOARD_PAGE_URL)
        response.mustcontain(
            '<oppia-facilitator-dashboard-page>'
            '</oppia-facilitator-dashboard-page>')
        self.logout()


class LearnerGroupSearchLearnerHandlerTests(test_utils.GenericTestBase):
    """Tests searching a given user to invite to the learner group"""

    def setUp(self):
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.login(self.OWNER_EMAIL)

    def test_searching_invalid_user(self):
        params = {
            'username': 'invalid_username',
            'learner_group_id': 'groupId'
        }
        response = self.get_json(
            '/learner_group_search_learner_handler', params=params
        )

        self.assertEqual(response['username'], 'invalid_username')
        self.assertEqual(response['profile_picture_data_url'], '')
        self.assertEqual(
            response['error'],
            'User with username invalid_username does not exist.'
        )
        self.logout()

    def test_searching_user_to_add_being_the_owner(self):
        params = {
            'username': self.OWNER_USERNAME,
            'learner_group_id': 'groupId'
        }
        response = self.get_json(
            '/learner_group_search_learner_handler', params=params
        )

        self.assertEqual(response['username'], self.OWNER_USERNAME)
        self.assertEqual(response['profile_picture_data_url'], '')
        self.assertEqual(
            response['error'],
            'You cannot invite yourself to the group'
        )
        self.logout()

    def test_searching_an_already_invited_user(self):
        learner_group_services.create_learner_group(
            'groupId', 'Group Title', 'Group Description',
            [self.owner_id], [self.new_user_id], ['subtopic1'], [])
        params = {
            'username': self.NEW_USER_USERNAME,
            'learner_group_id': 'groupId'
        }
        response = self.get_json(
            '/learner_group_search_learner_handler', params=params
        )

        self.assertEqual(response['username'], self.NEW_USER_USERNAME)
        self.assertEqual(response['profile_picture_data_url'], '')
        self.assertEqual(
            response['error'],
            'User with username %s has been already invited to join the '
            'group' % self.NEW_USER_USERNAME
        )
        self.logout()

    def test_searching_a_valid_user_to_invite(self):
        learner_group_services.create_learner_group(
            'groupId', 'Group Title', 'Group Description',
            [self.owner_id], [], ['subtopic1'], [])
        params = {
            'username': self.NEW_USER_USERNAME,
            'learner_group_id': 'groupId'
        }
        response = self.get_json(
            '/learner_group_search_learner_handler', params=params
        )

        user_settings = user_services.get_user_settings_from_username(
            self.NEW_USER_USERNAME)
        self.assertEqual(response['username'], user_settings.username)
        self.assertEqual(
            response['profile_picture_data_url'],
            user_settings.profile_picture_data_url
        )
        self.assertEqual(response['error'], '')
        self.logout()


class EditLearnerGroupPageTests(test_utils.GenericTestBase):
    """Checks the access and rendering of the edit learner page."""

    LEARNER_ID = 'learner_user_1'

    def setUp(self):
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.FACILITATOR_ID = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.login(self.OWNER_EMAIL)
        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )
        self.learner_group = learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Name', 'Description',
            [self.FACILITATOR_ID], [self.LEARNER_ID], ['subtopic_id_1'],
            ['story_id_1'])

    def test_page_with_disabled_learner_groups_leads_to_404(self):
        config_services.set_property(
            'admin', 'learner_groups_are_enabled', False)
        self.get_html_response(
            '/edit-learner-group/%s' % self.LEARNER_GROUP_ID,
            expected_status_int=404)
        self.logout()

    def test_page_with_enabled_learner_groups_loads_correctly_for_facilitator(
        self
    ):
        config_services.set_property(
            'admin', 'learner_groups_are_enabled', True)
        response = self.get_html_response(
            '/edit-learner-group/%s' % self.LEARNER_GROUP_ID)
        response.mustcontain(
            '<oppia-edit-learner-group-page>'
            '</oppia-edit-learner-group-page>')
        self.logout()

    def test_page_with_enabled_learner_groups_leads_to_404_for_non_facilitators(
        self
    ):
        config_services.set_property(
            'admin', 'learner_groups_are_enabled', True)
        self.logout()
        self.login(self.NEW_USER_EMAIL)
        self.get_html_response(
            '/edit-learner-group/%s' % self.LEARNER_GROUP_ID,
            expected_status_int=404)
        self.logout()


class LearnerGroupLearnerInvitationHandlerTests(test_utils.GenericTestBase):
    """Checks learner successfully accepting or declining a learner group
    invitation.
    """

    def setUp(self):
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.FACILITATOR_ID = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.LEARNER_ID = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )
        self.learner_group = learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Name', 'Description',
            [self.FACILITATOR_ID], [self.LEARNER_ID], ['subtopic_id_1'],
            ['story_id_1'])

    def test_invitation_accepted_by_the_learner(self) -> None:
        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'learner_username': self.NEW_USER_USERNAME,
            'is_invitation_accepted': 'true',
            'progress_sharing_permission': 'true'
        }
        response = self.put_json(
            '/learner_group_learner_invitation_handler/%s' % (
                self.LEARNER_GROUP_ID),
            payload, csrf_token=csrf_token)

        self.assertEqual(response['id'], self.LEARNER_GROUP_ID)
        self.assertEqual(
            response['learner_usernames'], [self.NEW_USER_USERNAME])
        self.assertEqual(response['invited_learner_usernames'], [])

    def test_invitation_declined_by_the_learner(self) -> None:
        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'learner_username': self.NEW_USER_USERNAME,
            'is_invitation_accepted': 'false',
            'progress_sharing_permission': 'false'
        }
        response = self.put_json(
            '/learner_group_learner_invitation_handler/%s' % (
                self.LEARNER_GROUP_ID),
            payload, csrf_token=csrf_token)

        self.assertEqual(response['id'], self.LEARNER_GROUP_ID)
        self.assertEqual(response['learner_usernames'], [])
        self.assertEqual(response['invited_learner_usernames'], [])


class LearnerGroupLearnersInfoHandlerTests(test_utils.GenericTestBase):
    """Checks fetching info of joined and invited to join learners of a
    learner group
    """

    LEARNER_EMAIL = 'some.learner@user.com'
    LEARNER_USERNAME = 'somelearner'

    def setUp(self):
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.FACILITATOR_ID = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.LEARNER_ID_1 = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.signup(self.LEARNER_EMAIL, self.LEARNER_USERNAME)
        self.LEARNER_ID_2 = self.get_user_id_from_email(self.LEARNER_EMAIL)

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )
        self.learner_group = learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Name', 'Description',
            [self.FACILITATOR_ID], [self.LEARNER_ID_1, self.LEARNER_ID_2],
            ['subtopic_id_1'], ['story_id_1'])
        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID_1, False)

    def test_getting_info_of_learners_and_invities(self) -> None:
        self.login(self.OWNER_EMAIL)
        response = self.get_json(
            '/learner_group_learners_info_handler/%s' % self.LEARNER_GROUP_ID
        )

        learners_user_settings = user_services.get_users_settings(
            [self.LEARNER_ID_1, self.LEARNER_ID_2], strict=True)

        learner_info = [{
            'username': self.NEW_USER_USERNAME,
            'profile_picture_data_url':
                learners_user_settings[0].profile_picture_data_url
        }]
        invited_learner_info = [{
            'username': self.LEARNER_USERNAME,
            'profile_picture_data_url':
                learners_user_settings[1].profile_picture_data_url
        }]
        self.assertEqual(response['learners_info'], learner_info)
        self.assertEqual(
            response['invited_learners_info'], invited_learner_info)

        self.logout()

    def test_getting_info_of_learners_as_invalid_facilitator(self):
        self.login(self.NEW_USER_EMAIL)

        response = self.get_json(
            '/learner_group_learners_info_handler/%s' % self.LEARNER_GROUP_ID,
            expected_status_int=401
        )
        self.assertEqual(
            response['error'],
            'You are not a facilitator of this learner group.')

        self.logout()


class LearnerGroupSyllabusHandlerTests(test_utils.GenericTestBase):
    """Checks learner group syllabus being fetched correctly"""

    LEARNER_ID = 'learner_user_1'
    TOPIC_ID = 'topic_id_1'
    STORY_ID = 'story_id_1'
    SUBTOPIC_PAGE_ID = 'topic_id_1:1'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.facilitator_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Name', 'Description',
            [self.facilitator_id], [self.LEARNER_ID], [self.SUBTOPIC_PAGE_ID],
            [self.STORY_ID])

        # Set up topics, subtopics and stories for learner group syllabus.
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'Place Values', 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Naming Numbers', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.admin_id, topic)
        self.save_new_story(
            self.STORY_ID, self.admin_id, self.TOPIC_ID,
            'Story test')
        topic_services.add_canonical_story(
            self.admin_id, self.TOPIC_ID, self.STORY_ID)

        # Publish the topic and its stories.
        topic_services.publish_topic(self.TOPIC_ID, self.admin_id)
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id)

    def test_get_learner_group_syllabus(self) -> None:
        self.login(self.NEW_USER_EMAIL)
        response = self.get_json(
            '/learner_group_syllabus_handler/%s' % self.LEARNER_GROUP_ID
        )

        self.assertEqual(response['learner_group_id'], self.LEARNER_GROUP_ID)

        story_summary_dicts = response['story_summary_dicts']
        self.assertEqual(len(story_summary_dicts), 1)
        self.assertEqual(story_summary_dicts[0]['id'], self.STORY_ID)
        self.assertEqual(story_summary_dicts[0]['title'], 'Story test')
        self.assertEqual(story_summary_dicts[0]['topic_name'], 'Place Values')

        subtopic_summary_dicts = response['subtopic_summary_dicts']
        self.assertEqual(len(subtopic_summary_dicts), 1)
        self.assertEqual(subtopic_summary_dicts[0]['subtopic_id'], 1)
        self.assertEqual(
            subtopic_summary_dicts[0]['subtopic_title'], 'Naming Numbers')
        self.assertEqual(
            subtopic_summary_dicts[0]['parent_topic_name'], 'Place Values')
        self.assertEqual(
            subtopic_summary_dicts[0]['thumbnail_filename'], 'image.svg')
        self.assertEqual(
            subtopic_summary_dicts[0]['parent_topic_id'], self.TOPIC_ID)
        self.assertIsNone(subtopic_summary_dicts[0]['subtopic_mastery'])

        self.logout()

    def test_get_learner_group_syllabus_for_invalid_group(self) -> None:
        self.login(self.NEW_USER_EMAIL)

        self.get_json(
            '/learner_group_syllabus_handler/invalidId', expected_status_int=400
        )

        self.logout()


class LearnerStoriesChaptersProgressHandlerTests(test_utils.GenericTestBase):
    """Tests for Learner Stories Chapters Progress Handler."""

    NODE_ID_1 = story_domain.NODE_ID_PREFIX + '1'
    NODE_ID_2 = story_domain.NODE_ID_PREFIX + '2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.USER_ID = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.story_id = story_services.get_new_story_id()
        self.TOPIC_ID = topic_fetchers.get_new_topic_id()
        self.save_new_topic(  # type: ignore[no-untyped-call]
            self.TOPIC_ID, self.USER_ID, name='Topic',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=0)
        self.save_new_story(
            self.story_id, self.USER_ID, self.TOPIC_ID, url_fragment='story-one'
        )
        topic_services.add_canonical_story(  # type: ignore[no-untyped-call]
            self.USER_ID, self.TOPIC_ID, self.story_id)
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_1,
                'title': 'Title 1'
            })
        ]
        story_services.update_story(
            self.USER_ID, self.story_id, changelist,
            'Added node.')
        self.story = story_fetchers.get_story_by_id(self.story_id)

        self.exp_id_1 = 'expid1'
        self.save_new_valid_exploration(self.exp_id_1, self.USER_ID)

        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': story_domain.NODE_ID_PREFIX + '1',
                'old_value': None,
                'new_value': self.exp_id_1
            })
        ]
        story_services.update_story(
            self.USER_ID, self.story_id, change_list,
            'Added a node.')

    def test_get_learner_stories_chapters_progress(self) -> None:
        self.login(self.NEW_USER_EMAIL)

        user_services.update_learner_checkpoint_progress(
            self.USER_ID, self.exp_id_1, 'Introduction', 1)

        params = {
            'story_ids': json.dumps([self.story_id])
        }
        response = self.get_json(
            '/user_progress_in_stories_chapters_handler/%s' % (
                self.NEW_USER_USERNAME), params=params)

        self.assertEqual(len(response), 1)
        self.assertEqual(response[0]['exploration_id'], self.exp_id_1)
        self.assertEqual(response[0]['visited_checkpoints_count'], 1)
        self.assertEqual(response[0]['total_checkpoints_count'], 1)

        self.logout()


class LearnerGroupsFeatureStatusHandlerTests(test_utils.GenericTestBase):
    """Unit test for LearnerGroupsFeatureStatusHandler."""

    def test_get_request_returns_correct_status(self):
        self.set_config_property(
            config_domain.LEARNER_GROUPS_ARE_ENABLED, False)

        response = self.get_json('/learner_groups_feature_status_handler')
        self.assertEqual(
            response, {
                'feature_is_enabled': False
            })

        self.set_config_property(
            config_domain.LEARNER_GROUPS_ARE_ENABLED, True)
        response = self.get_json('/learner_groups_feature_status_handler')
        self.assertEqual(
            response, {
                'feature_is_enabled': True,
            })


class LearnerDashboardLearnerGroupsHandlerTests(test_utils.GenericTestBase):
    """Checks fetching of learner groups for the learner dashboard."""

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.facilitator_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)
        self.learner_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

    def test_get_learner_dashboard_learner_groups_view(self):
        self.login(self.NEW_USER_EMAIL)

        # User has not joined any learner group and has not been invited to join
        # any learner groups.
        response = self.get_json(
            '%s' % (feconf.LEARNER_DASHBOARD_LEARNER_GROUPS_HANDLER))

        self.assertEqual(response['learner_groups_joined'], [])
        self.assertEqual(response['invited_to_learner_groups'], [])

        # Create a learner group.
        learner_group_id = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        learner_group = learner_group_services.create_learner_group(
            learner_group_id, 'Learner Group Title', 'Description',
            [self.facilitator_id], [self.learner_id],
            ['subtopic_id_1'], ['story_id_1'])

        response = self.get_json(
            '%s' % (feconf.LEARNER_DASHBOARD_LEARNER_GROUPS_HANDLER))

        self.assertEqual(len(response['invited_to_learner_groups']), 1)
        self.assertEqual(len(response['learner_groups_joined']), 0)
        self.assertEqual(
            response['invited_to_learner_groups'][0]['id'],
            learner_group.group_id)

        # User accepts the invitation to join the learner group.
        learner_group_services.add_learner_to_learner_group(
            learner_group_id, self.learner_id, False)

        response = self.get_json(
            '%s' % (feconf.LEARNER_DASHBOARD_LEARNER_GROUPS_HANDLER))

        self.assertEqual(len(response['invited_to_learner_groups']), 0)
        self.assertEqual(len(response['learner_groups_joined']), 1)
        self.assertEqual(
            response['learner_groups_joined'][0]['id'],
            learner_group.group_id)

        self.logout()


class ExitLearnerGroupHandlerTests(test_utils.GenericTestBase):
    """Checks the exit learner group handler."""

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.facilitator_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)
        self.learner_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

    def test_exit_learner_group(self):
        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        learner_group_id = (
            learner_group_fetchers.get_new_learner_group_id()
        )
        learner_group_services.create_learner_group(
            learner_group_id, 'Learner Group Title', 'Description',
            [self.facilitator_id], [self.learner_id],
            ['subtopic_id_1'], ['story_id_1'])

        # User accepts the invitation to join the learner group.
        learner_group_services.add_learner_to_learner_group(
            learner_group_id, self.learner_id, False)

        payload = {
            'learner_username': self.NEW_USER_USERNAME
        }
        response = self.put_json(
            '/exit_learner_group_handler/%s' % (learner_group_id),
            payload, csrf_token=csrf_token)

        self.assertEqual(response['id'], learner_group_id)
        self.assertEqual(response['learner_usernames'], [])

        self.logout()


class LearnerGroupProgressSharingPermissionHandlerTests(
    test_utils.GenericTestBase
):
    """Checks fetching and updating of progress sharing permission."""

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.facilitator_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)
        self.learner_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )
        learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Title', 'Description',
            [self.facilitator_id], [self.learner_id],
            ['subtopic_id_1'], ['story_id_1'])

    def test_get_progress_sharing_permission(self):
        self.login(self.NEW_USER_EMAIL)

        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.learner_id, False)

        response = self.get_json(
            '/learner_group_progress_sharing_permission_handler/%s' % (
                self.LEARNER_GROUP_ID))

        self.assertEqual(response['progress_sharing_permission'], False)

        self.logout()

    def test_update_progress_sharing_permission(self):
        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.learner_id, False)

        payload = {
            'progress_sharing_permission': 'true'
        }
        response = self.put_json(
            '/learner_group_progress_sharing_permission_handler/%s' % (
                self.LEARNER_GROUP_ID),
            payload, csrf_token=csrf_token)

        self.assertEqual(response['progress_sharing_permission'], True)

        self.logout()
