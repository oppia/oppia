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
import utils


def validate_dict_keys(actual_keys, required_keys, optional_keys=None):
    """Validates that actual keys in a dict contain all the required keys
    and some/all of the optional keys.
    """

    missing_keys = [key for key in required_keys if key not in actual_keys]

    if not optional_keys:
        optional_keys = []

    extra_keys = [key for key in actual_keys if key not in (
        required_keys + optional_keys)]

    error_msg = ''
    if len(missing_keys):
        error_msg = error_msg + 'Following required keys are missing: %s' % (
            (',').join(missing_keys))
        if len(extra_keys):
            error_msg = error_msg + ', '

    if len(extra_keys):
        error_msg = error_msg + 'Following extra keys are present: %s' % (
            (',').join(extra_keys))

    if len(missing_keys + extra_keys):
        raise utils.ValidationError(error_msg)


class ExplorationCommitCmd(object):
    """Domain object for commit commands of a exploration.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """

    def __init__(self, name, parameters):
        """Constructs a ExplorationCommitCmd domain object.

        Args:
            name: str. The command name.
            parameters: dict. The command parameters.
        """
        self.name = name
        self.parameters = parameters

    def validate(self):
        """Checks that all parameters of a command are valid for the
        given command name.

        Raises:
            Exception: The command is invalid.
        """
        if self.name == exp_domain.CMD_ADD_STATE or (
                self.name == exp_domain.CMD_DELETE_STATE):
            required_keys = ['state_name']
            validate_dict_keys(self.parameters.keys(), required_keys)

        elif self.name == exp_domain.CMD_RENAME_STATE:
            required_keys = ['old_state_name', 'new_state_name']
            validate_dict_keys(self.parameters.keys(), required_keys)

        elif self.name == exp_domain.CMD_EDIT_STATE_PROPERTY:
            required_keys = [
                'property_name', 'state_name', 'new_value']
            optional_keys = ['old_value']
            validate_dict_keys(
                self.parameters.keys(), required_keys,
                optional_keys=optional_keys)

        elif self.name == exp_domain.CMD_EDIT_EXPLORATION_PROPERTY:
            required_keys = ['property_name', 'new_value']
            optional_keys = ['old_value']
            validate_dict_keys(
                self.parameters.keys(), required_keys,
                optional_keys=optional_keys)

        elif self.name == (
                exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION):
            required_keys = ['from_version', 'to_version']
            validate_dict_keys(self.parameters.keys(), required_keys)


class ExplorationRightsCommitCmd(object):
    """Domain object for commit commands of a exploration rights.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """

    def __init__(self, name, parameters):
        """Constructs a ExplorationRightsCommitCmd domain object.

        Args:
            name: str. The command name.
            parameters: dict. The command parameters.
        """
        self.name = name
        self.parameters = parameters

    def validate(self):
        """Checks that all parameters of a command are valid for the
        given command name.

        Raises:
            Exception: The command is invalid.
        """
        return


class CollectionCommitCmd(object):
    """Domain object for commit commands of a collection.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """

    def __init__(self, name, parameters):
        """Constructs a CollectionCommitCmd domain object.

        Args:
            name: str. The command name.
            parameters: dict. The command parameters.
        """
        self.name = name
        self.parameters = parameters

    def validate(self):
        """Checks that all parameters of a command are valid for the
        given command name.

        Raises:
            Exception: The command is invalid.
        """
        if self.name == collection_domain.CMD_ADD_COLLECTION_NODE or (
                self.name == collection_domain.CMD_DELETE_COLLECTION_NODE):
            required_keys = ['exploration_id']
            validate_dict_keys(self.parameters.keys(), required_keys)

        elif self.name == collection_domain.CMD_SWAP_COLLECTION_NODES:
            required_keys = ['first_index', 'second_index']
            validate_dict_keys(self.parameters.keys(), required_keys)

        elif self.name == collection_domain.CMD_EDIT_COLLECTION_PROPERTY:
            required_keys = [
                'property_name', 'new_value']
            optional_keys = ['old_value']
            validate_dict_keys(
                self.parameters.keys(), required_keys,
                optional_keys=optional_keys)

        elif self.name == (
                collection_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION):
            required_keys = ['from_version', 'to_version']
            validate_dict_keys(self.parameters.keys(), required_keys)

        elif self.name == collection_domain.CMD_ADD_COLLECTION_SKILL:
            required_keys = ['name']
            validate_dict_keys(self.parameters.keys(), required_keys)

        elif self.name == collection_domain.CMD_DELETE_COLLECTION_SKILL:
            required_keys = ['skill_id']
            validate_dict_keys(self.parameters.keys(), required_keys)

        elif self.name == collection_domain.CMD_ADD_QUESTION_ID_TO_SKILL:
            required_keys = ['question_id', 'skill_id']
            validate_dict_keys(self.parameters.keys(), required_keys)

        elif self.name == collection_domain.CMD_REMOVE_QUESTION_ID_FROM_SKILL:
            required_keys = ['question_id', 'skill_id']
            validate_dict_keys(self.parameters.keys(), required_keys)


class CollectionRightsCommitCmd(object):
    """Domain object for commit commands of a collection rights.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """

    def __init__(self, name, parameters):
        """Constructs a CollectionRightsCommitCmd domain object.

        Args:
            name: str. The command name.
            parameters: dict. The command parameters.
        """
        self.name = name
        self.parameters = parameters

    def validate(self):
        """Checks that all parameters of a command are valid for the
        given command name.

        Raises:
            Exception: The command is invalid.
        """
        return


class ConfigPropertyCommitCmd(object):
    """Domain object for commit commands of a config property.

    Attributes:
        name: str. The command name.
        parameters: dict. The command parameters.
    """

    def __init__(self, name, parameters):
        """Constructs a ConfigPropertyCommitCmd domain object.

        Args:
            name: str. The command name.
            parameters: dict. The command parameters.
        """
        self.name = name
        self.parameters = parameters

    def validate(self):
        """Checks that all parameters of a command are valid for the
        given command name.

        Raises:
            Exception: The command is invalid.
        """
        if self.name == config_domain.CMD_CHANGE_PROPERTY_VALUE:
            required_keys = ['new_value']
            validate_dict_keys(self.parameters.keys(), required_keys)
