# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Feature detection utilities for Python 2 and Python 3."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import io
import os
import sys

_FUTURE_PATH = os.path.join(os.getcwd(), 'third_party', 'future-0.17.1')
sys.path.insert(0, _FUTURE_PATH)

_YAML_PATH = os.path.join(os.getcwd(), '..', 'oppia_tools', 'pyyaml-5.1.2')
sys.path.insert(0, _YAML_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
import yaml  # isort:skip

import builtins  # isort:skip
import future.utils  # isort:skip
import past.builtins  # isort:skip
import past.utils  # isort:skip
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


BASESTRING = past.builtins.basestring
INPUT = builtins.input
MAP = builtins.map
NEXT = builtins.next
OBJECT = builtins.object
PRINT = print
RANGE = builtins.range
ROUND = builtins.round
UNICODE = builtins.str
ZIP = builtins.zip


def string_io(buffer_value=b''):
    """Returns StringIO from StringIO module if run under Python 2 and from io
    module if run under Python 3.

    Returns:
        StringIO.StringIO or io.StringIO. The StringIO object.
    """
    try:
        from StringIO import StringIO  # pylint: disable=import-only-modules
    except ImportError:
        from io import StringIO  # pylint: disable=import-only-modules
    return StringIO(buffer_value)


def get_args_of_function(function_node, args_to_ignore):
    """Extracts the arguments from a function definition.

    Args:
        function_node: ast.FunctionDef. Represents a function.
        args_to_ignore: list(str). Ignore these arguments in a function
        definition.

    Returns:
        list(str). The args for a function as listed in the function
        definition.
    """
    try:
        return [
            a.arg for a in function_node.args.args if a.arg not in
            args_to_ignore]
    except AttributeError:
        return [
            a.id for a in function_node.args.args if a.id not in args_to_ignore]


def open_file(filename, mode, encoding='utf-8', newline=None):
    """Open file and return a corresponding file object.

    Args:
        filename: str. The file to be opened.
        mode: str. Mode in which the file is opened.
        encoding: str. Encoding in which the file is opened.
        newline: None|str. Controls how universal newlines work.

    Returns:
        _io.TextIOWrapper. The file object.
    """
    try:
        return io.open(filename, mode, encoding=encoding, newline=newline)
    except:
        raise IOError('Unable to open file: %s' % filename)


def url_join(base_url, relative_url):
    """Construct a full URL by combining a 'base URL' with another URL using
    urlparse.urljoin if run under Python 2 and urllib.parse.urljoin if run under
    Python 3.

    Args:
        base_url: str. The base URL.
        relative_url: str. The other URL.

    Returns:
        str. The full URL.
    """
    try:
        import urlparse
    except ImportError:
        import urllib.parse as urlparse
    return urlparse.urljoin(base_url, relative_url)


def url_split(urlstring):
    """Splits a URL using urlparse.urlsplit if run under Python 2 and
    urllib.parse.urlsplit if run under Python 3.

    Args:
        urlstring: str. The URL.

    Returns:
        tuple(str). The components of a URL.
    """
    try:
        import urlparse
    except ImportError:
        import urllib.parse as urlparse
    return urlparse.urlsplit(urlstring)


def url_parse(urlstring):
    """Parse a URL into six components using urlparse.urlparse if run under
    Python 2 and urllib.parse.urlparse if run under Python 3. This corresponds
    to the general structure of a URL:
    scheme://netloc/path;parameters?query#fragment.

    Args:
        urlstring: str. The URL.

    Returns:
        tuple(str). The components of a URL.
    """
    try:
        import urlparse
    except ImportError:
        import urllib.parse as urlparse
    return urlparse.urlparse(urlstring)


def url_unsplit(url_parts):
    """Combine the elements of a tuple as returned by urlsplit() into a complete
    URL as a string using urlparse.urlunsplit if run under Python 2 and
    urllib.parse.urlunsplit if run under Python 3.

    Args:
        url_parts: tuple(str). The components of a URL.

    Returns:
        str. The complete URL.
    """
    try:
        import urlparse
    except ImportError:
        import urllib.parse as urlparse
    return urlparse.urlunsplit(url_parts)


def parse_query_string(query_string):
    """Parse a query string given as a string argument
    (data of type application/x-www-form-urlencoded) using urlparse.parse_qs if
    run under Python 2 and urllib.parse.parse_qs if run under Python 3.

    Args:
        query_string: str. The query string.

    Returns:
        dict. The keys are the unique query variable names and the values are
            lists of values for each name.
    """
    try:
        import urlparse
    except ImportError:
        import urllib.parse as urlparse
    return urlparse.parse_qs(query_string)


def urllib_unquote(content):
    """Replace %xx escapes by their single-character equivalent using
    urllib.unquote if run under Python 2 and urllib.parse.unquote if run under
    Python 3.

    Args:
        content: str. The string to be unquoted.

    Returns:
        str. The unquoted string.
    """
    try:
        import urllib
        return urllib.unquote(content)
    except ImportError:
        import urllib.parse
        return urllib.urlparse.unquote(content)


def url_quote(content):
    """Quotes a string using urllib.quote if run under Python 2 and
    urllib.parse.quote if run under Python 3.

    Args:
        content: str. The string to be quoted.

    Returns:
        str. The quoted string.
    """
    try:
        import urllib as urlparse_quote
    except ImportError:
        import urllib.parse as urlparse_quote
    return urlparse_quote.quote(content)


def url_unquote_plus(content):
    """Unquotes a string and replace plus signs by spaces, as required for
    unquoting HTML form values using urllib.unquote_plus if run under Python 2
    and urllib.parse.unquote_plus if run under Python 3.

    Args:
        content: str. The string to be unquoted.

    Returns:
        str. The unquoted string.
    """
    try:
        import urllib
        return urllib.unquote_plus(content)
    except ImportError:
        import urllib.parse
        return urllib.parse.unquote_plus(content)


def url_encode(query, doseq=False):
    """Convert a mapping object or a sequence of two-element tuples to a
    'url-encoded' string using urllib.urlencode if run under Python 2 and
    urllib.parse.urlencode if run under Python 3.

    Args:
        query: dict or tuple. The query to be encoded.
        doseq: bool. If true, individual key=value pairs separated by '&' are
            generated for each element of the value sequence for the key.

    Returns:
        str. The 'url-encoded' string.
    """
    try:
        import urllib as urlparse_urlencode
    except ImportError:
        import urllib.parse as urlparse_urlencode
    return urlparse_urlencode.urlencode(query, doseq)


def url_retrieve(source_url, filename):
    """Copy a network object denoted by a URL to a local file using
    urllib.urlretrieve if run under Python 2 and urllib.request.urlretrieve if
    run under Python 3.

    Args:
        source_url: str. The URL.
        filename: str. The file location to copy to.

    Returns:
        urlretrieve. The 'urlretrieve' object.
    """
    try:
        import urllib
        return urllib.urlretrieve(source_url, filename=filename)
    except ImportError:
        import urllib.request
        return urllib.request.urlretrieve(source_url, filename=filename)


def url_open(source_url):
    """Open a network object denoted by a URL for reading using
    urllib2.urlopen if run under Python 2 and urllib.request.urlopen if
    run under Python 3.

    Args:
        source_url: str. The URL.

    Returns:
        urlopen. The 'urlopen' object.
    """
    try:
        import urllib2
        return urllib2.urlopen(source_url)
    except ImportError:
        import urllib.request
        return urllib.request.urlopen(source_url)


def url_request(source_url, data, headers):
    """This function provides an abstraction of a URL request. It uses
    urllib2.Request if run under Python 2 and urllib.request.Request if
    run under Python 3.

    Args:
        source_url: str. The URL.
        data: str. Additional data to send to the server.
        headers: dict. The request headers.

    Returns:
        Request. The 'Request' object.
    """
    try:
        import urllib2
        return urllib2.Request(source_url, data, headers)
    except ImportError:
        import urllib.request
        return urllib.request.Request(source_url)


def divide(number1, number2):
    """This function divides number1 by number2 in the Python 2 way, i.e it
    performs an integer division.

    Args:
        number1: int. The dividend.
        number2: int. The divisor.

    Returns:
        int. The quotent.
    """
    return past.utils.old_div(number1, number2)


def with_metaclass(class1, class2):
    """This function makes a dummy metaclass for one level of class
    instantiation that replaces itself with the actual metaclass.

    Use it like this::

        class BaseForm():
            pass

        class FormType(type):
            pass

        class Form(with_metaclass(FormType, BaseForm)):
            pass

    Args:
        class1: class. The metaclass.
        class2: class. The baseclass.

    Returns:
        class. The base class with a metaclass.
    """
    return future.utils.with_metaclass(class1, class2)


def convert_to_bytes(string_to_convert):
    """Converts the string to bytes.

    Args:
        string_to_convert: unicode|str.

    Returns:
        bytes. The encoded string.
    """
    if isinstance(string_to_convert, UNICODE):
        return string_to_convert.encode('utf-8')
    return bytes(string_to_convert)


def _recursively_convert_to_str(value):
    """Convert all builtins.bytes and builtins.str elements in a data structure
    to bytes and unicode respectively. This is required for the
    yaml.safe_dump() function to work as it only works for unicode and bytes and
    not builtins.bytes nor builtins.str(UNICODE). See:
    https://stackoverflow.com/a/1950399/11755830

    Args:
        value: list|dict|BASESTRING. The data structure to convert.

    Returns:
        list|dict|bytes|unicode. The data structure in bytes and unicode.
    """
    if isinstance(value, list):
        return [_recursively_convert_to_str(e) for e in value]
    elif isinstance(value, dict):
        return {
            _recursively_convert_to_str(k): _recursively_convert_to_str(
                v) for k, v in value.items()}
    # We are using 'type' here instead of 'isinstance' because we need to
    # clearly distinguish the builtins.str and builtins.bytes strings.
    elif type(value) == future.types.newstr:  # pylint: disable=unidiomatic-typecheck
        temp = str(value.encode('utf-8'))
        # Remove the b'' prefix from the string.
        return temp[2:-1].decode('utf-8')
    elif type(value) == future.types.newbytes:  # pylint: disable=unidiomatic-typecheck
        temp = bytes(value)
        # Remove the b'' prefix from the string.
        return temp[2:-1]
    else:
        return value


def yaml_from_dict(dictionary, width=80):
    """Gets the YAML representation of a dict.

    Args:
        dictionary: dict. Dictionary for conversion into yaml.
        width: int. Width for the yaml representation, default value
            is set to be of 80.

    Returns:
        str. Converted yaml of the passed dictionary.
    """
    dictionary = _recursively_convert_to_str(dictionary)
    return yaml.safe_dump(dictionary, default_flow_style=False, width=width)
