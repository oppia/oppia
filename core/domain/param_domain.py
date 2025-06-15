# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Domain objects relating to parameters."""

from __future__ import annotations

import re

from core import feconf
from core import utils
from core.domain import value_generators_domain

from typing import Dict, List, TypedDict, Union


class CustomizationArgsDict(TypedDict):
    """Dictionary representing the customization_args argument."""

    parse_with_jinja: bool


class CustomizationArgsDictWithValue(CustomizationArgsDict):
    """Dictionary representing the customization_args argument
    containing value key.
    """

    value: str


class CustomizationArgsDictWithValueList(CustomizationArgsDict):
    """Dictionary representing the customization_args argument
    containing list_of_values key.
    """

    list_of_values: List[str]


AllowedCustomizationArgsDict = Union[
    CustomizationArgsDictWithValue,
    CustomizationArgsDictWithValueList
]


class ParamSpecDict(TypedDict):
    """Dictionary representing the ParamSpec object."""

    obj_type: str


class ParamSpec:
    """Value object for an exploration parameter specification."""

    def __init__(self, obj_type: str) -> None:
        """Initializes a ParamSpec object with the specified object type.

        Args:
            obj_type: unicode. The object type with which the parameter is
                initialized.
        """
        self.obj_type = obj_type

    def to_dict(self) -> ParamSpecDict:
        """Returns a dict representation of this ParamSpec.

        Returns:
            dict. A dict with a single key, whose value is the type
            of the parameter represented by this ParamSpec.
        """
        return {
            'obj_type': self.obj_type,
        }

    @classmethod
    def from_dict(cls, param_spec_dict: ParamSpecDict) -> ParamSpec:
        """Creates a ParamSpec object from its dict representation.

        Args:
            param_spec_dict: dict. The dictionary containing the specification
                of the parameter. It contains the following key (object_type).
                `object_type` determines the data type of the parameter.

        Returns:
            ParamSpec. A ParamSpec object created from the specified
            object type.
        """
        return cls(param_spec_dict['obj_type'])

    def validate(self) -> None:
        """Validate the existence of the object class."""

        # Ensure the obj_type is among the supported ParamSpec types.
        if self.obj_type not in feconf.SUPPORTED_OBJ_TYPES:
            raise utils.ValidationError(
                '%s is not among the supported object types for parameters:'
                ' {%s}.' %
                (self.obj_type, ', '.join(sorted(feconf.SUPPORTED_OBJ_TYPES))))


class ParamChangeDict(TypedDict):
    """Dictionary representing the ParamChange object."""

    name: str
    generator_id: str
    customization_args: AllowedCustomizationArgsDict


class ParamChange:
    """Value object for a parameter change."""

    def __init__(
        self,
        name: str,
        generator_id: str,
        customization_args: AllowedCustomizationArgsDict
    ) -> None:
        """Initialize a ParamChange object with the specified arguments.

        Args:
            name: unicode. The name of the parameter.
            generator_id: unicode. The type of generator used to create the
                parameter, e.g., "Copier".
            customization_args: dict. A dict containing the following keys:
                (value, parse_with_jinja). `value` specifies the value of the
                parameter, and `parse_with_jinja` indicates whether parsing is
                to be done with the Jinja template engine. If the parameter is
                specified using one of several possible values, this dict
                contains a list (`list_of_values`) of possible values (instead
                of `value`).
        """
        # TODO(#20440): Check that all required args for customization exist in
        # customization_args.
        self._name = name
        self._generator_id = generator_id
        self._customization_args = customization_args

    @property
    def name(self) -> str:
        """The name of the changing parameter.

        Returns:
            unicode. The name of the parameter.
        """
        return self._name

    @property
    def generator(self) -> value_generators_domain.BaseValueGenerator:
        """The value generator used to define the new value of the
        changing parameter.

        Returns:
            subclass of BaseValueGenerator. The generator object for the
            parameter.
        """
        return value_generators_domain.Registry.get_generator_class_by_id(
            self._generator_id)()

    @property
    def customization_args(self) -> AllowedCustomizationArgsDict:
        """A dict containing several arguments that determine the changing value
        of the parameter.

        Returns:
            dict: A dict specifying the following customization arguments for
            the parameter. In case of a parameter change to a single value,
            this dict contains the value of the parameter and a key-value
            pair specifying whether parsing is done using the Jinja template
            engine. If the parameter is changed to one amongst several values,
            this dict contains a list of possible values.
         """
        return self._customization_args

    def to_dict(self) -> ParamChangeDict:
        """Returns a dict representing this ParamChange domain object.

        Returns:
            dict. A dict representation of the ParamChange instance.
        """
        return {
            'name': self.name,
            'generator_id': self.generator.id,
            'customization_args': self.customization_args
        }

    @classmethod
    def from_dict(cls, param_change_dict: ParamChangeDict) -> ParamChange:
        """Create a ParamChange object with the specified arguments.

        Args:
            param_change_dict: dict. A dict containing data about the
                following keys: (customization_args(dict), name, generator_id).
                `customization_args` is a dict with the following keys:
                (value, parse_with_jinja). `value` specifies the value of the
                parameter and `parse_with_jinja` indicates whether parsing
                change be performed using the Jinja template engine. If the
                parameter changed to one amongst several values, this dict
                contains a list of possible values.
                `name` is the name of the parameter.
                `generator_id` is the type of value generator used to
                generate the new value for the parameter.

        Returns:
            ParamChange. The ParamChange object created from the
            `param_change_dict` dict, which specifies the name,
            customization arguments and the generator used.
        """
        return cls(
            param_change_dict['name'], param_change_dict['generator_id'],
            param_change_dict['customization_args']
        )

    def get_value(self, context_params: Dict[str, str]) -> str:
        """Generates a single value for a parameter change."""
        value: str = self.generator.generate_value(
            context_params, **self.customization_args)
        return value

    def validate(self) -> None:
        """Checks that the properties of this ParamChange object are valid."""
        if not isinstance(self.name, str):
            raise utils.ValidationError(
                'Expected param_change name to be a string, received %s'
                % self.name)
        if not re.match(feconf.ALPHANUMERIC_REGEX, self.name):
            raise utils.ValidationError(
                'Only parameter names with characters in [a-zA-Z0-9] are '
                'accepted.')

        if not isinstance(self._generator_id, str):
            raise utils.ValidationError(
                'Expected generator ID to be a string, received %s '
                % self._generator_id)

        try:
            hasattr(self, 'generator')
        except KeyError as e:
            raise utils.ValidationError(
                'Invalid generator ID %s' % self._generator_id) from e

        if not isinstance(self.customization_args, dict):
            raise utils.ValidationError(
                'Expected a dict of customization_args, received %s'
                % self.customization_args)
        for arg_name in self.customization_args:
            if not isinstance(arg_name, str):
                raise Exception(
                    'Invalid parameter change customization_arg name: %s'
                    % arg_name)
