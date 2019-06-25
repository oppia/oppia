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

"""Controllers for simple, mostly-static pages (like About, Splash, etc.)."""

from core.controllers import acl_decorators
from core.controllers import base
import feconf


class SplashPage(base.BaseHandler):
    """Landing page for Oppia."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        c_value = self.request.get('c')
        if not c_value:
            self.render_template('dist/splash-page.mainpage.html')
        else:
            try:
                self.render_template('dist/splash_%s.html' % c_value)
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

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.render_template('dist/about-page.mainpage.html')


class GetStartedPage(base.BaseHandler):
    """Page with information about how to get started using Oppia."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.render_template('dist/get-started-page.mainpage.html')


class TeachPage(base.BaseHandler):
    """Page with information about how to teach on Oppia."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.render_template('dist/teach-page.mainpage.html')


class ContactPage(base.BaseHandler):
    """Page with information about how to contact Oppia."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.render_template('dist/contact-page.mainpage.html')


class DonatePage(base.BaseHandler):
    """Page with information about how to donate to Oppia."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.render_template('dist/donate-page.mainpage.html')


class ThanksPage(base.BaseHandler):
    """Page that thanks people who donate to Oppia."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.render_template('dist/thanks-page.mainpage.html')


class ForumRedirectPage(base.BaseHandler):
    """A handler to redirect to Oppia's Google group."""
    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect(feconf.GOOGLE_GROUP_URL)


class TermsPage(base.BaseHandler):
    """Page with terms and conditions."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.render_template('dist/terms-page.mainpage.html')


class PrivacyPage(base.BaseHandler):
    """Page with privacy policy."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.render_template('dist/privacy-page.mainpage.html')


class AboutRedirectPage(base.BaseHandler):
    """A page that redirects to the main About page."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect('/about')


class FoundationRedirectPage(base.BaseHandler):
    """A page that redirects to the separate Oppia Foundation site."""
    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect(feconf.FOUNDATION_SITE_URL)
        return


class TeachRedirectPage(base.BaseHandler):
    """A page that redirects to the main Teach page."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect('/teach')


class ConsoleErrorPage(base.BaseHandler):
    """Page with missing resources to test cache slugs."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.render_template('dist/console_errors.html')


class MaintenancePage(base.BaseHandler):
    """Page describing that Oppia is down for maintenance mode."""

    @acl_decorators.open_access
    def get(self, *args, **kwargs):
        """Handles GET requests."""
        self.render_template('dist/maintenance-page.mainpage.html')
