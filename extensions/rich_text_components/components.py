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

"""Classes for Rich Text Components in Oppia."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

import bs4
import constants
from extensions.objects.models import objects
import feconf
import python_utils


class BaseRteComponent(python_utils.OBJECT):
    """Base Rte Component class.

    This is the superclass for rich text components in Oppia, such as
    Image and Video.
    """

    with python_utils.open_file(
        feconf.RTE_EXTENSIONS_DEFINITIONS_PATH, 'r') as f:
        rich_text_component_specs = constants.parse_json_from_js(f)

    obj_types_to_obj_classes = {
        'unicode': objects.UnicodeString,
        'html': objects.Html,
        'Filepath': objects.Filepath,
        'SanitizedUrl': objects.SanitizedUrl,
        'MathExpressionContent': objects.MathExpressionContent,
        'ListOfTabs': objects.ListOfTabs,
        'SvgFilename': objects.SvgFilename,
        'int': objects.Int,
        'bool': objects.Boolean,
        'SkillSelector': objects.SkillSelector
    }

    @classmethod
    def validate(cls, value_dict):
        """Validates customization args for a rich text component.

        Raises:
            TypeError. If any customization arg is invalid.
        """
        arg_names_to_obj_classes = {}
        customization_arg_specs = cls.rich_text_component_specs[
            cls.__name__]['customization_arg_specs']
        for customization_arg_spec in customization_arg_specs:
            arg_name = '%s-with-value' % customization_arg_spec['name']
            schema = customization_arg_spec['schema']
            if schema['type'] != 'custom':
                obj_type = schema['type']
            else:
                obj_type = schema['obj_type']
            obj_class = cls.obj_types_to_obj_classes[obj_type]
            arg_names_to_obj_classes[arg_name] = obj_class

        required_attr_names = list(arg_names_to_obj_classes.keys())
        attr_names = list(value_dict.keys())

        if set(attr_names) != set(required_attr_names):
            missing_attr_names = list(
                set(required_attr_names) - set(attr_names))
            extra_attr_names = list(set(attr_names) - set(required_attr_names))
            raise Exception('Missing attributes: %s, Extra attributes: %s' % (
                ', '.join(missing_attr_names),
                ', '.join(extra_attr_names)))

        for arg_name in required_attr_names:
            arg_obj_class = arg_names_to_obj_classes[arg_name]
            arg_obj_class.normalize(value_dict[arg_name])


class Collapsible(BaseRteComponent):
    """Class for Collapsible component."""

    @classmethod
    def validate(cls, value_dict):
        """Validates Collapsible component."""
        super(Collapsible, cls).validate(value_dict)
        content = value_dict['content-with-value']
        inner_soup = bs4.BeautifulSoup(
            content.encode(encoding='utf-8'),
            'html.parser')
        collapsible = inner_soup.findAll(
            name='oppia-noninteractive-collapsible')
        tabs = inner_soup.findAll(
            name='oppia-noninteractive-tabs')
        if len(collapsible) or len(tabs):
            raise Exception('Nested tabs and collapsible')


class Image(BaseRteComponent):
    """Class for Image component."""

    @classmethod
    def validate(cls, value_dict):
        """Validates Image component."""
        super(Image, cls).validate(value_dict)
        filename_re = r'^[A-Za-z0-9+/_-]*\.((png)|(jpeg)|(gif)|(jpg))$'
        filepath = value_dict['filepath-with-value']
        if not re.match(filename_re, filepath):
            raise Exception('Invalid filepath')


class Svgdiagram(BaseRteComponent):
    """Class for Svgdiagram component."""

    @classmethod
    def validate(cls, value_dict):
        """Validates Svgdiagram component."""
        super(Svgdiagram, cls).validate(value_dict)
        filename_re = r'^[A-Za-z0-9+/_-]*\.(svg)$'
        filename = value_dict['svg_filename-with-value']
        if not re.match(filename_re, filename):
            raise Exception('Invalid filename')


class Link(BaseRteComponent):
    """Class for Link component."""

    pass


class Math(BaseRteComponent):
    """Class for Math component."""

    @classmethod
    def validate(cls, value_dict):
        """Validates Math component."""
        super(Math, cls).validate(value_dict)
        filename_pattern_regex = constants.constants.MATH_SVG_FILENAME_REGEX
        filename = value_dict['math_content-with-value']['svg_filename']
        if not re.match(filename_pattern_regex, filename):
            raise Exception(
                'Invalid svg_filename attribute in math component: %s' % (
                    filename))


class Skillreview(BaseRteComponent):
    """Class for Skillreview component."""

    pass


class Tabs(BaseRteComponent):
    """Class for Tabs component."""

    @classmethod
    def validate(cls, value_dict):
        """Validates Tab component."""
        super(Tabs, cls).validate(value_dict)
        tab_contents = value_dict['tab_contents-with-value']
        for tab_content in tab_contents:
            inner_soup = bs4.BeautifulSoup(
                tab_content['content'].encode(encoding='utf-8'),
                'html.parser')
            collapsible = inner_soup.findAll(
                name='oppia-noninteractive-collapsible')
            tabs = inner_soup.findAll(
                name='oppia-noninteractive-tabs')
            if len(collapsible) or len(tabs):
                raise Exception('Nested tabs and collapsible')


class Video(BaseRteComponent):
    """Class for Video component."""

    @classmethod
    def validate(cls, value_dict):
        """Validates Image component."""
        super(Video, cls).validate(value_dict)
        video_id = value_dict['video_id-with-value']
        if len(video_id) != 11:
            raise Exception('Video id length is not 11')
