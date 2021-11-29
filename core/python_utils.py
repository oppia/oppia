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

from __future__ import annotations

import io
import os
import pkgutil
import sys

_THIRD_PARTY_PATH = os.path.join(os.getcwd(), 'third_party', 'python_libs')
sys.path.insert(0, _THIRD_PARTY_PATH)

_YAML_PATH = os.path.join(os.getcwd(), '..', 'oppia_tools', 'pyyaml-5.4.1')
sys.path.insert(0, _YAML_PATH)

_CERTIFI_PATH = os.path.join(
    os.getcwd(), '..', 'oppia_tools', 'certifi-2021.5.30')
sys.path.insert(0, _CERTIFI_PATH)

import yaml  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

import builtins  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
import past.builtins  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
import past.utils  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

import certifi  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
import ssl  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order


MAP = builtins.map
NEXT = builtins.next
OBJECT = builtins.object
PRINT = print
ZIP = builtins.zip


def SimpleXMLRPCServer( # pylint: disable=invalid-name
        addr, requestHandler=None, logRequests=True, allow_none=False,
        encoding=None, bind_and_activate=True):
    """Returns SimpleXMLRPCServer from SimpleXMLRPCServer module if run under
    Python 2 and from xmlrpc module if run under Python 3.

    Args:
        addr: tuple(str, int). The host and port of the server.
        requestHandler: callable. A factory for request handler instances.
            Defaults to SimpleXMLRPCRequestHandler.
        logRequests: bool. Whether to log the requests sent to the server.
        allow_none: bool. Permits None in the XML-RPC responses that will be
            returned from the server.
        encoding: str|None. The encoding used by the XML-RPC responses that will
            be returned from the server.
        bind_and_activate: bool. Whether server_bind() and server_activate() are
            called immediately by the constructor; defaults to true. Setting it
            to false allows code to manipulate the allow_reuse_address class
            variable before the address is bound.

    Returns:
        SimpleXMLRPCServer. The SimpleXMLRPCServer object.
    """
    try:
        from xmlrpc.server import SimpleXMLRPCServer as impl  # pylint: disable=import-only-modules
    except ImportError:
        from SimpleXMLRPCServer import SimpleXMLRPCServer as impl  # pylint: disable=import-only-modules
    if requestHandler is None:
        try:
            from xmlrpc.server import SimpleXMLRPCRequestHandler  # isort:skip pylint: disable=import-only-modules
        except ImportError:
            from SimpleXMLRPCServer import SimpleXMLRPCRequestHandler  # isort:skip pylint: disable=import-only-modules
        requestHandler = SimpleXMLRPCRequestHandler
    return impl(
        addr, requestHandler=requestHandler, logRequests=logRequests,
        allow_none=allow_none, encoding=encoding,
        bind_and_activate=bind_and_activate)


def redirect_stdout(new_target):
    """Returns redirect_stdout from contextlib2 if run under Python 2 and from
    contextlib if run under Python 3.

    Args:
        new_target: FileLike. The file-like object all messages printed to
            stdout will be redirected to.

    Returns:
        contextlib.redirect_stdout or contextlib2.redirect_stdout. The
        redirect_stdout object.
    """
    try:
        from contextlib import redirect_stdout as impl  # pylint: disable=import-only-modules
    except ImportError:
        from contextlib2 import redirect_stdout as impl  # pylint: disable=import-only-modules
    return impl(new_target)


def string_io(buffer_value=''):
    """Returns StringIO from StringIO module if run under Python 2 and from io
    module if run under Python 3.

    Args:
        buffer_value: str. A string that is to be converted to in-memory text
            stream.

    Returns:
        StringIO.StringIO or io.StringIO. The StringIO object.
    """
    try:
        from StringIO import StringIO  # pylint: disable=import-only-modules
    except ImportError:
        from io import StringIO  # pylint: disable=import-only-modules
    return StringIO(buffer_value)  # pylint: disable=disallowed-function-calls


def get_args_of_function_node(function_node, args_to_ignore):
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
            a.arg
            for a in function_node.args.args
            if a.arg not in args_to_ignore
        ]
    except AttributeError:
        return [
            a.id for a in function_node.args.args if a.id not in args_to_ignore
        ]


def open_file(filename, mode, encoding='utf-8', newline=None):
    """Open file and return a corresponding file object.

    Args:
        filename: str. The file to be opened.
        mode: str. Mode in which the file is opened.
        encoding: str. Encoding in which the file is opened.
        newline: None|str. Controls how universal newlines work.

    Returns:
        _io.TextIOWrapper. The file object.

    Raises:
        IOError. The file cannot be opened.
    """
    # The try/except is needed here to unify the errors because io.open in
    # Python 3 throws FileNotFoundError while in Python 2 it throws an IOError.
    # This should be removed after we fully migrate to Python 3.
    try:
        return io.open(filename, mode, encoding=encoding, newline=newline)
    except:
        raise IOError('Unable to open file: %s' % filename)


def get_package_file_contents(package: str, filepath: str) -> str:
    """Open file and return its contents. This needs to be used for files that
    are loaded by the Python code directly, like constants.ts or
    rich_text_components.json. This function is needed to make loading these
    files work even when Oppia is packaged.

    Args:
        package: str. The package where the file is located.
            For Oppia the package is usually the folder in the root folder,
            like 'core' or 'extensions'.
        filepath: str. The path to the file in the package.

    Returns:
        str. The contents of the file.
    """
    try:
        file = io.open(os.path.join(package, filepath), 'r', encoding='utf-8')
        return file.read()
    except FileNotFoundError:
        return pkgutil.get_data(package, filepath).decode('utf-8')


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
        import urllib.parse as urlparse
    except ImportError:
        import urlparse
    return urlparse.urlunsplit(url_parts)  # pylint: disable=disallowed-function-calls


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
        import urllib.parse as urlparse
    except ImportError:
        import urlparse
    return urlparse.parse_qs(query_string)  # pylint: disable=disallowed-function-calls


def urllib_unquote(content) -> str:
    """Replace %xx escapes by their single-character equivalent using
    urllib.unquote if run under Python 2 and urllib.parse.unquote if run under
    Python 3.

    Args:
        content: str. The string to be unquoted.

    Returns:
        str. The unquoted string.
    """
    try:
        import urllib.parse as urlparse
    except ImportError:
        import urllib as urlparse
    return urlparse.unquote(content)


def url_quote(content):
    """Quotes a string using urllib.quote if run under Python 2 and
    urllib.parse.quote if run under Python 3.

    Args:
        content: str. The string to be quoted.

    Returns:
        str. The quoted string.
    """
    try:
        import urllib.parse as urlparse
    except ImportError:
        import urllib as urlparse
    return urlparse.quote(content)


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
        import urllib.parse as urlparse
    except ImportError:
        import urllib as urlparse
    return urlparse.urlencode(query, doseq=doseq)


def url_open(source_url):
    """Open a network object denoted by a URL for reading using
    urllib2.urlopen if run under Python 2 and urllib.request.urlopen if
    run under Python 3.

    Args:
        source_url: str. The URL.

    Returns:
        urlopen. The 'urlopen' object.
    """
    # TODO(#12912): Remove pylint disable after the arg-name-for-non-keyword-arg
    # check is refactored.
    context = ssl.create_default_context(cafile=certifi.where())  # pylint: disable=arg-name-for-non-keyword-arg
    try:
        import urllib.request as urlrequest
    except ImportError:
        import urllib2 as urlrequest
    return urlrequest.urlopen(source_url, context=context)


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
        import urllib.request as urlrequest
    except ImportError:
        import urllib2 as urlrequest
    return urlrequest.Request(source_url, data, headers)


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
            _recursively_convert_to_str(k): _recursively_convert_to_str(v)
            for k, v in value.items()
        }
    # We are using 'type' here instead of 'isinstance' because we need to
    # clearly distinguish the builtins.str and builtins.bytes strings.
    elif type(value) == str:  # pylint: disable=unidiomatic-typecheck
        return value
    elif type(value) == builtins.bytes:  # pylint: disable=unidiomatic-typecheck
        return value.decode('utf-8')
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


def create_enum(*sequential):
    """Creates a enumerated constant.

    Args:
        *sequential: *. Sequence List to generate the enumerations.

    Returns:
        dict. Dictionary containing the enumerated constants.
    """
    enum_values = dict(ZIP(sequential, sequential))
    try:
        from enum import Enum  # pylint: disable=import-only-modules

        # The type() of argument 1 in Enum must be str, not unicode.
        return Enum(str('Enum'), enum_values)  # pylint: disable=disallowed-function-calls
    except ImportError:
        _enums = {}
        for name, value in enum_values.items():
            _value = {
                'name': name,
                'value': value
            }
            _enums[name] = type('Enum', (), _value)
        return type('Enum', (), _enums)
