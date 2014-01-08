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

from core.controllers import base
from core.domain import config_domain
from core.domain import exp_services
import feconf


ADMIN_EMAIL_ADDRESS = config_domain.ConfigProperty(
    'admin_email_address', 'UnicodeString',
    'The admin email address to display on the About pages',
    default_value='ADMIN_EMAIL_ADDRESS')
SITE_FORUM_URL = config_domain.ConfigProperty(
    'site_forum_url', 'UnicodeString', 'The site forum URL',
    default_value='https://site/forum/url')
SITE_NAME = config_domain.ConfigProperty(
    'site_name', 'UnicodeString', 'The site name', default_value='SITE_NAME')
BANNER_ALT_TEXT = config_domain.ConfigProperty(
    'banner_alt_text', 'UnicodeString',
    'The alt text for the site banner image', default_value='')
SPLASH_PAGE_EXPLORATION_ID = config_domain.ConfigProperty(
    'splash_page_exploration_id', 'UnicodeString',
    ('The id for the exploration on the splash page '
     '(a blank value indicates that no exploration should be displayed)'),
    default_value='')


class SplashPage(base.BaseHandler):
    """Splash page for Oppia."""

    def get(self):
        if SPLASH_PAGE_EXPLORATION_ID.value:
            splash_exp_id = SPLASH_PAGE_EXPLORATION_ID.value
            if not exp_services.get_exploration_by_id(
                    splash_exp_id, strict=False):
                exp_services.delete_demo(splash_exp_id)
                exp_services.load_demo(splash_exp_id)

        self.values.update({
            'BANNER_ALT_TEXT': BANNER_ALT_TEXT.value,
            'SITE_FORUM_URL': SITE_FORUM_URL.value,
            'SITE_NAME': SITE_NAME.value,
            'SPLASH_PAGE_EXPLORATION_ID': SPLASH_PAGE_EXPLORATION_ID.value,
        })
        self.render_template('pages/splash.html')


class AboutPage(base.BaseHandler):
    """Page with information about Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'ADMIN_EMAIL_ADDRESS': ADMIN_EMAIL_ADDRESS.value,
            'nav_mode': feconf.NAV_MODE_ABOUT,
            'SITE_FORUM_URL': SITE_FORUM_URL.value,
            'SITE_NAME': SITE_NAME.value,
        })
        self.render_template('pages/about.html')


class ContactPage(base.BaseHandler):
    """Page with feedback."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'ADMIN_EMAIL_ADDRESS': ADMIN_EMAIL_ADDRESS.value,
            'nav_mode': feconf.NAV_MODE_CONTACT,
            'SITE_FORUM_URL': SITE_FORUM_URL.value,
        })
        self.render_template('pages/contact.html')
