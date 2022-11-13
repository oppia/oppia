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

"""Unit tests for jobs.io.cache_io."""

from __future__ import annotations

from core.domain import caching_services
from core.jobs import job_test_utils
from core.jobs.io import cache_io

import apache_beam as beam


class FlushCacheTests(job_test_utils.PipelinedTestBase):

    def test_cache_is_flushed(self) -> None:
        items = [1] * 1000000

        called_functions = {'flush_caches': False}

        class MockMemoryCachingServices:

            @staticmethod
            def flush_caches() -> None:
                """Flush cache."""
                called_functions['flush_caches'] = True

        with self.swap(
            caching_services, 'memory_cache_services', MockMemoryCachingServices
        ):
            self.assert_pcoll_equal(
                self.pipeline
                | beam.Create(items)
                | cache_io.FlushCache(),
                [None]
            )

        self.assertTrue(called_functions['flush_caches'])
