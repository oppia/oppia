# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for the Python Cloud Secret services."""

from __future__ import annotations

import os

from core.platform.secrets import dev_mode_secrets_services
from core.tests import test_utils


class DevModeSecretsServicesTests(test_utils.GenericTestBase):
    """Tests for the Python Cloud Secret services."""

    def test_get_secret_returns_existing_secret(self) -> None:
        with self.swap(os, 'environ', {'SECRETS': '{"name": "secret"}'}):
            self.assertEqual(
                dev_mode_secrets_services.get_secret('name'), 'secret')

    def test_get_secret_returns_none_when_secret_does_not_exist(self) -> None:
        with self.swap(os, 'environ', {'SECRETS': '{"name": "secret"}'}):
            self.assertIsNone(dev_mode_secrets_services.get_secret('name2'))
