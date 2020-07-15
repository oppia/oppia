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

"""Tests for the config variable registry."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import platform_parameter_domain as parameter_domain
from core.tests import test_utils
import utils


class PlatformParameterChangeTests(test_utils.GenericTestBase):
    VALID_CMD_NAME = (
        parameter_domain
        .PlatformParameterChange
        .CMD_REPLACE_PARAMETER_RULES)

    def test_platform_parameter_change_object_with_missing_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'):
            parameter_domain.PlatformParameterChange({'invalid': 'data'})

    def test_platform_parameter_change_object_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'):
            parameter_domain.PlatformParameterChange({'cmd': 'invalid'})

    def test_platform_parameter_change_object_with_missing_attribute_in_cmd(
            self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_rules')):
            parameter_domain.PlatformParameterChange({
                'cmd': self.VALID_CMD_NAME
            })

    def test_platform_parameter_change_object_with_extra_attribute_in_cmd(
            self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            parameter_domain.PlatformParameterChange({
                'cmd': self.VALID_CMD_NAME,
                'new_rules': [],
                'invalid': 'invalid'
            })

    def test_platform_parameter_change_object_with_valid_data(self):
        platform_parameter_change_object = (
            parameter_domain.PlatformParameterChange({
                'cmd': self.VALID_CMD_NAME,
                'new_rules': []
            }))

        self.assertEqual(
            platform_parameter_change_object.cmd, self.VALID_CMD_NAME)
        self.assertEqual(
            platform_parameter_change_object.new_rules, [])

    def test_to_dict(self):
        platform_parameter_change_dict = {
            'cmd': self.VALID_CMD_NAME,
            'new_rules': []
        }
        platform_parameter_change_object = (
            parameter_domain.PlatformParameterChange(
                platform_parameter_change_dict))
        self.assertEqual(
            platform_parameter_change_object.to_dict(),
            platform_parameter_change_dict)
