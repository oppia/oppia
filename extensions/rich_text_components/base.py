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

"""Base class for rich-text components."""

__author__ = 'Sean Lip'

import os

from extensions import domain
import feconf
import utils


class BaseRichTextComponent(object):
    """Base class for definitions of rich-text components.

    This class is not meant to be user-editable. The only methods on it should
    be get()-type methods.
    """

    # The human-readable name of the rich-text component. Overridden in
    # subclasses.
    name = ''
    # The category the rich-text component falls under in the repository.
    # Overridden in subclasses.
    category = ''
    # A description of the rich-text component. Overridden in subclasses.
    description = ''
    # The HTML tag name for the component. Overridden in subclasses.
    frontend_name = ''
    # The tooltip for the icon in the rich-text editor. Overridden in
    # subclasses.
    tooltip = ''
    # Whether the component is large enough to discourage its use when the
    # rich-text editor is intended to be lightweight.
    is_complex = False
    # Customization arg specifications for the component, including their
    # descriptions, schemas and default values. Overridden in subclasses.
    _customization_arg_specs = []
    # The icon to show in the rich-text editor. This is a representation of the
    # .png file in this rich-text component folder, generated with the
    # utils.convert_png_to_data_url() function. Overridden in subclasses.
    icon_data_url = ''

    @property
    def id(self):
        return self.__class__.__name__

    @property
    def customization_arg_specs(self):
        return [
            domain.CustomizationArgSpec(**cas)
            for cas in self._customization_arg_specs]

    @property
    def html_body(self):
        """The HTML code containing directives and templates for the component.

        This contains everything needed to display the component once the
        necessary attributes are supplied. For rich-text components, this
        consists of a single directive/template pair.
        """
        js_directives = utils.get_file_contents(os.path.join(
            feconf.RTE_EXTENSIONS_DIR, self.id, '%s.js' % self.id))
        html_templates = utils.get_file_contents(os.path.join(
            feconf.RTE_EXTENSIONS_DIR, self.id, '%s.html' % self.id))
        return '<script>%s</script>\n%s' % (js_directives, html_templates)

    def to_dict(self):
        """Gets a dict representing this component. Only the default values for
        customization args are provided.
        """
        return {
            'backend_name': self.name,
            'customization_arg_specs': [{
                'name': ca_spec.name,
                'description': ca_spec.description,
                'default_value': ca_spec.default_value,
                'schema': ca_spec.schema,
            } for ca_spec in self.customization_arg_specs],
            'frontend_name': self.frontend_name,
            'icon_data_url': self.icon_data_url,
            'is_complex': self.is_complex,
            'tooltip': self.tooltip,
        }
