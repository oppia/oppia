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

from __future__ import annotations

import inspect
import json
import re

from core import schema_utils_test
from core.tests import test_utils
from extensions.objects.models import objects

from typing import Any, Dict, List, Sequence, Tuple, Type, Union

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class ObjectNormalizationUnitTests(test_utils.GenericTestBase):
    """Tests normalization of typed objects."""

    # Here we use type Any because here we are providing different types of
    # tuples for testing purposes.
    def check_normalization(
        self,
        object_class: Type[objects.BaseObject],
        mappings: Sequence[Tuple[Any, Any]],
        invalid_items_with_error_messages: List[Tuple[Any, str]]
    ) -> None:
        """Test that values are normalized correctly.

        Args:
            object_class: object(BaseObject). The class whose normalize()
                method is to be tested.
            mappings: list(tuple(*, *)). The first element of
                each item is expected to be normalized to the second.
            invalid_items_with_error_messages: list(tuple(*, str)). A list of
                values and corresponding error messages. Each of the value is
                expected to raise an Exception when normalized.
        """
        for item in mappings:
            assert object_class.normalize(item[0]) == item[1], (
                'Expected %s when normalizing %s as a %s, got %s' %
                (
                    item[1], item[0],
                    object_class.__name__, object_class.normalize(item[0]))
            )

        for item, error_msg in invalid_items_with_error_messages:
            with self.assertRaisesRegex(Exception, error_msg):
                object_class.normalize(item)

    def test_boolean_validation(self) -> None:
        """Tests objects of type Boolean."""
        mappings = [('', False), (False, False), (True, True), (None, False)]
        invalid_values_with_error_messages = [
            ({}, re.escape('Expected bool, received {}')),
            ([], re.escape('Expected bool, received []')),
            (['a'], re.escape('Expected bool, received [\'a\']')),
            ('aabcc', 'Expected bool, received aabcc')]

        self.check_normalization(
            objects.Boolean, mappings, invalid_values_with_error_messages)

    def test_real_validation(self) -> None:
        """Tests objects of type Real."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0), (-1, -1),
                    ('-1', -1), (3.00, 3), (3.05, 3.05), ('3.05', 3.05), ]
        invalid_values_with_error_messages = [
            ('a', 'Could not convert str to float: a'),
            ('', 'Could not convert str to float: '),
            (
                {'a': 3},
                re.escape('Could not convert dict to float: {\'a\': 3}')
            ),
            ([3], re.escape('Could not convert list to float: [3]')),
            (None, 'Could not convert NoneType to float: None')
        ]

        self.check_normalization(
            objects.Real, mappings, invalid_values_with_error_messages)

    def test_int_validation(self) -> None:
        """Tests objects of type Int."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0),
                    ('-1', -1), (-1, -1), (3.00, 3), (3.05, 3), ]
        invalid_values_with_error_messages = [
            ('a', 'Could not convert str to int: a'),
            ('', 'Could not convert str to int: '),
            (
                {'a': 3},
                re.escape('Could not convert dict to int: {\'a\': 3}')
            ),
            ([3], re.escape('Could not convert list to int: [3]')),
            (None, 'Could not convert NoneType to int: None')
        ]

        self.check_normalization(
            objects.Int, mappings, invalid_values_with_error_messages)

    def test_nonnegative_int_validation(self) -> None:
        """Tests objects of type NonnegativeInt."""
        mappings = [(20, 20), ('20', 20), ('02', 2), ('0', 0), (3.00, 3),
                    (3.05, 3), ]
        invalid_values_with_error_messages = [
            ('a', 'Could not convert str to int: a'),
            ('', 'Could not convert str to int: '),
            (
                {'a': 3},
                re.escape('Could not convert dict to int: {\'a\': 3}')
            ),
            (
                [3],
                re.escape('Could not convert list to int: [3]')
            ),
            (
                None,
                'Could not convert NoneType to int: None'
            ),
            (
                -1,
                re.escape(
                    'Validation failed: is_at_least ({\'min_value\': 0}) '
                    'for object -1'
                )
            ),
            (
                '-1',
                re.escape(
                    'Validation failed: is_at_least ({\'min_value\': 0}) '
                    'for object -1'
                )
            )
        ]

        self.check_normalization(
            objects.NonnegativeInt, mappings,
            invalid_values_with_error_messages)

    def test_positive_int_validation(self) -> None:
        """Tests objects of type PositiveInt."""
        mappings = [(20, 20), ('20', 20), ('02', 2), (3.00, 3),
                    (3.05, 3), ]
        invalid_values_with_error_messages = [
            ('a', 'Could not convert str to int: a'),
            ('', 'Could not convert str to int: '),
            (
                {'a': 3},
                re.escape('Could not convert dict to int: {\'a\': 3}')
            ),
            (
                [3],
                re.escape('Could not convert list to int: [3]')
            ),
            (
                None,
                'Could not convert NoneType to int: None'),
            (
                -1,
                re.escape(
                    'Validation failed: is_at_least ({\'min_value\': 1}) '
                    'for object -1'
                )
            ),
            (
                '-1',
                re.escape(
                    'Validation failed: is_at_least ({\'min_value\': 1}) '
                    'for object -1'
                )
            ),
            (
                0,
                re.escape(
                    'Validation failed: is_at_least ({\'min_value\': 1}) '
                    'for object 0'
                )
            ),
            (
                '0',
                re.escape(
                    'Validation failed: is_at_least ({\'min_value\': 1}) '
                    'for object 0'
                )
            )
        ]

        self.check_normalization(
            objects.PositiveInt, mappings, invalid_values_with_error_messages)

    def test_code_evaluation_validation(self) -> None:
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
                re.escape('Missing keys: [\'error\'], Extra keys: []')
            ),
            ('a', 'Expected dict, received a'),
            ([], re.escape('Expected dict, received []')),
            (None, 'Expected dict, received None')
        ]

        self.check_normalization(
            objects.CodeEvaluation, mappings,
            invalid_values_with_error_messages)

    def test_coord_two_dim_validation(self) -> None:
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

    def test_list_validation(self) -> None:
        """Tests objects of type ListOfUnicodeString."""
        mappings = [(['b', 'a'], ['b', 'a']), ([], [])]
        invalid_values_with_error_messages = [
            ('123', 'Expected list, received 123'),
            ({'a': 1}, re.escape('Expected list, received {\'a\': 1}')),
            (3.0, 'Expected list, received 3.0'),
            (None, 'Expected list, received None'),
            ([3, 'a'], 'Expected unicode string, received 3'),
            ([1, 2, 1], 'Expected unicode string, received 1')
        ]
        self.check_normalization(
            objects.ListOfUnicodeString, mappings,
            invalid_values_with_error_messages)

    def test_music_phrase(self) -> None:
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
            ({'n': 1}, re.escape('Expected list, received {\'n\': 1}')),
            (2.0, 'Expected list, received 2.0'),
            (None, 'Expected list, received None'),
            (
                {'readableNoteName': 'C5'},
                re.escape(
                    'Expected list, received {\'readableNoteName\': \'C5\'}'
                )
            )
        ]

        self.check_normalization(
            objects.MusicPhrase, mappings, invalid_values_with_error_messages)

    def test_list_of_tabs(self) -> None:
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
                re.escape('Missing keys: [\'title\'], Extra keys: [\'url\']')
            ),
            (
                [{'content': '<p>abc</p>', 'title': 'xyz'}, [1, 2, 3]],
                re.escape('Expected dict, received [1, 2, 3]')
            )
        ]
        self.check_normalization(
            objects.ListOfTabs, mappings, invalid_values_with_error_messages)

    def test_set_of_unicode_string_validation(self) -> None:
        """Tests objects of type SetOfUnicodeString."""
        mappings = [
            (['ff', 'a', u'¡Hola!'], [u'ff', u'a', u'¡Hola!']),
            ([], []),
            (['ab', 'abc', 'cb'], [u'ab', u'abc', u'cb']),
        ]
        invalid_values_with_error_messages = [
            ('123', 'Expected list, received 123'),
            ({'a': 1}, re.escape('Expected list, received {\'a\': 1}')),
            (3.0, 'Expected list, received 3.0'),
            (None, 'Expected list, received None'),
            ([3, 'a'], 'Expected unicode string, received 3'),
            (
                ['a', 'a', 'b'],
                re.escape(
                    'Validation failed: is_uniquified ({}) '
                    'for object [\'a\', \'a\', \'b\']'
                )
            ),
            (
                ['ab', 'abc', 'ab'],
                re.escape(
                    'Validation failed: is_uniquified ({}) '
                    'for object [\'ab\', \'abc\', \'ab\']'
                )
            )
        ]

        self.check_normalization(
            objects.SetOfUnicodeString, mappings,
            invalid_values_with_error_messages)

    def test_unicode_string_validation(self) -> None:
        """Tests objects of type UnicodeString."""
        mappings = [
            ('Abc   def', u'Abc   def'), (u'¡Hola!', u'¡Hola!'),
        ]
        invalid_values_with_error_messages = [
            (3.0, 'Expected unicode string, received 3.0'),
            (
                {'a': 1},
                re.escape('Expected unicode string, received {\'a\': 1}')
            ),
            (
                [1, 2, 1],
                re.escape('Expected unicode string, received [1, 2, 1]')
            ),
            (None, 'Expected unicode string, received None')]

        self.check_normalization(
            objects.UnicodeString, mappings, invalid_values_with_error_messages)

    def test_html_validation(self) -> None:
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
            (
                {'a': 1},
                re.escape('Expected unicode HTML string, received {\'a\': 1}')
            ),
            (
                [1, 2, 1],
                re.escape('Expected unicode HTML string, received [1, 2, 1]')
            ),
            (None, 'Expected unicode HTML string, received None')]

        self.check_normalization(
            objects.Html, mappings, invalid_values_with_error_messages)

    def test_normalized_string_validation(self) -> None:
        """Tests objects of type NormalizedString."""
        mappings = [
            ('Abc   def', u'Abc def'), (u'¡hola!', u'¡hola!')
        ]
        invalid_values_with_error_messages = [
            (3.0, 'Expected unicode string, received 3.0'),
            (
                {'a': 1},
                re.escape('Expected unicode string, received {\'a\': 1}')
            ),
            (
                [1, 2, 1],
                re.escape('Expected unicode string, received [1, 2, 1]')
            ),
            (None, 'Expected unicode string, received None')]

        self.check_normalization(
            objects.NormalizedString, mappings,
            invalid_values_with_error_messages)

    def test_math_latex_string_validation(self) -> None:
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
                re.escape(
                    'Missing keys: [\'raw_latex\', \'svg_filename\'], '
                    'Extra keys: [\'a\']'
                )
            ),
            ([1, 2, 1], re.escape('Expected dict, received [1, 2, 1]')),
            (None, 'Expected dict, received None'),
            (
                {'raw_latex': 1, 'svg_filename': 2},
                'Expected unicode string, received 1'
            ),
            (
                {'raw_latex': ['x^2'], 'svg_filename':{}},
                re.escape('Expected unicode string, received [\'x^2\']')
            ),
            (
                {'raw_latex': ('x', 'y'), 'svg_filename': ''},
                'not all arguments converted during string formatting'
            )
        ]

        self.check_normalization(
            objects.MathExpressionContent, mappings,
            invalid_values_with_error_messages
        )

    def test_skill_id_string_validation(self) -> None:
        """Tests objects of type SkillSelector."""
        mappings = [
            ('skill_id', u'skill_id'), (u'abcdef123_', u'abcdef123_'),
        ]
        invalid_values_with_error_messages = [
            (3.0, 'Expected unicode string, received 3.0'),
            (
                {'a': 1},
                re.escape('Expected unicode string, received {\'a\': 1}')
            ),
            (
                [1, 2, 1],
                re.escape('Expected unicode string, received [1, 2, 1]')
            ),
            (None, 'Expected unicode string, received None')]

        self.check_normalization(
            objects.SkillSelector, mappings, invalid_values_with_error_messages)

    def test_sanitized_url_validation(self) -> None:
        mappings = [
            ('http://www.google.com', 'http://www.google.com'),
            ('https://www.google.com', 'https://www.google.com'),
            ('https://www.google!.com', 'https://www.google%21.com'),
        ]

        invalid_values_with_error_messages = [
            (
                'javascript:alert(5);',
                re.escape(
                    'Invalid URL: Sanitized URL should start with \'http://\' '
                    'or \'https://\'; received javascript:alert%285%29%3B'
                )
            ),
            (
                'ftp://gopher.com',
                re.escape(
                    'Invalid URL: Sanitized URL should start with \'http://\' '
                    'or \'https://\'; received ftp://gopher.com'
                )
            ),
            (
                'test',
                re.escape(
                    'Invalid URL: Sanitized URL should start with \'http://\' '
                    'or \'https://\'; received test'
                )
            ),
            (
                'google.com',
                re.escape(
                    'Invalid URL: Sanitized URL should start with \'http://\' '
                    'or \'https://\'; received google.com'
                )
            )
        ]

        self.check_normalization(
            objects.SanitizedUrl, mappings, invalid_values_with_error_messages)

    def test_checked_proof_validation(self) -> None:
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

        invalid_values_with_error_messages: List[Tuple[
            Union[None, Dict[str, Union[str, bool]]], str
        ]] = [
            ({}, 'Cannot convert to checked proof {}'),
            (None, 'Cannot convert to checked proof None'),
            (
                {'assumptions_string': 'p'},
                re.escape(
                    'Cannot convert to checked proof '
                    '{\'assumptions_string\': \'p\'}'
                )
            ),
            (
                {
                    'assumptions_string': 'p',
                    'target_string': 'q',
                    'proof_string': 'from p we have q',
                    'correct': False
                },
                re.escape(
                    'Cannot convert to checked proof {\'assumptions_string\': '
                    '\'p\', \'target_string\': \'q\', \'proof_string\': '
                    '\'from p we have q\', \'correct\': False}'
                )
            )
        ]

        self.check_normalization(
            objects.CheckedProof, mappings, invalid_values_with_error_messages)

    def test_graph(self) -> None:
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
        directed_graph = {
            'vertices': [
                {'x': 0.0, 'y': 10.0, 'label': ''},
                {'x': 50.0, 'y': 10.0, 'label': ''},
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 1, 'dst': 0, 'weight': 1},
            ],
            'isLabeled': False,
            'isDirected': True,
            'isWeighted': False
        }
        weighted_labeled_graph = {
            'vertices': [
                {'x': 0.0, 'y': 10.0, 'label': 'vertex1'},
                {'x': 50.0, 'y': 10.0, 'label': 'vertex2'},
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 1, 'dst': 0, 'weight': 1},
            ],
            'isLabeled': True,
            'isDirected': True,
            'isWeighted': True
        }

        mappings = [
            (empty_graph, empty_graph),
            (cycle_5_graph, cycle_5_graph),
            (directed_graph, directed_graph),
            (weighted_labeled_graph, weighted_labeled_graph)
        ]

        invalid_values_with_error_messages: List[Tuple[
            Union[None, int, str, Dict[str, List[str]], domain.GraphDict],
            str
        ]] = [
            (None, 'Cannot convert to graph None'),
            (1, 'Cannot convert to graph 1'),
            ({}, 'Cannot convert to graph {}'),
            ('string', 'Cannot convert to graph string'),
            (
                {
                    'vertices': [],
                    'edges': []
                },
                re.escape(
                    'Cannot convert to graph {\'vertices\': [], \'edges\': []}'
                )
            ),
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

    def test_graph_property_validation(self) -> None:
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

    def test_fraction(self) -> None:
        """Tests objects of type Fraction."""
        mappings = [(
            self._create_fraction_dict(True, 0, 0, 1),
            self._create_fraction_dict(True, 0, 0, 1)
        ), (
            self._create_fraction_dict(False, 1, 2, 3),
            self._create_fraction_dict(False, 1, 2, 3)
        )]

        invalid_values_with_error_messages = [
            # TODO(#13059): Here we use MyPy ignore because after we fully type
            # the codebase we plan to get rid of the tests that intentionally
            # test wrong inputs that we can normally catch by typing.
            (
                self._create_fraction_dict('non-boolean', 1, 2, 3),  # type: ignore[arg-type]
                'Expected bool, received non-boolean'),
            # TODO(#13059): Here we use MyPy ignore because after we fully type
            # the codebase we plan to get rid of the tests that intentionally
            # test wrong inputs that we can normally catch by typing.
            (
                self._create_fraction_dict(True, 'non-int', 2, 3),  # type: ignore[arg-type]
                'Could not convert str to int: non-int'),
            # TODO(#13059): Here we use MyPy ignore because after we fully type
            # the codebase we plan to get rid of the tests that intentionally
            # test wrong inputs that we can normally catch by typing.
            (
                self._create_fraction_dict(None, None, None, None),  # type: ignore[arg-type]
                'Expected bool, received None'),
            (
                self._create_fraction_dict(False, 10, 1, -3),
                re.escape(
                    'Validation failed: is_at_least ({\'min_value\': 1}) '
                    'for object -3'
                )
            ),
            (
                self._create_fraction_dict(False, -10, 11, 3),
                re.escape(
                    'Validation failed: is_at_least ({\'min_value\': 0}) '
                    'for object -10'
                )
            ),
            (
                self._create_fraction_dict(False, 10, -11, 3),
                re.escape(
                    'Validation failed: is_at_least ({\'min_value\': 0}) '
                    'for object -11'
                )
            ),
            (
                self._create_fraction_dict(False, -10, -11, -3),
                re.escape(
                    'Validation failed: is_at_least ({\'min_value\': 0}) '
                    'for object -10'
                )
            ),
            (
                self._create_fraction_dict(False, 1, 1, 0),
                re.escape(
                    'Validation failed: is_at_least ({\'min_value\': 1}) '
                    'for object 0'
                )
            ),
            (
                {},
                re.escape(
                    'Missing keys: [\'denominator\', \'isNegative\', '
                    '\'numerator\', \'wholeNumber\'], Extra keys: []'
                )
            ),
            ('1/3', 'Expected dict, received 1/3'),
            (1, 'Expected dict, received 1')]

        self.check_normalization(
            objects.Fraction, mappings, invalid_values_with_error_messages)

    def _create_fraction_dict(
        self,
        is_negative: bool,
        whole_number: int,
        numerator: int,
        denominator: int
    ) -> objects.FractionDict:
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

    def test_position_of_terms_validation(self) -> None:
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

    def test_algebraic_identifier_validation(self) -> None:
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

    def test_ratio_validation(self) -> None:
        """Tests objects of type RatioExpression."""

        mappings = [([1, 2], [1, 2]), ([1, 2, 3], [1, 2, 3])]

        invalid_values_with_error_messages = [
            (None, 'Expected list, received None'),
            (2, 'Expected list, received 2'),
            ({'a': 1}, re.escape('Expected list, received {\'a\': 1}')),
            ('1: 2: 1', re.escape('Expected list, received 1: 2: 1'))]

        self.check_normalization(
            objects.RatioExpression, mappings,
            invalid_values_with_error_messages)

    def test_set_of_algebraic_identifier_validation(self) -> None:
        """Tests objects of type SetOfAlgebraicIdentifier."""

        mappings = [
            (['a', 'b', 'gamma'], ['a', 'b', 'gamma']),
            (['alpha', 'x', 'Pi'], ['alpha', 'x', 'Pi']),
            (['x', 'Y', 'z'], ['x', 'Y', 'z'])]

        invalid_values_with_error_messages = [
            ('123', 'Expected list, received 123'),
            ({'a': 1}, re.escape('Expected list, received {\'a\': 1}')),
            (3.0, 'Expected list, received 3.0'),
            (None, 'Expected list, received None'),
            ([3, 'a'], 'Expected unicode string, received 3'),
            (
                ['a', 'a', 'b'],
                re.escape(
                    'Validation failed: is_uniquified ({}) '
                    'for object [\'a\', \'a\', \'b\']'
                )
            ),
            (
                ['a', 'invalid_identifier', 'b'],
                'Received invalid_identifier which is not in the allowed '
                'range of choices'
            )
        ]

        self.check_normalization(
            objects.SetOfAlgebraicIdentifier, mappings,
            invalid_values_with_error_messages)


class SchemaValidityTests(test_utils.GenericTestBase):

    def test_schemas_used_to_define_objects_are_valid(self) -> None:
        count = 0
        for name, member in inspect.getmembers(objects):
            if inspect.isclass(member):
                # Since BaseTranslatableObject acts as an interface, it will
                # throw an NotImplementedError exception on get_schema().
                if name == 'BaseTranslatableObject':
                    continue

                if hasattr(member, 'get_schema'):
                    # Here we are excluding all the classes where get_schema
                    # is no implemented, because accessing get_schema() method
                    # on these classes will throw an NotImplementedError
                    # exception.
                    try:
                        schema_utils_test.validate_schema(member.get_schema())
                    except NotImplementedError:
                        continue
                    else:
                        count += 1

        self.assertEqual(count, 53)

    def test_get_schema_method_raises_error_in_base_object(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'The get_schema() method is missing from the derived class. It '
                'should be implemented in the derived class.'
            )
        ):
            objects.BaseObject.get_schema()


class ObjectDefinitionTests(test_utils.GenericTestBase):

    def test_default_values_for_objects_are_valid(self) -> None:
        for _, member in inspect.getmembers(objects):
            if inspect.isclass(member) and member.default_value is not None:
                if member.__name__ == 'BaseTranslatableObject':
                    continue

                if isinstance(member(), objects.BaseTranslatableObject):
                    self.assertIsInstance(member.default_value, dict)
                    self.assertEqual(len(member.default_value.keys()), 2)
                    # We need to check the protected property in order to avoid
                    # skew between it and the key that is used in the default
                    # value.
                    self.assertEqual(
                        sorted(['contentId', member._value_key_name]),  # pylint: disable=protected-access
                        sorted(member.default_value.keys()))
                    self.assertIsNone(member.default_value['contentId'])

                    # If the object is a subclass of BaseTranslatableObject,
                    # the default content_id would be None but the
                    # normalization will enforce a non-None string. This is
                    # because the content id is populated before being saved.
                    # So we do the same here.
                    actual_default_value = member.default_value
                    actual_default_value['contentId'] = 'content_id'
                    normalized_default_value = member.normalize(
                        actual_default_value)
                    self.assertIsInstance(normalized_default_value, dict)
                    self.assertEqual(
                        normalized_default_value, actual_default_value)
                else:
                    self.assertEqual(
                        member.normalize(member.default_value),
                        member.default_value)

                    type_error_message = (
                        'Mismatched default value types for object class %s' %
                        member.__name__)

                    # Comparing types here is necessary because 0 == False in
                    # Python. We handle the string case separately since Python
                    # treats str and unicode as different types.
                    if isinstance(member.default_value, str):
                        self.assertIsInstance(
                            member.normalize(member.default_value),
                            str, msg=type_error_message)
                    else:
                        self.assertIsInstance(
                            member.normalize(member.default_value),
                            type(member.default_value),
                            msg=type_error_message)


class NormalizedRectangleTests(test_utils.GenericTestBase):

    def test_normalize(self) -> None:
        normalized_rectangle = objects.NormalizedRectangle2D()
        self.assertEqual(normalized_rectangle.normalize(
            [[0, 1], [1, 0]]), [[0.0, 0.0], [0.0, 0.0]])

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            TypeError, 'Cannot convert to Normalized Rectangle '):
            normalized_rectangle.normalize('')  # type: ignore[arg-type]


class CodeStringTests(test_utils.GenericTestBase):

    def test_normalize(self) -> None:
        code_string = objects.CodeString()
        self.assertEqual(code_string.normalize(code_string.default_value), '')

        with self.assertRaisesRegex(
            TypeError, 'Unexpected tab characters in code string: \t'):
            code_string.normalize('\t')


class BaseTranslatableObjectTests(test_utils.GenericTestBase):

    def test_translatable_objects_naming(self) -> None:
        for name, member in inspect.getmembers(objects):
            if not inspect.isclass(member):
                continue

            # Assert that BaseTranslatableObject subclasses start with
            # 'Translatable'. All objects that start with 'Translatable'
            # subclass BaseTranslatableObject, with the exception of any object
            # name that contains 'ContentId' (e.g. TranslatableHtmlContentId).
            if isinstance(member(), objects.BaseTranslatableObject):
                if name == 'BaseTranslatableObject':
                    continue
                self.assertEqual(name.find('Translatable'), 0)
            elif 'ContentId' not in name:
                self.assertNotIn('Translatable', name)

    def test_abstract_base_class_raises_not_implemented_error(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'The _value_key_name and _value_schema for this class must both '
            'be set'):
            objects.BaseTranslatableObject.get_schema()

        with self.swap(objects.BaseTranslatableObject, '_value_key_name', 'a'):
            with self.assertRaisesRegex(
                NotImplementedError,
                'The _value_key_name and _value_schema for this class must '
                'both be set'):
                objects.BaseTranslatableObject.normalize({
                    'contentId': 'rule_input',
                    'a': 'thing to translate'
                })

    def test_base_translatable_object_normalization(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'The _value_key_name and _value_schema for this class must both '
            'be set'):
            objects.BaseTranslatableObject.normalize({
                'contentId': 5
            })

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            NotImplementedError,
            'The _value_key_name and _value_schema for this class must both '
            'be set'):
            objects.BaseTranslatableObject.normalize_value(5)  # type: ignore[arg-type]


class TranslatableUnicodeStringTests(test_utils.GenericTestBase):

    def test_normalization(self) -> None:
        with self.assertRaisesRegex(
            AssertionError, 'Expected unicode string, received 5'):
            objects.TranslatableUnicodeString.normalize({
                'contentId': 'rule_input',
                'unicodeStr': 5
            })

        with self.assertRaisesRegex(
            AssertionError,
            re.escape('Expected unicode string, received [\'abc\']')
        ):
            objects.TranslatableUnicodeString.normalize({
                'contentId': 'rule_input',
                'unicodeStr': ['abc']
            })

        self.assertEqual(objects.TranslatableUnicodeString.normalize({
            'contentId': 'rule_input',
            'unicodeStr': 'abc'
        }), {
            'contentId': 'rule_input',
            'unicodeStr': 'abc'
        })

    def test_normalize_value(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
                AssertionError, 'Expected unicode string, received 5'):
            objects.TranslatableUnicodeString.normalize_value(5)  # type: ignore[arg-type]

        with self.assertRaisesRegex(
            AssertionError,
            re.escape('Expected unicode string, received [\'abc\']')
        ):
            objects.TranslatableUnicodeString.normalize_value(['abc'])

        self.assertEqual(
            objects.TranslatableUnicodeString.normalize_value('abc'), 'abc')


class TranslatableHtmlTests(test_utils.GenericTestBase):

    def test_normalization(self) -> None:
        with self.assertRaisesRegex(AssertionError, 'Expected unicode HTML'):
            objects.TranslatableHtml.normalize({
                'contentId': 'rule_input',
                'html': 5
            })

        with self.assertRaisesRegex(AssertionError, 'Expected unicode HTML'):
            objects.TranslatableHtml.normalize({
                'contentId': 'rule_input',
                'html': ['abc']
            })

        self.assertEqual(objects.TranslatableHtml.normalize({
            'contentId': 'rule_input',
            'html': '<b>This is bold text.</b>'
        }), {
            'contentId': 'rule_input',
            'html': '<b>This is bold text.</b>'
        })

        self.assertEqual(objects.TranslatableHtml.normalize({
            'contentId': 'rule_input',
            'html': '<script>a'
        }), {
            'contentId': 'rule_input',
            'html': 'a'
        })

        self.assertEqual(objects.TranslatableHtml.normalize({
            'contentId': 'rule_input',
            'html': 'good<script src="http://evil.com">text</script>'
        }), {
            'contentId': 'rule_input',
            'html': 'goodtext'
        })

    def test_normalize_value(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(AssertionError, 'Expected unicode HTML'):
            objects.TranslatableHtml.normalize_value(5)  # type: ignore[arg-type]

        with self.assertRaisesRegex(AssertionError, 'Expected unicode HTML'):
            objects.TranslatableHtml.normalize_value(['abc'])

        with self.assertRaisesRegex(
            AssertionError,
            re.escape('Expected unicode string, received [\'abc\']')
        ):
            objects.TranslatableUnicodeString.normalize_value(['abc'])

        self.assertEqual(
            objects.TranslatableHtml.normalize_value(
                '<b>This is bold text.</b>'),
            '<b>This is bold text.</b>')

        self.assertEqual(
            objects.TranslatableHtml.normalize_value('<script>a'), 'a')

        self.assertEqual(
            objects.TranslatableHtml.normalize_value(
                'good<script src="http://evil.com">text</script>'
            ),
            'goodtext'
        )


class TranslatableSetOfNormalizedStringTests(test_utils.GenericTestBase):

    def test_normalization(self) -> None:
        with self.assertRaisesRegex(
            AssertionError, 'Expected list, received 5'):
            objects.TranslatableSetOfNormalizedString.normalize({
                'contentId': 'rule_input',
                'normalizedStrSet': 5
            })

        with self.assertRaisesRegex(
            AssertionError, 'Expected unicode string, received 2'):
            objects.TranslatableSetOfNormalizedString.normalize({
                'contentId': 'rule_input',
                'normalizedStrSet': ['1', 2, '3']
            })

        with self.assertRaisesRegex(
            AssertionError, 'Validation failed: is_uniquified'):
            objects.TranslatableSetOfNormalizedString.normalize({
                'contentId': 'rule_input',
                'normalizedStrSet': ['1', '1']
            })

        self.assertEqual(objects.TranslatableSetOfNormalizedString.normalize({
            'contentId': 'rule_input',
            'normalizedStrSet': ['1', '2']
        }), {
            'contentId': 'rule_input',
            'normalizedStrSet': ['1', '2']
        })

    def test_normalize_value(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            AssertionError, 'Expected list, received 5'):
            objects.TranslatableSetOfNormalizedString.normalize_value(5)  # type: ignore[arg-type]

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            AssertionError, 'Expected unicode string, received 2'):
            objects.TranslatableSetOfNormalizedString.normalize_value(
                ['1', 2, '3'])  # type: ignore[list-item]

        with self.assertRaisesRegex(
            AssertionError, 'Validation failed: is_uniquified'):
            objects.TranslatableSetOfNormalizedString.normalize_value(
                ['1', '1'])

        self.assertEqual(
            objects.TranslatableSetOfNormalizedString.normalize_value(
                ['1', '2']),
            ['1', '2'])


class TranslatableSetOfUnicodeStringTests(test_utils.GenericTestBase):

    def test_normalization(self) -> None:
        with self.assertRaisesRegex(
            AssertionError, 'Expected list, received 5'):
            objects.TranslatableSetOfUnicodeString.normalize({
                'contentId': 'rule_input',
                'unicodeStrSet': 5
            })

        with self.assertRaisesRegex(
            AssertionError, 'Expected unicode string, received 2'):
            objects.TranslatableSetOfUnicodeString.normalize({
                'contentId': 'rule_input',
                'unicodeStrSet': ['1', 2, '3']
            })

        with self.assertRaisesRegex(
            AssertionError, 'Validation failed: is_uniquified'):
            objects.TranslatableSetOfUnicodeString.normalize({
                'contentId': 'rule_input',
                'unicodeStrSet': ['1', '1']
            })

        self.assertEqual(objects.TranslatableSetOfUnicodeString.normalize({
            'contentId': 'rule_input',
            'unicodeStrSet': ['1', '2']
        }), {
            'contentId': 'rule_input',
            'unicodeStrSet': ['1', '2']
        })

    def test_normalize_value(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            AssertionError, 'Expected list, received 5'):
            objects.TranslatableSetOfUnicodeString.normalize_value(5)  # type: ignore[arg-type]

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            AssertionError, 'Expected unicode string, received 2'):
            objects.TranslatableSetOfUnicodeString.normalize_value(
                ['1', 2, '3'])  # type: ignore[list-item]

        with self.assertRaisesRegex(
            AssertionError, 'Validation failed: is_uniquified'):
            objects.TranslatableSetOfUnicodeString.normalize_value(['1', '1'])

        self.assertEqual(
            objects.TranslatableSetOfUnicodeString.normalize_value(['1', '2']),
            ['1', '2'])


class JsonEncodedInStringTests(test_utils.GenericTestBase):

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_normalization(self) -> None:
        list_of_ids = ['0', '1']
        with self.assertRaisesRegex(
            Exception, 'Expected string received 2 of type %s' % type(2)
        ):
            objects.JsonEncodedInString.normalize(2)  # type: ignore[arg-type]

        self.assertEqual(
            objects.JsonEncodedInString.normalize(
                json.dumps(list_of_ids)),
            list_of_ids
        )
