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

# pylint: disable=relative-import

import inspect

from core.domain import email_manager
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
SCHEMA_KEY_OBJ_TYPE = schema_utils.SCHEMA_KEY_OBJ_TYPE
SCHEMA_KEY_VALIDATORS = schema_utils.SCHEMA_KEY_VALIDATORS
SCHEMA_KEY_DESCRIPTION = 'description'
SCHEMA_KEY_UI_CONFIG = 'ui_config'
# The following keys are always accepted as optional keys in any schema.
OPTIONAL_SCHEMA_KEYS = [
    SCHEMA_KEY_CHOICES, SCHEMA_KEY_POST_NORMALIZERS, SCHEMA_KEY_UI_CONFIG,
    SCHEMA_KEY_VALIDATORS]

SCHEMA_TYPE_BOOL = schema_utils.SCHEMA_TYPE_BOOL
# 'Custom' objects undergo an entirely separate normalization process, defined
# in the relevant extensions/objects/models/objects.py class.
SCHEMA_TYPE_CUSTOM = schema_utils.SCHEMA_TYPE_CUSTOM
SCHEMA_TYPE_DICT = schema_utils.SCHEMA_TYPE_DICT
SCHEMA_TYPE_FLOAT = schema_utils.SCHEMA_TYPE_FLOAT
SCHEMA_TYPE_HTML = schema_utils.SCHEMA_TYPE_HTML
SCHEMA_TYPE_INT = schema_utils.SCHEMA_TYPE_INT
SCHEMA_TYPE_LIST = schema_utils.SCHEMA_TYPE_LIST
SCHEMA_TYPE_UNICODE = schema_utils.SCHEMA_TYPE_UNICODE
ALLOWED_SCHEMA_TYPES = [
    SCHEMA_TYPE_BOOL, SCHEMA_TYPE_CUSTOM, SCHEMA_TYPE_DICT, SCHEMA_TYPE_FLOAT,
    SCHEMA_TYPE_HTML, SCHEMA_TYPE_INT, SCHEMA_TYPE_LIST, SCHEMA_TYPE_UNICODE]
ALLOWED_CUSTOM_OBJ_TYPES = [
    'Filepath', 'LogicQuestion', 'MathLatexString', 'MusicPhrase',
    'ParameterName', 'SanitizedUrl', 'Graph', 'ImageWithRegions',
    'ListOfTabs']

# Schemas for the UI config for the various types. All of these configuration
# options are optional additions to the schema, and, if omitted, should not
# result in any errors.
# Note to developers: please keep this in sync with
#     https://github.com/oppia/oppia/wiki/Schema-Based-Forms
UI_CONFIG_SPECS = {
    SCHEMA_TYPE_BOOL: {},
    SCHEMA_TYPE_DICT: {},
    SCHEMA_TYPE_FLOAT: {},
    SCHEMA_TYPE_HTML: {
        'hide_complex_extensions': {
            'type': SCHEMA_TYPE_BOOL,
        },
        'placeholder': {
            'type': SCHEMA_TYPE_UNICODE,
        }
    },
    SCHEMA_TYPE_INT: {},
    SCHEMA_TYPE_LIST: {
        'add_element_text': {
            'type': SCHEMA_TYPE_UNICODE
        }
    },
    SCHEMA_TYPE_UNICODE: {
        'rows': {
            'type': SCHEMA_TYPE_INT,
            'validators': [{
                'id': 'is_at_least',
                'min_value': 1,
            }]
        },
        'coding_mode': {
            'type': SCHEMA_TYPE_UNICODE,
            'choices': ['none', 'python', 'coffeescript'],
        },
        'placeholder': {
            'type': SCHEMA_TYPE_UNICODE,
        },
    },
}

# Schemas for validators for the various types.
VALIDATOR_SPECS = {
    SCHEMA_TYPE_BOOL: {},
    SCHEMA_TYPE_DICT: {},
    SCHEMA_TYPE_FLOAT: {
        'is_at_least': {
            'min_value': {
                'type': SCHEMA_TYPE_FLOAT
            }
        },
        'is_at_most': {
            'max_value': {
                'type': SCHEMA_TYPE_FLOAT
            }
        },
    },
    SCHEMA_TYPE_HTML: {},
    SCHEMA_TYPE_INT: {
        'is_at_least': {
            'min_value': {
                'type': SCHEMA_TYPE_INT
            }
        },
        'is_at_most': {
            'max_value': {
                'type': SCHEMA_TYPE_INT
            }
        },
    },
    SCHEMA_TYPE_LIST: {
        'has_length_at_least': {
            'min_value': {
                'type': SCHEMA_TYPE_INT,
                'validators': [{
                    'id': 'is_at_least',
                    'min_value': 1,
                }],
            }
        },
        'has_length_at_most': {
            'max_value': {
                'type': SCHEMA_TYPE_INT,
                'validators': [{
                    'id': 'is_at_least',
                    'min_value': 1,
                }],
            }
        },
        'is_uniquified': {},
    },
    SCHEMA_TYPE_UNICODE: {
        'matches_regex': {
            'regex': {
                'type': SCHEMA_TYPE_UNICODE,
                'validators': [{
                    'id': 'is_regex',
                }]
            }
        },
        'is_nonempty': {},
        'is_regex': {},
        'is_valid_email': {},
    },
}


def _validate_ui_config(obj_type, ui_config):
    """Validates the value of a UI configuration."""
    reference_dict = UI_CONFIG_SPECS[obj_type]
    assert set(ui_config.keys()) <= set(reference_dict.keys())
    for key, value in ui_config.iteritems():
        schema_utils.normalize_against_schema(
            value, reference_dict[key])


def _validate_validator(obj_type, validator):
    """Validates the value of a 'validator' field."""
    reference_dict = VALIDATOR_SPECS[obj_type]
    assert 'id' in validator and validator['id'] in reference_dict

    customization_keys = validator.keys()
    customization_keys.remove('id')
    assert (set(customization_keys) ==
            set(reference_dict[validator['id']].keys()))
    for key in customization_keys:
        value = validator[key]
        schema = reference_dict[validator['id']][key]
        try:
            schema_utils.normalize_against_schema(value, schema)
        except Exception as e:
            raise AssertionError(e)

    # Check that the id corresponds to a valid normalizer function.
    validator_fn = schema_utils._Validators.get(validator['id'])  # pylint: disable=protected-access
    assert set(inspect.getargspec(validator_fn).args) == set(
        customization_keys + ['obj'])


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
    if schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_CUSTOM:
        _validate_dict_keys(
            schema,
            [SCHEMA_KEY_TYPE, SCHEMA_KEY_OBJ_TYPE],
            [])
        assert schema[SCHEMA_KEY_OBJ_TYPE] in ALLOWED_CUSTOM_OBJ_TYPES, schema
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_LIST:
        _validate_dict_keys(
            schema,
            [SCHEMA_KEY_ITEMS, SCHEMA_KEY_TYPE],
            OPTIONAL_SCHEMA_KEYS + [SCHEMA_KEY_LEN])

        validate_schema(schema[SCHEMA_KEY_ITEMS])
        if SCHEMA_KEY_LEN in schema:
            assert isinstance(schema[SCHEMA_KEY_LEN], int)
            assert schema[SCHEMA_KEY_LEN] > 0
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_DICT:
        _validate_dict_keys(
            schema,
            [SCHEMA_KEY_PROPERTIES, SCHEMA_KEY_TYPE],
            OPTIONAL_SCHEMA_KEYS)

        assert isinstance(schema[SCHEMA_KEY_PROPERTIES], list)
        for prop in schema[SCHEMA_KEY_PROPERTIES]:
            _validate_dict_keys(
                prop,
                [SCHEMA_KEY_NAME, SCHEMA_KEY_SCHEMA],
                [SCHEMA_KEY_DESCRIPTION])
            assert isinstance(prop[SCHEMA_KEY_NAME], basestring)
            validate_schema(prop[SCHEMA_KEY_SCHEMA])
            if SCHEMA_KEY_DESCRIPTION in prop:
                assert isinstance(prop[SCHEMA_KEY_DESCRIPTION], basestring)
    else:
        _validate_dict_keys(schema, [SCHEMA_KEY_TYPE], OPTIONAL_SCHEMA_KEYS)

    if SCHEMA_KEY_UI_CONFIG in schema:
        _validate_ui_config(
            schema[SCHEMA_KEY_TYPE], schema[SCHEMA_KEY_UI_CONFIG])

    if SCHEMA_KEY_CHOICES in schema and SCHEMA_KEY_POST_NORMALIZERS in schema:
        raise AssertionError(
            'Schema cannot contain both a \'choices\' and a '
            '\'post_normalizers\' key.')

    if SCHEMA_KEY_POST_NORMALIZERS in schema:
        assert isinstance(schema[SCHEMA_KEY_POST_NORMALIZERS], list)
        for post_normalizer in schema[SCHEMA_KEY_POST_NORMALIZERS]:
            assert isinstance(post_normalizer, dict)
            assert 'id' in post_normalizer
            # Check that the id corresponds to a valid normalizer function.
            schema_utils.Normalizers.get(post_normalizer['id'])
            # TODO(sll): Check the arguments too.

    if SCHEMA_KEY_VALIDATORS in schema:
        assert isinstance(schema[SCHEMA_KEY_VALIDATORS], list)
        for validator in schema[SCHEMA_KEY_VALIDATORS]:
            assert isinstance(validator, dict)
            assert 'id' in validator
            _validate_validator(schema[SCHEMA_KEY_TYPE], validator)


class SchemaValidationUnitTests(test_utils.GenericTestBase):
    """Test validation of schemas."""

    def test_schemas_are_correctly_validated(self):
        """Test validation of schemas."""
        invalid_schemas = [[
            'type'
        ], {
            'type': 'invalid'
        }, {
            'type': 'dict',
        }, {
            'type': 'list',
            'items': {}
        }, {
            'type': 'list',
            'items': {
                'type': 'unicode'
            },
            'len': -1
        }, {
            'type': 'list',
            'items': {
                'type': 'unicode'
            },
            'len': 0
        }, {
            'type': 'list',
            'items': {
                'type': 'unicode'
            },
            'validators': [{
                'id': 'has_length_at_most',
                'max_value': 0
            }]
        }, {
            'type': 'dict',
            'items': {
                'type': 'float'
            }
        }, {
            'type': 'dict',
            'properties': {
                123: {
                    'type': 'unicode'
                }
            }
        }, {
            'type': 'unicode',
            'validators': [{
                'id': 'fake_validator',
            }]
        }, {
            'type': 'unicode',
            'validators': [{
                'id': 'is_nonempty',
                'fake_arg': 'unused_value',
            }]
        }, {
            'type': 'unicode',
            'validators': [{
                'id': 'matches_regex',
            }]
        }, {
            'type': 'float',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 'value_of_wrong_type',
            }]
        }, {
            'type': 'unicode',
            'ui_config': {
                'rows': -1,
            }
        }, {
            'type': 'unicode',
            'ui_config': {
                'coding_mode': 'invalid_mode',
            }
        }]

        valid_schemas = [{
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
        }, {
            'type': 'list',
            'items': {
                'type': 'unicode'
            },
            'validators': [{
                'id': 'has_length_at_most',
                'max_value': 3
            }]
        }, {
            'type': 'float',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 3.0,
            }]
        }, {
            'type': 'unicode',
            'ui_config': {
                'rows': 5,
            }
        }, {
            'type': 'unicode',
            'ui_config': {
                'coding_mode': 'python',
            }
        }]

        for schema in valid_schemas:
            validate_schema(schema)
        for schema in invalid_schemas:
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

    def test_notification_email_list_validator(self):
        schema = email_manager.NOTIFICATION_EMAIL_LIST_SCHEMA
        valid_email_list = [u'user{}@oppia.com'.format(i) for i in xrange(0, 5)]
        big_email_list = [u'user{}@oppia.com'.format(i) for i in xrange(0, 7)]
        mappings = [
            ([u'admin@oppia.com'], [u'admin@oppia.com']),
            (valid_email_list, valid_email_list)]
        invalid_vals = [[u'admin@oppia'], big_email_list,
                        [u'admin@oppia.commmm'], [u'a@.com']]
        self.check_normalization(schema, mappings, invalid_vals)
