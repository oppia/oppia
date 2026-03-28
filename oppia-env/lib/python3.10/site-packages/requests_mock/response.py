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

import io
import http.client
import json as jsonutils

from requests.adapters import HTTPAdapter
from requests.cookies import MockRequest, MockResponse
from requests.cookies import RequestsCookieJar
from requests.cookies import merge_cookies, cookiejar_from_dict
from requests.utils import get_encoding_from_headers
from urllib3.response import HTTPResponse

from requests_mock import exceptions

_BODY_ARGS = frozenset(['raw', 'body', 'content', 'text', 'json'])
_HTTP_ARGS = frozenset([
    'status_code',
    'reason',
    'headers',
    'cookies',
    'json_encoder',
])

_DEFAULT_STATUS = 200
_http_adapter = HTTPAdapter()


class CookieJar(RequestsCookieJar):

    def set(self, name, value, **kwargs):
        """Add a cookie to the Jar.

        :param str name: cookie name/key.
        :param str value: cookie value.
        :param int version: Integer or None. Netscape cookies have version 0.
            RFC 2965 and RFC 2109 cookies have a version cookie-attribute of 1.
            However, note that cookielib may 'downgrade' RFC 2109 cookies to
            Netscape cookies, in which case version is 0.
        :param str port: String representing a port or a set of ports
            (eg. '80', or '80,8080'),
        :param str domain: The domain the cookie should apply to.
        :param str path: Cookie path (a string, eg. '/acme/rocket_launchers').
        :param bool secure: True if cookie should only be returned over a
            secure connection.
        :param int expires: Integer expiry date in seconds since epoch or None.
        :param bool discard: True if this is a session cookie.
        :param str comment: String comment from the server explaining the
            function of this cookie.
        :param str comment_url: URL linking to a comment from the server
            explaining the function of this cookie.
        """
        # just here to provide the function documentation
        return super(CookieJar, self).set(name, value, **kwargs)


def _check_body_arguments(**kwargs):
    # mutual exclusion, only 1 body method may be provided
    provided = [x for x in _BODY_ARGS if kwargs.pop(x, None) is not None]

    if len(provided) > 1:
        raise RuntimeError('You may only supply one body element. You '
                           'supplied %s' % ', '.join(provided))

    extra = [x for x in kwargs if x not in _HTTP_ARGS]

    if extra:
        raise TypeError('Too many arguments provided. Unexpected '
                        'arguments %s.' % ', '.join(extra))


class _FakeConnection(object):
    """An object that can mock the necessary parts of a socket interface."""

    def send(self, request, **kwargs):
        msg = 'This response was created without a connection. You are ' \
              'therefore unable to make a request directly on that connection.'
        raise exceptions.InvalidRequest(msg)

    def close(self):
        pass


def _extract_cookies(request, response, cookies):
    """Add cookies to the response.

    Cookies in requests are extracted from the headers in the original_response
    httplib.HTTPMessage which we don't create so we have to do this step
    manually.
    """
    # This will add cookies set manually via the Set-Cookie or Set-Cookie2
    # header but this only allows 1 cookie to be set.
    response.cookies.extract_cookies(MockResponse(response.raw.headers),
                                     MockRequest(request))

    # This allows you to pass either a CookieJar or a dictionary to request_uri
    # or directly to create_response. To allow more than one cookie to be set.
    if cookies:
        merge_cookies(response.cookies, cookies)


class _IOReader(io.BytesIO):
    """A reader that makes a BytesIO look like a HTTPResponse.

    A HTTPResponse will return an empty string when you read from it after
    the socket has been closed. A BytesIO will raise a ValueError. For
    compatibility we want to do the same thing a HTTPResponse does.
    """

    def read(self, *args, **kwargs):
        if self.closed:
            return b''

        # if the file is open, but you asked for zero bytes read you should get
        # back zero without closing the stream.
        if len(args) > 0 and args[0] == 0:
            return b''

        result = io.BytesIO.read(self, *args, **kwargs)

        # when using resp.iter_content(None) it'll go through a different
        # request path in urllib3. This path checks whether the object is
        # marked closed instead of the return value. see gh124.
        if result == b'':
            self.close()

        return result


def create_response(request, **kwargs):
    """
    :param int status_code: The status code to return upon a successful
        match. Defaults to 200.
    :param HTTPResponse raw: A HTTPResponse object to return upon a
        successful match.
    :param io.IOBase body: An IO object with a read() method that can
        return a body on successful match.
    :param bytes content: A byte string to return upon a successful match.
    :param unicode text: A text string to return upon a successful match.
    :param object json: A python object to be converted to a JSON string
        and returned upon a successful match.
    :param class json_encoder: Encoder object to use for JOSON.
    :param dict headers: A dictionary object containing headers that are
        returned upon a successful match.
    :param CookieJar cookies: A cookie jar with cookies to set on the
        response.

    :returns requests.Response: A response object that can
        be returned to requests.
    """
    connection = kwargs.pop('connection', _FakeConnection())

    _check_body_arguments(**kwargs)

    raw = kwargs.pop('raw', None)
    body = kwargs.pop('body', None)
    content = kwargs.pop('content', None)
    text = kwargs.pop('text', None)
    json = kwargs.pop('json', None)
    headers = kwargs.pop('headers', {})
    encoding = None

    if content is not None and not isinstance(content, bytes):
        raise TypeError('Content should be binary data')
    if text is not None and not isinstance(text, str):
        raise TypeError('Text should be string data')

    if json is not None:
        encoder = kwargs.pop('json_encoder', None) or jsonutils.JSONEncoder
        text = jsonutils.dumps(json, cls=encoder)
    if text is not None:
        encoding = get_encoding_from_headers(headers) or 'utf-8'
        content = text.encode(encoding)
    if content is not None:
        body = _IOReader(content)
    if not raw:
        status = kwargs.get('status_code', _DEFAULT_STATUS)
        reason = kwargs.get('reason', http.client.responses.get(status))

        raw = HTTPResponse(status=status,
                           reason=reason,
                           headers=headers,
                           body=body or _IOReader(b''),
                           decode_content=False,
                           enforce_content_length=False,
                           preload_content=False,
                           original_response=None)

    response = _http_adapter.build_response(request, raw)
    response.connection = connection

    if encoding and not response.encoding:
        response.encoding = encoding

    _extract_cookies(request, response, kwargs.get('cookies'))

    return response


class _Context(object):
    """Stores the data being used to process a current URL match."""

    def __init__(self, headers, status_code, reason, cookies):
        self.headers = headers
        self.status_code = status_code
        self.reason = reason
        self.cookies = cookies


class _MatcherResponse(object):

    def __init__(self, **kwargs):
        self._exc = kwargs.pop('exc', None)

        # If the user is asking for an exception to be thrown then prevent them
        # specifying any sort of body or status response as it won't be used.
        # This may be protecting the user too much but can be removed later.
        if self._exc and kwargs:
            raise TypeError('Cannot provide other arguments with exc.')

        _check_body_arguments(**kwargs)
        self._params = kwargs

        # whilst in general you shouldn't do type checking in python this
        # makes sure we don't end up with differences between the way types
        # are handled between python 2 and 3.
        content = self._params.get('content')
        text = self._params.get('text')

        if content is not None and not (callable(content) or
                                        isinstance(content, bytes)):
            raise TypeError('Content should be a callback or binary data')

        if text is not None and not (callable(text) or
                                     isinstance(text, str)):
            raise TypeError('Text should be a callback or string data')

    def get_response(self, request):
        # if an error was requested then raise that instead of doing response
        if self._exc:
            raise self._exc

        # If a cookie dict is passed convert it into a CookieJar so that the
        # cookies object available in a callback context is always a jar.
        cookies = self._params.get('cookies', CookieJar())
        if isinstance(cookies, dict):
            cookies = cookiejar_from_dict(cookies, CookieJar())

        context = _Context(self._params.get('headers', {}).copy(),
                           self._params.get('status_code', _DEFAULT_STATUS),
                           self._params.get('reason'),
                           cookies)

        # if a body element is a callback then execute it
        def _call(f, *args, **kwargs):
            return f(request, context, *args, **kwargs) if callable(f) else f

        return create_response(request,
                               json=_call(self._params.get('json')),
                               text=_call(self._params.get('text')),
                               content=_call(self._params.get('content')),
                               body=_call(self._params.get('body')),
                               raw=_call(self._params.get('raw')),
                               json_encoder=self._params.get('json_encoder'),
                               status_code=context.status_code,
                               reason=context.reason,
                               headers=context.headers,
                               cookies=context.cookies)
