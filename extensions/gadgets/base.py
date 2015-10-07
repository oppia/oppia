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

"""Base class for defining gadgets."""

__author__ = 'Michael Anuzis'

import copy
import os

from extensions import domain
import feconf
import schema_utils
import utils


class BaseGadget(object):
    """Base gadget definition class.

    This class is not meant to be user-editable. The only methods on it should
    be get()-type methods.
    """

    # The human-readable name of the gadget displayed in the editor.
    # Overridden in subclasses.
    short_description = ''
    # A description of the gadget. Overridden in subclasses.
    description = ''
    # Height of the gadget in pixels.
    height_px = 0
    # Width of the gadget in pixels.
    width_px = 0
    # The panel in which this gadget shows up in the learner view. This must
    # match the name of a stationary panel in the skin. Example: 'bottom'.
    # In the future, this property may offer other options like 'draggable'.
    panel = ''
    # Customization arg specifications for the component, including their
    # descriptions, schemas and default values. Overridden in subclasses.
    _customization_arg_specs = []
    # Additional JS library dependencies that should be loaded in pages
    # containing this gadget. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR. Overridden in subclasses.
    _dependency_ids = []

    @property
    def type(self):
        return self.__class__.__name__

    @property
    def customization_arg_specs(self):
        return [
            domain.CustomizationArgSpec(**cas)
            for cas in self._customization_arg_specs]

    @property
    def dependency_ids(self):
        return copy.deepcopy(self._dependency_ids)

    def validate_customization_arg_values(self, customization_args):
        """Validates customization arg values. The input is a dict whose
        keys are the names of the customization args.
        """
        for ca_spec in self.customization_arg_specs:
            schema_utils.normalize_against_schema(
                customization_args[ca_spec.name]['value'],
                ca_spec.schema)

    @property
    def html_body(self):
        """The HTML code containing directives and templates for the
        gadget. This contains everything needed to display the gadget
        once the necessary attributes are supplied.
        """
        js_directives = utils.get_file_contents(os.path.join(
            feconf.GADGETS_DIR, self.type, '%s.js' % self.type))
        html_templates = utils.get_file_contents(os.path.join(
            feconf.GADGETS_DIR, self.type, '%s.html' % self.type))
        return '<script>%s</script>\n%s' % (js_directives, html_templates)

    def validate(self, customization_args):
        """Subclasses may override to perform additional validation."""
        pass

    def to_dict(self):
        """Gets a dict representing this gadget. Only default values are
        provided.
        """
        result = {
            'type': self.type,
            'short_description': self.short_description,
            'height_px': self.height_px,
            'width_px': self.width_px,
            'panel': self.panel,
            'description': self.description,
            'customization_arg_specs': [{
                'name': ca_spec.name,
                'description': ca_spec.description,
                'default_value': ca_spec.default_value,
                'schema': ca_spec.schema,
            } for ca_spec in self.customization_arg_specs],
        }

        return result
