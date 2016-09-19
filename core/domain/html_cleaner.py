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
from bs4.element import Tag
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


BLOCK_COMPONENT_NAMES = ['image', 'collapsible', 'tabs', 'videos']
INLINE_COMPONENT_NAMES = ['link', 'math']
BLOCK_COMPONENT_TAG_NAMES = ['oppia-noninteractive-' + component_name
                             for component_name in BLOCK_COMPONENT_NAMES]
INLINE_COMPONENT_TAG_NAMES = ['oppia_noninteractive-' + component_name
                              for component_name in INLINE_COMPONENT_NAMES]


def textangular_to_ckeditor(content):
    """Converts rte content from textAngular format to CkEditor format."""
    # Wrapping div serves as a parent to everything else.
    content = '<div>' + content + '</div>'
    soup = BeautifulSoup(content, 'html.parser')

    # Move block components out of <p>,<b>, and <i>
    invalid_parents = ['p', 'b', 'i']
    components = soup.find_all(BLOCK_COMPONENT_TAG_NAMES)
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

    for br in soup.find_all('br'):
        if br.contents:
            # This happens in <pre> blocks, we want to replace br
            # with newlines.
            br.insert_before('\n')
            br.unwrap()
        else:
            # In all other cases, just replace with whitespace.
            br.replace_with(u'\xa0')

    # Remove the wrapping div
    soup.div.unwrap()
    return soup.encode_contents(formatter='html')


COMPONENT_PREFIX = 'oppia-noninteractive-'
BLOCK_COMPONENT_NAMES = ['image', 'collapsible', 'tabs', 'videos']
INLINE_COMPONENT_NAMES = ['link', 'math']
BLOCK_COMPONENT_TAG_NAMES = [COMPONENT_PREFIX + component_name
                             for component_name in BLOCK_COMPONENT_NAMES]
INLINE_COMPONENT_TAG_NAMES = [COMPONENT_PREFIX + component_name
                              for component_name in INLINE_COMPONENT_NAMES]

TOP_LEVEL_ALLOWED = ['p', 'h1', 'h2', 'h3', 'pre', 'ul', 'ol', 'blockquote']
TOP_LEVEL_ALLOWED += BLOCK_COMPONENT_TAG_NAMES
STANDARD_DESCENDANTS = ['em', 'strong'] + INLINE_COMPONENT_TAG_NAMES
ALLOWED_DESCENDANTS = {
    'p': STANDARD_DESCENDANTS,
    'h1': STANDARD_DESCENDANTS,
    'h2': STANDARD_DESCENDANTS,
    'h3': STANDARD_DESCENDANTS,
    'ul': ['li'],
    'ol': ['li'],
    'li': STANDARD_DESCENDANTS + ['h1', 'h2', 'h3'],
    'em': ['strong'] + INLINE_COMPONENT_TAG_NAMES,
    'strong': ['em'] + INLINE_COMPONENT_TAG_NAMES,
    'pre': STANDARD_DESCENDANTS,
    'blockquote': STANDARD_DESCENDANTS
}


def verify_for_ckeditor(content):
    """Verifies that content matches expected CKEditor format."""
    soup = BeautifulSoup(content, 'html.parser')

    # Iterating over the top level tags in the document first to check
    # if they are a proper top level tag, and then iterating over
    # all descendants of each top level tag.
    for child in soup.children:
        if isinstance(child, Tag):
            assert child.name in TOP_LEVEL_ALLOWED, (
                'Invalid top level tag: %s.' % child.name)
            for descendant in child.descendants:
                if isinstance(descendant, Tag):
                    assert descendant.name in ALLOWED_DESCENDANTS[
                        descendant.parent.name], (
                            '%s is not a valid child of parent %s.' % (
                                descendant.name, descendant.parent.name))
