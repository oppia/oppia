# coding: utf-8
"""Tests for Android platform parameters and feature flags handlers."""

from __future__ import annotations

from core import feconf
from core.tests import test_utils


class AndroidPlatformHandlersTests(test_utils.GenericTestBase):
    def test_platform_parameters_defaults(self) -> None:
        response = self.get_json('/android_platform_parameters')
        # Convert list to dict for easier assertions.
        mapping = {item['name']: item['value'] for item in response}
        self.assertIn('android_min_version_code_for_recommending_app_update', mapping)
        self.assertIn('android_min_supported_version_code', mapping)
        self.assertIn('android_min_supported_api_level', mapping)
        self.assertEqual(mapping['android_min_version_code_for_recommending_app_update'], 0)
        self.assertEqual(mapping['android_min_supported_version_code'], 0)
        self.assertEqual(mapping['android_min_supported_api_level'], 21)

    def test_platform_parameters_override_and_parse_error(self) -> None:
        response = self.get_json('/android_platform_parameters?android_min_supported_api_level=40')
        mapping = {item['name']: item['value'] for item in response}
        self.assertEqual(mapping['android_min_supported_api_level'], 40)

        # Bad int should return 400
        self.get_json('/android_platform_parameters?android_min_supported_api_level=notanint', expected_status_int=400)

    def test_feature_flags_defaults_and_overrides(self) -> None:
        response = self.get_json('/android_feature_flags')
        mapping = {item['name']: item['enabled'] for item in response}
        self.assertIn('android_enable_fast_language_switching_in_lesson', mapping)
        self.assertFalse(mapping['android_enable_fast_language_switching_in_lesson'])

        response = self.get_json('/android_feature_flags?android_enable_fast_language_switching_in_lesson=true')
        mapping = {item['name']: item['enabled'] for item in response}
        self.assertTrue(mapping['android_enable_fast_language_switching_in_lesson'])

        # Bad bool should return 400
        self.get_json('/android_feature_flags?android_enable_fast_language_switching_in_lesson=notabool', expected_status_int=400)
