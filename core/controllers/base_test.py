# coding: utf-8
#
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

"""Tests for generic controller behavior."""

import datetime
import json
import os
import re
import types

from core.controllers import base
from core.domain import exp_services
from core.platform import models
from core.tests import test_utils
import feconf
import main
import utils

import webapp2
import webtest

current_user_services = models.Registry.import_current_user_services()

FORTY_EIGHT_HOURS_IN_SECS = 48 * 60 * 60
PADDING = 1


class BaseHandlerTest(test_utils.GenericTestBase):

    def setUp(self):
        super(BaseHandlerTest, self).setUp()
        self.signup('user@example.com', 'user')

    def test_dev_indicator_appears_in_dev_and_not_in_production(self):
        """Test dev indicator appears in dev and not in production."""

        with self.swap(feconf, 'DEV_MODE', True):
            response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
            self.assertIn('<div class="oppia-dev-mode">', response.body)

        with self.swap(feconf, 'DEV_MODE', False):
            response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
            self.assertNotIn('<div class="oppia-dev-mode">', response.body)

    def test_that_no_get_results_in_500_error(self):
        """Test that no GET request results in a 500 error."""

        for route in main.URLS:
            # This was needed for the Django tests to pass (at the time we had
            # a Django branch of the codebase).
            if isinstance(route, tuple):
                continue
            else:
                url = route.template
            url = re.sub('<([^/^:]+)>', 'abc123', url)

            # Some of these will 404 or 302. This is expected.
            response = self.testapp.get(url, expect_errors=True)
            self.log_line(
                'Fetched %s with status code %s' % (url, response.status_int))
            self.assertIn(response.status_int, [200, 302, 404])

        # TODO(sll): Add similar tests for POST, PUT, DELETE.
        # TODO(sll): Set a self.payload attr in the BaseHandler for
        #     POST, PUT and DELETE. Something needs to regulate what
        #     the fields in the payload should be.

    def test_requests_for_invalid_paths(self):
        """Test that requests for invalid paths result in a 404 error."""

        response = self.testapp.get('/library/extra', expect_errors=True)
        self.assertEqual(response.status_int, 404)

        response = self.testapp.get('/library/data/extra', expect_errors=True)
        self.assertEqual(response.status_int, 404)

        response = self.testapp.post('/library/extra', {}, expect_errors=True)
        self.assertEqual(response.status_int, 404)

        response = self.testapp.put('/library/extra', {}, expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_redirect_in_both_logged_in_and_logged_out_states(self):
        "Test for a redirect in both logged in and logged out states on '/'."

        # Logged out state
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 302)
        self.assertIn('splash', response.headers['location'])

        # Login and assert that there is a redirect
        self.login('user@example.com')
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 302)
        self.assertIn('dashboard', response.headers['location'])
        self.logout()


class CsrfTokenManagerTest(test_utils.GenericTestBase):

    def test_create_and_validate_token(self):
        uid = 'user_id'

        token = base.CsrfTokenManager.create_csrf_token(uid)
        self.assertTrue(base.CsrfTokenManager.is_csrf_token_valid(
            uid, token))

        self.assertFalse(
            base.CsrfTokenManager.is_csrf_token_valid('bad_user', token))
        self.assertFalse(
            base.CsrfTokenManager.is_csrf_token_valid(uid, 'new_token'))
        self.assertFalse(
            base.CsrfTokenManager.is_csrf_token_valid(uid, 'new/token'))

    def test_nondefault_csrf_secret_is_used(self):
        base.CsrfTokenManager.create_csrf_token('uid')
        self.assertNotEqual(base.CSRF_SECRET.value, base.DEFAULT_CSRF_SECRET)

    def test_token_expiry(self):
        # This can be any value.
        orig_time = 100.0
        current_time = orig_time

        def _get_current_time(unused_cls):
            return current_time

        with self.swap(
            base.CsrfTokenManager, '_get_current_time',
            types.MethodType(_get_current_time, base.CsrfTokenManager)):
            # Create a token and check that it expires correctly.
            token = base.CsrfTokenManager().create_csrf_token('uid')
            self.assertTrue(base.CsrfTokenManager.is_csrf_token_valid(
                'uid', token))

            current_time = orig_time + 1
            self.assertTrue(base.CsrfTokenManager.is_csrf_token_valid(
                'uid', token))

            current_time = orig_time + FORTY_EIGHT_HOURS_IN_SECS - PADDING
            self.assertTrue(base.CsrfTokenManager.is_csrf_token_valid(
                'uid', token))

            current_time = orig_time + FORTY_EIGHT_HOURS_IN_SECS + PADDING
            self.assertFalse(base.CsrfTokenManager.is_csrf_token_valid(
                'uid', token))


class EscapingTest(test_utils.GenericTestBase):

    class FakePage(base.BaseHandler):
        """Fake page for testing autoescaping."""

        def get(self):
            """Handles GET requests."""
            self.render_template('pages/contact.html')

        def post(self):
            """Handles POST requests."""
            self.render_json({'big_value': u'\n<script>马={{'})

    def setUp(self):
        super(EscapingTest, self).setUp()

        # Update a config property that shows in all pages.
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.testapp.get('/admin')
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json('/adminhandler', {
            'action': 'save_config_properties',
            'new_config_property_values': {
                base.SITE_FEEDBACK_FORM_URL.name: (
                    '<[angular_tag]> x{{51 * 3}}y'),
            }
        }, csrf_token)

        # Modify the testapp to use the fake handler.
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/fake', self.FakePage, name='FakePage')],
            debug=feconf.DEBUG,
        ))

    def test_jinja_autoescaping(self):
        response = self.testapp.get('/fake')
        self.assertEqual(response.status_int, 200)

        self.assertIn('&lt;[angular_tag]&gt;', response.body)
        self.assertNotIn('<[angular_tag]>', response.body)

        self.assertIn('x{{51 * 3}}y', response.body)
        self.assertNotIn('x153y', response.body)

    def test_special_char_escaping(self):
        response = self.testapp.post('/fake', {})
        self.assertEqual(response.status_int, 200)

        self.assertTrue(response.body.startswith(feconf.XSSI_PREFIX))
        self.assertIn('\\n\\u003cscript\\u003e\\u9a6c={{', response.body)
        self.assertNotIn('<script>', response.body)
        self.assertNotIn('马', response.body)


class LogoutPageTest(test_utils.GenericTestBase):

    def test_logout_page(self):
        """Tests for logout handler."""
        exp_services.load_demo('0')
        # Logout with valid query arg. This test only validates that the login
        # cookies have expired after hitting the logout url.
        current_page = '/explore/0'
        response = self.testapp.get(current_page)
        self.assertEqual(response.status_int, 200)
        response = self.testapp.get(current_user_services.create_logout_url(
            current_page))
        expiry_date = response.headers['Set-Cookie'].rsplit('=', 1)

        self.assertTrue(
            datetime.datetime.utcnow() > datetime.datetime.strptime(
                expiry_date[1], '%a, %d %b %Y %H:%M:%S GMT',))


class I18nDictsTest(test_utils.GenericTestBase):

    def _extract_keys_from_json_file(self, filename):
        return sorted(json.loads(utils.get_file_contents(
            os.path.join(os.getcwd(), self.get_static_asset_filepath(),
                         'assets', 'i18n', filename)
        )).keys())

    def test_i18n_keys(self):
        """Tests that all JSON files in i18n.js have the same set of keys."""
        master_key_list = self._extract_keys_from_json_file('en.json')
        self.assertGreater(len(master_key_list), 0)

        filenames = os.listdir(
            os.path.join(os.getcwd(), self.get_static_asset_filepath(),
                         'assets', 'i18n'))
        for filename in filenames:
            if filename == 'en.json':
                continue

            self.log_line('Processing %s...' % filename)

            key_list = self._extract_keys_from_json_file(filename)
            # All other JSON files should have a subset of the keys in en.json.
            self.assertEqual(len(set(key_list) - set(master_key_list)), 0)

            # If there are missing keys, log an error, but don't fail the
            # tests.
            if set(key_list) != set(master_key_list):
                self.log_line('')
                untranslated_keys = list(set(master_key_list) - set(key_list))
                self.log_line('ERROR: Untranslated keys in %s:' % filename)
                for key in untranslated_keys:
                    self.log_line('- %s' % key)
                self.log_line('')

    def test_keys_match_en_qqq(self):
        """Tests that en.json and qqq.json have the exact same set of keys."""
        en_key_list = self._extract_keys_from_json_file('en.json')
        qqq_key_list = self._extract_keys_from_json_file('qqq.json')
        self.assertEqual(en_key_list, qqq_key_list)
