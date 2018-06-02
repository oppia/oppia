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

import StringIO
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
import time
import unicodedata
import urllib
import urlparse
import zipfile

import bs4
from constants import constants  # pylint: disable=relative-import
import feconf  # pylint: disable=relative-import

import yaml


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
    enums = dict(zip(sequential, sequential), **names)
    return type('Enum', (), enums)


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
    with open(filepath, mode) as f:
        return f.read() if raw_bytes else f.read().decode('utf-8')


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
        Exception: if the following condition doesn't hold: "There is exactly
            one file not in assets/, and this file has a .yaml suffix".
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
        'NFKD', unicode(input_string)).encode('ascii', 'ignore')


def yaml_from_dict(dictionary, width=80):
    """Gets the YAML representation of a dict.

    Args:
        dictionary: dict. Dictionary for conversion into yaml.
        width: int. Width for the yaml representation, default value
            is set to be of 80.

    Returns:
        str. Converted yaml of the passed dictionary.
    """
    return yaml.safe_dump(dictionary, default_flow_style=False, width=width)


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
    return generator.randrange(0, upper_bound)


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
        *. Data url created from the binary content of the PNG.

    Raises:
        Exception: If the given binary string is not of a PNG image.
    """
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
    """Convert a string to a SHA1 hash.

    Args:
        input_string: str. Input string for conversion to hash.
        max_length: int. Maximum Length of the generated hash.

    Returns:
        str. Hash Value generated from the input_String of the
            specified length.

    Raises:
        Exception: If the input string is not the instance of the basestring,
            them this exception is raised.
    """
    if not isinstance(input_string, basestring):
        raise Exception(
            'Expected string, received %s of type %s' %
            (input_string, type(input_string)))

    encoded_string = base64.urlsafe_b64encode(
        hashlib.sha1(input_string.encode('utf-8')).digest())

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
        float. This returns the time in the millisecond since the Epoch.
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
    """Generates a random string of the specified length.

    Args:
        length: int. Length of the string to be generated.

    Returns:
        str. Random string of specified length.
    """
    return base64.urlsafe_b64encode(os.urandom(length))


def generate_new_session_id():
    """Generates a new session id.

    Returns:
        str. Random string of length 24.
    """
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
    # Preserve unicode (if path is unicode).
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
        name: str. The name to validate.
        name_type: str. A human-readable string, like 'the exploration title' or
            'a state name'. This will be shown in error messages.
        allow_empty: bool. If True, empty strings are allowed.
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


def _get_short_language_description(full_language_description):
    """Given one of the descriptions in constants.ALL_LANGUAGE_CODES, generates
    the corresponding short description.

    Args:
        full_language_description: str. Short description of the language.

    Returns:
        str. Short description of the language.
    """
    if ' (' not in full_language_description:
        return full_language_description
    else:
        ind = full_language_description.find(' (')
        return full_language_description[:ind]


def get_all_language_codes_and_names():
    """It parses the list of language codes and their corresponding names,
    defined in the app constants.

    Returns:
        list(dict(str, str)). List of dictionary containing language code and
            name mapped to their corresponding value.
    """
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
    if not feconf.DEV_MODE:
        asset_dir_prefix = '/build'

    return asset_dir_prefix


def get_template_dir_prefix():
    """Returns prefix for template directory depending whether dev or prod.
    It is used as a prefix in urls for js script files under the templates
    directory.
    """
    template_path = (
        '/templates/head' if not feconf.DEV_MODE else '/templates/dev/head')
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


def enforce_valid_parent(
        soup, tag_name, allowed_parent_list, default_parent_name):
    """This function validates the parent of a tag and if the parent is not
    valid, it enforces a default parent.

    Args:
        soup: bs4.BeautifulSoup. The html soup in which tag parent is to
            be checked.
        tag_name: str. Tag name to be checked.
        allowed_parent_list: list(str). List of valid parents for the tag.
        default_parent_name: str. The parent tag name to be enforced if the
            current parent is invalid.
    """

    for tag in soup.findAll(tag_name):
        if tag.parent.name not in allowed_parent_list:
            tag.wrap(soup.new_tag(default_parent_name))


def convert_to_text_angular(html_data):
    """This function converts the html to text angular supported format.

    Args:
        html_data: str. HTML string to be converted.

    Returns:
        str. The converted HTML string.
    """
    if not len(html_data):
        return html_data

    soup = bs4.BeautifulSoup(html_data, 'html.parser')

    allowed_tag_list = (
        feconf.RTE_CONTENT_SPEC[
            'RTE_TYPE_TEXTANGULAR']['ALLOWED_TAG_LIST'])
    allowed_parent_list = (
        feconf.RTE_CONTENT_SPEC[
            'RTE_TYPE_TEXTANGULAR']['ALLOWED_PARENT_LIST'])

    # To remove all tags except those in allowed tag list.
    all_tags = soup.findAll()
    for tag in all_tags:
        if tag.name == 'td' and tag.next_sibling:
            tag.string = tag.string + " "
        if tag.name == 'div' or tag.name == 'tr':
            tag.name = 'p'
        elif tag.name not in allowed_tag_list:
            tag.unwrap()

    # Removal of tags can break the soup into parts which are continuous
    # and not wrapped in any tag. This part recombines the continuous
    # parts not wrapped in any tag.
    soup = bs4.BeautifulSoup(str(soup), 'html.parser')

    oppia_inline_components = [
        'oppia-noninteractive-link', 'oppia-noninteractive-math']
    oppia_block_components = [
        'oppia-noninteractive-image',
        'oppia-noninteractive-video',
        'oppia-noninteractive-collapsible',
        'oppia-noninteractive-tabs'
    ]

    # Ensure that every content in html is wrapped in a tag.
    for content in soup.contents:
        if not content.name:
            content.wrap(soup.new_tag('p'))

    # Ensure that every line break is a child of any of its allowed parents.
    enforce_valid_parent(soup, 'br', allowed_parent_list['br'], 'p')

    # Ensure that every oppia inline component is a child of any
    # of its allowed parents.
    for tag_name in oppia_inline_components:
        enforce_valid_parent(soup, tag_name, allowed_parent_list[tag_name], 'p')

    # Ensure that every oppia block component is a child of any of its
    # allowed parents.
    for tag_name in oppia_block_components:
        enforce_valid_parent(soup, tag_name, allowed_parent_list[tag_name], 'p')

    # Ensure that every bold tag is a child of any of its allowed parents.
    enforce_valid_parent(soup, 'b', allowed_parent_list['b'], 'p')

    # Ensure that every italics tag is a child of any of its allowed parents.
    enforce_valid_parent(soup, 'i', allowed_parent_list['i'], 'p')

    # Ensure that p tag has a valid parent. p tags having parent tag as p
    # is checked separately since in that case the child p tag is to
    # be unwrapped instead of the parent p tag.
    for p in soup.findAll('p'):
        if p.parent.name != 'p' and (
                p.parent.name not in allowed_parent_list['p']):
            p.parent.unwrap()

    # Ensure that p tag is not wrapped in p tag.
    for p in soup.findAll('p'):
        if p.parent.name == 'p':
            p.unwrap()

    # Keeping all line break tags as <br>.
    return str(soup).replace('<br/>', '<br>')


class OrderedCounter(collections.Counter, collections.OrderedDict):
    """Counter that remembers the order elements are first encountered."""
    pass
