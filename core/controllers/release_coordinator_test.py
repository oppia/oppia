# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for the release coordinator page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.tests import test_utils
import feconf


class ReleaseCoordinatorPageTest(test_utils.GenericTestBase):
    """Test for release coordinator pages."""

    def setUp(self):
        """Complete the signup process for self.RELEASE_COORDINATOR_EMAIL."""
        super(ReleaseCoordinatorPageTest, self).setUp()
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_guest_user_cannot_access_the_page(self):
        self.get_html_response(
            '/release-coordinator', expected_status_int=302)

    def test_exploration_editor_cannot_access_the_page(self):
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(
            '/release-coordinator', expected_status_int=401)

    def test_release_coordinator_can_acces_the_page(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_html_response('/release-coordinator')
        response.mustcontain(
            '<oppia-release-coordinator-page-root>' +
            '</oppia-release-coordinator-page-root>')
        self.logout()


class MemoryCacheHandlerTest(test_utils.GenericTestBase):
    """Tests MemoryCacheHandler."""

    def setUp(self):
        super(MemoryCacheHandlerTest, self).setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_get_memory_cache_data(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_json('/memorycachehandler')
        self.assertEqual(
            response['total_allocation'], 0)
        self.assertEqual(
            response['peak_allocation'], 0)
        self.assertEqual(response['total_keys_stored'], 1)

    def test_flush_memory_cache(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_json('/memorycachehandler')
        self.assertEqual(response['total_keys_stored'], 1)

        self.delete_json('/memorycachehandler')

        response = self.get_json('/memorycachehandler')
        self.assertEqual(response['total_keys_stored'], 0)
