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

import json

from core import feature_flag_list
from core.constants import constants
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
                response.mustcontain('oppia-feature-flags')

    def test_error_page_with_status_code_returns_oppia_root(self) -> None:
        """Tests that error pages with a status code render the oppia root page
        with a 200 status.
        """
        for status_code in ('400', '401', '404', '500'):
            response = self.get_html_response(
                '/error/%s' % status_code, expected_status_int=200
            )
            response.mustcontain('<oppia-root></oppia-root>')
            response.mustcontain('oppia-feature-flags')

    def test_urls_with_url_fragments_return_oppia_root(self) -> None:
        """Tests that frontend-routed pages whose routes contain url fragments
        render the oppia root page with a 200 status.

        Angular router syntax uses ":name" for url fragments, which webapp2 does
        not understand, so these routes are registered manually in main.py
        instead of by the auto-registration loop. Without a matching manual
        route the backend falls through to the catch-all and returns a 404,
        which fails the Lighthouse audit of the page.
        """
        urls_with_url_fragments = [
            '/certificate-assessment/1',
            '/certificate-assessment-result/1',
            '/edit-certificate-assessment-offering/1',
            '/edit-learner-group/learner-group-1',
            '/learn/math/certificate-offering-available',
            '/learner-group/learner-group-1',
            '/technical-feedback-dashboard/oppia/1',
        ]
        for url in urls_with_url_fragments:
            response = self.get_html_response(url, expected_status_int=200)
            response.mustcontain('<oppia-root></oppia-root>')
            response.mustcontain('oppia-feature-flags')

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
        response_explore.mustcontain('oppia-feature-flags')

        response_embed = self.get_html_response(
            '/%s?embed=true' % valid_route, expected_status_int=200
        )
        response_embed.mustcontain('<oppia-root></oppia-root>')
        response_embed.mustcontain('oppia-feature-flags')

    def test_oppia_root_page_injects_feature_flag_evaluations(self) -> None:
        """Tests that feature flags are evaluated and injected into the HTML."""
        response = self.get_html_response('/', expected_status_int=200)
        response.mustcontain('oppia-feature-flags')

        feature_flags_html = response.body.decode('utf-8')
        start_marker = 'id="oppia-feature-flags">'
        end_marker = '</script>'
        start_index = feature_flags_html.index(start_marker) + len(start_marker)
        end_index = feature_flags_html.index(end_marker, start_index)
        feature_flags_json = feature_flags_html[start_index:end_index].strip()

        feature_flags = json.loads(feature_flags_json)
        self.assertIn(
            feature_flag_list.FeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS.value,
            feature_flags,
        )
        self.assertEqual(
            feature_flags[
                feature_flag_list.FeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS.value
            ],
            False,
        )
