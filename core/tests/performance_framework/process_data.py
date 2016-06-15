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

"""Contains domain objects for storing page session stats as provided by a
HTTP Archive file (also referred to as HAR).

Selenium and Browsermob-proxy are used for capturing session information, such
as load times and page size statistics. Timing statistics are retrieved directly
from the browser console rather than the proxy server, as the latter is sluggish
and gives inaccurate timings.
"""

import utils


class PageSessionMetrics(object):
    """Contains methods to process stats and provide performance metrics.

    page_session_stats is a dictionary containing page load statistics from an
    HTTP Archive.
    (https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html)

    page_session_timings is a dictionary containing metrics associated with page
    loading and includes the following keys:

        timing: maps to a dict containing the keys (all in milliseconds):
            domLoading: the Unix time the DOM started loading
            fetchStart: the Unix time the page began loading
            responseStart: the Unix time the response started
            loadEventEnd: the Unix time the page finished loading
            requestStart: the Unix time the request started
            responseEnd: the Unix time the request finished
            domComplete: the Unix time the DOM finished loading
            domInteractive: the Unix time the the parser finished its work on
                            the main document
    """

    TIMING_PROPERTIES = [
        'loadEventEnd', 'fetchStart', 'domComplete', 'domInteractive',
        'responseEnd', 'requestStart'
        ]

    def __init__(self, page_session_stats=None, page_session_timings=None):
        self.page_session_stats = page_session_stats
        self.page_session_timings = page_session_timings

        self.page_load_timings = {}
        if self.page_session_timings:
            self.page_load_timings = page_session_timings['timing']

        self._validate()

    def _validate(self):
        """Validates various properties of a PageSessionMetrics object."""
        if not self.page_session_stats and not self.page_session_timings:
            raise utils.ValidationError(
                'Expected atleast one argument among page_session_stats or '
                'page_session_timings to be present.')

        if self.page_session_stats:
            if 'log' not in self.page_session_stats:
                raise utils.ValidationError(
                    'Expected the page load stats to have a \'log\' entry')

            if 'entries' not in self.page_session_stats['log']:
                raise utils.ValidationError(
                    'Expected the log entry of the page load stats to include'
                    'an additional \'entries\' element')

        if self.page_session_timings:
            for timing_prop in self.TIMING_PROPERTIES:
                if timing_prop not in self.page_load_timings:
                    raise utils.ValidationError(
                        'Expected the timing entry of the page load timings to'
                        'include %s property' % timing_prop)

    def get_request_count(self):
        """Returns the number of requests made prior to the page load
        completing."""
        request_count = 0

        request_count = len(self.page_session_stats['log']['entries'])

        if request_count == 0:
            raise Exception('Total requests cannot be 0.')

        return request_count

    def get_total_page_size_bytes(self):
        """Returns the total size of a page including all of its resources."""
        total_size = 0

        for entry in self.page_session_stats['log']['entries']:
            total_size += int(entry['response']['bodySize'])

        if total_size <= 0:
            raise Exception('Total page size should be positive.')

        return total_size

    def _get_duration_secs(self, event_end, event_initial):
        # Check if timestamps are seconds or milliseconds.
        # From: http://goo.gl/iHNYWx
        initial_timestamp = self.page_load_timings[event_initial]

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
        """Returns the total page load time (in seconds)."""
        return self._get_duration_secs('loadEventEnd', 'fetchStart')

    def get_dom_ready_time_secs(self):
        """Returns the total dom ready time (in seconds)."""
        return self._get_duration_secs('domComplete', 'domInteractive')

    def get_request_time_secs(self):
        """Returns the total request time (in seconds)."""
        return self._get_duration_secs('responseEnd', 'requestStart')
