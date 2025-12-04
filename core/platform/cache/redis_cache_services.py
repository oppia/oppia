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
from core.domain import caching_domain, redis_services
from core.platform import models

import redis
from typing import Dict, List, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class RedisClient:
    """Redis client for our own implementation of caching."""

    def __init__(self) -> None:
        self._redishost: Optional[str] = None
        self._oppia_redis_client: Optional[redis.StrictRedis[str]] = None
        self._cloud_ndb_redis_client: Optional[redis.StrictRedis[str]] = None

    def get_oppia_redis_client(self) -> Optional[redis.StrictRedis[str]]:
        """Fetches redis model and obtains oppia redis client.

        Returns:
            redis.StrictRedis[str]. The oppia redis client.
        """
        self._update_clients_if_needed()
        return self._oppia_redis_client

    def get_cloud_ndb_redis_client(self) -> Optional[redis.StrictRedis[str]]:
        """Fetches redis model and obtains cloud ndb redis client.

        Returns:
            redis.StrictRedis[str]. The cloud ndb redis client.
        """
        self._update_clients_if_needed()
        return self._cloud_ndb_redis_client


REDIS_CLIENT = RedisClient()


class OppiaRedisClient(metaclass=utils.SingletonMeta):
    """Singleton wrapper for the Oppia Redis client."""

    def __init__(self) -> None:
        """Initialize the Oppia Redis client."""
        self._redishost: Optional[str] = None
        # Here we use MyPy ignore because redis.StrictRedis is a generic
        # type but the redis-py library's type stubs don't properly
        # specify the type arguments, leading to type-arg errors that
        # we cannot fix without modifying the library.
        self._client: Optional[redis.StrictRedis] = None  # type: ignore[type-arg]

    def _update_client_if_needed(self) -> None:
        """Recreates and updates client if the redis host has changed."""
        with datastore_services.get_ndb_context():
            new_redishost = redis_services.get_redis_host()

        if new_redishost != self._redishost:
            self._redishost = new_redishost
            if self._redishost:
                # Here we use MyPy ignore because redis.StrictRedis is a generic
                # type but the redis-py library's type stubs don't properly
                # specify the type arguments, leading to type-arg errors that
                # we cannot fix without modifying the library.
                self._client: redis.StrictRedis = redis.StrictRedis(  # type: ignore[type-arg]
                    host=self._redishost,
                    port=feconf.REDISPORT,
                    db=feconf.OPPIA_REDIS_DB_INDEX,
                    decode_responses=True,
                )
            else:
                self._client = None

    # Here we use MyPy ignore because redis.StrictRedis is a generic type but
    # the redis-py library's type stubs don't properly specify the type
    # arguments, leading to type-arg errors that we cannot fix without
    # modifying the library.
    def get_client(self) -> Optional[redis.StrictRedis]:  # type: ignore[type-arg]
        """Return the Redis client instance.

        Returns:
            redis.StrictRedis. The Redis client instance.
        """
        self._update_client_if_needed()
        return self._client


class CloudNdbRedisClient(metaclass=utils.SingletonMeta):
    """Singleton wrapper for the Cloud NDB Redis client."""

    def __init__(self) -> None:
        """Initialize the Cloud NDB Redis client."""
        self._redishost: Optional[str] = None
        # Here we use MyPy ignore because redis.StrictRedis is a generic
        # type but the redis-py library's type stubs don't properly
        # specify the type arguments, leading to type-arg errors that
        # we cannot fix without modifying the library.
        self._client: Optional[redis.StrictRedis] = None  # type: ignore[type-arg]

    def _update_client_if_needed(self) -> None:
        """Recreates and updates client if the redis host has changed."""
        with datastore_services.get_ndb_context():
            new_redishost = redis_services.get_redis_host()

        if new_redishost != self._redishost:
            self._redishost = new_redishost
            if self._redishost:
                # Here we use MyPy ignore because redis.StrictRedis is a generic
                # type but the redis-py library's type stubs don't properly
                # specify the type arguments, leading to type-arg errors that
                # we cannot fix without modifying the library.
                self._client: redis.StrictRedis = redis.StrictRedis(  # type: ignore[type-arg]
                    host=self._redishost,
                    port=feconf.REDISPORT,
                    db=feconf.CLOUD_NDB_REDIS_DB_INDEX,
                )
            else:
                self._client = None

    # Here we use MyPy ignore because redis.StrictRedis is a generic type but
    # the redis-py library's type stubs don't properly specify the type
    # arguments, leading to type-arg errors that we cannot fix without
    # modifying the library.
    def get_client(self) -> Optional[redis.StrictRedis]:  # type: ignore[type-arg]
        """Return the Redis client instance.

        Returns:
            redis.StrictRedis. The Redis client instance.
        """
        return self._client


# Here we use MyPy ignore because redis.StrictRedis is a generic type but the
# redis-py library's type stubs don't properly specify the type arguments,
# leading to type-arg errors that we cannot fix without modifying the library.
def get_oppia_redis_client() -> Optional[redis.StrictRedis]:  # type: ignore[type-arg]
    """Get or create the Oppia Redis client lazily.

    Returns:
        redis.StrictRedis. The Oppia Redis client instance.
    """
    return OppiaRedisClient().get_client()


# Here we use MyPy ignore because redis.StrictRedis is a generic type but the
# redis-py library's type stubs don't properly specify the type arguments,
# leading to type-arg errors that we cannot fix without modifying the library.
def get_cloud_ndb_redis_client() -> Optional[redis.StrictRedis]:  # type: ignore[type-arg]
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
    oppia_redis_client = get_oppia_redis_client()
    if oppia_redis_client is None:
        return caching_domain.MemoryCacheStats(0, 0, 0)

    redis_full_profile = get_oppia_redis_client().memory_stats()
    return caching_domain.MemoryCacheStats(
        redis_full_profile['total.allocated'],
        redis_full_profile['peak.allocated'],
        redis_full_profile['keys.count'],
    )


def flush_caches() -> None:
    """Wipes the Redis caches clean."""
    oppia_redis_client = get_oppia_redis_client()
    if oppia_redis_client:
        oppia_redis_client.flushdb()

    cloud_ndb_redis_client = get_cloud_ndb_redis_client()
    if cloud_ndb_redis_client:
        cloud_ndb_redis_client().flushdb()


def get_multi(keys: List[str]) -> List[Optional[str]]:
    """Looks up a list of keys in Redis cache.

    Args:
        keys: list(str). A list of keys (strings) to look up.

    Returns:
        list(str|None). A list of values in the cache corresponding to the keys
        that are passed in.
    """
    assert isinstance(keys, list)
    oppia_redis_client = get_oppia_redis_client()
    if oppia_redis_client is None:
        return [None] * len(keys)

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
    oppia_redis_client = get_oppia_redis_client()
    if oppia_redis_client is None:
        return False

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
    oppia_redis_client = get_oppia_redis_client()
    if oppia_redis_client is None:
        return 0

    return get_oppia_redis_client().delete(*keys)
