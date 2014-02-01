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

"""Tests for typed object classes (mostly normalization)."""

__author__ = 'Sean Lip'

from extensions.objects.models import objects
import test_utils


class ObjectNormalizationUnitTests(test_utils.GenericTestBase):
    """Tests normalization of typed objects."""

    def check_normalization(self, cls, mappings, invalid_items):
        """Test that values are normalized correctly.

        Args:
          cls: the class whose normalize() method is to be tested.
          mappings: a list of 2-element tuples. The first element of
            each item is expected to be normalized to the second.
          invalid_items: a list of values. Each of these is expected to raise
            a TypeError when normalized.
        """
        for item in mappings:
            assert cls.normalize(item[0]) == item[1], (
                'Expected %s when normalizing %s as a %s, got %s' %
                (item[1], item[0], cls.__name__, cls.normalize(item[0]))
            )

        for item in invalid_items:
            try:
                normalized_item = cls.normalize(item)
                error_msg = ('Expected %s to be invalid, but it was '
                             'successfully normalized to %s as a %s'
                             % (item, normalized_item, cls.__name__))
                raise Exception(error_msg)
            except TypeError:
                pass

    def test_number_validation(self):
        """Tests objects of type Number."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0), (-1, -1),
                    ('-1', -1), (3.00, 3), (3.05, 3.05), ('3.05', 3.05), ]
        invalid_values = ['a', '', {'a': 3}, [3], None]

        self.check_normalization(objects.Number, mappings, invalid_values)

    def test_real_validation(self):
        """Tests objects of type Real."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0), (-1, -1),
                    ('-1', -1), (3.00, 3), (3.05, 3.05), ('3.05', 3.05), ]
        invalid_values = ['a', '', {'a': 3}, [3], None]

        self.check_normalization(objects.Real, mappings, invalid_values)

    def test_int_validation(self):
        """Tests objects of type Int."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0), (-1, -1),
                    ('-1', -1), (3.00, 3), (3.05, 3), ]
        invalid_values = ['a', '', {'a': 3}, [3], None]

        self.check_normalization(objects.Int, mappings, invalid_values)

    def test_nonnegative_int_validation(self):
        """Tests objects of type NonnegativeInt."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0), (3.00, 3),
                    (3.05, 3), ]
        invalid_vals = ['a', '', {'a': 3}, [3], None, -1, '-1']

        self.check_normalization(
            objects.NonnegativeInt, mappings, invalid_vals)

    def test_code_evaluation_validation(self):
        """Tests objects of type codeEvaluation."""
        mappings = [(
            {'code': 'a', 'output': '', 'evaluation': '', 'error': ''},
            {'code': 'a', 'output': '', 'evaluation': '', 'error': ''}
        ), (
            {'code': '', 'output': '', 'evaluation': '', 'error': 'e'},
            {'code': '', 'output': '', 'evaluation': '', 'error': 'e'}
        )]
        invalid_values = [
            {'code': '', 'output': '', 'evaluation': ''},
            'a', [], None
        ]

        self.check_normalization(
            objects.CodeEvaluation, mappings, invalid_values)

    def test_coord_two_dim_validation(self):
        """Tests objects of type CoordTwoDim."""
        mappings = [('-1, 2.2', [-1, 2.2]), ([0, 1], [0, 1]),
                    (' -1 , 3.5', [-1, 3.5]), ]
        invalid_values = ['123', 'a', [0, 1, 2], None]

        self.check_normalization(objects.CoordTwoDim, mappings, invalid_values)

    def test_list_validation(self):
        """Tests objects of type List."""
        mappings = [([3, 'a'], [3, 'a']), ([], []), ([1, 2, 1], [1, 2, 1]), ]
        invalid_values = ['123', {'a': 1}, 3.0, None]

        self.check_normalization(objects.List, mappings, invalid_values)

    def test_set_of_unicode_string_validation(self):
        """Tests objects of type SetOfUnicodeString."""
        mappings = [
            (['ff', 'a', u'¡Hola!'], [u'a', u'ff', u'¡Hola!']),
            ([], []),
            (['ab', 'cb', 'abc', 'cb'], [u'ab', u'abc', u'cb']),
        ]
        invalid_values = ['123', {'a': 1}, 3.0, None, [3, 'a']]

        self.check_normalization(
            objects.SetOfUnicodeString, mappings, invalid_values)

    def test_unicode_string_validation(self):
        """Tests objects of type UnicodeString."""
        mappings = [
            ('Abc   def', u'Abc   def'), (u'¡Hola!', u'¡Hola!'), (3.0, '3.0'),
        ]
        invalid_vals = [{'a': 1}, [1, 2, 1], None]

        self.check_normalization(objects.UnicodeString, mappings, invalid_vals)

    def test_html_validation(self):
        """Tests objects of type HTML."""
        # TODO(sll): Add more tests.
        mappings = [
            ('<p onclick="evil_function()">a paragraph</p>',
             '<p>a paragraph</p>'),
            ('<iframe src="evil-site"></iframe>', ''),
            (u'¡Hola!', u'¡Hola!'),
            ('<a href="evil-site">spam spam SPAM!</a>',
             '<a>spam spam SPAM!</a>'),
        ]
        invalid_values = [{'a': 1}, [1, 2, 1], None]

        self.check_normalization(objects.Html, mappings, invalid_values)

    def test_normalized_string_validation(self):
        """Tests objects of type NormalizedString."""
        mappings = [
            ('Abc   def', u'Abc def'), (u'¡hola!', u'¡hola!'), (3.0, '3.0'),
        ]
        invalid_values = [{'a': 1}, [1, 2, 1], None]

        self.check_normalization(
            objects.NormalizedString, mappings, invalid_values)

    def test_sanitized_url_validation(self):
        mappings = [
            ('http://www.google.com', 'http://www.google.com'),
            ('https://www.google.com', 'https://www.google.com'),
            ('javascript:alert(5);', ''),
            ('ftp://gopher.com', ''),
            ('test', ''),
            ('google.com', ''),
            ('https://www.google!.com', 'https://www.google%21.com'),
        ]

        invalid_vals = [u'http://¡Hola!.com']

        self.check_normalization(objects.SanitizedUrl, mappings, invalid_vals)
