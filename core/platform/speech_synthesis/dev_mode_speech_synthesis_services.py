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

"""Services for handling speech synthesis using Azure API calls.
Documentation link: https://learn.microsoft.com/en-us/azure/ai-services/
speech-service/index-text-to-speech.
"""

from __future__ import annotations

import os

from core import feconf
from core.domain import voiceover_services

from typing import Dict, List, Optional, Tuple, Union

LANGUAGE_CODE_TO_VOICEOVER_FILENAMES: Dict[str, str] = {
    'ar': 'arabic.mp3',
    'en': 'english.mp3',
    'hi': 'hindi.mp3',
    'pt': 'portueguese.mp3'
}


def regenerate_speech_from_text(
    _: str,
    language_accent_code: str
) -> Tuple[bytes, List[Dict[str, Union[str, float]]], Optional[str]]:
    """The method provides mock data to simulate the Azure text-to-speech
    synthesis service in the development environment.

    Args:
        _: str. The plaintext that needs to be synthesized into speech.
        language_accent_code: str. The language accent code in which the speech
            is to be synthesized.

    Returns:
        tuple. A tuple containing three elements:
            - bytes. The raw binary for the synthesized speech in MP3 format.
            - list(dict): A list of dictionaries where each entry contains
            (a). `token` (str) A token from the provided text (either a word or
            punctuation). (b). `audio_offset_msecs` (float): The time offset
            in milliseconds for the token in the synthesized speech.
            - str|None: A string describing any error encountered during
            speech synthesis. None, if synthesis is successful.
    """
    language_code = (
        voiceover_services.get_language_code_from_language_accent_code(
            language_accent_code))

    if language_code not in LANGUAGE_CODE_TO_VOICEOVER_FILENAMES:
        # Default language code.
        language_code = 'en'

    assert isinstance(language_code, str)
    voiceover_filename: str = LANGUAGE_CODE_TO_VOICEOVER_FILENAMES[
        language_code]

    voiceover_path = os.path.join(
        feconf.SAMPLE_AUTO_VOICEOVERS_DATA_DIR, voiceover_filename)

    with open(voiceover_path, 'rb') as file:
        binary_audio_data = file.read()

    error_details = None
    dummy_word_to_audio_offset: List[Dict[str, Union[str, float]]] = [
        {'token': 'This', 'audio_offset_msecs': 0.0},
        {'token': 'is', 'audio_offset_msecs': 100.0},
        {'token': 'a', 'audio_offset_msecs': 200.0},
        {'token': 'test', 'audio_offset_msecs': 300.0},
        {'token': 'text', 'audio_offset_msecs': 400.0},
    ]

    return (
        binary_audio_data,
        dummy_word_to_audio_offset,
        error_details
    )
