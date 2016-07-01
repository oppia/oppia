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
import random
import time
import urlparse
from browsermobproxy import Server
from selenium import webdriver

import feconf
from core.tests.performance_framework import perf_domain

CHROME_DRIVER_PATH = os.path.join(
    '..', 'node_modules', 'protractor', 'selenium', 'chromedriver_2.21')

BROWSERMOB_PROXY_PATH = os.path.join(
    '..', 'oppia_tools', 'browsermob-proxy-2.1.1', 'bin', 'browsermob-proxy')


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
    DEFAULT_BROWSER_SOURCE = 'chrome'
    SUPPORTED_BROWSER_SOURCES = ['chrome', 'firefox']

    # Duration (in seconds) to wait for the complete page to load, otherwise
    # XHR requests made post initial page load will not be recorded.
    WAIT_DURATION_SECS = 3

    BASE_URL = 'http://localhost:%d' % feconf.PERFORMANCE_TESTS_SERVER_PORT

    LIBRARY_URL_SUFFIX = '/library'
    EDITOR_URL_SLICE = '/create/'
    PLAYER_URL_SLICE = '/explore/'
    PROFILE_URL_SLICE = '/profile/'
    LOGIN_URL_SUFFIX = '/_ah/login'
    ADMIN_URL_SUFFIX = '/admin'
    DASHBOARD_URL_SUFFIX = '/dashboard'
    SPLASH_URL_SUFFIX = '/splash'
    SIGNUP_URL_SUFFIX = '/signup'
    DUMMY_URL = '/robots.txt'

    def __init__(self, browser=DEFAULT_BROWSER_SOURCE, preload_options=None):
        """preload_options:
            login: True if login is required.
            enable_explorations: True if explorations needs to be enabled.
            enable_collections: True if collections needs to be enabled.
            create_exploration: True if exploration needs to be created.
        """
        if browser in self.SUPPORTED_BROWSER_SOURCES:
            self.browser = browser
        else:
            error_msg = 'Unsupported browser specified: %s' % browser
            raise ValueError(error_msg)

        self.preload_options = preload_options
        self.exploration_url = None
        self.dev_appserver_login = None

        random_id = random.randint(1, 100000)
        self.email = 'test%d@example.com' % random_id
        self.username = 'username%d' % random_id
        self.username = self.preload_options.get('username', self.username)

        driver = self._setup_driver()
        if preload_options['login']:
            self._setup_login(driver)
        elif preload_options['enable_explorations']:
            self._setup_enable_explorations(driver)
        elif preload_options['enable_collections']:
            self._setup_enable_collections(driver)
        elif preload_options['create_exploration']:
            self._setup_create_exploration(driver)
        self._stop_driver(driver)

    def load_url(self, page_url):
        """Loads the specified url, resulting in server-side caching of related
        resources. Used to obtain a uniform and warm-cache state for the tests,
        similar to a typical production server state.
        """
        driver = self._setup_driver(proxy=None, use_proxy=False)

        get_page_url = page_url
        if self.exploration_url:
            get_page_url = self.exploration_url

        driver.get(get_page_url)

        self._stop_driver(driver)

    def get_page_metrics_for_url(self, page_url):
        """Returns a PageSessionMetrics domain object for a given page URL.
        """
        server, proxy = self._setup_proxy_server()
        driver = self._setup_driver(proxy=proxy, use_proxy=True)

        get_page_url = page_url
        if self.exploration_url:
            get_page_url = self.exploration_url

        proxy.new_har(get_page_url, options={'captureHeaders': True})
        driver.get(get_page_url)

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

        get_page_url = page_url
        if self.exploration_url:
            get_page_url = self.exploration_url
        # Fetch the page once. This leads to caching of various resources.
        driver.get(get_page_url)
        self._wait_until_page_load_is_finished()

        # Start recording har data for the next page fetch.
        proxy.new_har(get_page_url, options={'captureHeaders': True})
        driver.get(get_page_url)

        self._wait_until_page_load_is_finished()

        har_dict = proxy.har

        self._stop_proxy_server(server)
        self._stop_driver(driver)

        return perf_domain.PageSessionMetrics(
            page_session_stats=har_dict, page_session_timings=None)

    def get_page_timings_for_url(self, page_url):
        """Returns a PageSessionMetrics domain object initialized using
        page load timings for a page URL.
        """
        driver = self._setup_driver(proxy=None, use_proxy=False)

        get_page_url = page_url
        if self.exploration_url:
            get_page_url = self.exploration_url

        driver.get(get_page_url)
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

        get_page_url = page_url
        if self.exploration_url:
            get_page_url = self.exploration_url
        # Fetch the page once. This leads to caching of various resources.
        driver.get(get_page_url)
        self._wait_until_page_load_is_finished()

        driver.get(get_page_url)
        self._wait_until_page_load_is_finished()

        page_session_timings = (
            driver.execute_script("return window.performance"))

        self._stop_driver(driver)

        return perf_domain.PageSessionMetrics(
            page_session_stats=None, page_session_timings=page_session_timings)

    def _wait_until_page_load_is_finished(self, time_duration_secs=None):
        # Waits for the complete page to load, otherwise XHR requests
        # made post initial page load will not be recorded.
        time.sleep(time_duration_secs or self.WAIT_DURATION_SECS)

    def _setup_proxy_server(self, downstream_kbps=None, upstream_kbps=None,
                            latency=None):
        server = Server(BROWSERMOB_PROXY_PATH)
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
            # performance.
            chrome_options.add_argument("--disable-background-networking")

            if use_proxy:
                proxy_url = urlparse.urlparse(proxy.proxy).path
                proxy_argument = "--proxy-server={0}".format(proxy_url)
                chrome_options.add_argument(proxy_argument)

            driver = webdriver.Chrome(
                CHROME_DRIVER_PATH,
                chrome_options=chrome_options)

        elif self.browser == 'firefox':
            firefox_profile = webdriver.FirefoxProfile()

            if use_proxy:
                firefox_profile.set_proxy(proxy.selenium_proxy())

            driver = webdriver.Firefox(firefox_profile=firefox_profile)

        self._add_cookie(driver)

        return driver

    def _add_cookie(self, driver):
        if self.dev_appserver_login:
            driver.get('%s%s' % (self.BASE_URL, self.DUMMY_URL))
            driver.add_cookie({'name': 'dev_appserver_login',
                               'value': self.dev_appserver_login
                              })

    def _stop_proxy_server(self, server):
        server.stop()

    def _stop_driver(self, driver):
        driver.quit()

    def _check_login(self, driver):
        driver.get(self.BASE_URL)
        self._wait_until_page_load_is_finished()
        resulting_url = driver.current_url

        if resulting_url == '%s%s' % (self.BASE_URL, self.SPLASH_URL_SUFFIX):
            return False

        return True

    def _login_user(self, driver):
        driver.get(self.BASE_URL + self.LOGIN_URL_SUFFIX)
        elem = driver.find_element_by_name("email")
        elem.clear()
        elem.send_keys(self.email)
        driver.find_element_by_name('admin').click()
        driver.find_element_by_id('submit-login').click()
        self._wait_until_page_load_is_finished(5)
        self._complete_signup(driver)
        self._wait_until_page_load_is_finished()
        self.dev_appserver_login = driver.get_cookie('dev_appserver_login')

    def _complete_signup(self, driver):
        driver.get(self.BASE_URL + self.SIGNUP_URL_SUFFIX)
        self._wait_until_page_load_is_finished(5)
        driver.find_element_by_css_selector(
            '.protractor-test-username-input').send_keys(self.username)
        driver.find_element_by_css_selector(
            '.protractor-test-agree-to-terms-checkbox').click()
        driver.find_element_by_css_selector(
            '.protractor-test-register-user').click()
        self._wait_until_page_load_is_finished()

    def _reload_explorations(self, driver):
        driver.get(self.BASE_URL + self.ADMIN_URL_SUFFIX)
        self._wait_until_page_load_is_finished(5)
        driver.find_element_by_css_selector(
            '.protractor-test-reload-all-explorations-button').click()
        driver.switch_to.alert.accept()
        self._wait_until_page_load_is_finished(20)

    def _reload_collection(self, driver):
        driver.get(self.BASE_URL + self.ADMIN_URL_SUFFIX)
        self._wait_until_page_load_is_finished(5)
        driver.find_element_by_css_selector(
            '.protractor-test-reload-collection-button').click()
        driver.switch_to.alert.accept()
        self._wait_until_page_load_is_finished(5)

    def _create_exploration(self, driver):
        driver.get(self.BASE_URL + self.DASHBOARD_URL_SUFFIX)
        driver.find_element_by_css_selector(
            '.protractor-test-create-activity').click()
        self._wait_until_page_load_is_finished(2)
        driver.find_element_by_css_selector(
            '.protractor-test-create-exploration').click()
        self._wait_until_page_load_is_finished()
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
