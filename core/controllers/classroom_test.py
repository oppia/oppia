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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import config_domain
from core.domain import topic_domain
from core.domain import topic_services
from core.tests import test_utils
import feconf


class BaseClassroomControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseClassroomControllerTests, self).setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)


class ClassroomPageTests(BaseClassroomControllerTests):

    def test_any_user_can_access_classroom_page(self):
        config_property = config_domain.Registry.get_config_property(
            'classroom_page_is_shown')
        config_property.set_value('committer_id', True)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            response = self.get_html_response('/math')
            self.assertIn('<classroom-page></classroom-page>', response)
        config_property.set_value('committer_id', False)

    def test_get_fails_when_new_structures_not_enabled(self):
        config_property = config_domain.Registry.get_config_property(
            'classroom_page_is_shown')
        config_property.set_value('committer_id', True)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_html_response('/math', expected_status_int=404)
        config_property.set_value('committer_id', False)

    def test_get_fails_when_classroom_page_is_shown_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response('/math', expected_status_int=404)


class ClassroomDataHandlerTests(BaseClassroomControllerTests):

    def test_get(self):
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        topic_id_1 = topic_services.get_new_topic_id()
        topic_id_2 = topic_services.get_new_topic_id()
        private_topic = topic_domain.Topic.create_default_topic(
            topic_id_1, 'private_topic_name', 'abbrev')
        topic_services.save_new_topic(admin_id, private_topic)
        public_topic = topic_domain.Topic.create_default_topic(
            topic_id_2, 'public_topic_name', 'abbrev')
        public_topic.thumbnail_filename = 'Topic.svg'
        public_topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        topic_services.save_new_topic(admin_id, public_topic)
        topic_services.publish_topic(topic_id_2, admin_id)

        csrf_token = self.get_new_csrf_token()
        new_config_value = [{
            'name': 'math',
            'topic_ids': [topic_id_1, topic_id_2]
        }]

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_domain.TOPIC_IDS_FOR_CLASSROOM_PAGES.name: (
                    new_config_value),
            }
        }
        self.post_json('/adminhandler', payload, csrf_token=csrf_token)
        self.logout()

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            json_response = self.get_json(
                '%s/%s' % (feconf.CLASSROOM_DATA_HANDLER, 'math'))
            topic_summary_dict = (
                topic_services.get_topic_summary_by_id(topic_id_2).to_dict())

            expected_dict = {
                'topic_summary_dicts': [topic_summary_dict]
            }
            self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_fails_for_invalid_classroom_name(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (
                    feconf.CLASSROOM_DATA_HANDLER, 'invalid_subject'),
                expected_status_int=404)

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_json(
                '%s/%s' % (feconf.CLASSROOM_DATA_HANDLER, 'math'),
                expected_status_int=404)


class ClassroomPageStatusHandlerTests(BaseClassroomControllerTests):
    """Unit test for ClassroomPageStatusHandler."""
    def test_get_request_returns_correct_status(self):
        self.set_config_property(config_domain.CLASSROOM_PAGE_IS_SHOWN, False)

        response = self.get_json('/classroom_page_status_handler')
        self.assertEqual(
            response, {
                'classroom_page_is_shown': False
            })

        self.set_config_property(config_domain.CLASSROOM_PAGE_IS_SHOWN, True)
        response = self.get_json('/classroom_page_status_handler')
        self.assertEqual(
            response, {
                'classroom_page_is_shown': True,
            })
