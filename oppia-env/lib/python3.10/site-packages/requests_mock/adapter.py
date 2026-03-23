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

import urllib.parse
import weakref

from requests.adapters import BaseAdapter
from requests.utils import requote_uri

from requests_mock import exceptions
from requests_mock.request import _RequestObjectProxy
from requests_mock.response import _MatcherResponse

import logging

logger = logging.getLogger(__name__)

try:
    import purl
    purl_types = (purl.URL,)
except ImportError:
    purl = None
    purl_types = ()

ANY = object()


class _RequestHistoryTracker(object):

    def __init__(self):
        self.request_history = []

    def _add_to_history(self, request):
        self.request_history.append(request)

    @property
    def last_request(self):
        """Retrieve the latest request sent"""
        try:
            return self.request_history[-1]
        except IndexError:
            return None

    @property
    def called(self):
        return self.call_count > 0

    @property
    def called_once(self):
        return self.call_count == 1

    @property
    def call_count(self):
        return len(self.request_history)

    def reset(self):
        self.request_history = []


class _RunRealHTTP(Exception):
    """A fake exception to jump out of mocking and allow a real request.

    This exception is caught at the mocker level and allows it to execute this
    request through the real requests mechanism rather than the mocker.

    It should never be exposed to a user.
    """


class _Matcher(_RequestHistoryTracker):
    """Contains all the information about a provided URL to match."""

    def __init__(self, method, url, responses, complete_qs, request_headers,
                 additional_matcher, real_http, case_sensitive):
        """
        :param bool complete_qs: Match the entire query string. By default URLs
            match if all the provided matcher query arguments are matched and
            extra query arguments are ignored. Set complete_qs to true to
            require that the entire query string needs to match.
        """
        super(_Matcher, self).__init__()

        self._method = method
        self._url = url
        self._responses = responses
        self._complete_qs = complete_qs
        self._request_headers = request_headers
        self._real_http = real_http
        self._additional_matcher = additional_matcher

        # url can be a regex object or ANY so don't always run urlparse
        if isinstance(url, str):
            url_parts = urllib.parse.urlparse(url)
            self._scheme = url_parts.scheme.lower()
            self._netloc = url_parts.netloc.lower()
            self._path = requote_uri(url_parts.path or '/')
            self._query = url_parts.query

            if not case_sensitive:
                self._path = self._path.lower()
                self._query = self._query.lower()

        elif isinstance(url, purl_types):
            self._scheme = url.scheme()
            self._netloc = url.netloc()
            self._path = url.path()
            self._query = url.query()

            if not case_sensitive:
                self._path = self._path.lower()
                self._query = self._query.lower()

        else:
            self._scheme = None
            self._netloc = None
            self._path = None
            self._query = None

    def _match_method(self, request):
        if self._method is ANY:
            return True

        if request.method.lower() == self._method.lower():
            return True

        return False

    def _match_url(self, request):
        if self._url is ANY:
            return True

        # regular expression matching
        if hasattr(self._url, 'search'):
            return self._url.search(request.url) is not None

        # scheme is always matched case insensitive
        if self._scheme and request.scheme.lower() != self._scheme:
            return False

        # netloc is always matched case insensitive
        if self._netloc and request.netloc.lower() != self._netloc:
            return False

        if (request.path or '/') != self._path:
            return False

        # construct our own qs structure as we remove items from it below
        request_qs = urllib.parse.parse_qs(request.query,
                                           keep_blank_values=True)
        matcher_qs = urllib.parse.parse_qs(self._query, keep_blank_values=True)

        for k, vals in matcher_qs.items():
            for v in vals:
                try:
                    request_qs.get(k, []).remove(v)
                except ValueError:
                    return False

        if self._complete_qs:
            for v in request_qs.values():
                if v:
                    return False

        return True

    def _match_headers(self, request):
        for k, vals in self._request_headers.items():

            try:
                header = request.headers[k]
            except KeyError:
                # NOTE(jamielennox): This seems to be a requests 1.2/2
                # difference, in 2 they are just whatever the user inputted in
                # 1 they are bytes. Let's optionally handle both and look at
                # removing this when we depend on requests 2.
                if not isinstance(k, str):
                    return False

                try:
                    header = request.headers[k.encode('utf-8')]
                except KeyError:
                    return False

            if header != vals:
                return False

        return True

    def _match_additional(self, request):
        if callable(self._additional_matcher):
            return self._additional_matcher(request)

        if self._additional_matcher is not None:
            raise TypeError("Unexpected format of additional matcher.")

        return True

    def _match(self, request):
        return (self._match_method(request) and
                self._match_url(request) and
                self._match_headers(request) and
                self._match_additional(request))

    def __call__(self, request):
        if not self._match(request):
            return None

        # doing this before _add_to_history means real requests are not stored
        # in the request history. I'm not sure what is better here.
        if self._real_http:
            raise _RunRealHTTP()

        if len(self._responses) > 1:
            response_matcher = self._responses.pop(0)
        else:
            response_matcher = self._responses[0]

        self._add_to_history(request)
        return response_matcher.get_response(request)


class Adapter(BaseAdapter, _RequestHistoryTracker):
    """A fake adapter than can return predefined responses.

    """
    def __init__(self, case_sensitive=False):
        super(Adapter, self).__init__()
        self._case_sensitive = case_sensitive
        self._matchers = []

    def send(self, request, **kwargs):
        request = _RequestObjectProxy(request,
                                      case_sensitive=self._case_sensitive,
                                      **kwargs)
        self._add_to_history(request)

        for matcher in reversed(self._matchers):
            try:
                resp = matcher(request)
            except Exception:
                request._matcher = weakref.ref(matcher)
                raise

            if resp is not None:
                request._matcher = weakref.ref(matcher)
                resp.connection = self
                logger.debug('{} {} {}'.format(request._request.method,
                                               request._request.url,
                                               resp.status_code))
                return resp

        raise exceptions.NoMockAddress(request)

    def close(self):
        pass

    def register_uri(self, method, url, response_list=None, **kwargs):
        """Register a new URI match and fake response.

        :param str method: The HTTP method to match.
        :param str url: The URL to match.
        """
        complete_qs = kwargs.pop('complete_qs', False)
        additional_matcher = kwargs.pop('additional_matcher', None)
        request_headers = kwargs.pop('request_headers', {})
        real_http = kwargs.pop('_real_http', False)
        json_encoder = kwargs.pop('json_encoder', None)

        if response_list and kwargs:
            raise RuntimeError('You should specify either a list of '
                               'responses OR response kwargs. Not both.')
        elif real_http and (response_list or kwargs):
            raise RuntimeError('You should specify either response data '
                               'OR real_http. Not both.')
        elif not response_list:
            if json_encoder is not None:
                kwargs['json_encoder'] = json_encoder
            response_list = [] if real_http else [kwargs]

        # NOTE(jamielennox): case_sensitive is not present as a kwarg because i
        # think there would be an edge case where the adapter and register_uri
        # had different values.
        # Ideally case_sensitive would be a value passed to match() however
        # this would change the contract of matchers so we pass ito to the
        # proxy and the matcher separately.
        responses = [_MatcherResponse(**k) for k in response_list]
        matcher = _Matcher(method,
                           url,
                           responses,
                           case_sensitive=self._case_sensitive,
                           complete_qs=complete_qs,
                           additional_matcher=additional_matcher,
                           request_headers=request_headers,
                           real_http=real_http)
        self.add_matcher(matcher)
        return matcher

    def add_matcher(self, matcher):
        """Register a custom matcher.

        A matcher is a callable that takes a `requests.Request` and returns a
        `requests.Response` if it matches or None if not.

        :param callable matcher: The matcher to execute.
        """
        self._matchers.append(matcher)

    def reset(self):
        super(Adapter, self).reset()
        for matcher in self._matchers:
            matcher.reset()


__all__ = ['Adapter']
