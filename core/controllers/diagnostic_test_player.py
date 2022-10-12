# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the diagnostic test player page."""

from __future__ import annotations

from core.controllers import acl_decorators
from core.controllers import base
from typing import Any, Dict


class DiagnosticTestPlayerPage(base.BaseHandler):
    """Renders the diagnostic test player page."""

    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    URL_PATH_ARGS_SCHEMAS: Dict[str, Any] = {}
    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    HANDLER_ARGS_SCHEMAS: Dict[str, Any] = {'GET': {}}

    @acl_decorators.open_access # type: ignore[misc]
    def get(self) -> None:
        """Handles GET requests."""
        self.render_template('diagnostic-test-player-page.mainpage.html') # type: ignore[no-untyped-call]
