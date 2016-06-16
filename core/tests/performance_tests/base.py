# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Common utilities for performance test classes"""

import unittest

from core.tests.performance_framework import selenium_driver
from core.tests.performance_framework import process_data


class TestBase(unittest.TestCase):
    """Base class for performance tests."""

    def setUp(self):
        self.data_fetcher = selenium_driver.SeleniumPerformanceDataFetcher(
            browser='chrome')
        self.page_metrics = None

    def _get_page_session_stats(self, page_url):
        return self.data_fetcher.get_har_dict(page_url)

    def _get_page_session_timings(self, page_url):
        return self.data_fetcher.get_page_session_timings(page_url)

    def _get_page_stats_cached_state(self, page_url):
        return self.data_fetcher.get_har_dict_cached_state(page_url)

    def _get_page_timings_cached_state(self, page_url):
        return self.data_fetcher.get_page_session_timings_cached_state(page_url)

    def _set_stats(self, page_stats=None, page_timings=None):
        self.page_metrics = process_data.PageSessionMetrics(
            page_session_stats=page_stats,
            page_session_timings=page_timings)
