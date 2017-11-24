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

"""Common utility functions."""

import base64
import collections
import datetime
import hashlib
import imghdr
import json
import os
import random
import re
import string
import StringIO
import time
import unicodedata
import urllib
import urlparse
import zipfile

import yaml

from constants import constants  # pylint: disable=relative-import
import feconf  # pylint: disable=relative-import


class InvalidInputException(Exception):
    """Error class for invalid input."""
    pass


class ValidationError(Exception):
    """Error class for when a domain object fails validation."""
    pass


class ExplorationConversionError(Exception):
    """Error class for when an exploration fails to convert from a certain
    version to a certain version.
    """
    pass


def create_enum(*sequential, **names):
    enums = dict(zip(sequential, sequential), **names)
    return type('Enum', (), enums)


def get_file_contents(filepath, raw_bytes=False, mode='r'):
    """Gets the contents of a file, given a relative filepath from oppia/."""
    with open(filepath, mode) as f:
        return f.read() if raw_bytes else f.read().decode('utf-8')


def get_exploration_components_from_dir(dir_path):
    """Gets the (yaml, assets) from the contents of an exploration data dir.

    Args:
      dir_path: a full path to the exploration root directory.

    Returns:
      a 2-tuple, the first element of which is a yaml string, and the second
      element of which is a list of (filepath, content) 2-tuples. The filepath
      does not include the assets/ prefix.

    Raises:
      Exception: if the following condition doesn't hold: "There is exactly one
        file not in assets/, and this file has a .yaml suffix".
    """
    yaml_content = None
    assets_list = []

    dir_path_array = dir_path.split('/')
    while dir_path_array[-1] == '':
        dir_path_array = dir_path_array[:-1]
    dir_path_length = len(dir_path_array)

    for root, dirs, files in os.walk(dir_path):
        for directory in dirs:
            if root == dir_path and directory != 'assets':
                raise Exception(
                    'The only directory in %s should be assets/' % dir_path)

        for filename in files:
            filepath = os.path.join(root, filename)
            if root == dir_path:
                if filepath.endswith('.DS_Store'):
                    # These files are added automatically by Mac OS Xsystems.
                    # We ignore them.
                    continue

                if yaml_content is not None:
                    raise Exception('More than one non-asset file specified '
                                    'for %s' % dir_path)
                elif not filepath.endswith('.yaml'):
                    raise Exception('Found invalid non-asset file %s. There '
                                    'should only be a single non-asset file, '
                                    'and it should have a .yaml suffix.' %
                                    filepath)
                else:
                    yaml_content = get_file_contents(filepath)
            else:
                filepath_array = filepath.split('/')
                # The additional offset is to remove the 'assets/' prefix.
                filename = '/'.join(filepath_array[dir_path_length + 1:])
                assets_list.append((filename, get_file_contents(
                    filepath, raw_bytes=True)))

    if yaml_content is None:
        raise Exception('No yaml file specifed for %s' % dir_path)

    return yaml_content, assets_list


def get_exploration_components_from_zip(zip_file_contents):
    """Gets the (yaml, assets) from the contents of an exploration zip file.

    Args:
      zip_file_contents: a string of raw bytes representing the contents of
        a zip file that comprises the exploration.

    Returns:
      a 2-tuple, the first element of which is a yaml string, and the second
      element of which is a list of (filepath, content) 2-tuples. The filepath
      does not include the assets/ prefix.

    Raises:
      Exception: if the following condition doesn't hold: "There is exactly one
        file not in assets/, and this file has a .yaml suffix".
    """
    memfile = StringIO.StringIO()
    memfile.write(zip_file_contents)

    zf = zipfile.ZipFile(memfile, 'r')
    yaml_content = None
    assets_list = []
    for filepath in zf.namelist():
        if filepath.startswith('assets/'):
            assets_list.append('/'.join(filepath.split('/')[1:]),
                               zf.read(filepath))
        else:
            if yaml_content is not None:
                raise Exception(
                    'More than one non-asset file specified for zip file')
            elif not filepath.endswith('.yaml'):
                raise Exception('Found invalid non-asset file %s. There '
                                'should only be a single file not in assets/, '
                                'and it should have a .yaml suffix.' %
                                filepath)
            else:
                yaml_content = zf.read(filepath)

    if yaml_content is None:
        raise Exception('No yaml file specified in zip file contents')

    return yaml_content, assets_list


def get_comma_sep_string_from_list(items):
    """Turns a list of items into a comma-separated string."""

    if not items:
        return ''

    if len(items) == 1:
        return items[0]

    return '%s and %s' % (', '.join(items[:-1]), items[-1])


def to_ascii(input_string):
    """Change unicode characters in a string to ascii if possible."""
    return unicodedata.normalize(
        'NFKD', unicode(input_string)).encode('ascii', 'ignore')


def yaml_from_dict(dictionary, width=80):
    """Gets the YAML representation of a dict."""
    return yaml.safe_dump(dictionary, default_flow_style=False, width=width)


def dict_from_yaml(yaml_str):
    """Gets the dict representation of a YAML string."""
    try:
        retrieved_dict = yaml.safe_load(yaml_str)
        assert isinstance(retrieved_dict, dict)
        return retrieved_dict
    except yaml.YAMLError as e:
        raise InvalidInputException(e)


def recursively_remove_key(obj, key_to_remove):
    """Recursively removes keys from a list or dict."""
    if isinstance(obj, list):
        for item in obj:
            recursively_remove_key(item, key_to_remove)
    elif isinstance(obj, dict):
        if key_to_remove in obj:
            del obj[key_to_remove]
        for key, unused_value in obj.items():
            recursively_remove_key(obj[key], key_to_remove)


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


def convert_png_binary_to_data_url(content):
    """Converts a png image string (represented by 'content') to a data URL."""
    if imghdr.what(None, content) == 'png':
        return 'data:image/png;base64,%s' % urllib.quote(
            content.encode('base64'))
    else:
        raise Exception('The given string does not represent a PNG image.')


def convert_png_to_data_url(filepath):
    """Converts the png file at filepath to a data URL."""
    file_contents = get_file_contents(filepath, raw_bytes=True, mode='rb')
    return convert_png_binary_to_data_url(file_contents)


def camelcase_to_hyphenated(camelcase_str):
    intermediate_str = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', camelcase_str)
    return re.sub('([a-z0-9])([A-Z])', r'\1-\2', intermediate_str).lower()


def set_url_query_parameter(url, param_name, param_value):
    """Set or replace a query parameter, and return the modified URL."""
    if not isinstance(param_name, basestring):
        raise Exception(
            'URL query parameter name must be a string, received %s'
            % param_name)

    scheme, netloc, path, query_string, fragment = urlparse.urlsplit(url)
    query_params = urlparse.parse_qs(query_string)

    query_params[param_name] = [param_value]
    new_query_string = urllib.urlencode(query_params, doseq=True)

    return urlparse.urlunsplit(
        (scheme, netloc, path, new_query_string, fragment))


class JSONEncoderForHTML(json.JSONEncoder):
    """Encodes JSON that is safe to embed in HTML."""

    def encode(self, o):
        chunks = self.iterencode(o, True)
        return ''.join(chunks) if self.ensure_ascii else u''.join(chunks)

    def iterencode(self, o, _one_shot=False):
        chunks = super(JSONEncoderForHTML, self).iterencode(o, _one_shot)
        for chunk in chunks:
            yield chunk.replace('&', '\\u0026').replace(
                '<', '\\u003c').replace('>', '\\u003e')


def convert_to_hash(input_string, max_length):
    """Convert a string to a SHA1 hash."""
    if not isinstance(input_string, basestring):
        raise Exception(
            'Expected string, received %s of type %s' %
            (input_string, type(input_string)))

    encoded_string = base64.urlsafe_b64encode(
        hashlib.sha1(input_string.encode('utf-8')).digest())

    return encoded_string[:max_length]


def base64_from_int(value):
    return base64.b64encode(bytes([value]))


def get_time_in_millisecs(datetime_obj):
    """Returns time in milliseconds since the Epoch.

    Args:
      datetime_obj: An object of type datetime.datetime.
    """
    seconds = time.mktime(datetime_obj.timetuple()) * 1000
    return seconds + datetime_obj.microsecond / 1000.0


def get_current_time_in_millisecs():
    """Returns time in milliseconds since the Epoch."""
    return get_time_in_millisecs(datetime.datetime.utcnow())


def get_human_readable_time_string(time_msec):
    """Given a time in milliseconds since the epoch, get a human-readable
    time string for the admin dashboard.
    """
    return time.strftime('%B %d %H:%M:%S', time.gmtime(time_msec / 1000.0))


def are_datetimes_close(later_datetime, earlier_datetime):
    """Given two datetimes, determines whether they are separated by less than
    feconf.PROXIMAL_TIMEDELTA_SECS seconds.
    """
    difference_in_secs = (later_datetime - earlier_datetime).total_seconds()
    return difference_in_secs < feconf.PROXIMAL_TIMEDELTA_SECS


def generate_random_string(length):
    return base64.urlsafe_b64encode(os.urandom(length))


def generate_new_session_id():
    return generate_random_string(24)


def vfs_construct_path(base_path, *path_components):
    """Mimics behavior of os.path.join on Posix machines."""
    path = base_path
    for component in path_components:
        if component.startswith('/'):
            path = component
        elif path == '' or path.endswith('/'):
            path += component
        else:
            path += '/%s' % component
    return path


def vfs_normpath(path):
    """Normalize path from posixpath.py, eliminating double slashes, etc."""
    # Preserve unicode (if path is unicode)
    slash, dot = (u'/', u'.') if isinstance(path, unicode) else ('/', '.')
    if path == '':
        return dot
    initial_slashes = path.startswith('/')
    # POSIX allows one or two initial slashes, but treats three or more
    # as single slash.
    if (initial_slashes and
            path.startswith('//') and not path.startswith('///')):
        initial_slashes = 2
    comps = path.split('/')
    new_comps = []
    for comp in comps:
        if comp in ('', '.'):
            continue
        if (comp != '..' or
                (not initial_slashes and not new_comps) or
                (new_comps and new_comps[-1] == '..')):
            new_comps.append(comp)
        elif new_comps:
            new_comps.pop()
    comps = new_comps
    path = slash.join(comps)
    if initial_slashes:
        path = slash * initial_slashes + path
    return path or dot


def require_valid_name(name, name_type, allow_empty=False):
    """Generic name validation.

    Args:
      name: the name to validate.
      name_type: a human-readable string, like 'the exploration title' or
        'a state name'. This will be shown in error messages.
      allow_empty: if True, empty strings are allowed.
    """
    if not isinstance(name, basestring):
        raise ValidationError('%s must be a string.' % name_type)

    if allow_empty and name == '':
        return

    # This check is needed because state names are used in URLs and as ids
    # for statistics, so the name length should be bounded above.
    if len(name) > 50 or len(name) < 1:
        raise ValidationError(
            'The length of %s should be between 1 and 50 '
            'characters; received %s' % (name_type, name))

    if name[0] in string.whitespace or name[-1] in string.whitespace:
        raise ValidationError(
            'Names should not start or end with whitespace.')

    if re.search(r'\s\s+', name):
        raise ValidationError(
            'Adjacent whitespace in %s should be collapsed.' % name_type)

    for character in feconf.INVALID_NAME_CHARS:
        if character in name:
            raise ValidationError(
                'Invalid character %s in %s: %s' %
                (character, name_type, name))


def capitalize_string(input_string):
    """Converts the first character of a string to its uppercase equivalent (if
    it's a letter), and returns the result.
    """
    # This guards against empty strings.
    if input_string:
        return input_string[0].upper() + input_string[1:]
    else:
        return input_string


def get_hex_color_for_category(category):
    return (
        constants.CATEGORIES_TO_COLORS[category]
        if category in constants.CATEGORIES_TO_COLORS
        else constants.DEFAULT_COLOR)


def get_thumbnail_icon_url_for_category(category):
    icon_name = (
        category if category in constants.CATEGORIES_TO_COLORS
        else constants.DEFAULT_THUMBNAIL_ICON)
    # Remove all spaces from the string.
    return '/subjects/%s.svg' % (icon_name.replace(' ', ''))


def _get_short_language_description(full_language_description):
    """Given one of the descriptions in constants.ALL_LANGUAGE_CODES, generates
    the corresponding short description.
    """
    if ' (' not in full_language_description:
        return full_language_description
    else:
        ind = full_language_description.find(' (')
        return full_language_description[:ind]


def get_all_language_codes_and_names():
    return [{
        'code': lc['code'],
        'name': _get_short_language_description(lc['description']),
    } for lc in constants.ALL_LANGUAGE_CODES]


def unescape_encoded_uri_component(escaped_string):
    """Unescape a string that is encoded with encodeURIComponent."""
    return urllib.unquote(escaped_string).decode('utf-8')


def get_asset_dir_prefix():
    """Returns prefix for asset directory depending whether dev or prod.
    It is used as a prefix in urls for images, css and script files.
    """
    asset_dir_prefix = ''
    if feconf.IS_MINIFIED or not feconf.DEV_MODE:
        asset_dir_prefix = '/build'

    return asset_dir_prefix


def get_template_dir_prefix():
    """Returns prefix for template directory depending whether dev or prod.
    It is used as a prefix in urls for js script files under the templates
    directory.
    """
    template_path = ('/templates/head' if feconf.IS_MINIFIED
                     or not feconf.DEV_MODE else '/templates/dev/head')
    return '%s%s' % (get_asset_dir_prefix(), template_path)


def convert_to_str(string_to_convert):
    """Converts the given unicode string to a string. If the string is not
    unicode, we return the string.

    Args:
        string_to_convert: unicode|str.

    Returns:
        str. The encoded string.
    """
    if isinstance(string_to_convert, unicode):
        return string_to_convert.encode('utf-8')
    return string_to_convert


def get_hashable_value(value):
    """This function returns a hashable version of the input JSON-like value.

    It converts the built-in sequences into their hashable counterparts
    {list: tuple, dict: (sorted tuple of pairs)}. Additionally, their
    elements are converted to hashable values through recursive calls. All
    other value types are assumed to already be hashable.

    Args:
        value: *. Some JSON-like object, that is, an object made-up of only:
            lists, dicts, strings, ints, bools, None. Types can be nested in
            each other.

    Returns:
        hashed_value: *. A new object that will always have the same hash for
        "equivalent" values.
    """
    if isinstance(value, list):
        return tuple(get_hashable_value(e) for e in value)
    elif isinstance(value, dict):
        return tuple(sorted(
            # Dict keys are already hashable, only values need converting.
            (k, get_hashable_value(v)) for k, v in value.iteritems()))
    else:
        return value


class OrderedCounter(collections.Counter, collections.OrderedDict):
    """Counter that remembers the order elements are first encountered."""
    pass
