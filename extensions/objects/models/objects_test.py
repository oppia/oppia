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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import inspect

from core.tests import test_utils
from extensions.objects.models import objects
import python_utils
import schema_utils_test


class ObjectNormalizationUnitTests(test_utils.GenericTestBase):
    """Tests normalization of typed objects."""

    def check_normalization(
            self, object_class, mappings, invalid_items_with_error_messages):
        """Test that values are normalized correctly.

        Args:
            object_class: child of BaseObject. The class whose normalize()
                method is to be tested.
            mappings: a list of 2-element tuples. The first element of
                each item is expected to be normalized to the second.
            invalid_items_with_error_messages: a list of values and
                corresponding error messages. Each of the value is expected to
                raise an Exception when normalized.
        """
        for item in mappings:
            assert object_class.normalize(item[0]) == item[1], (
                'Expected %s when normalizing %s as a %s, got %s' %
                (
                    item[1], item[0],
                    object_class.__name__, object_class.normalize(item[0]))
            )

        for item, error_msg in invalid_items_with_error_messages:
            with self.assertRaisesRegexp(Exception, error_msg):
                object_class.normalize(item)

    def test_boolean_validation(self):
        """Tests objects of type Boolean."""
        mappings = [('', False), (False, False), (True, True), (None, False)]
        invalid_values_with_error_messages = [
            ({}, r'Expected bool, received \{\}'),
            ([], r'Expected bool, received \[\]'),
            (['a'], r'Expected bool, received \[u\'a\'\]'),
            ('aabcc', r'Expected bool, received aabcc')]

        self.check_normalization(
            objects.Boolean, mappings, invalid_values_with_error_messages)

    def test_real_validation(self):
        """Tests objects of type Real."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0), (-1, -1),
                    ('-1', -1), (3.00, 3), (3.05, 3.05), ('3.05', 3.05), ]
        invalid_values_with_error_messages = [
            ('a', r'could not convert string to float: a'),
            ('', r'could not convert string to float: '),
            ({'a': 3}, r'float\(\) argument must be a string or a number'),
            ([3], r'float\(\) argument must be a string or a number'),
            (None, r'float\(\) argument must be a string or a number')]

        self.check_normalization(
            objects.Real, mappings, invalid_values_with_error_messages)

    def test_int_validation(self):
        """Tests objects of type Int."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0),
                    ('-1', -1), (-1, -1), (3.00, 3), (3.05, 3), ]
        invalid_values_with_error_messages = [
            ('a', r'invalid literal for int\(\) with base 10: \'a\''),
            ('', r'invalid literal for int\(\) with base 10: \'\''),
            (
                {'a': 3},
                r'int\(\) argument must be a string or a number, not \'dict\''),
            (
                [3],
                r'int\(\) argument must be a string or a number, not \'list\''),
            (
                None,
                r'int\(\) argument must be a string or a number, not '
                r'\'NoneType\'')]

        self.check_normalization(
            objects.Int, mappings, invalid_values_with_error_messages)

    def test_nonnegative_int_validation(self):
        """Tests objects of type NonnegativeInt."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0), (3.00, 3),
                    (3.05, 3), ]
        invalid_values_with_error_messages = [
            ('a', r'invalid literal for int\(\) with base 10: \'a\''),
            ('', r'invalid literal for int\(\) with base 10: \'\''),
            (
                {'a': 3},
                r'int\(\) argument must be a string or a number, not \'dict\''),
            (
                [3],
                r'int\(\) argument must be a string or a number, not \'list\''),
            (
                None,
                r'int\(\) argument must be a string or a number, not '
                r'\'NoneType\''),
            (
                -1,
                r'Validation failed: is_at_least \(\{u\'min_value\': 0\}\) '
                r'for object -1'),
            (
                '-1',
                r'Validation failed: is_at_least \(\{u\'min_value\': '
                r'0\}\) for object -1')]

        self.check_normalization(
            objects.NonnegativeInt, mappings,
            invalid_values_with_error_messages)

    def test_positive_int_validation(self):
        """Tests objects of type PositiveInt."""
        mappings = [(20, 20), ('20', 20), ('02', 2), (3.00, 3),
                    (3.05, 3), ]
        invalid_values_with_error_messages = [
            ('a', r'invalid literal for int\(\) with base 10: \'a\''),
            ('', r'invalid literal for int\(\) with base 10: \'\''),
            (
                {'a': 3},
                r'int\(\) argument must be a string or a number, not \'dict\''),
            (
                [3],
                r'int\(\) argument must be a string or a number, not \'list\''),
            (
                None,
                r'int\(\) argument must be a string or a number, not '
                r'\'NoneType\''),
            (
                -1,
                r'Validation failed: is_at_least \(\{u\'min_value\': 1\}\) '
                r'for object -1'),
            (
                '-1',
                r'Validation failed: is_at_least \(\{u\'min_value\': '
                r'1\}\) for object -1'),
            (
                0,
                r'Validation failed: is_at_least \(\{u\'min_value\': 1\}\) '
                r'for object 0'),
            (
                '0',
                r'Validation failed: is_at_least \(\{u\'min_value\': '
                r'1\}\) for object 0')]

        self.check_normalization(
            objects.PositiveInt, mappings, invalid_values_with_error_messages)

    def test_code_evaluation_validation(self):
        """Tests objects of type codeEvaluation."""
        mappings = [(
            {'code': 'a', 'output': '', 'evaluation': '', 'error': ''},
            {'code': 'a', 'output': '', 'evaluation': '', 'error': ''}
        ), (
            {'code': '', 'output': '', 'evaluation': '', 'error': 'e'},
            {'code': '', 'output': '', 'evaluation': '', 'error': 'e'}
        )]
        invalid_values_with_error_messages = [
            (
                {'code': '', 'output': '', 'evaluation': ''},
                r'Missing keys: \[u\'error\'\], Extra keys: \[\]'),
            ('a', 'Expected dict, received a'),
            ([], r'Expected dict, received \[\]'),
            (None, 'Expected dict, received None')
        ]

        self.check_normalization(
            objects.CodeEvaluation, mappings,
            invalid_values_with_error_messages)

    def test_coord_two_dim_validation(self):
        """Tests objects of type CoordTwoDim."""
        mappings = [([3.5, 1.3], [3.5, 1.3]), ([0, 1], [0, 1])]
        invalid_values_with_error_messages = [
            ('123', 'Expected list, received 123'),
            ('a', 'Expected list, received a'),
            ([0, 1, 2], 'Expected length of 2 got 3'),
            (None, 'Expected list, received None'),
            ('-1, 2.2', 'Expected list, received -1, 2.2'),
            (' -1 , 3.5', 'Expected list, received  -1 , 3.5')]
        self.check_normalization(
            objects.CoordTwoDim, mappings, invalid_values_with_error_messages)

    def test_list_validation(self):
        """Tests objects of type ListOfUnicodeString."""
        mappings = [(['b', 'a'], ['b', 'a']), ([], [])]
        invalid_values_with_error_messages = [
            ('123', 'Expected list, received 123'),
            ({'a': 1}, r'Expected list, received \{u\'a\': 1\}'),
            (3.0, 'Expected list, received 3.0'),
            (None, 'Expected list, received None'),
            ([3, 'a'], 'Expected unicode string, received 3'),
            ([1, 2, 1], 'Expected unicode string, received 1')]
        self.check_normalization(
            objects.ListOfUnicodeString, mappings,
            invalid_values_with_error_messages)

    def test_music_phrase(self):
        """Tests objects of type MusicPhrase."""
        mappings = [(
            [{'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
             {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}}],
            [{'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
             {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}}]
        ), (
            [{'readableNoteName': 'B4', 'noteDuration': {'num': 4, 'den': 1}},
             {'readableNoteName': 'E5', 'noteDuration': {'num': 4, 'den': 1}}],
            [{'readableNoteName': 'B4', 'noteDuration': {'num': 4, 'den': 1}},
             {'readableNoteName': 'E5', 'noteDuration': {'num': 4, 'den': 1}}]
        ), (
            [{'readableNoteName': 'C5', 'noteDuration': {'num': 3, 'den': 2}},
             {'readableNoteName': 'C4', 'noteDuration': {'num': 3, 'den': 2}}],
            [{'readableNoteName': 'C5', 'noteDuration': {'num': 3, 'den': 2}},
             {'readableNoteName': 'C4', 'noteDuration': {'num': 3, 'den': 2}}]
        )]
        invalid_values_with_error_messages = [
            ('G4', 'Expected list, received G4'),
            ({'n': 1}, r'Expected list, received \{u\'n\': 1\}'),
            (2.0, 'Expected list, received 2.0'),
            (None, 'Expected list, received None'),
            (
                {'readableNoteName': 'C5'},
                r'Expected list, received \{u\'readableNoteName\': u\'C5\'\}')]

        self.check_normalization(
            objects.MusicPhrase, mappings, invalid_values_with_error_messages)

    def test_list_of_tabs(self):
        """Tests objects of type ListOfDict."""
        mappings = [([
            {'content': '<p>Hello</p>', 'title': 'Tabs'},
            {'content': '<iframe src="site"></iframe>', 'title': u'¡Hola!'}
        ], [
            {'content': '<p>Hello</p>', 'title': u'Tabs'},
            {'content': '', 'title': u'¡Hola!'}
        ]), ([], [])]
        invalid_values_with_error_messages = [
            ('123', 'Expected list, received 123'),
            (3.0, 'Expected list, received 3.0'),
            (None, 'Expected list, received None'),
            ([3, 'a'], 'Expected dict, received 3'),
            (
                [{'content': '<p>abc</p>', 'url': 'xyx'}],
                r'Missing keys: \[u\'title\'\], Extra keys: \[u\'url\'\]'),
            (
                [{'content': '<p>abc</p>', 'title': 'xyz'}, [1, 2, 3]],
                r'Expected dict, received \[1, 2, 3\]')]
        self.check_normalization(
            objects.ListOfTabs, mappings, invalid_values_with_error_messages)

    def test_set_of_unicode_string_validation(self):
        """Tests objects of type SetOfUnicodeString."""
        mappings = [
            (['ff', 'a', u'¡Hola!'], [u'ff', u'a', u'¡Hola!']),
            ([], []),
            (['ab', 'abc', 'cb'], [u'ab', u'abc', u'cb']),
        ]
        invalid_values_with_error_messages = [
            ('123', 'Expected list, received 123'),
            ({'a': 1}, r'Expected list, received \{u\'a\': 1\}'),
            (3.0, 'Expected list, received 3.0'),
            (None, 'Expected list, received None'),
            ([3, 'a'], 'Expected unicode string, received 3'),
            (
                ['a', 'a', 'b'],
                r'Validation failed: is_uniquified \(\{\}\) '
                r'for object \[\'a\', \'a\', \'b\'\]'),
            (
                ['ab', 'abc', 'ab'],
                r'Validation failed: is_uniquified '
                r'\(\{\}\) for object \[\'ab\', \'abc\', \'ab\'\]')]

        self.check_normalization(
            objects.SetOfUnicodeString, mappings,
            invalid_values_with_error_messages)

    def test_unicode_string_validation(self):
        """Tests objects of type UnicodeString."""
        mappings = [
            ('Abc   def', u'Abc   def'), (u'¡Hola!', u'¡Hola!'),
        ]
        invalid_values_with_error_messages = [
            (3.0, 'Expected unicode string, received 3.0'),
            ({'a': 1}, r'Expected unicode string, received \{u\'a\': 1\}'),
            ([1, 2, 1], r'Expected unicode string, received \[1, 2, 1\]'),
            (None, 'Expected unicode string, received None')]

        self.check_normalization(
            objects.UnicodeString, mappings, invalid_values_with_error_messages)

    def test_html_validation(self):
        """Tests objects of type HTML."""
        # TODO(sll): Add more tests.
        mappings = [
            (
                '<p onclick="evil_function()">a paragraph</p>',
                '<p>a paragraph</p>'),
            ('<iframe src="evil-site"></iframe>', ''),
            (u'¡Hola!', u'¡Hola!'),
            (
                '<a href="evil-site">spam spam SPAM!</a>',
                '<a>spam spam SPAM!</a>'),
        ]
        invalid_values_with_error_messages = [
            ({'a': 1}, r'Expected unicode HTML string, received \{u\'a\': 1\}'),
            ([1, 2, 1], r'Expected unicode HTML string, received \[1, 2, 1\]'),
            (None, 'Expected unicode HTML string, received None')]

        self.check_normalization(
            objects.Html, mappings, invalid_values_with_error_messages)

    def test_normalized_string_validation(self):
        """Tests objects of type NormalizedString."""
        mappings = [
            ('Abc   def', u'Abc def'), (u'¡hola!', u'¡hola!')
        ]
        invalid_values_with_error_messages = [
            (3.0, 'Expected unicode string, received 3.0'),
            ({'a': 1}, r'Expected unicode string, received \{u\'a\': 1\}'),
            ([1, 2, 1], r'Expected unicode string, received \[1, 2, 1\]'),
            (None, 'Expected unicode string, received None')]

        self.check_normalization(
            objects.NormalizedString, mappings,
            invalid_values_with_error_messages)

    def test_math_latex_string_validation(self):
        """Tests objects of type MathExpressionContent."""
        mappings = [(
            {'raw_latex': '123456789', 'svg_filename': ''},
            {'raw_latex': u'123456789', 'svg_filename': u''}
        ), (
            {'raw_latex': u'x \\times y', 'svg_filename': u''},
            {'raw_latex': u'x \\times y', 'svg_filename': u''}
        )]
        invalid_values_with_error_messages = [
            (3.0, 'Expected dict, received 3.0'),
            (
                {'a': 1},
                r'Missing keys: \[u\'raw_latex\', u\'svg_filename\'\], '
                r'Extra keys: \[u\'a\'\]'),
            ([1, 2, 1], r'Expected dict, received \[1, 2, 1\]'),
            (None, 'Expected dict, received None'),
            (
                {'raw_latex': 1, 'svg_filename': 2},
                'Expected unicode string, received 1'),
            (
                {'raw_latex': ['x^2'], 'svg_filename':{}},
                r'Expected unicode string, received \[u\'x\^2\'\]'),
            (
                {'raw_latex': ('x', 'y'), 'svg_filename': ''},
                'not all arguments converted during string formatting')
        ]

        self.check_normalization(
            objects.MathExpressionContent, mappings,
            invalid_values_with_error_messages)

    def test_skill_id_string_validation(self):
        """Tests objects of type SkillSelector."""
        mappings = [
            ('skill_id', u'skill_id'), (u'abcdef123_', u'abcdef123_'),
        ]
        invalid_values_with_error_messages = [
            (3.0, 'Expected unicode string, received 3.0'),
            ({'a': 1}, r'Expected unicode string, received \{u\'a\': 1\}'),
            ([1, 2, 1], r'Expected unicode string, received \[1, 2, 1\]'),
            (None, 'Expected unicode string, received None')]

        self.check_normalization(
            objects.SkillSelector, mappings, invalid_values_with_error_messages)

    def test_sanitized_url_validation(self):
        mappings = [
            ('http://www.google.com', 'http://www.google.com'),
            ('https://www.google.com', 'https://www.google.com'),
            ('https://www.google!.com', 'https://www.google%21.com'),
        ]

        invalid_values_with_error_messages = [
            (u'http://¡Hola!.com', r'u\'\\xa1\''),
            (
                'javascript:alert(5);',
                r'Invalid URL: Sanitized URL should start with \'http://\' or '
                r'\'https://\'; received javascript:alert%285%29%3B'),
            (
                'ftp://gopher.com',
                r'Invalid URL: Sanitized URL should start with \'http://\' or '
                r'\'https://\'; received ftp://gopher.com'),
            (
                'test',
                r'Invalid URL: Sanitized URL should start with \'http://\' or '
                r'\'https://\'; received test'),
            (
                'google.com',
                r'Invalid URL: Sanitized URL should start with \'http://\' or '
                r'\'https://\'; received google.com')]

        self.check_normalization(
            objects.SanitizedUrl, mappings, invalid_values_with_error_messages)

    def test_checked_proof_validation(self):
        """Tests objects of type CheckedProof."""
        valid_example_1 = {
            'assumptions_string': 'p',
            'target_string': 'q',
            'proof_string': 'from p we have q',
            'correct': True
        }
        valid_example_2 = {
            'assumptions_string': 'p',
            'target_string': 'q',
            'proof_string': 'from p we have q',
            'correct': False,
            'error_category': 'layout',
            'error_code': 'bad_layout',
            'error_message': 'layout is bad',
            'error_line_number': 2
        }
        mappings = [
            (valid_example_1, valid_example_1),
            (valid_example_2, valid_example_2)]

        invalid_values_with_error_messages = [
            ({}, 'Cannot convert to checked proof {}'),
            (None, 'Cannot convert to checked proof None'),
            (
                {'assumptions_string': 'p'},
                r'Cannot convert to checked proof '
                r'{u\'assumptions_string\': u\'p\'}'),
            ({
                'assumptions_string': 'p',
                'target_string': 'q',
                'proof_string': 'from p we have q',
                'correct': False
            },
             r'Cannot convert to checked proof {u\'assumptions_string\': '
             r'u\'p\', u\'target_string\': u\'q\', u\'correct\': False, '
             r'u\'proof_string\': u\'from p we have q\'}')]

        self.check_normalization(
            objects.CheckedProof, mappings, invalid_values_with_error_messages)

    def test_logic_question_validation(self):
        """Tests objects of type LogicQuestion."""
        p_expression = {
            'top_kind_name': 'variable',
            'top_operator_name': 'p',
            'arguments': [],
            'dummies': []
        }

        valid_example = {
            'assumptions': [p_expression],
            'results': [p_expression],
            'default_proof_string': 'a proof'
        }
        mappings = [(valid_example, valid_example)]

        invalid_values_with_error_messages = [
            ({}, 'Cannot convert to a logic question {}'),
            (None, 'Cannot convert to a logic question None'),
            (
                {'assumptions': p_expression},
                'Cannot convert to a logic question'),
            ({
                'assumptions': p_expression,
                'results': {
                    'top_kind_name': 'variable',
                    'top_operator_name': 'p'
                }
            }, 'Cannot convert to a logic question')]

        self.check_normalization(
            objects.LogicQuestion, mappings, invalid_values_with_error_messages)

    def test_logic_error_category_validation(self):
        """Tests objects of type LogicErrorCategory."""

        mappings = [
            ('parsing', 'parsing'), ('typing', 'typing'),
            ('mistake', 'mistake')]

        invalid_values_with_error_messages = [
            (None, 'Expected unicode string, received None'),
            (2, 'Expected unicode string, received 2'),
            (
                'string',
                'Received string which is not in the allowed range of choices'),
            (
                'item',
                'Received item which is not in the allowed range of choices')]

        self.check_normalization(
            objects.LogicErrorCategory, mappings,
            invalid_values_with_error_messages)

    def test_graph(self):
        """Tests objects of type Graph."""
        empty_graph = {
            'vertices': [],
            'edges': [],
            'isLabeled': False,
            'isDirected': False,
            'isWeighted': False
        }
        cycle_5_graph = {
            'vertices': [
                {'x': 0.0, 'y': 10.0, 'label': ''},
                {'x': 50.0, 'y': 10.0, 'label': ''},
                {'x': 23.0, 'y': 31.0, 'label': ''},
                {'x': 14.0, 'y': 5.0, 'label': ''},
                {'x': 200.0, 'y': 1000.0, 'label': ''},
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 1, 'dst': 2, 'weight': 1},
                {'src': 2, 'dst': 3, 'weight': 1},
                {'src': 3, 'dst': 4, 'weight': 1},
                {'src': 4, 'dst': 0, 'weight': 1},
            ],
            'isLabeled': False,
            'isDirected': False,
            'isWeighted': False
        }

        mappings = [
            (empty_graph, empty_graph),
            (cycle_5_graph, cycle_5_graph),
        ]

        invalid_values_with_error_messages = [
            (None, 'Cannot convert to graph None'),
            (1, 'Cannot convert to graph 1'),
            ({}, 'Cannot convert to graph {}'),
            ('string', 'Cannot convert to graph string'),
            ({
                'vertices': [],
                'edges': []
            },
             r'Cannot convert to graph {u\'edges\': \[\], u\'vertices\':'
             r' \[\]}'),
            ({
                'vertices': [
                    {'x': 0.0, 'y': 0.0, 'label': ''},
                    {'x': 1.0, 'y': 1.0, 'label': ''}
                ],
                'edges': [
                    {'src': 0, 'dst': 1, 'weight': 1},
                    {'src': 1, 'dst': 0, 'weight': 1}
                ],
                'isLabeled': False,
                'isDirected': False,
                'isWeighted': False
            }, 'Cannot convert to graph'),
            ({
                'vertices': [
                    {'x': 0.0, 'y': 0.0, 'label': ''},
                    {'x': 1.0, 'y': 1.0, 'label': ''}
                ],
                'edges': [
                    {'src': 0, 'dst': 0, 'weight': 1},
                    {'src': 1, 'dst': 0, 'weight': 1}
                ],
                'isLabeled': False,
                'isDirected': False,
                'isWeighted': False
            }, 'Cannot convert to graph'),
            ({
                'vertices': [
                    {'x': 0.0, 'y': 0.0, 'label': ''},
                    {'x': 1.0, 'y': 1.0, 'label': 'ab'}
                ],
                'edges': [
                    {'src': 0, 'dst': 0, 'weight': 1},
                    {'src': 1, 'dst': 0, 'weight': 1}
                ],
                'isLabeled': False,
                'isDirected': False,
                'isWeighted': False
            }, 'Cannot convert to graph'),
            ({
                'vertices': [
                    {'x': 0.0, 'y': 0.0, 'label': ''},
                    {'x': 1.0, 'y': 1.0, 'label': ''}
                ],
                'edges': [
                    {'src': 0, 'dst': 0, 'weight': 1},
                    {'src': 1, 'dst': 0, 'weight': 2}
                ],
                'isLabeled': False,
                'isDirected': False,
                'isWeighted': False
            }, 'Cannot convert to graph')]

        self.check_normalization(
            objects.Graph, mappings, invalid_values_with_error_messages)

    def test_graph_property_validation(self):
        """Tests objects of type GraphProperty."""

        mappings = [
            ('acyclic', 'acyclic'), ('regular', 'regular'),
            ('strongly_connected', 'strongly_connected'),
            ('weakly_connected', 'weakly_connected')]

        invalid_values_with_error_messages = [
            (None, 'Expected unicode string, received None'),
            (2, 'Expected unicode string, received 2'),
            (
                'string',
                'Received string which is not in the allowed range of choices'),
            (
                'item',
                'Received item which is not in the allowed range of choices')]

        self.check_normalization(
            objects.GraphProperty, mappings, invalid_values_with_error_messages)

    def test_set_of_html_string(self):
        """Tests objects of the type StringList."""

        mappings = [(['abc', 'abb'], [u'abc', u'abb']), ([], [])]
        invalid_values_with_error_messages = [
            ('123', 'Expected list, received 123'),
            ({'a': 1}, r'Expected list, received \{u\'a\': 1\}'),
            (3.0, 'Expected list, received 3.0'),
            (None, 'Expected list, received None'),
            ([3, 'a'], 'Expected unicode HTML string, received 3'),
            ([1, 2, 1], 'Expected unicode HTML string, received 1')]
        self.check_normalization(
            objects.SetOfHtmlString, mappings,
            invalid_values_with_error_messages)

    def test_fraction(self):
        """Tests objects of type Fraction."""
        mappings = [(
            self._create_fraction_dict(True, 0, 0, 1),
            self._create_fraction_dict(True, 0, 0, 1)
        ), (
            self._create_fraction_dict(False, 1, 2, 3),
            self._create_fraction_dict(False, 1, 2, 3)
        )]

        invalid_values_with_error_messages = [
            (
                self._create_fraction_dict('non-boolean', 1, 2, 3),
                'Expected bool, received non-boolean'),
            (
                self._create_fraction_dict(True, 'non-int', 2, 3),
                r'invalid literal for int\(\) with base 10: \'non-int\''),
            (
                self._create_fraction_dict(None, None, None, None),
                'Expected bool, received None'),
            (
                self._create_fraction_dict(False, 10, 1, -3),
                r'Validation failed: is_at_least \({u\'min_value\': 1}\) '
                r'for object -3'),
            (
                self._create_fraction_dict(False, -10, 11, 3),
                r'Validation failed: is_at_least \({u\'min_value\': 0}\) '
                r'for object -10'),
            (
                self._create_fraction_dict(False, 10, -11, 3),
                r'Validation failed: is_at_least \({u\'min_value\': 0}\) '
                r'for object -11'),
            (
                self._create_fraction_dict(False, -10, -11, -3),
                r'Validation failed: is_at_least \({u\'min_value\': 0}\) '
                r'for object -10'),
            (
                self._create_fraction_dict(False, 1, 1, 0),
                r'Validation failed: is_at_least \({u\'min_value\': 1}\) '
                r'for object 0'),
            (
                {},
                r'Missing keys: \[u\'denominator\', u\'numerator\', '
                r'u\'wholeNumber\', u\'isNegative\'\], Extra keys: \[\]'),
            ('1/3', 'Expected dict, received 1/3'),
            (1, 'Expected dict, received 1')]

        self.check_normalization(
            objects.Fraction, mappings, invalid_values_with_error_messages)

    def _create_fraction_dict(
            self, is_negative, whole_number, numerator, denominator):
        """Returns the fraction object in the dict format.

        Args:
            is_negative: bool. Whether the given fraction is negative.
            whole_number: int. The whole number of the fraction.
            numerator: int. The numerator part of the fraction.
            denominator: int. The denominator part of the fraction.

        Returns:
            dict(str, *). The fraction object.
        """
        return {
            'isNegative': is_negative,
            'wholeNumber': whole_number,
            'numerator': numerator,
            'denominator': denominator
        }

    def test_position_of_terms_validation(self):
        """Tests objects of type PositionOfTerms."""

        mappings = [
            ('lhs', 'lhs'), ('rhs', 'rhs'), ('both', 'both'),
            ('irrelevant', 'irrelevant')]

        invalid_values_with_error_messages = [
            (None, 'Expected unicode string, received None'),
            (2, 'Expected unicode string, received 2'),
            (
                'string',
                'Received string which is not in the allowed range of choices'),
            (
                'item',
                'Received item which is not in the allowed range of choices')]

        self.check_normalization(
            objects.PositionOfTerms, mappings,
            invalid_values_with_error_messages)

    def test_algebraic_identifier_validation(self):
        """Tests objects of type AlgebraicIdentifier."""

        mappings = [('a', 'a'), ('alpha', 'alpha'), ('Z', 'Z')]

        invalid_values_with_error_messages = [
            (None, 'Expected unicode string, received None'),
            (2, 'Expected unicode string, received 2'),
            (
                'string',
                'Received string which is not in the allowed range of choices'),
            (
                'item',
                'Received item which is not in the allowed range of choices')]

        self.check_normalization(
            objects.AlgebraicIdentifier, mappings,
            invalid_values_with_error_messages)


class SchemaValidityTests(test_utils.GenericTestBase):

    def test_schemas_used_to_define_objects_are_valid(self):
        count = 0
        for _, member in inspect.getmembers(objects):
            if inspect.isclass(member):
                if hasattr(member, 'SCHEMA'):
                    schema_utils_test.validate_schema(member.SCHEMA)
                    count += 1

        self.assertEqual(count, 45)


class ObjectDefinitionTests(test_utils.GenericTestBase):

    def test_default_values_for_objects_are_valid(self):
        for _, member in inspect.getmembers(objects):
            if inspect.isclass(member) and member.default_value is not None:
                self.assertEqual(
                    member.normalize(member.default_value),
                    member.default_value)

                # Comparing types here is necessary because 0 == False in
                # Python. We handle the string case separately since Python
                # treats str and unicode as different types.
                type_error_message = (
                    'Mismatched default value types for object class %s' %
                    member.__name__)
                if isinstance(member.default_value, python_utils.BASESTRING):
                    self.assertIsInstance(
                        member.normalize(member.default_value),
                        python_utils.BASESTRING,
                        msg=type_error_message)
                else:
                    self.assertIsInstance(
                        member.normalize(member.default_value),
                        type(member.default_value),
                        msg=type_error_message)


class NormalizedRectangleTests(test_utils.GenericTestBase):

    def test_normalize(self):
        normalized_rectangle = objects.NormalizedRectangle2D()
        self.assertEqual(normalized_rectangle.normalize(
            [[0, 1], [1, 0]]), [[0.0, 0.0], [0.0, 0.0]])

        with self.assertRaisesRegexp(
            TypeError, 'Cannot convert to Normalized Rectangle '):
            normalized_rectangle.normalize('')


class CodeStringTests(test_utils.GenericTestBase):

    def test_normalize(self):
        code_string = objects.CodeString()
        self.assertEqual(code_string.normalize(code_string.default_value), '')

        with self.assertRaisesRegexp(
            TypeError, 'Unexpected tab characters in code string: \t'):
            code_string.normalize('\t')
