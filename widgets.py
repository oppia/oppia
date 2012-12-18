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


class BaseHandler(webapp2.RequestHandler):
  """Base class for all handlers in this file."""

  def error(self, code):  # pylint: disable-msg=C6409
    super(BaseHandler, self).error(code)
    self.response.out.write('Resource not found.')
    return

  def DescriptiveError(self, code, error_message):
    """Displays a simple error page to the content creator."""
    super(BaseHandler, self).error(code)
    logging.error('%s: %s', code, error_message)
    self.response.out.write('Error: ' + str(error_message))
    return

  def JsonError(self, error_message, code=404):
    """Used to handle error messages in JSON returns."""
    super(BaseHandler, self).error(code)
    logging.error('%s: %s', code, error_message)
    self.response.out.write(json.dumps({'error': str(error_message)}))
    return


class WidgetRepositoryPage(BaseHandler):
  """Displays the widget repository page."""

  def get(self):  # pylint: disable-msg=C6409
    """Returns the widget repository page."""
    self.values = {
        'css': utils.GetCssFile('oppia'),
        'js': utils.GetJsFilesWithBase(['widgetRepository']),
    }
    if self.request.get('iframed') == 'true':
      self.values['iframed'] = True
    self.response.out.write(
        base.JINJA_ENV.get_template('widgets/widgets.html').render(self.values))

  def post(self, widget_id=None):  # pylint: disable-msg=C6409
    """Saves or edits a generic widget uploaded by a content creator."""
    logging.info(widget_id)
    raw = self.request.get('raw')
    name = self.request.get('name')
    if not raw:
      raise self.InvalidInputException('No widget code supplied')
    if not name:
      raise self.InvalidInputException('No widget name supplied')

    # TODO(sll): Make sure this JS is clean!
    raw = json.loads(raw)

    logging.info(self.request.arguments())
    if not widget_id:
      # TODO(sll): Figure out what to pass into the hashing function.
      widget_hash_id = utils.GetNewId(models.GenericWidget, 'temp_hash_id')
      # TODO(sll): Add a proper name here.
      widget = models.GenericWidget(
          hash_id=widget_hash_id, raw=raw, name=name)
      widget.put()
    else:
      widget = utils.GetEntity(models.GenericWidget, widget_id)
      if not widget:
        raise self.InvalidInputException(
            'No generic widget found with id %s' % widget_id)
      if 'raw' in self.request.arguments():
        widget.raw = raw
      widget.put()
    response = {'widgetId': widget.hash_id, 'raw': widget.raw}
    self.response.out.write(json.dumps(response))


class WidgetRepositoryHandler(BaseHandler):
  """Provides data to populate the widget repository page."""

  def get(self):  # pylint: disable-msg=C6409
    generic_widgets = models.GenericWidget.query()
    response = []
    # TODO(sll): The following line is here for testing, and should be removed.
    response.append({'hash_id': 'abcd', 'name': 'Clock', 'raw': 'clock_code'})
    for widget in generic_widgets:
      response.append({'hash_id': widget.hash_id, 'name': widget.name,
                       'raw': widget.raw})
    self.response.out.write(json.dumps({'widgets': response}))


class Widget(BaseHandler):
  """Handles individual widget uploads, edits and retrievals."""

  def get(self, widget_id):  # pylint: disable-msg=C6409
    """Returns the raw and cajoled (JS, HTML) code for a widget.

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
      self.response.out.write(json.dumps({'error': 'No widget'}))

  def post(self, widget_id=None):  # pylint: disable-msg=C6409
    """Saves or edits a widget uploaded by a content creator."""
    logging.info(widget_id)
    raw = self.request.get('raw')
    name = self.request.get('name')
    if not raw:
      raise self.InvalidInputException('No widget code supplied')
    if not name:
      raise self.InvalidInputException('No widget name supplied')

    # TODO(sll): Make sure this JS is clean!
    raw = json.loads(raw)

    logging.info(self.request.arguments())
    if not widget_id:
      # TODO(sll): Figure out what to pass into the hashing function.
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
