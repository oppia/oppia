# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Methods for fetching firebase configuration values from cloud secrets."""

from __future__ import annotations

from core.platform import models

from typing import Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import secrets_services
secrets_services = models.Registry.import_secrets_services()


def get_firebase_config() -> Optional[str]:
    """Retrieves the Firebase config values from Cloud secrets."""
    firebase_config_values = secrets_services.get_secret(
        'FIREBASE_CONFIG_VALUES')
    return firebase_config_values
