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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from core.tests import test_utils
from extensions.value_generators.models import generators

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


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
