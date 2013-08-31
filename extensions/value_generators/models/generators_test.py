# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

from extensions.value_generators.models import generators
import test_utils


class ValueGeneratorUnitTests(test_utils.GenericTestBase):
    """Test that value generators work correctly."""

    def test_copier(self):
        generator = generators.Copier()
        self.assertEqual(generator.generate_value(**{'value': 'a'}), 'a')

    def test_random_selector(self):
        generator = generators.RandomSelector()
        self.assertIn(generator.generate_value(
            **{'list_of_values': ['a', 'b', 'c']}), ['a', 'b', 'c'])

    def test_inclusive_int_range_picker(self):
        generator = generators.InclusiveIntRangePicker()

        # Perform multiple checks because the generation is randomized.
        for i in range(10):
            self.assertEqual(generator.generate_value(0, 0), 0)
            self.assertGreaterEqual(generator.generate_value(3, 6), 3)
            self.assertLessEqual(generator.generate_value(3, 6), 6)

    def test_random_string_generator(self):
        generator = generators.RandomStringGenerator()

        self.assertEqual(generator.generate_value(0, 'a'), '')
        self.assertEqual(generator.generate_value(5, 'a'), 'aaaaa')

        # Test unicode strings.
        self.assertEqual(generator.generate_value(5, u'¡'), u'¡¡¡¡¡')

        # The next test can legitimately fail, but should have a negligible
        # chance of doing so (i.e., 2^(-99)).
        long_string = generator.generate_value(100, 'ab')
        self.assertIn('a', long_string)
        self.assertIn('b', long_string)
        for c in long_string:
            self.assertIn(c, ['a', 'b'])

    def test_jinja_evaluator(self):
        generator = generators.JinjaEvaluator()

        self.assertEqual(generator.generate_value('abc', {}), 'abc')
        self.assertEqual(generator.generate_value('{{a}}', {'a': 3}), '3')
        generator.generate_value('{{a}}', {'b': 3})

    def test_accumulator(self):
        generator = generators.Accumulator()

        self.assertEqual(generator.generate_value([]), 0)
        self.assertEqual(generator.generate_value([3]), 3)
        self.assertEqual(generator.generate_value([1, 2, 3]), 6)
        self.assertEqual(generator.generate_value([-1, 2, -3]), -2)

    def test_restricted_copier(self):
        with self.assertRaises(TypeError):
            generators.RestrictedCopier()

        with self.assertRaisesRegexp(TypeError, 'Expected a list of choices'):
            generators.RestrictedCopier(3)

        generator = generators.RestrictedCopier(['a', 'b'])

        self.assertEqual(generator.generate_value('a'), 'a')
        with self.assertRaises(AssertionError):
            generator.generate_value('c')
