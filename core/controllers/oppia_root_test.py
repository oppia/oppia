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

from core.constants import constants
from core.tests import test_utils


class OppiaRootPageTests(test_utils.GenericTestBase):

    def test_oppia_root_page(self) -> None:
        """Tests access to the unified entry page."""
        for page in constants.PAGES_REGISTERED_WITH_FRONTEND.values():
            if not 'MANUALLY_REGISTERED_WITH_BACKEND' in page:
                response = self.get_html_response(
                    '/%s' % page['ROUTE'], expected_status_int=200)
                if 'LIGHTWEIGHT' in page:
                    response.mustcontain(
                        '<lightweight-oppia-root></lightweight-oppia-root>')
                else:
                    response.mustcontain('<oppia-root></oppia-root>')


class OppiaLightweightRootPageTests(test_utils.GenericTestBase):

    def test_oppia_lightweight_root_page(self) -> None:
        response = self.get_html_response('/', expected_status_int=200)
        response.mustcontain(
            '<lightweight-oppia-root></lightweight-oppia-root>',
            '<title>Loading | Oppia</title>'
        )

    def test_oppia_lightweight_root_page_with_rtl_lang_param(self) -> None:
        response = self.get_html_response('/?dir=rtl', expected_status_int=200)
        response.mustcontain(
            '<lightweight-oppia-root></lightweight-oppia-root>',
            no='<title>Loading | Oppia</title>'
        )

    def test_oppia_lightweight_root_page_with_ltr_lang_param(self) -> None:
        response = self.get_html_response('/?dir=ltr', expected_status_int=200)
        response.mustcontain(
            '<lightweight-oppia-root></lightweight-oppia-root>',
            '<title>Loading | Oppia</title>'
        )

    def test_oppia_lightweight_root_page_with_rtl_dir_cookie(self) -> None:
        self.testapp.set_cookie('dir', 'rtl')
        response = self.get_html_response('/', expected_status_int=200)
        response.mustcontain(
            '<lightweight-oppia-root></lightweight-oppia-root>',
            no='<title>Loading | Oppia</title>'
        )

    def test_oppia_lightweight_root_page_with_ltr_dir_cookie(self) -> None:
        self.testapp.set_cookie('dir', 'ltr')
        response = self.get_html_response('/', expected_status_int=200)
        response.mustcontain(
            '<lightweight-oppia-root></lightweight-oppia-root>',
            '<title>Loading | Oppia</title>'
        )

    def test_return_bundle_modifier_precedence(self) -> None:
        # In case of conflicting cookie and url param values for dir, cookie
        # is preferred.
        self.testapp.set_cookie('dir', 'ltr')
        response = self.get_html_response('/?dir=rtl', expected_status_int=200)
        response.mustcontain(
            '<lightweight-oppia-root></lightweight-oppia-root>',
            '<title>Loading | Oppia</title>'
        )

        self.testapp.set_cookie('dir', 'rtl')
        response = self.get_html_response('/?dir=ltr', expected_status_int=200)
        response.mustcontain(
            '<lightweight-oppia-root></lightweight-oppia-root>',
            no='<title>Loading | Oppia</title>'
        )

    def test_invalid_bundle_modifier_values(self) -> None:
        # In case of invalid values in cookie but valid query param respect the
        # param value for dir.
        self.testapp.set_cookie('dir', 'new_hacker_in_the_block')
        response = self.get_html_response('/?dir=rtl', expected_status_int=200)
        response.mustcontain(
            '<lightweight-oppia-root></lightweight-oppia-root>',
            no='<title>Loading | Oppia</title>'
        )

        self.testapp.set_cookie('dir', 'new_hacker_in_the_block')
        response = self.get_html_response('/?dir=ltr', expected_status_int=200)
        response.mustcontain(
            '<lightweight-oppia-root></lightweight-oppia-root>',
            '<title>Loading | Oppia</title>'
        )
        # The bundle modifier precedence guarantees that a valid cookie dir
        # value will return the correct bundle.

        # When both modifiers are invalid, default to AoT bundle.
        self.testapp.set_cookie('dir', 'new_hacker_in_the_block')
        response = self.get_html_response(
            '/?dir=is_trying_out', expected_status_int=200
        )
        response.mustcontain(
            '<lightweight-oppia-root></lightweight-oppia-root>',
            '<title>Loading | Oppia</title>'
        )
