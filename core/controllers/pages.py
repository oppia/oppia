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

"""Controllers for simple, mostly-static pages (like About, Forum, etc.)."""

import urllib
import urlparse

from core.controllers import base
from core.domain import config_domain
import feconf


MODERATOR_REQUEST_FORUM_URL_DEFAULT_VALUE = (
    'https://moderator/request/forum/url')

ABOUT_PAGE_YOUTUBE_VIDEO_ID = config_domain.ConfigProperty(
    'about_page_youtube_video_id', {'type': 'unicode'},
    'The (optional) video id for the About page',
    default_value='')
CONTACT_EMAIL_ADDRESS = config_domain.ConfigProperty(
    'contact_email_address', {'type': 'unicode'},
    'The contact email address to display on the About pages',
    default_value='CONTACT_EMAIL_ADDRESS')
EMBEDDED_GOOGLE_GROUP_URL = config_domain.ConfigProperty(
    'embedded_google_group_url', {'type': 'unicode'},
    'The URL for the embedded Google Group in the Forum page',
    default_value=(
        'https://groups.google.com/forum/embed/?place=forum/oppia'))
SITE_FORUM_URL = config_domain.ConfigProperty(
    'site_forum_url', {'type': 'unicode'},
    'The site forum URL (for links; the Forum page is configured separately)',
    default_value='https://site/forum/url')
MODERATOR_REQUEST_FORUM_URL = config_domain.ConfigProperty(
    'moderator_request_forum_url', {'type': 'unicode'},
    'A link to the forum for nominating explorations to be featured '
    'in the Oppia library',
    default_value=MODERATOR_REQUEST_FORUM_URL_DEFAULT_VALUE)


class SplashPage(base.BaseHandler):
    """Landing page for Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.SPLASH_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_SPLASH,
        })
        self.render_template('pages/splash.html')


class AboutPage(base.BaseHandler):
    """Page with information about Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'ABOUT_PAGE_YOUTUBE_VIDEO_ID': ABOUT_PAGE_YOUTUBE_VIDEO_ID.value,
            'CONTACT_EMAIL_ADDRESS': CONTACT_EMAIL_ADDRESS.value,
            'meta_description': feconf.ABOUT_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_ABOUT,
        })
        self.render_template('pages/about.html')


class TeachPage(base.BaseHandler):
    """Page with information about how to teach on Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'SITE_FORUM_URL': SITE_FORUM_URL.value,
            'MODERATOR_REQUEST_FORUM_URL': MODERATOR_REQUEST_FORUM_URL.value,
            'nav_mode': feconf.NAV_MODE_TEACH,
        })
        self.render_template('pages/teach.html')


class ContactPage(base.BaseHandler):
    """Page with information about how to contact Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'CONTACT_EMAIL_ADDRESS': CONTACT_EMAIL_ADDRESS.value,
            'SITE_FORUM_URL': SITE_FORUM_URL.value,
            'nav_mode': feconf.NAV_MODE_CONTACT,
        })
        self.render_template('pages/contact.html')


class ParticipatePage(base.BaseHandler):
    """Page with information about participating in Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.PARTICIPATE_PAGE_DESCRIPTION,
            'MODERATOR_REQUEST_FORUM_URL': MODERATOR_REQUEST_FORUM_URL.value,
            'SITE_FORUM_URL': SITE_FORUM_URL.value,
            'nav_mode': feconf.NAV_MODE_PARTICIPATE,
        })
        self.render_template('pages/participate.html')


class ForumPage(base.BaseHandler):
    """Page with an embedded forum."""

    def get(self):
        """Handles GET requests."""
        if not feconf.SHOW_CUSTOM_PAGES:
            raise self.PageNotFoundException

        # Note: if you are working in the development environment and
        # are accessing this page at localhost, please replace
        # 'localhost' with '127.0.0.1'.
        _, netloc, _, _, _ = urlparse.urlsplit(self.request.uri)

        self.values.update({
            'EMBEDDED_GOOGLE_GROUP_URL': (
                '%s&showtabs=false&hideforumtitle=true&parenturl=%s' % (
                    EMBEDDED_GOOGLE_GROUP_URL.value,
                    urllib.quote(self.request.uri, safe=''),
                )
            ),
            'meta_description': feconf.FORUM_PAGE_DESCRIPTION,
            'on_localhost': netloc.startswith('localhost'),
        })
        self.render_template('pages/forum.html')


class TermsPage(base.BaseHandler):
    """Page with terms and conditions."""

    def get(self):
        """Handles GET requests."""
        if not feconf.SHOW_CUSTOM_PAGES:
            raise self.PageNotFoundException

        self.values.update({
            'meta_description': feconf.TERMS_PAGE_DESCRIPTION,
        })

        self.render_template('pages/terms.html')


class PrivacyPage(base.BaseHandler):
    """Page with privacy policy."""

    def get(self):
        """Handles GET requests."""
        if not feconf.SHOW_CUSTOM_PAGES:
            raise self.PageNotFoundException

        self.render_template('pages/privacy.html')


class AboutRedirectPage(base.BaseHandler):
    """An page that redirects to the main About page."""

    def get(self):
        """Handles GET requests."""
        self.redirect('/about')
