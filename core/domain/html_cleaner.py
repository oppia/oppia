# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

import bleach
from core.domain import widget_registry
import feconf
import logging
import urlparse


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
    oppia_custom_tags = widget_registry.Registry.get_tag_list_with_attrs(
        feconf.NONINTERACTIVE_PREFIX)

    core_tags = ATTRS_WHITELIST.copy()
    core_tags.update(oppia_custom_tags)
    tag_names = core_tags.keys()

    # TODO(sll): Alert the caller if the input was changed due to this call.
    # TODO(sll): Add a log message if bad HTML is detected.
    return bleach.clean(
        user_submitted_html, tags=tag_names, attributes=core_tags, strip=True)
