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

from core import feconf
from core.domain import platform_parameter_list
from core.tests import test_utils


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

    def test_update_platform_parameters(self) -> None:
        """Test that platform parameters can be updated."""

        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        new_platform_parameter_value = 20

        response_dict = self.get_json('/blogadminhandler')
        response_platform_parameters = response_dict['platform_parameters']
        self.assertDictContainsSubset({
            'value': 10,
        }, response_platform_parameters[
            platform_parameter_list.ParamName.
            MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value]
        )

        payload = {
            'action': 'save_platform_parameters',
            'new_platform_parameter_values': {
                (
                    platform_parameter_list.ParamName.
                    MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value
                ): new_platform_parameter_value,
            }
        }
        self.post_json('/blogadminhandler', payload, csrf_token=csrf_token)

        response_dict = self.get_json('/blogadminhandler')
        response_platform_parameters = response_dict['platform_parameters']
        self.assertDictContainsSubset({
            'value': new_platform_parameter_value,
        }, response_platform_parameters[
            platform_parameter_list.ParamName.
            MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value]
        )

        self.logout()

    def test_invalid_value_type_for_updating_platform_parameters(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        new_platform_parameter_value = [20]

        response_dict = self.get_json('/blogadminhandler')
        response_platform_parameters = response_dict['platform_parameters']
        self.assertDictContainsSubset({
            'value': 10,
        }, response_platform_parameters[
            platform_parameter_list.ParamName.
            MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value]
        )

        payload = {
            'action': 'save_platform_parameters',
            'new_platform_parameter_values': {
                (
                    platform_parameter_list.ParamName.
                    MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value
                ): new_platform_parameter_value,
            }
        }
        response_dict = self.post_json(
            '/blogadminhandler', payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response_dict['error'],
            'At \'http://localhost/blogadminhandler\' '
            'these errors are happening:\n'
            'Schema validation for \'new_platform_'
            'parameter_values\' failed: The value of max_number_of_tags_'
            'assigned_to_blog_post platform parameter is not of valid type, '
            'it should be one of typing.Union[str, int, bool, float].')

    def test_params_cannot_be_saved_without_new_platform_parameter_values(
        self
    ) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'action': 'save_platform_parameters',
            'new_platform_parameter_values': None
        }
        response_dict = self.post_json(
            '/blogadminhandler', payload, csrf_token=csrf_token,
            expected_status_int=500
        )
        self.assertEqual(
            response_dict['error'],
            'The new_platform_parameter_values cannot be None when the '
            'action is save_platform_parameters.'
        )

    def test_raise_error_for_updating_value_to_less_than_0_for_max_tags(
        self
    ) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        new_platform_parameter_value = -2

        response_dict = self.get_json('/blogadminhandler')
        response_platform_parameters = response_dict['platform_parameters']
        self.assertDictContainsSubset({
            'value': 10,
        }, response_platform_parameters[
            platform_parameter_list.ParamName.
            MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value]
        )

        payload = {
            'action': 'save_platform_parameters',
            'new_platform_parameter_values': {
                (
                    platform_parameter_list.ParamName.
                    MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value
                ): new_platform_parameter_value,
            }
        }
        response_dict = self.post_json(
            '/blogadminhandler', payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response_dict['error'],
            'At \'http://localhost/blogadminhandler\' '
            'these errors are happening:\n'
            'Schema validation for \'new_platform_'
            'parameter_values\' failed: The value of max_number_of_tags_'
            'assigned_to_blog_post should be greater than 0, it is -2.')

    def test_invalid_value_for_platform_param_raises_error(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        new_platform_parameter_value = 'string'

        response_dict = self.get_json('/blogadminhandler')
        response_platform_parameters = response_dict['platform_parameters']
        self.assertDictContainsSubset({
            'value': 10,
        }, response_platform_parameters[
            platform_parameter_list.ParamName.
            MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value]
        )

        payload = {
            'action': 'save_platform_parameters',
            'new_platform_parameter_values': {
                (
                    platform_parameter_list.ParamName.
                    MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value
                ): new_platform_parameter_value,
            }
        }
        response_dict = self.post_json(
            '/blogadminhandler', payload, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response_dict['error'],
            'At \'http://localhost/blogadminhandler\' '
            'these errors are happening:\n'
            'Schema validation for \'new_platform_'
            'parameter_values\' failed: The value of platform parameter '
            'max_number_of_tags_assigned_to_blog_post is of type \'string\', '
            'expected it to be of type \'number\'')
