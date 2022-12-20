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

from core.controllers import acl_decorators
from core.controllers import base

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
        self.render_template('oppia-root.mainpage.html')


class OppiaLightweightRootPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Renders lightweight oppia root page (unified entry point) for all routes
    registered with angular router.
    """

    # Using type ignore[misc] here because untyped decorator makes function
    # "get" also untyped.
    # The '**kwargs' argument is needed because some routes pass keyword
    # arguments and even when we don't use them we need to allow them so that
    # there is no error in the callsite.
    @acl_decorators.open_access
    def get(self, **kwargs: Dict[str, str]) -> None:
        """Handles GET requests."""
        # The following logic determines which bundle to return. Currently the
        # AoT bundle doesn't support rtl languages yet. So we switch between
        # AoT and webpack bundle based on language direction.
        # The order of preference to determine the language direction is:
        # 1. Cookies
        # 2. Url params
        # In the case we don't find a language direction from the above two,
        # we default to AoT bundle.
        # TODO(#16300): Refactor the RTL css generation to add RTL CSS to the
        #   original CSS files instead of creating a new rtl CSS file
        # NOTE: After the aforementioned issue is solved, the AoT bundle will be
        #   the only bundle that is returned.
        if self.request.cookies.get('dir') == 'rtl':
            self.render_template('lightweight-oppia-root.mainpage.html')
            return
        if self.request.cookies.get('dir') == 'ltr':
            self.render_template('index.html', template_is_aot_compiled=True)
            return
        if self.request.get('dir') == 'rtl':
            self.render_template('lightweight-oppia-root.mainpage.html')
            return
        self.render_template('index.html', template_is_aot_compiled=True)
