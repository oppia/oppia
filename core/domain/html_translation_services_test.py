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

"""Tests for HTML translation pre/post-processing services."""

from __future__ import annotations

import json

from core.domain import html_translation_services
from core.tests import test_utils


class ProtectHtmlForTranslationTests(test_utils.GenericTestBase):
    """Tests for protect_html_for_translation."""

    def test_returns_empty_string_unchanged(self) -> None:
        self.assertEqual(
            html_translation_services.protect_html_for_translation(''), ''
        )

    def test_plain_text_is_unchanged(self) -> None:
        source = '<p>Hello world</p>'
        self.assertEqual(
            html_translation_services.protect_html_for_translation(source),
            source,
        )

    def test_math_component_gets_translate_no(self) -> None:
        source = (
            '<p>Find the area: '
            '<oppia-noninteractive-math math_content-with-value="x²">'
            '</oppia-noninteractive-math></p>'
        )
        result = html_translation_services.protect_html_for_translation(source)
        self.assertIn('translate="no"', result)
        self.assertIn('math_content-with-value', result)

    def test_video_component_gets_translate_no(self) -> None:
        source = (
            '<oppia-noninteractive-video video_id-with-value="abc123">'
            '</oppia-noninteractive-video>'
        )
        result = html_translation_services.protect_html_for_translation(source)
        self.assertIn('translate="no"', result)

    def test_skillreview_component_gets_translate_no(self) -> None:
        source = (
            '<oppia-noninteractive-skillreview skill_id-with-value="abc"'
            ' text-with-value="Fractions">'
            '</oppia-noninteractive-skillreview>'
        )
        result = html_translation_services.protect_html_for_translation(source)
        self.assertIn('translate="no"', result)
        # text-with-value should NOT be extracted for skillreview.
        self.assertNotIn('data-oi-attr', result)

    def test_link_text_extracted_url_preserved(self) -> None:
        source = (
            '<oppia-noninteractive-link url-with-value="https://oppia.org"'
            ' text-with-value="Learn more">'
            '</oppia-noninteractive-link>'
        )
        result = html_translation_services.protect_html_for_translation(source)
        # text-with-value extracted into a span.
        self.assertIn('data-oi-attr="text-with-value"', result)
        self.assertIn('Learn more', result)
        # url-with-value preserved on the component.
        self.assertIn('url-with-value="https://oppia.org"', result)
        # text-with-value removed from component.
        self.assertNotIn('oppia-noninteractive-link text-with-value', result)

    def test_image_alt_and_caption_extracted(self) -> None:
        source = (
            '<oppia-noninteractive-image filepath-with-value="img.png"'
            ' alt-with-value="A red car"'
            ' caption-with-value="Figure 1">'
            '</oppia-noninteractive-image>'
        )
        result = html_translation_services.protect_html_for_translation(source)
        self.assertIn('data-oi-attr="alt-with-value"', result)
        self.assertIn('data-oi-attr="caption-with-value"', result)
        self.assertIn('A red car', result)
        self.assertIn('Figure 1', result)
        # filepath must be preserved on the component.
        self.assertIn('filepath-with-value="img.png"', result)

    def test_collapsible_heading_extracted_content_protected(self) -> None:
        source = (
            '<oppia-noninteractive-collapsible'
            ' heading-with-value="Show solution"'
            ' content-with-value="&lt;p&gt;Step 1&lt;/p&gt;">'
            '</oppia-noninteractive-collapsible>'
        )
        result = html_translation_services.protect_html_for_translation(source)
        self.assertIn('data-oi-attr="heading-with-value"', result)
        self.assertIn('Show solution', result)
        self.assertIn('data-oi-attr="content-with-value"', result)
        self.assertIn('Step 1', result)

    def test_workedexample_question_extracted_answer_protected(self) -> None:
        source = (
            '<oppia-noninteractive-workedexample'
            ' question-with-value="Solve for x"'
            ' answer-with-value="&lt;p&gt;x=5&lt;/p&gt;">'
            '</oppia-noninteractive-workedexample>'
        )
        result = html_translation_services.protect_html_for_translation(source)
        self.assertIn('data-oi-attr="question-with-value"', result)
        self.assertIn('Solve for x', result)
        self.assertIn('data-oi-attr="answer-with-value"', result)
        self.assertIn('x=5', result)

    def test_tabs_json_unpacked_into_temp_elements(self) -> None:
        tabs = json.dumps(
            [{'title': 'Hint', 'content': '&lt;p&gt;Try again&lt;/p&gt;'}]
        )
        source = (
            '<oppia-noninteractive-tabs tab_contents-with-value=\'%s\'>'
            '</oppia-noninteractive-tabs>' % tabs
        )
        result = html_translation_services.protect_html_for_translation(source)
        self.assertIn('data-oi-attr="tab-title-0"', result)
        self.assertIn('Hint', result)
        self.assertIn('data-oi-attr="tab-content-0"', result)
        self.assertIn('Try again', result)

    def test_anchor_tag_is_not_protected(self) -> None:
        source = '<a href="https://example.com">Click here</a>'
        result = html_translation_services.protect_html_for_translation(source)
        self.assertNotIn('translate="no"', result)
        self.assertIn('href="https://example.com"', result)

    def test_function_is_idempotent(self) -> None:
        source = (
            '<oppia-noninteractive-math math_content-with-value="x²">'
            '</oppia-noninteractive-math>'
        )
        once = html_translation_services.protect_html_for_translation(source)
        twice = html_translation_services.protect_html_for_translation(once)
        self.assertEqual(once.count('translate="no"'), 1)
        self.assertEqual(twice.count('translate="no"'), 1)


class PostprocessTranslatedHtmlTests(test_utils.GenericTestBase):
    """Tests for postprocess_translated_html."""

    def test_empty_string_returns_empty_string(self) -> None:
        self.assertEqual(
            html_translation_services.postprocess_translated_html(''), ''
        )

    def test_strips_translate_no(self) -> None:
        source = (
            '<oppia-noninteractive-math translate="no"'
            ' math_content-with-value="x²">'
            '</oppia-noninteractive-math>'
        )
        result = html_translation_services.postprocess_translated_html(source)
        self.assertNotIn('translate="no"', result)

    def test_link_text_restored_url_preserved(self) -> None:
        source = (
            '<oppia-noninteractive-link url-with-value="https://oppia.org"'
            ' text-with-value="Learn more">'
            '</oppia-noninteractive-link>'
        )
        protected = html_translation_services.protect_html_for_translation(
            source
        )
        # Simulate Azure translating the span text.
        translated = protected.replace('Learn more', 'यहाँ और जानें')
        result = html_translation_services.postprocess_translated_html(
            translated
        )
        self.assertIn('text-with-value="यहाँ और जानें"', result)
        self.assertIn('url-with-value="https://oppia.org"', result)
        self.assertNotIn('data-oi-id', result)
        self.assertNotIn('translate="no"', result)

    def test_image_alt_and_caption_restored(self) -> None:
        source = (
            '<oppia-noninteractive-image filepath-with-value="img.png"'
            ' alt-with-value="A red car"'
            ' caption-with-value="Figure 1">'
            '</oppia-noninteractive-image>'
        )
        protected = html_translation_services.protect_html_for_translation(
            source
        )
        translated = protected.replace('A red car', 'एक लाल कार').replace(
            'Figure 1', 'चित्र 1'
        )
        result = html_translation_services.postprocess_translated_html(
            translated
        )
        self.assertIn('alt-with-value="एक लाल कार"', result)
        self.assertIn('caption-with-value="चित्र 1"', result)
        self.assertIn('filepath-with-value="img.png"', result)

    def test_math_component_preserved_unchanged(self) -> None:
        source = (
            '<oppia-noninteractive-math math_content-with-value="πr²">'
            '</oppia-noninteractive-math>'
        )
        protected = html_translation_services.protect_html_for_translation(
            source
        )
        result = html_translation_services.postprocess_translated_html(
            protected
        )
        self.assertIn('math_content-with-value="πr²"', result)
        self.assertNotIn('translate="no"', result)

    def test_full_roundtrip_with_plain_text(self) -> None:
        source = (
            '<p>Find the area</p>'
            '<oppia-noninteractive-math math_content-with-value="πr²">'
            '</oppia-noninteractive-math>'
        )
        protected = html_translation_services.protect_html_for_translation(
            source
        )
        translated = protected.replace('Find the area', 'Finde die Fläche')
        result = html_translation_services.postprocess_translated_html(
            translated
        )
        self.assertIn('Finde die Fläche', result)
        self.assertIn('math_content-with-value="πr²"', result)
        self.assertNotIn('translate="no"', result)
        self.assertNotIn('data-oi-id', result)
