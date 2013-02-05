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

import json, logging
from controllers.base import BaseHandler, require_user
import feconf, models, utils

from google.appengine.api import users


class WidgetRepositoryPage(BaseHandler):
    """Displays the widget repository page."""

    def get(self):  # pylint: disable-msg=C6409
        """Returns the widget repository page."""
        self.values.update({
            'js': utils.GetJsFilesWithBase(['widgetRepository']),
        })
        if self.request.get('iframed') == 'true':
            self.values['iframed'] = True
        if users.is_current_user_admin():
            self.values['admin'] = True
        self.response.out.write(feconf.JINJA_ENV.get_template(
            'widgets/widget_repository.html').render(self.values))

    def post(self):  # pylint: disable-msg=C6409
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
        if utils.CheckExistenceOfName(models.GenericWidget, name):
            raise self.InvalidInputException(
                'A widget with name %s already exists' % name)

        blurb = widget_data['blurb']
        params = widget_data['params']

        widget_hash_id = utils.GetNewId(models.GenericWidget, name)
        widget_data['id'] = widget_hash_id

        widget = models.GenericWidget(
                hash_id=widget_hash_id, raw=raw, name=name, params=params,
                category=category, blurb=blurb)
        widget.put()
        self.response.out.write(json.dumps({'widget': widget_data}))

    def put(self):
        """Updates a generic widget."""
        if not users.is_current_user_admin():
            raise self.UnauthorizedUserException(
                'Insufficient privileges to edit a generic widget.')

        widget_data = self.request.get('widget')
        if not widget_data:
            raise self.InvalidInputException('No widget supplied')
        widget_data = json.loads(widget_data)

        widget = utils.GetEntity(models.GenericWidget, widget_data['id'])
        if not widget:
            raise self.InvalidInputException(
                'No generic widget found with id %s' % widget_data['id'])
        widget.raw = widget_data['raw']
        widget.name = widget_data['name']
        widget.blurb = widget_data['blurb']
        widget.params = widget_data['params']
        widget.category = widget_data['category']
        widget.put()
        self.response.out.write(json.dumps({'widget': widget_data}))


class WidgetRepositoryHandler(BaseHandler):
    """Provides data to populate the widget repository page."""

    def get(self):  # pylint: disable-msg=C6409
        generic_widgets = models.GenericWidget.query()
        response = {}
        for widget in generic_widgets:
            if widget.category not in response:
                response[widget.category] = []
            response[widget.category].append({
                'hash_id': widget.hash_id, 'name': widget.name,
                'raw': widget.raw, 'params': widget.params,
                'blurb': widget.blurb, 'category': widget.category,
                'id': widget.hash_id
            })
        self.response.out.write(json.dumps({'widgets': response}))


class Widget(BaseHandler):
    """Handles individual (non-generic) widget uploads, edits and retrievals."""

    def get(self, widget_id):  # pylint: disable-msg=C6409
        """Handles GET requests.

        Args:
            widget_id: string representing the widget id.

        Raises:
            utils.EntityIdNotFoundError, if an id is not supplied or no widget
            with this id exists.
        """
        widget = utils.GetEntity(models.Widget, widget_id)
        if widget:
            self.response.out.write(json.dumps({
                'raw': widget.raw,
            }))
        else:
            self.response.out.write(json.dumps({'error': 'No such widget'}))

    @require_user
    def post(self, widget_id=None):  # pylint: disable-msg=C6409
        """Saves or edits a widget uploaded by a content creator."""
        logging.info(widget_id)
        raw = self.request.get('raw')
        if not raw:
            raise self.InvalidInputException('No widget code supplied')

        # TODO(sll): Make sure this JS is clean!
        raw = json.loads(raw)

        # TODO(sll): Rewrite the following.
        if not widget_id:
            widget_hash_id = utils.GetNewId(models.Widget, 'temp_hash_id')
            widget = models.Widget(hash_id=widget_hash_id, raw=raw)
            widget.put()
        else:
            widget = utils.GetEntity(models.Widget, widget_id)
            if not widget:
                raise self.InvalidInputException(
                    'No widget found with id %s' % widget_id)
            if 'raw' in self.request.arguments():
                widget.raw = raw
            widget.put()
        response = {'widgetId': widget.hash_id, 'raw': widget.raw}
        self.response.out.write(json.dumps(response))
