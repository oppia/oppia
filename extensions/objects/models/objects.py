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

"""Classes for interpreting typed objects in Oppia."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy

from constants import constants
import python_utils
import schema_utils


class BaseObject(python_utils.OBJECT):
    """Base object class.

    This is the superclass for typed object specifications in Oppia, such as
    SanitizedUrl and CoordTwoDim.

    Typed objects are initialized from a raw Python object which is expected to
    be derived from a JSON object. They are validated and normalized to basic
    Python objects (primitive types combined via lists and dicts; no sets or
    tuples).
    """

    # These values should be overridden in subclasses.
    description = ''
    edit_js_filename = None
    # This should be non-null if the object class is used when specifying a
    # rule.
    default_value = None

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object.

        Args:
            raw: *. A normalized Python object to be normalized.

        Returns:
            *. A normalized Python object describing the Object specified by
            this class.

        Raises:
            TypeError. The Python object cannot be normalized.
        """
        return schema_utils.normalize_against_schema(raw, cls.get_schema())


class BaseTranslatableObject(BaseObject):
    """Base translatable object class.

    This is a superclass for objects that are translatable and thus require a
    content id. This class enforces that the object is a dictionary with a
    content id field. The schema of the actual value is determined by the
    _get_value_schema() method.
    """

    @staticmethod
    def _get_value_schema():
        """Returns a list of properties that store the object value.

        Returns:
            list(dict). A list of properties that store the object value.
        """
        raise NotImplementedError(
            'Subclasses of BaseTranslatableObject should implement '
            '_get_value_schema().')

    @staticmethod
    def _normalize_value(raw):
        """Returns a method that normalizes the values of the object.

        Args:
            raw: *. A translatable Python object whose values are to be
                ormalized.

        Returns:
            dict. A normalized translatable Python object with its values
            normalized.
        """
        raise NotImplementedError(
            'Subclasses of BaseTranslatableObject should implement '
            '_normalize_value().')

    @classmethod
    def get_schema(cls):
        """Returns the full object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'dict',
            'properties': [{
                'name': 'contentId',
                # The default content id is none. However, it should be
                # populated before being saved. The normalize() method has
                # validation checks for this.
                'schema': {'type': 'unicode_or_none'}
            }] + cls._get_value_schema()
        }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object.

        Args:
            raw: dict. A Python object to be validated against the schema,
                normalizing if necessary.

        Returns:
            dict. The normalized object.

        Raises:
            TypeError. Error while normalizing.
        """
        if not isinstance(raw['contentId'], python_utils.BASESTRING):
            raise TypeError(
                'Expected content id to be a string, received %s' %
                raw['contentId'])

        return schema_utils.normalize_against_schema(
            cls._normalize_value(raw),
            cls.get_schema())


class Boolean(BaseObject):
    """Class for booleans."""

    description = 'A boolean.'
    edit_js_filename = 'BooleanEditor'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'bool'
        }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object.

        Args:
            raw: *. A Python object to be validated against the schema,
                normalizing if necessary.

        Returns:
            bool. The normalized object (or False if the input is None or '').
        """
        if raw is None or raw == '':
            raw = False

        return schema_utils.normalize_against_schema(raw, cls.get_schema())


class Real(BaseObject):
    """Real number class."""

    description = 'A real number.'
    default_value = 0.0

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'float'
        }


class Int(BaseObject):
    """Integer class."""

    description = 'An integer.'
    default_value = 0

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'int'
        }


class UnicodeString(BaseObject):
    """Unicode string class."""

    description = 'A unicode string.'
    default_value = ''

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
        }


class Html(BaseObject):
    """HTML string class."""

    description = 'An HTML string.'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'html',
        }


# TODO(#11433): Migrate SubtitledUnicode to TranslatableUnicode.
class SubtitledUnicode(BaseObject):
    """SubtitledUnicode class."""

    description = 'A dictionary with properties "content_id" and "unicode".'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'dict',
            'properties': [{
                'name': 'content_id',
                'schema': {
                    # The default content id is none. However, it should be
                    # populated before being saved (SubtitledUnicode in
                    # state_domain has validation checks for this).
                    'type': 'unicode_or_none'
                }
            }, {
                'name': 'unicode_str',
                'schema': {
                    'type': 'unicode'
                }
            }]
        }


# TODO(#11433): Migrate SubtitledHtml to TranslatableHtml.
class SubtitledHtml(BaseObject):
    """SubtitledHtml class."""

    description = 'A dictionary with properties "content_id" and "html".'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'dict',
            'properties': [{
                'name': 'content_id',
                'schema': {
                    # The default content id is none. However, it should be
                    # populated before being saved (SubtitledHtml in
                    # state_domain has validation checks for this).
                    'type': 'unicode_or_none'
                }
            }, {
                'name': 'html',
                'schema': {
                    'type': 'html'
                }
            }]
        }


class NonnegativeInt(BaseObject):
    """Nonnegative integer class."""

    description = 'A non-negative integer.'
    default_value = 0

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 0
            }]
        }


class PositiveInt(BaseObject):
    """Nonnegative integer class."""

    description = 'A positive integer.'
    default_value = 1

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 1
            }]
        }


class CodeString(BaseObject):
    """Code string class. This is like a normal string, but it should not
    contain tab characters.
    """

    description = 'A code string.'
    default_value = ''

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'ui_config': {
                'coding_mode': 'none',
            },
        }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object.

        Args:
            raw: *. A Python object to be validated against the schema,
                normalizing if necessary.

        Returns:
            unicode. The normalized object containing string in unicode format.
        """
        if '\t' in raw:
            raise TypeError(
                'Unexpected tab characters in code string: %s' % raw)
        return schema_utils.normalize_against_schema(raw, cls.get_schema())


class CodeEvaluation(BaseObject):
    """Evaluation result of programming code."""

    description = 'Code and its evaluation results.'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'dict',
            'properties': [{
                'name': 'code',
                'schema': UnicodeString.get_schema(),
            }, {
                'name': 'output',
                'schema': UnicodeString.get_schema(),
            }, {
                'name': 'evaluation',
                'schema': UnicodeString.get_schema(),
            }, {
                'name': 'error',
                'schema': UnicodeString.get_schema(),
            }]
        }


class ListOfCodeEvaluation(BaseObject):
    """Class for lists of CodeEvaluations."""

    description = 'A list of code and its evaluation results.'
    default_value = []

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': CodeEvaluation.get_schema()
        }


class CoordTwoDim(BaseObject):
    """2D coordinate class."""

    description = 'A two-dimensional coordinate (a pair of reals).'
    default_value = [0.0, 0.0]

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'len': 2,
            'items': Real.get_schema(),
        }


class ListOfCoordTwoDim(BaseObject):
    """Class for lists of CoordTwoDims."""

    description = 'A list of 2D coordinates.'
    default_value = []

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': CoordTwoDim.get_schema()
        }


class ListOfUnicodeString(BaseObject):
    """List class."""

    description = 'A list.'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': UnicodeString.get_schema()
        }


class SetOfUnicodeString(BaseObject):
    """Class for sets of UnicodeStrings."""

    description = 'A set (a list with unique elements) of unicode strings.'
    default_value = []

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': UnicodeString.get_schema(),
            'validators': [{
                'id': 'is_uniquified'
            }]
        }


class NormalizedString(BaseObject):
    """Unicode string with spaces collapsed."""

    description = 'A unicode string with adjacent whitespace collapsed.'
    default_value = ''

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'post_normalizers': [{
                'id': 'normalize_spaces'
            }]
        }


class SetOfNormalizedString(BaseObject):
    """Class for sets of NormalizedStrings."""

    description = (
        'A set (a list with unique elements) of whitespace-collapsed strings.')
    default_value = []

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': NormalizedString.get_schema(),
            'validators': [{
                'id': 'is_uniquified'
            }]
        }


class MathExpressionContent(BaseObject):
    """Math Expression Content class."""

    description = 'The Math Expression to be displayed.'
    default_value = {
        'raw_latex': '',
        'svg_filename': ''
    }

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'dict',
            'properties': [{
                'name': 'raw_latex',
                'description': 'Latex value',
                'schema': {
                    'type': 'unicode'
                }
            }, {
                'name': 'svg_filename',
                'description': 'SVG filename',
                'schema': {
                    'type': 'unicode'
                }
            }]
        }


class SanitizedUrl(BaseObject):
    """HTTP or HTTPS url string class."""

    description = 'An HTTP or HTTPS url.'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'validators': [{
                'id': 'is_nonempty'
            }],
            'ui_config': {
                'placeholder': 'https://www.example.com'
            },
            'post_normalizers': [{
                'id': 'sanitize_url'
            }]
        }


class SkillSelector(BaseObject):
    """Skill selector class."""

    description = 'The skill summary for the concept card.'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'ui_config': {
                'placeholder': 'Search for skill'
            }
        }


class MusicPhrase(BaseObject):
    """List of Objects that represent a musical phrase."""

    description = (
        'A musical phrase that contains zero or more notes, rests, '
        'and time signature.')
    default_value = []

    # The maximum number of notes allowed in a music phrase.
    _MAX_NOTES_IN_PHRASE = 8

    _FRACTION_PART_SCHEMA = {
        'type': 'int',
        'validators': [{
            'id': 'is_at_least',
            'min_value': 1
        }]
    }

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': {
                'type': 'dict',
                'properties': [{
                    'name': 'readableNoteName',
                    'schema': {
                        'type': 'unicode',
                        'choices': [
                            'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5',
                            'D5', 'E5', 'F5', 'G5', 'A5'
                        ]
                    }
                }, {
                    'name': 'noteDuration',
                    'schema': {
                        'type': 'dict',
                        'properties': [{
                            'name': 'num',
                            'schema': cls._FRACTION_PART_SCHEMA
                        }, {
                            'name': 'den',
                            'schema': cls._FRACTION_PART_SCHEMA
                        }]
                    }
                }],
            },
            'validators': [{
                'id': 'has_length_at_most',
                'max_value': cls._MAX_NOTES_IN_PHRASE,
            }]
        }


class ListOfTabs(BaseObject):
    """Class for tab contents."""

    description = 'Tab content that contains list of tabs.'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': {
                'type': 'dict',
                'properties': [{
                    'name': 'title',
                    'description': 'Tab title',
                    'schema': {
                        'type': 'unicode',
                        'validators': [{
                            'id': 'is_nonempty'
                        }]
                    }
                }, {
                    'name': 'content',
                    'description': 'Tab content',
                    'schema': {
                        'type': 'html',
                        'ui_config': {
                            'hide_complex_extensions': True
                        }
                    }
                }]
            },
            'ui_config': {
                'add_element_text': 'Add new tab'
            }
        }


class Filepath(BaseObject):
    """A string representing a filepath.

    The path will be prefixed with '[exploration_id]/assets'.
    """

    description = 'A string that represents a filepath'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return UnicodeString.get_schema()


class SvgFilename(BaseObject):
    """A string representing a filename of the saved
    svg file created using svg editor.
    """

    description = 'A string representing the saved svg filename'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return UnicodeString.get_schema()


class CheckedProof(BaseObject):
    """A proof attempt and any errors it makes."""

    description = 'A proof attempt and any errors it makes.'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object.

        Args:
            raw: *. A Python object to be validated against the schema,
                normalizing if necessary.

        Returns:
            dict. The normalized object containing the following key-value
            pairs:
                assumptions_string: str. The string containing the
                    assumptions.
                target_string: str. The target string of the proof.
                proof_string: str. The proof string.
                correct: bool. Whether the proof is correct.
                error_category: str. The category of the error.
                error_code: str. The error code.
                error_message: str. The error message.
                error_line_number: str. The line number at which the
                    error has occurred.

        Raises:
            TypeError. Cannot convert to the CheckedProof schema.
        """
        try:
            assert isinstance(raw, dict)
            assert isinstance(
                raw['assumptions_string'], python_utils.BASESTRING)
            assert isinstance(raw['target_string'], python_utils.BASESTRING)
            assert isinstance(raw['proof_string'], python_utils.BASESTRING)
            assert raw['correct'] in [True, False]
            if not raw['correct']:
                assert isinstance(
                    raw['error_category'], python_utils.BASESTRING)
                assert isinstance(raw['error_code'], python_utils.BASESTRING)
                assert isinstance(
                    raw['error_message'], python_utils.BASESTRING)
                assert isinstance(raw['error_line_number'], int)
            return copy.deepcopy(raw)
        except Exception:
            raise TypeError('Cannot convert to checked proof %s' % raw)


class LogicQuestion(BaseObject):
    """A question giving a formula to prove."""

    description = 'A question giving a formula to prove.'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object.

        Args:
            raw: *. A Python object to be validated against the schema,
                normalizing if necessary.

        Returns:
            dict. The normalized object containing the following key-value
            pairs:
                assumptions: list(dict(str, *)). The list containing all the
                    assumptions in the dict format containing following
                    key-value pairs:
                        top_kind_name: str. The top kind name in the
                            expression.
                        top_operator_name: str. The top operator name
                            in the expression.
                        arguments: list(str). A list of arguments.
                        dummies: list. A list of dummy values.
                results: list(dict(str, *)). The list containing the final
                    results of the required proof in the dict format
                    containing following key-value pairs:
                        top_kind_name: str. The top kind name in the
                            expression.
                        top_operator_name: str. The top operator name
                            in the expression.
                        arguments: list(str). A list of arguments.
                        dummies: list. A list of dummy values.
                default_proof_string: str. The default proof string.

        Raises:
            TypeError. Cannot convert to LogicQuestion schema.
        """

        def _validate_expression(expression):
            """Validates the given expression.

            Args:
                expression: dict(str, *). The expression to be verified in the
                    dict format.

            Raises:
                AssertionError. The specified expression is not in the correct
                    format.
            """
            assert isinstance(expression, dict)
            assert isinstance(
                expression['top_kind_name'], python_utils.BASESTRING)
            top_operator_name_type = (
                int
                if (
                    expression['top_kind_name'] == 'constant' and
                    'type' in expression and
                    expression['type'] == 'integer'
                ) else python_utils.BASESTRING
            )
            assert isinstance(
                expression['top_operator_name'], top_operator_name_type)
            _validate_expression_array(expression['arguments'])
            _validate_expression_array(expression['dummies'])

        def _validate_expression_array(array):
            """Validates the given expression array.

            Args:
                array: list(dict(str, *)). The expression array to be verified.

            Raises:
                AssertionError. The specified expression array is not in the
                    list format.
            """
            assert isinstance(array, list)
            for item in array:
                _validate_expression(item)

        try:
            assert isinstance(raw, dict)
            _validate_expression_array(raw['assumptions'])
            _validate_expression_array(raw['results'])
            assert isinstance(
                raw['default_proof_string'], python_utils.BASESTRING)

            return copy.deepcopy(raw)
        except Exception:
            raise TypeError('Cannot convert to a logic question %s' % raw)


class LogicErrorCategory(BaseObject):
    """A string from a list of possible categories."""

    description = 'One of the possible error categories of a logic proof.'
    default_value = 'mistake'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'choices': [
                'parsing', 'typing', 'line', 'layout', 'variables', 'logic',
                'target', 'mistake'
            ]
        }


class Graph(BaseObject):
    """A (mathematical) graph with edges and vertices."""

    description = 'A (mathematical) graph'
    default_value = {
        'edges': [],
        'isDirected': False,
        'isLabeled': False,
        'isWeighted': False,
        'vertices': []
    }

    _VERTEX_SCHEMA = {
        'type': 'dict',
        'properties': [{
            'name': 'x',
            'schema': Real.get_schema()
        }, {
            'name': 'y',
            'schema': Real.get_schema()
        }, {
            'name': 'label',
            'schema': UnicodeString.get_schema()
        }]
    }
    _EDGE_SCHEMA = {
        'type': 'dict',
        'properties': [{
            'name': 'src',
            'schema': Int.get_schema()
        }, {
            'name': 'dst',
            'schema': Int.get_schema()
        }, {
            'name': 'weight',
            'schema': Int.get_schema()
        }]
    }

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'dict',
            'properties': [{
                'name': 'vertices',
                'schema': {
                    'type': 'list',
                    'items': cls._VERTEX_SCHEMA
                }
            }, {
                'name': 'edges',
                'schema': {
                    'type': 'list',
                    'items': cls._EDGE_SCHEMA
                }
            }, {
                'name': 'isLabeled',
                'schema': Boolean.get_schema()
            }, {
                'name': 'isDirected',
                'schema': Boolean.get_schema()
            }, {
                'name': 'isWeighted',
                'schema': Boolean.get_schema()
            }]
        }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object.

        Checks that there are no self-loops or multiple edges.
        Checks that unlabeled graphs have all labels empty.
        Checks that unweighted graphs have all weights set to 1.
        TODO(czx): Think about support for multigraphs?

        Args:
            raw: *. A Python object to be validated against the schema,
                normalizing if necessary.

        Returns:
            dict. The normalized object containing the Graph schema.

        Raises:
            TypeError. Cannot convert to the Graph schema.
        """
        try:
            raw = schema_utils.normalize_against_schema(raw, cls.get_schema())

            if not raw['isLabeled']:
                for vertex in raw['vertices']:
                    assert vertex['label'] == ''

            for edge in raw['edges']:
                assert edge['src'] != edge['dst']
                if not raw['isWeighted']:
                    assert edge['weight'] == 1.0

            if raw['isDirected']:
                edge_pairs = [
                    (edge['src'], edge['dst']) for edge in raw['edges']]
            else:
                edge_pairs = (
                    [(edge['src'], edge['dst']) for edge in raw['edges']] +
                    [(edge['dst'], edge['src']) for edge in raw['edges']]
                )
            assert len(set(edge_pairs)) == len(edge_pairs)

        except Exception:
            raise TypeError('Cannot convert to graph %s' % raw)

        return raw


class GraphProperty(BaseObject):
    """A string from a list of possible graph properties."""

    description = 'One of the possible properties possessed by a graph.'
    default_value = 'strongly_connected'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'choices': [
                'strongly_connected', 'weakly_connected', 'acyclic', 'regular'
            ]
        }


class ListOfGraph(BaseObject):
    """Class for lists of Graphs."""

    description = 'A list of graphs.'
    default_value = []

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': Graph.get_schema()
        }


class NormalizedRectangle2D(BaseObject):
    """Normalized Rectangle class."""

    description = (
        'A rectangle normalized so that the coordinates are within the range '
        '[0,1].')

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'len': 2,
            'items': {
                'type': 'list',
                'len': 2,
                'items': Real.get_schema()
            }
        }

    @classmethod
    def normalize(cls, raw):
        """Returns the normalized coordinates of the rectangle.

        Args:
            raw: *. An object to be validated against the schema, normalizing if
                necessary.

        Returns:
            list(list(float)). The normalized object containing list of lists of
            float values as coordinates of the rectangle.

        Raises:
            TypeError. Cannot convert to the NormalizedRectangle2D schema.
        """
        def clamp(value):
            """Clamps a number to range [0, 1].

            Args:
                value: float. A number to be clamped.

            Returns:
                float. The clamped value.
            """
            return min(0.0, max(value, 1.0))

        try:
            raw = schema_utils.normalize_against_schema(raw, cls.get_schema())

            raw[0][0] = clamp(raw[0][0])
            raw[0][1] = clamp(raw[0][1])
            raw[1][0] = clamp(raw[1][0])
            raw[1][1] = clamp(raw[1][1])

        except Exception:
            raise TypeError('Cannot convert to Normalized Rectangle %s' % raw)

        return raw


class ImageRegion(BaseObject):
    """A region of an image, including its shape and coordinates."""

    description = 'A region of an image.'

    # Note: at the moment, only supports rectangular image regions.
    # Coordinates are:
    #   [[top-left-x, top-left-y], [bottom-right-x, bottom-right-y]].
    # Origin is top-left, increasing x is to the right, increasing y is down.
    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'dict',
            'properties': [{
                'name': 'regionType',
                'schema': UnicodeString.get_schema()
            }, {
                'name': 'area',
                'schema': NormalizedRectangle2D.get_schema()
            }]
        }


class ImageWithRegions(BaseObject):
    """An image overlaid with labeled regions."""

    description = 'An image overlaid with regions.'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'dict',
            'properties': [{
                'name': 'imagePath',
                'schema': Filepath.get_schema()
            }, {
                'name': 'labeledRegions',
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'dict',
                        'properties': [{
                            'name': 'label',
                            'schema': UnicodeString.get_schema()
                        }, {
                            'name': 'region',
                            'schema': ImageRegion.get_schema()
                        }]
                    }
                }
            }]
        }


class ClickOnImage(BaseObject):
    """A click on an image and the clicked regions."""

    description = 'Position of a click and a list of regions clicked.'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'dict',
            'properties': [{
                'name': 'clickPosition',
                'schema': {
                    'type': 'list',
                    'items': Real.get_schema(),
                    'len': 2
                }
            }, {
                'name': 'clickedRegions',
                'schema': {
                    'type': 'list',
                    'items': UnicodeString.get_schema()
                }
            }]
        }


class ParameterName(BaseObject):
    """Parameter name class.

    Validation for this class is done only in the frontend.
    """

    description = 'A string representing a parameter name.'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
        }


class SetOfHtmlString(BaseObject):
    """A Set of Html Strings."""

    description = 'A list of Html strings.'
    default_value = []

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': Html.get_schema(),
            'validators': [{
                'id': 'is_uniquified'
            }]
        }


class Fraction(BaseObject):
    """Fraction class."""

    description = 'A fraction type'
    default_value = {
        'isNegative': False,
        'wholeNumber': 0,
        'numerator': 0,
        'denominator': 1
    }

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'dict',
            'properties': [{
                'name': 'isNegative',
                'schema': {
                    'type': 'bool'
                }
            }, {
                'name': 'wholeNumber',
                'schema': NonnegativeInt.get_schema()
            }, {
                'name': 'numerator',
                'schema': NonnegativeInt.get_schema()
            }, {
                'name': 'denominator',
                'schema': PositiveInt.get_schema()
            }]
        }


class Units(BaseObject):
    """Units class."""

    # Validation of the units is performed only in the frontend using math.js.
    # math.js is not available in the backend.

    description = 'A list of unit dict components.'
    default_value = []

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': {
                'type': 'dict',
                'properties': [{
                    'name': 'unit',
                    'schema': {
                        'type': 'unicode'
                    }
                }, {
                    'name': 'exponent',
                    'schema': {
                        'type': 'int'
                    }
                }]
            }
        }


class NumberWithUnits(BaseObject):
    """Number with units class."""

    description = 'A number with units expression.'
    default_value = {
        'type': 'real',
        'real': 0.0,
        'fraction': Fraction.default_value,
        'units': Units.default_value
    }

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'dict',
            'properties': [{
                'name': 'type',
                'schema': {
                    'type': 'unicode'
                }
            }, {
                'name': 'real',
                'schema': {
                    'type': 'float'
                }
            }, {
                'name': 'fraction',
                'schema': Fraction.get_schema()
            }, {
                'name': 'units',
                'schema': Units.get_schema()
            }]
        }


class ListOfSetsOfHtmlStrings(BaseObject):
    """List of sets of Html strings class."""

    description = 'A list of sets of Html strings.'
    default_value = []

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': SetOfHtmlString.get_schema(),
        }


class DragAndDropHtmlString(BaseObject):
    """A specific drag and drop Html string class."""

    description = (
        'A specific drag and drop item from collection of drag and drop items.')
    default_value = ''

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'html'
        }


class DragAndDropPositiveInt(BaseObject):
    """A drag and drop positive int class representing the rank(position) of a
    drag and drop item.
    """

    description = (
        'The rank(position) of a drag and drop item in the given list of sets' +
        'of drag and drop items.')
    default_value = 1

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return PositiveInt.get_schema()


class AlgebraicExpression(BaseObject):
    """Class for algebraic expressions. Stores a unicode string representing a
    valid algebraic expression.
    """

    description = 'A unicode string for an algebraic expression.'
    default_value = ''

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'validators': [{
                'id': 'is_valid_algebraic_expression'
            }]
        }


class OskCharacters(BaseObject):
    """Class for OSK characters.
    An OSK character could be an english alphabet (uppercase/lowercase)
    or a greek letter.
    """

    description = 'An allowed OSK character.'
    default_value = 'a'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'choices': constants.VALID_CUSTOM_OSK_LETTERS
        }


class AlgebraicIdentifier(BaseObject):
    """Class for an algebraic identifier.
    An algebraic identifier could be an english alphabet (uppercase/lowercase)
    or a greek letter represented as a single word.
    """

    description = 'A string representing an algebraic identifier.'
    default_value = 'x'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'choices': constants.VALID_ALGEBRAIC_IDENTIFIERS
        }


class SetOfAlgebraicIdentifier(BaseObject):
    """Class for sets of AlgebraicIdentifiers."""

    description = (
        'A set (a list with unique elements) of algebraic identifiers.')
    default_value = []

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': AlgebraicIdentifier.get_schema(),
            'validators': [{
                'id': 'is_uniquified'
            }]
        }


class MathEquation(BaseObject):
    """Class for math equations. Stores a unicode string representing a
    valid math equation.
    """

    description = 'A unicode string for a math equation.'
    default_value = ''

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'validators': [{
                'id': 'is_valid_math_equation'
            }]
        }


class NumericExpression(BaseObject):
    """Class for numeric expressions. Stores a unicode string representing a
    valid numeric expression.
    """

    description = 'A unicode string for an numeric expression.'
    default_value = ''

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'validators': [{
                'id': 'is_valid_math_expression',
                'algebraic': False
            }]
        }


class PositionOfTerms(BaseObject):
    """Class for position of terms. Denotes the position of terms relative to
    the equals sign in a math equation.
    """

    description = (
        'The position of terms relative to the equals sign in a math equation.')
    default_value = 'both'

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'choices': ['lhs', 'rhs', 'both', 'irrelevant']
        }


class RatioExpression(BaseObject):
    """Class for ratio expression. Stores a list of non-negative
    integers representing a valid ratio expression.
    """

    description = 'A list of integers for ratio expression.'
    default_value = [1, 1]

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': PositiveInt.get_schema(),
            'validators': [{
                'id': 'has_length_at_least',
                'min_value': 2
            }]
        }


class CustomOskLetters(BaseObject):
    """Class for custom OSK letters. These are the letters that will be
    displayed to the learner for AlgebraicExpressionInput and MathEquationInput
    interactions when the on-screen keyboard is being used. This includes Latin
    and Greek alphabets.
    """

    description = (
        'Shortcut variables that the learner can access in the '
        'on-screen keyboard. (The order of these variables will be reflected '
        'in the learner\'s keyboard)')
    default_value = []

    @classmethod
    def get_schema(cls):
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': OskCharacters.get_schema(),
            'validators': [{
                'id': 'is_uniquified'
            }]
        }


class TranslatableSetOfNormalizedString(BaseTranslatableObject):
    """Class for translatable sets of NormalizedStrings."""

    default_value = {
        'contentId': None,
        'normalizedStrSet': []
    }

    @staticmethod
    def _get_value_schema():
        """Returns a list of properties that store the object value.

        Returns:
            list. A list of properties that store the object value.
        """
        return [{
            'name': 'normalizedStrSet',
            'schema': SetOfNormalizedString.get_schema()
        }]

    @staticmethod
    def _normalize_value(raw):
        """Validates and normalizes the value fields of the translatable object.

        Args:
            raw: *. A translatable Python object whose values are to be
                normalized.

        Returns:
            dict. A normalized translatable Python object with its values
            normalized.

        Raises:
            TypeError. The Python object cannot be normalized.
        """
        if not isinstance(raw['normalizedStrSet'], list):
            raise TypeError(
                'Invalid unicode string set: %s' % raw['normalizedStrSet'])

        for normalized_str in raw['normalizedStrSet']:
            if not isinstance(normalized_str, python_utils.BASESTRING):
                raise TypeError(
                    'Invalid content unicode: %s' % normalized_str)

        normalized_str_set = set(raw['normalizedStrSet'])
        if len(normalized_str_set) != len(raw['normalizedStrSet']):
            raise TypeError(
                'Duplicate unicode found '
                'in set: %s' % raw['normalizedStrSet'])

        return raw


class TranslatableSetOfUnicodeString(BaseTranslatableObject):
    """Class for translatable sets of UnicodeStrings."""

    default_value = {
        'contentId': None,
        'unicodeStrSet': []
    }

    @staticmethod
    def _get_value_schema():
        """Returns a list of properties that store the object value.

        Returns:
            list. A list of properties that store the object value.
        """
        return [{
            'name': 'unicodeStrSet',
            'schema': SetOfUnicodeString.get_schema()
        }]

    @staticmethod
    def _normalize_value(raw):
        """Validates and normalizes the value fields of the translatable object.

        Args:
            raw: *. A translatable Python object whose values are to be
                normalized.

        Returns:
            dict. A normalized translatable Python object with its values
            normalized.

        Raises:
            TypeError. The Python object cannot be normalized.
        """
        if not isinstance(raw['unicodeStrSet'], list):
            raise TypeError(
                'Invalid unicode string set: %s' % raw['unicodeStrSet'])

        for unicode_str in raw['unicodeStrSet']:
            if not isinstance(unicode_str, python_utils.BASESTRING):
                raise TypeError(
                    'Invalid content unicode: %s' % unicode_str)

        if len(set(raw['unicodeStrSet'])) != len(raw['unicodeStrSet']):
            raise TypeError(
                'Duplicate unicode found in set: %s' % raw['unicodeStrSet'])

        return raw
