# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'


class PerfCounter(object):
    """Generic in-process integer counter; not aggregated across instances."""
    # TODO(sll): Add aggregation across instances.

    def __init__(self, name, description):
        if name in Registry.counters:
            raise Exception('Counter %s already exists.' % name)

        self._name = name
        self._description = description
        self._value = 0

        Registry.counters[self.name] = self

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
    counters = {}


MEMCACHE_STATE_HIT = PerfCounter(
    'memcache-state-hit',
    'Number of times a state object was found in memcache')
MEMCACHE_STATE_MISS = PerfCounter(
    'memcache-state-miss',
    'Number of times a state object was not found in memcache')
MEMCACHE_STATE_SET_SUCCESS = PerfCounter(
    'memcache-state-set-success',
    'Number of times a state object was successfully put in memcache')
MEMCACHE_STATE_SET_FAILURE = PerfCounter(
    'memcache-state-set-failure',
    'Number of times a state object failed to be put in memcache')
MEMCACHE_STATE_DELETE_SUCCESS = PerfCounter(
    'memcache-state-delete-success',
    'Number of times a state object was successfully deleted from memcache')
MEMCACHE_STATE_DELETE_MISSING = PerfCounter(
    'memcache-state-delete-missing',
    'Number of attempts to delete a non-existent state object from memcache')
MEMCACHE_STATE_DELETE_FAILURE = PerfCounter(
    'memcache-state-delete-failure',
    'Number of times a state object failed to be deleted from memcache')

MEMCACHE_EXPLORATION_HIT = PerfCounter(
    'memcache-exploration-hit',
    'Number of times an exploration object was found in memcache')
MEMCACHE_EXPLORATION_MISS = PerfCounter(
    'memcache-exploration-miss',
    'Number of times an exploration object was not found in memcache')
MEMCACHE_EXPLORATION_SET_SUCCESS = PerfCounter(
    'memcache-exploration-set-success',
    'Number of times an exploration object was put in memcache')
MEMCACHE_EXPLORATION_SET_FAILURE = PerfCounter(
    'memcache-exploration-set-failure',
    'Number of times an exploration object was put in memcache')
MEMCACHE_EXPLORATION_DELETE_SUCCESS = PerfCounter(
    'memcache-exploration-delete-success',
    'Number of times an exploration object was successfully deleted from '
    'memcache')
MEMCACHE_EXPLORATION_DELETE_MISSING = PerfCounter(
    'memcache-exploration-delete-missing',
    'Number of attempts to delete a non-existent exploration object from '
    'memcache')
MEMCACHE_EXPLORATION_DELETE_FAILURE = PerfCounter(
    'memcache-exploration-delete-failure',
    'Number of times an exploration object failed to be deleted from memcache')
