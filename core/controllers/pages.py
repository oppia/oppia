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

import random
import urllib
import urlparse

from core.controllers import base
import feconf


class SplashPage(base.BaseHandler):
    """Landing page for Oppia."""

    def get(self):
        """Handles GET requests."""
        c_value = self.request.get('c')
        if not c_value:
            c_value = 's%d' % random.randrange(4)
            self.redirect('/splash?c=%s' % c_value)

        self.values.update({
            'meta_description': feconf.SPLASH_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_SPLASH,
        })
        self.render_template('pages/splash_%s.html' % c_value)


class AboutPage(base.BaseHandler):
    """Page with information about Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.ABOUT_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_ABOUT,
        })
        self.render_template('pages/about.html')


class TeachPage(base.BaseHandler):
    """Page with information about how to teach on Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.TEACH_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_TEACH,
        })
        self.render_template('pages/teach.html')


class ConsoleErrorPage(base.BaseHandler):
    """Page with missing resources to test cache slugs."""

    def get(self):
        """Handles GET requests."""
        self.render_template('pages/console_errors.html')


class ContactPage(base.BaseHandler):
    """Page with information about how to contact Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.CONTACT_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_CONTACT,
        })
        self.render_template('pages/contact.html')


class DonatePage(base.BaseHandler):
    """Page with information about how to donate to Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.DONATE_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_DONATE,
        })
        self.render_template('pages/donate.html')


class ThanksPage(base.BaseHandler):
    """Page that thanks people who donate to Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.THANKS_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_THANKS,
        })
        self.render_template('pages/thanks.html')


class ForumPage(base.BaseHandler):
    """Page with an embedded forum."""

    def get(self):
        """Handles GET requests."""
        # Note: if you are working in the development environment and
        # are accessing this page at localhost, please replace
        # 'localhost' with '127.0.0.1'.
        _, netloc, _, _, _ = urlparse.urlsplit(self.request.uri)

        self.values.update({
            'full_google_group_url': (
                '%s&showtabs=false&hideforumtitle=true&parenturl=%s' % (
                    feconf.EMBEDDED_GOOGLE_GROUP_URL,
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
        self.values.update({
            'meta_description': feconf.TERMS_PAGE_DESCRIPTION,
        })

        self.render_template('pages/terms.html')


class PrivacyPage(base.BaseHandler):
    """Page with privacy policy."""

    def get(self):
        """Handles GET requests."""
        self.render_template('pages/privacy.html')


class AboutRedirectPage(base.BaseHandler):
    """A page that redirects to the main About page."""

    def get(self):
        """Handles GET requests."""
        self.redirect('/about')


class TeachRedirectPage(base.BaseHandler):
    """A page that redirects to the main Teach page."""

    def get(self):
        """Handles GET requests."""
        self.redirect('/teach')
