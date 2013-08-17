# Copyright 2012 Google Inc. All Rights Reserved.
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

"""Jinja-related utilities."""

import os

import jinja2
import json


def js_string(value):
    """Converts a value to a JSON string for use in JavaScript code."""
    string = json.dumps(value)

    replacements = [('\\', '\\\\'), ('"', '\\"'), ("'", "\\'"),
                    ('\n', '\\n'), ('\r', '\\r'), ('\b', '\\b'),
                    ('<', '\\u003c'), ('>', '\\u003e'), ('&', '\\u0026')]

    for replacement in replacements:
        string = string.replace(replacement[0], replacement[1])
    return string


FILTERS = {
    'is_list': lambda x: isinstance(x, list),
    'is_dict': lambda x: isinstance(x, dict),
    'js_string': js_string,
}


def get_jinja_env(dir_path):
    loader = jinja2.FileSystemLoader(os.path.join(
        os.path.dirname(__file__), dir_path))

    env = jinja2.Environment(autoescape=True, loader=loader)

    def include_js_file(name):
        """Include a raw JS file in the template without evaluating it."""
        assert name.endswith('.js')
        return jinja2.Markup(loader.get_source(env, name)[0])


    env.globals['include_js_file'] = include_js_file
    env.filters.update(FILTERS)
    return env
