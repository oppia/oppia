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

from core import feconf, utils
from core.domain import change_domain
from core.tests import test_utils

from typing import Any, Mapping, cast


# TODO(#14219): Update these tests to fully cover file change_domain.py.
class ChangeDomainTests(test_utils.GenericTestBase):

    def test_that_domain_object_is_created_correctly(self) -> None:
        change_object = change_domain.BaseChange(
            {'cmd': feconf.CMD_DELETE_COMMIT}
        )
        expected_change_object_dict = {'cmd': feconf.CMD_DELETE_COMMIT}
        self.assertEqual(change_object.to_dict(), expected_change_object_dict)

    def test_validate_cmd_with_missing_required_attribute_raises(self) -> None:
        # Here we use cast because we need to tell the type checker that this
        # dictionary confirms to the ValidCmdDict TypedDict. Without cast,
        # mypy cannot infer that this dict satisfies all required keys and types
        # of ValidCmdDict in this test context.
        cmd_spec = cast(
            feconf.ValidCmdDict,
            {
                'required_attribute_names': ['x'],
                'optional_attribute_names': [],
                'allowed_values': {},
                'deprecated_values': {},
                'user_id_attribute_names': [],
            },
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The following required attributes are missing: x',
        ):
            change_domain.validate_cmd('add', cmd_spec, {'cmd': 'add'})

    def test_validate_cmd_with_extra_attribute_raises(self) -> None:
        # Here we use cast because we need to tell the type checker that this
        # dictionary confirms to the ValidCmdDict TypedDict. Without cast,
        # mypy cannot infer that this dict satisfies all required keys and types
        # of ValidCmdDict in this test context.
        cmd_spec = cast(
            feconf.ValidCmdDict,
            {
                'required_attribute_names': [],
                'optional_attribute_names': [],
                'allowed_values': {},
                'deprecated_values': {},
                'user_id_attribute_names': [],
            },
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The following extra attributes are present: y',
        ):
            change_domain.validate_cmd('add', cmd_spec, {'cmd': 'add', 'y': 1})

    def test_validate_cmd_with_both_missing_and_extra_attributes_raises(
        self,
    ) -> None:
        # Here we use cast because we need to tell the type checker that this
        # dictionary confirms to the ValidCmdDict TypedDict. Without cast,
        # mypy cannot infer that this dict satisfies all required keys and types
        # of ValidCmdDict in this test context.
        cmd_spec = cast(
            feconf.ValidCmdDict,
            {
                'required_attribute_names': ['x'],
                'optional_attribute_names': [],
                'allowed_values': {},
                'deprecated_values': {},
                'user_id_attribute_names': [],
            },
        )

        with self.assertRaisesRegex(utils.ValidationError, 'missing: x'):
            change_domain.validate_cmd('add', cmd_spec, {'cmd': 'add', 'y': 1})

    def test_validate_cmd_with_deprecated_value_behavior(self) -> None:
        # Here we use cast because we need to tell the type checker that this
        # dictionary confirms to the ValidCmdDict TypedDict. Without cast,
        # mypy cannot infer that this dict satisfies all required keys and types
        # of ValidCmdDict in this test context.
        cmd_spec = cast(
            feconf.ValidCmdDict,
            {
                'required_attribute_names': ['a'],
                'optional_attribute_names': [],
                'allowed_values': {},
                'deprecated_values': {'a': ['old']},
                'user_id_attribute_names': [],
            },
        )
        actual_deprecated = {'cmd': 'add', 'a': 'old'}
        with self.assertRaisesRegex(
            utils.DeprecatedCommandError,
            'Value for a in cmd add: old is deprecated',
        ):
            change_domain.validate_cmd('add', cmd_spec, actual_deprecated)

    def test_validate_cmd_passes_when_no_allowed_values(self) -> None:
        # Here we use cast because we need to tell the type checker that this
        # dictionary confirms to the ValidCmdDict TypedDict. Without cast,
        # mypy cannot infer that this dict satisfies all required keys and types
        # of ValidCmdDict in this test context.
        cmd_spec = cast(
            feconf.ValidCmdDict,
            {
                'required_attribute_names': [],
                'optional_attribute_names': [],
                'allowed_values': {},
                'deprecated_values': {},
                'user_id_attribute_names': [],
            },
        )
        # Should not raise anything.
        change_domain.validate_cmd('add', cmd_spec, {'cmd': 'add'})

    def test_validate_cmd_with_invalid_allowed_value_raises(self) -> None:
        # Here we use cast because we need to tell the type checker that this
        # dictionary confirms to the ValidCmdDict TypedDict. Without cast,
        # mypy cannot infer that this dict satisfies all required keys and types
        # of ValidCmdDict in this test context.
        cmd_spec = cast(
            feconf.ValidCmdDict,
            {
                'required_attribute_names': ['x'],
                'optional_attribute_names': [],
                'allowed_values': {'x': ['ok']},
                'deprecated_values': {},
                'user_id_attribute_names': [],
            },
        )
        with self.assertRaisesRegex(
            utils.ValidationError, 'Value for x in cmd add: bad is not allowed'
        ):
            change_domain.validate_cmd(
                'add', cmd_spec, {'cmd': 'add', 'x': 'bad'}
            )

        change_domain.validate_cmd('add', cmd_spec, {'cmd': 'add', 'x': 'ok'})

    def test_init_with_invalid_command_raises(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Command fake is not allowed'
        ):
            change_domain.BaseChange({'cmd': 'fake'})

    def test_init_with_missing_cmd_key_raises(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Missing cmd key in change dict'
        ):
            change_domain.BaseChange({})

    def test_init_with_deprecated_command_raises(self) -> None:
        class DeprecatedChange(change_domain.BaseChange):
            """Test subclass of BaseChange with a deprecated command to ensure
            DeprecatedCommandError is raised when using old_cmd.
            """

            DEPRECATED_COMMANDS = ['old_cmd']

        with self.assertRaisesRegex(
            utils.DeprecatedCommandError, 'Command old_cmd is deprecated'
        ):
            DeprecatedChange({'cmd': 'old_cmd'})

    def test_to_dict_and_from_dict_work_correctly(self) -> None:
        change = change_domain.BaseChange({'cmd': feconf.CMD_DELETE_COMMIT})
        new_change = change_domain.BaseChange.from_dict(change.to_dict())
        self.assertEqual(new_change.cmd, feconf.CMD_DELETE_COMMIT)

    def test_to_dict_with_empty_allowed_commands_returns_only_cmd(self) -> None:
        class EmptyAllowedChange(change_domain.BaseChange):
            """Test subclass with empty allowed commands to test to_dict() behavior."""

            ALLOWED_COMMANDS = []
            COMMON_ALLOWED_COMMANDS = []

            # Here we use type Any because the dict can contain a variety of nested types,
            # including ints, strings, lists, or other dicts. The exact structure depends
            # on the command being tested, so using a more specific type is not feasible
            # in this test subclass.
            def validate_dict(self, change_dict: Mapping[str, Any]) -> None:
                pass

        # Now instantiation works because validate_dict does nothing.
        change_empty = EmptyAllowedChange({'cmd': 'any_cmd'})

        # to_dict() should return only the cmd key.
        result_dict = change_empty.to_dict()
        self.assertEqual(result_dict, {'cmd': 'any_cmd'})

        # from_dict() should still reconstruct the same object.
        reconstructed = EmptyAllowedChange.from_dict(result_dict)
        self.assertEqual(reconstructed.cmd, 'any_cmd')
        self.assertEqual(reconstructed.to_dict(), {'cmd': 'any_cmd'})

    def test_to_dict_when_cmd_not_in_allowed_commands(self) -> None:
        class NoMatchingCmdChange(change_domain.BaseChange):
            """Test subclass with commands that do not match the instantiated cmd,
            to test to_dict() when no matching command is found.
            """

            ALLOWED_COMMANDS = [
                {
                    'name': 'different_cmd',
                    'required_attribute_names': ['x'],
                    'optional_attribute_names': [],
                    'user_id_attribute_names': [],
                    'allowed_values': {},
                    'deprecated_values': {},
                }
            ]

            COMMON_ALLOWED_COMMANDS = []

            # Here we use type Any because the dict can contain a variety of nested types,
            # including ints, strings, lists, or other dicts. The exact structure depends
            # on the command being tested, so using a more specific type is not feasible
            # in this test subclass.
            def validate_dict(self, change_dict: Mapping[str, Any]) -> None:
                pass

        # Instantiate with a cmd not matching 'different_cmd'.
        change = NoMatchingCmdChange({'cmd': 'unknown_cmd'})

        # to_dict() should return only the cmd key since no matching spec exists.
        result_dict = change.to_dict()
        self.assertEqual(result_dict, {'cmd': 'unknown_cmd'})

        # from_dict() should still reconstruct the same object.
        reconstructed = NoMatchingCmdChange.from_dict(result_dict)
        self.assertEqual(reconstructed.cmd, 'unknown_cmd')
        self.assertEqual(reconstructed.to_dict(), {'cmd': 'unknown_cmd'})

    def test_to_dict_skips_missing_attributes(self) -> None:
        class PartialChange(change_domain.BaseChange):
            """Test subclass of BaseChange to simulate missing and present attributes
            for to_dict() testing.
            """

            ALLOWED_COMMANDS = [
                {
                    'name': 'partial_cmd',
                    'required_attribute_names': [
                        'missing_attr',
                        'present_attr',
                    ],
                    'optional_attribute_names': [],
                    'user_id_attribute_names': [],
                    'allowed_values': {},
                    'deprecated_values': {},
                }
            ]
            COMMON_ALLOWED_COMMANDS = []

            # Here we use type Any because the dict can contain a variety of nested types,
            # including ints, strings, lists, or other dicts. The exact structure depends
            # on the command being tested, so using a more specific type is not feasible
            # in this test subclass.
            def validate_dict(self, change_dict: Mapping[str, Any]) -> None:
                pass

        # Only provide 'present_attr'.
        change = PartialChange({'cmd': 'partial_cmd', 'present_attr': 42})

        # Delete 'missing_attr' to simulate a truly missing attribute.
        if hasattr(change, 'missing_attr'):
            delattr(change, 'missing_attr')

        result_dict = change.to_dict()

        # Only 'present_attr' should be included.
        expected_dict = {'cmd': 'partial_cmd', 'present_attr': 42}
        self.assertEqual(result_dict, expected_dict)

    def test_validate_method_calls_validate_dict(self) -> None:
        change = change_domain.BaseChange({'cmd': feconf.CMD_DELETE_COMMIT})
        change.validate()

    def test_getattr_returns_existing_and_raises_for_missing(self) -> None:
        change = change_domain.BaseChange({'cmd': feconf.CMD_DELETE_COMMIT})
        # Existing attribute should return correctly.
        self.assertEqual(change.cmd, feconf.CMD_DELETE_COMMIT)

        # Missing attribute should raise AttributeError.
        with self.assertRaisesRegex(AttributeError, 'non_existent_attr'):
            _ = change.non_existent_attr  # pylint: disable=pointless-statement

    def test_custom_allowed_command_attributes_are_set(self) -> None:
        class CustomChange(change_domain.BaseChange):
            """Test subclass to verify that custom allowed command attributes
            are correctly set on initialization.
            """

            ALLOWED_COMMANDS = [
                {
                    'name': 'update_title',
                    'required_attribute_names': ['title'],
                    'optional_attribute_names': ['subtitle'],
                    'user_id_attribute_names': [],
                    'allowed_values': {},
                    'deprecated_values': {},
                }
            ]

        change_dict = {'cmd': 'update_title', 'title': 'A', 'subtitle': 'B'}
        change = CustomChange(change_dict)
        self.assertEqual(change.title, 'A')
        self.assertEqual(change.subtitle, 'B')

    def test_validate_dict_with_invalid_allowed_value_raises(self) -> None:
        class LimitedChange(change_domain.BaseChange):
            """Test subclass to check that to_dict() and validate_cmd
            enforce allowed_values constraints.
            """

            ALLOWED_COMMANDS = [
                {
                    'name': 'set_value',
                    'required_attribute_names': ['value'],
                    'optional_attribute_names': [],
                    'user_id_attribute_names': [],
                    'allowed_values': {'value': ['yes']},
                    'deprecated_values': {},
                }
            ]

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Value for value in cmd set_value: no is not allowed',
        ):
            LimitedChange({'cmd': 'set_value', 'value': 'no'})

    def test_to_dict_returns_expected_fields(self) -> None:
        class AnotherChange(change_domain.BaseChange):
            """Test subclass to verify that required attributes are included
            correctly in to_dict() output.
            """

            ALLOWED_COMMANDS = [
                {
                    'name': 'rename',
                    'required_attribute_names': ['old', 'new'],
                    'optional_attribute_names': [],
                    'user_id_attribute_names': [],
                    'allowed_values': {},
                    'deprecated_values': {},
                }
            ]

        change_dict = {'cmd': 'rename', 'old': 'x', 'new': 'y'}
        change = AnotherChange(change_dict)
        expected = {'cmd': 'rename', 'old': 'x', 'new': 'y'}
        self.assertEqual(change.to_dict(), expected)

    def test_validate_with_invalid_value_raises(self) -> None:
        """Test that BaseChange.validate() raises ValidationError when
        an attribute has a value that is not allowed according to ALLOWED_COMMANDS.
        """

        class ValidatedChange(change_domain.BaseChange):
            """Test subclass to validate allowed values and ensure
            ValidationError is raised when attribute values are invalid.
            """

            ALLOWED_COMMANDS = [
                {
                    'name': 'flag',
                    'required_attribute_names': ['status'],
                    'optional_attribute_names': [],
                    'user_id_attribute_names': [],
                    'allowed_values': {'status': ['ok']},
                    'deprecated_values': {},
                }
            ]

            # Here we use type Any because the dict can contain a variety of nested types,
            # including ints, strings, lists, or other dicts. The exact structure depends
            # on the command being tested, so using a more specific type is not feasible
            # in this test subclass.
            def __init__(self, change_dict: Mapping[str, Any]) -> None:
                super().__init__(change_dict)
                if not hasattr(self, 'status'):
                    # Here we use type Any because `status` can be assigned different types (valid or invalid values)
                    # during the test to verify validation behavior, and a more specific type would restrict the test scenario.
                    self.status: Any = None

        change: ValidatedChange = ValidatedChange(
            {'cmd': 'flag', 'status': 'ok'}
        )
        change.status = 'bad'

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Value for status in cmd flag: bad is not allowed',
        ):
            change.validate()
