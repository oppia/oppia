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
import unittest

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

    def test_redirect_to_prerequisites_page_happens(self):
        self.login('editor@example.com', is_admin=True)

        response = self.testapp.get('/create/0')
        self.assertEqual(response.status_int, 302)
        self.assertIn(
            '/profile/editor_prerequisites', response.headers['location'])

        response = response.follow()
        self.assertEqual(response.status_int, 200)
        response.mustcontain('A few notes before you start editing')
        response.mustcontain('My preferred Oppia username')

        self.logout()

    def test_accepting_terms_is_handled_correctly(self):
        self.register('editor@example.com')

        self.login('editor@example.com', is_admin=True)

        response = self.testapp.get('/profile/editor_prerequisites')
        csrf_token = self.get_csrf_token_from_response(response)

        response_dict = self.post_json(
            '/profile/editor_prerequisites', {'agreed_to_terms': False},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)

        self.assertEqual(response_dict['code'], 400)
        self.assertIn('you will need to accept', response_dict['error'])

        response_dict = self.post_json(
            '/profile/editor_prerequisites',
            {'agreed_to_terms': 'Hasta la vista!'},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn('you will need to accept', response_dict['error'])

        self.post_json(
            '/profile/editor_prerequisites', {'agreed_to_terms': True},
            csrf_token=csrf_token)

        self.logout()

    def test_username_is_handled_correctly(self):
        self.login('editor@example.com', is_admin=True)

        response = self.testapp.get('/profile/editor_prerequisites')
        csrf_token = self.get_csrf_token_from_response(response)

        response_dict = self.post_json(
            '/profile/editor_prerequisites', {'agreed_to_terms': True},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn('No username supplied', response_dict['error'])

        response_dict = self.post_json(
            '/profile/editor_prerequisites',
            {'username': '', 'agreed_to_terms': True},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn('No username supplied', response_dict['error'])

        response_dict = self.post_json(
            '/profile/editor_prerequisites',
            {'username': '!a!', 'agreed_to_terms': True},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn(
            'can only have alphanumeric characters', response_dict['error'])

        response_dict = self.post_json(
            '/profile/editor_prerequisites',
            {'username': 'abcde', 'agreed_to_terms': True},
            csrf_token=csrf_token)

        self.logout()
