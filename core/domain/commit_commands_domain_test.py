# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for commit commands domain objects."""


import utils

from core.domain import commit_commands_domain
from core.domain import exp_domain
from core.tests import test_utils


def assert_validation_error(self, domain_object, expected_error_substring):
    with self.assertRaisesRegexp(
        utils.ValidationError, expected_error_substring):
        domain_object.validate()


class ExplorationCommitCmdUnitTests(test_utils.GenericTestBase):
    """Test the exploration commit cmd domain object."""

    def test_validation_with_valid_add_state_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_ADD_STATE, parameters={'state_name': 'new_state'})
        commit_cmd_domain_object.validate()

    def test_validation_with_missing_keys_in_add_state_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_ADD_STATE, parameters={})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following required keys are missing: state_name')

    def test_validation_with_extra_keys_in_add_state_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_ADD_STATE, parameters={
                'state_name': 'new_state', 'random': 'random'})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following extra keys are present: random')

    def test_validation_with_valid_delete_state_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_DELETE_STATE, parameters={'state_name': 'state'})
        commit_cmd_domain_object.validate()

    def test_validation_with_missing_keys_in_delete_state_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_DELETE_STATE, parameters={})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following required keys are missing: state_name')

    def test_validation_with_extra_keys_in_delete_state_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_DELETE_STATE, parameters={
                'state_name': 'state', 'random': 'random'})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following extra keys are present: random')

    def test_validation_with_valid_rename_state_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_RENAME_STATE, parameters={
                'old_state_name': 'old_state', 'new_state_name': 'new_state'})
        commit_cmd_domain_object.validate()

    def test_validation_with_missing_keys_in_rename_state_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_RENAME_STATE, parameters={
            'old_state_name': 'old_state'})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following required keys are missing: new_state_name')

    def test_validation_with_extra_keys_in_rename_state_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_RENAME_STATE, parameters={
                'old_state_name': 'old_state','new_state_name': 'new_state',
                'random': 'random'})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following extra keys are present: random')

    def test_validation_with_valid_edit_state_property_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_EDIT_STATE_PROPERTY, parameters={
                'property_name': 'property',
                'state_name': 'state_name', 'new_value': 'new_value'})
        commit_cmd_domain_object.validate()

    def test_validation_with_missing_keys_in_edit_state_property_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_EDIT_STATE_PROPERTY, parameters={
            'property_name': 'property', 'old_value': 'old_value',
            'state_name': 'state_name'})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following required keys are missing: new_value')

    def test_validation_with_extra_keys_in_edit_state_property_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_EDIT_STATE_PROPERTY, parameters={
                'property_name': 'property', 'state_name': 'state_name',
                'new_value': 'new_value', 'old_value': 'old_value',
                'random': 'random'})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following extra keys are present: random')

    def test_validation_with_valid_edit_exploration_property_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_EDIT_EXPLORATION_PROPERTY, parameters={
                'property_name': 'property', 'new_value': 'new_value'})
        commit_cmd_domain_object.validate()

    def test_validation_with_missing_keys_in_edit_exploration_property_command(
            self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_EDIT_EXPLORATION_PROPERTY, parameters={
            'property_name': 'property', 'old_value': 'old_value',})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following required keys are missing: new_value')

    def test_validation_with_extra_keys_in_edit_exploration_property_command(
            self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_EDIT_EXPLORATION_PROPERTY, parameters={
                'property_name': 'property', 'new_value': 'new_value',
                'old_value': 'old_value', 'random': 'random'})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following extra keys are present: random')

    def test_validation_with_valid_migrate_schema_version_command(self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
            parameters={'from_version': 0, 'to_version': 20})
        commit_cmd_domain_object.validate()

    def test_validation_with_missing_keys_in_migrate_schema_version_command(
            self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
            parameters={'from_version': 1})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following required keys are missing: to_version')

    def test_validation_with_extra_keys_in_migrate_schema_version_command(
            self):
        commit_cmd_domain_object = commit_commands_domain.ExplorationCommitCmd(
            name=exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
            parameters={
                'from_version': 0, 'to_version': 20, 'random': 'random'})
        assert_validation_error(
            self, commit_cmd_domain_object,
            'Following extra keys are present: random')
