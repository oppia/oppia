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

from typing import Any, Dict, List, Tuple, Union


# Here we use type Any because the sub-classes of BaseHandler can
# contain different schemas with different types of values, like str,
# complex dicts, etc.
def get_schema_type(arg_schema: Dict[str, Any]) -> str:
    """Returns the schema type for an argument.

    Args:
        arg_schema: dict(str, *). Schema for an argument.

    Returns:
        str. Returns schema type by extracting it from schema.
    """
    schema_type: str = arg_schema['schema']['type']
    return schema_type


# Here we use type Any because the sub-classes of BaseHandler can
# contain different schemas with different types of values, like str,
# complex dicts, etc.
def get_corresponding_key_for_object(arg_schema: Dict[str, Any]) -> str:
    """Returns the new key for an argument from its schema.

    Args:
        arg_schema: dict(str, *). Schema for an argument.

    Returns:
        str. The new argument name.
    """
    new_key_for_argument: str = arg_schema['schema']['new_key_for_argument']
    return new_key_for_argument


# Here we use type Any because the argument 'handler_args' is a dictionary
# representation of arguments that need to be validated and these arguments
# can be of any type, and the argument 'handler_args_schemas' is also annotated
# with Any type because this argument can accept schemas of the handler and
# those schemas can be of different kinds of dictionaries. The return type also
# uses Any because this method returns the normalized values of arguments.
def validate_arguments_against_schema(
    handler_args: Dict[str, Any],
    handler_args_schemas: Dict[str, Any],
    allowed_extra_args: bool,
    allow_string_to_bool_conversion: bool = False
) -> Tuple[Dict[str, Any], List[str]]:
    """Calls schema utils for normalization of object against its schema
    and collects all the errors.

    Args:
        handler_args: Dict(str, *). Object for normalization.
        handler_args_schemas: dict. Schema for args.
        allowed_extra_args: bool. Whether extra args are allowed in handler.
        allow_string_to_bool_conversion: bool. Whether to allow string to
            boolean conversion.

    Returns:
        *. A two tuple, where the first element represents the normalized value
        in dict format and the second element represents the lists of errors
        after validation.
    """
    # Collect all errors and present them at once.
    errors = []
    # Dictionary to hold normalized values of arguments after validation.
    normalized_values = {}
    for arg_key, arg_schema in handler_args_schemas.items():
        if arg_key not in handler_args or handler_args[arg_key] is None:
            if 'default_value' in arg_schema:
                if arg_schema['default_value'] is None:
                    # Skip validation because the argument is optional.
                    continue

                if arg_schema['default_value'] is not None:
                    handler_args[arg_key] = arg_schema['default_value']
            else:
                errors.append('Missing key in handler args: %s.' % arg_key)
                continue

        # Below normalization is for arguments which are expected to be boolean
        # but from API request they are received as string type.
        if (
                allow_string_to_bool_conversion and
                get_schema_type(arg_schema) == schema_utils.SCHEMA_TYPE_BOOL
                and isinstance(handler_args[arg_key], str)
        ):
            handler_args[arg_key] = (
                convert_string_to_bool(handler_args[arg_key]))

        try:
            normalized_value = schema_utils.normalize_against_schema(
                handler_args[arg_key], arg_schema['schema'])

            # Modification of argument name if new_key_for_argument
            # field is present in the schema.
            if 'new_key_for_argument' in arg_schema['schema']:
                arg_key = get_corresponding_key_for_object(arg_schema)
            normalized_values[arg_key] = normalized_value
        except Exception as e:
            errors.append(
                'Schema validation for \'%s\' failed: %s' % (arg_key, e))

    extra_args = set(handler_args.keys()) - set(handler_args_schemas.keys())

    if not allowed_extra_args and extra_args:
        errors.append('Found extra args: %s.' % (list(extra_args)))

    return normalized_values, errors


def convert_string_to_bool(param: str) -> Union[bool, str]:
    """Converts a request param of type string into expected bool type.

    Args:
        param: str. The params which needs normalization.

    Returns:
        Union[bool, str]. Returns a boolean value if the param is either a
        'true' or 'false' string literal, and returns string value otherwise.
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
