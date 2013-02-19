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

from controllers.base import BaseHandler
import feconf
from models.exploration import Exploration
import utils

from google.appengine.api import users


class MainPage(BaseHandler):
    """Oppia's main page."""

    def ensure_default_exploration_exists(self):
        """Add the default explorations, if they don't already exist."""
        try:
            exploration = utils.get_entity(Exploration, '0')
        except:
            with open('samples/hola.yaml') as f:
                yaml = f.read().decode('utf-8')
            exploration = utils.create_exploration_from_yaml(
                yaml=yaml, user=None, title='Demo: ¡Hola!',
                category='Languages', id='0')
            exploration.is_public = True
            exploration.put()

    def get(self):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        self.ensure_default_exploration_exists()
        self.values['js'] = utils.get_js_files_with_base(['index'])
        self.values['login_url'] = users.create_login_url('/gallery')
        self.values['user'] = users.get_current_user()
        self.response.out.write(
            feconf.JINJA_ENV.get_template('index.html').render(self.values))


class AboutPage(BaseHandler):
    """Page with information about Oppia."""
    def get(self):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        self.values['js'] = utils.get_js_files_with_base([])
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
        self.values['js'] = utils.get_js_files_with_base([])
        self.response.out.write(
            feconf.JINJA_ENV.get_template('terms.html').render(self.values))
