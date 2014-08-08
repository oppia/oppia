# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the splash page and user dashboard."""

__author__ = 'sll@google.com (Sean Lip)'

from core.controllers import base
from core.controllers import pages
from core.domain import config_domain
from core.domain import exp_services
from core.domain import user_services


BANNER_ALT_TEXT = config_domain.ConfigProperty(
    'banner_alt_text', 'UnicodeString',
    'The alt text for the site banner image', default_value='')
SPLASH_PAGE_EXPLORATION_ID = config_domain.ConfigProperty(
    'splash_page_exploration_id', 'UnicodeString',
    ('The id for the exploration on the splash page '
     '(a blank value indicates that no exploration should be displayed)'),
    default_value='')
SPLASH_PAGE_EXPLORATION_VERSION = config_domain.ConfigProperty(
    'splash_page_exploration_version', 'UnicodeString',
    ('The version number for the exploration on the splash page '
     '(a blank value indicates that the latest version should be used)'),
    default_value='')


class HomePage(base.BaseHandler):
    """Visited when user visits /.

    If the user is logged in and is registered as an editor, we show their
    personal dashboard, otherwise we show the generic splash page.
    """
    # We use 'contribute' because the createExploration() modal makes a call
    # there.
    PAGE_NAME_FOR_CSRF = 'contribute'

    def _get_splash_page(self):
        if SPLASH_PAGE_EXPLORATION_ID.value:
            splash_exp_id = SPLASH_PAGE_EXPLORATION_ID.value
            if not exp_services.get_exploration_by_id(
                    splash_exp_id, strict=False):
                exp_services.delete_demo(splash_exp_id)
                exp_services.load_demo(splash_exp_id)

        self.values.update({
            'BANNER_ALT_TEXT': BANNER_ALT_TEXT.value,
            'SITE_FORUM_URL': pages.SITE_FORUM_URL.value,
            'SITE_NAME': pages.SITE_NAME.value,
            'SPLASH_PAGE_EXPLORATION_ID': SPLASH_PAGE_EXPLORATION_ID.value,
            'SPLASH_PAGE_EXPLORATION_VERSION': (
                SPLASH_PAGE_EXPLORATION_VERSION.value),
        })
        self.render_template('pages/splash.html')

    def get(self):
        if (self.user_id and
                self.username not in config_domain.BANNED_USERNAMES.value and
                user_services.has_user_registered_as_editor(self.user_id)):
            self.render_template('dashboard/dashboard.html')
        else:
            self._get_splash_page()


class DashboardHandler(base.BaseHandler):
    """Provides data for the user dashboard."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'explorations': exp_services.get_at_least_editable_summary_dict(
                self.user_id),
        })
        self.render_json(self.values)
