"""Selenium + browsermobproxy

This file contains selenium + browsermobproxy to fetch performance data.
"""

import urlparse
import os

from browsermobproxy import Server
from selenium import webdriver
# from xvfbwrapper import Xvfb

# Help Needed:
# Need to curl both these binaries and install them with the setup process.
# Also, need references to them to use here.
# pylint: disable=line-too-long
CHROME_DRIVER = '/home/vg/Desktop/gsoc/opensource/node_modules/protractor/selenium/chromedriver_2.21'
# pylint: enable=line-too-long
BROWSERMOB_PROXY = '/home/vg/Downloads/perf-oppia/browsermob-proxy-2.1.1/bin/browsermob-proxy'


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
