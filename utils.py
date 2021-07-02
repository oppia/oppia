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
import itertools
import json
import os
import random
import re
import string
import sys
import time
import unicodedata
import zlib

from constants import constants
import feconf
import python_utils

from typing import ( # isort:skip # pylint: disable=unused-import
    Any, Callable, cast, Dict, Generator, Iterable, Iterator, List, # isort:skip # pylint: disable=unused-import
    Optional, Text, Tuple, TypeVar, Union) # isort:skip # pylint: disable=unused-import


_YAML_PATH = os.path.join(os.getcwd(), '..', 'oppia_tools', 'pyyaml-5.1.2')
sys.path.insert(0, _YAML_PATH) # type: ignore[arg-type]

import yaml  # isort:skip  #pylint: disable=wrong-import-position

DATETIME_FORMAT = '%m/%d/%Y, %H:%M:%S:%f'
ISO_8601_DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S.%fz'
PNG_DATA_URL_PREFIX = 'data:image/png;base64,'
SECONDS_IN_HOUR = 60 * 60
SECONDS_IN_MINUTE = 60

T = TypeVar('T')

# TODO(#13059): Every use of constants is followed by
# 'type: ignore[attr-defined]' because mypy is not able to identify the
# attributes of constants but this will be fixed after introduction of protobuf
# for constants.

# TODO(#13059): We will be ignoring no-untyped-call and no-any-return here
# because python_utils is untyped and will be removed in python3.
# These will be removed after python3 migration and adding stubs for new python3
# libraries.


class InvalidInputException(Exception):
    """Error class for invalid input."""

    pass


class ValidationError(Exception):
    """Error class for when a domain object fails validation."""

    pass


class DeprecatedCommandError(ValidationError):
    """Error class for when a domain object has a command
    or a value that is deprecated.
    """

    pass


class ExplorationConversionError(Exception):
    """Error class for when an exploration fails to convert from a certain
    version to a certain version.
    """

    pass


def get_file_contents(filepath, raw_bytes=False, mode='r'):
    # type: (Text, bool, Text) -> Text
    """Gets the contents of a file, given a relative filepath
    from oppia.

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

    with python_utils.open_file( # type: ignore[no-untyped-call]
        filepath, mode, encoding=encoding) as f:
        return f.read() # type: ignore[no-any-return]


def get_exploration_components_from_dir(dir_path):
    # type: (Text) -> Tuple[Text, List[Tuple[Text, Text]]]
    """Gets the (yaml, assets) from the contents of an exploration data dir.

    Args:
        dir_path: str. A full path to the exploration root directory.

    Returns:
        *. A 2-tuple, the first element of which is a yaml string, and the
        second element of which is a list of (filepath, content) 2-tuples.
        The filepath does not include the assets/ prefix.

    Raises:
        Exception. If the following condition doesn't hold: "There
            is exactly one file not in assets/, and this file has a
            .yaml suffix".
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
    # type: (List[Text]) -> Text
    """Turns a list of items into a comma-separated string.

    Args:
        items: list(str). List of the items.

    Returns:
        str. String containing the items in the list separated by commas.
    """

    if not items:
        return ''

    if len(items) == 1:
        return items[0]

    return '%s and %s' % (', '.join(items[:-1]), items[-1])


def to_ascii(input_string):
    # type: (Text) -> Text
    """Change unicode characters in a string to ascii if possible.

    Args:
        input_string: str. String to convert.

    Returns:
        str. String containing the ascii representation of the input string.
    """
    return unicodedata.normalize(
        'NFKD', python_utils.UNICODE(input_string)).encode('ascii', 'ignore')


def dict_from_yaml(yaml_str):
    # type: (Text) -> Dict[str, Any]
    """Gets the dict representation of a YAML string.

    Args:
        yaml_str: str. Yaml string for conversion into dict.

    Returns:
        dict. Parsed dict representation of the yaml string.

    Raises:
        InavlidInputException. If the yaml string sent as the
            parameter is unable to get parsed, them this error gets
            raised.
    """
    try:
        retrieved_dict = yaml.safe_load(yaml_str)
        assert isinstance(retrieved_dict, dict)
        return retrieved_dict
    except (AssertionError, yaml.YAMLError) as e:
        raise InvalidInputException(e)


def recursively_remove_key(obj, key_to_remove):
    # type: (Union[Dict[Any, Any], List[Any]], Text) -> None
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
    # type: (int) -> int
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
    # type: (List[T]) -> T
    """Gets a random element from a list.

    Args:
        alist: list(*). Input to get a random choice.

    Returns:
        *. Random element choosen from the passed input list.
    """
    assert isinstance(alist, list) and len(alist) > 0

    index = get_random_int(len(alist))
    return alist[index]


def convert_png_data_url_to_binary(image_data_url):
    # type: (Text) -> Text
    """Converts a PNG base64 data URL to a PNG binary data.

    Args:
        image_data_url: str. A string that is to be interpreted as a PNG
            data URL.

    Returns:
        str. Binary content of the PNG created from the data URL.

    Raises:
        Exception. The given string does not represent a PNG data URL.
    """
    if image_data_url.startswith(PNG_DATA_URL_PREFIX):
        return base64.b64decode(
            python_utils.urllib_unquote( # type: ignore[no-untyped-call]
                image_data_url[len(PNG_DATA_URL_PREFIX):]))
    else:
        raise Exception('The given string does not represent a PNG data URL.')


def convert_png_binary_to_data_url(content):
    # type: (Text) -> Text
    """Converts a PNG image string (represented by 'content') to a data URL.

    Args:
        content: str. PNG binary file content.

    Returns:
        str. Data URL created from the binary content of the PNG.

    Raises:
        Exception. The given binary string does not represent a PNG image.
    """
    # We accept unicode but imghdr.what(file, h) accept 'h' of type str.
    # So we have casted content to be str.
    content = cast(str, content)
    if imghdr.what(None, h=content) == 'png':
        return '%s%s' % (
            PNG_DATA_URL_PREFIX,
            python_utils.url_quote(base64.b64encode(content)) # type: ignore[no-untyped-call]
        )
    else:
        raise Exception('The given string does not represent a PNG image.')


def convert_png_to_data_url(filepath):
    # type: (Text) -> Text
    """Converts the png file at filepath to a data URL.

    Args:
        filepath: str. A full path to the file.

    Returns:
        str. Data url created from the filepath of the PNG.
    """
    file_contents = get_file_contents(filepath, raw_bytes=True, mode='rb')
    return convert_png_binary_to_data_url(file_contents)


def camelcase_to_hyphenated(camelcase_str):
    # type: (Text) -> Text
    """Camelcase to hyhpenated conversion of the passed string.

    Args:
        camelcase_str: str. Camelcase string representation.

    Returns:
        str. Hypenated string representation of the camelcase string.
    """
    intermediate_str = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', camelcase_str)
    return re.sub('([a-z0-9])([A-Z])', r'\1-\2', intermediate_str).lower()


def camelcase_to_snakecase(camelcase_str):
    # type: (Text) -> Text
    """Camelcase to snake case conversion of the passed string.

    Args:
        camelcase_str: str. Camelcase string representation.

    Returns:
        str. Snakecase representation of the passed camelcase string.
    """
    intermediate_str = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', camelcase_str)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', intermediate_str).lower()


def set_url_query_parameter(url, param_name, param_value):
    # type: (Text, Text, Text) -> Text
    """Set or replace a query parameter, and return the modified URL.

    Args:
        url: str. URL string which contains the query parameter.
        param_name: str. Parameter name to be removed.
        param_value: str. Set the parameter value, if it exists.

    Returns:
        str. Formated URL that has query parameter set or replaced.

    Raises:
        Exception. If the query parameter sent is not of string type,
            them this exception is raised.
    """
    if not isinstance(param_name, python_utils.BASESTRING):
        raise Exception(
            'URL query parameter name must be a string, received %s'
            % param_name)

    scheme, netloc, path, query_string, fragment = python_utils.url_split(url) # type: ignore[no-untyped-call]
    query_params = python_utils.parse_query_string(query_string) # type: ignore[no-untyped-call]

    query_params[param_name] = [param_value]
    new_query_string = python_utils.url_encode(query_params, doseq=True) # type: ignore[no-untyped-call]

    return python_utils.url_unsplit( # type: ignore[no-any-return, no-untyped-call]
        (scheme, netloc, path, new_query_string, fragment))


class JSONEncoderForHTML(json.JSONEncoder):
    """Encodes JSON that is safe to embed in HTML."""

    # Ignoring error code [override] because JSONEncoder has return type str
    # but we are returning Union[str, unicode].
    def encode(self, o): # type: ignore[override]
        # type: (Text) -> Text
        chunks = self.iterencode(o, True)
        return ''.join(chunks) if self.ensure_ascii else u''.join(chunks)

    def iterencode(self, o, _one_shot=False): # type: ignore[override]
        # type: (Text, bool) -> Iterator[Text]
        chunks = super(
            JSONEncoderForHTML, self).iterencode(o, _one_shot=_one_shot)
        for chunk in chunks:
            yield chunk.replace('&', '\\u0026').replace(
                '<', '\\u003c').replace('>', '\\u003e')


def convert_to_hash(input_string, max_length):
    # type: (Text, int) -> Text
    """Convert a string to a SHA1 hash.

    Args:
        input_string: str. Input string for conversion to hash.
        max_length: int. Maximum Length of the generated hash.

    Returns:
        str. Hash Value generated from the input_String of the
        specified length.

    Raises:
        Exception. If the input string is not the instance of the str,
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
        hashlib.sha1(
            python_utils.convert_to_bytes(input_string)).digest(), # type: ignore[no-untyped-call]
        altchars=b'ab'
    ).replace('=', 'c')

    return encoded_string[:max_length]


def base64_from_int(value):
    # type: (int) -> Text
    """Converts the number into base64 representation.

    Args:
        value: int. Integer value for conversion into base64.

    Returns:
        *. Returns the base64 representation of the number passed.
    """
    byte_value = b'[' + python_utils.convert_to_bytes(value) + b']' # type: ignore[no-untyped-call]
    return base64.b64encode(byte_value)


def get_time_in_millisecs(datetime_obj):
    # type: (datetime.datetime) -> float
    """Returns time in milliseconds since the Epoch.

    Args:
        datetime_obj: datetime. An object of type datetime.datetime.

    Returns:
        float. The time in milliseconds since the Epoch.
    """
    msecs = time.mktime(datetime_obj.timetuple()) * 1000.0
    return msecs + python_utils.divide(datetime_obj.microsecond, 1000.0) # type: ignore[no-any-return, no-untyped-call]


def convert_naive_datetime_to_string(datetime_obj):
    # type: (datetime.datetime) -> Text
    """Returns a human-readable string representing the naive datetime object.

    Args:
        datetime_obj: datetime. An object of type datetime.datetime. Must be a
            naive datetime object.

    Returns:
        str. The string representing the naive datetime object.
    """
    return datetime_obj.strftime(DATETIME_FORMAT)


def convert_string_to_naive_datetime_object(date_time_string):
    # type: (Text) -> datetime.datetime
    """Returns the naive datetime object equivalent of the date string.

    Args:
        date_time_string: str. The string format representing the datetime
            object in the format: Month/Day/Year,
            Hour:Minute:Second:MicroSecond.

    Returns:
        datetime. An object of type naive datetime.datetime corresponding to
        that string.
    """
    return datetime.datetime.strptime(date_time_string, DATETIME_FORMAT)


def get_current_time_in_millisecs():
    # type: () -> float
    """Returns time in milliseconds since the Epoch.

    Returns:
        float. The time in milliseconds since the Epoch.
    """
    return get_time_in_millisecs(datetime.datetime.utcnow())


def get_human_readable_time_string(time_msec):
    # type: (float) -> Text
    """Given a time in milliseconds since the epoch, get a human-readable
    time string for the admin dashboard.

    Args:
        time_msec: float. Time in milliseconds since the Epoch.

    Returns:
        str. A string representing the time.
    """
    # Ignoring arg-type because we are preventing direct usage of 'str' for
    # Python3 compatibilty.
    return time.strftime(
        '%B %d %H:%M:%S', time.gmtime(python_utils.divide(time_msec, 1000.0))) # type: ignore[arg-type, no-untyped-call]


def create_string_from_largest_unit_in_timedelta(timedelta_obj):
    # type: (datetime.timedelta) -> Text
    """Given the timedelta object, find the largest nonzero time unit and
    return that value, along with the time unit, as a human readable string.
    The returned string is not localized.

    Args:
        timedelta_obj: datetime.timedelta. A datetime timedelta object. Datetime
            timedelta objects are created when you subtract two datetime
            objects.

    Returns:
        str. A human readable string representing the value of the largest
        nonzero time unit, along with the time units. If the largest time unit
        is seconds, 1 minute is returned. The value is represented as an integer
        in the string.

    Raises:
        Exception. If the provided timedelta is not positive.
    """
    total_seconds = timedelta_obj.total_seconds()
    if total_seconds <= 0:
        raise Exception(
            'Expected a positive timedelta, received: %s.' % total_seconds)
    elif timedelta_obj.days != 0:
        return '%s day%s' % (
            int(timedelta_obj.days), 's' if timedelta_obj.days > 1 else '')
    else:
        number_of_hours, remainder = divmod(total_seconds, SECONDS_IN_HOUR)
        number_of_minutes, _ = divmod(remainder, SECONDS_IN_MINUTE)
        if number_of_hours != 0:
            return '%s hour%s' % (
                int(number_of_hours), 's' if number_of_hours > 1 else '')
        elif number_of_minutes > 1:
            return '%s minutes' % int(number_of_minutes)
        # Round any seconds up to one minute.
        else:
            return '1 minute'


def are_datetimes_close(later_datetime, earlier_datetime):
    # type: (datetime.datetime, datetime.datetime) -> bool
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
    # type: (int) -> Text
    """Generates a random string of the specified length.

    Args:
        length: int. Length of the string to be generated.

    Returns:
        str. Random string of specified length.
    """
    return base64.urlsafe_b64encode(os.urandom(length))[:length]


def generate_new_session_id():
    # type: () -> Text
    """Generates a new session id.

    Returns:
        str. Random string of length 24.
    """
    return generate_random_string(24)


def vfs_construct_path(base_path, *path_components):
    # type: (Text, *Text) -> Text
    """Mimics behavior of os.path.join on Posix machines.

    Args:
        base_path: str. The initial path upon which components would be added.
        *path_components: list(str). Components that would be added to the path.

    Returns:
        str. The path that is obtained after adding the components.
    """
    return os.path.join(base_path, *path_components)


def vfs_normpath(path):
    # type: (Text) -> Text
    """Normalize path from posixpath.py, eliminating double slashes, etc.

    Args:
        path: str. Path that is to be normalized.

    Returns:
        str. Path if it is not null else a dot string.
    """
    return os.path.normpath(path)


def require_valid_name(name, name_type, allow_empty=False):
    # type: (Text, Text, bool) -> None
    """Generic name validation.

    Args:
        name: str. The name to validate.
        name_type: str. A human-readable string, like 'the exploration title' or
            'a state name'. This will be shown in error messages.
        allow_empty: bool. If True, empty strings are allowed.

    Raises:
        ValidationError. Name isn't a string.
        ValidationError. The length of the name_type isn't between
            1 and 50.
        ValidationError. Name starts or ends with whitespace.
        ValidationError. Adjacent whitespace in name_type isn't collapsed.
        ValidationError. Invalid character is present in name.
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


def require_valid_url_fragment(name, name_type, allowed_length):
    # type: (Text, Text, int) -> None
    """Generic URL fragment validation.

    Args:
        name: str. The name to validate.
        name_type: str. A human-readable string, like 'topic url fragment'.
            This will be shown in error messages.
        allowed_length: int. Allowed length for the name.

    Raises:
        ValidationError. Name is not a string.
        ValidationError. Name is empty.
        ValidationError. The length of the name_type is not correct.
        ValidationError. Invalid character is present in the name.
    """
    if not isinstance(name, python_utils.BASESTRING):
        raise ValidationError(
            '%s field must be a string. Received %s.' % (name_type, name))

    if name == '':
        raise ValidationError(
            '%s field should not be empty.' % name_type)

    if len(name) > allowed_length:
        raise ValidationError(
            '%s field should not exceed %d characters, '
            'received %s.' % (name_type, allowed_length, name))

    if not re.match(constants.VALID_URL_FRAGMENT_REGEX, name):
        raise ValidationError(
            '%s field contains invalid characters. Only lowercase words'
            ' separated by hyphens are allowed. Received %s.' % (
                name_type, name))


def require_valid_thumbnail_filename(thumbnail_filename):
    # type: (Text) -> None
    """Generic thumbnail filename validation.

        Args:
            thumbnail_filename: str. The thumbnail filename to validate.

        Raises:
            ValidationError. Thumbnail filename is not a string.
            ValidationError. Thumbnail filename does start with a dot.
            ValidationError. Thumbnail filename includes slashes
                or consecutive dots.
            ValidationError. Thumbnail filename does not include an extension.
            ValidationError. Thumbnail filename extension is not svg.
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


def require_valid_meta_tag_content(meta_tag_content):
    # type: (Text) -> None
    """Generic meta tag content validation.

        Args:
            meta_tag_content: str. The meta tag content to validate.

        Raises:
            ValidationError. Meta tag content is not a string.
            ValidationError. Meta tag content is longer than expected.
        """
    if not isinstance(meta_tag_content, python_utils.BASESTRING):
        raise ValidationError(
            'Expected meta tag content to be a string, received %s'
            % meta_tag_content)
    if len(meta_tag_content) > constants.MAX_CHARS_IN_META_TAG_CONTENT:
        raise ValidationError(
            'Meta tag content should not be longer than %s characters.'
            % constants.MAX_CHARS_IN_META_TAG_CONTENT)


def require_valid_page_title_fragment_for_web(page_title_fragment_for_web):
    # type: (Text) -> None
    """Generic page title fragment validation.

    Args:
        page_title_fragment_for_web: str. The page title fragment to validate.

    Raises:
        ValidationError. Page title fragment is not a string.
        ValidationError. Page title fragment is too lengthy.
    """
    max_chars_in_page_title_frag_for_web = (
        constants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB)
    if not isinstance(page_title_fragment_for_web, python_utils.BASESTRING):
        raise ValidationError(
            'Expected page title fragment to be a string, received %s'
            % page_title_fragment_for_web)
    if len(page_title_fragment_for_web) > max_chars_in_page_title_frag_for_web:
        raise ValidationError(
            'Page title fragment should not be longer than %s characters.'
            % constants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB)


def capitalize_string(input_string):
    # type: (Text) -> Text
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
    # type: (Text) -> Text
    """Returns the category, it returns the color associated with the category,
    if the category is present in the app constants else given a default color.

    Args:
        category: str. Category to get color.

    Returns:
        str. Color assigned to that category.
    """
    return ( # type: ignore[no-any-return]
        constants.CATEGORIES_TO_COLORS[category]
        if category in constants.CATEGORIES_TO_COLORS
        else constants.DEFAULT_COLOR)


def get_thumbnail_icon_url_for_category(category):
    # type: (Text) -> Text
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
    # type: (Text) -> bool
    """Checks if the given language code is a supported audio language code.

    Args:
        language_code: str. The language code.

    Returns:
        bool. Whether the language code is supported audio language code or not.
    """
    language_codes = [lc['id'] for lc in constants.SUPPORTED_AUDIO_LANGUAGES]
    return language_code in language_codes


def is_valid_language_code(language_code):
    # type: (Text) -> bool
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
    # type: (Text) -> Text
    """Returns the language description for the given language code.

    Args:
        language_code: str. The language code for which the description is
            required.

    Returns:
        str. The language description for the given language code.

    Raises:
        Exception. If the given language code is unsupported.
    """
    for language in constants.SUPPORTED_AUDIO_LANGUAGES:
        if language['id'] == language_code:
            return language['description'] # type: ignore[no-any-return]
    raise Exception('Unsupported audio language code: %s' % language_code)


def is_user_id_valid(
        user_id, allow_system_user_id=False, allow_pseudonymous_id=False):
    # type: (Text, bool, bool) -> bool
    """Verify that the user ID is in a correct format or that it belongs to
    a system user.

    Args:
        user_id: str. The user ID to be checked.
        allow_system_user_id: bool. Whether to allow system user ID.
        allow_pseudonymous_id: bool. Whether to allow pseudonymized ID.

    Returns:
        bool. True when the ID is in a correct format or if the ID belongs to
        a system user, False otherwise.
    """
    if allow_system_user_id and user_id in feconf.SYSTEM_USERS.keys():
        return True

    if allow_pseudonymous_id and is_pseudonymous_id(user_id):
        return True

    return bool(re.match(feconf.USER_ID_REGEX, user_id))


def is_pseudonymous_id(user_id):
    # type: (Text) -> bool
    """Check that the ID is a pseudonymous one.

    Args:
        user_id: str. The ID to be checked.

    Returns:
        bool. Whether the ID represents a pseudonymous user.
    """
    return bool(re.match(feconf.PSEUDONYMOUS_ID_REGEX, user_id))


def unescape_encoded_uri_component(escaped_string):
    # type: (Text) -> Text
    """Unescape a string that is encoded with encodeURIComponent.

    Args:
        escaped_string: str. String that is encoded with encodeURIComponent.

    Returns:
        str. Decoded string that was initially encoded with encodeURIComponent.
    """
    return python_utils.urllib_unquote(escaped_string).decode('utf-8') # type: ignore[no-any-return, no-untyped-call]


def snake_case_to_camel_case(snake_str):
    # type: (Text) -> Text
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
    # type: () -> Text
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
    # type: (Any) -> Any
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
        *. A new object that will always have the same hash for "equivalent"
        values.
    """
    if isinstance(value, list):
        return tuple(get_hashable_value(e) for e in value)
    elif isinstance(value, dict):
        return tuple(sorted(
            # Dict keys are already hashable, only values need converting.
            (k, get_hashable_value(v)) for k, v in value.items()))
    else:
        return value


def compress_to_zlib(data):
    # type: (Text) -> Text
    """Compress the data to zlib format for efficient storage and communication.

    Args:
        data: str. Data to be compressed.

    Returns:
        str. Compressed data string.
    """
    # Ignoring arg-type because we are preventing direct usage of 'str' for
    # Python3 compatibilty. For details, refer to:
    # https://github.com/oppia/oppia/wiki/Backend-Type-Annotations#1-use-typingtext-instead-of-str-and-unicode
    return zlib.compress(data) # type: ignore[arg-type]


def decompress_from_zlib(data):
    # type: (Text) -> Text
    """Decompress the zlib compressed data.

    Args:
        data: str. Data to be decompressed.

    Returns:
        str. Decompressed data string.
    """
    # Ignoring arg-type because we are preventing direct usage of 'str' for
    # Python3 compatibilty.
    return zlib.decompress(data) # type: ignore[arg-type]


def compute_list_difference(list_a, list_b):
    # type: (List[Any], List[Any]) -> List[Any]
    """Returns the set difference of two lists.

    Args:
        list_a: list. The first list.
        list_b: list. The second list.

    Returns:
        list. List of the set difference of list_a - list_b.
    """
    return list(set(list_a) - set(list_b))


# Ignoring type-arg because error thrown is 'Missing type parameters for generic
# type "OrderedDict"' but here we don't need to specify this.
class OrderedCounter(collections.Counter, collections.OrderedDict): # type: ignore[type-arg]
    """Counter that remembers the order elements are first encountered."""

    pass


def grouper(iterable, chunk_len, fillvalue=None):
    # type: (Iterable[T], int, Optional[T]) -> Iterable[Iterable[T]]
    """Collect data into fixed-length chunks.

    Source: https://docs.python.org/3/library/itertools.html#itertools-recipes.

    Example:
        grouper('ABCDEFG', 3, 'x') --> ABC DEF Gxx

    Args:
        iterable: iterable. Any kind of iterable object.
        chunk_len: int. The chunk size of each group.
        fillvalue: *. The value used to fill out the last chunk in case the
            iterable is exhausted.

    Returns:
        iterable(iterable). A sequence of chunks over the input data.
    """
    # To understand how/why this works, please refer to the following
    # Stack Overflow answer: https://stackoverflow.com/a/49181132/4859885.
    args = [iter(iterable)] * chunk_len
    return python_utils.zip_longest(*args, fillvalue=fillvalue) # type: ignore[no-any-return, no-untyped-call]


def partition(iterable, predicate=bool, enumerated=False):
    # type: (Iterable[T], Callable[..., Any], bool) -> Tuple[Iterable[Union[T, Tuple[int,T]]], Iterable[Union[T, Tuple[int,T]]]]
    """Returns two generators which split the iterable based on the predicate.

    NOTE: The predicate is called AT MOST ONCE per item.

    Example:
        is_even = lambda n: (n % 2) == 0
        evens, odds = partition([10, 8, 1, 5, 6, 4, 3, 7], is_even)
        assert list(evens) == [10, 8, 6, 4]
        assert list(odds) == [1, 5, 3, 7]


        logs = ['ERROR: foo', 'INFO: bar', 'INFO: fee', 'ERROR: fie']
        is_error = lambda msg: msg.startswith('ERROR: ')
        errors, others = partition(logs, is_error, enumerated=True)

        for i, error in errors:
            raise Exception('Log index=%d failed for reason: %s' % (i, error))
        for i, message in others:
            logging.info('Log index=%d: %s' % (i, message))

    Args:
        iterable: iterable. Any kind of iterable object.
        predicate: callable. A function which accepts an item and returns True
            or False.
        enumerated: bool. Whether the partitions should include their original
            indices.

    Returns:
        tuple(iterable, iterable). Two distinct generators. The first generator
        will hold values which passed the predicate. The second will hold the
        values which did not. If enumerated is True, then the generators will
        yield (index, item) pairs. Otherwise, the generators will yield items by
        themselves.
    """
    if enumerated:
        new_iterable = enumerate(
            iterable) # type: Iterable[Union[T, Tuple[int, T]]]
        old_predicate = predicate
        predicate = lambda pair: old_predicate(pair[1])
    else:
        new_iterable = iterable

    # Creates two distinct generators over the same iterable. Memory-efficient.
    true_part, false_part = itertools.tee(
        (i, predicate(i)) for i in new_iterable)
    return (
        (i for i, predicate_is_true in true_part if predicate_is_true),
        (i for i, predicate_is_true in false_part if not predicate_is_true))


def quoted(s):
    # type: (Text) -> Text
    """Returns a string enclosed in quotes, escaping any quotes within it.

    Args:
        s: str. The string to quote.

    Returns:
        str. The quoted string.
    """
    return json.dumps(s)
