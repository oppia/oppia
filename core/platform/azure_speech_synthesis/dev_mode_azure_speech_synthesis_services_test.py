# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for the Azure text-to-speech service in the development environment."""

from __future__ import annotations

from core.platform import models
from core.platform.azure_speech_synthesis import (
    dev_mode_azure_speech_synthesis_services)
from core.tests import test_utils


secrets_services = models.Registry.import_secrets_services()


class AzureSpeechSynthesisSimulationTests(test_utils.GenericTestBase):
    """Tests for simulating speech synthesis."""

    def setUp(self) -> None:
        super().setUp()
        self.swap_api_key_secrets_return_none = self.swap_to_always_return(
            secrets_services, 'get_secret', None)
        self.swap_api_key_secrets_return_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: 'azure_key',
            expected_args=[
                ('AZURE_TTS_API_KEY',),
            ]
        )

    def test_regenerate_speech_from_text_success(
        self
    ) -> None:
        plaintext = 'This is a test text'
        language_accent_code = 'en-US'

        mock_word_boundaries = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'a', 'audio_offset_msecs': 200.0},
            {'token': 'test', 'audio_offset_msecs': 300.0},
            {'token': 'text', 'audio_offset_msecs': 400.0},
        ]

        result_binary_data, result_audio_offsets, result_error = (
            dev_mode_azure_speech_synthesis_services.
            regenerate_speech_from_text(plaintext, language_accent_code))

        self.assertTrue(isinstance(result_binary_data, bytes))
        self.assertEqual(result_audio_offsets, mock_word_boundaries)
        self.assertIsNone(result_error)

    def test_should_select_default_language_as_english_and_return_correctly(
        self
    ) -> None:
        plaintext = 'This is a test text'

        # For a non-existent language accent code, the default English will be
        # selected.
        language_accent_code = 'non-existent'

        mock_word_boundaries = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'a', 'audio_offset_msecs': 200.0},
            {'token': 'test', 'audio_offset_msecs': 300.0},
            {'token': 'text', 'audio_offset_msecs': 400.0},
        ]

        result_binary_data, result_audio_offsets, result_error = (
            dev_mode_azure_speech_synthesis_services.
            regenerate_speech_from_text(plaintext, language_accent_code))

        self.assertTrue(isinstance(result_binary_data, bytes))
        self.assertEqual(result_audio_offsets, mock_word_boundaries)
        self.assertIsNone(result_error)
