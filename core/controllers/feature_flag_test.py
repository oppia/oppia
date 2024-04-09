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

from core import feature_flag_list
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

        self.original_feature_list = feature_services.ALL_FEATURE_FLAGS
        self.original_feature_name_set = feature_services.ALL_FEATURES_NAMES_SET

        feature_names = ['feature_a', 'feature_b']
        feature_name_enums = [FeatureNames.FEATURE_A, FeatureNames.FEATURE_B]

        self.swapped_value = {
            FeatureNames.FEATURE_A.value: (
                'a feature in dev stage', FeatureStages.DEV
            ),
            FeatureNames.FEATURE_B.value: (
                'a feature in prod stage', FeatureStages.PROD
            )
        }
        self.swap_name_to_description_feature_stage_registry_dict = self.swap(
            registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            self.swapped_value
        )

        self.dev_feature_flag = feature_flag_domain.FeatureFlag(
            FeatureNames.FEATURE_A.value,
            feature_flag_domain.FeatureFlagSpec(
                'a feature in dev stage',
                FeatureStages.DEV
            ),
            feature_flag_domain.FeatureFlagConfig(
                False,
                0,
                [],
                None
            )
        )
        self.prod_feature_flag = feature_flag_domain.FeatureFlag(
            FeatureNames.FEATURE_B.value,
            feature_flag_domain.FeatureFlagSpec(
                'a feature in prod stage',
                FeatureStages.PROD
            ),
            feature_flag_domain.FeatureFlagConfig(
                False,
                0,
                [],
                None
            )
        )
        with self.swap_name_to_description_feature_stage_registry_dict:
            registry.Registry.update_feature_flag(
                self.prod_feature_flag.name, True, 0, []
            )

        # Here we use MyPy ignore because the expected type of ALL_FEATURE_FLAGS
        # is a list of 'feature_flag_list.FeatureNames' Enum, but here for
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

    def test_feature_flag_evaluation_is_correct(self) -> None:
        swap_name_to_description_feature_stage_dict = self.swap(
            feature_services,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            self.swapped_value
        )
        swap_name_to_description_feature_stage_registry_dict = self.swap(
            registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            self.swapped_value
        )

        with swap_name_to_description_feature_stage_dict:
            with swap_name_to_description_feature_stage_registry_dict:
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

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS])
    def test_get_with_dummy_feature_flag_enabled_returns_true(self) -> None:
        result = self.get_json(
            '/feature_flag_dummy_handler',
        )
        self.assertEqual(result, {'msg': 'ok', 'is_enabled': True})

    def test_get_with_dummy_feature_flag_disabled_returns_false(self) -> None:
        result = self.get_json(
            '/feature_flag_dummy_handler'
        )
        self.assertEqual(result, {'msg': 'ok', 'is_enabled': False})
