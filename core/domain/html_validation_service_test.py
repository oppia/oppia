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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging
import os
import re

import bs4
from core.domain import fs_domain
from core.domain import html_domain
from core.domain import html_validation_service
from core.tests import test_utils
import feconf
import python_utils


class ContentMigrationTests(test_utils.GenericTestBase):
    """Tests the function associated with the migration of html
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
                tag = soup.findAll(name='i')[1]
            elif index == 1:
                tag = soup.find(name='br')
            elif index == 2:
                tag = soup.find(name='b')
            html_validation_service.wrap_with_siblings(tag, soup.new_tag('p'))
            self.assertEqual(
                python_utils.UNICODE(soup), test_case['expected_output'])

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
        }, {
            'html_content': '',
            'expected_output': ''
        }, {
            'html_content': (
                '<table><tbody><tr><td><blockquote>Test Content1</blockquote>'
                '</td></tr><tr><td><blockquote>Test Content2</blockquote></td>'
                '</tr></tbody></table>'
            ),
            'expected_output': (
                '<blockquote><p>Test Content1</p></blockquote>'
                '<blockquote><p>Test Content2</p></blockquote>'
            )
        }, {
            'html_content': (
                '<strong>Bold Text</strong><em>Italic Text</em>'
                '<hr>Horizontal Rule'
            ),
            'expected_output': (
                '<p><b>Bold Text</b><i>Italic Text</i>'
                '<br>Horizontal Rule</p>'
            )
        }, {
            'html_content': (
                '<a href=""></a><a>No href</a>'
                '<a></a>'
            ),
            'expected_output': '<p>No href</p>'
        }, {
            'html_content': (
                '<a href="somelink">Test a tag</a>'
            ),
            'expected_output': (
                '<p><oppia-noninteractive-link text-with-value="&amp;quot;Test '
                'a tag&amp;quot;" url-with-value="&amp;quot;somelink&amp;'
                'quot;"></oppia-noninteractive-link></p>'
            )
        }, {
            'html_content': (
                '<div><blockquote>Test Content1</blockquote></div>'
                '<blockquote>Test Content2</blockquote>'
            ),
            'expected_output': (
                '<blockquote>Test Content1</blockquote>'
                '<blockquote>Test Content2</blockquote>'
            )
        }, {
            'html_content': '<p><pre>Test Content</pre></p>',
            'expected_output': '<pre>Test Content</pre>'
        }, {
            'html_content': (
                '<p><ul><li>Test1</li><li>Test2</li></ul></p>'
                '<p><ul><li>Test1</li><li>Test2</li></ul></p>'
            ),
            'expected_output': (
                '<ul><li>Test1</li><li>Test2</li></ul>'
                '<ul><li>Test1</li><li>Test2</li></ul>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-link text-with-value="&amp;quot;Test '
                'a tag&amp;quot;" url-with-value="&amp;quot;somelink&amp;'
                'quot;"><b>Test1</b>'
                '</oppia-noninteractive-link>'
            ),
            'expected_output': (
                '<p><b><oppia-noninteractive-link text-with-value="&amp;quot;'
                'Test a tag&amp;quot;" url-with-value="&amp;quot;somelink&amp;'
                'quot;">Test1'
                '</oppia-noninteractive-link></b></p>'
            )
        }, {
            'html_content': (
                '<b><b>Test 1</b></b>'
            ),
            'expected_output': (
                '<p><b>Test 1</b></p>'
            )
        }, {
            'html_content': (
                '<i><i>Test 2</i></i>'

            ),
            'expected_output': (
                '<p><i>Test 2</i></p>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-link text-with-value="&amp;quot;Test a'
                ' tag&amp;quot;" url-with-value="&amp;quot;somelink&amp;quot;">'
                '<oppia-noninteractive-link text-with-value="&amp;quot;Test a'
                ' tag&amp;quot;" url-with-value="&amp;quot;somelink&amp;quot;">'
                'Test1</oppia-noninteractive-link>'
                '</oppia-noninteractive-link>'
            ),
            'expected_output': (
                '<p><oppia-noninteractive-link text-with-value="&amp;quot;Test '
                'a tag&amp;quot;" url-with-value="&amp;quot;somelink&amp;'
                'quot;">Test1</oppia-noninteractive-link></p>'
            )
        }, {
            'html_content': (
                '<b><p>Test 1</p></b>'
            ),
            'expected_output': (
                '<p>Test 1</p>'
            )
        }, {
            'html_content': (
                '<i><p>Test 2</p></i>'

            ),
            'expected_output': (
                '<p>Test 2</p>'
            )
        }, {
            'html_content': (
                '<tr><td><p>Test 1</p></td>'
                '<td><p>Test 2</p></td>'
                '<td><p>Test 3</p></td></tr>'

            ),
            'expected_output': (
                '<p>Test 1 Test 2 Test 3</p>'
            )
        }, {
            'html_content': (
                '<a href="somelink">This is a tag with '
                '<b>bold</b></a>'
            ),
            'expected_output': (
                '<p><b><oppia-noninteractive-link text-with-value="&amp;quot;'
                'This is a tag with bold&amp;quot;"'
                ' url-with-value="&amp;quot;somelink&amp;quot;">'
                '</oppia-noninteractive-link></b></p>'
            )
        }, {
            'html_content': (
                '<a href="somelink">This is a tag with '
                '<i>Italic</i></a>'
            ),
            'expected_output': (
                '<p><i><oppia-noninteractive-link text-with-value="&amp;quot;'
                'This is a tag with Italic&amp;quot;"'
                ' url-with-value="&amp;quot;somelink&amp;quot;">'
                '</oppia-noninteractive-link></i></p>'
            )
        }, {
            'html_content': (
                '<blockquote><oppia-noninteractive-collapsible '
                'content-with-value="&amp;quot;&amp;lt;pre&amp;gt;&amp;lt;'
                'p&amp;gt;lorem ipsum&amp;lt;/p&amp;gt;&amp;lt;/pre&amp;gt;'
                '&amp;quot;" heading-with-value="&amp;quot;'
                'lorem ipsum&amp;quot;lorem ipsum&amp;quot;?&amp;quot;">'
                '</oppia-noninteractive-collapsible></blockquote>'
            ),
            'expected_output': (
                '<blockquote><p><oppia-noninteractive-collapsible '
                'content-with-value="&amp;quot;&amp;lt;pre&amp;gt;&amp;lt;p'
                '&amp;gt;lorem ipsum&amp;lt;/p&amp;gt;&amp;lt;/pre&amp;gt;'
                '&amp;quot;" heading-with-value="&amp;quot;'
                'lorem ipsum&amp;quot;lorem ipsum&amp;quot;?&amp;quot;">'
                '</oppia-noninteractive-collapsible></p></blockquote>'
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
            ),
            (
                '<oppia-noninteractive-tabs tab_contents-with-value'
                '=\"[{&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;'
                '&amp;lt;i&amp;gt;lorem ipsum&amp;lt;/i&amp;gt;&amp;lt;/p'
                '&amp;gt;&amp;quot;,&amp;quot;title&amp;quot;:&amp;'
                'quot;hello&amp;quot;}]\"></oppia-noninteractive-tabs>'
            ),
            (
                '<oppia-noninteractive-collapsible '
                'heading-with-value="&amp;quot;'
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
            'invalidTags': ['i', 'b'],
            'oppia-noninteractive-image': ['b'],
            'p': ['pre'],
            'strings': [
                (
                    '<oppia-noninteractive-collapsible '
                    'heading-with-value="&amp;quot;'
                    'lorem ipsum&amp;quot;lorem ipsum&amp;quot;?&amp;quot;">'
                    '</oppia-noninteractive-collapsible>'
                ),
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
                (
                    '<oppia-noninteractive-tabs tab_contents-with-value'
                    '=\"[{&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;'
                    'gt;&amp;lt;i&amp;gt;lorem ipsum&amp;lt;/i&amp;gt;&amp;lt;'
                    '/p&amp;gt;&amp;quot;,&amp;quot;title&amp;quot;:&amp;'
                    'quot;hello&amp;quot;}]\"></oppia-noninteractive-tabs>'
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
            'Hello<div>oppia</div>testing <i>in progess</i>!',

            '<p>Hello</p><p>oppia</p><p>testing <i>in progress</i>!</p>',

            'Text with no parent tag',

            '<h1>This is not a allowed tag</h1>',
            (
                '<p><blockquote>Parent child relation not valid</blockquote>'
                '</p><b><blockquote>Parent child relation not valid'
                '</blockquote></b>'
            )
        ]

        expected_output_for_textangular = [False, True, False, True, True, True]
        err_dict = {}

        for index, test_case in enumerate(test_cases_for_textangular):
            actual_output_for_textangular = (
                html_validation_service.validate_soup_for_rte(
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
                html_validation_service.validate_soup_for_rte(
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
        }, {
            'html_content': (
                '<oppia-noninteractive-collapsible '
                'content-with-value=""></oppia-noninteractive-collapsible>'
            ),
            'expected_output': (
                '<oppia-noninteractive-collapsible content'
                '-with-value="&amp;quot;&amp;quot;" heading-with-value='
                '"&amp;quot;&amp;quot;"></oppia-noninteractive-collapsible>'
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
                '<p>Lorem <span>ipsum </span></p><p> Hello this is </p>'
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
        }, {
            'html_content': '',
            'expected_output': ''
        }, {
            'html_content': '<p><li>Test case to check li is in ul</li></p>',
            'expected_output': (
                '<ul><li>Test case to check li is in ul</li></ul>'
                )
        }, {
            'html_content': '<pre><p>Test case1</p></pre>',
            'expected_output': '<pre>Test case1</pre>'
        }, {
            'html_content': (
                '<ul><p>Test case 1</p></ul>'
                '<ol><p>Test case 2</p></ol>'
            ),
            'expected_output': (
                '<ul><li><p>Test case 1</p></li></ul>'
                '<ol><li><p>Test case 2</p></li></ol>'
            )
        }, {
            'html_content': (
                '<li>This is Some <p>Test<li> ABC</li>Content</p></li>'
            ),
            'expected_output': (
                '<p>This is Some </p><p>Test</p><ul><li> ABC</li></ul><p>'
                'Content</p>'
            )
        }, {
            'html_content': (
                '<ul><p>Test Content1</p><p>Test Content2</p><li>Test Content3'
                '</li></ul>'
            ),
            'expected_output': (
                '<ul><li><p>Test Content1</p><p>Test Content2'
                '</p></li><li>Test Content3</li></ul>'
            )
        }, {
            'html_content': (
                '<pre><p>This is a p in pre</p></pre>'
            ),
            'expected_output': (
                '<pre>This is a p in pre</pre>'
            )
        }, {
            'html_content': (
                '<ol><p>This is a p in ol</p><p> or ul</p></ol>'
            ),
            'expected_output': (
                '<ol><li><p>This is a p in ol</p><p> or ul</p></li></ol>'
            )
        }, {
            'html_content': '<ul>\n<li>Item</li>\n</ul>',
            'expected_output': '<ul><li>Item</li></ul>'
        }, {
            'html_content': '<p>Para1</p>\n<p>Para2</p>',
            'expected_output': '<p>Para1</p><p>Para2</p>'
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
            '<p><oppia-noninteractive-math math_content-with-value="'
            '{&amp;quot;raw_latex&amp;quot;:&amp;quot;abc&amp;quot;'
            ',&amp;quot;svg_filename&amp;quot;:&amp;quot;&amp;quot;}">'
            '</oppia-noninteractive-math></p>'
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
        ), (
            '<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;'
            'title&amp;quot;:&amp;quot;Hint introduction&amp;quot;,&amp;quot;'
            'content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;&amp;lt;'
            'oppia-noninteractive-link url-with-value=\\&amp;quot;&amp;amp;amp;'
            'quot;https://www.oppia.org&amp;amp;amp;quot;\\&amp;quot;&amp;gt;'
            '&amp;lt;/oppia-noninteractive-link&amp;gt;&amp;lt;/p&amp;gt;&amp;'
            'quot;}]"></oppia-noninteractive-tabs>'
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
            'Missing attributes: text-with-value, Extra attributes: ':
            [(
                '<oppia-noninteractive-collapsible content-with-value'
                '="&amp;quot;&amp;lt;p&amp;gt;&amp;lt;oppia-noninteractive-'
                'link url-with-value=\\&amp;quot;&amp;amp;amp;quot;https://'
                'www.example.com&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp;lt;'
                '/oppia-noninteractive-link&amp;gt;&amp;lt;/p&amp;gt;&amp;'
                'quot;" heading-with-value="&amp;quot;Hello&amp;quot;">'
                '</oppia-noninteractive-collapsible>'
            ), (
                '<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;'
                'quot;title&amp;quot;:&amp;quot;Hint introduction&amp;quot;,'
                '&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;&amp;'
                'lt;oppia-noninteractive-link url-with-value=\\&amp;quot;&amp;'
                'amp;amp;quot;https://www.oppia.org&amp;amp;amp;quot;\\&amp;'
                'quot;&amp;gt;&amp;lt;/oppia-noninteractive-link&amp;gt;&amp;'
                'lt;/p&amp;gt;&amp;quot;}]"></oppia-noninteractive-tabs>'
            )],
            'Expected bool, received hello': [(
                '<oppia-noninteractive-video autoplay-with-value="&amp;quot;'
                'hello&amp;quot;" end-with-value="0" start-with-value="0" '
                'video_id-with-value="&amp;quot;loremipsum&amp;quot;">'
                '</oppia-noninteractive-video>'
            )],
            (
                u'Invalid URL: Sanitized URL should start with \'http://\' or '
                '\'https://\'; received htt://link.com'
            ): [(
                '<p><oppia-noninteractive-link text-with-value="&amp;quot;'
                'What is a link?&amp;quot;" url-with-value="&amp;quot;htt://'
                'link.com&amp;quot;"></oppia-noninteractive-link></p>'
            )],
            (
                'Missing attributes: video_id-with-value, '
                'Extra attributes: '
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
            'Missing keys: [u\'title\'], Extra keys: [u\'url\']': [(
                '<oppia-noninteractive-tabs tab_contents-with-value="'
                '[{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;'
                'gt;lorem ipsum&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;url'
                '&amp;quot;: &amp;quot;hello&amp;quot;}, {&amp;quot;'
                'content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;oppia'
                '&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;: '
                '&amp;quot;Savjet 1&amp;quot;}]"></oppia-noninteractive-tabs>'
            )],
            'invalid literal for int() with base 10: \'Hello\'': [(
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
            'Missing attributes: alt-with-value, Extra attributes: ':
            [(
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
        }, {
            'html_string': (
                '<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;'
                'quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;lorem'
                'ipsum&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;: '
                '&amp;quot;hello&amp;quot;}, [1,2,3]]">'
                '</oppia-noninteractive-tabs>'
            ),
            'tag_name': 'oppia-noninteractive-tabs'
        }]

        actual_output = []
        expected_output = [
            [],
            [(
                'Invalid URL: Sanitized URL should start with \'http://\' '
                'or \'https://\'; received htt://link.com'
            )],
            ['Missing attributes: alt-with-value, Extra attributes: '],
            [u'Expected dict, received [1, 2, 3]']
        ]
        for test_case in test_cases:
            html_string = test_case['html_string']
            tag_name = test_case['tag_name']
            soup = bs4.BeautifulSoup(
                html_string.encode(encoding='utf-8'), 'html.parser')
            actual_output.append(list(
                html_validation_service.validate_customization_args_in_tag(
                    soup.find(name=tag_name))))

        self.assertEqual(actual_output, expected_output)

    def test_add_dimensions_to_image_tags(self):
        test_cases = [{
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'abc1.png&amp;quot;"></oppia-noninteractive-image>Hello this'
                ' is test case to check that dimensions are added to the oppia'
                ' noninteractive image tags.</p>'
            ),
            'expected_output': (
                u'<p><oppia-noninteractive-image filepath-with-value='
                '"&amp;quot;abc1_height_32_width_32.png&amp;'
                'quot;"></oppia-noninteractive-image>Hello this is test case'
                ' to check that dimensions are added to the oppia '
                'noninteractive image tags.</p>'
            )
        }, {
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'abc2.png&amp;quot;"></oppia-noninteractive-image>Hello this'
                ' is test case to check that dimensions are added to the oppia'
                ' noninteractive image tags.<oppia-noninteractive-image '
                'filepath-with-value="&amp;quot;abc3.png&amp;quot;">'
                '</oppia-noninteractive-image></p>'
            ),
            'expected_output': (
                u'<p><oppia-noninteractive-image filepath-with-value="'
                '&amp;quot;abc2_height_32_width_32.png&amp;quot;">'
                '</oppia-noninteractive-image>Hello this is test case '
                'to check that dimensions are added to the oppia'
                ' noninteractive image tags.<oppia-noninteractive-image '
                'filepath-with-value="&amp;quot;abc3_height_32_width_32.png'
                '&amp;quot;"></oppia-noninteractive-image></p>'
            )
        }, {
            'html_content': (
                '<p>Hey this is a test case with no images.</p>'
            ),
            'expected_output': (
                u'<p>Hey this is a test case with no images.</p>'
            )
        }, {
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'does_not_exist.png&amp;quot;"></oppia-noninteractive-image>'
                'Hello this is test case to check that default dimensions '
                '(120, 120) are added in case the image does not exist.</p>'
            ),
            'expected_output': (
                u'<p><oppia-noninteractive-image filepath-with-value="&amp;'
                'quot;does_not_exist_height_120_width_120.png&amp;quot;">'
                '</oppia-noninteractive-image>Hello this is test case'
                ' to check that default dimensions (120, 120) '
                'are added in case the image does not exist.</p>'
            )
        }, {
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'does_not_exist.png&amp;quot;"></oppia-noninteractive-image>'
                'Hello this is test case to check that default dimensions '
                '(120, 120) are added in case the image does not exist.</p>'
            ),
            'expected_output': (
                u'<p><oppia-noninteractive-image filepath-with-value="&amp;'
                'quot;does_not_exist_height_120_width_120.png&amp;quot;">'
                '</oppia-noninteractive-image>Hello this is test case'
                ' to check that default dimensions (120, 120) '
                'are added in case the image does not exist.</p>'
            )
        }]

        exp_id = 'eid'

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, exp_id))
        fs.commit('image/abc1.png', raw_image, mimetype='image/png')
        fs.commit('image/abc2.png', raw_image, mimetype='image/png')
        fs.commit('image/abc3.png', raw_image, mimetype='image/png')

        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.add_dimensions_to_image_tags(
                    exp_id, test_case['html_content']),
                test_case['expected_output'])

    def test_add_dimensions_to_image_tags_with_invalid_filepath_with_value(
            self):

        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        assert_raises_context_manager = self.assertRaisesRegexp(
            Exception, 'No JSON object could be decoded')

        html_content = (
            '<p><oppia-noninteractive-image filepath-with-value="abc1.png">'
            '</oppia-noninteractive-image>Hello this is test case to check that'
            ' dimensions are added to the oppia noninteractive image tags.</p>'
        )

        exp_id = 'exp_id'

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, exp_id))
        fs.commit('image/abc1.png', raw_image, mimetype='image/png')

        with assert_raises_context_manager, logging_swap:
            html_validation_service.add_dimensions_to_image_tags(
                exp_id, html_content)

        self.assertEqual(len(observed_log_messages), 1)
        self.assertEqual(
            observed_log_messages[0],
            'Exploration exp_id failed to load image: abc1.png')

    def test_add_dimensions_to_image_tags_when_no_filepath_specified(self):
        test_cases = [{
            'html_content': (
                '<oppia-noninteractive-image caption-with-value="&amp;quot;'
                '&amp;quot;" filepath-with-value="">'
                '</oppia-noninteractive-image>'
                '<p>Some text.</p><p>Some more text.</p><p>Yet more text.</p>'
            ),
            'expected_output': (
                '<p>Some text.</p><p>Some more text.</p><p>Yet more text.</p>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-image caption-with-value="&amp;quot;'
                '&amp;quot;">'
                '</oppia-noninteractive-image>'
                '<p>There is no filepath attr in the above tag.</p>'
            ),
            'expected_output': (
                '<p>There is no filepath attr in the above tag.</p>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-image caption-with-value="&amp;quot;'
                '&amp;quot;" filepath-with-value="">'
                '</oppia-noninteractive-image>'
                '<p>Some text.</p><p>Some more text.</p><p>Yet more text.</p>'
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'img.png&amp;quot;"></oppia-noninteractive-image>Hello this'
                ' is test case to check that dimensions are added to the oppia'
                ' noninteractive image tags.<oppia-noninteractive-image '
                'filepath-with-value="&amp;quot;abc3.png&amp;quot;">'
                '</oppia-noninteractive-image></p>'
            ),
            'expected_output': (
                u'<p>Some text.</p><p>Some more text.</p><p>Yet more text.</p>'
                '<p><oppia-noninteractive-image filepath-with-value="'
                '&amp;quot;img_height_32_width_32.png&amp;quot;">'
                '</oppia-noninteractive-image>Hello this is test case '
                'to check that dimensions are added to the oppia'
                ' noninteractive image tags.<oppia-noninteractive-image '
                'filepath-with-value="&amp;quot;abc3_height_32_width_32.png'
                '&amp;quot;"></oppia-noninteractive-image></p>'
            )
        }]

        exp_id = 'eid'

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, exp_id))
        fs.commit('image/img.png', raw_image, mimetype='image/png')
        fs.commit('image/abc3.png', raw_image, mimetype='image/png')

        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.add_dimensions_to_image_tags(
                    exp_id, test_case['html_content']),
                test_case['expected_output'])

    def test_regenerate_image_filename_using_dimensions(self):
        regenerated_name = (
            html_validation_service.regenerate_image_filename_using_dimensions(
                'abc.png', 45, 45))
        self.assertEqual(regenerated_name, 'abc_height_45_width_45.png')

    def test_svg_string_validation(self):
        # A Valid SVG string.
        valid_svg_string = (
            '<svg version="1.0" xmlns="http://www.w3.org/2000/svg"  width="'
            '100pt" height="100pt" viewBox="0 0 100 100"><g><path d="M5455 '
            '2632 9z"/> </g> </svg>')
        self.assertEqual(
            html_validation_service.get_invalid_svg_tags_and_attrs(
                valid_svg_string), ([], []))

        # A Valid SVG string with unicode characters.
        valid_svg_string_with_unicode = (
            '<svg version="1.0" xmlns="http://www.w3.org/2000/svg"  width="'
            '100pt" height="100pt" viewBox="0 0 100 100"><g><path d="M5455 '
            '2632 9z"/></g><text transform="matrix(1 0 0 -1 0 0)" font-size'
            '="884px" font-family="serif">Ì</text></svg>')
        self.assertEqual(
            html_validation_service.get_invalid_svg_tags_and_attrs(
                valid_svg_string_with_unicode), ([], []))

        # SVG containing an invalid tag.
        invalid_svg_string = '<svg><testtag /></svg>'
        self.assertEqual(
            html_validation_service.get_invalid_svg_tags_and_attrs(
                invalid_svg_string), (['testtag'], []))
        # SVG containing an invalid attribute for a valid tag.
        invalid_svg_string = '<svg><path d="M5455" danger="h4cK3D!" /></svg>'
        self.assertEqual(
            html_validation_service.get_invalid_svg_tags_and_attrs(
                invalid_svg_string), ([], ['path:danger']))
        # SVG containing an invalid attribute in an invalid tag.
        invalid_svg_string = '<svg><hack d="M5 1z" danger="XYZ!"></svg>'
        self.assertEqual(
            html_validation_service.get_invalid_svg_tags_and_attrs(
                invalid_svg_string), (['hack'], []))
        # SVG containing a valid tag masquerading as an attribute.
        invalid_svg_string = '<svg><g fill="#FFFFFF" path="YZ!" /></svg>'
        self.assertEqual(
            html_validation_service.get_invalid_svg_tags_and_attrs(
                invalid_svg_string), ([], ['g:path']))
        # SVG containing a invalid attribute for the parent tag but valid for
        # a different tag.
        invalid_svg_string = '<svg><path d="M5455" keytimes="h4cK3D!"></svg>'
        self.assertEqual(
            html_validation_service.get_invalid_svg_tags_and_attrs(
                invalid_svg_string), ([], ['path:keytimes']))

    def test_add_math_content_to_math_rte_components(self):
        test_cases = [{
            'html_content': (
                '<p>Feedback</p><oppia-noninteractive-math raw_latex-with-valu'
                'e="&amp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>'
            ),
            'expected_output': (
                '<p>Feedback</p><oppia-noninteractive-math math_content-with-v'
                'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
                '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;&amp'
                ';quot;}"></oppia-noninteractive-math>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;+,'
                '+,+,+&amp;quot;"></oppia-noninteractive-math>'
            ),
            'expected_output': (
                '<oppia-noninteractive-math math_content-with-value="{&amp;'
                'quot;raw_latex&amp;quot;: &amp;quot;+,+,+,+&amp;quot;, &amp;'
                'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
                '-noninteractive-math>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;'
                '(x - a_1)(x - a_2)(x - a_3)...(x - a_n)&amp;quot;"></oppia-'
                'noninteractive-math>'
            ),
            'expected_output': (
                '<oppia-noninteractive-math math_content-with-value="{&amp;q'
                'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
                '_3)...(x - a_n)&amp;quot;, &amp;quot;svg_filename&amp;quot;'
                ': &amp;quot;&amp;quot;}"></oppia-noninteractive-math>'
            )
        }, {
            'html_content': '<p> This is a normal tag </p>',
            'expected_output': '<p> This is a normal tag </p>'
        }, {
            'html_content': (
                '<oppia-noninteractive-math math_content-with-value="{&amp;qu'
                'ot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a_3)'
                '...(x - a_n)&amp;quot;, &amp;quot;svg_filename&amp;quot;'
                ': &amp;quot;&amp;quot;}"></oppia-noninteractive-math>'
            ),
            'expected_output': (
                '<oppia-noninteractive-math math_content-with-value="{&amp;q'
                'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
                '_3)...(x - a_n)&amp;quot;, &amp;quot;svg_filename&amp;quot;'
                ': &amp;quot;&amp;quot;}"></oppia-noninteractive-math>'
            )
        }]

        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.add_math_content_to_math_rte_components(
                    test_case['html_content']),
                test_case['expected_output'])
        invalid_cases = [{
            'html_content': (
                '<p>Feedback</p><oppia-noninteractive-math></oppia-nonintera'
                'ctive-math>')
        }, {
            'html_content': (
                '<p>Feedback</p><oppia-noninteractive-math raw_latex-with-valu'
                'e="++--"></oppia-noninteractive-math>'
            )
        }]
        with self.assertRaisesRegexp(
            Exception, 'Invalid math tag with no proper attribute found'):
            html_validation_service.add_math_content_to_math_rte_components(
                invalid_cases[0]['html_content'])

        with self.assertRaisesRegexp(
            Exception, 'Invalid raw_latex string found in the math tag'):
            html_validation_service.add_math_content_to_math_rte_components(
                invalid_cases[1]['html_content'])

    def test_validate_math_tags_in_html(self):
        """Test that the validate_math_tags_in_html method validates an
        HTML string and returns all the invalid tags.
        """
        html_string = (
            '<p>Feedback</p><oppia-noninteractive-math raw_latex-with-valu'
            'e="+,-,-,+"></oppia-noninteractive-math><p>Feedback</p><oppia-n'
            'oninteractive-math></oppia-noninteractive-math><p>Feedback</p><'
            'oppia-noninteractive-math invalid_tag-with-value="&amp;quot;+,-'
            ',-,+&amp;quot;"></oppia-noninteractive-math><p>Feedback</p><opp'
            'ia-noninteractive-math raw_latex-with-value="&amp;quot;+,-,-,+&'
            'amp;quot;"></oppia-noninteractive-math><p>Feedback</p><oppia-no'
            'ninteractive-math raw_latex-with-value="&amp;quot;+,-,-,+&amp;q'
            'uot;"></oppia-noninteractive-math>'
        )
        expected_invalid_tags = [(
            '<oppia-noninteractive-math raw_latex-with-value="+,-,-,+"></op'
            'pia-noninteractive-math>'
        ), (
            '<oppia-noninteractive-math></oppia-noninteractive-math>'
        ), (
            '<oppia-noninteractive-math invalid_tag-with-value="&amp;quot;+'
            ',-,-,+&amp;quot;"></oppia-noninteractive-math>'
        ), (
            '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;+,-'
            ',-,+&amp;quot;"></oppia-noninteractive-math>'
        )]
        invalid_tags = (
            html_validation_service.validate_math_tags_in_html(html_string))

        for index, invalid_tag in enumerate(invalid_tags):
            self.assertEqual(
                python_utils.UNICODE(invalid_tag), expected_invalid_tags[index])

    def test_validate_math_tags_in_html_with_attribute_math_content(self):
        """Test that the validate_math_tags_in_html_with_attribute_math_content
        method validates an HTML string and returns all the invalid tags.
        """
        html_string = (
            '<p>Feedback</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;&amp'
            ';quot;}"></oppia-noninteractive-math>'
            '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;+,'
            '+,+,+&amp;quot;"></oppia-noninteractive-math>'
            '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;'
            '(x - a_1)(x - a_2)(x - a_3)...(x - a_n)&amp;quot;"></oppia-'
            'noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n)&amp;quot;, &amp;quot;svg_filename&amp;quot;'
            ': &amp;quot;&amp;quot;}"></oppia-noninteractive-math>'
            '<oppia-noninteractive-math></oppia-noninteractive-math>'
            '<p>this is a normal tag</p>'
            '<oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;}"></oppia-noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{'
            'raw_latex: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n)&amp;quot;, &amp;quot;svg_filename&amp;quot;'
            ': &amp;quot;&amp;quot;}"></oppia-noninteractive-math>'
            )

        expected_invalid_tags = [(
            '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;'
            '(x - a_1)(x - a_2)(x - a_3)...(x - a_n)&amp;quot;"></oppia-'
            'noninteractive-math>'
        ), (
            '<oppia-noninteractive-math></oppia-noninteractive-math>'
        ), (
            '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;+,'
            '+,+,+&amp;quot;"></oppia-noninteractive-math>'
        ), (
            '<oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;}"></oppia-noninteractive-math>'
        ), (
            '<oppia-noninteractive-math math_content-with-value="{'
            'raw_latex: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n)&amp;quot;, &amp;quot;svg_filename&amp;quot;'
            ': &amp;quot;&amp;quot;}"></oppia-noninteractive-math>'
        )]
        invalid_tags = (
            html_validation_service.
            validate_math_tags_in_html_with_attribute_math_content(
                html_string))

        self.assertEqual(len(invalid_tags), 5)
        for invalid_tag in invalid_tags:
            self.assertTrue(
                python_utils.UNICODE(invalid_tag) in expected_invalid_tags)

    def test_extract_latex_strings_when_all_math_tags_have_empty_svg_filename(
            self):
        """Test that get_latex_strings_without_svg_from_html
        extracts filenames when all math tags have empty filename field.
        """
        html_string = (
            '<p>Feedback</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;&amp'
            ';quot;}"></oppia-noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;+,+,+,+&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n)&amp;quot;, &amp;quot;svg_filename&amp;quot;'
            ': &amp;quot;&amp;quot;}"></oppia-noninteractive-math>')

        expected_list_of_latex_strings = [
            '+,-,-,+', '+,+,+,+', '(x - a_1)(x - a_2)(x - a_3)...(x - a_n)']
        expected_list_of_encoded_latex_strings = [
            string.encode(encoding='utf-8') for string in (
                expected_list_of_latex_strings)]

        list_of_latex_string = (
            html_validation_service.
            get_latex_strings_without_svg_from_html(
                html_string))
        self.assertEqual(
            sorted(list_of_latex_string),
            sorted(expected_list_of_encoded_latex_strings))

    def test_extract_latex_strings_when_latex_strings_have_unicode_characters(
            self):
        """Test that get_latex_strings_without_svg_from_html
        extracts filenames when LaTeX strings have unicode characters.
        """
        html_string = (
            '<p>Feedback</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;\u03A7\u03A6'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;&amp'
            ';quot;}"></oppia-noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;ÀÁÂÃÄÅÆÇÈ&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n)&amp;quot;, &amp;quot;svg_filename&amp;quot;'
            ': &amp;quot;&amp;quot;}"></oppia-noninteractive-math>')

        expected_list_of_latex_strings = [
            'ÀÁÂÃÄÅÆÇÈ', '\u03A7\u03A6',
            '(x - a_1)(x - a_2)(x - a_3)...(x - a_n)']
        expected_list_of_encoded_latex_strings = [
            string.encode(encoding='utf-8') for string in (
                expected_list_of_latex_strings)]
        list_of_latex_string = (
            html_validation_service.
            get_latex_strings_without_svg_from_html(
                html_string))
        self.assertEqual(
            sorted(list_of_latex_string),
            sorted(expected_list_of_encoded_latex_strings))

    def test_extract_latex_strings_when_math_tags_have_non_empty_svg_filename(
            self):
        """Test that get_latex_strings_without_svg_from_html
        extracts filenames when some math tags have non empty filename field.
        """

        html_string = (
            '<p>Feedback</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;\\\\frac{x}{y}'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;&amp'
            ';quot;}"></oppia-noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;+,+,+,+(x^2)&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;abc.svg&amp;quot;}"></oppia'
            '-noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;\\\\sqrt{x}&amp;quot;, &am'
            'p;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></opp'
            'ia-noninteractive-math>')

        # Here '+,+,+,+(x^2)' won't be extracted because the corresponding
        # math tag has a non-empty svg_filename field.
        expected_list_of_latex_strings = ['\\sqrt{x}', '\\frac{x}{y}']
        expected_list_of_encoded_latex_strings = [
            string.encode(encoding='utf-8') for string in (
                expected_list_of_latex_strings)]
        list_of_latex_string = (
            html_validation_service.
            get_latex_strings_without_svg_from_html(
                html_string))
        self.assertEqual(
            sorted(list_of_latex_string),
            sorted(expected_list_of_encoded_latex_strings))

    def test_extract_latex_strings_when_no_math_tags_are_present(self):
        """Test that get_latex_strings_without_svg_from_html
        when there are no math tags present in the HTML.
        """
        html_string_with_no_math = (
            '<p><oppia-noninteractive-image filepath-with-value="abc1.png">'
            '</oppia-noninteractive-image>Hello this is test case to check that'
            ' dimensions are added to the oppia noninteractive image tags.</p>'
        )
        self.assertEqual(
            html_validation_service.
            get_latex_strings_without_svg_from_html(
                html_string_with_no_math), [])

    def test_extract_svg_filenames_in_math_rte_components(self):
        """Test that the extract_svg_filenames_in_math_rte_components
        method extracts all the filenames from math rich-text components in
        html.
        """
        html_string_with_filename_having_filename = (
            '<p>Feedback</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img.svg&amp;quot;}"></oppia-noninteractive-math>'
        )

        self.assertEqual(
            html_validation_service.
            extract_svg_filenames_in_math_rte_components(
                html_string_with_filename_having_filename), ['img.svg'])

        html_string_with_no_filename = (
            '<p>Feedback</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';&amp;quot;}"></oppia-noninteractive-math>'
        )
        self.assertEqual(
            html_validation_service.
            extract_svg_filenames_in_math_rte_components(
                html_string_with_no_filename), [])

    def test_validate_svg_filenames_when_all_filenames_are_valid(self):
        """Test the validate_svg_filenames_in_math_rich_text when valid
        filenames are present for each math rich-text components in html.
        """
        html_string_with_filename_having_filename = (
            '<p>Feedback1</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img1.svg&amp;quot;}"></oppia-noninteractive-math>'
            '<p>Feedback2</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img2.svg&amp;quot;}"></oppia-noninteractive-math>'
        )
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id1'))
        fs.commit('image/img1.svg', raw_image, mimetype='image/svg+xml')
        fs.commit('image/img2.svg', raw_image, mimetype='image/svg+xml')
        self.assertEqual(
            html_validation_service.validate_svg_filenames_in_math_rich_text(
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id1',
                html_string_with_filename_having_filename), [])


    def test_validate_svg_filenames_when_filenames_are_invalid(self):
        """Test the validate_svg_filenames_in_math_rich_text when
        filenames are present but invalid.
        """
        html_string_with_filename_having_filename = (
            '<p>Feedback1</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img1.svg&amp;quot;}"></oppia-noninteractive-math>'
            '<p>Feedback2</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img2.svg&amp;quot;}"></oppia-noninteractive-math>'
        )
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id1'))
        fs.commit('image/img1.svg', raw_image, mimetype='image/svg+xml')
        self.assertEqual(
            html_validation_service.validate_svg_filenames_in_math_rich_text(
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id1',
                html_string_with_filename_having_filename),
            [(
                '<oppia-noninteractive-math math_content-with-value="{&'
                'amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;qu'
                'ot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;img2.'
                'svg&amp;quot;}"></oppia-noninteractive-math>')])


    def test_validate_svg_filenames_when_filenames_are_not_present(self):
        """Test the validate_svg_filenames_in_math_rich_text when
        filenames are not present.
        """
        html_string_with_filename_having_filename = (
            '<p>Feedback1</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img1.svg&amp;quot;}"></oppia-noninteractive-math>'
            '<p>Feedback2</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';&amp;quot;}"></oppia-noninteractive-math>'
        )
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id1'))
        fs.commit('image/img1.svg', raw_image, mimetype='image/svg+xml')
        self.assertEqual(
            html_validation_service.validate_svg_filenames_in_math_rich_text(
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id1',
                html_string_with_filename_having_filename),
            [(
                '<oppia-noninteractive-math math_content-with-value="{&'
                'amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;qu'
                'ot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;'
                '&amp;quot;}"></oppia-noninteractive-math>')])

    def test_generate_math_svgs_filename(self):
        """Test that the generate_math_svgs_filename method generates the
        filenames in the expected pattern.
        """
        filename_pattern_regex = (
            r'mathImg_[0-9]+_\S{10}_height_[0-9d]+_width_[0-9d]+_vertical_[0-9d'
            ']+.svg')
        filenames = []

        filenames.append(
            html_validation_service.generate_math_svgs_filename(
                html_domain.LatexStringSvgImageDimensions(
                    '4d123', '2d145', '0d124')))
        filenames.append(
            html_validation_service.generate_math_svgs_filename(
                html_domain.LatexStringSvgImageDimensions(
                    '4d123', '2d145', '0')))
        filenames.append(
            html_validation_service.generate_math_svgs_filename(
                html_domain.LatexStringSvgImageDimensions(
                    '43d12', '12d14', '0d124')))

        for filename in filenames:
            self.assertTrue(re.match(filename_pattern_regex, filename))

    def test_add_svg_filenames_for_latex_strings_in_html_string(self):
        """Test that the add_svg_filenames_for_latex_strings_in_html_string
        method adds a filename if empty for each math rich-text component.
        """
        html_string = (
            '<p>Feedback</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;&amp'
            ';quot;}"></oppia-noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;+,+,+,+&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)&amp;qu'
            'ot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}'
            '"></oppia-noninteractive-math>')

        latex_string_svg_image_data1 = (
            html_domain.LatexStringSvgImageData(
                '', html_domain.LatexStringSvgImageDimensions(
                    '1d345', '3d124', '0d124')))
        latex_string_svg_image_data2 = (
            html_domain.LatexStringSvgImageData(
                '', html_domain.LatexStringSvgImageDimensions(
                    '2d456', '6d124', '0d231')))
        latex_string_svg_image_data3 = (
            html_domain.LatexStringSvgImageData(
                '', html_domain.LatexStringSvgImageDimensions(
                    '4d123', '23d122', '2d123')))

        raw_latex_to_image_data_dict = {
            '+,-,-,+': latex_string_svg_image_data1,
            '+,+,+,+': latex_string_svg_image_data2,
            '(x - a_1)(x - a_2)': latex_string_svg_image_data3
        }
        converted_html_string = (
            html_validation_service.
            add_svg_filenames_for_latex_strings_in_html_string(
                raw_latex_to_image_data_dict, html_string))
        filenames = (
            html_validation_service.
            extract_svg_filenames_in_math_rte_components(converted_html_string))
        self.assertEqual(len(filenames), 3)
        filename_pattern_regex = (
            r'mathImg_[0-9]+_\S{10}_height_[0-9d]+_width_[0-9d]+_vertical_[0-9d'
            ']+.svg')
        for filename in filenames:
            self.assertTrue(re.match(filename_pattern_regex, filename))

    def test_extract_svg_filename_latex_mapping_in_math_rte_components(self):
        """Test that extract_svg_filename_latex_mapping_in_math_rte_components
        returns all the raw_latex to svg_filename mappings in the HTML.
        """
        html_string = (
            '<p>Feedback</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;mathIm'
            'g_20207261338jhi1j6rvob_height_1d345_width_3d124_vertical_0d124'
            '.svg&amp;quot;}"></oppia-noninteractive-math><oppia-noninteract'
            'ive-math math_content-with-value="{&amp;quot;raw_latex&amp;quot;'
            ': &amp;quot;+,+,+,+&amp;quot;, &amp;quot;svg_filename&amp;quot;:'
            ' &amp;quot;mathImg_20207261338r3ir43lmfd_height_2d456_width_6d124'
            '_vertical_0d231.svg&amp;quot;}"></oppia-noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)&amp;qu'
            'ot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;mathImg_20207'
            '261338imzlvnf23a_height_4d123_width_23d122_vertical_2d123.svg&a'
            'mp;quot;}"></oppia-noninteractive-math>'
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)&amp;qu'
            'ot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;mathImg_20207'
            '261338imzlvnf23a_height_4d123_width_23d122_vertical_2d123.svg&a'
            'mp;quot;}"></oppia-noninteractive-math>')

        filename1 = (
            'mathImg_20207261338jhi1j6rvob_height_1d345_width_3d124_vertical_0'
            'd124.svg')
        filename2 = (
            'mathImg_20207261338r3ir43lmfd_height_2d456_width_6d124_vertical_0'
            'd231.svg')
        filename3 = (
            'mathImg_20207261338imzlvnf23a_height_4d123_width_23d122_vertical_'
            '2d123.svg')
        expected_output = [
            (filename1, '+,-,-,+'), (filename2, '+,+,+,+'),
            (filename3, '(x - a_1)(x - a_2)')]

        self.assertEqual(
            sorted(
                html_validation_service.
                extract_svg_filename_latex_mapping_in_math_rte_components(
                    html_string)), sorted(expected_output))

    def test_check_for_math_component_in_html(self):
        """Test that the check_for_math_component_in_html method checks for
         math-tags in an HTML string and returns a boolean.
        """
        test_cases = [{
            'html_content': (
                '<p>Feedback</p><oppia-noninteractive-math raw_latex-with-valu'
                'e="&amp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>'
            ),
            'expected_output': True
        }, {
            'html_content': (
                '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;+,'
                '+,+,+&amp;quot;"></oppia-noninteractive-math>'
            ),
            'expected_output': True
        }, {
            'html_content': (
                '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;'
                '(x - a_1)(x - a_2)(x - a_3)...(x - a_n)&amp;quot;"></oppia-'
                'noninteractive-math>'
            ),
            'expected_output': True
        }, {
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="abc1.png">'
                '</oppia-noninteractive-image>Hello this is test case to check'
                ' that dimensions are added to the oppia noninteractive image '
                'tags.</p>'
            ),
            'expected_output': False
        }]

        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.check_for_math_component_in_html(
                    test_case['html_content']),
                test_case['expected_output'])

    def test_parsable_as_xml(self):
        invalid_xml = 'aDRjSzNS'
        self.assertEqual(
            html_validation_service.is_parsable_as_xml(invalid_xml),
            False)
        invalid_xml = '123'
        self.assertEqual(
            html_validation_service.is_parsable_as_xml(invalid_xml),
            False)
        invalid_xml = False
        self.assertEqual(
            html_validation_service.is_parsable_as_xml(invalid_xml),
            False)
        valid_xml = '<svg><path d="0" /></svg>'
        self.assertEqual(
            html_validation_service.is_parsable_as_xml(valid_xml),
            True)
