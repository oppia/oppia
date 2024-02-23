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

"""Domain objects for configuration properties."""

from __future__ import annotations

from core import schema_utils
from core.domain import change_domain

from typing import Any, Dict, List, Sequence, TypedDict, Union


AllowedDefaultValueTypes = Union[
    str,
    bool,
    float,
    Dict[str, str],
    List[str],
    List[Dict[str, Sequence[str]]],
    List[Dict[str, str]]
]


class ConfigPropertySchemaDict(TypedDict):
    """Type representing the config property's schema dictionary."""

    # Here we use type Any because the general structure of schemas are like
    # {string : (string, dict, list[dict], variables defined in other modules)}.
    schema: Dict[str, Any]
    description: str
    value: AllowedDefaultValueTypes


CMD_CHANGE_PROPERTY_VALUE = 'change_property_value'

LIST_OF_FEATURED_TRANSLATION_LANGUAGES_DICTS_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_LIST,
    'items': {
        'type': schema_utils.SCHEMA_TYPE_DICT,
        'properties': [{
            'name': 'language_code',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE,
                'validators': [{
                    'id': 'is_supported_audio_language_code',
                }]
            },
        }, {
            'name': 'explanation',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE
            }
        }]
    }
}

SET_OF_STRINGS_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_LIST,
    'items': {
        'type': schema_utils.SCHEMA_TYPE_UNICODE,
    },
    'validators': [{
        'id': 'is_uniquified',
    }],
}

BOOL_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_BOOL
}

FLOAT_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_FLOAT
}

INT_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_INT
}

POSITIVE_INT_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_CUSTOM,
    'obj_type': 'PositiveInt'
}


class ConfigPropertyChange(change_domain.BaseChange):
    """Domain object for changes made to a config property object.

    The allowed commands, together with the attributes:
        - 'change_property_value' (with new_value)
    """

    ALLOWED_COMMANDS = [{
        'name': CMD_CHANGE_PROPERTY_VALUE,
        'required_attribute_names': ['new_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]


class ChangePropertyValueCmd(ConfigPropertyChange):
    """Class representing the ConfigPropertyChange's
    CMD_CHANGE_PROPERTY_VALUE command.
    """

    new_value: str
