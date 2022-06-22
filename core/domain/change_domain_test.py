# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Tests for the change domain objects."""

from __future__ import annotations

from core import feconf
from core.domain import change_domain
from core.tests import test_utils

from typing import List


class BaseChangeTests(test_utils.GenericTestBase):

    ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = [{
        'name': 'change_property_value',
        'required_attribute_names': ['new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]

    def setUp(self) -> None:
        change_domain.BaseChange.ALLOWED_COMMANDS = self.ALLOWED_COMMANDS
        self.valid_cmd_attribute = (
            self.ALLOWED_COMMANDS[0]['required_attribute_names'] +
            self.ALLOWED_COMMANDS[0]['optional_attribute_names']
        )

    def test_to_dict(self) -> None:
        config_property_change_dict = {
            'cmd': 'change_property_value',
            'new_value': 'new_value',
            'old_value': 'old_value'
        }
        change_object = change_domain.BaseChange(config_property_change_dict)
        self.assertEqual(
            change_object.to_dict(),
            config_property_change_dict
        )
    
    def test_only_valid_attribute_names_exist_in_instance(self) -> None:
        config_property_change_dict = {
            'cmd': 'change_property_value',
            'new_value': 'new_value',
            'old_value': 'old_value'
        }
        change_object = change_domain.BaseChange(config_property_change_dict)
        for name in self.valid_cmd_attribute:
            attribute_value = getattr(change_object, name)
            self.assertIsNotNone(attribute_value)

    def test_extra_attributes_does_not_exist_in_change_instance(self) -> None:
        config_property_change_dict = {
            'cmd': 'change_property_value',
            'new_value': 'new_value',
            'old_value': 'old_value'
        }
        change_object = change_domain.BaseChange(config_property_change_dict)
        with self.assertRaisesRegex(# type: ignore[no-untyped-call]
            AttributeError, 'Attribute extra_value does not exist'):
            getattr(change_object, 'extra_value')
            