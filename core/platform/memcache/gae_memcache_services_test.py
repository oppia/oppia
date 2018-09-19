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

"""Tests for methods in the gae_memcache_services."""

from core.platform.memcache import gae_memcache_services
from core.tests import test_utils


class GaeMemcacheServicesUnitTests(test_utils.GenericTestBase):
    """Tests for gae_memcache_services."""

    def setUp(self):
        super(GaeMemcacheServicesUnitTests, self).setUp()
        self.keys = ['a', 'b', 'c']
        self.key_value_mapping = {'a': 1, 'b': 2, 'c': 3}
        self.exp_list = gae_memcache_services.set_multi(self.key_value_mapping)

    def test_get_multi(self):
        exp_dict = gae_memcache_services.get_multi(self.keys)
        self.assertEqual(exp_dict, self.key_value_mapping)

    def test_set_multi(self):
        self.assertEqual(self.exp_list, [])

    def test_delete(self):
        return_code_key_present = gae_memcache_services.delete('a')
        return_code_key_not_present = gae_memcache_services.delete('d')
        self.assertEqual(return_code_key_present, 2)
        self.assertEqual(return_code_key_not_present, 1)

    def test_delete_multi(self):
        return_value_keys_present = gae_memcache_services.delete_multi(
            self.keys)
        return_value_keys_not_present = gae_memcache_services.delete_multi(
            ['d', 'e', 'f'])
        self.assertEqual(return_value_keys_present, True)
        self.assertEqual(return_value_keys_not_present, True)
