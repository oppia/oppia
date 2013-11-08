# Copyright 2012 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

import json
import os
import re
import unittest

from core.domain import exp_services
import feconf
import test_utils


@unittest.skipIf(feconf.PLATFORM != 'gae',
                 'login not implemented for non-GAE platform')
class EditorPrerequisitesTest(test_utils.GenericTestBase):

    original_settings = {}

    def setUp(self):
        super(EditorPrerequisitesTest, self).setUp()
        self.original_settings['REQUIRE_EDITORS_TO_ACCEPT_TERMS'] = (
            feconf.REQUIRE_EDITORS_TO_ACCEPT_TERMS)
        self.original_settings['REQUIRE_EDITORS_TO_SET_USERNAMES'] = (
            feconf.REQUIRE_EDITORS_TO_SET_USERNAMES)

    def tearDown(self):
        feconf.REQUIRE_EDITORS_TO_SET_USERNAMES = (
            self.original_settings['REQUIRE_EDITORS_TO_SET_USERNAMES'])
        feconf.REQUIRE_EDITORS_TO_ACCEPT_TERMS = (
            self.original_settings['REQUIRE_EDITORS_TO_ACCEPT_TERMS'])
        super(EditorPrerequisitesTest, self).tearDown()

    def test_redirect_happens_to_prerequisites_page(self):
        feconf.REQUIRE_EDITORS_TO_ACCEPT_TERMS = True

        self.login('editor@example.com', is_admin=True)

        response = self.testapp.get('/create/0')
        self.assertEqual(response.status_int, 302)
        # TODO(sll): Add assert to check the redirect destination.

        self.logout()

    def test_accepting_terms_is_handled_correctly(self):
        feconf.REQUIRE_EDITORS_TO_ACCEPT_TERMS = True

        self.login('editor@example.com', is_admin=True)

        response = self.testapp.get('/profile/editor_prerequisites')
        CSRF_REGEX = (
            r'GLOBALS\.csrf_token = JSON\.parse\(\'\\\"([A-Za-z0-9/=_-]+)\\\"\'\);')
        csrf_token = re.search(CSRF_REGEX, response.body).group(1)

        response = self.testapp.post(
            '/profile/editor_prerequisites',
            {'csrf_token': csrf_token,
             'payload': json.dumps({'agreed_to_terms': False})},
            expect_errors=True
        )      

        self.assertEqual(response.status_int, 500)
        parsed_response = self.parse_json_response(
            response, expect_errors=True)
        self.assertEqual(parsed_response['code'], 500)
        self.assertIn('you will need to accept', parsed_response['error'])

        response = self.testapp.post(
            '/profile/editor_prerequisites',
            {'csrf_token': csrf_token,
             'payload': json.dumps({'agreed_to_terms': 'Hasta la vista!'})},
            expect_errors=True
        )
        self.assertEqual(response.status_int, 500)
        parsed_response = self.parse_json_response(
            response, expect_errors=True)
        self.assertEqual(parsed_response['code'], 500)
        self.assertIn('you will need to accept', parsed_response['error'])

        response = self.testapp.post(
            '/profile/editor_prerequisites',
            {'csrf_token': csrf_token,
             'payload': json.dumps({'agreed_to_terms': True})}
        )
        self.assertEqual(response.status_int, 200)

        self.logout()

    # TODO(sll): Add tests for username.
    # TODO(sll): Add frontend tests too.
