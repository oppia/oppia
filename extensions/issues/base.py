# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Base class for defining issues."""

from extensions import domain


class BaseExplorationIssueSpec(object):
    """Base issue definition class.

    This class is not meant to be user-editable. The only methods on it should
    be getter methods.
    """

    # Customization arg specifications for the component, including their
    # descriptions, schemas and default values. Overridden in subclasses.
    _customization_arg_specs = []

    @property
    def customization_arg_specs(self):
        return [
            domain.CustomizationArgSpec(**cas)
            for cas in self._customization_arg_specs]

    def to_dict(self):
        """Gets a dict representing this issue. Only default values are
        provided.
        """
        return {
            'customization_arg_specs': [{
                'name': ca_spec.name,
                'description': ca_spec.description,
                'default_value': ca_spec.default_value,
                'schema': ca_spec.schema,
            } for ca_spec in self.customization_arg_specs]
        }
