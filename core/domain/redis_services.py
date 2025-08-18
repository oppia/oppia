# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Services for interacting with the Redis cache."""

from __future__ import annotations

from core import feconf
from core.platform import models

from typing import Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import redis_client_models

(redis_client_models,) = models.Registry.import_models([
    models.Names.REDIS_CLIENT])


def get_redis_host() -> Optional[str]:
    """Fetches Redis host from datastore.

    Returns:
        str. The Redishost value.
    """
    redis_client_model = redis_client_models.RedisClientModel.get(
        redis_client_models.REDIS_CLIENT_ID, strict=False)
    if redis_client_model is not None:
        assert isinstance(redis_client_model.redishost, str)
        return redis_client_model.redishost
    return None


def update_redis_host(redis_host: str) -> None:
    """Updates the Redis host in the datastore.

    Args:
        redis_host: str. The Redis host to save.
    """
    retrieved_redis_client_model = redis_client_models.RedisClientModel.get(
        redis_client_models.REDIS_CLIENT_ID, strict=False)
    redis_client_model = (
        retrieved_redis_client_model
        if retrieved_redis_client_model is not None
        else redis_client_models.RedisClientModel(
            id=redis_client_models.REDIS_CLIENT_ID
        )
    )
    redis_client_model.redishost = redis_host
    redis_client_model.update_timestamps()
    redis_client_model.put()
