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

"""Tests for the HTML sanitizer."""

from __future__ import annotations

from core import utils
from core.domain import html_cleaner
from core.tests import test_utils

from typing import List, Tuple


class HtmlCleanerUnitTests(test_utils.GenericTestBase):
    """Test the HTML sanitizer."""

    def setUp(self) -> None:
        super().setUp()
        self.longMessage = True

    def test_whitelisted_tags(self) -> None:

        self.assertTrue(
            html_cleaner.filter_a('a', 'href', 'http://www.oppia.com')
        )

        self.assertFalse(
            html_cleaner.filter_a('a', 'href', '<code>http://www.oppia.com')
        )

        self.assertTrue(
            html_cleaner.filter_a('a', 'title', 'http://www.oppia.com')
        )

        with self.assertRaisesRegex(
            Exception, 'The filter_a method should only be used for a tags.'
        ):
            html_cleaner.filter_a('link', 'href', 'http://www.oppia.com')

    def test_filter_a_with_https_scheme(self) -> None:
        """Test filter_a allows https URLs."""
        self.assertTrue(
            html_cleaner.filter_a('a', 'href', 'https://www.oppia.com')
        )

    def test_filter_a_with_target_attribute(self) -> None:
        """Test filter_a allows target attribute."""
        self.assertTrue(html_cleaner.filter_a('a', 'target', '_blank'))

    def test_filter_a_with_invalid_scheme(self) -> None:
        """Test filter_a rejects non-http/https schemes like ftp."""
        self.assertFalse(
            html_cleaner.filter_a('a', 'href', 'ftp://www.oppia.com')
        )

    def test_filter_a_with_javascript_scheme(self) -> None:
        """Test filter_a rejects javascript scheme."""
        self.assertFalse(
            html_cleaner.filter_a('a', 'href', 'javascript:alert(1)')
        )

    def test_filter_a_with_unknown_attribute(self) -> None:
        """Test filter_a returns False for unknown attributes."""
        self.assertFalse(html_cleaner.filter_a('a', 'onclick', 'alert(1)'))

    def test_filter_a_with_empty_href(self) -> None:
        """Test filter_a rejects empty href."""
        self.assertFalse(html_cleaner.filter_a('a', 'href', ''))

    def test_good_tags_allowed(self) -> None:
        test_data: List[Tuple[str, str]] = [
            (
                '<a href="http://www.google.com">Hello</a>',
                '<a href="http://www.google.com">Hello</a>',
            ),
            (
                '<a href="http://www.google.com" target="_blank">Hello</a>',
                '<a href="http://www.google.com" target="_blank">Hello</a>',
            ),
            (
                '<a href="http://www.google.com" title="Hello">Hello</a>',
                '<a href="http://www.google.com" title="Hello">Hello</a>',
            ),
            ('Just some text 12345', 'Just some text 12345'),
            (
                '<code>Unfinished HTML',
                '<code>Unfinished HTML</code>',
            ),
            ('<br/>', '<br>'),
            (
                'A big mix <div>Hello</div> Yes <span>No</span>',
                'A big mix <div>Hello</div> Yes <span>No</span>',
            ),
        ]

        for datum in test_data:
            self.assertEqual(
                html_cleaner.clean(datum[0]),
                datum[1],
                msg='\n\nOriginal text: %s' % datum[0],
            )

    def test_bad_tags_suppressed(self) -> None:
        test_data: List[Tuple[str, str]] = [
            ('<incomplete-bad-tag>', ''),
            ('<complete-bad-tag></complete-bad-tag>', ''),
            ('<incomplete-bad-tag><div>OK tag</div>', '<div>OK tag</div>'),
            (
                '<complete-bad-tag></complete-bad-tag><span>OK tag</span>',
                '<span>OK tag</span>',
            ),
            ('<bad-tag></bad-tag>Just some text 12345', 'Just some text 12345'),
            (
                '<script>alert(\'Here is some JS\');</script>',
                'alert(\'Here is some JS\');',
            ),
            ('<iframe src="https://oppiaserver.appspot.com"></iframe>', ''),
        ]

        for datum in test_data:
            self.assertEqual(
                html_cleaner.clean(datum[0]),
                datum[1],
                msg='\n\nOriginal text: %s' % datum[0],
            )

    def test_oppia_custom_tags(self) -> None:
        test_data: List[Tuple[str, ...]] = [
            (
                '<oppia-noninteractive-image filepath-with-value="1"/>',
                '<oppia-noninteractive-image filepath-with-value="1">'
                '</oppia-noninteractive-image>',
            ),
            (
                '<oppia-noninteractive-image filepath-with-value="1">'
                '</oppia-noninteractive-image>',
                '<oppia-noninteractive-image filepath-with-value="1">'
                '</oppia-noninteractive-image>',
            ),
            ('<oppia-fake-tag></oppia-fake-tag>', ''),
        ]

        for datum in test_data:
            self.assertEqual(
                html_cleaner.clean(datum[0]),
                datum[1],
                msg='\n\nOriginal text: %s' % datum[0],
            )


class HtmlStripperUnitTests(test_utils.GenericTestBase):
    """Test the HTML stripper."""

    def test_strip_html_tags(self) -> None:
        test_data: List[Tuple[str, str]] = [
            (
                '<a href="http://www.google.com">Hello</a>',
                'Hello',
            ),
            (
                'Just some text 12345',
                'Just some text 12345',
            ),
            (
                '<code>Unfinished HTML',
                'Unfinished HTML',
            ),
            (
                '<br/>',
                '',
            ),
            (
                'A big mix <div>Hello</div> Yes <span>No</span>',
                'A big mix Hello Yes No',
            ),
            (
                'Text with\nnewlines',
                'Text with\nnewlines',
            ),
        ]

        for datum in test_data:
            self.assertEqual(html_cleaner.strip_html_tags(datum[0]), datum[1])

    def test_strip_html_tags_removes_all_markup(self) -> None:
        """Test that strip_html_tags removes nested and complex tags."""
        self.assertEqual(
            html_cleaner.strip_html_tags(
                '<div><p>Hello <b>World</b></p></div>'
            ),
            'Hello World',
        )

    def test_strip_html_tags_with_empty_string(self) -> None:
        """Test strip_html_tags with empty string."""
        self.assertEqual(html_cleaner.strip_html_tags(''), '')


class RteComponentExtractorUnitTests(test_utils.GenericTestBase):
    """Test the RTE component extractor."""

    def test_get_rte_components(self) -> None:
        test_data = (
            '<p>Test text&nbsp;'
            '<oppia-noninteractive-math '
            'math_content-with-value="{&amp;quot;raw_latex&amp;quot;:&amp;qu'
            'ot;\\\\frac{x}{y}&amp;quot;,&amp;quot;svg_filename&amp;quot;:'
            '&amp;quot;&amp;quot;}">'
            '</oppia-noninteractive-math></p><p>&nbsp;'
            '<oppia-noninteractive-link '
            'text-with-value='
            '"&amp;quot;Link\\&amp;quot;quoted text\\&amp;quot;'
            '&amp;#39;singlequotes&amp;#39;&amp;quot;" '
            'url-with-value="&amp;quot;https://www.example.com&amp;quot;">'
            '</oppia-noninteractive-link>.</p>'
            '<p>Video</p>'
            '<p><oppia-noninteractive-video autoplay-with-value="false" '
            'end-with-value="0" start-with-value="0" '
            'video_id-with-value="&amp;quot;'
            'https://www.youtube.com/watch?v=Ntcw0H0hwPU&amp;quot;">'
            '</oppia-noninteractive-video><br></p>'
        )

        expected_components: List[html_cleaner.ComponentsDict] = [
            {
                'customization_args': {
                    'text-with-value': 'Link"quoted text"\'singlequotes\'',
                    'url-with-value': 'https://www.example.com',
                },
                'id': 'oppia-noninteractive-link',
            },
            {
                'customization_args': {
                    'start-with-value': 0,
                    'end-with-value': 0,
                    'video_id-with-value': (
                        'https://www.youtube.com/watch?' 'v=Ntcw0H0hwPU'
                    ),
                    'autoplay-with-value': False,
                },
                'id': 'oppia-noninteractive-video',
            },
            {
                'customization_args': {
                    'math_content-with-value': {
                        'raw_latex': '\\frac{x}{y}',
                        'svg_filename': '',
                    }
                },
                'id': 'oppia-noninteractive-math',
            },
        ]

        components: List[html_cleaner.ComponentsDict] = (
            html_cleaner.get_rte_components(test_data)
        )

        self.assertEqual(len(components), len(expected_components))
        for component in components:
            self.assertIn(component, expected_components)

    def test_get_image_filenames_from_html_strings(self) -> None:
        html_strings = [
            '<oppia-noninteractive-image '
            'filepath-with-value="&quot;img.svg&quot;" caption-with-value='
            '"&quot;&quot;" alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image><oppia-noninteractive-image '
            'filepath-with-value="&quot;img2.svg&quot;" caption-with-value='
            '"&quot;&quot;" alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image>',
            '<oppia-noninteractive-image '
            'filepath-with-value="&quot;img3.svg&quot;" caption-with-value='
            '"&quot;&quot;" alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image><oppia-noninteractive-image '
            'filepath-with-value="&quot;img4.svg&quot;" caption-with-value='
            '"&quot;&quot;" alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image>',
            '<oppia-noninteractive-image '
            'filepath-with-value="&quot;img5.svg&quot;" caption-with-value='
            '"&quot;&quot;" alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-image>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;quo'
            't;raw_latex&amp;quot;:&amp;quot;+,-,-,+&amp;quot;,&amp;quot;sv'
            'g_filename&amp;quot;:&amp;quot;math1.svg&amp;quot;}"></oppia-n'
            'oninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;quo'
            't;raw_latex&amp;quot;:&amp;quot;x^2&amp;quot;,&amp;quot;sv'
            'g_filename&amp;quot;:&amp;quot;math2.svg&amp;quot;}"></oppia-n'
            'oninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;quo'
            't;raw_latex&amp;quot;:&amp;quot;(x-1)(x-2)^2&amp;quot;,&amp;quot'
            ';svg_filename&amp;quot;:&amp;quot;math3.svg&amp;quot;}"></oppia-n'
            'oninteractive-math>',
        ]
        self.assertItemsEqual(
            [
                'img.svg',
                'img2.svg',
                'img3.svg',
                'img4.svg',
                'img5.svg',
                'math1.svg',
                'math2.svg',
                'math3.svg',
            ],
            html_cleaner.get_image_filenames_from_html_strings(html_strings),
        )

    def test_get_image_filenames_from_html_strings_with_no_components(
        self,
    ) -> None:
        """Test get_image_filenames_from_html_strings with no RTE components."""
        self.assertEqual(
            html_cleaner.get_image_filenames_from_html_strings(
                ['<p>Just text</p>']
            ),
            [],
        )

    def test_get_image_filenames_from_html_strings_with_empty_list(
        self,
    ) -> None:
        """Test get_image_filenames_from_html_strings with empty list."""
        self.assertEqual(
            html_cleaner.get_image_filenames_from_html_strings([]),
            [],
        )

    def test_get_image_filenames_from_html_strings_with_only_images(
        self,
    ) -> None:
        """Test get_image_filenames_from_html_strings with only image tags."""
        html_strings = [
            '<oppia-noninteractive-image '
            'filepath-with-value="&quot;test.svg&quot;" '
            'caption-with-value="&quot;&quot;" '
            'alt-with-value="&quot;Alt&quot;">'
            '</oppia-noninteractive-image>'
        ]
        result = html_cleaner.get_image_filenames_from_html_strings(
            html_strings
        )
        self.assertEqual(result, ['test.svg'])

    def test_get_image_filenames_from_html_strings_with_only_math(
        self,
    ) -> None:
        """Test get_image_filenames_from_html_strings with only math tags."""
        html_strings = [
            '<oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;:&amp;quot;x^2&amp;quot;,'
            '&amp;quot;svg_filename&amp;quot;:&amp;quot;math.svg'
            '&amp;quot;}">'
            '</oppia-noninteractive-math>'
        ]
        result = html_cleaner.get_image_filenames_from_html_strings(
            html_strings
        )
        self.assertEqual(result, ['math.svg'])

    def test_get_image_filenames_deduplicates(self) -> None:
        """Test that duplicate filenames are removed."""
        html_strings = [
            '<oppia-noninteractive-image '
            'filepath-with-value="&quot;dup.svg&quot;" '
            'caption-with-value="&quot;&quot;" '
            'alt-with-value="&quot;Alt&quot;">'
            '</oppia-noninteractive-image>',
            '<oppia-noninteractive-image '
            'filepath-with-value="&quot;dup.svg&quot;" '
            'caption-with-value="&quot;&quot;" '
            'alt-with-value="&quot;Alt&quot;">'
            '</oppia-noninteractive-image>',
        ]
        result = html_cleaner.get_image_filenames_from_html_strings(
            html_strings
        )
        self.assertEqual(result, ['dup.svg'])

    def test_get_image_filenames_from_html_strings_with_non_image_component(
        self,
    ) -> None:
        """Test get_image_filenames_from_html_strings ignores non-image
        and non-math RTE components like links.
        """
        html_strings = [
            '<oppia-noninteractive-link '
            'text-with-value="&quot;Click here&quot;" '
            'url-with-value="&quot;https://www.oppia.org&quot;">'
            '</oppia-noninteractive-link>'
        ]
        result = html_cleaner.get_image_filenames_from_html_strings(
            html_strings
        )
        self.assertEqual(result, [])


class IsHtmlEmptyTests(test_utils.GenericTestBase):
    """Tests for the is_html_empty function."""

    def test_empty_quot_string_is_empty(self) -> None:
        """Test that &quot;&quot; is considered empty."""
        self.assertTrue(html_cleaner.is_html_empty('&quot;&quot;'))

    def test_escaped_quot_string_is_empty(self) -> None:
        """Test that \\"&quot;&quot;\\" is considered empty."""
        self.assertTrue(html_cleaner.is_html_empty('\\"&quot;&quot;\\"'))

    def test_html_with_only_tags_is_empty(self) -> None:
        """Test that HTML with only formatting tags is empty."""
        self.assertTrue(html_cleaner.is_html_empty('<p></p>'))
        self.assertTrue(html_cleaner.is_html_empty('<p><br></p>'))
        self.assertTrue(html_cleaner.is_html_empty('<p>&nbsp;</p>'))
        self.assertTrue(html_cleaner.is_html_empty('<b><i></i></b>'))
        self.assertTrue(html_cleaner.is_html_empty('<em></em>'))
        self.assertTrue(html_cleaner.is_html_empty('<strong></strong>'))
        self.assertTrue(html_cleaner.is_html_empty('<span></span>'))
        self.assertTrue(html_cleaner.is_html_empty('<ol><li></li></ol>'))
        self.assertTrue(html_cleaner.is_html_empty('<ul><li></li></ul>'))
        self.assertTrue(
            html_cleaner.is_html_empty(
                '<h1></h1><h2></h2><h3></h3><h4></h4><h5></h5><h6></h6>'
            )
        )

    def test_html_with_text_content_is_not_empty(self) -> None:
        """Test that HTML with actual text is not empty."""
        self.assertFalse(html_cleaner.is_html_empty('<p>Hello</p>'))
        self.assertFalse(html_cleaner.is_html_empty('Some text'))

    def test_empty_string_is_empty(self) -> None:
        """Test that an empty string is considered empty."""
        self.assertTrue(html_cleaner.is_html_empty(''))

    def test_whitespace_only_string_is_empty(self) -> None:
        """Test that whitespace only string is considered empty."""
        self.assertTrue(html_cleaner.is_html_empty('   '))

    def test_double_quotes_only_is_empty(self) -> None:
        """Test that \"\" is considered empty."""
        self.assertTrue(html_cleaner.is_html_empty('\"\"'))

    def test_single_quotes_only_is_empty(self) -> None:
        """Test that '' is considered empty."""
        self.assertTrue(html_cleaner.is_html_empty('\'\''))


class ValidateRteTagsTests(test_utils.GenericTestBase):
    """Tests for the validate_rte_tags function."""

    def test_valid_html_without_rte_tags_passes(self) -> None:
        """Test that plain HTML without RTE tags passes validation."""
        html_cleaner.validate_rte_tags('<p>Hello world</p>')

    def test_image_missing_alt_attribute_raises_error(self) -> None:
        """Test image tag without alt-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-image '
            'caption-with-value="&amp;quot;&amp;quot;" '
            'filepath-with-value="&amp;quot;img.svg&amp;quot;">'
            '</oppia-noninteractive-image>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Image tag does not have \'alt-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_image_missing_caption_attribute_raises_error(self) -> None:
        """Test image tag without caption-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-image '
            'alt-with-value="&amp;quot;Alt text&amp;quot;" '
            'filepath-with-value="&amp;quot;img.svg&amp;quot;">'
            '</oppia-noninteractive-image>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Image tag does not have \'caption-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_image_caption_too_long_raises_error(self) -> None:
        """Test image tag with caption > 500 chars raises error."""
        long_caption = 'a' * 501
        html_data = (
            '<oppia-noninteractive-image '
            'alt-with-value="&amp;quot;Alt&amp;quot;" '
            'caption-with-value="&amp;quot;%s&amp;quot;" '
            'filepath-with-value="&amp;quot;img.svg&amp;quot;">'
            '</oppia-noninteractive-image>' % long_caption
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Image tag \'caption-with-value\' attribute should not '
            'be greater than 500 characters.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_image_missing_filepath_raises_error(self) -> None:
        """Test image tag without filepath-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-image '
            'alt-with-value="&amp;quot;Alt&amp;quot;" '
            'caption-with-value="&amp;quot;&amp;quot;">'
            '</oppia-noninteractive-image>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Image tag does not have \'filepath-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_image_empty_filepath_raises_error(self) -> None:
        """Test image tag with empty filepath raises error."""
        html_data = (
            '<oppia-noninteractive-image '
            'alt-with-value="&amp;quot;Alt&amp;quot;" '
            'caption-with-value="&amp;quot;&amp;quot;" '
            'filepath-with-value="&amp;quot;&amp;quot;">'
            '</oppia-noninteractive-image>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Image tag \'filepath-with-value\' attribute should not be empty.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_valid_image_tag_passes(self) -> None:
        """Test a fully valid image tag passes."""
        html_data = (
            '<oppia-noninteractive-image '
            'alt-with-value="&amp;quot;Alt text&amp;quot;" '
            'caption-with-value="&amp;quot;Caption&amp;quot;" '
            'filepath-with-value="&amp;quot;img.svg&amp;quot;">'
            '</oppia-noninteractive-image>'
        )
        html_cleaner.validate_rte_tags(html_data)

    def test_skillreview_missing_text_raises_error(self) -> None:
        """Test skillreview tag without text-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-skillreview '
            'skill_id-with-value="&amp;quot;skill_id&amp;quot;">'
            '</oppia-noninteractive-skillreview>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'SkillReview tag does not have \'text-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_skillreview_empty_text_raises_error(self) -> None:
        """Test skillreview tag with empty text-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-skillreview '
            'text-with-value="&amp;quot;&amp;quot;" '
            'skill_id-with-value="&amp;quot;skill_id&amp;quot;">'
            '</oppia-noninteractive-skillreview>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'SkillReview tag \'text-with-value\' attribute should '
            'not be empty.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_skillreview_missing_skill_id_raises_error(self) -> None:
        """Test skillreview tag without skill_id-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-skillreview '
            'text-with-value="&amp;quot;Review&amp;quot;">'
            '</oppia-noninteractive-skillreview>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'SkillReview tag does not have \'skill_id-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_skillreview_empty_skill_id_raises_error(self) -> None:
        """Test skillreview tag with empty skill_id raises error."""
        html_data = (
            '<oppia-noninteractive-skillreview '
            'text-with-value="&amp;quot;Review&amp;quot;" '
            'skill_id-with-value="&amp;quot;&amp;quot;">'
            '</oppia-noninteractive-skillreview>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'SkillReview tag \'skill_id-with-value\' attribute should '
            'not be empty.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_video_missing_start_raises_error(self) -> None:
        """Test video tag without start-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-video '
            'end-with-value="10" '
            'autoplay-with-value="false" '
            'video_id-with-value="&amp;quot;vid123&amp;quot;">'
            '</oppia-noninteractive-video>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Video tag does not have \'start-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_video_empty_start_raises_error(self) -> None:
        """Test video tag with empty start-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-video '
            'start-with-value="&quot;&quot;" '
            'end-with-value="10" '
            'autoplay-with-value="false" '
            'video_id-with-value="&amp;quot;vid123&amp;quot;">'
            '</oppia-noninteractive-video>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Video tag \'start-with-value\' attribute should not be empty.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_video_missing_end_raises_error(self) -> None:
        """Test video tag without end-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-video '
            'start-with-value="0" '
            'autoplay-with-value="false" '
            'video_id-with-value="&amp;quot;vid123&amp;quot;">'
            '</oppia-noninteractive-video>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Video tag does not have \'end-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_video_missing_autoplay_raises_error(self) -> None:
        """Test video tag without autoplay-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-video '
            'start-with-value="0" '
            'end-with-value="10" '
            'video_id-with-value="&amp;quot;vid123&amp;quot;">'
            '</oppia-noninteractive-video>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Video tag does not have \'autoplay-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_video_invalid_autoplay_raises_error(self) -> None:
        """Test video tag with non-boolean autoplay raises error."""
        html_data = (
            '<oppia-noninteractive-video '
            'start-with-value="0" '
            'end-with-value="10" '
            'autoplay-with-value="invalid" '
            'video_id-with-value="&amp;quot;vid123&amp;quot;">'
            '</oppia-noninteractive-video>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Video tag \'autoplay-with-value\' attribute should be '
            'a boolean value.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_video_missing_video_id_raises_error(self) -> None:
        """Test video tag without video_id-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-video '
            'start-with-value="0" '
            'end-with-value="10" '
            'autoplay-with-value="false">'
            '</oppia-noninteractive-video>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Video tag does not have \'video_id-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_video_empty_video_id_raises_error(self) -> None:
        """Test video tag with empty video_id raises error."""
        html_data = (
            '<oppia-noninteractive-video '
            'start-with-value="0" '
            'end-with-value="10" '
            'autoplay-with-value="false" '
            'video_id-with-value="&amp;quot;&amp;quot;">'
            '</oppia-noninteractive-video>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Video tag \'video_id-with-value\' attribute should not be empty.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_link_missing_text_raises_error(self) -> None:
        """Test link tag without text-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-link '
            'url-with-value="&amp;quot;https://www.oppia.org&amp;quot;">'
            '</oppia-noninteractive-link>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Link tag does not have \'text-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_link_missing_url_raises_error(self) -> None:
        """Test link tag without url-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-link '
            'text-with-value="&amp;quot;Click&amp;quot;">'
            '</oppia-noninteractive-link>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Link tag does not have \'url-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_link_empty_url_raises_error(self) -> None:
        """Test link tag with empty url raises error."""
        html_data = (
            '<oppia-noninteractive-link '
            'text-with-value="&amp;quot;Click&amp;quot;" '
            'url-with-value="&amp;quot;&amp;quot;">'
            '</oppia-noninteractive-link>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Link tag \'url-with-value\' attribute should not be empty.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_link_with_invalid_scheme_raises_error(self) -> None:
        """Test link tag with non-acceptable URL scheme raises error."""
        html_data = (
            '<oppia-noninteractive-link '
            'text-with-value="&amp;quot;Click&amp;quot;" '
            'url-with-value="&amp;quot;http://badurl.com&amp;quot;">'
            '</oppia-noninteractive-link>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Link should be prefix with acceptable schemas',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_valid_link_tag_passes(self) -> None:
        """Test a fully valid link tag passes validation."""
        html_data = (
            '<oppia-noninteractive-link '
            'text-with-value="&amp;quot;Click here&amp;quot;" '
            'url-with-value="&amp;quot;https://www.oppia.org&amp;quot;">'
            '</oppia-noninteractive-link>'
        )
        html_cleaner.validate_rte_tags(html_data)

    def test_math_missing_math_content_raises_error(self) -> None:
        """Test math tag without math_content-with-value raises error."""
        html_data = '<oppia-noninteractive-math></oppia-noninteractive-math>'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Math tag does not have \'math_content-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_math_empty_math_content_raises_error(self) -> None:
        """Test math tag with empty math_content raises error."""
        html_data = (
            '<oppia-noninteractive-math '
            'math_content-with-value="&quot;&quot;">'
            '</oppia-noninteractive-math>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Math tag \'math_content-with-value\' attribute should not '
            'be empty.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_math_missing_raw_latex_raises_error(self) -> None:
        """Test math tag without raw_latex in math_content raises error."""
        html_data = (
            '<oppia-noninteractive-math '
            'math_content-with-value="{&amp;quot;svg_filename&amp;quot;:'
            '&amp;quot;file.svg&amp;quot;}">'
            '</oppia-noninteractive-math>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Math tag does not have \'raw_latex-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_math_empty_raw_latex_raises_error(self) -> None:
        """Test math tag with empty raw_latex raises error."""
        html_data = (
            '<oppia-noninteractive-math '
            'math_content-with-value="{&amp;quot;raw_latex&amp;quot;:'
            '&amp;quot;&amp;quot;,&amp;quot;svg_filename&amp;quot;:'
            '&amp;quot;file.svg&amp;quot;}">'
            '</oppia-noninteractive-math>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Math tag \'raw_latex-with-value\' attribute should not be empty.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_math_missing_svg_filename_raises_error(self) -> None:
        """Test math tag without svg_filename raises error."""
        html_data = (
            '<oppia-noninteractive-math '
            'math_content-with-value="{&amp;quot;raw_latex&amp;quot;:'
            '&amp;quot;x^2&amp;quot;}">'
            '</oppia-noninteractive-math>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Math tag does not have \'svg_filename-with-value\' attribute.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_math_empty_svg_filename_raises_error(self) -> None:
        """Test math tag with empty svg_filename raises error."""
        html_data = (
            '<oppia-noninteractive-math '
            'math_content-with-value="{&amp;quot;raw_latex&amp;quot;:'
            '&amp;quot;x^2&amp;quot;,&amp;quot;svg_filename&amp;quot;:'
            '&amp;quot;&amp;quot;}">'
            '</oppia-noninteractive-math>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Math tag \'svg_filename-with-value\' attribute should not '
            'be empty.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_math_svg_filename_without_svg_extension_raises_error(
        self,
    ) -> None:
        """Test math tag with non-svg extension raises error."""
        html_data = (
            '<oppia-noninteractive-math '
            'math_content-with-value="{&amp;quot;raw_latex&amp;quot;:'
            '&amp;quot;x^2&amp;quot;,&amp;quot;svg_filename&amp;quot;:'
            '&amp;quot;file.png&amp;quot;}">'
            '</oppia-noninteractive-math>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Math tag \'svg_filename-with-value\' attribute should '
            'have svg extension.',
        ):
            html_cleaner.validate_rte_tags(html_data)

    def test_valid_math_tag_passes(self) -> None:
        """Test that a valid math tag passes validation."""
        html_data = (
            '<oppia-noninteractive-math '
            'math_content-with-value="{&amp;quot;raw_latex&amp;quot;:'
            '&amp;quot;x^2&amp;quot;,&amp;quot;svg_filename&amp;quot;:'
            '&amp;quot;file.svg&amp;quot;}">'
            '</oppia-noninteractive-math>'
        )
        html_cleaner.validate_rte_tags(html_data)

    def test_nested_tabs_inside_tabs_or_collapsible_raises_error(self) -> None:
        """Test tabs tag inside tabs/collapsible raises error."""
        html_data = (
            '<oppia-noninteractive-tabs '
            'tab_contents-with-value="[]">'
            '</oppia-noninteractive-tabs>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Tabs tag should not be present inside another '
            'Tabs or Collapsible tag.',
        ):
            html_cleaner.validate_rte_tags(
                html_data, is_tag_nested_inside_tabs_or_collapsible=True
            )

    def test_nested_collapsible_inside_tabs_or_collapsible_raises_error(
        self,
    ) -> None:
        """Test collapsible tag inside tabs/collapsible raises error."""
        html_data = (
            '<oppia-noninteractive-collapsible '
            'content-with-value="&amp;quot;content&amp;quot;" '
            'heading-with-value="&amp;quot;heading&amp;quot;">'
            '</oppia-noninteractive-collapsible>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Collapsible tag should not be present inside Tabs '
            'or another Collapsible tag.',
        ):
            html_cleaner.validate_rte_tags(
                html_data, is_tag_nested_inside_tabs_or_collapsible=True
            )

    def test_no_nested_tags_when_not_inside_tabs_or_collapsible(self) -> None:
        """Test tabs/collapsible not checked when flag is False."""
        html_data = (
            '<oppia-noninteractive-tabs '
            'tab_contents-with-value="[]">'
            '</oppia-noninteractive-tabs>'
        )
        # Should not raise since is_tag_nested_inside_tabs_or_collapsible
        # defaults to False.
        html_cleaner.validate_rte_tags(html_data)

    def test_no_error_when_nested_flag_true_but_no_tabs_or_collapsible(
        self,
    ) -> None:
        """Test that no error is raised when
        is_tag_nested_inside_tabs_or_collapsible is True but the HTML
        contains no tabs or collapsible tags.
        """
        html_cleaner.validate_rte_tags(
            '<p>Plain text</p>',
            is_tag_nested_inside_tabs_or_collapsible=True,
        )


class ValidateTabsAndCollapsibleRteTagsTests(test_utils.GenericTestBase):
    """Tests for validate_tabs_and_collapsible_rte_tags function."""

    def test_no_tabs_or_collapsible_passes(self) -> None:
        """Test that HTML without tabs or collapsible passes."""
        html_cleaner.validate_tabs_and_collapsible_rte_tags(
            '<p>Hello world</p>'
        )

    def test_tabs_missing_tab_contents_attribute_raises_error(self) -> None:
        """Test tabs tag without tab_contents-with-value raises error."""
        html_data = '<oppia-noninteractive-tabs></oppia-noninteractive-tabs>'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'No content attribute is present inside the tabs tag.',
        ):
            html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)

    def test_tabs_with_empty_tab_contents_raises_error(self) -> None:
        """Test tabs tag with empty tab_contents list raises error."""
        html_data = (
            '<oppia-noninteractive-tabs '
            'tab_contents-with-value="[]">'
            '</oppia-noninteractive-tabs>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'No tabs are present inside the tabs tag.',
        ):
            html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)

    def test_tabs_missing_title_raises_error(self) -> None:
        """Test tabs content without title raises error."""
        html_data = (
            '<oppia-noninteractive-tabs '
            'tab_contents-with-value='
            '"[{&amp;quot;content&amp;quot;: &amp;quot;Some content&amp;quot;}]"'
            '>'
            '</oppia-noninteractive-tabs>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'No title attribute is present inside the tabs tag.',
        ):
            html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)

    def test_tabs_empty_title_raises_error(self) -> None:
        """Test tabs content with empty title raises error."""
        html_data = (
            '<oppia-noninteractive-tabs '
            'tab_contents-with-value='
            '"[{&amp;quot;title&amp;quot;: &amp;quot;&amp;quot;, '
            '&amp;quot;content&amp;quot;: &amp;quot;Some content&amp;quot;}]"'
            '>'
            '</oppia-noninteractive-tabs>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'title present inside tabs tag is empty.',
        ):
            html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)

    def test_tabs_missing_content_raises_error(self) -> None:
        """Test tabs content without content key raises error."""
        html_data = (
            '<oppia-noninteractive-tabs '
            'tab_contents-with-value='
            '"[{&amp;quot;title&amp;quot;: &amp;quot;Tab Title&amp;quot;}]"'
            '>'
            '</oppia-noninteractive-tabs>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'No content attribute is present inside the tabs tag.',
        ):
            html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)

    def test_tabs_empty_content_raises_error(self) -> None:
        """Test tabs content with empty content raises error."""
        html_data = (
            '<oppia-noninteractive-tabs '
            'tab_contents-with-value='
            '"[{&amp;quot;title&amp;quot;: &amp;quot;Tab Title&amp;quot;, '
            '&amp;quot;content&amp;quot;: &amp;quot;&amp;quot;}]"'
            '>'
            '</oppia-noninteractive-tabs>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'content present inside tabs tag is empty.',
        ):
            html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)

    def test_valid_tabs_passes(self) -> None:
        """Test valid tabs tag passes validation."""
        html_data = (
            '<oppia-noninteractive-tabs '
            'tab_contents-with-value='
            '"[{&amp;quot;title&amp;quot;: &amp;quot;Tab Title&amp;quot;, '
            '&amp;quot;content&amp;quot;: '
            '&amp;quot;&amp;lt;p&amp;gt;Content&amp;lt;/p&amp;gt;&amp;quot;}]"'
            '>'
            '</oppia-noninteractive-tabs>'
        )
        html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)

    def test_collapsible_missing_content_attribute_raises_error(self) -> None:
        """Test collapsible tag without content-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-collapsible '
            'heading-with-value="&amp;quot;Heading&amp;quot;">'
            '</oppia-noninteractive-collapsible>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'No content attribute present in collapsible tag.',
        ):
            html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)

    def test_collapsible_empty_content_raises_error(self) -> None:
        """Test collapsible tag with empty content raises error."""
        html_data = (
            '<oppia-noninteractive-collapsible '
            'content-with-value="&amp;quot;&amp;quot;" '
            'heading-with-value="&amp;quot;Heading&amp;quot;">'
            '</oppia-noninteractive-collapsible>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'No collapsible content is present inside the tag.',
        ):
            html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)

    def test_collapsible_missing_heading_raises_error(self) -> None:
        """Test collapsible tag without heading-with-value raises error."""
        html_data = (
            '<oppia-noninteractive-collapsible '
            'content-with-value="&amp;quot;&amp;lt;p&amp;gt;Content'
            '&amp;lt;/p&amp;gt;&amp;quot;">'
            '</oppia-noninteractive-collapsible>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'No heading attribute present in collapsible tag.',
        ):
            html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)

    def test_collapsible_empty_heading_raises_error(self) -> None:
        """Test collapsible tag with empty heading raises error."""
        html_data = (
            '<oppia-noninteractive-collapsible '
            'content-with-value="&amp;quot;&amp;lt;p&amp;gt;Content'
            '&amp;lt;/p&amp;gt;&amp;quot;" '
            'heading-with-value="&amp;quot;&amp;quot;">'
            '</oppia-noninteractive-collapsible>'
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Heading attribute inside the collapsible tag is empty.',
        ):
            html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)

    def test_valid_collapsible_passes(self) -> None:
        """Test valid collapsible tag passes validation."""
        html_data = (
            '<oppia-noninteractive-collapsible '
            'content-with-value="&amp;quot;&amp;lt;p&amp;gt;Content'
            '&amp;lt;/p&amp;gt;&amp;quot;" '
            'heading-with-value="&amp;quot;Heading&amp;quot;">'
            '</oppia-noninteractive-collapsible>'
        )
        html_cleaner.validate_tabs_and_collapsible_rte_tags(html_data)
