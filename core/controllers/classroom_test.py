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
from core.domain import config_domain
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.tests import test_utils


class BaseClassroomControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)


class DefaultClassroomRedirectPageTests(BaseClassroomControllerTests):

    def test_redirect_to_default_classroom(self):
        response = self.get_html_response('/learn', expected_status_int=302)
        self.assertEqual(
            'http://localhost/learn/math', response.headers['location'])


class ClassroomPageTests(BaseClassroomControllerTests):

    def test_any_user_can_access_classroom_page(self):
        response = self.get_html_response('/learn/math')
        self.assertIn(
            '<lightweight-oppia-root></lightweight-oppia-root>', response)


class ClassroomAdminPageTests(BaseClassroomControllerTests):
    """Checks the access to the classroom admin page and its rendering."""

    def test_classroom_admin_page_access_without_logging_in(self):
        """Tests access to the Classroom Admin page."""
        self.get_html_response('/classroom-admin', expected_status_int=302)

    def test_classroom_admin_page_access_without_being_curriculum_admin(self):
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        self.get_html_response('/classroom-admin', expected_status_int=401)
        self.logout()

    def test_classroom_admin_page_access_as_curriculum_admin(self):
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.get_html_response('/classroom-admin')
        self.logout()


class ClassroomDataHandlerTests(BaseClassroomControllerTests):

    def test_get(self):
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()
        private_topic = topic_domain.Topic.create_default_topic(
            topic_id_1, 'private_topic_name',
            'private-topic-name', 'description', 'fragm')
        topic_services.save_new_topic(admin_id, private_topic)
        public_topic = topic_domain.Topic.create_default_topic(
            topic_id_2, 'public_topic_name',
            'public-topic-name', 'description', 'fragm')
        public_topic.thumbnail_filename = 'Topic.svg'
        public_topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        public_topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1', 'skill_id_2', 'skill_id_3'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        public_topic.next_subtopic_id = 2
        public_topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(admin_id, public_topic)
        topic_services.publish_topic(topic_id_2, admin_id)

        csrf_token = self.get_new_csrf_token()
        new_config_value = [{
            'name': 'math',
            'topic_ids': [topic_id_1, topic_id_2],
            'course_details': 'Course details for classroom.',
            'topic_list_intro': 'Topics covered for classroom',
            'url_fragment': 'math',
        }]

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_domain.CLASSROOM_PAGES_DATA.name: (
                    new_config_value),
            }
        }
        self.post_json('/adminhandler', payload, csrf_token=csrf_token)
        self.logout()

        json_response = self.get_json(
            '%s/%s' % (feconf.CLASSROOM_DATA_HANDLER, 'math'))
        public_topic_summary_dict = (
            topic_fetchers.get_topic_summary_by_id(topic_id_2).to_dict())
        public_topic_summary_dict['is_published'] = True
        private_topic_summary_dict = (
            topic_fetchers.get_topic_summary_by_id(topic_id_1).to_dict())
        private_topic_summary_dict['is_published'] = False

        expected_dict = {
            'name': 'math',
            'topic_summary_dicts': [
                private_topic_summary_dict, public_topic_summary_dict
            ],
            'course_details': 'Course details for classroom.',
            'topic_list_intro': 'Topics covered for classroom'
        }
        self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_fails_for_invalid_classroom_name(self):
        self.get_json(
            '%s/%s' % (
                feconf.CLASSROOM_DATA_HANDLER, 'invalid_subject'),
            expected_status_int=404)


class ClassroomPromosStatusHandlerTests(BaseClassroomControllerTests):
    """Unit test for ClassroomPromosStatusHandler."""

    def test_get_request_returns_correct_status(self):
        self.set_config_property(
            config_domain.CLASSROOM_PROMOS_ARE_ENABLED, False)

        response = self.get_json('/classroom_promos_status_handler')
        self.assertEqual(
            response, {
                'classroom_promos_are_enabled': False
            })

        self.set_config_property(
            config_domain.CLASSROOM_PROMOS_ARE_ENABLED, True)
        response = self.get_json('/classroom_promos_status_handler')
        self.assertEqual(
            response, {
                'classroom_promos_are_enabled': True,
            })


class ClassroomAdminTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.physics_classroom_id = (
            classroom_config_services.get_new_classroom_id())
        self.physics_classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': self.physics_classroom_id,
            'name': 'physics',
            'url_fragment': 'physics',
            'course_details': 'Curated physics foundations course.',
            'topic_list_intro': 'Start from the basics with our first topic.',
            'topic_id_to_prerequisite_topic_ids': {
                'topic_id_1': ['topic_id_2', 'topic_id_3'],
                'topic_id_2': [],
                'topic_id_3': []
            }
        }
        self.physics_classroom = classroom_config_domain.Classroom.from_dict(
            self.physics_classroom_dict)
        classroom_config_services.update_or_create_classroom_model(
            self.physics_classroom)

        self.math_classroom_id = (
            classroom_config_services.get_new_classroom_id())
        self.math_classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': self.math_classroom_id,
            'name': 'math',
            'url_fragment': 'math',
            'course_details': 'Curated math foundations course.',
            'topic_list_intro': 'Start from the basics with our first topic.',
            'topic_id_to_prerequisite_topic_ids': {
                'topic_id_1': ['topic_id_2', 'topic_id_3'],
                'topic_id_2': [],
                'topic_id_3': []
            }
        }
        self.math_classroom = classroom_config_domain.Classroom.from_dict(
            self.math_classroom_dict)
        classroom_config_services.update_or_create_classroom_model(
            self.math_classroom)

    def test_get_classroom_id_to_classroom_name(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        classroom_id_to_classroom_name = {
            self.math_classroom_id: 'math',
            self.physics_classroom_id: 'physics'
        }
        json_response = self.get_json(feconf.CLASSROOM_ADMIN_DATA_HANDLER_URL)
        self.assertEqual(
            json_response['classroom_id_to_classroom_name'],
            classroom_id_to_classroom_name
        )
        self.logout()

    def test_not_able_to_get_classroom_data_when_user_is_not_admin(
        self
    ) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        self.get_json(
            feconf.CLASSROOM_ADMIN_DATA_HANDLER_URL, expected_status_int=401)
        self.logout()

    def test_get_new_classroom_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        json_response = self.get_json(feconf.CLASSROOM_ID_HANDLER_URL)

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

    def test_duplicate_classroom_url_fragment_should_return_true(self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        # The classroom with the names ‘math’ and ‘physics’ is already created
        # in the setUp method of the test class.

        classroom_url_fragment_handler_url = '%s/%s' % (
            feconf.CLASSROOM_URL_FRAGMENT_HANDLER, 'math')
        json_response = self.get_json(classroom_url_fragment_handler_url)

        self.assertTrue(json_response['classroom_url_fragment_exists'])
        self.logout()

    def test_non_duplicate_classroom_url_fragment_should_return_false(self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        # The classroom with the names ‘math’ and ‘physics’ is already created
        # in the setUp method of the test class.

        classroom_url_fragment_handler_url = '%s/%s' % (
            feconf.CLASSROOM_URL_FRAGMENT_HANDLER, 'chemistry')
        json_response = self.get_json(classroom_url_fragment_handler_url)

        self.assertFalse(json_response['classroom_url_fragment_exists'])
        self.logout()
