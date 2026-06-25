# coding: utf-8
#
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

"""Azure Cognitive Services Text Translation API platform service."""

from __future__ import annotations

import logging
import time

from core import feconf
from core.platform.translate import base_translate_services

import requests
import requests.exceptions


class AzureTranslationService(base_translate_services.BaseTranslationService):
    """Implementation of BaseTranslationService that hooks directly into the
    Azure Cognitive Services Text Translation API REST endpoint.
    """

    MAX_RETRIES = 3
    INITIAL_BACKOFF_SEC = 1.0
    REQUEST_TIMEOUT_SEC = 10.0

    def generate_translation(
        self,
        source_language_code: str,
        target_language_code: str,
        source_text: str,
    ) -> str:
        """Queries Azure over HTTPS using textType=html format."""
        api_key = feconf.AZURE_TRANSLATOR_API_KEY
        region = feconf.AZURE_TRANSLATOR_REGION

        if not api_key or not region:
            raise Exception(
                'Either Azure Translation API key configuration or region is missing.'
            )

        endpoint = 'https://api.cognitive.microsofttranslator.com/translate'
        params = {
            'api-version': '3.0',
            'from': source_language_code,
            'to': target_language_code,
            'textType': 'html',
        }
        headers = {
            'Ocp-Apim-Subscription-Key': api_key,
            'Ocp-Apim-Subscription-Region': region,
            'Content-type': 'application/json',
        }
        body = [{'text': source_text}]

        retries = 0
        backoff_delay = self.INITIAL_BACKOFF_SEC

        while retries < self.MAX_RETRIES:
            try:
                response = requests.post(
                    endpoint,
                    params=params,
                    headers=headers,
                    json=body,
                    timeout=self.REQUEST_TIMEOUT_SEC,
                )

                if response.status_code == 200:
                    response_json = response.json()
                    return str(response_json[0]['translations'][0]['text'])

                # Transient failure processing (Rate Limits / Server Outage).
                if response.status_code in [429, 503]:
                    logging.warning(
                        'Azure API returned status %s. Retrying in %s seconds...',
                        response.status_code,
                        backoff_delay,
                    )
                    time.sleep(backoff_delay)
                    retries += 1
                    backoff_delay *= 2
                    continue

                # Immediate hard failures (401 Bad Credentials, 400 Oversized Text).
                response.raise_for_status()

            except requests.exceptions.Timeout:
                logging.warning(
                    'Azure API timed out. Retrying in %s seconds...',
                    backoff_delay,
                )
                time.sleep(backoff_delay)
                retries += 1
                backoff_delay *= 2
            except requests.exceptions.RequestException as e:
                raise Exception(
                    'Failed to communicate with Azure API: %s' % e
                ) from e

        raise Exception(
            'Azure Translator API request failed after %s retry attempts.'
            % (self.MAX_RETRIES)
        )
