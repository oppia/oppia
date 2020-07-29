# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for classroom services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import classroom_services
from core.domain import config_services
from core.domain import topic_services
from core.tests import test_utils


class ClassroomServicesTests(test_utils.GenericTestBase):
    """Tests for classroom services."""

    def setUp(self):
        super(ClassroomServicesTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME, self.ADMIN_USERNAME])

    def test_can_get_classroom_dict_by_name(self):
        topic_id = topic_services.get_new_topic_id()
        config_services.set_property(
            self.user_id_admin, 'topic_ids_for_classroom_pages', [{
                'name': 'math',
                'url_fragment': 'math',
                'topic_ids': [topic_id]
            }])
        classroom_dict = classroom_services.get_classroom_dict_by_name('math')
        self.assertEqual(classroom_dict['name'], 'math')
        self.assertEqual(classroom_dict['url_fragment'], 'math')
        self.assertEqual(classroom_dict['topic_ids'], [topic_id])

    def test_return_none_when_classroom_cannot_be_found(self):
        classroom_dict = classroom_services.get_classroom_dict_by_name('bio')
        self.assertIsNone(classroom_dict)

    def test_get_classroom_url_fragment_for_topic_id(self):
        topic_id = topic_services.get_new_topic_id()
        config_services.set_property(
            self.user_id_admin, 'topic_ids_for_classroom_pages', [{
                'name': 'math',
                'url_fragment': 'math-one',
                'topic_ids': [topic_id]
            }])
        classroom_url_fragment = (
            classroom_services.get_classroom_url_fragment_for_topic_id(
                topic_id))
        self.assertEqual(classroom_url_fragment, 'math-one')

    def test_return_default_if_associated_classroom_is_not_found(self):
        topic_id = topic_services.get_new_topic_id()
        config_services.set_property(
            self.user_id_admin, 'topic_ids_for_classroom_pages', [{
                'name': 'math',
                'url_fragment': 'math-two',
                'topic_ids': []
            }])
        classroom_url_fragment = (
            classroom_services.get_classroom_url_fragment_for_topic_id(
                topic_id))
        self.assertNotEqual(classroom_url_fragment, 'math-two')
        self.assertEqual(
            classroom_url_fragment, constants.DUMMY_CLASSROOM_URL_FRAGMENT)
