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

import inspect
import os

from core.tests import test_utils
from extensions.rich_text_components import components


class ComponentValidationUnitTests(test_utils.GenericTestBase):
    """Tests validation of rich text components."""

    def check_validation(self, cls, valid_items, invalid_items):
        """Test that values are validated correctly.

        Args:
          cls: the class whose validate() method is to be tested.
          valid_items: a list of values. Each of these items is expected to
            be validated without any Exception.
          invalid_items: a list of values. Each of these is expected to raise
            a TypeError when validated.
        """
        for item in valid_items:
            try:
                cls.validate(item)
            except Exception as e:
                self.fail(
                    msg=(
                        'Unexpected exception %s raised during '
                        'validation of %s' % (
                            str(e), str(item))))

        for item in invalid_items:
            with self.assertRaises(Exception):
                cls.validate(item)

    def test_collapsible_validation(self):
        """Tests collapsible component validation."""
        valid_items = [{
            'content-with-value': '<p>Hello</p>',
            'heading-with-value': 'Collapsible'
        }, {
            'content-with-value': '<p>1234</p>',
            'heading-with-value': '1234'
        }]
        invalid_items = [{
            'content-with-value': (
                '<oppia-noninteractive-collapsible content-with-value='
                '"&amp;quot;&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;&amp;'
                'quot;" heading-with-value="&amp;quot;SubCollapsible&amp;'
                'quot;"></oppia-noninteractive-collapsible><p>&nbsp;</p>'
            ),
            'heading-with-value': 'Collaspible'
        }, {
            'content-with-value': '<p>Hello</p>',
            'heading-collap-with-value': 'Collapsible'
        }]

        self.check_validation(
            components.Collapsible, valid_items, invalid_items)

    def test_image_validation(self):
        """Tests collapsible component validation."""
        valid_items = [{
            'filepath-with-value': 'random.png',
            'alt-with-value': '1234',
            'caption-with-value': 'hello'
        }, {
            'filepath-with-value': 'xyz.png',
            'alt-with-value': 'hello',
            'caption-with-value': 'abc'
        }]
        invalid_items = [{
            'filepath-with-value': 'random.png',
            'caption-with-value': 'abc'
        }, {
            'filepath-with-value': 'xyz.jpeg.png',
            'alt-with-value': 'hello',
            'caption-with-value': 'abc'
        }]

        self.check_validation(
            components.Image, valid_items, invalid_items)

    def test_link_validation(self):
        """Tests collapsible component validation."""
        valid_items = [{
            'url-with-value': 'https://link.com',
            'text-with-value': 'What is a link?'
        }, {
            'url-with-value': 'https://hello.com',
            'text-with-value': '1234'
        }]
        invalid_items = [{
            'url-with-value': 'javascript:alert(5);',
            'text-with-value': 'Hello'
        }, {
            'url-with-value': 'http://link.com',
            'text-with-value': 1234
        }]

        self.check_validation(
            components.Link, valid_items, invalid_items)

    def test_math_validation(self):
        """Tests collapsible component validation."""
        valid_items = [{
            'raw_latex-with-value': '123456789'
        }, {
            'raw_latex-with-value': '\\frac{x}{y}'
        }]
        invalid_items = [{
            'raw_latex-with-value': False
        }, {
            'url-with-value': 'http://link.com'
        }]

        self.check_validation(
            components.Math, valid_items, invalid_items)

    def test_tabs_validation(self):
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
        invalid_items = [{
            'tab_contents-with-value': [{
                'content': 1234, 'title': 'hello'
            }, {
                'content': '<p>oppia</p>', 'title': 'Savjet 1'
            }]
        }, {
            'tab_content-with-value': [{
                'content': '<p>hello</p>', 'title': 'hello'
            }]
        }, {
            'tab_contents-with-value': [{
                'content': '<p>hello</p>', 'tab-title': 'hello'
            }]
        }]

        self.check_validation(
            components.Tabs, valid_items, invalid_items)

    def test_video_validation(self):
        """Tests collapsible component validation."""
        valid_items = [{
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
        invalid_items = [{
            'video_id-with-value': 'lorem',
            'start-with-value': 0,
            'end-with-value': 10,
            'autoplay-with-value': False
        }, {
            'video_id-with-value': 'hello12345',
            'start-with-value': '10',
            'end-with-value': '100',
            'autoplay-with-value': False
        }, {
            'video_id-with-value': 'hello12345',
            'start-with-value': 10,
            'end-with-value': 100,
            'autoplay-with-value': 90
        }]

        self.check_validation(
            components.Video, valid_items, invalid_items)


class ComponentDefinitionTests(test_utils.GenericTestBase):
    """Tests definition of rich text components."""

    def test_component_definition(self):
        """Test that all components are defined."""
        actual_components = [name for name in os.listdir(
            './extensions/rich_text_components') if os.path.isdir(os.path.join(
                './extensions/rich_text_components', name))]
        defined_components = []
        for name, obj in inspect.getmembers(components):
            if inspect.isclass(obj):
                defined_components.append(name)
        defined_components.remove('BaseRteComponent')
        self.assertEqual(set(defined_components), set(actual_components))
