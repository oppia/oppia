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

from core.tests import test_utils
import feconf


class AboutPageTest(test_utils.GenericTestBase):
    """Test for About page."""

    def test_loading_about_page_loads_correctly(self):
        response = self.testapp.get('/about')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain(
            'I18N_ABOUT_PAGE_CREDITS_TAB_HEADING')


class SplashPageTest(test_utils.GenericTestBase):
    """Test for splash page."""

    def test_loading_splash_page_loads_correctly(self):
        response = self.testapp.get('/splash')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain('I18N_SPLASH_TITLE')


    def test_loading_splash_page_with_c_value_loading_correctly(self):
        """Test for splash page when c value is included."""
        response = self.testapp.get('/splash?c=c')
        self.assertEqual(response.status_int, 302)
        self.assertEqual(response.content_type, 'text/html')


class GetStartedPageTest(test_utils.GenericTestBase):
    """Test for get started page."""

    def test_loading_get_started_page_loads_correctly(self):
        response = self.testapp.get('/get_started')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain('I18N_GET_STARTED_PAGE_HEADING')


class TeachPageTest(test_utils.GenericTestBase):
    """Test for teach page."""

    def test_loading_teach_page_loads_correctly(self):
        response = self.testapp.get('/teach')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain('I18N_TEACH_PAGE_HEADING')


class ContactPageTest(test_utils.GenericTestBase):
    """Test for contact page."""

    def test_loading_contact_page_loads_correctly(self):
        response = self.testapp.get('/contact')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain('I18N_CONTACT_PAGE_HEADING')


class DonatePageTest(test_utils.GenericTestBase):
    """Test for donate page."""

    def test_loading_donate_page_loads_correctly(self):
        response = self.testapp.get('/donate')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')


class ThanksPageTest(test_utils.GenericTestBase):
    """Test for thanks page."""

    def test_loading_thanks_page_loads_correctly(self):
        response = self.testapp.get('/thanks')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')


class ForumPageTest(test_utils.GenericTestBase):
    """Test for forum page."""

    def test_loading_forum_page_loads_correctly(self):
        response = self.testapp.get('/forum')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')


class TermsPageTest(test_utils.GenericTestBase):
    """Test for terms page."""

    def test_loading_terms_page_loads_correctly(self):
        response = self.testapp.get('/terms')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')



class PrivacyPageTest(test_utils.GenericTestBase):
    """Test for privacy page."""

    def test_loading_privacy_page_loads_correctly(self):
        response = self.testapp.get('/privacy')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')


class AboutRedirectPageTest(test_utils.GenericTestBase):
    """Test for about redirect page."""

    def test_redirect_to_about_page_correctly(self):
        response = self.testapp.get('/credits')
        self.assertEqual(response.status_int, 302)


class FoundationRedirectPageTest(test_utils.GenericTestBase):
    """Test for foundation redirect page."""

    def test_redirect_to_foundation_page_correctly(self):
        response = self.testapp.get('/foundation')
        self.assertEqual(response.status_int, 302)


class TeachRedirectPageTest(test_utils.GenericTestBase):
    """Test for teach redirect page."""

    def test_redirect_to_teach_page_correctly(self):
        response = self.testapp.get('/participate')
        self.assertEqual(response.status_int, 302)


class ConsoleErrorPageTest(test_utils.GenericTestBase):
    """Test for console error page."""

    def test_loading_console_error_page_loads_correctly(self):
        response = self.testapp.get('/console_errors')
        self.assertEqual(response.status_int, 200)


class MaintenancePageTest(test_utils.GenericTestBase):
    """Test for maintenance page."""

    def test_loading_maintenance_page_loads_correctly(self):
        with self.swap(feconf, 'ENABLE_MAINTENANCE_MODE', True):
            response = self.testapp.get('/admin')
            self.assertEqual(response.status_int, 302)
