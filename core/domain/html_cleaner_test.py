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

import bs4
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


class ContentMigrationToTextAngular(test_utils.GenericTestBase):
    """ Tests the function associated with the migration of html
    strings to valid TextAngular format.
    """

    def test_wrap_with_siblings(self):
        test_cases = [{
            'html_content': (
                '<p><i>hello</i></p> this is<i>test case1</i> for '
                '<ol><li><i>testing</i></li></ol>'
            ),
            'expected_output': (
                '<p><i>hello</i></p><p> this is<i>test case1</i> for </p>'
                '<ol><li><i>testing</i></li></ol>'
            )
        }, {
            'html_content': (
                '<br/>hello this is<br/>test<p> case2<br/>'
                '</p> for <p><br/>testing</p>'
            ),
            'expected_output': (
                '<p><br/>hello this is<br/>test</p>'
                '<p> case2<br/></p> for <p><br/>testing</p>'
            )
        }, {
            'html_content': (
                '<p>hello</p>this is case <b>3</b> for <i>'
                'testing</i> the <p>function</p>'
            ),
            'expected_output': (
                '<p>hello</p><p>this is case <b>3</b> for <i>'
                'testing</i> the </p><p>function</p>'
            )
        }]
        for index, test_case in enumerate(test_cases):
            soup = bs4.BeautifulSoup(test_case['html_content'], 'html.parser')
            if index == 0:
                tag = soup.findAll('i')[1]
            elif index == 1:
                tag = soup.find('br')
            elif index == 2:
                tag = soup.find('b')
            html_cleaner.wrap_with_siblings(tag, soup.new_tag('p'))
            self.assertEqual(str(soup), test_case['expected_output'])

    def test_convert_to_text_angular(self):
        test_cases = [{
            'html_content': (
                '<div><i>hello</i></div> this is<i>test case1</i> for '
                '<span><i>testing</i></span>'
            ),
            'expected_output': (
                '<p><i>hello</i></p><p> this is<i>test case1</i> for '
                '<i>testing</i></p>'
            )
        }, {
            'html_content': (
                '<div><br>hello</div> this is<br>test<pre> case2<br>'
                '</pre> for <span><br>testing</span>'
            ),
            'expected_output': (
                '<p><br>hello</p><p> this is<br>test</p>'
                '<pre> case2\n</pre><p> for <br>testing</p>'
            )
        }, {
            'html_content': 'hello <p> this is case3 for </p> testing',
            'expected_output': (
                '<p>hello </p><p> this is case3 for </p><p> testing</p>'
            )
        }, {
            'html_content': 'hello <i> this is case4 for </i> testing',
            'expected_output': '<p>hello <i> this is case4 for </i> testing</p>'
        }, {
            'html_content': (
                '<span>hello</span><code> this is </code><div>'
                'test </div><div>case4</div> for testing'
            ),
            'expected_output': (
                '<p>hello this is </p><p>test </p><p>case4</p><p> for '
                'testing</p>'
            )
        }, {
            'html_content': (
                '<p> Random test</p>case <b>is</b> <i>added</i> here<p>!</p>'
            ),
            'expected_output': (
                '<p> Random test</p><p>case <b>is</b> <i>added</i> '
                'here</p><p>!</p>'
            )
        }, {
            'html_content': (
                '<blockquote> Here is another<b>example'
                '</b></blockquote>'
            ),
            'expected_output': (
                '<blockquote><p> Here is another<b>example</b></p></blockquote>'
            )
        }, {
            'html_content': (
                '<table><tbody><tr><td>January</td><td>$100</td>'
                '<td>200</td></tr><tr><td>February</td><td>$80</td><td>400'
                '</td></tr></tbody></table>'
            ),
            'expected_output': (
                '<p>January\t$100\t200</p><p>February\t$80\t400</p>'
            )
        }]

        for test_case in test_cases:
            self.assertEqual(
                test_case['expected_output'],
                html_cleaner.convert_to_text_angular(test_case['html_content']))

    def test_validate_text_angular(self):
        test_cases = [
            (
                'This is for <i>testing</i> the validate <b>text</b> '
                'angular function.'
            ),
            (
                'This is the last test case <a href="https://github.com">hello'
                '<oppia-noninteractive-link url-with-value="&amp;quot;'
                'here&amp;quot;" text-with-value="validated">'
                '</oppia-noninteractive-link></a><p> testing completed</p>'
            )
        ]
        actual_output_with_migration = (
            html_cleaner.validate_textangular_format(
                test_cases, True))
        actual_output_without_migration = (
            html_cleaner.validate_textangular_format(
                test_cases))

        expected_output_with_migration = {'strings': []}
        expected_output_without_migration = {
            u'i': [u'[document]'],
            'invalidTags': [u'a'],
            u'oppia-noninteractive-link': [u'a'],
            u'b': [u'[document]'],
            'strings': [
                (
                    'This is for <i>testing</i> the validate '
                    '<b>text</b> angular function.'
                ),
                (
                    'This is the last test case <a href="https://github.com">'
                    'hello<oppia-noninteractive-link url-with-value="&amp;'
                    'quot;here&amp;quot;" text-with-value="validated">'
                    '</oppia-noninteractive-link></a><p> testing completed</p>'
                ),
            ]
        }

        self.assertEqual(
            actual_output_with_migration,
            expected_output_with_migration)
        self.assertEqual(
            actual_output_without_migration,
            expected_output_without_migration)
