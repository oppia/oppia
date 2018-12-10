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


class FractionLandingPageTest(test_utils.GenericTestBase):

    def test_fraction_landing_page_without_viewer_type(self):
        """Test for showing the landing page for fractions,
        without any viewer type should redirect to teacher type.
        """
        response = self.testapp.get(feconf.FRACTIONS_LANDING_PAGE_URL)
        self.assertEqual(response.status_int, 302)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain('/fractions_landing/teachers')

    def test_fraction_landing_page_with_viewer_type(self):
        """Test for showing the landing page for fractions,
        with student viewer type should respond student type.
        """
        response = self.testapp.get(
            '%s?viewerType=student' % (feconf.FRACTIONS_LANDING_PAGE_URL))
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain('/fractions_landing/student')


class StewardsLandingPageTest(test_utils.GenericTestBase):
    """Test for showing the landing page for stewards (parents, teachers,
    volunteers, or NGOs).
    """
    def test_nonprofits_landing_page(self):
        response = self.testapp.get(feconf.CUSTOM_NONPROFITS_LANDING_PAGE_URL)
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain(
            'Let\'s work together to make compelling educational')

    def test_parents_landing_page(self):
        response = self.testapp.get(feconf.CUSTOM_PARENTS_LANDING_PAGE_URL)
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain(
            'Help your child learn with our free, engaging lessons')

    def test_teachers_landing_page(self):
        response = self.testapp.get(feconf.CUSTOM_TEACHERS_LANDING_PAGE_URL)
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain('Oppia\'s free, personalized lessons are a great')

    def test_volunteers_landing_page(self):
        response = self.testapp.get(feconf.CUSTOM_VOLUNTEERS_LANDING_PAGE_URL)
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain('Help improve access to high-quality education')
