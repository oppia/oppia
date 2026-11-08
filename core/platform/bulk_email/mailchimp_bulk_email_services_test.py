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

"""Tests for mailchimp services."""

from __future__ import annotations

import logging

from core.domain import platform_parameter_list
from core.platform import models
from core.platform.bulk_email import mailchimp_bulk_email_services
from core.tests import test_utils

import requests
from mailchimp3 import mailchimpclient
from typing import Dict, List

secrets_services = models.Registry.import_secrets_services()


class MailchimpServicesUnitTests(test_utils.GenericTestBase):
    """Tests for mailchimp services."""

    def setUp(self) -> None:
        super().setUp()
        self.user_email_1 = 'test1@example.com'
        self.user_email_2 = 'test2@example.com'
        self.user_email_3 = 'test3@example.com'

    class MockMailchimpClass:
        """Class to mock Mailchimp class."""

        update_call_data: Dict[str, str] = {}

        class MailchimpLists:
            """Class to mock Mailchimp lists object."""

            class MailchimpMembers:
                """Class to mock Mailchimp members object."""

                class MailchimpTags:
                    """Class to mock Mailchimp tags object."""

                    def __init__(self) -> None:
                        self.tag_names: List[str] = []

                    def update(
                        self,
                        unused_id: str,
                        unused_hash: str,
                        tag_data: Dict[str, List[Dict[str, str]]],
                    ) -> None:
                        """Mocks the tag update function in mailchimp api.

                        Args:
                            unused_id: str. List Id of mailchimp list.
                            unused_hash: str. Subscriber hash, which is an MD5
                                hash of subscriber's email ID.
                            tag_data: dict. A dict with the 'tags' key
                                containing the tags to be updated for the user.
                        """
                        self.tag_names = [
                            tag['name']
                            for tag in tag_data['tags']
                            if tag['status'] == 'active'
                        ]

                def __init__(self) -> None:
                    self.users_data = [
                        {
                            # Email: test1@example.com.
                            'email_hash': 'aa99b351245441b8ca95d54a52d2998c',
                            'status': 'unsubscribed',
                        },
                        {
                            # Email: test2@example.com.
                            'email_hash': '43b05f394d5611c54a1a9e8e20baee21',
                            'status': 'subscribed',
                        },
                        {
                            # Email: test4@example.com, but intentionally
                            # incorrect to trigger failure.
                            'email_hash': 'incorrecthash'
                        },
                    ]
                    self.tags = self.MailchimpTags()

                def get(
                    self, _list_id: str, subscriber_hash: str
                ) -> Dict[str, str]:
                    """Mocks the get function of the mailchimp api.

                    Args:
                        _list_id: str. List Id of mailchimp list.
                        subscriber_hash: str. Subscriber hash, which is an MD5
                            hash of subscriber's email ID.

                    Raises:
                        MailchimpError. Error 404 or 401 to mock API server
                            error.

                    Returns:
                        dict. The updated status dict for users.
                    """
                    if not self.users_data:
                        mock_response = requests.Response()
                        mock_response.status_code = 401
                        raise mailchimpclient.MailChimpError(
                            {
                                'status': 401,
                                'detail': 'Server Error',
                                'response': mock_response,
                            }
                        )
                    for user in self.users_data:
                        if user['email_hash'] == subscriber_hash:
                            return user

                    mock_response = requests.Response()
                    mock_response.status_code = 404
                    raise mailchimpclient.MailChimpError(
                        {'status': 404, 'response': mock_response}
                    )

                def update(
                    self,
                    _list_id: str,
                    subscriber_hash: str,
                    data: Dict[str, str],
                ) -> None:
                    """Mocks the update function of the mailchimp api. This
                    function just sets the payload data to a private variable
                    to test it.

                    Args:
                        _list_id: str. List Id of mailchimp list.
                        subscriber_hash: str. Subscriber hash, which is an MD5
                            hash of subscriber's email ID.
                        data: dict. Payload received.
                    """
                    for user in self.users_data:
                        if user['email_hash'] == subscriber_hash:
                            user['status'] = data['status']

                def create(self, _list_id: str, data: Dict[str, str]) -> None:
                    """Mocks the create function of the mailchimp api. This
                    function just sets the payload data to a private variable
                    to test it.

                    Args:
                        _list_id: str. List Id of mailchimp list.
                        data: dict. Payload received.
                    """
                    if data['email_address'] == 'test3@example.com':
                        self.users_data.append(
                            {
                                # Email: test3@example.com.
                                'email_hash': 'fedd8b80a7a813966263853b9af72151',
                                'status': data['status'],
                            }
                        )
                    elif data['email_address'] == 'test4@example.com':
                        mock_response = requests.Response()
                        mock_response.status_code = 400
                        raise mailchimpclient.MailChimpError(
                            {
                                'status': 400,
                                'title': 'Forgotten Email Not Subscribed',
                                'response': mock_response,
                            }
                        )
                    else:
                        mock_response = requests.Response()
                        mock_response.status_code = 404
                        raise mailchimpclient.MailChimpError(
                            {
                                'status': 404,
                                'title': 'Invalid email',
                                'detail': 'Server Issue',
                                'response': mock_response,
                            }
                        )

                def delete_permanent(
                    self, _list_id: str, subscriber_hash: str
                ) -> None:
                    """Mocks the delete function of the mailchimp api. This
                    function just sets the deleted user to a private variable
                    to test it.

                    Args:
                        _list_id: str. List Id of mailchimp list.
                        subscriber_hash: str. Subscriber hash, which is an MD5
                            hash of subscriber's email ID.
                    """
                    self.users_data = [
                        user
                        for user in self.users_data
                        if user['email_hash'] != subscriber_hash
                    ]

            def __init__(self) -> None:
                self.members = self.MailchimpMembers()

        def __init__(self) -> None:
            self.lists = self.MailchimpLists()

    def test_get_subscriber_hash(self) -> None:
        sample_email = 'test@example.com'
        subscriber_hash = '55502f40dc8b7c769880b10874abc9d0'
        self.assertEqual(
            mailchimp_bulk_email_services._get_subscriber_hash(  # pylint: disable=protected-access
                sample_email
            ),
            subscriber_hash,
        )

        # TODO(#13528): Here we use MyPy ignore because we remove this test
        # after the backend is fully type-annotated. Here ignore[arg-type]
        # is used to test method _get_subscriber_hash() for invalid argument
        # type.
        sample_email_2 = 5
        with self.assertRaisesRegex(
            Exception, 'Invalid type for email. Expected string, received 5'
        ):
            mailchimp_bulk_email_services._get_subscriber_hash(  # pylint: disable=protected-access
                sample_email_2  # type: ignore[arg-type]
            )

    def test_function_input_validation(self) -> None:
        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            swapped_mailchimp,
        )
        with swap_mailchimp_context:
            with self.assertRaisesRegex(Exception, 'Invalid Merge Fields'):
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'valid@example.com',
                    {'INVALID': 'value'},
                    'Android',
                    can_receive_email_updates=True,
                )

            with self.assertRaisesRegex(Exception, 'Invalid tag: Invalid'):
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'valid@example.com',
                    {},
                    'Invalid',
                    can_receive_email_updates=True,
                )

    def test_get_mailchimp_class_errors_when_api_key_is_not_available(
        self,
    ) -> None:
        swap_get_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: None,
            expected_args=[('MAILCHIMP_API_KEY',)],
        )
        with self.capture_logging(min_level=logging.ERROR) as logs:
            with swap_get_secret:
                self.assertIsNone(
                    mailchimp_bulk_email_services._get_mailchimp_class()  # pylint: disable=protected-access
                )
                self.assertItemsEqual(
                    logs, ['Mailchimp API key is not available.']
                )

    def test_get_mailchimp_class_errors_when_username_is_not_available(
        self,
    ) -> None:
        swap_get_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: 'key',
            expected_args=[('MAILCHIMP_API_KEY',)],
        )
        with self.capture_logging(min_level=logging.ERROR) as logs:
            with swap_get_secret:
                self.assertIsNone(
                    mailchimp_bulk_email_services._get_mailchimp_class()  # pylint: disable=protected-access
                )
                self.assertItemsEqual(logs, ['Mailchimp username is not set.'])

    def test_add_or_update_user_status_returns_false_when_username_is_none(
        self,
    ) -> None:
        swap_get_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: 'key',
            expected_args=[
                ('MAILCHIMP_API_KEY',),
            ],
        )
        with swap_get_secret:
            self.assertFalse(
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'sample_email', {}, 'Web', can_receive_email_updates=True
                )
            )

    def test_permanently_delete_user_from_list_when_username_is_none(
        self,
    ) -> None:
        swap_get_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: 'key',
            expected_args=[
                ('MAILCHIMP_API_KEY',),
            ],
        )
        with swap_get_secret:
            mailchimp_bulk_email_services.permanently_delete_user_from_list(
                'sample_email'
            )

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.MAILCHIMP_USERNAME, 'username'),
            (platform_parameter_list.ParamName.MAILCHIMP_AUDIENCE_ID, ''),
        ]
    )
    def test_add_or_update_mailchimp_user_status(self) -> None:
        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            swapped_mailchimp,
        )
        swap_api = self.swap(secrets_services, 'get_secret', lambda _: 'key')

        with swap_mailchimp_context, swap_api:
            # Tests condition where user was initally unsubscribed in list and
            # becomes subscribed.
            self.assertEqual(
                mailchimp.lists.members.users_data[0]['status'], 'unsubscribed'
            )
            mailchimp_bulk_email_services.add_or_update_user_status(
                self.user_email_1, {}, 'Web', can_receive_email_updates=True
            )
            self.assertEqual(
                mailchimp.lists.members.users_data[0]['status'], 'subscribed'
            )
            self.assertEqual(mailchimp.lists.members.tags.tag_names, ['Web'])

            # Tests condition where user was initally subscribed in list and
            # becomes unsubscribed.
            self.assertEqual(
                mailchimp.lists.members.users_data[1]['status'], 'subscribed'
            )
            mailchimp_bulk_email_services.add_or_update_user_status(
                self.user_email_2, {}, 'Web', can_receive_email_updates=False
            )
            self.assertEqual(
                mailchimp.lists.members.users_data[1]['status'], 'unsubscribed'
            )

            # Creates a mailchimp entry for a new user.
            self.assertEqual(len(mailchimp.lists.members.users_data), 3)
            return_status = (
                mailchimp_bulk_email_services.add_or_update_user_status(
                    self.user_email_3, {}, 'Web', can_receive_email_updates=True
                )
            )
            self.assertTrue(return_status)
            self.assertEqual(
                mailchimp.lists.members.users_data[3]['status'], 'subscribed'
            )

            # Creates a mailchimp entry for a new user.
            return_status = (
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'test4@example.com',
                    {},
                    'Web',
                    can_receive_email_updates=True,
                )
            )
            self.assertFalse(return_status)

            # Here we use MyPy ignore because attribute 'users_data' can only
            # accept Dict but for testing purposes here we are providing None
            # which causes mypy to throw an error. Thus to avoid the error, we
            # used ignore here.
            mailchimp.lists.members.users_data = None  # type: ignore[assignment]
            with self.capture_logging(min_level=logging.ERROR) as logs:
                mailchimp_bulk_email_services.add_or_update_user_status(
                    self.user_email_1, {}, 'Web', can_receive_email_updates=True
                )
                self.assertEqual(len(logs), 1)
                self.assertRegex(
                    logs[0],
                    r'Mailchimp error prevented email signup: '
                    r'\{\'status\': 401, \'detail\': \'Server Error\', \'response\': <Response \[401\]>\}',
                )

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.MAILCHIMP_USERNAME, 'username'),
            (platform_parameter_list.ParamName.MAILCHIMP_AUDIENCE_ID, ''),
        ]
    )
    def test_android_merge_fields(self) -> None:
        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            swapped_mailchimp,
        )
        swap_api = self.swap(secrets_services, 'get_secret', lambda _: 'key')

        with swap_mailchimp_context, swap_api:
            # Tests condition where user was initally unsubscribed in list and
            # becomes subscribed.
            self.assertEqual(
                mailchimp.lists.members.users_data[0]['status'], 'unsubscribed'
            )
            mailchimp_bulk_email_services.add_or_update_user_status(
                self.user_email_1,
                {'NAME': 'name'},
                'Android',
                can_receive_email_updates=True,
            )
            self.assertEqual(
                mailchimp.lists.members.users_data[0]['status'], 'subscribed'
            )
            self.assertEqual(
                mailchimp.lists.members.tags.tag_names, ['Android']
            )

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.MAILCHIMP_USERNAME, 'username'),
            (platform_parameter_list.ParamName.MAILCHIMP_AUDIENCE_ID, ''),
        ]
    )
    def test_catch_or_raise_errors_when_creating_new_invalid_user(self) -> None:
        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            swapped_mailchimp,
        )
        swap_api = self.swap(secrets_services, 'get_secret', lambda _: 'key')

        with swap_mailchimp_context, swap_api:
            # Creates a mailchimp entry for a deleted user.
            self.assertEqual(len(mailchimp.lists.members.users_data), 3)
            return_status = (
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'test4@example.com',
                    {},
                    'Web',
                    can_receive_email_updates=True,
                )
            )
            self.assertFalse(return_status)
            self.assertEqual(len(mailchimp.lists.members.users_data), 3)

            # Create user raises exception for other errors.
            with self.capture_logging(min_level=logging.ERROR) as logs:
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'test5@example.com',
                    {},
                    'Web',
                    can_receive_email_updates=True,
                )
                self.assertEqual(len(logs), 1)
                self.assertRegex(
                    logs[0],
                    r'Mailchimp error prevented email signup: Server Issue',
                )

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.MAILCHIMP_USERNAME, 'username'),
            (platform_parameter_list.ParamName.MAILCHIMP_AUDIENCE_ID, ''),
        ]
    )
    def test_permanently_delete_user(self) -> None:
        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            swapped_mailchimp,
        )
        swap_api = self.swap(secrets_services, 'get_secret', lambda _: 'key')

        with swap_mailchimp_context, swap_api:
            self.assertEqual(len(mailchimp.lists.members.users_data), 3)
            mailchimp_bulk_email_services.permanently_delete_user_from_list(
                self.user_email_1
            )
            self.assertEqual(len(mailchimp.lists.members.users_data), 2)

            # Here we use MyPy ignore because attribute 'users_data' can only
            # accept Dict but for testing purposes here we are providing None
            # which causes mypy to throw an error. Thus to avoid the error, we
            # used ignore here.
            mailchimp.lists.members.users_data = None  # type: ignore[assignment]
            with self.assertRaisesRegex(Exception, 'Server Error'):
                mailchimp_bulk_email_services.permanently_delete_user_from_list(
                    self.user_email_1
                )

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.MAILCHIMP_USERNAME, 'username'),
            (platform_parameter_list.ParamName.MAILCHIMP_AUDIENCE_ID, ''),
        ]
    )
    def test_permanently_delete_user_ignores_missing_member(self) -> None:
        mailchimp = self.MockMailchimpClass()
        mailchimp_swap = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            lambda: mailchimp,
        )

        with mailchimp_swap:
            mailchimp_bulk_email_services.permanently_delete_user_from_list(
                'missing@example.com'
            )

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.MAILCHIMP_USERNAME, 'username'),
            (platform_parameter_list.ParamName.MAILCHIMP_AUDIENCE_ID, ''),
        ]
    )
    def test_permanently_delete_user_propagates_request_exception(
        self,
    ) -> None:
        mailchimp = self.MockMailchimpClass()
        mailchimp_swap = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            lambda: mailchimp,
        )
        request_swap = self.swap_to_always_raise(
            mailchimp.lists.members,
            'get',
            requests.RequestException('request failed'),
        )

        with mailchimp_swap, request_swap:
            with self.assertRaisesRegex(
                requests.RequestException, 'request failed'
            ):
                mailchimp_bulk_email_services.permanently_delete_user_from_list(
                    self.user_email_1
                )

    def test_add_or_update_user_status_logs_request_exception(self) -> None:
        mailchimp = self.MockMailchimpClass()
        mailchimp_swap = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            lambda: mailchimp,
        )
        request_swap = self.swap_to_always_raise(
            mailchimp.lists.members,
            'get',
            requests.RequestException('request failed'),
        )

        with (
            mailchimp_swap,
            request_swap,
            self.capture_logging(min_level=logging.ERROR) as logs,
        ):
            result = mailchimp_bulk_email_services.add_or_update_user_status(
                self.user_email_1,
                {},
                'Web',
                can_receive_email_updates=True,
            )

        self.assertFalse(result)
        self.assertRegex(
            logs[0], 'Mailchimp error prevented email signup: request failed'
        )

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.MAILCHIMP_USERNAME, 'username'),
            (platform_parameter_list.ParamName.MAILCHIMP_AUDIENCE_ID, ''),
        ]
    )
    def test_add_or_update_android_user_without_name(self) -> None:
        mailchimp = self.MockMailchimpClass()
        mailchimp_swap = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            lambda: mailchimp,
        )

        with mailchimp_swap:
            self.assertTrue(
                mailchimp_bulk_email_services.add_or_update_user_status(
                    self.user_email_2,
                    {},
                    'Android',
                    can_receive_email_updates=True,
                )
            )
            self.assertEqual(
                mailchimp.lists.members.users_data[1]['status'], 'subscribed'
            )

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.MAILCHIMP_USERNAME, 'username'),
            (platform_parameter_list.ParamName.MAILCHIMP_AUDIENCE_ID, ''),
        ]
    )
    def test_add_or_update_android_user_with_none_name(self) -> None:
        mailchimp = self.MockMailchimpClass()
        mailchimp_swap = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            lambda: mailchimp,
        )
        update_data = []

        def capture_update(
            unused_audience_id: str,
            unused_subscriber_hash: str,
            data: Dict[str, str],
        ) -> None:
            update_data.append(data)

        update_swap = self.swap(
            mailchimp.lists.members, 'update', capture_update
        )

        with mailchimp_swap, update_swap:
            self.assertTrue(
                mailchimp_bulk_email_services.add_or_update_user_status(
                    self.user_email_2,
                    # Here we use MyPy ignore because this test deliberately passes a wrong type.
                    {'NAME': None},  # type: ignore[dict-item]
                    'Android',
                    can_receive_email_updates=True,
                )
            )

        self.assertEqual(
            update_data,
            [
                {
                    'email_address': self.user_email_2,
                    'status': 'subscribed',
                    'merge_fields': {},
                }
            ],
        )

    def test_add_or_update_user_status_rejects_non_dict_merge_fields(
        self,
    ) -> None:
        mailchimp_swap = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            self.MockMailchimpClass,
        )

        with mailchimp_swap:
            with self.assertRaisesRegex(TypeError, 'not iterable'):
                mailchimp_bulk_email_services.add_or_update_user_status(
                    self.user_email_1,
                    # Here we use MyPy ignore because this test deliberately passes a wrong type.
                    None,  # type: ignore[arg-type]
                    'Android',
                    can_receive_email_updates=True,
                )

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.MAILCHIMP_USERNAME, 'username'),
            (platform_parameter_list.ParamName.MAILCHIMP_AUDIENCE_ID, ''),
        ]
    )
    def test_add_or_update_missing_user_without_subscription(self) -> None:
        mailchimp = self.MockMailchimpClass()
        mailchimp_swap = self.swap(
            mailchimp_bulk_email_services,
            '_get_mailchimp_class',
            lambda: mailchimp,
        )

        with mailchimp_swap:
            self.assertTrue(
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'missing@example.com',
                    {},
                    'Web',
                    can_receive_email_updates=False,
                )
            )
            self.assertEqual(len(mailchimp.lists.members.users_data), 3)
