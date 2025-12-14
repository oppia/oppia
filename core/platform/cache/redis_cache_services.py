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

from core import feconf, utils
from core.domain import caching_domain

import redis
from typing import Dict, List, Optional


class OppiaRedisClient(metaclass=utils.SingletonMeta):
    """Singleton wrapper for the Oppia Redis client."""

    def __init__(self) -> None:
        """Initialize the Oppia Redis client."""
        # Here we use MyPy ignore because redis.StrictRedis is a generic type
        # but the redis-py library's type stubs don't properly specify the type
        # arguments, leading to type-arg errors that we cannot fix without
        # modifying the library.
        self._client: redis.StrictRedis = redis.StrictRedis(  # type: ignore[type-arg]
            host=feconf.REDISHOST,
            port=feconf.REDISPORT,
            db=feconf.OPPIA_REDIS_DB_INDEX,
            decode_responses=True,
        )

    # Here we use MyPy ignore because redis.StrictRedis is a generic type but
    # the redis-py library's type stubs don't properly specify the type
    # arguments, leading to type-arg errors that we cannot fix without
    # modifying the library.
    def get_client(self) -> redis.StrictRedis:  # type: ignore[type-arg]
        """Return the Redis client instance.

        Returns:
            redis.StrictRedis. The Redis client instance.
        """
        return self._client


class CloudNdbRedisClient(metaclass=utils.SingletonMeta):
    """Singleton wrapper for the Cloud NDB Redis client."""

    def __init__(self) -> None:
        """Initialize the Cloud NDB Redis client."""
        # Here we use MyPy ignore because redis.StrictRedis is a generic type
        # but the redis-py library's type stubs don't properly specify the type
        # arguments, leading to type-arg errors that we cannot fix without
        # modifying the library.
        self._client: redis.StrictRedis = redis.StrictRedis(  # type: ignore[type-arg]
            host=feconf.REDISHOST,
            port=feconf.REDISPORT,
            db=feconf.CLOUD_NDB_REDIS_DB_INDEX,
        )

    # Here we use MyPy ignore because redis.StrictRedis is a generic type but
    # the redis-py library's type stubs don't properly specify the type
    # arguments, leading to type-arg errors that we cannot fix without
    # modifying the library.
    def get_client(self) -> redis.StrictRedis:  # type: ignore[type-arg]
        """Return the Redis client instance.

        Returns:
            redis.StrictRedis. The Redis client instance.
        """
        return self._client


# Here we use MyPy ignore because redis.StrictRedis is a generic type but the
# redis-py library's type stubs don't properly specify the type arguments,
# leading to type-arg errors that we cannot fix without modifying the library.
def get_oppia_redis_client() -> redis.StrictRedis:  # type: ignore[type-arg]
    """Get or create the Oppia Redis client lazily.

    Returns:
        redis.StrictRedis. The Oppia Redis client instance.
    """
    return OppiaRedisClient().get_client()


# Here we use MyPy ignore because redis.StrictRedis is a generic type but the
# redis-py library's type stubs don't properly specify the type arguments,
# leading to type-arg errors that we cannot fix without modifying the library.
def get_cloud_ndb_redis_client() -> redis.StrictRedis:  # type: ignore[type-arg]
    """Get or create the Cloud NDB Redis client lazily.

    Returns:
        redis.StrictRedis. The Cloud NDB Redis client instance.
    """
    return CloudNdbRedisClient().get_client()


def get_memory_cache_stats() -> caching_domain.MemoryCacheStats:
    """Returns a memory profile of the redis cache. Visit
    https://redis.io/commands/memory-stats for more details on what exactly is
    returned.

    Returns:
        MemoryCacheStats. MemoryCacheStats object containing the total allocated
        memory in bytes, peak memory usage in bytes, and the total number of
        keys stored as values.
    """
    redis_full_profile = get_oppia_redis_client().memory_stats()
    memory_stats = caching_domain.MemoryCacheStats(
        redis_full_profile['total.allocated'],
        redis_full_profile['peak.allocated'],
        redis_full_profile['keys.count'],
    )

    return memory_stats


def flush_caches() -> None:
    """Wipes the Redis caches clean."""
    get_oppia_redis_client().flushdb()
    get_cloud_ndb_redis_client().flushdb()


def get_multi(keys: List[str]) -> List[Optional[str]]:
    """Looks up a list of keys in Redis cache.

    Args:
        keys: list(str). A list of keys (strings) to look up.

    Returns:
        list(str|None). A list of values in the cache corresponding to the keys
        that are passed in.
    """
    assert isinstance(keys, list)
    return get_oppia_redis_client().mget(keys)


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
    return get_oppia_redis_client().mset(key_value_mapping)


def delete_multi(keys: List[str]) -> int:
    """Deletes multiple keys in the Redis cache.

    Args:
        keys: list(str). The keys (strings) to delete.

    Returns:
        int. Number of successfully deleted keys.
    """
    for key in keys:
        assert isinstance(key, str)
    return get_oppia_redis_client().delete(*keys)
