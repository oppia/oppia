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

"""Tests for rich text components."""

from __future__ import annotations

import inspect
import os
import re

from core import utils
from core.tests import test_utils
from extensions.rich_text_components import components

from typing import Any, Dict, List, Sequence, Tuple, Type, Union

ValidItemTypes = Union[
    Dict[str, str],
    Dict[str, Dict[str, str]],
    Dict[str, List[Dict[str, str]]],
    Dict[str, Union[str, int, bool]]
]


class ComponentValidationUnitTests(test_utils.GenericTestBase):
    """Tests validation of rich text components."""

    # Here we use type Any because here we are providing different types of
    # tuples for testing purposes.
    def check_validation(
        self,
        rte_component_class: Type[components.BaseRteComponent],
        valid_items: Sequence[ValidItemTypes],
        invalid_items_with_error_messages: List[Tuple[Any, str]]
    ) -> None:
        """Test that values are validated correctly.

        Args:
            rte_component_class: object(BaseRTEComponent). The class whose
                validate() method is to be tested.
            valid_items: list(*). Each of these items is expected to
                be validated without any Exception.
            invalid_items_with_error_messages: list(str). A list of values with
                corresponding error message. Each of these values is expected to
                raise a TypeError when validated.
        """
        for item in valid_items:
            rte_component_class.validate(item)

        for item, error_msg in invalid_items_with_error_messages:
            with self.assertRaisesRegex(Exception, error_msg):
                rte_component_class.validate(item)

    def test_collapsible_validation(self) -> None:
        """Tests collapsible component validation."""
        valid_items: List[Dict[str, str]] = [{
            'content-with-value': '<p>Hello</p>',
            'heading-with-value': 'Collapsible'
        }, {
            'content-with-value': '<p>1234</p>',
            'heading-with-value': '1234'
        }]
        invalid_items_with_error_messages = [
            ({
                'content-with-value': (
                    '<oppia-noninteractive-collapsible content-with-value='
                    '"&amp;quot;&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;&amp;'
                    'quot;" heading-with-value="&amp;quot;SubCollapsible&amp;'
                    'quot;"></oppia-noninteractive-collapsible><p>&nbsp;</p>'
                ),
                'heading-with-value': 'Collaspible'
            }, 'Nested tabs and collapsible'),
            ({
                'content-with-value': '<p>Hello</p>',
                'heading-collap-with-value': 'Collapsible'
            },
             'Missing attributes: heading-with-value, Extra attributes: '
             'heading-collap-with-value')]

        self.check_validation(
            components.Collapsible, valid_items,
            invalid_items_with_error_messages)

    def test_image_validation(self) -> None:
        """Tests collapsible component validation."""
        valid_items: List[Dict[str, str]] = [{
            'filepath-with-value': 'random.png',
            'alt-with-value': '1234',
            'caption-with-value': 'hello'
        }, {
            'filepath-with-value': 'xyz.png',
            'alt-with-value': 'hello',
            'caption-with-value': 'abc'
        }]
        invalid_items_with_error_messages = [
            ({
                'filepath-with-value': 'random.png',
                'caption-with-value': 'abc'
            }, 'Missing attributes: alt-with-value, Extra attributes: '),
            ({
                'filepath-with-value': 'xyz.jpeg.png',
                'alt-with-value': 'hello',
                'caption-with-value': 'abc'
            }, 'Invalid filepath')]

        self.check_validation(
            components.Image, valid_items, invalid_items_with_error_messages)

    def test_link_validation(self) -> None:
        """Tests collapsible component validation."""
        valid_items: List[Dict[str, str]] = [{
            'url-with-value': 'https://link.com',
            'text-with-value': 'What is a link?'
        }, {
            'url-with-value': 'https://hello.com',
            'text-with-value': '1234'
        }]
        invalid_items_with_error_messages = [
            ({
                'url-with-value': 'javascript:alert(5);',
                'text-with-value': 'Hello'
            },
             r'Invalid URL: Sanitized URL should start with \'http://\' or '
             r'\'https://\'; received javascript:alert%285%29%3B'),
            ({
                'url-with-value': 'http://link.com',
                'text-with-value': 1234
            }, 'Expected unicode string, received 1234')]

        self.check_validation(
            components.Link, valid_items, invalid_items_with_error_messages)

    def test_math_validation(self) -> None:
        """Tests collapsible component validation."""
        valid_items: List[Dict[str, Dict[str, str]]] = [{
            'math_content-with-value': {
                'raw_latex': '123456',
                'svg_filename': (
                    'mathImg_20201216_331234_r3ir43lmfd_height_2d456_width_6d1'
                    '24_vertical_0d231.svg')
            }
        }, {
            'math_content-with-value': {
                'raw_latex': '\\frac{x}{y}',
                'svg_filename': (
                    'mathImg_20200216_133832_imzlvnf23a_height_4d123_width_23d'
                    '122_vertical_2d123.svg')
            }
        }]
        invalid_items_with_error_messages = [
            ({
                'math_content-with-value': False
            }, 'Expected dict, received False'),
            ({
                'url-with-value': 'http://link.com'
            },
             'Missing attributes: math_content-with-value, Extra attributes: '
             'url-with-value'),
            ({
                'math_content-with-value': {
                    'raw_latex': True,
                    'svg_filename': False
                }
            }, 'Expected unicode string, received True'),
            ({
                'math_content-with-value': {
                    'raw_latex': 123,
                    'svg_filename': 11
                }
            }, 'Expected unicode string, received 123'),
            ({
                'math_content-with-value': {
                    'raw_latex': 'x^2',
                    'svg_filename': 'img.svg'
                }
            }, 'Invalid svg_filename attribute in math component: img.svg'),
            ({
                'math_content-with-value': {
                    'raw_latex': 'x^3',
                    'svg_filename': (
                        'invalid_2020761338_imzlvnf23a_height_4d123_width_23d'
                        '122_vertical_2d123.svg')
                }
            }, (
                'Invalid svg_filename attribute in math component: invalid_202'
                '0761338_imzlvnf23a_height_4d123_width_23d122_vertical_2d123'
                '.svg')),
            ({
                'math_content-with-value': {
                    'raw_latex': 'x^3',
                    'svg_filename': (
                        'mathImg_20207361338_imzlvnf23a_invalid_4d123_width_2'
                        '3d122_vertical_2d123.svg')
                }
            }, (
                'Invalid svg_filename attribute in math component: mathImg_202'
                '07361338_imzlvnf23a_invalid_4d123_width_23d122_vertical_2d123'
                '.svg'))]

        self.check_validation(
            components.Math, valid_items, invalid_items_with_error_messages)

    def test_skillreview_validation(self) -> None:
        """Tests skillreview component validation."""
        valid_items = [{
            'skill_id-with-value': 'skill_id',
            'text-with-value': 'Skill Link Text'
        }]
        invalid_items_with_error_messages = [
            ({
                'skill_id-with-value': 20,
                'url-with-value': 'Hello'
            },
             'Missing attributes: text-with-value, Extra attributes: '
             'url-with-value')]

        self.check_validation(
            components.Skillreview, valid_items,
            invalid_items_with_error_messages)

    def test_tabs_validation(self) -> None:
        """Tests collapsible component validation."""
        valid_items = [{
            'tab_contents-with-value': [{
                'content': '<p>hello</p>', 'title': 'Tabs'
            }]
        }, {
            'tab_contents-with-value': [{
                'content': '<p>hello</p>', 'title': 'Tabs'
            }, {
                'content': (
                    '<p><oppia-noninteractive-link text-with-value="&amp;'
                    'quot;What is a link?&amp;quot;" url-with-value="'
                    '&amp;quot;https://link.com&amp;quot;">'
                    '</oppia-noninteractive-link></p>'
                ), 'title': 'Tabs'
            }]
        }]
        invalid_items_with_error_messages = [
            (
                {
                    'tab_contents-with-value': [{
                        'content': 1234, 'title': 'hello'
                    }, {
                        'content': '<p>oppia</p>', 'title': 'Savjet 1'
                    }]
                },
                'Expected unicode HTML string, received 1234'
            ),
            (
                {
                    'tab_content-with-value': [{
                        'content': '<p>hello</p>', 'title': 'hello'
                    }]
                },
                 'Missing attributes: tab_contents-with-value, '
                 'Extra attributes: tab_content-with-value'
            ),
            (
                {
                    'tab_contents-with-value': [{
                        'content': '<p>hello</p>', 'tab-title': 'hello'
                    }]
                },
                re.escape(
                    'Missing keys: [\'title\'], Extra keys: [\'tab-title\']')
            ),
            (
                {
                    'tab_contents-with-value': [{
                        'content': (
                            '<oppia-noninteractive-collapsible content-with-value=' # pylint: disable=line-too-long
                            '"&amp;quot;&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;&amp;' # pylint: disable=line-too-long
                            'quot;" heading-with-value="&amp;quot;SubCollapsible&amp;' # pylint: disable=line-too-long
                            'quot;"></oppia-noninteractive-collapsible><p>&nbsp;</p>' # pylint: disable=line-too-long
                        ),
                        'title': 'Collapsible'
                    }]
                },
                'Nested tabs and collapsible'
            )
        ]

        self.check_validation(
            components.Tabs, valid_items, invalid_items_with_error_messages)

    def test_video_validation(self) -> None:
        """Tests collapsible component validation."""
        valid_items: List[Dict[str, Union[str, int, bool]]] = [{
            'video_id-with-value': 'abcdefghijk',
            'start-with-value': 0,
            'end-with-value': 10,
            'autoplay-with-value': False
        }, {
            'video_id-with-value': 'hello123456',
            'start-with-value': 0,
            'end-with-value': 100,
            'autoplay-with-value': True
        }]
        invalid_items_with_error_messages = [
            ({
                'video_id-with-value': 'lorem',
                'start-with-value': 0,
                'end-with-value': 10,
                'autoplay-with-value': False
            }, 'Video id length is not 11'),
            ({
                'video_id-with-value': 'hello12345',
                'start-with-value': '10',
                'end-with-value': '100',
                'autoplay-with-value': False
            }, 'Video id length is not 11'),
            ({
                'video_id-with-value': 'hello12345',
                'start-with-value': 10,
                'end-with-value': 100,
                'autoplay-with-value': 90
            }, 'Expected bool, received 90')]

        self.check_validation(
            components.Video, valid_items, invalid_items_with_error_messages)


class ComponentDefinitionTests(test_utils.GenericTestBase):
    """Tests definition of rich text components."""

    def test_component_definition(self) -> None:
        """Test that all components are defined."""
        rich_text_components_dir = (
            os.path.join(os.curdir, 'extensions', 'rich_text_components'))
        actual_components = [
            name for name in os.listdir(rich_text_components_dir)
            if name != '__pycache__' and
               os.path.isdir(os.path.join(rich_text_components_dir, name))
        ]
        defined_components = []
        for name, obj in inspect.getmembers(components):
            if inspect.isclass(obj):
                defined_components.append(name)
        defined_components.remove('BaseRteComponent')
        self.assertEqual(set(defined_components), set(actual_components))


class ComponentE2eTests(test_utils.GenericTestBase):
    """Tests that all components have their e2e test files defined."""

    def test_component_e2e_tests(self) -> None:
        """Tests that an e2e test is defined for all rich text components."""
        test_file = os.path.join(
            'extensions', 'rich_text_components', 'webdriverio.js')
        rich_text_components_dir = (
            os.path.join(os.curdir, 'extensions', 'rich_text_components'))
        actual_components = [
            name for name in os.listdir(rich_text_components_dir)
            if name != '__pycache__' and
               os.path.isdir(os.path.join(rich_text_components_dir, name))
        ]
        with utils.open_file(test_file, 'r') as f:
            text = f.read()
            # Replace all spaces and new lines with empty space.
            text = re.sub(r' ', r'', text)
            text = re.sub(r'\n', r'', text)

            # Isolate the text inside the RICH_TEXT_COMPONENTS constant.
            beginning_sequence = 'varRICH_TEXT_COMPONENTS={'
            first_bracket_index = text.find(beginning_sequence)
            last_bracket_index = text.find('};')
            text_inside_constant = text[
                first_bracket_index + len(beginning_sequence):
                last_bracket_index] + ','

            rte_components_with_test = []
            while text_inside_constant.find(',') != -1:
                rte_components_with_test.append(
                    text_inside_constant[0:text_inside_constant.find(':')])
                text_inside_constant = text_inside_constant[
                    text_inside_constant.find(',') + 1:]

        self.assertEqual(set(actual_components), set(rte_components_with_test))
