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
from core.tests import test_utils
from core.platform.auth.firebase_auth_services_test import FirebaseAdminSdkStub
from core.platform import models
from core.domain import user_services
from core.domain import opportunity_services
from core.domain import question_fetchers
from core.domain import skill_services
from core.domain import story_fetchers
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import topic_fetchers
from core.domain import user_services

from scripts.contributor_dashboard_debug import (
    ContributorDashboardDebugRequests,
    SUPER_ADMIN_USERNAME, SUPER_ADMIN_ROLES,
    CONTRIBUTOR_USERNAME, CLASSROOM_NAME)

import firebase_admin
from firebase_admin import auth as firebase_auth

import requests
from typing import Any, Dict, List

auth_services = models.Registry.import_auth_services()


class ContributorDashboardDebugRequestsTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super(ContributorDashboardDebugRequestsTests, self).setUp()
        self.firebase_sdk_stub = FirebaseAdminSdkStub()
        self.firebase_sdk_stub.install(self)
        self.contributor_dashboard_debug = (ContributorDashboardDebugRequests(
                base_url=''))
        self.request_swap = self.swap(
            self.contributor_dashboard_debug.session,
            'request',
            self.mock_request)

    def tearDown(self) -> None:
        self.firebase_sdk_stub.uninstall()
        super(ContributorDashboardDebugRequestsTests, self).tearDown()

    def mock_request(
        self,
        method: str,
        url: str,
        params: Dict[str, Any] | None = None,
        headers: Dict[str, Any] | None = None
        ) -> requests.Response:
        """Returns a mock response for the given request."""
        if method == 'GET':
            return self.testapp.get(url, params=params, headers=headers)
        if method == 'POST':
            return self.testapp.post(url, params=params, headers=headers)
        if method == 'PUT':
            return self.testapp.put(url, params=params, headers=headers)
    
    def mock_firebase_auth_create_user(self, **kwargs):
        """Mock for firebase_auth.create_user()."""
        email = kwargs['email']
        auth_id = self.get_auth_id_from_email(email)
        self.firebase_sdk_stub.create_user(auth_id, email)
    
    def mock_login_as_admin(self, email: str) -> None:
        """Sets the environment variables to simulate a login of admin."""
        self.login(email, is_super_admin=True)

    def test_populate_data_for_contributor_dashboard_debug(self) -> None:
        init_app_swap = self.swap_with_call_counter(
            firebase_admin, 'initialize_app')
        sign_up_swap = self.swap(
            self.contributor_dashboard_debug, 'sign_up_new_user', self.signup)
        begin_session_swap = self.swap(
            self.contributor_dashboard_debug, 'begin_session',
            self.mock_login_as_admin)

        with self.request_swap, sign_up_swap, begin_session_swap, (
            init_app_swap) as init_app_counter:
            (self.contributor_dashboard_debug.
                populate_data_for_contributor_dashboard_debug())

        self.assertEqual(init_app_counter.times_called, 1)
        self._assert_user_roles(SUPER_ADMIN_USERNAME, SUPER_ADMIN_ROLES)
        self._assert_can_submit_question_suggestions(CONTRIBUTOR_USERNAME)
        self._assert_generate_dummy_new_structures_data()
        self._assert_topics_in_classroom(CLASSROOM_NAME)

    def test_sign_up_new_user(self) -> None:
        email = 'user1@example.com'
        username = 'user1'
        create_user_swap = self.swap(
            firebase_auth, 'create_user', self.mock_firebase_auth_create_user)
        begin_session_swap = self.swap(
            self.contributor_dashboard_debug, 'begin_session', self.login)
        load_template_swap = self.swap(
            base, 'load_template', test_utils.mock_load_template)

        with self.request_swap, create_user_swap, begin_session_swap, (
                load_template_swap):
            self.contributor_dashboard_debug.sign_up_new_user(email, username)

        self.assertIsNotNone(self.firebase_sdk_stub.get_user_by_email(email))
        self.assertEqual(
            user_services.get_user_settings_from_email(email).username,
            username)

    def test_begin_session(self) -> None:
        email = 'user1@example.com'
        auth_id = self.get_auth_id_from_email(email)
        token_id = self.firebase_sdk_stub.create_user(auth_id, email=email)
        sign_in_swap = self.swap_to_always_return(
                self.contributor_dashboard_debug,
                '_sign_in_with_email_and_password',
                token_id)
        establish_session_swap = self.swap_with_call_counter(
                    auth_services, 'establish_auth_session')

        with sign_in_swap, self.request_swap, establish_session_swap as (
            establish_session_counter):
            self.contributor_dashboard_debug.begin_session(email)

        self.assertEqual(establish_session_counter.times_called, 1)

    def test_get_csrf_token(self) -> str:
        with self.request_swap:
            csrf_token = self.contributor_dashboard_debug.get_csrf_token()
        base.CsrfTokenManager.is_csrf_token_valid(None, csrf_token)

    def test_assign_admin_roles(self) -> None:
        email = 'user1@example.com'
        username = 'user1'
        roles = [feconf.ROLE_ID_CURRICULUM_ADMIN,
            feconf.ROLE_ID_TRANSLATION_ADMIN, feconf.ROLE_ID_QUESTION_ADMIN]
        self.signup(email, username)

        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        self.contributor_dashboard_debug.csrf_token = self.get_new_csrf_token()

        with self.request_swap:
            self.contributor_dashboard_debug.assign_admin_roles(roles, username)

        self.logout()

        self._assert_user_roles(username, roles)
    
    def _assert_user_roles(self, username: str, roles: List[str]) -> None:
        self.assertEqual(
            user_services.get_user_settings_from_username(username).roles,
            [feconf.ROLE_ID_FULL_USER] + roles)

    def test_add_submit_question_rights(self) -> None:
        email = 'user1@example.com'
        username = 'user1'
        self.signup(email, username)

        self.add_user_role(
            self.SUPER_ADMIN_USERNAME, feconf.ROLE_ID_QUESTION_ADMIN)

        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        self.contributor_dashboard_debug.csrf_token = self.get_new_csrf_token()

        with self.request_swap:
            self.contributor_dashboard_debug.add_submit_question_rights(
                username)

        self.logout()

        self._assert_can_submit_question_suggestions(username)
    
    def _assert_can_submit_question_suggestions(self, username: str) -> None:
        user_id = user_services.get_user_id_from_username(username)
        self.assertTrue(user_services.can_submit_question_suggestions(user_id))

    def test_generate_dummy_new_structures_data(self) -> None:
        self.set_curriculum_admins([self.SUPER_ADMIN_USERNAME])
        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        self.contributor_dashboard_debug.csrf_token = self.get_new_csrf_token()

        with self.request_swap:
            (self.contributor_dashboard_debug.
                generate_dummy_new_structures_data())

        self.logout()

        self._assert_generate_dummy_new_structures_data()

    def _assert_generate_dummy_new_structures_data(self) -> None:
        topic_summaries = topic_fetchers.get_all_topic_summaries()
        self.assertEqual(len(topic_summaries), 2)
        for summary in topic_summaries:
            if summary.name == 'Dummy Topic 1':
                topic_id = summary.id
        story_id = (
            topic_fetchers.get_topic_by_id(
                topic_id).canonical_story_references[0].story_id)
        self.assertIsNotNone(
            story_fetchers.get_story_by_id(story_id, strict=False))
        skill_summaries = skill_services.get_all_skill_summaries()
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
        admin_id = self.get_user_id_from_email(self.SUPER_ADMIN_EMAIL)
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
        topic_services.save_new_topic(admin_id, topic_1)
        topic_services.save_new_topic(admin_id, topic_2)


        self.set_curriculum_admins([self.SUPER_ADMIN_USERNAME])
        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        self.contributor_dashboard_debug.csrf_token = self.get_new_csrf_token()

        with self.request_swap:
            self.contributor_dashboard_debug.add_topics_to_classroom(
                classroom_name, classroom_url_fragment)

        self.logout()

        self._assert_topics_in_classroom('math')

    def _assert_topics_in_classroom(self, classroom_name: str) -> None:
        classroom_dict = self.get_json(
            '%s/%s' % (feconf.CLASSROOM_DATA_HANDLER, classroom_name))
        topic_summaries = topic_fetchers.get_all_topic_summaries()
        for topic_summary in topic_summaries:
            topic_summary_dict = topic_summary.to_dict()
            topic_summary_dict['is_published'] = False
            self.assertIn(
                topic_summary_dict, classroom_dict['topic_summary_dicts'])