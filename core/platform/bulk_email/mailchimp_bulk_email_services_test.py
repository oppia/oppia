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

from core import feconf
from core.platform import models
from core.platform.bulk_email import mailchimp_bulk_email_services
from core.tests import test_utils

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
                        tag_data: Dict[str, List[Dict[str, str]]]
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
                            tag['name'] for tag in tag_data['tags']
                            if tag['status'] == 'active'
                        ]

                def __init__(self) -> None:
                    self.users_data = [{
                        # Email: test1@example.com.
                        'email_hash': 'aa99b351245441b8ca95d54a52d2998c',
                        'status': 'unsubscribed'
                    }, {
                        # Email: test2@example.com.
                        'email_hash': '43b05f394d5611c54a1a9e8e20baee21',
                        'status': 'subscribed'
                    }, {
                        # Email: test4@example.com, but intentionally
                        # incorrect to trigger failure.
                        'email_hash': 'incorrecthash'
                    }]
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
                        raise mailchimpclient.MailChimpError(
                            {'status': 401, 'detail': 'Server Error'})
                    for user in self.users_data:
                        if user['email_hash'] == subscriber_hash:
                            return user

                    raise mailchimpclient.MailChimpError({'status': 404})

                def update(
                        self,
                        _list_id: str,
                        subscriber_hash: str,
                        data: Dict[str, str]
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
                        self.users_data.append({
                            # Email: test3@example.com.
                            'email_hash': 'fedd8b80a7a813966263853b9af72151',
                            'status': data['status']
                        })
                    elif data['email_address'] == 'test4@example.com':
                        raise mailchimpclient.MailChimpError({
                            'status': 400,
                            'title': 'Forgotten Email Not Subscribed'})
                    else:
                        raise mailchimpclient.MailChimpError({
                            'status': 404, 'title': 'Invalid email',
                            'detail': 'Server Issue'})

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
                        user for user in self.users_data
                        if user['email_hash'] != subscriber_hash]

            def __init__(self) -> None:
                self.members = self.MailchimpMembers()

        def __init__(self) -> None:
            self.lists = self.MailchimpLists()

    def test_get_subscriber_hash(self) -> None:
        sample_email = 'test@example.com'
        subscriber_hash = '55502f40dc8b7c769880b10874abc9d0'
        self.assertEqual(
            mailchimp_bulk_email_services._get_subscriber_hash(sample_email), # pylint: disable=protected-access
            subscriber_hash)

        # TODO(#13528): Here we use MyPy ignore because we remove this test
        # after the backend is fully type-annotated. Here ignore[arg-type]
        # is used to test method _get_subscriber_hash() for invalid argument
        # type.
        sample_email_2 = 5
        with self.assertRaisesRegex(
            Exception, 'Invalid type for email. Expected string, received 5'):
            mailchimp_bulk_email_services._get_subscriber_hash(sample_email_2) # type: ignore[arg-type]  # pylint: disable=protected-access

    def test_function_input_validation(self) -> None:
        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_bulk_email_services, '_get_mailchimp_class',
            swapped_mailchimp)
        with swap_mailchimp_context:
            with self.assertRaisesRegex(
                Exception, 'Invalid Merge Fields'
            ):
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'valid@example.com', {'INVALID': 'value'}, 'Android',
                    can_receive_email_updates=True)

            with self.assertRaisesRegex(
                Exception, 'Invalid tag: Invalid'
            ):
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'valid@example.com', {}, 'Invalid',
                    can_receive_email_updates=True)

    def test_get_mailchimp_class_errors_when_api_key_is_not_available(
        self
    ) -> None:
        swap_get_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: None,
            expected_args=[('MAILCHIMP_API_KEY',)]
        )
        with self.capture_logging(min_level=logging.ERROR) as logs:
            with swap_get_secret:
                self.assertIsNone(
                    mailchimp_bulk_email_services._get_mailchimp_class() # pylint: disable=protected-access
                )
                self.assertItemsEqual(
                    logs, ['Mailchimp API key is not available.']
                )

    def test_get_mailchimp_class_errors_when_username_is_not_available(
        self
    ) -> None:
        swap_mailchimp_username = self.swap(
            feconf, 'MAILCHIMP_USERNAME', None
        )
        swap_get_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: 'key',
            expected_args=[('MAILCHIMP_API_KEY',)]
        )
        with self.capture_logging(min_level=logging.ERROR) as logs:
            with swap_mailchimp_username, swap_get_secret:
                self.assertIsNone(
                    mailchimp_bulk_email_services._get_mailchimp_class() # pylint: disable=protected-access
                )
                self.assertItemsEqual(
                    logs, ['Mailchimp username is not set.']
                )

    def test_add_or_update_user_status_returns_false_when_username_is_none(
        self
    ) -> None:
        swap_get_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: 'key',
            expected_args=[
                ('MAILCHIMP_API_KEY',),
            ]
        )
        with swap_get_secret:
            self.assertFalse(
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'sample_email',
                    {},
                    'Web',
                    can_receive_email_updates=True
                )
            )

    def test_permanently_delete_user_from_list_when_username_is_none(
        self
    ) -> None:
        swap_get_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: 'key',
            expected_args=[
                ('MAILCHIMP_API_KEY',),
            ]
        )
        with swap_get_secret:
            mailchimp_bulk_email_services.permanently_delete_user_from_list(
                'sample_email')

    def test_add_or_update_mailchimp_user_status(self) -> None:
        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_bulk_email_services, '_get_mailchimp_class',
            swapped_mailchimp)
        swap_api = self.swap(secrets_services, 'get_secret', lambda _: 'key')
        swap_username = self.swap(feconf, 'MAILCHIMP_USERNAME', 'username')

        with swap_mailchimp_context, swap_api, swap_username:
            # Tests condition where user was initally unsubscribed in list and
            # becomes subscribed.
            self.assertEqual(
                mailchimp.lists.members.users_data[0]['status'], 'unsubscribed')
            mailchimp_bulk_email_services.add_or_update_user_status(
                self.user_email_1, {}, 'Web', can_receive_email_updates=True)
            self.assertEqual(
                mailchimp.lists.members.users_data[0]['status'], 'subscribed')
            self.assertEqual(mailchimp.lists.members.tags.tag_names, ['Web'])

            # Tests condition where user was initally subscribed in list and
            # becomes unsubscribed.
            self.assertEqual(
                mailchimp.lists.members.users_data[1]['status'],
                'subscribed')
            mailchimp_bulk_email_services.add_or_update_user_status(
                self.user_email_2, {}, 'Web', can_receive_email_updates=False)
            self.assertEqual(
                mailchimp.lists.members.users_data[1]['status'],
                'unsubscribed')

            # Creates a mailchimp entry for a new user.
            self.assertEqual(len(mailchimp.lists.members.users_data), 3)
            return_status = (
                mailchimp_bulk_email_services.add_or_update_user_status(
                    self.user_email_3, {}, 'Web',
                    can_receive_email_updates=True))
            self.assertTrue(return_status)
            self.assertEqual(
                mailchimp.lists.members.users_data[3]['status'], 'subscribed')

            # Creates a mailchimp entry for a new user.
            return_status = (
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'test4@example.com', {}, 'Web',
                    can_receive_email_updates=True))
            self.assertFalse(return_status)

            # Here we use MyPy ignore because attribute 'users_data' can only
            # accept Dict but for testing purposes here we are providing None
            # which causes mypy to throw an error. Thus to avoid the error, we
            # used ignore here.
            mailchimp.lists.members.users_data = None # type: ignore[assignment]
            with self.capture_logging(min_level=logging.ERROR) as logs:
                mailchimp_bulk_email_services.add_or_update_user_status(
                    self.user_email_1, {}, 'Web',
                    can_receive_email_updates=True)
                self.assertItemsEqual(
                    [
                        'Mailchimp error prevented email signup: '
                        '{\'status\': 401, \'detail\': \'Server Error\'}'
                    ],
                    logs
                )

    def test_android_merge_fields(self) -> None:
        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_bulk_email_services, '_get_mailchimp_class',
            swapped_mailchimp)
        swap_api = self.swap(secrets_services, 'get_secret', lambda _: 'key')
        swap_username = self.swap(feconf, 'MAILCHIMP_USERNAME', 'username')

        with swap_mailchimp_context, swap_api, swap_username:
            # Tests condition where user was initally unsubscribed in list and
            # becomes subscribed.
            self.assertEqual(
                mailchimp.lists.members.users_data[0]['status'], 'unsubscribed')
            mailchimp_bulk_email_services.add_or_update_user_status(
                self.user_email_1, {'NAME': 'name'}, 'Android',
                can_receive_email_updates=True)
            self.assertEqual(
                mailchimp.lists.members.users_data[0]['status'], 'subscribed')
            self.assertEqual(
                mailchimp.lists.members.tags.tag_names, ['Android'])

    def test_catch_or_raise_errors_when_creating_new_invalid_user(self) -> None:
        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_bulk_email_services, '_get_mailchimp_class',
            swapped_mailchimp)
        swap_api = self.swap(secrets_services, 'get_secret', lambda _: 'key')
        swap_username = self.swap(feconf, 'MAILCHIMP_USERNAME', 'username')

        with swap_mailchimp_context, swap_api, swap_username:
            # Creates a mailchimp entry for a deleted user.
            self.assertEqual(len(mailchimp.lists.members.users_data), 3)
            return_status = (
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'test4@example.com', {}, 'Web',
                    can_receive_email_updates=True))
            self.assertFalse(return_status)
            self.assertEqual(len(mailchimp.lists.members.users_data), 3)

            # Create user raises exception for other errors.
            with self.capture_logging(min_level=logging.ERROR) as logs:
                mailchimp_bulk_email_services.add_or_update_user_status(
                    'test5@example.com', {}, 'Web',
                    can_receive_email_updates=True)
                self.assertItemsEqual(
                    ['Mailchimp error prevented email signup: Server Issue'],
                    logs
                )

    def test_permanently_delete_user(self) -> None:
        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_bulk_email_services, '_get_mailchimp_class',
            swapped_mailchimp)
        swap_api = self.swap(secrets_services, 'get_secret', lambda _: 'key')
        swap_username = self.swap(feconf, 'MAILCHIMP_USERNAME', 'username')

        with swap_mailchimp_context, swap_api, swap_username:
            self.assertEqual(len(mailchimp.lists.members.users_data), 3)
            mailchimp_bulk_email_services.permanently_delete_user_from_list(
                self.user_email_1)
            self.assertEqual(len(mailchimp.lists.members.users_data), 2)

            # Here we use MyPy ignore because attribute 'users_data' can only
            # accept Dict but for testing purposes here we are providing None
            # which causes mypy to throw an error. Thus to avoid the error, we
            # used ignore here.
            mailchimp.lists.members.users_data = None # type: ignore[assignment]
            with self.assertRaisesRegex(
                Exception, 'Server Error'):
                mailchimp_bulk_email_services.permanently_delete_user_from_list(
                    self.user_email_1)
