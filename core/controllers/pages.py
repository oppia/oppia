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


# TODO(bhenning): Convert this over to using action-based ACLs.
def require_maintenance_mode(handler):
    """Decorator that checks whether maintenance mode is enabled in feconf."""
    def test_maintenance_mode(self, **kwargs):
        if not feconf.ENABLE_MAINTENANCE_MODE:
            raise self.UnauthorizedUserException(
                'You cannot access this page unless the site is in '
                'maintenance mode')
        return handler(self, **kwargs)
    return test_maintenance_mode


class SplashPage(base.BaseHandler):
    """Landing page for Oppia."""

    def get(self):
        """Handles GET requests."""
        c_value = self.request.get('c')
        self.values.update({
            'meta_description': feconf.SPLASH_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_SPLASH,
        })

        if not c_value:
            random_number = random.randrange(0, 5)
            if random_number == 0:
                self.render_template('pages/splash/splash.html')
            else:
                self.redirect('/splash?c=nv%d' % random_number)
        else:
            try:
                self.render_template('pages/splash/splash_%s.html' % c_value)
            except Exception:
                # Old c values may have been deprecated, in which case we
                # revert to the default splash page URL. When redirecting,
                # we pass any arguments along (except the c_value).
                arguments = self.request.arguments()
                query_suffix = '&'.join([
                    '%s=%s' % (arg_name, self.request.get(arg_name))
                    for arg_name in arguments if arg_name != 'c'])

                target_url = feconf.SPLASH_URL
                if query_suffix:
                    target_url += '?%s' % query_suffix
                self.redirect(target_url)
                return


class AboutPage(base.BaseHandler):
    """Page with information about Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.ABOUT_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_ABOUT,
        })
        self.render_template('pages/about/about.html')


class GetStartedPage(base.BaseHandler):
    """Page with information about how to get started using Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.GET_STARTED_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_GET_STARTED,
        })
        self.render_template('pages/get_started/get_started.html')


class TeachPage(base.BaseHandler):
    """Page with information about how to teach on Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.TEACH_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_TEACH,
        })
        self.render_template('pages/teach/teach.html')


class BlogPage(base.BaseHandler):
    """Page embedding the Oppia blog."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.BLOG_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_BLOG,
        })
        self.render_template('pages/blog/blog.html')


class ContactPage(base.BaseHandler):
    """Page with information about how to contact Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.CONTACT_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_CONTACT,
        })
        self.render_template('pages/contact/contact.html')


class DonatePage(base.BaseHandler):
    """Page with information about how to donate to Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.DONATE_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_DONATE,
        })
        self.render_template('pages/donate/donate.html')


class ThanksPage(base.BaseHandler):
    """Page that thanks people who donate to Oppia."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.THANKS_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_THANKS,
        })
        self.render_template('pages/thanks/thanks.html')


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
        self.render_template('pages/forum/forum.html')


class TermsPage(base.BaseHandler):
    """Page with terms and conditions."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'meta_description': feconf.TERMS_PAGE_DESCRIPTION,
        })

        self.render_template('pages/terms/terms.html')


class PrivacyPage(base.BaseHandler):
    """Page with privacy policy."""

    def get(self):
        """Handles GET requests."""
        self.render_template('pages/privacy/privacy.html')


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


class ConsoleErrorPage(base.BaseHandler):
    """Page with missing resources to test cache slugs."""

    def get(self):
        """Handles GET requests."""
        self.render_template('pages/tests/console_errors.html')


class MaintenancePage(base.BaseHandler):
    """Page describing that Oppia is down for maintenance mode."""

    def get(self, *args, **kwargs):
        """Handles GET requests."""
        self.render_template('pages/maintenance/maintenance.html')
