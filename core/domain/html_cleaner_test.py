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

from core.domain import html_cleaner
from core.tests import test_utils


class HtmlCleanerUnitTests(test_utils.GenericTestBase):
    """Test the HTML sanitizer."""

    def setUp(self):
        super(HtmlCleanerUnitTests, self).setUp()
        self.longMessage = True

    def test_good_tags_allowed(self):
        test_data = [(
            '<a href="http://www.google.com">Hello</a>',
            '<a href="http://www.google.com">Hello</a>'
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

    def test_bad_tags_suppressed(self):
        test_data = [(
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

    def test_oppia_custom_tags(self):
        test_data = [(
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

    def test_strip_html_tags(self):
        test_data = [(
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

    def test_get_rte_components(self):
        test_data = (
            '<p>Test text&nbsp;'
            '<oppia-noninteractive-math '
            'raw_latex-with-value="&amp;quot;\\frac{x}{y}&amp;quot;">'
            '</oppia-noninteractive-math></p><p>&nbsp;'
            '<oppia-noninteractive-link '
            'text-with-value="&amp;quot;Link&amp;quot;" '
            'url-with-value="&amp;quot;https://www.example.com&amp;quot;">'
            '</oppia-noninteractive-link>.</p>'
            '<p>Video</p>'
            '<p><oppia-noninteractive-video autoplay-with-value="false" '
            'end-with-value="0" start-with-value="0" '
            'video_id-with-value="&amp;quot;'
            'https://www.youtube.com/watch?v=Ntcw0H0hwPU&amp;quot;">'
            '</oppia-noninteractive-video><br></p>'
        )

        expected_components = [
            {
                'customization_args': {
                    'text-with-value': u'Link',
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
                    'raw_latex-with-value': u'\\frac{x}{y}'
                },
                'id': 'oppia-noninteractive-math'
            }
        ]

        components = html_cleaner.get_rte_components(test_data)

        self.assertEqual(len(components), len(expected_components))
        for component in components:
            self.assertIn(component, expected_components)
