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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from constants import constants
from core.domain import config_services
from core.domain import question_services
from core.domain import skill_fetchers
from core.domain import skill_services
from core.domain import state_domain
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.tests import test_utils
import feconf
import python_utils


class BaseTopicsAndSkillsDashboardTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseTopicsAndSkillsDashboardTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.TOPIC_MANAGER_EMAIL, self.TOPIC_MANAGER_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.topic_manager_id = self.get_user_id_from_email(
            self.TOPIC_MANAGER_EMAIL)
        self.new_user_id = self.get_user_id_from_email(
            self.NEW_USER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([self.TOPIC_MANAGER_USERNAME])
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.linked_skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.linked_skill_id, self.admin_id, description='Description 3')
        self.subtopic_skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.subtopic_skill_id, self.admin_id, description='Subtopic Skill')

        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title')
        subtopic.skill_ids = [self.subtopic_skill_id]
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            abbreviated_name='name', url_fragment='name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.linked_skill_id],
            subtopics=[subtopic], next_subtopic_id=2)


class TopicsAndSkillsDashboardPageDataHandlerTests(
        BaseTopicsAndSkillsDashboardTests):

    def test_get(self):
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
        self.login(self.ADMIN_EMAIL)
        config_services.set_property(
            self.admin_id, 'classroom_pages_data', [{
                'url_fragment': 'math',
                'name': 'math',
                'topic_ids': [self.topic_id],
                'topic_list_intro': 'Topics covered',
                'course_details': 'Course details'
            }]
        )
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
            False)
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

    def test_topics_and_skills_dashboard_page(self):
        self.login(self.ADMIN_EMAIL)

        response = self.get_html_response(
            feconf.TOPICS_AND_SKILLS_DASHBOARD_URL)
        self.assertIn(
            '{"title": "Topics and Skills Dashboard - Oppia"})', response.body)

        self.logout()


class TopicAssignmentsHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def test_get(self):
        self.login(self.ADMIN_EMAIL)
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
            subtopics=[], next_subtopic_id=1)
        subtopic = topic_domain.Subtopic.from_dict({
            'id': 1,
            'title': 'subtopic1',
            'skill_ids': [skill_id],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'url_fragment': 'subtopic-url'
        })
        self.save_new_topic(
            topic_id_2, self.admin_id, name='Topic2',
            abbreviated_name='topic-two', url_fragment='topic-two',
            description='Description2', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)

        json_response = self.get_json(
            '%s/%s' % (feconf.UNASSIGN_SKILL_DATA_HANDLER_URL, skill_id))
        topic_assignment_dicts = sorted(
            json_response['topic_assignment_dicts'],
            key=lambda i: i['topic_name'])

        self.assertEqual(len(topic_assignment_dicts), 2)
        self.assertEqual(topic_assignment_dicts[0]['topic_name'], 'Topic1')
        self.assertEqual(topic_assignment_dicts[0]['topic_id'], topic_id_1)
        self.assertIsNone(topic_assignment_dicts[0]['subtopic_id'])

        self.assertEqual(topic_assignment_dicts[1]['topic_name'], 'Topic2')
        self.assertEqual(topic_assignment_dicts[1]['topic_id'], topic_id_2)
        self.assertEqual(topic_assignment_dicts[1]['subtopic_id'], 1)


class SkillsDashboardPageDataHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def test_post(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'sort': 'Oldest Created'
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
                'sort': 'Newly Created'
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
                'sort': 'Most Recently Updated'
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 2)
        self.assertEqual(
            json_response['skill_summary_dicts'][0]['id'],
            self.subtopic_skill_id)
        self.assertEqual(
            json_response['skill_summary_dicts'][1]['id'], self.linked_skill_id)
        self.assertFalse(json_response['more'])
        self.assertEqual(json_response['next_cursor'], None)

    def test_fetch_filtered_skills_with_given_keywords(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'keywords': ['description']
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
                'keywords': ['subtopic']
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

    def test_fetch_filtered_skills_with_given_status(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'status': 'Assigned'
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 2)
        self.assertFalse(json_response['more'])
        self.assertEqual(json_response['next_cursor'], None)

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'status': 'Unassigned'
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 0)
        self.assertFalse(json_response['more'])
        self.assertEqual(json_response['next_cursor'], None)

    def test_fetch_filtered_skills_with_given_cursor(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.admin_id, description='Random Skill')

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 1,
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
        self.assertTrue(
            isinstance(json_response['next_cursor'], python_utils.BASESTRING))

        next_cursor = json_response['next_cursor']

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 1,
                'next_cursor': next_cursor,
            }, csrf_token=csrf_token)

        self.assertEqual(len(json_response['skill_summary_dicts']), 1)
        self.assertEqual(
            json_response['skill_summary_dicts'][0]['id'], self.linked_skill_id)
        self.assertFalse(json_response['more'])
        self.assertEqual(json_response['next_cursor'], None)

    def test_fetch_filtered_skills_with_invalid_num_skills_to_fetch(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': '1',
            }, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Number of skills to fetch should be a number.')

    def test_fetch_filtered_skills_with_invalid_cursor_type(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.admin_id, description='Random Skill')

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 1,
                'next_cursor': 40
            }, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            json_response['error'], 'Next Cursor should be a string.')

    def test_fetch_filtered_skills_with_invalid_cursor_value(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.admin_id, description='Random Skill')

        self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 1,
                'next_cursor': 'kfsdkam43k4334'
            }, csrf_token=csrf_token,
            expected_status_int=500)

    def test_fetch_filtered_skills_with_invalid_classroom(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'classroom_name': 20,
            }, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            json_response['error'], 'Classroom name should be a string.')

    def test_fetch_filtered_skills_with_invalid_keywords(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'keywords': 20,
            }, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            json_response['error'], 'Keywords should be a list of strings.')

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'keywords': ['apple', 20],
            }, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            json_response['error'], 'Keywords should be a list of strings.')

    def test_fetch_filtered_skills_with_invalid_status(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'status': 20,
            }, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            json_response['error'], 'Status should be a string.')

    def test_fetch_filtered_skills_with_invalid_sort(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.post_json(
            feconf.SKILL_DASHBOARD_DATA_URL, {
                'num_skills_to_fetch': 10,
                'sort': 20,
            }, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            json_response['error'], 'The value of sort_by should be a string.')


class NewTopicHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def setUp(self):
        super(NewTopicHandlerTests, self).setUp()
        self.url = feconf.NEW_TOPIC_URL

    def test_topic_creation(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'name': 'Topic name',
            'abbreviatedName': 'name-one',
            'description': 'Topic description',
            'filename': 'test_svg.svg',
            'thumbnailBgColor': '#C6DCDA',
            'url_fragment': 'name-one'
        }

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None) as f:
            raw_image = f.read()
        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),)
        )
        topic_id = json_response['topicId']
        self.assertEqual(len(topic_id), 12)
        self.assertIsNotNone(
            topic_fetchers.get_topic_by_id(topic_id, strict=False))
        self.logout()

    def test_topic_creation_with_invalid_name(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'name': 'Topic name that is too long for validation.',
            'abbreviatedName': 'name-two'
        }
        self.post_json(
            self.url, payload, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_topic_creation_with_invalid_image(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'name': 'Topic name',
            'abbreviatedName': 'name-three',
            'description': 'Topic description',
            'filename': 'cafe.flac',
            'thumbnailBgColor': '#C6DCDA',
            'url_fragment': 'name-three'
        }

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'cafe.flac'),
            'rb', encoding=None) as f:
            raw_image = f.read()

        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),),
            expected_status_int=400
        )

        self.assertEqual(
            json_response['error'], 'Image exceeds file size limit of 100 KB.')


class NewSkillHandlerTests(BaseTopicsAndSkillsDashboardTests):

    def setUp(self):
        super(NewSkillHandlerTests, self).setUp()
        self.url = feconf.NEW_SKILL_URL
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            self.original_image_content = f.read()

    def test_skill_creation(self):
        self.login(self.ADMIN_EMAIL)
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
                'thumbnail_filename': 'image.svg'
            },
            csrf_token=csrf_token,
            upload_files=((
                'image', 'unused_filename', self.original_image_content),))
        skill_id = json_response['skillId']
        self.assertEqual(len(skill_id), 12)
        self.assertIsNotNone(
            skill_fetchers.get_skill_by_id(skill_id, strict=False))
        self.logout()

    def test_skill_creation_in_invalid_topic(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'description': 'Skill Description',
            'linked_topic_ids': ['topic'],
            'rubrics': [],
            'explanation_dict': state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>').to_dict(),
            'thumbnail_filename': 'image.svg'
        }
        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=((
                'image', 'unused_filename', self.original_image_content),))
        self.assertEqual(json_response['status_code'], 400)
        self.logout()

    def test_skill_creation_with_invalid_images(self):
        self.login(self.ADMIN_EMAIL)
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
            'thumbnail_filename': 'image.svg'
        }

        response_dict = self.post_json(
            self.url, post_data,
            csrf_token=csrf_token,
            expected_status_int=400)

        self.assertIn(
            'No image data provided for file with name img.svg',
            response_dict['error'])

        large_image = '<svg><path d="%s" /></svg>' % (
            'M150 0 L75 200 L225 200 Z ' * 4000)
        post_data = {
            'description': 'Skill Description 2',
            'rubrics': rubrics,
            'explanation_dict': state_domain.SubtitledHtml(
                '1', explanation_html).to_dict(),
            'thumbnail_filename': 'image.svg'
        }
        response_dict = self.post_json(
            self.url, post_data,
            csrf_token=csrf_token,
            upload_files=(
                ('img.svg', 'img.svg', large_image),
            ), expected_status_int=400)

        self.assertIn(
            'Image exceeds file size limit of 100 KB.',
            response_dict['error'])
        self.logout()

    def test_skill_creation_with_valid_images(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        filename = 'img.png'
        filename_2 = 'img_2.png'
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
        post_data = {
            'description': 'Skill Description',
            'rubrics': rubrics,
            'explanation_dict': state_domain.SubtitledHtml(
                '1', explanation_html).to_dict(),
            'thumbnail_filename': 'image.svg'
        }

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None) as f:
            raw_image = f.read()

        json_response = self.post_json(
            self.url, post_data,
            csrf_token=csrf_token,
            upload_files=(
                (filename, filename, raw_image),
                (filename_2, filename_2, raw_image),)
        )
        skill_id = json_response['skillId']
        self.assertIsNotNone(
            skill_fetchers.get_skill_by_id(skill_id, strict=False))
        self.logout()

    def test_skill_creation_in_invalid_rubrics(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'description': 'Skill Description',
            'linked_topic_ids': [self.topic_id],
            'rubrics': 'invalid',
            'thumbnail_filename': 'image.svg'
        }
        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=((
                'image', 'unused_filename', self.original_image_content),))
        self.assertEqual(json_response['status_code'], 400)
        self.logout()

    def test_skill_creation_in_invalid_explanation(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'description': 'Skill Description',
            'linked_topic_ids': [self.topic_id],
            'rubrics': [],
            'explanation_dict': 'explanation',
            'thumbnail_filename': 'image.svg'
        }
        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=((
                'image', 'unused_filename', self.original_image_content),))
        self.assertEqual(json_response['status_code'], 400)

        payload = {
            'description': 'Skill Description',
            'linked_topic_ids': [self.topic_id],
            'rubrics': [],
            'explanation_dict': {
                'explanation': 'Explanation'
            },
            'thumbnail_filename': 'image.svg'
        }
        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(json_response['status_code'], 400)
        self.logout()

    def test_skill_creation_in_valid_topic(self):
        self.login(self.ADMIN_EMAIL)
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
            'thumbnail_filename': 'image.svg'
        }
        json_response = self.post_json(
            self.url, payload, csrf_token=csrf_token,
            upload_files=((
                'image', 'unused_filename', self.original_image_content),))
        skill_id = json_response['skillId']
        self.assertEqual(len(skill_id), 12)
        self.assertIsNotNone(
            skill_fetchers.get_skill_by_id(skill_id, strict=False))
        topic = topic_fetchers.get_topic_by_id(self.topic_id)
        self.assertEqual(
            topic.uncategorized_skill_ids,
            [self.linked_skill_id, skill_id])
        self.logout()

    def test_skill_creation_in_duplicate_description(self):
        self.login(self.ADMIN_EMAIL)
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
            'thumbnail_filename': 'image.svg'
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

    def setUp(self):
        super(MergeSkillHandlerTests, self).setUp()
        self.url = feconf.MERGE_SKILLS_URL

        self.question_id = question_services.get_new_question_id()
        self.question = self.save_new_question(
            self.question_id, self.admin_id,
            self._create_valid_question_data('ABC'), [self.linked_skill_id])
        question_services.create_new_question_skill_link(
            self.admin_id, self.question_id, self.linked_skill_id, 0.5)

    def test_merge_skill(self):
        self.login(self.ADMIN_EMAIL)

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

    def test_merge_skill_fails_when_new_skill_id_is_invalid(self):
        self.login(self.ADMIN_EMAIL)
        old_skill_id = self.linked_skill_id
        payload = {
            'old_skill_id': old_skill_id,
            'new_skill_id': 'invalid_new_skill_id'
            }
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            self.url, payload, csrf_token=csrf_token,
            expected_status_int=404)

        self.logout()

    def test_merge_skill_fails_when_old_skill_id_is_invalid(self):
        self.login(self.ADMIN_EMAIL)
        new_skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            new_skill_id, self.admin_id, description='Skill Description')
        payload = {
            'old_skill_id': 'invalid_old_skill_id',
            'new_skill_id': new_skill_id
            }
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            self.url, payload, csrf_token=csrf_token,
            expected_status_int=404)

        self.logout()
