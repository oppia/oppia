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

"""Services for CAPTCHA verification."""

from __future__ import annotations

import json
import logging
import urllib.parse
import urllib.request

from core.constants import constants
from core.platform import models

from typing import Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import secrets_services

secrets_services = models.Registry.import_secrets_services()

_TURNSTILE_VERIFY_URL = (
    'https://challenges.cloudflare.com/turnstile/v0/siteverify'
)
_TURNSTILE_SECRET_KEY_ENV_VAR = 'CLOUDFLARE_TURNSTILE_SECRET_KEY'
_TURNSTILE_SITE_KEY_ENV_VAR = 'CLOUDFLARE_TURNSTILE_SITE_KEY'
# Cloudflare official Turnstile testing keys for non-production use.
# Reference:
# https://developers.cloudflare.com/turnstile/troubleshooting/testing/
_TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA'
_TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA'
# Timeout in seconds for Turnstile verification requests.
_TURNSTILE_VERIFY_TIMEOUT_SECS = 15


def get_turnstile_site_key() -> Optional[str]:
    """Returns the configured Turnstile site key."""
    if constants.EMULATOR_MODE:
        return _TURNSTILE_TEST_SITE_KEY
    return secrets_services.get_secret(_TURNSTILE_SITE_KEY_ENV_VAR)


def verify_turnstile_token(token: str) -> bool:
    """Verifies a Turnstile token with Cloudflare.

    Args:
        token: str. The Turnstile token provided by the request.

    Returns:
        bool. Whether the Turnstile token is valid.
    """
    secret_key = (
        _TURNSTILE_TEST_SECRET_KEY
        if constants.EMULATOR_MODE
        else secrets_services.get_secret(_TURNSTILE_SECRET_KEY_ENV_VAR)
    )
    if not secret_key:
        logging.error('Turnstile secret key is not available.')
        return False
    data = {
        'secret': secret_key,
        'response': token,
    }

    try:
        encoded_data = urllib.parse.urlencode(data).encode('utf-8')
        request = urllib.request.Request(
            _TURNSTILE_VERIFY_URL,
            data=encoded_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
        )
        with urllib.request.urlopen(
            request, timeout=_TURNSTILE_VERIFY_TIMEOUT_SECS
        ) as response:
            payload = json.loads(response.read().decode('utf-8'))
        return bool(payload.get('success'))
    except Exception:
        logging.exception(
            'Turnstile verification failed because the verification request '
            'raised an exception.'
        )
        return False
