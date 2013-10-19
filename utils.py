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

import os
import random
import StringIO
import unicodedata
import yaml
import zipfile

import feconf

# Sentinel value for schema verification, indicating that a value can take any
# type.
ANY_TYPE = 1


class InvalidInputException(Exception):
    """Error class for invalid input."""
    pass


class EntityIdNotFoundError(Exception):
    """Error class for when an entity ID is not in the datastore."""
    pass


class ValidationError(Exception):
    """Error class for when a domain object fails validation."""
    pass


def create_enum(*sequential, **names):
    enums = dict(zip(sequential, sequential), **names)
    return type('Enum', (), enums)


def get_file_contents(filepath, raw_bytes=False):
    """Gets the contents of a file, given a relative filepath from oppia/."""
    with open(filepath) as f:
        return f.read() if raw_bytes else f.read().decode('utf-8')


def get_exploration_components_from_zip(zip_file_contents):
    """Gets the (yaml, assets) from the contents of an exploration zip file.

    Args:
      zip_file_contents: a string of raw bytes representing the contents of
        a zip file that comprises the exploration.

    Returns:
      a 2-tuple, the first element of which is a yaml string, and the second
      element of which is a list of (filepath, content) 2-tuples. The filepath
      includes the assets/ prefix.

    Raises:
      Exception: if the following condition doesn't hold: "There is exactly one
        file not in assets/, and this file has a .yaml suffix".
    """
    o = StringIO.StringIO()
    o.write(zip_file_contents)

    zf = zipfile.ZipFile(o, 'r')
    yaml_file = None
    assets_list = []
    for filepath in zf.namelist():
        if filepath.startswith('assets/'):
            assets_list.append((filepath, zf.read(filepath)))
        else:
            if yaml_file is not None:
                raise Exception('More than one non-asset file specified for %s'
                                % demo_filename)
            elif not filepath.endswith('.yaml'):
                raise Exception('The file not in assets/ should have a .yaml '
                                'suffix')
            else:
                yaml_file = zf.read(filepath)

    if yaml_file is None:
        raise Exception('No yaml file specifed for %s' % demo_filename)

    return yaml_file, assets_list


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


def verify_dict_keys_and_types(adict, dict_schema):
    """Checks the keys in adict, and that their values have the right types.

    Args:
      adict: the dictionary to test.
      dict_schema: list of 2-element tuples. The first element of each
        tuple is the key name and the second element is the value type.
    """
    for item in dict_schema:
        if len(item) != 2:
            raise Exception('Schema %s is invalid.' % dict_schema)
        if not isinstance(item[0], str):
            raise Exception('Schema key %s is not a string.' % item[0])
        if item[1] != ANY_TYPE and not isinstance(item[1], type):
            raise Exception('Schema value %s is not a valid type.' % item[1])

    TOP_LEVEL_KEYS = [item[0] for item in dict_schema]
    if sorted(TOP_LEVEL_KEYS) != sorted(adict.keys()):
        raise Exception('Dict %s should conform to schema %s.' %
                        (adict, dict_schema))

    for item in dict_schema:
        if item[1] == ANY_TYPE:
            continue
        if not isinstance(adict[item[0]], item[1]):
            raise Exception('Value \'%s\' for key \'%s\' is not of type %s '
                            ' in:\n\n %s' %
                            (adict[item[0]], item[0], item[1], adict))
