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

import os
import random

from controllers.base import BaseHandler, require_user
import feconf
from models.models import GenericWidget, Widget
import utils
from yaml_utils import YamlTransformer

import json

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

    def post(self):
        """Creates a new generic widget."""
        if not users.is_current_user_admin():
            raise self.UnauthorizedUserException(
                'Insufficient privileges to create a new generic widget.')

        widget_data = self.request.get('widget')
        if not widget_data:
            raise self.InvalidInputException('No widget supplied')
        widget_data = json.loads(widget_data)

        if 'raw' not in widget_data:
            raise self.InvalidInputException('No widget code supplied')
        if 'name' not in widget_data:
            raise self.InvalidInputException('No widget name supplied')
        if 'category' not in widget_data:
            raise self.InvalidInputException('No widget category supplied')

        raw = widget_data['raw']
        name = widget_data['name']
        category = widget_data['category']
        if utils.check_existence_of_name(GenericWidget, name):
            raise self.InvalidInputException(
                'A widget with name %s already exists' % name)

        description = widget_data['description']
        params = widget_data['params']

        widget_hash_id = utils.get_new_id(GenericWidget, name)
        widget_data['id'] = widget_hash_id

        widget = GenericWidget(
            hash_id=widget_hash_id, raw=raw, name=name, params=params,
            category=category, description=description)
        widget.put()
        self.response.write(json.dumps({'widget': widget_data}))

    def put(self):
        """Updates a generic widget."""
        if not users.is_current_user_admin():
            raise self.UnauthorizedUserException(
                'Insufficient privileges to edit a generic widget.')

        widget_data = self.request.get('widget')
        if not widget_data:
            raise self.InvalidInputException('No widget supplied')
        widget_data = json.loads(widget_data)

        widget = utils.get_entity(GenericWidget, widget_data['id'])
        if not widget:
            raise self.InvalidInputException(
                'No generic widget found with id %s' % widget_data['id'])
        widget.raw = widget_data['raw']
        widget.name = widget_data['name']
        widget.description = widget_data['description']
        widget.params = widget_data['params']
        widget.category = widget_data['category']
        widget.put()
        self.response.write(json.dumps({'widget': widget_data}))


class WidgetRepositoryHandler(BaseHandler):
    """Provides data to populate the widget repository page."""

    def get_interactive_widgets(self):
        """Load interactive widgets from the file system."""
        response = {}
        for widget_id in os.listdir(feconf.SAMPLE_WIDGETS_DIR):
            widget = InteractiveWidget.get_interactive_widget(widget_id)
            category = widget['category']
            if category not in response:
                response[category] = []
            response[category].append(widget)

        for category in response:
            response[category].sort()
        return response

    def get_non_interactive_widgets(self):
        """Load non-interactive widgets."""
        generic_widgets = GenericWidget.query()
        response = {}
        for widget in generic_widgets:
            if widget.category not in response:
                response[widget.category] = []
            response[widget.category].append({
                'hash_id': widget.hash_id, 'name': widget.name,
                'raw': widget.raw, 'params': widget.params,
                'description': widget.description, 'category': widget.category,
                'id': widget.hash_id
            })
        return response

    def get(self):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        if self.request.get('interactive') == 'true':
            response = self.get_interactive_widgets()
        else:
            response = self.get_non_interactive_widgets()

        self.response.write(json.dumps({'widgets': response}))


class WidgetInstance(BaseHandler):
    """Handles individual (non-generic) widget uploads, edits and retrievals."""

    def get(self, widget_id):
        """Handles GET requests.

        Args:
            widget_id: string representing the widget id.

        Raises:
            utils.EntityIdNotFoundError, if an id is not supplied or no widget
            with this id exists.
        """
        widget = utils.get_entity(Widget, widget_id)
        if widget:
            self.response.write(json.dumps({
                'raw': widget.raw,
            }))
        else:
            self.response.write(json.dumps({'error': 'No such widget'}))

    @require_user
    def post(self, widget_id=None):
        """Saves or edits a widget uploaded by a content creator."""
        raw = self.request.get('raw')
        if not raw:
            raise self.InvalidInputException('No widget code supplied')

        # TODO(sll): Make sure this JS is clean!
        raw = json.loads(raw)

        # TODO(sll): Rewrite the following.
        if not widget_id:
            widget_hash_id = utils.get_new_id(Widget, 'temp_hash_id')
            widget = Widget(hash_id=widget_hash_id, raw=raw)
            widget.put()
        else:
            widget = utils.get_entity(Widget, widget_id)
            if not widget:
                raise self.InvalidInputException(
                    'No widget found with id %s' % widget_id)
            if 'raw' in self.request.arguments():
                widget.raw = raw
            widget.put()
        response = {'widgetId': widget.hash_id, 'raw': widget.raw}
        self.response.write(json.dumps(response))


class InteractiveWidget(BaseHandler):
    """Handles requests relating to interactive widgets."""

    @classmethod
    def get_interactive_widget(cls, widget_id, params=[], state_params_dict={}):
        """Gets interactive widget code from the file system."""

        widget = {}
        with open(os.path.join(
                feconf.SAMPLE_WIDGETS_DIR,
                widget_id,
                '%s.config.yaml' % widget_id)) as f:
            widget = YamlTransformer.get_dict_from_yaml(f.read().decode('utf-8'))

        widget_html = 'This widget is not available.'
        if widget_id in os.listdir(feconf.SAMPLE_WIDGETS_DIR):
            for key in params:
                # This is a bad hack for pushing things like ["A", "B"] to
                # the frontend without the leading 'u', but it works.
                # TODO(sll): Fix this more robustly.
                if isinstance(params[key], list):
                    widget['params'][key] = map(str, params[key])
                elif not isinstance(params[key], basestring):
                    widget['params'][key] = params[key]
                else:
                    widget['params'][key] = utils.parse_with_jinja(
                        params[key], state_params_dict, '')

            html_file = os.path.join(widget_id, '%s.html' % widget_id)

            widget_html = feconf.WIDGET_JINJA_ENV.get_template(
                html_file).render(widget['params'])

        widget['raw'] = widget_html
        for action, properties in widget['actions'].iteritems():
            classifier = properties['classifier']
            if classifier and classifier != 'None':
                with open(os.path.join(
                        feconf.SAMPLE_CLASSIFIERS_DIR,
                        classifier,
                        '%sRules.yaml' % classifier)) as f:
                    properties['rules'] = YamlTransformer.get_dict_from_yaml(
                        f.read().decode('utf-8'))
        return widget

    def get(self, widget_id):
        """Handles GET requests."""
        response = self.get_interactive_widget(widget_id)
        self.response.write(json.dumps({'widget': response}))

    def post(self, widget_id):
        """Handles POST requests, for parameterized widgets."""
        params = self.request.get('params')
        params = json.loads(params) if params else []

        state_params_dict = {}
        state_params_given = self.request.get('state_params')
        if state_params_given:
            state_params_given = json.loads(state_params_given)
        if state_params_given:
            for (key, values) in state_params_given.iteritems():
                # Pick a random parameter for each key.
                state_params_dict[key] = random.choice(values)

        response = self.get_interactive_widget(
            widget_id, params=params, state_params_dict=state_params_dict)
        self.response.write(json.dumps({'widget': response}))
