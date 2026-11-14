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

"""Tests for Android feature flags listed in android_feature_flag_list.py."""

from __future__ import annotations

from core import android_feature_flag_list
from core.domain import android_feature_flag_domain
from core.tests import test_utils

from typing import List


class AndroidFeatureFlagListTest(test_utils.GenericTestBase):
    """Tests for Android feature flags listed in android_feature_flag_list.py."""

    def setUp(self) -> None:
        super().setUp()

        self.all_features_list = (
            android_feature_flag_list.DEV_FEATURES_LIST
            + android_feature_flag_list.ALPHA_FEATURES_LIST
            + android_feature_flag_list.BETA_FEATURES_LIST
            + android_feature_flag_list.GA_FEATURES_LIST
        )
        self.all_features_set = set(self.all_features_list)

    def test_all_names_in_features_lists_exist(self) -> None:
        missing_names = []
        for feature in self.all_features_set:
            if (
                feature.value
                not in android_feature_flag_list.FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE
            ):
                missing_names.append(feature.value)
        self.assertEqual(
            missing_names,
            [],
            msg='Following entries in feature lists are not defined: %s.'
            % missing_names,
        )

    def test_no_duplicated_names_in_features_lists(self) -> None:
        duplicate_names = []
        for feature in self.all_features_set:
            if self.all_features_list.count(feature) > 1:
                duplicate_names.append(feature.value)
        self.assertEqual(
            duplicate_names,
            [],
            msg='Following entries appear more than once in features lists: '
            '%s.' % duplicate_names,
        )

    def test_all_android_feature_names_are_in_description_and_state_map(
        self,
    ) -> None:
        android_feature_names = {
            feature.value
            for feature in android_feature_flag_list.AndroidFeatureFlagNames
        }
        mapped_feature_names = set(
            android_feature_flag_list.FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE
        )

        missing_features = android_feature_names - mapped_feature_names
        unknown_features = mapped_feature_names - android_feature_names
        self.assertEqual(
            missing_features,
            set(),
            msg='Following Android feature flags have no description and '
            'state defined: %s.' % sorted(missing_features),
        )
        self.assertEqual(
            unknown_features,
            set(),
            msg='Following description and state entries are not defined as '
            'Android feature flags: %s.' % sorted(unknown_features),
        )

    def test_all_feature_flags_have_descriptions_and_valid_states(self) -> None:
        invalid_feature_names: List[str] = []
        for feature_name, (
            description,
            state,
        ) in (
            android_feature_flag_list.FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE.items()
        ):
            if not description or not isinstance(
                state, android_feature_flag_domain.AndroidFeatureFlagState
            ):
                invalid_feature_names.append(feature_name)

        self.assertEqual(
            invalid_feature_names,
            [],
            msg='Following Android feature flags have an invalid description '
            'or state: %s.' % invalid_feature_names,
        )
