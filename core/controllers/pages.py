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

__author__ = 'sll@google.com (Sean Lip)'


import urllib
import urlparse

from core.controllers import base
from core.controllers import editor
from core.domain import config_domain
import feconf


ABOUT_PAGE_YOUTUBE_VIDEO_ID = config_domain.ConfigProperty(
    'about_page_youtube_video_id', {'type': 'unicode'},
    'The (optional) video id for the About page',
    default_value='')
ADMIN_EMAIL_ADDRESS = config_domain.ConfigProperty(
    'admin_email_address', {'type': 'unicode'},
    'The admin email address to display on the About pages',
    default_value='ADMIN_EMAIL_ADDRESS')
SITE_FORUM_URL = config_domain.ConfigProperty(
    'site_forum_url', {'type': 'unicode'},
    'The site forum URL (for links; the Forum page is configured separately)',
    default_value='https://site/forum/url')
SITE_NAME = config_domain.ConfigProperty(
    'site_name', {'type': 'unicode'}, 'The site name',
    default_value='SITE_NAME')

# The id of the exploration for the About page.
_ABOUT_EXPLORATION_ID = '14'


class AboutPage(base.BaseHandler):
    """Page with information about Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'ABOUT_EXPLORATION_ID': _ABOUT_EXPLORATION_ID,
            'ABOUT_PAGE_YOUTUBE_VIDEO_ID': ABOUT_PAGE_YOUTUBE_VIDEO_ID.value,
            'ADMIN_EMAIL_ADDRESS': ADMIN_EMAIL_ADDRESS.value,
            'MODERATOR_REQUEST_FORUM_URL': (
                editor.MODERATOR_REQUEST_FORUM_URL.value),
            'SITE_FORUM_URL': SITE_FORUM_URL.value,
            'SITE_NAME': SITE_NAME.value,
            'nav_mode': feconf.NAV_MODE_ABOUT,
        })
        self.render_template('pages/about.html')


class ParticipatePage(base.BaseHandler):
    """Page with information about participating in Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'ADMIN_EMAIL_ADDRESS': ADMIN_EMAIL_ADDRESS.value,
            'MODERATOR_REQUEST_FORUM_URL': (
                editor.MODERATOR_REQUEST_FORUM_URL.value),
            'SITE_FORUM_URL': SITE_FORUM_URL.value,
            'SITE_NAME': SITE_NAME.value,
            'nav_mode': feconf.NAV_MODE_PARTICIPATE,
        })
        self.render_template('pages/participate.html')


class ForumPage(base.BaseHandler):
    """Page with an embedded forum."""

    def get(self):
        """Handles GET requests."""
        if not feconf.SHOW_FORUM_PAGE:
            raise self.PageNotFoundException

        # Note: if you are working in the development environment and
        # are accessing this page at localhost, please replace
        # 'localhost' with '127.0.0.1'.
        _, netloc, _, _, _ = urlparse.urlsplit(self.request.uri)

        self.values.update({
            'OPPIA_FORUM_URL': (
                'https://groups.google.com/forum/embed/?hideforumtitle=true'
                '&parenturl=%s#!categories/oppia/' %
                urllib.quote(self.request.uri, safe='')
            ),
            'on_localhost': netloc.startswith('localhost'),
        })
        self.render_template('pages/forum.html')
