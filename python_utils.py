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

import os
import sys

_FUTURE_PATH = os.path.join('third_party', 'future-0.17.1')
sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
import builtins  # isort:skip
import future.utils  # isort:skip
import past.builtins  # isort:skip
import past.utils  # isort:skip
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


BASESTRING = past.builtins.basestring
MAP = builtins.map
OBJECT = builtins.object
RANGE = builtins.range
ROUND = builtins.round
STR = builtins.str
ZIP = builtins.zip


def import_string_io(buffer_value=''):
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


def open_file(filename, mode, encoding='utf-8'):
    """Open file and return a corresponding file object.

    Args:
        filename: str. The file to be opened.
        mode: str. Mode in which the file is opened.
        encoding: str. Encoding in which the file is opened.

    Returns:
        _io.TextIOWrapper. The file object.
    """
    import io
    try:
        return io.open(filename, mode, encoding=encoding)
    except:
        raise IOError('Unable to open file: %s' % filename)


def import_urlparse():
    """Returns urlparse if run under Python 2 and urllib.parse if run under
    Python 3.

    Returns:
        urlparse or urllib.parse. The urlparse object.
    """
    try:
        import urlparse
    except ImportError:
        import urllib.parse as urlparse
    return urlparse


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


def url_encode(query, doseq):
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


def convert_to_str(string_to_convert):
    """Converts the given unicode string to a string. If the string is not
    unicode, we return the string.

    Args:
        string_to_convert: unicode|str.

    Returns:
        str. The encoded string.
    """
    if isinstance(string_to_convert, STR):
        return string_to_convert.encode('utf-8')
    return str(string_to_convert)
