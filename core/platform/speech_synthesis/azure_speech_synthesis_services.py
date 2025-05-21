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

import json
import os
import re

from core import feconf
from core import utils
from core.constants import constants
from core.domain import voiceover_services
from core.platform import models
import azure.cognitiveservices.speech as speechsdk
from typing import Dict, List, Optional, Tuple, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import secrets_services

secrets_services = models.Registry.import_secrets_services()


# A structured SSML template text used for speech synthesis with the Azure
# Text-to-Speech service. The template contains placeholders for specifying the
# language code, the voice code, and the speech content respectively.
SSML_TEMPLATE_FOR_SPEECH_SYNTHESIS = """
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="%s">
    <voice name="%s">
        %s
    </voice>
</speak>
"""

# A string template block representing the math content within the SSML.
MATH_TEMPLATE_SSML_BLOCK = """<say-as interpret-as="math">%s</say-as>"""

# A string template block representing the main content within the SSML.
MAIN_CONTENT_SSML_TEMPLATE_BLOCK = """
    <p>
        %s
    </p>
"""

# Standard arithmetic operators used to separate text with math expressions in
# an SSML string.
COMMONLY_USED_ARITHMETIC_EXPRESSIONS = [
    '+', ' - ', '*', ' / ', '×', '÷', '=']


class WordBoundaryCollection:
    """This class handles word boundary events to collect the time offsets
    for each word and punctuation from Azure-generated speech synthesis.
    """

    def __init__(self) -> None:
        self.audio_offset_list: List[Dict[str, Union[str, float]]] = []

    def word_boundary_event(self, event: speechsdk.SessionEventArgs) -> None:
        """Handles the word boundary events during speech synthesis.

        Args:
            event: SessionEventArgs. The event containing the time offset
                (in milliseconds) for each token (word or punctuation) in
                the synthesized speech.
        """
        audio_offset_record: Dict[str, Union[str, float]] = {
            'token': '',
            'audio_offset_msecs': 0.0
        }

        audio_offset_record['token'] = event.text
        audio_offset_record['audio_offset_msecs'] = event.audio_offset / 10000

        self.audio_offset_list.append(audio_offset_record)


def is_mathematical_text(text: str) -> bool:
    """The method determines whether the given text is mathematical by checking
    for the presence of common arithmetic operators.

    Args:
        text: str. The text to be analyzed for the presence of arithmetic
            operators.

    Returns:
        bool. A boolean value that signifies if the given text contains
        mathematical content.
    """
    for expression in COMMONLY_USED_ARITHMETIC_EXPRESSIONS:
        if expression in text:
            return True
    return False


def get_azure_voicecode_from_language_accent_code(
        language_accent_code: str
) -> str:
    """The method retrieves the voice code associated with the given language
    accent code from the `autogeneratable_language_accent_list.json` file.

    Args:
        language_accent_code: str. The language accent code for which the voice
            code should be retrieved.

    Returns:
        str. The Azure voice code associated with the given language accent
        code.
    """
    file_path = os.path.join(
        feconf.VOICEOVERS_DATA_DIR,
        'autogeneratable_language_accent_list.json'
    )
    with utils.open_file(file_path, 'r') as f:
        autogeneratable_language_accent_list = json.loads(
            f.read())

    voice_code: str = autogeneratable_language_accent_list[
        language_accent_code]['voice_code']
    return voice_code


def process_factorial_in_text(
        text: str, math_symbol_pronounciations: Dict[str, str]) -> str:
    """Process the text to convert factorial expressions into their
    corresponding words or phrases.

    Args:
        text: str. The text to be processed for factorial expressions.
        math_symbol_pronounciations: dict. The dictionary containing the
            pronunciations of mathematical symbols.

    Returns:
        str. The processed text with factorial expressions replaced by their
        corresponding words or phrases.
    """
    pronounciation = math_symbol_pronounciations['!'] + ' '
    return re.sub(r'(\d+)!', pronounciation + r'\1', text)


def process_superscript_in_text(
        text: str, math_symbol_pronounciations: Dict[str, str]) -> str:
    """Process the text to convert superscript characters into their
    corresponding words or phrases.

    Args:
        text: str. The text to be processed for superscript characters.
        math_symbol_pronounciations: dict. The dictionary containing the
            pronunciations of mathematical symbols.

    Returns:
        str. The processed text with superscript characters replaced by their
        corresponding words or phrases.
    """
    superscript_digits = {
        '⁰': '0',
        '¹': '1',
        '²': '2',
        '³': '3',
        '⁴': '4',
        '⁵': '5',
        '⁶': '6',
        '⁷': '7',
        '⁸': '8',
        '⁹': '9',
    }
    superscript_chars = list(superscript_digits.keys())
    superscript_chars.append('^')

    is_superscript_present = False
    for char in superscript_chars:
        if char in text:
            is_superscript_present = True
            break
    if not is_superscript_present:
        return text

    result = ''
    i = 0
    while i < len(text):
        char = text[i]
        if char in superscript_digits:
            number = ''
            while i < len(text) and text[i] in superscript_digits:
                number += superscript_digits[text[i]]
                i += 1
            result += '^%s' % str(number)
            continue
        result += char
        i += 1

    def get_pronounciation(superscript_chars: str) -> str:
        """Get the pronunciation for the given superscript characters.

        Args:
            superscript_chars: str. The superscript characters to be
                pronounced.

        Returns:
            str. The pronunciation of the superscript characters.
        """
        if superscript_chars == '^2':
            return ' ' + math_symbol_pronounciations['^2']
        elif superscript_chars == '^3':
            return ' ' + math_symbol_pronounciations['^3']
        return (
            ' ' + math_symbol_pronounciations['^'] +
            ' ' + superscript_chars[1:])

    result = re.sub(
        r'\^([\d]+)', lambda m: get_pronounciation(m.group(0)), result)

    return result


def process_algebric_fraction(text: str) -> str:
    """Transforms algebraic fractions in the text into a format with spaces
    around slashes. For example, 'x/2' becomes 'x / 2'.

    Args:
        text: str. The input text containing algebraic fractions.

    Returns:
        str. The text with algebraic fractions reformatted to include spaces
        around slashes.
    """
    text = re.sub(r'(\d+)/', r'\1 / ', text)
    text = re.sub(r'/(\d+)', r' / \1', text)
    return text


def convert_plaintext_to_ssml_content(
    plaintext: str, language_accent_code: str
) -> str:
    """The method transforms the given plaintext into SSML format using the
    SSML_TEMPLATE_FOR_SPEECH_SYNTHESIS.

    Speech Synthesis Markup Language (SSML) is an XML-based markup language
    that can be used to fine-tune the text-to-speech output attributes such as
    pitch, pronunciation, speaking rate, volume, and more.

    Args:
        plaintext: str. The text that should be converted into the primary
            content of the SSML.
        language_accent_code: str. The language accent code used to populate
            the SSML template placeholder.

    Returns:
        str. The SSMl text genrated from the provided plaintext.
    """
    content_list = plaintext.split(feconf.OPPIA_CONTENT_TAG_DELIMITER)

    language_code = (
        voiceover_services.get_language_code_from_language_accent_code(
            language_accent_code))

    math_symbol_pronounciations = (
        constants.LANGUAGE_CODE_TO_MATH_SYMBOL_PRONUNCIATIONS.get(
            language_code, {}))

    main_ssml_content = ''
    for content in content_list:
        # Updates the content to pronounce `-` correctly in the given language.
        if ' - ' in content:
            content = content.replace(
                '-',
                MATH_TEMPLATE_SSML_BLOCK % math_symbol_pronounciations['-'])

        # Update the content to pronounce `*` correctly in the given language.
        if ' * ' in content:
            content = content.replace(
                '*',
                MATH_TEMPLATE_SSML_BLOCK % math_symbol_pronounciations['*'])

        # Update the content to pronounce `×` correctly in the given language.
        if '×' in content:
            content = content.replace(
                '×',
                MATH_TEMPLATE_SSML_BLOCK % math_symbol_pronounciations['×'])

        # Update the content of algebraic fractions to contain spaces around
        # the slashes.
        content = process_algebric_fraction(content)

        # Update the content to pronounce `/` correctly in the given language.
        if ' / ' in content:
            content = content.replace(
                '/',
                MATH_TEMPLATE_SSML_BLOCK % math_symbol_pronounciations['÷'])

        # Update the content to pronounce `÷` correctly in the given language.
        if '÷' in content:
            content = content.replace(
                '÷',
                MATH_TEMPLATE_SSML_BLOCK % math_symbol_pronounciations['÷'])

        # Update the content to pronounce `+` correctly in the given language.
        if ' + ' in content:
            content = content.replace(
                '+',
                MATH_TEMPLATE_SSML_BLOCK % math_symbol_pronounciations['+'])

        # Update the content to pronounce `=` correctly in the given language.
        if ' = ' in content:
            content = content.replace(
                ' = ',
                MATH_TEMPLATE_SSML_BLOCK % math_symbol_pronounciations['='])

        # Update the content to pronounce factorials correctly in the given
        # language.
        content = process_factorial_in_text(
            content, math_symbol_pronounciations)

        # Update the content to pronounce superscripts correctly in the given
        # language.
        content = process_superscript_in_text(
            content, math_symbol_pronounciations)

        # Update the content to pronounce 'dash' for two or more underscores in
        # the content.
        content = re.sub(r'_{2,}', ' dash ', content)

        main_ssml_content += (MAIN_CONTENT_SSML_TEMPLATE_BLOCK % content)

    return SSML_TEMPLATE_FOR_SPEECH_SYNTHESIS % (
        language_accent_code,
        get_azure_voicecode_from_language_accent_code(language_accent_code),
        main_ssml_content
    )


def regenerate_speech_from_text(
    plaintext: str,
    language_accent_code: str
) -> Tuple[bytes, List[Dict[str, Union[str, float]]], Optional[str]]:
    """Regenerates speech (Oppia's voiceovers) from the provided text.

    This method uses Azure Text-to-Speech to synthesize speech from the input
    plainttext. The generated speech is returned as binary audio data along
    with tokenized word boundary details.

    Args:
        plaintext: str. The plaintext that needs to be synthesized into speech.
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

    Raises:
        Exception. The Azure API key is not stored in cloud secrets.
    """

    # Azure text-to-speech API key.
    azure_tts_api_key = secrets_services.get_secret('AZURE_TTS_API_KEY')

    if azure_tts_api_key is None:
        raise Exception('Azure TTS API key is not available.')

    # Azure text-to-speech resource region.
    azure_tts_region = feconf.AZURE_TEXT_TO_SPEECH_REGION

    # Speech Configuration for Azure TTS.
    speech_config = speechsdk.SpeechConfig(
        subscription=azure_tts_api_key,
        region=azure_tts_region)

    # Configuring audio format to MP3.
    speech_config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3)

    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=None)

    word_boundary_collection_instance: WordBoundaryCollection = (
        WordBoundaryCollection())
    speech_synthesizer.synthesis_word_boundary.connect(
        word_boundary_collection_instance.word_boundary_event)

    ssml_text_for_speech_synthesis = convert_plaintext_to_ssml_content(
        plaintext, language_accent_code)

    speech_synthesis_result = speech_synthesizer.speak_ssml_async(
        ssml_text_for_speech_synthesis).get()

    binary_audio_data = speech_synthesis_result.audio_data

    error_details = None
    if speech_synthesis_result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = speech_synthesis_result.cancellation_details

        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            error_details = cancellation_details.error_details

    return (
        binary_audio_data,
        word_boundary_collection_instance.audio_offset_list,
        error_details
    )
