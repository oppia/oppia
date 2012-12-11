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

"""Main package for URL routing and the index page."""

__author__ = 'Sean Lip'

import base, classifiers, converter, editor, feconf, models, os, reader, utils, widgets
import webapp2


class Error404Handler(base.BaseHandler):
  """Handles 404 errors."""

  def get(self):  # pylint: disable-msg=C6409
    self.error(404)


class MainPage(base.BaseHandler):
  """Oppia's main page."""
  def InitializeInputViews(self):
    """Loads pre-written input views into the Oppia datastore."""
    # TODO(sll): This is temporary code that automatically loads input views
    # into the datastore on startup. Remove it once the bulk upload described
    # below is implemented.
    input_view_list = [utils.input_views.none,
                       utils.input_views.multiple_choice,
                       utils.input_views.int,
                       utils.input_views.set,
                       utils.input_views.text]
    classifier_list = [classifiers.classifiers.none,
                       classifiers.classifiers.finite,
                       classifiers.classifiers.numeric,
                       classifiers.classifiers.set,
                       classifiers.classifiers.text]
    for i in range(len(input_view_list)):
      name = input_view_list[i]
      if not models.InputView.gql('WHERE name = :name', name=name).get():
        input_view = models.InputView(
            name=name, classifier=classifier_list[i],
            html=utils.GetFileContents('/input_views/%s.html' % name))
        input_view.put()

  def EnsureDefaultExplorationExists(self):
    """Add the default explorations, if they don't already exist."""
    try:
      exploration = utils.GetEntity(models.Exploration, '0')
    except:
      # TODO(sll): Populate the data for this sample exploration.
      utils.CreateNewExploration(None, title='Demo 1', id='0')

    try:
      exploration = utils.GetEntity(models.Exploration, '1')
    except:
      # TODO(sll): Populate the data for this sample exploration.
      utils.CreateNewExploration(None, title='Demo 2', id='1')

  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    self.InitializeInputViews()
    self.EnsureDefaultExplorationExists()
    self.values['js'] = utils.GetJsFile('index')
    self.response.out.write(
        base.JINJA_ENV.get_template('index.html').render(self.values))


# Regex for base64 hash_id encoding
r = '[A-Za-z0-9=_-]+'

# Register the URL with the responsible classes
urls = [
    (r'/?', MainPage),

    (r'/learn/?', reader.MainPage),
    (r'/learn/(%s)/?' % r, reader.ExplorationPage),
    (r'/learn/(%s)/data/?' % r, reader.ExplorationHandler),
    # TODO(sll): there is a potential collision here if the state_id is 'data'.
    (r'/learn/(%s)/(%s)/?' % (r, r), reader.ExplorationHandler),

    (r'/create/?', editor.MainPage),
    (r'/create_new/?', editor.NewExploration),
    (r'/create/convert/(%s)/?' % r, converter.ImportPage),
    (r'/create/(%s)/?' % r, editor.ExplorationPage),
    (r'/create/(%s)/data/?' % r, editor.ExplorationHandler),
    # TODO(sll): there is a potential collision here if the state_id is 'data'.
    (r'/create/(%s)/(%s)/?' % (r, r), editor.StatePage),
    (r'/create/(%s)/(%s)/data/?' % (r, r), editor.StateHandler),

    (r'/imagehandler/?', editor.Image),
    (r'/imagehandler/(%s)/?' % r, editor.Image),

    (r'/widgets/?', widgets.Widget),
    (r'/widgets/repository/?', widgets.WidgetRepositoryPage),
    (r'/widgets/(%s)/?' % r, widgets.Widget),
    (r'/widgets/repository/data/?', widgets.WidgetRepositoryHandler),

    # 404 error handler.
    (r'/.*', Error404Handler),
]

app = webapp2.WSGIApplication(urls, debug=feconf.DEBUG)
