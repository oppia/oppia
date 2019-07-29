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

"""Tests for various static pages (like the About page)."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import os
import sys

from core.controllers import pages
from core.platform import models
from core.tests import test_utils
import feconf
import main

# pylint: disable=wrong-import-order
import webapp2
import webtest
# pylint: enable=wrong-import-order

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class NoninteractivePagesTests(test_utils.GenericTestBase):

    def test_about_page(self):
        """Test the About page."""
        response = self.get_html_response('/about')
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain(
            '<about-page></about-page>')

    def test_maintenance_page(self):
        fake_urls = []
        fake_urls.append(
            main.get_redirect_route(r'/maintenance', pages.MaintenancePage))
        with self.swap(main, 'URLS', fake_urls):
            transaction_services = models.Registry.import_transaction_services()
            app = transaction_services.toplevel_wrapper(
                webapp2.WSGIApplication(main.URLS, debug=feconf.DEBUG))
            self.testapp = webtest.TestApp(app)

            response = self.get_html_response('/maintenance')
            self.assertIn(
                'Oppia is currently being upgraded, and the site should be up',
                response.body)
