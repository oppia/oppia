# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Internal HTTP client module.

This module provides utilities for making HTTP calls using the requests library.
"""

from __future__ import annotations
import logging
from typing import Any, Dict, Generator, Optional, Tuple, Union
import httpx
import requests.adapters
from requests.packages.urllib3.util import retry # pylint: disable=import-error
from google.auth import credentials
from google.auth import transport
from google.auth.transport import requests as google_auth_requests

from firebase_admin import _utils
from firebase_admin._retry import HttpxRetry, HttpxRetryTransport

logger = logging.getLogger(__name__)

if hasattr(retry.Retry.DEFAULT, 'allowed_methods'):
    _ANY_METHOD = {'allowed_methods': None}
else:
    _ANY_METHOD = {'method_whitelist': None}
# Default retry configuration: Retries once on low-level connection and socket read errors.
# Retries up to 4 times on HTTP 500 and 503 errors, with exponential backoff. Returns the
# last response upon exhausting all retries.
DEFAULT_RETRY_CONFIG = retry.Retry(
    connect=1, read=1, status=4, status_forcelist=[500, 503],
    raise_on_status=False, backoff_factor=0.5, **_ANY_METHOD)

DEFAULT_HTTPX_RETRY_CONFIG = HttpxRetry(
    max_retries=4, status_forcelist=[500, 503], backoff_factor=0.5)


DEFAULT_TIMEOUT_SECONDS = 120

METRICS_HEADERS = {
    'x-goog-api-client': _utils.get_metrics_header(),
}

class HttpClient:
    """Base HTTP client used to make HTTP calls.

    HttpClient maintains an HTTP session, and handles request authentication and retries if
    necessary.
    """

    def __init__(
            self, credential=None, session=None, base_url='', headers=None,
            retries=DEFAULT_RETRY_CONFIG, timeout=DEFAULT_TIMEOUT_SECONDS):
        """Creates a new HttpClient instance from the provided arguments.

        If a credential is provided, initializes a new HTTP session authorized with it. If neither
        a credential nor a session is provided, initializes a new unauthorized session.

        Args:
          credential: A Google credential that can be used to authenticate requests (optional).
          session: A custom HTTP session (optional).
          base_url: A URL prefix to be added to all outgoing requests (optional).
          headers: A map of headers to be added to all outgoing requests (optional).
          retries: A urllib retry configuration. Default settings would retry once for low-level
              connection and socket read errors, and up to 4 times for HTTP 500 and 503 errors.
              Pass a False value to disable retries (optional).
          timeout: HTTP timeout in seconds. Defaults to 120 seconds when not specified. Set to
              None to disable timeouts (optional).
        """
        if credential:
            self._session = transport.requests.AuthorizedSession(credential)
        elif session:
            self._session = session
        else:
            self._session = requests.Session() # pylint: disable=redefined-variable-type

        if headers:
            self._session.headers.update(headers)
        if retries:
            self._session.mount('http://', requests.adapters.HTTPAdapter(max_retries=retries))
            self._session.mount('https://', requests.adapters.HTTPAdapter(max_retries=retries))
        self._base_url = base_url
        self._timeout = timeout

    @property
    def session(self):
        return self._session

    @property
    def base_url(self):
        return self._base_url

    @property
    def timeout(self):
        return self._timeout

    def parse_body(self, resp):
        raise NotImplementedError

    def request(self, method, url, **kwargs):
        """Makes an HTTP call using the Python requests library.

        This is the sole entry point to the requests library. All other helper methods in this
        class call this method to send HTTP requests out. Refer to
        http://docs.python-requests.org/en/master/api/ for more information on supported options
        and features.

        Args:
          method: HTTP method name as a string (e.g. get, post).
          url: URL of the remote endpoint.
          **kwargs: An additional set of keyword arguments to be passed into the requests API
              (e.g. json, params, timeout).

        Returns:
          Response: An HTTP response object.

        Raises:
          RequestException: Any requests exceptions encountered while making the HTTP call.
        """
        if 'timeout' not in kwargs:
            kwargs['timeout'] = self.timeout
        kwargs.setdefault('headers', {}).update(METRICS_HEADERS)
        resp = self._session.request(method, self.base_url + url, **kwargs)
        resp.raise_for_status()
        return resp

    def headers(self, method, url, **kwargs):
        resp = self.request(method, url, **kwargs)
        return resp.headers

    def body_and_response(self, method, url, **kwargs):
        resp = self.request(method, url, **kwargs)
        return self.parse_body(resp), resp

    def body(self, method, url, **kwargs):
        resp = self.request(method, url, **kwargs)
        return self.parse_body(resp)

    def headers_and_body(self, method, url, **kwargs):
        resp = self.request(method, url, **kwargs)
        return resp.headers, self.parse_body(resp)

    def close(self):
        self._session.close()
        self._session = None

class JsonHttpClient(HttpClient):
    """An HTTP client that parses response messages as JSON."""

    def __init__(self, **kwargs):
        HttpClient.__init__(self, **kwargs)

    def parse_body(self, resp):
        return resp.json()

class GoogleAuthCredentialFlow(httpx.Auth):
    """Google Auth Credential Auth Flow"""
    def __init__(self, credential: credentials.Credentials):
        self._credential = credential
        self._max_refresh_attempts = 2
        self._refresh_status_codes = (401,)

    def apply_auth_headers(
            self,
            request: httpx.Request,
            auth_request: google_auth_requests.Request
        ) -> None:
        """A helper function that refreshes credentials if needed and mutates the request headers
        to contain access token and any other Google Auth headers."""

        logger.debug(
            'Attempting to apply auth headers. Credential validity before: %s',
            self._credential.valid
        )
        self._credential.before_request(
            auth_request, request.method, str(request.url), request.headers
        )
        logger.debug('Auth headers applied. Credential validity after: %s', self._credential.valid)

    def auth_flow(self, request: httpx.Request) -> Generator[httpx.Request, httpx.Response, None]:
        _original_headers = request.headers.copy()
        _credential_refresh_attempt = 0

        # Create a Google auth request object to be used for refreshing credentials
        auth_request = google_auth_requests.Request()

        while True:
            # Copy original headers for each attempt
            request.headers = _original_headers.copy()

            # Apply auth headers (which might include an implicit refresh if token is expired)
            self.apply_auth_headers(request, auth_request)

            logger.debug(
                'Dispatching request, attempt %d of %d',
                _credential_refresh_attempt, self._max_refresh_attempts
            )
            response: httpx.Response = yield request

            if response.status_code in self._refresh_status_codes:
                if _credential_refresh_attempt < self._max_refresh_attempts:
                    logger.debug(
                        'Received status %d. Attempting explicit credential refresh. \
                        Attempt %d of %d.',
                        response.status_code,
                        _credential_refresh_attempt + 1,
                        self._max_refresh_attempts
                    )
                    # Explicitly force a credentials refresh
                    self._credential.refresh(auth_request)
                    _credential_refresh_attempt += 1
                else:
                    logger.debug(
                        'Received status %d, but max auth refresh attempts (%d) reached. \
                        Returning last response.',
                        response.status_code, self._max_refresh_attempts
                    )
                    break
            else:
                # Status code is not one that requires a refresh, so break and return response
                logger.debug(
                    'Status code %d does not require refresh. Returning response.',
                    response.status_code
                )
                break
        # The last yielded response is automatically returned by httpx's auth flow.

class HttpxAsyncClient():
    """Async HTTP client used to make HTTP/2 calls using HTTPX.

    HttpxAsyncClient maintains an async HTTPX client, handles request authentication, and retries
    if necessary.
    """
    def __init__(
            self,
            credential: Optional[credentials.Credentials] = None,
            base_url: str = '',
            headers: Optional[Union[httpx.Headers, Dict[str, str]]] = None,
            retry_config: HttpxRetry = DEFAULT_HTTPX_RETRY_CONFIG,
            timeout: int = DEFAULT_TIMEOUT_SECONDS,
            http2: bool = True
    ) -> None:
        """Creates a new HttpxAsyncClient instance from the provided arguments.

        If a credential is provided, initializes a new async HTTPX client authorized with it.
        Otherwise, initializes a new unauthorized async HTTPX client.

        Args:
            credential: A Google credential that can be used to authenticate requests (optional).
            base_url: A URL prefix to be added to all outgoing requests (optional).
            headers: A map of headers to be added to all outgoing requests (optional).
            retry_config: A HttpxRetry configuration. Default settings would retry up to 4 times for
                HTTP 500 and 503 errors (optional).
            timeout: HTTP timeout in seconds. Defaults to 120 seconds when not specified (optional).
            http2: A boolean indicating if HTTP/2 support should be enabled. Defaults to `True` when
                not specified (optional).
        """
        self._base_url = base_url
        self._timeout = timeout
        self._headers = {**headers, **METRICS_HEADERS} if headers else {**METRICS_HEADERS}
        self._retry_config = retry_config

        # Only set up retries on urls starting with 'http://' and 'https://'
        self._mounts = {
            'http://': HttpxRetryTransport(retry=self._retry_config, http2=http2),
            'https://': HttpxRetryTransport(retry=self._retry_config, http2=http2)
        }

        if credential:
            self._async_client = httpx.AsyncClient(
                http2=http2,
                timeout=self._timeout,
                headers=self._headers,
                auth=GoogleAuthCredentialFlow(credential), # Add auth flow for credentials.
                mounts=self._mounts
            )
        else:
            self._async_client = httpx.AsyncClient(
                http2=http2,
                timeout=self._timeout,
                headers=self._headers,
                mounts=self._mounts
            )

    @property
    def base_url(self):
        return self._base_url

    @property
    def timeout(self):
        return self._timeout

    @property
    def async_client(self):
        return self._async_client

    async def request(self, method: str, url: str, **kwargs: Any) -> httpx.Response:
        """Makes an HTTP call using the HTTPX library.

        This is the sole entry point to the HTTPX library. All other helper methods in this
        class call this method to send HTTP requests out. Refer to
        https://www.python-httpx.org/api/ for more information on supported options
        and features.

        Args:
            method: HTTP method name as a string (e.g. get, post).
            url: URL of the remote endpoint.
            **kwargs: An additional set of keyword arguments to be passed into the HTTPX API
                (e.g. json, params, timeout).

        Returns:
            Response: An HTTPX response object.

        Raises:
            HTTPError: Any HTTPX exceptions encountered while making the HTTP call.
            RequestException: Any requests exceptions encountered while making the HTTP call.
        """
        if 'timeout' not in kwargs:
            kwargs['timeout'] = self.timeout
        resp = await self._async_client.request(method, self.base_url + url, **kwargs)
        return resp.raise_for_status()

    async def headers(self, method: str, url: str, **kwargs: Any) -> httpx.Headers:
        resp = await self.request(method, url, **kwargs)
        return resp.headers

    async def body_and_response(
            self, method: str, url: str, **kwargs: Any) -> Tuple[Any, httpx.Response]:
        resp = await self.request(method, url, **kwargs)
        return self.parse_body(resp), resp

    async def body(self, method: str, url: str, **kwargs: Any) -> Any:
        resp = await self.request(method, url, **kwargs)
        return self.parse_body(resp)

    async def headers_and_body(
            self, method: str, url: str, **kwargs: Any) -> Tuple[httpx.Headers, Any]:
        resp = await self.request(method, url, **kwargs)
        return resp.headers, self.parse_body(resp)

    def parse_body(self, resp: httpx.Response) -> Any:
        return resp.json()

    async def aclose(self) -> None:
        await self._async_client.aclose()
