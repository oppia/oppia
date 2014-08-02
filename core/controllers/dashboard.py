# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the user dashboard."""

__author__ = 'sll@google.com (Sean Lip)'

from core.controllers import base
from core.domain import config_domain
from core.domain import exp_services
from core.domain import user_services


class DashboardPage(base.BaseHandler):
    """User dashboard page for Oppia."""

    # We use 'contribute' because the createExploration() modal makes a call
    # there.
    PAGE_NAME_FOR_CSRF = 'contribute'

    def get(self):
        if (not self.user_id or
                self.username in config_domain.BANNED_USERNAMES.value or
                not user_services.has_user_registered_as_editor(self.user_id)):
            self.redirect('/')
            return

        self.render_template('dashboard/dashboard.html')


class DashboardHandler(base.BaseHandler):
    """Provides data for the user dashboard."""

    def get(self):
        """Handles GET requests."""
        viewable_exps = (
            exp_services.get_explicit_viewer_explorations_summary_dict(
                self.user_id))
        editable_exps = (
            exp_services.get_explicit_editor_explorations_summary_dict(
                self.user_id))
        owned_exps = exp_services.get_owned_explorations_summary_dict(
            self.user_id)

        self.values.update({
            'viewable': viewable_exps,
            'editable': editable_exps,
            'owned': owned_exps,
        })

        self.render_json(self.values)
