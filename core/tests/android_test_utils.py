# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Test utilities for Android response schema validation."""

from __future__ import annotations

import json
import os
from typing import Any, Dict

import jsonschema

PLATFORM_PARAMETERS_SCHEMA: str = 'platform_parameters_response.json'
FEATURE_FLAGS_SCHEMA: str = 'feature_flags_response.json'

ANDROID_SCHEMAS_DIR: str = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__), os.pardir, 'controllers', 'android_schemas'
    )
)

_CACHED_VALIDATORS: Dict[str, jsonschema.Draft202012Validator] = {}


# Here we use type Any because JSON schema structure contains arbitrary
# nested types and generic dictionary structures.
def get_android_schema(schema_filename: str) -> Dict[str, Any]:
    """Loads a JSON schema dictionary from the android_schemas directory.

    Args:
        schema_filename: str. The filename of the schema to load.

    Returns:
        dict. The parsed JSON schema.

    Raises:
        FileNotFoundError. If the schema file does not exist.
    """
    schema_path = os.path.join(ANDROID_SCHEMAS_DIR, schema_filename)
    with open(schema_path, 'r', encoding='utf-8') as f:
        # Here we use type Any because JSON schema structure contains arbitrary
        # nested types and generic dictionary structures.
        schema: Dict[str, Any] = json.load(f)
    return schema


def get_android_response_validator(
    schema_filename: str,
) -> jsonschema.Draft202012Validator:
    """Returns a cached Draft202012Validator for the given schema filename.

    Args:
        schema_filename: str. The filename of the schema to get validator for.

    Returns:
        Draft202012Validator. The cached validator instance.
    """
    if schema_filename not in _CACHED_VALIDATORS:
        schema = get_android_schema(schema_filename)
        jsonschema.Draft202012Validator.check_schema(schema)
        _CACHED_VALIDATORS[schema_filename] = jsonschema.Draft202012Validator(
            schema
        )
    return _CACHED_VALIDATORS[schema_filename]


# Here we use type Any because this function validates arbitrary decoded JSON
# payloads against the schema.
def validate_android_response(data: Any, schema_filename: str) -> None:
    """Validates data against the specified Android response JSON schema.

    Args:
        data: *. The data to validate.
        schema_filename: str. The filename of the schema to validate against.

    Raises:
        ValidationError. If data does not conform to the schema.
    """
    validator = get_android_response_validator(schema_filename)
    validator.validate(data)
