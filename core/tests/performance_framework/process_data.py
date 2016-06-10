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

"""Script to process HAR data and timing data"""

import datetime
import dateutil.relativedelta


class ProcessData(object):
    """Class that contains methods to process data and get us metrics"""

    def __init__(self, har=None, timings=None):
        self.har = har
        self.timings = timings
        self.page_load_timings = None
        self.result = {
            'no_requests': -1,
            'total_size': -1, #in bytes
            'timings': {
                'load_time': -1,
                'dom_ready_time': -1,
                'request_time': -1
            }
        }

    def get_stats(self):
        """Call all the methods"""
        self.result['no_requests'] = self._get_no_requests()
        self.result['total_size'] = self._get_total_size()
        self.result['timings'] = self._get_timings(self.result['timings'])

    def _get_no_requests(self):
        no_requests = 0

        if 'log' in self.har:
            if 'entries' in self.har['log']:
                no_requests = len(self.har['log']['entries'])

        return no_requests

    def _get_total_size(self):
        total_size = 0

        for entry in self.har['log']['entries']:
            total_size += int(entry['response']['bodySize'])

        return total_size

    def _get_delta(self, event_end, event_initial):
        return get_diff(self.page_load_timings[event_initial]/1000.0,
                        self.page_load_timings[event_end]/1000.0)

    def _get_timings(self, options):
        # If self.timings is not set, this is the case where
        # only the har is available. So, get timings from har file.
        if self.timings is None:
            return

        self.page_load_timings = self.timings['timing']
        for key in options:
            time_delta = -1

            if key == 'load_time':
                time_delta = self._get_delta('loadEventEnd', 'fetchStart')
            elif key == 'dom_ready_time':
                time_delta = self._get_delta('domComplete', 'domInteractive')
            elif key == 'request_time':
                time_delta = self._get_delta('responseEnd', 'requestStart')

            options[key] = time_delta

        return options


def get_diff(epoch_initial, epoch_end):
    """Get seconds"""
    dt1 = datetime.datetime.fromtimestamp(epoch_initial) # 1973-11-29 22:33:09
    dt2 = datetime.datetime.fromtimestamp(epoch_end) # 1977-06-07 23:44:50
    dt_diff = dateutil.relativedelta.relativedelta(dt2, dt1)

    return dt_diff.minutes*60 + dt_diff.seconds + dt_diff.microseconds/1000000
