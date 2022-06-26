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

from core.domain import learner_group_fetchers
from core.domain import learner_group_services
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
