# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for contributor dashboard stats controller."""

from __future__ import annotations

from core import feconf
from core.tests import test_utils


class ContributorDashboardStatsPageTest(test_utils.GenericTestBase):
    """Test for ContributorDashboardStatsPage."""

    def test_get_page_returns_200(self) -> None:
        response = self.get_html_response(
            feconf.CONTRIBUTOR_DASHBOARD_STATS_URL
        )
        self.assertEqual(response.status_int, 200)


class ContributorDashboardStatsDataHandlerTest(test_utils.GenericTestBase):
    """Test for ContributorDashboardStatsDataHandler."""

    def test_get_data_returns_200_and_expected_keys(self) -> None:
        json_response = self.get_json(
            feconf.CONTRIBUTOR_DASHBOARD_STATS_DATA_URL
        )
        self.assertIn('topic_stats', json_response)
        self.assertIn('language_stats', json_response)
        self.assertIn('summary_stats', json_response)
        self.assertIn('supported_languages', json_response)
