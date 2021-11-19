# coding: utf-8

# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Validates handler args against its schema by calling schema utils.
Also contains a list of handler class names which does not contain the schema.
"""

from __future__ import annotations

from core import schema_utils

from typing import Any, Dict, List, Optional, Tuple, Union


# This function recursively uses the schema dictionary and handler_args, and
# passes their values to itself as arguments, so their type is Any.
# See: https://github.com/python/mypy/issues/731
def validate(
        handler_args: Any,
        handler_args_schemas: Any,
        allowed_extra_args: bool,
        allow_string_to_bool_conversion: bool = False
) -> Tuple[Dict[str, Any], List[str]]:
    """Calls schema utils for normalization of object against its schema
    and collects all the errors.

    Args:
        handler_args: *. Object for normalization.
        handler_args_schemas: dict. Schema for args.
        allowed_extra_args: bool. Whether extra args are allowed in handler.
        allow_string_to_bool_conversion: bool. Whether to allow string to
            boolean coversion.

    Returns:
        *. A two tuple, where the first element represents the normalized value
        in dict format and the second element represents the lists of errors
        after validation.
    """
    # Collect all errors and present them at once.
    errors = []
    normalized_value = {}
    for arg_key, arg_schema in handler_args_schemas.items():

        if arg_key not in handler_args or handler_args[arg_key] is None:
            if ('default_value' in arg_schema and
                    arg_schema['default_value'] is None):
                # Skip validation for optional cases.
                continue
            elif ('default_value' in arg_schema and
                  arg_schema['default_value'] is not None):
                handler_args[arg_key] = arg_schema['default_value']
            elif 'default_value' not in arg_schema:
                errors.append('Missing key in handler args: %s.' % arg_key)
                continue

        # Below normalization is for arguments which are expected to be boolean
        # but from API request they are received as string type.
        if (
                allow_string_to_bool_conversion and
                arg_schema['schema']['type'] == schema_utils.SCHEMA_TYPE_BOOL
                and isinstance(handler_args[arg_key], str)
        ):
            handler_args[arg_key] = (
                convert_string_to_bool(handler_args[arg_key]))

        try:
            normalized_value[arg_key] = schema_utils.normalize_against_schema(
                handler_args[arg_key], arg_schema['schema'])
        except Exception as e:
            errors.append(
                'Schema validation for \'%s\' failed: %s' % (arg_key, e))

    extra_args = set(handler_args.keys()) - set(handler_args_schemas.keys())

    if not allowed_extra_args and extra_args:
        errors.append('Found extra args: %s.' % (list(extra_args)))

    return normalized_value, errors


def convert_string_to_bool(param: str) -> Optional[Union[bool, str]]:
    """Converts a request param of type string into expected bool type.

    Args:
        param: str. The params which needs normalization.

    Returns:
        bool. Converts the string param into its expected bool type.
    """
    case_insensitive_param = param.lower()

    if case_insensitive_param == 'true':
        return True
    elif case_insensitive_param == 'false':
        return False
    else:
        # String values other than booleans should be returned as it is, so that
        # schema validation will raise exceptions appropriately.
        return param
