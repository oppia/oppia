# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Services for performance counters."""


class PerfCounter(object):
    """Generic in-process numeric counter; not aggregated across instances."""
    # TODO(sll): Add aggregation across instances.

    def __init__(self, name, description):
        if name in Registry.get_all_counter_names():
            raise Exception('Counter %s already exists.' % name)

        self._name = name
        self._description = description
        self._value = 0

        Registry.register_counter(self.name, self)

    def inc(self, increment=1):
        """Increments the counter value by a given increment."""
        self._value += increment

    @property
    def name(self):
        return self._name

    @property
    def description(self):
        return self._description

    @property
    def value(self):
        return self._value


class Registry(object):
    """Registry of all counters."""
    _counters = {}

    @classmethod
    def get_all_counter_names(cls):
        return cls._counters.keys()

    @classmethod
    def get_all_counters(cls):
        return cls._counters.values()

    @classmethod
    def register_counter(cls, name, counter_class):
        cls._counters[name] = counter_class


MEMCACHE_HIT = PerfCounter(
    'memcache-hit',
    'Number of times an object was found in memcache')
MEMCACHE_MISS = PerfCounter(
    'memcache-miss',
    'Number of times an object was not found in memcache')
MEMCACHE_SET_SUCCESS = PerfCounter(
    'memcache-set-success',
    'Number of times an object was successfully put in memcache')
MEMCACHE_SET_FAILURE = PerfCounter(
    'memcache-set-failure',
    'Number of times an object failed to be put in memcache')
MEMCACHE_DELETE_SUCCESS = PerfCounter(
    'memcache-delete-success',
    'Number of times an object was successfully deleted from memcache')
MEMCACHE_DELETE_MISSING = PerfCounter(
    'memcache-delete-missing',
    'Number of attempts to delete a non-existent object from memcache')
MEMCACHE_DELETE_FAILURE = PerfCounter(
    'memcache-delete-failure',
    'Number of times an object failed to be deleted from memcache')

HTML_RESPONSE_TIME_SECS = PerfCounter(
    'html-response-time-secs',
    'Total processing time for all HTML responses, in seconds')
HTML_RESPONSE_COUNT = PerfCounter(
    'html-response-count',
    'Number of times a HTML response was sent out')
JSON_RESPONSE_TIME_SECS = PerfCounter(
    'json-response-time-secs',
    'Total processing time for all JSON responses, in seconds')
JSON_RESPONSE_COUNT = PerfCounter(
    'json-response-count',
    'Number of times a JSON response was sent out')

EMAILS_SENT = PerfCounter(
    'emails-sent',
    'Number of times a call to send_mail() was made')
