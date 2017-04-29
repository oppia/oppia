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

"""Controllers for fraction landing page."""

import random
import feconf
from core.controllers import base

class FractionLandingPage(base.BaseHandler):
    """Page showing the landing page for fractions. It will randomly select a
    version out of the four versions of fractions landing page and display it.
    """

    def get(self):
        """Handles GET requests."""

        version_urls = [feconf.FRACTIONS_LANDING_PAGE_A_URL,
                        feconf.FRACTIONS_LANDING_PAGE_B_URL,
                        feconf.FRACTIONS_LANDING_PAGE_C_URL,
                        feconf.FRACTIONS_LANDING_PAGE_D_URL]
        url_to_display = random.choice(version_urls)
        self.redirect(url_to_display)



class FractionLandingPageA(base.BaseHandler):
    """Page showing landing page for fractions - version A."""

    def get(self):
        """Handles GET requests."""
        self.render_template('pages/landing/fractions/landing_page_a.html')


class FractionLandingPageB(base.BaseHandler):
    """Page showing landing page for fractions - version B."""

    def get(self):
        """Handles GET requests."""
        self.render_template('pages/landing/fractions/landing_page_b.html')


class FractionLandingPageC(base.BaseHandler):
    """Page showing landing page for fractions - version C."""

    def get(self):
        """Handles GET requests."""
        self.render_template('pages/landing/fractions/landing_page_c.html')


class FractionLandingPageD(base.BaseHandler):
    """Page showing landing page for fractions - version D."""

    def get(self):
        """Handles GET requests."""
        self.render_template('pages/landing/fractions/landing_page_d.html')
