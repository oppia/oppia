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

import copy

import schema_utils


class BaseObject(object):
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

        Returns:
          a normalized Python object describing the Object specified by this
          class.

        Raises:
          TypeError: if the Python object cannot be normalized.
        """
        return schema_utils.normalize_against_schema(raw, cls.SCHEMA)


class Boolean(BaseObject):
    """Class for booleans."""

    description = 'A boolean.'
    edit_js_filename = 'BooleanEditor'

    SCHEMA = {
        'type': 'bool'
    }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        if raw is None or raw == '':
            raw = False

        return schema_utils.normalize_against_schema(raw, cls.SCHEMA)


class Real(BaseObject):
    """Real number class."""

    description = 'A real number.'
    default_value = 0.0

    SCHEMA = {
        'type': 'float'
    }


class Int(BaseObject):
    """Integer class."""

    description = 'An integer.'
    default_value = 0

    SCHEMA = {
        'type': 'int'
    }


class UnicodeString(BaseObject):
    """Unicode string class."""

    description = 'A unicode string.'
    default_value = ''

    SCHEMA = {
        'type': 'unicode',
    }


class Html(BaseObject):
    """HTML string class."""

    description = 'An HTML string.'

    SCHEMA = {
        'type': 'html',
    }


class NonnegativeInt(BaseObject):
    """Nonnegative integer class."""

    description = 'A non-negative integer.'
    default_value = 0

    SCHEMA = {
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

    SCHEMA = {
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

    SCHEMA = {
        'type': 'unicode',
        'ui_config': {
            'coding_mode': 'none',
        },
    }

    @classmethod
    def normalize(cls, raw):
        if '\t' in raw:
            raise TypeError(
                'Unexpected tab characters in code string: %s' % raw)
        return schema_utils.normalize_against_schema(raw, cls.SCHEMA)


class CodeEvaluation(BaseObject):
    """Evaluation result of programming code."""

    description = 'Code and its evaluation results.'

    SCHEMA = {
        'type': 'dict',
        'properties': [{
            'name': 'code',
            'schema': UnicodeString.SCHEMA,
        }, {
            'name': 'output',
            'schema': UnicodeString.SCHEMA,
        }, {
            'name': 'evaluation',
            'schema': UnicodeString.SCHEMA,
        }, {
            'name': 'error',
            'schema': UnicodeString.SCHEMA,
        }]
    }


class ListOfCodeEvaluation(BaseObject):
    """Class for lists of CodeEvaluations."""

    description = 'A list of code and its evaluation results.'
    default_value = []

    SCHEMA = {
        'type': 'list',
        'items': CodeEvaluation.SCHEMA
    }


class CoordTwoDim(BaseObject):
    """2D coordinate class."""

    description = 'A two-dimensional coordinate (a pair of reals).'
    default_value = [0.0, 0.0]

    SCHEMA = {
        'type': 'list',
        'len': 2,
        'items': Real.SCHEMA,
    }


class ListOfCoordTwoDim(BaseObject):
    """Class for lists of CoordTwoDims."""

    description = 'A list of 2D coordinates.'
    default_value = []

    SCHEMA = {
        'type': 'list',
        'items': CoordTwoDim.SCHEMA
    }


class ListOfUnicodeString(BaseObject):
    """List class."""

    description = 'A list.'

    SCHEMA = {
        'type': 'list',
        'items': UnicodeString.SCHEMA
    }


class SetOfUnicodeString(BaseObject):
    """Class for sets of UnicodeStrings."""

    description = 'A set (a list with unique elements) of unicode strings.'
    default_value = []

    SCHEMA = {
        'type': 'list',
        'items': UnicodeString.SCHEMA,
        'validators': [{
            'id': 'is_uniquified'
        }]
    }


class NormalizedString(BaseObject):
    """Unicode string with spaces collapsed."""

    description = 'A unicode string with adjacent whitespace collapsed.'
    default_value = ''

    SCHEMA = {
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

    SCHEMA = {
        'type': 'list',
        'items': NormalizedString.SCHEMA,
        'validators': [{
            'id': 'is_uniquified'
        }]
    }


class MathLatexString(BaseObject):
    """Math LaTeX string class."""

    description = 'A LaTeX string.'

    SCHEMA = UnicodeString.SCHEMA


class SanitizedUrl(BaseObject):
    """HTTP or HTTPS url string class."""

    description = 'An HTTP or HTTPS url.'

    SCHEMA = {
        'type': 'unicode',
        'post_normalizers': [{
            'id': 'sanitize_url'
        }]
    }


class MusicPhrase(BaseObject):
    """List of Objects that represent a musical phrase."""

    description = ('A musical phrase that contains zero or more notes, rests, '
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

    SCHEMA = {
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
                        'schema': _FRACTION_PART_SCHEMA
                    }, {
                        'name': 'den',
                        'schema': _FRACTION_PART_SCHEMA
                    }]
                }
            }],
        },
        'validators': [{
            'id': 'has_length_at_most',
            'max_value': _MAX_NOTES_IN_PHRASE,
        }]
    }


class ListOfTabs(BaseObject):
    """Class for tab contents."""

    description = 'Tab content that contains list of tabs.'

    SCHEMA = {
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

    SCHEMA = UnicodeString.SCHEMA


class CheckedProof(BaseObject):
    """A proof attempt and any errors it makes."""

    description = 'A proof attempt and any errors it makes.'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            assert isinstance(raw, dict)
            assert isinstance(raw['assumptions_string'], basestring)
            assert isinstance(raw['target_string'], basestring)
            assert isinstance(raw['proof_string'], basestring)
            assert raw['correct'] in [True, False]
            if not raw['correct']:
                assert isinstance(raw['error_category'], basestring)
                assert isinstance(raw['error_code'], basestring)
                assert isinstance(raw['error_message'], basestring)
                assert isinstance(raw['error_line_number'], int)
            return copy.deepcopy(raw)
        except Exception:
            raise TypeError('Cannot convert to checked proof %s' % raw)


class LogicQuestion(BaseObject):
    """A question giving a formula to prove."""

    description = 'A question giving a formula to prove.'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""

        def _validate_expression(expression):
            assert isinstance(expression, dict)
            assert isinstance(expression['top_kind_name'], basestring)
            assert isinstance(expression['top_operator_name'], basestring)
            _validate_expression_array(expression['arguments'])
            _validate_expression_array(expression['dummies'])

        def _validate_expression_array(array):
            assert isinstance(array, list)
            for item in array:
                _validate_expression(item)

        try:
            assert isinstance(raw, dict)
            _validate_expression_array(raw['assumptions'])
            _validate_expression_array(raw['results'])
            assert isinstance(raw['default_proof_string'], basestring)

            return copy.deepcopy(raw)
        except Exception:
            raise TypeError('Cannot convert to a logic question %s' % raw)


class LogicErrorCategory(BaseObject):
    """A string from a list of possible categories."""

    description = 'One of the possible error categories of a logic proof.'
    default_value = 'mistake'

    SCHEMA = {
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
            'schema': Real.SCHEMA
        }, {
            'name': 'y',
            'schema': Real.SCHEMA
        }, {
            'name': 'label',
            'schema': UnicodeString.SCHEMA
        }]
    }
    _EDGE_SCHEMA = {
        'type': 'dict',
        'properties': [{
            'name': 'src',
            'schema': Int.SCHEMA
        }, {
            'name': 'dst',
            'schema': Int.SCHEMA
        }, {
            'name': 'weight',
            'schema': Int.SCHEMA
        }]
    }
    SCHEMA = {
        'type': 'dict',
        'properties': [{
            'name': 'vertices',
            'schema': {
                'type': 'list',
                'items': _VERTEX_SCHEMA
            }
        }, {
            'name': 'edges',
            'schema': {
                'type': 'list',
                'items': _EDGE_SCHEMA
            }
        }, {
            'name': 'isLabeled',
            'schema': Boolean.SCHEMA
        }, {
            'name': 'isDirected',
            'schema': Boolean.SCHEMA
        }, {
            'name': 'isWeighted',
            'schema': Boolean.SCHEMA
        }]
    }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object.

        Checks that there are no self-loops or multiple edges.
        Checks that unlabeled graphs have all labels empty.
        Checks that unweighted graphs have all weights set to 1.
        TODO(czx): Think about support for multigraphs?
        """
        try:
            raw = schema_utils.normalize_against_schema(raw, cls.SCHEMA)

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

    SCHEMA = {
        'type': 'unicode',
        'choices': [
            'strongly_connected', 'weakly_connected', 'acyclic', 'regular'
        ]
    }


class ListOfGraph(BaseObject):
    """Class for lists of Graphs."""

    description = 'A list of graphs.'
    default_value = []

    SCHEMA = {
        'type': 'list',
        'items': Graph.SCHEMA
    }


class NormalizedRectangle2D(BaseObject):
    """Normalized Rectangle class."""

    description = (
        'A rectangle normalized so that the coordinates are within the range '
        '[0,1].')

    SCHEMA = {
        'type': 'list',
        'len': 2,
        'items': {
            'type': 'list',
            'len': 2,
            'items': Real.SCHEMA
        }
    }

    @classmethod
    def normalize(cls, raw):
        # Moves cur_value to the nearest available value in the range
        # [min_value, max_value].
        def clamp(min_value, current_value, max_value):
            return min(max_value, max(min_value, current_value))
        try:
            raw = schema_utils.normalize_against_schema(raw, cls.SCHEMA)

            raw[0][0] = clamp(0.0, raw[0][0], 1.0)
            raw[0][1] = clamp(0.0, raw[0][1], 1.0)
            raw[1][0] = clamp(0.0, raw[1][0], 1.0)
            raw[1][1] = clamp(0.0, raw[1][1], 1.0)

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
    SCHEMA = {
        'type': 'dict',
        'properties': [{
            'name': 'regionType',
            'schema': UnicodeString.SCHEMA
        }, {
            'name': 'area',
            'schema': NormalizedRectangle2D.SCHEMA
        }]
    }


class ImageWithRegions(BaseObject):
    """An image overlaid with labeled regions."""

    description = 'An image overlaid with regions.'

    SCHEMA = {
        'type': 'dict',
        'properties': [{
            'name': 'imagePath',
            'schema': Filepath.SCHEMA
        }, {
            'name': 'labeledRegions',
            'schema': {
                'type': 'list',
                'items': {
                    'type': 'dict',
                    'properties': [{
                        'name': 'label',
                        'schema': UnicodeString.SCHEMA
                    }, {
                        'name': 'region',
                        'schema': ImageRegion.SCHEMA
                    }]
                }
            }
        }]
    }


class ClickOnImage(BaseObject):
    """A click on an image and the clicked regions."""

    description = "Position of a click and a list of regions clicked."

    SCHEMA = {
        'type': 'dict',
        'properties': [{
            'name': 'clickPosition',
            'schema': {
                'type': 'list',
                'items': Real.SCHEMA,
                'len': 2
            }
        }, {
            'name': 'clickedRegions',
            'schema': {
                'type': 'list',
                'items': UnicodeString.SCHEMA
            }
        }]
    }


class ParameterName(BaseObject):
    """Parameter name class.

    Validation for this class is done only in the frontend.
    """

    description = 'A string representing a parameter name.'

    SCHEMA = {
        'type': 'unicode',
    }


class SetOfHtmlString(BaseObject):
    """A Set of Html Strings."""

    description = "A list of Html strings."
    default_value = []

    SCHEMA = {
        'type': 'list',
        'items': Html.SCHEMA,
        'validators': [{
            'id': 'is_uniquified'
        }]
    }


class MathExpression(BaseObject):
    """Math expression class."""

    description = 'A math expression.'

    SCHEMA = {
        'type': 'dict',
        'properties': [{
            'name': 'ascii',
            'schema': UnicodeString.SCHEMA,
        }, {
            'name': 'latex',
            'schema': UnicodeString.SCHEMA,
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

    SCHEMA = {
        'type': 'dict',
        'properties': [{
            'name': 'isNegative',
            'schema': {
                'type': 'bool'
            }
        }, {
            'name': 'wholeNumber',
            'schema': NonnegativeInt.SCHEMA
        }, {
            'name': 'numerator',
            'schema': NonnegativeInt.SCHEMA
        }, {
            'name': 'denominator',
            'schema': PositiveInt.SCHEMA
        }]
    }


class Units(BaseObject):
    """Units class."""
    # Validation of the units is performed only in the frontend using math.js.
    # math.js is not available in the backend.

    description = 'A list of unit dict components.'
    default_value = []

    SCHEMA = {
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

    SCHEMA = {
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
            'schema': Fraction.SCHEMA
        }, {
            'name': 'units',
            'schema': Units.SCHEMA
        }]
    }


class ListOfSetsOfHtmlStrings(BaseObject):
    """List of sets of Html strings class."""

    description = 'A list of sets of Html strings.'
    default_value = []

    SCHEMA = {
        'type': 'list',
        'items': SetOfHtmlString.SCHEMA,
    }


class DragAndDropHtmlString(BaseObject):
    """A specific drag and drop Html string class."""

    description = (
        'A specific drag and drop item from collection of drag and drop items.')
    default_value = ''

    SCHEMA = {
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

    SCHEMA = PositiveInt.SCHEMA
