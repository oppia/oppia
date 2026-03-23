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
webapp2_extras.securecookie
===========================

A serializer for signed cookies.
"""
import hashlib
import hmac
import logging
import time

from six.moves import http_cookies
import webapp2
from webapp2_extras import json
from webapp2_extras import security


class SecureCookieSerializer(object):
    """Serializes and deserializes secure cookie values.

    Extracted from `Tornado`_ and modified.
    """

    def __init__(self, secret_key):
        """Initiliazes the serializer/deserializer.

        :param secret_key:
            A random string to be used as the HMAC secret for the cookie
            signature.
        """
        self.secret_key = webapp2._to_utf8(secret_key)

    def serialize(self, name, value):
        """Serializes a signed cookie value.

        :param name:
            Cookie name.
        :param value:
            Cookie value to be serialized.
        :returns:
            A serialized value ready to be stored in a cookie.
        """
        name = webapp2._to_utf8(name)
        timestamp = webapp2._to_utf8(str(self._get_timestamp()))
        value = self._encode(value)
        signature = self._get_signature(name, value, timestamp)
        return b'|'.join([value, timestamp, signature])

    def deserialize(self, name, value, max_age=None):
        """Deserializes a signed cookie value.

        :param name:
            Cookie name.
        :param value:
            A cookie value to be deserialized.
        :param max_age:
            Maximum age in seconds for a valid cookie. If the cookie is older
            than this, returns None.
        :returns:
            The deserialized secure cookie, or None if it is not valid.
        """
        if not value:
            return None

        name = webapp2._to_utf8(name)
        value = webapp2._to_utf8(value)

        # Unquote for old WebOb.
        value = http_cookies._unquote(value)

        parts = value.split(b'|')
        if len(parts) != 3:
            return None

        signature = self._get_signature(name, parts[0], parts[1])

        if not security.compare_hashes(parts[2], signature):
            logging.warning('Invalid cookie signature %r', value)
            return None

        if max_age is not None:
            if int(parts[1]) < self._get_timestamp() - max_age:
                logging.warning('Expired cookie %r', value)
                return None

        try:
            return self._decode(parts[0])
        except Exception:
            logging.warning('Cookie value failed to be decoded: %r', parts[0])
            return None

    def _encode(self, value):
        return json.b64encode(value)

    def _decode(self, value):
        return json.b64decode(value)

    def _get_timestamp(self):
        return int(time.time())

    def _get_signature(self, *parts):
        """Generates an HMAC signature."""
        signature = hmac.new(self.secret_key, digestmod=hashlib.sha1)
        signature.update(b'|'.join(parts))
        return webapp2._to_utf8(signature.hexdigest())
