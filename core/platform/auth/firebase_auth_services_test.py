# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for the Firebase Authentication platform services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import contextlib

from core.platform import models
from core.platform.auth import firebase_auth_services
from core.tests import test_utils

import firebase_admin
import webapp2

(user_models,) = models.Registry.import_models([models.NAMES.user])


class FirebaseAuthServicesPublicApiTest(test_utils.TestBase):
    """Test cases for the public Firebase-specific APIs."""

    @contextlib.contextmanager
    def swap_app_setup_and_teardown(self):
        """Mocks the Firebase SDK to always produce a successful app."""
        initialize_app_swap = self.swap_to_always_return(
            firebase_admin, 'initialize_app', value=object())
        delete_app_swap = self.swap_to_always_return(
            firebase_admin, 'delete_app')
        with initialize_app_swap, delete_app_swap:
            yield

    @contextlib.contextmanager
    def swap_verify_to_always_accept_tokens(self, **claims):
        """Mocks the Firebase SDK to always return claims for tokens."""
        if not claims:
            claims = {'sub': '123'}
        initialize_app_swap = self.swap_app_setup_and_teardown()
        auth_context = firebase_auth_services.acquire_auth_context()
        verify_id_token_swap = self.swap_to_always_return(
            firebase_admin.auth, 'verify_id_token', value=claims)
        with initialize_app_swap, auth_context, verify_id_token_swap:
            yield

    @contextlib.contextmanager
    def swap_verify_to_always_reject_tokens(self, exception_obj=Exception):
        """Mocks the Firebase SDK to always raise when inspecting tokens."""
        initialize_app_swap = self.swap_app_setup_and_teardown()
        auth_context = firebase_auth_services.acquire_auth_context()
        verify_id_token_swap = self.swap_to_always_raise(
            firebase_admin.auth, 'verify_id_token', exception_obj=exception_obj)
        with initialize_app_swap, auth_context, verify_id_token_swap:
            yield

    def make_response(self, auth_header=None):
        """Returns a webapp2.Response object with an optional auth header."""
        response = webapp2.Response()
        if auth_header is not None:
            response.headers['Authorization'] = auth_header
        return response

    def test_user_id_association_model_is_for_firebase(self):
        self.assertIs(
            firebase_auth_services.UserIdBySubjectIdModel,
            user_models.UserIdByFirebaseSubjectIdModel)

    def test_error_in_initialize_propogates(self):
        app_that_will_not_initialize = self.swap_to_always_raise(
            firebase_admin, 'initialize_app', exception_obj=Exception('error'))
        with app_that_will_not_initialize:
            with self.assertRaisesRegexp(Exception, 'error'):
                with firebase_auth_services.acquire_auth_context():
                    self.fail(msg='Context unexpectedly entered')

    def test_successful_initialization_allows_code_to_run(self):
        context_enterred = False
        with self.swap_app_setup_and_teardown():
            with firebase_auth_services.acquire_auth_context():
                context_enterred = True
        self.assertTrue(context_enterred)

    def test_verify_accepted_token(self):
        with self.swap_verify_to_always_accept_tokens(sub='123'):
            self.assertEqual(
                firebase_auth_services.get_verified_subject_id(
                    self.make_response(auth_header='Bearer MOCK_JWT_VALUE')),
                '123')

    def test_verify_rejected_token(self):
        err = Exception('untrusted!')
        with self.swap_verify_to_always_reject_tokens(exception_obj=err):
            with self.assertRaisesRegexp(Exception, 'untrusted!'):
                firebase_auth_services.get_verified_subject_id(
                    self.make_response(auth_header='Bearer MOCK_JWT_VALUE'))

    def test_verify_token_without_auth_header(self):
        with self.swap_verify_to_always_accept_tokens():
            with self.assertRaisesRegexp(Exception, 'header is missing'):
                firebase_auth_services.get_verified_subject_id(
                    self.make_response(auth_header=None))

    def test_verify_token_with_empty_auth_header(self):
        with self.swap_verify_to_always_accept_tokens():
            with self.assertRaisesRegexp(Exception, 'prefix is missing'):
                firebase_auth_services.get_verified_subject_id(
                    self.make_response(auth_header=''))

    def test_verify_token_with_auth_header_missing_bearer_prefix(self):
        with self.swap_verify_to_always_accept_tokens():
            with self.assertRaisesRegexp(Exception, 'prefix is missing'):
                firebase_auth_services.get_verified_subject_id(
                    self.make_response(auth_header='JWT_TOKEN'))

    def test_verify_token_with_auth_header_missing_space_after_bearer(self):
        with self.swap_verify_to_always_accept_tokens():
            with self.assertRaisesRegexp(Exception, 'prefix is missing'):
                firebase_auth_services.get_verified_subject_id(
                    self.make_response(auth_header='BearerJWT_TOKEN'))
