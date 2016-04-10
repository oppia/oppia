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
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from extensions.rich_text_components import base


NONNEGATIVE_INT_SCHEMA = {
    'type': 'int',
    'validators': [{
        'id': 'is_at_least',
        'min_value': 0
    }],
}


class Video(base.BaseRichTextComponent):
    """A rich-text component representing a YouTube video."""

    name = 'Video'
    category = 'Basic Input'
    description = 'A YouTube video.'
    frontend_name = 'video'
    tooltip = 'Insert video'
    is_block_element = True

    _customization_arg_specs = [{
        'name': 'video_id',
        'description': (
            'The YouTube id for this video. This is the 11-character string '
            'after \'v=\' in the video URL.'),
        'schema': {
            'type': 'unicode',
        },
        'default_value': '',
    }, {
        'name': 'start',
        'description': (
            'Video start time in seconds: (leave at 0 to start at the '
            'beginning.)'),
        'schema': NONNEGATIVE_INT_SCHEMA,
        'default_value': 0
    }, {
        'name': 'end',
        'description': (
            'Video end time in seconds: (leave at 0 to play until the end.)'),
        'schema': NONNEGATIVE_INT_SCHEMA,
        'default_value': 0
    }, {
        'name': 'autoplay',
        'description': (
            'Autoplay this video once the question has loaded?'),
        'schema': {
            'type': 'bool'
        },
        'default_value': False,
    }]

    @property
    def preview_url_template(self):
        return 'https://img.youtube.com/vi/<[video_id]>/hqdefault.jpg'
