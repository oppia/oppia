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

from __future__ import annotations

import copy

from core import feconf
from core import utils

from typing import Any, Dict, List, Mapping, Union, cast

MYPY = False
if MYPY: # pragma: no cover
    # Modules imported under the `if MYPY` clause is imported only for
    # type checking purposes and they are not expected to be executed
    # at runtime.
    from core.domain import param_domain
    from core.domain import platform_parameter_domain
    from core.domain import question_domain
    from core.domain import skill_domain
    from core.domain import state_domain
    from core.domain import translation_domain

    # After importing modules under the `if MYPY` clause they are not
    # executed at runtime. So, to avoid `attribute is not defined` error
    # at runtime while importing the types from these modules, we defined
    # `AcceptableChangeDictTypes` under the same `if` clause. So that
    # `AcceptableChangeDictTypes` is not executed at runtime and do not
    # give any error.
    # Here, `AcceptableChangeDictTypes` is a union type defined from allowed
    # types that a Dict can contain for its values.
    AcceptableChangeDictTypes = Union[
        str,
        bool,
        float,
        int,
        None,
        List[str],
        List[int],
        # Here we use type Any because we want to allow differently nested dicts
        # being accepted by BaseChange.
        Dict[str, Any],
        # Here we use type Any because we want to allow list of differently
        # nested dicts being accepted by BaseChange.
        List[Dict[str, Any]],
        List[param_domain.ParamChangeDict],
        List[state_domain.AnswerGroupDict],
        List[state_domain.HintDict],
        List[skill_domain.WorkedExampleDict],
        translation_domain.WrittenTranslationsDict,
        List[platform_parameter_domain.PlatformParameterRuleDict],
        question_domain.QuestionDict,
        state_domain.AnswerGroupDict,
        state_domain.SubtitledHtmlDict,
        state_domain.SolutionDict,
        state_domain.StateDict,
        state_domain.OutcomeDict,
        state_domain.RecordedVoiceoversDict,
        feconf.TranslatedContentDict,
        question_domain.QuestionSuggestionChangeDict
    ]


def validate_cmd(
    cmd_name: str,
    valid_cmd_attribute_specs: feconf.ValidCmdDict,
    actual_cmd_attributes: Mapping[str, AcceptableChangeDictTypes]
) -> None:
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
        DeprecatedCommandError. The value of any attribute is deprecated.
    """

    required_attribute_names = valid_cmd_attribute_specs[
        'required_attribute_names']
    optional_attribute_names = valid_cmd_attribute_specs[
        'optional_attribute_names']
    actual_attribute_names = [
        key for key in actual_cmd_attributes.keys()
        if key != 'cmd'
    ]

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

    deprecated_values = valid_cmd_attribute_specs.get('deprecated_values', {})
    for attribute_name, attribute_values in deprecated_values.items():
        actual_value = actual_cmd_attributes.get(attribute_name)
        if actual_value in attribute_values:
            raise utils.DeprecatedCommandError(
                'Value for %s in cmd %s: %s is deprecated' % (
                    attribute_name, cmd_name, actual_value))

    allowed_values = valid_cmd_attribute_specs.get('allowed_values')
    if not allowed_values:
        return

    for attribute_name, attribute_values in allowed_values.items():
        actual_value = actual_cmd_attributes[attribute_name]
        if actual_value not in attribute_values:
            raise utils.ValidationError(
                'Value for %s in cmd %s: %s is not allowed' % (
                    attribute_name, cmd_name, actual_value))


class BaseChange:
    """Domain object for changes made to storage models' domain objects."""

    # The list of allowed commands of a change domain object. Each item in the
    # list is a dict with keys as: name (command name), required_attribute_names
    # (a list of required attribute names of a command),
    # optional_attribute_name (the list of optional attribute names of a
    # command), user_id_attribute_names (the list of attribute names that
    # contain user ID). There are also optional keys like allowed_values
    # and deprecated_values. allowed_values is a
    # dict with key as attribute name and value as allowed values
    # for the attribute. deprecated_values is a
    # dict with key as attribute name and value as deprecated values
    # for the attribute.
    # This list can be overriden by subclasses, if needed.
    ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = []

    # The list of deprecated commands of a change domain object. Each item
    # is a command that has been deprecated but these commands are yet to be
    # removed from the server data. Thus, once these commands are removed using
    # a migration job, we can remove the command from this list.
    DEPRECATED_COMMANDS: List[str] = []

    # This is a list of common commands which is valid for all subclasses.
    # This should not be overriden by subclasses.
    COMMON_ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = [{
        'name': feconf.CMD_DELETE_COMMIT,
        'required_attribute_names': [],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]

    def __init__(
        self, change_dict: Mapping[str, AcceptableChangeDictTypes]
    ) -> None:
        """Initializes a BaseChange object from a dict.

        Args:
            change_dict: dict. The dict containing cmd name and attributes.

        Raises:
            ValidationError. The given change_dict is not valid.
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

    def validate_dict(
        self, change_dict: Mapping[str, AcceptableChangeDictTypes]
    ) -> None:
        """Checks that the command in change dict is valid for the domain
        object.

        Args:
            change_dict: dict. A dict of changes with keys as a cmd and the
                attributes of a command.

        Raises:
            ValidationError. The change dict does not contain the cmd key,
                or the cmd name is not allowed for the Change domain object
                or the command attributes are missing or extra.
            DeprecatedCommandError. The change dict contains a deprecated
                command or the value for the command attribute is deprecated.
        """
        if 'cmd' not in change_dict:
            raise utils.ValidationError('Missing cmd key in change dict')

        cmd_name = change_dict['cmd']
        # Ruling out the possibility of different types for mypy type checking.
        assert isinstance(cmd_name, str)

        valid_cmd_attribute_specs = None

        all_allowed_commands = (
            self.ALLOWED_COMMANDS + self.COMMON_ALLOWED_COMMANDS)
        for cmd in all_allowed_commands:
            if cmd['name'] == cmd_name:
                valid_cmd_attribute_specs = copy.deepcopy(cmd)
                break

        if cmd_name in self.DEPRECATED_COMMANDS:
            raise utils.DeprecatedCommandError(
                'Command %s is deprecated' % cmd_name)

        if not valid_cmd_attribute_specs:
            raise utils.ValidationError('Command %s is not allowed' % cmd_name)

        actual_cmd_attributes = copy.deepcopy(change_dict)

        validate_cmd(
            cmd_name, valid_cmd_attribute_specs, actual_cmd_attributes)

    def to_dict(self) -> Dict[str, AcceptableChangeDictTypes]:
        """Returns a dict representing the BaseChange domain object.

        Returns:
            dict. A dict, mapping all fields of BaseChange instance.
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

    @classmethod
    def from_dict(
        cls, base_change_dict: Mapping[str, AcceptableChangeDictTypes]
    ) -> BaseChange:
        """Returns a BaseChange domain object from a dict.

        Args:
            base_change_dict: dict. The dict representation of
                BaseChange object.

        Returns:
            BaseChange. The corresponding BaseChange domain object.
        """
        return cls(base_change_dict)

    def validate(self) -> None:
        """Validates various properties of the BaseChange object.

        Raises:
            ValidationError. One or more attributes of the BaseChange are
                invalid.
        """
        # We validate the BaseChange object by converting
        # it into a dict and using the validate_dict method.
        # This is done because schema_utils used the validate method
        # to verify that the domain object is correct.
        self.validate_dict(self.to_dict())

    def __getattr__(self, name: str) -> str:
        # AttributeError needs to be thrown in order to make
        # instances of this class picklable.
        # Here we use cast because in method to_dict(), we are calling
        # getattr() but if for some reason getattr() is not able to fetch
        # the attribute, it calls `__getattr__` so that an AttributeError
        # is raised, and in __getattr__ we are doing self.__dict__[name]
        # to raise and catch the exception. But the return value of
        # `self.__dict__[name]` is Any type which causes MyPy to throw error.
        # Thus to avoid the error, we used cast here. We have not used assert
        # here because that will be written after `self.__dict__[name]` and
        # never be executed, which causes backend coverage to throw error.
        try:
            return cast(str, self.__dict__[name])
        except KeyError as e:
            raise AttributeError(name) from e
