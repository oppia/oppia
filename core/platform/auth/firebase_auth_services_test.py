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
from core.platform.auth import firebase_auth_services
from core.tests import test_utils
import python_utils

import contextlib2
import firebase_admin
from firebase_admin import exceptions as firebase_exceptions
import webapp2

auth_models, = models.Registry.import_models([models.NAMES.auth])


class FirebaseAdminSdkStub(python_utils.OBJECT):
    """Helper class for swapping the Firebase Admin SDK with a stateful stub.

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
        """Installs a new instance of the stub on the given test class.

        The stub will emulate an initially-empty Firebase authentication server.

        Args:
            test: test_utils.TestBase. The test to install the stub on.

        Returns:
            callable. A function that will uninstall the stub when called.
        """
        stub = cls()
        with contextlib2.ExitStack() as stack:
            stack.enter_context(test.swap_to_always_return(
                firebase_admin, 'initialize_app'))
            stack.enter_context(test.swap_to_always_return(
                firebase_admin, 'delete_app'))
            stack.enter_context(test.swap_to_always_return(
                firebase_admin.auth, 'verify_id_token'))
            stack.enter_context(test.swap(
                firebase_admin.auth, 'create_user', stub._create_user)) # pylint: disable=protected-access
            stack.enter_context(test.swap(
                firebase_admin.auth, 'get_user', stub._get_user)) # pylint: disable=protected-access
            stack.enter_context(test.swap(
                firebase_admin.auth, 'delete_user', stub._delete_user)) # pylint: disable=protected-access

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
        """Adds user to storage if new, otherwise raises an error."""
        if uid in self._users:
            raise firebase_admin.auth.UidAlreadyExistsError(
                '%s exists' % uid, None, None)
        # FRAGILE: UserRecord doesn't have a public constructor, so this may
        # break in future versions of the SDK. OK with taking that risk because
        # this is only for stubbing purposes.
        self._users[uid] = firebase_admin.auth.UserRecord(
            firebase_admin.auth.ImportUserRecord(uid, **kwargs).to_dict())

    def _get_user(self, uid):
        """Returns user with given ID if exists, otherwise raises an error."""
        if uid not in self._users:
            raise firebase_admin.auth.UserNotFoundError('%s not found' % uid)
        return self._users[uid]

    def _delete_user(self, uid):
        """Removes user from storage if exists, otherwise raises an error."""
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
            auth_claims = firebase_auth_services.authenticate_request(request)

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

            auth_claims = firebase_auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)
        self.assertEqual(errors, [])

    def test_returns_auth_claims_from_valid_auth_token(self):
        verify_id_token_swap = self.swap_to_always_return(
            firebase_admin.auth, 'verify_id_token',
            value={'sub': 'auth_id', 'email': 'foo@test.com'})
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with verify_id_token_swap:
            auth_claims = firebase_auth_services.authenticate_request(request)

        self.assertEqual(
            auth_claims, auth_domain.AuthClaims('auth_id', 'foo@test.com'))

    def test_returns_none_when_auth_header_is_missing(self):
        request = self.make_request()

        auth_claims = firebase_auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)

    def test_returns_none_when_auth_header_uses_wrong_scheme_type(self):
        request = self.make_request(auth_header='Basic password=123')

        auth_claims = firebase_auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)

    def test_returns_none_when_auth_token_is_invalid(self):
        verify_id_token_swap = self.swap_to_always_raise(
            firebase_admin.auth, 'verify_id_token',
            error=firebase_exceptions.InvalidArgumentError('invalid token'))
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with verify_id_token_swap, self.capture_logging() as errors:
            auth_claims = firebase_auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)
        self.assertEqual(len(errors), 1)
        self.assertIn('invalid token', errors[0])

    def test_returns_claims_as_none_when_missing_essential_claims(self):
        verify_id_token_swap = self.swap_to_always_return(
            firebase_admin.auth, 'verify_id_token', value={})
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with verify_id_token_swap:
            auth_claims = firebase_auth_services.authenticate_request(request)

        self.assertIsNone(auth_claims)


class GenericAssociationTests(test_utils.GenericTestBase):

    def setUp(self):
        super(GenericAssociationTests, self).setUp()
        self._uninstall_stub = FirebaseAdminSdkStub.install(self)

    def tearDown(self):
        self._uninstall_stub()
        super(GenericAssociationTests, self).tearDown()

    def test_get_association_that_is_present(self):
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('aid'), 'uid')

    def test_get_association_that_is_missing(self):
        self.assertIsNone(
            firebase_auth_services.get_user_id_from_auth_id('does_not_exist'))

    def test_get_multi_associations_with_all_present(self):
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('aid2', 'uid2'))
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3'))

        self.assertEqual(
            firebase_auth_services.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', 'uid2', 'uid3'])

    def test_get_multi_associations_with_one_missing(self):
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        # The aid2 <-> uid2 association is missing.
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3'))

        self.assertEqual(
            firebase_auth_services.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', None, 'uid3'])

    def test_associate_without_collision(self):
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('aid'), 'uid')

    def test_associate_with_collision_raises(self):
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        with self.assertRaisesRegexp(Exception, 'already associated'):
            firebase_auth_services.associate_auth_id_to_user_id(
                auth_domain.AuthIdUserIdPair('aid', 'uid'))

    def test_associate_multi_without_collisions(self):
        firebase_auth_services.associate_multi_auth_ids_to_user_ids(
            [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
             auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
             auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

        self.assertEqual(
            [firebase_auth_services.get_user_id_from_auth_id('aid1'),
             firebase_auth_services.get_user_id_from_auth_id('aid2'),
             firebase_auth_services.get_user_id_from_auth_id('aid3')],
            ['uid1', 'uid2', 'uid3'])

    def test_associate_multi_with_collision_raises(self):
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))

        with self.assertRaisesRegexp(Exception, 'already associated'):
            firebase_auth_services.associate_multi_auth_ids_to_user_ids(
                [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
                 auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
                 auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

    def test_present_association_is_not_considered_to_be_deleted(self):
        firebase_admin.auth.create_user(uid='aid')
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertFalse(firebase_auth_services.are_auth_associations_deleted(
            'uid'))

    def test_missing_association_is_considered_to_be_deleted(self):
        self.assertTrue(firebase_auth_services.are_auth_associations_deleted(
            'does_not_exist'))

    def test_delete_association_when_it_is_present(self):
        firebase_admin.auth.create_user(uid='aid')
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))
        self.assertFalse(firebase_auth_services.are_auth_associations_deleted(
            'uid'))

        firebase_auth_services.delete_auth_associations('uid')

        self.assertTrue(firebase_auth_services.are_auth_associations_deleted(
            'uid'))

    def test_delete_association_when_it_is_missing_does_not_raise(self):
        # Should not raise.
        firebase_auth_services.delete_auth_associations('does_not_exist')


class FirebaseSpecificAssociationTests(test_utils.GenericTestBase):

    USER_ID = 'uid'
    AUTH_ID = 'sub'

    def setUp(self):
        super(FirebaseSpecificAssociationTests, self).setUp()
        self._uninstall_stub = FirebaseAdminSdkStub.install(self)

        firebase_admin.auth.create_user(uid=self.AUTH_ID)
        firebase_auth_services.associate_auth_id_to_user_id(
            auth_domain.AuthIdUserIdPair(self.AUTH_ID, self.USER_ID))

    def tearDown(self):
        self._uninstall_stub()
        super(FirebaseSpecificAssociationTests, self).tearDown()

    def assert_only_item_is_exception(self, logs, msg):
        """Asserts that only the given message appeared in the logs."""
        self.assertEqual(len(logs), 1)
        self.assertIn(msg, logs[0])

    def test_delete_user_without_firebase_initialization_returns_false(self):
        init_swap = self.swap_to_always_raise(
            firebase_admin, 'initialize_app',
            error=firebase_exceptions.UnknownError('could not init'))

        with init_swap, self.capture_logging(min_level=logging.ERROR) as logs:
            firebase_auth_services.delete_auth_associations(self.USER_ID)

        self.assertFalse(
            firebase_auth_services.are_auth_associations_deleted(self.USER_ID))
        self.assert_only_item_is_exception(logs, 'could not init')

    def test_is_associated_auth_id_deleted_without_init_returns_false(self):
        init_swap = self.swap_to_always_raise(
            firebase_admin, 'initialize_app',
            error=firebase_exceptions.UnknownError('could not init'))

        with init_swap, self.capture_logging(min_level=logging.ERROR) as logs:
            self.assertFalse(
                firebase_auth_services.are_auth_associations_deleted(
                    self.USER_ID))

        self.assert_only_item_is_exception(logs, 'could not init')

    def test_delete_user_when_firebase_raises_an_error(self):
        delete_swap = self.swap_to_always_raise(
            firebase_admin.auth, 'delete_user',
            error=firebase_exceptions.InternalError('could not connect'))

        with delete_swap, self.capture_logging(min_level=logging.ERROR) as logs:
            firebase_auth_services.delete_auth_associations(self.USER_ID)

        self.assertFalse(
            firebase_auth_services.are_auth_associations_deleted(self.USER_ID))
        self.assert_only_item_is_exception(logs, 'could not connect')

    def test_delete_user_when_firebase_succeeds(self):
        with self.capture_logging(min_level=logging.ERROR) as logs:
            firebase_auth_services.delete_auth_associations(self.USER_ID)

        self.assertTrue(
            firebase_auth_services.are_auth_associations_deleted(self.USER_ID))
        self.assertEqual(logs, [])


class FirebaseAccountWipeoutTests(test_utils.GenericTestBase):
    """Tests for wipeout_service that is specific to Firebase authentication."""

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
        firebase_auth_services.associate_auth_id_to_user_id(
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
