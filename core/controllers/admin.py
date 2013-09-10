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

"""Controllers for the admin view."""

__author__ = 'sll@google.com (Sean Lip)'

from core import counters
from core.controllers import base
from core.domain import exp_services
import feconf


class AdminPage(base.BaseHandler):
    """Admin page shown in the App Engine admin console."""

    PAGE_NAME_FOR_CSRF = 'admin'

    @base.require_admin
    def get(self):
        """Handles GET requests."""
        self.values['counters'] = [{
            'name': counter.name,
            'description': counter.description,
            'value': counter.value
        } for counter in counters.Registry.get_all_counters()]

        if counters.HTML_RESPONSE_COUNT.value:
            average_time = (
                counters.HTML_RESPONSE_TIME_SECS.value /
                counters.HTML_RESPONSE_COUNT.value)
            self.values['counters'].append({
                'name': 'average-html-response-time-secs',
                'description': 'Average HTML response time in seconds',
                'value': average_time
            })

        if counters.JSON_RESPONSE_COUNT.value:
            average_time = (
                counters.JSON_RESPONSE_TIME_SECS.value /
                counters.JSON_RESPONSE_COUNT.value)
            self.values['counters'].append({
                'name': 'average-json-response-time-secs',
                'description': 'Average JSON response time in seconds',
                'value': average_time
            })

        demo_explorations = [(str(ind), exp[0]) for ind, exp in
                             enumerate(feconf.DEMO_EXPLORATIONS)]
        self.values['demo_explorations'] = demo_explorations

        self.render_template('admin/admin.html')

    @base.require_admin
    def post(self):
        """Reloads the default explorations."""
        if self.payload.get('action') == 'reload_exploration':
            exploration_id = self.payload.get('explorationId')
            exp_services.delete_demo(str(exploration_id))
            exp_services.load_demo(str(exploration_id))
