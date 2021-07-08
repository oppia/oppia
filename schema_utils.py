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

"""Utility functions for managing schemas and schema-based validation.

A schema is a way to specify the type of an object. For example, one might
want to require that an object is an integer, or that it is a dict with two
keys named 'abc' and 'def', each with values that are unicode strings. This
file contains utilities for validating schemas and for checking that objects
follow the definitions given by the schemas.

The objects that can be described by these schemas must be composable from the
following Python types: bool, dict, float, int, list, unicode.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import numbers
import re

from constants import constants
from core.domain import expression_parser
from core.domain import html_cleaner
import feconf
import python_utils
import utils

from typing import Any, Callable, Dict, List, Optional, Text, Union # isort:skip # pylint: disable=unused-import

SCHEMA_KEY_ITEMS = 'items'
SCHEMA_KEY_LEN = 'len'
SCHEMA_KEY_PROPERTIES = 'properties'
SCHEMA_KEY_TYPE = 'type'
SCHEMA_KEY_POST_NORMALIZERS = 'post_normalizers'
SCHEMA_KEY_CHOICES = 'choices'
SCHEMA_KEY_NAME = 'name'
SCHEMA_KEY_SCHEMA = 'schema'
SCHEMA_KEY_OBJ_TYPE = 'obj_type'
SCHEMA_KEY_VALIDATORS = 'validators'
SCHEMA_KEY_DEFAULT_VALUE = 'default_value'
SCHEMA_KEY_OBJECT_CLASS = 'object_class'
SCHEMA_KEY_VALIDATION_METHOD = 'validation_method'

SCHEMA_TYPE_BOOL = 'bool'
SCHEMA_TYPE_CUSTOM = 'custom'
SCHEMA_TYPE_DICT = 'dict'
SCHEMA_TYPE_FLOAT = 'float'
SCHEMA_TYPE_HTML = 'html'
SCHEMA_TYPE_INT = 'int'
SCHEMA_TYPE_LIST = 'list'
SCHEMA_TYPE_UNICODE = 'unicode'
SCHEMA_TYPE_BASESTRING = 'basestring'
SCHEMA_TYPE_UNICODE_OR_NONE = 'unicode_or_none'
SCHEMA_TYPE_OBJECT_DICT = 'object_dict'

SCHEMA_OBJ_TYPE_SUBTITLED_HTML = 'SubtitledHtml'
SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE = 'SubtitledUnicode'

EMAIL_REGEX = r'[\w\.\+\-]+\@[\w]+\.[a-z]{2,3}'


def normalize_against_schema(
        obj, schema, apply_custom_validators=True, global_validators=None):
    # type: (Any, Dict[Text, Any], bool, Optional[List[Dict[Text, Any]]]) -> Any
    """Validate the given object using the schema, normalizing if necessary.

    Args:
        obj: *. The object to validate and normalize.
        schema: dict(str, *). The schema to validate and normalize the value
            against.
        apply_custom_validators: bool. Whether to validate the normalized
            object using the validators defined in the schema.
        global_validators: list(dict). List of additional validators that will
            verify all the values in the schema.

    Returns:
        *. The normalized object.

    Raises:
        AssertionError. The object fails to validate against the schema.
    """
    normalized_obj = None # type: Any

    if schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_BOOL:
        assert isinstance(obj, bool), ('Expected bool, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_CUSTOM:
        # Importing this at the top of the file causes a circular dependency.
        # TODO(sll): Either get rid of custom objects or find a way to merge
        # them into the schema framework -- probably the latter.
        from core.domain import object_registry
        obj_class = object_registry.Registry.get_object_class_by_type( # type: ignore[no-untyped-call]
            schema[SCHEMA_KEY_OBJ_TYPE])
        if not apply_custom_validators:
            normalized_obj = normalize_against_schema(
                obj, obj_class.get_schema(), apply_custom_validators=False)
        else:
            normalized_obj = obj_class.normalize(obj)
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_DICT:
        assert isinstance(obj, dict), ('Expected dict, received %s' % obj)
        expected_dict_keys = [
            p[SCHEMA_KEY_NAME] for p in schema[SCHEMA_KEY_PROPERTIES]]

        missing_keys = list(set(expected_dict_keys) - set(obj.keys()))
        extra_keys = list(set(obj.keys()) - set(expected_dict_keys))

        assert set(obj.keys()) == set(expected_dict_keys), (
            'Missing keys: %s, Extra keys: %s' % (missing_keys, extra_keys))

        normalized_obj = {}
        for prop in schema[SCHEMA_KEY_PROPERTIES]:
            key = prop[SCHEMA_KEY_NAME]
            normalized_obj[key] = normalize_against_schema(
                obj[key],
                prop[SCHEMA_KEY_SCHEMA],
                global_validators=global_validators
            )
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_FLOAT:
        try:
            obj = float(obj)
        except Exception:
            raise Exception('Could not convert %s to float: %s' % (
                type(obj).__name__, obj))
        assert isinstance(obj, numbers.Real), (
            'Expected float, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_INT:
        try:
            obj = int(obj)
        except Exception:
            raise Exception('Could not convert %s to int: %s' % (
                type(obj).__name__, obj))
        assert isinstance(obj, numbers.Integral), (
            'Expected int, received %s' % obj)
        assert isinstance(obj, int), ('Expected int, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_HTML:
        assert isinstance(obj, python_utils.BASESTRING), (
            'Expected unicode HTML string, received %s' % obj)
        if isinstance(obj, bytes):
            obj = obj.decode('utf-8')
        else:
            obj = python_utils.UNICODE(obj)
        assert isinstance(obj, python_utils.UNICODE), (
            'Expected unicode, received %s' % obj)
        normalized_obj = html_cleaner.clean(obj) # type: ignore[no-untyped-call]
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_LIST:
        assert isinstance(obj, list), ('Expected list, received %s' % obj)
        item_schema = schema[SCHEMA_KEY_ITEMS]
        if SCHEMA_KEY_LEN in schema:
            assert len(obj) == schema[SCHEMA_KEY_LEN], (
                'Expected length of %s got %s' % (
                    schema[SCHEMA_KEY_LEN], len(obj)))
        normalized_obj = [
            normalize_against_schema(
                item, item_schema, global_validators=global_validators
            ) for item in obj
        ]
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_BASESTRING:
        assert isinstance(obj, python_utils.BASESTRING), (
            'Expected string, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_UNICODE:
        assert isinstance(obj, python_utils.BASESTRING), (
            'Expected unicode string, received %s' % obj)
        if isinstance(obj, bytes):
            obj = obj.decode('utf-8')
        else:
            obj = python_utils.UNICODE(obj)
        assert isinstance(obj, python_utils.UNICODE), (
            'Expected unicode, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_UNICODE_OR_NONE:
        assert obj is None or isinstance(obj, python_utils.BASESTRING), (
            'Expected unicode string or None, received %s' % obj)
        if obj is not None:
            if isinstance(obj, bytes):
                obj = obj.decode('utf-8')
            else:
                obj = python_utils.UNICODE(obj)
            assert isinstance(obj, python_utils.UNICODE), (
                'Expected unicode, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_OBJECT_DICT:
        # The schema type 'object_dict' accepts either of the keys
        # 'object_class' or 'validation_method'.
        # 'object_class' key is the most commonly used case, when the object is
        # initialized from_dict() method and the validation is done from
        # validate() method.
        # 'validation_method' key is used for some rare cases like if they have
        # validate_dict method instead of validate method, or if they need some
        # extra flags like for strict validation. The methods are written in the
        # domain_objects_validator file.

        if SCHEMA_KEY_OBJECT_CLASS in schema:
            validate_class = schema[SCHEMA_KEY_OBJECT_CLASS]
            domain_object = validate_class.from_dict(obj)
            domain_object.validate()
        else:
            validation_method = schema[SCHEMA_KEY_VALIDATION_METHOD]
            validation_method(obj)

        normalized_obj = obj
    else:
        raise Exception('Invalid schema type: %s' % schema[SCHEMA_KEY_TYPE])

    if SCHEMA_KEY_CHOICES in schema:
        assert normalized_obj in schema[SCHEMA_KEY_CHOICES], (
            'Received %s which is not in the allowed range of choices: %s' %
            (normalized_obj, schema[SCHEMA_KEY_CHOICES]))

    # When type normalization is finished, apply the post-normalizers in the
    # given order.
    if SCHEMA_KEY_POST_NORMALIZERS in schema:
        for normalizer in schema[SCHEMA_KEY_POST_NORMALIZERS]:
            kwargs = dict(normalizer)
            del kwargs['id']
            normalized_obj = Normalizers.get(normalizer['id'])(
                normalized_obj, **kwargs)

    # Validate the normalized object.
    if apply_custom_validators:
        if SCHEMA_KEY_VALIDATORS in schema:
            for validator in schema[SCHEMA_KEY_VALIDATORS]:
                kwargs = dict(validator)
                del kwargs['id']
                assert get_validator(
                    validator['id'])(normalized_obj, **kwargs), (
                        'Validation failed: %s (%s) for object %s' % (
                            validator['id'], kwargs, normalized_obj))

    if global_validators is not None:
        for validator in global_validators:
            kwargs = dict(validator)
            del kwargs['id']
            assert get_validator(
                validator['id'])(normalized_obj, **kwargs), (
                    'Validation failed: %s (%s) for object %s' % (
                        validator['id'], kwargs, normalized_obj))

    return normalized_obj


def get_validator(validator_id):
    # type: (Text) -> Callable[..., bool]
    """Get the validator method corresponding to the given validator_id.

    Args:
        validator_id: str. The name of the validator method that should
            be retrieved.

    Returns:
        function. The validator method corresponding to the given
        validator_id.
    """
    return _Validators.get(validator_id)


class Normalizers(python_utils.OBJECT):
    """Various normalizers.

    A normalizer is a function that takes an object, attempts to normalize
    it to a canonical representation, and/or performs validity checks on the
    object pre- and post-normalization. If the normalization succeeds, the
    function returns the transformed object; if it fails, it raises an
    exception.

    Some normalizers require additional arguments. It is the responsibility of
    callers of normalizer functions to ensure that the arguments they supply to
    the normalizer are valid. What exactly this entails is provided in the
    docstring for each normalizer.
    """

    @classmethod
    def get(cls, normalizer_id):
        # type: (Text) -> Callable[..., Any]
        """Returns the normalizer method corresponding to the specified
        normalizer_id.

        Args:
            normalizer_id: str. The name of the normalizer method that should be
                retrieved.

        Returns:
            function. The normalizer method corresponding to the given
            normalizer_id.

        Raises:
            Exception. The normalizer_id is not valid.
        """
        if not hasattr(cls, normalizer_id):
            raise Exception('Invalid normalizer id: %s' % normalizer_id)
        return getattr(cls, normalizer_id) # type: ignore[no-any-return]

    @staticmethod
    def sanitize_url(obj):
        # type: (Text) -> Text
        """Takes a string representing a URL and sanitizes it.

        Args:
            obj: str. A string representing a URL.

        Returns:
            str. An empty string if the URL does not start with http:// or
            https:// except when the string is empty. Otherwise, returns the
            original URL.

        Raises:
            AssertionError. The string is non-empty and does not start with
                http:// or https://.
        """
        if obj == '':
            return obj
        url_components = python_utils.url_split(obj) # type: ignore[no-untyped-call]
        quoted_url_components = (
            python_utils.url_quote(component) for component in url_components) # type: ignore[no-untyped-call]
        raw = python_utils.url_unsplit(quoted_url_components) # type: ignore[no-untyped-call]

        acceptable = html_cleaner.filter_a('a', 'href', obj) # type: ignore[no-untyped-call]
        assert acceptable, (
            'Invalid URL: Sanitized URL should start with '
            '\'http://\' or \'https://\'; received %s' % raw)
        return raw # type: ignore[no-any-return]

    @staticmethod
    def normalize_spaces(obj):
        # type: (Text) -> Text
        """Collapses multiple spaces into single spaces.

        Args:
            obj: str. String to be processed for multiple spaces.

        Returns:
            str. A string that is the same as `obj`, except that each block of
            whitespace is collapsed into a single space character. If the
            block of whitespace is at the front or end of obj, then it
            is simply removed.
        """
        return ' '.join(obj.split())


class _Validators(python_utils.OBJECT):
    """Various validators.

    A validator is a function that takes an object and returns True if it is
    valid, and False if it isn't.

    Validators should only be accessed from the checker methods in
    schema_utils.py and schema_utils_test.py, since these methods do
    preliminary checks on the arguments passed to the validator.
    """

    @classmethod
    def get(cls, validator_id):
        # type: (Text) -> Callable[..., bool]
        """Returns the validator method corresponding to the specified
        validator_id.

        Args:
            validator_id: str. The name of the validator method that should be
                retrieved.

        Returns:
            function. The validator method corresponding to the specified
            validator_id.
        """
        if not hasattr(cls, validator_id):
            raise Exception('Invalid validator id: %s' % validator_id)
        return getattr(cls, validator_id) # type: ignore[no-any-return]

    @staticmethod
    def has_length_at_least(obj, min_value):
        # type: (List[Any], int) -> bool
        """Returns True iff the given object (a list) has at least
        `min_value` elements.

        Args:
            obj: list(*). A list of strings.
            min_value: int. The minimum number of elements that `obj` should
                contain.

        Returns:
            bool. Whether the given object has at least `min_value` elements.
        """
        return len(obj) >= min_value

    @staticmethod
    def has_length_at_most(obj, max_value):
        # type: (List[Any], int) -> bool
        """Returns True iff the given object (a list) has at most
        `max_value` elements.

        Args:
            obj: list(*). A list of strings.
            max_value: int. The maximum number of elements that `obj` should
                contain.

        Returns:
            bool. Whether the given object has at most `max_value` elements.
        """
        return len(obj) <= max_value

    @staticmethod
    def is_nonempty(obj):
        # type: (Text) -> bool
        """Returns True iff the given object (a string) is nonempty.

        Args:
            obj: str. A string.

        Returns:
            bool. Whether the given object is nonempty.
        """
        return bool(obj)

    @staticmethod
    def is_uniquified(obj):
        # type: (List[Any]) -> bool
        """Returns True iff the given object (a list) has no duplicates.

        Args:
            obj: list(*). A list of strings.

        Returns:
            bool. Whether the given object has no duplicates.
        """
        return sorted(list(set(obj))) == sorted(obj)

    @staticmethod
    def is_url_fragment(obj):
        # type: (Text) -> bool
        """Returns True iff the given object (a string) is a valid
        URL fragment.

        Args:
            obj: str. A string.

        Returns:
            bool. Whether the given object is a valid URL fragment.
        """
        return bool(re.match(constants.VALID_URL_FRAGMENT_REGEX, obj))

    @staticmethod
    def is_at_least(obj, min_value):
        # type: (float, int) -> bool
        """Ensures that `obj` (an int/float) is at least `min_value`.

        Args:
            obj: int|float. An object.
            min_value: int. The minimum allowed value for `obj`.

        Returns:
            bool. Whether the given object is at least `min_value`.
        """
        return obj >= min_value

    @staticmethod
    def is_at_most(obj, max_value):
        # type: (float, int) -> bool
        """Ensures that `obj` (an int/float) is at most `max_value`.

        Args:
            obj: int|float. An object.
            max_value: int. The maximum allowed value for `obj`.

        Returns:
            bool. Whether the given object is at most `max_value`.
        """
        return obj <= max_value

    @staticmethod
    def does_not_contain_email(obj):
        # type: (object) -> bool
        """Ensures that obj doesn't contain a valid email.

        Args:
            obj: object. The object to validate.

        Returns:
            bool. Whether the given object doesn't contain a valid email.
        """
        string_types = (python_utils.BASESTRING, python_utils.UNICODE)
        if isinstance(obj, string_types):
            return not bool(re.search(EMAIL_REGEX, obj))
        return True

    @staticmethod
    def is_valid_user_id(obj):
        # type: (Text) -> bool
        """Ensures that `obj` (a string) is a valid user ID.

        Args:
            obj: str. A string.

        Returns:
            bool. Whether the given object is a valid user ID.
        """
        return bool(re.search(feconf.USER_ID_REGEX, obj))

    @staticmethod
    def is_valid_math_expression(obj, algebraic):
        # type: (Text, bool) -> bool
        """Checks if the given obj (a string) represents a valid algebraic or
        numeric expression. Note that purely-numeric expressions are NOT
        considered valid algebraic expressions.

        Args:
            obj: str. The given math expression string.
            algebraic: bool. True if the given expression is algebraic
                else numeric.

        Returns:
            bool. Whether the given object is a valid expression.
        """
        if len(obj) == 0:
            return True

        if not expression_parser.is_valid_expression(obj): # type: ignore[no-untyped-call]
            return False

        expression_is_algebraic = expression_parser.is_algebraic(obj) # type: ignore[no-untyped-call]
        # If the algebraic flag is true, expression_is_algebraic should
        # also be true, otherwise both should be false which would imply
        # that the expression is numeric.
        return not algebraic ^ expression_is_algebraic

    @staticmethod
    def is_valid_algebraic_expression(obj):
        # type: (Text) -> bool
        """Checks if the given obj (a string) represents a valid algebraic
        expression.

        Args:
            obj: str. The given math expression string.

        Returns:
            bool. Whether the given object is a valid algebraic expression.
        """
        return get_validator('is_valid_math_expression')(obj, algebraic=True)

    @staticmethod
    def is_valid_numeric_expression(obj):
        # type: (Text) -> bool
        """Checks if the given obj (a string) represents a valid numeric
        expression.

        Args:
            obj: str. The given math expression string.

        Returns:
            bool. Whether the given object is a valid numeric expression.
        """
        return get_validator('is_valid_math_expression')(obj, algebraic=False)

    @staticmethod
    def is_valid_math_equation(obj):
        # type: (Text) -> bool
        """Checks if the given obj (a string) represents a valid math equation.

        Args:
            obj: str. The given math equation string.

        Returns:
            bool. Whether the given object is a valid math equation.
        """
        if len(obj) == 0:
            return True
        if obj.count('=') != 1:
            return False

        is_valid_algebraic_expression = get_validator(
            'is_valid_algebraic_expression')
        is_valid_numeric_expression = get_validator(
            'is_valid_numeric_expression')
        lhs, rhs = obj.split('=')

        # Both sides have to be valid expressions and at least one of them has
        # to be a valid algebraic expression.
        lhs_is_algebraically_valid = is_valid_algebraic_expression(lhs)
        rhs_is_algebraically_valid = is_valid_algebraic_expression(rhs)

        lhs_is_numerically_valid = is_valid_numeric_expression(lhs)
        rhs_is_numerically_valid = is_valid_numeric_expression(rhs)

        if lhs_is_algebraically_valid and rhs_is_algebraically_valid:
            return True
        if lhs_is_algebraically_valid and rhs_is_numerically_valid:
            return True
        if lhs_is_numerically_valid and rhs_is_algebraically_valid:
            return True
        return False

    @staticmethod
    def is_supported_audio_language_code(obj):
        # type: (Text) -> bool
        """Checks if the given obj (a string) represents a valid language code.

        Args:
            obj: str. A string.

        Returns:
            bool. Whether the given object is a valid audio language code.
        """
        return utils.is_supported_audio_language_code(obj)

    @staticmethod
    def is_valid_audio_language_code(obj):
        # type: (Text) -> bool
        """Checks if the given obj (a string) represents a valid language code.

        Args:
            obj: str. The language code to verify.

        Returns:
            bool. Whether the given object is a valid audio language code.
        """
        return utils.is_valid_language_code(obj)
