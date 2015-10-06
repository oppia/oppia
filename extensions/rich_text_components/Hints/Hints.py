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


HINT_CONTENT_SCHEMA = {
    'type': 'dict',
    'properties': [{
        'name': 'content',
        'description': 'Hint',
        'schema': {
            'type': 'html',
            'ui_config': {
                'hide_complex_extensions': True,
            }

        }
    }]
}


class Hints(base.BaseRichTextComponent):
    """A rich-text component representing a series of hints."""

    name = 'Hints'
    category = 'Basic Input'
    description = 'A series of hints.'
    frontend_name = 'hints'
    tooltip = 'Insert hints'
    is_complex = True

    _customization_arg_specs = [{
        'name': 'hint_contents',
        'description': 'Add hints to help the learner',
        'schema': {
            'type': 'list',
            'items': HINT_CONTENT_SCHEMA,
            'ui_config': {
                'add_element_text': 'Add new hint'
            }
        },
        'default_value': [{
            'content': 'This is a first hint.'
        }],
    }]

    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAA'
        'ABGdBTUEAAK/INwWK6QAAABl0RVh0%0AU29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZ'
        'TwAAAHWSURBVDjLzZPdS1NxGMf3L3TbXV5EEN50%0A30UJpTdClBBKSgh2Y5cyW0QXISY'
        '2eiGxklYgGoaE2YtFdTjHvZyO25i6uReOuRc3T7TNnOFOw8bH%0As2MmZUEQRRefm9%2B'
        'P74fn9zzPzwJY/gTLPxUsjB04Hh06ifq4i%2Bm7R5jp29/82%2BHFiT2NmmBlZfYp%0Af'
        'MrwcXYU%2BUrte/PS4XDUGLw14Gc8G%2B4gF7pIaXEcTeylGHzEl4SL4L02fUsQ9vtl0m'
        'nVJJOpML9J%0AbITl0AXKRRfFd%2B3kp84SGWwlMHC6PHXj2N4twYd4PIzH40KSJBOn04'
        'lX6GM5eI6yLrM234KeamI1%0AbCNxv54HA/bStyZuCiIoimwG3W430lgvmtf6NdyMnmyk'
        'EDqPeqsOLSJWnqZ/J0gmY/h8XmRZZnL8%0AKuEXHUbZk%2BjxVj6nTrFiVKL21zLnFclm'
        'MzsFqZRKIODn5VA3c89tzExcI600sBZvIj/dSex2vRmO%0ARiPkctq2oNJlQXhlHC6Rzy'
        '/xsKcGVhNE75xAsO3GbZTssR8lu%2BCjUMga5ExEUTAnZPlxZJfaqinJ%0ANykp11G6Dj'
        'FyporB/h5%2BNeIdC9NwcJfe3bJv/c3luvXX9sPSE2t11f/zF/6KYAOj9QWRU1s5XQAA%'
        '0AAABJRU5ErkJggg%3D%3D%0A'
    )
