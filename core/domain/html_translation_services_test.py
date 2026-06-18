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


class HtmlTranslationServicesTests(test_utils.GenericTestBase):
    """Tests for HTML translation services."""

    def test_empty_and_whitespace_strings(self) -> None:
        self.assertEqual(
            html_translation_services.protect_html_for_translation(''), ''
        )
        self.assertEqual(
            html_translation_services.protect_html_for_translation('   '), '   '
        )
        self.assertEqual(
            html_translation_services.postprocess_translated_html(''), ''
        )

    def test_skip_components_receive_translate_no(self) -> None:
        source = (
            '<oppia-noninteractive-math math_content-with-value="x²">'
            '</oppia-noninteractive-math>'
            '<oppia-noninteractive-video video_id-with-value="abc123">'
            '</oppia-noninteractive-video>'
            '<oppia-noninteractive-skillreview skill_id-with-value="abc">'
            '</oppia-noninteractive-skillreview>'
            '<oppia-noninteractive-math translate="no"></oppia-noninteractive-math>'
        )
        result = html_translation_services.protect_html_for_translation(source)
        self.assertEqual(result.count('translate="no"'), 4)

    def test_translatable_text_attrs_extracted_and_restored(self) -> None:
        source = (
            '<oppia-noninteractive-link url-with-value="https://oppia.org" '
            'text-with-value="Learn more"></oppia-noninteractive-link>'
        )
        protected = html_translation_services.protect_html_for_translation(
            source
        )
        self.assertIn('data-oi-attr="text-with-value"', protected)

        restored = html_translation_services.postprocess_translated_html(
            protected
        )
        self.assertIn('text-with-value="Learn more"', restored)
        self.assertNotIn('data-oi-id', restored)

    def test_image_alt_and_caption_extracted_and_restored(self) -> None:
        source = (
            '<oppia-noninteractive-image filepath-with-value="img.png" '
            'alt-with-value="A red car" caption-with-value="Figure 1">'
            '</oppia-noninteractive-image>'
        )
        protected = html_translation_services.protect_html_for_translation(
            source
        )
        restored = html_translation_services.postprocess_translated_html(
            protected
        )
        self.assertIn('alt-with-value="A red car"', restored)
        self.assertIn('caption-with-value="Figure 1"', restored)

    def test_encoded_html_attrs_extracted_and_restored(self) -> None:
        source = (
            '<oppia-noninteractive-collapsible heading-with-value="Show" '
            'content-with-value="&lt;p&gt;Step 1&lt;/p&gt;">'
            '</oppia-noninteractive-collapsible>'
        )
        protected = html_translation_services.protect_html_for_translation(
            source
        )
        self.assertIn('data-oi-encoded="true"', protected)

        restored = html_translation_services.postprocess_translated_html(
            protected
        )
        self.assertIn(
            'content-with-value="&lt;p&gt;Step 1&lt;/p&gt;"', restored
        )

    def test_workedexample_extracted_and_restored(self) -> None:
        source = (
            '<oppia-noninteractive-workedexample question-with-value="Q1" '
            'answer-with-value="&lt;p&gt;A1&lt;/p&gt;">'
            '</oppia-noninteractive-workedexample>'
        )
        protected = html_translation_services.protect_html_for_translation(
            source
        )
        restored = html_translation_services.postprocess_translated_html(
            protected
        )
        self.assertIn('question-with-value="Q1"', restored)
        self.assertIn('answer-with-value="&lt;p&gt;A1&lt;/p&gt;"', restored)

    def test_tabs_json_extracted_and_restored(self) -> None:
        tabs = json.dumps(
            [
                {'title': 'Hint', 'content': '&lt;p&gt;Try&lt;/p&gt;'},
                {'title': 'Hint 2'},
            ]
        )
        source = (
            '<oppia-noninteractive-tabs tab_contents-with-value=\'%s\'>'
            '</oppia-noninteractive-tabs>' % tabs
        )
        protected = html_translation_services.protect_html_for_translation(
            source
        )
        self.assertIn('tab-title-0', protected)
        self.assertIn('tab-content-0', protected)
        self.assertIn('tab-title-1', protected)

        restored = html_translation_services.postprocess_translated_html(
            protected
        )
        self.assertIn('Hint', restored)
        self.assertIn('&lt;p&gt;Try&lt;/p&gt;', restored)
        self.assertIn('Hint 2', restored)

    def test_tabs_with_invalid_json_is_skipped(self) -> None:
        source = (
            '<oppia-noninteractive-tabs tab_contents-with-value="invalid">'
            '</oppia-noninteractive-tabs>'
        )
        protected = html_translation_services.protect_html_for_translation(
            source
        )
        self.assertIn('translate="no"', protected)

        source_with_no = (
            '<oppia-noninteractive-tabs tab_contents-with-value="invalid" '
            'translate="no"></oppia-noninteractive-tabs>'
        )
        protected2 = html_translation_services.protect_html_for_translation(
            source_with_no
        )
        self.assertIn('translate="no"', protected2)

    def test_tabs_json_null_value_protects_whole_component(self) -> None:
        # JSON null parses fine but raises TypeError when iterated over,
        # hitting the TypeError branch of the except clause.
        source = (
            '<oppia-noninteractive-tabs tab_contents-with-value="null">'
            '</oppia-noninteractive-tabs>'
        )
        result = html_translation_services.protect_html_for_translation(source)
        self.assertIn('translate="no"', result)
        self.assertNotIn('data-oi-attr', result)

    def test_tabs_zero_count_produces_empty_json_array(self) -> None:
        # The tab-title-0 span populates tabs_data["0"], entering the
        # reconstruction block. data-oi-tab-count="0" makes range(0) run
        # zero iterations, producing an empty JSON array.
        source = (
            '<span data-oi-id="0" data-oi-attr="tab-title-0">T</span>'
            '<oppia-noninteractive-tabs data-oi-id="0" '
            'data-oi-tab-count="0" translate="no">'
            '</oppia-noninteractive-tabs>'
        )
        result = html_translation_services.postprocess_translated_html(source)
        self.assertIn('tab_contents-with-value="[]"', result)
        self.assertNotIn('data-oi-tab-count', result)

    def test_orphaned_temp_tags_are_removed(self) -> None:
        source = (
            '<span data-oi-id="99" data-oi-attr="text-with-value">'
            'Orphan</span>'
        )
        restored = html_translation_services.postprocess_translated_html(source)
        self.assertEqual(restored, '')

    def test_non_oppia_tag_with_data_oi_id_skipped_in_comp_map(self) -> None:
        # The <p> has BOTH data-oi-id and data-oi-attr, so it appears in
        # the temp-tag loop. At line 249-250 the comp_id_to_tag build
        # skips it (not an oppia- tag), so component_tag resolves to None
        # and the element is decomposed via the orphan branch.
        source = '<p data-oi-id="0" data-oi-attr="text-with-value">Orphan</p>'
        result = html_translation_services.postprocess_translated_html(source)
        self.assertNotIn('data-oi-id', result)
        self.assertNotIn('Orphan', result)

    def test_missing_component_tag_for_tabs_data_skips_gracefully(self) -> None:
        source = (
            '<span data-oi-id="100" data-oi-attr="tab-title-0">Title</span>'
            '<div data-oi-id="100" data-oi-attr="tab-content-0" '
            'data-oi-encoded="true">&lt;p&gt;Content&lt;/p&gt;</div>'
        )
        restored = html_translation_services.postprocess_translated_html(source)
        self.assertEqual(restored, '')
