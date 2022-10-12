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

"""HTML sanitizing service."""

from __future__ import annotations

import html
import json
import logging
import urllib

from core.domain import rte_component_registry

import bleach
import bs4
from typing import Any, Dict, Final, List, TypedDict


# TODO(#15982): Here we use type Any because `customization_args` can accept
# various data types.
class ComponentsDict(TypedDict):
    """Dictionary that represents RTE Components."""

    id: str
    customization_args: Dict[str, Any]


def filter_a(tag: str, name: str, value: str) -> bool:
    """Returns whether the described attribute of a tag should be
    whitelisted.

    Args:
        tag: str. The name of the tag passed.
        name: str. The name of the attribute.
        value: str. The value of the attribute.

    Returns:
        bool. Whether the given attribute should be whitelisted.

    Raises:
        Exception. The 'tag' is not as expected.
    """
    if tag != 'a':
        raise Exception('The filter_a method should only be used for a tags.')
    if name in ('title', 'target'):
        return True
    if name == 'href':
        url_components = urllib.parse.urlsplit(value)
        if url_components[0] in ['http', 'https']:
            return True
        logging.error('Found invalid URL href: %s' % value)

    return False


ATTRS_WHITELIST: Final = {
    'a': filter_a,
    'b': [],
    'blockquote': [],
    'br': [],
    'code': [],
    'div': [],
    'em': [],
    'hr': [],
    'i': [],
    'li': [],
    'ol': [],
    'p': [],
    'pre': [],
    'span': [],
    'strong': [],
    'table': ['border'],
    'tbody': [],
    'td': [],
    'tr': [],
    'u': [],
    'ul': [],
}


def clean(user_submitted_html: str) -> str:
    """Cleans a piece of user submitted HTML.

    This only allows HTML from a restricted set of tags, attrs and styles.

    Args:
        user_submitted_html: str. An untrusted HTML string.

    Returns:
        str. The HTML string that results after stripping out unrecognized tags
        and attributes.
    """
    oppia_custom_tags = (
        rte_component_registry.Registry.get_tag_list_with_attrs())

    core_tags = ATTRS_WHITELIST.copy()
    core_tags.update(oppia_custom_tags)
    tag_names = list(core_tags.keys())

    # TODO(sll): Alert the caller if the input was changed due to this call.
    # TODO(sll): Add a log message if bad HTML is detected.
    return bleach.clean(
        user_submitted_html, tags=tag_names, attributes=core_tags, strip=True)


def strip_html_tags(html_string: str) -> str:
    """Strips all HTML markup from an HTML string.

    Args:
        html_string: str. An HTML string.

    Returns:
        str. The HTML string that results after all the tags and attributes are
        stripped out.
    """
    return bleach.clean(html_string, tags=[], attributes={}, strip=True)


def get_image_filenames_from_html_strings(html_strings: List[str]) -> List[str]:
    """Extracts the image filename from the oppia-noninteractive-image and
    oppia-noninteractive-math RTE component from all the html strings
    passed in.

    Args:
        html_strings: list(str). List of HTML strings.

    Returns:
        list(str). List of image filenames from html_strings.
    """
    all_rte_components = []
    filenames = []
    for html_string in html_strings:
        all_rte_components.extend(get_rte_components(html_string))

    for rte_comp in all_rte_components:
        if 'id' in rte_comp and rte_comp['id'] == 'oppia-noninteractive-image':
            filenames.append(
                rte_comp['customization_args']['filepath-with-value'])
        elif ('id' in rte_comp and
              rte_comp['id'] == 'oppia-noninteractive-math'):
            filenames.append(
                rte_comp['customization_args']['math_content-with-value'][
                    'svg_filename'])

    return list(set(filenames))


def get_rte_components(html_string: str) -> List[ComponentsDict]:
    """Extracts the RTE components from an HTML string.

    Args:
        html_string: str. An HTML string.

    Returns:
        list(dict). A list of dictionaries, each representing an RTE component.
        Each dict in the list contains:
        - id: str. The name of the component, i.e. 'oppia-noninteractive-link'.
        - customization_args: dict. Customization arg specs for the component.
    """
    components: List[ComponentsDict] = []
    soup = bs4.BeautifulSoup(html_string, 'html.parser')
    oppia_custom_tag_attrs = (
        rte_component_registry.Registry.get_tag_list_with_attrs())
    for tag_name, tag_attrs in oppia_custom_tag_attrs.items():
        component_tags = soup.find_all(name=tag_name)
        for component_tag in component_tags:
            customization_args = {}
            for attr in tag_attrs:
                # Unescape special HTML characters such as '&quot;'.
                attr_val = html.unescape(component_tag[attr])
                customization_args[attr] = json.loads(attr_val)

            component: ComponentsDict = {
                'id': tag_name,
                'customization_args': customization_args
            }
            components.append(component)
    return components
