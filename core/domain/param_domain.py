# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

import re

from core.domain import obj_services
from core.domain import value_generators_domain


class ParamSpec(object):
    """Value object for an exploration parameter specification."""
    def __init__(self, obj_type):
        if not obj_services.get_object_class(obj_type):
            raise ValueError('Invalid obj_type: %s' % obj_type)

        self.obj_type = obj_type

    def to_dict(self):
        return {
            'obj_type': self.obj_type,
        }

    @classmethod
    def from_dict(cls, param_spec_dict):
        return cls(param_spec_dict['obj_type'])


class ParamChange(object):
    """Value object for a parameter change."""

    def __init__(self, name, generator_id, customization_args):
        if not re.compile('^[a-zA-Z0-9]+$').match(name):
            raise ValueError(
                'Only parameter names with characters in [a-zA-Z0-9] are '
                'accepted.')

        if not isinstance(customization_args, dict):
            raise ValueError(
                'Expected a dict of customization_args, received %s'
                % customization_args)

        # TODO(sll): Check that all required args for customization exist in
        # customization_args.

        self._name = name
        self._generator_id = generator_id
        self._customization_args = customization_args

        try:
            self.generator
        except KeyError:
            raise ValueError('Invalid generator id %s' % generator_id)
        except Exception:
            raise ValueError('Generator %s is not a valid generator for '
                             'exploration parameters. Valid generators must '
                             'not require any initialization arguments.'
                             % generator_id)

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
        return obj_services.get_object_class(obj_type).normalize(raw_value)
