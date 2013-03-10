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
import utils
from yaml_utils import YamlTransformer


class MainPage(BaseHandler):
    """Main splash page for Oppia."""

    def _ensure_default_explorations_exist(self):
        """Checks whether a demo exploration exists; if not, creates them."""

        if not feconf.DEMO_EXPLORATIONS:
            raise self.InternalErrorException('No demo explorations defined.')

        # TODO(sll): Try and get the following code to run on warmup instead,
        # so that we don't have to do the datastore check each time.
        # Alternatively, implement caching so that the check is done cheaply.
        if not Exploration.get('0'):
            YamlTransformer.create_default_explorations()

    def get(self):
        """Handles GET requests."""

        self._ensure_default_explorations_exist()
        self.response.out.write(
            feconf.JINJA_ENV.get_template('index.html').render(self.values))


class AboutPage(BaseHandler):
    """Page with information about Oppia."""

    def get(self):
        """Handles GET requests."""

        self.values.update({
            'code_contributors_list': feconf.CODE_CONTRIBUTORS,
            'idea_contributors_str': utils.get_comma_sep_string_from_list(
                feconf.IDEA_CONTRIBUTORS),
        })

        self.response.out.write(
            feconf.JINJA_ENV.get_template('about.html').render(self.values))


class TermsPage(BaseHandler):
    """Page with terms and conditions."""

    def get(self):
        """Handles GET requests."""

        self.response.out.write(
            feconf.JINJA_ENV.get_template('terms.html').render(self.values))
