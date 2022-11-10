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

from __future__ import annotations

import numbers
import re
import urllib

from core import feconf
from core import utils
from core.constants import constants
from core.domain import expression_parser
from core.domain import html_cleaner
from core.domain import user_domain
from extensions.objects.models import objects

from typing import Any, Callable, Dict, List, Optional, cast

SCHEMA_KEY_ITEMS = 'items'
SCHEMA_KEY_LEN = 'len'
SCHEMA_KEY_PROPERTIES = 'properties'
SCHEMA_KEY_TYPE = 'type'
SCHEMA_KEY_POST_NORMALIZERS = 'post_normalizers'
SCHEMA_KEY_CHOICES = 'choices'
SCHEMA_KEY_NAME = 'name'
SCHEMA_KEY_KEYS = 'keys'
SCHEMA_KEY_VALUES = 'values'
SCHEMA_KEY_SCHEMA = 'schema'
SCHEMA_KEY_OBJ_TYPE = 'obj_type'
SCHEMA_KEY_VALIDATORS = 'validators'
SCHEMA_KEY_DEFAULT_VALUE = 'default_value'
SCHEMA_KEY_OBJECT_CLASS = 'object_class'
SCHEMA_KEY_VALIDATION_METHOD = 'validation_method'
SCHEMA_KEY_OPTIONS = 'options'

SCHEMA_TYPE_BOOL = 'bool'
SCHEMA_TYPE_CUSTOM = 'custom'
SCHEMA_TYPE_DICT = 'dict'
SCHEMA_TYPE_DICT_WITH_VARIABLE_NO_OF_KEYS = 'variable_keys_dict'
SCHEMA_TYPE_FLOAT = 'float'
SCHEMA_TYPE_HTML = 'html'
SCHEMA_TYPE_INT = 'int'
SCHEMA_TYPE_LIST = 'list'
SCHEMA_TYPE_UNICODE = 'unicode'
SCHEMA_TYPE_BASESTRING = 'basestring'
SCHEMA_TYPE_UNICODE_OR_NONE = 'unicode_or_none'
SCHEMA_TYPE_OBJECT_DICT = 'object_dict'
SCHEMA_TYPE_WEAK_MULTIPLE = 'weak_multiple'

SCHEMA_OBJ_TYPE_SUBTITLED_HTML = 'SubtitledHtml'
SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE = 'SubtitledUnicode'
ALL_SCHEMAS: Dict[str, type] = {
    SCHEMA_TYPE_BOOL: bool,
    SCHEMA_TYPE_DICT: dict,
    SCHEMA_TYPE_DICT_WITH_VARIABLE_NO_OF_KEYS: dict,
    SCHEMA_TYPE_FLOAT: float,
    SCHEMA_TYPE_HTML: str,
    SCHEMA_TYPE_INT: int,
    SCHEMA_TYPE_LIST: list,
    SCHEMA_TYPE_UNICODE: str,
    SCHEMA_TYPE_BASESTRING: str,
    SCHEMA_TYPE_UNICODE_OR_NONE: str
}

EMAIL_REGEX = r'[\w\.\+\-]+\@[\w]+\.[a-z]{2,3}'


# Here we use type Any because the following schema can have a recursive
# structure and mypy doesn't support recursive type currently.
# See: https://github.com/python/mypy/issues/731
def normalize_against_schema(
        obj: Any,
        schema: Dict[str, Any],
        apply_custom_validators: bool = True,
        global_validators: Optional[List[Dict[str, Any]]] = None
) -> Any:
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
        Exception. The object fails to validate against the schema.
        AssertionError. The validation for schema validators fails.
    """
    # Here we use type Any because 'normalized_obj' can be of type int, str,
    # Dict, List and other types too.
    normalized_obj: Any = None

    if schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_WEAK_MULTIPLE:
        for i in schema[SCHEMA_KEY_OPTIONS]:
            if isinstance(obj, ALL_SCHEMAS[i]):
                normalized_obj = obj
                break
        if normalized_obj is None:
            raise Exception(
                'Type of %s is not present in options' % obj)
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_BOOL:
        assert isinstance(obj, bool), ('Expected bool, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_CUSTOM:
        # Importing this at the top of the file causes a circular dependency.
        # TODO(sll): Either get rid of custom objects or find a way to merge
        # them into the schema framework -- probably the latter.
        from core.domain import object_registry
        obj_class = object_registry.Registry.get_object_class_by_type(
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

        missing_keys = list(sorted(set(expected_dict_keys) - set(obj.keys())))
        extra_keys = list(sorted(set(obj.keys()) - set(expected_dict_keys)))

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
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_DICT_WITH_VARIABLE_NO_OF_KEYS:
        assert isinstance(obj, dict), ('Expected dict, received %s' % obj)
        normalized_obj = {}
        for key, value in obj.items():
            normalized_key = normalize_against_schema(
                key, schema[SCHEMA_KEY_KEYS][SCHEMA_KEY_SCHEMA],
                global_validators=global_validators
            )
            normalized_obj[normalized_key] = normalize_against_schema(
                value, schema[SCHEMA_KEY_VALUES][SCHEMA_KEY_SCHEMA],
                global_validators=global_validators
            )
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_FLOAT:
        if isinstance(obj, bool):
            raise Exception('Expected float, received %s' % obj)
        try:
            obj = float(obj)
        except Exception as e:
            raise Exception('Could not convert %s to float: %s' % (
                type(obj).__name__, obj)) from e
        assert isinstance(obj, numbers.Real), (
            'Expected float, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_INT:
        try:
            obj = int(obj)
        except Exception as e:
            raise Exception('Could not convert %s to int: %s' % (
                type(obj).__name__, obj)) from e
        assert isinstance(obj, numbers.Integral), (
            'Expected int, received %s' % obj)
        assert isinstance(obj, int), ('Expected int, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_HTML:
        # TODO(#14028): Use just one type.
        assert isinstance(obj, (str, bytes)), (
            'Expected unicode HTML string, received %s' % obj)
        if isinstance(obj, bytes):
            obj = obj.decode('utf-8')
        else:
            obj = str(obj)
        assert isinstance(obj, str), (
            'Expected unicode, received %s' % obj)
        normalized_obj = html_cleaner.clean(obj)
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_LIST:
        assert isinstance(obj, list), ('Expected list, received %s' % obj)
        item_schema = schema[SCHEMA_KEY_ITEMS]
        if SCHEMA_KEY_LEN in schema:
            assert len(obj) == schema[SCHEMA_KEY_LEN], (
                'Expected length of %s got %s' % (
                    schema[SCHEMA_KEY_LEN], len(obj)))
        normalized_obj = [
            normalize_against_schema(
                item,
                item_schema,
                global_validators=global_validators
            ) for item in obj
        ]
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_BASESTRING:
        # TODO(#14028): Use just one type.
        assert isinstance(obj, (str, bytes)), (
            'Expected string, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_UNICODE:
        # TODO(#14028): Use just one type.
        assert isinstance(obj, (str, bytes)), (
            'Expected unicode string, received %s' % obj)
        if isinstance(obj, bytes):
            obj = obj.decode('utf-8')
        else:
            obj = str(obj)
        assert isinstance(obj, str), (
            'Expected unicode, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_UNICODE_OR_NONE:
        # TODO(#14028): Use just one type.
        assert obj is None or isinstance(obj, (str, bytes)), (
            'Expected unicode string or None, received %s' % obj)
        if obj is not None:
            if isinstance(obj, bytes):
                obj = obj.decode('utf-8')
            else:
                obj = str(obj)
            assert isinstance(obj, str), (
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
            normalized_obj = domain_object
        else:
            validation_method = schema[SCHEMA_KEY_VALIDATION_METHOD]
            normalized_obj = validation_method(obj)

        return normalized_obj
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
                expect_invalid_default_value = False
                if 'expect_invalid_default_value' in kwargs:
                    expect_invalid_default_value = kwargs[
                        'expect_invalid_default_value']
                    del kwargs['expect_invalid_default_value']
                del kwargs['id']
                validator_func = get_validator(validator['id'])
                if (
                    not validator_func(normalized_obj, **kwargs) and
                    not expect_invalid_default_value
                ):
                    raise AssertionError(
                        'Validation failed: %s (%s) for object %s' % (
                            validator['id'], kwargs, normalized_obj)
                    )

    if global_validators is not None:
        for validator in global_validators:
            kwargs = dict(validator)
            del kwargs['id']
            assert get_validator(
                validator['id'])(normalized_obj, **kwargs), (
                    'Validation failed: %s (%s) for object %s' % (
                        validator['id'], kwargs, normalized_obj))

    return normalized_obj


def get_validator(validator_id: str) -> Callable[..., bool]:
    """Get the validator method corresponding to the given validator_id.

    Args:
        validator_id: str. The name of the validator method that should
            be retrieved.

    Returns:
        function. The validator method corresponding to the given
        validator_id.
    """
    return _Validators.get(validator_id)


class Normalizers:
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
    def get(cls, normalizer_id: str) -> Callable[..., str]:
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
        # Here we use cast because the return value of getattr() method is
        # dynamic and mypy will assume it to be Any otherwise.
        return cast(Callable[..., str], getattr(cls, normalizer_id))

    @staticmethod
    def sanitize_url(obj: str) -> str:
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
        url_components = urllib.parse.urlsplit(obj)
        quoted_url_components = [
            urllib.parse.quote(component) for component in url_components]
        raw = urllib.parse.urlunsplit(quoted_url_components)

        acceptable = html_cleaner.filter_a('a', 'href', obj)
        assert acceptable, (
            'Invalid URL: Sanitized URL should start with '
            '\'http://\' or \'https://\'; received %s' % raw)
        return raw

    @staticmethod
    def normalize_spaces(obj: str) -> str:
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


class _Validators:
    """Various validators.

    A validator is a function that takes an object and returns True if it is
    valid, and False if it isn't.

    Validators should only be accessed from the checker methods in
    schema_utils.py and schema_utils_test.py, since these methods do
    preliminary checks on the arguments passed to the validator.
    """

    @classmethod
    def get(cls, validator_id: str) -> Callable[..., bool]:
        """Returns the validator method corresponding to the specified
        validator_id.

        Args:
            validator_id: str. The name of the validator method that should be
                retrieved.

        Returns:
            function. The validator method corresponding to the specified
            validator_id.

        Raises:
            Exception. Given validator method is invalid.
        """
        if not hasattr(cls, validator_id):
            raise Exception('Invalid validator id: %s' % validator_id)
        # Here we use cast because the return value of getattr() method is
        # dynamic and mypy will assume it to be Any otherwise.
        return cast(Callable[..., bool], getattr(cls, validator_id))

    @staticmethod
    def has_length_at_least(obj: List[str], min_value: int) -> bool:
        """Returns True iff the given object (a list) has at least
        `min_value` elements.

        Args:
            obj: list(str). A list of strings.
            min_value: int. The minimum number of elements that `obj` should
                contain.

        Returns:
            bool. Whether the given object has at least `min_value` elements.
        """
        return len(obj) >= min_value

    @staticmethod
    def has_length_at_most(obj: List[str], max_value: int) -> bool:
        """Returns True iff the given object (a list) has at most
        `max_value` elements.

        Args:
            obj: list(str). A list of strings.
            max_value: int. The maximum number of elements that `obj` should
                contain.

        Returns:
            bool. Whether the given object has at most `max_value` elements.
        """
        return len(obj) <= max_value

    @staticmethod
    def has_length(obj: List[str], value: int) -> bool:
        """Returns True iff the given object (a list) has exact
        `value` elements.

        Args:
            obj: list(str). A list of strings.
            value: int. The number of elements that `obj` should
                contain.

        Returns:
            bool. Whether the given object has exact `value` elements.
        """
        return len(obj) == value

    @staticmethod
    def is_nonempty(obj: str) -> bool:
        """Returns True iff the given object (a string) is nonempty.

        Args:
            obj: str. A string.

        Returns:
            bool. Whether the given object is nonempty.
        """
        return bool(obj)

    @staticmethod
    def is_uniquified(obj: List[str]) -> bool:
        """Returns True iff the given object (a list) has no duplicates.

        Args:
            obj: list(str). A list of strings.

        Returns:
            bool. Whether the given object has no duplicates.
        """
        return sorted(list(set(obj))) == sorted(obj)

    @staticmethod
    def is_url_fragment(obj: str) -> bool:
        """Returns True iff the given object (a string) is a valid
        URL fragment.

        Args:
            obj: str. A string.

        Returns:
            bool. Whether the given object is a valid URL fragment.
        """
        return bool(re.match(constants.VALID_URL_FRAGMENT_REGEX, obj))

    @staticmethod
    def is_at_least(obj: float, min_value: int) -> bool:
        """Ensures that `obj` (an int/float) is at least `min_value`.

        Args:
            obj: int|float. An object.
            min_value: int. The minimum allowed value for `obj`.

        Returns:
            bool. Whether the given object is at least `min_value`.
        """
        return obj >= min_value

    @staticmethod
    def is_at_most(obj: float, max_value: int) -> bool:
        """Ensures that `obj` (an int/float) is at most `max_value`.

        Args:
            obj: int|float. An object.
            max_value: int. The maximum allowed value for `obj`.

        Returns:
            bool. Whether the given object is at most `max_value`.
        """
        return obj <= max_value

    @staticmethod
    def does_not_contain_email(obj: str) -> bool:
        """Ensures that obj doesn't contain a valid email.

        Args:
            obj: str. The object to validate.

        Returns:
            bool. Whether the given object doesn't contain a valid email.
        """
        if isinstance(obj, str):
            return not bool(re.search(EMAIL_REGEX, obj))
        return True

    @staticmethod
    def is_valid_user_id(obj: str) -> bool:
        """Ensures that `obj` (a string) is a valid user ID.

        Args:
            obj: str. A string.

        Returns:
            bool. Whether the given object is a valid user ID.
        """
        return bool(re.search(feconf.USER_ID_REGEX, obj))

    @staticmethod
    def is_valid_math_expression(obj: str, algebraic: bool) -> bool:
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

        if not expression_parser.is_valid_expression(obj):
            return False

        expression_contains_at_least_one_variable = (
            expression_parser.contains_at_least_one_variable(obj))
        # This ensures that numeric expressions don't contain variables.
        return algebraic or not expression_contains_at_least_one_variable

    @staticmethod
    def is_valid_algebraic_expression(obj: str) -> bool:
        """Checks if the given obj (a string) represents a valid algebraic
        expression.

        Args:
            obj: str. The given math expression string.

        Returns:
            bool. Whether the given object is a valid algebraic expression.
        """
        return get_validator('is_valid_math_expression')(obj, algebraic=True)

    @staticmethod
    def is_valid_numeric_expression(obj: str) -> bool:
        """Checks if the given obj (a string) represents a valid numeric
        expression.

        Args:
            obj: str. The given math expression string.

        Returns:
            bool. Whether the given object is a valid numeric expression.
        """
        return get_validator('is_valid_math_expression')(obj, algebraic=False)

    @staticmethod
    def is_valid_math_equation(obj: str) -> bool:
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
        lhs, rhs = obj.split('=')

        # Both sides have to be valid expressions and at least one of them has
        # to have at least one variable.
        lhs_is_valid = is_valid_algebraic_expression(lhs)
        rhs_is_valid = is_valid_algebraic_expression(rhs)

        if not lhs_is_valid or not rhs_is_valid:
            return False

        lhs_contains_variable = (
            expression_parser.contains_at_least_one_variable(lhs))
        rhs_contains_variable = (
            expression_parser.contains_at_least_one_variable(rhs))

        if not lhs_contains_variable and not rhs_contains_variable:
            return False
        return True

    @staticmethod
    def is_supported_audio_language_code(obj: str) -> bool:
        """Checks if the given obj (a string) represents a valid language code.

        Args:
            obj: str. A string.

        Returns:
            bool. Whether the given object is a valid audio language code.
        """
        return utils.is_supported_audio_language_code(obj)

    @staticmethod
    def is_valid_audio_language_code(obj: str) -> bool:
        """Checks if the given obj (a string) represents a valid language code.

        Args:
            obj: str. The language code to verify.

        Returns:
            bool. Whether the given object is a valid audio language code.
        """
        return utils.is_valid_language_code(obj)

    @staticmethod
    def is_regex_matched(obj: str, regex_pattern: str) -> bool:
        """Checks if a given string is matched with the provided regular
        experssion.

        Args:
            obj: str. The string to verify.
            regex_pattern: str. Provided regular expression.

        Returns:
            bool. Whether the given object matched with the regex pattern.
        """
        return bool(re.match(regex_pattern, obj))

    @staticmethod
    def is_search_query_string(obj: str) -> bool:
        """Checks if the given obj (a string) is a gae search query string.

        Args:
            obj: str. The string to verify.

        Returns:
            bool. Whether the given object is a gae search query string.
        """
        if obj and (not obj.startswith('("') or not obj.endswith('")')):
            return False
        return True

    @staticmethod
    def is_valid_username_string(obj: str) -> bool:
        """Checks if the given obj (a string) is a valid username string.

        Args:
            obj: str. The string to verify.

        Returns:
            bool. Whether the given object is a valid username string.
        """

        try:
            user_domain.UserSettings.require_valid_username(obj)
            return True
        except utils.ValidationError:
            return False

    @staticmethod
    def has_expected_subtitled_content_length(
        obj: objects.SubtitledUnicode, max_value: int
    ) -> bool:
        """Checks if the given subtitled content length is within max value.

        Args:
            obj: objects.SubtitledUnicode. The object to verify.
            max_value: int. The maximum allowed value for the obj.

        Returns:
            bool. Whether the given object has length atmost the max_value.
        """
        # Ruling out the possibility of different types for mypy type checking.
        assert isinstance(obj, dict)
        return len(obj['unicode_str']) <= max_value

    @staticmethod
    def has_subtitled_html_non_empty(obj: objects.SubtitledHtml) -> bool:
        """Checks if the given subtitled html content is empty

        Args:
            obj: objects.SubtitledHtml. The object to verify.

        Returns:
            bool. Whether the given object is empty.
        """
        # Ruling out the possibility of different types for mypy type checking.
        assert isinstance(obj, dict)
        return obj['html'] not in ('', '<p></p>')

    @staticmethod
    def has_unique_subtitled_contents(
        obj: List[objects.SubtitledHtml]
    ) -> bool:
        """Checks if the given subtitled html content is uniquified.

        Args:
            obj: List[objects.SubtitledHtml]. The list of SubtitledHtml
                content.

        Returns:
            bool. Returns True if the content inside the list is uniquified.
        """
        seen_choices = []
        for choice in obj:
            # Ruling out the possibility of different types for mypy type
            # checking.
            assert isinstance(choice, dict)
            if choice['html'] in seen_choices:
                return False
            seen_choices.append(choice['html'])
        return True
