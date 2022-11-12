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

"""Unit tests for change_domain.py"""

from __future__ import annotations
from lib2to3.pytree import Base


from core import feconf
from core import utils
from core.domain import change_domain
from core.tests import test_utils


class ChangeDomainTests(test_utils.GenericTestBase):

    def test_that_domain_object_is_created_correctly(self) -> None:
        change_object = change_domain.BaseChange({
            'cmd': feconf.CMD_DELETE_COMMIT
        })
        expected_change_object_dict = {
            'cmd': feconf.CMD_DELETE_COMMIT
        }
        self.assertEqual(change_object.to_dict(), expected_change_object_dict)

    def test_that_error_appenden_when_extra_attributes_added(self) -> None:
        change_object = change_domain.BaseChange({
            'cmd': feconf.CMD_DELETE_COMMIT
        })
        with self.assertRaisesRegex(utils.ValidationError, (
            'The following extra attributes are present: '
            'required_attribute_names')):
            change_dict = change_object.to_dict()
            change_dict['required_attribute_names'] = ['assignee_id']
            change_object.validate_dict(change_dict)

    def test_that_error_appenden_when_attribute_missing(self) -> None:
        valid_cmd_dict = feconf.ValidCmdDict(
            name='AUTO',
            required_attribute_names=['key1'],
            optional_attribute_names=['key 2'],
            user_id_attribute_names=['name'],
            allowed_values={},
            deprecated_values={
                'name1': ['name1']
            })

        with self.assertRaisesRegex(utils.ValidationError, (
            'The following required attributes are missing: '
            'key1')):

            change_domain.validate_cmd(
            feconf.CMD_DELETE_COMMIT,
            valid_cmd_dict, {})

    def test_that_error_appenden_when_value_deprecated(self) -> None:
        valid_cmd_dict = feconf.ValidCmdDict(
            name='AUTO',
            required_attribute_names=['name'],
            optional_attribute_names=['name'],
            user_id_attribute_names=['name'],
            allowed_values={},
            deprecated_values={
                'name': ['name']
            }
        )

        actual_cmd_attributes = {'name': 'name'}

        with self.assertRaisesRegex(utils.DeprecatedCommandError, (
            'Value for name in cmd AUTO_mark_deleted: name is deprecated')):
            change_domain.validate_cmd(
            feconf.CMD_DELETE_COMMIT,
            valid_cmd_dict, actual_cmd_attributes)

    def test_that_error_appenden_when_value_not_allowed(self) -> None:
        valid_cmd_dict = feconf.ValidCmdDict(
            name='AUTO',
            required_attribute_names=['key'],
            optional_attribute_names=['id', 'name'],
            user_id_attribute_names=['name'],
            deprecated_values={
                },
            allowed_values={
                   'name': ['name'],
                   'id': ['id']
                }
        )

        actual_cmd_attributes = {'id': 'id1', 'key': 'key1', 'name': 'name1'}

        with self.assertRaisesRegex(utils.ValidationError, (
            'Value for name in cmd AUTO_mark_deleted: name1 is not allowed')):

            change_domain.validate_cmd(
            feconf.CMD_DELETE_COMMIT,
            valid_cmd_dict, actual_cmd_attributes)

    def test_that_thing(self) -> None: #does not seem to work
        change_domain.BaseChange.ALLOWED_COMMANDS = [{
        'name': "CMD_CHANGE_PROPERTY_VALUE",
        'required_attribute_names': ['new_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
        }]
        change_object = change_domain.BaseChange({
            'cmd': feconf.CMD_DELETE_COMMIT
        })
        expected_change_object_dict = {
            'cmd': feconf.CMD_DELETE_COMMIT
        }
        base = change_domain.BaseChange(change_object.to_dict())
        self.assertEqual(change_object.to_dict(), expected_change_object_dict)

    def test_that_error_when_no_cmd(self) -> None: #does not seem to work
        with self.assertRaisesRegex(utils.ValidationError, (
            'Missing cmd key in change dict')):
            valid_cmd_dict = change_domain.BaseChange({
            'not cmd': feconf.CMD_DELETE_COMMIT
            })

    def test_that_deprecated_throws_error(self) -> None:
        with self.assertRaisesRegex(utils.DeprecatedCommandError, (
            'Command cmd_val is deprecated')):
            change_domain.BaseChange.DEPRECATED_COMMANDS = ['cmd_val']
            valid_cmd_dict = change_domain.BaseChange({
            'cmd': 'cmd_val'
            })

    def test_from_dict_returns_correct_basechange(self) -> None:
        expected_change_object_dict = change_domain.BaseChange({
            'cmd': feconf.CMD_DELETE_COMMIT
        })
        change_object = {
            'cmd': feconf.CMD_DELETE_COMMIT
        }
        self.assertEqual(change_domain.BaseChange.from_dict(change_object).to_dict(),
        expected_change_object_dict.to_dict())

    def test_validate_function_returns_correctly(self) -> None:
        change_object = change_domain.BaseChange({
            'cmd': feconf.CMD_DELETE_COMMIT
        })
        self.assertEqual(change_object.validate(), None)

    def test_getattr_gets_attribute(self) -> None:
        change_object = change_domain.BaseChange({
            'cmd': feconf.CMD_DELETE_COMMIT
        })
        self.assertEqual(change_object.__getattr__('cmd'),
        feconf.CMD_DELETE_COMMIT)

    def test_getattr_returns_attribute_error(self) -> None:
        with self.assertRaisesRegex(AttributeError, (
            'invalid_name')):
            change_object = change_domain.BaseChange({
                'cmd': feconf.CMD_DELETE_COMMIT
            })
            change_object.__getattr__('invalid_name')
