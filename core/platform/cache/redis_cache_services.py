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

"""Provides the redis cache service functionality."""

from __future__ import annotations

from core import feconf
from core.domain import caching_domain

import redis
from typing import Dict, List, Optional, cast

# Redis client for our own implementation of caching.
OPPIA_REDIS_CLIENT = redis.StrictRedis(
    host=feconf.REDISHOST,
    port=feconf.REDISPORT,
    db=feconf.OPPIA_REDIS_DB_INDEX,
    decode_responses=True
)

# Redis client for the Cloud NDB cache.
CLOUD_NDB_REDIS_CLIENT = redis.StrictRedis(
    host=feconf.REDISHOST,
    port=feconf.REDISPORT,
    db=feconf.CLOUD_NDB_REDIS_DB_INDEX
)


def get_memory_cache_stats() -> caching_domain.MemoryCacheStats:
    """Returns a memory profile of the redis cache. Visit
    https://redis.io/commands/memory-stats for more details on what exactly is
    returned.

    Returns:
        MemoryCacheStats. MemoryCacheStats object containing the total allocated
        memory in bytes, peak memory usage in bytes, and the total number of
        keys stored as values.
    """
    # We have ignored [attr-defined] below because there is some error in
    # the redis typeshed. Typestubs don't define the method memory_stats()
    # for the redis.StrictRedis object.
    # TODO(#13617): Update our typeshed after redis stubs are improved in
    # typeshed. Then the ignore[attr-defined] used below can be removed.
    redis_full_profile = OPPIA_REDIS_CLIENT.memory_stats() # type: ignore[attr-defined]
    memory_stats = caching_domain.MemoryCacheStats(
        redis_full_profile.get('total.allocated'),
        redis_full_profile.get('peak.allocated'),
        redis_full_profile.get('keys.count'))

    return memory_stats


def flush_caches() -> None:
    """Wipes the Redis caches clean."""
    OPPIA_REDIS_CLIENT.flushdb()
    CLOUD_NDB_REDIS_CLIENT.flushdb()


def get_multi(keys: List[str]) -> List[Optional[str]]:
    """Looks up a list of keys in Redis cache.

    Args:
        keys: list(str). A list of keys (strings) to look up.

    Returns:
        list(str|None). A list of values in the cache corresponding to the keys
        that are passed in.
    """
    assert isinstance(keys, list)
    # TODO(#13663): After we install mypy in virtual environment and upgrade
    # our mypy, we will have latest stubs of redis available. After this
    # the cast and type ignore used below can be removed.
    return cast(
        List[Optional[str]],
        OPPIA_REDIS_CLIENT.mget(keys)) # type: ignore[no-untyped-call]


def set_multi(key_value_mapping: Dict[str, str]) -> bool:
    """Sets multiple keys' values at once in the Redis cache.

    Args:
        key_value_mapping: dict(str, str). Both the key and value are strings.
            The value can either be a primitive binary-safe string or the
            JSON-encoded string version of the object.

    Returns:
        bool. Whether the set action succeeded.
    """
    assert isinstance(key_value_mapping, dict)
    # TODO(#13663): After we install mypy in virtual environment and upgrade
    # our mypy, we will have latest stubs of redis available. After this
    # the cast and type ignore used below can be removed.
    return cast(
        bool,
        OPPIA_REDIS_CLIENT.mset(key_value_mapping)) # type: ignore[no-untyped-call]


def delete_multi(keys: List[str]) -> int:
    """Deletes multiple keys in the Redis cache.

    Args:
        keys: list(str). The keys (strings) to delete.

    Returns:
        int. Number of successfully deleted keys.
    """
    for key in keys:
        assert isinstance(key, str)
    number_of_deleted_keys = OPPIA_REDIS_CLIENT.delete(*keys)
    return number_of_deleted_keys
