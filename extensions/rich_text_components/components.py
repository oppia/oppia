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

import re

import bs4
from extensions.objects.models import objects


class BaseRteComponent(object):
    """Base object class.

    This is the superclass for rich text components in Oppia, such as
    Image and Video.
    """

    # These values should be overridden in subclasses.
    customization_args = {}

    arg_schema = {}

    @classmethod
    def validate(cls, value_dict):
        """Validates customization args for a rich text component.

        Raises:
          TypeError: if any customization arg is invalid.
        """
        if cls.arg_schema:
            required_attrs = cls.arg_schema
        else:
            required_attrs = cls.customization_args
        required_attr_names = required_attrs.keys()
        attr_names = value_dict.keys()
        if set(attr_names) != set(required_attr_names):
            raise Exception('Invalid attributes')

        for arg_name in required_attr_names:
            arg_obj_class = required_attrs[arg_name]
            arg_obj_class.normalize(value_dict[arg_name])


class Collapsible(BaseRteComponent):
    """Class for Collapsible component."""

    customization_args = {
        'heading-with-value': objects.UnicodeString,
        'content-with-value': objects.Html
    }

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

    customization_args = {
        'filepath-with-value': objects.Filepath,
        'caption-with-value': objects.UnicodeString,
        'alt-with-value': objects.UnicodeString
    }

    @classmethod
    def validate(cls, value_dict):
        """Validates Image component."""
        super(Image, cls).validate(value_dict)
        filename_re = r'^[A-Za-z0-9+/]*\.((png)|(jpeg)|(gif)|(jpg))$'
        filepath = value_dict['filepath-with-value']
        if not re.match(filename_re, filepath):
            raise Exception('Invalid filepath')


class Link(BaseRteComponent):
    """Class for Link component."""

    customization_args = {
        'text-with-value': objects.UnicodeString,
        'url-with-value': objects.SanitizedUrl
    }
    is_simple = True


class Math(BaseRteComponent):
    """Class for Math component."""

    customization_args = {
        'raw_latex-with-value': objects.MathLatexString
    }


class Tabs(BaseRteComponent):
    """Class for Tabs component."""

    customization_args = {
        'tab_contents-with-value': list
    }
    arg_schema = {
        'content': objects.Html,
        'title': objects.UnicodeString
    }

    @classmethod
    def validate(cls, value_dict):
        """Validates Tab component."""
        if 'tab_contents-with-value' in value_dict:
            tab_contents = value_dict['tab_contents-with-value']
            if isinstance(tab_contents, list) and (
                    all(isinstance(item, dict) for item in (
                        tab_contents))):
                for tab_content in tab_contents:
                    super(Tabs, cls).validate(tab_content)
                    inner_soup = bs4.BeautifulSoup(
                        tab_content['content'].encode(encoding='utf-8'),
                        'html.parser')
                    collapsible = inner_soup.findAll(
                        name='oppia-noninteractive-collapsible')
                    tabs = inner_soup.findAll(
                        name='oppia-noninteractive-tabs')
                    if len(collapsible) or len(tabs):
                        raise Exception('Nested tabs and collapsible')

            else:
                raise Exception('Invalid type for tab contents')
        else:
            raise Exception('Invalid attributes')


class Video(BaseRteComponent):
    """Class for Video component."""

    customization_args = {
        'video_id-with-value': objects.UnicodeString,
        'start-with-value': objects.Int,
        'end-with-value': objects.Int,
        'autoplay-with-value': objects.Boolean
    }

    @classmethod
    def validate(cls, value_dict):
        """Validates Image component."""
        super(Video, cls).validate(value_dict)
        video_id = value_dict['video_id-with-value']
        if len(video_id) != 11:
            raise Exception('Video id length is not 11')
