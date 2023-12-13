# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for platform feature evaluation handler."""

from __future__ import annotations

import enum

from core import platform_feature_list
from core.domain import feature_flag_domain
from core.domain import feature_flag_registry as registry
from core.domain import feature_flag_services as feature_services
from core.tests import test_utils

FeatureStages = feature_flag_domain.FeatureStages


class FeatureNames(enum.Enum):
    """Enum for features names."""

    FEATURE_A = 'feature_a'
    FEATURE_B = 'feature_b'


class FeatureFlagsEvaluationHandlerTest(test_utils.GenericTestBase):
    """Tests for the FeatureFlagsEvaluationHandler."""

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.original_registry = registry.Registry.feature_flag_spec_registry
        self.original_feature_list = feature_services.ALL_FEATURE_FLAGS
        self.original_feature_name_set = feature_services.ALL_FEATURES_NAMES_SET
        registry.Registry.feature_flag_spec_registry.clear()

        feature_names = ['feature_a', 'feature_b']
        feature_name_enums = [FeatureNames.FEATURE_A, FeatureNames.FEATURE_B]

        registry.Registry.feature_flag_spec_registry.clear()
        self.dev_feature_flag = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)
        self.prod_feature_flag = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_B, 'test', FeatureStages.PROD)
        registry.Registry.update_feature_flag(
            self.prod_feature_flag.name, True, 0, []
        )

        # Here we use MyPy ignore because the expected type of ALL_FEATURE_FLAGS
        # is a list of 'platform_feature_list.FeatureNames' Enum, but here for
        # testing purposes we are providing a list of custom 'FeatureNames'
        # enums for mocking the actual behavior, which causes MyPy to throw an
        # 'Incompatible types in assignment' error. Thus to avoid the error, we
        # used ignore here.
        feature_services.ALL_FEATURE_FLAGS = feature_name_enums  # type: ignore[assignment]
        feature_services.ALL_FEATURES_NAMES_SET = set(feature_names)

    def tearDown(self) -> None:
        super().tearDown()

        feature_services.ALL_FEATURE_FLAGS = self.original_feature_list
        feature_services.ALL_FEATURES_NAMES_SET = self.original_feature_name_set
        registry.Registry.feature_flag_spec_registry = self.original_registry

    def test_feature_flag_evaluation_is_correct(self) -> None:
        result = self.get_json(
            '/feature_flags_evaluation_handler'
        )
        self.assertEqual(
            result,
            {
                self.dev_feature_flag.name: False,
                self.prod_feature_flag.name: True
            }
        )


class FeatureFlagDummyHandlerTest(test_utils.GenericTestBase):
    """Tests for the FeatureFlagDummyHandler."""

    def tearDown(self) -> None:
        feature_services.update_feature_flag(
            platform_feature_list.FeatureNames.
            DUMMY_FEATURE_FLAG_FOR_E2E_TESTS.value,
            False,
            0,
            []
        )

        super().tearDown()

    def _set_dummy_feature_flag_status(
        self, feature_is_enabled: bool) -> None:
        """Sets the dummy_feature feature flag value."""
        feature_services.update_feature_flag(
            platform_feature_list.FeatureNames.
            DUMMY_FEATURE_FLAG_FOR_E2E_TESTS.value,
            feature_is_enabled,
            0,
            []
        )

    def test_get_with_dummy_feature_flag_enabled_returns_true(self) -> None:
        self._set_dummy_feature_flag_status(True)
        result = self.get_json(
            '/feature_flag_dummy_handler',
        )
        self.assertEqual(result, {'msg': 'ok', 'is_enabled': True})

    def test_get_with_dummy_feature_flag_disabled_returns_false(self) -> None:
        self._set_dummy_feature_flag_status(True)
        self.get_json(
            '/feature_flag_dummy_handler',
            expected_status_int=200
        )

        self._set_dummy_feature_flag_status(False)
        result = self.get_json(
            '/feature_flag_dummy_handler'
        )
        self.assertEqual(result, {'msg': 'ok', 'is_enabled': False})
