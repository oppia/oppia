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

from core import feconf
from core.controllers import base
from core.domain import opportunity_services
from core.domain import question_fetchers
from core.domain import skill_services
from core.domain import story_fetchers
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.platform.auth import firebase_auth_services_test
from core.tests import test_utils

from scripts import contributor_dashboard_debug

import firebase_admin
from firebase_admin import auth as firebase_auth

from typing import Any, Dict, List

auth_services = models.Registry.import_auth_services()


class ContributorDashboardDebugInitializerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.firebase_sdk_stub = (
            firebase_auth_services_test.FirebaseAdminSdkStub())
        self.firebase_sdk_stub.install(self)
        self.contributor_dashboard_debug = (
            contributor_dashboard_debug.ContributorDashboardDebugInitializer(
                base_url=''))
        # Functions signup(), add_user_role(), set_curriculum_admins() must be
        # called before login(), because those functions will call logout().
        self.tested_email = 'testuser@example.com'
        self.tested_username = 'testuser'
        self.signup(self.tested_email, self.tested_username)
        self.add_user_role(
            self.SUPER_ADMIN_USERNAME, feconf.ROLE_ID_QUESTION_ADMIN)
        self.set_curriculum_admins([self.SUPER_ADMIN_USERNAME]) # type: ignore
        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        self.contributor_dashboard_debug.csrf_token = self.get_new_csrf_token() # type: ignore

        self.request_swap = self.swap(
            self.contributor_dashboard_debug.session,
            'request',
            self.mock_request)

    def tearDown(self) -> None:
        self.firebase_sdk_stub.uninstall()
        self.logout()
        super().tearDown()

    def mock_request(
        self,
        method: str,
        url: str,
        params: Dict[str, Any] | None = None,
        headers: Dict[str, Any] | None = None
    ) -> Any:
        """Returns a mock response for the given request."""
        if method == 'GET':
            return self.testapp.get(url, params=params, headers=headers)
        if method == 'POST':
            return self.testapp.post(url, params=params, headers=headers)
        if method == 'PUT':
            return self.testapp.put(url, params=params, headers=headers)

    def test_populate_debug_data(self) -> None:
        init_app_swap = self.swap_with_call_counter(
            firebase_admin, 'initialize_app')
        sign_up_swap = self.swap(
            self.contributor_dashboard_debug, '_sign_up_new_user', self.signup)
        begin_session_swap = self.swap(
            self.contributor_dashboard_debug, '_sign_in',
            self.mock_login_as_admin)

        with self.request_swap, sign_up_swap, begin_session_swap, (
            init_app_swap) as init_app_counter:
            self.contributor_dashboard_debug.populate_debug_data()

        self.assertEqual(init_app_counter.times_called, 1)
        self._assert_user_roles(
            contributor_dashboard_debug.SUPER_ADMIN_USERNAME,
            contributor_dashboard_debug.SUPER_ADMIN_ROLES)
        self._assert_can_submit_question_suggestions(
            contributor_dashboard_debug.CONTRIBUTOR_USERNAME)
        self._assert_generate_sample_new_structures_data()
        self._assert_topics_in_classroom(
            contributor_dashboard_debug.CLASSROOM_NAME)

    def mock_login_as_admin(self, email: str) -> None:
        """Sets the environment variables to simulate a login of admin."""
        self.login(email, is_super_admin=True)

    def test_sign_up_new_user(self) -> None:
        email = 'user1@example.com'
        username = 'user1'
        create_user_swap = self.swap(
            firebase_auth, 'create_user', self.mock_firebase_auth_create_user)
        begin_session_swap = self.swap(
            self.contributor_dashboard_debug, '_sign_in', self.login)
        load_template_swap = self.swap(
            base, 'load_template', test_utils.mock_load_template)

        with self.request_swap, create_user_swap, begin_session_swap, (
            load_template_swap):
            self.contributor_dashboard_debug._sign_up_new_user(email, username) # pylint: disable=protected-access

        self.assertIsNotNone(self.firebase_sdk_stub.get_user_by_email(email))
        self.assertEqual(
            user_services.get_user_settings_from_email(email).username, # type: ignore
            username)

    def mock_firebase_auth_create_user(self, **kwargs: Any) -> Any:
        """Mock for firebase_auth.create_user()."""
        email = kwargs['email']
        auth_id = self.get_auth_id_from_email(email) # type: ignore
        self.firebase_sdk_stub.create_user(auth_id, email)

    def test_sign_in(self) -> None:
        auth_id = self.get_auth_id_from_email(self.tested_email) # type: ignore
        token_id = self.firebase_sdk_stub.create_user(
            auth_id, email=self.tested_email)
        sign_in_swap = self.swap_to_always_return(
            self.contributor_dashboard_debug,
            '_sign_in_with_email_and_password',
            token_id)
        establish_session_swap = self.swap_with_call_counter(
            auth_services, 'establish_auth_session')

        with sign_in_swap, self.request_swap, establish_session_swap as (
            establish_session_counter):
            self.contributor_dashboard_debug._sign_in(self.tested_email) # pylint: disable=protected-access

        self.assertEqual(establish_session_counter.times_called, 1)

    def test_get_csrf_token(self) -> None:
        with self.request_swap:
            csrf_token = self.contributor_dashboard_debug._get_csrf_token() # pylint: disable=protected-access

        admin_id = self.get_user_id_from_email(self.SUPER_ADMIN_EMAIL) # type: ignore
        self.assertTrue(
            base.CsrfTokenManager.is_csrf_token_valid(admin_id, csrf_token)) # type: ignore

    def test_assign_admin_roles(self) -> None:
        roles = [
            feconf.ROLE_ID_CURRICULUM_ADMIN, feconf.ROLE_ID_TRANSLATION_ADMIN,
            feconf.ROLE_ID_QUESTION_ADMIN]

        with self.request_swap:
            self.contributor_dashboard_debug._assign_admin_roles( # pylint: disable=protected-access
                roles, self.tested_username)

        self._assert_user_roles(self.tested_username, roles)

    def _assert_user_roles(self, username: str, roles: List[str]) -> None:
        """Asserts that the user has the given roles."""
        self.assertEqual(
            user_services.get_user_settings_from_username(username).roles, # type: ignore
            [feconf.ROLE_ID_FULL_USER] + roles)

    def test_add_submit_question_rights(self) -> None:
        with self.request_swap:
            self.contributor_dashboard_debug._add_submit_question_rights( # pylint: disable=protected-access
                self.tested_username)

        self._assert_can_submit_question_suggestions(self.tested_username)

    def _assert_can_submit_question_suggestions(self, username: str) -> None:
        """Asserts that the user can submit question suggestions."""
        user_id = user_services.get_user_id_from_username(username)
        self.assertTrue(user_services.can_submit_question_suggestions(user_id)) # type: ignore

    def test_generate_sample_new_structures_data(self) -> None:
        with self.request_swap:
            (
                self.contributor_dashboard_debug. # pylint: disable=protected-access
                _generate_sample_new_structures_data())

        self._assert_generate_sample_new_structures_data()

    def _assert_generate_sample_new_structures_data(self) -> None:
        """Asserts that the sample new structures data is generated."""
        topic_summaries = topic_fetchers.get_all_topic_summaries()
        self.assertEqual(len(topic_summaries), 2)

        story_id = (
            topic_fetchers.get_topic_by_name( # type: ignore
                'Dummy Topic 1').canonical_story_references[0].story_id)
        self.assertIsNotNone(
            story_fetchers.get_story_by_id(story_id, strict=False))

        skill_summaries = skill_services.get_all_skill_summaries() # type: ignore
        self.assertEqual(len(skill_summaries), 3)

        questions, _ = (
            question_fetchers.get_questions_and_skill_descriptions_by_skill_ids(
                10, [
                    skill_summaries[0].id, skill_summaries[1].id,
                    skill_summaries[2].id], 0)
        )
        self.assertEqual(len(questions), 3)

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', '', None))
        self.assertEqual(len(translation_opportunities), 3)

    def test_add_topics_to_classroom(self) -> None:
        admin_id = self.get_user_id_from_email(self.SUPER_ADMIN_EMAIL) # type: ignore
        classroom_name = 'math'
        classroom_url_fragment = 'math'
        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()
        topic_1 = topic_domain.Topic.create_default_topic(
            topic_id_1, 'Dummy Topic 1', 'dummy-topic-one', 'description',
            'fragm')
        topic_2 = topic_domain.Topic.create_default_topic(
            topic_id_2, 'Empty Topic', 'empty-topic', 'description',
            'fragm')
        topic_services.save_new_topic(admin_id, topic_1) # type: ignore
        topic_services.save_new_topic(admin_id, topic_2) # type: ignore

        with self.request_swap:
            self.contributor_dashboard_debug._add_topics_to_classroom( # pylint: disable=protected-access
                classroom_name, classroom_url_fragment)

        self._assert_topics_in_classroom('math')

    def _assert_topics_in_classroom(self, classroom_name: str) -> None:
        """Asserts that test topics are in the classroom."""
        classroom_dict = self.get_json(
            '%s/%s' % (feconf.CLASSROOM_DATA_HANDLER, classroom_name))
        topic_summaries = topic_fetchers.get_all_topic_summaries()
        for topic_summary in topic_summaries:
            topic_summary_dict = topic_summary.to_dict()
            topic_summary_dict['is_published'] = False # type: ignore
            self.assertIn(
                topic_summary_dict, classroom_dict['topic_summary_dicts'])
