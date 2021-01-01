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

import logging

from core.domain import auth_domain
from core.domain import wipeout_service
from core.platform import models
from core.platform.auth import firebase_auth_services as auth_services
from core.tests import test_utils
import python_utils

import contextlib2
import firebase_admin
from firebase_admin import exceptions as firebase_exceptions
import webapp2

auth_models, = models.Registry.import_models([models.NAMES.auth])


class FirebaseAdminSdkStub(python_utils.OBJECT):
    """Helper class for swapping the Firebase Admin SDK with a stateful mock.

    NOT INTENDED TO BE USED DIRECTLY. Just install and interact with the
    Firebase Admin SDK as if it were connected to a real server.

    Example:
        class Test(test_utils.TestBase):

            def setUp(self):
                super(Test, self).setUp()
                self._uninstall_stub = FirebaseAdminSdkStub.install(self)
                firebase_admin.auth.create_user(uid='foo')

            def tearDown(self):
                self._uninstall_stub()
                super(Test, self).tearDown()

            def test_sdk(self):
                user_record = firebase_admin.get_user('uid')
                self.assertEqual(user_record.uid, 'uid')
    """

    @classmethod
    def install(cls, test):
        """Installs a new instance of the mock on the given test class.

        The mock will emulate an initially-empty Firebase authentication server.

        Args:
            test: test_utils.TestBase. The test to install the mock on.

        Returns:
            callable. A function that will uninstall the mock when called.
        """
        mock = cls()
        with contextlib2.ExitStack() as stack:
            stack.enter_context(test.swap_to_always_return(
                firebase_admin, 'initialize_app'))
            stack.enter_context(test.swap_to_always_return(
                firebase_admin, 'delete_app'))
            stack.enter_context(test.swap_to_always_return(
                firebase_admin.auth, 'verify_id_token'))
            stack.enter_context(test.swap(
                firebase_admin.auth, 'create_user', mock._create_user)) # pylint: disable=protected-access
            stack.enter_context(test.swap(
                firebase_admin.auth, 'get_user', mock._get_user)) # pylint: disable=protected-access
            stack.enter_context(test.swap(
                firebase_admin.auth, 'delete_user', mock._delete_user)) # pylint: disable=protected-access

            for function_name in cls._YAGNI_FUNCTION_NAMES:
                stack.enter_context(test.swap_to_always_raise(
                    firebase_admin.auth, function_name, NotImplementedError))

            # Standard usage of ExitStack: enter a bunch of context managers
            # from the safety of an ExitStack's context. Once they've all been
            # opened, pop_all() of them off of the original context so they can
            # *stay* open.
            # https://docs.python.org/3/library/contextlib.html#cleaning-up-in-an-enter-implementation
            return stack.pop_all().close

    # YAGNI: https://en.wikipedia.org/wiki/You_aren't_gonna_need_it.
    _YAGNI_FUNCTION_NAMES = [
        'create_custom_token',
        'create_session_cookie',
        'generate_email_verification_link',
        'generate_password_reset_link',
        'generate_sign_in_with_email_link',
        'get_user_by_email',
        'get_user_by_phone_number',
        'import_users',
        'list_users',
        'revoke_refresh_tokens',
        'set_custom_user_claims',
        'update_user',
        'verify_session_cookie',
    ]

    def __init__(self):
        self._users = {}

    def _create_user(self, uid=None, **kwargs):
        """Adds new user to storage."""
        if uid in self._users:
            raise firebase_admin.auth.UidAlreadyExistsError(
                '%s exists' % uid, None, None)
        self._users[uid] = firebase_admin.auth.UserRecord(
            # FRAGILE: UserRecord doesn't have a public constructor, so this may
            # break in future versions of the SDK. OK with taking that risk
            # because this is only for mocking purposes.
            firebase_admin.auth.ImportUserRecord(uid, **kwargs).to_dict())

    def _get_user(self, uid):
        """Returns user with given ID if one exists."""
        if uid not in self._users:
            raise firebase_admin.auth.UserNotFoundError('%s not found' % uid)
        return self._users[uid]

    def _delete_user(self, uid):
        """Removes user from storage."""
        if uid not in self._users:
            raise firebase_admin.auth.UserNotFoundError('%s not found' % uid)
        del self._users[uid]


class AuthenticateRequestTests(test_utils.TestBase):
    """Test cases for authenticating requests with Firebase Admin SDK."""

    def setUp(self):
        super(AuthenticateRequestTests, self).setUp()
        self._uninstall_stub = FirebaseAdminSdkStub.install(self)

    def tearDown(self):
        self._uninstall_stub()
        super(AuthenticateRequestTests, self).tearDown()

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

    def test_returns_auth_claims_from_valid_auth_token(self):
        verify_id_token_swap = self.swap_to_always_return(
            firebase_admin.auth, 'verify_id_token',
            value={'sub': 'auth_id', 'email': 'foo@test.com'})
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with verify_id_token_swap:
            auth_claims = auth_services.authenticate_request(request)

        self.assertEqual(
            auth_claims, auth_domain.AuthClaims('auth_id', 'foo@test.com'))

    def test_returns_none_when_auth_header_is_missing(self):
        request = self.make_request()

        auth_claims = auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)

    def test_returns_none_when_auth_header_uses_wrong_scheme_type(self):
        request = self.make_request(auth_header='Basic password=123')

        auth_claims = auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)

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


class DeleteAssociationsTests(test_utils.GenericTestBase):

    USER_ID = 'uid'
    AUTH_ID = 'sub'

    def setUp(self):
        super(DeleteAssociationsTests, self).setUp()
        self._uninstall_stub = FirebaseAdminSdkStub.install(self)

        firebase_admin.auth.create_user(uid=self.AUTH_ID)
        auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair(self.AUTH_ID, self.USER_ID))

    def tearDown(self):
        self._uninstall_stub()
        super(DeleteAssociationsTests, self).tearDown()

    def assert_only_item_is_exception(self, logs, msg):
        """Asserts that only the given message appeared in the logs."""
        self.assertEqual(len(logs), 1)
        self.assertIn(msg, logs[0])

    def test_delete_user_without_an_association_does_not_raise(self):
        # Should not raise.
        auth_services.delete_associated_auth_id('uid_DOES_NOT_EXIST')

    def test_is_associated_auth_id_deleted_with_unknown_user_returns_false(
            self):
        self.assertTrue(
            auth_services.is_associated_auth_id_deleted('uid_DOES_NOT_EXIST'))

    def test_delete_user_without_firebase_initialization_returns_false(self):
        init_swap = self.swap_to_always_raise(
            firebase_admin, 'initialize_app',
            error=firebase_exceptions.UnknownError('could not init'))

        with init_swap, self.capture_logging(min_level=logging.ERROR) as logs:
            auth_services.delete_associated_auth_id(self.USER_ID)

        self.assertFalse(
            auth_services.is_associated_auth_id_deleted(self.USER_ID))
        self.assert_only_item_is_exception(logs, 'could not init')

    def test_is_associated_auth_id_deleted_without_init_returns_false(self):
        init_swap = self.swap_to_always_raise(
            firebase_admin, 'initialize_app',
            error=firebase_exceptions.UnknownError('could not init'))

        with init_swap, self.capture_logging(min_level=logging.ERROR) as logs:
            self.assertFalse(
                auth_services.is_associated_auth_id_deleted(self.USER_ID))

        self.assert_only_item_is_exception(logs, 'could not init')

    def test_delete_user_when_firebase_raises_an_error(self):
        delete_swap = self.swap_to_always_raise(
            firebase_admin.auth, 'delete_user',
            error=firebase_exceptions.InternalError('could not connect'))

        with delete_swap, self.capture_logging(min_level=logging.ERROR) as logs:
            auth_services.delete_associated_auth_id(self.USER_ID)

        self.assertFalse(
            auth_services.is_associated_auth_id_deleted(self.USER_ID))
        self.assert_only_item_is_exception(logs, 'could not connect')

    def test_delete_user_when_firebase_succeeds(self):
        with self.capture_logging(min_level=logging.ERROR) as logs:
            auth_services.delete_associated_auth_id(self.USER_ID)

        self.assertTrue(
            auth_services.is_associated_auth_id_deleted(self.USER_ID))
        self.assertEqual(logs, [])


class FirebaseAccountWipeoutTests(test_utils.GenericTestBase):
    """Tests for wipeout_service that is specific to Firebase authentication."""

    # We want wipeout_services to use the real Firebase authentication services.
    ENABLE_AUTH_SERVICES_STUB = False

    EMAIL = 'some@email.com'
    USERNAME = 'username'
    AUTH_ID = 'authid'

    UNKNOWN_ERROR = firebase_exceptions.UnknownError('error')

    def setUp(self):
        super(FirebaseAccountWipeoutTests, self).setUp()
        self._uninstall_stub = FirebaseAdminSdkStub.install(self)

        firebase_admin.auth.create_user(uid=self.AUTH_ID)
        self.signup(self.EMAIL, self.USERNAME)
        self.user_id = self.get_user_id_from_email(self.EMAIL)
        auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair(self.AUTH_ID, self.user_id))
        wipeout_service.pre_delete_user(self.user_id)

    def tearDown(self):
        self._uninstall_stub()
        super(FirebaseAccountWipeoutTests, self).tearDown()

    def wipeout(self):
        """Runs wipeout on the user created by this test."""
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_id))

    def assert_wipeout_is_verified(self):
        """Asserts that the wipeout has been acknowledged as complete."""
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_id))

    def assert_wipeout_is_not_verified(self):
        """Asserts that the wipeout has been acknowledged as incomplete."""
        self.assertFalse(wipeout_service.verify_user_deleted(self.user_id))

    def assert_firebase_account_is_deleted(self):
        """Asserts that the Firebase account has been deleted."""
        self.assertRaisesRegexp(
            firebase_admin.auth.UserNotFoundError, 'not found',
            lambda: firebase_admin.auth.get_user(self.AUTH_ID))

    def assert_firebase_account_is_not_deleted(self):
        """Asserts that the Firebase account still exists."""
        user = firebase_admin.auth.get_user(self.AUTH_ID)
        self.assertIsNotNone(user)
        self.assertEqual(user.uid, self.AUTH_ID)

    def swap_initialize_sdk_to_always_fail(self):
        """Swaps the initialize_app function so that it always fails."""
        return self.swap_to_always_raise(
            firebase_admin, 'initialize_app', error=self.UNKNOWN_ERROR)

    def swap_get_user_to_always_fail(self):
        """Swaps the get_user function so that it always fails."""
        return self.swap_to_always_raise(
            firebase_admin.auth, 'get_user', error=self.UNKNOWN_ERROR)

    def swap_delete_user_to_always_fail(self):
        """Swaps the delete_user function so that it always fails."""
        return self.swap_to_always_raise(
            firebase_admin.auth, 'delete_user', error=self.UNKNOWN_ERROR)

    def test_wipeout_happy_path(self):
        self.wipeout()

        self.assert_firebase_account_is_deleted()
        self.assert_wipeout_is_verified()

    def test_wipeout_retry_after_failed_attempt(self):
        with self.swap_initialize_sdk_to_always_fail():
            self.wipeout()

        self.assert_firebase_account_is_not_deleted()
        self.assert_wipeout_is_not_verified()

        self.wipeout()

        self.assert_firebase_account_is_deleted()
        self.assert_wipeout_is_verified()

    def test_wipeout_retry_after_unverified_successful_attempt(self):
        self.wipeout()

        self.assert_firebase_account_is_deleted()

        with self.swap_initialize_sdk_to_always_fail():
            self.assert_wipeout_is_not_verified()

        self.wipeout()

        self.assert_wipeout_is_verified()

    def test_wipeout_when_delete_user_fails(self):
        with self.swap_delete_user_to_always_fail():
            self.wipeout()

        self.assert_firebase_account_is_not_deleted()

        self.assert_wipeout_is_not_verified()

    def test_wipeout_when_get_user_fails(self):
        self.wipeout()

        self.assert_firebase_account_is_deleted()

        with self.swap_get_user_to_always_fail():
            self.assert_wipeout_is_not_verified()

        self.assert_wipeout_is_verified()

    def test_wipeout_when_init_fails_during_delete(self):
        with self.swap_initialize_sdk_to_always_fail():
            self.wipeout()

        self.assert_firebase_account_is_not_deleted()

        self.assert_wipeout_is_not_verified()

    def test_wipeout_when_init_fails_during_verify(self):
        self.wipeout()

        self.assert_firebase_account_is_deleted()

        with self.swap_initialize_sdk_to_always_fail():
            self.assert_wipeout_is_not_verified()

        self.assert_wipeout_is_verified()
