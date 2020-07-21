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

"""Test of feature flags registry."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules


from core import features_registry
from core.domain import platform_parameter_domain as param_domain
from core.tests import test_utils


class FeatureFlagRegistryTest(test_utils.GenericTestBase):
    """Tests for feature flags listed in features_registry."""

    def test_all_names_in_features_lists_exist(self):
        missing_names = []
        for name in features_registry.ALL_FEATURES_NAMES_SET:
            if name not in param_domain.Registry.parameter_registry:
                missing_names.append(name)
        self.assertFalse(
            missing_names,
            msg='Following entries in feature lists are not defined: %s.' % (
                missing_names)
        )

    def test_no_duplicated_names_in_features_lists(self):
        duplicate_names = []
        for name in features_registry.ALL_FEATURES_NAMES_SET:
            if features_registry.ALL_FEATURES_LIST.count(name) > 1:
                duplicate_names.append(name)
        self.assertFalse(
            duplicate_names,
            msg='Following entries appear more than once in features lists'
            ': %s.' % (duplicate_names)
        )

    def test_no_duplicate_names_in_deprecated_names_list(self):
        duplicate_names = []
        for name in set(features_registry.DEPRECATED_FEATURE_NAMES):
            if features_registry.DEPRECATED_FEATURE_NAMES.count(name) > 1:
                duplicate_names.append(name)
        self.assertFalse(
            duplicate_names,
            msg='Following entries appear more than once in deprecated name '
            'list: %s.' % (duplicate_names)
        )

    def test_no_deprecated_names_in_features_lists(self):
        deprecated_names_set = set(features_registry.DEPRECATED_FEATURE_NAMES)
        found_deprecated_names = []
        for name in features_registry.ALL_FEATURES_NAMES_SET:
            if name in deprecated_names_set:
                found_deprecated_names.append(name)
        self.assertFalse(
            found_deprecated_names,
            msg='Following names in feature lists are deprecated and should '
            'not be used: %s.' % (found_deprecated_names)
        )

    def test_all_entries_in_features_lists_are_featrues(self):
        non_feature_names = []
        for name in features_registry.ALL_FEATURES_LIST:
            feature_flag = param_domain.Registry.get_platform_parameter(name)
            if not feature_flag.metadata.is_feature:
                non_feature_names.append(name)
        self.assertFalse(
            non_feature_names,
            msg='Following entries in FEATURES_LIST are not features: %s.' % (
                non_feature_names)
        )

    def test_all_entries_in_features_lists_are_valid(self):
        for name in features_registry.ALL_FEATURES_LIST:
            feature_flag = param_domain.Registry.get_platform_parameter(name)
            feature_flag.validate()

    def test_all_entries_in_dev_features_list_are_in_dev_stage(self):
        invalid_feature_names = []
        for name in features_registry.DEV_FEATURES_LIST:
            feature_flag = param_domain.Registry.get_platform_parameter(name)
            if feature_flag.metadata.stage != 'dev':
                invalid_feature_names.append(name)
        self.assertFalse(
            invalid_feature_names,
            msg='Following entries defined in DEV_FEATURES_LIST are not in '
            '\'dev\' stage: %s.' % (invalid_feature_names)
        )

    def test_all_entries_in_test_features_list_are_in_test_stage(self):
        invalid_feature_names = []
        for name in features_registry.TEST_FEATURES_LIST:
            feature_flag = param_domain.Registry.get_platform_parameter(name)
            if feature_flag.metadata.stage != 'test':
                invalid_feature_names.append(name)
        self.assertFalse(
            invalid_feature_names,
            msg='Following entries defined in TEST_FEATURES_LIST are not in '
            '\'test\' stage: %s.' % (invalid_feature_names)
        )

    def test_all_entries_in_prod_features_list_are_in_prod_stage(self):
        invalid_feature_names = []
        for name in features_registry.PROD_FEATURES_LIST:
            feature_flag = param_domain.Registry.get_platform_parameter(name)
            if feature_flag.metadata.stage != 'prod':
                invalid_feature_names.append(name)
        self.assertFalse(
            invalid_feature_names,
            msg='Following entries defined in PROD_FEATURES_LIST are not in '
            '\'prod\' stage: %s.' % (invalid_feature_names)
        )
