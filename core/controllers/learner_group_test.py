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
from core.domain import learner_group_fetchers
from core.domain import learner_group_services
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import summary_services
from core.domain import topic_domain
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
            'invited_student_usernames':
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
            response['invited_student_usernames'],
            [self.USER1_USERNAME, self.USER2_USERNAME])
        self.assertEqual(response['student_usernames'], [])

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
            'student_usernames': [],
            'invited_student_usernames':
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
            response['invited_student_usernames'], [self.USER2_USERNAME])
        self.assertEqual(response['student_usernames'], [])
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
            'student_usernames': [],
            'invited_student_usernames':
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
    STUDENT_ID = 'student_user_1'
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
            [self.facilitator_id], [self.STUDENT_ID], ['subtopic_id_1'],
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
            'search_keyword': 'Place',
            'search_category': 'All',
            'search_language_code': constants.DEFAULT_LANGUAGE_CODE,
        }

        response = self.get_json(
            '/learner_group_search_syllabus_handler/%s' % (
                self.LEARNER_GROUP_ID),
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


class FacilitatorLearnerGroupViewHandlerTests(test_utils.GenericTestBase):

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
            '/facilitator_view_of_learner_group_handler/%s' % (
                self.LEARNER_GROUP_ID))

        self.assertEqual(response['id'], self.LEARNER_GROUP_ID)
        self.assertEqual(response['title'], self.learner_group.title)
        self.assertEqual(
            response['description'], self.learner_group.description)
        self.assertEqual(
            response['facilitator_usernames'], [self.NEW_USER_USERNAME])
        self.assertEqual(response['student_usernames'], [])
        self.assertEqual(
            response['invited_student_usernames'], [self.USER1_USERNAME])
        self.assertEqual(response['subtopic_page_ids'], ['subtopic_id_1'])
        self.assertEqual(response['story_ids'], ['story_id_1'])

        self.logout()

    def test_facilitators_view_details_as_invalid_facilitator(self):
        self.login(self.USER2_EMAIL)

        self.get_json(
            '/facilitator_view_of_learner_group_handler/%s' % (
                self.LEARNER_GROUP_ID), expected_status_int=401)

        self.logout()


class LearnerGroupStudentProgressHandlerTests(test_utils.GenericTestBase):

    LEARNER_GROUP_ID = None
    STUDENT_1_EMAIL = 'user1@example.com'
    STUDENT_1_USERNAME = 'user1'
    STUDENT_2_EMAIL = 'user2@example.com'
    STUDENT_2_USERNAME = 'user2'
    STUDENT_ID_1 = None
    STUDENT_ID_2 = None
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
    EXP_ID_3 = 'exp_3'
    EXP_ID_7 = '7'
    SKILL_ID_1 = None
    SKILL_ID_2 = None
    DEGREE_OF_MASTERY_1 = 0.5
    DEGREE_OF_MASTERY_2 = 0.0

    def setUp(self):
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.STUDENT_1_EMAIL, self.STUDENT_1_USERNAME)
        self.signup(self.STUDENT_2_EMAIL, self.STUDENT_2_USERNAME)

        self.STUDENT_ID_1 = self.get_user_id_from_email(self.STUDENT_1_EMAIL)
        self.STUDENT_ID_2 = self.get_user_id_from_email(self.STUDENT_2_EMAIL)
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
            [self.facilitator_id], [self.STUDENT_ID_1, self.STUDENT_ID_2],
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

        # Add the invited students to the learner group.
        learner_group_services.add_student_to_learner_group(
            self.LEARNER_GROUP_ID, self.STUDENT_ID_1, True)

        learner_group_services.add_student_to_learner_group(
            self.LEARNER_GROUP_ID, self.STUDENT_ID_2, False)

        # Add some progress for the students.
        story_services.record_completed_node_in_story_context(
            self.STUDENT_ID_1, self.STORY_ID_1, self.NODE_ID_1)
        story_services.record_completed_node_in_story_context(
            self.STUDENT_ID_1, self.STORY_ID_1, self.NODE_ID_2)
        story_services.record_completed_node_in_story_context(
            self.STUDENT_ID_2, self.STORY_ID_1, self.NODE_ID_3)

        self.SKILL_IDS = [self.SKILL_ID_1, self.SKILL_ID_2]
        skill_services.create_user_skill_mastery(
            self.STUDENT_ID_1, self.SKILL_ID_1, self.DEGREE_OF_MASTERY_1)
        skill_services.create_user_skill_mastery(
            self.STUDENT_ID_2, self.SKILL_ID_2, self.DEGREE_OF_MASTERY_2)

    def test_get_progress_of_students(self):
        self.login(self.NEW_USER_EMAIL)

        params = {
            'student_usernames': json.dumps([
                self.STUDENT_1_USERNAME, self.STUDENT_2_USERNAME])
        }

        response = self.get_json(
            '/learner_group_user_progress_handler/%s' % (
                self.LEARNER_GROUP_ID), params=params)

        students_prog = response['students_progress']
        student1_stories_prog = students_prog[0]['stories_progress']
        student2_stories_prog = students_prog[1]['stories_progress']
        student1_subtopics_prog = students_prog[0]['subtopic_pages_progress']
        student2_subtopics_prog = students_prog[1]['subtopic_pages_progress']
        story_summary = story_fetchers.get_story_summaries_by_ids(
            [self.STORY_ID_1])[0]
        story = story_fetchers.get_story_by_id(self.STORY_ID_1)
        expected_story_prog_summary = story_summary.to_dict()
        expected_story_prog_summary['story_is_published'] = True
        expected_story_prog_summary['completed_node_titles'] = (
            ['Title 1', 'Title 2'])
        expected_story_prog_summary['topic_name'] = 'Topic'
        expected_story_prog_summary['topic_url_fragment'] = 'topic'
        expected_story_prog_summary['all_node_dicts'] = (
            [node.to_dict() for node in story.story_contents.nodes])

        expected_student1_subtopics_prog = [{
            'subtopic_id': 1,
            'subtopic_title': 'Subtopic Title 1',
            'parent_topic_id': self.TOPIC_ID_1,
            'parent_topic_name': 'Topic',
            'thumbnail_filename': self.subtopic_1.thumbnail_filename,
            'thumbnail_bg_color': self.subtopic_1.thumbnail_bg_color,
            'subtopic_mastery': self.DEGREE_OF_MASTERY_1
        }]

        self.assertEqual(len(students_prog), 2)
        self.assertEqual(students_prog[0]['username'], self.STUDENT_1_USERNAME)
        self.assertEqual(students_prog[1]['username'], self.STUDENT_2_USERNAME)
        self.assertEqual(
            students_prog[0]['progress_sharing_is_turned_on'], True)
        self.assertEqual(
            students_prog[1]['progress_sharing_is_turned_on'], False)
        self.assertEqual(len(student1_stories_prog), 1)
        self.assertEqual(student1_stories_prog[0], expected_story_prog_summary)
        self.assertEqual(len(student2_stories_prog), 0)
        self.assertEqual(len(student1_subtopics_prog), 1)
        self.assertEqual(
            student1_subtopics_prog, expected_student1_subtopics_prog)
        self.assertEqual(len(student2_subtopics_prog), 0)

    def test_get_progress_of_students_with_invalid_group_id(self):
        self.login(self.NEW_USER_EMAIL)

        params = {
            'student_usernames': json.dumps([
                self.STUDENT_1_USERNAME, self.STUDENT_2_USERNAME])
        }

        self.get_json(
            '/learner_group_user_progress_handler/%s' % (
                'invalidId'), params=params, expected_status_int=400)

        self.logout()
