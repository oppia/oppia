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
            connectEnd: the Unix time the user agent finishes establishing the
                connection to the server to retrive the current document.
            connectStart: the Unix time before the user agent starts
                establishing the connection to the server to retrive the
                document.
            domainLookupEnd: the Unix time the domain lookup ends.
            domainLookupStart: the Unix time the domain lookup starts.
            domComplete: the Unix time user agent sets the current document
                readiness to "complete".
            domInteractive: the Unix time the the parser finished its work on
                            the main document.
            domLoading: the Unix time the DOM started loading.
            fetchStart: the Unix time the page began loading.
            loadEventEnd: the Unix time the load event of the current document
                is completed.
            loadEventStart: the Unix time the load event of the current document
                is fired.
            navigationStart: the Unix time the prompt for unload terminates
                on the previous document in the same browsing context.
            redirectEnd: the Unix time the last HTTP redirect is completed, that
                is when the last byte of the HTTP response has been received.
            redirectStart: the Unix time the first HTTP redirect starts.
            requestStart: the Unix time the request started.
            responseEnd: the Unix time the request finished.
            responseStart: the Unix time the response started.
            unloadEventEnd: the Unix time the unload event handler finishes.
            unloadEventStart: the Unix time the unload event has been thrown.
    """

    TIMING_PROPERTIES = [
        'connectEnd', 'connectStart', 'domainLookupEnd', 'domainLookupStart',
        'domComplete', 'domInteractive', 'domLoading', 'fetchStart',
        'loadEventEnd', 'loadEventStart', 'navigationStart', 'redirectEnd',
        'redirectStart', 'requestStart', 'responseEnd', 'responseStart',
        'unloadEventEnd', 'unloadEventStart'
    ]

    def __init__(self, page_session_stats=None, page_session_timings=None):
        self.page_session_stats = page_session_stats
        self.page_session_timings = page_session_timings

        self.page_load_timings = {}
        if self.page_session_timings:
            self.page_load_timings = page_session_timings['timing']

        self._validate()
        self.print_details()

    def _validate(self):
        """Validates various properties of a PageSessionMetrics object."""
        if not self.page_session_stats and not self.page_session_timings:
            raise utils.ValidationError(
                'Expected one of page_session_stats or page_session_timings '
                'to be provided.')

        if self.page_session_stats:
            if 'log' not in self.page_session_stats:
                raise utils.ValidationError(
                    'Expected the page load stats to have a \'log\' entry')

            if 'entries' not in self.page_session_stats['log']:
                raise utils.ValidationError(
                    'Expected the log entry of the page load stats to include '
                    'an additional \'entries\' element')

            for entry in self.page_session_stats['log']['entries']:
                if '_error' in entry['response']:
                    raise utils.ValidationError(
                        'Expected a valid server response, found server '
                        'not reachable.')

            if self.get_request_count() == 0:
                raise utils.ValidationError(
                    'Expected the log entry of the page load stats to include '
                    'a positive number of requests.')

            if self.get_total_page_size_bytes() == 0:
                raise utils.ValidationError(
                    'Expected the total size of a page including all its '
                    'resources to be positive.')

        if self.page_session_timings:
            for timing_prop in self.TIMING_PROPERTIES:
                if timing_prop not in self.page_load_timings:
                    raise utils.ValidationError(
                        'Expected the timing entry of the page load timings to '
                        'include %s property' % timing_prop)

            if self.get_page_load_time_millisecs() < 0:
                raise utils.ValidationError(
                    'Expected the page load time to be positive.')
            if self.get_dom_ready_time_millisecs() < 0:
                raise utils.ValidationError(
                    'Expected the dom ready time to be positive.')
            if self.get_request_time_millisecs() < 0:
                raise utils.ValidationError(
                    'Expected the request time to be positive.')
            if self.get_ready_start_time_millisecs() < 0:
                raise utils.ValidationError(
                    'Expected the ready start time to be positive.')
            if self.get_redirect_time_millisecs() < 0:
                raise utils.ValidationError(
                    'Expected the redirect time to be positive.')
            if self.get_appcache_time_millisecs() < 0:
                raise utils.ValidationError(
                    'Expected the appcache time to be positive.')
            if self.get_unload_event_time_millisecs() < 0:
                raise utils.ValidationError(
                    'Expected the unload time to be positive.')
            if self.get_lookup_domain_time_millisecs() < 0:
                raise utils.ValidationError(
                    'Expected the domain lookup time to be positive.')
            if self.get_connect_time_millisecs() < 0:
                raise utils.ValidationError(
                    'Expected the connect time to be positive.')
            if self.get_init_dom_tree_time_millisecs() < 0:
                raise utils.ValidationError(
                    'Expected the init dom tree time to be positive.')
            if self.get_load_event_time_millisecs() < 0:
                raise utils.ValidationError(
                    'Expected the load time to be positive.')

    def get_request_count(self):
        """Returns the number of requests made prior to the page load
        completing.
        """
        return len(self.page_session_stats['log']['entries'])

    def get_total_page_size_bytes(self):
        """Returns the total size of a page including all of its resources."""
        total_size = 0

        for entry in self.page_session_stats['log']['entries']:
            total_size += int(entry['response']['bodySize'])

        return total_size

    def _get_duration_millisecs(self, event_end, event_initial):
        # Timestamps are in milliseconds.
        initial_timestamp = self.page_load_timings[event_initial]
        end_timestamp = self.page_load_timings[event_end]

        return end_timestamp - initial_timestamp

    def get_page_load_time_millisecs(self):
        """Returns the total page load time."""
        return self._get_duration_millisecs('loadEventEnd', 'fetchStart')

    def get_dom_ready_time_millisecs(self):
        """Returns the time spent constructing the dom tree."""
        return self._get_duration_millisecs('domComplete', 'domInteractive')

    def get_request_time_millisecs(self):
        """Returns the time spent during request."""
        return self._get_duration_millisecs('responseEnd', 'requestStart')

    def get_ready_start_time_millisecs(self):
        """Returns the time consumed preparing the new page."""
        return self._get_duration_millisecs('fetchStart', 'navigationStart')

    def get_redirect_time_millisecs(self):
        """Returns the time spent during redirection."""
        return self._get_duration_millisecs('redirectEnd', 'redirectStart')

    def get_appcache_time_millisecs(self):
        """Returns the time spent for appcache."""
        return self._get_duration_millisecs('domainLookupStart', 'fetchStart')

    def get_unload_event_time_millisecs(self):
        """Returns the time spent unloading documents."""
        return self._get_duration_millisecs(
            'unloadEventEnd', 'unloadEventStart')

    def get_lookup_domain_time_millisecs(self):
        """Returns the time spent for the domain name lookup for the current
        document.
        """
        return self._get_duration_millisecs(
            'domainLookupEnd', 'domainLookupStart')

    def get_connect_time_millisecs(self):
        """Returns the time spent for establishing the connection to the server
        to retrieve the current document.
        """
        return self._get_duration_millisecs('connectEnd', 'connectStart')

    def get_init_dom_tree_time_millisecs(self):
        """Returns the time from request to completion of DOM loading."""
        return self._get_duration_millisecs('domInteractive', 'responseEnd')

    def get_load_event_time_millisecs(self):
        """Returns the time spent for completion of the load event of the
        current document. The load event is fired when a resource and its
        dependent resources have finished loading.
        """
        return self._get_duration_millisecs('loadEventEnd', 'loadEventStart')

    def print_details(self):
        """Helper function to print details for all the events."""
        if self.page_session_stats:
            print 'Total number of requests: %d' % self.get_request_count()
            print ('Total page size in bytes: %d'
                   % self.get_total_page_size_bytes())
        else:
            print 'Page session stats are not available.'

        if self.page_session_timings:
            print 'Page load time: %d' % self.get_page_load_time_millisecs()
            print 'Dom ready time: %d' % self.get_dom_ready_time_millisecs()
            print 'Request time: %d' % self.get_request_time_millisecs()
            print 'Ready start time: %d' % self.get_ready_start_time_millisecs()
            print 'Redirect time: %d' % self.get_redirect_time_millisecs()
            print 'Appcache time: %d' % self.get_appcache_time_millisecs()
            print ('Unload event time: %d'
                   % self.get_unload_event_time_millisecs())
            print 'DNS query time: %d' % self.get_lookup_domain_time_millisecs()
            print ('TCP connection time: %d'
                   % self.get_connect_time_millisecs())
            print ('Init domtree time: %d'
                   % self.get_init_dom_tree_time_millisecs())
            print 'Load event time: %d' % self.get_load_event_time_millisecs()
        else:
            print 'Page session timings are not available.'


class MultiplePageSessionMetrics(object):
    """Domain object for multiple PageSessionMetrics to provide average
    metrics, so as to reduce the variation between statistics obtained during
    different page load sessions. This may happen due to various factors like
    background processes.
    """

    def __init__(self, page_session_metrics):
        self.page_metrics = page_session_metrics
        self._validate()

    def _validate(self):
        if not isinstance(self.page_metrics, list):
            raise utils.ValidationError(
                'Expected page_session_metrics to be a list, '
                'received %s' % self.page_metrics)

    def get_average_page_load_time_millisecs(self):
        """Returns the average total page load time (in milliseconds)."""
        return (sum(item.get_page_load_time_millisecs()
                    for item in self.page_metrics)) / len(self.page_metrics)

    def get_average_dom_ready_time_millisecs(self):
        """Returns the average dom ready time (in milliseconds)."""
        return (sum(item.get_dom_ready_time_millisecs()
                    for item in self.page_metrics)) / len(self.page_metrics)

    def get_average_request_time_millisecs(self):
        """Returns the average request time (in milliseconds)."""
        return (sum(item.get_request_time_millisecs()
                    for item in self.page_metrics)) / len(self.page_metrics)
