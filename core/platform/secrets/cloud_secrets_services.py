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

"""Provides cloud secrets services."""

from __future__ import annotations

import logging

from core import feconf

from google.cloud import secretmanager

CLIENT = secretmanager.SecretManagerServiceClient()


def get_secret(name: str) -> str:
    """Gets the value of a secret.

    Args:
        name: str. The name of the secret to retrieve.

    Returns:
        str. The value of the secret.
    """
    secret_name = (
        f'projects/{feconf.OPPIA_PROJECT_ID}/secrets/{name}/versions/latest')
    response = CLIENT.access_secret_version(request={'name': secret_name})
    logging.info(response)
    logging.info(response.payload)
    logging.info(response.payload.data)
    return response.payload.data.decode('utf-8')
