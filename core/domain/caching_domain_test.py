# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for caching_domain.py"""

from __future__ import annotations

from core.domain import caching_domain
from core.tests import test_utils


class CachingDomainTests(test_utils.GenericTestBase):

    def test_that_domain_object_is_created_correctly(self) -> None:
        memory_cache = caching_domain.MemoryCacheStats(64, 128, 16)
        self.assertEqual(memory_cache.total_allocated_in_bytes, 64)
        self.assertEqual(memory_cache.peak_memory_usage_in_bytes, 128)
        self.assertEqual(memory_cache.total_number_of_keys_stored, 16)
