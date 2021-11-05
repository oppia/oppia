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

"""Tests for generic controller behavior."""

from __future__ import annotations

import contextlib
import importlib

from core.constants import constants
from core.platform import models
from core.tests import test_utils
import main

import google.cloud.logging
from typing import ContextManager, Dict, cast
import webapp2
import webtest

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class CloudLoggingTests(test_utils.GenericTestBase):
    """Test the Cloud Logging setup."""

    def test_cloud_logging_is_set_up_when_emulator_mode_is_disabled(
        self
    ) -> None:
        function_calls = {
            'setup_logging': False,
        }

        class MockClient:
            """Mock client for Google Cloud Logging."""

            def setup_logging(self) -> None:
                function_calls['setup_logging'] = True

        emulator_mode_swap = self.swap(constants, 'EMULATOR_MODE', False)
        logging_client_swap = self.swap_with_checks(
            google.cloud.logging, 'Client', MockClient)
        with emulator_mode_swap, logging_client_swap:
            # This reloads the main module so that all the checks in
            # the module are reexecuted.
            importlib.reload(main)  # pylint: disable-all

        self.assertEqual(function_calls, {'setup_logging': True})


class NdbWsgiMiddlewareTests(test_utils.GenericTestBase):
    """Test the NdbWsgiMiddleware."""

    def test_ndb_wsgi_middleware_properly_wraps_given_function(self) -> None:

        def wsgi_app_mock(
                environ: Dict[str, str],
                response: webtest.TestResponse
        ) -> webtest.TestResponse:
            """Mock WSGI app.

            Args:
                environ: dict. Environment variables.
                response: webtest.TestResponse. Response to return.

            Returns:
                webtest.TestResponse. Response.
            """
            self.assertEqual(environ, {'key': 'value'})
            self.assertEqual(type(response), webtest.TestResponse)
            return response

        def get_ndb_context_mock(
                global_cache: datastore_services.RedisCache
        ) -> ContextManager[None]:
            """Mock the NDB context.

            Args:
                global_cache: RedisCache. Cache used by the NDB.

            Returns:
                ContextManager. Context manager that does nothing.
            """
            self.assertEqual(type(global_cache), datastore_services.RedisCache)
            return contextlib.nullcontext()

        get_ndb_context_swap = self.swap_with_checks(
            datastore_services,
            'get_ndb_context',
            get_ndb_context_mock
        )

        # Create middleware that wraps wsgi_app_mock.
        # The function 'wsgi_app_mock' is casted to be of type WSGIApplication
        # because we are passing it as a WSGIApplication not as a function.
        middleware = main.NdbWsgiMiddleware(
            cast(webapp2.WSGIApplication, wsgi_app_mock))
        test_response = webtest.TestResponse()

        # Verify that NdbWsgiMiddleware keeps the test_response the same.
        with get_ndb_context_swap:
            self.assertEqual(
                middleware({'key': 'value'}, test_response), test_response)
