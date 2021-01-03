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

import functools

from core.domain import auth_domain
from core.platform import models
from core.platform.auth import firebase_auth_services as auth_services
from core.tests import test_utils
import python_utils

import contextlib2
import firebase_admin
from firebase_admin import exceptions as firebase_exceptions
import webapp2

auth_models, = models.Registry.import_models([models.NAMES.auth])


def mock_successful_firebase_initialization(test_method):
    """Decorater for tests that mocks a successful Firebase initialization."""
    @functools.wraps(test_method)
    def decorated_test_method(test):
        """The decorated test method."""
        with test.swap_to_always_return(firebase_admin, 'initialize_app'):
            test_method(test)
    return decorated_test_method


class AuthenticateRequestTests(test_utils.TestBase):
    """Test cases for authenticating requests with Firebase Admin SDK."""

    def make_request(self, auth_header=None):
        """Returns a webapp2.Request with the given authorization claims.

        Args:
            auth_header: str or None. Contents of the Authorization header. If
                None, then the header will be omitted from the request.

        Returns:
            webapp2.Request. A new request object.
        """
        request = webapp2.Request.blank('/')
        if auth_header is not None:
            request.headers['Authorization'] = auth_header
        return request

    def test_returns_none_when_firebase_init_fails(self):
        initialize_app_swap = self.swap_to_always_raise(
            firebase_admin, 'initialize_app',
            error=firebase_exceptions.UnknownError('could not init'))
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with initialize_app_swap, self.capture_logging() as errors:
            auth_claims = auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)
        self.assertEqual(len(errors), 1)
        self.assertIn('could not init', errors[0])

    def test_cleans_up_firebase_app(self):
        mock_app = python_utils.OBJECT()
        initialize_app_swap = self.swap_to_always_return(
            firebase_admin, 'initialize_app', value=mock_app)
        verify_id_token_swap = self.swap_to_always_return(
            firebase_admin.auth, 'verify_id_token', value={})
        delete_app_swap = self.swap(
            firebase_admin, 'delete_app',
            lambda app: self.assertIs(app, mock_app))
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with contextlib2.ExitStack() as stack:
            stack.enter_context(initialize_app_swap)
            stack.enter_context(verify_id_token_swap)
            stack.enter_context(delete_app_swap)
            errors = stack.enter_context(self.capture_logging())

            auth_claims = auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)
        self.assertEqual(errors, [])

    @mock_successful_firebase_initialization
    def test_returns_auth_claims_from_valid_auth_token(self):
        verify_id_token_swap = self.swap_to_always_return(
            firebase_admin.auth, 'verify_id_token',
            value={'sub': 'auth_id', 'email': 'foo@test.com'})
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with verify_id_token_swap:
            auth_claims = auth_services.authenticate_request(request)

        self.assertEqual(
            auth_claims, auth_domain.AuthClaims('auth_id', 'foo@test.com'))

    @mock_successful_firebase_initialization
    def test_returns_none_when_auth_header_is_missing(self):
        request = self.make_request()

        auth_claims = auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)

    @mock_successful_firebase_initialization
    def test_returns_none_when_auth_header_uses_wrong_scheme_type(self):
        request = self.make_request(auth_header='Basic password=123')

        auth_claims = auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)

    @mock_successful_firebase_initialization
    def test_returns_none_when_auth_token_is_invalid(self):
        verify_id_token_swap = self.swap_to_always_raise(
            firebase_admin.auth, 'verify_id_token',
            error=firebase_exceptions.InvalidArgumentError('invalid token'))
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with verify_id_token_swap, self.capture_logging() as errors:
            auth_claims = auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)
        self.assertEqual(len(errors), 1)
        self.assertIn('invalid token', errors[0])

    @mock_successful_firebase_initialization
    def test_returns_claims_as_none_when_missing_essential_claims(self):
        verify_id_token_swap = self.swap_to_always_return(
            firebase_admin.auth, 'verify_id_token', value={})
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with verify_id_token_swap:
            auth_claims = auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)


class AuthIdUserIdAssociationOperationsTests(test_utils.GenericTestBase):

    def get_associated_user_id(self, auth_id):
        """Fetches the given associated user ID from storage manually."""
        model = (
            auth_models.UserIdByFirebaseAuthIdModel.get(auth_id, strict=False))
        return None if model is None else model.user_id

    def put_association(self, pair):
        """Commits the given association to storage manually."""
        auth_id, user_id = pair
        auth_models.UserIdByFirebaseAuthIdModel(
            id=auth_id, user_id=user_id).put()

    def test_get_association_that_exists(self):
        self.put_association(auth_domain.AuthIdUserIdPair('sub', 'uid'))

        self.assertEqual(
            auth_services.get_user_id_from_auth_id('sub'), 'uid')

    def test_get_association_that_does_not_exist(self):
        self.assertIsNone(
            auth_services.get_user_id_from_auth_id('does_not_exist'))

    def test_get_multi_associations_that_exist(self):
        self.put_association(
            auth_domain.AuthIdUserIdPair('sub1', 'uid1'))
        self.put_association(
            auth_domain.AuthIdUserIdPair('sub2', 'uid2'))
        self.put_association(
            auth_domain.AuthIdUserIdPair('sub3', 'uid3'))

        self.assertEqual(
            auth_services.get_multi_user_ids_from_auth_ids(
                ['sub1', 'sub2', 'sub3']),
            ['uid1', 'uid2', 'uid3'])

    def test_get_multi_associations_when_one_does_not_exist(self):
        self.put_association(
            auth_domain.AuthIdUserIdPair('sub1', 'uid1'))
        # Mapping from sub2 -> uid2 missing.
        self.put_association(
            auth_domain.AuthIdUserIdPair('sub3', 'uid3'))

        self.assertEqual(
            auth_services.get_multi_user_ids_from_auth_ids(
                ['sub1', 'sub2', 'sub3']),
            ['uid1', None, 'uid3'])

    def test_associate_new_auth_id_to_user_id(self):
        auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('sub', 'uid'))

        self.assertEqual(self.get_associated_user_id('sub'), 'uid')

    def test_associate_existing_auth_id_to_user_id_raises(self):
        auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('sub', 'uid'))

        with self.assertRaisesRegexp(Exception, 'already mapped to user_id'):
            auth_services.associate_auth_id_to_user_id(
                auth_domain.AuthIdUserIdPair('sub', 'uid'))

    def test_associate_multi_new_auth_ids_to_user_ids(self):
        auth_services.associate_multi_auth_ids_to_user_ids([
            auth_domain.AuthIdUserIdPair('sub1', 'uid1'),
            auth_domain.AuthIdUserIdPair('sub2', 'uid2'),
            auth_domain.AuthIdUserIdPair('sub3', 'uid3'),
        ])

        self.assertEqual(
            [self.get_associated_user_id('sub1'),
             self.get_associated_user_id('sub2'),
             self.get_associated_user_id('sub3')],
            ['uid1', 'uid2', 'uid3'])

    def test_associate_multi_an_existing_auth_id_to_user_id_mapping_raises(
            self):
        auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('sub1', 'uid1'))

        with self.assertRaisesRegexp(Exception, 'associations already exist'):
            auth_services.associate_multi_auth_ids_to_user_ids([
                auth_domain.AuthIdUserIdPair('sub1', 'uid1'),
                auth_domain.AuthIdUserIdPair('sub2', 'uid2'),
                auth_domain.AuthIdUserIdPair('sub3', 'uid3'),
            ])
