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

"""Tests for the Azure text-to-speech service."""

from __future__ import annotations

from unittest import mock

from core.platform import models
from core.platform.azure_speech_synthesis import azure_speech_synthesis_services
from core.tests import test_utils
import azure.cognitiveservices.speech as speechsdk
from typing import Dict, List, Union


secrets_services = models.Registry.import_secrets_services()


class AzureSpeechSynthesisTests(test_utils.GenericTestBase):
    """Tests for synthesizing speech using Azure service."""

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

    @mock.patch('azure.cognitiveservices.speech.SpeechSynthesizer')
    @mock.patch('azure.cognitiveservices.speech.SpeechConfig')
    @mock.patch(
        'core.platform.azure_speech_synthesis.'
        'azure_speech_synthesis_services.WordBoundaryCollection')
    def test_regenerate_speech_from_text_success(
        self,
        mock_word_boundary_collection: mock.Mock,
        mock_speech_config: mock.Mock,
        mock_speech_synthesizer: mock.Mock
    ) -> None:
        plaintext = 'This is a test text'
        language_accent_code = 'en-US'
        ssml_text = (
            azure_speech_synthesis_services.convert_plaintext_to_ssml_content(
                plaintext, language_accent_code))

        mock_audio_data = b'mock_audio_data'
        mock_speech_config_instance = mock_speech_config.return_value
        mock_speech_config_instance.set_speech_synthesis_output_format = (
            mock.MagicMock())
        mock_speech_synthesizer_instance = mock_speech_synthesizer.return_value
        mock_speech_synthesis_result = mock.MagicMock()
        mock_speech_synthesis_result.audio_data = mock_audio_data
        mock_speech_synthesis_result.reason = (
            speechsdk.ResultReason.SynthesizingAudioCompleted)
        (
            mock_speech_synthesizer_instance.speak_ssml_async.
            return_value.get.return_value
        ) = mock_speech_synthesis_result
        mock_word_boundary_instance = mock.MagicMock()
        mock_word_boundaries = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'a', 'audio_offset_msecs': 200.0},
            {'token': 'test', 'audio_offset_msecs': 300.0},
            {'token': 'text', 'audio_offset_msecs': 400.0},
        ]
        mock_word_boundary_instance.audio_offset_list = (
            mock_word_boundaries)
        mock_word_boundary_collection.return_value = mock_word_boundary_instance

        with self.swap_api_key_secrets_return_secret:
            result_binary_data, result_audio_offsets, result_error = (
                azure_speech_synthesis_services.regenerate_speech_from_text(
                    plaintext, language_accent_code))

        (
            mock_speech_config_instance.set_speech_synthesis_output_format.
            assert_called_once_with(
                speechsdk.SpeechSynthesisOutputFormat
                .Audio24Khz160KBitRateMonoMp3)
        )
        (
            mock_speech_synthesizer_instance.speak_ssml_async.
            assert_called_once_with(ssml_text)
        )

        self.assertEqual(result_binary_data, mock_audio_data)
        self.assertEqual(result_audio_offsets, mock_word_boundaries)
        self.assertIsNone(result_error)

    def test_raise_exception_when_azure_api_key_is_not_set(self) -> None:
        azure_exception = self.assertRaisesRegex(
            Exception, 'Azure TTS API key is not available.')

        plaintext = 'This is a test text'
        language_accent_code = 'en-US'

        with self.swap_api_key_secrets_return_none, azure_exception:
            azure_speech_synthesis_services.regenerate_speech_from_text(
                plaintext, language_accent_code)

    @mock.patch('azure.cognitiveservices.speech.SpeechSynthesizer')
    @mock.patch('azure.cognitiveservices.speech.SpeechConfig')
    @mock.patch(
        'core.platform.azure_speech_synthesis.'
        'azure_speech_synthesis_services.WordBoundaryCollection')
    def test_regenerate_speech_from_math_text_success(
        self,
        mock_word_boundary_collection: mock.Mock,
        mock_speech_config: mock.Mock,
        mock_speech_synthesizer: mock.Mock
    ) -> None:
        plaintext = 'Evaluate 2 + 3 '
        language_accent_code = 'en-US'
        ssml_text = (
            azure_speech_synthesis_services.convert_plaintext_to_ssml_content(
                plaintext, language_accent_code))

        mock_audio_data = b'mock_audio_data'
        mock_speech_config_instance = mock_speech_config.return_value
        mock_speech_config_instance.set_speech_synthesis_output_format = (
            mock.MagicMock())
        mock_speech_synthesizer_instance = mock_speech_synthesizer.return_value
        mock_speech_synthesis_result = mock.MagicMock()
        mock_speech_synthesis_result.audio_data = mock_audio_data
        mock_speech_synthesis_result.reason = (
            speechsdk.ResultReason.SynthesizingAudioCompleted)
        (
            mock_speech_synthesizer_instance.speak_ssml_async.
            return_value.get.return_value
        ) = mock_speech_synthesis_result
        mock_word_boundary_instance = mock.MagicMock()
        mock_word_boundaries = [
            {'token': 'Evaluate', 'audio_offset_msecs': 0.0},
            {'token': '2', 'audio_offset_msecs': 100.0},
            {'token': '+', 'audio_offset_msecs': 200.0},
            {'token': '3', 'audio_offset_msecs': 300.0},
        ]
        mock_word_boundary_instance.audio_offset_list = (
            mock_word_boundaries)
        mock_word_boundary_collection.return_value = mock_word_boundary_instance

        with self.swap_api_key_secrets_return_secret:
            result_binary_data, result_audio_offsets, result_error = (
                azure_speech_synthesis_services.regenerate_speech_from_text(
                    plaintext, language_accent_code))

        (
            mock_speech_config_instance.set_speech_synthesis_output_format.
            assert_called_once_with(
                speechsdk.SpeechSynthesisOutputFormat
                .Audio24Khz160KBitRateMonoMp3)
        )
        (
            mock_speech_synthesizer_instance.speak_ssml_async.
            assert_called_once_with(ssml_text)
        )

        self.assertEqual(result_binary_data, mock_audio_data)
        self.assertEqual(result_audio_offsets, mock_word_boundaries)
        self.assertIsNone(result_error)

    def test_regenerate_speech_from_text_failed_for_invalid_credentials(
        self
    ) -> None:
        plaintext = 'This is a test text'
        language_accent_code = 'en-US'

        mock_audio_data = b''
        mock_word_boundaries: List[Dict[str, Union[str, float]]] = []
        mock_error_details = (
            'WebSocket upgrade failed: Authentication error (401). '
            'Please check subscription information and region name. USP state: '
            'Sending. Received audio size: 0 bytes.'
        )

        with self.swap_api_key_secrets_return_secret:
            result_binary_data, result_audio_offsets, result_error = (
                azure_speech_synthesis_services.regenerate_speech_from_text(
                    plaintext, language_accent_code))

        self.assertEqual(result_binary_data, mock_audio_data)
        self.assertEqual(result_audio_offsets, mock_word_boundaries)
        self.assertEqual(result_error, mock_error_details)

    @mock.patch('azure.cognitiveservices.speech.SpeechSynthesizer')
    @mock.patch('azure.cognitiveservices.speech.SpeechConfig')
    @mock.patch(
        'core.platform.azure_speech_synthesis.'
        'azure_speech_synthesis_services.WordBoundaryCollection')
    def test_regenerate_speech_from_text_failed(
        self,
        mock_word_boundary_collection: mock.Mock,
        mock_speech_config: mock.Mock,
        mock_speech_synthesizer: mock.Mock
    ) -> None:
        plaintext = 'This is a test text'
        language_accent_code = 'en-US'
        ssml_text = (
            azure_speech_synthesis_services.convert_plaintext_to_ssml_content(
                plaintext, language_accent_code))
        mock_audio_data = b''

        mock_speech_config_instance = mock_speech_config.return_value
        mock_speech_config_instance.set_speech_synthesis_output_format = (
            mock.MagicMock())
        mock_speech_synthesizer_instance = mock_speech_synthesizer.return_value
        mock_speech_synthesis_result = mock.MagicMock()
        mock_speech_synthesis_result.audio_data = mock_audio_data
        mock_cancellation_details = mock.MagicMock()

        error_details = (
            'Azure speech synthesis failed becuase of `custom message`.')
        mock_cancellation_details.reason = speechsdk.CancellationReason.Error
        mock_cancellation_details.error_details = error_details

        mock_speech_synthesis_result.reason = (
            speechsdk.ResultReason.Canceled)
        mock_speech_synthesis_result.cancellation_details = (
            mock_cancellation_details)
        (
            mock_speech_synthesizer_instance.speak_ssml_async.
            return_value.get.return_value
        ) = mock_speech_synthesis_result
        mock_word_boundary_instance = mock.MagicMock()
        mock_word_boundaries: List[Dict[str, Union[str, float]]] = []
        mock_word_boundary_instance.audio_offset_list = (
            mock_word_boundaries)
        mock_word_boundary_collection.return_value = mock_word_boundary_instance

        with self.swap_api_key_secrets_return_secret:
            result_binary_data, result_audio_offsets, result_error = (
                azure_speech_synthesis_services.regenerate_speech_from_text(
                    plaintext, language_accent_code))

        (
            mock_speech_config_instance.set_speech_synthesis_output_format.
            assert_called_once_with(
                speechsdk.SpeechSynthesisOutputFormat
                .Audio24Khz160KBitRateMonoMp3)
        )
        (
            mock_speech_synthesizer_instance.speak_ssml_async.
            assert_called_once_with(ssml_text)
        )

        self.assertEqual(result_binary_data, mock_audio_data)
        self.assertEqual(result_audio_offsets, mock_word_boundaries)
        self.assertEqual(result_error, error_details)

    def test_should_return_word_boundary_collection_correctly(self) -> None:
        word_boundary_collection = (
            azure_speech_synthesis_services.WordBoundaryCollection())

        mock_word_boundary_event = mock.MagicMock()
        mock_word_boundary_event.text = 'Hello'
        mock_word_boundary_event.audio_offset = 10000
        word_boundary_collection.word_boundary_event(mock_word_boundary_event)

        mock_word_boundary_event.text = 'world'
        mock_word_boundary_event.audio_offset = 20000
        word_boundary_collection.word_boundary_event(mock_word_boundary_event)

        expected_word_boundary_collection = [
            {'token': 'Hello', 'audio_offset_msecs': 1.0},
            {'token': 'world', 'audio_offset_msecs': 2.0}
        ]

        self.assertEqual(
            word_boundary_collection.audio_offset_list,
            expected_word_boundary_collection)
