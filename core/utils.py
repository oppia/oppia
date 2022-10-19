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

from __future__ import annotations

import base64
import binascii
import collections
import datetime
import hashlib
import imghdr
import itertools
import json
import os
import random
import re
import ssl
import string
import time
import unicodedata
import urllib.parse
import urllib.request
import zlib

from core import feconf
from core.constants import constants

import certifi
import yaml

from typing import ( # isort:skip
    Any, BinaryIO, Callable, Dict, Iterable, Iterator, List, Mapping,
    Literal, Optional, TextIO, Tuple, TypeVar, Union, cast, overload)

DATETIME_FORMAT = '%m/%d/%Y, %H:%M:%S:%f'
ISO_8601_DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S.%fz'
PNG_DATA_URL_PREFIX = 'data:image/png;base64,'
SECONDS_IN_HOUR = 60 * 60
SECONDS_IN_MINUTE = 60

T = TypeVar('T')

TextModeTypes = Literal['r', 'w', 'a', 'x', 'r+', 'w+', 'a+']
BinaryModeTypes = Literal['rb', 'wb', 'ab', 'xb', 'r+b', 'w+b', 'a+b', 'x+b']

# TODO(#13059): We will be ignoring no-untyped-call and no-any-return here
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


@overload
def open_file(
    filename: str,
    mode: TextModeTypes,
    encoding: str = 'utf-8',
    newline: Union[str, None] = None
) -> TextIO: ...


@overload
def open_file(
    filename: str,
    mode: BinaryModeTypes,
    encoding: Union[str, None] = 'utf-8',
    newline: Union[str, None] = None
) -> BinaryIO: ...


def open_file(
    filename: str,
    mode: Union[TextModeTypes, BinaryModeTypes],
    encoding: Union[str, None] = 'utf-8',
    newline: Union[str, None] = None
) -> Union[BinaryIO, TextIO]:
    """Open file and return a corresponding file object.

    Args:
        filename: str. The file to be opened.
        mode: Literal. Mode in which the file is opened.
        encoding: str. Encoding in which the file is opened.
        newline: None|str. Controls how universal newlines work.

    Returns:
        IO[Any]. The file object.

    Raises:
        FileNotFoundError. The file cannot be found.
    """
    # Here we use cast because we are narrowing down the type from IO[Any]
    # to Union[BinaryIO, TextIO].
    file = cast(
        Union[BinaryIO, TextIO],
        open(filename, mode, encoding=encoding, newline=newline)
    )
    return file


@overload
def get_file_contents(filepath: str) -> str: ...


@overload
def get_file_contents(
    filepath: str, *, mode: str = 'r'
) -> str: ...


@overload
def get_file_contents(
    filepath: str, *, raw_bytes: Literal[False], mode: str = 'r'
) -> str: ...


@overload
def get_file_contents(
    filepath: str, *, raw_bytes: Literal[True], mode: str = 'r'
) -> bytes: ...


def get_file_contents(
    filepath: str, raw_bytes: bool = False, mode: str = 'r'
) -> Union[str, bytes]:
    """Gets the contents of a file, given a relative filepath
    from oppia.

    Args:
        filepath: str. A full path to the file.
        raw_bytes: bool. Flag for the raw_bytes output.
        mode: str. File opening mode, default is in read mode.

    Returns:
        Union[str, bytes]. Either the raw_bytes stream ( bytes type ) if
        the raw_bytes is True or the decoded stream ( string type ) in
        utf-8 format if raw_bytes is False.
    """
    if raw_bytes:
        mode = 'rb'
        encoding = None
    else:
        encoding = 'utf-8'

    with open(
        filepath, mode, encoding=encoding) as f:
        file_contents = f.read()
        # Ruling out the possibility of Any other type for mypy type checking.
        assert isinstance(file_contents, (str, bytes))
        return file_contents


def get_exploration_components_from_dir(
        dir_path: str
) -> Tuple[str, List[Tuple[str, bytes]]]:
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
            if root == dir_path and directory not in ('assets', '__pycache__'):
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
                    if not filepath.endswith('.yaml'):
                        raise Exception(
                            'Found invalid non-asset file %s. There '
                            'should only be a single non-asset file, '
                            'and it should have a .yaml suffix.' % filepath)

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


def get_comma_sep_string_from_list(items: List[str]) -> str:
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


def to_ascii(input_string: str) -> str:
    """Change unicode characters in a string to ascii if possible.

    Args:
        input_string: str. String to convert.

    Returns:
        str. String containing the ascii representation of the input string.
    """
    normalized_string = unicodedata.normalize('NFKD', str(input_string))
    return normalized_string.encode('ascii', 'ignore').decode('ascii')


# Here we use type Any because this function accepts general structured
# yaml string, hence Any type has to be used here for the type of returned
# dictionary.
def dict_from_yaml(yaml_str: str) -> Dict[str, Any]:
    """Gets the dict representation of a YAML string.

    Args:
        yaml_str: str. Yaml string for conversion into dict.

    Returns:
        dict. Parsed dict representation of the yaml string.

    Raises:
        InvalidInputException. If the yaml string sent as the
            parameter is unable to get parsed, them this error gets
            raised.
    """
    try:
        retrieved_dict = yaml.safe_load(yaml_str)
        assert isinstance(retrieved_dict, dict)
        return retrieved_dict
    except (AssertionError, yaml.YAMLError) as e:
        raise InvalidInputException(e) from e


# Here we use type Any because we want to accept both Dict and TypedDict
# types of values here.
def yaml_from_dict(dictionary: Mapping[str, Any], width: int = 80) -> str:
    """Gets the YAML representation of a dict.

    Args:
        dictionary: dict. Dictionary for conversion into yaml.
        width: int. Width for the yaml representation, default value
            is set to be of 80.

    Returns:
        str. Converted yaml of the passed dictionary.
    """
    yaml_str: str = yaml.dump(
        dictionary, allow_unicode=True, width=width
    )
    return yaml_str


# Here we use type Any because here obj has a recursive structure. The list
# element or dictionary value could recursively be the same structure, hence
# we use Any as their types.
def recursively_remove_key(
        obj: Union[Dict[str, Any], List[Any]], key_to_remove: str
) -> None:
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


def get_random_int(upper_bound: int) -> int:
    """Returns a random integer in [0, upper_bound).

    Args:
        upper_bound: int. Upper limit for generation of random
            integer.

    Returns:
        int. Randomly generated integer less than the upper_bound.
    """
    assert upper_bound >= 0 and isinstance(upper_bound, int), (
        'Only positive integers allowed'
    )
    generator = random.SystemRandom()
    return generator.randrange(0, stop=upper_bound)


def get_random_choice(alist: List[T]) -> T:
    """Gets a random element from a list.

    Args:
        alist: list(*). Input to get a random choice.

    Returns:
        *. Random element choosen from the passed input list.
    """
    assert isinstance(alist, list) and len(alist) > 0, (
        'Only non-empty lists allowed'
    )
    index = get_random_int(len(alist))
    return alist[index]


def convert_png_data_url_to_binary(image_data_url: str) -> bytes:
    """Converts a PNG base64 data URL to a PNG binary data.

    Args:
        image_data_url: str. A string that is to be interpreted as a PNG
            data URL.

    Returns:
        bytes. Binary content of the PNG created from the data URL.

    Raises:
        Exception. The given string does not represent a PNG data URL.
    """
    if image_data_url.startswith(PNG_DATA_URL_PREFIX):
        return base64.b64decode(
            urllib.parse.unquote(
                image_data_url[len(PNG_DATA_URL_PREFIX):]))
    else:
        raise Exception('The given string does not represent a PNG data URL.')


def convert_png_binary_to_data_url(content: bytes) -> str:
    """Converts a PNG image string (represented by 'content') to a data URL.

    Args:
        content: str. PNG binary file content.

    Returns:
        str. Data URL created from the binary content of the PNG.

    Raises:
        Exception. The given binary string does not represent a PNG image.
    """
    if imghdr.what(None, h=content) == 'png':
        return '%s%s' % (
            PNG_DATA_URL_PREFIX, urllib.parse.quote(base64.b64encode(content))
        )
    else:
        raise Exception('The given string does not represent a PNG image.')


def is_base64_encoded(content: str) -> bool:
    """Checks if a string is base64 encoded.

    Args:
        content: str. String to check.

    Returns:
        bool. True if a string is base64 encoded, False otherwise.
    """
    try:
        base64.b64decode(content, validate=True)
        return True
    except binascii.Error:
        return False


def convert_png_to_data_url(filepath: str) -> str:
    """Converts the png file at filepath to a data URL.

    Args:
        filepath: str. A full path to the file.

    Returns:
        str. Data url created from the filepath of the PNG.
    """
    file_contents = get_file_contents(filepath, raw_bytes=True, mode='rb')
    return convert_png_binary_to_data_url(file_contents)


def camelcase_to_hyphenated(camelcase_str: str) -> str:
    """Camelcase to hyhpenated conversion of the passed string.

    Args:
        camelcase_str: str. Camelcase string representation.

    Returns:
        str. Hypenated string representation of the camelcase string.
    """
    intermediate_str = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', camelcase_str)
    return re.sub('([a-z0-9])([A-Z])', r'\1-\2', intermediate_str).lower()


def camelcase_to_snakecase(camelcase_str: str) -> str:
    """Camelcase to snake case conversion of the passed string.

    Args:
        camelcase_str: str. Camelcase string representation.

    Returns:
        str. Snakecase representation of the passed camelcase string.
    """
    intermediate_str = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', camelcase_str)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', intermediate_str).lower()


def set_url_query_parameter(
        url: str, param_name: str, param_value: str
) -> str:
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
    if not isinstance(param_name, str):
        raise Exception(
            'URL query parameter name must be a string, received %s'
            % param_name)

    scheme, netloc, path, query_string, fragment = urllib.parse.urlsplit(url)
    query_params = urllib.parse.parse_qs(query_string)

    query_params[param_name] = [param_value]
    new_query_string = urllib.parse.urlencode(query_params, doseq=True)

    return urllib.parse.urlunsplit(
        (scheme, netloc, path, new_query_string, fragment))


class JSONEncoderForHTML(json.JSONEncoder):
    """Encodes JSON that is safe to embed in HTML."""

    # Ignoring error code [override] because JSONEncoder has return type str
    # but we are returning Union[str, unicode].
    def encode(self, o: str) -> str:
        chunks = self.iterencode(o, True)
        return ''.join(chunks) if self.ensure_ascii else u''.join(chunks)

    def iterencode(self, o: str, _one_shot: bool = False) -> Iterator[str]:
        chunks = super().iterencode(o, _one_shot=_one_shot)
        for chunk in chunks:
            yield chunk.replace('&', '\\u0026').replace(
                '<', '\\u003c').replace('>', '\\u003e')


def convert_to_hash(input_string: str, max_length: int) -> str:
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
    if not isinstance(input_string, str):
        raise Exception(
            'Expected string, received %s of type %s' %
            (input_string, type(input_string)))

    # Encodes strings using the character set [A-Za-z0-9].
    # Prefixing altchars with b' to ensure that all characters in encoded_string
    # remain encoded (otherwise encoded_string would be of type unicode).
    encoded_string = base64.b64encode(
        hashlib.sha1(input_string.encode('utf-8')).digest(),
        altchars=b'ab'
    ).replace(b'=', b'c')

    return encoded_string[:max_length].decode('utf-8')


def base64_from_int(value: int) -> str:
    """Converts the number into base64 representation.

    Args:
        value: int. Integer value for conversion into base64.

    Returns:
        str. Returns the base64 representation of the number passed.
    """
    byte_value = b'[' + str(value).encode('utf-8') + b']'
    return base64.b64encode(byte_value).decode('utf-8')


def get_time_in_millisecs(datetime_obj: datetime.datetime) -> float:
    """Returns time in milliseconds since the Epoch.

    Args:
        datetime_obj: datetime. An object of type datetime.datetime.

    Returns:
        float. The time in milliseconds since the Epoch.
    """
    msecs = time.mktime(datetime_obj.timetuple()) * 1000.0
    return msecs + (datetime_obj.microsecond / 1000.0)


def convert_naive_datetime_to_string(datetime_obj: datetime.datetime) -> str:
    """Returns a human-readable string representing the naive datetime object.

    Args:
        datetime_obj: datetime. An object of type datetime.datetime. Must be a
            naive datetime object.

    Returns:
        str. The string representing the naive datetime object.
    """
    return datetime_obj.strftime(DATETIME_FORMAT)


def convert_string_to_naive_datetime_object(
        date_time_string: str
) -> datetime.datetime:
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


def get_current_time_in_millisecs() -> float:
    """Returns time in milliseconds since the Epoch.

    Returns:
        float. The time in milliseconds since the Epoch.
    """
    return get_time_in_millisecs(datetime.datetime.utcnow())


def get_human_readable_time_string(time_msec: float) -> str:
    """Given a time in milliseconds since the epoch, get a human-readable
    time string for the admin dashboard.

    Args:
        time_msec: float. Time in milliseconds since the Epoch.

    Returns:
        str. A string representing the time.
    """
    # Ignoring arg-type because we are preventing direct usage of 'str' for
    # Python3 compatibilty.

    assert time_msec >= 0, (
        'Time cannot be negative'
    )
    return time.strftime(
        '%B %d %H:%M:%S', time.gmtime(time_msec / 1000.0))


def create_string_from_largest_unit_in_timedelta(
        timedelta_obj: datetime.timedelta
) -> str:
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
    if timedelta_obj.days != 0:
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


def are_datetimes_close(
        later_datetime: datetime.datetime,
        earlier_datetime: datetime.datetime
) -> bool:
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


def generate_random_string(length: int) -> str:
    """Generates a random string of the specified length.

    Args:
        length: int. Length of the string to be generated.

    Returns:
        str. Random string of specified length.
    """
    return base64.urlsafe_b64encode(os.urandom(length))[:length].decode('utf-8')


def generate_new_session_id() -> str:
    """Generates a new session id.

    Returns:
        str. Random string of length 24.
    """
    return generate_random_string(24)


def vfs_construct_path(base_path: str, *path_components: str) -> str:
    """Mimics behavior of os.path.join on Posix machines.

    Args:
        base_path: str. The initial path upon which components would be added.
        *path_components: list(str). Components that would be added to the path.

    Returns:
        str. The path that is obtained after adding the components.
    """
    return os.path.join(base_path, *path_components)


def vfs_normpath(path: str) -> str:
    """Normalize path from posixpath.py, eliminating double slashes, etc.

    Args:
        path: str. Path that is to be normalized.

    Returns:
        str. Path if it is not null else a dot string.
    """
    return os.path.normpath(path)


def require_valid_name(
        name: str, name_type: str, allow_empty: bool = False
) -> None:
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
    if not isinstance(name, str):
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
                r'Invalid character %s in %s: %s' %
                (character, name_type, name))


def require_valid_url_fragment(
        name: str, name_type: str, allowed_length: int
) -> None:
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
    if not isinstance(name, str):
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


def require_valid_thumbnail_filename(thumbnail_filename: str) -> None:
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
        if not isinstance(thumbnail_filename, str):
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


def require_valid_image_filename(image_filename: str) -> None:
    """Generic image filename validation.

        Args:
            image_filename: str. The image filename to validate.

        Raises:
            ValidationError. Image filename is not a string.
            ValidationError. Image filename does start with a dot.
            ValidationError. Image filename includes slashes
                or consecutive dots.
            ValidationError. Image filename does not include an extension.
        """
    if image_filename is not None:
        if not isinstance(image_filename, str):
            raise ValidationError(
                'Expected image filename to be a string, received %s'
                % image_filename)
        if image_filename.rfind('.') == 0:
            raise ValidationError(
                'Image filename should not start with a dot.')
        if '/' in image_filename or '..' in image_filename:
            raise ValidationError(
                'Image filename should not include slashes or '
                'consecutive dot characters.')
        if '.' not in image_filename:
            raise ValidationError(
                'Image filename should include an extension.')


def require_valid_meta_tag_content(meta_tag_content: str) -> None:
    """Generic meta tag content validation.

        Args:
            meta_tag_content: str. The meta tag content to validate.

        Raises:
            ValidationError. Meta tag content is not a string.
            ValidationError. Meta tag content is longer than expected.
        """
    if not isinstance(meta_tag_content, str):
        raise ValidationError(
            'Expected meta tag content to be a string, received %s'
            % meta_tag_content)
    if len(meta_tag_content) > constants.MAX_CHARS_IN_META_TAG_CONTENT:
        raise ValidationError(
            'Meta tag content should not be longer than %s characters.'
            % constants.MAX_CHARS_IN_META_TAG_CONTENT)


def require_valid_page_title_fragment_for_web(
        page_title_fragment_for_web: str
) -> None:
    """Generic page title fragment validation.

    Args:
        page_title_fragment_for_web: str. The page title fragment to validate.

    Raises:
        ValidationError. Page title fragment is not a string.
        ValidationError. Page title fragment is too lengthy.
        ValidationError. Page title fragment is too small.
    """
    max_chars_in_page_title_frag_for_web = (
        constants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB)
    min_chars_in_page_title_frag_for_web = (
        constants.MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB)

    if not isinstance(page_title_fragment_for_web, str):
        raise ValidationError(
            'Expected page title fragment to be a string, received %s'
            % page_title_fragment_for_web)
    if len(page_title_fragment_for_web) > max_chars_in_page_title_frag_for_web:
        raise ValidationError(
            'Page title fragment should not be longer than %s characters.'
            % constants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB)
    if len(page_title_fragment_for_web) < min_chars_in_page_title_frag_for_web:
        raise ValidationError(
            'Page title fragment should not be shorter than %s characters.'
            % constants.MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB
        )


def capitalize_string(input_string: str) -> str:
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


def get_hex_color_for_category(category: str) -> str:
    """Returns the category, it returns the color associated with the category,
    if the category is present in the app constants else given a default color.

    Args:
        category: str. Category to get color.

    Returns:
        str. Color assigned to that category.
    """
    color: str = (
        constants.CATEGORIES_TO_COLORS[category]
        if category in constants.CATEGORIES_TO_COLORS
        else constants.DEFAULT_COLOR)
    return color


def get_thumbnail_icon_url_for_category(category: str) -> str:
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


def is_supported_audio_language_code(language_code: str) -> bool:
    """Checks if the given language code is a supported audio language code.

    Args:
        language_code: str. The language code.

    Returns:
        bool. Whether the language code is supported audio language code or not.
    """
    language_codes = [lc['id'] for lc in constants.SUPPORTED_AUDIO_LANGUAGES]
    return language_code in language_codes


def is_valid_language_code(language_code: str) -> bool:
    """Checks if the given language code is a valid language code.

    Args:
        language_code: str. The language code.

    Returns:
        bool. Whether the language code is valid or not.
    """
    language_codes = [
        lc['code'] for lc in constants.SUPPORTED_CONTENT_LANGUAGES]
    return language_code in language_codes


def get_supported_audio_language_description(language_code: str) -> str:
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
            description: str = language['description']
            return description
    raise Exception('Unsupported audio language code: %s' % language_code)


def is_user_id_valid(
        user_id: str,
        allow_system_user_id: bool = False,
        allow_pseudonymous_id: bool = False
) -> bool:
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
    if allow_system_user_id and user_id in feconf.SYSTEM_USERS:
        return True

    if allow_pseudonymous_id and is_pseudonymous_id(user_id):
        return True

    return bool(re.match(feconf.USER_ID_REGEX, user_id))


def is_pseudonymous_id(user_id: str) -> bool:
    """Check that the ID is a pseudonymous one.

    Args:
        user_id: str. The ID to be checked.

    Returns:
        bool. Whether the ID represents a pseudonymous user.
    """
    return bool(re.match(feconf.PSEUDONYMOUS_ID_REGEX, user_id))


def unescape_encoded_uri_component(escaped_string: str) -> str:
    """Unescape a string that is encoded with encodeURIComponent.

    Args:
        escaped_string: str. String that is encoded with encodeURIComponent.

    Returns:
        str. Decoded string that was initially encoded with encodeURIComponent.
    """
    return urllib.parse.unquote(escaped_string)


def get_formatted_query_string(escaped_string: str) -> str:
    """Returns a formatted query string that can be used to perform search
    operations from escaped query string in url.

    Args:
        escaped_string: str. Query string that is encoded with
            encodeURIComponent.

    Returns:
        str. Formatted query string which can be directly used to perform
        search.
    """
    query_string = unescape_encoded_uri_component(escaped_string)
    # Remove all punctuation from the query string, and replace it with
    # spaces. See http://stackoverflow.com/a/266162 and
    # http://stackoverflow.com/a/11693937
    remove_punctuation_map = dict(
        (ord(char), None) for char in string.punctuation)
    return query_string.translate(remove_punctuation_map)


def convert_filter_parameter_string_into_list(filter_string: str) -> List[str]:
    """Converts the filter parameter string into a list of applied filter
    values. Filter string should be in the following form:
    ("Algebra" OR "Math" OR "Geometry"), ("hi" OR "en"), ("Fractions")

    Args:
        filter_string: str. The filter parameter string.

    Returns:
        list(str). The list of strings.
    """
    # The 2 and -2 account for the '("" and '")' characters at the beginning and
    # end.
    return (
        filter_string[2:-2].split('" OR "') if filter_string else []
    )


def snake_case_to_camel_case(snake_str: str) -> str:
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


def get_asset_dir_prefix() -> str:
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


# Here we use type Any because as mentioned in the documentation, `value` can
# have any general type which a JSON object can represent, hence its type is
# chosen as Any. Since we recursively convert this general json object into
# tuple or sorted tuple, the return type will also be of type Any.
def get_hashable_value(value: Any) -> Any:
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


def compress_to_zlib(data: bytes) -> bytes:
    """Compress the data to zlib format for efficient storage and communication.

    Args:
        data: str. Data to be compressed.

    Returns:
        str. Compressed data string.
    """
    return zlib.compress(data)


def decompress_from_zlib(data: bytes) -> bytes:
    """Decompress the zlib compressed data.

    Args:
        data: str. Data to be decompressed.

    Returns:
        str. Decompressed data string.
    """
    return zlib.decompress(data)


# The mentioned types can be changed in future if they are inadequate to
# represent the types handled by this function.
def compute_list_difference(list_a: List[str], list_b: List[str]) -> List[str]:
    """Returns the set difference of two lists.

    Args:
        list_a: list. The first list.
        list_b: list. The second list.

    Returns:
        list. List of the set difference of list_a - list_b.
    """
    return list(sorted(set(list_a) - set(list_b)))


# Here we use MyPy ignore because the flag 'disallow-any-generics' is disabled
# in MyPy settings and this flag does not allow generic types to be defined
# without type parameters, but here to count the order elements, we are
# inheriting from OrderedDict type without providing type parameters which
# cause MyPy to throw an error. Thus, to avoid the error, we used ignore here.
class OrderedCounter(collections.Counter, collections.OrderedDict): # type: ignore[type-arg]
    """Counter that remembers the order elements are first encountered."""

    pass


def grouper(
        iterable: Iterable[T],
        chunk_len: int,
        fillvalue: Optional[T] = None
) -> Iterable[Iterable[T]]:
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
    return itertools.zip_longest(*args, fillvalue=fillvalue)


def partition(
        iterable: Iterable[T],
        predicate: Callable[..., bool] = bool,
        enumerated: bool = False
) -> Tuple[
        Iterable[Union[T, Tuple[int, T]]],
        Iterable[Union[T, Tuple[int, T]]]]:
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
        new_iterable: Iterable[Union[T, Tuple[int, T]]] = enumerate(
            iterable)
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


def quoted(s: str) -> str:
    """Returns a string enclosed in quotes, escaping any quotes within it.

    Args:
        s: str. The string to quote.

    Returns:
        str. The quoted string.
    """
    return json.dumps(s)


def url_open(
    source_url: Union[str, urllib.request.Request]
) -> urllib.request._UrlopenRet:
    """Opens a URL and returns the response.

    Args:
        source_url: Union[str, Request]. The URL.

    Returns:
        urlopen. The 'urlopen' object.
    """
    # TODO(#12912): Remove pylint disable after the arg-name-for-non-keyword-arg
    # check is refactored.
    context = ssl.create_default_context(cafile=certifi.where())  # pylint: disable=arg-name-for-non-keyword-arg
    return urllib.request.urlopen(source_url, context=context)


def escape_html(unescaped_html_data: str) -> str:
    """This functions escapes an unescaped HTML string.

    Args:
        unescaped_html_data: str. Unescaped HTML string to be escaped.

    Returns:
        str. Escaped HTML string.
    """
    # Replace list to escape html strings.
    replace_list_for_escaping = [
        ('&', '&amp;'),
        ('"', '&quot;'),
        ('\'', '&#39;'),
        ('<', '&lt;'),
        ('>', '&gt;')
    ]
    escaped_html_data = unescaped_html_data
    for replace_tuple in replace_list_for_escaping:
        escaped_html_data = escaped_html_data.replace(
            replace_tuple[0], replace_tuple[1])

    return escaped_html_data


def unescape_html(escaped_html_data: str) -> str:
    """This function unescapes an escaped HTML string.

    Args:
        escaped_html_data: str. Escaped HTML string to be unescaped.

    Returns:
        str. Unescaped HTML string.
    """
    # Replace list to unescape html strings.
    replace_list_for_unescaping = [
        ('&quot;', '"'),
        ('&#39;', '\''),
        ('&lt;', '<'),
        ('&gt;', '>'),
        ('&amp;', '&')
    ]
    unescaped_html_data = escaped_html_data
    for replace_tuple in replace_list_for_unescaping:
        unescaped_html_data = unescaped_html_data.replace(
            replace_tuple[0], replace_tuple[1])

    return unescaped_html_data
