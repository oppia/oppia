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

"""Common utilities for performance test classes."""

import random
import unittest
import urlparse

from core.tests.performance_framework import perf_domain
from core.tests.performance_framework import perf_services
from core.tests.performance_tests import test_config


class TestBase(unittest.TestCase):
    """Base class for performance tests."""

    # The default number of page load sessions used to collect timing metrics.
    DEFAULT_SESSION_SAMPLE_COUNT = 3

    BASE_URL = 'http://localhost:%d' % test_config.PERFORMANCE_TESTS_SERVER_PORT

    def setUp(self):
        self.data_fetcher = None
        self.page_metrics = None

        self.page_url = None
        self.size_limit_uncached_bytes = None
        self.size_limit_cached_bytes = None
        self.load_time_limit_uncached_ms = None
        self.load_time_limit_cached_ms = None

        self.username = 'user%d' % random.randint(1, 100000)
        self.preload_option = None

    def _initialize_data_fetcher(self):
        self.data_fetcher = perf_services.SeleniumPerformanceDataFetcher(
            browser=perf_services.BROWSER_CHROME, username=self.username,
            preload_option=self.preload_option)

    def _get_complete_url(self, base_url, page_url_short):
        return urlparse.urljoin(base_url, page_url_short)

    def _load_page_to_cache_server_resources(self):
        self.data_fetcher.load_url(self.page_url)

    def _record_page_metrics_from_uncached_session(self):
        self.page_metrics = (
            self.data_fetcher.get_page_metrics_from_uncached_session(
                self.page_url))

    def _record_page_metrics_from_cached_session(self):
        self.page_metrics = (
            self.data_fetcher.get_page_metrics_from_cached_session(
                self.page_url))

    def _record_average_page_timings_from_uncached_session(
            self, session_count=DEFAULT_SESSION_SAMPLE_COUNT):
        page_session_metrics_list = []

        for _ in range(session_count):
            page_session_metrics_list.append(
                self.data_fetcher.get_page_timings_from_uncached_session(
                    self.page_url))

        self.page_metrics = perf_domain.MultiplePageSessionMetrics(
            page_session_metrics_list)

    def _record_average_page_timings_from_cached_session(
            self, session_count=DEFAULT_SESSION_SAMPLE_COUNT):
        page_session_metrics_list = []

        for _ in range(session_count):
            page_session_metrics_list.append(
                self.data_fetcher.get_page_timings_from_cached_session(
                    self.page_url))

        self.page_metrics = perf_domain.MultiplePageSessionMetrics(
            page_session_metrics_list)

    def _set_page_config(self, page_config, append_username=False):
        self.page_url = self._get_complete_url(
            self.BASE_URL, page_config['url'])

        self.size_limit_uncached_bytes = (
            page_config['size_limits_mb']['uncached'] * 1024 * 1024)

        self.size_limit_cached_bytes = (
            page_config['size_limits_mb']['cached'] * 1024 * 1024)

        self.load_time_limit_uncached_ms = (
            page_config['load_time_limits_secs']['uncached'] * 1000)

        self.load_time_limit_cached_ms = (
            page_config['load_time_limits_secs']['cached'] * 1000)

        self.preload_option = page_config['preload_options']

        if append_username:
            self.page_url = self._get_complete_url(
                self.page_url, self.username)

    def _test_total_page_size(self):
        self._record_page_metrics_from_uncached_session()

        self.assertLessEqual(
            self.page_metrics.get_total_page_size_bytes(),
            self.size_limit_uncached_bytes)

    def _test_total_page_size_for_cached_session(self):
        self._record_page_metrics_from_cached_session()

        self.assertLessEqual(
            self.page_metrics.get_total_page_size_bytes(),
            self.size_limit_cached_bytes)

    def _test_page_load_time(self):
        self._record_average_page_timings_from_uncached_session()

        self.assertLessEqual(
            self.page_metrics.get_average_page_load_time_millisecs(),
            self.load_time_limit_uncached_ms)

    def _test_page_load_time_for_cached_session(self):
        self._record_average_page_timings_from_cached_session()

        self.assertLessEqual(
            self.page_metrics.get_average_page_load_time_millisecs(),
            self.load_time_limit_cached_ms)
