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

from __future__ import annotations

import copy
import json

from core import schema_utils
from core.constants import constants

from typing import Any, Dict, List, Optional, Union

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain
    from typing import TypedDict

    class CheckedProofDict(TypedDict):
        """Dictionary representing the CheckedProof object."""

        assumptions_string: str
        target_string: str
        proof_string: str
        correct: bool
        error_category: str
        error_code: str
        error_message: str
        error_line_number: str

    class FractionDict(TypedDict):
        """Dictionary representing the Fraction object."""

        isNegative: bool
        wholeNumber: int
        numerator: int
        denominator: int

    class CodeEvaluationDict(TypedDict):
        """Dictionary representing the CodeEvaluation object."""

        code: str
        output: str
        evaluation: str
        error: str

    class MathExpressionContentDict(TypedDict):
        """Dictionary representing the MathExpressionContent object."""

        raw_latex: str
        svg_filename: str

    class MusicPhraseDict(TypedDict):
        """Dictionary representing the MusicPhrase object."""

        readableNoteName: str
        noteDuration: Dict[str, int]

    class UnitsDict(TypedDict):
        """Dictionary representing the Units object."""

        unit: str
        exponent: int

    class NumberWithUnitsDict(TypedDict):
        """Dictionary representing the NumberWithUnits object."""

        type: str
        real: float
        fraction: FractionDict
        units: List[UnitsDict]

    class TranslatableSetOfUnicodeStringDict(TypedDict):
        """Dictionary representing the TranslatableSetOfUnicodeString object."""

        contentId: Optional[str]
        unicodeStrSet: List[str]

    class TranslatableUnicodeStringDict(TypedDict):
        """Dictionary representing the TranslatableUnicodeString object."""

        contentId: Optional[str]
        unicodeStr: str

    class TranslatableHtmlDict(TypedDict):
        """Dictionary representing the TranslatableHtml object."""

        contentId: Optional[str]
        html: str

    class TranslatableSetOfNormalizedStringDict(TypedDict):
        """Dictionary representing the TranslatableSetOfNormalizedString
        object.
        """

        contentId: Optional[str]
        normalizedStrSet: List[str]

    TranslatableObjectDefaultValueTypes = Union[
        None,
        TranslatableSetOfUnicodeStringDict,
        TranslatableUnicodeStringDict,
        TranslatableHtmlDict,
        TranslatableSetOfNormalizedStringDict
    ]

    AllowedDefaultValueTypes = Union[
        str,
        None,
        float,
        List[str],
        List[int],
        List[float],
        List[List[str]],
        List[List[float]],
        List[UnitsDict],
        List[domain.GraphDict],
        List[CodeEvaluationDict],
        List[MusicPhraseDict],
        MathExpressionContentDict,
        FractionDict,
        NumberWithUnitsDict,
        domain.GraphDict,
        TranslatableObjectDefaultValueTypes
    ]

    # Here we use type Any because here we are defining type variable for schema
    # dictionaries, and in schema dictionaries, values can be of any type like
    # str, Dict, nested Dict and etc.
    SchemaDictType = Dict[str, Any]


class BaseObject:
    """Base object class.

    This is the superclass for typed object specifications in Oppia, such as
    SanitizedUrl and CoordTwoDim.

    Typed objects are initialized from a raw Python object which is expected to
    be derived from a JSON object. They are validated and normalized to basic
    Python objects (primitive types combined via lists and dicts; no sets or
    tuples).
    """

    # These values should be overridden in subclasses.
    description: str = ''
    edit_js_filename: Optional[str] = None
    # This should be non-null if the object class is used when specifying a
    # rule.
    default_value: AllowedDefaultValueTypes = None

    # TODO(#16047): Here we use type Any because BaseObject class is not
    # implemented according to the strict typing which forces us to use Any
    # here so that MyPy does not throw errors for different types of values
    # used in sub-classes. Once this BaseObject is refactored, we can
    # remove type Any from here.
    @classmethod
    def normalize(cls, raw: Any) -> Any:
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

    # Here we use type Any because get_schema() returns a schema dictionary and
    # values in a schema dictionary can be of type str, List, Dict, nested Dict
    # and other types too.
    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """This method should be implemented by subclasses.

        Raises:
            NotImplementedError. The method is not overwritten in a derived
                class.
        """
        raise NotImplementedError(
            'The get_schema() method is missing from the derived class. It '
            'should be implemented in the derived class.')


class Boolean(BaseObject):
    """Class for booleans."""

    description = 'A boolean.'
    edit_js_filename = 'BooleanEditor'

    @classmethod
    def get_schema(cls) -> Dict[str, str]:
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'bool'
        }

    @classmethod
    def normalize(cls, raw: Optional[Union[str, bool]]) -> bool:
        """Validates and normalizes a raw Python object.

        Args:
            raw: *. A Python object to be validated against the schema,
                normalizing if necessary.

        Returns:
            bool. The normalized object (or False if the input is None or '').
        """
        if raw is None or raw == '':
            raw = False

        normalized_value: bool = schema_utils.normalize_against_schema(
            raw, cls.get_schema()
        )
        return normalized_value


class Real(BaseObject):
    """Real number class."""

    description = 'A real number.'
    default_value = 0.0

    @classmethod
    def get_schema(cls) -> Dict[str, str]:
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
    def get_schema(cls) -> Dict[str, str]:
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
    def get_schema(cls) -> Dict[str, str]:
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
    def get_schema(cls) -> Dict[str, str]:
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'html',
        }


# TODO(#11433): Migrate SubtitledUnicode to TranslatableUnicodeString.
class SubtitledUnicode(BaseObject):
    """SubtitledUnicode class."""

    description = 'A dictionary with properties "content_id" and "unicode".'

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    """Positive integer class."""

    description = 'A positive integer.'
    default_value = 1

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    def normalize(cls, raw: str) -> str:
        """Validates and normalizes a raw Python object.

        Args:
            raw: *. A Python object to be validated against the schema,
                normalizing if necessary.

        Returns:
            unicode. The normalized object containing string in unicode format.

        Raises:
            TypeError. Unexpected tab characters in given python object 'raw'.
        """
        if '\t' in raw:
            raise TypeError(
                'Unexpected tab characters in code string: %s' % raw)
        normalized_value: str = schema_utils.normalize_against_schema(
            raw, cls.get_schema()
        )
        return normalized_value


class CodeEvaluation(BaseObject):
    """Evaluation result of programming code."""

    description = 'Code and its evaluation results.'

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    default_value: List[CodeEvaluationDict] = []

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    default_value: List[List[float]] = []

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    default_value: List[str] = []

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    default_value: List[str] = []

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    default_value: MathExpressionContentDict = {
        'raw_latex': '',
        'svg_filename': ''
    }

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    default_value: List[MusicPhraseDict] = []

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
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> Dict[str, str]:
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
    def get_schema(cls) -> Dict[str, str]:
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return UnicodeString.get_schema()


class CheckedProof(BaseObject):
    """A proof attempt and any errors it makes."""

    description = 'A proof attempt and any errors it makes.'

    @classmethod
    def normalize(cls, raw: CheckedProofDict) -> CheckedProofDict:
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
            assert isinstance(raw['assumptions_string'], str)
            assert isinstance(raw['target_string'], str)
            assert isinstance(raw['proof_string'], str)
            assert raw['correct'] in [True, False]
            if not raw['correct']:
                assert isinstance(raw['error_category'], str)
                assert isinstance(raw['error_code'], str)
                assert isinstance(raw['error_message'], str)
                assert isinstance(raw['error_line_number'], int)
            return copy.deepcopy(raw)
        except Exception as e:
            raise TypeError('Cannot convert to checked proof %s' % raw) from e


class Graph(BaseObject):
    """A (mathematical) graph with edges and vertices."""

    description = 'A (mathematical) graph'
    default_value: domain.GraphDict = {
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
    def get_schema(cls) -> SchemaDictType:
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
    def normalize(cls, raw: domain.GraphDict) -> domain.GraphDict:
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

        except Exception as e:
            raise TypeError('Cannot convert to graph %s' % raw) from e

        return raw


class GraphProperty(BaseObject):
    """A string from a list of possible graph properties."""

    description = 'One of the possible properties possessed by a graph.'
    default_value = 'strongly_connected'

    @classmethod
    def get_schema(cls) -> Dict[str, Union[str, List[str]]]:
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
    default_value: List[domain.GraphDict] = []

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    def normalize(cls, raw: List[List[float]]) -> List[List[float]]:
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
        def clamp(value: float) -> float:
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

        except Exception as e:
            raise TypeError(
                'Cannot convert to Normalized Rectangle %s' % raw) from e

        return raw


class ImageRegion(BaseObject):
    """A region of an image, including its shape and coordinates."""

    description = 'A region of an image.'

    # Note: at the moment, only supports rectangular image regions.
    # Coordinates are:
    #   [[top-left-x, top-left-y], [bottom-right-x, bottom-right-y]].
    # Origin is top-left, increasing x is to the right, increasing y is down.
    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> Dict[str, str]:
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
        }


class Fraction(BaseObject):
    """Fraction class."""

    description = 'A fraction type'
    default_value: FractionDict = {
        'isNegative': False,
        'wholeNumber': 0,
        'numerator': 0,
        'denominator': 1
    }

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    default_value: List[UnitsDict] = []

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    default_value: NumberWithUnitsDict = {
        'type': 'real',
        'real': 0.0,
        'fraction': Fraction.default_value,
        'units': Units.default_value
    }

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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


class DragAndDropPositiveInt(BaseObject):
    """A drag and drop positive int class representing the rank(position) of a
    drag and drop item.
    """

    description = (
        'The rank(position) of a drag and drop item in the given list of sets' +
        'of drag and drop items.')
    default_value = 1

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'unicode',
            'choices': constants.VALID_ALLOWED_VARIABLES
        }


class AlgebraicIdentifier(BaseObject):
    """Class for an algebraic identifier.
    An algebraic identifier could be an english alphabet (uppercase/lowercase)
    or a greek letter represented as a single word.
    """

    description = 'A string representing an algebraic identifier.'
    default_value = 'x'

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    default_value: List[str] = []

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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
    def get_schema(cls) -> SchemaDictType:
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


class AllowedVariables(BaseObject):
    """Class for custom OSK letters. These are the letters that will be
    displayed to the learner for AlgebraicExpressionInput and MathEquationInput
    interactions when the on-screen keyboard is being used. This includes Latin
    and Greek alphabets.
    """

    description = (
        'Shortcut variables that the learner can access in the '
        'on-screen keyboard. (The order of these variables will be reflected '
        'in the learner\'s keyboard)')
    default_value: List[str] = []

    @classmethod
    def get_schema(cls) -> SchemaDictType:
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


class TranslatableHtmlContentId(BaseObject):
    """A TranslatableHtml content id."""

    default_value = ''

    @classmethod
    def get_schema(cls) -> Dict[str, str]:
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return UnicodeString.get_schema()


class SetOfTranslatableHtmlContentIds(BaseObject):
    """A Set of TranslatableHtml content ids."""

    default_value: List[str] = []

    @classmethod
    def get_schema(cls) -> SchemaDictType:
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': TranslatableHtmlContentId.get_schema(),
            'validators': [{
                'id': 'is_uniquified'
            }]
        }


class ListOfSetsOfTranslatableHtmlContentIds(BaseObject):
    """List of sets of TranslatableHtml content ids."""

    default_value: List[List[str]] = []

    @classmethod
    def get_schema(cls) -> SchemaDictType:
        """Returns the object schema.

        Returns:
            dict. The object schema.
        """
        return {
            'type': 'list',
            'items': SetOfTranslatableHtmlContentIds.get_schema()
        }


class BaseTranslatableObject(BaseObject):
    """Base translatable object class.

    This is a superclass for objects that are translatable and thus require a
    content id. This class enforces that the object is a dictionary with a
    content id field. The schema of the actual value is determined by the
    _value_schema property.
    """

    # The key name in the translatable object corresponding to the translatable
    # value. This field must be populated by subclasses.
    _value_key_name: Optional[str] = None
    # The schema of the translatable value. This field must be populated by
    # subclasses.
    _value_schema: Optional[SchemaDictType] = None
    # The default value of the object. This field must be populated by
    # subclasses.
    default_value: TranslatableObjectDefaultValueTypes = None

    @classmethod
    def normalize_value(
        cls, value: Union[str, List[str]]
    ) -> Union[str, List[str]]:
        """Normalizes the translatable value of the object.

        Args:
            value: *. The translatable part of the Python object (corresponding
                to the non-content-id field) which is to be normalized.

        Returns:
            *. The normalized value.

        Raises:
            NotImplementedError. The _value_key_name or _value_schema
                is not set.
        """
        if cls._value_key_name is None or cls._value_schema is None:
            raise NotImplementedError(
                'The _value_key_name and _value_schema for this class must '
                'both be set.')
        normalized_value: Union[
            str, List[str]
        ] = schema_utils.normalize_against_schema(value, cls._value_schema)
        return normalized_value

    @classmethod
    def get_schema(cls) -> SchemaDictType:
        """Returns the full object schema.

        Returns:
            dict. The object schema.

        Raises:
            NotImplementedError. The _value_key_name or _value_schema
                is not set.
        """
        if cls._value_key_name is None or cls._value_schema is None:
            raise NotImplementedError(
                'The _value_key_name and _value_schema for this class must '
                'both be set.')
        return {
            'type': 'dict',
            'properties': [{
                'name': 'contentId',
                # The default content id is none. However, it should be
                # populated before being saved. The normalize() method has
                # validation checks for this.
                'schema': {'type': 'unicode'}
            }, {
                'name': cls._value_key_name,
                'schema': copy.deepcopy(cls._value_schema),
            }]
        }


class TranslatableUnicodeString(BaseTranslatableObject):
    """Class for translatable unicode strings."""

    _value_key_name = 'unicodeStr'
    _value_schema = UnicodeString.get_schema()
    default_value: TranslatableUnicodeStringDict = {
        'contentId': None,
        'unicodeStr': '',
    }


class TranslatableHtml(BaseTranslatableObject):
    """Class for translatable HTML strings."""

    _value_key_name = 'html'
    _value_schema = Html.get_schema()
    default_value: TranslatableHtmlDict = {
        'contentId': None,
        'html': '',
    }


class TranslatableSetOfNormalizedString(BaseTranslatableObject):
    """Class for translatable sets of NormalizedStrings."""

    _value_key_name = 'normalizedStrSet'
    _value_schema = SetOfNormalizedString.get_schema()
    default_value: TranslatableSetOfNormalizedStringDict = {
        'contentId': None,
        'normalizedStrSet': [],
    }


class TranslatableSetOfUnicodeString(BaseTranslatableObject):
    """Class for translatable sets of UnicodeStrings."""

    _value_key_name = 'unicodeStrSet'
    _value_schema = SetOfUnicodeString.get_schema()
    default_value: TranslatableSetOfUnicodeStringDict = {
        'contentId': None,
        'unicodeStrSet': [],
    }


class JsonEncodedInString(BaseObject):
    """Converts stringified value to its actual data type."""

    # Here we use type Any because the method 'normalize' can return any kind
    # of python object based on the JSON string provided.
    @classmethod
    def normalize(cls, raw: str) -> Any:
        """Validates and normalizes a raw Python object.

        Args:
            raw: str. Strings to be validated and normalized.

        Returns:
            *. The normalized value of any type, it depends on the raw value
            which we want to load from json.

        Raises:
            Exception. Given arg is not of type str.
        """
        if not isinstance(raw, str):
            raise Exception('Expected string received %s of type %s' % (
                raw, type(raw))
            )

        return json.loads(raw)
