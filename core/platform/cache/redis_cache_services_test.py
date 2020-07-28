# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

    def setUp(self):
        super(RedisCacheServicesUnitTests, self).setUp()
        self.keys = ['a', 'b', 'c']
        self.non_existent_keys = ['d', 'e']
        # Redis can only store strings so integers must be casted to correct
        # values.
        self.key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}
        self.response = redis_cache_services.set_multi(self.key_value_mapping)

    def test_get_multi(self):
        result = redis_cache_services.get_multi(self.keys)
        self.assertEqual(result, ['1', '2', '3'])
        result = redis_cache_services.get_multi(self.non_existent_keys)
        self.assertEqual(result, [None, None])

    def test_set_multi(self):
        self.assertTrue(self.response)

    def test_delete(self):
        is_successful = redis_cache_services.delete('a')
        self.assertTrue(is_successful)
        is_successful = redis_cache_services.delete('d')
        self.assertFalse(is_successful)

    def test_delete_multi(self):
        return_number_of_keys_set = redis_cache_services.delete_multi(
            self.keys)
        self.assertEqual(return_number_of_keys_set, 3)
        return_number_of_keys_set = redis_cache_services.delete_multi(
            ['d', 'e', 'f'])
        self.assertEqual(return_number_of_keys_set, 0)
