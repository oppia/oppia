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

"""Tests for methods in core.domain.caching_services"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import caching_services
from core.tests import test_utils


class CachingServicesUnitTests(test_utils.GenericTestBase):
    """Tests for caching_services."""

    def setUp(self):
        super(CachingServicesUnitTests, self).setUp()
        self.keys = ['a', 'b', 'c']
        self.key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}
        self.exp_list = caching_services.set_multi(self.key_value_mapping)

    def test_get_multi(self):
        exp_dict = caching_services.get_multi(self.keys)
        self.assertEqual(exp_dict, self.key_value_mapping)

    def test_set_multi(self):
        self.assertTrue(self.exp_list)

    def test_delete_multi(self):
        response = caching_services.delete_multi(
            self.keys)
        self.assertTrue(response)

        response = caching_services.delete_multi(
            ['d', 'e', 'f'])
        self.assertFalse(response)
