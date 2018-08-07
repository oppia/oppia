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

import json

import bs4
from core.domain import rte_component_registry
import feconf


def escape_html(unescaped_html_data):
    """This functions escapes an unescaped HTML string.

    Args:
        unescaped_html_data: str. Unescaped HTML string to be escaped.

    Returns:
        str. Escaped HTML string.
    """
    # Replace list to escape html strings.
    REPLACE_LIST_FOR_ESCAPING = [
        ('&', '&amp;'),
        ('"', '&quot;'),
        ('\'', '&#39;'),
        ('<', '&lt;'),
        ('>', '&gt;')
    ]
    escaped_html_data = unescaped_html_data
    for replace_tuple in REPLACE_LIST_FOR_ESCAPING:
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
    REPLACE_LIST_FOR_UNESCAPING = [
        ('&quot;', '"'),
        ('&#39;', '\''),
        ('&lt;', '<'),
        ('&gt;', '>'),
        ('&amp;', '&')
    ]
    unescaped_html_data = escaped_html_data
    for replace_tuple in REPLACE_LIST_FOR_UNESCAPING:
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
    rte_component_registry.Registry.get_component_tag_names(
        'is_block_element', False))

# List of oppia noninteractive block components.
BLOCK_COMPONENT_TAG_NAMES = (
    rte_component_registry.Registry.get_component_tag_names(
        'is_block_element', True))


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

    # td tag will be unwrapped and tr tag will be replaced with p tag.
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
        # a tag is to be replaced with oppia-noninteractive-link.
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
    soup = bs4.BeautifulSoup(
        unicode(soup).encode(encoding='utf-8'), 'html.parser')

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
    return unicode(soup).replace('<br/>', '<br>')


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

    LIST_TAGS = ['ol', 'ul']

    # Ensure li is wrapped in ol/ul.
    for li in soup.findAll(name='li'):
        if li.parent.name not in LIST_TAGS:
            new_parent = soup.new_tag('ul')
            next_sib = list(li.next_siblings)
            li.wrap(new_parent)
            for sib in next_sib:
                if sib.name == 'li':
                    sib.wrap(new_parent)
                else:
                    break

    # Ensure that the children of ol/ul are li/pre.
    for tag_name in LIST_TAGS:
        for tag in soup.findAll(name=tag_name):
            for child in tag.children:
                if child.name not in ['li', 'pre', 'ol', 'ul']:
                    new_parent = soup.new_tag('li')
                    next_sib = list(child.next_siblings)
                    child.wrap(new_parent)
                    for sib in next_sib:
                        if sib.name not in ['li', 'pre']:
                            sib.wrap(new_parent)
                        else:
                            break

    # This block wraps p tag in li tag if the parent of p is ol/ul tag. Also,
    # if the parent of p tag is pre tag, it unwraps the p tag.
    for p in soup.findAll(name='p'):
        if p.parent.name == 'pre':
            p.unwrap()
        elif p.parent.name in LIST_TAGS:
            p.wrap(soup.new_tag('li'))

    # This block ensures that ol/ul tag is not a direct child of another ul/ol
    # tag. The conversion works as follows:
    # Invalid html: <ul><li>...</li><ul><ul><li>...</li></ul></ul></ul>
    # Valid html: <ul><li>...<ul><li>...</li></ul></li></ul>
    # i.e. if any ol/ul has parent as ol/ul and a previous sibling as li
    # it is wrapped in its previous sibling. If there is no previous sibling,
    # the tag is unwrapped.
    for tag_name in LIST_TAGS:
        for tag in soup.findAll(name=tag_name):
            if tag.parent.name in LIST_TAGS:
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

    return unicode(soup).replace('<br/>', '<br>')


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

    return unicode(soup)


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

        is_invalid = _validate_soup_for_rte(soup, rte_format, err_dict)

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
                is_invalid = _validate_soup_for_rte(
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
                is_invalid = _validate_soup_for_rte(
                    soup_for_tabs, rte_format, err_dict)
                if is_invalid:
                    err_dict['strings'].append(html_data)

    for key in err_dict:
        err_dict[key] = list(set(err_dict[key]))

    return err_dict


def _validate_soup_for_rte(soup, rte_format, err_dict):
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
        RTE_TYPE = 'RTE_TYPE_TEXTANGULAR'
    else:
        RTE_TYPE = 'RTE_TYPE_CKEDITOR'
    allowed_parent_list = feconf.RTE_CONTENT_SPEC[
        RTE_TYPE]['ALLOWED_PARENT_LIST']
    allowed_tag_list = feconf.RTE_CONTENT_SPEC[RTE_TYPE]['ALLOWED_TAG_LIST']

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
        html_string. str: HTML string in which the caption attribute is to be
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

    return unicode(soup)


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
    RICH_TEXT_COMPONENT_TAG_NAMES = (
        INLINE_COMPONENT_TAG_NAMES + BLOCK_COMPONENT_TAG_NAMES)

    tags_to_original_html_strings = {}
    for html_string in html_list:
        soup = bs4.BeautifulSoup(
            html_string.encode(encoding='utf-8'), 'html.parser')

        for tag_name in RICH_TEXT_COMPONENT_TAG_NAMES:
            for tag in soup.findAll(name=tag_name):
                tags_to_original_html_strings[tag] = html_string

    for tag in tags_to_original_html_strings:
        html_string = tags_to_original_html_strings[tag]
        err_msg_list = list(_validate_customization_args_in_tag(tag))
        for err_msg in err_msg_list:
            if err_msg:
                if err_msg not in err_dict:
                    err_dict[err_msg] = [html_string]
                elif html_string not in err_dict[err_msg]:
                    err_dict[err_msg].append(html_string)

    return err_dict


def _validate_customization_args_in_tag(tag):
    """Validates customization arguments of Rich Text Components in a soup.

    Args:
        tag: bs4.element.Tag. The html tag to be validated.

    Yields:
        Error message if the attributes of tag are invalid.
    """

    COMPONENT_TYPES_TO_COMPONENT_CLASSES = rte_component_registry.Registry.get_component_types_to_component_classes() # pylint: disable=line-too-long
    SIMPLE_COMPONENT_TAG_NAMES = (
        rte_component_registry.Registry.get_component_tag_names(
            'is_complex', False))
    tag_name = tag.name
    value_dict = {}
    attrs = tag.attrs

    for attr in attrs:
        value_dict[attr] = json.loads(unescape_html(attrs[attr]))

    try:
        COMPONENT_TYPES_TO_COMPONENT_CLASSES[tag_name].validate(value_dict)
        if tag_name == 'oppia-noninteractive-collapsible':
            content_html = value_dict['content-with-value']
            soup_for_collapsible = bs4.BeautifulSoup(
                content_html, 'html.parser')
            for component_name in SIMPLE_COMPONENT_TAG_NAMES:
                for component_tag in soup_for_collapsible.findAll(
                        name=component_name):
                    for err_msg in _validate_customization_args_in_tag(
                            component_tag):
                        yield err_msg

        elif tag_name == 'oppia-noninteractive-tabs':
            tab_content_list = value_dict['tab_contents-with-value']
            for tab_content in tab_content_list:
                content_html = tab_content['content']
                soup_for_tabs = bs4.BeautifulSoup(
                    content_html, 'html.parser')
                for component_name in SIMPLE_COMPONENT_TAG_NAMES:
                    for component_tag in soup_for_tabs.findAll(name=tag_name):
                        for err_msg in _validate_customization_args_in_tag(
                                component_tag):
                            yield err_msg
    except Exception as e:
        yield str(e)
