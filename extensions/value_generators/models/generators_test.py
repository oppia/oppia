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

"""Tests for value generators."""

from core.tests import test_utils
from extensions.value_generators.models import generators


class ValueGeneratorUnitTests(test_utils.GenericTestBase):
    """Test that value generators work correctly."""

    def test_copier(self):
        generator = generators.Copier()
        self.assertEqual(generator.generate_value({}, **{'value': 'a'}), 'a')
        self.assertEqual(generator.generate_value(
            {}, **{'value': 'a', 'parse_with_jinja': False}), 'a')
        self.assertEqual(generator.generate_value(
            None, **{'value': 'a', 'parse_with_jinja': False}), 'a')
        self.assertEqual(generator.generate_value(
            {}, **{'value': '{{a}}', 'parse_with_jinja': False}), '{{a}}')
        self.assertEqual(generator.generate_value(
            {'a': 'b'}, **{'value': '{{a}}', 'parse_with_jinja': True}), 'b')
        self.assertIn(
            'init-args="initArgs" value="customizationArgs.value"',
            generator.get_html_template())

    def test_random_selector(self):
        generator = generators.RandomSelector()
        self.assertIn(generator.generate_value(
            {}, **{'list_of_values': ['a', 'b', 'c']}), ['a', 'b', 'c'])
        self.assertIn(
            'schema="$ctrl.SCHEMA" '
            'local-value="$ctrl.customizationArgs.list_of_values"',
            generator.get_html_template())
