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

"""Selenium + browsermobproxy

This file contains selenium + browsermobproxy to fetch performance data.
"""

import urlparse
import os

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, '..', 'oppia_tools')

DIRS_TO_ADD_TO_SYS_PATH = [
    os.path.join(OPPIA_TOOLS_DIR, 'browsermob-proxy-0.7.1'),
    os.path.join(OPPIA_TOOLS_DIR, 'selenium-2.53.2')
]

from browsermobproxy import Server
from selenium import webdriver
from xvfbwrapper import Xvfb

CHROME_DRIVER_PATH = os.path.join(
    '..', 'node_modules', 'protractor', 'selenium', 'chromedriver_2.21')
CHROME_DRIVER = CHROME_DRIVER_PATH

BROWSERMOB_PROXY_PATH = os.path.join(
    '..', 'oppia_tools', 'browsermob-proxy-2.1.1', 'bin', 'browsermob-proxy')
BROWSERMOB_PROXY = BROWSERMOB_PROXY_PATH


class CaptureData(object):
    """Class to fetch performance data"""

    def __init__(self, browser='chrome'):
        if browser in ['chrome', 'firefox']:
            self.browser = browser
        else:
            # ToDo: Raise error here.
            pass

        if self.browser == 'chrome':
            os.environ["webdriver.chrome.driver"] = CHROME_DRIVER

        self.chrome_driver = CHROME_DRIVER
        self.browser_mob = BROWSERMOB_PROXY
        self.server = self.driver = self.proxy = None

    def check_valid_url(self, page_url):
        """Check if the url specified is valid."""
        pass

    def get_har(self, page_url):
        """Method to get HTTP Archive (HAR) for a page_url

        To get a HAR we require to use a proxy server.
        """
        with Xvfb() as xvfb:
            self._setup_proxy()
            self._setup_driver(use_proxy=True)

            self.check_valid_url(page_url)

            self.proxy.new_har(page_url, options={'captureHeaders': True})

            self.driver.get(page_url)

        result = self.proxy.har

        self._clear_proxy()
        self._clear_driver()

        return result

    def get_timings(self, page_url):
        """Method to get Timings data for a page_url"""
        with Xvfb() as xvfb:
            self._setup_driver(use_proxy=False)

            self.check_valid_url(page_url)

            self.driver.get(page_url)

            # Future ToDo: Firefox currently return function toJSON() for some keys.
            # It return values for window.performance.timing, which is precisely
            # what we need for now.
            # To get entries for all the resources:
            #   driver.execute_script("return window.performance.getEntries();")
            # To get only the timing:
            #   driver.execute_script("return window.performance.timing;")
            performance = self.driver.execute_script("return window.performance")

        self._clear_driver()

        return performance

    def _setup_proxy(self, downstream=None, upstream=None, latency=None):
        self.server = Server(self.browser_mob)
        self.server.start()
        self.proxy = self.server.create_proxy()

        # Set limits for the proxy server.
        limits_specified = False
        if downstream and upstream and latency:
            limits_specified = True
        if limits_specified:
            self.proxy.limits(
                {'downstream_kbps': downstream,
                 'upstream_kbps': upstream,
                 'latency': latency})

    def _setup_driver(self, use_proxy=False):

        if self.browser == 'chrome':
            chrome_options = webdriver.ChromeOptions()
            # To prevent background networking from interfering with our tests.
            chrome_options.add_argument("--disable-background-networking")

            if use_proxy and self._check_proxy():
                proxy_url = urlparse.urlparse(self.proxy.proxy).path
                chrome_options.add_argument("--proxy-server={0}".format(proxy_url))

            self.driver = webdriver.Chrome(self.chrome_driver, chrome_options=chrome_options)

        elif self.browser == 'firefox':
            firefox_profile = webdriver.FirefoxProfile()

            if use_proxy and self._check_proxy():
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

    def _check_proxy(self):
        if not self.proxy:
            # ToDo: Raise Error or start the proxy.
            pass

        return True

def main():
    """For testing"""
    capture = CaptureData(browser='firefox')
    url = "http://localhost:8181/splash"

    har = capture.get_har(url)
    performance = capture.get_timings(url)

    print performance
    print len(har['log']['entries'])

if __name__ == '__main__':
    main()
