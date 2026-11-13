# coding: utf-8
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Tests for Android platform parameters and feature flags handlers."""

from __future__ import annotations

import copy

from core.tests import android_test_utils
from core.tests import test_utils
import jsonschema


class AndroidPlatformHandlersTests(test_utils.GenericTestBase):
    """Test suite for Android platform parameters and feature flags."""

    def setUp(self) -> None:
        super().setUp()
        # Explicit expected defaults for platform parameters.
        self.expected_platform_defaults = {
            'android_min_version_code_for_recommending_app_update': 0,
            'android_min_supported_version_code': 0,
            'android_min_supported_api_level': 21,
        }

    def test_platform_parameters_defaults(self) -> None:
        response = self.get_json('/android_platform_parameters')
        android_test_utils.validate_android_response(
            response, android_test_utils.PLATFORM_PARAMETERS_SCHEMA
        )

        mapping = {item['name']: item['value'] for item in response}

        self.assertEqual(mapping, self.expected_platform_defaults)

    def test_platform_parameters_override(self) -> None:
        response = self.get_json(
            '/android_platform_parameters?android_min_supported_api_level=40'
        )
        android_test_utils.validate_android_response(
            response, android_test_utils.PLATFORM_PARAMETERS_SCHEMA
        )

        mapping = {item['name']: item['value'] for item in response}

        self.assertEqual(
            mapping,
            {
                'android_min_version_code_for_recommending_app_update': 0,
                'android_min_supported_version_code': 0,
                'android_min_supported_api_level': 40,
            },
        )

    def test_platform_parameters_multiple_overrides(self) -> None:
        response = self.get_json(
            '/android_platform_parameters'
            '?android_min_supported_api_level=33'
            '&android_min_supported_version_code=120'
        )
        android_test_utils.validate_android_response(
            response, android_test_utils.PLATFORM_PARAMETERS_SCHEMA
        )

        mapping = {item['name']: item['value'] for item in response}

        self.assertEqual(
            mapping,
            {
                'android_min_version_code_for_recommending_app_update': 0,
                'android_min_supported_version_code': 120,
                'android_min_supported_api_level': 33,
            },
        )

    def test_platform_parameters_parse_error(self) -> None:
        self.get_json(
            '/android_platform_parameters?android_min_supported_api_level=notanint',
            expected_status_int=400,
        )

    def test_platform_parameters_schema_validation_negative_cases(self) -> None:
        """Verifies that corrupted /android_platform_parameters responses fail validation."""
        response = self.get_json('/android_platform_parameters')
        android_test_utils.validate_android_response(
            response, android_test_utils.PLATFORM_PARAMETERS_SCHEMA
        )

        # 1. Missing required field ('value').
        corrupted_missing_field = copy.deepcopy(response)
        del corrupted_missing_field[0]['value']
        with self.assertRaisesRegex(
            jsonschema.exceptions.ValidationError,
            '\'value\' is a required property',
        ):
            android_test_utils.validate_android_response(
                corrupted_missing_field,
                android_test_utils.PLATFORM_PARAMETERS_SCHEMA,
            )

        # 2. Incorrect data type ('value' as string).
        corrupted_invalid_type = copy.deepcopy(response)
        corrupted_invalid_type[0]['value'] = 'not-an-integer'
        with self.assertRaisesRegex(
            jsonschema.exceptions.ValidationError,
            'is not of type \'integer\'',
        ):
            android_test_utils.validate_android_response(
                corrupted_invalid_type,
                android_test_utils.PLATFORM_PARAMETERS_SCHEMA,
            )

        # 3. Invalid parameter name (not in enum).
        corrupted_invalid_name = copy.deepcopy(response)
        corrupted_invalid_name[0]['name'] = 'unrecognized_parameter_name'
        with self.assertRaisesRegex(
            jsonschema.exceptions.ValidationError, 'is not one of'
        ):
            android_test_utils.validate_android_response(
                corrupted_invalid_name,
                android_test_utils.PLATFORM_PARAMETERS_SCHEMA,
            )

        # 4. Unexpected additional property.
        corrupted_extra_property = copy.deepcopy(response)
        corrupted_extra_property[0]['unexpected_web_field'] = True
        with self.assertRaisesRegex(
            jsonschema.exceptions.ValidationError,
            'Additional properties are not allowed',
        ):
            android_test_utils.validate_android_response(
                corrupted_extra_property,
                android_test_utils.PLATFORM_PARAMETERS_SCHEMA,
            )

        # 5. Non-array top level.
        corrupted_non_array = {'name': 'test', 'value': 1}
        with self.assertRaisesRegex(
            jsonschema.exceptions.ValidationError,
            'is not of type \'array\'',
        ):
            android_test_utils.validate_android_response(
                corrupted_non_array,
                android_test_utils.PLATFORM_PARAMETERS_SCHEMA,
            )

    def test_feature_flags_defaults(self) -> None:
        response = self.get_json('/android_feature_flags')
        android_test_utils.validate_android_response(
            response, android_test_utils.FEATURE_FLAGS_SCHEMA
        )
        mapping = {item['name']: item['enabled'] for item in response}

        self.assertEqual(
            mapping, {'android_enable_fast_language_switching_in_lesson': False}
        )

    def test_feature_flags_override(self) -> None:
        response = self.get_json(
            '/android_feature_flags?android_enable_fast_language_switching_in_lesson=true'
        )
        android_test_utils.validate_android_response(
            response, android_test_utils.FEATURE_FLAGS_SCHEMA
        )
        mapping = {item['name']: item['enabled'] for item in response}

        self.assertEqual(
            mapping, {'android_enable_fast_language_switching_in_lesson': True}
        )

    def test_feature_flags_parse_error(self) -> None:
        self.get_json(
            '/android_feature_flags?android_enable_fast_language_switching_in_lesson=notabool',
            expected_status_int=400,
        )

    def test_feature_flags_schema_validation_negative_cases(self) -> None:
        """Verifies that corrupted /android_feature_flags responses fail validation."""
        response = self.get_json('/android_feature_flags')
        android_test_utils.validate_android_response(
            response, android_test_utils.FEATURE_FLAGS_SCHEMA
        )

        # 1. Missing required field ('enabled').
        corrupted_missing_field = copy.deepcopy(response)
        del corrupted_missing_field[0]['enabled']
        with self.assertRaisesRegex(
            jsonschema.exceptions.ValidationError,
            '\'enabled\' is a required property',
        ):
            android_test_utils.validate_android_response(
                corrupted_missing_field,
                android_test_utils.FEATURE_FLAGS_SCHEMA,
            )

        # 2. Incorrect data type ('enabled' as string).
        corrupted_invalid_type = copy.deepcopy(response)
        corrupted_invalid_type[0]['enabled'] = 'true'
        with self.assertRaisesRegex(
            jsonschema.exceptions.ValidationError,
            'is not of type \'boolean\'',
        ):
            android_test_utils.validate_android_response(
                corrupted_invalid_type,
                android_test_utils.FEATURE_FLAGS_SCHEMA,
            )

        # 3. Invalid flag name (not in enum).
        corrupted_invalid_name = copy.deepcopy(response)
        corrupted_invalid_name[0]['name'] = 'unregistered_flag'
        with self.assertRaisesRegex(
            jsonschema.exceptions.ValidationError, 'is not one of'
        ):
            android_test_utils.validate_android_response(
                corrupted_invalid_name,
                android_test_utils.FEATURE_FLAGS_SCHEMA,
            )

        # 4. Unexpected additional property.
        corrupted_extra_property = copy.deepcopy(response)
        corrupted_extra_property[0]['extra_flag_property'] = 'disallowed'
        with self.assertRaisesRegex(
            jsonschema.exceptions.ValidationError,
            'Additional properties are not allowed',
        ):
            android_test_utils.validate_android_response(
                corrupted_extra_property,
                android_test_utils.FEATURE_FLAGS_SCHEMA,
            )
