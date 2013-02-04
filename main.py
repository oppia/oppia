# coding: utf-8
#
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

import base, classifiers, editor, feconf, models, os, reader, utils, widgets
import json, webapp2

from google.appengine.api import users
from google.appengine.ext import ndb


class Error404Handler(base.BaseHandler):
  """Handles 404 errors."""

  def get(self):  # pylint: disable-msg=C6409
    self.error(404)


class AboutPage(base.BaseHandler):
  """Page with information about Oppia."""
  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    self.values['js'] = utils.GetJsFilesWithBase([])
    self.values['code_contributors'] = [
        'Jeremy Emerson',
        'Manas Tungare',
        'Sean Lip',
        'Stephanie Federwisch',
        'Wilson Hong',
        'Yana Malysheva',
    ]
    self.values['idea_contributors'] = [
        'Alex Kauffmann',
        'Catherine Colman',
        'Neil Fraser',
        'Pavel Simakov',
        'Peter Norvig',
        'Phil Wagner',
        'Philip Guo',
        'Reinaldo Aguiar',
    ]
    self.response.out.write(
        base.JINJA_ENV.get_template('about.html').render(self.values))


class TermsPage(base.BaseHandler):
  """Page with terms and conditions."""
  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    self.values['js'] = utils.GetJsFilesWithBase([])
    self.response.out.write(
        base.JINJA_ENV.get_template('terms.html').render(self.values))


class GalleryPage(base.BaseHandler):
  """The exploration gallery page."""

  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    user = users.get_current_user()

    self.values.update({
        'js': utils.GetJsFilesWithBase(['gallery']),
        'mode': 'gallery',
    })
    self.response.out.write(
        base.JINJA_ENV.get_template('gallery.html').render(self.values))


class GalleryHandler(base.BaseHandler):
  """Provides data for the exploration gallery."""

  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    user = users.get_current_user()
    augmented_user = utils.GetAugmentedUser(user) if user else None

    used_keys = []

    categories = {}
    for exploration in models.Exploration.query().filter(
        models.Exploration.is_public == True):
      category_name = exploration.category

      if augmented_user:
        can_edit = exploration.key in augmented_user.editable_explorations
      else:
        can_edit = False

      used_keys.append(exploration.key)

      if not categories.get(category_name):
        categories[category_name] = []
      categories[category_name].append({
          'data': exploration.to_dict(
              exclude=['states', 'init_state', 'owner']),
          'can_edit': can_edit,
          'is_owner': user == exploration.owner,
      })

    if augmented_user:
      for exploration_key in augmented_user.editable_explorations:
        exploration = exploration_key.get()
        category_name = exploration.category
        if not categories.get(category_name):
          categories[category_name] = []
        if exploration.key not in used_keys:
          categories[category_name].append({
              'data': exploration.to_dict(
                  exclude=['states', 'init_state', 'owner']),
              'can_edit': True,
              'is_owner': user == exploration.owner,
          })

    self.data_values.update({
        'categories': categories,
    })
    self.response.out.write(json.dumps(self.data_values))


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
      with open('samples/hola.yaml') as f:
        yaml = f.read().decode('utf-8')
      exploration = utils.CreateExplorationFromYaml(
          yaml=yaml, user=None, title='Demo: ¡Hola!', category='Languages',
          id='0')
      exploration.is_public = True
      exploration.put()

  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    self.InitializeInputViews()
    self.EnsureDefaultExplorationExists()
    self.values['js'] = utils.GetJsFilesWithBase(['index'])
    self.values['login_url'] = users.create_login_url('/gallery')
    self.values['user'] = users.get_current_user()
    self.response.out.write(
        base.JINJA_ENV.get_template('index.html').render(self.values))


# Regex for base64 hash_id encoding
r = '[A-Za-z0-9=_-]+'

# Register the URL with the responsible classes
urls = [
    (r'/?', MainPage),
    (r'/about/?', AboutPage),
    (r'/terms/?', TermsPage),
    (r'/gallery/?', GalleryPage),
    (r'/gallery/data/?', GalleryHandler),

    (r'/learn/(%s)/?' % r, reader.ExplorationPage),
    (r'/learn/(%s)/data/?' % r, reader.ExplorationHandler),
    # TODO(sll): there is a potential collision here if the state_id is 'data'.
    (r'/learn/(%s)/(%s)/?' % (r, r), reader.ExplorationHandler),
    (r'/learn_random/?', reader.RandomExplorationPage),

    (r'/create_new/?', editor.NewExploration),
    (r'/create/download/(%s)/?' % r, editor.ExplorationDownloadHandler),
    (r'/create/(%s)/?' % r, editor.ExplorationPage),
    (r'/create/(%s)/data/?' % r, editor.ExplorationHandler),
    # TODO(sll): there is a potential collision here if the state_id is 'data'.
    (r'/create/(%s)/(%s)/?' % (r, r), editor.StatePage),
    (r'/create/(%s)/(%s)/data/?' % (r, r), editor.StateHandler),

    (r'/templates/(%s)/?' % r, editor.TemplateHandler),

    (r'/imagehandler/?', editor.Image),
    (r'/imagehandler/(%s)/?' % r, editor.Image),

    (r'/widgets/?', widgets.Widget),
    (r'/widgets/(%s)/?' % r, widgets.Widget),

    (r'/widgetrepository/?', widgets.WidgetRepositoryPage),
    (r'/widgetrepository/data/?', widgets.WidgetRepositoryHandler),

    # 404 error handler.
    (r'/.*', Error404Handler),
]

app = webapp2.WSGIApplication(urls, debug=feconf.DEBUG)
