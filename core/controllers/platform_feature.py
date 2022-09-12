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

"""Controllers for the platform feature handlers."""

from __future__ import annotations

from core import feconf
from core import platform_feature_list
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import platform_feature_services


class PlatformFeaturesEvaluationHandler(base.BaseHandler):
    """The handler for retrieving feature flag values."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'platform_type': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'browser_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': (
                        constants.PLATFORM_PARAMETER_ALLOWED_BROWSER_TYPES)
                },
                'default_value': None
            },
            'app_version': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': (
                            constants.
                            PLATFORM_PARAMETER_APP_VERSION_WITH_HASH_REGEXP
                        )
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests. Evaluates and returns all feature flags using
        the given client information.
        """
        context_dict = {
            'platform_type': self.normalized_request.get('platform_type'),
            'browser_type': self.normalized_request.get('browser_type'),
            'app_version': self.normalized_request.get('app_version'),
        }
        context = (
            platform_feature_services.create_evaluation_context_for_client(
                context_dict))
        try:
            context.validate()
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        result_dict = (
            platform_feature_services
            .evaluate_all_feature_flag_values_for_client(context))

        self.render_json(result_dict)


class PlatformFeatureDummyHandler(base.BaseHandler):
    """Dummy handler for testing e2e feature gating flow."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.open_access
    def get(self):
        # This handler is gated by the dummy_feature flag, i.e. it's only
        # visible when the dummy_feature is enabled.
        if not platform_feature_services.is_feature_enabled(
                platform_feature_list.ParamNames.DUMMY_FEATURE.value):
            raise self.PageNotFoundException()
        self.render_json({
            'msg': 'ok'
        })
