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

"""Unit tests for core.domain.redis_services."""

from __future__ import annotations

from core.domain import redis_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:
    from mypy_imports import redis_client_models

(redis_client_models,) = models.Registry.import_models([
    models.Names.REDIS_CLIENT])


class RedisServicesUnitTests(test_utils.GenericTestBase):
    """Tests for the Redis services module."""

    def test_get_redis_host_returns_correct_host(self) -> None:
        self.assertIsNone(redis_services.get_redis_host())
        new_host = 'new.redis.host'
        redis_services.update_redis_host(new_host)
        self.assertEqual(redis_services.get_redis_host(), new_host)

    def test_update_redis_host_creates_new_model(self) -> None:
        initial_model = redis_client_models.RedisClientModel.get(
            redis_client_models.REDIS_CLIENT_ID, strict=False)
        self.assertIsNone(initial_model)

        new_host = 'new.redis.host'
        redis_services.update_redis_host(new_host)

        fetched_model = redis_client_models.RedisClientModel.get(
            redis_client_models.REDIS_CLIENT_ID, strict=False)
        assert fetched_model is not None
        self.assertEqual(fetched_model.redishost, new_host)

    def test_update_redis_host_updates_existing_model(self) -> None:
        initial_model = redis_client_models.RedisClientModel(
            id=redis_client_models.REDIS_CLIENT_ID
        )
        initial_model.redishost = 'initial.redis.host'
        initial_model.update_timestamps()
        initial_model.put()

        new_host = 'updated.redis.host'
        redis_services.update_redis_host(new_host)

        fetched_model = redis_client_models.RedisClientModel.get(
            redis_client_models.REDIS_CLIENT_ID, strict=False)
        assert fetched_model is not None
        self.assertEqual(fetched_model.redishost, new_host)
