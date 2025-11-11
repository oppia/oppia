# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for the cloud_transaction_services.py"""

from __future__ import annotations

from unittest import mock

from core.platform.transactions import cloud_transaction_services
from core.tests import test_utils

# Here we use MyPy ignore because the 'google.api_core' module is dynamically
# loaded, and MyPy cannot normally detect the 'exceptions' attribute.
from google.api_core import exceptions as google_api_exceptions  # type: ignore[attr-defined] # isort: skip


class CloudTransactionServicesTests(test_utils.GenericTestBase):
    """Unit tests for the cloud_transaction_services.py"""

    def test_run_in_transaction_wrapper(self) -> None:
        calls_made = {
            'enter_context': False,
            'exit_context': False,
        }

        class MockTransaction:
            def __enter__(self) -> None:
                calls_made['enter_context'] = True

            def __exit__(self, *unused_args: str) -> None:
                calls_made['exit_context'] = True

        class MockClient:
            def transaction(  # pylint: disable=missing-docstring
                self,
            ) -> MockTransaction:
                return MockTransaction()

        swap_client = self.swap(
            cloud_transaction_services, 'CLIENT', MockClient()
        )

        def add(x: int, y: int) -> int:
            return x + y

        with swap_client:
            wrapper_fn = cloud_transaction_services.run_in_transaction_wrapper(
                add
            )
            result = wrapper_fn(1, 2)

        self.assertEqual(result, 3)
        self.assertTrue(calls_made['enter_context'])
        self.assertTrue(calls_made['exit_context'])

    def test_run_in_transaction_retries_on_service_unavailable_error(
        self,
    ) -> None:
        """Tests that the transaction retries and succeeds."""

        # 1. Define a simple function to run in the transaction.
        def mock_transactional_function() -> str:
            return 'SUCCESS'

        # 2. Create a mock for the CONTEXT MANAGER (the object returned by transaction()).
        mock_context_manager = mock.MagicMock()

        # 3. Configure its __enter__ method to fail TWICE, then succeed.
        mock_context_manager.__enter__.side_effect = [
            google_api_exceptions.ServiceUnavailable('Test error 1'),
            google_api_exceptions.ServiceUnavailable('Test error 2'),
            # This is the successful 3rd call.
            None,
        ]
        mock_context_manager.__exit__ = mock.MagicMock()

        # 4. Create a mock for the CLIENT.transaction METHOD itself.
        mock_transaction_method = mock.MagicMock(
            return_value=mock_context_manager
        )

        # 5. Get the wrapped function from the service.
        wrapped_function = (
            cloud_transaction_services.run_in_transaction_wrapper(
                mock_transactional_function
            )
        )

        # 6. Swap the real method with our mock using a 'with' statement.
        with self.swap(
            cloud_transaction_services.CLIENT,
            'transaction',
            mock_transaction_method,
        ):
            # 7. Assert that the function now SUCCEEDS (it does not raise an error).
            # We mock 'time.sleep' so the test runs instantly.
            with mock.patch('time.sleep'):
                result = wrapped_function()

        # 8. Check that the function returned the correct value.
        self.assertEqual(result, 'SUCCESS')
        # Check that the transaction method was called 3 TIMES (1 original + 2 retries).
        self.assertEqual(mock_transaction_method.call_count, 3)
        self.assertEqual(mock_context_manager.__enter__.call_count, 3)
