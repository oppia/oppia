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

from core.platform.transactions import cloud_transaction_services
from core.tests import test_utils


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
            def transaction(self) -> MockTransaction: # pylint: disable=missing-docstring
                return MockTransaction()

        swap_client = self.swap(
            cloud_transaction_services, 'CLIENT', MockClient())

        def add(x: int, y: int) -> int:
            return x + y
        with swap_client:
            wrapper_fn = cloud_transaction_services.run_in_transaction_wrapper(
                add)
            result = wrapper_fn(1, 2)

        self.assertEqual(result, 3)
        self.assertTrue(calls_made['enter_context'])
        self.assertTrue(calls_made['exit_context'])
