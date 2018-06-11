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

import HTMLParser
import json
import logging
import urlparse

import bleach
import bs4
from core.domain import rte_component_registry
import feconf


def filter_a(name, value):
    """Returns whether the described attribute of an anchor ('a') tag should be
    whitelisted.

    Args:
        name: str. The name of the attribute.
        value: str. The value of the attribute.

    Returns:
        bool. Whether the given attribute should be whitelisted.
    """
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
    tag_names = core_tags.keys()

    # TODO(sll): Alert the caller if the input was changed due to this call.
    # TODO(sll): Add a log message if bad HTML is detected.
    return bleach.clean(
        user_submitted_html, tags=tag_names, attributes=core_tags, strip=True)


def strip_html_tags(html):
    """Strips all HTML markup from an HTML string.

    Args:
        html: str. An HTML string.

    Returns:
        str. The HTML string that results after all the tags and attributes are
        stripped out.
    """
    return bleach.clean(html, tags=[], attributes={}, strip=True)


def get_rte_components(html_string):
    """Extracts the RTE components from an HTML string.

    Args:
        html_string: str. An HTML string.

    Returns:
        list(dict). A list of dictionaries, each representing an RTE component.
        Each dict in the list contains:
        - id: str. The name of the component, i.e. 'oppia-noninteractive-link'.
        - customization_args: dict. Customization arg specs for the component.
    """
    parser = HTMLParser.HTMLParser()
    components = []
    soup = bs4.BeautifulSoup(html_string, 'html.parser')
    oppia_custom_tag_attrs = (
        rte_component_registry.Registry.get_tag_list_with_attrs())
    for tag_name in oppia_custom_tag_attrs:
        component_tags = soup.find_all(tag_name)
        for component_tag in component_tags:
            component = {'id': tag_name}
            customization_args = {}
            for attr in oppia_custom_tag_attrs[tag_name]:
                # Unescape special HTML characters such as '&quot;'.
                attr_val = parser.unescape(component_tag[attr])
                # Adds escapes so that things like '\frac' aren't
                # interpreted as special characters.
                attr_val = attr_val.encode('unicode_escape')
                customization_args[attr] = json.loads(attr_val)
            component['customization_args'] = customization_args
            components.append(component)
    return components


def wrap_with_siblings(tag, p):
    """This function wraps a tag and its unwrapped sibling in p tag.
    Args:
        tag: bs4.element.Tag. The tag which is to be wrapped in p tag
            along with its unwrapped siblings.
        p: bs4.element.Tag. The new p tag in soup in which the tag and
            its siblings are to be wrapped.
    """
    independent_parents = ['p', 'pre', 'ol', 'ul', 'blockquote']
    prev_sib = list(tag.previous_siblings)
    next_sib = list(tag.next_siblings)
    index_of_first_unwrapped_sibling = -1
    # Previous siblings are stored in order with the closest one
    # being the first. All the continuous siblings which cannot be
    # a valid parent by their own have to be wrapped in same p tag.
    # This loop finds the index of first sibling which is a valid
    # parent on its own.
    for index, sib in enumerate(prev_sib):
        if sib.name in independent_parents:
            index_of_first_unwrapped_sibling = len(prev_sib) - index
            break

    # Previous siblings are accessed in reversed order to
    # avoid reversing the order of siblings on being wrapped.
    for index, sib in enumerate(reversed(prev_sib)):
        if index >= index_of_first_unwrapped_sibling:
            sib.wrap(p)

    # Wrap the tag in same p tag as previous siblings.
    tag.wrap(p)

    # To wrap the next siblings which are not valid parents on
    # their own in the same p tag as previous siblings.
    for sib in next_sib:
        if sib.name not in independent_parents:
            sib.wrap(p)
        else:
            break


def convert_to_text_angular(html_data):
    """This function converts the html to text angular supported format.

    Args:
        html_data: str. HTML string to be converted.

    Returns:
        str. The converted HTML string.
    """
    if not len(html_data):
        return html_data

    # <br> is replaced with <br/> before conversion because BeautifulSoup
    # in some cases adds </br> closing tag and br is reported as parent
    # of other tags which produces issues in migration.
    html_data = html_data.replace('<br>', '<br/>')

    soup = bs4.BeautifulSoup(html_data, 'html.parser')

    allowed_tag_list = (
        feconf.RTE_CONTENT_SPEC[
            'RTE_TYPE_TEXTANGULAR']['ALLOWED_TAG_LIST'])
    allowed_parent_list = (
        feconf.RTE_CONTENT_SPEC[
            'RTE_TYPE_TEXTANGULAR']['ALLOWED_PARENT_LIST'])

    # td tag will be unwrapped and tr tag will be replaced with p tag.
    # So if td is parent of blockquote after migration blockquote should
    # be parent of the p tag to get the alomst same appearance. p cannot
    # remain parent of blockquote since that is not allowed in TextAngular.
    # If blockquote is wrapped in p we need to unwrap the p but here
    # we need to make blockquote the parent of p. Since this cannot
    # be distinguished after migration to p, this part is checked
    # before migration.
    for blockquote in soup.findAll('blockquote'):
        if blockquote.parent.name == 'td':
            blockquote.parent.parent.wrap(soup.new_tag('blockquote'))
            blockquote.unwrap()

    # If p tags are left within a td tag, the contents of a table row
    # in final output will span to multiple lines instead of all
    # items being in a single line. So, any p tag within
    # td tag is unwrapped.
    for p in soup.findAll('p'):
        if p.parent.name == 'td':
            p.unwrap()

    # To remove all tags except those in allowed tag list.
    all_tags = soup.findAll()
    for tag in all_tags:
        if tag.name == 'strong':
            tag.name = 'b'
        elif tag.name == 'em':
            tag.name = 'i'
        # Current rte does not support horizontal rule, the closest
        # replacement of a horizontal rule is a line break to obtain
        # the same appearance.
        elif tag.name == 'hr':
            tag.name = 'br'
        # a tag is to be replaced with oppia-noninteractive-link.
        # For this the attributes and text within a tag is used to
        # create new link tag which is wrapped as parent of a and then
        # a tag is removed.
        # There are cases where there is no href attribute of a tag.
        # In such cases a tag is simply removed.
        elif tag.name == 'a':
            replace_with_link = True
            if tag.has_attr('href') and tag.get_text():
                children = tag.findChildren()
                for child in children:
                    if child.name == 'oppia-noninteractive-link':
                        tag.unwrap()
                        replace_with_link = False
                if replace_with_link:
                    link = soup.new_tag('oppia-noninteractive-link')
                    url = tag['href']
                    text = tag.get_text()
                    link['url-with-value'] = '&quot;' + url + '&quot;'
                    link['text-with-value'] = '&quot;' + text + '&quot;'
                    tag.wrap(link)
                    # If any part of text in a tag is wrapped in b or i tag
                    # link tag is also wrapped in those tags to maintain
                    # almost similar appearance.
                    count_of_b_parent = 0
                    count_of_i_parent = 0
                    for child in children:
                        if child.name == 'b' and not count_of_b_parent:
                            link.wrap(soup.new_tag('b'))
                            count_of_b_parent = 1
                        if child.name == 'i' and not count_of_i_parent:
                            link.wrap(soup.new_tag('i'))
                            count_of_i_parent = 1
                    tag.extract()
            else:
                tag.unwrap()
        # To maintain the appearance of table, tab is added after
        # each element in row. In one of the cases the elements were
        # p tags with some text and line breaks. In such case td.string
        # is None and there is no need to add tabs since linebreak is
        # already present.
        elif tag.name == 'td' and tag.next_sibling:
            tag.insert_after(' ')
            tag.unwrap()
        # div and table rows both are replaced with p tag
        # to maintain almost same apperance.
        elif tag.name == 'div' or tag.name == 'tr':
            tag.name = 'p'
        # All other invalid tags are simply removed.
        elif tag.name not in allowed_tag_list:
            tag.unwrap()

    # Removal of tags can break the soup into parts which are continuous
    # and not wrapped in any tag. This part recombines the continuous
    # parts not wrapped in any tag.
    soup = bs4.BeautifulSoup(str(soup), 'html.parser')

    oppia_inline_components = [
        'oppia-noninteractive-link', 'oppia-noninteractive-math']
    oppia_block_components = [
        'oppia-noninteractive-image',
        'oppia-noninteractive-video',
        'oppia-noninteractive-collapsible',
        'oppia-noninteractive-tabs'
    ]

    # Ensure that blockquote tag is wrapped in an allowed parent.
    for blockquote in soup.findAll('blockquote'):
        while blockquote.parent.name not in allowed_parent_list['blockquote']:
            blockquote.parent.unwrap()

    # Ensure that pre tag is not wrapped p tags.
    for pre in soup.findAll('pre'):
        while pre.parent.name == 'p':
            pre.parent.unwrap()

    # Ensure that ol and ul are not wrapped in p tags.
    for tag_name in ['ol', 'ul']:
        for tag in soup.findAll(tag_name):
            while tag.parent.name == 'p':
                tag.parent.unwrap()

    # Ensure that br tag is wrapped in an allowed parent.
    for br in soup.findAll('br'):
        if br.parent.name == 'pre':
            br.insert_after('\n')
            br.unwrap()
        elif br.parent.name not in allowed_parent_list['br']:
            wrap_with_siblings(br, soup.new_tag('p'))

    # Ensure that b and i tags are wrapped in an allowed parent.
    for tag_name in ['b', 'i']:
        for tag in soup.findAll(tag_name):
            if tag.parent.name == 'oppia-noninteractive-link':
                tag.parent.wrap(soup.new_tag(tag_name))
                parent = tag.parent.parent
                tag.unwrap()
                tag = parent
            if tag.parent.name == tag_name:
                parent = tag.parent
                tag.unwrap()
                tag = parent
            if tag.parent.name in ['blockquote', '[document]']:
                wrap_with_siblings(tag, soup.new_tag('p'))

    # Ensure that oppia inline components are wrapped in an allowed parent.
    for tag_name in oppia_inline_components:
        for tag in soup.findAll(tag_name):
            if tag.parent.name in ['blockquote', '[document]']:
                wrap_with_siblings(tag, soup.new_tag('p'))

    # Ensure oppia link component is not a child of another link component.
    for link in soup.findAll('oppia-noninteractive-link'):
        if link.parent.name == 'oppia-noninteractive-link':
            link.unwrap()

    # Ensure that oppia block components are wrapped in an allowed parent.
    for tag_name in oppia_block_components:
        for tag in soup.findAll(tag_name):
            if tag.parent.name in ['blockquote', '[document]']:
                wrap_with_siblings(tag, soup.new_tag('p'))

    # Ensure that every content in html is wrapped in a tag.
    for content in soup.contents:
        if not content.name:
            content.wrap(soup.new_tag('p'))

    # Ensure that p tag has a valid parent.
    for p in soup.findAll('p'):
        if p.parent.name != 'p' and (
                p.parent.name not in allowed_parent_list['p']):
            p.parent.unwrap()

    # Ensure that p tag is not wrapped in p tag.
    for p in soup.findAll('p'):
        if p.parent.name == 'p':
            contents = p.parent.contents
            length_of_contents = len(contents)
            index = 0
            while index < length_of_contents:
                content = contents[index]
                new_p = soup.new_tag('p')
                if content.name != 'p':
                    while content.name != 'p':
                        content = content.wrap(new_p)
                        index = contents.index(content) + 1
                        length_of_contents = len(contents)
                        if index >= length_of_contents:
                            break
                        content = contents[index]
                index += 1
            p.parent.unwrap()

    # Beautiful soup automatically changes some <br> to <br/>,
    # so it has to be replaced directly in the string.
    # Also, when any html string with <br/> is stored in exploration
    # html strings they are stored as <br>. Since both of these
    # should match and <br> and <br/> have same working,
    # so the tag has to be replaced in this way.
    return str(soup).replace('<br/>', '<br>')


def validate_textangular_format(html_list, run_migration=False):
    """This function checks if html strings in a given list are
    valid for TextAngular RTE.

    Args:
        html_list: list(str). List of html strings to be validated.
        run_migration: bool. Specifies if migration is to be performed
            before validating.

    Returns:
        dict: Dictionary of all the error relations and strings.
    """
    # err_dict is a dictionary to store the invalid tags and the
    # invalid parent-child relations that we find.
    err_dict = {}

    # All the invalid html strings will be stored in this.
    err_dict['strings'] = []

    allowed_parent_list = (
        feconf.RTE_CONTENT_SPEC['RTE_TYPE_TEXTANGULAR']
        ['ALLOWED_PARENT_LIST'])
    allowed_tag_list = (
        feconf.RTE_CONTENT_SPEC['RTE_TYPE_TEXTANGULAR']
        ['ALLOWED_TAG_LIST'])

    for html_data in html_list:
        if run_migration:
            soup_data = convert_to_text_angular(html_data)
        else:
            soup_data = html_data

        # <br> is replaced with <br/> before conversion because
        # otherwise BeautifulSoup in some cases adds </br> closing tag
        # and br is reported as parent of other tags which
        # produces issues in validation.
        soup = bs4.BeautifulSoup(
            soup_data.replace('<br>', '<br/>'), 'html.parser')

        # Text with no parent tag is also invalid.
        for content in soup.contents:
            if not content.name:
                err_dict['strings'].append(html_data)
                break

        for tag in soup.findAll():
            # Checking for tags not allowed in RTE.
            if tag.name not in allowed_tag_list:
                if 'invalidTags' in err_dict:
                    err_dict['invalidTags'].append(tag.name)
                else:
                    err_dict['invalidTags'] = [tag.name]
                err_dict['strings'].append(html_data)
            # Checking for parent-child relation that are not
            # allowed in RTE.
            parent = tag.parent.name
            if (tag.name in allowed_tag_list) and (
                    parent not in allowed_parent_list[tag.name]):
                if tag.name in err_dict:
                    err_dict[tag.name].append(parent)
                else:
                    err_dict[tag.name] = [parent]
                err_dict['strings'].append(html_data)

    for key in err_dict:
        err_dict[key] = list(set(err_dict[key]))

    return err_dict
