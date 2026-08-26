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

"""Google Cloud Translation API v2 (Basic) platform service."""

from __future__ import annotations

import logging
import time

from core import feconf
from core.platform.translate import base_translate_services

import requests
import requests.exceptions


class GcpTranslationService(base_translate_services.BaseTranslationService):
    """Implementation of BaseTranslationService that hooks directly into the
    Google Cloud Translation API v2 (Basic) REST endpoint.

    Docs: https://cloud.google.com/translate/docs/reference/rest/v2/translate
    Supported languages: https://cloud.google.com/translate/docs/languages
    """

    # Unique identifier for this provider. Must match the key used in
    # auto_translation_provider_mapping.json and feconf.py display names.
    PROVIDER_ID = 'gcp'

    MAX_RETRIES = 3
    INITIAL_BACKOFF_SEC = 1.0
    REQUEST_TIMEOUT_SEC = 10.0

    # GCP Cloud Translation v2 REST endpoint.
    _ENDPOINT = 'https://translation.googleapis.com/language/translate/v2'

    def generate_translation(
        self,
        source_language_code: str,
        target_language_code: str,
        source_text: str,
    ) -> str:
        """Queries GCP Cloud Translation v2 over HTTPS using format=html.

        Args:
            source_language_code: str. ISO 639-1 source language code.
            target_language_code: str. ISO 639-1 target language code.
            source_text: str. The HTML or plain text to translate.

        Raises:
            Exception. GCP Translation API key configuration is missing.
            Exception. Failed to communicate with the GCP Translation API.
            Exception. GCP Translation API request failed after all retries.

        Returns:
            str. The translated text returned by GCP.
        """
        api_key = feconf.GCP_TRANSLATOR_API_KEY

        if not api_key:
            raise Exception('GCP Translation API key configuration is missing.')

        params = {'key': api_key}
        payload = {
            'q': source_text,
            'source': source_language_code,
            'target': target_language_code,
            # Preserve HTML tags during translation.
            'format': 'html',
        }

        retries = 0
        backoff_delay = self.INITIAL_BACKOFF_SEC

        while retries < self.MAX_RETRIES:
            try:
                response = requests.post(
                    self._ENDPOINT,
                    params=params,
                    json=payload,
                    timeout=self.REQUEST_TIMEOUT_SEC,
                )

                if response.status_code == 200:
                    response_json = response.json()
                    return str(
                        response_json['data']['translations'][0][
                            'translatedText'
                        ]
                    )

                # Transient failure processing (Rate Limits / Server Outage).
                if response.status_code in [429, 503]:
                    logging.warning(
                        'GCP Translation API returned status %s. '
                        'Retrying in %s seconds...',
                        response.status_code,
                        backoff_delay,
                    )
                    time.sleep(backoff_delay)
                    retries += 1
                    backoff_delay *= 2
                    continue

                # Immediate hard failures (401 Bad Credentials, 400 Bad Input).
                response.raise_for_status()

            except requests.exceptions.Timeout:
                logging.warning(
                    'GCP Translation API timed out. Retrying in %s seconds...',
                    backoff_delay,
                )
                time.sleep(backoff_delay)
                retries += 1
                backoff_delay *= 2
            except requests.exceptions.RequestException as e:
                raise Exception(
                    'Failed to communicate with GCP Translation API: %s' % e
                ) from e

        raise Exception(
            'GCP Translation API request failed after %s retry attempts.'
            % self.MAX_RETRIES
        )
