# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Controller responsible for fetching Firebase configuration values."""

from __future__ import annotations

import json

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import firebase_services

from typing import Dict


class FirebaseConfigValuesHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for getting the Firebase config variables."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Retrieves the Firebase config values."""
        firebase_config_values: Dict[str, str] = {}
        secret_response = firebase_services.get_firebase_config()
        if secret_response is not None:
            firebase_config_values = json.loads(secret_response)
        self.render_json(firebase_config_values)
