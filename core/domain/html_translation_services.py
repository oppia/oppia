# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Services for HTML pre-processing and post-processing for machine
translation.
"""

from __future__ import annotations

import html as html_module
import json
import re

from core.domain import html_cleaner

import bs4
from typing import Dict, cast

# TODO(#24933): Oppia-noninteractive-skillreview is excluded because
# its displayed value is tied to backend mappings. Rohan is working on
# a project to translate Exploration metadata that will eventually
# cover these keywords. Once that project is complete, this component
# can be updated to support translation.
# See: https://github.com/oppia/oppia/issues/24933
#
# Components whose content must never be translated. Their attributes are
# either technical identifiers, LaTeX expressions, or backend-mapped values.
_SKIP_COMPONENTS = frozenset(
    [
        'oppia-noninteractive-math',
        'oppia-noninteractive-video',
        'oppia-noninteractive-skillreview',
    ]
)

# Maps each component to the attribute names that hold plain learner-visible
# text. These values are extracted before translation and restored after.
_TRANSLATABLE_TEXT_ATTRS = {
    'oppia-noninteractive-link': ['text-with-value'],
    'oppia-noninteractive-image': ['alt-with-value', 'caption-with-value'],
    'oppia-noninteractive-collapsible': ['heading-with-value'],
    'oppia-noninteractive-workedexample': ['question-with-value'],
}

# Maps each component to the attribute names that hold HTML-encoded strings.
# These must be decoded, recursively pre-processed, then re-encoded on
# the way back.
_ENCODED_HTML_ATTRS = {
    'oppia-noninteractive-collapsible': ['content-with-value'],
    'oppia-noninteractive-workedexample': ['answer-with-value'],
}

# Data attribute names used to link extraction elements back to their
# parent component during post-processing.
_DATA_COMP_ID = 'data-oi-id'
_DATA_ATTR_NAME = 'data-oi-attr'
_DATA_IS_ENCODED = 'data-oi-encoded'
_DATA_TAB_COUNT = 'data-oi-tab-count'

# Regexes to strip all helper attributes injected during pre-processing.
_CLEANUP_PATTERNS = [
    re.compile(r'\s*translate=["\']no["\']', re.IGNORECASE),
    re.compile(r'\s*data-oi-id=["\'][^"\']*["\']', re.IGNORECASE),
    re.compile(r'\s*data-oi-attr=["\'][^"\']*["\']', re.IGNORECASE),
    re.compile(r'\s*data-oi-encoded=["\'][^"\']*["\']', re.IGNORECASE),
    re.compile(r'\s*data-oi-tab-count=["\'][^"\']*["\']', re.IGNORECASE),
]


def protect_html_for_translation(source_html: str) -> str:
    """Pre-processes HTML to protect Oppia components from the translation
    engine while exposing translatable attribute values as inline elements.

    Strategy per component type:
    - Skip components (math, video, skillreview): marked with translate="no",
      their entire subtree is skipped by the API.
    - Components with translatable text attributes (link, image, collapsible,
      workedexample): each translatable attribute value is extracted into a
      temporary <span> inserted before the component, and the attribute is
      removed from the component tag itself. The component receives
      translate="no" so only its structural attributes are preserved.
    - Components with encoded HTML attributes (collapsible content,
      workedexample answer): decoded, recursively pre-processed, and
      placed in a temporary <div> before the component. Re-encoded on
      the way back in post-processing.
    - Tabs: the JSON tab_contents array is unpacked into individual temporary
      <span> (titles) and <div> (content) elements, one per tab.

    Note: <a> tags are intentionally left untouched. The Azure API natively
    translates anchor text while preserving the href attribute byte-for-byte
    when using textType="html".

    Args:
        source_html: str. The raw HTML string to pre-process.

    Returns:
        str. The modified HTML string ready to be sent to the translation API.
    """
    if not source_html or not source_html.strip():
        return source_html

    soup = bs4.BeautifulSoup(source_html, 'html.parser')
    counter = [0]

    def _next_id() -> str:
        """Returns the next unique component ID."""
        comp_id = str(counter[0])
        counter[0] += 1
        return comp_id

    for tag in soup.find_all(re.compile(r'^oppia-noninteractive-')):
        tag_name = tag.name

        if tag_name in _SKIP_COMPONENTS:
            if tag.get('translate') != 'no':
                tag['translate'] = 'no'
            continue

        comp_id = _next_id()

        # Extract simple text attributes into temp spans.
        if tag_name in _TRANSLATABLE_TEXT_ATTRS:
            for attr_name in _TRANSLATABLE_TEXT_ATTRS[tag_name]:
                attr_val = tag.get(attr_name)
                if attr_val is not None:
                    temp_span = soup.new_tag('span')
                    temp_span[_DATA_COMP_ID] = comp_id
                    temp_span[_DATA_ATTR_NAME] = attr_name
                    temp_span.string = attr_val
                    tag.insert_before(temp_span)
                    del tag[attr_name]

        # Extract encoded HTML attributes into temp divs.
        if tag_name in _ENCODED_HTML_ATTRS:
            for attr_name in _ENCODED_HTML_ATTRS[tag_name]:
                attr_val = tag.get(attr_name)
                if attr_val is not None:
                    decoded = html_module.unescape(attr_val)
                    protected_inner = protect_html_for_translation(decoded)
                    temp_div = soup.new_tag('div')
                    temp_div[_DATA_COMP_ID] = comp_id
                    temp_div[_DATA_ATTR_NAME] = attr_name
                    temp_div[_DATA_IS_ENCODED] = 'true'
                    inner_soup = bs4.BeautifulSoup(
                        protected_inner, 'html.parser'
                    )
                    for child in list(inner_soup.contents):
                        temp_div.append(child)
                    tag.insert_before(temp_div)
                    del tag[attr_name]

        # Unpack tabs JSON into individual temp elements.
        if tag_name == 'oppia-noninteractive-tabs':
            tabs_raw = tag.get('tab_contents-with-value')
            if tabs_raw is not None:
                try:
                    tabs = json.loads(tabs_raw)
                    for i, tab in enumerate(tabs):
                        if 'title' in tab:
                            temp_span = soup.new_tag('span')
                            temp_span[_DATA_COMP_ID] = comp_id
                            temp_span[_DATA_ATTR_NAME] = 'tab-title-%d' % i
                            temp_span.string = tab['title']
                            tag.insert_before(temp_span)
                        if 'content' in tab:
                            decoded = html_module.unescape(tab['content'])
                            protected_inner = protect_html_for_translation(
                                decoded
                            )
                            temp_div = soup.new_tag('div')
                            temp_div[_DATA_COMP_ID] = comp_id
                            temp_div[_DATA_ATTR_NAME] = 'tab-content-%d' % i
                            temp_div[_DATA_IS_ENCODED] = 'true'
                            inner_soup = bs4.BeautifulSoup(
                                protected_inner, 'html.parser'
                            )
                            for child in list(inner_soup.contents):
                                temp_div.append(child)
                            tag.insert_before(temp_div)
                    tag[_DATA_TAB_COUNT] = str(len(tabs))
                    del tag['tab_contents-with-value']
                except (json.JSONDecodeError, TypeError):
                    # If JSON parsing fails, protect the whole component.
                    if tag.get('translate') != 'no':
                        tag['translate'] = 'no'
                    continue

        tag[_DATA_COMP_ID] = comp_id
        if tag.get('translate') != 'no':
            tag['translate'] = 'no'

    # Here we use cast because BeautifulSoup's decode_contents() is typed as
    # returning Any in the bs4 stubs, but it always returns a str in practice.
    return cast(str, soup.decode_contents())


def postprocess_translated_html(translated_html: str) -> str:
    """Reverses protect_html_for_translation after the API call completes.

    Steps:
    1. Finds every temporary <span>/<div> by its data-oi-id and data-oi-attr.
    2. Restores plain text values directly to the component attribute.
    3. Re-encodes inner HTML and restores it to the component attribute.
    4. Reconstructs the tabs JSON from individual temp elements.
    5. Removes all temporary elements and helper data attributes.
    6. Strips any remaining translate="no" via regex.
    7. Runs the result through html_cleaner.clean() for final sanitization.

    Args:
        translated_html: str. The raw HTML returned by the translation API.

    Returns:
        str. The cleaned and restored HTML string safe for datastore storage.
    """
    if not translated_html:
        return translated_html

    soup = bs4.BeautifulSoup(translated_html, 'html.parser')

    # Build a map from component ID to its tag for fast restoration lookup.
    comp_id_to_tag = {}
    for tag in soup.find_all(attrs={_DATA_COMP_ID: True}):
        if tag.name and tag.name.startswith('oppia-noninteractive-'):
            comp_id_to_tag[tag.get(_DATA_COMP_ID)] = tag

    # Collect tabs data separately since reconstruction requires all tabs.
    tabs_data: Dict[str, Dict[str, str]] = {}

    for temp_tag in list(soup.find_all(attrs={_DATA_ATTR_NAME: True})):
        comp_id = temp_tag.get(_DATA_COMP_ID)
        attr_name = temp_tag.get(_DATA_ATTR_NAME)
        is_encoded = temp_tag.get(_DATA_IS_ENCODED) == 'true'
        component_tag = comp_id_to_tag.get(comp_id)

        if component_tag is None:
            temp_tag.decompose()
            continue

        # Collect tabs data for later JSON reconstruction.
        if attr_name and (
            attr_name.startswith('tab-title-')
            or attr_name.startswith('tab-content-')
        ):
            if comp_id not in tabs_data:
                tabs_data[comp_id] = {}
            if is_encoded:
                tabs_data[comp_id][attr_name] = postprocess_translated_html(
                    temp_tag.decode_contents()
                )
            else:
                tabs_data[comp_id][attr_name] = temp_tag.get_text()
            temp_tag.decompose()
            continue

        # Restore encoded HTML attributes.
        if is_encoded:
            inner_html = postprocess_translated_html(temp_tag.decode_contents())
            component_tag[attr_name] = inner_html
        else:
            # Restore plain text attributes.
            component_tag[attr_name] = temp_tag.get_text()

        temp_tag.decompose()

    # Reconstruct tabs JSON from collected data.
    for comp_id, tab_attr_data in tabs_data.items():
        component_tag = comp_id_to_tag.get(comp_id)
        assert component_tag is not None
        tab_count = int(component_tag.get(_DATA_TAB_COUNT, 0))
        tabs = []
        for i in range(tab_count):
            tab = {}
            title_val = tab_attr_data.get('tab-title-%d' % i)
            content_val = tab_attr_data.get('tab-content-%d' % i)
            if title_val is not None:
                tab['title'] = title_val
            if content_val is not None:
                tab['content'] = content_val
            tabs.append(tab)
        component_tag['tab_contents-with-value'] = json.dumps(
            tabs, ensure_ascii=False
        )
        if _DATA_TAB_COUNT in component_tag.attrs:
            del component_tag[_DATA_TAB_COUNT]

    # Remove the data-oi-id marker from all component tags.
    for tag in soup.find_all(attrs={_DATA_COMP_ID: True}):
        if _DATA_COMP_ID in tag.attrs:
            del tag[_DATA_COMP_ID]

    # Here we use cast because BeautifulSoup's decode_contents() returns Any
    # at the type-checking level, but we know it is always a string here.
    result = cast(str, soup.decode_contents())

    # Strip all temporary helper attributes using regex.
    for pattern in _CLEANUP_PATTERNS:
        result = pattern.sub('', result)

    # html_cleaner.clean() reparses and serializes HTML, which causes
    # entities inside the tab_contents-with-value JSON attribute to be
    # double-escaped. Nested tab content has already been recursively
    # postprocessed and cleaned, so return the result directly when tabs
    # are present.
    if 'tab_contents-with-value' in result:
        return result
    return html_cleaner.clean(result)
