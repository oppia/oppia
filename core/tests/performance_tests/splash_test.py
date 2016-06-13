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

"""Tests for the splash page"""

import unittest
import os
import sys

CURR_DIR = os.path.abspath(os.getcwd())
sys.path.insert(0, os.path.join(CURR_DIR))

# pylint: disable=import-error, wrong-import-position
from core.tests.performance_tests import base


class SplashPagePerformanceTest(base.TestBase):
    """Tests for the splash page."""

    def setUp(self):
        super(SplashPagePerformanceTest, self).setUp()
        splash_url = 'http://localhost:8181/splash'

        self._set_page_session_stats(splash_url)
        self._set_page_session_timings(splash_url)
        self._set_stats()

    def test_splash_page_has_less_than_10_megabytes_sent_to_the_client(self):
        """"Is total size below 10,000,000 in bytes."""
        self.assertLessEqual(
            self.page_metrics.get_total_page_size_bytes(), 10000000)

    def test_splash_page_loads_under_5_seconds(self):
        """Is page load time below 5 secs."""
        self.assertLessEqual(self.page_metrics.get_page_load_time_secs(), 5)


if __name__ == '__main__':
    unittest.main()
