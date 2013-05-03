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

"""Controllers for simple pages."""

__author__ = 'sll@google.com (Sean Lip)'

from apps.exploration.models import Exploration
from controllers import admin
from controllers.base import BaseHandler
import feconf
import utils

from google.appengine.api import users


class MainPage(BaseHandler):
    """Main splash page for Oppia."""

    def get(self):
        """Handles GET requests."""
        if not Exploration.get('0', strict=False):
            admin.reload_demos()

        self.values.update({
            'gallery_login_url': users.create_login_url('/gallery'),
        })
        self.render_template('pages/index.html')


class AboutPage(BaseHandler):
    """Page with information about Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'code_contributors_list': feconf.CODE_CONTRIBUTORS,
            'idea_contributors_str': utils.get_comma_sep_string_from_list(
                feconf.IDEA_CONTRIBUTORS),
        })
        self.render_template('pages/about.html')


class TermsPage(BaseHandler):
    """Page with terms and conditions."""

    def get(self):
        """Handles GET requests."""
        self.render_template('pages/terms.html')
