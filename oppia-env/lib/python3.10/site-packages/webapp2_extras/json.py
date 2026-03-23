# -*- coding: utf-8 -*-
# Copyright 2011 webapp2 AUTHORS.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
webapp2_extras.json
===================

JSON helpers for webapp2.
"""
import base64
import importlib
from six.moves.urllib import parse

import webapp2

_json = importlib.import_module("json")


def encode(value, *args, **kwargs):
    """Serializes a value to JSON.

    This comes from `Tornado`_.

    :param value:
        A value to be serialized.
    :param args:
        Extra arguments to be passed to `json.dumps()`.
    :param kwargs:
        Extra keyword arguments to be passed to `json.dumps()`.
    :returns:
        The serialized value.
    """
    # By default encode using a compact format.
    kwargs.setdefault('separators', (',', ':'))
    # JSON permits but does not require forward slashes to be escaped.
    # This is useful when json data is emitted in a <script> tag
    # in HTML, as it prevents </script> tags from prematurely terminating
    # the javascript.  Some json libraries do this escaping by default,
    # although python's standard library does not, so we do it here.
    # See: http://goo.gl/WsXwv
    return _json.dumps(value, *args, **kwargs).replace("</", "<\\/")


def decode(value, *args, **kwargs):
    """Deserializes a value from JSON.

    This comes from `Tornado`_.

    :param value:
        A value to be deserialized.
    :param args:
        Extra arguments to be passed to `json.loads()`.
    :param kwargs:
        Extra keyword arguments to be passed to `json.loads()`.
    :returns:
        The deserialized value.
    """
    return _json.loads(webapp2._to_basestring(value), *args, **kwargs)


def b64encode(value, *args, **kwargs):
    """Serializes a value to JSON and encodes it using base64.

    Parameters and return value are the same from :func:`encode`.
    """
    return base64.b64encode(encode(value, *args, **kwargs).encode('ascii'))


def b64decode(value, *args, **kwargs):
    """Decodes a value using base64 and deserializes it from JSON.

    Parameters and return value are the same from :func:`decode`.
    """
    return decode(base64.b64decode(value), *args, **kwargs)


def quote(value, *args, **kwargs):
    """Serializes a value to JSON and encodes it
    using urllib.quote or urllib.parse.quote(PY3).

    Parameters and return value are the same from :func:`encode`.
    """
    return parse.quote(encode(value, *args, **kwargs))


def unquote(value, *args, **kwargs):
    """Decodes a value using urllib.unquote or urllib.parse.unquote(PY3)
    and deserializes it from JSON.

    Parameters and return value are the same from :func:`decode`.
    """
    return decode(parse.unquote(value), *args, **kwargs)
