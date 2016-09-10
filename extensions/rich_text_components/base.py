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

import os

from extensions import domain
import feconf
import jinja_utils
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
    # Whether the component requires the filesystem in some way that
    # prevents it from being used by unauthorized users.
    requires_fs = False
    # Whether the component should be displayed as a block element.
    is_block_element = False
    # Customization arg specifications for the component, including their
    # descriptions, schemas and default values. Overridden in subclasses.
    _customization_arg_specs = []

    @property
    def id(self):
        return self.__class__.__name__

    @property
    def customization_arg_specs(self):
        return [
            domain.CustomizationArgSpec(**cas)
            for cas in self._customization_arg_specs]

    @property
    def preview_url_template(self):
        """Returns a URL template which can be interpolated to a URL for the
        image that represents the component in the RTE. The interpolation
        dictionary used is the component's customization_args dict, extended
        with an additional 'explorationId' key whose value corresponds to the
        id of the containing exploration.
        """
        return utils.convert_png_to_data_url(os.path.join(
            feconf.RTE_EXTENSIONS_DIR, self.id, '%sPreview.png' % self.id))

    @property
    def html_body(self):
        """The HTML code containing directives and templates for the component.

        This contains everything needed to display the component once the
        necessary attributes are supplied. For rich-text components, this
        consists of a single directive/template pair.
        """
        html_templates = utils.get_file_contents(os.path.join(
            feconf.RTE_EXTENSIONS_DIR, self.id, '%s.html' % self.id))
        return jinja_utils.interpolate_cache_slug('%s' % html_templates)

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
            'icon_data_url': utils.convert_png_to_data_url(os.path.join(
                feconf.RTE_EXTENSIONS_DIR, self.id, '%s.png' % self.id)),
            'is_complex': self.is_complex,
            'requires_fs': self.requires_fs,
            'tooltip': self.tooltip,
            'is_block_element': self.is_block_element,
            'preview_url_template': self.preview_url_template
        }
