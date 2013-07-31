# Copyright 2012 Google Inc. All Rights Reserved.
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

"""Controllers for the Oppia admin view."""

__author__ = 'sll@google.com (Sean Lip)'

from oppia.controllers import base
from oppia.domain import exp_services


class AdminPage(base.BaseHandler):
    """Admin page shown in the App Engine admin console."""

    @base.require_admin
    def get(self):
        """Handles GET requests."""
        self.render_template('admin/admin.html')

    @base.require_admin
    def post(self):
        """Reloads the default explorations."""
        if self.payload.get('action') == 'reload':
            if self.payload.get('item') == 'explorations':
                exp_services.reload_demos()
