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
import re
import xml

import bs4
from constants import constants
from core.domain import fs_domain
from core.domain import fs_services
from core.domain import rte_component_registry
from extensions.objects.models import objects
from extensions.rich_text_components import components
import feconf
import python_utils
import utils


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


def validate_rte_format(html_list, rte_format):
    """This function checks if html strings in a given list are
    valid for given RTE format.

    Args:
        html_list: list(str). List of html strings to be validated.
        rte_format: str. The type of RTE for which html string is
            to be validated.

    Returns:
        dict. Dictionary of all the error relations and strings.
    """
    # err_dict is a dictionary to store the invalid tags and the
    # invalid parent-child relations that we find.
    err_dict = {}

    # All the invalid html strings will be stored in this.
    err_dict['strings'] = []

    for html_data in html_list:
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


def validate_customization_args(html_list):
    """Validates customization arguments of Rich Text Components in a list of
    html string.

    Args:
        html_list: list(str). List of html strings to be validated.

    Returns:
        dict. Dictionary of all the invalid customisation args where
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
        str. Error message if the attributes of tag are invalid.
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


def validate_svg_filenames_in_math_rich_text(
        entity_type, entity_id, html_string):
    """Validates the SVG filenames for each math rich-text components and
    returns a list of all invalid math tags in the given HTML.

    Args:
        entity_type: str. The type of the entity.
        entity_id: str. The ID of the entity.
        html_string: str. The HTML string.

    Returns:
        list(str). A list of invalid math tags in the HTML string.
    """
    soup = bs4.BeautifulSoup(
        html_string.encode(encoding='utf-8'), 'html.parser')
    error_list = []
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        math_content_dict = (
            json.loads(unescape_html(
                math_tag['math_content-with-value'])))
        svg_filename = (
            objects.UnicodeString.normalize(math_content_dict['svg_filename']))
        if svg_filename == '':
            error_list.append(python_utils.UNICODE(math_tag))
        else:
            file_system_class = fs_services.get_entity_file_system_class()
            fs = fs_domain.AbstractFileSystem(
                file_system_class(entity_type, entity_id))
            filepath = 'image/%s' % svg_filename
            if not fs.isfile(filepath.encode('utf-8')):
                error_list.append(python_utils.UNICODE(math_tag))
    return error_list


def validate_math_content_attribute_in_html(html_string):
    """Validates the format of SVG filenames for each math rich-text components
    and returns a list of all invalid math tags in the given HTML.

    Args:
        html_string: str. The HTML string.

    Returns:
        list(dict(str, str)). A list of dicts each having the invalid tags in
        the HTML string and the corresponding exception raised.
    """
    soup = bs4.BeautifulSoup(
        html_string.encode(encoding='utf-8'), 'html.parser')
    error_list = []
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        math_content_dict = (
            json.loads(unescape_html(
                math_tag['math_content-with-value'])))
        try:
            components.Math.validate({
                'math_content-with-value': math_content_dict
            })
        except utils.ValidationError as e:
            error_list.append({
                'invalid_tag': python_utils.UNICODE(math_tag),
                'error': python_utils.UNICODE(e)
            })
    return error_list


def does_svg_tag_contains_xmlns_attribute(svg_string):
    """Checks whether the svg tag in the given svg string contains the xmlns
    attribute.

    Args:
        svg_string: str. The SVG string.

    Returns:
        bool. Whether the svg tag in the given svg string contains the xmlns
        attribute.
    """
    # We don't need to encode the svg_string here because, beautiful soup can
    # detect the encoding automatically and process the string.
    # see https://beautiful-soup-4.readthedocs.io/en/latest/#encodings for info
    # on auto encoding detection.
    # Also if we encode the svg_string here manually, then it fails to process
    # SVGs having non-ascii unicode characters and raises a UnicodeDecodeError.
    soup = bs4.BeautifulSoup(svg_string, 'html.parser')
    return all(
        svg_tag.get('xmlns') is not None for svg_tag in soup.findAll(name='svg')
    )


def get_svg_with_xmlns_attribute(svg_string):
    """Returns the svg_string with xmlns attribute if it does not exist in the
    svg tag.

    Args:
        svg_string: str. The SVG string.

    Returns:
        str. The svg_string with xmlns attribute in the svg tag.
    """
    soup = bs4.BeautifulSoup(svg_string, 'html.parser')
    if soup.find(
            name='svg', attrs={'xmlns': 'http://www.w3.org/2000/svg'}) is None:
        # Editing svg_string with soup will result in an invalid svg string
        # which browsers cannot render. We are adding required
        # attribute using regex search.
        svg_string = re.sub(
            '<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ',
            svg_string.decode(encoding='utf-8')).encode(encoding='utf-8')

    return svg_string


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

    # We don't need to encode the svg_string here because, beautiful soup can
    # detect the encoding automatically and process the string.
    # see https://beautiful-soup-4.readthedocs.io/en/latest/#encodings for info
    # on auto encoding detection.
    # Also if we encode the svg_string here manually, then it fails to process
    # SVGs having non-ascii unicode characters and raises a UnicodeDecodeError.
    soup = bs4.BeautifulSoup(svg_string, 'html.parser')
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
            # There was a case in prod where the attr value was empty. This was
            # dealt with manually in an earlier migration (states schema v34),
            # but we are not sure how it arose. We can't migrate those snapshots
            # manually, hence the addition of the logic here. After all
            # snapshots are migrated to states schema v42 (or above), this
            # 'if' branch will no longer be needed.
            if not math_tag['raw_latex-with-value']:
                math_tag.decompose()
                continue

            try:
                # The raw_latex attribute value should be enclosed in
                # double quotes(&amp;quot;) and should be a valid unicode
                # string.
                raw_latex = (
                    json.loads(unescape_html(math_tag['raw_latex-with-value'])))
                normalized_raw_latex = (
                    objects.UnicodeString.normalize(raw_latex))
            except Exception as e:
                logging.exception(
                    'Invalid raw_latex string found in the math tag : %s' % (
                        python_utils.UNICODE(e)
                    )
                )
                python_utils.reraise_exception()
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
            # Invalid math tag with no proper attribute found.
            math_tag.decompose()

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


def convert_svg_diagram_tags_to_image_tags(html_string):
    """Renames all the oppia-noninteractive-svgdiagram on the server to
    oppia-noninteractive-image and changes corresponding attributes.

    Args:
        html_string: str. The HTML string to check.

    Returns:
        str. The updated html string.
    """
    soup = bs4.BeautifulSoup(
        html_string.encode(encoding='utf-8'), 'html.parser')

    for image in soup.findAll(name='oppia-noninteractive-svgdiagram'):
        # All the attribute values should be enclosed in double
        # quotes(&amp;quot;).
        escaped_svg_filepath = escape_html(image['svg_filename-with-value'])
        escaped_svg_alt_value = escape_html(image['alt-with-value'])
        del image['svg_filename-with-value']
        del image['alt-with-value']
        image['filepath-with-value'] = escaped_svg_filepath
        image['caption-with-value'] = escape_html('""')
        image['alt-with-value'] = escaped_svg_alt_value
        image.name = 'oppia-noninteractive-image'
    return python_utils.UNICODE(soup)
