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
                '\n\nOriginal text: %s' % datum[0])

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
                '\n\nOriginal text: %s' % datum[0])

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
                '\n\nOriginal text: %s' % datum[0])


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


class RteVerificationUnitTests(test_utils.GenericTestBase):
    """Test the Rte output format verification function."""

    def test_verification_function(self):
        test_content = '''
        <p>Test list</p>

        <ol>
        <li>123</li>
        <li><strong>abc</strong></li>
        <li>blah</li>
        <li><oppia-noninteractive-math raw_latex-with-value="&amp;quot;\\frac{x}{y}&amp;quot;"></oppia-noninteractive-math></li>
        </ol>

        <p>&nbsp;</p>

        <p>A random sentence, then a block component.</p>
        <oppia-noninteractive-collapsible content-with-value="&amp;quot;You have opened the collapsible block.&amp;quot;" heading-with-value="&amp;quot;Sample Header&amp;quot;"></oppia-noninteractive-collapsible>

        <pre>
        Formatted stuff.</pre>
        '''
        html_cleaner.verify_for_ckeditor(test_content)
