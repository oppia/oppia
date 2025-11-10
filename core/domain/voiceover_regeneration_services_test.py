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
from core.domain import (
    exp_domain,
    exp_fetchers,
    exp_services,
    fs_services,
    rte_component_registry,
    translation_domain,
    translation_services,
    voiceover_regeneration_services,
    voiceover_services,
)
from core.platform import models
from core.tests import test_utils

import bs4
from typing import Dict, List, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import voiceover_models

(voiceover_models,) = models.Registry.import_models([models.Names.VOICEOVER])


class AutomaticVoiceoverRegenerationTests(test_utils.GenericTestBase):
    def test_should_able_to_convert_oppia_link_tag_to_p_tag(self) -> None:
        content_html = (
            '<p><oppia-noninteractive-link ng-version="11.2.14" '
            'text-with-value="&amp;quot;Oppia official website URL&amp;quot;" '
            'url-with-value="&amp;quot;https://www.oppia.org/&amp;quot;">'
            '</oppia-noninteractive-link></p>'
        )
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = 'Oppia official website URL'
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_should_able_to_convert_oppia_skill_review_tag_to_p_tag(
        self,
    ) -> None:
        content_html = (
            '<p><oppia-noninteractive-skillreview ng-version="11.2.14" '
            'skill_id-with-value="&amp;quot;1S2ANa4EKjJF&amp;quot;" '
            'text-with-value="&amp;quot;First concept card&amp;quot;">'
            '</oppia-noninteractive-skillreview></p>'
        )
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
            'tive-math></p>'
        )
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = 'x^2 + y^2 = z^2'
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_image_tag_has_empty_voiceover_string(self) -> None:
        content_html = (
            '<oppia-noninteractive-image alt-with-value="&amp;quot;Circle'
            '&amp;quot;" caption-with-value="&amp;quot;Circle&amp;quot;" '
            'filepath-with-value="&amp;quot;img_20250120_160503_kusnpv2um4_'
            'height_350_width_450.svg&amp;quot;" ng-version="11.2.14">'
            '</oppia-noninteractive-image>'
        )
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = ''
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_video_tag_has_empty_voiceover_string(self) -> None:
        content_html = (
            '<oppia-noninteractive-video autoplay-with-value=\"true\" '
            'end-with-value=\"20\" start-with-value=\"13\"'
            ' video_id-with-value=\"&amp;quot;Ntcw0H0hwPU&amp;'
            'quot;\"></oppia-noninteractive-video>'
        )
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = ''
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_should_able_to_convert_oppia_workedexample_tag_to_p_tag(
        self,
    ) -> None:
        content_html = (
            '<oppia-noninteractive-workedexample question-with-value="&amp;'
            'quot;&amp;lt;pre&amp;gt;&amp;lt;p&amp;gt;lorem ipsum&amp;'
            'lt;/p&amp;gt;&amp;lt;/pre&amp;gt;'
            '&amp;quot;" answer-with-value="&amp;quot;'
            'lorem ipsum&amp;quot;">'
            '</oppia-noninteractive-workedexample>'
        )
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = 'Example:\n\n<pre><p>lorem ipsum</p></pre>\n\nSolution:\n\nlorem ipsum'
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_collapsible_tag_has_empty_voiceover_string(self) -> None:
        content_html = (
            '<oppia-noninteractive-collapsible '
            'content-with-value=\'&amp;quot;&amp;quot;\' heading-with-value='
            '\'&amp;quot;&amp;quot;\'></oppia-noninteractive-collapsible>'
        )
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = ''
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_tab_tag_has_empty_voiceover_string(self) -> None:
        content_html = (
            '<oppia-noninteractive-tabs tab_contents-with-value=\'[{&amp;quot;'
            '&amp;quot;:&amp;quot;Hint introduction&amp;quot;,&amp;quot;content'
            '&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;hint&amp;lt;/p&amp;gt;&amp;'
            'quot;}]\'></oppia-noninteractive-tabs>'
        )
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
            '</oppia-noninteractive-skillreview></p>'
        )
        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        expected_parsed_text = (
            'Hello world; Italics text; Bullet list heading; '
            'Bullet list item 1; Bullet list item 2; concept card'
        )
        self.assertEqual(parsed_text, expected_parsed_text)

    def test_should_be_able_to_parse_single_html_tag_correctly(self) -> None:
        content_html = (
            '\u003cp\u003eEvaluate the expression  4 \u00d7 (3-2) + 6 '
            '\u00f7 2.\u003c/p\u003e'
        )
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
        parsed_text_hash_code = voiceover_models.CachedAutomaticVoiceoversModel.generate_hash_from_text(
            parsed_text
        )

        cached_model_id = '%s:%s:%s' % (
            language_accent_code,
            parsed_text_hash_code,
            provider,
        )

        cached_model = voiceover_models.CachedAutomaticVoiceoversModel.get(
            cached_model_id, strict=False
        )
        self.assertIsNone(cached_model)

        audio_offset_list = voiceover_regeneration_services.synthesize_voiceover_for_html_string(
            exploration_id, content_html, language_accent_code, filename
        )

        cached_model = voiceover_models.CachedAutomaticVoiceoversModel.get(
            cached_model_id
        )

        self.assertIsNotNone(cached_model)
        self.assertEqual(cached_model.hash_code, parsed_text_hash_code)
        self.assertEqual(cached_model.audio_offset_list, audio_offset_list)
        self.assertEqual(
            cached_model.language_accent_code, language_accent_code
        )
        self.assertEqual(cached_model.plaintext, parsed_text)

    def test_use_existing_cache_model_for_fetching_automatic_voiceover_data(
        self,
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
            {'token': 'model', 'audio_offset_msecs': 400.0},
        ]

        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, exploration_id
        )
        voiceover_filename_for_binary = 'english.mp3'
        voiceover_path = os.path.join(
            feconf.SAMPLE_AUTO_VOICEOVERS_DATA_DIR,
            voiceover_filename_for_binary,
        )
        mimetype = 'audio/mpeg'

        with open(voiceover_path, 'rb') as file:
            binary_audio_data = file.read()

        fs.commit(
            '%s/%s' % ('audio', filename), binary_audio_data, mimetype=mimetype
        )

        cached_model = (
            voiceover_models.CachedAutomaticVoiceoversModel.create_cache_model(
                language_accent_code, parsed_text, filename, audio_offset_list
            )
        )
        cached_model.update_timestamps()
        cached_model.put()

        generated_audio_offset_list = voiceover_regeneration_services.synthesize_voiceover_for_html_string(
            exploration_id, content_html, language_accent_code, filename
        )

        self.assertEqual(audio_offset_list, generated_audio_offset_list)

    @mock.patch(
        'core.domain.fs_services.GcsFileSystem.get',
        side_effect=Exception('Mocked exception during voiceover retrieval'),
    )
    def test_regenerate_voiceover_if_there_is_problem_in_cached_voiceover(
        self,
        _: mock.Mock,
    ) -> None:
        content_html = '<p>This is from cached model</p>'
        exploration_id = 'exp_id'
        language_accent_code = 'en-US'
        filename = 'content_0-en-US-asdjytdyop.mp3'

        parsed_text = voiceover_regeneration_services.parse_html(content_html)
        audio_offset_list: List[Dict[str, Union[str, float]]] = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'a', 'audio_offset_msecs': 200.0},
            {'token': 'test', 'audio_offset_msecs': 300.0},
            {'token': 'text', 'audio_offset_msecs': 400.0},
        ]

        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, exploration_id
        )
        voiceover_filename_for_binary = 'english.mp3'
        voiceover_path = os.path.join(
            feconf.SAMPLE_AUTO_VOICEOVERS_DATA_DIR,
            voiceover_filename_for_binary,
        )
        mimetype = 'audio/mpeg'

        with open(voiceover_path, 'rb') as file:
            binary_audio_data = file.read()

        fs.commit(
            '%s/%s' % ('audio', filename), binary_audio_data, mimetype=mimetype
        )

        cached_model = (
            voiceover_models.CachedAutomaticVoiceoversModel.create_cache_model(
                language_accent_code, parsed_text, filename, audio_offset_list
            )
        )
        cached_model.update_timestamps()
        cached_model.put()

        generated_audio_offset_list = voiceover_regeneration_services.synthesize_voiceover_for_html_string(
            exploration_id, content_html, language_accent_code, filename
        )

        self.assertEqual(audio_offset_list, generated_audio_offset_list)

    def test_update_cache_model_in_case_of_collision(self) -> None:
        content_html_1 = '<p>This is from cached model</p>'
        content_html_2 = '<p>This is a test text</p>'
        exploration_id = 'exp_id'
        language_accent_code = 'en-US'
        filename = 'content_0-en-US-asdjytdyop.mp3'
        provider = feconf.OPPIA_AUTOMATIC_VOICEOVER_PROVIDER

        parsed_text_1 = voiceover_regeneration_services.parse_html(
            content_html_1
        )
        parsed_text_2 = voiceover_regeneration_services.parse_html(
            content_html_2
        )
        parsed_text_2_hash_code = voiceover_models.CachedAutomaticVoiceoversModel.generate_hash_from_text(
            parsed_text_2
        )

        audio_offset_list_1 = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'from', 'audio_offset_msecs': 200.0},
            {'token': 'cached', 'audio_offset_msecs': 300.0},
            {'token': 'model', 'audio_offset_msecs': 400.0},
        ]
        audio_offset_list_2: List[Dict[str, Union[str, float]]] = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'a', 'audio_offset_msecs': 200.0},
            {'token': 'test', 'audio_offset_msecs': 300.0},
            {'token': 'text', 'audio_offset_msecs': 400.0},
        ]

        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, exploration_id
        )
        voiceover_filename_for_binary = 'english.mp3'
        voiceover_path = os.path.join(
            feconf.SAMPLE_AUTO_VOICEOVERS_DATA_DIR,
            voiceover_filename_for_binary,
        )
        mimetype = 'audio/mpeg'
        with open(voiceover_path, 'rb') as file:
            binary_audio_data = file.read()
        fs.commit(
            '%s/%s' % ('audio', filename), binary_audio_data, mimetype=mimetype
        )

        cached_model = (
            voiceover_models.CachedAutomaticVoiceoversModel.create_cache_model(
                language_accent_code,
                parsed_text_2,
                filename,
                audio_offset_list_2,
            )
        )
        # Here we intend to cause a collision, hence changing the plaintext.
        cached_model.plaintext = parsed_text_1
        cached_model.audio_offset_list = audio_offset_list_1
        cached_model.update_timestamps()
        cached_model.put()

        generated_audio_offset_list = voiceover_regeneration_services.synthesize_voiceover_for_html_string(
            exploration_id, content_html_2, language_accent_code, filename
        )
        self.assertEqual(audio_offset_list_2, generated_audio_offset_list)

        cached_model_id = '%s:%s:%s' % (
            language_accent_code,
            parsed_text_2_hash_code,
            provider,
        )
        reteived_cached_model = (
            voiceover_models.CachedAutomaticVoiceoversModel.get(cached_model_id)
        )

        self.assertIsNotNone(reteived_cached_model)
        self.assertEqual(
            reteived_cached_model.hash_code, parsed_text_2_hash_code
        )
        self.assertEqual(
            reteived_cached_model.audio_offset_list, audio_offset_list_2
        )
        self.assertEqual(
            reteived_cached_model.language_accent_code, language_accent_code
        )
        self.assertEqual(reteived_cached_model.plaintext, parsed_text_2)

    @mock.patch(
        'core.platform.speech_synthesis.'
        'dev_mode_speech_synthesis_services.regenerate_speech_from_text',
        side_effect=Exception('Mocked exception during voicever regeneration'),
    )
    def test_should_raise_exception_if_regeneration_failed(
        self, _: mock.Mock
    ) -> None:
        content_html = '<p> This is a test text </p>'
        exploration_id = 'exp_id'
        language_accent_code = 'en-US'
        filename = 'content_0-en-US-asdjytdyop.mp3'

        with self.assertRaisesRegex(
            Exception, 'Mocked exception during voicever regeneration'
        ):
            (
                voiceover_regeneration_services.synthesize_voiceover_for_html_string(
                    exploration_id, content_html, language_accent_code, filename
                )
            )

    def test_should_be_able_to_get_new_voiceover_filename(self) -> None:
        content_id = 'content_0'
        language_accent_code = 'en-US'
        filename = 'content_0-en-US-asdjytdyop.mp3'

        new_filename = (
            voiceover_regeneration_services.generate_new_voiceover_filename(
                content_id, language_accent_code
            )
        )

        self.assertNotEqual(filename, new_filename)
        self.assertTrue(new_filename.startswith('content_0-en-US-'))

    def test_should_get_html_string_from_exploration(self) -> None:
        editor_email = 'editor1@example.com'
        editor_username = 'editor1'
        self.signup(editor_email, editor_username)
        editor_id = self.get_user_id_from_email(editor_email)

        exploration_id = 'exp_id'
        content_html = '<p> This is a test text </p>'
        exploration = self.save_new_valid_exploration(
            exploration_id, 'user_id', title='Exploration title'
        )
        change_list = [
            exp_domain.ExplorationChange(
                {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (exp_domain.STATE_PROPERTY_CONTENT),
                    'state_name': 'Introduction',
                    'new_value': {
                        'content_id': 'content_0',
                        'html': content_html,
                    },
                }
            )
        ]
        exp_services.update_exploration(
            editor_id, exploration.id, change_list, 'Updates content'
        )

        exploration = exp_fetchers.get_exploration_by_id(exploration_id)

        retrieved_content_html = voiceover_regeneration_services.get_content_html_in_requested_language(
            exploration.id,
            exploration.version,
            'Introduction',
            'content_0',
            'en-US',
        )
        self.assertEqual(retrieved_content_html, content_html)

    def test_should_get_html_string_from_exploration_with_translation(
        self,
    ) -> None:
        entity_type = feconf.TranslatableEntityType.EXPLORATION
        entity_id = 'exp_id'
        entity_version = 1
        language_code = 'hi'
        content_html = '<p>यह एक परीक्षण पाठ है.</p>'

        translated_content = translation_domain.TranslatedContent(
            content_html,
            translation_domain.TranslatableContentFormat.HTML,
            False,
        )

        translation_services.add_new_translation(
            entity_type,
            entity_id,
            entity_version,
            language_code,
            'content_id_0',
            translated_content,
        )

        retrieved_content_html = voiceover_regeneration_services.get_content_html_in_requested_language(
            entity_id, entity_version, 'Introduction', 'content_id_0', 'hi-IN'
        )
        self.assertEqual(retrieved_content_html, content_html)

        with self.assertRaisesRegex(
            Exception,
            'Translation for content_id content_id_1 not found in language hi',
        ):
            (
                voiceover_regeneration_services.get_content_html_in_requested_language(
                    entity_id,
                    entity_version,
                    'Introduction',
                    'content_id_1',
                    'hi-IN',
                )
            )

    def test_should_regenerate_voiceover_for_exp_content(self) -> None:
        editor_email = 'editor1@example.com'
        editor_username = 'editor1'
        self.signup(editor_email, editor_username)
        editor_id = self.get_user_id_from_email(editor_email)

        exploration_id = 'exp_id'
        content_html = '<p> This is a test text </p>'
        exploration = self.save_new_valid_exploration(
            exploration_id, 'user_id', title='Exploration title'
        )
        change_list = [
            exp_domain.ExplorationChange(
                {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (exp_domain.STATE_PROPERTY_CONTENT),
                    'state_name': 'Introduction',
                    'new_value': {
                        'content_id': 'content_0',
                        'html': content_html,
                    },
                }
            )
        ]
        exp_services.update_exploration(
            editor_id, exploration.id, change_list, 'Updates content'
        )

        exploration = exp_fetchers.get_exploration_by_id(exploration_id)

        expected_sentence_tokens_with_durations = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'a', 'audio_offset_msecs': 200.0},
            {'token': 'test', 'audio_offset_msecs': 300.0},
            {'token': 'text', 'audio_offset_msecs': 400.0},
        ]

        voiceovers, sentence_tokens_with_durations = (
            voiceover_regeneration_services.regenerate_voiceover_for_exploration_content(
                exploration_id,
                exploration.version,
                'Introduction',
                'content_0',
                'en-US',
            )
        )

        self.assertTrue(voiceovers.filename.startswith('content_0-en-US-'))
        self.assertEqual(
            sentence_tokens_with_durations,
            expected_sentence_tokens_with_durations,
        )

    def test_get_text_with_delimiters_from_html_paragraphs(self) -> None:
        html = """
            <html>
                <body>
                    Text directly in the body.
                    <p> Hello world, <strong>this is a test</strong> text. </p>
                    <p> This is the third paragraph.</p>
                </body>
            </html>
        """
        soup = bs4.BeautifulSoup(html, 'html.parser')
        result = voiceover_regeneration_services.get_text_with_delimiters(
            soup, delimiter=feconf.OPPIA_CONTENT_TAG_DELIMITER
        )
        self.assertEqual(
            result,
            'Text directly in the body.; Hello world, this is a test text.; '
            'This is the third paragraph.',
        )

    def test_should_regenerate_voiceovers_of_exploration(self) -> None:
        editor_email = 'editor1@example.com'
        editor_username = 'editor1'
        self.signup(editor_email, editor_username)

        exploration_id = 'exp_id'
        exploration_version = 2
        content_id = 'content_0'
        language_accent_code = 'en-US'
        exploration_id = 'exp_id'
        content_html = '<p> This is a test text </p>'

        entity_voiceovers_models = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                exploration_id, 'exploration', exploration_version
            )
        )
        self.assertEqual(len(entity_voiceovers_models), 0)
        errors_while_voiceover_regeneration = voiceover_regeneration_services.regenerate_voiceovers_of_exploration(
            exploration_id,
            exploration_version,
            {content_id: content_html},
            language_accent_code,
        )
        self.assertEqual(errors_while_voiceover_regeneration, [])
        entity_voiceovers_models = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                exploration_id, 'exploration', exploration_version
            )
        )
        self.assertEqual(len(entity_voiceovers_models), 1)

    def test_should_return_errors_if_voiceover_regeneration_fails(self) -> None:
        exploration_id = 'exp_id'
        exploration_version = 2
        content_id = 'content_0'
        language_accent_code = 'en-US'
        exploration_id = 'exp_id'
        content_html = '<p> This is a test text </p>'

        # Mock the voiceover synthesis function to raise an exception.
        def mock_synthesize_voiceover_for_html_string(
            exploration_id: str,
            content_html: str,
            language_accent_code: str,
            voiceover_filename: str,
        ) -> List[Dict[str, Union[str, float]]]:
            raise Exception('Mocked exception during voiceover regeneration')

        with self.swap(
            voiceover_regeneration_services,
            'synthesize_voiceover_for_html_string',
            mock_synthesize_voiceover_for_html_string,
        ):
            errors_while_voiceover_regeneration = voiceover_regeneration_services.regenerate_voiceovers_of_exploration(
                exploration_id,
                exploration_version,
                {content_id: content_html},
                language_accent_code,
            )
        self.assertEqual(
            errors_while_voiceover_regeneration,
            [('content_0', 'Mocked exception during voiceover regeneration')],
        )

    def test_all_custom_tags_have_associated_voiceover_extraction_rules(
        self,
    ) -> None:
        existing_custom_rte_tags = list(
            rte_component_registry.Registry.get_tag_list_with_attrs().keys()
        )

        self.assertGreater(len(existing_custom_rte_tags), 0)

        custom_tags_with_voiceover_extraction_rules = list(
            voiceover_regeneration_services.CUSTOM_RTE_TAGS_TO_VOICEOVER_TEXT_EXTRACTION_RULES.keys()
        )

        self.assertEqual(
            sorted(existing_custom_rte_tags),
            sorted(custom_tags_with_voiceover_extraction_rules),
        )
