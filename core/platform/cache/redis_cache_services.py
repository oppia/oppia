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
from core.domain import redis_services
from core.platform import models

import redis
from typing import Dict, List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class RedisClient:
    """Redis client for our own implementation of caching."""

    def __init__(self) -> None:
        self._is_client_initialized = False
        self._oppia_redis_client: Optional[redis.StrictRedis[str]] = None
        self._cloud_ndb_redis_client: Optional[redis.StrictRedis[str]] = None

    def _initialize_client(self) -> None:
        """Initializes the client by fetching redis model if the client is not
        initialized.
        """
        if self._is_client_initialized:
            return

        with datastore_services.get_ndb_context():
            redishost = redis_services.get_redis_host()
        if not redishost:
            return
        self._oppia_redis_client = redis.StrictRedis(
            host=redishost,
            port=feconf.REDISPORT,
            db=feconf.OPPIA_REDIS_DB_INDEX,
            decode_responses=True
        )
        self._cloud_ndb_redis_client = redis.StrictRedis(
            host=redishost,
            port=feconf.REDISPORT,
            db=feconf.CLOUD_NDB_REDIS_DB_INDEX
        )
        self._is_client_initialized = True

    def get_oppia_redis_client(self) -> Optional[redis.StrictRedis[str]]:
        """Initializes redis model and obtains oppia redis client.

        Returns:
            redis.StrictRedis[str]. The oppia redis client.
        """
        self._initialize_client()
        return self._oppia_redis_client

    def get_cloud_ndb_redis_client(self) -> Optional[redis.StrictRedis[str]]:
        """Initializes redis model and obtains cloud ndb redis client.

        Returns:
            redis.StrictRedis[str]. The cloud ndb redis client.
        """
        self._initialize_client()
        return self._cloud_ndb_redis_client


REDIS_CLIENT = RedisClient()


def get_memory_cache_stats() -> caching_domain.MemoryCacheStats:
    """Returns a memory profile of the redis cache. Visit
    https://redis.io/commands/memory-stats for more details on what exactly is
    returned.

    Returns:
        MemoryCacheStats. MemoryCacheStats object containing the total allocated
        memory in bytes, peak memory usage in bytes, and the total number of
        keys stored as values.
    """
    oppia_redis_client = REDIS_CLIENT.get_oppia_redis_client()
    if not oppia_redis_client:
        return caching_domain.MemoryCacheStats(0, 0, 0)
    redis_full_profile = oppia_redis_client.memory_stats()
    return caching_domain.MemoryCacheStats(
        redis_full_profile['total.allocated'],
        redis_full_profile['peak.allocated'],
        redis_full_profile['keys.count']
    )


def flush_caches() -> None:
    """Wipes the Redis caches clean."""
    oppia_redis_client = REDIS_CLIENT.get_oppia_redis_client()
    if oppia_redis_client:
        oppia_redis_client.flushdb()

    cloud_ndb_redis_client = REDIS_CLIENT.get_cloud_ndb_redis_client()
    if cloud_ndb_redis_client:
        cloud_ndb_redis_client.flushdb()


def get_multi(keys: List[str]) -> List[Optional[str]]:
    """Looks up a list of keys in Redis cache.

    Args:
        keys: list(str). A list of keys (strings) to look up.

    Returns:
        list(str|None). A list of values in the cache corresponding to the keys
        that are passed in.
    """
    assert isinstance(keys, list)
    oppia_redis_client = REDIS_CLIENT.get_oppia_redis_client()
    if not oppia_redis_client:
        return []
    return oppia_redis_client.mget(keys)


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
    oppia_redis_client = REDIS_CLIENT.get_oppia_redis_client()
    if not oppia_redis_client:
        return False
    return oppia_redis_client.mset(key_value_mapping)


def delete_multi(keys: List[str]) -> int:
    """Deletes multiple keys in the Redis cache.

    Args:
        keys: list(str). The keys (strings) to delete.

    Returns:
        int. Number of successfully deleted keys.
    """
    for key in keys:
        assert isinstance(key, str)
    oppia_redis_client = REDIS_CLIENT.get_oppia_redis_client()
    if not oppia_redis_client:
        return 0
    return oppia_redis_client.delete(*keys)
