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

"""Tests for core.storage.redis.gae_models."""

from __future__ import annotations

from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models, redis_client_models

(base_models, redis_client_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.REDIS_CLIENT
])


class RedisClientModelUnitTests(test_utils.GenericTestBase):
    """Tests the RedisClientModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            redis_client_models.RedisClientModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            redis_client_models.RedisClientModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'redishost': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        self.assertEqual(
            redis_client_models.RedisClientModel.get_export_policy(),
            expected_export_policy_dict)
