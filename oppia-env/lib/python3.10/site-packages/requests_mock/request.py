# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

import copy
import json
import urllib.parse

import requests


class _RequestObjectProxy(object):
    """A wrapper around a requests.Request that gives some extra information.

    This will be important both for matching and so that when it's save into
    the request_history users will be able to access these properties.
    """

    def __init__(self, request, **kwargs):
        self._request = request
        self._matcher = None
        self._url_parts_ = None
        self._qs = None

        # All of these params should always exist but we use a default
        # to make the test setup easier.
        self._timeout = kwargs.pop('timeout', None)
        self._allow_redirects = kwargs.pop('allow_redirects', None)
        self._verify = kwargs.pop('verify', None)
        self._stream = kwargs.pop('stream', None)
        self._cert = kwargs.pop('cert', None)
        self._proxies = copy.deepcopy(kwargs.pop('proxies', {}))

        # FIXME(jamielennox): This is part of bug #1584008 and should default
        # to True (or simply removed) in a major version bump.
        self._case_sensitive = kwargs.pop('case_sensitive', False)

    def __getattr__(self, name):
        # there should be a better way to exclude this, but I don't want to
        # implement __setstate__ just not forward it to the request. You can't
        # actually define the method and raise AttributeError there either.
        if name in ('__setstate__',):
            raise AttributeError(name)

        return getattr(self._request, name)

    @property
    def _url_parts(self):
        if self._url_parts_ is None:
            url = self._request.url

            if not self._case_sensitive:
                url = url.lower()

            self._url_parts_ = urllib.parse.urlparse(url)

        return self._url_parts_

    @property
    def scheme(self):
        return self._url_parts.scheme

    @property
    def netloc(self):
        return self._url_parts.netloc

    @property
    def hostname(self):
        try:
            return self.netloc.split(':')[0]
        except IndexError:
            return ''

    @property
    def port(self):
        components = self.netloc.split(':')

        try:
            return int(components[1])
        except (IndexError, ValueError):
            pass

        if self.scheme == 'https':
            return 443
        if self.scheme == 'http':
            return 80

        # The default return shouldn't matter too much because if you are
        # wanting to test this value you really should be explicitly setting it
        # somewhere. 0 at least is a boolean False and an int.
        return 0

    @property
    def path(self):
        return self._url_parts.path

    @property
    def query(self):
        return self._url_parts.query

    @property
    def qs(self):
        if self._qs is None:
            self._qs = urllib.parse.parse_qs(self.query,
                                             keep_blank_values=True)

        return self._qs

    @property
    def timeout(self):
        return self._timeout

    @property
    def allow_redirects(self):
        return self._allow_redirects

    @property
    def verify(self):
        return self._verify

    @property
    def stream(self):
        return self._stream

    @property
    def cert(self):
        return self._cert

    @property
    def proxies(self):
        return self._proxies

    @classmethod
    def _create(cls, *args, **kwargs):
        return cls(requests.Request(*args, **kwargs).prepare())

    @property
    def text(self):
        body = self.body

        if isinstance(body, bytes):
            body = body.decode('utf-8')

        return body

    def json(self, **kwargs):
        return json.loads(self.text, **kwargs)

    def __getstate__(self):
        # Can't pickle a weakref, but it's a weakref so ok to drop it.
        d = self.__dict__.copy()
        d['_matcher'] = None
        return d

    @property
    def matcher(self):
        """The matcher that this request was handled by.

        The matcher object is handled by a weakref. It will return the matcher
        object if it is still available - so if the mock is still in place. If
        the matcher is not available it will return None.
        """
        # if unpickled or not from a response this will be None
        if self._matcher is None:
            return None

        return self._matcher()

    def __str__(self):
        return "{0.method} {0.url}".format(self._request)
