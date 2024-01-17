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

"""Controllers responsible for fetching Firebase config variables."""

from __future__ import annotations
import json

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.platform import models

from typing import Dict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import secrets_services
secrets_services = models.Registry.import_secrets_services()

class FirebaseConfigValuesHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Handler for getting the Firebase config variables."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Retrieves the Firebase config values from Cloud secrets."""
        firebase_config_values = secrets_services.get_secret(
            'FIREBASE_CONFIG_VALUES')
        self.render_json(firebase_config_values)
