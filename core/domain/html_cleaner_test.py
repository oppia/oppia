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
import feconf


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


class ContentMigrationTests(test_utils.GenericTestBase):
    """ Tests the function associated with the migration of html
    strings to valid RTE format.
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

    def test_convert_to_textangular(self):
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
                '<p>January $100 200</p><p>February $80 400</p>'
            )
        }, {
            'html_content': (
                '<p><p><p>Hello <br/> this<p> is <br> test case <p>'
                'for </p> migration <b>testing</b> </p></p></p></p>'
            ),
            'expected_output': (
                '<p>Hello <br> this</p><p> is <br> test case </p><p>'
                'for </p><p> migration <b>testing</b> </p>'
            )
        }, {
            'html_content': (
                '<p>Hello this is <p>test case </p> for <p> <p>migration</p>'
                'testing </p> for <p> invalid cases </p></p>'
            ),
            'expected_output': (
                '<p>Hello this is </p><p>test case </p><p> for </p><p> </p><p>'
                'migration</p><p>testing </p><p> for </p><p> invalid cases </p>'
            )
        }]

        for test_case in test_cases:
            self.assertEqual(
                test_case['expected_output'],
                html_cleaner.convert_to_textangular(test_case['html_content']))

    def test_validate_rte_format(self):
        test_cases_for_textangular = [
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
        actual_output_with_migration_for_textangular = (
            html_cleaner.validate_rte_format(
                test_cases_for_textangular,
                feconf.RTE_FORMAT_TEXTANGULAR, True))
        actual_output_without_migration_for_textangular = (
            html_cleaner.validate_rte_format(
                test_cases_for_textangular, feconf.RTE_FORMAT_TEXTANGULAR))

        expected_output_with_migration_for_textangular = {'strings': []}
        expected_output_without_migration_for_textangular = {
            'i': ['[document]'],
            'invalidTags': ['a'],
            'oppia-noninteractive-link': ['a'],
            'b': ['[document]'],
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
            actual_output_with_migration_for_textangular,
            expected_output_with_migration_for_textangular)
        self.assertEqual(
            actual_output_without_migration_for_textangular,
            expected_output_without_migration_for_textangular)

        test_cases_for_ckeditor = [
            (
                '<pre>Hello this is <b> testing '
                '<oppia-noninteractive-image filepath-with-value="amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image> in '
                '</b>progress</pre>'
            ),
            (
                '<oppia-noninteractive-collapsible content-with-value="&amp;'
                'quot;&amp;lt;pre&amp;gt;&amp;lt;p&amp;gt;lorem ipsum&amp;'
                'lt;/p&amp;gt;&amp;lt;/pre&amp;gt;'
                '&amp;quot;" heading-with-value="&amp;quot;'
                'lorem ipsum&amp;quot;lorem ipsum&amp;quot;?&amp;quot;">'
                '</oppia-noninteractive-collapsible>'
            )
        ]

        actual_output_with_migration_for_ckeditor = (
            html_cleaner.validate_rte_format(
                test_cases_for_ckeditor, feconf.RTE_FORMAT_CKEDITOR, True))
        actual_output_without_migration_for_ckeditor = (
            html_cleaner.validate_rte_format(
                test_cases_for_ckeditor, feconf.RTE_FORMAT_CKEDITOR))

        expected_output_with_migration_for_ckeditor = {'strings': []}
        expected_output_without_migration_for_ckeditor = {
            'invalidTags': ['b'],
            'oppia-noninteractive-image': ['b'],
            'p': ['pre'],
            'strings': [
                (
                    '<pre>Hello this is <b> testing '
                    '<oppia-noninteractive-image filepath-with-value="amp;quot;'
                    'random.png&amp;quot;"></oppia-noninteractive-image> in '
                    '</b>progress</pre>'
                ),
                (
                    '<oppia-noninteractive-collapsible content-with-value="&amp'
                    ';quot;&amp;lt;pre&amp;gt;&amp;lt;p&amp;gt;lorem ipsum&amp;'
                    'lt;/p&amp;gt;&amp;lt;/pre&amp;gt;'
                    '&amp;quot;" heading-with-value="&amp;quot;'
                    'lorem ipsum&amp;quot;lorem ipsum&amp;quot;?&amp;quot;">'
                    '</oppia-noninteractive-collapsible>'
                ),
            ]
        }

        self.assertEqual(
            actual_output_with_migration_for_ckeditor,
            expected_output_with_migration_for_ckeditor)
        self.assertEqual(
            actual_output_without_migration_for_ckeditor,
            expected_output_without_migration_for_ckeditor)

    def test_validate_soup_for_rte(self):
        test_cases_for_textangular = [
            (
                '<p>Hello <b>this </b>is </p><p><br></p><p>test <b>case '
                '</b>for </p><p><oppia-noninteractive-collapsible '
                'content-with-value=\"&amp;quot;Hello oppia&amp;quot;\" '
                'heading-with-value=\"&amp;quot;Learn more about APIs&'
                'amp;quot;\"></oppia-noninteractive-collapsible><br></p><p>'
                'for migration testing</p>'
            ),
            (
                'Hello<div>oppia</div>testing <i>in progess</i>!'
            ),
            (
                '<p>Hello</p><p>oppia</p><p>testing <i>in progress</i>!</p>'
            )
        ]

        expected_output_for_textangular = [False, True, False]
        err_dict = {}

        for index, test_case in enumerate(test_cases_for_textangular):
            actual_output_for_textangular = (
                html_cleaner._validate_soup_for_rte( # pylint: disable=protected-access
                    bs4.BeautifulSoup(test_case, 'html.parser'),
                    feconf.RTE_FORMAT_TEXTANGULAR, err_dict))

            self.assertEqual(
                actual_output_for_textangular,
                expected_output_for_textangular[index])

        test_cases_for_ckeditor = [
            (
                '<p>Lorem ipsum </p><p> Hello this is oppia </p>'
            ),
            (
                '<p>Lorem <span>ipsum </span></p> Hello this is '
                '<code>oppia </code>'
            ),
            (
                '<p><oppia-noninteractive-image filepath-with-value="amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image>Hello this '
                'is test case to check image tag inside p tag</p>'
            )
        ]

        expected_output_for_ckeditor = [False, True, True]
        err_dict = {}

        for index, test_case in enumerate(test_cases_for_ckeditor):
            actual_output_for_ckeditor = (
                html_cleaner._validate_soup_for_rte( # pylint: disable=protected-access
                    bs4.BeautifulSoup(test_case, 'html.parser'),
                    feconf.RTE_FORMAT_CKEDITOR, err_dict))

            self.assertEqual(
                actual_output_for_ckeditor,
                expected_output_for_ckeditor[index])

    def test_convert_tag_contents_to_rte_format(self):
        test_cases_for_textangular = [{
            'html_content': (
                '<div>Hello <b>this </b>is </div><p><br></p><p>test <b>case '
                '</b>for </p><p><oppia-noninteractive-collapsible '
                'content-with-value=\"&amp;quot;Hello oppia&amp;quot;\" '
                'heading-with-value=\"&amp;quot;Learn more about APIs&amp;'
                'quot;\"></oppia-noninteractive-collapsible><br></p><p>'
                'for migration testing</p>'
            ),
            'expected_output': (
                '<div>Hello <b>this </b>is </div><p><br/></p><p>test <b>case '
                '</b>for </p><p><oppia-noninteractive-collapsible '
                'content-with-value=\"&amp;quot;&amp;lt;p&amp;gt;Hello oppia'
                '&amp;lt;/p&amp;gt;&amp;quot;\" heading-with-value=\"'
                '&amp;quot;Learn more about APIs&amp;quot;\">'
                '</oppia-noninteractive-collapsible><br/></p><p>'
                'for migration testing</p>'
            )
        }, {
            'html_content': (
                'Hello<div>oppia</div>testing <i>in progess</i>!'
            ),
            'expected_output': (
                'Hello<div>oppia</div>testing <i>in progess</i>!'
            )
        }, {
            'html_content': (
                '<span><b>Hello </b></span><div><b><span>this is '
                'test case</span></b></div><div><b><br></b></div>'
                '<div><oppia-noninteractive-tabs tab_contents-with-value'
                '=\"[{&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;span '
                'style=\\&amp;quot;line-height: 21px; background-color: '
                'rgb(255, 255, 255);\\&amp;quot;&amp;gt;lorem ipsum&amp;lt;'
                '/span&amp;gt;&amp;quot;,&amp;quot;title&amp;quot;:&amp;'
                'quot;hello&amp;quot;},{&amp;quot;content&amp;quot;:&amp;'
                'quot;&amp;lt;span style=\\&amp;quot;color: rgb(0, 0, 0); '
                'font-family: &amp;#39;Times New Roman&amp;#39;; font-size: '
                'medium; line-height: normal;\\&amp;quot;&amp;gt;&amp;lt;'
                'font size=\\&amp;quot;3\\&amp;quot; face=\\&amp;quot;Times '
                'New Roman CE\\&amp;quot;&amp;gt;oppia&amp;lt;/font&amp;gt;'
                '&amp;lt;/span&amp;gt;&amp;quot;,&amp;quot;title&amp;quot;:'
                '&amp;quot;Savjet 1&amp;quot;}]\"></oppia-noninteractive-tabs>'
                '<b><br></b></div><div><span></span><b><br></b><div>'
                '<span><b><br></b></span></div></div>'
            ),
            'expected_output': (
                '<span><b>Hello </b></span><div><b><span>this is '
                'test case</span></b></div><div><b><br/></b></div>'
                '<div><oppia-noninteractive-tabs tab_contents-with-value='
                '\"[{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;'
                'p&amp;gt;lorem ipsum&amp;lt;/p&amp;gt;&amp;quot;, '
                '&amp;quot;title&amp;quot;: &amp;quot;hello&amp;quot;}, '
                '{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;'
                'oppia&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;'
                'quot;: &amp;quot;Savjet 1&amp;quot;}]\">'
                '</oppia-noninteractive-tabs><b><br/></b></div>'
                '<div><span></span><b><br/></b><div>'
                '<span><b><br/></b></span></div></div>'
            )
        }]

        for test_case in test_cases_for_textangular:
            actual_output_for_textangular = (
                html_cleaner.convert_tag_contents_to_rte_format(
                    test_case['html_content'],
                    html_cleaner.convert_to_textangular))
            self.assertEqual(
                actual_output_for_textangular,
                test_case['expected_output'])

        test_cases_for_ckeditor = [{
            'html_content': (
                '<oppia-noninteractive-collapsible '
                'content-with-value=\"&amp;quot;&amp;lt;pre&amp;gt;&amp;'
                'lt;p&amp;gt;Hello oppia&amp;lt;/p&amp;gt;&amp;lt;'
                '/pre&amp;gt;&amp;quot;\" '
                'heading-with-value=\"&amp;quot;Learn more about APIs&amp;'
                'quot;\"></oppia-noninteractive-collapsible>'
            ),
            'expected_output': (
                '<oppia-noninteractive-collapsible '
                'content-with-value=\"&amp;quot;&amp;lt;pre&amp;gt;Hello oppia'
                '&amp;lt;/pre&amp;gt;&amp;quot;\" heading-with-value=\"'
                '&amp;quot;Learn more about APIs&amp;quot;\">'
                '</oppia-noninteractive-collapsible>'
            )
        }, {
            'html_content': (
                'Hello<div>oppia</div>testing <i>in progess</i>!'
            ),
            'expected_output': (
                'Hello<div>oppia</div>testing <i>in progess</i>!'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-tabs tab_contents-with-value'
                '=\"[{&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;'
                '&amp;lt;i&amp;gt;lorem ipsum&amp;lt;/i&amp;gt;&amp;lt;/p'
                '&amp;gt;&amp;quot;,&amp;quot;title&amp;quot;:&amp;'
                'quot;hello&amp;quot;}]\"></oppia-noninteractive-tabs>'
            ),
            'expected_output': (
                '<oppia-noninteractive-tabs tab_contents-with-value'
                '=\"[{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;'
                '&amp;lt;em&amp;gt;lorem ipsum&amp;lt;/em&amp;gt;&amp;lt;/p'
                '&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;: &amp;'
                'quot;hello&amp;quot;}]\"></oppia-noninteractive-tabs>'
            )
        }]

        for test_case in test_cases_for_ckeditor:
            actual_output_for_ckeditor = (
                html_cleaner.convert_tag_contents_to_rte_format(
                    test_case['html_content'],
                    html_cleaner.convert_to_ckeditor))
            self.assertEqual(
                actual_output_for_ckeditor,
                test_case['expected_output'])

    def test_convert_to_ckeditor(self):
        test_cases = [{
            'html_content': (
                '<p>Lorem <span>ipsum </span></p> Hello this is '
                '<code>oppia </code>'
            ),
            'expected_output': (
                '<p>Lorem <span>ipsum </span></p> Hello this is '
                '<code>oppia </code>'
            )
        }, {
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image>Hello this '
                'is test case to check image tag inside p tag</p>'
            ),
            'expected_output': (
                '<oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image><p>Hello '
                'this is test case to check image tag inside p tag</p>'
            )
        }, {
            'html_content': '<p>hello <i> this is case4 for </i> testing</p>',
            'expected_output': (
                '<p>hello <em> this is case4 for </em> testing</p>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-collapsible content-with-value="&amp;'
                'quot;&amp;lt;pre&amp;gt;&amp;lt;p&amp;gt;lorem ipsum&'
                'amp;lt;/p&amp;gt;&amp;lt;/pre&amp;gt;'
                '&amp;quot;" heading-with-value="&amp;quot;'
                'lorem ipsum&amp;quot;lorem ipsum&amp;quot;?&amp;quot;">'
                '</oppia-noninteractive-collapsible>'
            ),
            'expected_output': (
                '<oppia-noninteractive-collapsible content-with-value="&amp;'
                'quot;&amp;lt;pre&amp;gt;lorem ipsum'
                '&amp;lt;/pre&amp;gt;'
                '&amp;quot;" heading-with-value="&amp;quot;'
                'lorem ipsum&amp;quot;lorem ipsum&amp;quot;?&amp;quot;">'
                '</oppia-noninteractive-collapsible>'
            )
        }, {
            'html_content': (
                '<pre>Hello this is <b> testing '
                '<oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image> in '
                '</b>progress</pre>'
            ),
            'expected_output': (
                '<pre>Hello this is <strong> testing </strong></pre>'
                '<oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image><pre>'
                '<strong> in </strong>progress</pre>'
            )
        }, {
            'html_content': (
                '<blockquote><p> Here is another<b>example'
                '</b></p></blockquote>'
            ),
            'expected_output': (
                '<blockquote><p> Here is another<strong>example'
                '</strong></p></blockquote>'
            )
        }]

        for test_case in test_cases:
            self.assertEqual(
                test_case['expected_output'],
                html_cleaner.convert_to_ckeditor(test_case['html_content']))

    def test_add_caption_to_image(self):
        test_cases = [{
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image>Hello this '
                'is test case to check image tag inside p tag</p>'
            ),
            'expected_output': (
                '<p><oppia-noninteractive-image caption-with-value="&amp;quot;'
                '&amp;quot;" filepath-with-value="&amp;quot;random.png&amp;'
                'quot;"></oppia-noninteractive-image>Hello this '
                'is test case to check image tag inside p tag</p>'
            )
        }, {
            'html_content': (
                '<p><oppia-noninteractive-image caption-with-value="&amp;quot;'
                'abc&amp;quot;" filepath-with-value="&amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image>Hello this '
                'is test case to check image tag inside p tag</p>'
            ),
            'expected_output': (
                '<p><oppia-noninteractive-image caption-with-value="&amp;quot;'
                'abc&amp;quot;" filepath-with-value="&amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image>Hello this '
                'is test case to check image tag inside p tag</p>'
            )
        }]

        for test_case in test_cases:
            self.assertEqual(
                html_cleaner.add_caption_to_image(test_case['html_content']),
                test_case['expected_output'])
