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

from core import feconf
from core.constants import constants
from core.domain import learner_group_fetchers
from core.domain import learner_group_services
from core.domain import topic_domain
from core.domain import topic_services
from core.tests import test_utils


class CreateLearnerGroupHandlerTests(test_utils.GenericTestBase):

    USER1_EMAIL = 'user1@example.com'
    USER1_USERNAME = 'user1'
    USER2_EMAIL = 'user2@example.com'
    USER2_USERNAME = 'user2'

    def setUp(self):
        super(CreateLearnerGroupHandlerTests, self).setUp()
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

        self.assertIsNotNone(response['learner_group_id'])
        self.assertEqual(response['title'], 'Learner Group Title')
        self.assertEqual(response['description'], 'Learner Group Description')
        self.assertEqual(
            response['invited_student_usernames'],
            [self.USER1_USERNAME, self.USER2_USERNAME])
        self.assertEqual(response['student_usernames'], [])

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            response['learner_group_id'])

        self.assertIsNotNone(learner_group)

        self.logout()


class LearnerGroupHandlerTests(test_utils.GenericTestBase):

    USER1_EMAIL = 'user1@example.com'
    USER1_USERNAME = 'user1'
    USER2_EMAIL = 'user2@example.com'
    USER2_USERNAME = 'user2'
    LEARNER_GROUP_ID = None

    def setUp(self):
        super(LearnerGroupHandlerTests, self).setUp()
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
            [self.facilitator_id], [], [self.user_id_1],
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

        self.assertEqual(response['learner_group_id'], self.LEARNER_GROUP_ID)
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
            'learner group as you are its facilitator.')

        self.logout()


class TeacherDashboardHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(TeacherDashboardHandlerTests, self).setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)

        self.facilitator_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

    def test_get_teacher_dashboard_view(self):
        self.login(self.NEW_USER_EMAIL)

        # There are no learner groups created by new user yet.
        response = self.get_json('%s' % (feconf.TEACHER_DASHBOARD_HANDLER))

        self.assertEqual(response['learner_groups'], [])

        # Create a learner group.
        learner_group_id = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        learner_group = learner_group_services.create_learner_group(
            learner_group_id, 'Learner Group Title', 'Description',
            [self.facilitator_id], [], [],
            ['subtopic_id_1'], ['story_id_1'])

        response = self.get_json('%s' % (feconf.TEACHER_DASHBOARD_HANDLER))

        self.assertEqual(len(response['learner_groups']), 1)
        self.assertEqual(
            response['learner_groups'][0]['id'], learner_group.group_id)

        self.logout()


class FilterLearnerGroupSyllabusHandlerTests(test_utils.GenericTestBase):

    LEARNER_GROUP_ID = None
    STUDENT_ID = 'student_user_1'
    TOPIC_ID_0 = 'topic_id_0'
    TOPIC_ID_1 = 'topic_id_1'
    STORY_ID_0 = 'story_id_0'
    STORY_ID_1 = 'story_id_1'
    STORY_ID_2 = 'story_id_2'

    def setUp(self):
        super(FilterLearnerGroupSyllabusHandlerTests, self).setUp()
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
            [self.facilitator_id], [], [self.STUDENT_ID], ['subtopic_id_1'],
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
            'filter_keyword': 'Place',
            'filter_category': 'All',
            'filter_language': constants.DEFAULT_LANGUAGE_CODE,
        }

        response = self.get_json(
            '/filter_learner_group_syllabus_handler/%s' % (
                self.LEARNER_GROUP_ID),
            params=params
        )

        self.assertEqual(response['learner_group_id'], self.LEARNER_GROUP_ID)
        story_summaries = response['story_summaries']
        self.assertEqual(len(story_summaries), 1)
        self.assertEqual(story_summaries[0]['id'], self.STORY_ID_0)
        self.assertEqual(story_summaries[0]['title'], 'Story test 0')
        self.assertEqual(story_summaries[0]['topic_id'], self.TOPIC_ID_0)

        subtopic_summaries = response['subtopic_summaries']
        self.assertEqual(len(subtopic_summaries), 1)
        self.assertEqual(subtopic_summaries[0]['id'], 1)
        self.assertEqual(subtopic_summaries[0]['title'], 'Naming Numbers')
        self.assertEqual(subtopic_summaries[0]['topic_id'], self.TOPIC_ID_0)

        self.logout()
