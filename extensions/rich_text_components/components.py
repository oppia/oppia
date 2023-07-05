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

from __future__ import annotations

import os
import re

from core import constants
from core import feconf
from core import utils
from extensions.objects.models import objects

import bs4

from typing import Any, Dict, List, Union


class BaseRteComponent:
    """Base Rte Component class.

    This is the superclass for rich text components in Oppia, such as
    Image and Video.
    """

    package, filepath = os.path.split(feconf.RTE_EXTENSIONS_DEFINITIONS_PATH)
    rich_text_component_specs = constants.parse_json_from_ts(
        constants.get_package_file_contents(package, filepath))

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

    # TODO(#16047): Here we use type Any because BaseRteComponent class is not
    # implemented according to the strict typing which forces us to use Any
    # here so that MyPy does not throw errors for different types of values
    # used in sub-classes. Once this BaseRteComponent is refactored, we can
    # remove type Any from here.
    @classmethod
    def validate(cls, value_dict: Any) -> None:
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
            raise utils.ValidationError(
                'Missing attributes: %s, Extra attributes: %s' % (
                    ', '.join(missing_attr_names),
                    ', '.join(extra_attr_names)
                )
            )

        for arg_name in required_attr_names:
            arg_obj_class = arg_names_to_obj_classes[arg_name]
            arg_obj_class.normalize(value_dict[arg_name])


class Collapsible(BaseRteComponent):
    """Class for Collapsible component."""

    @classmethod
    def validate(cls, value_dict: Dict[str, str]) -> None:
        """Validates Collapsible component."""
        super(Collapsible, cls).validate(value_dict)
        content = value_dict['content-with-value']
        inner_soup = bs4.BeautifulSoup(content, 'html.parser')
        collapsible = inner_soup.findAll(
            name='oppia-noninteractive-collapsible')
        tabs = inner_soup.findAll(
            name='oppia-noninteractive-tabs')
        if len(collapsible) or len(tabs):
            raise utils.ValidationError('Nested tabs and collapsible')


class Image(BaseRteComponent):
    """Class for Image component."""

    @classmethod
    def validate(cls, value_dict: Dict[str, str]) -> None:
        """Validates Image component."""
        super(Image, cls).validate(value_dict)
        filename_re = r'^[A-Za-z0-9+/_-]*\.((png)|(jpeg)|(gif)|(jpg))$'
        filepath = value_dict['filepath-with-value']
        if not re.match(filename_re, filepath):
            raise utils.ValidationError('Invalid filepath')


class Link(BaseRteComponent):
    """Class for Link component."""

    pass


class Math(BaseRteComponent):
    """Class for Math component."""

    @classmethod
    def validate(cls, value_dict: Dict[str, Dict[str, str]]) -> None:
        """Validates Math component."""
        super(Math, cls).validate(value_dict)
        filename_pattern_regex = constants.constants.MATH_SVG_FILENAME_REGEX
        filename = value_dict['math_content-with-value']['svg_filename']
        if not re.match(filename_pattern_regex, filename):
            raise utils.ValidationError(
                'Invalid svg_filename attribute in math component: %s' % (
                    filename))


class Skillreview(BaseRteComponent):
    """Class for Skillreview component."""

    pass


class Tabs(BaseRteComponent):
    """Class for Tabs component."""

    @classmethod
    def validate(cls, value_dict: Dict[str, List[Dict[str, str]]]) -> None:
        """Validates Tab component."""
        super(Tabs, cls).validate(value_dict)
        tab_contents = value_dict['tab_contents-with-value']
        for tab_content in tab_contents:
            inner_soup = (
                bs4.BeautifulSoup(tab_content['content'], 'html.parser'))
            collapsible = inner_soup.findAll(
                name='oppia-noninteractive-collapsible')
            tabs = inner_soup.findAll(
                name='oppia-noninteractive-tabs')
            if len(collapsible) or len(tabs):
                raise utils.ValidationError('Nested tabs and collapsible')


class Video(BaseRteComponent):
    """Class for Video component."""

    @classmethod
    def validate(cls, value_dict: Dict[str, Union[str, int, bool]]) -> None:
        """Validates Image component."""
        super(Video, cls).validate(value_dict)
        video_id = value_dict['video_id-with-value']
        assert isinstance(video_id, str)
        if len(video_id) != 11:
            raise utils.ValidationError('Video id length is not 11')
