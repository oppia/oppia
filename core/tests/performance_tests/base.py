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

from core.tests.performance_framework import perf_services


class TestBase(unittest.TestCase):
    """Base class for performance tests."""

    def setUp(self):
        self.data_fetcher = perf_services.SeleniumPerformanceDataFetcher(
            browser='chrome')
        self.page_metrics = None

    def _record_page_metrics_for_url(self, page_url):
        self.page_metrics = (
            self.data_fetcher.get_page_metrics_for_url(page_url))

    def _record_page_metrics_from_cached_session(self, page_url):
        self.page_metrics = (
            self.data_fetcher.get_page_metrics_from_cached_session(page_url))

    def _record_page_timings_for_url(self, page_url):
        self.page_metrics = (
            self.data_fetcher.get_page_timings_for_url(page_url))

    def _record_page_timings_from_cached_session(self, page_url):
        self.page_metrics = (
            self.data_fetcher.get_page_timings_from_cached_session(page_url))
