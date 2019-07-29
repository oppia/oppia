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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import os
import sys

from core.controllers import acl_decorators
from core.controllers import base
import feconf

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


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
                self.render_template('dist/topic-landing-page.mainpage.html')
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
            'dist/stewards-landing-page.mainpage.html')
