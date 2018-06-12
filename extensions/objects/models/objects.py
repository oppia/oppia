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
import os

import feconf
import jinja_utils
import schema_utils
import utils


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
    edit_html_filename = None
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

    @classmethod
    def has_editor_js_template(cls):
        return cls.edit_js_filename is not None

    @classmethod
    def get_editor_js_template(cls):
        if cls.edit_js_filename is None:
            raise Exception(
                'There is no editor template defined for objects of type %s' %
                cls.__name__)
        return utils.get_file_contents(os.path.join(
            os.getcwd(), feconf.OBJECT_TEMPLATES_DIR,
            '%s.js' % cls.edit_js_filename))

class Boolean(BaseObject):
    """Class for booleans."""

    description = 'A boolean.'
    edit_html_filename = 'boolean_editor'
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
    edit_html_filename = 'real_editor_directive'
    edit_js_filename = 'RealEditor'
    default_value = 0.0

    SCHEMA = {
        'type': 'float'
    }


class Int(BaseObject):
    """Integer class."""

    description = 'An integer.'
    edit_html_filename = 'int_editor_directive'
    edit_js_filename = 'IntEditor'
    default_value = 0

    SCHEMA = {
        'type': 'int'
    }


class UnicodeString(BaseObject):
    """Unicode string class."""

    description = 'A unicode string.'
    edit_html_filename = 'unicode_string_editor_directive'
    edit_js_filename = 'UnicodeStringEditor'
    default_value = ''

    SCHEMA = {
        'type': 'unicode',
    }


class Html(BaseObject):
    """HTML string class."""

    description = 'An HTML string.'
    edit_html_filename = 'html_editor_directive'
    edit_js_filename = 'HtmlEditor'

    SCHEMA = {
        'type': 'html',
    }


class NonnegativeInt(BaseObject):
    """Nonnegative integer class."""

    description = 'A non-negative integer.'
    edit_html_filename = 'nonnegative_int_editor_directive'
    edit_js_filename = 'NonnegativeIntEditor'
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
    edit_html_filename = 'code_string_editor_directive'
    edit_js_filename = 'CodeStringEditor'
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
    edit_html_filename = 'coord_two_dim_editor_directive'
    edit_js_filename = 'CoordTwoDimEditor'
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
    edit_html_filename = 'list_editor_directive'
    edit_js_filename = 'ListOfUnicodeStringEditor'

    SCHEMA = {
        'type': 'list',
        'items': UnicodeString.SCHEMA
    }


class SetOfUnicodeString(BaseObject):
    """Class for sets of UnicodeStrings."""

    description = 'A set (a list with unique elements) of unicode strings.'
    edit_html_filename = 'list_editor_directive'
    edit_js_filename = 'SetOfUnicodeStringEditor'
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
    edit_html_filename = 'unicode_string_editor_directive'
    edit_js_filename = 'NormalizedStringEditor'
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
    edit_html_filename = 'math_latex_string_editor_directive'
    edit_js_filename = 'MathLatexStringEditor'

    SCHEMA = UnicodeString.SCHEMA


class SanitizedUrl(BaseObject):
    """HTTP or HTTPS url string class."""

    description = 'An HTTP or HTTPS url.'
    edit_html_filename = 'unicode_string_editor_directive'
    edit_js_filename = 'SanitizedUrlEditor'

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
    edit_html_filename = 'music_phrase_editor_directive'
    edit_js_filename = 'MusicPhraseEditor'
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


class Filepath(BaseObject):
    """A string representing a filepath.

    The path will be prefixed with '[exploration_id]/assets'.
    """

    description = 'A string that represents a filepath'
    edit_html_filename = 'filepath_editor_directive'
    edit_js_filename = 'FilepathEditor'

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
    edit_html_filename = 'logic_question_editor'
    edit_js_filename = 'LogicQuestionEditor'

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
    edit_html_filename = 'logic_error_category_editor_directive'
    edit_js_filename = 'LogicErrorCategoryEditor'
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
    edit_html_filename = 'graph_editor_directive'
    edit_js_filename = 'GraphEditor'
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
    edit_html_filename = 'graph_property_editor_directive'
    edit_js_filename = 'GraphPropertyEditor'
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
    edit_html_filename = 'image_with_regions_editor_directive'
    edit_js_filename = 'ImageWithRegionsEditor'

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
    edit_html_filename = 'parameter_name_editor_directive'
    edit_js_filename = 'ParameterNameEditor'

    SCHEMA = {
        'type': 'unicode',
    }


class SetOfHtmlString(BaseObject):
    """A Set of Html Strings."""

    description = "A list of Html strings."
    edit_html_filename = 'set_of_html_string_editor_directive'
    edit_js_filename = 'SetOfHtmlStringEditor'
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
    edit_html_filename = 'fraction_editor_directive'
    edit_js_filename = 'FractionEditor'
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

    description = 'A units dict representation.'
    default_value = {}

    SCHEMA = {
        'type': 'dict',
        'properties': []
    }


class NumberWithUnits(BaseObject):
    """Number with units class."""

    description = 'A number with units expression.'
    edit_html_filename = 'number_with_units_editor_directive'
    edit_js_filename = 'NumberWithUnitsEditor'
    default_value = {
        'type': 'real',
        'fraction': Fraction.default_value,
        'real': 0.0,
        'unit': Units.default_value
    }

    SCHEMA = {
        'type': 'dict',
        'properties': [{
            'name': 'type',
            'schema': {
                'type': 'unicode'
            }
        }, {
            'name': 'fraction',
            'schema': Fraction.SCHEMA
        }, {
            'name': 'real',
            'schema': {
                'type': 'float'
            }
        }, {
            'name': 'unit',
            'schema': Units.SCHEMA
        }]
    }
