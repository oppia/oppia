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


class VideoMp4(base.BaseRichTextComponent):
    """A rich-text component representing an MP4 video."""

    name = 'MP4 Video'
    category = 'Basic Input'
    description = 'A link to an MP4 video.'
    frontend_name = 'video-mp4'
    tooltip = 'Insert MP4 video'

    _customization_arg_specs = [{
        'name': 'video_url',
        'description': 'The URL for this video.',
        'schema': {
            'type': 'unicode',
        },
        'default_value': '',
    }]
