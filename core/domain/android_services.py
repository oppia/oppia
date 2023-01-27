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

"""Functions for working with Android."""

from __future__ import annotations

import logging

from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import secrets_services

secrets_services = models.Registry.import_secrets_services()


def verify_android_build_secret(secret: str) -> bool:
    """Verifies the secret key from Android build.

    Args:
        secret: str. The secret key provided by the request.

    Returns:
        bool. Whether the secret key is valid.
    """
    android_build_secret = secrets_services.get_secret('ANDROID_BUILD_SECRET')
    if android_build_secret is None:
        logging.error('Android build secret is not available.')
        return False

    return secret == android_build_secret
