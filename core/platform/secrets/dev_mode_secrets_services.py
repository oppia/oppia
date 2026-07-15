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
# limitations under the License.

"""Provides dev mode secrets services."""

from __future__ import annotations

import functools
import json
import os

from typing import Optional


@functools.lru_cache(maxsize=64)
def get_secret(name: str) -> Optional[str]:
    """Gets the value of a secret. This is only dev mode version of the secrets.

    Args:
        name: str. The name of the secret to retrieve.

    Returns:
        str. The value of the secret.
    """
    # In emulator mode we store secrets in environment variable.
    secret = json.loads(os.environ.get('SECRETS', '{}')).get(name)
    # The 'json.loads' returns 'Any' and we need to tighten the type.
    assert secret is None or isinstance(secret, str)
    return secret
