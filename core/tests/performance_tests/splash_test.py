"""Tests for the splash page"""

import unittest
from test_utils import TestBase


class SplashPageTest(TestBase):
    """Tests for `splash page`."""

    # how do I call setUp only once before all the test cases.
    def setUp(self):
        super(SplashPageTest, self).setUp()
        splash_url = 'http://localhost:8181/splash'

        self._set_har(splash_url)
        self._set_timings(splash_url)
        self._fetch_stats()

        self.page_timings = self.process_data.result['timings']

    def test_total_size(self):
        """Is total size below 10,000,000 in bytes"""
        self.assertLessEqual(self.process_data.result['total_size'], 10000000)

    def test_load_time(self):
        """Is page load time below 3 secs"""
        self.assertLessEqual(self.page_timings['load_time'], 5)

# Need help to run all the test suites automatically.
if __name__ == '__main__':
    unittest.main()
