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

from core.domain import collection_domain
from core.domain import commit_commands_domain
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import story_domain
from core.tests import test_utils
import utils


def assert_validation_error(self, domain_object, expected_error_substring):
    """Checks that validation of commit command domain object raises
    the given error.

    Args:
        domain_object: CommitCmdDomainObject. The domain object to validate.
        expected_error_substring: str. The error message.

    Raises:
        Exception: If the error message is not produced on validation.
    """
    with self.assertRaisesRegexp(
        utils.ValidationError, expected_error_substring):
        domain_object.validate()


def validate_with_valid_command(commit_cmd_class, name, parameters):
    """Validates a valid commit command.

    Args:
        commit_cmd_class: CommitCmdDomainClass. The domain class of the command
            to validate.
        name: str. The command name.
        parameters: dict. Dict containing command parameters.
    """
    commit_cmd_domain_object = commit_cmd_class(
        name=name, parameters=parameters)
    commit_cmd_domain_object.validate()


def validate_with_missing_keys_in_command(
        self, commit_cmd_class, name, parameters):
    """Validates a commit command with missing keys in parameters.

    Args:
        commit_cmd_class: CommitCmdDomainClass. The domain class of the command
            to validate.
        name: str. The command name.
        parameters: dict. Dict containing command parameters.
    """

    if not len(parameters.keys()):
        return
    parameter_key = sorted(parameters.keys())[0]
    parameters.pop(parameter_key, None)
    commit_cmd_domain_object = commit_cmd_class(
        name=name, parameters=parameters)
    assert_validation_error(
        self, commit_cmd_domain_object,
        'Following required keys are missing: %s' % parameter_key)


def validate_with_extra_keys_in_command(
        self, commit_cmd_class, name, parameters):
    """Validates a commit command with extra keys in parameters.

    Args:
        commit_cmd_class: CommitCmdDomainClass. The domain class of the command
            to validate.
        name: str. The command name.
        parameters: dict. Dict containing command parameters.
    """
    parameters['random'] = 'random'
    commit_cmd_domain_object = commit_cmd_class(
        name=name, parameters=parameters)
    assert_validation_error(
        self, commit_cmd_domain_object,
        'Following extra keys are present: random')


class ExplorationCommitCmdUnitTests(test_utils.GenericTestBase):
    """Test the exploration commit cmd domain object."""

    def test_commands(self):
        command_list = [{
            'name': exp_domain.CMD_ADD_STATE,
            'parameters': {'state_name': 'state'}
        }, {
            'name': exp_domain.CMD_DELETE_STATE,
            'parameters': {'state_name': 'state'}
        }, {
            'name': exp_domain.CMD_RENAME_STATE,
            'parameters': {
                'old_state_name': 'old_state', 'new_state_name': 'new_state'
            }
        }, {
            'name': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'parameters': {
                'property_name': 'property', 'state_name': 'state',
                'new_value': 'value'
            }
        }, {
            'name': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'parameters': {
                'property_name': 'property', 'new_value': 'new_value',
                'old_value': 'old_value'
            }
        }, {
            'name': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
            'parameters': {'from_version': 1, 'to_version': 3}
        }]

        commit_cmd_class = commit_commands_domain.ExplorationCommitCmd
        for cmd in command_list:
            validate_with_valid_command(
                commit_cmd_class, cmd['name'], cmd['parameters'])
            validate_with_missing_keys_in_command(
                self, commit_cmd_class, cmd['name'], cmd['parameters'])
            validate_with_extra_keys_in_command(
                self, commit_cmd_class, cmd['name'], cmd['parameters'])


class CollectionCommitCmdUnitTests(test_utils.GenericTestBase):
    """Test the collection commit cmd domain object."""

    def test_commands(self):
        command_list = [{
            'name': collection_domain.CMD_ADD_COLLECTION_NODE,
            'parameters': {'exploration_id': '0'}
        }, {
            'name': collection_domain.CMD_DELETE_COLLECTION_NODE,
            'parameters': {'exploration_id': '0'}
        }, {
            'name': collection_domain.CMD_SWAP_COLLECTION_NODES,
            'parameters': {
                'first_index': 0, 'second_index': 1
            }
        }, {
            'name': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
            'parameters': {
                'property_name': 'property', 'new_value': 'new_value',
                'old_value': 'old_value'
            }
        }, {
            'name': collection_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION,
            'parameters': {'from_version': 1, 'to_version': 3}
        }, {
            'name': collection_domain.CMD_ADD_COLLECTION_SKILL,
            'parameters': {'name': 'name'}
        }, {
            'name': collection_domain.CMD_DELETE_COLLECTION_SKILL,
            'parameters': {'skill_id': '0'}
        }, {
            'name': collection_domain.CMD_ADD_QUESTION_ID_TO_SKILL,
            'parameters': {'question_id': '0', 'skill_id': '0'}
        }, {
            'name': collection_domain.CMD_REMOVE_QUESTION_ID_FROM_SKILL,
            'parameters': {'question_id': '0', 'skill_id': '0'}
        }]

        commit_cmd_class = commit_commands_domain.CollectionCommitCmd
        for cmd in command_list:
            validate_with_valid_command(
                commit_cmd_class, cmd['name'], cmd['parameters'])
            validate_with_missing_keys_in_command(
                self, commit_cmd_class, cmd['name'], cmd['parameters'])
            validate_with_extra_keys_in_command(
                self, commit_cmd_class, cmd['name'], cmd['parameters'])


class ConfigPropertyCommitCmdUnitTests(test_utils.GenericTestBase):
    """Test the config property commit cmd domain object."""

    def test_commands(self):
        command_list = [{
            'name': config_domain.CMD_CHANGE_PROPERTY_VALUE,
            'parameters': {'new_value': 'new value'}
        }]

        commit_cmd_class = commit_commands_domain.ConfigPropertyCommitCmd
        for cmd in command_list:
            validate_with_valid_command(
                commit_cmd_class, cmd['name'], cmd['parameters'])
            validate_with_missing_keys_in_command(
                self, commit_cmd_class, cmd['name'], cmd['parameters'])
            validate_with_extra_keys_in_command(
                self, commit_cmd_class, cmd['name'], cmd['parameters'])


class StoryCommitCmdUnitTests(test_utils.GenericTestBase):
    """Test the story commit cmd domain object."""

    def test_commands(self):
        command_list = [{
            'name': story_domain.CMD_UPDATE_STORY_PROPERTY,
            'parameters': {
                'property_name': 'name', 'new_value': 'new value',
                'old_value': 'old value'}
        }, {
            'name': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'parameters': {
                'node_id': 'node id', 'property_name': 'name',
                'new_value': 'new value', 'old_value': 'old value'}
        }, {
            'name': story_domain.CMD_UPDATE_STORY_CONTENTS_PROPERTY,
            'parameters': {
                'property_name': 'name', 'new_value': 'new value',
                'old_value': 'old value'}
        }, {
            'name': story_domain.CMD_ADD_STORY_NODE,
            'parameters': {'node_id': 'node id'}
        }, {
            'name': story_domain.CMD_DELETE_STORY_NODE,
            'parameters': {'node_id': 'node id'}
        }, {
            'name': story_domain.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS,
            'parameters': {'node_id': 'node id'}
        }, {
            'name': story_domain.CMD_CREATE_NEW,
            'parameters': {'title': 'title'}
        }, {
            'name': story_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION,
            'parameters': {'from_version': 0, 'to_version': 1}
        }]

        commit_cmd_class = commit_commands_domain.StoryCommitCmd
        for cmd in command_list:
            validate_with_valid_command(
                commit_cmd_class, cmd['name'], cmd['parameters'])
            validate_with_missing_keys_in_command(
                self, commit_cmd_class, cmd['name'], cmd['parameters'])
            validate_with_extra_keys_in_command(
                self, commit_cmd_class, cmd['name'], cmd['parameters'])


class StoryRightsCommitCmdUnitTests(test_utils.GenericTestBase):
    """Test the story rights commit cmd domain object."""

    def test_commands(self):
        command_list = [{
            'name': story_domain.CMD_CREATE_NEW,
            'parameters': {}
        }, {
            'name': story_domain.CMD_CHANGE_ROLE,
            'parameters': {
                'assignee_id': 'id', 'new_role': 'manager', 'old_role': 'none'}
        }, {
            'name': story_domain.CMD_PUBLISH_STORY,
            'parameters': {}
        }, {
            'name': story_domain.CMD_UNPUBLISH_STORY,
            'parameters': {}
        }]

        commit_cmd_class = commit_commands_domain.StoryRightsCommitCmd
        for cmd in command_list:
            validate_with_valid_command(
                commit_cmd_class, cmd['name'], cmd['parameters'])
            validate_with_missing_keys_in_command(
                self, commit_cmd_class, cmd['name'], cmd['parameters'])
            validate_with_extra_keys_in_command(
                self, commit_cmd_class, cmd['name'], cmd['parameters'])
