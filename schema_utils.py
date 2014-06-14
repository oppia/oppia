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

__author__ = 'sll@google.com (Sean Lip)'

import logging
import numbers
import urllib
import urlparse

from core.domain import html_cleaner


SCHEMA_KEY_ITEMS = 'items'
SCHEMA_KEY_LENGTH = 'length'
SCHEMA_KEY_PROPERTIES = 'properties'
SCHEMA_KEY_TYPE = 'type'
SCHEMA_KEY_POST_NORMALIZERS = 'post_normalizers'

SCHEMA_TYPE_BOOL = 'bool'
SCHEMA_TYPE_DICT = 'dict'
SCHEMA_TYPE_FLOAT = 'float'
SCHEMA_TYPE_HTML = 'html'
SCHEMA_TYPE_INT = 'int'
SCHEMA_TYPE_LIST = 'list'
SCHEMA_TYPE_UNICODE = 'unicode'
ALLOWED_SCHEMA_TYPES = [
    SCHEMA_TYPE_BOOL, SCHEMA_TYPE_DICT, SCHEMA_TYPE_FLOAT, SCHEMA_TYPE_HTML,
    SCHEMA_TYPE_INT, SCHEMA_TYPE_LIST, SCHEMA_TYPE_UNICODE]


def _validate_dict_keys(dict_to_check, required_keys, optional_keys):
    """Checks that all of the required keys, and possibly some of the optional
    keys, are in the given dict.

    Raises:
      AssertionError: if the validation fails.
    """
    assert set(required_keys) <= set(dict_to_check.keys()), (
        'Missing keys: %s' % dict_to_check)
    assert set(dict_to_check.keys()) <= set(required_keys + optional_keys), (
        'Extra keys: %s' % dict_to_check)


def validate_schema(schema):
    """Validates a schema.

    This is meant to be a utility function that should be used by tests to
    ensure that all schema definitions in the codebase are valid.

    Each schema is a dict with at least a key called 'type'. The 'type' can
    take one of the SCHEMA_TYPE_* values declared above. In addition, there
    may be additional keys for specific types:
    - 'list' requires an additional 'items' property, which specifies the type
      of the elements in the list. It also allows for an optional 'length'
      property which specifies the length of the list.
    - 'dict' requires an additional 'properties' property, which specifies the
      names of the keys in the dict, and schema definitions for their values.
    There may also be an optional 'post_normalizers' key whose value is a list
    of normalizers.

    Raises:
      AssertionError: if the schema is not valid.
    """
    assert isinstance(schema, dict)
    assert SCHEMA_KEY_TYPE in schema
    assert schema[SCHEMA_KEY_TYPE] in ALLOWED_SCHEMA_TYPES
    if schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_LIST:
        _validate_dict_keys(
            schema,
            [SCHEMA_KEY_ITEMS, SCHEMA_KEY_TYPE],
            [SCHEMA_KEY_LENGTH, SCHEMA_KEY_POST_NORMALIZERS])

        validate_schema(schema[SCHEMA_KEY_ITEMS])
        if SCHEMA_KEY_LENGTH in schema:
            assert isinstance(schema[SCHEMA_KEY_LENGTH], int)
            assert schema[SCHEMA_KEY_LENGTH] > 0
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_DICT:
        _validate_dict_keys(
            schema,
            [SCHEMA_KEY_PROPERTIES, SCHEMA_KEY_TYPE],
            [SCHEMA_KEY_POST_NORMALIZERS])

        for prop in schema[SCHEMA_KEY_PROPERTIES]:
            assert isinstance(prop, basestring)
            validate_schema(schema[SCHEMA_KEY_PROPERTIES][prop])
    else:
        _validate_dict_keys(
            schema, [SCHEMA_KEY_TYPE], [SCHEMA_KEY_POST_NORMALIZERS])

    if SCHEMA_KEY_POST_NORMALIZERS in schema:
        assert isinstance(schema[SCHEMA_KEY_POST_NORMALIZERS], list)
        for post_normalizer in schema[SCHEMA_KEY_POST_NORMALIZERS]:
            assert isinstance(post_normalizer, dict)
            assert 'id' in post_normalizer
            # Check that the id corresponds to a valid normalizer function.
            Normalizers.get(post_normalizer['id'])
            # TODO(sll): Check the arguments too.


def normalize_against_schema(obj, schema):
    """Validate the given object using the schema, normalizing if necessary.

    Returns:
        the normalized object.

    Raises:
        AssertionError: if the object fails to validate against the schema.
    """
    normalized_obj = None

    if schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_BOOL:
        assert isinstance(obj, bool), ('Expected bool, received %s' % obj)
        normalized_obj = obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_DICT:
        assert isinstance(obj, dict), ('Expected dict, received %s' % obj)
        assert set(obj.keys()) == set(schema[SCHEMA_KEY_PROPERTIES].keys())
        normalized_obj = {
            key: normalize_against_schema(
                obj[key], schema[SCHEMA_KEY_PROPERTIES][key])
            for key in schema[SCHEMA_KEY_PROPERTIES]
        }
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
        assert isinstance(obj, basestring), (
            'Expected unicode HTML string, received %s' % obj)
        obj = unicode(obj)
        assert isinstance(obj, unicode), (
            'Expected unicode, received %s' % obj)
        normalized_obj = html_cleaner.clean(obj)
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_LIST:
        assert isinstance(obj, list), ('Expected list, received %s' % obj)
        item_schema = schema[SCHEMA_KEY_ITEMS]
        if SCHEMA_KEY_LENGTH in schema:
            assert len(obj) == schema[SCHEMA_KEY_LENGTH]
        normalized_obj = [
            normalize_against_schema(item, item_schema) for item in obj
        ]
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_UNICODE:
        assert isinstance(obj, basestring), (
            'Expected unicode string, received %s' % obj)
        obj = unicode(obj)
        assert isinstance(obj, unicode), (
            'Expected unicode, received %s' % obj)
        normalized_obj = obj
    else:
        raise Exception('Invalid schema type: %s' % schema[SCHEMA_KEY_TYPE])

    # When type normalization is finished, apply the post-normalizers in the
    # given order.
    if SCHEMA_KEY_POST_NORMALIZERS in schema:
        for normalizer in schema[SCHEMA_KEY_POST_NORMALIZERS]:
            kwargs = dict(normalizer)
            del kwargs['id']
            normalized_obj = Normalizers.get(normalizer['id'])(
                normalized_obj, **kwargs)

    return normalized_obj


class Normalizers(object):
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
        if not hasattr(cls, normalizer_id):
            raise Exception('Invalid normalizer id: %s' % normalizer_id)
        return getattr(cls, normalizer_id)

    @staticmethod
    def require_nonempty(obj):
        """Checks that the given object is nonempty.

        Args:
          obj: a string.

        Returns:
          obj, if it is nonempty.

        Raises:
          AssertionError: if `obj` is empty.
        """
        assert obj != ''
        return obj

    @staticmethod
    def uniquify(obj):
        """Returns a list, removing duplicates.

        Args:
          obj: a list.

        Returns:
          a list containing the elements in `obj` in sorted order and without
          duplicates.
        """
        return sorted(list(set(obj)))

    @staticmethod
    def normalize_spaces(obj):
        """Collapses multiple spaces into single spaces.

        Args:
          obj: a string.

        Returns:
          a string that is the same as `obj`, except that each block of
          whitespace is collapsed into a single space character.
        """
        return ' '.join(obj.split())

    @staticmethod
    def sanitize_url(obj):
        """Takes a string representing a URL and sanitizes it.

        Args:
          obj: a string representing a URL.

        Returns:
          An empty string if the URL does not start with http:// or https://.
          Otherwise, returns the original URL.
        """
        url_components = urlparse.urlsplit(obj)
        quoted_url_components = (
            urllib.quote(component) for component in url_components)
        raw = urlparse.urlunsplit(quoted_url_components)

        acceptable = html_cleaner.filter_a('href', obj)
        assert acceptable, (
            'Invalid URL: Sanitized URL should start with '
            '\'http://\' or \'https://\'; received %s' % raw)
        return raw

    @staticmethod
    def require_at_least(obj, min_value):
        """Ensures that `obj` is at least `min_value`.

        Args:
          obj: an int or a float.
          min_value: an int or a float.

        Returns:
          obj, if it is at least `min_value`.

        Raises:
          AssertionError, if `obj` is less than `min_value`.
        """
        assert obj >= min_value
        return obj

    @staticmethod
    def require_at_most(obj, max_value):
        """Ensures that `obj` is at most `min_value`.

        Args:
          obj: an int or a float.
          max_value: an int or a float.

        Returns:
          obj, if it is at most `min_value`.

        Raises:
          AssertionError, if `obj` is greater than `min_value`.
        """
        assert obj <= max_value
        return obj

    @staticmethod
    def require_is_one_of(obj, choices):
        """Ensures that `obj` is an element of `choices`.

        Args:
          obj: anything.
          choices: a list of items, of the same type as `obj`.

        Returns:
          obj, if it is equal to an element of `choices`.

        Raises:
          AssertionError, if `obj` is not equal to any element of choices.
        """
        assert obj in choices
        return obj
