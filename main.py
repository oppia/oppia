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

"""Main package for URL routing."""

__author__ = 'Sean Lip'

import jinja2
import webapp2

import base
import editor
import feconf
import models
import os
import reader
import utils
import widgets


jinja_env = jinja2.Environment(loader=jinja2.FileSystemLoader(
    os.path.join(os.path.dirname(__file__), feconf.TEMPLATE_DIR)))


class Error404Handler(base.BaseHandler):
  """Handles 404 errors."""

  def get(self):  # pylint: disable-msg=C6409
    self.error(404)


class MainPage(base.BaseHandler):
  """Oppia's main page."""
  def EnsureDefaultExplorationExists(self):
    """Add the default exploration, if it doesn't already exist."""
    try:
      exploration = utils.GetEntity(models.Exploration, '0')
    except:
      # TODO(sll): Populate the data for this sample exploration.
      utils.CreateNewExploration('One day this will be a demo', id='0')

  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    self.EnsureDefaultExplorationExists()
    self.values['js'] = utils.GetJsFile('indexNew')
    self.response.out.write(
        jinja_env.get_template('index_new.html').render(self.values))


# Regex for base64 hash_id encoding
r = '[A-Za-z0-9=_-]+'

# Register the URL with the responsible classes
urls = [
    # Handlers for the new version of Oppia
    (r'/?', MainPage),
    (r'/learn/?', reader.MainPage),
    (r'/learn/(%s)/?' % r, reader.ExplorationPage),
    (r'/learn/(%s)/data/?' % r, reader.ExplorationHandler),
    # TODO(sll): there is a potential collision here if the state_id is 'data'.
    (r'/learn/(%s)/(%s)/?' % (r, r), reader.ExplorationHandler),
    (r'/create/?', editor.MainPage),
    (r'/create_new/?', editor.NewExploration),
    (r'/create/(%s)/?' % r, editor.ExplorationPage),
    (r'/create/(%s)/data/?' % r, editor.ExplorationHandler),
    # TODO(sll): there is a potential collision here if the state_id is 'data'.
    (r'/create/(%s)/(%s)/?' % (r, r), editor.StatePage),
    (r'/create/(%s)/(%s)/data/?' % (r, r), editor.StateHandler),
    # Widget repository handlers
    (r'/widgets/?', widgets.Widget),
    (r'/widgets/repository/?', widgets.WidgetRepositoryPage),
    (r'/widgets/(%s)/?' % r, widgets.Widget),
    (r'/widgets/repository/data/?', widgets.WidgetRepositoryHandler),
    # 404 error handler.
    (r'/.*', Error404Handler),
]

app = webapp2.WSGIApplication(urls, debug=feconf.DEBUG)
