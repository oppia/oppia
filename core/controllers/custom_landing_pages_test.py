# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for custom landing pages."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import os
import sys

from core.tests import test_utils
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


class FractionLandingRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting landing page for fractions."""

    def test_old_fractions_landing_url_without_viewer_type(self):
        """Test to validate the old Fractions landing url without viewerType
        redirects to the new Fractions landing url.
        """
        response = self.get_html_response(
            feconf.FRACTIONS_LANDING_PAGE_URL, expected_status_int=302)
        self.assertEqual(
            'http://localhost/learn/maths/fractions',
            response.headers['location'])

    def test_old_fraction_landing_url_with_viewer_type(self):
        """Test to validate the old Fractions landing url with viewerType
        redirects to the new Fractions landing url.
        """
        response = self.get_html_response(
            '%s?viewerType=student' % feconf.FRACTIONS_LANDING_PAGE_URL,
            expected_status_int=302)
        self.assertEqual(
            'http://localhost/learn/maths/fractions',
            response.headers['location'])


class TopicLandingPageTest(test_utils.GenericTestBase):
    """Test for showing landing pages."""

    def test_invalid_subject_landing_page_leads_to_404(self):
        self.get_html_response(
            '/learn/invalid_subject/fractions', expected_status_int=404)

    def test_invalid_topic_landing_page_leads_to_404(self):
        self.get_html_response(
            '/learn/maths/invalid_topic', expected_status_int=404)

    def test_valid_subject_and_topic_loads_correctly(self):
        response = self.get_html_response('/learn/maths/fractions')
        response.mustcontain('<topic-landing-page></topic-landing-page>')


class StewardsLandingPageTest(test_utils.GenericTestBase):
    """Test for showing the landing page for stewards (parents, teachers,
    volunteers, or NGOs).
    """
    def test_nonprofits_landing_page(self):
        response = self.get_html_response(
            feconf.CUSTOM_NONPROFITS_LANDING_PAGE_URL)
        response.mustcontain(
            '<stewards-landing-page></stewards-landing-page>')

    def test_parents_landing_page(self):
        response = self.get_html_response(
            feconf.CUSTOM_PARENTS_LANDING_PAGE_URL)
        response.mustcontain(
            '<stewards-landing-page></stewards-landing-page>')

    def test_teachers_landing_page(self):
        response = self.get_html_response(
            feconf.CUSTOM_TEACHERS_LANDING_PAGE_URL)
        response.mustcontain('<stewards-landing-page></stewards-landing-page>')

    def test_volunteers_landing_page(self):
        response = self.get_html_response(
            feconf.CUSTOM_VOLUNTEERS_LANDING_PAGE_URL)
        response.mustcontain('<stewards-landing-page></stewards-landing-page>')
