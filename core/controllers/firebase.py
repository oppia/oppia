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

"""Firebase proxy controller."""

from __future__ import annotations

import json

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base

import requests
from typing import Any, Dict


# Timeout in seconds for requests.
TIMEOUT_SECS = 60


class FirebaseProxyHandler(
    base.BaseHandler[Any, Any]
):
    """Handler to proxy auth requests to the firebase domain."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'firebase_path': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}, 'POST': {}}

    def _firebase_proxy(self) -> None:
        """Proxies all requests to the firebase app."""
        data = json.loads(self.request.body) if self.request.body else None
        response = requests.request(
            self.request.method,
            f'{constants.FIREBASE_DOMAIN}{self.request.path}',
            params=dict(self.request.params),
            data=data,
            headers=dict(self.request.headers.items()),
            timeout=TIMEOUT_SECS
        )
        for header_key, header_value in response.headers.items():
            self.response.headers[header_key] = header_value
        self.response.status = response.status_code
        self.response.body = response.content

    # Here we use type Any because the method signature has to match
    # the parent class.
    @acl_decorators.open_access
    def get(self, *args: Any, **kwargs: Any) -> None:  # pylint: disable=unused-argument
        """Proxies GET requests to the firebase app."""
        self._firebase_proxy()

    # Here we use type Any because the method signature has to match
    # the parent class.
    @acl_decorators.open_access
    def post(self, *args: Any) -> None:  # pylint: disable=unused-argument
        """Proxies POST requests to the firebase app."""
        self._firebase_proxy()
