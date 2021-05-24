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

import inspect
import io
import itertools
import os
import sys

_THIRD_PARTY_PATH = os.path.join(os.getcwd(), 'third_party', 'python_libs')
sys.path.insert(0, _THIRD_PARTY_PATH)

_YAML_PATH = os.path.join(os.getcwd(), '..', 'oppia_tools', 'pyyaml-5.1.2')
sys.path.insert(0, _YAML_PATH)

_CERTIFI_PATH = os.path.join(
    os.getcwd(), '..', 'oppia_tools', 'certifi-2020.12.5')
sys.path.insert(0, _CERTIFI_PATH)

import yaml  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

import builtins  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
import future.utils  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
import past.builtins  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
import past.utils  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
import six  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

import certifi  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
import ssl  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order


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
        from xmlrpc.server import SimpleXMLRPCServer as impl # pylint: disable=import-only-modules
    except ImportError:
        from SimpleXMLRPCServer import SimpleXMLRPCServer as impl # pylint: disable=import-only-modules
    if requestHandler is None:
        try:
            from xmlrpc.server import SimpleXMLRPCRequestHandler # pylint: disable=import-only-modules
        except ImportError:
            from SimpleXMLRPCServer import SimpleXMLRPCRequestHandler # pylint: disable=import-only-modules
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
        from contextlib import redirect_stdout as impl # pylint: disable=import-only-modules
    except ImportError:
        from contextlib2 import redirect_stdout as impl # pylint: disable=import-only-modules
    return impl(new_target)


def nullcontext(enter_result=None):
    """Returns nullcontext from contextlib2 if run under Python 2 and from
    contextlib if run under Python 3.

    Args:
        enter_result: *. The object returned by the nullcontext when entered.

    Returns:
        contextlib.nullcontext or contextlib2.nullcontext. The nullcontext
        object.
    """
    try:
        from contextlib import nullcontext as impl # pylint: disable=import-only-modules
    except ImportError:
        from contextlib2 import nullcontext as impl # pylint: disable=import-only-modules
    return impl(enter_result=enter_result)


def ExitStack(): # pylint: disable=invalid-name
    """Returns ExitStack from contextlib2 if run under Python 2 and from
    contextlib if run under Python 3.

    Returns:
        contextlib.ExitStack or contextlib2.ExitStack. The ExitStack object.
    """
    try:
        from contextlib import ExitStack as impl # pylint: disable=import-only-modules
    except ImportError:
        from contextlib2 import ExitStack as impl # pylint: disable=import-only-modules
    return impl()


def string_io(buffer_value=b''):
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
    return StringIO(buffer_value) # pylint: disable=disallowed-function-calls


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
        import urllib.parse as urlparse
    except ImportError:
        import urlparse
    return urlparse.urljoin(base_url, relative_url) # pylint: disable=disallowed-function-calls


def url_split(urlstring):
    """Splits a URL using urlparse.urlsplit if run under Python 2 and
    urllib.parse.urlsplit if run under Python 3.

    Args:
        urlstring: str. The URL.

    Returns:
        tuple(str). The components of a URL.
    """
    try:
        import urllib.parse as urlparse
    except ImportError:
        import urlparse
    return urlparse.urlsplit(urlstring) # pylint: disable=disallowed-function-calls


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
        import urllib.parse as urlparse
    except ImportError:
        import urlparse
    return urlparse.urlparse(urlstring) # pylint: disable=disallowed-function-calls


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
    return urlparse.urlunsplit(url_parts) # pylint: disable=disallowed-function-calls


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
    return urlparse.parse_qs(query_string) # pylint: disable=disallowed-function-calls


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
        import urllib.parse as urlparse
    except ImportError:
        import urllib as urlparse
    return urlparse.unquote_plus(content)


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
    return urlparse.urlencode(query, doseq)


def url_retrieve(source_url, filename=None):
    """Copy a network object denoted by a URL to a local file using
    urllib.urlretrieve if run under Python 2 and urllib.request.urlretrieve if
    run under Python 3.

    Args:
        source_url: str. The URL.
        filename: str. The file location to copy to.

    Returns:
        urlretrieve. The 'urlretrieve' object.
    """
    context = ssl.create_default_context(cafile=certifi.where())
    try:
        import urllib.request as urlrequest
    except ImportError:
        import urllib as urlrequest
        # Change the User-Agent to prevent servers from blocking requests.
        # See https://support.cloudflare.com/hc/en-us/articles/360029779472-Troubleshooting-Cloudflare-1XXX-errors#error1010. # pylint: disable=line-too-long
        urlrequest.URLopener.version = (
            'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) '
            'Gecko/20100101 Firefox/47.0'
        )
    return urlrequest.urlretrieve(
        source_url, filename=filename, context=context)


def url_open(source_url):
    """Open a network object denoted by a URL for reading using
    urllib2.urlopen if run under Python 2 and urllib.request.urlopen if
    run under Python 3.

    Args:
        source_url: str. The URL.

    Returns:
        urlopen. The 'urlopen' object.
    """
    context = ssl.create_default_context(cafile=certifi.where())
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


def with_metaclass(meta, *bases):
    """Python 2 & 3 helper for installing metaclasses.

    Example:

        class BaseForm(python_utils.OBJECT):
            pass

        class FormType(type):
            pass

        class Form(with_metaclass(FormType, BaseForm)):
            pass

    Args:
        meta: type. The metaclass to install on the derived class.
        *bases: tuple(class). The base classes to install on the derived class.
            When empty, `object` will be the sole base class.

    Returns:
        class. A proxy class that mutates the classes which inherit from it to
        install the input meta class and inherit from the input base classes.
        The proxy class itself does not actually become one of the base classes.
    """
    if not bases:
        bases = (OBJECT,)
    return future.utils.with_metaclass(meta, *bases)


def convert_to_bytes(string_to_convert):
    """Converts the string to bytes.

    Args:
        string_to_convert: unicode|str. Required string to be converted into
            bytes.

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
            _recursively_convert_to_str(k): _recursively_convert_to_str(v)
            for k, v in value.items()
        }
    # We are using 'type' here instead of 'isinstance' because we need to
    # clearly distinguish the builtins.str and builtins.bytes strings.
    elif type(value) == future.types.newstr:  # pylint: disable=unidiomatic-typecheck
        temp = str(value.encode('utf-8')) # pylint: disable=disallowed-function-calls
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


def reraise_exception():
    """Reraise exception with complete stacktrace."""
    # TODO(#11547): This method can be replace by 'raise e' after we migrate
    # to Python 3.
    # This code is needed in order to reraise the error properly with
    # the stacktrace. See https://stackoverflow.com/a/18188660/3688189.
    exec_info = sys.exc_info()
    six.reraise(exec_info[0], exec_info[1], tb=exec_info[2])


def is_string(value):
    """Returns whether value has a string type."""
    return isinstance(value, six.string_types)


def get_args_of_function(func):
    """Returns the argument names of the function.

    Args:
        func: function. The function to inspect.

    Returns:
        list(str). The names of the function's arguments.

    Raises:
        TypeError. The input argument is not a function.
    """
    try:
        # Python 3.
        return [p.name for p in inspect.signature(func).parameters
                if p.kind in (p.POSITIONAL_ONLY, p.POSITIONAL_OR_KEYWORD)]
    except AttributeError:
        # Python 2.
        return inspect.getargspec(func).args


def create_enum(*sequential):
    """Creates a enumerated constant.

    Args:
        *sequential: *. Sequence List to generate the enumerations.

    Returns:
        dict. Dictionary containing the enumerated constants.
    """
    enum_values = dict(ZIP(sequential, sequential))
    try:
        from enum import Enum # pylint: disable=import-only-modules
        # The type() of argument 1 in Enum must be str, not unicode.
        return Enum(str('Enum'), enum_values) # pylint: disable=disallowed-function-calls
    except ImportError:
        _enums = {}
        for name, value in enum_values.items():
            _value = {
                'name': name,
                'value': value
            }
            _enums[name] = type(b'Enum', (), _value)
        return type(b'Enum', (), _enums)


def zip_longest(*args, **kwargs):
    """Creates an iterator that aggregates elements from each of the iterables.
    If the iterables are of uneven length, missing values are
    filled-in with fillvalue.

    Args:
        *args: list(*). Iterables that needs to be aggregated into an iterable.
        **kwargs: dict. It contains fillvalue.

    Returns:
        iterable(iterable). A sequence of aggregates elements
        from each of the iterables.
    """
    fillvalue = kwargs.get('fillvalue')
    try:
        return itertools.zip_longest(*args, fillvalue=fillvalue)
    except AttributeError:
        return itertools.izip_longest(*args, fillvalue=fillvalue)
