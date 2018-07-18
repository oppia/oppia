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

"""Contains a utility for fetching performance data using Selenium and
Browsermob-proxy.
"""

import os
import time
import urlparse

from core.tests.performance_framework import perf_domain
from core.tests.performance_tests import test_config
import feconf

import browsermobproxy
from selenium import webdriver

CHROMEDRIVER_PATH = os.path.join(
    '..', 'node_modules', 'protractor', 'node_modules', 'webdriver-manager',
    'selenium', 'chromedriver_2.22')

BROWSERMOB_PROXY_PATH = os.path.join(
    '..', 'oppia_tools', 'browsermob-proxy-2.1.1', 'bin', 'browsermob-proxy')

BROWSER_CHROME = 'chrome'


class SeleniumPerformanceDataFetcher(object):
    """Fetches performance data for locally served Oppia pages using Selenium
    and Browsermob-proxy.

    Selenium is used to programmatically interact with a browser.
    Browsermob-proxy is used to capture HTTP Archive (referred to as HAR) data.

    The HTTP Archive format is a JSON-formatted archive file format used for
    logging a web browser's interaction with a site. It contains detailed
    performance data, including information about page loading and displaying
    and per-resource statistics. Each entry contains the URL requested and
    request and response headers. For additional details, please see:
    https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html

    The HTTP Archive data is retrieved using the proxy server by recording the
    communication between the client and server.
    """

    # Chrome is the default browser that selenium will use for extracting
    # performance stats.
    DEFAULT_BROWSER = 'chrome'
    SUPPORTED_BROWSERS = ['chrome', 'firefox']

    # Duration (in seconds) to wait for the complete page to load, otherwise
    # XHR requests made post initial page load will not be recorded.
    DEFAULT_WAIT_DURATION_SECS = 3

    BASE_URL = 'http://localhost:%d' % test_config.PERFORMANCE_TESTS_SERVER_PORT
    LOGIN_URL = '/_ah/login'

    def __init__(self, browser, preload_option, username=None):
        """preload_options can be either of the possible preload options
        described in test_config.
        """
        if browser in self.SUPPORTED_BROWSERS:
            self.browser = browser
        else:
            error_msg = 'Unsupported browser specified: %s' % browser
            raise ValueError(error_msg)

        self.exploration_url = None
        self.dev_appserver_login_cookie = None

        # All tests are independent and they do login + signup + other test
        # specific work. Using the same username across tests breaks this flow.
        # Thus, different usernames enable independent tests.
        self.email = '%s@example.com' % username
        self.username = username

        # Initialize stuff required by the test. A separate driver instance
        # is required to prevent browser cached resources altering the metrics
        # for our tests.
        driver = self._setup_driver()
        if preload_option == test_config.PRELOAD_NONE:
            pass
        elif preload_option == test_config.PRELOAD_DO_LOGIN:
            self._setup_login(driver)
        elif preload_option == test_config.PRELOAD_CREATE_EXP:
            self._create_exploration(driver)
        elif preload_option == test_config.PRELOAD_LOAD_DEMO_COLLECTIONS:
            self._setup_reload_demo_collections(driver)
        elif preload_option == test_config.PRELOAD_RELOAD_DEMO_EXPS:
            self._setup_reload_demo_explorations(driver)
        elif preload_option == test_config.PRELOAD_RELOAD_FIRST_EXP:
            self._setup_reload_first_exploration(driver)
        else:
            raise Exception('Empty or invalid preload option.')
        self._stop_driver(driver)

    def load_url(self, page_url):
        """Loads the specified url, resulting in server-side caching of related
        resources. Used to obtain a uniform and warm-cache state for the tests,
        similar to a typical production server state.
        """
        driver = self._setup_driver(proxy=None, use_proxy=False)

        driver.get(page_url)

        self._stop_driver(driver)

    def get_page_metrics_from_uncached_session(self, page_url):
        """Returns a PageSessionMetrics domain object for a given page URL."""

        server, proxy = self._setup_proxy_server()
        driver = self._setup_driver(proxy=proxy, use_proxy=True)

        proxy.new_har(
            ref=page_url, options={'captureHeaders': True})
        driver.get(page_url)

        self._wait_until_page_load_is_finished()

        har_dict = proxy.har

        self._stop_proxy_server(server)
        self._stop_driver(driver)

        return perf_domain.PageSessionMetrics(
            page_session_stats=har_dict, page_session_timings=None)

    def get_page_metrics_from_cached_session(self, page_url):
        """Returns a PageSessionMetrics domain object for a given page URL
        while simulating a cached session i.e, a return user.

        Note: This method is stand-alone and does not require
        `get_page_session_metrics_for_url` to be called before it.
        """
        server, proxy = self._setup_proxy_server()
        driver = self._setup_driver(proxy=proxy, use_proxy=True)

        # Fetch the page once. This leads to caching of various resources.
        driver.get(page_url)
        self._wait_until_page_load_is_finished()

        # Start recording har data for the next page fetch.
        proxy.new_har(
            ref=page_url, options={'captureHeaders': True})
        driver.get(page_url)

        self._wait_until_page_load_is_finished()

        har_dict = proxy.har

        self._stop_proxy_server(server)
        self._stop_driver(driver)

        return perf_domain.PageSessionMetrics(
            page_session_stats=har_dict, page_session_timings=None)

    def get_page_timings_from_uncached_session(self, page_url):
        """Returns a PageSessionMetrics domain object initialized using
        page load timings for a page URL.
        """
        driver = self._setup_driver(proxy=None, use_proxy=False)

        driver.get(page_url)
        self._wait_until_page_load_is_finished()

        page_session_timings = (
            driver.execute_script("return window.performance"))

        self._stop_driver(driver)

        return perf_domain.PageSessionMetrics(
            page_session_stats=None, page_session_timings=page_session_timings)

    def get_page_timings_from_cached_session(self, page_url):
        """Returns a PageSessionMetrics domain object initialized using page
        load timings for a page URL while simulating a cached session i.e, a
        return user.
        """
        driver = self._setup_driver(proxy=None, use_proxy=False)

        # Fetch the page once. This leads to caching of various resources.
        driver.get(page_url)
        self._wait_until_page_load_is_finished()

        driver.get(page_url)
        self._wait_until_page_load_is_finished()

        page_session_timings = (
            driver.execute_script("return window.performance"))

        self._stop_driver(driver)

        return perf_domain.PageSessionMetrics(
            page_session_stats=None, page_session_timings=page_session_timings)

    def _wait_until_page_load_is_finished(self, time_duration_secs=None):
        # Waits for the complete page to load, otherwise XHR requests
        # made post initial page load will not be recorded.
        time.sleep(time_duration_secs or self.DEFAULT_WAIT_DURATION_SECS)

    def _setup_proxy_server(self, downstream_kbps=None, upstream_kbps=None,
                            latency=None):
        server = browsermobproxy.Server(BROWSERMOB_PROXY_PATH)
        server.start()
        proxy = server.create_proxy()

        # The proxy server is pretty sluggish, setting the limits might not
        # achieve the desired behavior.
        proxy_options = {}

        if downstream_kbps:
            proxy_options['downstream_kbps'] = downstream_kbps

        if upstream_kbps:
            proxy_options['upstream_kbps'] = upstream_kbps

        if latency:
            proxy_options['latency'] = latency

        if len(proxy_options.items()) > 0:
            proxy.limits(proxy_options)

        return server, proxy

    def _setup_driver(self, proxy=None, use_proxy=False):
        """Initializes a Selenium webdriver instance to programmatically
        interact with a browser.
        """
        driver = None
        if self.browser == 'chrome':
            chrome_options = webdriver.ChromeOptions()
            # Disable several subsystems which run network requests in the
            # background. This helps reduce noise when measuring network
            # performance. Also, disable prerendering by chrome which renders
            # a page in the background leading to wrong test results.
            chrome_options.add_argument("--disable-background-networking")
            chrome_options.add_argument("--prerender=disabled")
            chrome_options.add_argument("--prerender-from-omnibox=disabled")

            if use_proxy:
                proxy_url = urlparse.urlparse(proxy.proxy).path
                proxy_argument = "--proxy-server={0}".format(proxy_url)
                chrome_options.add_argument(proxy_argument)

            driver = webdriver.Chrome(
                CHROMEDRIVER_PATH,
                chrome_options=chrome_options)

        elif self.browser == 'firefox':
            firefox_profile = webdriver.FirefoxProfile()

            if use_proxy:
                firefox_profile.set_proxy(proxy.selenium_proxy())

            driver = webdriver.Firefox(firefox_profile=firefox_profile)

        self._add_cookie(driver)

        return driver

    def _add_cookie(self, driver):
        if self.dev_appserver_login_cookie:
            driver.get('%s%s' % (self.BASE_URL, feconf.ROBOTS_TXT_URL))
            driver.add_cookie(self.dev_appserver_login_cookie)

    def _stop_proxy_server(self, server):
        server.stop()

    def _stop_driver(self, driver):
        driver.quit()

    def _is_current_user_logged_in(self, driver):
        """Checks whether a user is already logged in."""
        driver.get(self.BASE_URL)
        self._wait_until_page_load_is_finished()
        resulting_url = driver.current_url

        if resulting_url == '%s%s' % (
                self.BASE_URL, feconf.CREATOR_DASHBOARD_URL):
            return False

        return True

    def _login_user(self, driver):
        driver.get(self.BASE_URL + self.LOGIN_URL)
        elem = driver.find_element_by_name('email')
        elem.clear()
        elem.send_keys(self.email)
        driver.find_element_by_name('admin').click()
        driver.find_element_by_id('submit-login').click()
        self._wait_until_page_load_is_finished()
        self._complete_signup(driver)
        self.dev_appserver_login_cookie = driver.get_cookie(
            'dev_appserver_login')

    def _complete_signup(self, driver):
        driver.get(self.BASE_URL + feconf.SIGNUP_URL)
        self._wait_until_page_load_is_finished()
        driver.find_element_by_css_selector(
            '.protractor-test-username-input').send_keys(self.username)
        driver.find_element_by_css_selector(
            '.protractor-test-agree-to-terms-checkbox').click()
        driver.find_element_by_css_selector(
            '.protractor-test-register-user').click()
        self._wait_until_page_load_is_finished()

    def _reload_demo_explorations(self, driver):
        driver.get(self.BASE_URL + feconf.ADMIN_URL)
        self._wait_until_page_load_is_finished()
        driver.find_element_by_css_selector(
            '.protractor-test-reload-all-explorations-button').click()
        driver.switch_to.alert.accept()
        self._wait_until_page_load_is_finished(
            time_duration_secs=20)

    def _reload_first_exploration(self, driver):
        driver.get(self.BASE_URL + feconf.ADMIN_URL)
        self._wait_until_page_load_is_finished()
        driver.find_element_by_css_selector(
            '.protractor-test-reload-exploration-button').click()
        driver.switch_to.alert.accept()
        self._wait_until_page_load_is_finished()

    def _reload_demo_collections(self, driver):
        driver.get(self.BASE_URL + feconf.ADMIN_URL)
        self._wait_until_page_load_is_finished()
        driver.find_element_by_css_selector(
            '.protractor-test-reload-collection-button').click()
        driver.switch_to.alert.accept()
        self._wait_until_page_load_is_finished(
            time_duration_secs=5)

    def _create_exploration(self, driver):
        driver.get(self.BASE_URL + feconf.CREATOR_DASHBOARD_URL)
        driver.find_element_by_css_selector(
            '.protractor-test-create-activity').click()
        self._wait_until_page_load_is_finished(
            time_duration_secs=1)
        driver.find_element_by_css_selector(
            '.protractor-test-create-exploration').click()
        self._wait_until_page_load_is_finished()
        new_exploration_url = driver.current_url
        return new_exploration_url

    def _setup_login(self, driver):
        self._login_user(driver)

    def _setup_reload_demo_explorations(self, driver):
        self._login_user(driver)
        self._reload_demo_explorations(driver)

    def _setup_reload_first_exploration(self, driver):
        self._login_user(driver)
        self._reload_first_exploration(driver)

    def _setup_reload_demo_collections(self, driver):
        self._login_user(driver)
        self._reload_demo_collections(driver)

    def _setup_create_exploration(self, driver):
        self._login_user(driver)
        self.exploration_url = self._create_exploration(driver)
