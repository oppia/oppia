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

from constants import constants
from core.domain import user_services
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
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.login(self.NEW_USER_EMAIL)
            self.get_html_response(
                '%s/%s' % (feconf.CLASSROOM_URL_PREFIX, 'Math'))
            self.logout()


    def test_no_user_can_access_invalid_classroom_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.login(self.NEW_USER_EMAIL)
            self.get_html_response(
                '%s/%s' % (
                    feconf.CLASSROOM_URL_PREFIX, 'invalid_subject'),
                expected_status_int=404)
            self.logout()


    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.login(self.NEW_USER_EMAIL)
            self.get_html_response(
                '%s/%s' % (feconf.CLASSROOM_URL_PREFIX, 'Math'),
                expected_status_int=404)
            self.logout()


class ClassroomDataHandlerTests(BaseClassroomControllerTests):

    def test_get(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.login(self.NEW_USER_EMAIL)
            json_response = self.get_json(
                '%s/%s' % (feconf.CLASSROOM_DATA_HANDLER, 'Math'))
            expected_dict = {
                'topic_summary_dicts': []
            }
            self.assertDictContainsSubset(expected_dict, json_response)

            self.logout()

    def test_get_fails_when_user_not_logged_in(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (feconf.CLASSROOM_DATA_HANDLER, 'Math'),
                expected_status_int=401)

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.login(self.NEW_USER_EMAIL)
            self.get_json(
                '%s/%s' % (feconf.CLASSROOM_DATA_HANDLER, 'Math'),
                expected_status_int=404)
            self.logout()
