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

"""Classes relating to parameters."""

import re

from core.domain import obj_services
from core.domain import value_generators_domain
import feconf
import utils


class ParamSpec(object):
    """Value object for an exploration parameter specification."""
    def __init__(self, obj_type):
        self.obj_type = obj_type

    def to_dict(self):
        return {
            'obj_type': self.obj_type,
        }

    @classmethod
    def from_dict(cls, param_spec_dict):
        return cls(param_spec_dict['obj_type'])

    def validate(self):
        # Ensure that this object class exists.
        obj_services.Registry.get_object_class_by_type(self.obj_type)

        # Ensure the obj_type is UnicodeString, since that is the only supported
        # type of ParamSpec.
        # TODO(bhenning): Expand parameter support in the editor to multiple
        # types, then validate all changes and rule inputs to properly match the
        # type of the parameter.
        if self.obj_type != 'UnicodeString':
            raise utils.ValidationError(
                'Only \'UnicodeString\' is the supported object type for '
                'parameters, not: %s' % self.obj_type)


class ParamChange(object):
    """Value object for a parameter change."""

    def __init__(self, name, generator_id, customization_args):

        # TODO(sll): Check that all required args for customization exist in
        # customization_args.

        self._name = name
        self._generator_id = generator_id
        self._customization_args = customization_args

    @property
    def name(self):
        return self._name

    @property
    def generator(self):
        return value_generators_domain.Registry.get_generator_class_by_id(
            self._generator_id)()

    @property
    def customization_args(self):
        return self._customization_args

    def to_dict(self):
        return {
            'name': self.name,
            'generator_id': self.generator.id,
            'customization_args': self.customization_args
        }

    @classmethod
    def from_dict(cls, param_change_dict):
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
        if not isinstance(self.name, basestring):
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
                'Generator %s is not a valid generator for exploration '
                'parameters. Valid generators must not require any '
                'initialization arguments.' % self._generator_id)

        if not isinstance(self.customization_args, dict):
            raise utils.ValidationError(
                'Expected a dict of customization_args, received %s'
                % self.customization_args)
        for arg_name in self.customization_args:
            if not isinstance(arg_name, basestring):
                raise Exception(
                    'Invalid parameter change customization_arg name: %s'
                    % arg_name)
