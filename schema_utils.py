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

from core.domain import html_cleaner
import python_utils

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

SCHEMA_TYPE_BOOL = 'bool'
SCHEMA_TYPE_CUSTOM = 'custom'
SCHEMA_TYPE_DICT = 'dict'
SCHEMA_TYPE_FLOAT = 'float'
SCHEMA_TYPE_HTML = 'html'
SCHEMA_TYPE_INT = 'int'
SCHEMA_TYPE_LIST = 'list'
SCHEMA_TYPE_UNICODE = 'unicode'

OPERATOR_PRECEDENCE = {
    '+': 1,
    '-': 1, # Binary subtraction.
    '~': 1, # Unary negation.
    '*': 2,
    '/': 2,
    '^': 3
}

GREEK_LETTERS = {
    'alpha': 'a',
    'beta': 'b',
    'gamma': 'c',
    'delta': 'd',
    'epsilon': 'e',
    'pi': 'p',
    'omega': 'o',
}


def normalize_against_schema(obj, schema, apply_custom_validators=True):
    """Validate the given object using the schema, normalizing if necessary.

    Args:
        obj: *. The object to validate and normalize.
        schema: dict(str, *). The schema to validate and normalize the value
            against.
        apply_custom_validators: bool. Whether to validate the normalized
             object using the validators defined in the schema.

    Returns:
        *. The normalized object.

    Raises:
        AssertionError: The object fails to validate against the schema.
    """
    normalized_obj = None

    if schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_BOOL:
        assert isinstance(obj, bool), ('Expected bool, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_CUSTOM:
        # Importing this at the top of the file causes a circular dependency.
        # TODO(sll): Either get rid of custom objects or find a way to merge
        # them into the schema framework -- probably the latter.
        from core.domain import obj_services
        obj_class = obj_services.Registry.get_object_class_by_type(
            schema[SCHEMA_KEY_OBJ_TYPE])
        if not apply_custom_validators:
            normalized_obj = normalize_against_schema(
                obj, obj_class.SCHEMA, apply_custom_validators=False)
        else:
            normalized_obj = obj_class.normalize(obj)
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_DICT:
        assert isinstance(obj, dict), ('Expected dict, received %s' % obj)
        expected_dict_keys = [
            p[SCHEMA_KEY_NAME] for p in schema[SCHEMA_KEY_PROPERTIES]]
        assert set(obj.keys()) == set(expected_dict_keys), (
            'Missing keys: %s, Extra keys: %s' % (
                list(set(expected_dict_keys) - set(obj.keys())),
                list(set(obj.keys()) - set(expected_dict_keys))))

        normalized_obj = {}
        for prop in schema[SCHEMA_KEY_PROPERTIES]:
            key = prop[SCHEMA_KEY_NAME]
            normalized_obj[key] = normalize_against_schema(
                obj[key], prop[SCHEMA_KEY_SCHEMA])
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_FLOAT:
        obj = float(obj)
        assert isinstance(obj, numbers.Real), (
            'Expected float, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_INT:
        obj = int(obj)
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
        normalized_obj = html_cleaner.clean(obj)
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_LIST:
        assert isinstance(obj, list), ('Expected list, received %s' % obj)
        item_schema = schema[SCHEMA_KEY_ITEMS]
        if SCHEMA_KEY_LEN in schema:
            assert len(obj) == schema[SCHEMA_KEY_LEN]
        normalized_obj = [
            normalize_against_schema(item, item_schema) for item in obj
        ]
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

    return normalized_obj


def get_validator(validator_id):
    """Get the validator method corresponding to the given validator_id.

    Args:
        validator_id: str. The name of the validator method that should
            be retrieved.

    Returns:
        function. The validator method corresponding to the given
            validator_id.
    """
    return _Validators.get(validator_id)


def is_numeric_operand(string):
    """Checks if the given string represents a valid number.

    Args:
        string: str. The operand to be validated.

    Returns:
        bool. Whether the given string is a valid numeric operand.
    """
    try:
        float(string)
        return True
    except ValueError:
        return False


def is_algebraic_operand(string):
    """Checks if the given string represents a valid algebraic operand
    (variable). Given string must be a singular english alphabet or a valid
    greek letter.

    Args:
        string: str. The operand to be validated.

    Returns:
        bool. Whether the given string is a valid algebraic operand.
    """
    return (
        string.isalpha() and len(string) == 1) or string in GREEK_LETTERS.keys()


def is_operand(string):
    """Checks if the given string represents a valid algebraic/numeric operand.

    Args:
        string: str. The operand to be validated.

    Returns:
        bool. Whether the given string is a valid algebraic/numeric operand.
    """
    return is_numeric_operand(string) or is_algebraic_operand(string)


def contains_balanced_brackets(expression):
    """Checks if the given expression contains a balanced bracket sequence.

    Args:
        expression: str. A math expression (algebraic/numeric).

    Returns:
        bool. Whether the given expression contains a balanced
            bracket sequence.
    """
    openers, closers = '({[', ')}]'
    stack = []
    for character in expression:
        if character in openers:
            stack.append(character)
        elif character in closers:
            if len(stack) == 0:
                return False
            top_element = stack.pop()
            if openers.index(top_element) != closers.index(character):
                return False
    return len(stack) == 0


def tokenize(expression):
    """Tokenizes the given math expression into separate components.

    Args:
        expression: str. A math expression (algebraic/numeric).

    Returns:
        list. A list of tokens present in the expression.
    """

    # Removing whitespace.
    expression = expression.replace(' ', '')

    # Replacing greek letters with corresponding symbols. The replaced symbols
    # are english letters since this is just a structural check so the exact
    # greek letters are not needed.
    for letter in GREEK_LETTERS:
        expression = expression.replace(letter, GREEK_LETTERS[letter])

    # Replacing all parenthesis with () since once the balance is validated, the
    # type of parenthesis makes no difference for syntactic validation.
    expression = expression.replace('{', '(')
    expression = expression.replace('}', ')')
    expression = expression.replace('[', '(')
    expression = expression.replace(']', ')')

    tokens = []

    index = 0
    while index < len(expression):
        current_token_list = []
        # If character is a numeric operand, add all following numbers to the
        # current token.
        while is_numeric_operand(expression[index]) or expression[index] == '.':
            current_token_list.append(expression[index])
            index += 1
            if index == len(expression):
                break

        if len(current_token_list) != 0:
            tokens.append(''.join(current_token_list))
        else:
            if is_algebraic_operand(expression[index]):
                tokens.append(expression[index])
            else:
                # This is required to signify the distinction between the unary
                # negation operation and the binary subtraction operation.
                # For unary negation: The negative sign must be followed by an
                # operand and preceded by a '(' or must be the first character.
                # otherwise its binary subtraction.
                if expression[index] == '-' and index < len(expression) - 1:
                    if (index == 0 or expression[
                            index - 1] == '(') and is_operand(expression[
                                index + 1]):
                        tokens.append('~')
                    else:
                        tokens.append('-')
                else:
                    tokens.append(expression[index])
            index += 1

    return tokens


def infix_to_postfix(expression):
    """Converts the given infix notation to postfix using the
    Shunting-Yard algorithm. This function expects the given expression to have
    valid bracket sequence.

    Args:
        expression: str. A math expression (algebraic/numeric).

    Returns:
        list|None. The postfix notation of the given expression. Returns None if
            the given expression is invalid.
    """
    postfix_expression, stack = [], []

    tokens = tokenize(expression)

    for token in tokens:
        if is_operand(token):
            postfix_expression.append(token)
        elif token in OPERATOR_PRECEDENCE.keys():
            while True:
                if len(stack) == 0:
                    stack.append(token)
                    break

                top_char = stack[-1]

                if top_char == '(':
                    stack.append(token)
                    break
                else:
                    if OPERATOR_PRECEDENCE[token] > OPERATOR_PRECEDENCE[
                            top_char]:
                        stack.append(token)
                        break
                    else:
                        postfix_expression.append(stack.pop())
        elif token == '(':
            stack.append(token)
        elif token == ')':
            top_char = stack.pop()
            while top_char != '(':
                postfix_expression.append(top_char)
                top_char = stack.pop()
        else:
            # The token is invalid.
            return None

    while len(stack):
        postfix_expression.append(stack.pop())

    return postfix_expression


def is_valid_postfix_expression(tokenized_expression):
    """Checks if the given postfix expression is syntactically valid.
    Evaluates the expression based on the operators present. For every operator,
    there must be at least two operands preceding it, except with the unary
    negation operator which requires at least one operand preceding it.

    Args:
        tokenized_expression: list. A tokenized postfix notation of the
            math expression.

    Returns:
        bool. Whether the given postfix notation is syntactically valid.
    """
    stack = []

    for token in tokenized_expression:
        if is_operand(token):
            stack.append(token)
        else:
            # If operator is unary negation, there must be at least one operand
            # in the stack, otherwise there must be at least two, both of which
            # will be replaced by the result of their operation with the
            # operand.
            if token != '~':
                if len(stack) < 2:
                    return False
                stack.pop()
                stack[-1] = 'X'

    # In the end, the stack should only contain the resultant value, an operand.
    return len(stack) == 1 and is_operand(stack[0])


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
        """Returns the normalizer method corresponding to the specified
        normalizer_id.

        Args:
            normalizer_id: str. The name of the normalizer method that should be
                retrieved.

        Returns:
            function. The normalizer method corresponding to the given
                normalizer_id.

        Raises:
            Exception: The normalizer_id is not valid.
        """
        if not hasattr(cls, normalizer_id):
            raise Exception('Invalid normalizer id: %s' % normalizer_id)
        return getattr(cls, normalizer_id)
# TODO(ankita240796): The disable comment is required since the lint tests
# fail on circleci with the multiple-statements error on the line even though
# the line is empty. This is a temporary fix to unblock PRs.
# Relevant issue: https://github.com/oppia/oppia/issues/7307.
# pylint: disable=multiple-statements
    @staticmethod
    def sanitize_url(obj):
        """Takes a string representing a URL and sanitizes it.

        Args:
            obj: a string representing a URL.

        Returns:
            An empty string if the URL does not start with http:// or https://
            except when the string is empty. Otherwise, returns the original
            URL.

        Raises:
            AssertionError: The string is non-empty and does not start with
            http:// or https://
        """
        if obj == '':
            return obj
        url_components = python_utils.url_split(obj)
        quoted_url_components = (
            python_utils.url_quote(component) for component in url_components)
        raw = python_utils.url_unsplit(quoted_url_components)

        acceptable = html_cleaner.filter_a('a', 'href', obj)
        assert acceptable, (
            'Invalid URL: Sanitized URL should start with '
            '\'http://\' or \'https://\'; received %s' % raw)
        return raw

    @staticmethod
    def normalize_spaces(obj):
        """Collapses multiple spaces into single spaces.

        Args:
            obj: a string.

        Returns:
            A string that is the same as `obj`, except that each block of
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
        return getattr(cls, validator_id)

    @staticmethod
    def has_length_at_least(obj, min_value):
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
        """Returns True iff the given object (a string) is nonempty.

        Args:
            obj: str. A string.

        Returns:
            bool. Whether the given object is nonempty.
        """
        return bool(obj)

    @staticmethod
    def is_uniquified(obj):
        """Returns True iff the given object (a list) has no duplicates.

        Args:
            obj: list(*). A list of strings.

        Returns:
            bool. Whether the given object has no duplicates.
        """
        return sorted(list(set(obj))) == sorted(obj)

    @staticmethod
    def is_at_least(obj, min_value):
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
        """Ensures that `obj` (an int/float) is at most `max_value`.

        Args:
            obj: int|float. An object.
            max_value: int. The maximum allowed value for `obj`.

        Returns:
            bool. Whether the given object is at most `max_value`.
        """
        return obj <= max_value

    @staticmethod
    def is_valid_email(obj):
        """Ensures that `obj` (a string) is a valid email.

        Args:
            obj: str. A string.

        Returns:
            bool. Whether the given object is a valid email.
        """
        return bool(re.search(r'^[\w\.\+\-]+\@[\w]+\.[a-z]{2,3}$', obj))

    @staticmethod
    def is_valid_asciimath_expression(obj, algebraic=True):
        """Checks if the given obj (a string) represents a valid algebraic or
        numeric expression. The expression should be in the ASCIIMath format.
        More info: http://asciimath.org/

        Args:
            obj: str. The given expression.
            algebraic: bool. True if the given expression is algebraic
                else numeric.

        Returns:
            bool. Whether the given object is a valid expression.
        """

        # Expression should not contain any invalid characters.
        for character in obj:
            if not bool(re.match(
                    r'(\s|\d|\w|\.|\(|\)|\{|\}|\[|\]|\-|\+|\*|\/|\^)',
                    character)):
                return False

        # Algebraic expressions should contain at least one latin letter and
        # numeric expressions should contain none.
        if algebraic:
            if not bool(re.search(r'[a-zA-Z]+', obj)):
                return False
        else:
            if bool(re.search(r'[a-zA-Z]+', obj)):
                return False

        # Expression should contain a balanced bracket sequence.
        if not contains_balanced_brackets(obj):
            return False

        # Expression should be syntactically valid.
        postfix_expression = infix_to_postfix(obj)
        if postfix_expression is None:
            return False

        return is_valid_postfix_expression(postfix_expression)


    @staticmethod
    def contains_valid_placeholders(obj):
        """Returns True iff all elements of the given object (a list) are
        valid placeholders. A placeholder could be an english alphabet
        (uppercase/lowercase) or a greek letter represented as a single word.
        Valid greek letters are present in the GREEK_LETTERS constant.

        Args:
            obj: list(*). A list of strings.

        Returns:
            bool. Whether the given object contains valid placeholders.
        """
        return all(is_algebraic_operand(elem) for elem in obj)

    @staticmethod
    def is_valid_math_equation(obj):
        """Checks if the given  obj (a string) represents a valid math equation.
        The expression should be in the ASCIIMath format.
        More info: http://asciimath.org/

        Args:
            obj: str. A string.

        Returns:
            bool. Whether the given object is a valid math equation.
        """
        if obj.count('=') != 1:
            return False

        is_valid_asciimath_expression = get_validator(
            'is_valid_asciimath_expression')
        lhs, rhs = obj.split('=')

        # Both sides have to be valid expressions and at least one of them has
        # to be a valid algebraic expression.
        lhs_is_algebraically_valid = is_valid_asciimath_expression(lhs)
        rhs_is_algebraically_valid = is_valid_asciimath_expression(rhs)

        lhs_is_numerically_valid = is_valid_asciimath_expression(
            lhs, algebraic=False)
        rhs_is_numerically_valid = is_valid_asciimath_expression(
            rhs, algebraic=False)

        if lhs_is_algebraically_valid and rhs_is_algebraically_valid:
            return True
        if lhs_is_algebraically_valid and rhs_is_numerically_valid:
            return True
        if lhs_is_numerically_valid and rhs_is_algebraically_valid:
            return True
        return False
