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

__author__ = 'Sean Lip'

import copy
import datetime
import feconf
import re
import types

from core.controllers import base
from core.domain import exp_services
from core.platform import models
current_user_services = models.Registry.import_current_user_services()
from core.tests import test_utils
import main

import webapp2
import webtest


class BaseHandlerTest(test_utils.GenericTestBase):

    def test_dev_indicator_appears_in_dev_and_not_in_production(self):
        """Test dev indicator appears in dev and not in production."""

        with self.swap(feconf, 'DEV_MODE', True):
            response = self.testapp.get('/gallery')
            self.assertIn('<div class="oppia-dev-mode">', response.body)

        with self.swap(feconf, 'DEV_MODE', False):
            response = self.testapp.get('/gallery')
            self.assertNotIn('<div class="oppia-dev-mode">', response.body)

    def test_that_no_get_results_in_500_error(self):
        """Test that no GET request results in a 500 error."""

        for route in main.urls:
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

        response = self.testapp.get('/gallery/extra', expect_errors=True)
        self.assertEqual(response.status_int, 404)

        response = self.testapp.get('/gallery/data/extra', expect_errors=True)
        self.assertEqual(response.status_int, 404)

        response = self.testapp.post('/gallery/extra', {}, expect_errors=True)
        self.assertEqual(response.status_int, 404)

        response = self.testapp.put('/gallery/extra', {}, expect_errors=True)
        self.assertEqual(response.status_int, 404)


class CsrfTokenManagerTest(test_utils.GenericTestBase):

    def test_create_and_validate_token(self):
        uid = 'user_id'
        page = 'page_name'

        token = base.CsrfTokenManager.create_csrf_token(uid, page)
        self.assertTrue(base.CsrfTokenManager.is_csrf_token_valid(
            uid, page, token))

        self.assertFalse(
            base.CsrfTokenManager.is_csrf_token_valid('bad_user', page, token))
        self.assertFalse(base.CsrfTokenManager.is_csrf_token_valid(
            uid, 'wrong_page', token))
        self.assertFalse(base.CsrfTokenManager.is_csrf_token_valid(
            uid, self.UNICODE_TEST_STRING, token))
        self.assertFalse(
            base.CsrfTokenManager.is_csrf_token_valid(uid, page, 'new_token'))
        self.assertFalse(
            base.CsrfTokenManager.is_csrf_token_valid(uid, page, 'new/token'))

    def test_nondefault_csrf_secret_is_used(self):
        base.CsrfTokenManager.create_csrf_token('uid', 'page')
        self.assertNotEqual(base.CSRF_SECRET.value, base.DEFAULT_CSRF_SECRET)

    def test_token_expiry(self):
        # This can be any value.
        ORIG_TIME = 100.0

        FORTY_EIGHT_HOURS_IN_SECS = 48 * 60 * 60
        PADDING = 1
        current_time = ORIG_TIME

        # Create a fake copy of the CsrfTokenManager class so that its
        # _get_current_time() method can be swapped out without affecting the
        # original class.
        FakeCsrfTokenManager = copy.deepcopy(base.CsrfTokenManager)

        def _get_current_time(cls):
            return current_time

        setattr(
            FakeCsrfTokenManager,
            _get_current_time.__name__,
            types.MethodType(_get_current_time, FakeCsrfTokenManager)
        )

        # Create a token and check that it expires correctly.
        token = FakeCsrfTokenManager.create_csrf_token('uid', 'page')
        self.assertTrue(
            FakeCsrfTokenManager.is_csrf_token_valid('uid', 'page', token))

        current_time = ORIG_TIME + 1
        self.assertTrue(
            FakeCsrfTokenManager.is_csrf_token_valid('uid', 'page', token))

        current_time = ORIG_TIME + FORTY_EIGHT_HOURS_IN_SECS - PADDING
        self.assertTrue(
            FakeCsrfTokenManager.is_csrf_token_valid('uid', 'page', token))

        current_time = ORIG_TIME + FORTY_EIGHT_HOURS_IN_SECS + PADDING
        self.assertFalse(
            FakeCsrfTokenManager.is_csrf_token_valid('uid', 'page', token))

        # Check that the expiry of one token does not cause the other to
        # expire.
        current_time = ORIG_TIME
        token1 = FakeCsrfTokenManager.create_csrf_token('uid', 'page1')
        self.assertTrue(
            FakeCsrfTokenManager.is_csrf_token_valid('uid', 'page1', token1))

        current_time = ORIG_TIME + 100
        token2 = FakeCsrfTokenManager.create_csrf_token('uid', 'page2')
        self.assertTrue(
            FakeCsrfTokenManager.is_csrf_token_valid('uid', 'page2', token2))

        current_time = ORIG_TIME + FORTY_EIGHT_HOURS_IN_SECS + PADDING
        self.assertFalse(
            FakeCsrfTokenManager.is_csrf_token_valid('uid', 'page1', token1))
        self.assertTrue(
            FakeCsrfTokenManager.is_csrf_token_valid('uid', 'page2', token2))

        current_time = ORIG_TIME + 100 + FORTY_EIGHT_HOURS_IN_SECS + PADDING
        self.assertFalse(
            FakeCsrfTokenManager.is_csrf_token_valid('uid', 'page1', token1))
        self.assertFalse(
            FakeCsrfTokenManager.is_csrf_token_valid('uid', 'page2', token2))


class EscapingTest(test_utils.GenericTestBase):

    class FakeAboutPage(base.BaseHandler):
        """Fake page for testing autoescaping."""

        def get(self):
            """Handles GET requests."""
            self.values.update({
                'CONTACT_EMAIL_ADDRESS': ['<[angular_tag]>'],
                'SITE_FORUM_URL': 'x{{51 * 3}}y',
            })
            self.render_template('pages/about.html')

        def post(self):
            """Handles POST requests."""
            self.render_json({'big_value': u'\n<script>马={{'})

    def setUp(self):
        super(EscapingTest, self).setUp()
        self.testapp = webtest.TestApp(webapp2.WSGIApplication(
            [webapp2.Route('/fake', self.FakeAboutPage, name='FakePage')],
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
