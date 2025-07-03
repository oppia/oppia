# coding: utf-8
#
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

"""Test of platform feature list."""

from __future__ import annotations

import os
import re

from core import feature_flag_list
from core import utils
from core.domain import feature_flag_domain
from core.domain import feature_flag_registry
from core.domain import platform_parameter_list
from core.tests import test_utils

from typing import Final, List

FRONTEND_FEATURE_NAMES_PATH: Final = os.path.join(
    os.getcwd(),
    'core/templates/domain/feature-flag',
    'feature-status-summary.model.ts')

ENUM_BODY_REGEXP: Final = re.compile(
    r'enum FeatureNames \{(.+?)\}', flags=re.DOTALL
)
ENUM_MEMBER_REGEXP: Final = re.compile(
    r'([a-zA-Z0-9_]+?)\s+=\s+\'([a-zA-Z0-9_]+?)\''
)


class FeatureFlagListTest(test_utils.GenericTestBase):
    """Tests for feature flags listed in feature_flag_list.py."""

    def setUp(self) -> None:
        super().setUp()

        self.all_features_list = (
            feature_flag_list.DEV_FEATURES_LIST +
            feature_flag_list.TEST_FEATURES_LIST +
            feature_flag_list.PROD_FEATURES_LIST)
        self.all_features_set = set(self.all_features_list)

    def _parse_feature_names_in_frontend(self) -> List[str]:
        """Reads and parses feature flag definition in frontend."""
        with utils.open_file(FRONTEND_FEATURE_NAMES_PATH, 'r') as f:
            content = f.read()

        body_content = ENUM_BODY_REGEXP.search(content)
        # Ruling out the possibility of None for mypy type checking.
        assert body_content is not None
        body = body_content.group(1)
        return [name for _, name in ENUM_MEMBER_REGEXP.findall(body)]

    def test_all_names_in_features_lists_exist(self) -> None:
        missing_names = []
        for feature in self.all_features_set:
            if feature.value not in (
                feature_flag_list.
                FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE
            ):
                missing_names.append(feature.value)
        self.assertTrue(
            len(missing_names) == 0,
            msg='Following entries in feature lists are not defined: %s.' % (
                missing_names)
        )

    def test_no_duplicated_names_in_features_lists(self) -> None:
        duplicate_names = []
        for feature in self.all_features_set:
            if self.all_features_list.count(feature) > 1:
                duplicate_names.append(feature.value)
        self.assertTrue(
            len(duplicate_names) == 0,
            msg='Following entries appear more than once in features lists'
            ': %s.' % (duplicate_names)
        )

    def test_no_duplicate_names_in_deprecated_names_list(self) -> None:
        duplicate_names = []
        deprecated_features = feature_flag_list.DEPRECATED_FEATURE_NAMES
        for feature in set(deprecated_features):
            if deprecated_features.count(feature) > 1:
                duplicate_names.append(feature.value)
        self.assertTrue(
            len(duplicate_names) == 0,
            msg='Following entries appear more than once in deprecated name '
            'list: %s.' % (duplicate_names)
        )

    def test_no_deprecated_names_in_features_lists(self) -> None:
        deprecated_names_set = set(
            feature_flag_list.DEPRECATED_FEATURE_NAMES)
        found_deprecated_names = []
        for feature in self.all_features_set:
            if feature in deprecated_names_set:
                found_deprecated_names.append(feature.value)
        self.assertTrue(
            len(found_deprecated_names) == 0,
            msg='Following names in feature lists are deprecated and should '
            'not be used: %s.' % (found_deprecated_names)
        )

    def test_all_entries_in_dev_features_list_are_in_dev_stage(self) -> None:
        invalid_feature_names = []
        for feature in feature_flag_list.DEV_FEATURES_LIST:
            feature_flag = (
                feature_flag_registry.Registry.get_feature_flag(feature.value))
            if (feature_flag.feature_flag_spec.feature_stage !=
                    feature_flag_domain.FeatureStages.DEV):
                invalid_feature_names.append(feature.value)
        self.assertTrue(
            len(invalid_feature_names) == 0,
            msg='Following entries defined in DEV_FEATURES_LIST are not in '
            '\'dev\' stage: %s.' % (invalid_feature_names)
        )

    def test_all_entries_in_test_features_list_are_in_test_stage(self) -> None:
        invalid_feature_names = []
        for feature in feature_flag_list.TEST_FEATURES_LIST:
            feature_flag = (
                feature_flag_registry.Registry.get_feature_flag(feature.value))
            if (feature_flag.feature_flag_spec.feature_stage !=
                    feature_flag_domain.FeatureStages.TEST):
                invalid_feature_names.append(feature.value)
        self.assertTrue(
            len(invalid_feature_names) == 0,
            msg='Following entries defined in TEST_FEATURES_LIST are not in '
            '\'test\' stage: %s.' % (invalid_feature_names)
        )

    def test_all_entries_in_prod_features_list_are_in_prod_stage(self) -> None:
        invalid_feature_names = []
        for feature in feature_flag_list.PROD_FEATURES_LIST:
            feature_flag = (
                feature_flag_registry.Registry.get_feature_flag(feature.value))
            if (feature_flag.feature_flag_spec.feature_stage !=
                    feature_flag_domain.FeatureStages.PROD):
                invalid_feature_names.append(feature.value)
        self.assertTrue(
            len(invalid_feature_names) == 0,
            msg='Following entries defined in PROD_FEATURES_LIST are not in '
            '\'prod\' stage: %s.' % (invalid_feature_names)
        )

    def test_all_names_in_features_lists_exist_in_frontend(self) -> None:
        feature_names_in_frontend = self._parse_feature_names_in_frontend()
        all_feature_names_set = [
            feature.value for feature in self.all_features_set]
        missing_features = (
            set(all_feature_names_set) - set(feature_names_in_frontend))
        self.assertTrue(
            len(missing_features) == 0,
            msg='Following entries are not defined in frontend: %s.' % (
                list(missing_features))
        )

    def test_all_names_in_frontend_are_known(self) -> None:
        feature_names_in_frontend = self._parse_feature_names_in_frontend()
        all_feature_names_set = [
            feature.value for feature in self.all_features_set]
        missing_features = (
            set(feature_names_in_frontend) - set(all_feature_names_set))
        self.assertTrue(
            len(missing_features) == 0,
            msg='Following entries are defined in frontend but not defined'
                ' in the backend feature list: %s.' % list(missing_features)
        )

    def test_feature_flag_names_and_platform_parameter_names_are_unique(
        self) -> None:
        feature_flag_names = []
        for feature_flag_enum in feature_flag_list.FeatureNames:
            feature_flag_names.append(feature_flag_enum.name)
        for platform_param_enum in platform_parameter_list.ParamName:
            self.assertFalse(platform_param_enum.name in feature_flag_names)
