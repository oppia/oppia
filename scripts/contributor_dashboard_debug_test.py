# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/contributor_dashboard_debug.py."""

from __future__ import annotations

import hashlib
import os

from core import feconf
from core.controllers import base
from core.domain import opportunity_services
from core.domain import question_fetchers
from core.domain import skill_services
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.domain import user_services
from core.platform import models
from core.platform.auth import firebase_auth_services_test
from core.tests import test_utils

from scripts import contributor_dashboard_debug

import firebase_admin
from firebase_admin import auth as firebase_auth

import requests
from typing import Dict, List, Optional
import webtest

auth_services = models.Registry.import_auth_services()


class MockResponse:

    def __init__(
        self,
        ok: bool = True,
        json: Dict[str, str] | None = None,
        status_code: int = 200,
        reason: str = 'foo'
    ) -> None:
        if json is None:
            json = {}
        self.ok = ok
        self.json_dict = json
        self.status_code = status_code
        self.reason = reason

    def json(self) -> Dict[str, str]:
        """Get json dict or raise ValueError if json_dict not a dict."""
        if not isinstance(self.json_dict, dict):
            raise ValueError('Payload not JSON.')
        return self.json_dict


class ContributorDashboardDebugInitializerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.firebase_sdk_stub = (
            firebase_auth_services_test.FirebaseAdminSdkStub())
        self.firebase_sdk_stub.install(self)
        self.token_by_email: Dict[str, str] = {}
        self.token_of_current_user: Optional[str] = None
        self.initializer = (
            contributor_dashboard_debug.ContributorDashboardDebugInitializer(
                base_url=''))

        self.initializer.csrf_token = self.get_new_csrf_token()

        self.request_swap = self.swap(
            self.initializer.session,
            'request',
            self._mock_request)

        self.init_app_swap = self.swap_with_call_counter(
            firebase_admin, 'initialize_app')

        admin_password = hashlib.md5(
            contributor_dashboard_debug.SUPER_ADMIN_EMAIL.encode(
                'utf-8')).hexdigest()
        contributor_password = hashlib.md5(
            contributor_dashboard_debug.CONTRIBUTOR_EMAIL.encode(
                'utf-8')).hexdigest()
        self.create_user_swap = self.swap_with_checks(
            firebase_auth, 'create_user', self._mock_firebase_auth_create_user,
            expected_kwargs=[
                {
                    'email': contributor_dashboard_debug.SUPER_ADMIN_EMAIL,
                    'password': admin_password
                },
                {
                    'email': contributor_dashboard_debug.CONTRIBUTOR_EMAIL,
                    'password': contributor_password
                }
            ]
        )

        self.begin_session_swap = self.swap(
            self.initializer, '_sign_in',
            self._mock_login_as_admin)

    def tearDown(self) -> None:
        self.firebase_sdk_stub.uninstall()
        self.logout()
        super().tearDown()

    def _mock_request(
        self,
        method: str,
        url: str,
        params: Dict[str, str] | None = None,
        headers: Dict[str, str] | None = None
    ) -> webtest.TestResponse:
        """Returns a mock response for the given request."""
        if method == 'GET':
            if url == '/session_begin':
                assert headers is not None
                cur_token = headers.get('Authorization', '').strip('Bearer ')
                for email, token in self.token_by_email.items():
                    if token == cur_token:
                        self._mock_login_as_admin(email)
                        break
            with self.swap(
                base, 'load_template', test_utils.mock_load_template
            ):
                return self.testapp.get(url, params=params, headers=headers)
        if method == 'POST':
            return self.testapp.post(url, params=params, headers=headers)
        if method == 'PUT':
            return self.testapp.put(url, params=params, headers=headers)

    def _mock_firebase_auth_create_user(self, **kwargs: str) -> None:
        """Mock for firebase_auth.create_user()."""
        email = kwargs['email']
        auth_id = self.get_auth_id_from_email(email)
        self.token_by_email[email] = (
            self.firebase_sdk_stub.create_user(auth_id, email))
        print('token_by_email: %s' % self.token_by_email)

    def _mock_login_as_admin(self, email: str) -> None:
        """Sets the environment variables to simulate a login of admin."""
        self.login(email, is_super_admin=True)

    def test_populate_debug_data(self) -> None:
        with self.request_swap, self.create_user_swap, self.begin_session_swap:
            with self.init_app_swap as init_app_counter:
                self.initializer.populate_debug_data()

        self.assertEqual(init_app_counter.times_called, 1)
        # Asserts that the function _mock_login_as_admin() is called.
        self.assertEqual(
            os.environ['USER_EMAIL'],
            contributor_dashboard_debug.SUPER_ADMIN_EMAIL)
        self.assertEqual(os.environ['USER_IS_ADMIN'], '1')

        self._assert_user_roles(
            contributor_dashboard_debug.SUPER_ADMIN_USERNAME,
            contributor_dashboard_debug.SUPER_ADMIN_ROLES)
        self._assert_can_submit_question_suggestions(
            contributor_dashboard_debug.CONTRIBUTOR_USERNAME)
        self._assert_generate_sample_new_structures_data()
        self._assert_topics_in_classroom(
            contributor_dashboard_debug.CLASSROOM_NAME)

    def _assert_user_roles(self, username: str, roles: List[str]) -> None:
        """Asserts that the user has the given roles."""
        user_settings = user_services.get_user_settings_from_username(username)
        assert user_settings is not None
        self.assertEqual(
            user_settings.roles, [feconf.ROLE_ID_FULL_USER] + roles)

    def _assert_can_submit_question_suggestions(self, username: str) -> None:
        """Asserts that the user can submit question suggestions."""
        user_id = user_services.get_user_id_from_username(username)
        assert user_id is not None
        self.assertTrue(user_services.can_submit_question_suggestions(user_id))

    def _assert_generate_sample_new_structures_data(self) -> None:
        """Asserts that the sample new structures data is generated."""
        topic_summaries = topic_fetchers.get_all_topic_summaries()
        self.assertEqual(len(topic_summaries), 2)

        topic = topic_fetchers.get_topic_by_name('Dummy Topic 1')
        assert topic is not None
        story_id = topic.canonical_story_references[0].story_id
        self.assertIsNotNone(
            story_fetchers.get_story_by_id(story_id, strict=False))

        skill_summaries = skill_services.get_all_skill_summaries()
        self.assertEqual(len(skill_summaries), 3)

        questions, _ = (
            question_fetchers.get_questions_and_skill_descriptions_by_skill_ids(
                10,
                [
                    skill_summaries[0].id,
                    skill_summaries[1].id,
                    skill_summaries[2].id
                ],
                0)
        )
        self.assertEqual(len(questions), 3)

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', '', None))
        self.assertEqual(len(translation_opportunities), 3)

    def _assert_topics_in_classroom(self, classroom_name: str) -> None:
        """Asserts that test topics are in the classroom."""
        classroom_dict = self.get_json(
            '%s/%s' % (feconf.CLASSROOM_DATA_HANDLER, classroom_name))
        topic_summaries = topic_fetchers.get_all_topic_summaries()
        for topic_summary in topic_summaries:
            topic_summary_dict = dict(topic_summary.to_dict())
            topic_summary_dict['is_published'] = False
            self.assertIn(
                topic_summary_dict, classroom_dict['topic_summary_dicts'])

    def test_sign_up_new_user(self) -> None:
        auth_host = os.environ.get('FIREBASE_AUTH_EMULATOR_HOST')
        if auth_host is None:
            os.environ['FIREBASE_AUTH_EMULATOR_HOST'] = '0000'

        with self.request_swap, self.create_user_swap, self.begin_session_swap:
            with self.init_app_swap as init_app_counter:
                self.initializer.populate_debug_data()

        self.assertEqual(init_app_counter.times_called, 1)
        # Asserts that the environment variable 'FIREBASE_AUTH_EMULATOR_HOST' is
        # not changed after calling the function populate_debug_data().
        if auth_host is None:
            self.assertEqual(os.environ['FIREBASE_AUTH_EMULATOR_HOST'], '0000')
            del os.environ['FIREBASE_AUTH_EMULATOR_HOST']
        else:
            self.assertNotIn('FIREBASE_AUTH_EMULATOR_HOST', auth_host)

        self._assert_sign_up_new_user(
            contributor_dashboard_debug.SUPER_ADMIN_EMAIL,
            contributor_dashboard_debug.SUPER_ADMIN_USERNAME)
        self._assert_sign_up_new_user(
            contributor_dashboard_debug.CONTRIBUTOR_EMAIL,
            contributor_dashboard_debug.CONTRIBUTOR_USERNAME)

    def _assert_sign_up_new_user(self, email: str, username: str) -> None:
        """Asserts that the function _mock_firebase_auth_create_user() is called
        and a user with the given email and username is created.
        """
        self.assertIsNotNone(self.firebase_sdk_stub.get_user_by_email(email))
        user_settings = user_services.get_user_settings_from_email(email)
        assert user_settings is not None
        self.assertEqual(user_settings.username, username)

    def test_sign_in(self) -> None:
        sign_in_swap = self.swap_with_checks(
            requests, 'post', self._mock_firebase_auth_sign_in,
            expected_args=[
                (contributor_dashboard_debug.FIREBASE_SIGN_IN_URL,),
                (contributor_dashboard_debug.FIREBASE_SIGN_IN_URL,),
                (contributor_dashboard_debug.FIREBASE_SIGN_IN_URL,)
            ]
        )

        with self.request_swap, self.create_user_swap:
            with sign_in_swap, self.init_app_swap as init_app_counter:
                self.initializer.populate_debug_data()

        self.assertEqual(init_app_counter.times_called, 1)
        # Asserts that the function _mock_firebase_auth_sign_in() is called.
        self.assertEqual(
            self.token_of_current_user,
            self.token_by_email[contributor_dashboard_debug.SUPER_ADMIN_EMAIL])
        # Asserts that the function mock_establish_auth_session() is called.
        self.assertEqual(
            os.environ['USER_EMAIL'],
            contributor_dashboard_debug.SUPER_ADMIN_EMAIL)
        self.assertEqual(os.environ['USER_IS_ADMIN'], '1')

    def _mock_firebase_auth_sign_in(
        self, _: str, **kwargs: Dict[str, str]
    ) -> MockResponse:
        """Mock for the post request to FIREBASE_SIGN_IN_URL, where the response
        including the token information.
        """
        email = kwargs['json']['email']
        self.token_of_current_user = self.token_by_email[email]
        return MockResponse(json={'idToken': self.token_of_current_user})
