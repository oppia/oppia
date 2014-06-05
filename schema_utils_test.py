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

__author__ = 'Sean Lip'

import schema_utils
import test_utils


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
                'length': -1
            },
            {
                'type': 'list',
                'items': {
                    'type': 'unicode'
                },
                'length': 0
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
            'properties': {
                'str_property': {
                    'type': 'unicode'
                }
            }
        }, {
            'type': 'list',
            'items': {
                'type': 'list',
                'items': {
                    'type': 'list',
                    'items': {
                        'type': 'bool'
                    },
                    'length': 100
                }
            }
        }]

        for schema in VALID_SCHEMAS:
            schema_utils.validate_schema(schema)
        for schema in INVALID_SCHEMAS:
            with self.assertRaises((AssertionError, KeyError)):
                schema_utils.validate_schema(schema)


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
        schema_utils.validate_schema(schema)

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

    def test_list_schema_with_length(self):
        schema = {
            'type': schema_utils.SCHEMA_TYPE_LIST,
            'items': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE,
            },
            'length': 2,
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
            'properties': {
                'unicodeListProp': {
                    'type': schema_utils.SCHEMA_TYPE_LIST,
                    'items': {
                        'type': schema_utils.SCHEMA_TYPE_UNICODE
                    }
                },
                'intProp': {
                    'type': schema_utils.SCHEMA_TYPE_INT
                },
                'dictProp': {
                    'type': schema_utils.SCHEMA_TYPE_DICT,
                    'properties': {
                        'floatProp': {
                            'type': schema_utils.SCHEMA_TYPE_FLOAT
                        }
                    }
                }
            }
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
