# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Service for changing the case of string or dict to camelCase"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re


def camelize_string(string):
    """Changes the case of string from snake_case to camelCase.

    Args:
        string: str. The string whose case is to changed to camelCase
        from snake_case.

    Returns:
        The string after changing the case of input string to camelCase.
    """

    snake_case_re = re.compile(r'([^\-_\s])[\-_\s]+([^\-_\s])')

    return ''.join([
        string[0].lower() if not string[:2].isupper() else string[0],
        snake_case_re.sub(
            lambda m: m.group(1) + m.group(2).upper(), string[1:]),
    ])


def camelize(obj):
    """Changes the case of the keys of dict from snake_case to camelCase.

    Args:
        obj: dict or list of dicts. If the object is a dict it changes
        the case of it's dicts else if it is a list it iterates over all
        the items in the list and changes the case of keys to camelCase
        if it finds another dict. However, if the object is neither a dict nor
        a list it returns the object.

    Returns:
        The object after changing the case of keys in the dictionaries
        in the object to camelCase.
    """

    if isinstance(obj, dict):
        return {camelize_string(k): camelize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [camelize(v) for v in obj]

    return obj
