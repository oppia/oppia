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

"""Common utility functions."""

__author__ = 'sll@google.com (Sean Lip)'

import copy
import json
import logging
import os
import random
import unicodedata
import yaml

from jinja2 import Environment
from jinja2 import meta

import feconf


class InvalidInputException(Exception):
    """Error class for invalid input."""
    pass


class EntityIdNotFoundError(Exception):
    """Error class for when an entity ID is not in the datastore."""
    pass


def log(message):
    """Logs info messages in development/debug mode."""
    if feconf.DEV or feconf.DEBUG:
        if isinstance(message, dict):
            logging.info(json.dumps(message, sort_keys=True, indent=4))
        else:
            logging.info(str(message))


def create_enum(*sequential, **names):
    enums = dict(zip(sequential, sequential), **names)
    return type('Enum', (), enums)


def get_file_contents(filepath):
    """Gets the contents of a file, given a relative filepath from oppia/."""
    with open(filepath) as f:
        return f.read().decode('utf-8')


def get_js_controllers(filenames):
    """Concatenates the given JS files (specified without the '.js' suffix)."""
    return '\n'.join([
        get_file_contents(
            os.path.join(feconf.TEMPLATE_DIR, 'lib/js/controllers/%s.js' % filename)
        ) for filename in filenames
    ])


def convert_to_js_string(value):
    """Converts a value to a JSON string for use in JavaScript code."""
    string = json.dumps(value)

    replacements = [('\\', '\\\\'), ('"', '\\"'), ("'", "\\'"),
                    ('\n', '\\n'), ('\r', '\\r'), ('\b', '\\b'),
                    ('<', '\\u003c'), ('>', '\\u003e'), ('&', '\\u0026')]

    for replacement in replacements:
        string = string.replace(replacement[0], replacement[1])
    return string


def parse_with_jinja(string, params, default=''):
    """Parses a string using Jinja templating.

    Args:
      string: the string to be parsed.
      params: the parameters to parse the string with.
      default: the default string to use for missing parameters.

    Returns:
      the parsed string, or None if the string could not be parsed.
    """
    variables = meta.find_undeclared_variables(
        Environment().parse(string))

    new_params = copy.deepcopy(params)
    for var in variables:
        if var not in new_params:
            new_params[var] = default
            logging.info('Cannot parse %s fully using %s', string, params)

    return Environment().from_string(string).render(new_params)


def parse_dict_with_params(d, params, default=''):
    """Converts the values of a dict to strings, then parses them using params.

    Args:
      d: the dict whose values are to be parsed.
      params: the parameters to parse the dict with.
      default: the default string to use for missing parameters.

    Returns:
      the parsed dict. This is a copy of the old dict.
    """
    parameters = {}

    for key in d:
        parameters[key] = parse_with_jinja(
            convert_to_js_string(d[key]), params, default)

    return parameters


def get_comma_sep_string_from_list(items):
    """Turns a list of items into a comma-separated string."""

    if not items:
        return ''

    if len(items) == 1:
        return items[0]

    return '%s and %s' % (', '.join(items[:-1]), items[-1])


def to_ascii(string):
    """Change unicode characters in a string to ascii if possible."""
    return unicodedata.normalize(
        'NFKD', unicode(string)).encode('ascii', 'ignore')


def yaml_from_dict(dictionary):
    """Gets the YAML representation of a dict."""
    return yaml.safe_dump(dictionary, default_flow_style=False)


def dict_from_yaml(yaml_file):
    """Gets the dict representation of a YAML file."""
    try:
        yaml_dict = yaml.safe_load(yaml_file)
        assert isinstance(yaml_dict, dict)
        return yaml_dict
    except yaml.YAMLError as e:
        raise InvalidInputException(e)


def normalize_classifier_return(*args):
    """Normalizes a 1-or-2-tuple return to a 2-tuple.

    Args:
      *args: the value to normalize. This is either:
          - a single boolean saying whether a classifier rule was satisfied
          - a boolean as above, together with a dict of additional data.

    Returns:
      A two-element tuple, consisting of a boolean and a dict.

    Raises:
      Exception: if a rule classifier returns invalid values.
    """
    # TODO(sll): All rules should return a 2-tuple instead.
    if len(args) not in [1, 2]:
        raise InvalidInputException(
            'Invalid classifier return values: %s' % str(args))

    assert isinstance(args[0], bool)
    if len(args) == 1:
        return (args[0], {})
    else:
        assert isinstance(args[1], dict)
        return (args[0], args[1])


def recursively_remove_key(d, key_to_remove):
    """Recursively removes keys from a dict."""
    if isinstance(d, list):
        for item in d:
            recursively_remove_key(item, key_to_remove)
    elif isinstance(d, dict):
        if key_to_remove in d:
            del d[key_to_remove]
        for key, unused_value in d.items():
            recursively_remove_key(d[key], key_to_remove)


def get_random_int(upper_bound):
    """Returns a random integer in [0, upper_bound)."""
    assert upper_bound >= 0 and isinstance(upper_bound, int)

    generator = random.SystemRandom()
    return generator.randrange(0, upper_bound)


def get_random_choice(alist):
    """Gets a random element from a list."""
    assert isinstance(alist, list) and len(alist) > 0

    index = get_random_int(len(alist))
    return alist[index]
