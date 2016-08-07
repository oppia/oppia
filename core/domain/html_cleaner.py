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

import logging
import urlparse

from bs4 import BeautifulSoup
import bleach

from core.domain import rte_component_registry


def filter_a(name, value):
    if name in ('title', 'target'):
        return True
    if name == 'href':
        url_components = urlparse.urlsplit(value)
        if url_components[0] in ['http', 'https']:
            return True
        logging.error('Found invalid URL href: %s' % value)

    return False


ATTRS_WHITELIST = {
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


def clean(user_submitted_html):
    """Cleans a piece of user submitted HTML.

    This only allows HTML from a restricted set of tags, attrs and styles. It
    strips out unrecognized tags.
    """
    oppia_custom_tags = (
        rte_component_registry.Registry.get_tag_list_with_attrs())

    core_tags = ATTRS_WHITELIST.copy()
    core_tags.update(oppia_custom_tags)
    tag_names = core_tags.keys()

    # TODO(sll): Alert the caller if the input was changed due to this call.
    # TODO(sll): Add a log message if bad HTML is detected.
    return bleach.clean(
        user_submitted_html, tags=tag_names, attributes=core_tags, strip=True)


def strip_html_tags(html):
    """Strips all HTML markup from an HTML string."""
    return bleach.clean(html, tags=[], attributes={}, strip=True)

def textangular_to_ckeditor(content):
    # Wrapping div serves as a parent to everything else.
    content = '<div>' + content + '</div>'
    soup = BeautifulSoup(content, 'html.parser')

    # Move block components out of <p>,<b>, and <i>
    invalid_parents = ['p', 'b', 'i']
    components_names = ['image', 'collapsible', 'tabs']
    tag_names = ['oppia-noninteractive-' + component_name
                 for component_name in components_names]
    components = soup.find_all(tag_names)
    for component in components:
        while component.parent.name in invalid_parents:
            parent_name = component.parent.name
            previous_siblings = soup.new_tag(parent_name)
            for prev_sibling in component.previous_siblings:
                previous_siblings.append(prev_sibling)
            next_siblings = soup.new_tag(parent_name)
            for next_sibling in component.next_siblings:
                next_siblings.append(next_sibling)
            if previous_siblings.contents:
                component.parent.insert_before(previous_siblings)
            if next_siblings.contents:
                component.parent.insert_after(next_siblings)
            component.parent.replace_with(component)

    # Bold tag conversion: 'b' -> 'strong'.
    for bold in soup.find_all('b'):
        bold.name = 'strong'

    # Italic tag conversion: 'i' -> 'em'.
    for italic in soup.find_all('i'):
        italic.name = 'em'

    # Replace all spans with whatever is inside them.
    for span in soup.find_all('span'):
        span.unwrap()

    # Remove the wrapping div
    soup.div.unwrap()
    return soup.encode_contents(formatter='html')
