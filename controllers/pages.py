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

"""Controllers for simple pages (gallery, about page, terms page)."""

__author__ = 'sll@google.com (Sean Lip)'

from controllers.base import BaseHandler
import feconf
from models.exploration import Exploration
import os
import utils
from yaml_utils import YamlTransformer

from google.appengine.api import users


class MainPage(BaseHandler):
    """Oppia's main page."""

    def _ensure_default_exploration_exists(self, hash_id, filename, title, category):
        """Create a default exploration from a file."""

        try:
            exploration = utils.get_entity(Exploration, hash_id)
        except:
            with open(os.path.join(
                    feconf.SAMPLE_EXPLORATIONS_DIR, filename)) as f:
                yaml = f.read().decode('utf-8')
            exploration = YamlTransformer.create_exploration_from_yaml(
                yaml=yaml, user=None, title=title,
                category=category, id=hash_id)
            exploration.is_public = True
            exploration.put()

    def _ensure_default_explorations_exist(self):
        """Add the default explorations, if they don't already exist."""

        self._ensure_default_exploration_exists(
            '0', 'hola.yaml', '¡Hola!', 'Languages')
        self._ensure_default_exploration_exists(
            '1', 'pitch.yaml', 'Pitch Perfect', 'Music')

    def get(self):  # pylint: disable-msg=C6409
        """Handles GET requests."""

        self._ensure_default_explorations_exist()
        self.values['login_url'] = users.create_login_url('/gallery')
        self.values['user'] = users.get_current_user()
        self.response.out.write(
            feconf.JINJA_ENV.get_template('index.html').render(self.values))


class AboutPage(BaseHandler):
    """Page with information about Oppia."""

    def get(self):  # pylint: disable-msg=C6409
        """Handles GET requests."""

        self.values['code_contributors_list'] = feconf.CODE_CONTRIBUTORS
        self.values['idea_contributors_str'] = (
            '%s and %s' % (', '.join(feconf.IDEA_CONTRIBUTORS[:-1]),
                           feconf.IDEA_CONTRIBUTORS[-1])
        )

        self.response.out.write(
            feconf.JINJA_ENV.get_template('about.html').render(self.values))


class TermsPage(BaseHandler):
    """Page with terms and conditions."""

    def get(self):  # pylint: disable-msg=C6409
        """Handles GET requests."""

        self.response.out.write(
            feconf.JINJA_ENV.get_template('terms.html').render(self.values))
