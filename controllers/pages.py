# coding: utf-8
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

"""Controllers for simple pages (gallery, about page, terms page)."""

__author__ = 'sll@google.com (Sean Lip)'

import classifiers
from controllers.base import BaseHandler
import feconf
from models.models import Exploration, InputView
import utils

from google.appengine.api import users


class MainPage(BaseHandler):
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
            if not InputView.gql('WHERE name = :name', name=name).get():
                input_view = InputView(
                    name=name, classifier=classifier_list[i],
                    html=utils.GetFileContents('/input_views/%s.html' % name))
                input_view.put()

    def EnsureDefaultExplorationExists(self):
        """Add the default explorations, if they don't already exist."""
        try:
            exploration = utils.GetEntity(Exploration, '0')
        except:
            with open('samples/hola.yaml') as f:
                yaml = f.read().decode('utf-8')
            exploration = utils.CreateExplorationFromYaml(
                yaml=yaml, user=None, title='Demo: ¡Hola!',
                category='Languages', id='0')
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
            feconf.JINJA_ENV.get_template('index.html').render(self.values))


class AboutPage(BaseHandler):
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
            feconf.JINJA_ENV.get_template('about.html').render(self.values))


class TermsPage(BaseHandler):
    """Page with terms and conditions."""
    def get(self):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        self.values['js'] = utils.GetJsFilesWithBase([])
        self.response.out.write(
            feconf.JINJA_ENV.get_template('terms.html').render(self.values))
