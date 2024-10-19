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

from __future__ import annotations

import base64
import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import question_services
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import skill_services
from core.domain import state_domain
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import translation_domain
from core.tests import test_utils

from typing import Callable, Dict, List


class BaseTopicsAndSkillsDashboardTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.TOPIC_MANAGER_EMAIL, self.TOPIC_MANAGER_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.topic_manager_id = self.get_user_id_from_email(
            self.TOPIC_MANAGER_EMAIL)
        self.new_user_id = self.get_user_id_from_email(
            self.NEW_USER_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.linked_skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.linked_skill_id, self.admin_id, description='Description 3')
        self.subtopic_skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.subtopic_skill_id, self.admin_id, description='Subtopic Skill')

        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title', 'url-frag')
        subtopic.skill_ids = [self.subtopic_skill_id]
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            abbreviated_name='name', url_fragment='name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.linked_skill_id],
            subtopics=[subtopic], next_subtopic_id=2)

        self.set_topic_managers([self.TOPIC_MANAGER_USERNAME], self.topic_id)
        self.save_new_valid_classroom(
            topic_id_to_prerequisite_topic_ids={
                self.topic_id: []
            }
        )


class TopicsAndSkillsDashboardPageDataHandlerTests(
        BaseTopicsAndSkillsDashboardTests):

    def test_get(self) -> None:
        # Check that non-admins or non-topic managers cannot access the
        # topics and skills dashboard data.
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.admin_id, description='Description')
        self.login(self.NEW_USER_EMAIL)
        self.get_json(
            feconf.TOPICS_AND_SKILLS_DASHBOARD_DATA_URL,
            expected_status_int=401)
        self.logout()

        # Check that admins can access the topics and skills dashboard data.
        self.login(self.CURRICULUM_ADMIN_EMAIL)
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
            len(json_response['mergeable_skill_summary_dicts']), 2)

        for skill_dict in json_response['mergeable_skill_summary_dicts']:
            if skill_dict['description'] == 'Description 3':
                self.assertEqual(skill_dict['id'], self.linked_skill_id)
        self.assertEqual(
            len(json_response['categorized_skills_dict']), 1)
        self.assertEqual(
            json_response['untriaged_skill_summary_dicts'][0]['id'],
            skill_id)
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
            True)
        self.assertEqual(
            json_response['topic_summary_dicts'][0]['id'], self.topic_id)
        self.assertEqual(
            json_response['topic_summary_dicts'][0]['id'], self.topic_id)
        self.assertEqual(
            len(json_response['untriaged_skill_summary_dicts']), 1)
        self.assertEqual(
            len(json_response['mergeable_skill_summary_dicts']), 2)
        for skill_dict in json_response['mergeable_skill_summary_dicts']:
            if skill_dict['description'] == 'Description 3':
                self.assertEqual(skill_dict['id'], self.linked_skill_id)
        self.assertEqual(
            json_response['untriaged_skill_summary_dicts'][0]['id'],
            skill_id)
        self.assertEqual(
            len(json_response['all_classroom_names']), 1)
        self.assertEqual(
            json_response['all_classroom_names'], ['math'])
        self.assertEqual(
            json_response['can_delete_topic'], False)
        self.assertEqual(
            json_response['can_create_topic'], False)
        self.assertEqual(
            json_response['can_delete_skill'], False)
        self.assertEqual(
            json_response['can_create_skill'], False)
        self.logout()


class CategorizedAndUntriagedSkillsDataHandlerTests(
    BaseTopicsAndSkillsDashboardTests):

    def test_get(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.admin_id, description='Description')

        # Check that logged out users can access the categorized and
        # untriaged skills data.
        json_response = self.get_json(
            '/topics_and_skills_dashboard/'
            'categorized_and_untriaged_skills_data',
            expected_status_int=200)
        self.assertEqual(
            len(json_response['untriaged_skill_summary_dicts']), 1)
        self.assertEqual(
            json_response['untriaged_skill_summary_dicts'][0]['skill_id'],
            skill_id)
        self.assertEqual(
            len(json_response['categorized_skills_dict']), 1)

        # Check that logged in users can access the categorized and
        # untriaged skills data.
        self.login(self.NEW_USER_EMAIL)
        json_response = self.get_json(
            '/topics_and_skills_dashboard/'
            'categorized_and_untriaged_skills_data',
            expected_status_int=200)
        self.assertEqual(
            len(json_response['untriaged_skill_summary_dicts']), 1)
        self.assertEqual(
            json_response['untriaged_skill_summary_dicts'][0]['skill_id'],
            skill_id)
        self.assertEqual(
            len(json_response['categorized_skills_dict']), 1)
        self.logout()


class TopicAssignmentsHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def test_get(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.admin_id, description='Skill description')

        json_response = self.get_json(
            '%s/%s' % (feconf.UNASSIGN_SKILL_DATA_HANDLER_URL, skill_id))
        self.assertEqual(len(json_response['topic_assignment_dicts']), 0)

        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id_1, self.admin_id, name='Topic1',
            abbreviated_name='topic-one', url_fragment='topic-one',
            description='Description1', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[skill_id],
            subtopics=[], next_subtopic_id=1,
            page_title_fragment_for_web='testing')
        subtopic = topic_domain.Subtopic.from_dict({
            'id': 1,
            'title': 'subtopic1',
            'skill_ids': [skill_id],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'thumbnail_size_in_bytes': None,
            'url_fragment': 'subtopic-url'
        })
        self.save_new_topic(
            topic_id_2, self.admin_id, name='Topic2',
            abbreviated_name='topic-two', url_fragment='topic-two',
            description='Description2', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2,
            page_title_fragment_for_web='testing')

        json_response = self.get_json(
            '%s/%s' % (feconf.UNASSIGN_SKILL_DATA_HANDLER_URL, skill_id))
        sort_func: Callable[[Dict[str, str]], str] = lambda i: i['topic_name']
        topic_assignment_dicts = sorted(
            json_response['topic_assignment_dicts'],
            key=sort_func
        )

        self.assertEqual(len(topic_assignment_dicts), 2)
        self.assertEqual(topic_assignment_dicts[0]['topic_name'], 'Topic1')
        self.assertEqual(topic_assignment_dicts[0]['topic_id'], topic_id_1)
        self.assertIsNone(topic_assignment_dicts[0]['subtopic_id'])

        self.assertEqual(topic_assignment_dicts[1]['topic_name'], 'Topic2')
        self.assertEqual(topic_assignment_dicts[1]['topic_id'], topic_id_2)
        self.assertEqual(topic_assignment_dicts[1]['subtopic_id'], 1)


class SkillsDashboardPageDataHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def test_post(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'sort': 'Oldest Created',
                'classroom_name': 'All',
                'status': 'All',
                'keywords': [],
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 2)
        self.assertEqual(
            json_response['skill_summary_dicts'][0]['id'], self.linked_skill_id)
        self.assertEqual(
            json_response['skill_summary_dicts'][1]['id'],
            self.subtopic_skill_id)
        self.assertFalse(json_response['more'])
        self.assertEqual(json_response['next_cursor'], None)

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'sort': 'Newly Created',
                'classroom_name': 'All',
                'status': 'All',
                'keywords': [],
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 2)
        self.assertEqual(
            json_response['skill_summary_dicts'][0]['id'],
            self.subtopic_skill_id)
        self.assertEqual(
            json_response['skill_summary_dicts'][1]['id'], self.linked_skill_id)

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'sort': 'Most Recently Updated',
                'classroom_name': 'All',
                'status': 'All',
                'keywords': [],
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 2)
        self.assertEqual(
            json_response['skill_summary_dicts'][0]['id'],
            self.subtopic_skill_id)
        self.assertEqual(
            json_response['skill_summary_dicts'][1]['id'], self.linked_skill_id)
        self.assertFalse(json_response['more'])
        self.assertEqual(json_response['next_cursor'], None)

    def test_fetch_filtered_skills_with_given_keywords(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'keywords': ['description'],
                'sort': 'Newly Created',
                'classroom_name': 'All',
                'status': 'All',
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 1)
        self.assertEqual(
            json_response['skill_summary_dicts'][0]['id'], self.linked_skill_id)
        self.assertEqual(
            json_response['skill_summary_dicts'][0]['description'],
            'Description 3')
        self.assertFalse(json_response['more'])
        self.assertEqual(json_response['next_cursor'], None)

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'keywords': ['subtopic'],
                'sort': 'Newly Created',
                'classroom_name': 'All',
                'status': 'All',
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 1)
        self.assertEqual(
            json_response['skill_summary_dicts'][0]['id'],
            self.subtopic_skill_id)
        self.assertEqual(
            json_response['skill_summary_dicts'][0]['description'],
            'Subtopic Skill')
        self.assertFalse(json_response['more'])
        self.assertEqual(json_response['next_cursor'], None)

    def test_fetch_filtered_skills_with_given_status(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'status': 'Assigned',
                'sort': 'Newly Created',
                'classroom_name': 'All',
                'keywords': []
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 2)
        self.assertFalse(json_response['more'])
        self.assertEqual(json_response['next_cursor'], None)

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'status': 'Unassigned',
                'sort': 'Newly Created',
                'classroom_name': 'All',
                'keywords': []
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 0)
        self.assertFalse(json_response['more'])
        self.assertEqual(json_response['next_cursor'], None)

    def test_fetch_filtered_skills_with_given_cursor(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.admin_id, description='Random Skill')

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 1,
                'status': 'All',
                'sort': 'Newly Created',
                'classroom_name': 'All',
                'keywords': []
            }, csrf_token=csrf_token)

        # Default sort is "Newly created first". So, the skill with id-skill_id
        # is the most "Newly created", and therefore it comes first. The skill
        # with id-subtopic_skill_id was created before the above skill,
        # so it comes second. Then the skill with id-linked_skill_id was created
        # before the other two skills, hence it comes last because it is the
        # least "Newly Created".
        self.assertEqual(len(json_response['skill_summary_dicts']), 2)
        self.assertEqual(
            json_response['skill_summary_dicts'][0]['id'], skill_id)
        self.assertEqual(
            json_response['skill_summary_dicts'][1]['id'],
            self.subtopic_skill_id)
        self.assertTrue(json_response['more'])
        self.assertIsInstance(json_response['next_cursor'], str)

        next_cursor = json_response['next_cursor']

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 1,
                'next_cursor': next_cursor,
                'status': 'All',
                'sort': 'Newly Created',
                'classroom_name': 'All',
                'keywords': []
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 1)
        self.assertEqual(
            json_response['skill_summary_dicts'][0]['id'], self.linked_skill_id)

    def test_fetch_filtered_skills_with_invalid_num_skills_to_fetch(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 'string',
                'status': 'All',
                'sort': 'Newly Created',
                'classroom_name': 'All',
                'keywords': [],
            }, csrf_token=csrf_token,
            expected_status_int=400)

        expected_error = (
            'At \'http://localhost/skills_dashboard/data\' '
            'these errors are happening:\n'
            'Schema validation for \'num_skills_to_fetch\' '
            'failed: Could not convert str to int: string'
        )

        self.assertEqual(
            json_response['error'],
            expected_error)

    def test_fetch_filtered_skills_with_invalid_cursor_type(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.admin_id, description='Random Skill')

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 1,
                'next_cursor': 40,
                'status': 'All',
                'sort': 'Newly Created',
                'classroom_name': 'All',
                'keywords': []
            }, csrf_token=csrf_token,
            expected_status_int=400)

        expected_error = (
            'At \'http://localhost/skills_dashboard/data\' '
            'these errors are happening:\n'
            'Schema validation for \'next_cursor\' failed: '
            'Expected string, received 40'
        )

        self.assertEqual(
            json_response['error'], expected_error)

    def test_fetch_filtered_skills_with_invalid_cursor_value(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.admin_id, description='Random Skill')

        self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 1,
                'next_cursor': 'kfsdkam43k4334',
                'status': 'All',
                'sort': 'Newly Created',
                'classroom_name': 'All',
                'keywords': []
            }, csrf_token=csrf_token,
            expected_status_int=500)

    def test_fetch_filtered_skills_with_invalid_classroom(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'classroom_name': 20,
                'status': 'All',
                'sort': 'Newly Created',
                'keywords': [],
            }, csrf_token=csrf_token,
            expected_status_int=400)

        expected_error = (
            'At \'http://localhost/skills_dashboard/data\' '
            'these errors are happening:\n'
            'Schema validation for \'classroom_name\' failed: '
            'Expected string, received 20'
        )

        self.assertEqual(
            json_response['error'], expected_error)

    def test_fetch_filtered_skills_with_invalid_keywords(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'keywords': 20,
                'classroom_name': 'All',
                'status': 'All',
                'sort': 'Newly Created',
            }, csrf_token=csrf_token,
            expected_status_int=400)

        expected_error = (
            'At \'http://localhost/skills_dashboard/data\' '
            'these errors are happening:\n'
            'Schema validation for \'keywords\' failed: '
            'Expected list, received 20'
        )

        self.assertEqual(
            json_response['error'], expected_error)

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'keywords': ['apple', 20],
                'classroom_name': 'All',
                'status': 'All',
                'sort': 'Newly Created',
            }, csrf_token=csrf_token,
            expected_status_int=400)

        expected_error = (
            'At \'http://localhost/skills_dashboard/data\' '
            'these errors are happening:\n'
            'Schema validation for \'keywords\' failed: '
            'Expected string, received 20'
        )

        self.assertEqual(
            json_response['error'], expected_error)

    def test_fetch_filtered_skills_with_invalid_status(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'status': 20,
                'classroom_name': 'All',
                'sort': 'Newly Created',
                'keywords': []
            }, csrf_token=csrf_token,
            expected_status_int=400)

        expected_error = (
            'At \'http://localhost/skills_dashboard/data\' '
            'these errors are happening:\n'
            'Schema validation for \'status\' failed: '
            'Expected string, received 20'
        )

        self.assertEqual(
            json_response['error'], expected_error)

    def test_fetch_filtered_skills_with_invalid_sort(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'sort': 20,
                'classroom_name': 'All',
                'status': 'All',
                'keywords': []
            }, csrf_token=csrf_token,
            expected_status_int=400)

        expected_error = (
            'At \'http://localhost/skills_dashboard/data\' '
            'these errors are happening:\n'
            'Schema validation for \'sort\' failed: '
            'Expected string, received 20'
        )

        self.assertEqual(
            json_response['error'], expected_error)


class NewTopicHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def setUp(self) -> None:
        super().setUp()
        self.url = feconf.NEW_TOPIC_URL

    def test_topic_creation(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'name': 'Topic name',
            'description': 'Topic description',
            'filename': 'test_svg.svg',
            'thumbnailBgColor': '#C6DCDA',
            'url_fragment': 'name-one',
            'page_title_fragment': 'testing'
        }

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            upload_files=[('image', 'unused_filename', raw_image)]
        )
        topic_id = json_response['topicId']
        self.assertEqual(len(topic_id), 12)
        self.assertIsNotNone(
            topic_fetchers.get_topic_by_id(topic_id, strict=False))
        self.logout()

    def test_topic_creation_with_invalid_name(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'name': 'Topic name that is too long for validation.',
            'abbreviatedName': 'name-two'
        }
        self.post_json(
            self.url, payload, csrf_token=csrf_token, expected_status_int=400)

        payload = {
            'name': '',
            'abbreviatedName': 'name-two'
        }
        self.post_json(
            self.url, payload, csrf_token=csrf_token, expected_status_int=400)

        self.logout()

    def test_topic_creation_with_invalid_image(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'name': 'Topic name',
            'description': 'Topic description',
            'filename': 'cafe.flac',
            'thumbnailBgColor': '#C6DCDA',
            'url_fragment': 'name-three',
            'page_title_fragment': 'testing'
        }

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'cafe.flac'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()

        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            upload_files=[('image', 'unused_filename', raw_image)],
            expected_status_int=400
        )

        self.assertEqual(
            json_response['error'], 'Image exceeds file size limit of 100 KB.')


class NewSkillHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def setUp(self) -> None:
        super().setUp()
        self.url = feconf.NEW_SKILL_URL
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None
        ) as f:
            self.original_image_content = f.read()

    def test_skill_creation(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        rubrics = [{
            'difficulty': constants.SKILL_DIFFICULTIES[0],
            'explanations': ['Explanation 1']
        }, {
            'difficulty': constants.SKILL_DIFFICULTIES[1],
            'explanations': ['Explanation 2']
        }, {
            'difficulty': constants.SKILL_DIFFICULTIES[2],
            'explanations': ['Explanation 3']
        }]
        json_response = self.post_json(
            self.url, {
                'description': 'Skill Description',
                'rubrics': rubrics,
                'explanation_dict': state_domain.SubtitledHtml(
                    '1', '<p>Explanation</p>').to_dict(),
                'linked_topic_ids': [],
                'files': {
                    'img.png': (
                        base64.b64encode(
                            self.original_image_content
                        ).decode('utf-8')
                    )
                }
            },
            csrf_token=csrf_token)
        skill_id = json_response['skillId']
        self.assertEqual(len(skill_id), 12)
        self.assertIsNotNone(
            skill_fetchers.get_skill_by_id(skill_id, strict=False))
        self.logout()

    def test_skill_creation_in_invalid_topic(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'description': 'Skill Description',
            'rubrics': [],
            'linked_topic_ids': [topic_fetchers.get_new_topic_id()],
            'explanation_dict': state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>').to_dict(),
            'files': {}
        }
        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(json_response['status_code'], 400)
        self.logout()

    def test_skill_creation_with_invalid_images(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        explanation_html = (
            '<oppia-noninteractive-image filepath-with-value='
            '"&quot;img.svg&quot;" caption-with-value="&quot;&quot;" '
            'alt-with-value="&quot;Image&quot;"></oppia-noninteractive-image>'
        )
        rubrics = [{
            'difficulty': constants.SKILL_DIFFICULTIES[0],
            'explanations': ['Explanation 1']
        }, {
            'difficulty': constants.SKILL_DIFFICULTIES[1],
            'explanations': ['Explanation 2']
        }, {
            'difficulty': constants.SKILL_DIFFICULTIES[2],
            'explanations': ['Explanation 3']
        }]
        post_data = {
            'description': 'Skill Description',
            'rubrics': rubrics,
            'explanation_dict': state_domain.SubtitledHtml(
                '1', explanation_html).to_dict(),
            'linked_topic_ids': [],
            'files': {
                'img.svg': None
            }
        }

        response_dict = self.post_json(
            self.url, post_data,
            csrf_token=csrf_token,
            expected_status_int=400)

        self.assertIn(
            'Schema validation for \'files\' failed: No image supplied',
            response_dict['error'])

        large_image = '<svg><path d="%s" /></svg>' % (
            'M150 0 L75 200 L225 200 Z ' * 4000)
        post_data = {
            'description': 'Skill Description 2',
            'rubrics': rubrics,
            'explanation_dict': state_domain.SubtitledHtml(
                '1', explanation_html).to_dict(),
            'linked_topic_ids': [],
            'files': {
                'img.svg': large_image
            }
        }
        response_dict = self.post_json(
            self.url, post_data,
            csrf_token=csrf_token,
            expected_status_int=400)

        self.assertIn(
            'Image exceeds file size limit of 100 KB.',
            response_dict['error'])
        self.logout()

    def test_skill_creation_with_valid_images(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        explanation_html = (
            '<oppia-noninteractive-image filepath-with-value='
            '"&quot;img.png&quot;" caption-with-value="&quot;&quot;" '
            'alt-with-value="&quot;Image&quot;"></oppia-noninteractive-image>'
        )
        explanation_html_2 = (
            '<oppia-noninteractive-image filepath-with-value='
            '"&quot;img_2.png&quot;" caption-with-value="&quot;&quot;" '
            'alt-with-value="&quot;Image 2&quot;"></oppia-noninteractive-image>'
        )
        rubrics = [{
            'difficulty': constants.SKILL_DIFFICULTIES[0],
            'explanations': ['Explanation 1', explanation_html_2]
        }, {
            'difficulty': constants.SKILL_DIFFICULTIES[1],
            'explanations': ['Explanation 2']
        }, {
            'difficulty': constants.SKILL_DIFFICULTIES[2],
            'explanations': ['Explanation 3']
        }]

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()

        post_data = {
            'description': 'Skill Description',
            'rubrics': rubrics,
            'explanation_dict': state_domain.SubtitledHtml(
                '1', explanation_html).to_dict(),
            'linked_topic_ids': [],
            'files': {
                'img.png': base64.b64encode(raw_image).decode('utf-8'),
                'img_2.png': base64.b64encode(raw_image).decode('utf-8')
            }
        }

        json_response = self.post_json(
            self.url, post_data,
            csrf_token=csrf_token
        )
        skill_id = json_response['skillId']
        self.assertIsNotNone(
            skill_fetchers.get_skill_by_id(skill_id, strict=False))
        self.logout()

    def test_skill_creation_in_invalid_rubrics(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'description': 'Skill Description',
            'linked_topic_ids': [self.topic_id],
            'rubrics': 'invalid',
            'explanation_dict': state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>').to_dict(),
            'files': {}
        }
        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(json_response['status_code'], 400)
        self.logout()

    def test_skill_creation_in_invalid_explanation(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        corrupt_payload = {
            'description': 'Skill Description',
            'linked_topic_ids': [self.topic_id],
            'rubrics': [],
            'explanation_dict': 'explanation'
        }
        json_response = self.post_json(
            self.url, corrupt_payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(json_response['status_code'], 400)

        rubrics: List[skill_domain.RubricDict] = []
        files: Dict[str, bytes] = {}
        payload = {
            'description': 'Skill Description',
            'linked_topic_ids': [self.topic_id],
            'rubrics': rubrics,
            'explanation_dict': {
                'explanation': 'Explanation'
            },
            'files': files
        }
        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(json_response['status_code'], 400)
        self.logout()

    def test_skill_creation_in_valid_topic(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        rubrics = [{
            'difficulty': constants.SKILL_DIFFICULTIES[0],
            'explanations': ['Explanation 1']
        }, {
            'difficulty': constants.SKILL_DIFFICULTIES[1],
            'explanations': ['Explanation 2']
        }, {
            'difficulty': constants.SKILL_DIFFICULTIES[2],
            'explanations': ['Explanation 3']
        }]
        payload = {
            'description': 'Skill Description',
            'linked_topic_ids': [self.topic_id],
            'rubrics': rubrics,
            'explanation_dict': state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>').to_dict(),
            'files': {}
        }
        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token)
        skill_id = json_response['skillId']
        self.assertEqual(len(skill_id), 12)
        self.assertIsNotNone(
            skill_fetchers.get_skill_by_id(skill_id, strict=False))
        topic = topic_fetchers.get_topic_by_id(self.topic_id)
        self.assertEqual(
            topic.uncategorized_skill_ids,
            [self.linked_skill_id, skill_id])
        self.logout()

    def test_skill_creation_in_duplicate_description(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        rubrics = [{
            'difficulty': constants.SKILL_DIFFICULTIES[0],
            'explanations': ['Explanation 1']
        }, {
            'difficulty': constants.SKILL_DIFFICULTIES[1],
            'explanations': ['Explanation 2']
        }, {
            'difficulty': constants.SKILL_DIFFICULTIES[2],
            'explanations': ['Explanation 3']
        }]
        post_data = {
            'description': 'Duplicate Skill Description',
            'rubrics': rubrics,
            'explanation_dict': state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>').to_dict(),
            'linked_topic_ids': [],
            'files': {}
        }

        # No errors when we publish the skill description for the first time.
        response_dict = self.post_json(
            self.url, post_data,
            csrf_token=csrf_token)
        self.assertTrue('error' not in response_dict)

        # Error when we publish the same skill description again.
        response_dict = self.post_json(
            self.url, post_data,
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertIn(
            'Skill description should not be a duplicate',
            response_dict['error'])

        self.logout()


class MergeSkillHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def setUp(self) -> None:
        super().setUp()
        self.url = feconf.MERGE_SKILLS_URL

        self.question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        self.question = self.save_new_question(
            self.question_id, self.admin_id,
            self._create_valid_question_data('ABC', content_id_generator),
            [self.linked_skill_id],
            content_id_generator.next_content_id_index)
        question_services.create_new_question_skill_link(
            self.admin_id, self.question_id, self.linked_skill_id, 0.5)

    def test_merge_skill(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        old_skill_id = self.linked_skill_id
        new_skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            new_skill_id, self.admin_id, description='Skill Description')
        old_links = question_services.get_question_skill_links_of_skill(
            old_skill_id, 'Old Description')
        new_links = question_services.get_question_skill_links_of_skill(
            new_skill_id, 'Skill Description')

        self.assertEqual(len(old_links), 1)
        self.assertEqual(old_links[0].skill_id, old_skill_id)
        self.assertEqual(len(new_links), 0)

        csrf_token = self.get_new_csrf_token()
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

    def test_merge_skill_fails_when_new_skill_id_is_invalid(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        old_skill_id = self.linked_skill_id
        payload = {
            'old_skill_id': old_skill_id,
            'new_skill_id': 'invalid_new_skill_id'
            }
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            self.url, payload, csrf_token=csrf_token, expected_status_int=400
        )
        self.assertIn(
            'Schema validation for \'new_skill_id\' failed',
            response['error']
        )

        self.logout()

    def test_merge_skill_fails_when_old_skill_id_is_invalid(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        new_skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            new_skill_id, self.admin_id, description='Skill Description')
        payload = {
            'old_skill_id': 'invalid_old_skill_id',
            'new_skill_id': new_skill_id
            }
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            self.url, payload, csrf_token=csrf_token, expected_status_int=400
        )
        self.assertIn(
            'Schema validation for \'old_skill_id\' failed',
            response['error']
        )

        self.logout()


class TopicIdToDiagnosticTestSkillIdsHandlerTests(
    BaseTopicsAndSkillsDashboardTests):
    """Tests TopicIdToDiagnosticTestSkillIdsHandler class."""

    def setUp(self) -> None:
        super().setUp()
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.url = '%s/?comma_separated_topic_ids=%s' % (
            feconf.TOPIC_ID_TO_DIAGNOSTIC_TEST_SKILL_IDS_HANDLER, 'topic_id')

        self.topic = topic_domain.Topic.create_default_topic(
            'topic_id', 'topic', 'abbrev', 'description', 'fragm')
        self.topic.thumbnail_filename = 'thumbnail.svg'
        self.topic.thumbnail_bg_color = '#C6DCDA'
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        self.topic.next_subtopic_id = 2
        self.topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.admin_id, self.topic)

    def test_topic_id_to_diagnostic_test_skill_ids_handler_returns_correctly(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        json_response = self.get_json(self.url)
        self.assertEqual(
            json_response['topic_id_to_diagnostic_test_skill_ids'],
            {'topic_id': ['skill_id_1']}
        )

        url = '%s/?comma_separated_topic_ids=%s' % (
            feconf.TOPIC_ID_TO_DIAGNOSTIC_TEST_SKILL_IDS_HANDLER,
            'incorrect_topic_id')
        json_response = self.get_json(url, expected_status_int=500)
        self.assertEqual(
            json_response['error'],
            'No corresponding topic models exist for these topic IDs: '
            'incorrect_topic_id.'
        )

        url = '%s/?comma_separated_topic_ids=%s' % (
            feconf.TOPIC_ID_TO_DIAGNOSTIC_TEST_SKILL_IDS_HANDLER, '')
        json_response = self.get_json(url)
        self.assertEqual(
            json_response['topic_id_to_diagnostic_test_skill_ids'], {})
