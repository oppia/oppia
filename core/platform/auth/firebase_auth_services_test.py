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

(auth_models,) = models.Registry.import_models([models.NAMES.auth])


class AuthenticateSenderTests(test_utils.TestBase):
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
    def swap_verify_to_always_reject_tokens(self, error=Exception):
        """Mocks the Firebase SDK to always raise when inspecting tokens."""
        initialize_app_swap = self.swap_app_setup_and_teardown()
        auth_context = firebase_auth_services.acquire_auth_context()
        verify_id_token_swap = self.swap_to_always_raise(
            firebase_admin.auth, 'verify_id_token', error=error)
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
            auth_models.UserIdByFirebaseSubjectIdModel)

    def test_error_in_initialize_propogates(self):
        app_that_will_not_initialize = self.swap_to_always_raise(
            firebase_admin, 'initialize_app', error=Exception('error'))
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
        error = Exception('untrusted!')
        with self.swap_verify_to_always_reject_tokens(error=error):
            with self.assertRaisesRegexp(Exception, 'untrusted!'):
                firebase_auth_services.get_verified_subject_id(
                    self.make_response(auth_header='Bearer MOCK_JWT_VALUE'))

    def test_verify_token_without_auth_header(self):
        with self.swap_verify_to_always_accept_tokens():
            self.assertIsNone(
                firebase_auth_services.get_verified_subject_id(
                    self.make_response(auth_header=None)))

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


class SubjectIdUserIdAssociationOperationsTests(test_utils.GenericTestBase):

    def get_associated_user_id(self, subject_id):
        """Fetches the given associated user ID from storage manually."""
        model = auth_services.UserIdBySubjectIdModel.get_by_id(subject_id)
        return None if model is None else model.user_id

    def put_association(self, pair):
        """Commits the given association to storage manually."""
        subject_id, user_id = pair
        auth_services.UserIdBySubjectIdModel(
            id=subject_id, user_id=user_id).put()

    def test_get_association_that_exists(self):
        self.put_association(user_domain.AuthSubjectIdUserIdPair('sub', 'uid'))

        self.assertEqual(
            user_services.get_user_id_from_subject_id('sub'), 'uid')

    def test_get_association_that_does_not_exist(self):
        self.assertIsNone(
            user_services.get_user_id_from_subject_id('does_not_exist'))

    def test_get_multi_associations_that_exist(self):
        self.put_association(
            user_domain.AuthSubjectIdUserIdPair('sub1', 'uid1'))
        self.put_association(
            user_domain.AuthSubjectIdUserIdPair('sub2', 'uid2'))
        self.put_association(
            user_domain.AuthSubjectIdUserIdPair('sub3', 'uid3'))

        self.assertEqual(
            user_services.get_multi_user_ids_from_subject_ids(
                ['sub1', 'sub2', 'sub3']),
            ['uid1', 'uid2', 'uid3'])

    def test_get_multi_associations_that_do_not_exist(self):
        self.put_association(
            user_domain.AuthSubjectIdUserIdPair('sub1', 'uid1'))
        # Mapping from sub2 -> uid2 missing.
        self.put_association(
            user_domain.AuthSubjectIdUserIdPair('sub3', 'uid3'))

        self.assertEqual(
            user_services.get_multi_user_ids_from_subject_ids(
                ['sub1', 'sub2', 'sub3']),
            ['uid1', None, 'uid3'])

    def test_associate_new_subject_id_to_user_id(self):
        user_services.associate_subject_id_to_user_id(
            user_domain.AuthSubjectIdUserIdPair('sub', 'uid'))

        self.assertEqual(self.get_associated_user_id('sub'), 'uid')

    def test_associate_existing_subject_id_to_user_id_raises(self):
        user_services.associate_subject_id_to_user_id(
            user_domain.AuthSubjectIdUserIdPair('sub', 'uid'))

        with self.assertRaisesRegexp(Exception, 'already mapped to user_id'):
            user_services.associate_subject_id_to_user_id(
                user_domain.AuthSubjectIdUserIdPair('sub', 'uid'))

    def test_associate_multi_new_subject_ids_to_user_ids(self):
        user_services.associate_multi_subject_ids_to_user_ids([
            user_domain.AuthSubjectIdUserIdPair('sub1', 'uid1'),
            user_domain.AuthSubjectIdUserIdPair('sub2', 'uid2'),
            user_domain.AuthSubjectIdUserIdPair('sub3', 'uid3'),
        ])

        self.assertEqual(
            [self.get_associated_user_id('sub1'),
             self.get_associated_user_id('sub2'),
             self.get_associated_user_id('sub3')],
            ['uid1', 'uid2', 'uid3'])

    def test_associate_multi_an_existing_subject_id_to_user_id_mapping_raises(
            self):
        user_services.associate_subject_id_to_user_id(
            user_domain.AuthSubjectIdUserIdPair('sub1', 'uid1'))

        with self.assertRaisesRegexp(Exception, 'associations already exist'):
            user_services.associate_multi_subject_ids_to_user_ids([
                user_domain.AuthSubjectIdUserIdPair('sub1', 'uid1'),
                user_domain.AuthSubjectIdUserIdPair('sub2', 'uid2'),
                user_domain.AuthSubjectIdUserIdPair('sub3', 'uid3'),
            ])
