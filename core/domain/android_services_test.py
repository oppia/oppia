# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.android_services."""

from __future__ import annotations

import logging

from core.domain import android_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import secrets_services

secrets_services = models.Registry.import_secrets_services()


class AndroidBuildSecretTest(test_utils.GenericTestBase):
    """Tests for the verify_android_build_secret."""

    def setUp(self) -> None:
        super().setUp()
        self.swap_webhook_secrets_return_none = self.swap_to_always_return(
            secrets_services, 'get_secret', None)
        self.swap_webhook_secrets_return_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: 'secret',
            expected_args=[
                ('ANDROID_BUILD_SECRET',),
                ('ANDROID_BUILD_SECRET',),
            ]
        )

    def test_cloud_secrets_return_none_logs_exception(self) -> None:
        with self.swap_webhook_secrets_return_none:
            with self.capture_logging(min_level=logging.WARNING) as logs:
                self.assertFalse(
                    android_services.verify_android_build_secret('secret'))
                self.assertEqual(
                    ['Mailchimp Webhook secret is not available.'], logs
                )

    def test_cloud_secrets_return_secret_passes(self) -> None:
        with self.swap_webhook_secrets_return_secret:
            self.assertTrue(
                android_services.verify_android_build_secret('secret'))
            self.assertFalse(
                android_services.verify_android_build_secret('not-secret'))
