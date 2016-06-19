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
from browsermobproxy import Server
from selenium import webdriver

# Used for headless testing i.e, making browser windows invisible to the user.
from xvfbwrapper import Xvfb

from core.tests.performance_framework import perf_domain

CHROME_DRIVER_PATH = os.path.join(
    '..', 'node_modules', 'protractor', 'selenium', 'chromedriver_2.21')

BROWSERMOB_PROXY_PATH = os.path.join(
    '..', 'oppia_tools', 'browsermob-proxy-2.1.1', 'bin', 'browsermob-proxy')


class SeleniumPerformanceDataFetcher(object):
    """Fetches performance data for locally served Oppia pages using Selenium
    and Browsermob-proxy.

    Selenium is used to programitically interact with a browser.
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

    def __init__(self, browser=DEFAULT_BROWSER_SOURCE):
        if browser in self.SUPPORTED_BROWSER_SOURCES:
            self.browser = browser
        else:
            error_msg = 'Unsupported browser specified: %s' % browser
            raise ValueError(error_msg)

    def get_page_metrics_for_url(self, page_url):
        """Returns a PageSessionMetrics domain object for a given page URL.
        """
        with Xvfb() as _:
            server, proxy = self._setup_proxy_server()
            driver = self._setup_driver(proxy=proxy, use_proxy=True)

            proxy.new_har(page_url, options={'captureHeaders': True})

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
        with Xvfb() as _:
            server, proxy = self._setup_proxy_server()
            driver = self._setup_driver(proxy=proxy, use_proxy=True)

            # Fetch the page once. This leads to caching of various resources.
            driver.get(page_url)
            self._wait_until_page_load_is_finished()

            # Start recording har data for the next page fetch.
            proxy.new_har(page_url, options={'captureHeaders': True})
            driver.get(page_url)

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
        with Xvfb() as _:
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
        with Xvfb() as _:
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

    def _wait_until_page_load_is_finished(self):
        # Waits for the complete page to load, otherwise XHR requests
        # made post initial page load will not be recorded.
        time.sleep(self.WAIT_DURATION_SECS)

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

        return driver

    def _stop_proxy_server(self, server):
        server.stop()

    def _stop_driver(self, driver):
        driver.quit()
