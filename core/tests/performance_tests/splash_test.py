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

"""Performance tests for the splash page."""

from core.tests.performance_tests import base


class SplashPagePerformanceTest(base.TestBase):
    """Performance tests for the splash page."""

    SPLASH_URL = 'http://localhost:9501/splash'

    def setUp(self):
        super(SplashPagePerformanceTest, self).setUp()

    def test_splash_page_has_less_than_10_megabytes_sent_to_the_client(self):
        self._record_page_metrics_for_url(self.SPLASH_URL)

        self.assertLessEqual(
            self.page_metrics.get_total_page_size_bytes(), 10000000)

    def test_splash_page_loads_under_10_seconds(self):
        self._record_page_timings_for_url(self.SPLASH_URL)

        self.assertLessEqual(
            self.page_metrics.get_page_load_time_millisecs(), 10000)


class SplashPagePerformanceForCachedStateTest(base.TestBase):
    """Performance tests for the splash page for the cached state or
    return user.
    """
    SPLASH_URL = 'http://localhost:9501/splash'

    def setUp(self):
        super(SplashPagePerformanceForCachedStateTest, self).setUp()

    def test_splash_page_has_less_than_1_megabytes_sent_to_the_client(self):
        self._record_page_metrics_from_cached_session(self.SPLASH_URL)

        self.assertLessEqual(
            self.page_metrics.get_total_page_size_bytes(), 1000000)

    def test_splash_page_loads_under_3_seconds(self):
        self._record_page_timings_from_cached_session(self.SPLASH_URL)

        self.assertLessEqual(
            self.page_metrics.get_page_load_time_millisecs(), 3000)
