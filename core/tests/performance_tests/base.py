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
import urlparse
import time
import random

from core.tests.performance_framework import perf_services
from core.tests.performance_framework import perf_domain


class TestBase(unittest.TestCase):
    """Base class for performance tests."""
    # The default number of page load sessions used to collect timing metrics.
    DEFAULT_SESSION_SAMPLE_COUNT = 3

    BASE_URL = 'http://localhost:9501'

    LIBRARY_URL_SUFFIX = '/library'
    EDITOR_URL_SLICE = '/create/'
    PLAYER_URL_SLICE = '/explore/'
    PROFILE_URL_SLICE = '/profile/'
    LOGIN_URL_SUFFIX = '/_ah/login'
    ADMIN_URL_SUFFIX = '/admin'
    CONTINUE_URL_SUFFIX = (
        '?continue=http%3A//localhost%3A9501/signup%3Freturn_url%3D%252F')
    DASHBOARD_URL_SUFFIX = '/dashboard'
    SPLASH_URL_SUFFIX = '/splash'

    random_id = random.randint(1, 100000)
    EMAIL = 'test%d@example.com' % random_id
    USERNAME = 'username%d' % random_id

    def setUp(self):
        self.data_fetcher = perf_services.SeleniumPerformanceDataFetcher(
            browser='chrome')
        self.page_metrics = None

        self.page_url = None
        self.size_limit_uncached_bytes = None
        self.size_limit_cached_bytes = None
        self.load_time_limit_uncached_ms = None
        self.load_time_limit_cached_ms = None

        self.exploration_url = None
        self.func_call = None

    def _get_complete_url(self, page_url_short):
        return urlparse.urljoin(self.BASE_URL, page_url_short)

    def _load_page_to_cache_server_resources(self):
        self.data_fetcher.load_url(self.page_url)

    def _record_page_metrics_for_url(self):
        self.page_metrics = (
            self.data_fetcher.get_page_metrics_for_url(self.page_url,
                                                       self.func_call))

    def _record_page_metrics_from_cached_session(self):
        self.page_metrics = (
            self.data_fetcher.get_page_metrics_from_cached_session(
                self.page_url,
                self.func_call))

    def _record_average_page_timings_for_url(
            self, session_count=DEFAULT_SESSION_SAMPLE_COUNT):
        page_session_metrics_list = []

        for _ in range(session_count):
            page_session_metrics_list.append(
                self.data_fetcher.get_page_timings_for_url(self.page_url,
                                                           self.func_call))

        self.page_metrics = perf_domain.MultiplePageSessionMetrics(
            page_session_metrics_list)

    def _record_average_page_timings_from_cached_session(
            self, session_count=DEFAULT_SESSION_SAMPLE_COUNT):
        page_session_metrics_list = []

        for _ in range(session_count):
            page_session_metrics_list.append(
                self.data_fetcher.get_page_timings_from_cached_session(
                    self.page_url,
                    self.func_call))

        self.page_metrics = perf_domain.MultiplePageSessionMetrics(
            page_session_metrics_list)

    def _set_test_limits(self, page_config):
        self.page_url = self._get_complete_url(page_config['url'])

        self.size_limit_uncached_bytes = (
            page_config['size_limits_mb']['uncached'] * 1024 * 1024)

        self.size_limit_cached_bytes = (
            page_config['size_limits_mb']['cached'] * 1024 * 1024)

        self.load_time_limit_uncached_ms = (
            page_config['load_time_limits_secs']['uncached'] * 1000)

        self.load_time_limit_cached_ms = (
            page_config['load_time_limits_secs']['cached'] * 1000)

    def _test_total_page_size(self):
        self._record_page_metrics_for_url()

        self.assertLessEqual(
            self.page_metrics.get_total_page_size_bytes(),
            self.size_limit_uncached_bytes)

    def _test_total_page_size_for_cached_session(self):
        self._record_page_metrics_from_cached_session()

        self.assertLessEqual(
            self.page_metrics.get_total_page_size_bytes(),
            self.size_limit_cached_bytes)

    def _test_page_load_time(self):
        self._record_average_page_timings_for_url()

        self.assertLessEqual(
            self.page_metrics.get_average_page_load_time_millisecs(),
            self.load_time_limit_uncached_ms)

    def _test_page_load_time_for_cached_session(self):
        self._record_average_page_timings_from_cached_session()

        self.assertLessEqual(
            self.page_metrics.get_average_page_load_time_millisecs(),
            self.load_time_limit_cached_ms)

    def _get_driver(self):
        return self.data_fetcher.setup_driver()

    def _check_login(self, driver):
        driver.get(self.BASE_URL)
        time.sleep(5)
        resulting_url = driver.current_url

        if resulting_url == self.BASE_URL + self.SPLASH_URL_SUFFIX:
            return False

        return True

    def _login_user(self, driver):
        driver.get(
            self.BASE_URL + self.LOGIN_URL_SUFFIX + self.CONTINUE_URL_SUFFIX)
        elem = driver.find_element_by_name("email")
        elem.clear()
        elem.send_keys(self.EMAIL)
        driver.find_element_by_name('admin').click()
        driver.find_element_by_id('submit-login').click()
        time.sleep(5)
        self._complete_signup(driver)
        time.sleep(5)

    def _complete_signup(self, driver):
        driver.find_element_by_css_selector(
            '.protractor-test-username-input').send_keys(self.USERNAME)
        driver.find_element_by_css_selector(
            '.protractor-test-agree-to-terms-checkbox').click()
        driver.find_element_by_css_selector(
            '.protractor-test-register-user').click()
        time.sleep(5)

    def _reload_explorations(self, driver):
        driver.get(self.BASE_URL + self.ADMIN_URL_SUFFIX)
        time.sleep(5)
        driver.find_element_by_css_selector(
            '.protractor-test-reload-all-explorations-button').click()
        driver.switch_to.alert.accept()
        time.sleep(20)

    def _reload_collection(self, driver):
        driver.get(self.BASE_URL + self.ADMIN_URL_SUFFIX)
        time.sleep(5)
        driver.find_element_by_css_selector(
            '.protractor-test-reload-collection-button').click()
        driver.switch_to.alert.accept()
        time.sleep(5)

    def _create_exploration(self, driver):
        driver.get(self.BASE_URL + self.DASHBOARD_URL_SUFFIX)
        driver.find_element_by_css_selector(
            '.protractor-test-create-activity').click()
        time.sleep(2)
        driver.find_element_by_css_selector(
            '.protractor-test-create-exploration').click()
        time.sleep(5)
        new_exploration_url = driver.current_url
        return new_exploration_url

    def _setup_login(self, driver):
        self._login_user(driver)

    def _setup_enable_explorations(self, driver):
        self._login_user(driver)
        self._reload_explorations(driver)

    def _setup_enable_collections(self, driver):
        self._login_user(driver)
        self._reload_collection(driver)

    def _setup_create_exploration(self, driver):
        self._login_user(driver)
        self.exploration_url = self._create_exploration(driver)
