# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# sizeations under the License.

"""Tests for the Firebase services."""

from __future__ import annotations

from core.domain import firebase_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import secrets_services
secrets_services = models.Registry.import_secrets_services()


class FirebaseServicesTests(test_utils.GenericTestBase):
    """Tests for the Firebase services."""

    def _mock_get_secret(self, name: str) -> Optional[Dict[str, str]]:
        """Mock for the get_secret function.

        Args:
            name: str. The name of the secret to retrieve the value.

        Returns:
            Optional[str]. The value of the secret.
        """
        if name == 'FIREBASE_CONFIG_VALUES':
            return {
            'FIREBASE_CONFIG_API_KEY': 'test-value-1',
            'FIREBASE_CONFIG_AUTH_DOMAIN': 'test-value-2',
            'FIREBASE_CONFIG_PROJECT_ID': 'test-value-3',
            'FIREBASE_CONFIG_STORAGE_BUCKET': 'test-value-4',
            'FIREBASE_CONFIG_MESSAGING_SENDER_ID': 'test-value-5',
            'FIREBASE_CONFIG_APP_ID': 'test-value-6',
            'FIREBASE_CONFIG_GOOGLE_CLIENT_ID': 'test-value-7'
            }
        return None

    def test_get_firebase_config_returns_correct_secret(self) -> None:
        expected_config_dict = {
            'FIREBASE_CONFIG_API_KEY': 'test-value-1',
            'FIREBASE_CONFIG_AUTH_DOMAIN': 'test-value-2',
            'FIREBASE_CONFIG_PROJECT_ID': 'test-value-3',
            'FIREBASE_CONFIG_STORAGE_BUCKET': 'test-value-4',
            'FIREBASE_CONFIG_MESSAGING_SENDER_ID': 'test-value-5',
            'FIREBASE_CONFIG_APP_ID': 'test-value-6',
            'FIREBASE_CONFIG_GOOGLE_CLIENT_ID': 'test-value-7'
            }
        with self.swap_with_checks(
            secrets_services,
            'get_secret',
            self._mock_get_secret,
            expected_args=[('FIREBASE_CONFIG_VALUES',)],
        ):
            firebase_config_values = firebase_services.get_firebase_config()
        self.assertEqual(firebase_config_values, expected_config_dict)

    def test_get_firebase_config_returns_none_when_secret_does_not_exist(
        self
    ) -> None:
        with self.swap_to_always_return(
            secrets_services,
            'get_secret',
            None
        ):
            firebase_config_values = firebase_services.get_firebase_config()
            self.assertIsNone(firebase_config_values)
