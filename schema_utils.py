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

"""Utility functions for managing schemas and schema-based validation."""

__author__ = 'sll@google.com (Sean Lip)'

import numbers


SCHEMA_KEY_ITEMS = 'items'
SCHEMA_KEY_LENGTH = 'length'
SCHEMA_KEY_PROPERTIES = 'properties'
SCHEMA_KEY_TYPE = 'type'

SCHEMA_TYPE_BOOL = 'bool'
SCHEMA_TYPE_DICT = 'dict'
SCHEMA_TYPE_FLOAT = 'float'
SCHEMA_TYPE_INT = 'int'
SCHEMA_TYPE_LIST = 'list'
SCHEMA_TYPE_UNICODE = 'unicode'
ALLOWED_SCHEMA_TYPES = [
    SCHEMA_TYPE_BOOL, SCHEMA_TYPE_DICT, SCHEMA_TYPE_FLOAT, SCHEMA_TYPE_INT,
    SCHEMA_TYPE_LIST, SCHEMA_TYPE_UNICODE]


def validate_schema(schema):
    assert isinstance(schema, dict)
    assert SCHEMA_KEY_TYPE in schema
    assert schema[SCHEMA_KEY_TYPE] in ALLOWED_SCHEMA_TYPES
    if schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_LIST:
        for key in schema:
            assert key in [
                SCHEMA_KEY_ITEMS, SCHEMA_KEY_LENGTH, SCHEMA_KEY_TYPE], schema
            if key == SCHEMA_KEY_LENGTH:
                assert isinstance(schema[SCHEMA_KEY_LENGTH], int)
                assert schema[SCHEMA_KEY_LENGTH] > 0
            validate_schema(schema[SCHEMA_KEY_ITEMS])
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_DICT:
        for key in schema:
            assert key in [SCHEMA_KEY_PROPERTIES, SCHEMA_KEY_TYPE], schema
            for prop in schema[SCHEMA_KEY_PROPERTIES]:
                assert isinstance(prop, basestring)
                validate_schema(schema[SCHEMA_KEY_PROPERTIES][prop])
    else:
        assert schema.keys() == [SCHEMA_KEY_TYPE], schema


def normalize_against_schema(obj, schema):
    if schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_BOOL:
        assert isinstance(obj, bool), ('Expected bool, received %s' % obj)
        return obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_DICT:
        assert isinstance(obj, dict), ('Expected dict, received %s' % obj)
        assert set(obj.keys()) == set(schema[SCHEMA_KEY_PROPERTIES].keys())
        normalized_obj = {
            key: normalize_against_schema(
                obj[key], schema[SCHEMA_KEY_PROPERTIES][key])
            for key in schema[SCHEMA_KEY_PROPERTIES]
        }
        return normalized_obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_FLOAT:
        obj = float(obj)
        assert isinstance(obj, numbers.Real), (
            'Expected float, received %s' % obj)
        return obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_INT:
        obj = int(obj)
        assert isinstance(obj, numbers.Integral), (
            'Expected int, received %s' % obj)
        assert isinstance(obj, int), ('Expected int, received %s' % obj)
        return obj
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_LIST:
        assert isinstance(obj, list), ('Expected list, received %s' % obj)
        item_schema = schema[SCHEMA_KEY_ITEMS]
        if SCHEMA_KEY_LENGTH in schema:
            assert len(obj) == schema[SCHEMA_KEY_LENGTH]
        return [normalize_against_schema(item, item_schema) for item in obj]
    elif schema[SCHEMA_KEY_TYPE] == SCHEMA_TYPE_UNICODE:
        assert isinstance(obj, basestring), (
            'Expected unicode string, received %s' % obj)
        obj = unicode(obj)
        assert isinstance(obj, unicode), (
            'Expected unicode, received %s' % obj)
        return obj
