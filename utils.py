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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

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
import sys
import time
import unicodedata

from constants import constants
import feconf
import python_utils

_YAML_PATH = os.path.join(os.getcwd(), '..', 'oppia_tools', 'pyyaml-5.1.2')
sys.path.insert(0, _YAML_PATH)

import yaml  # isort:skip  #pylint: disable=wrong-import-position


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
    """Creates a enumerated constant.

    Args:
        sequential: *. Sequence List to generate the enumerations.
        names: *. Names of the enumerration.

    Returns:
        dict. Dictionary containing the enumerated constants.
    """
    enums = dict(python_utils.ZIP(sequential, sequential), **names)
    return type(b'Enum', (), enums)


def get_file_contents(filepath, raw_bytes=False, mode='r'):
    """Gets the contents of a file, given a relative filepath from oppia/.

    Args:
        filepath: str. A full path to the file.
        raw_bytes: bool. Flag for the raw_bytes output.
        mode: str. File opening mode, default is in read mode.

    Returns:
        *. Either the raw_bytes stream if the flag is set or the
            decoded stream in utf-8 format.
    """
    if raw_bytes:
        mode = 'rb'
        encoding = None
    else:
        encoding = 'utf-8'

    with python_utils.open_file(filepath, mode, encoding=encoding) as f:
        return f.read()


def get_exploration_components_from_dir(dir_path):
    """Gets the (yaml, assets) from the contents of an exploration data dir.

    Args:
        dir_path: str. a full path to the exploration root directory.

    Returns:
        *. A 2-tuple, the first element of which is a yaml string, and the
        second element of which is a list of (filepath, content) 2-tuples.
        The filepath does not include the assets/ prefix.

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

    for root, directories, files in os.walk(dir_path):
        for directory in directories:
            if root == dir_path and directory != 'assets':
                raise Exception(
                    'The only directory in %s should be assets/' % dir_path)

        for filename in files:
            filepath = os.path.join(root, filename)
            if root == dir_path:
                # These files are added automatically by Mac OS Xsystems.
                # We ignore them.
                if not filepath.endswith('.DS_Store'):
                    if yaml_content is not None:
                        raise Exception(
                            'More than one non-asset file specified '
                            'for %s' % dir_path)
                    elif not filepath.endswith('.yaml'):
                        raise Exception(
                            'Found invalid non-asset file %s. There '
                            'should only be a single non-asset file, '
                            'and it should have a .yaml suffix.' % filepath)
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


def get_comma_sep_string_from_list(items):
    """Turns a list of items into a comma-separated string.

    Args:
        items: list. List of the items.

    Returns:
        str. String containing the items in the list separated by commas.
    """

    if not items:
        return ''

    if len(items) == 1:
        return items[0]

    return '%s and %s' % (', '.join(items[:-1]), items[-1])


def to_ascii(input_string):
    """Change unicode characters in a string to ascii if possible.

    Args:
        input_string: str. String to convert.

    Returns:
        str. String containing the ascii representation of the input string.
    """
    return unicodedata.normalize(
        'NFKD', python_utils.UNICODE(input_string)).encode('ascii', 'ignore')


def dict_from_yaml(yaml_str):
    """Gets the dict representation of a YAML string.

    Args:
        yaml_str: str. Yaml string for conversion into dict.

    Returns:
        dict. Parsed dict representation of the yaml string.

    Raises:
        InavlidInputException: If the yaml string sent as the
            parameter is unable to get parsed, them this error gets
            raised.
    """
    try:
        retrieved_dict = yaml.safe_load(yaml_str)
        assert isinstance(retrieved_dict, dict)
        return retrieved_dict
    except yaml.YAMLError as e:
        raise InvalidInputException(e)


def recursively_remove_key(obj, key_to_remove):
    """Recursively removes keys from a list or dict.

    Args:
        obj: *. List or dict passed for which the keys has to
            be removed.
        key_to_remove: str. Key value that has to be removed.

    Returns:
        *. Dict or list with a particular key value removed.
    """
    if isinstance(obj, list):
        for item in obj:
            recursively_remove_key(item, key_to_remove)
    elif isinstance(obj, dict):
        if key_to_remove in obj:
            del obj[key_to_remove]
        for key, unused_value in obj.items():
            recursively_remove_key(obj[key], key_to_remove)


def get_random_int(upper_bound):
    """Returns a random integer in [0, upper_bound).

    Args:
        upper_bound: int. Upper limit for generation of random
            integer.

    Returns:
        int. Randomly generated integer less than the upper_bound.
    """
    assert upper_bound >= 0 and isinstance(upper_bound, int)

    generator = random.SystemRandom()
    return generator.randrange(0, stop=upper_bound)


def get_random_choice(alist):
    """Gets a random element from a list.

    Args:
       alist: list(*). Input to get a random choice.

    Returns:
       *. Random element choosen from the passed input list.
    """
    assert isinstance(alist, list) and len(alist) > 0

    index = get_random_int(len(alist))
    return alist[index]


def convert_png_binary_to_data_url(content):
    """Converts a png image string (represented by 'content') to a data URL.

    Args:
        content: str. PNG binary file content.

    Returns:
        str. Data url created from the binary content of the PNG.

    Raises:
        Exception: If the given binary string is not of a PNG image.
    """
    if imghdr.what(None, h=content) == 'png':
        return 'data:image/png;base64,%s' % python_utils.url_quote(
            base64.b64encode(content))
    else:
        raise Exception('The given string does not represent a PNG image.')


def convert_png_to_data_url(filepath):
    """Converts the png file at filepath to a data URL.

    Args:
        filepath: str. A full path to the file.

    Returns:
        str. Data url created from the filepath of the PNG.
    """
    file_contents = get_file_contents(filepath, raw_bytes=True, mode='rb')
    return convert_png_binary_to_data_url(file_contents)


def camelcase_to_hyphenated(camelcase_str):
    """Camelcase to hyhpenated conversion of the passed string.

    Args:
        camelcase_str: str. Camelcase string representation.

    Returns:
        str. Hypenated string representation of the camelcase string.
    """
    intermediate_str = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', camelcase_str)
    return re.sub('([a-z0-9])([A-Z])', r'\1-\2', intermediate_str).lower()


def camelcase_to_snakecase(camelcase_str):
    """Camelcase to snake case conversion of the passed string.

    Args:
        camelcase_str: str. Camelcase string representation.

    Returns:
        str. Snakecase representation of the passed camelcase string.
    """
    intermediate_str = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', camelcase_str)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', intermediate_str).lower()


def set_url_query_parameter(url, param_name, param_value):
    """Set or replace a query parameter, and return the modified URL.

    Args:
        url: str. URL string which contains the query parameter.
        param_name: str. Parameter name to be removed.
        param_value: str. Set the parameter value, if it exists.

    Returns:
        str. Formated URL that has query parameter set or replaced.

    Raises:
        Exception: If the query parameter sent is not of string type,
            them this exception is raised.
    """
    if not isinstance(param_name, python_utils.BASESTRING):
        raise Exception(
            'URL query parameter name must be a string, received %s'
            % param_name)

    scheme, netloc, path, query_string, fragment = python_utils.url_split(url)
    query_params = python_utils.parse_query_string(query_string)

    query_params[param_name] = [param_value]
    new_query_string = python_utils.url_encode(query_params, doseq=True)

    return python_utils.url_unsplit(
        (scheme, netloc, path, new_query_string, fragment))


class JSONEncoderForHTML(json.JSONEncoder):
    """Encodes JSON that is safe to embed in HTML."""

    def encode(self, o):
        chunks = self.iterencode(o, True)
        return ''.join(chunks) if self.ensure_ascii else u''.join(chunks)

    def iterencode(self, o, _one_shot=False):
        chunks = super(
            JSONEncoderForHTML, self).iterencode(o, _one_shot=_one_shot)
        for chunk in chunks:
            yield chunk.replace('&', '\\u0026').replace(
                '<', '\\u003c').replace('>', '\\u003e')


def convert_to_hash(input_string, max_length):
    """Convert a string to a SHA1 hash.

    Args:
        input_string: str. Input string for conversion to hash.
        max_length: int. Maximum Length of the generated hash.

    Returns:
        str. Hash Value generated from the input_String of the
            specified length.

    Raises:
        Exception: If the input string is not the instance of the str,
            them this exception is raised.
    """
    if not isinstance(input_string, python_utils.BASESTRING):
        raise Exception(
            'Expected string, received %s of type %s' %
            (input_string, type(input_string)))

    # Encodes strings using the character set [A-Za-z0-9].
    # Prefixing altchars with b' to ensure that all characters in encoded_string
    # remain encoded (otherwise encoded_string would be of type unicode).
    encoded_string = base64.b64encode(
        hashlib.sha1(python_utils.convert_to_bytes(input_string)).digest(),
        altchars=b'ab'
    ).replace('=', 'c')

    return encoded_string[:max_length]


def base64_from_int(value):
    """Converts the number into base64 representation.

    Args:
        value: int. Integer value for conversion into base64.

    Returns:
        *. Returns the base64 representation of the number passed.
    """
    return base64.b64encode(bytes([value]))


def get_time_in_millisecs(datetime_obj):
    """Returns time in milliseconds since the Epoch.

    Args:
        datetime_obj: datetime. An object of type datetime.datetime.

    Returns:
        float. The time in milliseconds since the Epoch.
    """
    msecs = time.mktime(datetime_obj.timetuple()) * 1000.0
    return msecs + python_utils.divide(datetime_obj.microsecond, 1000.0)


def get_current_time_in_millisecs():
    """Returns time in milliseconds since the Epoch.

    Returns:
        float. The time in milliseconds since the Epoch.
    """
    return get_time_in_millisecs(datetime.datetime.utcnow())


def get_human_readable_time_string(time_msec):
    """Given a time in milliseconds since the epoch, get a human-readable
    time string for the admin dashboard.

    Args:
        time_msec: float. Time in milliseconds since the Epoch.

    Returns:
        str. A string representing the time.
    """
    return time.strftime(
        '%B %d %H:%M:%S', time.gmtime(python_utils.divide(time_msec, 1000.0)))


def are_datetimes_close(later_datetime, earlier_datetime):
    """Given two datetimes, determines whether they are separated by less than
    feconf.PROXIMAL_TIMEDELTA_SECS seconds.

    Args:
        later_datetime: datetime. The later datetime.
        earlier_datetime: datetime. The earlier datetime.

    Returns:
        bool. True if difference between two datetimes is less than
            feconf.PROXIMAL_TIMEDELTA_SECS seconds otherwise false.
    """
    difference_in_secs = (later_datetime - earlier_datetime).total_seconds()
    return difference_in_secs < feconf.PROXIMAL_TIMEDELTA_SECS


def generate_random_string(length):
    """Generates a random string of the specified length.

    Args:
        length: int. Length of the string to be generated.

    Returns:
        str. Random string of specified length.
    """
    return base64.urlsafe_b64encode(os.urandom(length))[:length]


def generate_new_session_id():
    """Generates a new session id.

    Returns:
        str. Random string of length 24.
    """
    return generate_random_string(24)


def vfs_construct_path(base_path, *path_components):
    """Mimics behavior of os.path.join on Posix machines.

    Args:
        base_path: str. The initial path upon which components would be added.
        path_components: list(str). Components that would be added to the path.

    Returns:
        str. The path that is obtained after adding the components.
    """
    return os.path.join(base_path, *path_components)


def vfs_normpath(path):
    """Normalize path from posixpath.py, eliminating double slashes, etc.

    Args:
        path: str. Path that is to be normalized.

    Returns:
        str. Path if it is not null else a dot string.
    """
    return os.path.normpath(path)


def require_valid_name(name, name_type, allow_empty=False):
    """Generic name validation.

    Args:
        name: str. The name to validate.
        name_type: str. A human-readable string, like 'the exploration title' or
            'a state name'. This will be shown in error messages.
        allow_empty: bool. If True, empty strings are allowed.

    Raises:
        Exception: Name isn't a string.
        Exception: The length of the name_type isn't between
            1 and 50.
        Exception: Name starts or ends with whitespace.
        Exception: Adjacent whitespace in name_type isn't collapsed.
        Exception: Invalid character is present in name.
    """
    if not isinstance(name, python_utils.BASESTRING):
        raise ValidationError('%s must be a string.' % name)

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

    for character in constants.INVALID_NAME_CHARS:
        if character in name:
            raise ValidationError(
                'Invalid character %s in %s: %s' %
                (character, name_type, name))


def require_valid_thumbnail_filename(thumbnail_filename):
    """Generic thumbnail filename validation.

        Args:
            thumbnail_filename: str. The thumbnail filename to validate.
        """
    if thumbnail_filename is not None:
        if not isinstance(thumbnail_filename, python_utils.BASESTRING):
            raise ValidationError(
                'Expected thumbnail filename to be a string, received %s'
                % thumbnail_filename)
        if thumbnail_filename.rfind('.') == 0:
            raise ValidationError(
                'Thumbnail filename should not start with a dot.')
        if '/' in thumbnail_filename or '..' in thumbnail_filename:
            raise ValidationError(
                'Thumbnail filename should not include slashes or '
                'consecutive dot characters.')
        if '.' not in thumbnail_filename:
            raise ValidationError(
                'Thumbnail filename should include an extension.')

        dot_index = thumbnail_filename.rfind('.')
        extension = thumbnail_filename[dot_index + 1:].lower()
        if extension != 'svg':
            raise ValidationError(
                'Expected a filename ending in svg, received %s' %
                thumbnail_filename)


def capitalize_string(input_string):
    """Converts the first character of a string to its uppercase equivalent (if
    it's a letter), and returns the result.

    Args:
        input_string: str. String to process (to capitalize).

    Returns:
        str. Capitalizes the string.
    """
    # This guards against empty strings.
    if input_string:
        return input_string[0].upper() + input_string[1:]
    else:
        return input_string


def get_hex_color_for_category(category):
    """Returns the category, it returns the color associated with the category,
    if the category is present in the app constants else given a default color.

    Args:
        category: str. Category to get color.

    Returns:
        str. Color assigned to that category.
    """
    return (
        constants.CATEGORIES_TO_COLORS[category]
        if category in constants.CATEGORIES_TO_COLORS
        else constants.DEFAULT_COLOR)


def get_thumbnail_icon_url_for_category(category):
    """Returns the category, it returns the associated thumbnail icon, if the
    category is present in the app constants else given a default thumbnail.

    Args:
        category: str. Category to get Thumbnail icon.

    Returns:
        str. Path to the Thumbnail Icon assigned to that category.
    """
    icon_name = (
        category if category in constants.CATEGORIES_TO_COLORS
        else constants.DEFAULT_THUMBNAIL_ICON)
    # Remove all spaces from the string.
    return '/subjects/%s.svg' % (icon_name.replace(' ', ''))


def is_supported_audio_language_code(language_code):
    """Checks if the given language code is a supported audio language code.

    Args:
        language_code: str. The language code.

    Returns:
        bool. Whether the language code is supported audio language code or not.
    """
    language_codes = [lc['id'] for lc in constants.SUPPORTED_AUDIO_LANGUAGES]
    return language_code in language_codes


def is_valid_language_code(language_code):
    """Checks if the given language code is a valid language code.

    Args:
        language_code: str. The language code.

    Returns:
        bool. Whether the language code is valid or not.
    """
    language_codes = [
        lc['code'] for lc in constants.SUPPORTED_CONTENT_LANGUAGES]
    return language_code in language_codes


def get_supported_audio_language_description(language_code):
    """Returns the language description for the given language code.

    Args:
        language_code: str. The language code for which the description is
            required.

    Returns:
        str. The language description for the given language code.

    Raises:
        Exception: If the given language code is unsupported.
    """
    for language in constants.SUPPORTED_AUDIO_LANGUAGES:
        if language['id'] == language_code:
            return language['description']
    raise Exception('Unsupported audio language code: %s' % language_code)


def unescape_encoded_uri_component(escaped_string):
    """Unescape a string that is encoded with encodeURIComponent.

    Args:
        escaped_string: str. String that is encoded with encodeURIComponent.

    Returns:
        str. Decoded string that was initially encoded with
            encodeURIComponent.
    """
    return python_utils.urllib_unquote(escaped_string).decode('utf-8')


def snake_case_to_camel_case(snake_str):
    """Converts a string in snake_case to camelCase.

    Args:
        snake_str: str. String that is in snake_case.

    Returns:
        str. Converted string that is in camelCase.
    """
    components = snake_str.split('_')
    # We capitalize the first letter of each component except the first one
    # with the 'title' method and join them together.
    return components[0] + ''.join(x.title() for x in components[1:])


def get_asset_dir_prefix():
    """Returns prefix for asset directory depending whether dev or prod.
    It is used as a prefix in urls for images, css and script files.

    Returns:
        str. Prefix '/build' if constants.DEV_MODE is false, otherwise
            null string.
    """
    asset_dir_prefix = ''
    if not constants.DEV_MODE:
        asset_dir_prefix = '/build'

    return asset_dir_prefix


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
            (k, get_hashable_value(v)) for k, v in value.items()))
    else:
        return value


class OrderedCounter(collections.Counter, collections.OrderedDict):
    """Counter that remembers the order elements are first encountered."""
    pass
