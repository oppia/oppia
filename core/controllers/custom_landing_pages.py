# coding: utf-8

# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Controllers for custom landing pages."""

from core.controllers import acl_decorators
from core.controllers import base
import feconf


class FractionLandingRedirectPage(base.BaseHandler):
    """The handler redirecting to the Fractions landing page."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect('/learn/maths/fractions')


class TopicLandingPage(base.BaseHandler):
    """Page showing the topic landing page."""

    @acl_decorators.open_access
    def get(self, subject, topic):
        """Handles GET requests."""
        if subject in feconf.AVAILABLE_LANDING_PAGES:
            if topic in feconf.AVAILABLE_LANDING_PAGES[subject]:
                self.render_template('pages/landing/topic_landing_page.html')
            else:
                raise self.PageNotFoundException
        else:
            raise self.PageNotFoundException


class StewardsLandingPage(base.BaseHandler):
    """Page showing the landing page for stewards (parents, teachers,
    volunteers, or NGOs).
    """

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.render_template(
            'pages/landing/stewards/landing_page_stewards.html')
