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

from __future__ import annotations

import json
import logging

from core import feconf
from core import utils
from core.constants import constants
from core.domain import fs_services
from core.domain import rte_component_registry
from extensions.objects.models import objects
from extensions.rich_text_components import components

import bs4
import defusedxml.ElementTree

from typing import Callable, Dict, Iterator, List, Tuple, Union


def wrap_with_siblings(tag: bs4.element.Tag, p: bs4.element.Tag) -> None:
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
INLINE_COMPONENT_TAG_NAMES: List[str] = (
    rte_component_registry.Registry.get_inline_component_tag_names())

# List of oppia noninteractive block components.
BLOCK_COMPONENT_TAG_NAMES: List[str] = (
    rte_component_registry.Registry.get_block_component_tag_names())

# See https://perso.crans.org/besson/_static/python/lib/python2.7/encodings/cp1252.py # pylint: disable=line-too-long
# Useful reading: https://www.regular-expressions.info/unicode8bit.html
CHAR_MAPPINGS: List[Tuple[str, str]] = [
    (u'\u00a0', u'\xa0'),
    (u'\u00a1', u'\xa1'),
    (u'\u00a2', u'\xa2'),
    (u'\u00a3', u'\xa3'),
    (u'\u00a4', u'\xa4'),
    (u'\u00a5', u'\xa5'),
    (u'\u00a6', u'\xa6'),
    (u'\u00a7', u'\xa7'),
    (u'\u00a8', u'\xa8'),
    (u'\u00a9', u'\xa9'),
    (u'\u00aa', u'\xaa'),
    (u'\u00ab', u'\xab'),
    (u'\u00ac', u'\xac'),
    (u'\u00ad', u'\xad'),
    (u'\u00ae', u'\xae'),
    (u'\u00af', u'\xaf'),
    (u'\u00c0', u'\xc0'),
    (u'\u00c1', u'\xc1'),
    (u'\u00c2', u'\xc2'),
    (u'\u00c3', u'\xc3'),
    (u'\u00c4', u'\xc4'),
    (u'\u00c5', u'\xc5'),
    (u'\u00c6', u'\xc6'),
    (u'\u00c7', u'\xc7'),
    (u'\u00c8', u'\xc8'),
    (u'\u00c9', u'\xc9'),
    (u'\u00ca', u'\xca'),
    (u'\u00cb', u'\xcb'),
    (u'\u00cc', u'\xcc'),
    (u'\u00cd', u'\xcd'),
    (u'\u00ce', u'\xce'),
    (u'\u00cf', u'\xcf'),
    (u'\u00e0', u'\xe0'),
    (u'\u00e1', u'\xe1'),
    (u'\u00e2', u'\xe2'),
    (u'\u00e3', u'\xe3'),
    (u'\u00e4', u'\xe4'),
    (u'\u00e5', u'\xe5'),
    (u'\u00e6', u'\xe6'),
    (u'\u00e7', u'\xe7'),
    (u'\u00e8', u'\xe8'),
    (u'\u00e9', u'\xe9'),
    (u'\u00ea', u'\xea'),
    (u'\u00eb', u'\xeb'),
    (u'\u00ec', u'\xec'),
    (u'\u00ed', u'\xed'),
    (u'\u00ee', u'\xee'),
    (u'\u00ef', u'\xef'),
    (u'\u00f0', u'\xf0'),
    (u'\u00f1', u'\xf1'),
    (u'\u00f2', u'\xf2'),
    (u'\u00f3', u'\xf3'),
    (u'\u00f4', u'\xf4'),
    (u'\u00f5', u'\xf5'),

    # Some old strings contain \xc2 which is being dropped from the new
    # strings.
    (u'\xc2', ''),

    # This must come first, before \xc3\x** starts getting replaced.
    (u'\xe0\u0192', u'\xc3'),

    (u'\xc3\xa0', u'\xe0'),
    (u'\xc3\xa1', u'\xe1'),
    (u'\xc3\xa2', u'\xe2'),
    (u'\xc3\xa3', u'\xe3'),
    (u'\xc3\xa4', u'\xe4'),
    (u'\xc3\xa5', u'\xe5'),
    (u'\xc3\xa6', u'\xe6'),
    (u'\xc3\xa7', u'\xe7'),
    (u'\xc3\xa8', u'\xe8'),
    (u'\xc3\xa9', u'\xe9'),
    (u'\xc3\xaa', u'\xea'),
    (u'\xc3\xab', u'\xeb'),
    (u'\xc3\xac', u'\xec'),
    (u'\xc3\xad', u'\xed'),
    (u'\xc3\xae', u'\xee'),
    (u'\xc3\xaf', u'\xef'),
    (u'\xc3\xb0', u'\xf0'),
    (u'\xc3\xb1', u'\xf1'),
    (u'\xc3\xb2', u'\xf2'),
    (u'\xc3\xb3', u'\xf3'),
    (u'\xc3\xb4', u'\xf4'),
    (u'\xc3\xb5', u'\xf5'),
    (u'\xc3\xb6', u'\xf6'),
    (u'\xc3\xb7', u'\xf7'),
    (u'\xc3\xb8', u'\xf8'),
    (u'\xc3\xb9', u'\xf9'),
    (u'\xc3\xba', u'\xfa'),
    (u'\xc3\xbb', u'\xfb'),
    (u'\xc3\xbc', u'\xfc'),
    (u'\xc3\xbd', u'\xfd'),
    (u'\xc3\xbe', u'\xfe'),
    (u'\xc3\xbf', u'\xff'),
    (u'\xc3\u2013', u'\xd6'),
    (u'\xc3\u2014', u'\xd7'),
    (u'\xc3\u2018', u'\xd1'),
    (u'\xc3\u201c', u'\xd3'),
    (u'\xc3\u201e', u'\xc4'),
    (u'\xc3\u2021', u'\xc7'),
    (u'\xc3\u2022', u'\xd5'),
    (u'\xc3\u20ac', u'\xc0'),
    (u'\xc3\u0153', u'\xdc'),
    (u'\xc3\u0178', u'\xdf'),
    (u'\u0192\xa0', u''),
    (u'\xc3\u0160', u'\xca'),
    (u'\xc3\u0161', u'\xda'),
    (u'\xc3\u0192\xa1', u'\xe1'),
    (u'\xc3\u0192\xa2', u'\xe2'),
    (u'\xc3\u0192\xa4', u'\xe4'),
    (u'\xc3\u0192\xa7', u'\xe7'),
    (u'\xc3\u0192\xa8', u'\xe8'),
    (u'\xc3\u0192\xa9', u'\xe9'),
    (u'\xc3\u0192\xaa', u'\xea'),
    (u'\xc3\u0192\xad', u'\xed'),
    (u'\xc3\u0192\xb3', u'\xf3'),
    (u'\xc3\u0192\xb5', u'\xf5'),
    (u'\xc3\u0192\xb6', u'\xf6'),
    (u'\xc3\u0192\xba', u'\xfa'),
    (u'\xc3\u0192\xbb', u'\xfb'),
    (u'\xc3\u0192\xbc', u'\xfc'),
    (u'\xc3\u0192\xc5\u201c', u'\xdc'),
    (u'\xc3\u0192\xe2\u20ac\xa2', u'\xd5'),
    (u'\xc3\u201a', u''),
    (u'\xc3\u2026\xc5\xb8', u'\u015f'),
    (u'\xc3\u2030\xe2\u20ac\xba', u'\u025b'),
    # This must come after the previous line.
    (u'\xc3\u2030', u'\xc9'),

    # This relies on all other \xc3's having been converted.
    (u'\xc3', u'\xe0'),

    (u'\xc4\u20ac', u'\u0100'),
    (u'\xc4\u2026', u'\u0105'),
    (u'\xc4\u2021', u'\u0107'),
    (u'\xc4\u2122', u'\u0119'),
    (u'\xc4\u0152', u'\u010c'),
    (u'\xc4\u017e', u'\u011e'),
    (u'\xc4\u0178', u'\u011f'),
    (u'\xc4\xc5\xb8', u'\u011f'),
    (u'\xc4\xab', u'\u012b'),
    (u'\xc4\xb0', u'\u0130'),
    (u'\xc4\xb1', u'\u0131'),
    (u'\xc4\xbb', u'\u013b'),
    (u'\xc5\xba', u'\u017a'),
    (u'\xc5\xbe', u'\u017e'),
    (u'\xc5\u017e', u'\u015e'),
    (u'\xc5\u203a', u'\u015b'),
    (u'\xc5\u0178', u'\u015f'),
    (u'\xc5\u2018', u'\u0151'),
    (u'\xc9\u203a', u'\u025b'),
    (u'\xcc\u20ac', u'\u0300'),
    (u'\xce\u201d', u'\u0394'),
    (u'\xcf\u20ac', u'\u03c0'),
    (u'\xd1\u02c6', u'\u0448'),
    (u'\xd7\u2018', u'\u05d1'),
    (u'\xd8\u0178', u'\u061f'),
    (u'\xd8\xb5', u'\u0635'),
    (u'\xd8\xad', u'\u062d'),
    (u'\xd8\xa4', u'\u0624'),
    (u'\xd9\u0160', u'\u064a'),
    (u'\xd9\u2026', u'\u0645'),
    (u'\xd9\u02c6', u'\u0648'),
    (u'\xd9\u2030', u'\u0649'),
    (u'\xe0\xb6\u2021', u'\u0d87'),
    (u'\xe0\xb6\u2026', u'\u0d85'),
    (u'\xe1\xb9\u203a', u'\u1e5b'),
    (u'\xe1\xbb\u201c', u'\u1ed3'),
    (u'\xe1\xbb\u2026', u'\u1ec5'),
    (u'\xe1\xba\xbf', u'\u1ebf'),
    (u'\xe1\xbb\u0178', u'\u1edf'),
    (u'\xe2\u2020\u2019', u'\u2192'),
    (u'\xe2\xcb\u2020\xe2\u20ac\xb0', u'\u2209'),
    (u'\xe2\u20ac\u0153', u'\u201c'),
    (u'\xe2\u02c6\u2030', u'\u2209'),
    (u'\xe2\u2026\u02dc', u'\u2158'),
    (u'\xe2\u20ac\u2122', u'\u2019'),
    (u'\xe2\u02c6\u0161', u'\u221a'),
    (u'\xe2\u02c6\u02c6', u'\u2208'),
    (u'\xe2\u2026\u2022', u'\u2155'),
    (u'\xe2\u2026\u2122', u'\u2159'),
    (u'\xe2\u20ac\u02dc', u'\u2018'),
    (u'\xe2\u20ac\u201d', u'\u2014'),
    (u'\xe2\u20ac\u2039', u'\u200b'),
    (u'\xe2\u20ac\xa6', u'\u2026'),
    (u'\xe2\u2014\xaf', u'\u25ef'),
    (u'\xe2\u20ac\u201c', u'\u2013'),
    (u'\xe2\u2026\u2013', u'\u2156'),
    (u'\xe2\u2026\u201d', u'\u2154'),
    (u'\xe2\u2030\xa4', u'\u2264'),
    (u'\xe2\u201a\xac', u'\u20ac'),
    (u'\xe2\u0153\u2026', u'\u2705'),
    (u'\xe2\u017e\xa4', u'\u27a4'),
    (u'\xe2\u02dc\xba', u'\u263a'),
    (u'\xe2\u203a\xb1', u'\u26f1'),
    (u'\xe2\u20ac', u'\u2020'),
    (u'\xe2\u20ac\u201c', u'\u2013'),
    (u'\xe2\u20ac\xa6', u'\u2026'),
    (u'\xe2\xac\u2026', u'\u2b05'),
    (u'\xe3\u201a\u0152', u'\u308c'),
    (u'\xe3\u201a\u02c6', u'\u3088'),
    (u'\xe3\u201a\u2020', u'\u3086'),
    (u'\xe3\u201a\u2030', u'\u3089'),
    (u'\xe3\u201a\u20ac', u'\u3080'),
    (u'\xe3\u201a\u201e', u'\u3084'),
    (u'\xe3\u201a\u201c', u'\u3093'),
    (u'\xe3\u201a\u201a', u'\u3082'),
    (u'\xe3\u201a\u2019', u'\u3092'),
    (u'\xe3\u201a\u0160', u'\u308a'),
    (u'\xe4\xb8\u0153', u'\u4e1c'),
    (u'\xe5\u0152\u2014', u'\u5317'),
    (u'\xe5\u017d\xbb', u'\u53bb'),
    (u'\xe6\u201c\xa6', u'\u64e6'),
    (u'\xe6\u0153\xa8', u'\u6728'),
    (u'\xe6\u02c6\u2018', u'\u6211'),
    (u'\xe6\u02dc\xaf', u'\u662f'),
    (u'\xe8\xa5\xbf', u'\u897f'),
    (u'\xe9\u201d\u2122', u'\u9519'),
    (u'\xef\xbc\u0161', u'\uff1a'),
    (u'\xef\xbc\u0178', u'\uff1f'),
    (u'\u2020\u201c', u'\u2013'),
    (u'\u2020\xa6', u'\u2026'),
    (u'\ucc44', u'\xe4'),
    (u'\uccb4', u'\xfc'),
    (u'\u89ba', u'\u0131'),
    (u'\uce74', u'\u012b'),
    (u'\u0e23\u0e07', u'\xe7'),
    (u'\u0e23\x97', u'\xd7'),
    (u'\u0e23\u0e17', u'\xf7'),
    (u'\u0e23\u0e16', u'\xf6'),
    (u'\u0e23\u0e13', u'\xf3'),
    (u'\u0e23\u0e1b', u'\xfb'),
    (u'\xf0\u0178\u02dc\u2022', u'\U0001f615'),
    (u'\xf0\u0178\u02dc\u0160', u'\U0001f60a'),
    (u'\xf0\u0178\u02dc\u2030', u'\U0001f609'),
    (u'\xf0\u0178\u2122\u201e', u'\U0001f644'),
    (u'\xf0\u0178\u2122\u201a', u'\U0001f642'),
    (u'\u011f\u0178\u02dc\u0160', u'\U0001f60a'),
    (u'\u011f\u0178\u2019\xa1', u'\U0001f4a1'),
    (u'\u011f\u0178\u02dc\u2018', u'\U0001f611'),
    (u'\u011f\u0178\u02dc\u0160', u'\U0001f60a'),
    (u'\xf0\u0178\u201d\u2013', u'\U0001f516'),
    (u'\u011f\u0178\u02dc\u2030', u'\U0001f609'),
    (u'\xf0\u0178\u02dc\u0192', u'\U0001f603'),
    (u'\xf0\u0178\xa4\u2013', u'\U0001f916'),
    (u'\xf0\u0178\u201c\xb7', u'\U0001f4f7'),
    (u'\xf0\u0178\u02dc\u201a', u'\U0001f602'),
    (u'\xf0\u0178\u201c\u20ac', u'\U0001f4c0'),
    (u'\xf0\u0178\u2019\xbf', u'\U0001f4bf'),
    (u'\xf0\u0178\u2019\xaf', u'\U0001f4af'),
    (u'\xf0\u0178\u2019\xa1', u'\U0001f4a1'),
    (u'\xf0\u0178\u2018\u2039', u'\U0001f44b'),
    (u'\xf0\u0178\u02dc\xb1', u'\U0001f631'),
    (u'\xf0\u0178\u02dc\u2018', u'\U0001f611'),
    (u'\xf0\u0178\u02dc\u0160', u'\U0001f60a'),
    (u'\xf0\u0178\u017d\xa7', u'\U0001f3a7'),
    (u'\xf0\u0178\u017d\u2122', u'\U0001f399'),
    (u'\xf0\u0178\u017d\xbc', u'\U0001f3bc'),
    (u'\xf0\u0178\u201c\xbb', u'\U0001f4fb'),
    (u'\xf0\u0178\xa4\xb3', u'\U0001f933'),
    (u'\xf0\u0178\u2018\u0152', u'\U0001f44c'),
    (u'\xf0\u0178\u0161\xa6', u'\U0001f6a6'),
    (u'\xf0\u0178\xa4\u2014', u'\U0001f917'),
    (u'\xf0\u0178\u02dc\u201e', u'\U0001f604'),
    (u'\xf0\u0178\u2018\u2030', u'\U0001f449'),
    (u'\xf0\u0178\u201c\xa1', u'\U0001f4e1'),
    (u'\xf0\u0178\u201c\xa3', u'\U0001f4e3'),
    (u'\xf0\u0178\u201c\xa2', u'\U0001f4e2'),
    (u'\xf0\u0178\u201d\u0160', u'\U0001f50a'),
    (u'\xf0\u0178\u02dc\u017d', u'\U0001f60e'),
    (u'\xf0\u0178\u02dc\u2039', u'\U0001f60b'),
    (u'\xf0\u0178\u02dc\xb4', u'\U0001f634'),
    (u'\xf0\u0178\u2018\u2018', u'\U0001f451'),
    (u'\xf0\u0178\u2018\u2020', u'\U0001f446'),
    (u'\xf0\u0178\u2018\xae', u'\U0001f46e'),
    (u'\xf0\u0178\u201c\u201d', u'\U0001f4d4'),
    (u'\xf0\u0178\u201c\xbc', u'\U0001f4fc'),
    (u'\xf0\u0178\u2021\xa9', u'\U0001f1e9'),
    (u'\xf0\u0178\u2021\xaa', u'\U0001f1ea'),
    (u'\xf0\u0178\u2021\xac', u'\U0001f1ec'),
    (u'\xf0\u0178\u2021\xa7', u'\U0001f1e7'),
    (u'\xf0\u0178\u2021\xba', u'\U0001f1fa'),
    (u'\xf0\u0178\u2021\xb8', u'\U0001f1f8'),
    (u'\xf0\u0178\u2022\xb6', u'\U0001f576'),
    (u'\xf0\u0178\xa4\u201c', u'\U0001f913'),
    (u'\xf0\u0178\xa4\u201d', u'\U0001f914'),
    (u'\xf0\u0178\xa4\xa9', u'\U0001f929'),
    (u'\xf0\u0178\xa5\xba', u'\U0001f97a'),
    (u'\u00f0\u0178\u2018\u2030', u'\ud83d\udc49'),
    (u'\xf0\u0178\u2018\u2030', u'\ud83d\udc49'),
    (u'\ud83d\udc49', u'\U0001f449'),

    # Some old strings contain \t and \n, this should be removed. They have
    # been replaced by an empty string already and there's no way to
    # recover the old characters anyway.
    (u'\t', u''),
    (u'\n', u''),
    # Some old strings contain \xa0 which has been replaced inconsistently
    # by either &nbsp; or a space in the new strings. It is not possible to
    # recover these, so we drop all '\xa0's and change them to spaces.
    (u'\xa0', u' '),
]


def validate_rte_format(
    html_list: List[str], rte_format: str
) -> Dict[str, List[str]]:
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
    err_dict: Dict[str, List[str]] = {}

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
                    utils.unescape_html(collapsible['content-with-value']))
                soup_for_collapsible = bs4.BeautifulSoup(
                    content_html.replace('<br>', '<br/>'), 'html.parser')
                is_invalid = validate_soup_for_rte(
                    soup_for_collapsible, rte_format, err_dict)
            if is_invalid:
                err_dict['strings'].append(html_data)

        for tabs in soup.findAll(name='oppia-noninteractive-tabs'):
            tab_content_json = utils.unescape_html(tabs['tab_contents-with-value'])
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


def validate_soup_for_rte(
    soup: bs4.BeautifulSoup, rte_format: str, err_dict: Dict[str, List[str]]
) -> bool:
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


def validate_customization_args(html_list: List[str]) -> Dict[str, List[str]]:
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
        soup = bs4.BeautifulSoup(html_string, 'html.parser')

        for tag_name in rich_text_component_tag_names:
            for tag in soup.findAll(name=tag_name):
                tags_to_original_html_strings[tag] = html_string

    for tag, html_string in tags_to_original_html_strings.items():
        err_msg_list = list(validate_customization_args_in_tag(tag))
        for err_msg in err_msg_list:
            if err_msg:
                if err_msg not in err_dict:
                    err_dict[err_msg] = [html_string]
                elif html_string not in err_dict[err_msg]:
                    err_dict[err_msg].append(html_string)

    return err_dict


def validate_customization_args_in_tag(tag: bs4.element.Tag) -> Iterator[str]:
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
        value_dict[attr] = json.loads(utils.unescape_html(attrs[attr]))

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
        yield str(e)


def validate_svg_filenames_in_math_rich_text(
    entity_type: str, entity_id: str, html_string: str
) -> List[str]:
    """Validates the SVG filenames for each math rich-text components and
    returns a list of all invalid math tags in the given HTML.

    Args:
        entity_type: str. The type of the entity.
        entity_id: str. The ID of the entity.
        html_string: str. The HTML string.

    Returns:
        list(str). A list of invalid math tags in the HTML string.
    """
    soup = bs4.BeautifulSoup(html_string, 'html.parser')
    error_list = []
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        math_content_dict = (
            json.loads(utils.unescape_html(
                math_tag['math_content-with-value'])))
        svg_filename = (
            objects.UnicodeString.normalize(math_content_dict['svg_filename']))
        if svg_filename == '':
            error_list.append(str(math_tag))
        else:
            fs = fs_services.GcsFileSystem(entity_type, entity_id)
            filepath = 'image/%s' % svg_filename
            if not fs.isfile(filepath):
                error_list.append(str(math_tag))
    return error_list


def validate_math_content_attribute_in_html(
    html_string: str
) -> List[Dict[str, str]]:
    """Validates the format of SVG filenames for each math rich-text components
    and returns a list of all invalid math tags in the given HTML.

    Args:
        html_string: str. The HTML string.

    Returns:
        list(dict(str, str)). A list of dicts each having the invalid tags in
        the HTML string and the corresponding exception raised.
    """
    soup = bs4.BeautifulSoup(html_string, 'html.parser')
    error_list = []
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        math_content_dict = (
            json.loads(utils.unescape_html(
                math_tag['math_content-with-value'])))
        try:
            components.Math.validate({
                'math_content-with-value': math_content_dict
            })
        except utils.ValidationError as e:
            error_list.append({
                'invalid_tag': str(math_tag),
                'error': str(e)
            })
    return error_list


def does_svg_tag_contains_xmlns_attribute(
    svg_string: Union[str, bytes]
) -> bool:
    """Checks whether the svg tag in the given svg string contains the xmlns
    attribute.

    Args:
        svg_string: str|bytes. The SVG string.

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


def get_invalid_svg_tags_and_attrs(
    svg_string: Union[str, bytes]
) -> Tuple[List[str], List[str]]:
    """Returns a set of all invalid tags and attributes for the provided SVG.

    Args:
        svg_string: str|bytes. The SVG string.

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
        if element.name.lower() in constants.SVG_ATTRS_ALLOWLIST:
            for attr in element.attrs:
                if attr.lower() not in (
                        constants.SVG_ATTRS_ALLOWLIST[element.name.lower()]):
                    invalid_attrs.append('%s:%s' % (element.name, attr))
        else:
            invalid_elements.append(element.name)
    return (invalid_elements, invalid_attrs)


def check_for_svgdiagram_component_in_html(html_string: str) -> bool:
    """Checks for existence of SvgDiagram component tags inside an HTML string.

    Args:
        html_string: str. HTML string to check.

    Returns:
        bool. Whether the given HTML string contains SvgDiagram component tag.
    """
    soup = bs4.BeautifulSoup(html_string, 'html.parser')
    svgdiagram_tags = soup.findAll(name='oppia-noninteractive-svgdiagram')
    return bool(svgdiagram_tags)


def extract_svg_filenames_in_math_rte_components(html_string: str) -> List[str]:
    """Extracts the svg_filenames from all the math-rich text components in
    an HTML string.

    Args:
        html_string: str. The HTML string.

    Returns:
        list(str). A list of svg_filenames present in the HTML.
    """

    soup = bs4.BeautifulSoup(html_string, 'html.parser')
    filenames = []
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        math_content_dict = (
            json.loads(utils.unescape_html(
                math_tag['math_content-with-value'])))
        svg_filename = math_content_dict['svg_filename']
        if svg_filename != '':
            normalized_svg_filename = (
                objects.UnicodeString.normalize(svg_filename))
            filenames.append(normalized_svg_filename)
    return filenames


def add_math_content_to_math_rte_components(html_string: str) -> str:
    """Replaces the attribute raw_latex-with-value in all Math component tags
    with a new attribute math_content-with-value. The new attribute has an
    additional field for storing SVG filenames. The field for SVG filename will
    be an empty string.

    Args:
        html_string: str. HTML string to modify.

    Returns:
        str. Updated HTML string with all Math component tags having the new
        attribute.

    Raises:
        Exception. Invalid latex string found while parsing the given
            HTML string.
    """
    soup = bs4.BeautifulSoup(html_string, 'html.parser')
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
                    json.loads(utils.unescape_html(math_tag['raw_latex-with-value'])))
                normalized_raw_latex = (
                    objects.UnicodeString.normalize(raw_latex))
            except Exception as e:
                logging.exception(
                    'Invalid raw_latex string found in the math tag : %s' % (
                        str(e)
                    )
                )
                raise e
            if math_tag.has_attr('svg_filename-with-value'):
                svg_filename = json.loads(utils.unescape_html(
                        math_tag['svg_filename-with-value']))
                normalized_svg_filename = (
                    objects.UnicodeString.normalize(svg_filename))
                math_content_dict = {
                    'raw_latex': normalized_raw_latex,
                    'svg_filename': normalized_svg_filename
                }
                del math_tag['svg_filename-with-value']
            else:
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
                utils.escape_html(
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
    return str(soup).replace('<br/>', '<br>')


def validate_math_tags_in_html(html_string: str) -> List[str]:
    """Returns a list of all invalid math tags in the given HTML.

    Args:
        html_string: str. The HTML string.

    Returns:
        list(str). A list of invalid math tags in the HTML string.
    """

    soup = bs4.BeautifulSoup(html_string, 'html.parser')
    error_list = []
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        if math_tag.has_attr('raw_latex-with-value'):
            try:
                # The raw_latex attribute value should be enclosed in
                # double quotes(&amp;quot;) and should be a valid unicode
                # string.
                raw_latex = (
                    json.loads(utils.unescape_html(
                        math_tag['raw_latex-with-value'])))
                objects.UnicodeString.normalize(raw_latex)
            except Exception:
                error_list.append(math_tag)
        else:
            error_list.append(math_tag)
    return error_list


def validate_math_tags_in_html_with_attribute_math_content(
    html_string: str
) -> List[str]:
    """Returns a list of all invalid new schema math tags in the given HTML.
    The old schema has the attribute raw_latex-with-value while the new schema
    has the attribute math-content-with-value which includes a field for storing
    reference to SVGs.

    Args:
        html_string: str. The HTML string.

    Returns:
        list(str). A list of invalid math tags in the HTML string.
    """

    soup = bs4.BeautifulSoup(html_string, 'html.parser')
    error_list = []
    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        if math_tag.has_attr('math_content-with-value'):
            try:
                math_content_dict = (
                    json.loads(utils.unescape_html(
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


def is_parsable_as_xml(xml_string: bytes) -> bool:
    """Checks if input string is parsable as XML.

    Args:
        xml_string: bytes. The XML string in bytes.

    Returns:
        bool. Whether xml_string is parsable as XML or not.
    """
    if not isinstance(xml_string, bytes):
        return False
    try:
        defusedxml.ElementTree.fromstring(xml_string)
        return True
    except defusedxml.ElementTree.ParseError:
        return False


def convert_svg_diagram_to_image_for_soup(
    soup_context: bs4.BeautifulSoup
) -> str:
    """"Renames oppia-noninteractive-svgdiagram tag to
    oppia-noninteractive-image and changes corresponding attributes for a given
    soup context.

    Args:
        soup_context: bs4.BeautifulSoup. The bs4 soup context.

    Returns:
        str. The updated html string.
    """
    for svg_image in soup_context.findAll(
            name='oppia-noninteractive-svgdiagram'):
        svg_filepath = svg_image['svg_filename-with-value']
        del svg_image['svg_filename-with-value']
        svg_image['filepath-with-value'] = svg_filepath
        svg_image['caption-with-value'] = utils.escape_html('""')
        svg_image.name = 'oppia-noninteractive-image'
    return str(soup_context)


def convert_svg_diagram_tags_to_image_tags(html_string: str) -> str:
    """Renames all the oppia-noninteractive-svgdiagram on the server to
    oppia-noninteractive-image and changes corresponding attributes.

    Args:
        html_string: str. The HTML string to check.

    Returns:
        str. The updated html string.
    """
    return str(
        _process_string_with_components(
            html_string,
            convert_svg_diagram_to_image_for_soup
        )
    )


def _replace_incorrectly_encoded_chars(soup_context: bs4.BeautifulSoup) -> str:
    """Replaces incorrectly encoded character with the correct one in a given
    HTML string.

    Args:
        soup_context: bs4.BeautifulSoup. The bs4 soup context.

    Returns:
        str. The updated html string.
    """
    html_string = str(soup_context)
    char_mapping_tuples = CHAR_MAPPINGS + [
        # Replace 'spaces' with space characters, otherwise we can't do a
        # canonical comparison.
        (u'&nbsp;', u' '),
    ]
    for bad_char, good_char in char_mapping_tuples:
        html_string = html_string.replace(bad_char, good_char)
    return html_string


def fix_incorrectly_encoded_chars(html_string: str) -> str:
    """Replaces incorrectly encoded character with the correct one in a given
    HTML string.

    Args:
        html_string: str. The HTML string to modify.

    Returns:
        str. The updated html string.
    """
    return str(
        _process_string_with_components(
            html_string,
            _replace_incorrectly_encoded_chars
        )
    )


def _process_string_with_components(
    html_string: str, conversion_fn: Callable[[bs4.BeautifulSoup], str]
) -> str:
    """Executes the provided conversion function after parsing complex RTE
    components.

    Args:
        html_string: str. The HTML string to modify.
        conversion_fn: function. The conversion function to be applied on
            the HTML.

    Returns:
        str. The updated html string.
    """
    soup = bs4.BeautifulSoup(
        html_string.encode(encoding='utf-8'), 'html.parser')

    for collapsible in soup.findAll(
            name='oppia-noninteractive-collapsible'):
        if 'content-with-value' in collapsible.attrs:
            content_html = json.loads(
                utils.unescape_html(collapsible['content-with-value']))
            soup_for_collapsible = bs4.BeautifulSoup(
                content_html.replace('<br>', '<br/>'), 'html.parser')
            collapsible['content-with-value'] = utils.escape_html(
                json.dumps(conversion_fn(
                    soup_for_collapsible
                ).replace('<br/>', '<br>')))

    for tabs in soup.findAll(name='oppia-noninteractive-tabs'):
        tab_content_json = utils.unescape_html(tabs['tab_contents-with-value'])
        tab_content_list = json.loads(tab_content_json)
        for tab_content in tab_content_list:
            content_html = tab_content['content']
            soup_for_tabs = bs4.BeautifulSoup(
                content_html.replace('<br>', '<br/>'), 'html.parser')
            tab_content['content'] = (
                conversion_fn(soup_for_tabs).replace(
                    '<br/>', '<br>'))
        tabs['tab_contents-with-value'] = utils.escape_html(
            json.dumps(tab_content_list))

    return conversion_fn(soup)
