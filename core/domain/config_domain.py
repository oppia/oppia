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

from typing import Dict, List, Sequence, Union


AllowedDefaultValueTypes = Union[
    str,
    bool,
    float,
    Dict[str, str],
    List[str],
    List[Dict[str, Sequence[str]]],
    List[Dict[str, str]]
]


CMD_CHANGE_PROPERTY_VALUE = 'change_property_value'

SET_OF_STRINGS_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_LIST,
    'items': {
        'type': schema_utils.SCHEMA_TYPE_UNICODE,
    },
    'validators': [{
        'id': 'is_uniquified',
    }],
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
