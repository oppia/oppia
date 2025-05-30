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

from core.platform import models

MYPY = False
if MYPY:
    from mypy_imports import redis_client_models

(redis_client_models,) = models.Registry.import_models([
    models.Names.REDIS_CLIENT])


def update_redis_host(redis_host: str) -> None:
    """Updates the Redis host in the datastore.

    Args:
        redis_host: str. The Redis host to save.
    """
    retrieved_redisclient = redis_client_models.RedisClientModel.get(
        redis_client_models.REDIS_CLIENT_ID, strict = False)
    if retrieved_redisclient is not None:
        retrieved_redisclient.redishost = redis_host
        retrieved_redisclient.update_timestamps()
        retrieved_redisclient.put()
    else:
        redisclient = redis_client_models.RedisClientModel(
            id=redis_client_models.REDIS_CLIENT_ID, redishost = redis_host
        )
        redisclient.update_timestamps()
        redisclient.put()
