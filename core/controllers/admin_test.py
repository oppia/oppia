# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for the admin page."""

from core.controllers import base
from core.tests import test_utils


BOTH_MODERATOR_AND_ADMIN_EMAIL = 'moderator.and.admin@example.com'
BOTH_MODERATOR_AND_ADMIN_USERNAME = 'moderatorandadm1n'


class AdminIntegrationTest(test_utils.GenericTestBase):
    """Server integration tests for operations on the admin page."""

    def setUp(self):
        """Complete the signup process for self.ADMIN_EMAIL."""
        super(AdminIntegrationTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

    def test_admin_page_rights(self):
        """Test access rights to the admin page."""

        response = self.testapp.get('/admin')
        self.assertEqual(response.status_int, 302)

        # Login as a non-admin.
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/admin', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        # Login as an admin.
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.testapp.get('/admin')
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_change_configuration_property(self):
        """Test that configuration properties can be changed."""

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.testapp.get('/admin')
        csrf_token = self.get_csrf_token_from_response(response)

        response_dict = self.get_json('/adminhandler')
        response_config_properties = response_dict['config_properties']
        self.assertDictContainsSubset({
            'value': '',
        }, response_config_properties[base.BEFORE_END_HEAD_TAG_HOOK.name])

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                base.BEFORE_END_HEAD_TAG_HOOK.name: (
                    self.UNICODE_TEST_STRING),
            }
        }
        self.post_json('/adminhandler', payload, csrf_token)

        response_dict = self.get_json('/adminhandler')
        response_config_properties = response_dict['config_properties']
        self.assertDictContainsSubset({
            'value': self.UNICODE_TEST_STRING,
        }, response_config_properties[base.BEFORE_END_HEAD_TAG_HOOK.name])

        self.logout()

    def test_change_about_page_config_property(self):
        """Test that config property values are changed correctly."""
        new_config_value = 'new_config_value'

        response = self.testapp.get('/about')
        self.assertNotIn(new_config_value, response.body)

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.testapp.get('/admin')
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json('/adminhandler', {
            'action': 'save_config_properties',
            'new_config_property_values': {
                base.BEFORE_END_HEAD_TAG_HOOK.name: new_config_value
            }
        }, csrf_token)

        response = self.testapp.get('/about')
        self.assertIn(new_config_value, response.body)
