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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import platform_feature_services
import utils


class PlatformFeatureHandler(base.BaseHandler):
    """The handler for retriving feature flag values."""

    @acl_decorators.open_access
    def post(self):
        """Handles POST requests, evaluates and returns all feature flags using
        the given client information.
        """
        context_dict = {
            'client_type': self.payload.get('client_type'),
            'browser_type': self.payload.get('browser_type'),
            'app_version': self.payload.get('app_version'),
            'user_locale': self.payload.get('user_locale'),
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
            .get_all_feature_flag_values_for_context(context))

        self.render_json(result_dict)
