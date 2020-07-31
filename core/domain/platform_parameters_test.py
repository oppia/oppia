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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import platform_parameters as params
from core.tests import test_utils


class ExistingPlatformParameterValidityTests(test_utils.GenericTestBase):
    """Tests to validate platform parameters registered in
    core/domain/platform_parameters.py.
    """

    EXPECTED_PARAM_NAMES = ['dummy_feature', 'dummy_parameter']

    def test_all_defined_parameters_are_valid(self):
        all_names = params.Registry.get_all_platform_parameter_names()
        for name in all_names:
            param = params.Registry.get_platform_parameter(name)
            param.validate()

    def test_number_of_parameters_meets_expectation(self):
        self.assertEqual(
            len(params.Registry.get_all_platform_parameter_names()),
            len(self.EXPECTED_PARAM_NAMES))

    def test_all_expected_parameters_are_present_in_registry(self):
        existing_names = params.Registry.get_all_platform_parameter_names()
        missing_names = set(self.EXPECTED_PARAM_NAMES) - set(existing_names)

        self.assertFalse(
            missing_names,
            msg='Platform parameters missing in registry: %s.' % (
                list(missing_names))
        )

    def test_no_unexpected_parameter_in_registry(self):
        existing_names = params.Registry.get_all_platform_parameter_names()
        unexpected_names = set(existing_names) - set(self.EXPECTED_PARAM_NAMES)

        self.assertFalse(
            unexpected_names,
            msg='Unexpected platform parameters: %s.' % list(unexpected_names)
        )
