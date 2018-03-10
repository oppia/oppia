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

from core.controllers import base
from core.domain import acl_decorators


class FractionLandingPage(base.BaseHandler):
    """Page showing the landing page for fractions. It will randomly select a
    version out of the four versions of fractions landing page and display it.
    """

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        viewer_type = self.request.get('viewerType')

        if not viewer_type:
            viewer_type = 'student'
            self.redirect('/fractions?viewerType=%s' % viewer_type)

        self.render_template(
            'pages/landing/fractions/landing_page_%s.html' % viewer_type)
