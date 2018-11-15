# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

# pylint: disable=invalid-name

"""Loads constants for backend use."""

import json
import os


def parse_json_from_js(js_file):
    """Extracts JSON object from JS file."""
    text = js_file.read()
    first_bracket_index = text.find('= {')
    last_bracket_index = text.rfind('}')
    json_text = text[first_bracket_index + 2:last_bracket_index + 1]
    return json.loads(json_text)


class Constants(dict):
    """Transforms dict to object, attributes can be accessed by dot notation."""
    __getattr__ = dict.__getitem__


with open(os.path.join('assets', 'constants.js'), 'r') as f:
    constants = Constants(parse_json_from_js(f))
