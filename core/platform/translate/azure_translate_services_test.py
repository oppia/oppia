# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for the Azure Translator API platform services."""

from __future__ import annotations

from core import feconf
from core.platform.translate import azure_translate_services
from core.tests import test_utils

import requests
import requests.exceptions
from typing import Any, Dict, List, Union


class MockResponse:
    """Mock for the requests.models.Response object."""

    # Here we use type Any because the json_data can be either a list of dicts
    # or a dict, and the exact structure depends on the API response format
    # which varies across different test cases.
    def __init__(
        self,
        json_data: Union[List[Dict[str, Any]], Dict[str, Any]],
        status_code: int,
    ) -> None:
        """Initializes the MockResponse object."""
        self.json_data = json_data
        self.status_code = status_code

    # Here we use type Any because the JSON response values from the Azure API
    # can be of arbitrary types and cannot be statically typed without
    # introducing unnecessary complexity.
    def json(self) -> Union[List[Dict[str, Any]], Dict[str, Any]]:
        """Returns the json data."""
        return self.json_data

    def raise_for_status(self) -> None:
        """Raises an HTTPError if status code is >= 400."""
        if self.status_code >= 400:
            raise requests.exceptions.HTTPError(
                'HTTP Error: %s' % self.status_code
            )


class AzureTranslationServiceTests(test_utils.GenericTestBase):
    """Tests for the AzureTranslationService."""

    def setUp(self) -> None:
        super().setUp()
        self.service = azure_translate_services.AzureTranslationService()
        self.api_key_swap = self.swap(
            feconf, 'AZURE_TRANSLATOR_API_KEY', 'fake_api_key'
        )
        self.region_swap = self.swap(
            feconf, 'AZURE_TRANSLATOR_REGION', 'fake_region'
        )

        import time

        self.sleep_swap = self.swap(time, 'sleep', lambda x: None)

    def test_missing_api_key_raises_exception(self) -> None:
        missing_key_swap = self.swap(feconf, 'AZURE_TRANSLATOR_API_KEY', None)
        with missing_key_swap:
            with self.assertRaisesRegex(
                Exception,
                'Either Azure Translation API key configuration or region is missing.',
            ):
                self.service.generate_translation('en', 'es', 'hello')

    def test_successful_translation_returns_text(self) -> None:
        mock_response = MockResponse(
            [{'translations': [{'text': 'hola'}]}], 200
        )

        # Here we use type Any because the mock function must match the
        # requests.post signature which accepts arbitrary args and kwargs
        # that vary depending on how the function is called internally.
        def mock_post(*unused_args: Any, **unused_kwargs: Any) -> MockResponse:
            return mock_response

        post_swap = self.swap(requests, 'post', mock_post)

        with self.api_key_swap, self.region_swap, post_swap:
            result = self.service.generate_translation('en', 'es', 'hello')
            self.assertEqual(result, 'hola')

    def test_rate_limit_triggers_exponential_backoff_and_fails(self) -> None:
        mock_response = MockResponse({}, 429)

        # Here we use type Any because the mock function must match the
        # requests.post signature which accepts arbitrary args and kwargs
        # that vary depending on how the function is called internally.
        def mock_post(*unused_args: Any, **unused_kwargs: Any) -> MockResponse:
            return mock_response

        post_swap = self.swap(requests, 'post', mock_post)

        with self.api_key_swap, self.region_swap, post_swap, self.sleep_swap:
            with self.assertRaisesRegex(
                Exception, 'Azure Translator API request failed'
            ):
                self.service.generate_translation('en', 'es', 'hello')

    def test_hard_error_fails_immediately_without_retrying(self) -> None:
        mock_response = MockResponse({}, 400)

        # Here we use type Any because the mock function must match the
        # requests.post signature which accepts arbitrary args and kwargs
        # that vary depending on how the function is called internally.
        def mock_post(*unused_args: Any, **unused_kwargs: Any) -> MockResponse:
            return mock_response

        post_swap = self.swap(requests, 'post', mock_post)

        with self.api_key_swap, self.region_swap, post_swap:
            with self.assertRaisesRegex(
                Exception,
                'Failed to communicate with Azure API: HTTP Error: 400',
            ):
                self.service.generate_translation('en', 'es', 'hello')

    def test_timeout_triggers_exponential_backoff_and_fails(self) -> None:

        # Here we use type Any because the mock function must match the
        # requests.post signature which accepts arbitrary args and kwargs
        # that vary depending on how the function is called internally.
        def mock_post_timeout(
            *unused_args: Any, **unused_kwargs: Any
        ) -> MockResponse:
            raise requests.exceptions.Timeout('Connection timed out.')

        post_swap = self.swap(requests, 'post', mock_post_timeout)

        with self.api_key_swap, self.region_swap, post_swap, self.sleep_swap:
            with self.assertRaisesRegex(
                Exception, 'Azure Translator API request failed'
            ):
                self.service.generate_translation('en', 'es', 'hello')
