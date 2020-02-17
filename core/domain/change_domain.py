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

"""Domain object for changes made to domain objects of storage models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy

from core.platform import models
import python_utils
import utils

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


def validate_cmd(cmd_name, valid_cmd_attribute_specs, actual_cmd_attributes):
    """Validates that the attributes of a command contain all the required
    attributes and some/all of optional attributes. It also checks that
    the values of attributes belong to a set of allowed values if any.

    Args:
        cmd_name: str. The command for which validation process is being done.
        valid_cmd_attribute_specs: dict. A dict containing the required and
            optional attributes for a command along with allowed values
            for attributes if any.
        actual_cmd_attributes: dict. A dict containing the actual
            attributes of a command with values for the attributes.

    Raises:
        ValidationError. Any required attribute is missing or an extra attribute
            exists or the value of an attribute is not allowed.
    """

    required_attribute_names = valid_cmd_attribute_specs[
        'required_attribute_names']
    optional_attribute_names = valid_cmd_attribute_specs[
        'optional_attribute_names']
    actual_attribute_names = list(actual_cmd_attributes.keys())

    missing_attribute_names = [
        key for key in required_attribute_names if key not in (
            actual_attribute_names)]

    extra_attribute_names = [
        key for key in actual_attribute_names if key not in (
            required_attribute_names + optional_attribute_names)]

    error_msg_list = []
    if missing_attribute_names:
        error_msg_list.append(
            'The following required attributes are missing: %s' % (
                (', ').join(sorted(missing_attribute_names))))

    if extra_attribute_names:
        error_msg_list.append(
            'The following extra attributes are present: %s' % (
                (', ').join(sorted(extra_attribute_names))))

    if error_msg_list:
        raise utils.ValidationError((', ').join(error_msg_list))

    allowed_values = valid_cmd_attribute_specs.get('allowed_values')
    if not allowed_values:
        return

    for attribute_name, attribute_values in allowed_values.items():
        actual_value = actual_cmd_attributes[attribute_name]
        if actual_value not in attribute_values:
            raise utils.ValidationError(
                'Value for %s in cmd %s: %s is not allowed' % (
                    attribute_name, cmd_name, actual_value))


class BaseChange(python_utils.OBJECT):
    """Domain object for changes made to storage models' domain objects."""

    # The list of allowed commands of a change domain object. Each item in the
    # list is a dict with keys as: name (command name), required_attribute_names
    # (a list of required attribute names of a command),
    # optional_attribute_name (the list of optional attribute names of a
    # command). There can be a optional key allowed_values which is a
    # dict with key as attribute name and value as allowed values
    # for the attribute.
    # This list can be overriden by subclasses, if needed.
    ALLOWED_COMMANDS = []

    # This is a list of common commands which is valid for all subclasses.
    # This should not be overriden by subclasses.
    COMMON_ALLOWED_COMMANDS = [{
        'name': base_models.VersionedModel.CMD_DELETE_COMMIT,
        'required_attribute_names': [],
        'optional_attribute_names': []
    }]

    def __init__(self, change_dict):
        """Initializes a BaseChange object from a dict.

        Args:
            change_dict: dict. The dict containing cmd name and attributes.

        Raises:
            ValidationError: The given change_dict is not valid.
        """
        self.validate_dict(change_dict)

        cmd_name = change_dict['cmd']
        self.cmd = cmd_name

        all_allowed_commands = (
            self.ALLOWED_COMMANDS + self.COMMON_ALLOWED_COMMANDS)

        cmd_attribute_names = []
        for cmd in all_allowed_commands:
            if cmd['name'] == cmd_name:
                cmd_attribute_names = (
                    cmd['required_attribute_names'] + cmd[
                        'optional_attribute_names'])
                break

        for attribute_name in cmd_attribute_names:
            setattr(self, attribute_name, change_dict.get(attribute_name))

    def validate_dict(self, change_dict):
        """Checks that the command in change dict is valid for the domain
        object.

        Args:
            change_dict: dict. A dict of changes with keys as a cmd and the
            attributes of a command.

        Raises:
            ValidationError. The change dict does not contain the cmd key,
                or the cmd name is not allowed for the Change domain object
                or the command attributes are missing or extra.
        """
        if 'cmd' not in change_dict:
            raise utils.ValidationError('Missing cmd key in change dict')

        cmd_name = change_dict['cmd']

        valid_cmd_attribute_specs = None

        all_allowed_commands = (
            self.ALLOWED_COMMANDS + self.COMMON_ALLOWED_COMMANDS)
        for cmd in all_allowed_commands:
            if cmd['name'] == cmd_name:
                valid_cmd_attribute_specs = copy.deepcopy(cmd)
                break

        if not valid_cmd_attribute_specs:
            raise utils.ValidationError('Command %s is not allowed' % cmd_name)

        valid_cmd_attribute_specs.pop('name', None)

        actual_cmd_attributes = copy.deepcopy(change_dict)
        actual_cmd_attributes.pop('cmd', None)

        validate_cmd(
            cmd_name, valid_cmd_attribute_specs, actual_cmd_attributes)

    def to_dict(self):
        """Returns a dict representing the BaseChange domain object.

        Returns:
            A dict, mapping all fields of BaseChange instance.
        """
        base_change_dict = {}
        base_change_dict['cmd'] = self.cmd

        all_allowed_commands = (
            self.ALLOWED_COMMANDS + self.COMMON_ALLOWED_COMMANDS)
        valid_cmd_attribute_names = []
        for cmd in all_allowed_commands:
            if cmd['name'] == self.cmd:
                valid_cmd_attribute_names = (
                    cmd['required_attribute_names'] + cmd[
                        'optional_attribute_names'])
                break

        for attribute_name in valid_cmd_attribute_names:
            if hasattr(self, attribute_name):
                base_change_dict[attribute_name] = getattr(
                    self, attribute_name)

        return base_change_dict
