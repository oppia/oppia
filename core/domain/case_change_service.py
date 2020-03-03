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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

SNAKE_CASE_RE = re.compile(r'([^\-_\s])[\-_\s]+([^\-_\s])')

def camelize_string(string):
    '''
    Camelizes the string
    '''
    s = str(string)

    return ''.join([
        s[0].lower() if not s[:2].isupper() else s[0],
        SNAKE_CASE_RE.sub(lambda m: m.group(1) + m.group(2).upper(), s[1:]),
    ])

def camelize(obj):
    '''
    Camelizes the keys, values of the object
    '''
    if isinstance(obj, dict):
        return {camelize_string(k): camelize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [camelize(v) for v in obj]
    
    return obj
