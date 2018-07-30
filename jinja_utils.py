# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

import copy
import json
import logging
import math
import os

import utils  # pylint: disable=relative-import

import jinja2
from jinja2 import meta


def _js_string_filter(value):
    """Converts a value to a JSON string for use in JavaScript code."""
    string = json.dumps(value)

    replacements = [('\\', '\\\\'), ('"', '\\"'), ("'", "\\'"),
                    ('\n', '\\n'), ('\r', '\\r'), ('\b', '\\b'),
                    ('<', '\\u003c'), ('>', '\\u003e'), ('&', '\\u0026')]

    for replacement in replacements:
        string = string.replace(replacement[0], replacement[1])
    return jinja2.utils.Markup(string)


def _log2_floor_filter(value):
    """Returns the logarithm base 2 of the given value, rounded down."""
    return int(math.log(value, 2))


JINJA_FILTERS = {
    'is_list': lambda x: isinstance(x, list),
    'is_dict': lambda x: isinstance(x, dict),
    'js_string': _js_string_filter,
    'log2_floor': _log2_floor_filter,
}


def get_jinja_env(dir_path):
    loader = jinja2.FileSystemLoader(os.path.join(
        os.path.dirname(__file__), dir_path))
    env = jinja2.Environment(autoescape=True, loader=loader)

    def get_complete_static_resource_url(domain_url, resource_suffix):
        """Returns the relative path for the resource, appending it to the
        corresponding cache slug. resource_suffix should have a leading
        slash.
        """
        return '%s%s%s' % (
            domain_url, utils.get_asset_dir_prefix(), resource_suffix)

    env.globals['get_complete_static_resource_url'] = (
        get_complete_static_resource_url)
    env.filters.update(JINJA_FILTERS)
    return env


def parse_string(string, params, autoescape=True):
    """Parses a string using Jinja templating.

    Args:
      string: the string to be parsed.
      params: the parameters to parse the string with.
      autoescape: whether to enable autoescaping when parsing.

    Returns:
      the parsed string, or None if the string could not be parsed.
    """
    env = jinja2.Environment(autoescape=autoescape)

    env.filters.update(JINJA_FILTERS)
    try:
        parsed_string = env.parse(string)
    except Exception:
        raise Exception('Unable to parse string with Jinja: %s' % string)

    variables = meta.find_undeclared_variables(parsed_string)
    if any([var not in params for var in variables]):
        logging.info('Cannot parse %s fully using %s', string, params)

    try:
        return env.from_string(string).render(params)
    except Exception:
        logging.error(
            'jinja_utils.parse_string() failed with args: %s, %s, %s' %
            (string, params, autoescape))
        return env.from_string('[CONTENT PARSING ERROR]').render({})


def evaluate_object(obj, params):
    """Returns a copy of `obj` after parsing strings in it using `params`."""

    if isinstance(obj, basestring):
        return parse_string(obj, params)
    elif isinstance(obj, list):
        new_list = []
        for item in obj:
            new_list.append(evaluate_object(item, params))
        return new_list
    elif isinstance(obj, dict):
        new_dict = {}
        for key in obj:
            new_dict[key] = evaluate_object(obj[key], params)
        return new_dict
    else:
        return copy.deepcopy(obj)


def interpolate_cache_slug(string):
    """Parses the cache slug in the input string.

    Returns:
      the parsed string, or None if the string could not be parsed.
    """
    cache_slug = utils.get_asset_dir_prefix()
    return parse_string(string, {'cache_slug': cache_slug})
