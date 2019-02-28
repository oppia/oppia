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
    """PThe handler redirecting to fractions landing page."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        viewer_type = self.request.get('viewerType')

        if viewer_type not in feconf.LANDING_PAGES_VIEWER_TYPES:
            viewer_type = 'teacher'

        self.redirect('/learn/maths/fractions?viewerType=%s' % viewer_type)


class TopicWiseLandingPage(base.BaseHandler):
    """Page showing the topic-wise landing page based on viewer type."""

    @acl_decorators.open_access
    def get(self, subject, topic):
        """Handles GET requests."""

        if subject in feconf.AVAILABLE_LANDING_PAGES:
            if topic in feconf.AVAILABLE_LANDING_PAGES[subject]:
                viewer_type = self.request.get('viewerType')
                if viewer_type not in feconf.LANDING_PAGES_VIEWER_TYPES:
                    viewer_type = feconf.LANDING_PAGES_VIEWER_TYPES[0]
                    self.redirect(
                        '/learn/%s/%s?viewerType=%s'
                        % (subject, topic, viewer_type))
                self.render_template(
                    'pages/landing/landing_page_%s.html' % viewer_type)
                return
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
