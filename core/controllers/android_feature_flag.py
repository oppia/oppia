# Copyright 2026 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Controllers for Android feature flags."""

from __future__ import annotations

from core import feconf, utils
from core.controllers import acl_decorators, base
from core.domain import android_feature_flag_services

from typing import Dict


class AndroidFeatureFlagsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler that returns evaluated Android feature flags."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Returns the evaluated Android feature flags for this installation."""
        required_headers = (
            'app_version_name',
            'installation_id',
            'app_package_name',
        )
        header_values: Dict[str, str] = {}
        for header_name in required_headers:
            header_value = self.request.headers.get(header_name)
            if header_value is None or not header_value.strip():
                raise self.InvalidInputException(
                    'Missing required header: %s.' % header_name
                )
            header_values[header_name] = header_value

        try:
            evaluated_flags = android_feature_flag_services.get_evaluated_android_feature_flags(
                header_values['app_version_name'],
                header_values['installation_id'],
            )
        except utils.ValidationError as e:
            raise self.InvalidInputException(str(e)) from e

        self.render_json(
            {
                'feature_flags': [
                    {'name': name, 'enabled': enabled}
                    for flag in evaluated_flags
                    for name, enabled in flag.items()
                ]
            }
        )
