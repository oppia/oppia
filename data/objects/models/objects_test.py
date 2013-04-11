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

"""Tests for typed object classes (mostly normalization)."""

__author__ = 'Sean Lip'

import test_utils

from data.objects.models import objects


class ObjectNormalizationUnitTests(test_utils.AppEngineTestBase):
    """Tests normalization of typed objects."""

    def check_normalization(self, cls, item_list):
        """Test that values are normalized correctly.

        Args:
          cls: the class whose normalize() method is to be tested.
          item_list: a list of 2-element tuples. The first element of
            each item is expected to be normalized to the second.
        """
        for item in item_list:
            assert cls.normalize(item[0]) == item[1], (
                'Expected %s when normalizing %s as a %s, got %s' %
                (item[1], item[0], cls.__name__, cls.normalize(item[0]))
            )

    def check_invalid_values(self, cls, item_list):
        """Test that invalid values raise TypeError when normalized.

        Args:
          cls: the class whose normalize() method is to be tested.
          item_list: a list of values. Each of these is expected to raise
            a TypeError when normalized.
        """
        for item in item_list:
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
        cls = objects.Number
        normalization_mappings = [
            (20, 20),
            ('20', 20),
            ('02', 2),
            ('0', 0),
            (-1, -1),
            ('-1', -1),
            (3.00, 3),
            (3.05, 3.05),
            ('3.05', 3.05)
        ]
        invalid_values = ['a', '', {'a': 3}, [3], None]

        self.check_normalization(cls, normalization_mappings)
        self.check_invalid_values(cls, invalid_values)

    def test_real_validation(self):
        """Tests objects of type Real."""
        cls = objects.Real
        normalization_mappings = [
            (20, 20),
            ('20', 20),
            ('02', 2),
            ('0', 0),
            (-1, -1),
            ('-1', -1),
            (3.00, 3),
            (3.05, 3.05),
            ('3.05', 3.05)
        ]
        invalid_values = ['a', '', {'a': 3}, [3], None]

        self.check_normalization(cls, normalization_mappings)
        self.check_invalid_values(cls, invalid_values)

    def test_int_validation(self):
        """Tests objects of type Int."""
        cls = objects.Int
        normalization_mappings = [
            (20, 20),
            ('20', 20),
            ('02', 2),
            ('0', 0),
            (-1, -1),
            ('-1', -1),
            (3.00, 3),
            (3.05, 3),
        ]
        invalid_values = ['a', '', {'a': 3}, [3], None]

        self.check_normalization(cls, normalization_mappings)
        self.check_invalid_values(cls, invalid_values)

    def test_nonnegative_int_validation(self):
        """Tests objects of type NonnegativeInt."""
        cls = objects.NonnegativeInt
        normalization_mappings = [
            (20, 20),
            ('20', 20),
            ('02', 2),
            ('0', 0),
            (3.00, 3),
            (3.05, 3),
        ]
        invalid_values = ['a', '', {'a': 3}, [3], None, -1, '-1']

        self.check_normalization(cls, normalization_mappings)
        self.check_invalid_values(cls, invalid_values)

    def test_coord_2d_validation(self):
        """Tests objects of type Coord2D."""
        cls = objects.Coord2D
        normalization_mappings = [
            ('-1, 2.2', [-1, 2.2]),
            ([0, 1], [0, 1]),
            (' -1 , 3.5', [-1, 3.5]),
        ]
        invalid_values = ['123', 'a', [0, 1, 2], None]

        self.check_normalization(cls, normalization_mappings)
        self.check_invalid_values(cls, invalid_values)

    def test_list_validation(self):
        """Tests objects of type List."""
        cls = objects.List
        normalization_mappings = [
            ([3, 'a'], [3, 'a']),
            ([], []),
            ([1, 2, 1], [1, 2, 1]),
        ]
        invalid_values = ['123', {'a': 1}, 3.0, None]

        self.check_normalization(cls, normalization_mappings)
        self.check_invalid_values(cls, invalid_values)

    def test_set_validation(self):
        """Tests objects of type Set."""
        cls = objects.Set
        normalization_mappings = [
            ([3, 'a'], [3, 'a']),
            ([], []),
        ]
        invalid_values = ['123', {'a': 1}, 3.0, None, [1, 2, 1]]

        self.check_normalization(cls, normalization_mappings)
        self.check_invalid_values(cls, invalid_values)

    def test_unicode_string_validation(self):
        """Tests objects of type UnicodeString."""
        cls = objects.UnicodeString
        normalization_mappings = [
            ('Abc   def', u'Abc   def'),
            (u'¡Hola!', u'¡Hola!'),
            (3.0, '3.0'),
        ]
        invalid_values = [{'a': 1}, [1, 2, 1], None]

        self.check_normalization(cls, normalization_mappings)
        self.check_invalid_values(cls, invalid_values)

    def test_html_validation(self):
        """Tests objects of type HTML."""
        # TODO(sll): Add more tests.
        cls = objects.Html
        normalization_mappings = [
            ('<p onclick="evil_function()">a paragraph</p>',
             '<p>a paragraph</p>'),
            ('<iframe src="evil-site"></iframe>', '<div></div>'),
            (u'¡Hola!', u'<p>¡Hola!</p>'),
            ('<a href="evil-site">spam spam SPAM!</a>',
             '<a href="evil-site">spam spam SPAM!</a>'),
        ]
        invalid_values = [{'a': 1}, [1, 2, 1], None]

        self.check_normalization(cls, normalization_mappings)
        self.check_invalid_values(cls, invalid_values)

    def test_normalized_string_validation(self):
        """Tests objects of type NormalizedString."""
        cls = objects.NormalizedString
        normalization_mappings = [
            ('Abc   def', u'Abc def'),
            (u'¡hola!', u'¡hola!'),
            (3.0, '3.0'),
        ]
        invalid_values = [{'a': 1}, [1, 2, 1], None]

        self.check_normalization(cls, normalization_mappings)
        self.check_invalid_values(cls, invalid_values)

    def test_music_note_validation(self):
        """Tests objects of type MusicNote."""
        cls = objects.MusicNote
        normalization_mappings = [
            ('A4', 'A4'),
            ('B4', 'B4'),
        ]
        invalid_values = ['D6', 'B3', 'CA4', 2, None]

        self.check_normalization(cls, normalization_mappings)
        self.check_invalid_values(cls, invalid_values)
