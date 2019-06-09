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

"""Domain object for commit commands."""

from core.domain import collection_domain
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import story_domain
import utils


def validate_dict_keys(actual_keys, required_keys, optional_keys):
    """Validates that actual keys in a dict contain all the required keys
    and some/all of the optional keys.

    Args:
        actual_keys: list(str). The list of keys in parameters of a command.
        required_keys: list(str). The list of keys which are required for
            a command.
        optional_keys: list(str). The list of keys which are optional for
            a command.

    Raises:
        Exception. If the actual keys of parameters don't have all the
            required keys or there are additional keys apart from the
            required and optional keys.
    """

    missing_keys = [key for key in required_keys if key not in actual_keys]

    extra_keys = [key for key in actual_keys if key not in (
        required_keys + optional_keys)]

    error_msg = ''
    if missing_keys:
        error_msg = error_msg + (
            'The following required keys are missing: %s' % (
                (',').join(missing_keys)))
        if extra_keys:
            error_msg = error_msg + ', '

    if extra_keys:
        error_msg = error_msg + 'The following extra keys are present: %s' % (
            (',').join(extra_keys))

    if missing_keys + extra_keys:
        raise utils.ValidationError(error_msg)


class BaseCommitCmd(object):
    """Domain object for commit commands of a storage model.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """

    def __init__(self, name, parameters):
        """Constructs a CommitCmd domain object.

        Args:
            name: str. The command name.
            parameters: dict. The command parameters.
        """
        self.name = name
        self.parameters = parameters
        self.command_list = []

    def validate(self):
        """Checks that all parameters of a command are valid for the given
        command.
        """

        required_keys = []
        optional_keys = []
        for cmd in self.command_list:
            if cmd['name'] == self.name:
                required_keys = cmd['required_keys']
                optional_keys = cmd['optional_keys']
                break
        validate_dict_keys(self.parameters.keys(), required_keys, optional_keys)


class ExplorationCommitCmd(BaseCommitCmd):
    """Domain object for commit commands of a exploration.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """

    def __init__(self, name, parameters):
        super(ExplorationCommitCmd, self).__init__(name, parameters)
        self.command_list = [{
            'name': exp_domain.CMD_CREATE_NEW,
            'required_keys': ['category', 'title'],
            'optional_keys': []
        }, {
            'name': exp_domain.CMD_ADD_STATE,
            'required_keys': ['state_name'],
            'optional_keys': []
        }, {
            'name': exp_domain.CMD_DELETE_STATE,
            'required_keys': ['state_name'],
            'optional_keys': []
        }, {
            'name': exp_domain.CMD_RENAME_STATE,
            'required_keys': ['new_state_name', 'old_state_name'],
            'optional_keys': []
        }, {
            'name': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'required_keys': ['property_name', 'state_name', 'new_value'],
            'optional_keys': ['old_value']
        }, {
            'name': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'required_keys': ['property_name', 'new_value'],
            'optional_keys': ['old_value']
        }, {
            'name': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
            'required_keys': ['from_version', 'to_version'],
            'optional_keys': []
        }]


class ExplorationRightsCommitCmd(BaseCommitCmd):
    """Domain object for commit commands of a exploration rights.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """


class CollectionCommitCmd(BaseCommitCmd):
    """Domain object for commit commands of a collection.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """

    def __init__(self, name, parameters):
        super(CollectionCommitCmd, self).__init__(name, parameters)
        self.command_list = [{
            'name': collection_domain.CMD_CREATE_NEW,
            'required_keys': ['category', 'title'],
            'optional_keys': []
        }, {
            'name': collection_domain.CMD_ADD_COLLECTION_NODE,
            'required_keys': ['exploration_id'],
            'optional_keys': []
        }, {
            'name': collection_domain.CMD_DELETE_COLLECTION_NODE,
            'required_keys': ['exploration_id'],
            'optional_keys': []
        }, {
            'name': collection_domain.CMD_SWAP_COLLECTION_NODES,
            'required_keys': ['first_index', 'second_index'],
            'optional_keys': []
        }, {
            'name': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
            'required_keys': ['property_name', 'new_value'],
            'optional_keys': ['old_value']
        }, {
            'name': collection_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION,
            'required_keys': ['from_version', 'to_version'],
            'optional_keys': []
        }, {
            'name': collection_domain.CMD_ADD_COLLECTION_SKILL,
            'required_keys': ['name'],
            'optional_keys': []
        }, {
            'name': collection_domain.CMD_DELETE_COLLECTION_SKILL,
            'required_keys': ['skill_id'],
            'optional_keys': []
        }, {
            'name': collection_domain.CMD_ADD_QUESTION_ID_TO_SKILL,
            'required_keys': ['question_id', 'skill_id'],
            'optional_keys': []
        }, {
            'name': collection_domain.CMD_REMOVE_QUESTION_ID_FROM_SKILL,
            'required_keys': ['question_id', 'skill_id'],
            'optional_keys': []
        }]


class CollectionRightsCommitCmd(BaseCommitCmd):
    """Domain object for commit commands of a collection rights.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """


class ConfigPropertyCommitCmd(BaseCommitCmd):
    """Domain object for commit commands of a config property.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """

    def __init__(self, name, parameters):
        super(ConfigPropertyCommitCmd, self).__init__(name, parameters)
        self.command_list = [{
            'name': config_domain.CMD_CHANGE_PROPERTY_VALUE,
            'required_keys': ['new_value'],
            'optional_keys': []
        }]


class StoryCommitCmd(BaseCommitCmd):
    """Domain object for commit commands of a story.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """

    def __init__(self, name, parameters):
        super(StoryCommitCmd, self).__init__(name, parameters)
        self.command_list = [{
            'name': story_domain.CMD_UPDATE_STORY_PROPERTY,
            'required_keys': ['property_name', 'new_value', 'old_value'],
            'optional_keys': []
        }, {
            'name': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'required_keys': [
                'node_id', 'property_name', 'new_value', 'old_value'],
            'optional_keys': []
        }, {
            'name': story_domain.CMD_UPDATE_STORY_CONTENTS_PROPERTY,
            'required_keys': ['property_name', 'new_value', 'old_value'],
            'optional_keys': []
        }, {
            'name': story_domain.CMD_ADD_STORY_NODE,
            'required_keys': ['node_id'],
            'optional_keys': []
        }, {
            'name': story_domain.CMD_DELETE_STORY_NODE,
            'required_keys': ['node_id'],
            'optional_keys': []
        }, {
            'name': story_domain.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS,
            'required_keys': ['node_id'],
            'optional_keys': []
        }, {
            'name': story_domain.CMD_CREATE_NEW,
            'required_keys': ['title'],
            'optional_keys': []
        }, {
            'name': story_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION,
            'required_keys': ['from_version', 'to_version'],
            'optional_keys': []
        }]


class StoryRightsCommitCmd(BaseCommitCmd):
    """Domain object for commit commands of a story rights.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """

    def __init__(self, name, parameters):
        super(StoryRightsCommitCmd, self).__init__(name, parameters)
        self.command_list = [{
            'name': story_domain.CMD_CREATE_NEW,
            'required_keys': [],
            'optional_keys': []
        }, {
            'name': story_domain.CMD_CHANGE_ROLE,
            'required_keys': ['assignee_id', 'new_role', 'old_role'],
            'optional_keys': []
        }, {
            'name': story_domain.CMD_PUBLISH_STORY,
            'required_keys': [],
            'optional_keys': []
        }, {
            'name': story_domain.CMD_UNPUBLISH_STORY,
            'required_keys': [],
            'optional_keys': []
        }]


class FileMetadataCommitCmd(BaseCommitCmd):
    """Domain object for commit commands of a file metadata.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """


class FileCommitCmd(BaseCommitCmd):
    """Domain object for commit commands of a file.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """
