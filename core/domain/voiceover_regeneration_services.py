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

"""Service functions related to automatic voiceover regenration using the cloud
services.
"""

from __future__ import annotations

import html
import io
import json

from core import feconf
from core.domain import fs_services
from core.platform import models

import bs4
from mutagen import mp3
from pylatexenc import latex2text
from typing import Dict, List, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import speech_synthesis_services
    from mypy_imports import voiceover_models

(voiceover_models,) = models.Registry.import_models([
    models.Names.VOICEOVER])

speech_synthesis_services = (
    models.Registry.import_azure_speech_synthesis_services())


ALLOWED_CUSTOM_OPPIA_RTE_TAGS = [
    'oppia-noninteractive-collapsible',
    'oppia-noninteractive-image',
    'oppia-noninteractive-link',
    'oppia-noninteractive-math',
    'oppia-noninteractive-video',
    'oppia-noninteractive-skillreview',
    'oppia-noninteractive-tabs'
]


def convert_custom_oppia_tags_to_generic_tags(element: bs4.Tag) -> bs4.Tag:
    """The method transforms custom Oppia tags into standard paragraph tags.

    Args:
        element: Tag. A custom Oppia tag that will be transformed into a
            standard paragraph tag.

    Returns:
        Tag. The transformed paragraph tag.
    """
    # The custom tags for images, videos, tabs, and collapsible
    # tags are not processed here because we do not plan to
    # provide voiceovers for the text associated with these tags.

    if element.name in [
        'oppia-noninteractive-link',
        'oppia-noninteractive-skillreview'
    ]:
        escaped_text = element.get('text-with-value')
        text = html.unescape(escaped_text)
        element.string = json.loads(text)
    elif element.name == 'oppia-noninteractive-math':
        escaped_math_content = element.get('math_content-with-value')
        math_content = json.loads(html.unescape(escaped_math_content))
        latex_expr = math_content['raw_latex']
        converter = latex2text.LatexNodes2Text()
        element.string = converter.latex_to_text(latex_expr)

    element.name = 'p'
    return element


def parse_html(html_content: str) -> str:
    """The method processes the HTML content and extracts the plain text.

    Args:
        html_content: str. HTML content that will be transformed into plain
            text.

    Returns:
        str. The plain text retrieved from the HTML content.
    """

    soup = bs4.BeautifulSoup(html_content, 'html.parser')
    for custom_tag_element in ALLOWED_CUSTOM_OPPIA_RTE_TAGS:
        for element in soup.find_all(custom_tag_element):
            convert_custom_oppia_tags_to_generic_tags(element)

    text_content: str = soup.get_text(
        separator=feconf.OPPIA_CONTENT_TAG_DELIMITER, strip=True)

    return text_content


def synthesize_voiceover_for_html_string(
    exploration_id: str,
    content_html: str,
    language_accent_code: str,
    voiceover_filename: str
) -> List[Dict[str, Union[str, float]]]:
    """The method generates automated voiceovers for the given HTML content
    using cloud service helper functions.

    Args:
        exploration_id: str. The exploration ID associated with the content.
        content_html: str. The HTML content string for which the automated
            voiceover is to be generated.
        language_accent_code: str. The language accent code for generating the
            automated voiceover.
        voiceover_filename: str. The filename for the generated voiceover.

    Returns:
        list(dict(str, str|float)). A list of dictionaries. Each dictionary
        contains two keys: 'token', which holds a string representing a word
        or punctionation from the content, and 'audio_offset_msecs', which
        stores a float value representing the associated time offset in the
        audio in msecs.
        Note: This field only contains the audio offset for automated
        voiceovers that are synthesized from using cloud service. These audio
        offsets are not provided or stored for manual voiceovers.

    Raises:
        Exception. Error encountered during automatic voiceover regeneration.
    """
    # Audio files are stored to the datastore in the dev env, and to GCS
    # in production.
    fs = fs_services.GcsFileSystem(
        feconf.ENTITY_TYPE_EXPLORATION, exploration_id)

    parsed_text = parse_html(content_html)

    content_hash_code = (
        voiceover_models.CachedAutomaticVoiceoversModel.
        generate_hash_from_text(parsed_text)
    )

    cached_model = (
        voiceover_models.CachedAutomaticVoiceoversModel.
        get_cached_automatic_voiceover_model(
            content_hash_code,
            language_accent_code,
            feconf.OPPIA_AUTOMATIC_VOICEOVER_PROVIDER
        )
    )

    audio_offset_list: List[Dict[str, Union[str, float]]] = []

    is_cached_model_used_for_voiceovers = False

    if cached_model is not None:
        error_details = None
        if cached_model.plaintext == parsed_text:
            audio_offset_list = (
                cached_model.audio_offset_list)
            filename = cached_model.voiceover_filename
            binary_audio_data = fs.get('%s/%s' % ('audio', filename))
            is_cached_model_used_for_voiceovers = True

    if not is_cached_model_used_for_voiceovers:
        try:
            binary_audio_data, audio_offset_list, error_details = (
                speech_synthesis_services.regenerate_speech_from_text(
                    parsed_text, language_accent_code))
        except Exception as e:
            error_details = str(e)

    if error_details:
        raise Exception(error_details)

    tempbuffer = io.BytesIO()
    tempbuffer.write(binary_audio_data)
    tempbuffer.seek(0)
    audio = mp3.MP3(tempbuffer)
    tempbuffer.close()
    mimetype = 'audio/mpeg'
    # For a strange, unknown reason, the audio variable must be
    # deleted before opening cloud storage. If not, cloud storage
    # throws a very mysterious error that entails a mutagen
    # object being recursively passed around in app engine.
    del audio
    fs.commit(
        '%s/%s' % ('audio', voiceover_filename),
        binary_audio_data, mimetype=mimetype)

    # Case of Collison.
    if cached_model is not None:
        if cached_model.plaintext != parsed_text:
            if len(parsed_text) < len(cached_model.plaintext):
                # Since the current text is shorter than the one in the cached
                # model, there is a higher likelihood of repetition in
                # other content. Thus, updating the cached model to store the
                # current data.
                cached_model.plaintext = parsed_text
                cached_model.voiceover_filename = voiceover_filename
                cached_model.audio_offset_list = audio_offset_list
                cached_model.update_timestamps()
                cached_model.put()
    else:
        new_cached_model = (
            voiceover_models.CachedAutomaticVoiceoversModel.create_cache_model(
                language_accent_code,
                parsed_text,
                voiceover_filename,
                audio_offset_list))
        new_cached_model.update_timestamps()
        new_cached_model.put()

    return audio_offset_list
