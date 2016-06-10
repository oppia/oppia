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
from test_utils import TestBase


class SplashPageTest(TestBase):
    """Tests for `splash page`."""

    def setUp(self):
        super(SplashPageTest, self).setUp()
        splash_url = 'http://localhost:8181/splash'

        self._set_har(splash_url)
        self._set_timings(splash_url)
        self._fetch_stats()

        self.page_timings = self.process_data.result['timings']

    def test_splash_page_metrics(self):
        """Test metrics for splash page."""
        #Is total size below 10,000,000 in bytes.
        self.assertLessEqual(self.process_data.result['total_size'], 10000000)

        #Is page load time below 3 secs.
        self.assertLessEqual(self.page_timings['load_time'], 5)


if __name__ == '__main__':
    unittest.main()
