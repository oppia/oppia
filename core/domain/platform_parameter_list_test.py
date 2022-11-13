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

"""Tests for registered platform parameters."""

from __future__ import annotations

from core.domain import platform_parameter_list as params
from core.tests import test_utils


class ExistingPlatformParameterValidityTests(test_utils.GenericTestBase):
    """Tests to validate platform parameters registered in
    core/domain/platform_parameter_list.py.
    """

    EXPECTED_PARAM_NAMES = ['dummy_feature', 'dummy_parameter',
                            'end_chapter_celebration',
                            'checkpoint_celebration',
                            'android_beta_landing_page',
                            'blog_pages']

    def test_all_defined_parameters_are_valid(self) -> None:
        all_names = params.Registry.get_all_platform_parameter_names()
        for name in all_names:
            param = params.Registry.get_platform_parameter(name)
            param.validate()

    def test_number_of_parameters_meets_expectation(self) -> None:
        """Test that the Registry and EXPECTED_PARAM_NAMES have the same number
        of platform parameters.

        If this test fails, it means either:
            - There are parameters defined in
                core/domain/platform_parameter_list.py but not added to
                EXPECTED_PARAM_NAMES above.
            - There are parameters accidentally deleted from
                core/domain/platform_parameter_list.py.
        If you are defining new platform parameters, make sure to add it to the
        EXPECTED_PARAM_NAMES list as well.
        """
        self.assertEqual(
            len(params.Registry.get_all_platform_parameter_names()),
            len(self.EXPECTED_PARAM_NAMES))

    def test_all_expected_parameters_are_present_in_registry(self) -> None:
        """Test that all parameters in EXPECTED_PARAM_NAMES are present in
        Registry.

        If this test fails, it means some parameters in EXPECTED_PARAM_NAMES
        are missing in the registry. It's most likely caused by accidentally
        deleting some parameters in core/domain/platform_parameter_list.py.

        To fix this, please make sure no parameter is deleted. If you really
        need to delete a parameter (this should not happen in most cases),
        make sure it's also deleted from EXPECTED_PARAM_NAMES.
        """
        existing_names = params.Registry.get_all_platform_parameter_names()
        missing_names = set(self.EXPECTED_PARAM_NAMES) - set(existing_names)

        self.assertFalse(
            missing_names,
            msg='Platform parameters missing in registry: %s.' % (
                list(missing_names))
        )

    def test_no_unexpected_parameter_in_registry(self) -> None:
        """Test that all parameters registered in Registry are expected.

        If this test fails, it means some parameters in
        core/domain/platform_parameter_list.py are not found in
        EXPECTED_PARAM_NAMES.

        If you are creating new platform parameters, make sure to add it to
        the EXPECTED_PARAM_NAMES list as well.
        """
        existing_names = params.Registry.get_all_platform_parameter_names()
        unexpected_names = set(existing_names) - set(self.EXPECTED_PARAM_NAMES)

        self.assertFalse(
            unexpected_names,
            msg='Unexpected platform parameters: %s.' % list(unexpected_names)
        )
