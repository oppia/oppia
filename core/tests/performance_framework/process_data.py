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

"""Script to process page loading stats or HTTP Archive(also referred to as HAR)
data and/or timing stats to obtain stats/metrics for the corresponding page.

We need selenium + browsermob-proxy to capture page loading session
(or HTTP Archive), to obtain page size stats. However, owing to the sluggish
nature of the proxy server, timing stats are not accurate.
Hence, we have separate timing stats which are obtained without making
use of the proxy, directly from the browser console.
"""


class PageSessionMetricsRetriever(object):
    """Contains methods to process stats and provide performance metrics.

    page_session_stats if a dictionary containing page load statistics or
    HTTP Archive (HAR).
    Refer: https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html

    page_session_timings is a dictionary containing various timings associated
    with a page load like request time, dom load time, etc.
    Structure:
        {
          "webkitClearResourceTimings": {},
          "memory": {...},
          "timing": {
            "domLoading": 1465470586738,
            "fetchStart": 1465470583251,
          }
        }
    """

    def __init__(self, page_session_stats, page_session_timings):
        self.page_session_stats = page_session_stats
        self.page_session_timings = page_session_timings

        self.page_load_timings = {}
        if 'timing' not in self.page_session_timings:
            raise ValueError('page_session_timings missing key: timing')

        self.page_load_timings = page_session_timings['timing']

    def get_request_count(self):
        """Return no of requests made for the page load."""
        request_count = 0

        if 'log' in self.page_session_stats:
            if 'entries' in self.page_session_stats['log']:
                request_count = len(self.page_session_stats['log']['entries'])

        if request_count == 0:
            raise Exception('Total requests cannot be 0.')

        return request_count

    def get_total_page_size_bytes(self):
        """Return total page size which includes the size of all resources
        for a page.
        """
        total_size = 0

        if 'log' in self.page_session_stats:
            if 'entries' in self.page_session_stats['log']:
                for entry in self.page_session_stats['log']['entries']:
                    total_size += int(entry['response']['bodySize'])

        if total_size <= 0:
            raise Exception('Total page size should be positive.')

        return total_size

    def _get_duration_secs(self, event_end, event_initial):
        # Check if timestamps are seconds or milliseconds.
        # From: http://goo.gl/iHNYWx
        if event_initial not in self.page_load_timings:
            error_msg = 'page_load_timings missing key: %s' % event_initial
            raise ValueError(error_msg)

        initial_timestamp = self.page_load_timings[event_initial]

        if event_end not in self.page_load_timings:
            error_msg = 'page_load_timings missing key: %s' % event_end
            raise ValueError(error_msg)

        end_timestamp = self.page_load_timings[event_end]

        # If milliseconds convert to seconds.
        if len(str(initial_timestamp)) >= 13:
            initial_timestamp /= 1000.0

        if len(str(end_timestamp)) >= 13:
            end_timestamp /= 1000.0

        duration_secs = end_timestamp - initial_timestamp

        if duration_secs < 0:
            error_msg = (
                'Time duration cannot be negative. Events: %s and %s'
                % (event_initial, event_end)
                )
            raise Exception(error_msg)

        return duration_secs

    def get_page_load_time_secs(self):
        """Return total page load time"""
        return self._get_duration_secs('loadEventEnd', 'fetchStart')

    def get_dom_ready_time_secs(self):
        """Return dom ready time"""
        return self._get_duration_secs('domComplete', 'domInteractive')

    def get_request_time_secs(self):
        """Return time required to make requests"""
        return self._get_duration_secs('responseEnd', 'requestStart')
