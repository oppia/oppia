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

import base64
import copy
import hashlib
import json
import logging
import os
import yaml

from jinja2 import Environment
from jinja2 import meta

import feconf

from google.appengine.ext import ndb


class InvalidInputException(Exception):
    """Error class for invalid input."""
    pass


class EntityIdNotFoundError(Exception):
    """Error class for when an entity ID is not in the datastore."""
    pass


def log(message):
    """Logs info messages in development/debug mode.

    Args:
        message: the message to be logged.
    """
    if feconf.DEV or feconf.DEBUG:
        if isinstance(message, dict):
            logging.info(json.dumps(message, sort_keys=True, indent=4))
        else:
            logging.info(str(message))


def create_enum(*sequential, **names):
    enums = dict(zip(sequential, sequential), **names)
    return type('Enum', (), enums)


def get_new_id(entity, entity_name):
    """Gets a new id for an entity, based on its name.

    Args:
        entity: the entity's class.
        entity_name: string representing the name of the entity

    Returns:
        string - the 12-character id representing the entity
    """
    seed = 0
    new_id = base64.urlsafe_b64encode(
        hashlib.sha1(entity_name.encode('utf-8')).digest())[:12]

    while entity.get_by_id(new_id):
        seed += 1
        new_id = base64.urlsafe_b64encode(
            hashlib.sha1('%s%s' % (
                entity_name.encode('utf-8'), seed)).digest())[:12]

    return new_id


def get_file_contents(root, filepath):
    """Gets the contents of a file.

    Args:
        root: the path to prepend to the filepath.
        filepath: a path to a HTML, JS or CSS file. It should not include the
            template/dev/head or template/prod/head prefix.

    Returns:
        the file contents.
    """
    with open(os.path.join(root, filepath)) as f:
        return f.read().decode('utf-8')


def get_js_controllers(filenames):
    """Gets the concatenated contents of some JS controllers.

    Args:
        filenames: an array with names of JS files (without the '.js' suffix).

    Returns:
        the concatenated contents of these JS files.
    """
    return '\n'.join([
        get_file_contents(
            feconf.TEMPLATE_DIR, 'js/controllers/%s.js' % filename
        ) for filename in filenames
    ])


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
            logging.info('Cannot parse %s properly using %s', string, params)

    return Environment().from_string(string).render(new_params)


def get_comma_sep_string_from_list(items):
    """Turns a list of items into a comma-separated string."""

    if not items:
        return ''

    if len(items) == 1:
        return items[0]

    return '%s and %s' % (', '.join(items[:-1]), items[-1])


def try_removing_unicode_prefixes(obj):
    """Recursively tries to encode strings in an object as ASCII strings."""
    if isinstance(obj, int) or isinstance(obj, set):
        return obj
    elif isinstance(obj, str) or isinstance(obj, unicode):
        try:
            return str(obj)
        except Exception:
            return obj
    elif isinstance(obj, list):
        return [try_removing_unicode_prefixes(item) for item in obj]
    elif isinstance(obj, dict):
        new_dict = {}
        for item in obj:
            new_dict[try_removing_unicode_prefixes(item)] = (
                try_removing_unicode_prefixes(obj[item]))
    else:
        return obj


def to_string(string):
    """Removes unicode characters from a string."""
    return string.encode('ascii', 'ignore')


def get_yaml_from_dict(dictionary):
    """Gets the YAML representation of a dict."""
    return yaml.safe_dump(dictionary, default_flow_style=False)


def get_dict_from_yaml(yaml_file):
    """Gets the dict representation of a YAML file."""
    try:
        yaml_dict = yaml.safe_load(yaml_file)
        assert isinstance(yaml_dict, dict)
        return yaml_dict
    except yaml.YAMLError as e:
        raise utils.InvalidInputException(e)
