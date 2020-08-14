# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for methods in the redis_cache_services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform.cache import redis_cache_services
from core.tests import test_utils


class RedisCacheServicesUnitTests(test_utils.GenericTestBase):
    """Tests for redis_cache_services."""

    def test_memory_stats_returns_dict(self):
        memory_stats = redis_cache_services.get_memory_cache_stats()
        self.assertIsNotNone(memory_stats.total_allocated_in_bytes)
        self.assertIsNotNone(memory_stats.peak_memory_usage_in_bytes)
        self.assertIsNotNone(memory_stats.total_number_of_keys_stored)

    def test_flush_cache_wipes_cache_clean(self):
        key_value_mapping = {'a': 1, 'b': True, 'c': [None, 1, False]}
        redis_cache_services.set_multi(key_value_mapping)
        self.assertEqual(
            redis_cache_services.get_multi(
                ['a', 'b', 'c']), [1, True, [None, 1, False]])
        redis_cache_services.flush_cache()
        self.assertEqual(
            redis_cache_services.get_multi(
                ['a', 'b', 'c']), [None, None, None])

    def test_get_multi_retrieves_cache_elements(self):
        self.assertEqual(
            redis_cache_services.get_multi(['a', 'b', 'c']), [None, None, None])
        self.assertEqual(
            redis_cache_services.get_multi(['d', 'e']), [None, None])

        key_value_mapping = {'a': 1, 'b': True, 'c': [None, 1, False]}
        redis_cache_services.set_multi(key_value_mapping)
        self.assertEqual(
            redis_cache_services.get_multi(
                ['a', 'b', 'c']), [1, True, [None, 1, False]])

    def test_set_multi_sets_elements(self):
        key_value_mapping = {'a': 1, 'b': True, 'c': [None, 1, False]}
        response = redis_cache_services.set_multi(key_value_mapping)
        self.assertTrue(response)

    def test_delete_multi_deletes_cache_elements(self):
        key_value_mapping = {'a': 1, 'b': True, 'c': [None, 1, False]}
        redis_cache_services.set_multi(key_value_mapping)
        self.assertEqual(
            redis_cache_services.get_multi(
                ['a', 'b', 'c']), [1, True, [None, 1, False]])
        return_number_of_keys_set = redis_cache_services.delete_multi(
            ['a', 'b', 'c'])
        self.assertEqual(
            redis_cache_services.get_multi(['a', 'b', 'c']), [None, None, None])
        self.assertEqual(return_number_of_keys_set, 3)

        return_number_of_keys_set = redis_cache_services.delete_multi(
            ['d', 'e', 'f'])
        self.assertEqual(return_number_of_keys_set, 0)

    def test_partial_fetches_returns_reasonable_output(self):
        self.assertEqual(
            redis_cache_services.get_multi(['a', 'b', 'c']), [None, None, None])

        key_value_mapping = {'a': 1, 'b': True, 'c': [None, 1, False]}
        redis_cache_services.set_multi(key_value_mapping)

        self.assertEqual(
            redis_cache_services.get_multi(['a', 'z', 'd']), [1, None, None])
        self.assertEqual(
            redis_cache_services.get_multi(['x', 'b', 'd']), [None, True, None])

    def test_partial_deletes_deletes_correct_elements(self):

        key_value_mapping = {'a': 1, 'b': True, 'c': [None, 1, False]}
        redis_cache_services.set_multi(key_value_mapping)
        self.assertEqual(
            redis_cache_services.get_multi(
                ['a', 'b', 'c']), [1, True, [None, 1, False]])
        self.assertEqual(
            redis_cache_services.delete_multi(['a', 'd', 'e']), 1)
        self.assertEqual(
            redis_cache_services.get_multi(
                ['a', 'b', 'c']), [None, True, [None, 1, False]])
