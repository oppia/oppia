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

"""Unit tests for scripts/populate_sample_data.py."""

from __future__ import annotations

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
from scripts import populate_sample_contributor_data

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


class SampleDataInitializerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        self.AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False
        super().setUp()
        self.firebase_sdk_stub = (
            firebase_auth_services_test.FirebaseAdminSdkStub())
        self.firebase_sdk_stub.install(self)
        self.token_by_email: Dict[str, str] = {}
        self.token_of_current_user: Optional[str] = None
        self.initializer = (
            populate_sample_contributor_data.SampleDataInitializer(
                base_url=''))

        self.initializer.csrf_token = self.get_new_csrf_token()

        self.request_swap = self.swap(
            self.initializer.session,
            'request',
            self._mock_request)

        self.post_to_firebase_swap = self.swap_with_checks(
            requests, 'post',
            self._mock_post_to_firebase,
            expected_args=[
                (populate_sample_contributor_data.FIREBASE_SIGN_UP_URL,),
                (populate_sample_contributor_data.FIREBASE_SIGN_UP_URL,),
                (populate_sample_contributor_data.FIREBASE_SIGN_IN_URL,)
            ]
        )

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

    def _mock_post_to_firebase(
        self,
        url: str,
        **kwargs: Dict[str, str]
    ) -> MockResponse | None:
        """Mock for the post request to Firebase. The request is for signing
        up or signing in a user on Firebase.
        """
        email = kwargs['json']['email']

        if url == populate_sample_contributor_data.FIREBASE_SIGN_UP_URL:
            auth_id = self.get_auth_id_from_email(email)
            self.token_by_email[email] = (
                self.firebase_sdk_stub.create_user(auth_id, email))

        self.token_of_current_user = self.token_by_email[email]
        return MockResponse(json={'idToken': self.token_of_current_user})

    def _mock_login_as_admin(self, email: str) -> None:
        """Sets the environment variables to simulate a login of admin."""
        self.login(email, is_super_admin=True)

    def test_populate_data_is_called(self) -> None:
        populate_data_swap = self.swap_with_call_counter(
            populate_sample_contributor_data.SampleDataInitializer,
            'populate_data')
        with populate_data_swap as call_counter:
            populate_sample_contributor_data.main()

        self.assertEqual(call_counter.times_called, 1)

    def test_populate_data(self) -> None:
        with self.request_swap, self.post_to_firebase_swap:
            self.initializer.populate_data()

        self._assert_sign_up_new_user(
            populate_sample_contributor_data.SUPER_ADMIN_EMAIL,
            populate_sample_contributor_data.SUPER_ADMIN_USERNAME)
        self._assert_sign_up_new_user(
            populate_sample_contributor_data.CONTRIBUTOR_EMAIL,
            populate_sample_contributor_data.CONTRIBUTOR_USERNAME)
        self._assert_user_roles(
            populate_sample_contributor_data.SUPER_ADMIN_USERNAME,
            populate_sample_contributor_data.SUPER_ADMIN_ROLES)
        self._assert_can_submit_question_suggestions(
            populate_sample_contributor_data.CONTRIBUTOR_USERNAME)
        self._assert_generate_sample_new_structures_data()
        self._assert_topics_in_classroom(
            populate_sample_contributor_data.CLASSROOM_NAME)

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
        self.assertEqual(len(topic_summaries), 1)

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
        self.assertEqual(len(questions), 5)

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', '', None))
        self.assertEqual(len(translation_opportunities), 3)

    def _assert_topics_in_classroom(self, classroom_name: str) -> None:
        """Asserts that test topics are in the classroom."""
        classroom_dict = self.get_json(
            '%s/%s' % (feconf.CLASSROOM_DATA_HANDLER, classroom_name))
        topic_summaries = topic_fetchers.get_all_topic_summaries()
        topic_summary_dicts_from_classroom = classroom_dict[
            'topic_summary_dicts']
        for index, topic_summary in enumerate(topic_summaries):
            topic_summary_dict = dict(topic_summary.to_dict())
            topic_summary_dict_from_classroom = (
                topic_summary_dicts_from_classroom[index])
            topic_summary_dict['is_published'] = (
                topic_summary_dict_from_classroom['is_published'])
            self.assertEqual(
                topic_summary_dict, topic_summary_dict_from_classroom)

    def _assert_sign_up_new_user(self, email: str, username: str) -> None:
        """Asserts that the function _mock_firebase_auth_create_user() is called
        and a user with the given email and username is created.
        """
        self.assertIsNotNone(self.firebase_sdk_stub.get_user_by_email(email))
        user_settings = user_services.get_user_settings_from_email(email)
        assert user_settings is not None
        self.assertEqual(user_settings.username, username)
