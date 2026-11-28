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
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for the Android feature-flags handler."""

from __future__ import annotations

from core.domain import (
    android_feature_flag_domain,
    android_feature_flag_registry,
    caching_services,
)
from core.platform import models
from core.tests import test_utils

from typing import Dict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])

FEATURE_FLAG_NAME = 'android_enable_fast_language_switching_in_lesson'
REQUEST_HEADERS = {
    'app_version_name': '0.19-rc03-ga-9faec1d609',
    'installation_id': 'installation-1',
    'app_package_name': 'org.oppia.android',
}


class AndroidFeatureFlagsHandlerTest(test_utils.GenericTestBase):
    """Tests the Android feature-flags endpoint."""

    def setUp(self) -> None:
        super().setUp()
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_ANDROID_FEATURE_FLAG,
            None,
            [FEATURE_FLAG_NAME],
        )

    def test_feature_flags_are_evaluated_for_ga_build(self) -> None:
        feature_flag_metadata: Dict[
            str,
            tuple[str, android_feature_flag_domain.AndroidFeatureFlagState],
        ] = {
            FEATURE_FLAG_NAME: (
                'Fast language switching.',
                android_feature_flag_domain.AndroidFeatureFlagState.FINAL,
            )
        }
        with self.swap(
            android_feature_flag_registry,
            'ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            feature_flag_metadata,
        ):
            config_models.AndroidFeatureFlagConfigModel.create(
                FEATURE_FLAG_NAME, 'final', '0.0', None, 100
            )
            response = self.get_json(
                '/android_feature_flags', headers=REQUEST_HEADERS
            )

        self.assertEqual(
            response,
            {'feature_flags': [{'name': FEATURE_FLAG_NAME, 'enabled': True}]},
        )

    def test_release_candidate_app_version_name_is_accepted(self) -> None:
        feature_flag_metadata: Dict[
            str,
            tuple[str, android_feature_flag_domain.AndroidFeatureFlagState],
        ] = {
            FEATURE_FLAG_NAME: (
                'Fast language switching.',
                android_feature_flag_domain.AndroidFeatureFlagState.FINAL,
            )
        }
        with self.swap(
            android_feature_flag_registry,
            'ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            feature_flag_metadata,
        ):
            config_models.AndroidFeatureFlagConfigModel.create(
                FEATURE_FLAG_NAME, 'final', '0.19', None, 100
            )
            response = self.get_json(
                '/android_feature_flags',
                headers={
                    **REQUEST_HEADERS,
                    'app_version_name': '0.19-rc03-alpha-9faec1d609',
                },
            )

        self.assertEqual(
            response,
            {'feature_flags': [{'name': FEATURE_FLAG_NAME, 'enabled': True}]},
        )

    def test_flags_outside_version_range_are_omitted(self) -> None:
        feature_flag_metadata: Dict[
            str,
            tuple[str, android_feature_flag_domain.AndroidFeatureFlagState],
        ] = {
            FEATURE_FLAG_NAME: (
                'Fast language switching.',
                android_feature_flag_domain.AndroidFeatureFlagState.FINAL,
            )
        }
        with self.swap(
            android_feature_flag_registry,
            'ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            feature_flag_metadata,
        ):
            config_models.AndroidFeatureFlagConfigModel.create(
                FEATURE_FLAG_NAME, 'final', '2.0', '3.0', 100
            )
            before_range_response = self.get_json(
                '/android_feature_flags',
                headers={
                    **REQUEST_HEADERS,
                    'app_version_name': '1.9-abcdef-ga',
                },
            )
            min_version_response = self.get_json(
                '/android_feature_flags',
                headers={
                    **REQUEST_HEADERS,
                    'app_version_name': '2.0-abcdef-ga',
                },
            )
            max_version_response = self.get_json(
                '/android_feature_flags',
                headers={
                    **REQUEST_HEADERS,
                    'app_version_name': '3.0-abcdef-ga',
                },
            )
            after_range_response = self.get_json(
                '/android_feature_flags',
                headers={
                    **REQUEST_HEADERS,
                    'app_version_name': '3.1-abcdef-ga',
                },
            )

        self.assertEqual(before_range_response, {'feature_flags': []})
        expected_response = {
            'feature_flags': [{'name': FEATURE_FLAG_NAME, 'enabled': True}]
        }
        self.assertEqual(min_version_response, expected_response)
        self.assertEqual(max_version_response, expected_response)
        self.assertEqual(after_range_response, {'feature_flags': []})

    def test_live_flags_are_only_exposed_for_ga_flavor(self) -> None:
        feature_flag_metadata: Dict[
            str,
            tuple[str, android_feature_flag_domain.AndroidFeatureFlagState],
        ] = {
            FEATURE_FLAG_NAME: (
                'Fast language switching.',
                android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
            )
        }
        with self.swap(
            android_feature_flag_registry,
            'ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            feature_flag_metadata,
        ):
            config_models.AndroidFeatureFlagConfigModel.create(
                FEATURE_FLAG_NAME, 'live', '0.0', None, 100
            )
            for flavor in ('dev', 'alpha', 'beta'):
                response = self.get_json(
                    '/android_feature_flags',
                    headers={
                        **REQUEST_HEADERS,
                        'app_version_name': (
                            '0.19-rc03-%s-9faec1d609' % flavor
                        ),
                    },
                )
                self.assertEqual(response, {'feature_flags': []})

            ga_response = self.get_json(
                '/android_feature_flags', headers=REQUEST_HEADERS
            )

        self.assertEqual(
            ga_response,
            {'feature_flags': [{'name': FEATURE_FLAG_NAME, 'enabled': True}]},
        )

    def test_missing_required_headers_return_bad_request(self) -> None:
        for missing_header in (
            'app_version_name',
            'installation_id',
            'app_package_name',
        ):
            request_headers = {
                name: value
                for name, value in REQUEST_HEADERS.items()
                if name != missing_header
            }
            self.get_json(
                '/android_feature_flags',
                headers=request_headers,
                expected_status_int=400,
            )

    def test_blank_required_headers_return_bad_request(self) -> None:
        for blank_header in (
            'app_version_name',
            'installation_id',
            'app_package_name',
        ):
            request_headers = {
                **REQUEST_HEADERS,
                blank_header: '   ',
            }
            self.get_json(
                '/android_feature_flags',
                headers=request_headers,
                expected_status_int=400,
            )

    def test_invalid_app_version_returns_bad_request(self) -> None:
        self.get_json(
            '/android_feature_flags',
            headers={**REQUEST_HEADERS, 'app_version_name': 'not-a-version'},
            expected_status_int=400,
        )
