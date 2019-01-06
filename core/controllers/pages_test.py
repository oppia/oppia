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


class NoninteractivePagesTests(test_utils.GenericTestBase):

    def test_about_page(self):
        """Test the About page."""
        response = self.get_html_response('/about')
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain(
            'I18N_ABOUT_PAGE_CREDITS_TAB_HEADING',
            'I18N_ABOUT_PAGE_FOUNDATION_TAB_PARAGRAPH_5_LICENSE_HEADING')
