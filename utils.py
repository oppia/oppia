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


def convert_to_js_string(value):
    """Converts a value to a unicode string without extra 'u' characters."""

    def recursively_convert_to_unicode(value, built_string):
        if value is None:
            return '%s%s' % (built_string, 'null')
        if (isinstance(value, int) or isinstance(value, float)):
            return '%s%s' % (built_string, value)
        elif isinstance(value, unicode):
            return "%s'%s'" % (built_string, value.replace("'", "\\'"))
        elif isinstance(value, str):
            return u"%s'%s'" % (
                built_string, value.decode('utf-8').replace("'", "\\'"))
        elif isinstance(value, list) or isinstance(value, set):
            string = u'['
            for index, item in enumerate(value):
                string = recursively_convert_to_unicode(item, string)
                if index != len(value) - 1:
                    string += ', '
            string += ']'
            return '%s%s' % (built_string, string)
        elif isinstance(value, dict):
            string = u'{'
            index = 0
            for key, val in value.iteritems():
                string = recursively_convert_to_unicode(key, string)
                string += ': '
                string = recursively_convert_to_unicode(val, string)
                if index != len(value) - 1:
                    string += ', '
                index += 1
            string += '}'
            return '%s%s' % (built_string, string)
        else:
            logging.info(
                'Could not convert %s of type %s' % (value, type(value)))
            return '%s%s' % (built_string, value)

    return recursively_convert_to_unicode(value, u'')


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
        raise InvalidInputException(e)
