# Copyright 2018 The Oppia Authors. All Rights Reserved.
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
from core.controllers import base
from core.controllers import acl_decorators


class DiagnosticTestPlayerPage(base.BaseHandler):
    """Renders the diagnostic test player page."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        print('nikhil')
        self.render_template('diagnostic-test-player-page.mainpage.html')