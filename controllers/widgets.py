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

"""Main package for interactive widgets."""

__author__ = 'sll@google.com (Sean Lip)'

import json
import logging

from apps.widget.models import InteractiveWidget
from apps.widget.models import NonInteractiveWidget
from controllers.base import BaseHandler
import utils

from google.appengine.api import users


class WidgetRepositoryPage(BaseHandler):
    """Displays the widget repository page."""

    def get(self):
        """Returns the widget repository page."""
        if self.request.get('iframed') == 'true':
            self.values['iframed'] = True
        if self.request.get('interactive') == 'true':
            self.values['interactive'] = True
        if 'parent_index' in self.request.GET.keys():
            self.values['parent_index'] = self.request.get('parent_index')
        if users.is_current_user_admin():
            self.values['admin'] = True
        self.render_template('editor/widget_repository.html')


class WidgetRepositoryHandler(BaseHandler):
    """Provides data to populate the widget repository page."""

    def get_widgets(self, widget_class):
        """Load widgets from the datastore."""
        assert widget_class in [InteractiveWidget, NonInteractiveWidget]

        response = {}

        for widget in widget_class.query():
            category = widget.category
            if category not in response:
                response[category] = []
            response[category].append(
                widget_class.get_with_params(widget.id, {})
            )

        for category in response:
            response[category].sort()
        return response

    def get(self):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        response = {}
        if self.request.get('interactive') == 'true':
            response['widgets'] = self.get_widgets(InteractiveWidget)
        else:
            response['widgets'] = self.get_widgets(NonInteractiveWidget)
            parent_index = self.request.get('parent_index')
            if parent_index is None:
                raise Exception(
                    'No parent index supplied for non-interactive widget.')
            else:
                response['parent_index'] = parent_index

        self.render_json(response)


class NonInteractiveWidgetHandler(BaseHandler):
    """Handles requests relating to interactive widgets."""
    # TODO(sll): Combine this with InteractiveWidgetHandler.

    def get(self, widget_id):
        """Handles GET requests."""
        self.render_json({
            'widget': NonInteractiveWidget.get_with_params(widget_id),
        })

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
            for param in state_params_given:
                # Pick a random parameter for each key.
                state_params_dict[param['name']] = (
                    utils.get_random_choice(param['values']))

        # TODO(sll): In order to unify this with InteractiveWidgetHandler,
        # we need a convention for which params must be JSONified and which
        # should not. Fix this.
        response = NonInteractiveWidget.get_with_params(widget_id, params)

        self.render_json({
            'widget': response,
            'parent_index': self.request.get('parent_index'),
        })


class InteractiveWidgetHandler(BaseHandler):
    """Handles requests relating to interactive widgets."""

    def get(self, widget_id):
        """Handles GET requests."""
        self.render_json({
            'widget': InteractiveWidget.get_with_params(widget_id),
        })

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
            for param in state_params_given:
                # Pick a random parameter for each key.
                state_params_dict[param['name']] = (
                    utils.get_random_choice(param['values']))

        response = InteractiveWidget.get_with_params(
            widget_id, params=utils.parse_dict_with_params(
                params, state_params_dict)
        )

        self.render_json({'widget': response})
