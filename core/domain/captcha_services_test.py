# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for captcha services."""

from __future__ import annotations

import json
from unittest import mock
from urllib import request as urllib_request

from core.constants import constants
from core.domain import captcha_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import secrets_services

secrets_services = models.Registry.import_secrets_services()


class CaptchaServicesTests(test_utils.GenericTestBase):
    """Tests for captcha services."""

    def test_get_turnstile_site_key_in_dev_mode(self) -> None:
        with self.swap(constants, 'EMULATOR_MODE', True):
            self.assertEqual(
                '1x00000000000000000000AA',
                captcha_services.get_turnstile_site_key(),
            )

    def test_get_turnstile_site_key_in_prod_mode(self) -> None:
        with self.swap(constants, 'EMULATOR_MODE', False):
            with self.swap(
                secrets_services,
                'get_secret',
                mock.Mock(return_value='site-key'),
            ):
                self.assertEqual(
                    'site-key', captcha_services.get_turnstile_site_key()
                )

    def test_verify_turnstile_token_returns_false_when_secret_is_missing(
        self,
    ) -> None:
        with self.swap(constants, 'EMULATOR_MODE', False):
            with self.swap(
                secrets_services, 'get_secret', mock.Mock(return_value=None)
            ):
                with self.assertLogs(level='ERROR') as log_context:
                    self.assertFalse(
                        captcha_services.verify_turnstile_token('token')
                    )
                self.assertIn(
                    'Turnstile secret key is not available.',
                    log_context.output[0],
                )

    def test_verify_turnstile_token_returns_true_when_success_is_true(
        self,
    ) -> None:
        mock_http_response = mock.MagicMock()
        mock_http_response.read.return_value = json.dumps(
            {'success': True}
        ).encode('utf-8')
        mock_http_response.__enter__.return_value = mock_http_response

        with self.swap(constants, 'EMULATOR_MODE', True):
            with mock.patch.object(
                urllib_request, 'urlopen', return_value=mock_http_response
            ):
                self.assertTrue(
                    captcha_services.verify_turnstile_token('token')
                )

    def test_verify_turnstile_token_returns_false_when_success_is_false(
        self,
    ) -> None:
        mock_http_response = mock.MagicMock()
        mock_http_response.read.return_value = json.dumps(
            {'success': False}
        ).encode('utf-8')
        mock_http_response.__enter__.return_value = mock_http_response

        with self.swap(constants, 'EMULATOR_MODE', True):
            with mock.patch.object(
                urllib_request, 'urlopen', return_value=mock_http_response
            ):
                self.assertFalse(
                    captcha_services.verify_turnstile_token('token')
                )

    def test_verify_turnstile_token_returns_false_when_exception_occurs(
        self,
    ) -> None:
        with self.swap(constants, 'EMULATOR_MODE', True):
            with mock.patch.object(
                urllib_request,
                'urlopen',
                side_effect=Exception('Network failure'),
            ):
                with self.assertLogs(level='ERROR') as log_context:
                    self.assertFalse(
                        captcha_services.verify_turnstile_token('token')
                    )
                self.assertIn(
                    'Turnstile verification failed because the verification request '
                    'raised an exception.',
                    log_context.output[0],
                )
