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

from core.tests import test_utils
import feconf


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
        response.mustcontain('students and kids')


class StewardsLandingPageTest(test_utils.GenericTestBase):
    """Test for showing the landing page for stewards (parents, teachers,
    volunteers, or NGOs).
    """
    def test_nonprofits_landing_page(self):
        response = self.get_html_response(
            feconf.CUSTOM_NONPROFITS_LANDING_PAGE_URL)
        response.mustcontain(
            'Let\'s work together to make compelling educational')

    def test_parents_landing_page(self):
        response = self.get_html_response(
            feconf.CUSTOM_PARENTS_LANDING_PAGE_URL)
        response.mustcontain(
            'Help your child learn with our free, engaging lessons')

    def test_teachers_landing_page(self):
        response = self.get_html_response(
            feconf.CUSTOM_TEACHERS_LANDING_PAGE_URL)
        response.mustcontain('Oppia\'s free, personalized lessons are a great')

    def test_volunteers_landing_page(self):
        response = self.get_html_response(
            feconf.CUSTOM_VOLUNTEERS_LANDING_PAGE_URL)
        response.mustcontain('Help improve access to high-quality education')
