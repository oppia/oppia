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

from __future__ import annotations

import os

from core import feconf
from core import utils
from core.platform.cache import redis_cache_services
from core.tests import test_utils
from scripts import common


class RedisCacheServicesUnitTests(test_utils.TestBase):
    """Tests for redis_cache_services."""

    def test_memory_stats_returns_dict(self) -> None:
        memory_stats = redis_cache_services.get_memory_cache_stats()
        self.assertIsNotNone(memory_stats.total_allocated_in_bytes)
        self.assertIsNotNone(memory_stats.peak_memory_usage_in_bytes)
        self.assertIsNotNone(memory_stats.total_number_of_keys_stored)

    def test_flush_cache_wipes_cache_clean(self) -> None:
        redis_cache_services.flush_caches()
        key_value_mapping = {'a1': '1', 'b1': '2', 'c1': '3'}
        redis_cache_services.set_multi(key_value_mapping)
        self.assertEqual(
            redis_cache_services.get_multi(['a1', 'b1', 'c1']), ['1', '2', '3'])
        redis_cache_services.flush_caches()
        self.assertEqual(
            redis_cache_services.get_multi(['a1', 'b1', 'c1']),
            [None, None, None]
        )

    def test_get_multi_retrieves_cache_elements(self) -> None:
        redis_cache_services.flush_caches()
        self.assertEqual(
            redis_cache_services.get_multi(['a2', 'b2', 'c2']),
            [None, None, None])
        self.assertEqual(
            redis_cache_services.get_multi(['d2', 'e2']), [None, None])

        key_value_mapping = {'a2': '1', 'b2': '2', 'c2': '3'}
        redis_cache_services.set_multi(key_value_mapping)
        self.assertEqual(
            redis_cache_services.get_multi(['a2', 'b2', 'c2']), ['1', '2', '3'])

    def test_set_multi_sets_elements(self) -> None:
        redis_cache_services.flush_caches()
        key_value_mapping = {'a3': '1', 'b3': '2', 'c3': '3'}
        response = redis_cache_services.set_multi(key_value_mapping)
        self.assertTrue(response)

    def test_delete_multi_deletes_cache_elements(self) -> None:
        redis_cache_services.flush_caches()
        key_value_mapping = {'a4': '1', 'b4': '2', 'c4': '3'}
        redis_cache_services.set_multi(key_value_mapping)
        self.assertEqual(
            redis_cache_services.get_multi(['a4', 'b4', 'c4']),
            ['1', '2', '3']
        )
        return_number_of_keys_set = redis_cache_services.delete_multi(
            ['a4', 'b4', 'c4'])
        self.assertEqual(
            redis_cache_services.get_multi(['a4', 'b4', 'c4']),
            [None, None, None])
        self.assertEqual(return_number_of_keys_set, 3)

        return_number_of_keys_set = redis_cache_services.delete_multi(
            ['d4', 'e4', 'f4'])
        self.assertEqual(return_number_of_keys_set, 0)

    def test_partial_fetches_returns_reasonable_output(self) -> None:
        redis_cache_services.flush_caches()
        self.assertEqual(
            redis_cache_services.get_multi(['a5', 'b5', 'c5']),
            [None, None, None])

        key_value_mapping = {'a5': '1', 'b5': '2', 'c5': '3'}
        redis_cache_services.set_multi(key_value_mapping)

        self.assertEqual(
            redis_cache_services.get_multi(['a5', 'z5', 'd5']),
            ['1', None, None])
        self.assertEqual(
            redis_cache_services.get_multi(['x5', 'b5', 'd5']),
            [None, '2', None])

    def test_partial_deletes_deletes_correct_elements(self) -> None:
        redis_cache_services.flush_caches()
        key_value_mapping = {'a6': '1', 'b6': '2', 'c6': '3'}
        redis_cache_services.set_multi(key_value_mapping)
        self.assertEqual(
            redis_cache_services.get_multi(['a6', 'b6', 'c6']), ['1', '2', '3'])
        self.assertEqual(
            redis_cache_services.delete_multi(['a6', 'd6', 'e6']), 1)
        self.assertEqual(
            redis_cache_services.get_multi(['a6', 'b6', 'c6']),
            [None, '2', '3'])

    def test_redis_configuration_file_matches_feconf_redis_configuration(
            self
    ) -> None:
        """Tests that the redis configuration file and feconf variables have
        the same port definition.
        """
        self.assertTrue(os.path.exists(
            os.path.join(common.CURR_DIR, 'redis.conf')))

        with utils.open_file(
                os.path.join(common.CURR_DIR, 'redis.conf'), 'r') as redis_conf:
            lines = redis_conf.readlines()
            elements = lines[0].split()
            self.assertEqual(len(elements), 2)
            self.assertEqual(elements[1], str(feconf.REDISPORT))
