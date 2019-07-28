# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

""" Test for the requests module. """

import urllib2
from core.platform.email import requests
from core.tests import test_utils


class RequestsTests(test_utils.GenericTestBase):
    """Test for requests methods."""
    def test_auth_header(self):
        """Test auth_header method."""
        swapped_auth_header = lambda *_: 'auth_header'
        expected = {'Authorization': 'auth_header'}
        swap_context = self.swap(requests, 'auth_str', swapped_auth_header)
        with swap_context:
            self.assertEqual(expected, requests.auth_header('', ''))
            self.assertEqual(expected, requests.auth_header(u'', u''))
        swap_context = self.swap(requests, 'auth_str', swapped_auth_header)
        with swap_context, self.assertRaises(AssertionError):
            requests.auth_header(1, 2)

    def test_auth_string(self):
        """Test auth_str method."""
        expected = 'Basic dXNlcjpwYXNzd29yZA=='
        self.assertEqual(requests.auth_str('user', 'password'), expected)
        self.assertEqual(requests.auth_str(u'user', u'password'), expected)


    def test_post(self):
        """Test post method."""
        swapped_urlopen = lambda x: x
        swapped_request = lambda *args: args
        swap_urlopen_context = self.swap(urllib2, 'urlopen', swapped_urlopen)
        swap_request_context = self.swap(
            urllib2, 'Request', swapped_request)
        with swap_request_context, swap_urlopen_context:
            result = requests.post(
                'server', ('user', 'password'), {'data': 'data'})
            expected = (
                'server', 'data=data',
                {'Authorization': 'Basic dXNlcjpwYXNzd29yZA=='})
            self.assertEqual(result, expected)
