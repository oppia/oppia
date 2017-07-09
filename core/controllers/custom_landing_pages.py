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

import random
from core.controllers import base


class FractionLandingPage(base.BaseHandler):
    """Page showing the landing page for fractions. It will randomly select a
    version out of the four versions of fractions landing page and display it.
    """

    def get(self):
        """Handles GET requests."""
        version_id = self.request.get('v')

        if not version_id:
            version_ids = ['a', 'b', 'c', 'd']
            version_id = random.choice(version_ids)
            self.redirect('/fractions?v=%s' % version_id)

        self.render_template(
            'pages/landing/fractions/landing_page_%s.html' % version_id)
