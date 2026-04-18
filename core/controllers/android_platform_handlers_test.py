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

from core.tests import test_utils


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

        mapping = {item['name']: item['value'] for item in response}

        self.assertEqual(mapping, self.expected_platform_defaults)

    def test_platform_parameters_override(self) -> None:
        response = self.get_json(
            '/android_platform_parameters?android_min_supported_api_level=40'
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

    def test_feature_flags_defaults(self) -> None:
        response = self.get_json('/android_feature_flags')
        mapping = {item['name']: item['enabled'] for item in response}

        self.assertEqual(
            mapping, {'android_enable_fast_language_switching_in_lesson': False}
        )

    def test_feature_flags_override(self) -> None:
        response = self.get_json(
            '/android_feature_flags?android_enable_fast_language_switching_in_lesson=true'
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
