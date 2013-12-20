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

import logging

from core import counters
from core.controllers import base
from core.controllers import editor
from core.domain import config_domain
from core.domain import config_services
from core.domain import exp_services
import feconf

import jinja2


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

        self.values.update({
            'demo_explorations': [
                (str(ind), exp[0]) for ind, exp in
                enumerate(feconf.DEMO_EXPLORATIONS)],
            'object_editors_js': jinja2.utils.Markup(
                editor.OBJECT_EDITORS_JS.value)
        })

        self.render_template('admin/admin.html')


class AdminHandler(base.BaseHandler):
    """Handler for the admin page."""

    PAGE_NAME_FOR_CSRF = 'admin'

    @base.require_admin
    def get(self):
        """Handles GET requests."""

        self.render_json({
            'config_properties': (
                config_domain.Registry.get_config_property_schemas()),
            'computed_properties': (
                config_domain.Registry.get_computed_property_names()),
        })

    @base.require_admin
    def post(self):
        """Handles POST requests."""

        if self.payload.get('action') == 'reload_exploration':
            exploration_id = self.payload.get('explorationId')
            logging.info(
                '[ADMIN] %s reloaded exploration %s' %
                (self.user_id, exploration_id))
            exp_services.delete_demo(str(exploration_id))
            exp_services.load_demo(str(exploration_id))
        elif self.payload.get('action') == 'save_config_properties':
            new_config_property_values = self.payload.get(
                'new_config_property_values')
            logging.info('[ADMIN] %s saved config property values: %s' %
                         (self.user_id, new_config_property_values))
            for (name, value) in new_config_property_values.iteritems():
                config_services.set_property(name, value)
        elif self.payload.get('action') == 'refresh_computed_property':
            computed_property_name = self.payload.get('computed_property_name')
            config_domain.Registry.get_config_property(
                computed_property_name).refresh_default_value()

        self.render_json({})
