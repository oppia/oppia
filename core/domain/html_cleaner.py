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

# TODO(sll): Get this directly from the widget definitions.
OPPIA_CUSTOM_TAGS = {
    'oppia-noninteractive-image': ['filepath-with-value'],
    'oppia-noninteractive-video': ['video_id-with-value'],
    'oppia-noninteractive-hints': [
        'low_hint-with-value', 'medium_hint-with-value',
        'high_hint-with-value', 'hint_placeholder-with-value'
    ]
}

ALLOWED_TAGS = [
    'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'hr', 'i', 'li', 'ol',
    'p', 'span', 'strong', 'table', 'tbody', 'td', 'tr', 'u', 'ul'
]

TAG_WHITELIST = ALLOWED_TAGS + OPPIA_CUSTOM_TAGS.keys()
ATTRS_WHITELIST = {
    'a': ['href', 'title', 'target'],
    'table': ['border'],
}
ATTRS_WHITELIST.update(OPPIA_CUSTOM_TAGS)


def clean(user_submitted_html):
    """Cleans a piece of user submitted HTML.

    This only allows HTML from a restricted set of tags, attrs and styles. It
    strips out unrecognized tags.
    """
    # TODO(sll): Alert the caller if the input was changed due to this call.
    # TODO(sll): Add a log message if bad HTML is detected.
    return bleach.clean(
        user_submitted_html, tags=TAG_WHITELIST,
        attributes=ATTRS_WHITELIST, strip=True)
