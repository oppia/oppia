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
    '''Converts rte content from textAngular format to CkEditor format.'''
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


def verify_for_ckeditor(content):
    '''Verifies that content matches expected CKEditor format.'''
    soup = BeautifulSoup(content, 'html.parser')

    assert len(soup.find_all('br')) == 0, 'Contains <br> tags.'
    assert len(soup.find_all('b')) == 0, \
        'Contains <b> tags (should be <strong>).'
    assert len(soup.find_all('i')) == 0, 'Contains <i> tags (should be <em>).'
    assert len(soup.find_all('span')) == 0, \
        'Contains <span> tags (should be removed).'

    valid_parent_names = set(['li', 'blockquote', 'pre', '[document]'])
    invalid_ancestor_names = set(['p'])
    components_names = ['image', 'collapsible', 'tabs']
    tag_names = ['oppia-noninteractive-' + component_name
                 for component_name in components_names]

    for component in soup.find_all(tag_names):
        assert component.parent.name in valid_parent_names, \
            'Block component parent %s is not valid' % component.parent.name
        ancestor_names = set([el.name for el in component.parents])
        assert invalid_ancestor_names.isdisjoint(ancestor_names), \
            'Block component has invalid ancestor(s): %s' % \
            invalid_ancestor_names.intersection(ancestor_names)
