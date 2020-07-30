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

"""HTML validation service."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json
import logging
import xml

import bs4
from constants import constants
from core.domain import fs_domain
from core.domain import fs_services
from core.domain import image_services
from core.domain import rte_component_registry
from extensions.objects.models import objects
import feconf
import python_utils


def escape_html(unescaped_html_data):
    """This functions escapes an unescaped HTML string.

    Args:
        unescaped_html_data: str. Unescaped HTML string to be escaped.

    Returns:
        str. Escaped HTML string.
    """
    # Replace list to escape html strings.
    replace_list_for_escaping = [
        ('&', '&amp;'),
        ('"', '&quot;'),
        ('\'', '&#39;'),
        ('<', '&lt;'),
        ('>', '&gt;')
    ]
    escaped_html_data = unescaped_html_data
    for replace_tuple in replace_list_for_escaping:
        escaped_html_data = escaped_html_data.replace(
            replace_tuple[0], replace_tuple[1])

    return escaped_html_data


def unescape_html(escaped_html_data):
    """This function unescapes an escaped HTML string.

    Args:
        escaped_html_data: str. Escaped HTML string to be unescaped.

    Returns:
        str. Unescaped HTML string.
    """
    # Replace list to unescape html strings.
    replace_list_for_unescaping = [
        ('&quot;', '"'),
        ('&#39;', '\''),
        ('&lt;', '<'),
        ('&gt;', '>'),
        ('&amp;', '&')
    ]
    unescaped_html_data = escaped_html_data
    for replace_tuple in replace_list_for_unescaping:
        unescaped_html_data = unescaped_html_data.replace(
            replace_tuple[0], replace_tuple[1])

    return unescaped_html_data


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


# List of oppia noninteractive inline components.
INLINE_COMPONENT_TAG_NAMES = (
    rte_component_registry.Registry.get_inline_component_tag_names())

# List of oppia noninteractive block components.
BLOCK_COMPONENT_TAG_NAMES = (
    rte_component_registry.Registry.get_block_component_tag_names())


def convert_to_textangular(html_data):
    """This function converts the html to TextAngular supported format.

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

    # To convert the rich text content within tabs and collapsible components
    # to valid TextAngular format. If there is no tabs or collapsible component
    # convert_tag_contents_to_rte_format will make no change to html_data.
    html_data = convert_tag_contents_to_rte_format(
        html_data, convert_to_textangular)

    soup = bs4.BeautifulSoup(html_data.encode(encoding='utf-8'), 'html.parser')

    allowed_tag_list = (
        feconf.RTE_CONTENT_SPEC[
            'RTE_TYPE_TEXTANGULAR']['ALLOWED_TAG_LIST'])
    allowed_parent_list = (
        feconf.RTE_CONTENT_SPEC[
            'RTE_TYPE_TEXTANGULAR']['ALLOWED_PARENT_LIST'])

    # The td tag will be unwrapped and tr tag will be replaced with p tag.
    # So if td is parent of blockquote after migration blockquote should
    # be parent of the p tag to get the alomst same appearance. p cannot
    # remain parent of blockquote since that is not allowed in TextAngular.
    # If blockquote is wrapped in p we need to unwrap the p but here
    # we need to make blockquote the parent of p. Since this cannot
    # be distinguished after migration to p, this part is checked
    # before migration.
    for blockquote in soup.findAll(name='blockquote'):
        if blockquote.parent.name == 'td':
            blockquote.parent.parent.wrap(soup.new_tag('blockquote'))
            blockquote.unwrap()

    # If p tags are left within a td tag, the contents of a table row
    # in final output will span to multiple lines instead of all
    # items being in a single line. So, any p tag within
    # td tag is unwrapped.
    for p in soup.findAll(name='p'):
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
        # 'a' tag is to be replaced with oppia-noninteractive-link.
        # For this the attributes and text within a tag is used to
        # create new link tag which is wrapped as parent of a and then
        # a tag is removed.
        # In case where there is no href attribute or no text within the
        # a tag, the tag is simply removed.
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
                    link['url-with-value'] = escape_html(json.dumps(url))
                    link['text-with-value'] = escape_html(json.dumps(text))
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
        # Divs and table rows are both replaced with p tag
        # to maintain almost same appearance.
        elif tag.name == 'div' or tag.name == 'tr':
            tag.name = 'p'
        # All other invalid tags are simply removed.
        elif tag.name not in allowed_tag_list:
            tag.unwrap()

    # Removal of tags can break the soup into parts which are continuous
    # and not wrapped in any tag. This part recombines the continuous
    # parts not wrapped in any tag.
    soup = bs4.BeautifulSoup(
        python_utils.convert_to_bytes(soup), 'html.parser')

    # Ensure that blockquote tag is wrapped in an allowed parent.
    for blockquote in soup.findAll(name='blockquote'):
        while blockquote.parent.name not in allowed_parent_list['blockquote']:
            blockquote.parent.unwrap()

    # Ensure that pre tag is not wrapped p tags.
    for pre in soup.findAll(name='pre'):
        while pre.parent.name == 'p':
            pre.parent.unwrap()

    # Ensure that ol and ul are not wrapped in p tags.
    for tag_name in ['ol', 'ul']:
        for tag in soup.findAll(name=tag_name):
            while tag.parent.name == 'p':
                tag.parent.unwrap()

    # Ensure that br tag is wrapped in an allowed parent.
    for br in soup.findAll(name='br'):
        if br.parent.name == 'pre':
            br.insert_after('\n')
            br.unwrap()
        elif br.parent.name not in allowed_parent_list['br']:
            wrap_with_siblings(br, soup.new_tag('p'))

    # Ensure that b and i tags are wrapped in an allowed parent.
    for tag_name in ['b', 'i']:
        for tag in soup.findAll(name=tag_name):
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
    for tag_name in INLINE_COMPONENT_TAG_NAMES:
        for tag in soup.findAll(name=tag_name):
            if tag.parent.name in ['blockquote', '[document]']:
                wrap_with_siblings(tag, soup.new_tag('p'))

    # Ensure oppia link component is not a child of another link component.
    for link in soup.findAll(name='oppia-noninteractive-link'):
        if link.parent.name == 'oppia-noninteractive-link':
            link.unwrap()

    # Ensure that oppia block components are wrapped in an allowed parent.
    for tag_name in BLOCK_COMPONENT_TAG_NAMES:
        for tag in soup.findAll(name=tag_name):
            if tag.parent.name in ['blockquote', '[document]']:
                wrap_with_siblings(tag, soup.new_tag('p'))

    # Ensure that every content in html is wrapped in a tag.
    for content in soup.contents:
        if not content.name:
            content.wrap(soup.new_tag('p'))

    # Ensure that p tag has a valid parent.
    for p in soup.findAll(name='p'):
        if p.parent.name != 'p' and (
                p.parent.name not in allowed_parent_list['p']):
            p.parent.unwrap()

    # Ensure that p tag is not wrapped in p tag.
    for p in soup.findAll(name='p'):
        if p.parent.name == 'p':
            child_tags = p.parent.contents
            index = 0
            while index < len(child_tags):
                current_tag = child_tags[index]

                # If the current tag is not a paragraph tag, wrap it and all
                # consecutive non-p tags after it into a single p-tag.
                new_p = soup.new_tag('p')
                while current_tag.name != 'p':
                    current_tag = current_tag.wrap(new_p)
                    index = child_tags.index(current_tag) + 1
                    if index >= len(child_tags):
                        break
                    current_tag = child_tags[index]

                index += 1
            p.parent.unwrap()

    # Beautiful soup automatically changes some <br> to <br/>,
    # so it has to be replaced directly in the string.
    # Also, when any html string with <br/> is stored in exploration
    # html strings they are stored as <br>. Since both of these
    # should match and <br> and <br/> have same working,
    # so the tag has to be replaced in this way.
    return python_utils.UNICODE(soup).replace('<br/>', '<br>')


def convert_to_ckeditor(html_data):
    """This function converts html strings to CKEditor supported format.

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

    # Convert the rich text content within tabs and collapsible components
    # to valid CKEditor format. If there is no tabs or collapsible component
    # convert_tag_contents_to_rte_format will make no change to html_data.
    html_data = convert_tag_contents_to_rte_format(
        html_data, convert_to_ckeditor)

    soup = bs4.BeautifulSoup(html_data.encode(encoding='utf-8'), 'html.parser')

    # Replaces b tag with strong tag.
    for b in soup.findAll(name='b'):
        b.name = 'strong'

    # Replaces i tag with em tag.
    for i in soup.findAll(name='i'):
        i.name = 'em'

    # Ensures li is not wrapped in li or p.
    for li in soup.findAll(name='li'):
        while li.parent.name in ['li', 'p']:
            li.parent.unwrap()

    list_tags = ['ol', 'ul']

    # Ensure li is wrapped in ol/ul.
    for li in soup.findAll(name='li'):
        if li.parent.name not in list_tags:
            new_parent = soup.new_tag('ul')
            next_sib = list(li.next_siblings)
            li.wrap(new_parent)
            for sib in next_sib:
                if sib.name == 'li':
                    sib.wrap(new_parent)
                else:
                    break

    # Ensure that the children of ol/ul are li/pre.
    for tag_name in list_tags:
        for tag in soup.findAll(name=tag_name):
            for child in tag.children:
                # The html formed after inserting a list element is:
                # <ul>
                #  <li> Item1 </li>
                #  <li> Item2 </li>
                # </ul>
                # The new line is being treated as a tag child by beautifulSoup
                # and so there is an extra li being produced which is not
                # required. So, we remove the extra new lines here since
                # they are added due to html being stored as a string.
                # CKEditor adds margin between list elements and the \n
                # character is of no significance therefore. Further if
                # user enters any newline it will be stored as <li>&nbsp;</li>
                # so removing the \n will not affect these lines.
                if child == '\n':
                    child.replaceWith('')
                elif child.name not in ['li', 'pre', 'ol', 'ul']:
                    new_parent = soup.new_tag('li')
                    next_sib = list(child.next_siblings)
                    child.wrap(new_parent)
                    for sib in next_sib:
                        if sib.name not in ['li', 'pre']:
                            sib.wrap(new_parent)
                        else:
                            break

    # This block unwraps the p tag, if the parent of p tag is pre tag.
    for p in soup.findAll(name='p'):
        if p.parent.name == 'pre':
            p.unwrap()

    # This block ensures that ol/ul tag is not a direct child of another ul/ol
    # tag. The conversion works as follows:
    # Invalid html: <ul><li>...</li><ul><ul><li>...</li></ul></ul></ul>
    # Valid html: <ul><li>...<ul><li>...</li></ul></li></ul>
    # i.e. if any ol/ul has parent as ol/ul and a previous sibling as li
    # it is wrapped in its previous sibling. If there is no previous sibling,
    # the tag is unwrapped.
    for tag_name in list_tags:
        for tag in soup.findAll(name=tag_name):
            if tag.parent.name in list_tags:
                prev_sib = tag.previous_sibling
                if prev_sib and prev_sib.name == 'li':
                    prev_sib.append(tag)
                else:
                    tag.unwrap()

    # Move block components out of p, pre, strong and em tags.
    for tag_name in BLOCK_COMPONENT_TAG_NAMES:
        for tag in soup.findAll(name=tag_name):
            while tag.parent.name in ['p', 'pre', 'strong', 'em']:
                new_parent_for_prev = soup.new_tag(tag.parent.name)
                new_parent_for_next = soup.new_tag(tag.parent.name)
                prev_sib = list(tag.previous_siblings)
                next_sib = list(tag.next_siblings)

                # Previous siblings are accessed in reversed order to
                # avoid reversing the order of siblings on being wrapped.
                for sib in reversed(prev_sib):
                    sib.wrap(new_parent_for_prev)

                for sib in next_sib:
                    sib.wrap(new_parent_for_next)
                tag.parent.unwrap()

    # Beautiful soup automatically changes some <br> to <br/>,
    # so it has to be replaced directly in the string.
    # Also, when any html string with <br/> is stored in exploration
    # html strings they are stored as <br>. Since both of these
    # should match and <br> and <br/> have same working,
    # so the tag has to be replaced in this way.

    # Replaces <p><br></p> with <p>&nbsp;</p> and <pre>...<br>...</pre>
    # with <pre>...\n...</pre>.
    for br in soup.findAll(name='br'):
        parent = br.parent
        if parent.name == 'p' and len(parent.contents) == 1:
            br.unwrap()
            # BeautifulSoup automatically escapes &nbsp; to &amp;nbsp;.
            # To safely add &nbsp in place of <br> tag we need the unicode
            # string \xa0.
            # Reference: https://stackoverflow.com/questions/26334461/.
            parent.string = u'\xa0'
        elif parent.name == 'pre':
            br.insert_after('\n')
            br.unwrap()

    # Ensure that any html string is always wrapped in a tag.
    # We are doing this since in CKEditor every string should
    # be wrapped in some tag. CKEditor will not produce any
    # error if we have a string without any tag but it cannot
    # be generated directly by typing some content in rte.
    # (It may be generated by copy paste).
    for content in soup.contents:
        if not content.name:
            # When user enters a string and then presses enter, a new paragraph
            # is created by ckeditor by default. This complete html data is
            # stored as:
            # <p>Para1</p>
            # <p>Para2</p>
            # The extra newline here is just in the storage representation but
            # is not useful as ckeditor adds a margin between two paragraphs
            # by default. On the other hand if user themselves enters a new line
            # by pressing enter, it will be stored as <p>&nbsp;</p> instead of
            # just a \n character. So, removing \n will not remove the new lines
            # inserted by user. Also we are not replacing \n with <p>&nbsp;</p>
            # since this is not entered by user. It is just due to the html
            # being stored as a string.
            if content == '\n':
                content.replaceWith('')
            else:
                content.wrap(soup.new_tag('p'))

    return python_utils.UNICODE(soup).replace('<br/>', '<br>')


def convert_tag_contents_to_rte_format(html_data, rte_conversion_fn):
    """This function converts the rich text content within tabs and
    collapsible components to given RTE format. If the html_data
    does not contain tab or collapsible components it will do nothing.

    Args:
        html_data: str. The HTML string whose content is to be converted.
        rte_conversion_fn: function. The RTE conversion function for
            html strings.

    Returns:
        str. The HTML string with converted content within tag.
    """
    soup = bs4.BeautifulSoup(html_data.encode(encoding='utf-8'), 'html.parser')

    for collapsible in soup.findAll(name='oppia-noninteractive-collapsible'):
        # To ensure that collapsible tags have content-with-value attribute.
        if 'content-with-value' not in collapsible.attrs or (
                collapsible['content-with-value'] == ''):
            collapsible['content-with-value'] = escape_html(json.dumps(''))

        content_html = json.loads(
            unescape_html(collapsible['content-with-value']))
        collapsible['content-with-value'] = escape_html(
            json.dumps(rte_conversion_fn(content_html)))

        # To ensure that collapsible tags have heading-with-value attribute.
        if 'heading-with-value' not in collapsible.attrs:
            collapsible['heading-with-value'] = escape_html(json.dumps(''))

    for tabs in soup.findAll(name='oppia-noninteractive-tabs'):
        tab_content_json = unescape_html(tabs['tab_contents-with-value'])
        tab_content_list = json.loads(tab_content_json)
        for index, tab_content in enumerate(tab_content_list):
            tab_content_list[index]['content'] = rte_conversion_fn(
                tab_content['content'])
        tabs['tab_contents-with-value'] = escape_html(
            json.dumps(tab_content_list))

    return python_utils.UNICODE(soup)


def validate_rte_format(html_list, rte_format, run_migration=False):
    """This function checks if html strings in a given list are
    valid for given RTE format.

    Args:
        html_list: list(str). List of html strings to be validated.
        rte_format: str. The type of RTE for which html string is
            to be validated.
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

    for html_data in html_list:
        if run_migration:
            if rte_format == feconf.RTE_FORMAT_TEXTANGULAR:
                soup_data = convert_to_textangular(html_data)
            else:
                soup_data = convert_to_ckeditor(html_data)
        else:
            soup_data = html_data

        # <br> is replaced with <br/> before conversion because
        # otherwise BeautifulSoup in some cases adds </br> closing tag
        # and br is reported as parent of other tags which
        # produces issues in validation.
        soup = bs4.BeautifulSoup(
            soup_data.replace('<br>', '<br/>'), 'html.parser')

        is_invalid = validate_soup_for_rte(soup, rte_format, err_dict)

        if is_invalid:
            err_dict['strings'].append(html_data)

        for collapsible in soup.findAll(
                name='oppia-noninteractive-collapsible'):
            if 'content-with-value' not in collapsible.attrs or (
                    collapsible['content-with-value'] == ''):
                is_invalid = True
            else:
                content_html = json.loads(
                    unescape_html(collapsible['content-with-value']))
                soup_for_collapsible = bs4.BeautifulSoup(
                    content_html.replace('<br>', '<br/>'), 'html.parser')
                is_invalid = validate_soup_for_rte(
                    soup_for_collapsible, rte_format, err_dict)
            if is_invalid:
                err_dict['strings'].append(html_data)

        for tabs in soup.findAll(name='oppia-noninteractive-tabs'):
            tab_content_json = unescape_html(tabs['tab_contents-with-value'])
            tab_content_list = json.loads(tab_content_json)
            for tab_content in tab_content_list:
                content_html = tab_content['content']
                soup_for_tabs = bs4.BeautifulSoup(
                    content_html.replace('<br>', '<br/>'), 'html.parser')
                is_invalid = validate_soup_for_rte(
                    soup_for_tabs, rte_format, err_dict)
                if is_invalid:
                    err_dict['strings'].append(html_data)

    for key in err_dict:
        err_dict[key] = list(set(err_dict[key]))

    return err_dict


def validate_soup_for_rte(soup, rte_format, err_dict):
    """Validate content in given soup for given RTE format.

    Args:
        soup: bs4.BeautifulSoup. The html soup whose content is to be validated.
        rte_format: str. The type of RTE for which html string is
            to be validated.
        err_dict: dict. The dictionary which stores invalid tags and strings.

    Returns:
        bool. Boolean indicating whether a html string is valid for given RTE.
    """
    if rte_format == feconf.RTE_FORMAT_TEXTANGULAR:
        rte_type = 'RTE_TYPE_TEXTANGULAR'
    else:
        rte_type = 'RTE_TYPE_CKEDITOR'
    allowed_parent_list = feconf.RTE_CONTENT_SPEC[
        rte_type]['ALLOWED_PARENT_LIST']
    allowed_tag_list = feconf.RTE_CONTENT_SPEC[rte_type]['ALLOWED_TAG_LIST']

    is_invalid = False

    # Text with no parent tag is also invalid.
    for content in soup.contents:
        if not content.name:
            is_invalid = True

    for tag in soup.findAll():
        # Checking for tags not allowed in RTE.
        if tag.name not in allowed_tag_list:
            if 'invalidTags' in err_dict:
                err_dict['invalidTags'].append(tag.name)
            else:
                err_dict['invalidTags'] = [tag.name]
            is_invalid = True
        # Checking for parent-child relation that are not
        # allowed in RTE.
        parent = tag.parent.name
        if (tag.name in allowed_tag_list) and (
                parent not in allowed_parent_list[tag.name]):
            if tag.name in err_dict:
                err_dict[tag.name].append(parent)
            else:
                err_dict[tag.name] = [parent]
            is_invalid = True

    return is_invalid


def add_caption_attr_to_image(html_string):
    """Adds caption attribute to all oppia-noninteractive-image tags.

    Args:
        html_string: str. HTML string in which the caption attribute is to be
            added.

    Returns:
        str. Updated HTML string with the caption attribute for all
        oppia-noninteractive-image tags.
    """
    soup = bs4.BeautifulSoup(
        html_string.encode(encoding='utf-8'), 'html.parser')

    for image in soup.findAll(name='oppia-noninteractive-image'):
        attrs = image.attrs
        if 'caption-with-value' not in attrs:
            image['caption-with-value'] = escape_html(json.dumps(''))

    return python_utils.UNICODE(soup)


def validate_customization_args(html_list):
    """Validates customization arguments of Rich Text Components in a list of
    html string.

    Args:
        html_list: list(str). List of html strings to be validated.

    Returns:
        dict: Dictionary of all the invalid customisation args where
        key is a Rich Text Component and value is the invalid html string.
    """
    # Dictionary to hold html strings in which customization arguments
    # are invalid.
    err_dict = {}
    rich_text_component_tag_names = (
        INLINE_COMPONENT_TAG_NAMES + BLOCK_COMPONENT_TAG_NAMES)

    tags_to_original_html_strings = {}
    for html_string in html_list:
        soup = bs4.BeautifulSoup(
            html_string.encode(encoding='utf-8'), 'html.parser')

        for tag_name in rich_text_component_tag_names:
            for tag in soup.findAll(name=tag_name):
                tags_to_original_html_strings[tag] = html_string

    for tag in tags_to_original_html_strings:
        html_string = tags_to_original_html_strings[tag]
        err_msg_list = list(validate_customization_args_in_tag(tag))
        for err_msg in err_msg_list:
            if err_msg:
                if err_msg not in err_dict:
                    err_dict[err_msg] = [html_string]
                elif html_string not in err_dict[err_msg]:
                    err_dict[err_msg].append(html_string)

    return err_dict


def validate_customization_args_in_tag(tag):
    """Validates customization arguments of Rich Text Components in a soup.

    Args:
        tag: bs4.element.Tag. The html tag to be validated.

    Yields:
        Error message if the attributes of tag are invalid.
    """

    component_types_to_component_classes = rte_component_registry.Registry.get_component_types_to_component_classes() # pylint: disable=line-too-long
    simple_component_tag_names = (
        rte_component_registry.Registry.get_simple_component_tag_names())
    tag_name = tag.name
    value_dict = {}
    attrs = tag.attrs

    for attr in attrs:
        value_dict[attr] = json.loads(unescape_html(attrs[attr]))

    try:
        component_types_to_component_classes[tag_name].validate(value_dict)
        if tag_name == 'oppia-noninteractive-collapsible':
            content_html = value_dict['content-with-value']
            soup_for_collapsible = bs4.BeautifulSoup(
                content_html, 'html.parser')
            for component_name in simple_component_tag_names:
                for component_tag in soup_for_collapsible.findAll(
                        name=component_name):
                    for err_msg in validate_customization_args_in_tag(
                            component_tag):
                        yield err_msg

        elif tag_name == 'oppia-noninteractive-tabs':
            tab_content_list = value_dict['tab_contents-with-value']
            for tab_content in tab_content_list:
                content_html = tab_content['content']
                soup_for_tabs = bs4.BeautifulSoup(
                    content_html, 'html.parser')
                for component_name in simple_component_tag_names:
                    for component_tag in soup_for_tabs.findAll(
                            name=component_name):
                        for err_msg in validate_customization_args_in_tag(
                                component_tag):
                            yield err_msg
    except Exception as e:
        yield python_utils.UNICODE(e)


def regenerate_image_filename_using_dimensions(filename, height, width):
    """Returns the name of the image file with dimensions in it.

    Args:
        filename: str. The name of the image file to be renamed.
        height: int. Height of the image.
        width: int. Width of the image.

    Returns:
        str. The name of the image file with its dimensions in it.
    """
    filename_wo_filetype = filename[:filename.rfind('.')]
    filetype = filename[filename.rfind('.') + 1:]
    dimensions_suffix = '_height_%s_width_%s' % (
        python_utils.UNICODE(height), python_utils.UNICODE(width))
    new_filename = '%s%s.%s' % (
        filename_wo_filetype, dimensions_suffix, filetype)
    return new_filename


def add_dimensions_to_image_tags(exp_id, html_string):
    """Adds dimensions to all oppia-noninteractive-image tags. Removes image
    tags that have no filepath.

    Args:
        exp_id: str. Exploration id.
        html_string: str. HTML string to modify.

    Returns:
        str. Updated HTML string with the dimensions for all
        oppia-noninteractive-image tags.
    """
    soup = bs4.BeautifulSoup(html_string.encode('utf-8'), 'html.parser')
    for image in soup.findAll(name='oppia-noninteractive-image'):
        if (not image.has_attr('filepath-with-value') or
                image['filepath-with-value'] == ''):
            image.decompose()
            continue

        try:
            filename = json.loads(unescape_html(image['filepath-with-value']))
            image['filepath-with-value'] = escape_html(json.dumps(
                get_filename_with_dimensions(filename, exp_id)))
        except Exception as e:
            logging.error(
                'Exploration %s failed to load image: %s' %
                (exp_id, image['filepath-with-value'].encode('utf-8')))
            raise e
    return python_utils.UNICODE(soup).replace('<br/>', '<br>')


def get_filename_with_dimensions(old_filename, exp_id):
    """Gets the filename with dimensions of the image file in it.

    Args:
        old_filename: str. Name of the file whose dimensions need to be
            calculated.
        exp_id: str. Exploration id.

    Returns:
        str. The new filename of the image file.
    """
    file_system_class = fs_services.get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(
        feconf.ENTITY_TYPE_EXPLORATION, exp_id))
    filepath = 'image/%s' % old_filename
    try:
        content = fs.get(filepath.encode('utf-8'))
        height, width = image_services.get_image_dimensions(content)
    except IOError:
        height = 120
        width = 120
    new_filename = regenerate_image_filename_using_dimensions(
        old_filename, height, width)
    return new_filename


def get_invalid_svg_tags_and_attrs(svg_string):
    """Returns a set of all invalid tags and attributes for the provided SVG.

    Args:
        svg_string: str. The SVG string.

    Returns:
        tuple(list(str), list(str)). A 2-tuple, the first element of which
        is a list of invalid tags, and the second element of which is a
        list of invalid tag-specific attributes.
        The format for the second element is <tag>:<attribute>, where the
        <tag> represents the SVG tag for which the attribute is invalid
        and <attribute> represents the invalid attribute.
        eg. (['invalid-tag1', 'invalid-tag2'], ['path:invalid-attr'])
    """
    soup = bs4.BeautifulSoup(svg_string.encode('utf-8'), 'html.parser')
    invalid_elements = []
    invalid_attrs = []
    for element in soup.find_all():
        if element.name.lower() in constants.SVG_ATTRS_WHITELIST:
            for attr in element.attrs:
                if attr.lower() not in (
                        constants.SVG_ATTRS_WHITELIST[element.name.lower()]):
                    invalid_attrs.append('%s:%s' % (element.name, attr))
        else:
            invalid_elements.append(element.name)
    return (invalid_elements, invalid_attrs)


def check_for_math_component_in_html(html_string):
    """Checks for existence of Math component tags inside an HTML string.

    Args:
        html_string: str. HTML string to check.

    Returns:
        str. Updated HTML string with all Math component tags having the new
        attribute.
    """
    soup = bs4.BeautifulSoup(
        html_string.encode(encoding='utf-8'), 'html.parser')
    math_tags = soup.findAll(name='oppia-noninteractive-math')
    return bool(math_tags)


def get_latex_strings_without_svg_from_html(html_string):
    """Extract LaTeX strings from math rich-text components whose svg_filename
    field is empty.

    Args:
        html_string: str. The HTML string.

    Returns:
        list(str). List of unique LaTeX strings from math-tags without svg
        filename.
    """

    soup = bs4.BeautifulSoup(
        html_string.encode(encoding='utf-8'), 'html.parser')
    latex_strings = set()
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        math_content_dict = (
            json.loads(unescape_html(
                math_tag['math_content-with-value'])))
        raw_latex = (
            objects.UnicodeString.normalize(math_content_dict['raw_latex']))
        svg_filename = (
            objects.UnicodeString.normalize(math_content_dict['svg_filename']))
        if svg_filename == '':
            latex_strings.add(raw_latex.encode('utf-8'))

    unique_latex_strings = list(latex_strings)
    return unique_latex_strings


def extract_svg_filenames_in_math_rte_components(html_string):
    """Extracts the svg_filenames from all the math-rich text components in
    an HTML string.

    Args:
        html_string: str. The HTML string.

    Returns:
        list(str). A list of svg_filenames present in the HTML.
    """

    soup = bs4.BeautifulSoup(
        html_string.encode(encoding='utf-8'), 'html.parser')
    filenames = []
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        math_content_dict = (
            json.loads(unescape_html(
                math_tag['math_content-with-value'])))
        svg_filename = math_content_dict['svg_filename']
        if svg_filename != '':
            normalized_svg_filename = (
                objects.UnicodeString.normalize(svg_filename))
            filenames.append(normalized_svg_filename)
    return filenames


def add_math_content_to_math_rte_components(html_string):
    """Replaces the attribute raw_latex-with-value in all Math component tags
    with a new attribute math_content-with-value. The new attribute has an
    additional field for storing SVG filenames. The field for SVG filename will
    be an empty string.

    Args:
        html_string: str. HTML string to modify.

    Returns:
        str. Updated HTML string with all Math component tags having the new
        attribute.
    """
    soup = bs4.BeautifulSoup(
        html_string.encode(encoding='utf-8'), 'html.parser')
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        if math_tag.has_attr('raw_latex-with-value'):
            try:
                # The raw_latex attribute value should be enclosed in
                # double quotes(&amp;quot;) and should be a valid unicode
                # string.
                raw_latex = (
                    json.loads(unescape_html(math_tag['raw_latex-with-value'])))
                normalized_raw_latex = (
                    objects.UnicodeString.normalize(raw_latex))
            except Exception as e:
                error_message = (
                    'Invalid raw_latex string found in the math tag : %s' % (
                        python_utils.UNICODE(e)))
                raise Exception(error_message)
            math_content_dict = {
                'raw_latex': normalized_raw_latex,
                'svg_filename': ''
            }
            # Normalize and validate the value before adding to the math
            # tag.
            normalized_math_content_dict = (
                objects.MathExpressionContent.normalize(math_content_dict))
            # Add the new attribute math_expression_contents-with-value.
            math_tag['math_content-with-value'] = (
                escape_html(
                    json.dumps(normalized_math_content_dict, sort_keys=True)))
            # Delete the attribute raw_latex-with-value.
            del math_tag['raw_latex-with-value']
        elif math_tag.has_attr('math_content-with-value'):
            pass
        else:
            raise Exception(
                'Invalid math tag with no proper attribute found.')
    # We need to replace the <br/> tags (if any) with  <br> because for passing
    # the textangular migration tests we need to have only <br> tags.
    return python_utils.UNICODE(soup).replace('<br/>', '<br>')


def validate_math_tags_in_html(html_string):
    """Returns a list of all invalid math tags in the given HTML.

    Args:
        html_string: str. The HTML string.

    Returns:
        list(str). A list of invalid math tags in the HTML string.
    """

    soup = bs4.BeautifulSoup(
        html_string.encode(encoding='utf-8'), 'html.parser')
    error_list = []
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        if math_tag.has_attr('raw_latex-with-value'):
            try:
                # The raw_latex attribute value should be enclosed in
                # double quotes(&amp;quot;) and should be a valid unicode
                # string.
                raw_latex = (
                    json.loads(unescape_html(math_tag['raw_latex-with-value'])))
                objects.UnicodeString.normalize(raw_latex)
            except Exception:
                error_list.append(math_tag)
        else:
            error_list.append(math_tag)
    return error_list


def validate_math_tags_in_html_with_attribute_math_content(html_string):
    """Returns a list of all invalid new schema math tags in the given HTML.
    The old schema has the attribute raw_latex-with-value while the new schema
    has the attribute math-content-with-value which includes a field for storing
    reference to SVGs.

    Args:
        html_string: str. The HTML string.

    Returns:
        list(str). A list of invalid math tags in the HTML string.
    """

    soup = bs4.BeautifulSoup(
        html_string.encode(encoding='utf-8'), 'html.parser')
    error_list = []
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        if math_tag.has_attr('math_content-with-value'):
            try:
                math_content_dict = (
                    json.loads(unescape_html(
                        math_tag['math_content-with-value'])))
                raw_latex = math_content_dict['raw_latex']
                svg_filename = math_content_dict['svg_filename']
                objects.UnicodeString.normalize(svg_filename)
                objects.UnicodeString.normalize(raw_latex)
            except Exception:
                error_list.append(math_tag)
        else:
            error_list.append(math_tag)
    return error_list


def is_parsable_as_xml(xml_string):
    """Checks if input string is parsable as XML.

    Args:
        xml_string: str. The XML string.

    Returns:
        bool. Whether xml_string is parsable as XML or not.
    """
    if not isinstance(xml_string, python_utils.BASESTRING):
        return False
    try:
        xml.etree.ElementTree.fromstring(xml_string)
        return True
    except xml.etree.ElementTree.ParseError:
        return False
