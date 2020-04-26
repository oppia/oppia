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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
import feconf
import python_utils


class ForumRedirectPage(base.BaseHandler):
    """A handler to redirect to Oppia's Google group."""
    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect(python_utils.convert_to_bytes(feconf.GOOGLE_GROUP_URL))


class AboutRedirectPage(base.BaseHandler):
    """A page that redirects to the main About page."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect(python_utils.convert_to_bytes('/about'))


class FoundationRedirectPage(base.BaseHandler):
    """A page that redirects to the separate Oppia Foundation site."""
    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect(python_utils.convert_to_bytes(feconf.FOUNDATION_SITE_URL))
        return


class TeachRedirectPage(base.BaseHandler):
    """A page that redirects to the main Teach page."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect(python_utils.convert_to_bytes('/teach'))


class ConsoleErrorPage(base.BaseHandler):
    """Page with missing resources to test cache slugs."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        # Note that this line is not meant to be covered by backend tests
        # because this handler is only meant to be used in e2e tests. In the
        # backend test environment, the HTML template file is not generated at
        # all.
        self.render_template('console_errors.html')  # pragma: no cover


class MaintenancePage(base.BaseHandler):
    """Page describing that Oppia is down for maintenance mode."""

    @acl_decorators.open_access
    def get(self, *args, **kwargs):
        """Handles GET requests."""
        self.render_template('maintenance-page.mainpage.html')
