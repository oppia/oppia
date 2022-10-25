# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Tests for the diagnostic test player page."""

from __future__ import annotations

from core import feconf
from core.tests import test_utils


class DiagnosticTestLandingPageTest(test_utils.GenericTestBase):
    """Test class for the diagnostic test player page."""

    def test_diagnostic_test_page_access(self) -> None:
        self.get_html_response(
            feconf.DIAGNOSTIC_TEST_PLAYER_PAGE_URL,
            expected_status_int=200
        )
