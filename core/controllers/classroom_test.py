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

"""Tests for the classroom page."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import classroom_config_domain
from core.domain import classroom_config_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.tests import test_utils

from typing import Callable, Dict, Union

dummy_thumbnail_data = classroom_config_domain.ImageData(
    'thumbnail.svg', 'transparent', 1000
)
dummy_banner_data = classroom_config_domain.ImageData(
    'banner.png', 'transparent', 1000
)


class BaseClassroomControllerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        self.private_topic_id = topic_fetchers.get_new_topic_id()
        self.public_topic_id_1 = topic_fetchers.get_new_topic_id()
        self.public_topic_id_2 = topic_fetchers.get_new_topic_id()
        self.public_topic_id_3 = topic_fetchers.get_new_topic_id()

        self.private_topic = topic_domain.Topic.create_default_topic(
            self.private_topic_id, 'private_topic_name',
            'private-topic-name', 'description', 'fragm')

        topic_services.save_new_topic(admin_id, self.private_topic)

        self.public_topic_1 = topic_domain.Topic.create_default_topic(
            self.public_topic_id_1, 'public_topic_1_name',
            'public-topic-one', 'description', 'fragm')
        self.public_topic_1.thumbnail_filename = 'Topic.svg'
        self.public_topic_1.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.public_topic_1.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1', 'skill_id_2', 'skill_id_3'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        self.public_topic_1.next_subtopic_id = 2
        self.public_topic_1.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(admin_id, self.public_topic_1)
        topic_services.publish_topic(self.public_topic_id_1, admin_id)

        self.public_topic_2 = topic_domain.Topic.create_default_topic(
            self.public_topic_id_2, 'public_topic_2_name',
            'public-topic-two', 'description', 'fragm')
        self.public_topic_2.thumbnail_filename = 'Topic.svg'
        self.public_topic_2.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.public_topic_2.subtopics = [
            topic_domain.Subtopic(
                2, 'TitleTwo', ['skill_id_1', 'skill_id_2', 'skill_id_3'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        self.public_topic_2.next_subtopic_id = 3
        self.public_topic_2.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(admin_id, self.public_topic_2)
        topic_services.publish_topic(self.public_topic_id_2, admin_id)

        self.public_topic_3 = topic_domain.Topic.create_default_topic(
            self.public_topic_id_3, 'public_topic_3_name',
            'public-topic-three', 'description', 'fragm')
        self.public_topic_3.thumbnail_filename = 'Topic.svg'
        self.public_topic_3.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.public_topic_3.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1', 'skill_id_2', 'skill_id_3'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        self.public_topic_3.next_subtopic_id = 2
        self.public_topic_3.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(admin_id, self.public_topic_3)
        topic_services.publish_topic(self.public_topic_id_3, admin_id)

        self.logout()


class ClassroomPageTests(BaseClassroomControllerTests):

    def test_any_user_can_access_classroom_page(self) -> None:
        response = self.get_html_response('/learn/math')
        self.assertIn(
            '<oppia-root></oppia-root>', response)


class ClassroomDataHandlerTests(BaseClassroomControllerTests):

    def test_get(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.save_new_valid_classroom(
            topic_id_to_prerequisite_topic_ids={
                        self.public_topic_id_1: [],
                        self.private_topic_id: []
            },
            course_details='Course details for classroom.',
            topic_list_intro='Topics covered for classroom'
        )
        self.logout()

        json_response = self.get_json(
            '%s/%s' % (feconf.CLASSROOM_DATA_HANDLER, 'math'))
        topic_summary_dict = (
            topic_fetchers.get_topic_summary_by_id(
                self.public_topic_id_1
            ).to_dict()
        )
        public_topic_1_summary_dict = {
            'id': topic_summary_dict['id'],
            'name': topic_summary_dict['name'],
            'url_fragment': topic_summary_dict['url_fragment'],
            'language_code': topic_summary_dict['language_code'],
            'description': topic_summary_dict['description'],
            'version': topic_summary_dict['version'],
            'canonical_story_count': (
                topic_summary_dict['canonical_story_count']),
            'additional_story_count': (
                topic_summary_dict['additional_story_count']),
            'uncategorized_skill_count': (
                topic_summary_dict['uncategorized_skill_count']),
            'subtopic_count': topic_summary_dict['subtopic_count'],
            'total_skill_count': (
                topic_summary_dict['total_skill_count']),
            'total_published_node_count': (
                topic_summary_dict['total_published_node_count']),
            'thumbnail_filename': (
                topic_summary_dict['thumbnail_filename']),
            'thumbnail_bg_color': (
                topic_summary_dict['thumbnail_bg_color']),
            'published_story_exploration_mapping': (
                topic_summary_dict['published_story_exploration_mapping']),
            'topic_model_created_on': (
                topic_summary_dict['topic_model_created_on']),
            'topic_model_last_updated': (
                topic_summary_dict['topic_model_last_updated']),
            'is_published': True
        }
        topic_summary_dict = (
            topic_fetchers.get_topic_summary_by_id(
                self.private_topic_id
            ).to_dict()
        )
        private_topic_summary_dict = {
            'id': topic_summary_dict['id'],
            'name': topic_summary_dict['name'],
            'url_fragment': topic_summary_dict['url_fragment'],
            'language_code': topic_summary_dict['language_code'],
            'description': topic_summary_dict['description'],
            'version': topic_summary_dict['version'],
            'canonical_story_count': (
                topic_summary_dict['canonical_story_count']),
            'additional_story_count': (
                topic_summary_dict['additional_story_count']),
            'uncategorized_skill_count': (
                topic_summary_dict['uncategorized_skill_count']),
            'subtopic_count': topic_summary_dict['subtopic_count'],
            'total_skill_count': (
                topic_summary_dict['total_skill_count']),
            'total_published_node_count': (
                topic_summary_dict['total_published_node_count']),
            'thumbnail_filename': (
                topic_summary_dict['thumbnail_filename']),
            'thumbnail_bg_color': (
                topic_summary_dict['thumbnail_bg_color']),
            'published_story_exploration_mapping': (
                topic_summary_dict['published_story_exploration_mapping']),
            'topic_model_created_on': (
                topic_summary_dict['topic_model_created_on']),
            'topic_model_last_updated': (
                topic_summary_dict['topic_model_last_updated']),
            'is_published': False
        }
        expected_dict = {
            'name': 'math',
            'topic_summary_dicts': [
                public_topic_1_summary_dict, private_topic_summary_dict
            ],
            'course_details': 'Course details for classroom.',
            'topic_list_intro': 'Topics covered for classroom'
        }
        self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_fails_for_invalid_classroom_name(self) -> None:
        self.get_json(
            '%s/%s' % (
                feconf.CLASSROOM_DATA_HANDLER, 'invalid_subject'),
            expected_status_int=404)


class ClassroomAdminTests(BaseClassroomControllerTests):

    def setUp(self) -> None:
        super().setUp()

        self.physics_classroom_id = (
            classroom_config_services.get_new_classroom_id())
        self.physics_classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': self.physics_classroom_id,
            'name': 'physics',
            'url_fragment': 'physics',
            'course_details': 'Curated physics foundations course.',
            'teaser_text': 'Teaser test for physics classroom',
            'topic_list_intro': 'Start from the basics with our first topic.',
            'topic_id_to_prerequisite_topic_ids': {
                self.public_topic_id_3: []
            },
            'is_published': True,
            'thumbnail_data': dummy_thumbnail_data.to_dict(),
            'banner_data': dummy_banner_data.to_dict()
        }
        self.physics_classroom = classroom_config_domain.Classroom.from_dict(
            self.physics_classroom_dict)
        classroom_config_services.create_new_classroom(
            self.physics_classroom)

        self.math_classroom_id = (
            classroom_config_services.get_new_classroom_id())
        self.math_classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': self.math_classroom_id,
            'name': 'math',
            'url_fragment': 'math',
            'course_details': 'Curated math foundations course.',
            'teaser_text': 'Teaser test for physics classroom',
            'topic_list_intro': 'Start from the basics with our first topic.',
            'topic_id_to_prerequisite_topic_ids': {
                self.public_topic_id_2: []
            },
            'is_published': True,
            'thumbnail_data': dummy_thumbnail_data.to_dict(),
            'banner_data': dummy_banner_data.to_dict()
        }
        self.math_classroom = classroom_config_domain.Classroom.from_dict(
            self.math_classroom_dict)
        classroom_config_services.create_new_classroom(
            self.math_classroom)

    def test_get_classroom_id_to_classroom_name(self) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        classroom_id_to_classroom_name = {
            self.math_classroom_id: 'math',
            self.physics_classroom_id: 'physics'
        }
        json_response = self.get_json(feconf.CLASSROOM_ID_TO_NAME_HANDLER_URL)
        self.assertEqual(
            json_response['classroom_id_to_classroom_name'],
            classroom_id_to_classroom_name
        )
        self.logout()

    def test_get_new_classroom_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        json_response = self.get_json(feconf.NEW_CLASSROOM_ID_HANDLER_URL)

        self.assertFalse(
            json_response['classroom_id'] == self.math_classroom_id)
        self.assertFalse(
            json_response['classroom_id'] == self.physics_classroom_id)

        self.logout()

    def test_get_classroom_dict(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        classroom_handler_url = '%s/%s' % (
            feconf.CLASSROOM_HANDLER_URL, self.math_classroom_id)

        json_response = self.get_json(classroom_handler_url)

        self.assertEqual(
            json_response['classroom_dict'], self.math_classroom_dict)
        self.logout()

    def test_update_classroom_data(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        classroom_handler_url = '%s/%s' % (
            feconf.CLASSROOM_HANDLER_URL, self.physics_classroom_id)
        csrf_token = self.get_new_csrf_token()

        self.physics_classroom_dict['name'] = 'Quantum physics'

        self.put_json(
            classroom_handler_url, {
                'classroom_dict': self.physics_classroom_dict
            }, csrf_token=csrf_token)

        self.logout()

    def test_delete_classroom_data(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        classroom_handler_url = '%s/%s' % (
            feconf.CLASSROOM_HANDLER_URL, self.physics_classroom_id)

        self.delete_json(classroom_handler_url)
        self.get_json(classroom_handler_url, expected_status_int=404)
        self.logout()

    def test_mismatching_id_while_editing_classroom_should_raise_an_exception(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        classroom_handler_url = '%s/%s' % (
            feconf.CLASSROOM_HANDLER_URL, self.math_classroom_id)
        csrf_token = self.get_new_csrf_token()

        self.physics_classroom_dict['name'] = 'Quantum physics'

        response = self.put_json(
            classroom_handler_url, {
                'classroom_dict': self.physics_classroom_dict
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Classroom ID of the URL path argument must match with the ID '
            'given in the classroom payload dict.'
        )
        self.logout()

    def test_duplicate_classroom_url_fragment_should_return_true(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        # The classroom with the names ‘math’ and ‘physics’ is already created
        # in the setUp method of the test class.

        classroom_url_fragment_handler_url = '%s/%s' % (
            feconf.CLASSROOM_URL_FRAGMENT_HANDLER, 'math')
        json_response = self.get_json(classroom_url_fragment_handler_url)

        self.assertTrue(json_response['classroom_url_fragment_exists'])
        self.logout()

    def test_non_duplicate_classroom_url_fragment_should_return_false(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        # The classroom with the names ‘math’ and ‘physics’ is already created
        # in the setUp method of the test class.

        classroom_url_fragment_handler_url = '%s/%s' % (
            feconf.CLASSROOM_URL_FRAGMENT_HANDLER, 'chemistry')
        json_response = self.get_json(classroom_url_fragment_handler_url)

        self.assertFalse(json_response['classroom_url_fragment_exists'])
        self.logout()

    def test_get_classroom_id_from_url_fragment_works_correctly(
        self
    ) -> None:
        url = '%s/%s' % (feconf.CLASSROOM_ID_HANDLER_URL, 'physics')

        json_response = self.get_json(url)

        self.assertEqual(
            json_response['classroom_id'],
            self.physics_classroom_id
        )

        non_existent_classroom_url = '%s/%s' % (
            feconf.CLASSROOM_ID_HANDLER_URL, 'incorrect')

        json_response = self.get_json(
            non_existent_classroom_url, expected_status_int=404)

    def test_assigning_topic_to_multiple_classrooms_should_raise_an_exception(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        classroom_handler_url = '%s/%s' % (
            feconf.CLASSROOM_HANDLER_URL, self.physics_classroom.classroom_id)
        csrf_token = self.get_new_csrf_token()

        self.physics_classroom_dict['topic_id_to_prerequisite_topic_ids'] = {
            self.public_topic_id_2: []
        }

        response = self.put_json(
            classroom_handler_url, {
                'classroom_dict': self.physics_classroom_dict
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Topic public_topic_2_name is already assigned to a classroom. '
            'A topic can only be assigned to one classroom.'
        )
        self.logout()


class UnusedTopicsHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.owner_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.used_topic1 = topic_domain.Topic.create_default_topic(
            'used_topic_1', 'used_topic1_name',
            'frag-used-topic-one', 'description', 'fragm')
        topic_services.save_new_topic(self.owner_id, self.used_topic1)

        self.physics_classroom_id = (
            classroom_config_services.get_new_classroom_id())
        self.physics_classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': self.physics_classroom_id,
            'name': 'physics',
            'url_fragment': 'physics',
            'course_details': 'Curated physics foundations course.',
            'teaser_text': 'Teaser test for physics classroom',
            'topic_list_intro': 'Start from the basics with our first topic.',
            'topic_id_to_prerequisite_topic_ids': {
                'topic_id_1': ['topic_id_2', 'topic_id_3'],
                'topic_id_2': [],
                'topic_id_3': [],
                'used_topic_1': []
            },
            'is_published': True,
            'thumbnail_data': dummy_thumbnail_data.to_dict(),
            'banner_data': dummy_banner_data.to_dict()
        }
        self.physics_classroom = classroom_config_domain.Classroom.from_dict(
            self.physics_classroom_dict)
        classroom_config_services.create_new_classroom(
            self.physics_classroom)

    def test_returns_newly_added_unused_topics(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        unused_topic1 = topic_domain.Topic.create_default_topic(
            'unused_topic1', 'unused_topic1_name',
            'frag-topic-one', 'description', 'fragm')
        topic_services.save_new_topic(self.owner_id, unused_topic1)
        unused_topics = [unused_topic1.to_dict()]
        json_response = self.get_json(feconf.UNUSED_TOPICS_HANDLER_URL)
        self.assertEqual(
            json_response['unused_topics'],
            unused_topics
        )

        unused_topic2 = topic_domain.Topic.create_default_topic(
            'unused_topic2', 'unused_topic2_name',
            'frag-topic-two', 'description', 'fragm')
        topic_services.save_new_topic(self.owner_id, unused_topic2)
        unused_topics = [unused_topic1.to_dict(), unused_topic2.to_dict()]
        json_response = self.get_json(feconf.UNUSED_TOPICS_HANDLER_URL)
        self.assertEqual(
            json_response['unused_topics'],
            unused_topics
        )

        self.logout()

    def test_does_not_return_deleted_topic(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        unused_topic1 = topic_domain.Topic.create_default_topic(
            'unused_topic1', 'unused_topic1_name',
            'frag-topic-one', 'description', 'fragm')
        topic_services.save_new_topic(self.owner_id, unused_topic1)

        unused_topic2 = topic_domain.Topic.create_default_topic(
            'unused_topic2', 'unused_topic2_name',
            'frag-topic-two', 'description', 'fragm')
        topic_services.save_new_topic(self.owner_id, unused_topic2)

        unused_topics = [unused_topic1.to_dict(), unused_topic2.to_dict()]
        json_response = self.get_json(feconf.UNUSED_TOPICS_HANDLER_URL)
        self.assertEqual(
            json_response['unused_topics'],
            unused_topics
        )

        topic_services.delete_topic(self.owner_id, unused_topic2.id, True)
        unused_topics = [unused_topic1.to_dict()]
        json_response = self.get_json(feconf.UNUSED_TOPICS_HANDLER_URL)
        self.assertEqual(
            json_response['unused_topics'],
            unused_topics
        )

        self.logout()

    def test_returns_topic_if_unused_in_classroom(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        json_response = self.get_json(feconf.UNUSED_TOPICS_HANDLER_URL)
        self.assertEqual(
            json_response['unused_topics'],
            []
        )

        self.physics_classroom.topic_id_to_prerequisite_topic_ids.pop(
            self.used_topic1.id
            )
        classroom_config_services.update_classroom(
            self.physics_classroom)
        json_response = self.get_json(feconf.UNUSED_TOPICS_HANDLER_URL)
        self.assertEqual(
            json_response['unused_topics'],
            [self.used_topic1.to_dict()]
        )

        self.logout()

    def test_returns_no_topics_if_no_unused_topics(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        json_response = self.get_json(feconf.UNUSED_TOPICS_HANDLER_URL)
        self.assertEqual(
            json_response['unused_topics'],
            []
        )

        self.logout()

    def test_not_able_to_get_unused_topics_when_user_is_not_admin(
        self
    ) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        self.get_json(
            feconf.UNUSED_TOPICS_HANDLER_URL, expected_status_int=401)
        self.logout()


class AllClassroomsSummaryHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.save_new_valid_classroom(
            'classroom1', 'history', 'history'
        )
        self.save_new_valid_classroom(
            'classroom2', 'english', 'english'
        )

    def test_get_all_classrooms_summary(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        json_response = self.get_json(
            feconf.ALL_CLASSROOMS_SUMMARY_HANDLER_URL
        )
        expected_response = [
            {
                'classroom_id': 'classroom1',
                'name': 'history',
                'url_fragment': 'history',
                'teaser_text': 'Teaser Text',
                'is_published': True,
                'thumbnail_filename': 'thumbnail.svg',
                'thumbnail_bg_color': 'transparent'
            },
            {
                'classroom_id': 'classroom2',
                'name': 'english',
                'url_fragment': 'english',
                'teaser_text': 'Teaser Text',
                'is_published': True,
                'thumbnail_filename': 'thumbnail.svg',
                'thumbnail_bg_color': 'transparent'
            }
        ]

        sort_key: Callable[
            [Dict[str, str|bool]], str|bool] = lambda item: item['name']

        self.assertListEqual(
            sorted(json_response['all_classrooms_summary'], key=sort_key),
            sorted(expected_response, key=sort_key)
        )


class TopicsToClassroomsRelationHandlerTests(BaseClassroomControllerTests):

    def setUp(self) -> None:
        super().setUp()
        self.save_new_valid_classroom(
            topic_id_to_prerequisite_topic_ids={self.public_topic_id_1: []}
        )
        self.save_new_valid_classroom(
            classroom_id='history', name='history', url_fragment='history',
            topic_id_to_prerequisite_topic_ids={self.public_topic_id_2: []}
        )

    def test_get_all_topics_classroom_info(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        json_response = self.get_json(
            feconf.TOPICS_TO_CLASSROOM_RELATION_HANDLER_URL
        )
        expected_response = [
            {
                'topic_id': self.public_topic_id_1,
                'topic_name': 'public_topic_1_name',
                'classroom_name': 'math',
                'classroom_url_fragment': 'math'
            },
                        {
                'topic_id': self.public_topic_id_2,
                'topic_name': 'public_topic_2_name',
                'classroom_name': 'history',
                'classroom_url_fragment': 'history'
            },
            {
                'topic_id': self.public_topic_id_3,
                'topic_name': 'public_topic_3_name',
                'classroom_name': None,
                'classroom_url_fragment': None
            },
            {
                'topic_id': self.private_topic_id,
                'topic_name': 'private_topic_name',
                'classroom_name': None,
                'classroom_url_fragment': None
            }
        ]

        sort_key: Callable[
            [Dict[str, Union[str, None]]], str] = lambda item: item[
                'topic_name'] or ''
        self.assertListEqual(
            sorted(
                json_response['topics_to_classrooms_relation'],
                key=sort_key
            ),
            sorted(expected_response, key=sort_key)
        )


class NewClassroomHandlerTests(BaseClassroomControllerTests):

    def test_get_all_topics_classroom_info(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        new_classroom_handler = feconf.NEW_CLASSROOM_HANDLER_URL
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            new_classroom_handler, {
                'name': 'geography',
                'url_fragment': 'geography'
            }, csrf_token=csrf_token)

        new_classroom = classroom_config_services.get_classroom_by_url_fragment(
            'geography'
        )
        if new_classroom:
            self.assertEqual(new_classroom.name, 'geography')
            self.assertEqual(new_classroom.url_fragment, 'geography')
            self.assertFalse(new_classroom.is_published)

    def test_fail_to_create_new_classroom_if_validation_fails(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        new_classroom_handler = feconf.NEW_CLASSROOM_HANDLER_URL
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            new_classroom_handler, {
                'name': '',
                'url_fragment': 'geography'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'At \'http://localhost/classroom_admin/create_new\' '
            'these errors are happening:\n'
            'Schema validation for \'name\' failed: '
            'Validation failed: is_nonempty ({}) for object '
        )
