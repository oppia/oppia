# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the oppia root page."""

from __future__ import annotations

from core.controllers import acl_decorators, base
from core.domain import feature_flag_services

from typing import Dict


class OppiaRootPage(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Renders oppia root page (unified entry point) for all routes registered
    with angular router.
    """

    # Using type ignore[misc] here because untyped decorator makes function
    # "get" also untyped.
    # The '**kwargs' argument is needed because some routes pass keyword
    # arguments and even when we don't use them we need to allow them so that
    # there is no error in the callsite.
    @acl_decorators.open_access
    def get(self, **kwargs: Dict[str, str]) -> None:
        """Handles GET requests."""
        url = self.request.uri

        # Feature flags are evaluated here so that they arrive with the initial
        # page load, instead of requiring a separate blocking request to the
        # feature flags evaluation handler during frontend bootstrap. This
        # removes an extra network round-trip and a redundant auth/user lookup.
        feature_flag_dict = (
            feature_flag_services.evaluate_all_feature_flag_configs(
                self.user_id
            )
        )
        render_values: Dict[str, Dict[str, bool]] = {
            'OPPIA_FEATURE_FLAGS': feature_flag_dict
        }

        if 'explore' in url or 'embed' in url:
            self.render_template(
                'oppia-root.mainpage.html',
                iframe_restriction=None,
                values=render_values,
            )
            return

        self.render_template(
            'oppia-root.mainpage.html',
            values=render_values,
        )
