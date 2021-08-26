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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import contextlib

from core.platform import models
from core.tests import test_utils
import main
from typing import Any, ContextManager, Dict, cast
import webapp2
import webtest

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


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

        # TODO(13427): Replace Any with proper type after we can import types
        # from datastore_services.
        def get_ndb_context_mock(
                global_cache: Any
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
