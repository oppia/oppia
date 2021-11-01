# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""This is a sample file for testing unicode and str characters.
Unless the strings are explicitly wrapped with b'', they would denote unicode,
otherwise str.
"""

from __future__ import annotations

import os
import sys


# This will be read as unicode.
SOME_STR_TEXT = 'example text'

# This will be read as unicode.
SOME_UNICODE_TEXT = u'Лорем'

# This will be read as str.
SOME_BINARY_TEXT = b'example_binary_text'
