# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Gzip reverse proxy used when running the Lighthouse CI checks.

The App Engine development server used by the Lighthouse tests does not
compress response bodies, but the production Google Front End does compress
text responses. Without a compression layer, Lighthouse measures a much larger
download than a production user receives, which makes the performance scores
and the `uses-text-compression` audit inaccurate. The proxy compresses at the
same level as the production front end so that the measured transfer sizes
match what users actually download.

This module provides a small reverse proxy that sits in front of the local
appserver and gzip-compresses text responses. It deliberately handles only
plain HTTP traffic, which is all that the local Lighthouse setup uses.
"""

from __future__ import annotations

import gzip
import http.client
import http.server

from typing import Final, cast

COMPRESSIBLE_CONTENT_TYPE_PREFIXES: Final = (
    'text/',
    'application/javascript',
    'application/json',
    'application/xml',
    'application/x-javascript',
    'image/svg+xml',
)
# The production Google Front End compresses text responses at a fast setting.
# Measured against a deployed bundle, its output matches gzip level 1 almost
# exactly, while level 9 produces responses about 18% smaller. Using level 1
# here keeps the Lighthouse download sizes representative of production; a
# higher level would make the checks systematically optimistic.
COMPRESSION_LEVEL: Final = 1
# These headers describe a single connection and must not be forwarded by a
# proxy (see RFC 7230, section 6.1).
HOP_BY_HOP_HEADERS: Final = frozenset(
    {
        'connection',
        'keep-alive',
        'proxy-authenticate',
        'proxy-authorization',
        'proxy-connection',
        'te',
        'trailer',
        'transfer-encoding',
        'upgrade',
    }
)
MIN_COMPRESSION_BYTES: Final = 1024
UPSTREAM_TIMEOUT_SECS: Final = 120


def is_compressible_content_type(content_type: str) -> bool:
    """Returns whether responses of the given content type can be compressed.

    Args:
        content_type: str. The Content-Type header value, including any
            parameters such as the charset.

    Returns:
        bool. Whether the media type is text-based.
    """
    media_type = content_type.split(';', 1)[0].strip().lower()
    return any(
        media_type.startswith(prefix)
        for prefix in COMPRESSIBLE_CONTENT_TYPE_PREFIXES
    )


class GzipProxyRequestHandler(http.server.BaseHTTPRequestHandler):
    """Proxies requests to the appserver and compresses text responses."""

    protocol_version = 'HTTP/1.1'

    @property
    def _proxy_server(self) -> GzipProxyServer:
        """Returns the proxy server that owns this handler."""
        # Here we use cast because BaseHTTPRequestHandler types `server` as a
        # plain HTTPServer even though this handler is only ever registered
        # with a GzipProxyServer.
        return cast(GzipProxyServer, self.server)

    # BaseHTTPRequestHandler dispatches requests to methods named do_<METHOD>,
    # so these names must keep their uppercase HTTP method suffix.
    def do_GET(self) -> None:  # pylint: disable=invalid-name
        """Handles a GET request."""
        self._proxy_request()

    def do_HEAD(self) -> None:  # pylint: disable=invalid-name
        """Handles a HEAD request."""
        self._proxy_request()

    def do_POST(self) -> None:  # pylint: disable=invalid-name
        """Handles a POST request."""
        self._proxy_request()

    def do_PUT(self) -> None:  # pylint: disable=invalid-name
        """Handles a PUT request."""
        self._proxy_request()

    def do_DELETE(self) -> None:  # pylint: disable=invalid-name
        """Handles a DELETE request."""
        self._proxy_request()

    def do_OPTIONS(self) -> None:  # pylint: disable=invalid-name
        """Handles an OPTIONS request."""
        self._proxy_request()

    # Here we use object because log_message only forwards the values to the
    # format string and never inspects them, so any type is acceptable.
    def log_message(  # pylint: disable=unused-argument
        self, format_string: str, *args: object
    ) -> None:
        """Suppresses per-request logging to keep the CI output readable.

        Args:
            format_string: str. The unformatted log message.
            *args: list(*). The values used to format the log message.
        """

    def _read_request_body(self) -> bytes:
        """Reads and returns the request body, if the request has one."""
        content_length = self.headers.get('Content-Length')
        if content_length is None:
            return b''
        return self.rfile.read(int(content_length))

    def _forwarded_request_headers(self) -> dict[str, str]:
        """Returns the request headers that should be sent upstream."""
        headers: dict[str, str] = {}
        for name, value in self.headers.items():
            lowered_name = name.lower()
            # The proxy consumes the body itself, so the upstream connection
            # must not receive the original Content-Length or Expect headers.
            if lowered_name in HOP_BY_HOP_HEADERS:
                continue
            if lowered_name in ('content-length', 'expect'):
                continue
            headers[name] = value
        return headers

    def _get_response_header(
        self, headers: list[tuple[str, str]], name: str
    ) -> str:
        """Returns the first value of the given response header.

        Args:
            headers: list(tuple(str, str)). The response headers.
            name: str. The lowercase name of the header to look up.

        Returns:
            str. The first header value, or an empty string if absent.
        """
        for header_name, value in headers:
            if header_name.lower() == name:
                return value
        return ''

    def _accepts_gzip(self) -> bool:
        """Returns whether the client accepts a gzip-encoded response."""
        accept_encoding = self.headers.get('Accept-Encoding', '')
        return any(
            encoding.split(';', 1)[0].strip().lower() == 'gzip'
            for encoding in accept_encoding.split(',')
        )

    def _proxy_request(self) -> None:
        """Proxies the current request to the upstream appserver."""
        request_body = self._read_request_body()
        connection = http.client.HTTPConnection(
            self._proxy_server.upstream_host,
            self._proxy_server.upstream_port,
            timeout=UPSTREAM_TIMEOUT_SECS,
        )
        try:
            connection.request(
                self.command,
                self.path,
                body=(
                    None if self.command in ('GET', 'HEAD') else request_body
                ),
                headers=self._forwarded_request_headers(),
            )
            response = connection.getresponse()
            response_body = response.read()
        except (OSError, http.client.HTTPException):
            self._send_bad_gateway()
            return
        finally:
            connection.close()
        self._send_proxied_response(response, response_body)

    def _filtered_response_headers(
        self,
        response: http.client.HTTPResponse,
        preserve_content_length: bool,
    ) -> list[tuple[str, str]]:
        """Returns the upstream response headers to send to the client.

        Args:
            response: HTTPResponse. The response received from the appserver.
            preserve_content_length: bool. Whether to keep the upstream
                Content-Length header. It is preserved for responses that have
                no body, where the header describes the resource rather than
                the current transfer.

        Returns:
            list(tuple(str, str)). The headers to send to the client.
        """
        headers = []
        for name, value in response.getheaders():
            lowered_name = name.lower()
            if lowered_name in HOP_BY_HOP_HEADERS:
                continue
            if lowered_name == 'content-length' and not preserve_content_length:
                continue
            headers.append((name, value))
        return headers

    def _should_compress(
        self, status: int, headers: list[tuple[str, str]], body: bytes
    ) -> bool:
        """Returns whether the response body should be gzip-compressed.

        Args:
            status: int. The response status code.
            headers: list(tuple(str, str)). The response headers.
            body: bytes. The uncompressed response body.

        Returns:
            bool. Whether the body should be compressed.
        """
        if self.command == 'HEAD' or status in (204, 304):
            return False
        if self._get_response_header(headers, 'content-encoding'):
            return False
        cache_control = self._get_response_header(headers, 'cache-control')
        if 'no-transform' in cache_control.lower():
            return False
        content_type = self._get_response_header(headers, 'content-type')
        return (
            is_compressible_content_type(content_type)
            and self._accepts_gzip()
            and len(body) >= MIN_COMPRESSION_BYTES
        )

    def _add_compression_headers(self, headers: list[tuple[str, str]]) -> None:
        """Adds the gzip encoding and Vary headers to the response headers.

        Args:
            headers: list(tuple(str, str)). The response headers to update in
                place.
        """
        vary_values = [
            value for name, value in headers if name.lower() == 'vary'
        ]
        if not any('accept-encoding' in value.lower() for value in vary_values):
            headers.append(('Vary', 'Accept-Encoding'))
        headers.append(('Content-Encoding', 'gzip'))

    def _send_proxied_response(
        self, response: http.client.HTTPResponse, body: bytes
    ) -> None:
        """Sends the upstream response, compressing text bodies when possible.

        Args:
            response: HTTPResponse. The response received from the appserver.
            body: bytes. The uncompressed response body.
        """
        is_bodyless_response = self.command == 'HEAD' or response.status in (
            204,
            304,
        )
        headers = self._filtered_response_headers(
            response, preserve_content_length=is_bodyless_response
        )
        if not is_bodyless_response and self._should_compress(
            response.status, headers, body
        ):
            body = gzip.compress(body, compresslevel=COMPRESSION_LEVEL, mtime=0)
            self._add_compression_headers(headers)
        if not is_bodyless_response:
            headers.append(('Content-Length', str(len(body))))

        self.send_response_only(response.status)
        for name, value in headers:
            self.send_header(name, value)
        self.end_headers()
        if not is_bodyless_response:
            self.wfile.write(body)

    def _send_bad_gateway(self) -> None:
        """Sends a 502 response when the upstream server cannot be reached."""
        body = b'Bad Gateway'
        self.send_response_only(502)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)


class GzipProxyServer(http.server.ThreadingHTTPServer):
    """A threading HTTP server that proxies requests to the appserver."""

    daemon_threads = True
    allow_reuse_address = True

    def __init__(
        self,
        server_address: tuple[str, int],
        upstream_address: tuple[str, int],
    ) -> None:
        """Initializes the proxy server.

        Args:
            server_address: tuple(str, int). The host and port to listen on.
            upstream_address: tuple(str, int). The host and port of the
                appserver to proxy requests to.
        """
        self.upstream_host = upstream_address[0]
        self.upstream_port = upstream_address[1]
        super().__init__(server_address, GzipProxyRequestHandler)


def create_server(
    port: int,
    upstream_port: int,
    host: str = '127.0.0.1',
    upstream_host: str = '127.0.0.1',
) -> GzipProxyServer:
    """Creates a gzip proxy server bound to the given port.

    Args:
        port: int. The port the proxy listens on. Zero allocates a free port.
        upstream_port: int. The port of the appserver to proxy requests to.
        host: str. The host the proxy binds to.
        upstream_host: str. The host of the appserver to proxy requests to.

    Returns:
        GzipProxyServer. The bound proxy server, which is not yet serving.
    """
    return GzipProxyServer((host, port), (upstream_host, upstream_port))
