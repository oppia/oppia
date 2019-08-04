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


def url_request(source_url):
    """This class is an abstraction of a URL request. It uses
    urllib2.Request if run under Python 2 and urllib.request.Request if
    run under Python 3.
    Args:
        source_url: str. The URL.

    Returns:
        Request. The 'Request' object.
    """
    try:
        import urllib2
        return urllib2.Request(source_url)
    except ImportError:
        import urllib.request
        return urllib.request.Request(source_url)
