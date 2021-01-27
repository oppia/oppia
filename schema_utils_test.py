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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import inspect

from core.domain import email_manager
from core.tests import test_utils
import feconf
import python_utils
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
# This key is used for 'type: custom' objects, as a way of indicating how
# default ui_config values defined in objects.py should be replaced. The value
# is a dictionary mapping the accessor of the object value to the ui_config.
# For example, for SubtitledHtml (defined as a dict), to replace the ui_config
# of the inner html schema, the accessor/key would be 'html'. Note that the
# existing ui_config is not replaced or deleted - the frontend needs to handle
# the override of the ui_config, usually in a custom object editor.
SCHEMA_KEY_REPLACEMENT_UI_CONFIG = 'replacement_ui_config'

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
SCHEMA_TYPE_UNICODE_OR_NONE = schema_utils.SCHEMA_TYPE_UNICODE_OR_NONE
ALLOWED_SCHEMA_TYPES = [
    SCHEMA_TYPE_BOOL, SCHEMA_TYPE_CUSTOM, SCHEMA_TYPE_DICT, SCHEMA_TYPE_FLOAT,
    SCHEMA_TYPE_HTML, SCHEMA_TYPE_INT, SCHEMA_TYPE_LIST,
    SCHEMA_TYPE_UNICODE, SCHEMA_TYPE_UNICODE_OR_NONE]
ALLOWED_CUSTOM_OBJ_TYPES = [
    'Filepath', 'LogicQuestion', 'MathExpressionContent', 'MusicPhrase',
    'ParameterName', 'SanitizedUrl', 'Graph', 'ImageWithRegions',
    'ListOfTabs', 'SkillSelector', 'SubtitledHtml', 'SubtitledUnicode',
    'SvgFilename', 'CustomOskLetters']

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
        'is_uniquified': {}
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
        'is_valid_user_id': {},
        'is_valid_math_expression': {
            'algebraic': {
                'type': SCHEMA_TYPE_BOOL
            }
        },
        'is_valid_algebraic_expression': {},
        'is_valid_numeric_expression': {},
        'is_valid_math_equation': {},
        'is_supported_audio_language_code': {},
        'is_url_fragment': {},
        'has_length_at_most': {
            'max_value': {
                'type': SCHEMA_TYPE_INT
            }
        }
    },
}


def _validate_ui_config(obj_type, ui_config):
    """Validates the value of a UI configuration."""
    reference_dict = UI_CONFIG_SPECS[obj_type]
    assert set(ui_config.keys()) <= set(reference_dict.keys()), (
        'Missing keys: %s, Extra keys: %s' % (
            list(set(reference_dict.keys()) - set(ui_config.keys())),
            list(set(ui_config.keys()) - set(reference_dict.keys()))))
    for key, value in ui_config.items():
        schema_utils.normalize_against_schema(
            value, reference_dict[key])


def _validate_validator(obj_type, validator):
    """Validates the value of a 'validator' field."""
    reference_dict = VALIDATOR_SPECS[obj_type]
    assert 'id' in validator, 'id is not present in validator'
    assert validator['id'] in reference_dict, (
        '%s is not present in reference_dict' % validator['id'])

    customization_keys = list(validator.keys())
    customization_keys.remove('id')
    assert (
        set(customization_keys) ==
        set(reference_dict[validator['id']].keys())), (
            'Missing keys: %s, Extra keys: %s' % (
                list(
                    set(reference_dict[validator['id']].keys()) -
                    set(customization_keys)),
                list(
                    set(customization_keys) -
                    set(reference_dict[validator['id']].keys()))))
    for key in customization_keys:
        value = validator[key]
        schema = reference_dict[validator['id']][key]
        try:
            schema_utils.normalize_against_schema(value, schema)
        except Exception as e:
            raise AssertionError(e)

    # Check that the id corresponds to a valid normalizer function.
    validator_fn = schema_utils.get_validator(validator['id'])
    assert set(inspect.getargspec(validator_fn).args) == set(
        customization_keys + ['obj']), (
            'Missing keys: %s, Extra keys: %s' % (
                list(
                    set(customization_keys + ['obj']) -
                    set(inspect.getargspec(validator_fn).args)),
                list(
                    set(inspect.getargspec(validator_fn).args) -
                    set(customization_keys + ['obj']))))


def _validate_dict_keys(dict_to_check, required_keys, optional_keys):
    """Checks that all of the required keys, and possibly some of the optional
    keys, are in the given dict.

    Raises:
        AssertionError. The validation fails.
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
        AssertionError. The schema is not valid.
    """
    assert isinstance(schema, dict), ('Expected dict, got %s' % schema)
    assert SCHEMA_KEY_TYPE in schema, (
        '%s is not present in schema key types' % SCHEMA_KEY_TYPE)
    assert schema[SCHEMA_KEY_TYPE] in ALLOWED_SCHEMA_TYPES, (
        '%s is not an allowed schema type' % schema[SCHEMA_KEY_TYPE])
    if schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_CUSTOM:
        _validate_dict_keys(
            schema,
            [SCHEMA_KEY_TYPE, SCHEMA_KEY_OBJ_TYPE],
            [SCHEMA_KEY_REPLACEMENT_UI_CONFIG])
        assert schema[SCHEMA_KEY_OBJ_TYPE] in ALLOWED_CUSTOM_OBJ_TYPES, schema
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_LIST:
        _validate_dict_keys(
            schema,
            [SCHEMA_KEY_ITEMS, SCHEMA_KEY_TYPE],
            OPTIONAL_SCHEMA_KEYS + [SCHEMA_KEY_LEN])

        validate_schema(schema[SCHEMA_KEY_ITEMS])
        if SCHEMA_KEY_LEN in schema:
            assert isinstance(schema[SCHEMA_KEY_LEN], int), (
                'Expected int, got %s' % schema[SCHEMA_KEY_LEN])
            assert schema[SCHEMA_KEY_LEN] > 0, (
                'Expected length greater than 0, got %s' % (
                    schema[SCHEMA_KEY_LEN]))
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_DICT:
        _validate_dict_keys(
            schema,
            [SCHEMA_KEY_PROPERTIES, SCHEMA_KEY_TYPE],
            OPTIONAL_SCHEMA_KEYS)

        assert isinstance(schema[SCHEMA_KEY_PROPERTIES], list), (
            'Expected list, got %s' % schema[SCHEMA_KEY_LEN])
        for prop in schema[SCHEMA_KEY_PROPERTIES]:
            _validate_dict_keys(
                prop,
                [SCHEMA_KEY_NAME, SCHEMA_KEY_SCHEMA],
                [SCHEMA_KEY_DESCRIPTION])
            assert isinstance(prop[SCHEMA_KEY_NAME], python_utils.BASESTRING), (
                'Expected %s, got %s' % (
                    python_utils.BASESTRING, prop[SCHEMA_KEY_NAME]))
            validate_schema(prop[SCHEMA_KEY_SCHEMA])
            if SCHEMA_KEY_DESCRIPTION in prop:
                assert isinstance(
                    prop[SCHEMA_KEY_DESCRIPTION], python_utils.BASESTRING), (
                        'Expected %s, got %s' % (
                            python_utils.BASESTRING,
                            prop[SCHEMA_KEY_DESCRIPTION]))
    else:
        _validate_dict_keys(schema, [SCHEMA_KEY_TYPE], OPTIONAL_SCHEMA_KEYS)

    if SCHEMA_KEY_UI_CONFIG in schema:
        _validate_ui_config(
            schema[SCHEMA_KEY_TYPE], schema[SCHEMA_KEY_UI_CONFIG])

    if SCHEMA_KEY_POST_NORMALIZERS in schema:
        assert isinstance(schema[SCHEMA_KEY_POST_NORMALIZERS], list), (
            'Expected list, got %s' % schema[SCHEMA_KEY_POST_NORMALIZERS])
        for post_normalizer in schema[SCHEMA_KEY_POST_NORMALIZERS]:
            assert isinstance(post_normalizer, dict), (
                'Expected dict, got %s' % post_normalizer)
            assert 'id' in post_normalizer, (
                'id is not present in %s' % post_normalizer)
            # Check that the id corresponds to a valid normalizer function.
            schema_utils.Normalizers.get(post_normalizer['id'])
            # TODO(sll): Check the arguments too.

    if SCHEMA_KEY_VALIDATORS in schema:
        assert isinstance(schema[SCHEMA_KEY_VALIDATORS], list), (
            'Expected list, got %s' % schema[SCHEMA_KEY_VALIDATORS])
        for validator in schema[SCHEMA_KEY_VALIDATORS]:
            assert isinstance(validator, dict), (
                'Expected dict, got %s' % schema[SCHEMA_KEY_VALIDATORS])
            assert 'id' in validator, (
                'id is not present in %s' % validator)
            _validate_validator(schema[SCHEMA_KEY_TYPE], validator)


class SchemaValidationUnitTests(test_utils.GenericTestBase):
    """Test validation of schemas."""

    GLOBAL_VALIDATORS_SCHEMA = {
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
            'name': 'unicodeProp',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE
            },
        }]
    }

    GLOBAL_VALIDATORS = [{
        'id': 'does_not_contain_email'
    }]

    def test_schemas_are_correctly_validated(self):
        """Test validation of schemas."""
        invalid_schemas_with_error_messages = [
            ([
                'type'
            ], r'Expected dict, got \[u\'type\'\]'),
            ({
                'type': 'invalid'
            }, 'invalid is not an allowed schema type'),
            ({
                'type': 'dict',
            }, 'Missing keys: {u\'type\': u\'dict\'}'),
            ({
                'type': 'list',
                'items': {}
            }, 'type is not present in schema key types'),
            ({
                'type': 'list',
                'items': {
                    'type': 'unicode'
                },
                'len': -1
            }, 'Expected length greater than 0, got -1'),
            ({
                'type': 'list',
                'items': {
                    'type': 'unicode'
                },
                'len': 0
            }, 'Expected length greater than 0, got 0'),
            ({
                'type': 'list',
                'items': {
                    'type': 'unicode'
                },
                'validators': [{
                    'id': 'has_length_at_most',
                    'max_value': 0
                }]
            },
             r'Validation failed: is_at_least \({u\'min_value\': 1}\) for '
             r'object 0'),
            ({
                'type': 'dict',
                'items': {
                    'type': 'float'
                }
            },
             r'Missing keys: {u\'items\': {u\'type\': u\'float\'}, '
             r'u\'type\': u\'dict\'}'),
            ({
                'type': 'dict',
                'properties': {
                    123: {
                        'type': 'unicode'
                    }
                }
            }, 'u\'len\''),
            ({
                'type': 'unicode',
                'validators': [{
                    'id': 'fake_validator',
                }]
            }, 'fake_validator is not present in reference_dict'),
            ({
                'type': 'unicode',
                'validators': [{
                    'id': 'is_nonempty',
                    'fake_arg': 'unused_value',
                }]
            }, r'Missing keys: \[\], Extra keys: \[u\'fake_arg\'\]'),
            ({
                'type': 'unicode',
                'validators': [{
                    'id': 'matches_regex',
                }]
            }, r'Missing keys: \[u\'regex\'\], Extra keys: \[\]'),
            ({
                'type': 'float',
                'validators': [{
                    'id': 'is_at_least',
                    'min_value': 'value_of_wrong_type',
                }]
            }, 'Could not convert unicode to float: value_of_wrong_type'),
            ({
                'type': 'unicode',
                'ui_config': {
                    'rows': -1,
                }
            },
             r'Validation failed: is_at_least \({u\'min_value\': 1}\) for '
             r'object -1'),
            ({
                'type': 'unicode',
                'ui_config': {
                    'coding_mode': 'invalid_mode',
                }
            },
             r'Received invalid_mode which is not in the allowed range of '
             r'choices: \[u\'none\', u\'python\', u\'coffeescript\'\]')]

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
        for schema, error_msg in invalid_schemas_with_error_messages:
            with self.assertRaisesRegexp((AssertionError, KeyError), error_msg):
                validate_schema(schema)

    def test_normalize_against_schema_raises_exception(self):
        """Tests if normalize against schema raises exception
        for invalid key.
        """
        with self.assertRaisesRegexp(Exception, 'Invalid schema type: invalid'):
            schema = {SCHEMA_KEY_TYPE: 'invalid'}
            schema_utils.normalize_against_schema('obj', schema)

    def test_is_nonempty_validator(self):
        """Tests if static method is_nonempty returns true iff obj
        is not an empty str.
        """
        is_nonempty = schema_utils.get_validator('is_nonempty')
        self.assertTrue(is_nonempty('non-empty string'))
        self.assertTrue(is_nonempty(' '))
        self.assertTrue(is_nonempty('    '))
        self.assertFalse(is_nonempty(''))

    def test_is_at_most_validator(self):
        """Tests if static method is_at_most returns true iff obj
        is at most a value.
        """
        is_at_most = schema_utils.get_validator('is_at_most')
        self.assertTrue(is_at_most(2, 3))
        self.assertTrue(is_at_most(2, 2)) # boundary
        self.assertFalse(is_at_most(2, 1))

    def test_has_length_at_least_validator(self):
        """Tests if static method has_length_at_least returns true iff
        given list has length of at least the given value.
        """
        has_len_at_least = schema_utils.get_validator('has_length_at_least')
        self.assertTrue(has_len_at_least(['elem'], 0))
        self.assertTrue(has_len_at_least(['elem'], 1)) # boundary
        self.assertFalse(has_len_at_least(['elem'], 2))

    def test_get_raises_invalid_validator_id(self):
        """Tests if class method 'get' in _Validator raises exception
        for invalid validator id.
        """
        with self.assertRaisesRegexp(
            Exception,
            'Invalid validator id: some invalid validator method name'):
            schema_utils.get_validator('some invalid validator method name')

    def test_is_valid_algebraic_expression_validator(self):
        """Tests for the is_valid_algebraic_expression static method with
        algebraic type.
        """
        is_valid_algebraic_expression = schema_utils.get_validator(
            'is_valid_algebraic_expression')

        self.assertTrue(is_valid_algebraic_expression('a+b*2'))
        self.assertFalse(is_valid_algebraic_expression('3+4/2'))

    def test_is_valid_numeric_expression_validator(self):
        """Tests for the is_valid_numeric_expression static method with
        numeric type.
        """
        is_valid_numeric_expression = schema_utils.get_validator(
            'is_valid_numeric_expression')

        self.assertFalse(is_valid_numeric_expression('a+b*2'))
        self.assertTrue(is_valid_numeric_expression('3+4/2'))

    def test_is_valid_math_equation_validator(self):
        """Tests for the is_valid_math_equation static method."""
        is_valid_math_equation = schema_utils.get_validator(
            'is_valid_math_equation')

        self.assertTrue(is_valid_math_equation('a+b=c'))
        self.assertTrue(is_valid_math_equation('x^2+y^2=z^2'))
        self.assertTrue(is_valid_math_equation('y = m*x + b'))
        self.assertTrue(is_valid_math_equation('alpha^a + beta^b = gamma^(-c)'))
        self.assertTrue(is_valid_math_equation('a+b=0'))
        self.assertTrue(is_valid_math_equation('0=a+b'))
        self.assertTrue(is_valid_math_equation('(a/b)+c=(4^3)*a'))
        self.assertTrue(is_valid_math_equation('2^alpha-(-3) = 3'))
        self.assertTrue(is_valid_math_equation('(a+b)^2 = a^2 + b^2 + 2*a*b'))
        self.assertTrue(is_valid_math_equation('(a+b)^2 = a^2 + b^2 + 2ab'))
        self.assertTrue(is_valid_math_equation('x/a + y/b = 1'))
        self.assertTrue(is_valid_math_equation('3 = -5 + pi^x'))
        self.assertTrue(is_valid_math_equation('0.4 + 0.5 = alpha * 4'))
        self.assertTrue(is_valid_math_equation('sqrt(a+b)=c - gamma/2.4'))
        self.assertTrue(is_valid_math_equation('abs(35 - x) = 22.3'))

        self.assertFalse(is_valid_math_equation('3 -= 2/a'))
        self.assertFalse(is_valid_math_equation('3 == 2/a'))
        self.assertFalse(is_valid_math_equation('x + y = '))
        self.assertFalse(is_valid_math_equation('(a+b = 0)'))
        self.assertFalse(is_valid_math_equation('pi = 3.1415'))
        self.assertFalse(is_valid_math_equation('a+b=0=a-b'))
        self.assertFalse(is_valid_math_equation('alpha - beta/c'))
        self.assertFalse(is_valid_math_equation('2^alpha-(-3*) = 3'))
        self.assertFalse(is_valid_math_equation('a~b = 0'))
        self.assertFalse(is_valid_math_equation('a+b<=0'))
        self.assertFalse(is_valid_math_equation('a+b>=0'))
        self.assertFalse(is_valid_math_equation('a+b<0'))
        self.assertFalse(is_valid_math_equation('a+b>0'))
        self.assertFalse(is_valid_math_equation('5+3=8'))
        self.assertFalse(is_valid_math_equation('(a+(b)=0'))
        self.assertFalse(is_valid_math_equation('a+b=c:)'))

    def test_is_supported_audio_language_code(self):
        is_supported_audio_language_code = schema_utils.get_validator(
            'is_supported_audio_language_code')

        self.assertTrue(is_supported_audio_language_code('en'))
        self.assertTrue(is_supported_audio_language_code('fr'))
        self.assertTrue(is_supported_audio_language_code('de'))

        self.assertFalse(is_supported_audio_language_code(''))
        self.assertFalse(is_supported_audio_language_code('zz'))
        self.assertFalse(is_supported_audio_language_code('test'))

    def test_is_url_fragment(self):
        validate_url_fragment = schema_utils.get_validator(
            'is_url_fragment')

        self.assertTrue(validate_url_fragment('math'))
        self.assertTrue(validate_url_fragment('computer-science'))
        self.assertTrue(validate_url_fragment('bio-tech'))

        self.assertFalse(validate_url_fragment(''))
        self.assertFalse(validate_url_fragment('Abc'))
        self.assertFalse(validate_url_fragment('!@#$%^&*()_+='))

    def test_global_validators_raise_exception_when_error_in_dict(self):
        with self.assertRaisesRegexp(
            AssertionError,
            r'^Validation failed: does_not_contain_email .* email@email.com$'
        ):
            obj = {
                'unicodeListProp': ['not email', 'not email 2'],
                'unicodeProp': 'email@email.com'
            }
            schema_utils.normalize_against_schema(
                obj, self.GLOBAL_VALIDATORS_SCHEMA,
                global_validators=self.GLOBAL_VALIDATORS
            )

    def test_global_validators_raise_exception_when_error_in_list(self):
        with self.assertRaisesRegexp(
            AssertionError,
            r'^Validation failed: does_not_contain_email .* email2@email.com$'
        ):
            obj = {
                'unicodeListProp': ['email2@email.com', 'not email 2'],
                'unicodeProp': 'not email'
            }
            schema_utils.normalize_against_schema(
                obj, self.GLOBAL_VALIDATORS_SCHEMA,
                global_validators=self.GLOBAL_VALIDATORS
            )

    def test_global_validators_pass_when_no_error(self):
        obj = {
            'unicodeListProp': ['not email', 'not email 2'],
            'unicodeProp': 'not email'
        }
        normalized_obj = schema_utils.normalize_against_schema(
            obj, self.GLOBAL_VALIDATORS_SCHEMA,
            global_validators=self.GLOBAL_VALIDATORS
        )
        self.assertEqual(obj, normalized_obj)


class SchemaNormalizationUnitTests(test_utils.GenericTestBase):
    """Test schema-based normalization of objects."""

    def check_normalization(
            self, schema, mappings, invalid_items_with_error_messages):
        """Validates the schema and tests that values are normalized correctly.

        Args:
            schema: dict. The schema to normalize the value
                against. Each schema is a dict with at least a key called
                'type'. The 'type' can take one of the SCHEMA_TYPE_* values
                declared above.
            mappings: list(tuple). A list of 2-element tuples.
                The first element of each item is expected to be normalized to
                the second.
            invalid_items_with_error_messages: list(tuple(str, str)). A list of
                values with their corresponding messages. Each value is expected
                to raise an AssertionError when normalized.
        """
        validate_schema(schema)

        for raw_value, expected_value in mappings:
            self.assertEqual(
                schema_utils.normalize_against_schema(raw_value, schema),
                expected_value)
        for value, error_msg in invalid_items_with_error_messages:
            with self.assertRaisesRegexp(Exception, error_msg):
                schema_utils.normalize_against_schema(value, schema)

    def test_float_schema(self):
        schema = {
            'type': schema_utils.SCHEMA_TYPE_FLOAT,
        }
        mappings = [(1.2, 1.2), (3, 3.0), (-1, -1.0), ('1', 1.0)]
        invalid_values_with_error_messages = [
            ([13], r'Could not convert list to float: \[13\]'),
            ('abc', 'Could not convert unicode to float: abc'),
            (None, 'Could not convert NoneType to float: None')]
        self.check_normalization(
            schema, mappings, invalid_values_with_error_messages)

    def test_int_schema(self):
        schema = {
            'type': schema_utils.SCHEMA_TYPE_INT,
        }
        mappings = [(1.2, 1), (3.7, 3), (-1, -1), ('1', 1)]
        invalid_values_with_error_messages = [
            ([13], r'Could not convert list to int: \[13\]'),
            ('abc', 'Could not convert unicode to int: abc'),
            (None, 'Could not convert NoneType to int: None')]
        self.check_normalization(
            schema, mappings, invalid_values_with_error_messages)

    def test_unicode_or_none_schema(self):
        schema = {
            'type': schema_utils.SCHEMA_TYPE_UNICODE_OR_NONE,
        }
        mappings = [('a', 'a'), ('', ''), (b'bytes', 'bytes'), (None, None)]
        invalid_values_with_error_messages = [
            ([], r'Expected unicode string or None, received'),
        ]
        self.check_normalization(
            schema, mappings, invalid_values_with_error_messages)

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
        invalid_values_with_error_messages = [
            (['1', 13], 'Expected unicode string, received 13'),
            ({'a': 'b'}, r'Expected list, received {u\'a\': u\'b\'}'),
            ({}, 'Expected list, received {}'),
            (None, 'Expected list, received None'),
            (123, 'Expected list, received 123'),
            ('abc', 'Expected list, received abc'),
            (['c'], 'Expected length of 2 got 1'),
            ([], 'Expected length of 2 got 0')]
        self.check_normalization(
            schema, mappings, invalid_values_with_error_messages)

    def test_html_schema(self):
        """Tests for valid html schema, an html string. Note that
        html.cleaner() is called in normalize_against_schema.
        """
        schema = {
            'type': schema_utils.SCHEMA_TYPE_HTML,
        }
        mappings = [
            ('<script></script>', ''),
            (b'<script></script>', ''),
            (
                '<a class="webLink" href="https'
                '://www.oppia.com/"><img src="images/oppia.png"></a>',
                '<a href="https://www.oppia.com/"></a>')]
        invalid_values_with_error_messages = [
            (
                ['<script></script>', '<script></script>'],
                r'Expected unicode HTML string, received \[u\'<script></script>'
                r'\', u\'<script></script>\'\]')]
        self.check_normalization(
            schema, mappings, invalid_values_with_error_messages)

    def test_schema_key_post_normalizers(self):
        """Test post normalizers in schema using basic html schema."""
        schema_1 = {
            'type': schema_utils.SCHEMA_TYPE_HTML,
            'post_normalizers': [
                {'id': 'normalize_spaces'},  # html strings with no extra spaces
            ]
        }
        obj_1 = 'a     a'
        normalize_obj_1 = schema_utils.normalize_against_schema(obj_1, schema_1)
        self.assertEqual(u'a a', normalize_obj_1)

        schema_2 = {
            'type': schema_utils.SCHEMA_TYPE_HTML,
            'post_normalizers': [
                {'id': 'sanitize_url'}
            ]
        }
        obj_2 = 'http://www.oppia.org/splash/<script>'
        normalize_obj_2 = schema_utils.normalize_against_schema(obj_2, schema_2)
        self.assertEqual(u'http://www.oppia.org/splash/', normalize_obj_2)

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
        invalid_values_with_error_messages = [
            (['1', 13], 'Expected unicode string, received 13'),
            ({'a': 'b'}, r'Expected list, received {u\'a\': u\'b\'}'),
            ({}, 'Expected list, received {}'),
            (None, 'Expected list, received None'),
            (123, 'Expected list, received 123'),
            ('abc', 'Expected list, received abc')]
        self.check_normalization(
            schema, mappings, invalid_values_with_error_messages)

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

        invalid_values_with_error_messages = [
            ({
                'unicodeListProp': [],
                'intPROP': 1,
                'dictProp': {
                    'floatProp': 3.0
                }
            }, r'Missing keys: \[u\'intProp\'\], Extra keys: \[u\'intPROP\'\]'),
            ({
                'unicodeListProp': ['aaa'],
                'intProp': 1,
            }, r'Missing keys: \[u\'dictProp\'\], Extra keys: \[\]'),
            ({
                'unicodeListProp': [],
                'intProp': 3,
                'dictProp': {},
            }, r'Missing keys: \[u\'floatProp\'\], Extra keys: \[\]'),
            ([
                'unicodeListProp', 'intProp', 'dictProp'
            ],
             r'Expected dict, received \[u\'unicodeListProp\', u\'intProp\', '
             r'u\'dictProp\'\]'),
            (None, 'Expected dict, received None'),
            (123, 'Expected dict, received 123'),
            ('abc', 'Expected dict, received abc')]

        self.check_normalization(
            schema, mappings, invalid_values_with_error_messages)

    def test_notification_user_ids_list_validator(self):
        schema = email_manager.NOTIFICATION_USER_IDS_LIST_SCHEMA
        valid_user_id_list = [
            'uid_%s' % (chr(97 + i) * feconf.USER_ID_RANDOM_PART_LENGTH)
            for i in python_utils.RANGE(0, 5)
        ]
        big_user_id_list = [
            'uid_%s' % (chr(97 + i) * feconf.USER_ID_RANDOM_PART_LENGTH)
            for i in python_utils.RANGE(0, 7)
        ]
        mappings = [
            (
                ['uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)],
                ['uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)]
            ),
            (valid_user_id_list, valid_user_id_list)]
        invalid_values_with_error_messages = [
            (
                [u'uid_%s' % ('a' * 28)],
                r'Validation failed: is_valid_user_id \({}\) for object '
                r'%s' % 'uid_%s' % ('a' * 28)),
            (
                big_user_id_list,
                r'Validation failed: has_length_at_most \({u\'max_value\': 5}\)'
                r' for object \[.*\]'),
        ]
        self.check_normalization(
            schema, mappings, invalid_values_with_error_messages)

    def test_normalize_spaces(self):
        """Test static method normalize_spaces; should collapse multiple
        spaces.
        """
        normalize_spaces = schema_utils.Normalizers.get('normalize_spaces')
        self.assertEqual('dog cat', normalize_spaces('dog     cat'))
        self.assertEqual('dog cat', normalize_spaces('  dog cat'))
        self.assertEqual('dog cat', normalize_spaces(' dog   cat   '))
        self.assertNotEqual('dog cat', normalize_spaces('dogcat'))

    def test_normalizer_get(self):
        """Tests the class method 'get' of Normalizers, should return the
        normalizer method corresponding to the given normalizer id.
        """
        normalize_spaces = schema_utils.Normalizers.get('normalize_spaces')
        self.assertEqual('normalize_spaces', normalize_spaces.__name__)

    def test_normalizer_get_raises_exception_for_invalid_id(self):
        """Tests if class method get of Normalizers raises exception when given
        an invalid normalizer id.
        """
        with self.assertRaisesRegexp(
            Exception,
            'Invalid normalizer id: some invalid normalizer method name'):
            schema_utils.Normalizers.get('some invalid normalizer method name')

        with self.assertRaisesRegexp(
            Exception, 'Invalid normalizer id: normalize_space'):
            # Test substring of an actual id.
            schema_utils.Normalizers.get('normalize_space')

    def test_normalizer_sanitize_url(self):
        """Tests if static method sanitize_url of Normalizers correctly
        sanitizes a URL when given its string representation and raises
        error for invalid URLs.
        """
        sanitize_url = schema_utils.Normalizers.get('sanitize_url')
        self.assertEqual(
            'https://www.oppia.org/splash/',
            sanitize_url('https://www.oppia.org/splash/'))

        self.assertEqual(
            'http://www.oppia.org/splash/',
            sanitize_url('http://www.oppia.org/splash/'))

        self.assertEqual(
            sanitize_url('http://example.com/~path;parameters?q=arg#fragment'),
            'http://example.com/%7Epath%3Bparameters?q%3Darg#fragment')

        self.assertEqual(
            'https://www.web.com/%3Cscript%20type%3D%22text/javascript%22%'
            '3Ealert%28%27rm%20-rf%27%29%3B%3C/script%3E',
            sanitize_url(
                'https://www.web.com/<script type="text/javascript">alert(\'rm'
                ' -rf\');</script>'))

        self.assertEqual('', sanitize_url(''))

        # Raise AssertionError if string does not start with http:// or
        # https://.
        with self.assertRaisesRegexp(
            AssertionError,
            'Invalid URL: Sanitized URL should start with \'http://\' or'
            ' \'https://\'; received oppia.org'):
            sanitize_url('oppia.org')

        with self.assertRaisesRegexp(
            AssertionError,
            'Invalid URL: Sanitized URL should start with \'http://\' or'
            ' \'https://\'; received www.oppia.org'):
            sanitize_url('www.oppia.org')
