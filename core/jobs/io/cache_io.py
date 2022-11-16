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

"""Provides PTransforms for manipulating with cache."""

from __future__ import annotations

from core.domain import caching_services

import apache_beam as beam
from typing import Any


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class FlushCache(beam.PTransform): # type: ignore[misc]
    """Flushes the memory caches."""

    # Here we use type Any because we do not care about the type of items passed
    # here.
    def expand(
        self, items: beam.PCollection[Any]
    ) -> beam.pvalue.PDone:
        """Flushes the memory caches.

        Args:
            items: PCollection. Items, can also contain just one item.

        Returns:
            PCollection. An empty PCollection.
        """
        return (
            items
            | beam.CombineGlobally(lambda _: [])
            | beam.Map(lambda _: caching_services.flush_memory_caches())
        )
