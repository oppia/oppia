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

from __future__ import annotations

from core import feconf
from core.tests import test_utils


class FractionLandingRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting landing page for fractions."""

    def test_old_fractions_landing_url_without_viewer_type(self) -> None:
        """Test to validate the old Fractions landing url without viewerType
        redirects to the new Fractions landing url.
        """
        response = self.get_html_response(
            feconf.FRACTIONS_LANDING_PAGE_URL, expected_status_int=302)
        self.assertEqual(
            'http://localhost/math/fractions',
            response.headers['location'])

    def test_old_fraction_landing_url_with_viewer_type(self) -> None:
        """Test to validate the old Fractions landing url with viewerType
        redirects to the new Fractions landing url.
        """
        response = self.get_html_response(
            '%s?viewerType=student' % feconf.FRACTIONS_LANDING_PAGE_URL,
            expected_status_int=302)
        self.assertEqual(
            'http://localhost/math/fractions',
            response.headers['location'])


class TopicLandingRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting the old landing page URL to the new one."""

    def test_old_topic_url_redirect(self) -> None:
        response = self.get_html_response(
            '/learn/maths/fractions', expected_status_int=302)
        self.assertEqual(
            'http://localhost/math/fractions', response.headers['location'])
