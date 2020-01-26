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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

from core.domain import obj_services
from core.domain import value_generators_domain
import feconf
import python_utils
import utils


class ParamSpec(python_utils.OBJECT):
    """Value object for an exploration parameter specification."""

    SUPPORTED_OBJ_TYPES = {
        'UnicodeString',
    }

    def __init__(self, obj_type):
        """Initializes a ParamSpec object with the specified object type.

        Args:
            obj_type: unicode. The object type with which the parameter is
                initialized.
        """
        self.obj_type = obj_type


    def to_dict(self):
        """Returns a dict representation of this ParamSpec.

        Returns:
            dict. A dict with a single key, whose value is the type
                of the parameter represented by this ParamSpec.
        """
        return {
            'obj_type': self.obj_type,
        }


    @classmethod
    def from_dict(cls, param_spec_dict):
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


    def validate(self):
        """Validate the existence of the object class."""

        # Ensure that this object class exists.
        obj_services.Registry.get_object_class_by_type(self.obj_type)

        # Ensure the obj_type is among the supported ParamSpec types.
        if self.obj_type not in self.SUPPORTED_OBJ_TYPES:
            raise utils.ValidationError(
                ('%s is not among the supported object types for parameters: '
                 '{%s}.') %
                (self.obj_type, ', '.join(sorted(self.SUPPORTED_OBJ_TYPES))))


class ParamChange(python_utils.OBJECT):
    """Value object for a parameter change."""

    def __init__(self, name, generator_id, customization_args):
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
        # TODO(sll): Check that all required args for customization exist in
        # customization_args.
        self._name = name
        self._generator_id = generator_id
        self._customization_args = customization_args

    @property
    def name(self):
        """The name of the changing parameter.

        Returns:
            unicode. The name of the parameter.
        """
        return self._name

    @property
    def generator(self):
        """The value generator used to define the new value of the
        changing parameter.

        Returns:
            subclass of BaseValueGenerator. The generator object for the
            parameter.
        """
        return value_generators_domain.Registry.get_generator_class_by_id(
            self._generator_id)()

    @property
    def customization_args(self):
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

    def to_dict(self):
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
    def from_dict(cls, param_change_dict):
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

    def _get_value(self, context_params):
        """Generates a single value for a parameter change."""
        return self.generator.generate_value(
            context_params, **self.customization_args)

    def get_normalized_value(self, obj_type, context_params):
        """Generates a single normalized value for a parameter change."""
        raw_value = self._get_value(context_params)
        return obj_services.Registry.get_object_class_by_type(
            obj_type).normalize(raw_value)

    def validate(self):
        """Checks that the properties of this ParamChange object are valid."""
        if not isinstance(self.name, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected param_change name to be a string, received %s'
                % self.name)
        if not re.match(feconf.ALPHANUMERIC_REGEX, self.name):
            raise utils.ValidationError(
                'Only parameter names with characters in [a-zA-Z0-9] are '
                'accepted.')

        try:
            self.generator
        except KeyError:
            raise utils.ValidationError(
                'Invalid generator id %s' % self._generator_id)
        except Exception:
            raise utils.ValidationError(
                'Expected generator id to be a string, received %s '
                % (self._generator_id))

        if not isinstance(self.customization_args, dict):
            raise utils.ValidationError(
                'Expected a dict of customization_args, received %s'
                % self.customization_args)
        for arg_name in self.customization_args:
            if not isinstance(arg_name, python_utils.BASESTRING):
                raise Exception(
                    'Invalid parameter change customization_arg name: %s'
                    % arg_name)
