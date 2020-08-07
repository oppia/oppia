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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules


from core import platform_feature_list
from core.domain import platform_parameter_domain as param_domain
from core.domain import platform_parameter_registry as registry
from core.tests import test_utils


class PlatformFeatureListTest(test_utils.GenericTestBase):
    """Tests for feature flags listed in platform_feature_list.py."""

    def setUp(self):
        super(PlatformFeatureListTest, self).setUp()

        self.all_features_list = (
            platform_feature_list.DEV_FEATURES_LIST +
            platform_feature_list.TEST_FEATURES_LIST +
            platform_feature_list.PROD_FEATURES_LIST)
        self.all_feature_names_set = set(self.all_features_list)

    def test_all_names_in_features_lists_exist(self):
        missing_names = []
        for name in self.all_feature_names_set:
            if name not in registry.Registry.parameter_registry:
                missing_names.append(name)
        self.assertTrue(
            len(missing_names) == 0,
            msg='Following entries in feature lists are not defined: %s.' % (
                missing_names)
        )

    def test_no_duplicated_names_in_features_lists(self):
        duplicate_names = []
        for name in self.all_feature_names_set:
            if self.all_features_list.count(name) > 1:
                duplicate_names.append(name)
        self.assertTrue(
            len(duplicate_names) == 0,
            msg='Following entries appear more than once in features lists'
            ': %s.' % (duplicate_names)
        )

    def test_no_duplicate_names_in_deprecated_names_list(self):
        duplicate_names = []
        for name in set(platform_feature_list.DEPRECATED_FEATURE_NAMES):
            if platform_feature_list.DEPRECATED_FEATURE_NAMES.count(name) > 1:
                duplicate_names.append(name)
        self.assertTrue(
            len(duplicate_names) == 0,
            msg='Following entries appear more than once in deprecated name '
            'list: %s.' % (duplicate_names)
        )

    def test_no_deprecated_names_in_features_lists(self):
        deprecated_names_set = set(
            platform_feature_list.DEPRECATED_FEATURE_NAMES)
        found_deprecated_names = []
        for name in self.all_feature_names_set:
            if name in deprecated_names_set:
                found_deprecated_names.append(name)
        self.assertTrue(
            len(found_deprecated_names) == 0,
            msg='Following names in feature lists are deprecated and should '
            'not be used: %s.' % (found_deprecated_names)
        )

    def test_all_entries_in_features_lists_are_features(self):
        non_feature_names = []
        for name in self.all_feature_names_set:
            feature_flag = registry.Registry.get_platform_parameter(name)
            if not feature_flag.is_feature:
                non_feature_names.append(name)
        self.assertTrue(
            len(non_feature_names) == 0,
            msg='Following entries in FEATURES_LIST are not features: %s.' % (
                non_feature_names)
        )

    def test_all_entries_in_dev_features_list_are_in_dev_stage(self):
        invalid_feature_names = []
        for name in platform_feature_list.DEV_FEATURES_LIST:
            feature_flag = registry.Registry.get_platform_parameter(name)
            if feature_flag.feature_stage != param_domain.FEATURE_STAGES.dev:
                invalid_feature_names.append(name)
        self.assertTrue(
            len(invalid_feature_names) == 0,
            msg='Following entries defined in DEV_FEATURES_LIST are not in '
            '\'dev\' stage: %s.' % (invalid_feature_names)
        )

    def test_all_entries_in_test_features_list_are_in_test_stage(self):
        invalid_feature_names = []
        for name in platform_feature_list.TEST_FEATURES_LIST:
            feature_flag = registry.Registry.get_platform_parameter(name)
            if feature_flag.feature_stage != param_domain.FEATURE_STAGES.test:
                invalid_feature_names.append(name)
        self.assertTrue(
            len(invalid_feature_names) == 0,
            msg='Following entries defined in TEST_FEATURES_LIST are not in '
            '\'test\' stage: %s.' % (invalid_feature_names)
        )

    def test_all_entries_in_prod_features_list_are_in_prod_stage(self):
        invalid_feature_names = []
        for name in platform_feature_list.PROD_FEATURES_LIST:
            feature_flag = registry.Registry.get_platform_parameter(name)
            if feature_flag.feature_stage != param_domain.FEATURE_STAGES.prod:
                invalid_feature_names.append(name)
        self.assertTrue(
            len(invalid_feature_names) == 0,
            msg='Following entries defined in PROD_FEATURES_LIST are not in '
            '\'prod\' stage: %s.' % (invalid_feature_names)
        )
