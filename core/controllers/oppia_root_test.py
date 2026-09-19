# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for the oppia root page."""

from __future__ import annotations

import contextlib

from core import feconf
from core.constants import constants
from core.domain import auth_services, user_services
from core.tests import test_utils


class OppiaRootPageTests(test_utils.GenericTestBase):

    def test_oppia_root_page(self) -> None:
        """Tests access to the unified entry page."""
        for page in constants.PAGES_REGISTERED_WITH_FRONTEND.values():
            if not 'MANUALLY_REGISTERED_WITH_BACKEND' in page:
                response = self.get_html_response(
                    '/%s' % page['ROUTE'], expected_status_int=200
                )
                response.mustcontain('<oppia-root></oppia-root>')

    def test_explore_and_embed_urls_render_with_no_iframe_restriction(
        self,
    ) -> None:
        """Tests that explore and embed URLs hit the iframe restriction bypass."""

        valid_route = ''
        for page in constants.PAGES_REGISTERED_WITH_FRONTEND.values():
            if 'MANUALLY_REGISTERED_WITH_BACKEND' not in page:
                valid_route = page['ROUTE']
                break

        response_explore = self.get_html_response(
            '/%s?explore=true' % valid_route, expected_status_int=200
        )
        response_explore.mustcontain('<oppia-root></oppia-root>')

        response_embed = self.get_html_response(
            '/%s?embed=true' % valid_route, expected_status_int=200
        )
        response_embed.mustcontain('<oppia-root></oppia-root>')


class OppiaLightweightRootPageTests(test_utils.GenericTestBase):

    def test_oppia_lightweight_root_page(self) -> None:
        """Tests access to the lightweight unified entry page."""
        response = self.get_html_response('/', expected_status_int=200)
        response.mustcontain('<oppia-root></oppia-root>')

    def test_lightweight_root_page_sets_security_headers(self) -> None:
        response = self.get_html_response('/')
        self.assertEqual(
            response.headers['Content-Security-Policy'],
            'frame-ancestors \'none\'',
        )
        self.assertEqual(
            response.headers['Cache-Control'],
            'must-revalidate, no-cache, no-store',
        )
        self.assertEqual(
            response.headers['Strict-Transport-Security'],
            'max-age=31536000; includeSubDomains',
        )
        self.assertEqual(response.headers['Pragma'], 'no-cache')

    def test_lightweight_root_page_allows_iframing_for_explore_and_embed(
        self,
    ) -> None:
        response = self.get_html_response('/?embed=true')
        self.assertNotIn('Content-Security-Policy', response.headers)

        response = self.get_html_response('/?explore=true')
        self.assertNotIn('Content-Security-Policy', response.headers)

    def test_lightweight_root_page_skips_auth_and_user_lookups(self) -> None:
        with contextlib.ExitStack() as exit_stack:
            auth_claims_call_counter = exit_stack.enter_context(
                self.swap_with_call_counter(
                    auth_services, 'get_auth_claims_from_request'
                )
            )
            user_settings_call_counter = exit_stack.enter_context(
                self.swap_with_call_counter(
                    user_services, 'get_user_settings_by_auth_id'
                )
            )
            record_logged_in_call_counter = exit_stack.enter_context(
                self.swap_with_call_counter(
                    user_services, 'record_user_logged_in'
                )
            )
            response = self.get_html_response('/')

        self.assertIn(b'<oppia-root></oppia-root>', response.body)
        self.assertEqual(auth_claims_call_counter.times_called, 0)
        self.assertEqual(user_settings_call_counter.times_called, 0)
        self.assertEqual(record_logged_in_call_counter.times_called, 0)

    def test_lightweight_root_page_skips_auth_for_logged_in_users(
        self,
    ) -> None:
        with self.login_context(self.VIEWER_EMAIL):
            with self.swap_with_call_counter(
                auth_services, 'get_auth_claims_from_request'
            ) as auth_claims_call_counter:
                response = self.get_html_response('/')

        self.assertEqual(auth_claims_call_counter.times_called, 0)
        self.assertIn(b'<oppia-root></oppia-root>', response.body)

    def test_lightweight_root_page_redirects_to_maintenance_page(self) -> None:
        with self.swap(feconf, 'ENABLE_MAINTENANCE_MODE', True):
            response = self.get_html_response('/', expected_status_int=302)

        self.assertEqual(
            'http://localhost/maintenance', response.headers['location']
        )

    def test_maintenance_page_is_still_served_in_maintenance_mode(self) -> None:
        with self.swap(feconf, 'ENABLE_MAINTENANCE_MODE', True):
            response = self.get_html_response(
                '/maintenance', expected_status_int=200
            )

        self.assertIn(b'<oppia-root></oppia-root>', response.body)

    def test_lightweight_root_page_redirects_old_demo_server(self) -> None:
        response = self.get_html_response(
            'https://oppiaserver.appspot.com/', expected_status_int=301
        )
        self.assertEqual(
            'https://oppiatestserver.appspot.com',
            response.headers['Location'],
        )
