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

"""Tests for automatic voiecover regenration service methods."""

from __future__ import annotations

import os
from unittest import mock

from core import feconf
from core.domain import fs_services
from core.domain import voiceover_regeneration_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, List, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import voiceover_models

(voiceover_models,) = models.Registry.import_models([
    models.Names.VOICEOVER])


class AutomaticVoiceoverRegenerationTests(test_utils.GenericTestBase):
    def test_should_able_to_convert_oppia_link_tag_to_p_tag(self) -> None:
        content_html = (
            '<p><oppia-noninteractive-link ng-version="11.2.14" '
            'text-with-value="&amp;quot;Oppia official website URL&amp;quot;" '
            'url-with-value="&amp;quot;https://www.oppia.org/&amp;quot;">'
            '</oppia-noninteractive-link></p>')
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = 'Oppia official website URL'
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_should_able_to_convert_oppia_skill_review_tag_to_p_tag(
        self
    ) -> None:
        content_html = (
            '<p><oppia-noninteractive-skillreview ng-version="11.2.14" '
            'skill_id-with-value="&amp;quot;1S2ANa4EKjJF&amp;quot;" '
            'text-with-value="&amp;quot;First concept card&amp;quot;">'
            '</oppia-noninteractive-skillreview></p>')
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = 'First concept card'
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_should_able_to_convert_oppia_math_tag_to_p_tag(self) -> None:
        content_html = (
            '<p><oppia-noninteractive-math math_content-with-value="'
            '{&amp;quot;raw_latex&amp;quot;:&amp;quot;x^2 + y^2 = z^2&amp;'
            'quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;'
            'mathImg_20250120_160257_55t4cfik6h_height_2d85_width_12d757_verti'
            'cal_0d715.svg&amp;quot;}" ng-version="11.2.14"></oppia-noninterac'
            'tive-math></p>')
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = 'x^2 + y^2 = z^2'
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_should_not_convert_oppia_image_tag_to_p_tags(self) -> None:
        content_html = (
            '<oppia-noninteractive-image alt-with-value="&amp;quot;Circle'
            '&amp;quot;" caption-with-value="&amp;quot;Circle&amp;quot;" '
            'filepath-with-value="&amp;quot;img_20250120_160503_kusnpv2um4_'
            'height_350_width_450.svg&amp;quot;" ng-version="11.2.14">'
            '</oppia-noninteractive-image>')
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = ''
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_should_be_able_to_parse_multiple_html_tags_correctly(self) -> None:
        content_html = (
            '<p>Hello world</p>\n\n<p><em>Italics text</em></p>\n\n<p>'
            'Bullet list heading</p>\n\n<ul>\n\t<li>Bullet list item 1</li>\n'
            '\t<li>\n\t<p>Bullet list item 2</p>\n\t</li>\n</ul>\n\n<p>'
            '<oppia-noninteractive-skillreview ng-version="11.2.14" '
            'skill_id-with-value="&amp;quot;CjO0L1DTZRwv&amp;quot;" '
            'text-with-value="&amp;quot;concept card&amp;quot;">'
            '</oppia-noninteractive-skillreview></p>')
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = (
            'Hello world; Italics text; Bullet list heading; '
            'Bullet list item 1; Bullet list item 2; concept card')
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_should_be_able_to_parse_single_html_tag_correctly(self) -> None:
        content_html = (
            '\u003cp\u003eEvaluate the expression  4 \u00d7 (3-2) + 6 '
            '\u00f7 2.\u003c/p\u003e')
        expected_parsed_text = 'Evaluate the expression  4 × (3-2) + 6 ÷ 2.'
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_should_be_able_to_regenerate_automatic_voiceovers(self) -> None:
        content_html = '<p>Hello world, this is a dummy text.</p>'
        exploration_id = 'exp_id'
        language_accent_code = 'en-US'
        filename = 'content_0-en-US-asdjytdyop.mp3'
        provider = feconf.OPPIA_AUTOMATIC_VOICEOVER_PROVIDER

        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        parsed_text_hash_code = (
            voiceover_models.CachedAutomaticVoiceoversModel.
            generate_hash_from_text(parsed_text))

        cached_model_id = '%s:%s:%s' % (
                           language_accent_code,
                           parsed_text_hash_code,
                           provider
                        )

        cached_model = (
            voiceover_models.CachedAutomaticVoiceoversModel.get(
                cached_model_id, strict=False)
        )
        self.assertIsNone(cached_model)

        audio_offset_list = (
            voiceover_regeneration_services.
            synthesize_voiceover_for_html_string(
                exploration_id, content_html, language_accent_code, filename))

        cached_model = (
            voiceover_models.CachedAutomaticVoiceoversModel.get(
                cached_model_id))

        self.assertIsNotNone(cached_model)
        self.assertEqual(cached_model.hash_code, parsed_text_hash_code)
        self.assertEqual(cached_model.audio_offset_list, audio_offset_list)
        self.assertEqual(
            cached_model.language_accent_code, language_accent_code)
        self.assertEqual(cached_model.plaintext, parsed_text)

    def test_use_existing_cache_model_for_fetching_automatic_voiceover_data(
        self
    ) -> None:
        content_html = '<p>This is from cached model</p>'
        exploration_id = 'exp_id'
        language_accent_code = 'en-US'
        filename = 'content_0-en-US-asdjytdyop.mp3'

        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        audio_offset_list: List[Dict[str, Union[str, float]]] = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'from', 'audio_offset_msecs': 200.0},
            {'token': 'cached', 'audio_offset_msecs': 300.0},
            {'token': 'model', 'audio_offset_msecs': 400.0}
        ]

        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, exploration_id)
        voiceover_filename_for_binary = 'english.mp3'
        voiceover_path = os.path.join(
        feconf.SAMPLE_AUTO_VOICEOVERS_DATA_DIR, voiceover_filename_for_binary)
        mimetype = 'audio/mpeg'

        with open(voiceover_path, 'rb') as file:
            binary_audio_data = file.read()

        fs.commit(
        '%s/%s' % ('audio', filename),
        binary_audio_data, mimetype=mimetype)

        cached_model = (
            voiceover_models.CachedAutomaticVoiceoversModel.create_cache_model(
                language_accent_code, parsed_text, filename, audio_offset_list))
        cached_model.update_timestamps()
        cached_model.put()

        generated_audio_offset_list = (
            voiceover_regeneration_services.
            synthesize_voiceover_for_html_string(
                exploration_id, content_html, language_accent_code, filename))

        self.assertEqual(audio_offset_list, generated_audio_offset_list)

    def test_update_cache_model_in_case_of_collision(self) -> None:
        content_html_1 = '<p>This is from cached model</p>'
        content_html_2 = '<p>This is a test text</p>'
        exploration_id = 'exp_id'
        language_accent_code = 'en-US'
        filename = 'content_0-en-US-asdjytdyop.mp3'
        provider = feconf.OPPIA_AUTOMATIC_VOICEOVER_PROVIDER

        parsed_text_1 = voiceover_regeneration_services.parse_html(
            content_html_1)
        parsed_text_2 = voiceover_regeneration_services.parse_html(
            content_html_2)
        parsed_text_2_hash_code = (
            voiceover_models.CachedAutomaticVoiceoversModel.
            generate_hash_from_text(parsed_text_2))

        audio_offset_list_1 = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'from', 'audio_offset_msecs': 200.0},
            {'token': 'cached', 'audio_offset_msecs': 300.0},
            {'token': 'model', 'audio_offset_msecs': 400.0}
        ]
        audio_offset_list_2: List[Dict[str, Union[str, float]]] = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'a', 'audio_offset_msecs': 200.0},
            {'token': 'test', 'audio_offset_msecs': 300.0},
            {'token': 'text', 'audio_offset_msecs': 400.0},
        ]

        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, exploration_id)
        voiceover_filename_for_binary = 'english.mp3'
        voiceover_path = os.path.join(
        feconf.SAMPLE_AUTO_VOICEOVERS_DATA_DIR, voiceover_filename_for_binary)
        mimetype = 'audio/mpeg'
        with open(voiceover_path, 'rb') as file:
            binary_audio_data = file.read()
        fs.commit(
            '%s/%s' % ('audio', filename), binary_audio_data, mimetype=mimetype)

        cached_model = (
            voiceover_models.CachedAutomaticVoiceoversModel.create_cache_model(
                language_accent_code,
                parsed_text_2,
                filename,
                audio_offset_list_2))
        # Here we intend to cause a collision, hence changing the plaintext.
        cached_model.plaintext = parsed_text_1
        cached_model.audio_offset_list = audio_offset_list_1
        cached_model.update_timestamps()
        cached_model.put()

        generated_audio_offset_list = (
            voiceover_regeneration_services.
            synthesize_voiceover_for_html_string(
                exploration_id, content_html_2, language_accent_code, filename))
        self.assertEqual(audio_offset_list_2, generated_audio_offset_list)

        cached_model_id = '%s:%s:%s' % (
            language_accent_code,
            parsed_text_2_hash_code,
            provider
        )
        reteived_cached_model = (
            voiceover_models.CachedAutomaticVoiceoversModel.get(
                cached_model_id))

        self.assertIsNotNone(reteived_cached_model)
        self.assertEqual(
            reteived_cached_model.hash_code, parsed_text_2_hash_code)
        self.assertEqual(
            reteived_cached_model.audio_offset_list, audio_offset_list_2)
        self.assertEqual(
            reteived_cached_model.language_accent_code, language_accent_code)
        self.assertEqual(
            reteived_cached_model.plaintext, parsed_text_2)

    @mock.patch(
        'core.platform.azure_speech_synthesis.'
        'dev_mode_azure_speech_synthesis_services.regenerate_speech_from_text',
        side_effect=Exception('Mocked exception during voicever regeneration')
    )
    def test_should_raise_exception_if_regeneration_failed(
        self, _: mock.Mock
    ) -> None:
        content_html = '<p> This is a test text </p>'
        exploration_id = 'exp_id'
        language_accent_code = 'en-US'
        filename = 'content_0-en-US-asdjytdyop.mp3'

        with self.assertRaisesRegex(
            Exception,
            'Mocked exception during voicever regeneration'
        ):
            (
                voiceover_regeneration_services.
                synthesize_voiceover_for_html_string(
                    exploration_id,
                    content_html,
                    language_accent_code,
                    filename
                )
            )
