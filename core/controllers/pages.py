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

import feconf
from core.controllers import base
from core.domain import exp_services
from core.platform import models
user_services = models.Registry.import_user_services()
import utils


class MainPage(base.BaseHandler):
    """Main splash page for Oppia."""

    def get(self):
        """Handles GET requests."""
        if not exp_services.get_exploration_by_id('0', strict=False):
            exp_services.delete_demo('0')
            exp_services.load_demo('0')

        self.values.update({
            'gallery_login_url': user_services.create_login_url('/gallery'),
        })
        self.render_template('pages/index.html')


class AboutPage(base.BaseHandler):
    """Page with information about Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'code_contributors_list': feconf.CODE_CONTRIBUTORS,
            'idea_contributors_str': utils.get_comma_sep_string_from_list(
                feconf.IDEA_CONTRIBUTORS),
        })
        self.render_template('pages/about.html')


class TermsPage(base.BaseHandler):
    """Page with terms and conditions."""

    def get(self):
        """Handles GET requests."""
        self.render_template('pages/terms.html')


class FeedbackPage(base.BaseHandler):
    """Page with feedback."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': 'feedback',
        })
        self.render_template('pages/feedback.html')
