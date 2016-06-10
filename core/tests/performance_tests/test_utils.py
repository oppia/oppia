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

"""Something here"""

# Need help refactoring this.
import sys
sys.path.insert(0, 'core/tests/performance_framework/')

from selenium_driver import CaptureData
from process_data import ProcessData

import unittest


class TestBase(unittest.TestCase):
    """Base class for tests."""

    def setUp(self):
        self.capture_data = CaptureData(browser='chrome')
        self.har = None
        self.timings = None
        self.process_data = None

    def _set_har(self, page_url):
        self.har = self.capture_data.get_har(page_url)

    def _set_timings(self, page_url):
        self.timings = self.capture_data.get_timings(page_url)

    def _fetch_stats(self):
        self.process_data = ProcessData(har=self.har, timings=self.timings)
        self.process_data.get_stats()
        print self.process_data.result
