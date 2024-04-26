# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the feature flags handlers."""

from __future__ import annotations

from core import feature_flag_list
from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import feature_flag_services

from typing import Dict


class FeatureFlagsEvaluationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """The handler for retrieving feature flag values."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests. Evaluates and returns all feature flags."""
        result_dict = (
            feature_flag_services.evaluate_all_feature_flag_configs(
                self.user_id)
        )

        self.render_json(result_dict)


class FeatureFlagDummyHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Dummy handler for testing e2e feature gating flow."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        # This handler is gated by the dummy_feature_flag_for_e2e_tests flag,
        # i.e. it's only visible when the dummy_feature_flag_for_e2e_tests
        # is enabled.
        dummy_feature_flag_for_e2e_tests = (
            feature_flag_list.FeatureNames
            .DUMMY_FEATURE_FLAG_FOR_E2E_TESTS.value)
        self.render_json({
            'msg': 'ok',
            'is_enabled': feature_flag_services.is_feature_flag_enabled(
                dummy_feature_flag_for_e2e_tests, self.user_id)
        })
