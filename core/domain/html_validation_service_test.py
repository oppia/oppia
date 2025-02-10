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

from __future__ import annotations

import os
import re

from core import feconf
from core import utils
from core.domain import fs_services
from core.domain import html_validation_service
from core.tests import test_utils

import bs4

from typing import Dict, List, TypedDict


class SvgDiagramTestCaseDict(TypedDict):
    """Dict representing the test case SVG content Dictionary."""

    html_content: str
    expected_output: bool


class ContentMigrationTests(test_utils.GenericTestBase):
    """Tests the function associated with the migration of html
    strings to valid RTE format.
    """

    def test_wrap_with_siblings(self) -> None:
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

    def test_validate_rte_format(self) -> None:
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

        actual_output_for_ckeditor = (
            html_validation_service.validate_rte_format(
                test_cases_for_ckeditor, feconf.RTE_FORMAT_CKEDITOR))

        expected_output_for_ckeditor = {
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

        self.assertItemsEqual(
            actual_output_for_ckeditor, expected_output_for_ckeditor)

    def test_validate_soup_for_rte(self) -> None:
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
        err_dict: Dict[str, List[str]] = {}

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

    def test_validate_customization_args(self) -> None:
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
            ',&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_202'
            '07261338_r3ir43lmfd_height_2d456_width_6d124_vertical_0'
            'd231.svg&amp;quot;}"></oppia-noninteractive-math></p>'
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
                'Invalid URL: Sanitized URL should start with \'http://\' or '
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
            'Missing keys: [\'title\'], Extra keys: [\'url\']': [(
                '<oppia-noninteractive-tabs tab_contents-with-value="'
                '[{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;'
                'gt;lorem ipsum&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;url'
                '&amp;quot;: &amp;quot;hello&amp;quot;}, {&amp;quot;'
                'content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;oppia'
                '&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;title&amp;quot;: '
                '&amp;quot;Savjet 1&amp;quot;}]"></oppia-noninteractive-tabs>'
            )],
            'Could not convert str to int: Hello': [(
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
        for key, expected in expected_output.items():
            self.assertEqual(set(actual_output[key]), set(expected))

    def test_validate_customization_args_in_tag(self) -> None:
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
            ['Expected dict, received [1, 2, 3]']
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

    def test_svg_string_validation(self) -> None:
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

    def test_svg_tag_without_xmlns_attribute(self) -> None:
        # A valid SVG string with xmlns_attribute.
        valid_svg_string = (
            '<svg version="1.0" xmlns="http://www.w3.org/2000/svg"  width="'
            '100pt" height="100pt" viewBox="0 0 100 100"><g><path d="M5455 '
            '2632 9z"/></g><text transform="matrix(1 0 0 -1 0 0)" font-size'
            '="884px" font-family="serif">Ì</text></svg>')

        self.assertTrue(
            html_validation_service.does_svg_tag_contains_xmlns_attribute(
                valid_svg_string))

        # An invalid SVG string without xmlns attribute.
        invalid_svg_string = (
            '<svg version="1.0" width="100pt" height="100pt" '
            'viewBox="0 0 100 100"><g><path d="M5455 '
            '2632 9z"/></g><text transform="matrix(1 0 0 -1 0 0)" font-size'
            '="884px" font-family="serif">Ì</text></svg>')

        self.assertFalse(
            html_validation_service.does_svg_tag_contains_xmlns_attribute(
                invalid_svg_string))

    def test_add_math_content_to_math_rte_components(self) -> None:
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
        }, {
            # The empty math tag here just gets deleted.
            'html_content': (
                '<p>Feedback</p><oppia-noninteractive-math></oppia-nonintera'
                'ctive-math>'),
            'expected_output': '<p>Feedback</p>'
        }, {
            # If the raw_latex field is empty, the entire math tag gets
            # deleted.
            'html_content': (
                '<oppia-noninteractive-math raw_latex-with-value="">'
                '</oppia-noninteractive-math>blahblah'
            ),
            'expected_output': 'blahblah'
        }]

        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.add_math_content_to_math_rte_components(
                    test_case['html_content']),
                test_case['expected_output'])

        invalid_cases = [{
            'html_content': (
                '<p>Feedback</p><oppia-noninteractive-math raw_latex-with-valu'
                'e="++--"></oppia-noninteractive-math>'
            )
        }]
        with self.assertRaisesRegex(
            Exception, re.escape('Expecting value: line 1 column 1 (char 0)')
        ):
            html_validation_service.add_math_content_to_math_rte_components(
                invalid_cases[0]['html_content'])

    def test_validate_math_tags_in_html(self) -> None:
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
            self.assertEqual(str(invalid_tag), expected_invalid_tags[index])

    def test_validate_math_tags_in_html_with_attribute_math_content(
        self
    ) -> None:
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
            self.assertIn(str(invalid_tag), expected_invalid_tags)

    def test_extract_svg_filenames_in_math_rte_components(self) -> None:
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

    def test_validate_svg_filenames_when_all_filenames_are_valid(self) -> None:
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
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id1')
        fs.commit('image/img1.svg', raw_image, mimetype='image/svg+xml')
        fs.commit('image/img2.svg', raw_image, mimetype='image/svg+xml')
        self.assertEqual(
            html_validation_service.validate_svg_filenames_in_math_rich_text(
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id1',
                html_string_with_filename_having_filename), [])

    def test_validate_svg_filenames_when_filenames_are_invalid(self) -> None:
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
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id1')
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

    def test_validate_svg_filenames_when_filenames_are_not_present(
        self
    ) -> None:
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
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id1')
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

    def test_validate_svg_filenames_format_when_all_filenames_are_valid(
        self
    ) -> None:
        """Test the validate_svg_filenames_in_math_rich_text when valid
        filenames are present for each math rich-text components in html.
        """
        html_string_with_filename_having_valid_format = (
            '<p>Feedback1</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';mathImg_20201216_331234_r3ir43lmfd_height_2d456_width_6d1'
            '24_vertical_0d231.svg&amp;quot;}"></oppia-noninteractive-math>'
            '<p>Feedback2</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';mathImg_20200216_133832_imzlvnf23a_height_4d123_width_23d'
            '122_vertical_2d123.svg&amp;quot;}"></oppia-noninteractive-math>'
        )
        self.assertEqual(
            html_validation_service.
            validate_math_content_attribute_in_html(
                html_string_with_filename_having_valid_format), [])

    def test_validate_svg_filenames_format_when_all_filenames_are_invalid(
        self
    ) -> None:
        """Test the validate_svg_filenames_in_math_rich_text when valid
        filenames are present for each math rich-text components in html.
        """
        html_string_with_filename_having_invalid_format = (
            '<p>Feedback1</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';mathImg_20201216*331234_r3ir43lmfd_height_2d456_width_6d1'
            '24_vertical_0d231.svg&amp;quot;}"></oppia-noninteractive-math>'
            '<p>Feedback2</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';mathImg_20200216_133832_imzlvnf23a_invalid_4d123_width_23d'
            '122_vertical_2d123.svg&amp;quot;}"></oppia-noninteractive-math>'
        )
        expected_output = [
            {
                'invalid_tag': (
                    '<oppia-noninteractive-math math_content-with-value="{&am'
                    'p;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, '
                    '&amp;quot;svg_filename&amp;quot;: &amp;quot;mathImg_20201'
                    '216*331234_r3ir43lmfd_height_2d456_width_6d124_vertical_0'
                    'd231.svg&amp;quot;}"></oppia-noninteractive-math>'),
                'error': (
                    'Invalid svg_filename attribute in math component: '
                    'mathImg_20201216*331234_r3ir43lmfd_height_2d456_width_6d1'
                    '24_vertical_0d231.svg'
                )
            }, {
                'invalid_tag': (
                    '<oppia-noninteractive-math math_content-with-value="{&amp;'
                    'quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &a'
                    'mp;quot;svg_filename&amp;quot;: &amp;quot;mathImg_2020021'
                    '6_133832_imzlvnf23a_invalid_4d123_width_23d122_vertical_2'
                    'd123.svg&amp;quot;}"></oppia-noninteractive-math>'),
                'error': (
                    'Invalid svg_filename attribute in math component: '
                    'mathImg_20200216_133832_imzlvnf23a_inv'
                    'alid_4d123_width_23d122_vertical_2d123.svg')
            }]

        self.assertItemsEqual(
            html_validation_service.validate_math_content_attribute_in_html(
                html_string_with_filename_having_invalid_format
            ),
            expected_output
        )

    def test_check_for_svgdiagram_component_in_html(self) -> None:
        """Test that the check_for_svgdiagram_component_in_html method checks
        for math-tags in an HTML string and returns a boolean.
        """
        test_cases: List[SvgDiagramTestCaseDict] = [{
            'html_content': (
                '<oppia-noninteractive-svgdiagram '
                'svg_filename-with-value="&amp;quot;img1.svg&amp;quot;"'
                ' alt-with-value="&amp;quot;Image&amp;quot;">'
                '</oppia-noninteractive-svgdiagram>'
            ),
            'expected_output': True
        }, {
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value='
                '"abc1.png"></oppia-noninteractive-image>Hello this is test '
                'case to check that dimensions are added to the oppia '
                'noninteractive image tags.</p>'
            ),
            'expected_output': False
        }]

        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.check_for_svgdiagram_component_in_html(
                    test_case['html_content']),
                test_case['expected_output'])

    def test_parsable_as_xml(self) -> None:
        invalid_xml = b'aDRjSzNS'
        self.assertEqual(
            html_validation_service.is_parsable_as_xml(invalid_xml),
            False)
        invalid_xml = b'123'
        self.assertEqual(
            html_validation_service.is_parsable_as_xml(invalid_xml),
            False)
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        invalid_xml = False  # type: ignore[assignment]
        self.assertEqual(
            html_validation_service.is_parsable_as_xml(invalid_xml),
            False)
        valid_xml = b'<svg><path d="0" /></svg>'
        self.assertEqual(
            html_validation_service.is_parsable_as_xml(valid_xml),
            True)

    def test_convert_svg_diagram_tags_to_image_tags(self) -> None:
        test_cases = [{
            'html_content': (
                '<oppia-noninteractive-svgdiagram '
                'svg_filename-with-value="&amp;quot;img1.svg&amp;quot;"'
                ' alt-with-value="&amp;quot;Image&amp;quot;">'
                '</oppia-noninteractive-svgdiagram>'
            ),
            'expected_output': (
                '<oppia-noninteractive-image '
                'alt-with-value="&amp;quot;Image&amp;quot;" '
                'caption-with-value="&amp;quot;&amp;quot;" '
                'filepath-with-value="&amp;quot;img1.svg&amp;quot;">'
                '</oppia-noninteractive-image>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-svgdiagram '
                'svg_filename-with-value="&amp;quot;img12.svg&amp;quot;"'
                ' alt-with-value="&amp;quot;Image&amp;quot;">'
                '</oppia-noninteractive-svgdiagram>'
                '<oppia-noninteractive-svgdiagram '
                'svg_filename-with-value="&amp;quot;img2.svg&amp;quot;"'
                ' alt-with-value="&amp;quot;Image123&amp;quot;">'
                '</oppia-noninteractive-svgdiagram>'
                '<oppia-noninteractive-svgdiagram '
                'alt-with-value="&amp;quot;Image12345&amp;quot;"'
                ' svg_filename-with-value="&amp;quot;igage.svg&amp;quot;">'
                '</oppia-noninteractive-svgdiagram>'
            ),
            'expected_output': (
                '<oppia-noninteractive-image '
                'alt-with-value="&amp;quot;Image&amp;quot;" '
                'caption-with-value="&amp;quot;&amp;quot;" '
                'filepath-with-value="&amp;quot;img12.svg&amp;quot;">'
                '</oppia-noninteractive-image>'
                '<oppia-noninteractive-image '
                'alt-with-value="&amp;quot;Image123&amp;quot;" '
                'caption-with-value="&amp;quot;&amp;quot;" '
                'filepath-with-value="&amp;quot;img2.svg&amp;quot;">'
                '</oppia-noninteractive-image>'
                '<oppia-noninteractive-image '
                'alt-with-value="&amp;quot;Image12345&amp;quot;" '
                'caption-with-value="&amp;quot;&amp;quot;" '
                'filepath-with-value="&amp;quot;igage.svg&amp;quot;">'
                '</oppia-noninteractive-image>'
            )
        }, {
            'html_content': (
                r'<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;'
                r'quot;title&amp;quot;:&amp;quot;Hint introduction&amp;quot;,'
                r'&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;oppia-'
                r'noninteractive-svgdiagram alt-with-value=\&amp;quot;'
                r'&amp;amp;amp;quot;desc&amp;amp;amp;quot;\&amp;quot; '
                r'svg_filename-with-value=\&amp;quot;&amp;amp;amp;quot;'
                r'img_20210727_054514_9l3scri3mg_height_350_width_450.svg&amp;'
                r'amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                r'/oppia-noninteractive-svgdiagram&amp;gt;&amp;quot;},'
                r'{&amp;quot;title&amp;quot;:'
                r'&amp;quot;Hint 1&amp;quot;,&amp;quot;content&amp;quot;:&amp;'
                r'quot;&amp;lt;oppia-noninteractive-svgdiagram alt-with-value='
                r'\&amp;quot; \&amp;quot;&amp;amp;amp;quot;abc&amp;amp;'
                r'amp;quot;ng-version=\&amp;quot;11.2.14\&amp;quot; svg_'
                r'filename-with-value=\&amp;quot;&amp;amp;amp;quot;'
                r'img_20210727_054530_g653s2p0af_height_350_width_450.svg'
                r'&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                r'/oppia-noninteractive-svgdiagram&amp;gt;&amp;quot;}]">'
                r'</oppia-noninteractive-tabs>'
            ),
            'expected_output': (
                r'<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;'
                r'quot;title&amp;quot;: &amp;quot;Hint introduction&amp;quot;, '
                r'&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;'
                r'oppia-noninteractive-image alt-with-value=\&amp;quot;&amp;'
                r'amp;amp;quot;desc&amp;amp;amp;quot;\&amp;quot; '
                r'caption-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;'
                r'quot;\&amp;quot; filepath-with-value=\&amp;quot;&amp;amp;amp;'
                r'quot;img_20210727_054514_9l3scri3mg_height_350_width_450.svg'
                r'&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                r'/oppia-noninteractive-image&amp;gt;&amp;quot;}, {&amp;quot;'
                r'title&amp;quot;: &amp;quot;Hint 1&amp;quot;, &amp;quot;'
                r'content&amp;quot;: &amp;quot;&amp;lt;'
                r'oppia-noninteractive-image &amp;amp;amp;quot;abc&amp;amp;amp;'
                r'quot;ng-version=\&amp;quot;11.2.14\&amp;quot; '
                r'alt-with-value=\&amp;quot; \&amp;quot; '
                r'caption-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;'
                r'quot;\&amp;quot; filepath-with-value=\&amp;quot;&amp;amp;amp;'
                r'quot;img_20210727_054530_g653s2p0af_height_350_width_450.svg'
                r'&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                r'/oppia-noninteractive-image&amp;gt;&amp;quot;}]">'
                r'</oppia-noninteractive-tabs>'
            )
        }, {
            'html_content': (
                r'<oppia-noninteractive-collapsible content-with-value="&amp;'
                r'quot;&amp;lt;oppia-noninteractive-svgdiagram alt-with-value='
                r'\&amp;quot;&amp;amp;amp;quot;abc&amp;amp;amp;quot;\&amp;'
                r'quot; ng-version=\&amp;quot;11.2.14\&amp;quot; '
                r'svg_filename-with-value=\&amp;quot;&amp;amp;amp;quot;'
                r'img_20210727_054955_a9it96co1j_height_350_width_450.svg'
                r'&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                r'/oppia-noninteractive-svgdiagram&amp;gt;&amp;quot;" '
                r'heading-with-value="&amp;quot;Sample Header&amp;quot;">'
                r'</oppia-noninteractive-collapsible>'
            ),
            'expected_output': (
                '<oppia-noninteractive-collapsible content-with-value="&amp;'
                'quot;&amp;lt;oppia-noninteractive-image alt-with-value=\\'
                '&amp;quot;&amp;amp;amp;quot;abc&amp;amp;amp;quot;\\&amp;'
                'quot; caption-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;'
                'amp;amp;quot;\\&amp;quot; filepath-with-value=\\&amp;quot;'
                '&amp;amp;amp;quot;img_20210727_054955_a9it96co1j_height_'
                '350_width_450.svg&amp;amp;amp;quot;\\&amp;quot; '
                'ng-version=\\&amp;quot;11.2.14\\&amp;quot;&amp;gt;&amp;'
                'lt;/oppia-noninteractive-image&amp;gt;&amp;quot;" '
                'heading-with-value="&amp;quot;Sample Header&amp;quot;">'
                '</oppia-noninteractive-collapsible>'
            )
        }]
        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.convert_svg_diagram_tags_to_image_tags(
                    test_case['html_content']),
                test_case['expected_output'])

    def test_no_convertion_of_non_interactive_image_tags(self) -> None:
        """Test that the convert_svg_diagram_tags_to_image_tags does not make
        any changes in already existing oppia-noninteractive image tags.
        """
        test_cases = [{
            'html_content': (
                '<oppia-noninteractive-image '
                'alt-with-value="&amp;quot;Image1&amp;quot;" '
                'caption-with-value="&amp;quot;xyz&amp;quot;" '
                'filepath-with-value="&amp;quot;img123.svg&amp;quot;">'
                '</oppia-noninteractive-image>'
            ),
            'expected_output': (
                '<oppia-noninteractive-image '
                'alt-with-value="&amp;quot;Image1&amp;quot;" '
                'caption-with-value="&amp;quot;xyz&amp;quot;" '
                'filepath-with-value="&amp;quot;img123.svg&amp;quot;">'
                '</oppia-noninteractive-image>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-svgdiagram '
                'svg_filename-with-value="&amp;quot;img11.svg&amp;quot;"'
                ' alt-with-value="&amp;quot;Image&amp;quot;">'
                '</oppia-noninteractive-svgdiagram>'
                '<oppia-noninteractive-image '
                'alt-with-value="&amp;quot;Image1&amp;quot;" '
                'caption-with-value="&amp;quot;abcxyz&amp;quot;" '
                'filepath-with-value="&amp;quot;img123.svg&amp;quot;">'
                '</oppia-noninteractive-image>'
            ),
            'expected_output': (
                '<oppia-noninteractive-image '
                'alt-with-value="&amp;quot;Image&amp;quot;" '
                'caption-with-value="&amp;quot;&amp;quot;" '
                'filepath-with-value="&amp;quot;img11.svg&amp;quot;">'
                '</oppia-noninteractive-image>'
                '<oppia-noninteractive-image '
                'alt-with-value="&amp;quot;Image1&amp;quot;" '
                'caption-with-value="&amp;quot;abcxyz&amp;quot;" '
                'filepath-with-value="&amp;quot;img123.svg&amp;quot;">'
                '</oppia-noninteractive-image>'
            )
        }]
        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.convert_svg_diagram_tags_to_image_tags(
                    test_case['html_content']),
                test_case['expected_output'])

    def test_fix_incorrectly_encoded_chars_replaces_incorrect_encodings(
        self
    ) -> None:
        test_cases = [
            {
                'html_string': '<p>This is <span>testing &nbsp;</span></p>',
                'expected_output': '<p>This is <span>testing  </span></p>'
            },
            {
                'html_string': '<p>This is <span>\t testing \n</span></p>',
                'expected_output': '<p>This is <span> testing </span></p>'
            },
            {
                'html_string': '<p>Hello this is <span>testing \xa0</span></p>',
                'expected_output': '<p>Hello this is <span>testing  </span></p>'
            },
            {
                'html_string': '<p>Hello this is <span>testing \xc2</span></p>',
                'expected_output': '<p>Hello this is <span>testing </span></p>'
            },
            {
                'html_string': '<p>Hello this is <span>testing \xe2\u2020\u2019'
                ' \xe2\u20ac\u0153 \xe2\u02c6\u2030 \xe2\u2026\u02dc '
                '\xe2\u20ac\u2122 \xe2\u02c6\u0161 \xe2\u02c6\u02c6 '
                '\xe2\u2026\u2022 \xe2\u2026\u2122 \xe2\u20ac\u02dc '
                '\xe2\u20ac\u201d \xe2\u20ac\u2039 \xe2\xcb\u2020\xe2\u20ac\xb0'
                '</span></p>',
                'expected_output': '<p>Hello this is <span>testing \u2192 '
                '\u201c \u2209 \u2158 \u2019 \u221a \u2208 \u2155 \u2159 '
                '\u2018 \u2014 \u200b \u2209</span></p>'
            }
        ]
        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.fix_incorrectly_encoded_chars(
                    test_case['html_string']),
                test_case['expected_output']
            )
