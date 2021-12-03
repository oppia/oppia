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

"""Domain objects for caching.

Domain objects capture domain-specific logic and are agnostic of how the
objects they represent are stored. All methods and properties in this file
should therefore be independent of the specific storage models used.
"""

from __future__ import annotations


class MemoryCacheStats:
    """Domain object for an Oppia memory profile object that contains
    information about the memory cache.
    """

    def __init__(
        self,
        total_allocated_in_bytes: int,
        peak_memory_usage_in_bytes: int,
        total_number_of_keys_stored: int
    ) -> None:
        """Initializes a Memory Cache Stats domain object.

        Args:
            total_allocated_in_bytes: int. The total number of bytes allocated
                by the memory cache.
            peak_memory_usage_in_bytes: int. The highest number of bytes
                allocated by the memory cache.
            total_number_of_keys_stored: int. The number of keys stored in the
                memory cache.
        """
        self.total_allocated_in_bytes = total_allocated_in_bytes
        self.peak_memory_usage_in_bytes = peak_memory_usage_in_bytes
        self.total_number_of_keys_stored = total_number_of_keys_stored
