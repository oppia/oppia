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

"""Main package for the widget repository."""

__author__ = 'sll@google.com (Sean Lip)'

import json
import os
import random

from controllers.base import BaseHandler
import feconf
from models.widget import InteractiveWidget
import utils

from google.appengine.api import users


class WidgetRepositoryPage(BaseHandler):
    """Displays the widget repository page."""

    def get(self):
        """Returns the widget repository page."""
        self.values.update({
            'js': utils.get_js_controllers(['widgetRepository']),
        })
        if self.request.get('iframed') == 'true':
            self.values['iframed'] = True
        if self.request.get('interactive') == 'true':
            self.values['interactive'] = True
        if users.is_current_user_admin():
            self.values['admin'] = True
        self.render_template('widgets/widget_repository.html')


class WidgetRepositoryHandler(BaseHandler):
    """Provides data to populate the widget repository page."""

    def get_interactive_widgets(self):
        """Load interactive widgets from the file system."""
        response = {}

        for widget in InteractiveWidget.query():
            category = widget.category
            if category not in response:
                response[category] = []
            response[category].append(InteractiveWidget.get_with_params(
                widget.id, {}))

        for category in response:
            response[category].sort()
        return response

    def get(self):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        if self.request.get('interactive') == 'true':
            response = self.get_interactive_widgets()
        else:
            response = self.get_non_interactive_widgets()

        self.response.write(json.dumps({'widgets': response}))


class InteractiveWidgetHandler(BaseHandler):
    """Handles requests relating to interactive widgets."""

    @classmethod
    def get_interactive_widget(
            cls, widget_id, params=None, state_params_dict=None):
        """Gets interactive widget code from the file system."""
        if params is None:
            params = {}
        if state_params_dict is None:
            state_params_dict = {}

        parameters = {}

        for key in params:
            # This is a bad hack for pushing things like ["A", "B"] to
            # the frontend without the leading 'u', but it works.
            # TODO(sll): Fix this more robustly.
            if isinstance(params[key], list):
                parameters[key] = map(str, params[key])
            elif not isinstance(params[key], basestring):
                parameters[key] = params[key]
            else:
                parameters[key] = utils.parse_with_jinja(
                    params[key], state_params_dict, '')

        widget = InteractiveWidget.get_with_params(widget_id, parameters)

        for unused_action, properties in widget['actions'].iteritems():
            classifier = properties['classifier']
            if classifier and classifier != 'None':
                with open(os.path.join(
                        feconf.SAMPLE_CLASSIFIERS_DIR,
                        classifier,
                        '%sRules.yaml' % classifier)) as f:
                    properties['rules'] = utils.get_dict_from_yaml(
                        f.read().decode('utf-8'))
        return widget

    def get(self, widget_id):
        """Handles GET requests."""
        response = self.get_interactive_widget(widget_id)
        self.response.write(json.dumps({'widget': response}))

    def post(self, widget_id):
        """Handles POST requests, for parameterized widgets."""
        payload = json.loads(self.request.get('payload'))

        params = payload.get('params', {})
        if isinstance(params, list):
            new_params = {}
            for item in params:
                new_params[item['name']] = item['default_value']
            params = new_params

        state_params_dict = {}
        state_params_given = payload.get('state_params')
        if state_params_given:
            for (key, values) in state_params_given.iteritems():
                # Pick a random parameter for each key.
                state_params_dict[key] = random.choice(values)

        response = self.get_interactive_widget(
            widget_id, params=params, state_params_dict=state_params_dict)
        self.response.write(json.dumps({'widget': response}))
