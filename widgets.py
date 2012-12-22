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

import json, logging, os
import jinja2, webapp2
import base, feconf, models, utils


class WidgetRepositoryPage(base.BaseHandler):
  """Displays the widget repository page."""

  def get(self):  # pylint: disable-msg=C6409
    """Returns the widget repository page."""
    self.values = {
        'css': utils.GetCssFile('oppia'),
        'js': utils.GetJsFilesWithBase(['widgetRepository']),
    }
    if self.request.get('iframed') == 'true':
      self.values['iframed'] = True
    # TODO(sll): check if the user is an admin, and add an 'admin': True parameter
    # to values if so.
    self.response.out.write(
        base.JINJA_ENV.get_template('widgets/widgets.html').render(self.values))

  def post(self):  # pylint: disable-msg=C6409
    """Creates a new generic widget."""
    # TODO(sll): check if the user is an admin.
    raw = self.request.get('raw')
    name = self.request.get('name')
    if not raw:
      raise self.InvalidInputException('No widget code supplied')
    if not name:
      raise self.InvalidInputException('No widget name supplied')

    # TODO(sll): Make sure this JS is clean!
    raw = json.loads(raw)

    widget_hash_id = utils.GetNewId(models.GenericWidget, name)
    widget = models.GenericWidget(
        hash_id=widget_hash_id, raw=raw, name=name)
    widget.put()

  def put(self, widget_id=None):
    """Updates a generic widget."""
    # TODO(sll): check if the user is an admin.
    if not widget_id:
      raise self.InvalidInputException('No widget id supplied')
    raw = self.request.get('raw')
    if not raw:
      raise self.InvalidInputException('No widget code supplied')

    # TODO(sll): Make sure this JS is clean!
    raw = json.loads(raw)

    widget = utils.GetEntity(models.GenericWidget, widget_id)
    if not widget:
      raise self.InvalidInputException(
          'No generic widget found with id %s' % widget_id)
    widget.raw = raw
    widget.put()


class WidgetRepositoryHandler(base.BaseHandler):
  """Provides data to populate the widget repository page."""

  def get(self):  # pylint: disable-msg=C6409
    generic_widgets = models.GenericWidget.query()
    response = []
    # TODO(sll): The following line is here for testing, and should be removed.
    response.append({'hash_id': 'abcd', 'name': 'Colored text',
        'raw': '<div style="color: blue;">This text is blue</div>'})
    for widget in generic_widgets:
      response.append({'hash_id': widget.hash_id, 'name': widget.name,
                       'raw': widget.raw})
    self.response.out.write(json.dumps({'widgets': response}))


class Widget(base.BaseHandler):
  """Handles individual widget uploads, edits and retrievals."""

  def get(self, widget_id):  # pylint: disable-msg=C6409
    """Handles GET requests.

    Args:
      widget_id: string representing the widget id.

    Raises:
      utils.EntityIdNotFoundError, if an id is not supplied or no widget with
      this id exists.
    """
    widget = utils.GetEntity(models.Widget, widget_id)
    if widget:
      self.response.out.write(json.dumps({
          'raw': widget.raw,
      }))
    else:
      self.response.out.write(json.dumps({'error': 'No such widget'}))

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
