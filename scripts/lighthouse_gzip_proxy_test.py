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

"""Unit tests for scripts/lighthouse_gzip_proxy.py."""

from __future__ import annotations

import gzip
import http.client
import http.server
import socket
import threading

from core.tests import test_utils
from scripts import lighthouse_gzip_proxy

from typing import cast


class UpstreamRequestHandler(http.server.BaseHTTPRequestHandler):
    """A test upstream server that returns responses for proxy tests."""

    # BaseHTTPRequestHandler dispatches requests to methods named do_<METHOD>,
    # so these names must keep their uppercase HTTP method suffix.
    protocol_version = 'HTTP/1.1'

    ROUTES = {
        '/text': (
            200,
            'text/plain; charset=utf-8',
            b'a' * 5000,
            (('Cache-Control', 'public'), ('Vary', 'Origin')),
        ),
        '/json': (
            200,
            'application/json',
            b'{"key": "' + b'b' * 5000 + b'"}',
            (),
        ),
        '/image': (200, 'image/png', b'\x89PNG' + b'c' * 5000, ()),
        '/small': (200, 'text/plain', b'small', ()),
        '/already-compressed': (
            200,
            'application/javascript',
            gzip.compress(b'd' * 5000),
            (('Content-Encoding', 'gzip'),),
        ),
        '/no-transform': (
            200,
            'text/plain',
            b'e' * 5000,
            (('Cache-Control', 'no-transform'),),
        ),
        '/vary-encoding': (
            200,
            'text/plain',
            b'f' * 5000,
            (('Vary', 'Accept-Encoding'),),
        ),
        '/hop-by-hop': (
            200,
            'text/plain',
            b'g' * 5000,
            (('Connection', 'close'), ('X-Test-Header', 'present')),
        ),
        '/head': (200, 'text/plain', b'h' * 5000, ()),
    }

    def _send_response(
        self,
        status: int,
        content_type: str,
        body: bytes,
        extra_headers: tuple[tuple[str, str], ...],
    ) -> None:
        """Sends a response with the given status, type, and body.

        Args:
            status: int. The HTTP status code.
            content_type: str. The Content-Type header value.
            body: bytes. The response body.
            extra_headers: tuple(tuple(str, str)). Extra headers to send.
        """
        self.send_response_only(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        for name, value in extra_headers:
            self.send_header(name, value)
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def do_GET(self) -> None:  # pylint: disable=invalid-name
        """Handles a GET request."""
        if self.path == '/not-modified':
            self.send_response_only(304)
            self.end_headers()
            return
        status, content_type, body, headers = self.ROUTES.get(
            self.path, (404, 'text/plain', b'not found', ())
        )
        self._send_response(status, content_type, body, headers)

    def do_HEAD(self) -> None:  # pylint: disable=invalid-name
        """Handles a HEAD request."""
        self.do_GET()

    def _echo_body(self) -> None:
        """Echoes the request body in a JSON response."""
        content_length = int(self.headers.get('Content-Length', '0'))
        body = self.rfile.read(content_length)
        self._send_response(200, 'application/json', body, ())

    def do_POST(self) -> None:  # pylint: disable=invalid-name
        """Handles a POST request."""
        self._echo_body()

    def do_PUT(self) -> None:  # pylint: disable=invalid-name
        """Handles a PUT request."""
        self._echo_body()

    def do_DELETE(self) -> None:  # pylint: disable=invalid-name
        """Handles a DELETE request."""
        self._echo_body()

    def do_OPTIONS(self) -> None:  # pylint: disable=invalid-name
        """Handles an OPTIONS request."""
        self._echo_body()

    # Here we use object because log_message only forwards the values to the
    # format string and never inspects them, so any type is acceptable.
    def log_message(  # pylint: disable=unused-argument
        self, format_string: str, *args: object
    ) -> None:
        """Suppresses request logging in the test upstream server.

        Args:
            format_string: str. The unformatted log message.
            *args: list(*). The values used to format the log message.
        """


class LighthouseGzipProxyTests(test_utils.TestBase):
    """Unit tests for the Lighthouse gzip proxy."""

    def setUp(self) -> None:
        super().setUp()
        self.upstream_server = http.server.ThreadingHTTPServer(
            ('127.0.0.1', 0), UpstreamRequestHandler
        )
        self.upstream_port = self.upstream_server.server_address[1]
        self.upstream_thread = threading.Thread(
            target=self.upstream_server.serve_forever, daemon=True
        )
        self.upstream_thread.start()

        self.proxy_server = lighthouse_gzip_proxy.create_server(
            port=0, upstream_port=self.upstream_port
        )
        self.proxy_port = self.proxy_server.server_address[1]
        self.proxy_thread = threading.Thread(
            target=self.proxy_server.serve_forever, daemon=True
        )
        self.proxy_thread.start()

    def tearDown(self) -> None:
        self.proxy_server.shutdown()
        self.proxy_server.server_close()
        self.proxy_thread.join()
        self.upstream_server.shutdown()
        self.upstream_server.server_close()
        self.upstream_thread.join()
        super().tearDown()

    def _request(
        self,
        path: str,
        method: str = 'GET',
        body: bytes | None = None,
        accept_gzip: bool = True,
        extra_headers: dict[str, str] | None = None,
    ) -> tuple[http.client.HTTPResponse, bytes]:
        """Sends a request through the proxy and returns the response.

        Args:
            path: str. The path to request.
            method: str. The HTTP method to use.
            body: bytes | None. The request body, if any.
            accept_gzip: bool. Whether to advertise gzip support.
            extra_headers: dict(str, str) | None. Additional request headers.

        Returns:
            tuple(HTTPResponse, bytes). The response headers and body.
        """
        headers = dict(extra_headers or {})
        if accept_gzip:
            headers['Accept-Encoding'] = 'gzip'
        connection = http.client.HTTPConnection(
            '127.0.0.1', self.proxy_port, timeout=10
        )
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        response_body = response.read()
        connection.close()
        return response, response_body

    def _get_unused_port(self) -> int:
        """Returns a port that is currently free on the local machine."""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(('127.0.0.1', 0))
            # Here we use cast because getsockname() is typed as returning a
            # generic address tuple.
            return cast(int, sock.getsockname()[1])

    def _vary_values(self, response: http.client.HTTPResponse) -> list[str]:
        """Returns all Vary header values in the given response."""
        return response.headers.get_all('Vary') or []

    def test_compresses_text_response(self) -> None:
        response, body = self._request('/text')

        self.assertEqual(response.status, 200)
        self.assertEqual(response.getheader('Content-Encoding'), 'gzip')
        self.assertEqual(gzip.decompress(body), b'a' * 5000)
        # Here we use cast because getheader() may return None when the
        # header is absent, but this assertion only runs when it is present.
        self.assertEqual(
            int(cast(str, response.getheader('Content-Length'))), len(body)
        )
        vary_values = self._vary_values(response)
        self.assertIn('Origin', vary_values)
        self.assertIn('Accept-Encoding', vary_values)

    def test_compresses_json_response(self) -> None:
        response, body = self._request('/json')

        self.assertEqual(response.getheader('Content-Encoding'), 'gzip')
        self.assertEqual(
            gzip.decompress(body), b'{"key": "' + b'b' * 5000 + b'"}'
        )

    def test_does_not_compress_when_client_does_not_accept_gzip(self) -> None:
        response, body = self._request('/text', accept_gzip=False)

        self.assertIsNone(response.getheader('Content-Encoding'))
        self.assertEqual(body, b'a' * 5000)

    def test_does_not_compress_non_text_response(self) -> None:
        response, body = self._request('/image')

        self.assertIsNone(response.getheader('Content-Encoding'))
        self.assertEqual(body, b'\x89PNG' + b'c' * 5000)

    def test_does_not_compress_small_response(self) -> None:
        response, body = self._request('/small')

        self.assertIsNone(response.getheader('Content-Encoding'))
        self.assertEqual(body, b'small')

    def test_does_not_recompress_already_encoded_response(self) -> None:
        response, body = self._request('/already-compressed')

        self.assertEqual(response.getheader('Content-Encoding'), 'gzip')
        self.assertEqual(gzip.decompress(body), b'd' * 5000)

    def test_respects_no_transform_cache_control(self) -> None:
        response, body = self._request('/no-transform')

        self.assertIsNone(response.getheader('Content-Encoding'))
        self.assertEqual(body, b'e' * 5000)

    def test_does_not_duplicate_existing_accept_encoding_vary_header(
        self,
    ) -> None:
        response, body = self._request('/vary-encoding')

        self.assertEqual(response.getheader('Content-Encoding'), 'gzip')
        self.assertEqual(gzip.decompress(body), b'f' * 5000)
        self.assertEqual(
            self._vary_values(response).count('Accept-Encoding'), 1
        )

    def test_strips_hop_by_hop_response_headers(self) -> None:
        response, body = self._request('/hop-by-hop')

        self.assertEqual(response.getheader('X-Test-Header'), 'present')
        self.assertIsNone(response.getheader('Connection'))
        self.assertEqual(gzip.decompress(body), b'g' * 5000)

    def test_sends_head_response_without_body(self) -> None:
        response, body = self._request('/head', method='HEAD')

        self.assertEqual(response.status, 200)
        self.assertEqual(response.getheader('Content-Length'), '5000')
        self.assertIsNone(response.getheader('Content-Encoding'))
        self.assertEqual(body, b'')

    def test_sends_not_modified_response_without_body(self) -> None:
        response, body = self._request('/not-modified')

        self.assertEqual(response.status, 304)
        self.assertEqual(body, b'')

    def test_forwards_post_body(self) -> None:
        response, body = self._request(
            '/echo', method='POST', body=b'{"request": "body"}'
        )

        self.assertEqual(response.status, 200)
        self.assertEqual(body, b'{"request": "body"}')

    def test_forwards_expect_header_body(self) -> None:
        response, body = self._request(
            '/echo',
            method='POST',
            body=b'{"expect": "body"}',
            extra_headers={'Expect': '100-continue'},
        )

        self.assertEqual(response.status, 200)
        self.assertEqual(body, b'{"expect": "body"}')

    def test_supports_put_delete_and_options_methods(self) -> None:
        for method in ('PUT', 'DELETE', 'OPTIONS'):
            response, body = self._request(
                '/echo', method=method, body=b'{"method": "test"}'
            )

            self.assertEqual(response.status, 200)
            self.assertEqual(body, b'{"method": "test"}')

    def test_rejects_unsupported_method_without_logging_it(self) -> None:
        response, _ = self._request('/text', method='TRACE')

        self.assertEqual(response.status, 501)

    def test_returns_bad_gateway_when_upstream_is_unavailable(self) -> None:
        proxy_server = lighthouse_gzip_proxy.create_server(
            port=0, upstream_port=self._get_unused_port()
        )
        proxy_thread = threading.Thread(
            target=proxy_server.serve_forever, daemon=True
        )
        proxy_thread.start()
        try:
            connection = http.client.HTTPConnection(
                '127.0.0.1', proxy_server.server_address[1], timeout=10
            )
            connection.request(
                'GET', '/text', headers={'Accept-Encoding': 'gzip'}
            )
            response = connection.getresponse()
            body = response.read()
            connection.close()

            self.assertEqual(response.status, 502)
            self.assertEqual(body, b'Bad Gateway')
        finally:
            proxy_server.shutdown()
            proxy_server.server_close()
            proxy_thread.join()

    def test_returns_bad_gateway_without_body_for_head_request(self) -> None:
        proxy_server = lighthouse_gzip_proxy.create_server(
            port=0, upstream_port=self._get_unused_port()
        )
        proxy_thread = threading.Thread(
            target=proxy_server.serve_forever, daemon=True
        )
        proxy_thread.start()
        try:
            connection = http.client.HTTPConnection(
                '127.0.0.1', proxy_server.server_address[1], timeout=10
            )
            connection.request('HEAD', '/text')
            response = connection.getresponse()
            body = response.read()
            connection.close()

            self.assertEqual(response.status, 502)
            self.assertEqual(body, b'')
        finally:
            proxy_server.shutdown()
            proxy_server.server_close()
            proxy_thread.join()

    def test_create_server_uses_given_upstream_host(self) -> None:
        server = lighthouse_gzip_proxy.create_server(
            port=0, upstream_port=1234, upstream_host='upstream.example'
        )
        try:
            self.assertEqual(server.upstream_host, 'upstream.example')
            self.assertEqual(server.upstream_port, 1234)
        finally:
            server.server_close()

    def test_is_compressible_content_type(self) -> None:
        self.assertTrue(
            lighthouse_gzip_proxy.is_compressible_content_type(
                'text/html; charset=utf-8'
            )
        )
        self.assertTrue(
            lighthouse_gzip_proxy.is_compressible_content_type(
                'application/javascript'
            )
        )
        self.assertTrue(
            lighthouse_gzip_proxy.is_compressible_content_type('image/svg+xml')
        )
        self.assertFalse(
            lighthouse_gzip_proxy.is_compressible_content_type('image/png')
        )
        self.assertFalse(lighthouse_gzip_proxy.is_compressible_content_type(''))
