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

import feconf, models, utils

jinja_env = jinja2.Environment(loader=jinja2.FileSystemLoader(
    os.path.join(os.path.dirname(__file__), feconf.TEMPLATE_DIR + 'widgets/')))


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
    self.response.out.write(jinja_env.get_template('widgets.html').render({
        'css': utils.GetCssFile('main'),
        'js': utils.GetJsFile('widgetRepository'),
    }))


class WidgetRepositoryHandler(BaseHandler):
  """Provides data to populate the widget repository page."""

  def get(self):  # pylint: disable-msg=C6409
    generic_widgets = datamodels.GenericWidget.query()
    response = []
    # TODO(sll): The following line is here for testing, and should be removed.
    response.append({'hash_id': 1, 'name': 'clock', 'html': 'html', 'js': ''})
    for widget in generic_widgets:
      response.append({'hash_id': widget.hash_id, 'name': widget.name,
                       'html': widget.html, 'js': widget.js})
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
    widget = utils.GetEntity(datamodels.Widget, long(widget_id))
    if widget:
      self.response.out.write(json.dumps({
          'js': widget.js,
          'html': widget.html,
          'raw': widget.raw,
      }))
    else:
      self.response.out.write(json.dumps({'error': 'No widget'}))

  def post(self, widget_id=None):  # pylint: disable-msg=C6409
    """Saves or edits a widget uploaded by a content creator."""
    logging.info(widget_id)
    # TODO(sll): Make sure this JS is clean!
    if self.request.get('js'):
      js = json.loads(self.request.get('js'))
    if self.request.get('html'):
      html = json.loads(self.request.get('html'))
    if self.request.get('raw'):
      raw = json.loads(self.request.get('raw'))
    logging.info(self.request.arguments())
    if not widget_id:
      # TODO(sll): Figure out what to pass into the hashing function.
      widget_hash_id = utils.GetNewId(datamodels.Widget, 'temp_hash_id')
      widget = datamodels.Widget(
          hash_id=long(widget_hash_id), js=js, html=html, raw=raw)
      widget.put()
    else:
      widget = utils.GetEntity(datamodels.Widget, widget_id)
      if not widget:
        self.JsonError('No widget found with id %s' % widget_id)
        return
      if 'js' in self.request.arguments():
        widget.js = js
      if 'html' in self.request.arguments():
        widget.html = html
      if 'raw' in self.request.arguments():
        widget.raw = raw
      widget.put()
    response = {'widgetId': widget.hash_id, 'js': widget.js,
                'html': widget.html, 'raw': widget.raw}
    self.response.out.write(json.dumps(response))
