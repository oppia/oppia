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

import inspect

from core.tests import test_utils
from extensions.objects.models import objects
import schema_utils_test


class ObjectNormalizationUnitTests(test_utils.GenericTestBase):
    """Tests normalization of typed objects."""

    def check_normalization(self, object_class, mappings, invalid_items):
        """Test that values are normalized correctly.

        Args:
          object_class: the class whose normalize() method is to be tested.
          mappings: a list of 2-element tuples. The first element of
            each item is expected to be normalized to the second.
          invalid_items: a list of values. Each of these is expected to raise
            a TypeError when normalized.
        """
        for item in mappings:
            assert object_class.normalize(item[0]) == item[1], (
                'Expected %s when normalizing %s as a %s, got %s' %
                (
                    item[1], item[0],
                    object_class.__name__, object_class.normalize(item[0]))
            )

        for item in invalid_items:
            with self.assertRaises(Exception):
                object_class.normalize(item)

    def test_boolean_validation(self):
        """Tests objects of type Boolean."""
        mappings = [('', False), (False, False), (True, True), (None, False)]
        invalid_values = [{}, [], ['a'], 'aabcc']

        self.check_normalization(objects.Boolean, mappings, invalid_values)

    def test_real_validation(self):
        """Tests objects of type Real."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0), (-1, -1),
                    ('-1', -1), (3.00, 3), (3.05, 3.05), ('3.05', 3.05), ]
        invalid_values = ['a', '', {'a': 3}, [3], None]

        self.check_normalization(objects.Real, mappings, invalid_values)

    def test_int_validation(self):
        """Tests objects of type Int."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0),
                    ('-1', -1), (-1, -1), (3.00, 3), (3.05, 3), ]
        invalid_values = ['a', '', {'a': 3}, [3], None]

        self.check_normalization(objects.Int, mappings, invalid_values)

    def test_nonnegative_int_validation(self):
        """Tests objects of type NonnegativeInt."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0), (3.00, 3),
                    (3.05, 3), ]
        invalid_vals = ['a', '', {'a': 3}, [3], None, -1, '-1']

        self.check_normalization(
            objects.NonnegativeInt, mappings, invalid_vals)

    def test_positive_int_validation(self):
        """Tests objects of type PositiveInt."""
        mappings = [(20, 20), ('20', 20), ('02', 2), (3.00, 3),
                    (3.05, 3), ]
        invalid_vals = ['a', '', {'a': 3}, [3], None, -1, '-1', 0, '0']

        self.check_normalization(
            objects.PositiveInt, mappings, invalid_vals)

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
        mappings = [([3.5, 1.3], [3.5, 1.3]), ([0, 1], [0, 1])]
        invalid_values = ['123', 'a', [0, 1, 2], None, '-1, 2.2', ' -1 , 3.5']
        self.check_normalization(objects.CoordTwoDim, mappings, invalid_values)

    def test_list_validation(self):
        """Tests objects of type ListOfUnicodeString."""
        mappings = [(['b', 'a'], ['b', 'a']), ([], [])]
        invalid_values = ['123', {'a': 1}, 3.0, None, [3, 'a'], [1, 2, 1]]
        self.check_normalization(
            objects.ListOfUnicodeString, mappings, invalid_values)

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
        invalid_values = [
            'G4', {'n': 1}, 2.0, None, {'readableNoteName': 'C5'}]

        self.check_normalization(objects.MusicPhrase, mappings, invalid_values)

    def test_list_of_tabs(self):
        """Tests objects of type ListOfDict."""
        mappings = [([
            {'content': '<p>Hello</p>', 'title': 'Tabs'},
            {'content': '<iframe src="site"></iframe>', 'title': u'¡Hola!'}
        ], [
            {'content': '<p>Hello</p>', 'title': u'Tabs'},
            {'content': '', 'title': u'¡Hola!'}
        ]), ([], [])]
        invalid_values = [
            '123', 3.0, None, [3, 'a'],
            [{'content': '<p>abc</p>', 'url': 'xyx'}],
            [{'content': '<p>abc</p>', 'title': 'xyz'}, [1, 2, 3]]]
        self.check_normalization(
            objects.ListOfTabs, mappings, invalid_values)

    def test_set_of_unicode_string_validation(self):
        """Tests objects of type SetOfUnicodeString."""
        mappings = [
            (['ff', 'a', u'¡Hola!'], [u'ff', u'a', u'¡Hola!']),
            ([], []),
            (['ab', 'abc', 'cb'], [u'ab', u'abc', u'cb']),
        ]
        invalid_values = [
            '123', {'a': 1}, 3.0, None, [3, 'a'], ['a', 'a', 'b'],
            ['ab', 'abc', 'ab']]

        self.check_normalization(
            objects.SetOfUnicodeString, mappings, invalid_values)

    def test_unicode_string_validation(self):
        """Tests objects of type UnicodeString."""
        mappings = [
            ('Abc   def', u'Abc   def'), (u'¡Hola!', u'¡Hola!'),
        ]
        invalid_vals = [3.0, {'a': 1}, [1, 2, 1], None]

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
            ('Abc   def', u'Abc def'), (u'¡hola!', u'¡hola!')
        ]
        invalid_values = [3.0, {'a': 1}, [1, 2, 1], None]

        self.check_normalization(
            objects.NormalizedString, mappings, invalid_values)

    def test_math_latex_string_validation(self):
        """Tests objects of type MathLatexString."""
        mappings = [
            ('123456789', u'123456789'), (u'x \\times y', u'x \\times y'),
        ]
        invalid_vals = [3.0, {'a': 1}, [1, 2, 1], None]

        self.check_normalization(
            objects.MathLatexString, mappings, invalid_vals)

    def test_sanitized_url_validation(self):
        mappings = [
            ('http://www.google.com', 'http://www.google.com'),
            ('https://www.google.com', 'https://www.google.com'),
            ('https://www.google!.com', 'https://www.google%21.com'),
        ]

        invalid_vals = [
            u'http://¡Hola!.com',
            'javascript:alert(5);',
            'ftp://gopher.com',
            'test',
            'google.com']

        self.check_normalization(objects.SanitizedUrl, mappings, invalid_vals)

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

        invalid_values = [
            {}, None, {'assumptions_string': 'p'}, {
                'assumptions_string': 'p',
                'target_string': 'q',
                'proof_string': 'from p we have q',
                'correct': False
            }]

        self.check_normalization(
            objects.CheckedProof, mappings, invalid_values)

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

        invalid_values = [
            {}, None, {'assumptions': p_expression}, {
                'assumptions': p_expression,
                'results': {
                    'top_kind_name': 'variable',
                    'top_operator_name': 'p'
                }
            }]

        self.check_normalization(
            objects.LogicQuestion, mappings, invalid_values)

    def test_logic_error_category_validation(self):
        """Tests objects of type LogicErrorCategory."""

        mappings = [
            ('parsing', 'parsing'), ('typing', 'typing'),
            ('mistake', 'mistake')]

        invalid_values = [None, 2, 'string', 'item']

        self.check_normalization(
            objects.LogicErrorCategory, mappings, invalid_values)

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

        invalid_values = [None, 1, {}, 'string', {
            'vertices': [],
            'edges': []
        }, {
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
        }, {
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
        }, {
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
        }, {
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
        }]

        self.check_normalization(
            objects.Graph, mappings, invalid_values)

    def test_graph_property_validation(self):
        """Tests objects of type GraphProperty."""

        mappings = [
            ('acyclic', 'acyclic'), ('regular', 'regular'),
            ('strongly_connected', 'strongly_connected'),
            ('weakly_connected', 'weakly_connected')]

        invalid_values = [None, 2, 'string', 'item']

        self.check_normalization(
            objects.GraphProperty, mappings, invalid_values)

    def test_set_of_html_string(self):
        """Tests objects of the type StringList."""

        mappings = [(['abc', 'abb'], [u'abc', u'abb']), ([], [])]
        invalid_values = ['123', {'a': 1}, 3.0, None, [3, 'a'], [1, 2, 1]]
        self.check_normalization(
            objects.SetOfHtmlString, mappings, invalid_values)

    def test_fraction(self):
        """Tests objects of type Fraction."""
        mappings = [(
            self._create_fraction_dict(True, 0, 0, 1),
            self._create_fraction_dict(True, 0, 0, 1)
        ), (
            self._create_fraction_dict(False, 1, 2, 3),
            self._create_fraction_dict(False, 1, 2, 3)
        )]

        invalid_values = [self._create_fraction_dict('non-boolean', 1, 2, 3),
                          self._create_fraction_dict(True, 'non-int', 2, 3),
                          self._create_fraction_dict(None, None, None, None),
                          self._create_fraction_dict(False, 10, 1, -3),
                          self._create_fraction_dict(False, -10, 11, 3),
                          self._create_fraction_dict(False, 10, -11, 3),
                          self._create_fraction_dict(False, -10, -11, -3),
                          self._create_fraction_dict(False, 1, 1, 0),
                          {},
                          '1/3',
                          1]

        self.check_normalization(objects.Fraction, mappings, invalid_values)

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


class SchemaValidityTests(test_utils.GenericTestBase):

    def test_schemas_used_to_define_objects_are_valid(self):
        count = 0
        for _, member in inspect.getmembers(objects):
            if inspect.isclass(member):
                if hasattr(member, 'SCHEMA'):
                    schema_utils_test.validate_schema(member.SCHEMA)
                    count += 1

        self.assertEqual(count, 38)


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
                if isinstance(member.default_value, basestring):
                    self.assertIsInstance(
                        member.normalize(member.default_value), basestring,
                        msg=type_error_message)
                else:
                    self.assertIsInstance(
                        member.normalize(member.default_value),
                        type(member.default_value),
                        msg=type_error_message)
