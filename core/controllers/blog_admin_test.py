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

"""Tests for the blog admin page."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import config_domain
from core.domain import config_services
from core.tests import test_utils

from typing import List


class BlogAdminPageTests(test_utils.GenericTestBase):
    """Checks the access to the blog admin page and its rendering."""

    def test_blog_admin_page_access_without_logging_in(self) -> None:
        """Tests access to the Blog Admin page."""
        self.get_html_response('/blog-admin', expected_status_int=302)

    def test_blog_admin_page_acess_without_being_blog_admin(self) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        self.get_html_response('/blog-admin', expected_status_int=401)
        self.logout()

    def test_blog_admin_page_acess_as_blog_admin(self) -> None:
        self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.login(self.BLOG_ADMIN_EMAIL)
        self.get_html_response('/blog-admin')
        self.logout()


class BlogAdminRolesHandlerTest(test_utils.GenericTestBase):
    """Checks the user role handling on the blog admin page."""

    def setUp(self) -> None:
        """Complete the signup process for self.ADMIN_EMAIL."""
        super().setUp()
        self.signup(
            self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)

        self.add_user_role(
            self.BLOG_ADMIN_USERNAME,
            feconf.ROLE_ID_BLOG_ADMIN)

    def test_updating_and_removing_blog_editor_role_successfully(
        self
    ) -> None:
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)
        self.login(self.BLOG_ADMIN_EMAIL)

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.post_json(
            feconf.BLOG_ADMIN_ROLE_HANDLER_URL,
            {
                'role': feconf.ROLE_ID_BLOG_POST_EDITOR,
                'username': username
            },
            csrf_token=csrf_token,
            expected_status_int=200)
        self.assertEqual(response_dict, {})

        # Check removing user from blog editor role.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            feconf.BLOG_ADMIN_ROLE_HANDLER_URL,
            {'username': username},
            csrf_token=csrf_token,
            expected_status_int=200)
        self.assertEqual(response_dict, {})

    def test_updating_blog_editor_role_for_invalid_user(self) -> None:
        username = 'invaliduser'

        self.login(self.BLOG_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.BLOG_ADMIN_ROLE_HANDLER_URL,
            {
                'role': feconf.ROLE_ID_BLOG_ADMIN,
                'username': username
            },
            csrf_token=csrf_token,
            expected_status_int=400)

    def test_removing_blog_editor_role_for_invalid_user(self) -> None:
        username = 'invaliduser'

        self.login(self.BLOG_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.put_json(
            feconf.BLOG_ADMIN_ROLE_HANDLER_URL,
            {'username': username},
            csrf_token=csrf_token,
            expected_status_int=400)

        csrf_token = self.get_new_csrf_token()
        self.put_json(
            feconf.BLOG_ADMIN_ROLE_HANDLER_URL,
            {},
            csrf_token=csrf_token,
            expected_status_int=400)


class BlogAdminHandlerTest(test_utils.GenericTestBase):
    """Checks the user role handling on the blog admin page."""

    def setUp(self) -> None:
        """Complete the signup process for self.ADMIN_EMAIL."""
        super().setUp()
        self.signup(
            self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)

        self.add_user_role(
            self.BLOG_ADMIN_USERNAME,
            feconf.ROLE_ID_BLOG_ADMIN)

        self.blog_admin_id = self.get_user_id_from_email(self.BLOG_ADMIN_EMAIL)

    def test_update_configuration_property(self) -> None:
        """Test that configuration properties can be updated."""

        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        new_config_value = 20

        response_dict = self.get_json('/blogadminhandler')
        response_config_properties = response_dict['config_properties']
        self.assertDictContainsSubset({
            'value': 10,
        }, response_config_properties[
            config_domain.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.name])

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_domain.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.name: (
                    new_config_value),
            }
        }
        self.post_json('/blogadminhandler', payload, csrf_token=csrf_token)

        response_dict = self.get_json('/blogadminhandler')
        response_config_properties = response_dict['config_properties']
        self.assertDictContainsSubset({
            'value': new_config_value,
        }, response_config_properties[
            config_domain.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.name])

        self.logout()

    def test_revert_config_property(self) -> None:
        observed_log_messages: List[str] = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        config_services.set_property(
            self.blog_admin_id,
            'max_number_of_tags_assigned_to_blog_post',
            20)
        self.assertEqual(
            config_domain.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value, 20)

        with self.swap(logging, 'info', _mock_logging_function):
            self.post_json(
                '/blogadminhandler', {
                    'action': 'revert_config_property',
                    'config_property_id':
                        'max_number_of_tags_assigned_to_blog_post',
                }, csrf_token=csrf_token)

        self.assertFalse(config_domain.PROMO_BAR_ENABLED.value)
        self.assertEqual(
            observed_log_messages,
            ['[BLOG ADMIN] %s reverted config property:'
             ' max_number_of_tags_assigned_to_blog_post'
             % self.blog_admin_id])

        self.logout()

    def test_invalid_values_for_updating_config_properties(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        new_config_value = [20]

        response_dict = self.get_json('/blogadminhandler')
        response_config_properties = response_dict['config_properties']
        self.assertDictContainsSubset({
            'value': 10,
        }, response_config_properties[
            config_domain.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.name])

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_domain.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.name: (
                    new_config_value),
            }
        }
        response_dict = self.post_json(
            '/blogadminhandler', payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response_dict['error'], 'Schema validation for \'new_config_'
            'property_values\' failed: Could not convert list to int: [20]')

    def test_config_prop_cannot_be_saved_without_new_config_property_values(
        self
    ) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': None
        }
        response_dict = self.post_json(
            '/blogadminhandler', payload, csrf_token=csrf_token,
            expected_status_int=500
        )
        self.assertEqual(
            response_dict['error'],
            'The new_config_property_values cannot be None when the '
            'action is save_config_properties.'
        )

    def test_config_id_cannot_be_none_when_action_is_revert_config_property(
        self
    ) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'action': 'revert_config_property',
            'config_property_id': None
        }
        response_dict = self.post_json(
            '/blogadminhandler', payload, csrf_token=csrf_token,
            expected_status_int=500
        )
        self.assertEqual(
            response_dict['error'],
            'The config_property_id cannot be None when the action '
            'is revert_config_property.'
        )

    def test_raise_error_for_updating_value_to_zero_for_max_tags(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        new_config_value = 0

        response_dict = self.get_json('/blogadminhandler')
        response_config_properties = response_dict['config_properties']
        self.assertDictContainsSubset({
            'value': 10,
        }, response_config_properties[
            config_domain.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.name])

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_domain.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.name: (
                    new_config_value),
            }
        }
        response_dict = self.post_json(
            '/blogadminhandler', payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response_dict['error'], 'Schema validation for \'new_config_'
            'property_values\' failed: Validation failed: is_at_least'
            ' ({\'min_value\': 1}) for object 0'
        )

    def test_raise_error_for_updating_to_negative_value_for_max_tags(
        self
    ) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        new_config_value = -2

        response_dict = self.get_json('/blogadminhandler')
        response_config_properties = response_dict['config_properties']
        self.assertDictContainsSubset({
            'value': 10,
        }, response_config_properties[
            config_domain.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.name])

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_domain.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.name: (
                    new_config_value),
            }
        }
        response_dict = self.post_json(
            '/blogadminhandler', payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response_dict['error'], 'Schema validation for \'new_config_'
            'property_values\' failed: Validation failed: is_at_least'
            ' ({\'min_value\': 1}) for object -2'
        )
