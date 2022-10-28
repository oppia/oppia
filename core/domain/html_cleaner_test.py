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
            html_cleaner.filter_a('a', 'href', 'http://www.oppia.com'))

        self.assertFalse(
            html_cleaner.filter_a('a', 'href', '<code>http://www.oppia.com'))

        self.assertTrue(
            html_cleaner.filter_a('a', 'title', 'http://www.oppia.com'))

        with self.assertRaisesRegex(
            Exception, 'The filter_a method should only be used for a tags.'):
            html_cleaner.filter_a('link', 'href', 'http://www.oppia.com')

    def test_good_tags_allowed(self) -> None:
        test_data: List[Tuple[str, str]] = [(
            '<a href="http://www.google.com">Hello</a>',
            '<a href="http://www.google.com">Hello</a>'
        ), (
            '<a href="http://www.google.com" target="_blank">Hello</a>',
            '<a href="http://www.google.com" target="_blank">Hello</a>'
        ), (
            '<a href="http://www.google.com" title="Hello">Hello</a>',
            '<a href="http://www.google.com" title="Hello">Hello</a>'
        ), (
            'Just some text 12345',
            'Just some text 12345'
        ), (
            '<code>Unfinished HTML',
            '<code>Unfinished HTML</code>',
        ), (
            '<br/>',
            '<br>'
        ), (
            'A big mix <div>Hello</div> Yes <span>No</span>',
            'A big mix <div>Hello</div> Yes <span>No</span>'
        )]

        for datum in test_data:
            self.assertEqual(
                html_cleaner.clean(datum[0]), datum[1],
                msg='\n\nOriginal text: %s' % datum[0])

    def test_bad_tags_suppressed(self) -> None:
        test_data: List[Tuple[str, str]] = [(
            '<incomplete-bad-tag>',
            ''
        ), (
            '<complete-bad-tag></complete-bad-tag>',
            ''
        ), (
            '<incomplete-bad-tag><div>OK tag</div>',
            '<div>OK tag</div>'
        ), (
            '<complete-bad-tag></complete-bad-tag><span>OK tag</span>',
            '<span>OK tag</span>'
        ), (
            '<bad-tag></bad-tag>Just some text 12345',
            'Just some text 12345'
        ), (
            '<script>alert(\'Here is some JS\');</script>',
            'alert(\'Here is some JS\');'
        ), (
            '<iframe src="https://oppiaserver.appspot.com"></iframe>',
            ''
        )]

        for datum in test_data:
            self.assertEqual(
                html_cleaner.clean(datum[0]), datum[1],
                msg='\n\nOriginal text: %s' % datum[0])

    def test_oppia_custom_tags(self) -> None:
        test_data: List[Tuple[str, ...]] = [(
            '<oppia-noninteractive-image filepath-with-value="1"/>',
            '<oppia-noninteractive-image filepath-with-value="1">'
            '</oppia-noninteractive-image>'
        ), (
            '<oppia-noninteractive-image filepath-with-value="1">'
            '</oppia-noninteractive-image>',
            '<oppia-noninteractive-image filepath-with-value="1">'
            '</oppia-noninteractive-image>'
        ), (
            '<oppia-fake-tag></oppia-fake-tag>',
            ''
        )]

        for datum in test_data:
            self.assertEqual(
                html_cleaner.clean(datum[0]), datum[1],
                msg='\n\nOriginal text: %s' % datum[0])


class HtmlStripperUnitTests(test_utils.GenericTestBase):
    """Test the HTML stripper."""

    def test_strip_html_tags(self) -> None:
        test_data: List[Tuple[str, str]] = [(
            '<a href="http://www.google.com">Hello</a>',
            'Hello',
        ), (
            'Just some text 12345',
            'Just some text 12345',
        ), (
            '<code>Unfinished HTML',
            'Unfinished HTML',
        ), (
            '<br/>',
            '',
        ), (
            'A big mix <div>Hello</div> Yes <span>No</span>',
            'A big mix Hello Yes No',
        ), (
            'Text with\nnewlines',
            'Text with\nnewlines',
        )]

        for datum in test_data:
            self.assertEqual(html_cleaner.strip_html_tags(datum[0]), datum[1])


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
                    'text-with-value': u'Link"quoted text"\'singlequotes\'',
                    'url-with-value': u'https://www.example.com'},
                'id': 'oppia-noninteractive-link'
            },
            {
                'customization_args': {
                    'start-with-value': 0,
                    'end-with-value': 0,
                    'video_id-with-value': (
                        u'https://www.youtube.com/watch?'
                        u'v=Ntcw0H0hwPU'),
                    'autoplay-with-value': False
                },
                'id': 'oppia-noninteractive-video'
            },
            {
                'customization_args': {
                    'math_content-with-value': {
                        u'raw_latex': u'\\frac{x}{y}',
                        u'svg_filename': u''
                    }
                },
                'id': 'oppia-noninteractive-math'
            }
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
            'oninteractive-math>'
        ]
        self.assertItemsEqual(
            [
                'img.svg', 'img2.svg', 'img3.svg', 'img4.svg',
                'img5.svg', 'math1.svg', 'math2.svg', 'math3.svg'],
            html_cleaner.get_image_filenames_from_html_strings(html_strings))
