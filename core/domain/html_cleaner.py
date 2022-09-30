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

from core import utils
from core.domain import rte_component_registry

import bleach
import bs4
from typing import Any, Dict, List
from typing_extensions import Final, TypedDict


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


def validate_rte_tags(
    html: str, is_tag_nested_inside_tabs_or_collapsible: bool = False
) -> None:
    """Validate all the RTE tags.

    Args:
        html: str. The RTE content of the state.
        is_tag_nested_inside_tabs_or_collapsible: bool. True when we
            validate tags inside `Tabs` or `Collapsible` tag.

    Raises:
        ValidationError. Image does not have alt-with-value attribute.
        ValidationError. Image alt-with-value attribute have less
            than 5 characters.
        ValidationError. Image does not have caption-with-value attribute.
        ValidationError. Image caption-with-value attribute have more
            than 500 characters.
        ValidationError. Image does not have filepath-with-value attribute.
        ValidationError. Image filepath-with-value attribute should not be
            empty.
        ValidationError. SkillReview does not have text-with-value attribute.
        ValidationError. SkillReview text-with-value attribute should not be
            empty.
        ValidationError. SkillReview does not have skill_id-with-value
            attribute.
        ValidationError. SkillReview skill_id-with-value attribute should not be
            empty.
        ValidationError. Video does not have start-with-value attribute.
        ValidationError. Video start-with-value attribute should not be empty.
        ValidationError. Video does not have end-with-value attribute.
        ValidationError. Video end-with-value attribute should not be empty.
        ValidationError. Start value is greater than end value.
        ValidationError. Video does not have autoplay-with-value attribute.
        ValidationError. Video autoplay-with-value attribute should be boolean.
        ValidationError. Video does not have video_id-with-value attribute.
        ValidationError. Link does not have text-with-value attribute.
        ValidationError. Link text-with-value attribute should not be empty.
        ValidationError. Link does not have url-with-value attribute.
        ValidationError. Link url-with-value attribute should not be empty.
        ValidationError. Math does not have math_content-with-value attribute.
        ValidationError. Math math_content-with-value attribute should not be
            empty.
        ValidationError. Math does not have raw_latex-with-value attribute.
        ValidationError. Math raw_latex-with-value attribute should not be
            empty.
        ValidationError. Math does not have svg_filename-with-value attribute.
        ValidationError. Math svg_filename-with-value attribute should not be
            empty.
        ValidationError. Math svg_filename attribute does not have svg
            extension.
        ValidationError. Tabs tag present inside another tabs or collapsible.
        ValidationError. Collapsible tag present inside tabs or another
            collapsible.
    """
    soup = bs4.BeautifulSoup(html, 'html.parser')
    empty_values = ['&quot;&quot;', '', '\'\'', '\"\"']

    for tag in soup.find_all('oppia-noninteractive-image'):
        if not tag.has_attr('alt-with-value'):
            raise utils.ValidationError(
                'Image tag does not have \'alt-with-value\' attribute.'
            )

        alt_value = utils.unescape_html(
            tag['alt-with-value'])[1:-1].replace('\\"', '')
        if len(alt_value.strip()) < 5:
            raise utils.ValidationError(
                'The length of the image tag \'alt-with-value\' '
                'attribute value should be at least 5 characters.'
            )

        if not tag.has_attr('caption-with-value'):
            raise utils.ValidationError(
                'Image tag does not have \'caption-with-value\' attribute.'
            )

        caption_value = utils.unescape_html(
                tag['caption-with-value'])[1:-1].replace('\\"', '')
        if len(caption_value.strip()) > 500:
            raise utils.ValidationError(
                'Image tag \'caption-with-value\' attribute should not '
                'be greater than 500 characters.'
            )

        if not tag.has_attr('filepath-with-value'):
            raise utils.ValidationError(
                'Image tag does not have \'filepath-with-value\' attribute.'
            )

        filepath_value = utils.unescape_html(
                tag['filepath-with-value'])[1:-1].replace('\\"', '')
        if filepath_value.strip() in empty_values:
            raise utils.ValidationError(
                'Image tag \'filepath-with-value\' attribute should not '
                'be empty.'
            )

    for tag in soup.find_all('oppia-noninteractive-skillreview'):
        if not tag.has_attr('text-with-value'):
            raise utils.ValidationError(
                'SkillReview tag does not have \'text-with-value\' '
                'attribute.'
            )

        text_value = utils.unescape_html(
                tag['text-with-value'])[1:-1].replace('\\"', '')
        if text_value.strip() in empty_values:
            raise utils.ValidationError(
                'SkillReview tag should not have \'text-with-value\' '
                'attribute value as empty string.'
            )

        if not tag.has_attr('skill_id-with-value'):
            raise utils.ValidationError(
                'SkillReview tag does not have \'skill_id-with-value\' '
                'attribute.'
            )

        skill_value = utils.unescape_html(
                tag['skill_id-with-value'])[1:-1].replace('\\"', '')
        if skill_value.strip() in empty_values:
            raise utils.ValidationError(
                'SkillReview tag should not have '
                '\'skill_id-with-value\' attribute value as empty string.'
            )

    for tag in soup.find_all('oppia-noninteractive-video'):
        if not tag.has_attr('start-with-value'):
            raise utils.ValidationError(
                'Video tag does not have \'start-with-value\' '
                'attribute.'
            )

        if tag['start-with-value'].strip() in empty_values:
            raise utils.ValidationError(
                'Video tag \'start-with-value\' attribute should not '
                'be empty.'
            )

        if not tag.has_attr('end-with-value'):
            raise utils.ValidationError(
                'Video tag does not have \'end-with-value\' '
                'attribute.'
            )

        if tag['end-with-value'].strip() in empty_values:
            raise utils.ValidationError(
                'Video tag \'end-with-value\' attribute should not '
                'be empty.'
            )

        start_value = float(tag['start-with-value'].strip())
        end_value = float(tag['end-with-value'].strip())
        if start_value > end_value and start_value != 0.0 and end_value != 0.0:
            raise utils.ValidationError(
                'Start value should not be greater than End value in Video tag.'
            )

        if not tag.has_attr('autoplay-with-value'):
            raise utils.ValidationError(
                'Video tag does not have \'autoplay-with-value\' '
                'attribute.'
            )

        if tag['autoplay-with-value'].strip() not in (
            'true', 'false', '\'true\'', '\'false\'',
            '\"true\"', '\"false\"', True, False
        ):
            raise utils.ValidationError(
                'Video tag \'autoplay-with-value\' attribute should be '
                'a boolean value.'
            )

        if not tag.has_attr('video_id-with-value'):
            raise utils.ValidationError(
                'Video tag does not have \'video_id-with-value\' '
                'attribute.'
            )

        video_id_value = utils.unescape_html(
                tag['video_id-with-value'])[1:-1].replace('\\"', '')
        if video_id_value.strip() in empty_values:
            raise utils.ValidationError(
                'Video tag \'video_id-with-value\' attribute should not '
                'be empty.'
            )

    for tag in soup.find_all('oppia-noninteractive-link'):
        if not tag.has_attr('text-with-value'):
            raise utils.ValidationError(
                'Link tag does not have \'text-with-value\' '
                'attribute.'
            )

        text_value = utils.unescape_html(
                tag['text-with-value'])[1:-1].replace('\\"', '')
        if text_value.strip() in empty_values:
            raise utils.ValidationError(
                'Link tag \'text-with-value\' attribute should not '
                'be empty.'
            )

        if not tag.has_attr('url-with-value'):
            raise utils.ValidationError(
                'Link tag does not have \'url-with-value\' '
                'attribute.'
            )

        url_value = utils.unescape_html(
                tag['url-with-value'])[1:-1].replace('\\"', '')
        if url_value.strip() in empty_values:
            raise utils.ValidationError(
                'Link tag \'url-with-value\' attribute should not '
                'be empty.'
            )

    for tag in soup.find_all('oppia-noninteractive-math'):
        if not tag.has_attr('math_content-with-value'):
            raise utils.ValidationError(
                'Math tag does not have \'math_content-with-value\' '
                'attribute.'
            )

        if tag['math_content-with-value'].strip() in empty_values:
            raise utils.ValidationError(
                'Math tag \'math_content-with-value\' attribute should not '
                'be empty.'
            )

        math_content_json = utils.unescape_html(tag['math_content-with-value'])
        math_content_list = json.loads(math_content_json)
        if 'raw_latex' not in math_content_list:
            raise utils.ValidationError(
                'Math tag does not have \'raw_latex-with-value\' '
                'attribute.'
            )

        if math_content_list['raw_latex'].strip() in empty_values:
            raise utils.ValidationError(
                'Math tag \'raw_latex-with-value\' attribute should not '
                'be empty.'
            )

        if 'svg_filename' not in math_content_list:
            raise utils.ValidationError(
                'Math tag does not have \'svg_filename-with-value\' '
                'attribute.'
            )

        if math_content_list['svg_filename'].strip() in empty_values:
            raise utils.ValidationError(
                'Math tag \'svg_filename-with-value\' attribute should not '
                'be empty.'
            )

        if math_content_list['svg_filename'].strip()[-4:] != '.svg':
            raise utils.ValidationError(
                'Math tag \'svg_filename-with-value\' attribute should '
                'have svg extension.'
            )

    if is_tag_nested_inside_tabs_or_collapsible:
        tabs_tags = soup.find_all('oppia-noninteractive-tabs')
        if len(tabs_tags) > 0:
            raise utils.ValidationError(
                'Tabs tag should not be present inside another '
                'Tabs or Collapsible tag.'
            )

        collapsible_tags = soup.find_all('oppia-noninteractive-collapsible')
        if len(collapsible_tags) > 0:
            raise utils.ValidationError(
                'Collapsible tag should not be present inside another '
                'Tabs or Collapsible tag.'
            )


def validate_tabs_and_collapsible_rte_tags(html: str) -> None:
    """Validates `Tabs` and `Collapsible` RTE tags

    Args:
        html: str. The RTE content of the state.

    Raises:
        ValidationError. No tabs present inside the tab_contents attribute.
        ValidationError. No title present inside the tab_contents attribute.
        ValidationError. Title inside the tag is empty.
        ValidationError. No content present inside the tab_contents attribute.
        ValidationError. Content inside the tag is empty.
        ValidationError. No content attributes present inside the tabs tag.
        ValidationError. No collapsible content is present inside the tag.
        ValidationError. Collapsible content-with-value attribute is not
            present.
        ValidationError. Collapsible heading-with-value attribute is not
            present.
        ValidationError. Collapsible heading-with-value attribute is empty.
    """
    soup = bs4.BeautifulSoup(html, 'html.parser')
    empty_values = ['&quot;&quot;', '', '\'\'', '\"\"', '<p></p>']

    tabs_tags = soup.find_all('oppia-noninteractive-tabs')
    for tag in tabs_tags:
        if tag.has_attr('tab_contents-with-value'):
            tab_content_json = utils.unescape_html(
                tag['tab_contents-with-value'])
            tab_content_list = json.loads(tab_content_json)
            if len(tab_content_list) == 0:
                raise utils.ValidationError(
                    'No tabs are present inside the tabs tag.'
                )

            for tab_content in tab_content_list:
                if 'title' not in tab_content:
                    raise utils.ValidationError(
                        'No title attribute is present inside the tabs tag.'
                    )

                if tab_content['title'].strip() in empty_values:
                    raise utils.ValidationError(
                        'Title present inside tabs tag is empty.'
                    )

                if 'content' not in tab_content:
                    raise utils.ValidationError(
                        'No content attribute is present inside the tabs tag.'
                    )

                if tab_content['content'].strip() in empty_values:
                    raise utils.ValidationError(
                        'Content present inside tabs tag is empty.'
                    )

                validate_rte_tags(
                    tab_content['content'],
                    is_tag_nested_inside_tabs_or_collapsible=True
                )
        else:
            raise utils.ValidationError(
                'No content attribute is present inside the tabs tag.'
            )

    collapsibles_tags = soup.find_all('oppia-noninteractive-collapsible')
    for tag in collapsibles_tags:
        if tag.has_attr('content-with-value'):
            collapsible_content_json = (
                utils.unescape_html(tag['content-with-value'])
            )

            collapsible_content = json.loads(
                collapsible_content_json).replace('\\"', '')
            if collapsible_content.strip() in empty_values:
                raise utils.ValidationError(
                    'No collapsible content is present inside the tag.'
                )

            validate_rte_tags(
                collapsible_content,
                is_tag_nested_inside_tabs_or_collapsible=True
            )
        else:
            raise utils.ValidationError(
                'No content attribute present in collapsible tag.'
            )

        if tag.has_attr('heading-with-value'):
            collapsible_heading_json = (
                utils.unescape_html(tag['heading-with-value'])
            )
            collapsible_heading_list = json.loads(
                collapsible_heading_json).replace('\\"', '')
            if collapsible_heading_list.strip() in empty_values:
                raise utils.ValidationError(
                    'Heading attribute inside the collapsible tag is empty.'
                )
        else:
            raise utils.ValidationError(
                'No heading attribute present in collapsible tag.'
            )
