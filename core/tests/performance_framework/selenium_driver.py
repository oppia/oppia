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

# We need to import browsermob-proxy and selenium. To do so, we need to add
# add their directories to path.
CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, '..', 'oppia_tools')

DIRS_TO_ADD_TO_SYS_PATH = [
    os.path.join(OPPIA_TOOLS_DIR, 'browsermob-proxy-0.7.1'),
    os.path.join(OPPIA_TOOLS_DIR, 'selenium-2.53.2'),
    os.path.join(OPPIA_TOOLS_DIR, 'xvfbwrapper-0.2.8')
]

# pylint: disable=import-error, wrong-import-position
from browsermobproxy import Server
from selenium import webdriver

# Used for headless testing i.e, making browser windows invisible to the user.
from xvfbwrapper import Xvfb
# pylint: enable=import-error, wrong-import-position

CHROME_DRIVER_PATH = os.path.join(
    '..', 'node_modules', 'protractor', 'selenium', 'chromedriver_2.21')

BROWSERMOB_PROXY_PATH = os.path.join(
    '..', 'oppia_tools', 'browsermob-proxy-2.1.1', 'bin', 'browsermob-proxy')

WAIT_DURATION = 0


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
    """

    # Chrome is the default browser that selenium will use for extracting
    # performance stats.
    DEFAULT_BROWSER_SOURCE = 'chrome'
    SUPPORTED_BROWSER_SOURCES = ['chrome', 'firefox']

    def __init__(self, browser=DEFAULT_BROWSER_SOURCE):
        if browser in self.SUPPORTED_BROWSER_SOURCES:
            self.browser = browser
        else:
            error_msg = 'Unsupported browser specified: %s' % browser
            raise ValueError(error_msg)

        self.server = self.driver = self.proxy = None

    def get_har_dict(self, page_url):
        """Retrieves an HTTP Archive (HAR) dict for a given page URL.

        The HAR dict is retrieved using the proxy server by recording the
        communication between the client and server.
        """
        with Xvfb() as _xvfb:
            self._setup_proxy()
            self._setup_driver(use_proxy=True)

            self.proxy.new_har(page_url, options={'captureHeaders': True})

            self.driver.get(page_url)

            # Wait for the complete page to load, otherwise XHR requests made
            # after page load will not be recorded.
            time.sleep(WAIT_DURATION)

        har_dict = self.proxy.har

        self._stop_proxy()
        self._stop_driver()

        return har_dict

    def get_har_dict_cached_state(self, page_url):
        """Retrieve HTTP Archive (HAR) or page session stats for a page URL
        while simulating a cached state i.e, a return user.

        To get it we require the use of a proxy server as we need to record the
        communication between server and client.
        """
        with Xvfb() as _xvfb:
            self._setup_proxy()
            self._setup_driver(use_proxy=True)

            # Fetch the page once. This leads to caching of various resources.
            self.driver.get(page_url)

            # Start recording har data for the next page fetch.
            self.proxy.new_har(page_url, options={'captureHeaders': True})
            self.driver.get(page_url)

            # Wait for the complete page to load, otherwise XHR requests made
            # after page load will not be recorded.
            time.sleep(WAIT_DURATION)

        har_dict = self.proxy.har

        self._stop_proxy()
        self._stop_driver()

        return har_dict

    def get_page_session_timings(self, page_url):
        """Retrieve page load timings for a page URL."""
        with Xvfb() as _xvfb:
            self._setup_driver(use_proxy=False)

            self.driver.get(page_url)
            # Wait for the complete page to load, otherwise XHR requests made
            # after page load will not be recorded.
            time.sleep(WAIT_DURATION)

            page_session_timings = (
                self.driver.execute_script("return window.performance"))


        self._stop_driver()

        return page_session_timings

    def get_page_session_timings_cached_state(self, page_url):
        """Retrieve page load timings for a page URL while simulating a
        cached state i.e, a return user.
        """
        with Xvfb() as _xvfb:
            self._setup_driver(use_proxy=False)

            # Fetch the page once. This leads to caching of various resources.
            self.driver.get(page_url)
            # Wait for the complete page to load, otherwise XHR requests made
            # after page load will not be recorded.
            time.sleep(WAIT_DURATION)

            self.driver.get(page_url)
            # Wait for the complete page to load, otherwise XHR requests made
            # after page load will not be recorded.
            time.sleep(WAIT_DURATION)

            page_session_timings = (
                self.driver.execute_script("return window.performance"))

        self._stop_driver()

        return page_session_timings

    def _setup_proxy(self, downstream_kbps=None, upstream_kbps=None,
                     latency=None):
        self.server = Server(BROWSERMOB_PROXY_PATH)
        self.server.start()
        self.proxy = self.server.create_proxy()

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
            self.proxy.limits(proxy_options)

    def _setup_driver(self, use_proxy=False):
        """Initialize a Selenium webdrive instance to programmatically interact
        with a browser.
        """
        if self.browser == 'chrome':
            chrome_options = webdriver.ChromeOptions()
            # Disable several subsystems which run network requests in the
            # background. This helps reduce noise when measuring network
            # performance.
            chrome_options.add_argument("--disable-background-networking")

            if use_proxy:
                proxy_url = urlparse.urlparse(self.proxy.proxy).path
                proxy_argument = "--proxy-server={0}".format(proxy_url)
                chrome_options.add_argument(proxy_argument)

            self.driver = webdriver.Chrome(
                CHROME_DRIVER_PATH,
                chrome_options=chrome_options)

        elif self.browser == 'firefox':
            firefox_profile = webdriver.FirefoxProfile()

            if use_proxy:
                firefox_profile.set_proxy(self.proxy.selenium_proxy())

            # pylint: disable=redefined-variable-type
            self.driver = webdriver.Firefox(firefox_profile=firefox_profile)
            # pylint: enable=redefined-variable-type

    def _stop_proxy(self):
        self.server.stop()
        self.proxy = None

    def _stop_driver(self):
        self.driver.quit()
        self.driver = None
