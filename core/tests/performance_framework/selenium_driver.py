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

"""This file contains an implementation which interacts with Selenium and
Browsermob-proxy to fetch performance data.
"""

import urlparse
import os

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


class SeleniumPerformanceDataFetcher(object):
    """Fetches performance data for locally served Oppia pages using Selenium
    and Browsermob-proxy.

    Selenium is used to programitically interact with a browser.
    Browsermob-proxy is used to capture HTTP Archive(referred to as HAR) data.

    The HTTP Archive format or HAR, is a JSON-formatted archive file format for
    logging of a web browser's interaction with a site. It is used by a web
    browser to export detailed performance data about web pages it loads. It
    contains an entry for every resource required to load and display a
    web-page. Each entry contains the url requested, request and response
    headers.
    Refer: https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html
    """

    def __init__(self, browser='chrome'):
        if browser in ['chrome', 'firefox']:
            self.browser = browser
        else:
            raise ValueError

        if self.browser == 'chrome':
            os.environ["webdriver.chrome.driver"] = CHROME_DRIVER_PATH

        self.chrome_driver_path = CHROME_DRIVER_PATH
        self.browser_mob_path = BROWSERMOB_PROXY_PATH

        self.server = self.driver = self.proxy = None

    def get_har_dict(self, page_url):
        """Retrieve HTTP Archive (HAR) or page session stats for a page URL.

        To get it we require the use of a proxy server as we need to record the
        communication between server and client.
        """
        # pylint: disable=unused-variable
        with Xvfb() as xvfb:
        # pylint: enable=unused-variable
            self._setup_proxy()
            self._setup_driver(use_proxy=True)

            self.proxy.new_har(page_url, options={'captureHeaders': True})

            self.driver.get(page_url)

        har_dict = self.proxy.har

        self._clear_proxy()
        self._clear_driver()

        return har_dict

    def get_page_session_timings(self, page_url):
        """Retrieve page load timings for a page URL."""
        # pylint: disable=unused-variable
        with Xvfb() as xvfb:
        # pylint: enable=unused-variable
            self._setup_driver(use_proxy=False)

            self.driver.get(page_url)

            # To get entries for all the resources we can use:
            #   driver.execute_script("return window.performance.getEntries();")
            # To get only the timing we can use:
            #   driver.execute_script("return window.performance.timing;")
            page_session_timings = (
                self.driver.execute_script("return window.performance"))

        self._clear_driver()

        return page_session_timings

    def _setup_proxy(self, downstream_kbps=None, upstream_kbps=None,
                     latency=None):
        self.server = Server(self.browser_mob_path)
        self.server.start()
        self.proxy = self.server.create_proxy()

        # The proxy server is pretty sluggish, setting the limits might not
        # achieve the desired behavior.
        if downstream_kbps and upstream_kbps and latency:
            self.proxy.limits({
                'downstream_kbps': downstream_kbps,
                'upstream_kbps': upstream_kbps,
                'latency': latency
            })

    def _setup_driver(self, use_proxy=False):
        if self.browser == 'chrome':
            chrome_options = webdriver.ChromeOptions()
            # Disable several subsystems which run network requests in the
            # background. This is for use when doing network performance
            # testing to avoid noise in the measurements
            chrome_options.add_argument("--disable-background-networking")

            if use_proxy and self.proxy:
                proxy_url = urlparse.urlparse(self.proxy.proxy).path
                proxy_argument = "--proxy-server={0}".format(proxy_url)
                chrome_options.add_argument(proxy_argument)

            self.driver = webdriver.Chrome(
                self.chrome_driver_path,
                chrome_options=chrome_options)

        elif self.browser == 'firefox':
            firefox_profile = webdriver.FirefoxProfile()

            if use_proxy and self.proxy:
                firefox_profile.set_proxy(self.proxy.selenium_proxy())

            # pylint: disable=redefined-variable-type
            self.driver = webdriver.Firefox(firefox_profile=firefox_profile)
            # pylint: enable=redefined-variable-type

    def _clear_proxy(self):
        self.server.stop()
        self.proxy = None

    def _clear_driver(self):
        self.driver.quit()
        self.driver = None
