# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for feature_flag_services.py."""

from __future__ import annotations

import enum

from core import feconf
from core.constants import constants
from core.domain import caching_services
from core.domain import feature_flag_services as feature_services
from core.domain import feature_flag_domain
from core.domain import feature_flag_registry as registry
from core.tests import test_utils

class FeatureNames(enum.Enum):
    """Enum for parameter names."""

    FEATURE_A = 'feature_a'
    FEATURE_B = 'feature_b'
    FEATURE_C = 'feature_c'


FeatureStages = feature_flag_domain.FeatureStages


class FeatureFlagServiceTest(test_utils.GenericTestBase):
    """Test for the feature flag services."""

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.original_feature_registry = (
            registry.Registry.feature_registry.copy())
        registry.Registry.feature_registry.clear()
        # Feature names that might be used in following tests.
        feature_names = ['feature_a', 'feature_b', 'feature_c']
        feature_name_enums = [
            FeatureNames.FEATURE_A, FeatureNames.FEATURE_B, FeatureNames.FEATURE_C]
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            feature_names)

        self.dev_feature = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'a feature in dev stage',
            FeatureStages.DEV)
        self.test_feature = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_B, 'a feature in test stage',
            FeatureStages.TEST)
        self.prod_feature = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_C, 'a feature in prod stage',
            FeatureStages.PROD)

        # Replace feature lists with mocked names.
        self.original_feature_list = feature_services.ALL_FEATURE_FLAGS
        self.original_feature_name_set = (
            feature_services.ALL_FEATURES_NAMES_SET
        )
        # Here we use MyPy ignore because the expected type of ALL_FEATURE_FLAGS
        # is a list of 'PARAM_NAMES' Enum, but here for testing purposes we are
        # providing a list of 'ParamNames' enums, which causes MyPy to throw an
        # 'Incompatible types in assignment' error. Thus to avoid the error, we
        # used ignore here.
        feature_services.ALL_FEATURE_FLAGS = feature_name_enums  # type: ignore[assignment]
        feature_services.ALL_FEATURES_NAMES_SET = set(feature_names)

    def tearDown(self) -> None:
        super().tearDown()
        feature_services.ALL_FEATURE_FLAGS = self.original_feature_list
        feature_services.ALL_FEATURES_NAMES_SET = (
            self.original_feature_name_set)

    def test_get_all_feature_flag_dicts_returns_correct_dicts(self) -> None:
        expected_dicts = [
            self.dev_feature.to_dict(),
            self.test_feature.to_dict(),
            self.prod_feature.to_dict(),
        ]
        self.assertEqual(
            feature_services.get_all_feature_flag_dicts(),
            expected_dicts)

    def test_get_feature_flag_values_with_unknown_name_raises_error(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Unknown feature flag'):
            feature_services.is_feature_enabled('feature_that_does_not_exist')
