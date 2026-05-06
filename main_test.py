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
import sys
from unittest import mock

import main
from core.constants import constants
from core.platform import models
from core.tests import test_utils

import google.cloud.logging
import webapp2
import webtest
from typing import ContextManager, Dict, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class CloudLoggingTests(test_utils.GenericTestBase):
    """Test the Cloud Logging setup."""

    def test_cloud_logging_is_set_up_when_emulator_mode_is_disabled(
        self,
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
            google.cloud.logging, 'Client', MockClient
        )
        with emulator_mode_swap, logging_client_swap:
            # This reloads the main module so that all the checks in
            # the module are reexecuted.
            importlib.reload(main)  # pylint: disable-all

        self.assertEqual(function_calls, {'setup_logging': True})


class NdbWsgiMiddlewareTests(test_utils.GenericTestBase):
    """Test the NdbWsgiMiddleware."""

    def test_ndb_wsgi_middleware_properly_wraps_given_function(self) -> None:

        def wsgi_app_mock(
            environ: Dict[str, str], response: webtest.TestResponse
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
            global_cache: datastore_services.RedisCache,
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
            datastore_services, 'get_ndb_context', get_ndb_context_mock
        )

        middleware = main.NdbWsgiMiddleware(
            cast(webapp2.WSGIApplication, wsgi_app_mock)
        )
        test_response = webtest.TestResponse()

        with get_ndb_context_swap:
            self.assertEqual(
                middleware({'key': 'value'}, test_response), test_response
            )


class MainRoutingTests(test_utils.GenericTestBase):
    """Test the routing helper functions in main.py."""

    def test_get_redirect_route_creates_correct_route(self) -> None:
        """Tests that the redirect route is created with the correct name and flags."""

        class MockHandler(webapp2.RequestHandler):
            pass

        route = main.get_redirect_route(
            '/my/test/route', MockHandler, defaults={'key': 'value'}
        )

        self.assertEqual(route.name, '_my_test_route')
        self.assertTrue(route.strict_slash)


class MainModuleDevModeTests(test_utils.GenericTestBase):
    """Test DEV_MODE specific logic in main.py."""

    def test_android_test_data_route_added_in_dev_mode(self) -> None:
        """Tests that the android test data route is added when DEV_MODE is True."""

        with self.swap(constants, 'DEV_MODE', True):
            importlib.reload(main)

            android_route_exists = any(
                route.name == '_initialize_android_test_data'
                for route in main.URLS
            )
            self.assertTrue(android_route_exists)

        with self.swap(constants, 'DEV_MODE', False):
            importlib.reload(main)

    def test_firebase_connection_not_established_when_in_pytest(self) -> None:
        """Tests that Firebase does not connect when pytest is running."""

        added_fake_pytest = False
        if 'pytest' not in sys.modules:
            sys.modules['pytest'] = mock.Mock()
            added_fake_pytest = True

        try:
            with mock.patch(
                'core.platform.auth.firebase_auth_services.establish_firebase_connection'
            ) as mock_connection:

                importlib.reload(main)

                mock_connection.assert_not_called()
        finally:
            if added_fake_pytest:
                sys.modules.pop('pytest', None)
