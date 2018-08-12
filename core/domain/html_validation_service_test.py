# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for the HTML validation."""

import bs4
from core.domain import html_validation_service
from core.tests import test_utils
import feconf


class ContentMigrationTests(test_utils.GenericTestBase):
    """ Tests the function associated with the migration of html
    strings to valid RTE format.
    """
    FILENAME = 'abc.png'
    HEIGHT = 45
    WIDTH = 45

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
                tag = soup.findAll(name='i')[1]
            elif index == 1:
                tag = soup.find(name='br')
            elif index == 2:
                tag = soup.find(name='b')
            html_validation_service.wrap_with_siblings(tag, soup.new_tag('p'))
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
                html_validation_service.convert_to_textangular(
                    test_case['html_content']))

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
            html_validation_service.validate_rte_format(
                test_cases_for_textangular,
                feconf.RTE_FORMAT_TEXTANGULAR, run_migration=True))
        actual_output_without_migration_for_textangular = (
            html_validation_service.validate_rte_format(
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
            html_validation_service.validate_rte_format(
                test_cases_for_ckeditor, feconf.RTE_FORMAT_CKEDITOR,
                run_migration=True))
        actual_output_without_migration_for_ckeditor = (
            html_validation_service.validate_rte_format(
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
                html_validation_service._validate_soup_for_rte( # pylint: disable=protected-access
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
                html_validation_service._validate_soup_for_rte( # pylint: disable=protected-access
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
                html_validation_service.convert_tag_contents_to_rte_format(
                    test_case['html_content'],
                    html_validation_service.convert_to_textangular))
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
                html_validation_service.convert_tag_contents_to_rte_format(
                    test_case['html_content'],
                    html_validation_service.convert_to_ckeditor))
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
        }, {
            'html_content': (
                '<p>Hello </p><p>this </p><p>is test case.</p>'
                '<ul><li>Item1</li><li>Item2</li>'
                '<ul><li>This is for <b>testing </b>migration.</li>'
                '<li>Item3</li></ul></ul><p></p>'
            ),
            'expected_output': (
                '<p>Hello </p><p>this </p><p>is test case.</p>'
                '<ul><li>Item1</li><li>Item2'
                '<ul><li>This is for <strong>testing </strong>migration.</li>'
                '<li>Item3</li></ul></li></ul><p></p>'
            )
        }, {
            'html_content': (
                '<ol><li>Item1</li><ol><ol><ol><li>Item2</li><li>Item3</li>'
                '<li>Item4</li><ol><ol><ol><li>Item5</li><li>Item6</li></ol>'
                '</ol></ol></ol></ol></ol><li>Item7</li><ol><li>Item8</li>'
                '<li>Item9</li><ol><ol><li>Item10</li><li>Item11</li>'
                '</ol></ol></ol></ol>'
            ),
            'expected_output': (
                '<ol><li>Item1<ol><li>Item2</li><li>Item3</li><li>Item4<ol>'
                '<li>Item5</li><li>Item6</li></ol></li></ol></li><li>Item7'
                '<ol><li>Item8</li><li>Item9<ol><li>Item10</li><li>Item11'
                '</li></ol></li></ol></li></ol>'
            )
        }, {
            'html_content': (
                '<p><em><strong>this is </strong></em><br></p>'
                '<oppia-noninteractive-collapsible content-with-value'
                '="&amp;quot;&amp;lt;ul&amp;gt;&amp;lt;li&amp;gt;&amp;'
                'lt;p&amp;gt;&amp;lt;li&amp;gt;loremipsum&amp;lt;/li&amp;gt;'
                '&amp;lt;li&amp;gt;loremipsum&amp;lt;/li&amp;gt;&amp;lt;li&amp;'
                'gt;loremipsum&amp;lt;/li&amp;gt;&amp;lt;/p&amp;gt;&amp;lt;'
                'oppia-noninteractive-image alt-with-value=\\&amp;quot;&amp;'
                'amp;amp;quot;loremipsum&amp;amp;amp;quot;\\&amp;quot; '
                'caption-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;'
                'quot;\\&amp;quot; filepath-with-value=\\&amp;quot;&amp;amp;amp'
                ';quot;loremipsum.png&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp'
                ';lt;/oppia-noninteractive-image&amp;gt;&amp;lt;p&amp;gt;&amp;'
                'lt;br&amp;gt;&amp;lt;/p&amp;gt;&amp;lt;/li&amp;gt;&amp;lt;/ul'
                '&amp;gt;&amp;quot;" heading-with-value="&amp;quot;loremipusm'
                '&amp;quot;"></oppia-noninteractive-collapsible>'
            ),
            'expected_output': (
                '<p><em><strong>this is </strong></em><br></p>'
                '<oppia-noninteractive-collapsible content-with-value='
                '"&amp;quot;&amp;lt;ul&amp;gt;&amp;lt;li&amp;gt;loremipsum&amp;'
                'lt;/li&amp;gt;&amp;lt;li&amp;gt;loremipsum&amp;lt;/li&amp;gt;'
                '&amp;lt;li&amp;gt;loremipsum&amp;lt;/li&amp;gt;&amp;lt;'
                'li&amp;gt;&amp;lt;oppia-noninteractive-image alt-with-value'
                '=\\&amp;quot;&amp;amp;amp;quot;loremipsum&amp;amp;amp;quot;'
                '\\&amp;quot; caption-with-value=\\&amp;quot;&amp;amp;amp;quot;'
                '&amp;amp;amp;quot;\\&amp;quot; filepath-with-value=\\&amp;quot'
                ';&amp;amp;amp;quot;loremipsum.png&amp;amp;amp;quot;\\&amp;quot'
                ';&amp;gt;&amp;lt;/oppia-noninteractive-image&amp;gt;&amp;lt;'
                'p&amp;gt;\\u00a0&amp;lt;/p&amp;gt;&amp;lt;/li&amp;'
                'gt;&amp;lt;/ul&amp;gt;&amp;quot;" heading-with-value="&amp;'
                'quot;loremipusm&amp;quot;"></oppia-noninteractive-collapsible>'
            )
        }, {
            'html_content': (
                '<pre><p>Hello this is test case for </p><p>br '
                'in </p><p>pre </p><p>tag<br></p></pre>'
            ),
            'expected_output': (
                '<pre>Hello this is test case for br in pre tag\n</pre>'
            )
        }, {
            'html_content': (
                '<p><li> Hello this is test case for li in p which results '
                'in </li><li> in document </li><li> after unwrapping </li></p>'
            ),
            'expected_output': (
                '<ul><li> Hello this is test case for li in p which results '
                'in </li><li> in document </li><li> after unwrapping </li></ul>'
            )
        }]

        for test_case in test_cases:
            self.assertEqual(
                test_case['expected_output'],
                html_validation_service.convert_to_ckeditor(
                    test_case['html_content']))

    def test_add_caption_to_image(self):
        test_cases = [{
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image>Hello this '
                'is test case to check that caption attribute is added to '
                'image tags if it is missing.</p>'
            ),
            'expected_output': (
                '<p><oppia-noninteractive-image caption-with-value="&amp;quot;'
                '&amp;quot;" filepath-with-value="&amp;quot;random.png&amp;'
                'quot;"></oppia-noninteractive-image>Hello this '
                'is test case to check that caption attribute is added to '
                'image tags if it is missing.</p>'
            )
        }, {
            'html_content': (
                '<p><oppia-noninteractive-image caption-with-value="&amp;quot;'
                'abc&amp;quot;" filepath-with-value="&amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image>Hello this '
                'is test case to check that image tags that already have '
                'caption attribute are not changed.</p>'
            ),
            'expected_output': (
                '<p><oppia-noninteractive-image caption-with-value="&amp;quot;'
                'abc&amp;quot;" filepath-with-value="&amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image>Hello this '
                'is test case to check that image tags that already have '
                'caption attribute are not changed.</p>'
            )
        }]

        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.add_caption_attr_to_image(
                    test_case['html_content']),
                test_case['expected_output'])

    def test_validate_customization_args(self):
        test_cases = [(
            '<p><oppia-noninteractive-link text-with-value="&amp;quot;What is '
            'a link?&amp;quot;" url-with-value="&amp;quot;htt://link.com&amp'
            ';quot;"></oppia-noninteractive-link></p>'
        ), (
            '<p><oppia-noninteractive-link text-with-value="3456" '
            'url-with-value="&amp;quot;http://google.com&amp'
            ';quot;"></oppia-noninteractive-link></p>'
        ), (
            '<p><oppia-noninteractive-link text-with-value="&amp;quot;What is '
            'a link?&amp;quot;" url-with-value="&amp;quot;https://link.com&amp'
            ';quot;"></oppia-noninteractive-link></p>'
        ), (
            '<oppia-noninteractive-collapsible content-with-value="'
            '&amp;quot;&amp;lt;p&amp;gt;&amp;lt;oppia-noninteractive-link '
            'url-with-value=\\&amp;quot;&amp;amp;amp;quot;'
            'https://www.example.com&amp;amp;amp;quot;\\&amp;quot;&amp;gt;'
            '&amp;lt;/oppia-noninteractive-link&amp;gt;&amp;lt;/p&amp;gt;'
            '&amp;quot;" heading-with-value="&amp;quot;Hello&amp;quot;">'
            '</oppia-noninteractive-collapsible>'
        ), (
            '<oppia-noninteractive-image caption-with-value="&amp;quot;'
            'abc&amp;quot;" filepath-with-value="&amp;quot;'
            'random.png&amp;quot;"></oppia-noninteractive-image>'
        ), (
            '<p><oppia-noninteractive-math raw_latex-with-value="&amp;quot;'
            'abc&amp;quot;"></oppia-noninteractive-math></p>'
        ), (
            '<p><oppia-noninteractive-math url-with-value="&amp;quot;'
            'http://link.com&amp;quot;></oppia-noninteractive-math></p>'
        ), (
            '<oppia-noninteractive-collapsible content-with-value='
            '"&amp;quot;&amp;lt;p&amp;gt;lorem ipsum&amp;lt;/p&amp;gt;&amp;'
            'quot;" heading-with-value="&amp;quot;lorem ipsum&amp;quot;">'
            '</oppia-noninteractive-collapsible>'
        ), (
            '<oppia-noninteractive-collapsible content-with-value='
            '"34454" heading-with-value="&amp;quot;lorem ipsum&amp;quot;">'
            '</oppia-noninteractive-collapsible>'
        ), (
            '<oppia-noninteractive-collapsible content-with-value="'
            '&amp;quot;&amp;lt;oppia-noninteractive-tabs tab_contents'
            '-with-value=\\&amp;quot;[{&amp;amp;amp;quot;title&amp;amp;amp;'
            'quot;:&amp;amp;amp;quot;Tab&amp;amp;amp;quot;,&amp;amp;amp;quot;'
            'content&amp;amp;amp;quot;:&amp;amp;amp;quot;&amp;amp;amp;lt;p&amp'
            ';amp;amp;gt;Hello&amp;amp;amp;lt;/p&amp;amp;amp;gt;&amp;amp;'
            'amp;quot;}]\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-tabs'
            '&amp;gt;&amp;lt;p&amp;gt;You have opened the collapsible block.'
            '&amp;lt;/p&amp;gt;&amp;quot;" heading-with-value="&amp;quot;'
            'Hello&amp;quot;"></oppia-noninteractive-collapsible>'
        ), (
            '<oppia-noninteractive-collapsible content-with-value='
            '"&amp;quot;&amp;lt;oppia-noninteractive-collapsible '
            'content-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;'
            'amp;amp;lt;p&amp;amp;amp;gt;Hello&amp;amp;amp;lt;/p'
            '&amp;amp;amp;gt;&amp;amp;amp;quot;\\&amp;quot; '
            'heading-with-value=\\&amp;quot;&amp;amp;amp;quot;'
            'SubCollapsible&amp;amp;amp;quot;\\&amp;quot;&amp;'
            'gt;&amp;lt;/oppia-noninteractive-collapsible&amp;'
            'gt;&amp;lt;p&amp;gt;&amp;amp;nbsp;&amp;lt;/p&amp;gt;'
            '&amp;quot;" heading-with-value="&amp;quot;Collapsible'
            '&amp;quot;"></oppia-noninteractive-collapsible>'
        ), (
            '<oppia-noninteractive-tabs tab_contents-with-value="'
            '[{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;lorem '
            'ipsum&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;: '
            '&amp;quot;hello&amp;quot;}, {&amp;quot;content&amp;quot;: &amp;'
            'quot;&amp;lt;p&amp;gt;oppia&amp;lt;/p&amp;gt;&amp;quot;, &amp;'
            'quot;title&amp;quot;: &amp;quot;Savjet 1&amp;quot;}]">'
            '</oppia-noninteractive-tabs>'
        ), (
            '<oppia-noninteractive-tabs tab_contents-with-value="'
            '[{&amp;quot;content&amp;quot;: 1234, '
            '&amp;quot;title&amp;quot;: &amp;quot;hello&amp;quot;}, '
            '{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;'
            'oppia&amp;lt;/p&amp;gt;&amp;quot;, &amp;'
            'quot;title&amp;quot;: &amp;quot;Savjet 1&amp;quot;}]">'
            '</oppia-noninteractive-tabs>'
        ), (
            '<oppia-noninteractive-tabs tab_contents-with-value="'
            '[{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;lorem '
            'ipsum&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;url&amp;quot;: '
            '&amp;quot;hello&amp;quot;}, {&amp;quot;content&amp;quot;: &amp;'
            'quot;&amp;lt;p&amp;gt;oppia&amp;lt;/p&amp;gt;&amp;quot;, &amp;'
            'quot;title&amp;quot;: &amp;quot;Savjet 1&amp;quot;}]">'
            '</oppia-noninteractive-tabs>'
        ), (
            '<oppia-noninteractive-tabs tab_contents-with-value="'
            '[{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;lorem '
            'ipsum&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;: '
            '&amp;quot;hello&amp;quot;}, [1,2,3]]">'
            '</oppia-noninteractive-tabs>'
        ), (
            '<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;'
            'title&amp;quot;:&amp;quot;Tab&amp;quot;,&amp;quot;content&amp;'
            'quot;:&amp;quot;&amp;lt;oppia-noninteractive-tabs '
            'tab_contents-with-value=\\&amp;quot;[{&amp;amp;amp;quot;title'
            '&amp;amp;amp;quot;:&amp;amp;amp;quot;Subtab&amp;amp;amp;quot;'
            ',&amp;amp;amp;quot;content&amp;amp;amp;quot;:&amp;amp;amp;quot;'
            '&amp;amp;amp;lt;p&amp;amp;amp;gt;Hello&amp;amp;amp;lt;/p&amp;'
            'amp;amp;gt;&amp;amp;amp;quot;}]\\&amp;quot;&amp;gt;&amp;lt;'
            '/oppia-noninteractive-tabs&amp;gt;&amp;lt;p&amp;gt;&amp;amp;'
            'nbsp;&amp;lt;/p&amp;gt;&amp;quot;}]">'
            '</oppia-noninteractive-tabs>'
        ), (
            '<oppia-noninteractive-video autoplay-with-value="false" '
            'end-with-value="0" start-with-value="0">'
            '</oppia-noninteractive-video>'
        ), (
            '<oppia-noninteractive-video autoplay-with-value="&amp;quot;hello'
            '&amp;quot;" end-with-value="0" start-with-value="0" '
            'video_id-with-value="&amp;quot;loremipsum&amp;quot;">'
            '</oppia-noninteractive-video>'
        ), (
            '<oppia-noninteractive-video autoplay-with-value="false" '
            'end-with-value="0" start-with-value="&amp;quot;Hello&amp;quot;" '
            'video_id-with-value="&amp;quot;loremipsum&amp;quot;">'
            '</oppia-noninteractive-video>'
        ), (
            '<oppia-noninteractive-video autoplay-with-value="false" '
            'end-with-value="0" start-with-value="0" '
            'video_id-with-value="&amp;quot;lorem&amp;quot;">'
            '</oppia-noninteractive-video>'
        ), (
            '<oppia-noninteractive-video autoplay-with-value="false" '
            'end-with-value="0" start-with-value="0" '
            'video_id-with-value="&amp;quot;12345678901&amp;quot;">'
            '</oppia-noninteractive-video>'
        ), (
            '<oppia-noninteractive-image alt-with-value="&amp;quot;A '
            'circle divided into equal fifths.&amp;quot;" '
            'caption-with-value="&amp;quot;&amp;quot;" '
            'filepath-with-value="&amp;quot;xyz.png&amp;quot;">'
            '</oppia-noninteractive-image>'
        ), (
            '<oppia-noninteractive-image alt-with-value="&amp;quot;A '
            'circle divided into equal fifths.&amp;quot;" '
            'caption-with-value="&amp;quot;Hello&amp;quot;" '
            'filepath-with-value="&amp;quot;xy.z.png&amp;quot;">'
            '</oppia-noninteractive-image>'
        ), (
            '<oppia-noninteractive-image alt-with-value="&amp;quot;A '
            'circle divided into equal fifths.&amp;quot;" '
            'caption-with-value="34454" '
            'filepath-with-value="&amp;quot;xyz.png&amp;quot;">'
            '</oppia-noninteractive-image>'
        ), (
            '<oppia-noninteractive-image alt-with-value="&amp;quot;A '
            'circle divided into equal fifths.&amp;quot;" '
            'caption-with-value="&amp;quot;5454&amp;quot;" '
            'filepath-with-value="&amp;quot;xyz.jpg&amp;quot;">'
            '</oppia-noninteractive-image>'
        ), (
            '<oppia-noninteractive-image alt-with-value="&amp;quot;A '
            'circle divided into equal fifths.&amp;quot;" '
            'caption-with-value="&amp;quot;Hello&amp;quot;" '
            'filepath-with-value="&amp;quot;46503*.jpg&amp;quot;">'
            '</oppia-noninteractive-image>'
        )]

        actual_output = html_validation_service.validate_customization_args(
            test_cases)

        expected_output = {
            'Invalid filepath': [(
                '<oppia-noninteractive-image alt-with-value="&amp;quot;'
                'A circle divided into equal fifths.&amp;quot;" caption-'
                'with-value="&amp;quot;Hello&amp;quot;" filepath-with-value'
                '="&amp;quot;46503*.jpg&amp;quot;">'
                '</oppia-noninteractive-image>'
            ), (
                '<oppia-noninteractive-image alt-with-value="&amp;quot;A '
                'circle divided into equal fifths.&amp;quot;" caption-'
                'with-value="&amp;quot;Hello&amp;quot;" filepath-with-value'
                '="&amp;quot;xy.z.png&amp;quot;"></oppia-noninteractive-image>'
            )],
            'Expected dict, received [1, 2, 3]': [(
                '<oppia-noninteractive-tabs tab_contents-with-value='
                '"[{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;'
                'gt;lorem ipsum&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;'
                'title&amp;quot;: &amp;quot;hello&amp;quot;}, [1,2,3]]">'
                '</oppia-noninteractive-tabs>'
            )],
            'Nested tabs and collapsible': [(
                '<oppia-noninteractive-collapsible content-with-value="&amp;'
                'quot;&amp;lt;oppia-noninteractive-collapsible content-with-'
                'value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;lt;p&amp;'
                'amp;amp;gt;Hello&amp;amp;amp;lt;/p&amp;amp;amp;gt;&amp;amp;'
                'amp;quot;\\&amp;quot; heading-with-value=\\&amp;quot;&amp;'
                'amp;amp;quot;SubCollapsible&amp;amp;amp;quot;\\&amp;quot;&amp;'
                'gt;&amp;lt;/oppia-noninteractive-collapsible&amp;gt;&amp;lt;p'
                '&amp;gt;&amp;amp;nbsp;&amp;lt;/p&amp;gt;&amp;quot;" '
                'heading-with-value="&amp;quot;Collapsible&amp;quot;">'
                '</oppia-noninteractive-collapsible>'
            ), (
                '<oppia-noninteractive-collapsible content-with-value='
                '"&amp;quot;&amp;lt;oppia-noninteractive-tabs tab_contents-'
                'with-value=\\&amp;quot;[{&amp;amp;amp;quot;title&amp;amp;'
                'amp;quot;:&amp;amp;amp;quot;Tab&amp;amp;amp;quot;,&amp;'
                'amp;amp;quot;content&amp;amp;amp;quot;:&amp;amp;amp;quot;'
                '&amp;amp;amp;lt;p&amp;amp;amp;gt;Hello&amp;amp;amp;lt;/p'
                '&amp;amp;amp;gt;&amp;amp;amp;quot;}]\\&amp;quot;&amp;gt;&amp;'
                'lt;/oppia-noninteractive-tabs&amp;gt;&amp;lt;p&amp;gt;You '
                'have opened the collapsible block.&amp;lt;/p&amp;gt;'
                '&amp;quot;" heading-with-value="&amp;quot;Hello&amp;quot;">'
                '</oppia-noninteractive-collapsible>'
            ), (
                '<oppia-noninteractive-tabs tab_contents-with-value'
                '="[{&amp;quot;title&amp;quot;:&amp;quot;Tab&amp;quot;,'
                '&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;oppia-'
                'noninteractive-tabs tab_contents-with-value=\\&amp;quot;'
                '[{&amp;amp;amp;quot;title&amp;amp;amp;quot;:&amp;amp;amp;'
                'quot;Subtab&amp;amp;amp;quot;,&amp;amp;amp;quot;content&amp;'
                'amp;amp;quot;:&amp;amp;amp;quot;&amp;amp;amp;lt;p&amp;amp;'
                'amp;gt;Hello&amp;amp;amp;lt;/p&amp;amp;amp;gt;&amp;amp;'
                'amp;quot;}]\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive'
                '-tabs&amp;gt;&amp;lt;p&amp;gt;&amp;amp;nbsp;&amp;lt;/p&amp;'
                'gt;&amp;quot;}]"></oppia-noninteractive-tabs>'
            )],
            'Expected unicode HTML string, received 34454': [(
                '<oppia-noninteractive-collapsible content-with-value="34454" '
                'heading-with-value="&amp;quot;lorem ipsum&amp;quot;">'
                '</oppia-noninteractive-collapsible>'
            )],
            "Missing attributes: [u'text-with-value'], Extra attributes: []": [(
                '<oppia-noninteractive-collapsible content-with-value'
                '="&amp;quot;&amp;lt;p&amp;gt;&amp;lt;oppia-noninteractive-'
                'link url-with-value=\\&amp;quot;&amp;amp;amp;quot;https://'
                'www.example.com&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp;lt;'
                '/oppia-noninteractive-link&amp;gt;&amp;lt;/p&amp;gt;&amp;'
                'quot;" heading-with-value="&amp;quot;Hello&amp;quot;">'
                '</oppia-noninteractive-collapsible>'
            )],
            'Expected bool, received hello': [(
                '<oppia-noninteractive-video autoplay-with-value="&amp;quot;'
                'hello&amp;quot;" end-with-value="0" start-with-value="0" '
                'video_id-with-value="&amp;quot;loremipsum&amp;quot;">'
                '</oppia-noninteractive-video>'
            )],
            (
                "Invalid URL: Sanitized URL should start with 'http://' or "
                "'https://'; received htt://link.com"
            ): [(
                '<p><oppia-noninteractive-link text-with-value="&amp;quot;'
                'What is a link?&amp;quot;" url-with-value="&amp;quot;htt://'
                'link.com&amp;quot;"></oppia-noninteractive-link></p>'
            )],
            (
                "Missing attributes: [u'video_id-with-value'], "
                "Extra attributes: []"
            ): [(
                '<oppia-noninteractive-video autoplay-with-value="false" '
                'end-with-value="0" start-with-value="0">'
                '</oppia-noninteractive-video>'
            )],
            'Expected unicode string, received 34454': [(
                '<oppia-noninteractive-image alt-with-value="&amp;quot;'
                'A circle divided into equal fifths.&amp;quot;" '
                'caption-with-value="34454" filepath-with-value="&amp;quot;'
                'xyz.png&amp;quot;"></oppia-noninteractive-image>'
            )],
            'Expected unicode string, received 3456': [(
                '<p><oppia-noninteractive-link text-with-value="3456" '
                'url-with-value="&amp;quot;http://google.com&amp;quot;">'
                '</oppia-noninteractive-link></p>'
            )],
            "Missing keys: ['title'], Extra keys: [u'url']": [(
                '<oppia-noninteractive-tabs tab_contents-with-value="'
                '[{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;'
                'gt;lorem ipsum&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;url'
                '&amp;quot;: &amp;quot;hello&amp;quot;}, {&amp;quot;'
                'content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;oppia'
                '&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;: '
                '&amp;quot;Savjet 1&amp;quot;}]"></oppia-noninteractive-tabs>'
            )],
            "invalid literal for int() with base 10: 'Hello'": [(
                '<oppia-noninteractive-video autoplay-with-value="false" '
                'end-with-value="0" start-with-value="&amp;quot;Hello&amp;'
                'quot;" video_id-with-value="&amp;quot;loremipsum&amp;quot;">'
                '</oppia-noninteractive-video>'
            )],
            'Expected unicode HTML string, received 1234': [(
                '<oppia-noninteractive-tabs tab_contents-with-value='
                '"[{&amp;quot;content&amp;quot;: 1234, &amp;quot;title'
                '&amp;quot;: &amp;quot;hello&amp;quot;}, {&amp;quot;'
                'content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;oppia&'
                'amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;: '
                '&amp;quot;Savjet 1&amp;quot;}]"></oppia-noninteractive-tabs>'
            )],
            "Missing attributes: [u'alt-with-value'], Extra attributes: []": [(
                '<oppia-noninteractive-image caption-with-value="&amp;quot;abc'
                '&amp;quot;" filepath-with-value="&amp;quot;random.png&amp;'
                'quot;"></oppia-noninteractive-image>'
            )],
            'Video id length is not 11': [(
                '<oppia-noninteractive-video autoplay-with-value="false" '
                'end-with-value="0" start-with-value="0" video_id-with-value="'
                '&amp;quot;lorem&amp;quot;"></oppia-noninteractive-video>'
            )]}

        self.assertEqual(set(actual_output.keys()), set(expected_output.keys()))
        for key in expected_output:
            self.assertEqual(set(actual_output[key]), set(expected_output[key]))

    def test_validate_customization_args_in_tag(self):
        test_cases = [{
            'html_string': (
                '<p><oppia-noninteractive-link text-with-value="&amp;quot;What '
                'is a link?&amp;quot;" url-with-value="&amp;quot;https://link'
                '.com&amp;quot;"></oppia-noninteractive-link></p>'
            ),
            'tag_name': 'oppia-noninteractive-link'
        }, {
            'html_string': (
                '<p><oppia-noninteractive-link text-with-value="&amp;quot;'
                'What is a link?&amp;quot;" url-with-value="&amp;quot;'
                'htt://link.com&amp;quot;"></oppia-noninteractive-link></p>'
            ),
            'tag_name': 'oppia-noninteractive-link'
        }, {
            'html_string': (
                '<oppia-noninteractive-image caption-with-value="&amp;quot;'
                'abc&amp;quot;" filepath-with-value="&amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image>'
            ),
            'tag_name': 'oppia-noninteractive-image'
        }]

        actual_output = []
        expected_output = [
            [],
            [(
                "Invalid URL: Sanitized URL should start with 'http://' "
                "or 'https://'; received htt://link.com"
            )],
            ['Missing attributes: [u\'alt-with-value\'], Extra attributes: []']
        ]
        for test_case in test_cases:
            html_string = test_case['html_string']
            tag_name = test_case['tag_name']
            soup = bs4.BeautifulSoup(
                html_string.encode(encoding='utf-8'), 'html.parser')
            actual_output.append(list(
                html_validation_service._validate_customization_args_in_tag( # pylint: disable=protected-access
                    soup.find(name=tag_name))))

        self.assertEqual(actual_output, expected_output)

    def test_regenerate_image_filename_using_dimensions(self):
        regenerated_name = (
            html_validation_service.regenerate_image_filename_using_dimensions(
                self.FILENAME, self.HEIGHT, self.WIDTH))
        self.assertEqual(regenerated_name, 'abc_height_45_width_45.png')
