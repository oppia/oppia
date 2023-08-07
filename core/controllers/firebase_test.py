# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Tests for the firebase controllers."""

from __future__ import annotations

import collections

from core.controllers import firebase
from core.tests import test_utils

import requests


class FirebaseProxyPageTest(test_utils.GenericTestBase):
    """Tests for FirebaseProxyPage."""

    MockResponse = collections.namedtuple(
        'MockResponse',
        ['headers', 'status_code', 'content']
    )
    MOCK_FIREBASE_RESPONSE = MockResponse(
        {
            'Content-Type': 'application/json',
            'Res-Header': 'value',
            'Connection': 'connection_value'
        },
        200,
        b')]}\'\n{"key": "val"}'
    )
    MOCK_FIREBASE_DOMAIN = 'https://mock.firebaseapp.com'

    def test_no_firebase_domain_error_raised(self) -> None:
        response = self.post_task(
            '/__/auth/', {'a': 'a'},
            {'b': 'b'}, expected_status_int=500
        )
        self.assertIn(
            b'No firebase domain found for localhost',
            response.body
        )

    def test_get_request_forwarded_to_firebase_proxy(self) -> None:
        url = '/__/auth'
        params = {'param_1': 'value_1', 'param_2': 'value_2'}
        with self.swap(
            firebase, 'FIREBASE_DOMAINS',
            {'localhost': self.MOCK_FIREBASE_DOMAIN}
        ), self.swap_with_checks(
            requests,
            'request',
            lambda *args, **kwargs: self.MOCK_FIREBASE_RESPONSE,
            [('GET', f'{self.MOCK_FIREBASE_DOMAIN}{url}')],
            [{
            'params': params, 'timeout': firebase.TIMEOUT_SECS,
            'data': None, 'headers': {'Host': 'localhost:80'}
            }]
        ):
            response = self.get_json(url, params)
            self.assertDictEqual(response, {'key': 'val'})

    def test_post_request_forwarded_to_firebase_proxy(self) -> None:
        url = '/__/auth/random_url'
        headers = {
            'Req-Header': 'value',
            'Host': 'localhost:80',
            'Content-Type': 'application/json',
            'Content-Length': '20'
        }
        payload = {'payload': 'value'}
        with self.swap(
            firebase, 'FIREBASE_DOMAINS',
            {'localhost': self.MOCK_FIREBASE_DOMAIN}
        ), self.swap_with_checks(
            requests,
            'request',
            lambda *args, **kwargs: self.MOCK_FIREBASE_RESPONSE,
            [('POST', f'{self.MOCK_FIREBASE_DOMAIN}{url}')],
            [{
            'data': payload, 'params': {},
            'headers': headers, 'timeout': firebase.TIMEOUT_SECS
            }]
        ):
            response = self.post_task(
                url,
                payload,
                headers
            )

            for header, value in self.MOCK_FIREBASE_RESPONSE.headers.items():
                if (
                    header.lower() in
                    firebase.FirebaseProxyPage.RESPONSE_EXCLUDED_HEADERS
                ):
                    self.assertNotIn(header, response.headers)
                else:
                    self.assertEqual(response.headers[header], value)
            self.assertEqual(
                response.status_int,
                self.MOCK_FIREBASE_RESPONSE.status_code
            )
            self.assertEqual(
                response.body,
                self.MOCK_FIREBASE_RESPONSE.content
            )
