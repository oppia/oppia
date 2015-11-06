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


class Image(base.BaseRichTextComponent):
    """A rich-text component representing an inline image."""

    name = 'Image'
    category = 'Basic Input'
    description = 'An image.'
    frontend_name = 'image'
    tooltip = 'Insert image'

    _customization_arg_specs = [{
        'name': 'filepath',
        'description': (
            'The name of the image file. (Allowed extensions: gif, jpeg, jpg, '
            'png.)'),
        'schema': {
            'type': 'custom',
            'obj_type': 'Filepath',
        },
        'default_value': '',
    }, {
        'name': 'alt',
        'description': 'Alternative text (for screen readers)',
        'schema': {
            'type': 'unicode',
        },
        'default_value': '',
    }]

    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAA'
        'ABGdBTUEAAK/INwWK6QAAABl0RVh0%0AU29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZ'
        'TwAAAHwSURBVDjLpZM9a1RBFIafM/fevfcmC7uQ%0AjWEjUZKAYBHEVEb/gIWFjVVSWEj'
        '6gI0/wt8gprPQykIsTP5BQLAIhBVBzRf52Gw22bk7c8YiZslu%0AgggZppuZ55z3nfdIC'
        'IHrrBhg%2BePaa1WZPyk0s%2B6KWwM1khiyhDcvns4uxQAaZOHJo4nRLMtEJPpn%0AxY6'
        'Cd10%2BfNl4DpwBTqymaZrJ8uoBHfZoyTqTYzvkSRMXlP2jnG8bFYbCXWJGePlsEq8iPQ'
        'mFA2Mi%0AjEBhtpis7ZCWftC0LZx3xGnK1ESd741hqqUaqgMeAChgjGDDLqXkgMPTJtZ3'
        'KJzDhTZpmtK2OSO5%0AIRB6xvQDRAhOsb5Lx1lOu5ZCHV4B6RLUExvh4s%2BZntHhDJAx'
        'Sqs9TCDBqsc6j0iJdqtMuTROFBkI%0AcllCCGcSytFNfm1tU8k2GRo2pOI43h9ie6tOvT'
        'JFbORyDsJFQHKD8fw%2BP9dWqJZ/I96TdEa5Nb1A%0AOavjVfti0dfB%2Bt4iXhWvyh27'
        'y9zEbRRobG7z6fgVeqSoKvB5oIMQEODx7FLvIJo55KS9R7b5ldrD%0AReajpC%2BZ5z7G'
        'AHJFXn1exedVbG36ijwOmJgl0kS7lXtjD0DkLyqc70uPnSuIIwk9QCmWd%2B9XGnOF%0A'
        'DzP/M5xxBInhLYBcd5z/AAZv2pOvFcS/AAAAAElFTkSuQmCC%0A'
    )
