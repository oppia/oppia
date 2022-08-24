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

"""Tests for dev mode bulk email services."""

from __future__ import annotations

import logging

from core.platform.bulk_email import dev_mode_bulk_email_services
from core.tests import test_utils

from typing import Any


class DevModeBulkEmailServicesUnitTests(test_utils.GenericTestBase):
    """Tests for mailchimp services."""

    def test_add_or_update_user_status(self) -> None:
        observed_log_messages = []
        # We are using Any here because the following function mocks
        # logging.info methods, whose stubs denote the type of args as Any.
        # https://github.com/python/typeshed/blob/837b57fdd1a814237ef4b15f6ce19c701303aebb/stdlib/logging/__init__.pyi#L76
        def _mock_logging_function(msg: str, *args: Any) -> None:
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        with self.swap(logging, 'info', _mock_logging_function):
            dev_mode_bulk_email_services.add_or_update_user_status(
                'test@example.com', True)
            self.assertItemsEqual(
                observed_log_messages,
                ['Updated status of email ID test@example.com\'s bulk email '
                 'preference in the service provider\'s db to True. Cannot '
                 'access API, since this is a dev environment.'])

            observed_log_messages = []
            dev_mode_bulk_email_services.add_or_update_user_status(
                'test@example.com', False)
            self.assertItemsEqual(
                observed_log_messages,
                ['Updated status of email ID test@example.com\'s bulk email '
                 'preference in the service provider\'s db to False. Cannot '
                 'access API, since this is a dev environment.'])

    def test_permanently_delete_user(self) -> None:
        observed_log_messages = []
        # We are using Any here because the following function mocks
        # logging.info methods, whose stubs denote the type of args as Any.
        # https://github.com/python/typeshed/blob/837b57fdd1a814237ef4b15f6ce19c701303aebb/stdlib/logging/__init__.pyi#L76
        def _mock_logging_function(msg: str, *args: Any) -> None:
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        with self.swap(logging, 'info', _mock_logging_function):
            dev_mode_bulk_email_services.permanently_delete_user_from_list(
                'test@example.com')
            self.assertItemsEqual(
                observed_log_messages,
                ['Email ID test@example.com permanently deleted from bulk '
                 'email provider\'s db. Cannot access API, since this is a '
                 'dev environment'])
