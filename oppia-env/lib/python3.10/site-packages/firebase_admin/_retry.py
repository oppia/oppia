# Copyright 2025 Google Inc.
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

"""Internal retry logic module

This module provides utilities for adding retry logic to HTTPX requests
"""

from __future__ import annotations
import copy
import email.utils
import random
import re
import time
from typing import Any, Callable, List, Optional, Tuple, Coroutine
import logging
import asyncio
import httpx

logger = logging.getLogger(__name__)


class HttpxRetry:
    """HTTPX based retry config"""
    # Status codes to be used for respecting `Retry-After` header
    RETRY_AFTER_STATUS_CODES = frozenset([413, 429, 503])

    # Default maximum backoff time.
    DEFAULT_BACKOFF_MAX = 120

    def __init__(
            self,
            max_retries: int = 10,
            status_forcelist: Optional[List[int]] = None,
            backoff_factor: float = 0,
            backoff_max: float = DEFAULT_BACKOFF_MAX,
            backoff_jitter: float = 0,
            history: Optional[List[Tuple[
                httpx.Request,
                Optional[httpx.Response],
                Optional[Exception]
            ]]] = None,
            respect_retry_after_header: bool = False,
    ) -> None:
        self.retries_left = max_retries
        self.status_forcelist = status_forcelist
        self.backoff_factor = backoff_factor
        self.backoff_max = backoff_max
        self.backoff_jitter = backoff_jitter
        if history:
            self.history = history
        else:
            self.history = []
        self.respect_retry_after_header = respect_retry_after_header

    def copy(self) -> HttpxRetry:
        """Creates a deep copy of this instance."""
        return copy.deepcopy(self)

    def is_retryable_response(self, response: httpx.Response) -> bool:
        """Determine if a response implies that the request should be retried if possible."""
        if self.status_forcelist and response.status_code in self.status_forcelist:
            return True

        has_retry_after = bool(response.headers.get("Retry-After"))
        if (
                self.respect_retry_after_header
                and has_retry_after
                and response.status_code in self.RETRY_AFTER_STATUS_CODES
        ):
            return True

        return False

    def is_exhausted(self) -> bool:
        """Determine if there are anymore more retires."""
        # retries_left is negative
        return self.retries_left < 0

    # Identical implementation of `urllib3.Retry.parse_retry_after()`
    def _parse_retry_after(self, retry_after_header: str) -> float | None:
        """Parses Retry-After string into a float with unit seconds."""
        seconds: float
        # Whitespace: https://tools.ietf.org/html/rfc7230#section-3.2.4
        if re.match(r"^\s*[0-9]+\s*$", retry_after_header):
            seconds = int(retry_after_header)
        else:
            retry_date_tuple = email.utils.parsedate_tz(retry_after_header)
            if retry_date_tuple is None:
                raise httpx.RemoteProtocolError(f"Invalid Retry-After header: {retry_after_header}")

            retry_date = email.utils.mktime_tz(retry_date_tuple)
            seconds = retry_date - time.time()

        seconds = max(seconds, 0)

        return seconds

    def get_retry_after(self, response: httpx.Response) -> float | None:
        """Determine the Retry-After time needed before sending the next request."""
        retry_after_header = response.headers.get('Retry-After', None)
        if retry_after_header:
            # Convert retry header to a float in seconds
            return self._parse_retry_after(retry_after_header)
        return None

    def get_backoff_time(self):
        """Determine the backoff time needed before sending the next request."""
        # attempt_count is the number of previous request attempts
        attempt_count = len(self.history)
        # Backoff should be set to 0 until after first retry.
        if attempt_count <= 1:
            return 0
        backoff = self.backoff_factor * (2 ** (attempt_count-1))
        if self.backoff_jitter:
            backoff += random.random() * self.backoff_jitter
        return float(max(0, min(self.backoff_max, backoff)))

    async def sleep_for_backoff(self) -> None:
        """Determine and wait the backoff time needed before sending the next request."""
        backoff = self.get_backoff_time()
        logger.debug('Sleeping for backoff of %f seconds following failed request', backoff)
        await asyncio.sleep(backoff)

    async def sleep(self, response: httpx.Response) -> None:
        """Determine and wait the time needed before sending the next request."""
        if self.respect_retry_after_header:
            retry_after = self.get_retry_after(response)
            if retry_after:
                logger.debug(
                    'Sleeping for Retry-After header of %f seconds following failed request',
                    retry_after
                )
                await asyncio.sleep(retry_after)
                return
        await self.sleep_for_backoff()

    def increment(
            self,
            request: httpx.Request,
            response: Optional[httpx.Response] = None,
            error: Optional[Exception] = None
    ) -> None:
        """Update the retry state based on request attempt."""
        self.retries_left -= 1
        self.history.append((request, response, error))


class HttpxRetryTransport(httpx.AsyncBaseTransport):
    """HTTPX transport with retry logic."""

    DEFAULT_RETRY = HttpxRetry(max_retries=4, status_forcelist=[500, 503], backoff_factor=0.5)

    def __init__(self, retry: HttpxRetry = DEFAULT_RETRY, **kwargs: Any) -> None:
        self._retry = retry

        transport_kwargs = kwargs.copy()
        transport_kwargs.update({'retries': 0, 'http2': True})
        # We use a full AsyncHTTPTransport under the hood that is already
        # set up to handle requests. We also insure that that transport's internal
        # retries are not allowed.
        self._wrapped_transport = httpx.AsyncHTTPTransport(**transport_kwargs)

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        return await self._dispatch_with_retry(
            request, self._wrapped_transport.handle_async_request)

    async def _dispatch_with_retry(
            self,
            request: httpx.Request,
            dispatch_method: Callable[[httpx.Request], Coroutine[Any, Any, httpx.Response]]
    ) -> httpx.Response:
        """Sends a request with retry logic using a provided dispatch method."""
        # This request config is used across all requests that use this transport and therefore
        # needs to be copied to be used for just this request and it's retries.
        retry = self._retry.copy()
        # First request
        response, error = None, None

        while not retry.is_exhausted():

            # First retry
            if response:
                await retry.sleep(response)

            # Need to reset here so only last attempt's error or response is saved.
            response, error = None, None

            try:
                logger.debug('Sending request in _dispatch_with_retry(): %r', request)
                response = await dispatch_method(request)
                logger.debug('Received response: %r', response)
            except httpx.HTTPError as err:
                logger.debug('Received error: %r', err)
                error = err

            if response and not retry.is_retryable_response(response):
                return response

            if error:
                raise error

            retry.increment(request, response, error)

        if response:
            return response
        if error:
            raise error
        raise AssertionError('_dispatch_with_retry() ended with no response or exception')

    async def aclose(self) -> None:
        await self._wrapped_transport.aclose()
