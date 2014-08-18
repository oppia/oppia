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

"""Tests for object schema definitions."""

__author__ = 'Sean Lip'

from core.tests import test_utils
import schema_utils


SCHEMA_KEY_ITEMS = schema_utils.SCHEMA_KEY_ITEMS
SCHEMA_KEY_LEN = schema_utils.SCHEMA_KEY_LEN
SCHEMA_KEY_PROPERTIES = schema_utils.SCHEMA_KEY_PROPERTIES
SCHEMA_KEY_TYPE = schema_utils.SCHEMA_KEY_TYPE
SCHEMA_KEY_POST_NORMALIZERS = schema_utils.SCHEMA_KEY_POST_NORMALIZERS
SCHEMA_KEY_CHOICES = schema_utils.SCHEMA_KEY_CHOICES
SCHEMA_KEY_NAME = schema_utils.SCHEMA_KEY_NAME
SCHEMA_KEY_SCHEMA = schema_utils.SCHEMA_KEY_SCHEMA

SCHEMA_TYPE_BOOL = schema_utils.SCHEMA_TYPE_BOOL
SCHEMA_TYPE_DICT = schema_utils.SCHEMA_TYPE_DICT
SCHEMA_TYPE_FLOAT = schema_utils.SCHEMA_TYPE_FLOAT
SCHEMA_TYPE_HTML = schema_utils.SCHEMA_TYPE_HTML
SCHEMA_TYPE_INT = schema_utils.SCHEMA_TYPE_INT
SCHEMA_TYPE_LIST = schema_utils.SCHEMA_TYPE_LIST
SCHEMA_TYPE_UNICODE = schema_utils.SCHEMA_TYPE_UNICODE
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
      of the elements in the list. It also allows for an optional 'len'
      property which specifies the len of the list.
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
            [SCHEMA_KEY_LEN, SCHEMA_KEY_CHOICES, SCHEMA_KEY_POST_NORMALIZERS])

        validate_schema(schema[SCHEMA_KEY_ITEMS])
        if SCHEMA_KEY_LEN in schema:
            assert isinstance(schema[SCHEMA_KEY_LEN], int)
            assert schema[SCHEMA_KEY_LEN] > 0
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_DICT:
        _validate_dict_keys(
            schema,
            [SCHEMA_KEY_PROPERTIES, SCHEMA_KEY_TYPE],
            [SCHEMA_KEY_CHOICES, SCHEMA_KEY_POST_NORMALIZERS])

        assert isinstance(schema[SCHEMA_KEY_PROPERTIES], list)
        for prop in schema[SCHEMA_KEY_PROPERTIES]:
            _validate_dict_keys(prop, [SCHEMA_KEY_NAME, SCHEMA_KEY_SCHEMA], [])
            assert isinstance(prop[SCHEMA_KEY_NAME], basestring)
            validate_schema(prop[SCHEMA_KEY_SCHEMA])
    else:
        _validate_dict_keys(
            schema, [SCHEMA_KEY_TYPE],
            [SCHEMA_KEY_CHOICES, SCHEMA_KEY_POST_NORMALIZERS])

    if SCHEMA_KEY_CHOICES in schema and SCHEMA_KEY_POST_NORMALIZERS in schema:
        raise AssertionError(
            'Schema cannot contain both a \'choices\' and a \'post_normalizers\' key.')

    if SCHEMA_KEY_POST_NORMALIZERS in schema:
        assert isinstance(schema[SCHEMA_KEY_POST_NORMALIZERS], list)
        for post_normalizer in schema[SCHEMA_KEY_POST_NORMALIZERS]:
            assert isinstance(post_normalizer, dict)
            assert 'id' in post_normalizer
            # Check that the id corresponds to a valid normalizer function.
            schema_utils.Normalizers.get(post_normalizer['id'])
            # TODO(sll): Check the arguments too.


class SchemaValidationUnitTests(test_utils.GenericTestBase):
    """Test validation of schemas."""

    def test_schemas_are_correctly_validated(self):
        INVALID_SCHEMAS = [
            ['type'],
            {
                'type': 'invalid'
            },
            {
                'type': 'dict',
            },
            {
                'type': 'list',
                'items': {}
            },
            {
                'type': 'list',
                'items': {
                    'type': 'unicode'
                },
                'len': -1
            },
            {
                'type': 'list',
                'items': {
                    'type': 'unicode'
                },
                'len': 0
            },
            {
                'type': 'dict',
                'items': {
                    'type': 'float'
                }
            },
            {
                'type': 'dict',
                'properties': {
                    123: {
                        'type': 'unicode'
                    }
                }
            }
        ]

        VALID_SCHEMAS = [{
            'type': 'float'
        }, {
            'type': 'bool'
        }, {
            'type': 'dict',
            'properties': [{
                'name': 'str_property',
                'schema': {
                    'type': 'unicode'
                }
            }]
        }, {
            'type': 'list',
            'items': {
                'type': 'list',
                'items': {
                    'type': 'list',
                    'items': {
                        'type': 'bool'
                    },
                    'len': 100
                }
            }
        }]

        for schema in VALID_SCHEMAS:
            validate_schema(schema)
        for schema in INVALID_SCHEMAS:
            with self.assertRaises((AssertionError, KeyError)):
                validate_schema(schema)


class SchemaNormalizationUnitTests(test_utils.GenericTestBase):
    """Test schema-based normalization of objects."""

    def check_normalization(self, schema, mappings, invalid_items):
        """Validates the schema and tests that values are normalized correctly.

        Args:
          schema: the schema to normalize the value against.
          mappings: a list of 2-element tuples. The first element of
            each item is expected to be normalized to the second.
          invalid_items: a list of values. Each of these is expected to raise
            an AssertionError when normalized.
        """
        validate_schema(schema)

        for raw_value, expected_value in mappings:
            self.assertEqual(
                schema_utils.normalize_against_schema(raw_value, schema),
                expected_value)
        for value in invalid_items:
            with self.assertRaises(Exception):
                schema_utils.normalize_against_schema(value, schema)

    def test_float_schema(self):
        schema = {
            'type': schema_utils.SCHEMA_TYPE_FLOAT,
        }
        mappings = [(1.2, 1.2), (3, 3.0), (-1, -1.0), ('1', 1.0)]
        invalid_vals = [[13], 'abc', None]
        self.check_normalization(schema, mappings, invalid_vals)

    def test_list_schema_with_len(self):
        schema = {
            'type': schema_utils.SCHEMA_TYPE_LIST,
            'items': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE,
            },
            'len': 2,
        }
        mappings = [
            (['a', 'b'], ['a', 'b']),
            (['abc', ''], ['abc', '']),
            (['adaA13', '13'], ['adaA13', '13'])]
        invalid_vals = [['1', 13], {'a': 'b'}, {}, None, 123, 'abc', ['c'], []]
        self.check_normalization(schema, mappings, invalid_vals)

    def test_list_schema(self):
        schema = {
            'type': schema_utils.SCHEMA_TYPE_LIST,
            'items': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE,
            }
        }
        mappings = [
            (['a', 'b'], ['a', 'b']),
            (['c'], ['c']),
            (['abc', ''], ['abc', '']),
            ([], []),
            (['adaA13', '13'], ['adaA13', '13'])]
        invalid_vals = [['1', 13], {'a': 'b'}, {}, None, 123, 'abc']
        self.check_normalization(schema, mappings, invalid_vals)

    def test_dict_schema(self):
        schema = {
            'type': schema_utils.SCHEMA_TYPE_DICT,
            'properties': [{
                'name': 'unicodeListProp',
                'schema': {
                    'type': schema_utils.SCHEMA_TYPE_LIST,
                    'items': {
                        'type': schema_utils.SCHEMA_TYPE_UNICODE
                    }
                },
            }, {
                'name': 'intProp',
                'schema': {
                    'type': schema_utils.SCHEMA_TYPE_INT
                },
            }, {
                'name': 'dictProp',
                'schema': {
                    'type': schema_utils.SCHEMA_TYPE_DICT,
                    'properties': [{
                        'name': 'floatProp',
                        'schema': {
                            'type': schema_utils.SCHEMA_TYPE_FLOAT
                        }
                    }]
                }
            }]
        }

        mappings = [({
            'unicodeListProp': [],
            'intProp': 1,
            'dictProp': {
                'floatProp': 3
            }
        }, {
            'unicodeListProp': [],
            'intProp': 1,
            'dictProp': {
                'floatProp': 3.0
            }
        }), ({
            'intProp': 10,
            'unicodeListProp': ['abc', 'def'],
            'dictProp': {
                'floatProp': -1.0
            }
        }, {
            'intProp': 10,
            'unicodeListProp': ['abc', 'def'],
            'dictProp': {
                'floatProp': -1.0
            }
        })]

        invalid_vals = [{
            'unicodeListProp': [],
            'intPROP': 1,
            'dictProp': {
                'floatProp': 3.0
            }
        }, {
            'unicodeListProp': ['aaa'],
            'intProp': 1,
        }, {
            'unicodeListProp': [],
            'intProp': 3,
            'dictProp': {},
        }, [
            'unicodeListProp', 'intProp', 'dictProp'
        ], None, 123, 'abc']

        self.check_normalization(schema, mappings, invalid_vals)
