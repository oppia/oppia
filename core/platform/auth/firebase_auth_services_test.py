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
from core.platform import models
from core.platform.auth import firebase_auth_services
from core.tests import test_utils
import feconf
import python_utils

import contextlib2
import firebase_admin
from firebase_admin import exceptions as firebase_exceptions
import webapp2

auth_models, = models.Registry.import_models([models.NAMES.auth])


class FirebaseAdminSdkStub(python_utils.OBJECT):
    """Helper class for swapping the Firebase Admin SDK with a stateful stub.

    NOT INTENDED TO BE USED DIRECTLY. Just install it and then interact with the
    Firebase Admin SDK as if it were real.

    FRAGILE! This class returns users as firebase_admin.auth.UserRecord objects
    for API parity, but the Firebase Admin SDK doesn't expose a constructor for
    it as part of the public API. To compensate, we depend on implementation
    details (isolated to the _set_user_fragile method) that may stop working in
    newer versions of the SDK. We're OK with taking that risk, because this is a
    test-only class.

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
            stack.enter_context(test.swap(
                firebase_admin.auth, 'update_user', stub._update_user)) # pylint: disable=protected-access

            for function_name in cls._YAGNI_FUNCTION_NAMES:
                stack.enter_context(test.swap_to_always_raise(
                    firebase_admin.auth, function_name, NotImplementedError))

            # Standard usage of ExitStack: enter a bunch of context managers
            # from the safety of an ExitStack's context. Once they've all been
            # opened, pop_all() of them off of the original context so they can
            # *stay* open. Calling the function returned will exit all of them
            # in reverse order.
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
        'verify_session_cookie',
    ]

    def __init__(self):
        self._users = {}

    def _create_user(self, uid=None, disabled=False):
        """Adds user to storage if new, otherwise raises an error.

        Args:
            uid: str. The unique Firebase account ID for the user. The uid
                argument cannot be made into a positional argument because the
                Firebase Admin SDK generates a value when it is None. Non-test
                code will always pass a uid, however, so this stub enforces that
                they are not None.
            disabled: bool. Whether the user account is to be disabled.

        Raises:
            ValueError. The uid argument was not provided.
            UidAlreadyExistsError. The uid has already been assigned to a user.
        """
        if uid is None:
            raise ValueError('FirebaseAdminSdkStub requires uid to be set')
        if uid in self._users:
            raise firebase_admin.auth.UidAlreadyExistsError(
                'uid=%r already exists' % uid, None, None)
        self._set_user_fragile(uid, disabled)

    def _update_user(self, uid, disabled=False):
        """Updates the user in storage if found, otherwise raises an error.

        Args:
            uid: str. The Firebase account ID of the user.
            disabled: bool. Whether the user account is to be disabled.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        if uid not in self._users:
            raise firebase_admin.auth.UserNotFoundError('%s not found' % uid)
        self._set_user_fragile(uid, disabled)

    def _set_user_fragile(self, uid, disabled):
        """Sets the given properties for the corresponding user.

        FRAGILE! The dict keys used by the UserRecord constructor are an
        implementation detail that may break in future versions of the SDK.

        Args:
            uid: str. The Firebase account ID of the user.
            disabled: bool. Whether the user account is to be disabled.
        """
        self._users[uid] = firebase_admin.auth.UserRecord(
            {'localId': uid, 'disabled': disabled})

    def _get_user(self, uid):
        """Returns the user with given ID if found, otherwise raises an error.

        Args:
            uid: str. The Firebase account ID of the user.

        Returns:
            UserRecord. The UserRecord object of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        if uid not in self._users:
            raise firebase_admin.auth.UserNotFoundError('%s not found' % uid)
        return self._users[uid]

    def _delete_user(self, uid):
        """Removes user from storage if found, otherwise raises an error.

        Args:
            uid: str. The Firebase account ID of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        if uid not in self._users:
            raise firebase_admin.auth.UserNotFoundError('%s not found' % uid)
        del self._users[uid]


class FirebaseAuthServicesTestBase(test_utils.AppEngineTestBase):
    """Test base for Firebase-specific tests with helpful default behavior."""

    def setUp(self):
        super(FirebaseAuthServicesTestBase, self).setUp()
        self._uninstall_stub = FirebaseAdminSdkStub.install(self)

    def tearDown(self):
        self._uninstall_stub()
        super(FirebaseAuthServicesTestBase, self).tearDown()

    def capture_logging(self, min_level=logging.INFO):
        """Context manager that captures logs into a list.

        Overridden to set the minimum logging level as INFO.

        Args:
            min_level: int. The minimum logging level captured by the context
                manager. By default, all logging levels are captured. Values
                should be one of the following values from the logging module:
                NOTSET, DEBUG, INFO, WARNING, ERROR, CRITICAL.

        Returns:
            Context manager. The context manager for capturing logging messages.
        """
        return super(FirebaseAuthServicesTestBase, self).capture_logging(
            min_level=min_level)


class AuthenticateRequestTests(FirebaseAuthServicesTestBase):
    """Test cases for authenticating requests with Firebase Admin SDK."""

    def make_request(self, auth_header=None):
        """Returns a webapp2.Request with the given authorization claims.

        Args:
            auth_header: str|None. Contents of the Authorization header. If
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
            auth_claims = (
                firebase_auth_services.get_auth_claims_from_request(request))

        self.assertIsNone(auth_claims)
        self.assert_matches_regexps(errors, ['could not init'])

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

            auth_claims = (
                firebase_auth_services.get_auth_claims_from_request(request))

        self.assertIsNone(auth_claims)
        self.assertEqual(errors, [])

    def test_returns_auth_claims_from_valid_auth_token(self):
        verify_id_token_swap = self.swap_to_always_return(
            firebase_admin.auth, 'verify_id_token',
            value={'sub': 'auth_id', 'email': 'foo@test.com'})
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with verify_id_token_swap:
            auth_claims = (
                firebase_auth_services.get_auth_claims_from_request(request))

        self.assertEqual(
            auth_claims,
            auth_domain.AuthClaims('auth_id', 'foo@test.com', False))

    def test_identifies_user_with_admin_privileges(self):
        verify_id_token_swap = self.swap_to_always_return(
            firebase_admin.auth, 'verify_id_token', value={
                'sub': 'auth_id',
                'email': 'foo@test.com',
                'role': feconf.FIREBASE_ROLE_SUPER_ADMIN,
            })
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with verify_id_token_swap:
            auth_claims = (
                firebase_auth_services.get_auth_claims_from_request(request))

        self.assertEqual(
            auth_claims,
            auth_domain.AuthClaims('auth_id', 'foo@test.com', True))

    def test_returns_none_when_auth_header_is_missing(self):
        request = self.make_request()

        auth_claims = (
            firebase_auth_services.get_auth_claims_from_request(request))

        self.assertIsNone(auth_claims)

    def test_returns_none_when_auth_header_uses_wrong_scheme_type(self):
        request = self.make_request(auth_header='Basic password=123')

        auth_claims = (
            firebase_auth_services.get_auth_claims_from_request(request))

        self.assertIsNone(auth_claims)

    def test_returns_none_when_auth_token_is_invalid(self):
        verify_id_token_swap = self.swap_to_always_raise(
            firebase_admin.auth, 'verify_id_token',
            error=firebase_exceptions.InvalidArgumentError('invalid token'))
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with verify_id_token_swap, self.capture_logging() as errors:
            auth_claims = (
                firebase_auth_services.get_auth_claims_from_request(request))

        self.assertIsNone(auth_claims)
        self.assert_matches_regexps(errors, ['invalid token'])

    def test_returns_claims_as_none_when_missing_essential_claims(self):
        verify_id_token_swap = self.swap_to_always_return(
            firebase_admin.auth, 'verify_id_token', value={})
        request = self.make_request(auth_header='Bearer DUMMY_JWT')

        with verify_id_token_swap:
            auth_claims = (
                firebase_auth_services.get_auth_claims_from_request(request))

        self.assertIsNone(auth_claims)


class GenericAssociationTests(FirebaseAuthServicesTestBase):

    ENABLE_AUTH_SERVICES_STUB = False

    def test_get_association_that_is_present(self):
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(
            firebase_auth_services.get_auth_id_from_user_id('uid'), 'aid')

    def test_get_association_that_is_missing(self):
        self.assertIsNone(
            firebase_auth_services.get_user_id_from_auth_id('does_not_exist'))
        self.assertIsNone(
            firebase_auth_services.get_auth_id_from_user_id('does_not_exist'))

    def test_get_multi_associations_with_all_present(self):
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid2', 'uid2'))
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3'))

        self.assertEqual(
            firebase_auth_services.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', 'uid2', 'uid3'])
        self.assertEqual(
            firebase_auth_services.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']),
            ['aid1', 'aid2', 'aid3'])

    def test_get_multi_associations_with_one_missing(self):
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        # The aid2 <-> uid2 association is missing.
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3'))

        self.assertEqual(
            firebase_auth_services.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', None, 'uid3'])
        self.assertEqual(
            firebase_auth_services.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']),
            ['aid1', None, 'aid3'])

    def test_associate_without_collision(self):
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(
            firebase_auth_services.get_auth_id_from_user_id('uid'), 'aid')

    def test_associate_with_user_id_collision_raises(self):
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        with self.assertRaisesRegexp(Exception, 'already associated'):
            firebase_auth_services.associate_auth_id_with_user_id(
                auth_domain.AuthIdUserIdPair('aid', 'uid'))

    def test_associate_with_auth_id_collision_raises(self):
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))
        # Erase the user_id collision, but leave the auth_id collision.
        auth_models.UserIdByFirebaseAuthIdModel.delete_by_id('aid')

        with self.assertRaisesRegexp(Exception, 'already associated'):
            firebase_auth_services.associate_auth_id_with_user_id(
                auth_domain.AuthIdUserIdPair('aid', 'uid'))

    def test_associate_multi_without_collisions(self):
        firebase_auth_services.associate_multi_auth_ids_with_user_ids(
            [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
             auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
             auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

        self.assertEqual(
            [firebase_auth_services.get_user_id_from_auth_id('aid1'),
             firebase_auth_services.get_user_id_from_auth_id('aid2'),
             firebase_auth_services.get_user_id_from_auth_id('aid3')],
            ['uid1', 'uid2', 'uid3'])

    def test_associate_multi_with_user_id_collision_raises(self):
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))

        with self.assertRaisesRegexp(Exception, 'already associated'):
            firebase_auth_services.associate_multi_auth_ids_with_user_ids(
                [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
                 auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
                 auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

    def test_associate_multi_with_auth_id_collision_raises(self):
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        # Erase the user_id collision, but leave the auth_id collision.
        auth_models.UserIdByFirebaseAuthIdModel.delete_by_id('aid1')

        with self.assertRaisesRegexp(Exception, 'already associated'):
            firebase_auth_services.associate_multi_auth_ids_with_user_ids(
                [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
                 auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
                 auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

    def test_present_association_is_not_considered_to_be_deleted(self):
        firebase_admin.auth.create_user(uid='aid')
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertFalse(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted('uid'))

    def test_missing_association_is_considered_to_be_deleted(self):
        self.assertTrue(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted('does_not_exist'))

    def test_delete_association_when_it_is_present(self):
        firebase_admin.auth.create_user(uid='aid')
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))
        self.assertFalse(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted('uid'))

        firebase_auth_services.delete_external_auth_associations('uid')

        self.assertTrue(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted('uid'))

    def test_delete_association_when_it_is_missing_does_not_raise(self):
        # Should not raise.
        firebase_auth_services.delete_external_auth_associations(
            'does_not_exist')

    def test_disable_association_marks_user_for_deletion(self):
        firebase_admin.auth.create_user(uid='aid')
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertIsNotNone(
            auth_models.UserIdByFirebaseAuthIdModel.get('aid', strict=False))
        self.assertFalse(firebase_admin.auth.get_user('aid').disabled)

        firebase_auth_services.mark_user_for_deletion('uid')

        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get('aid', strict=False))
        self.assertTrue(firebase_admin.auth.get_user('aid').disabled)

    def test_disable_association_warns_when_firebase_fails_to_init(self):
        firebase_admin.auth.create_user(uid='aid')
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))
        init_swap = self.swap_to_always_raise(
            firebase_admin, 'initialize_app',
            error=firebase_exceptions.UnknownError('could not init'))

        self.assertIsNotNone(
            auth_models.UserIdByFirebaseAuthIdModel.get('aid', strict=False))
        self.assertFalse(firebase_admin.auth.get_user('aid').disabled)

        with init_swap, self.capture_logging() as logs:
            firebase_auth_services.mark_user_for_deletion('uid')

        self.assert_matches_regexps(logs, ['could not init'])
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get('aid', strict=False))
        self.assertFalse(firebase_admin.auth.get_user('aid').disabled)

    def test_disable_association_warns_when_firebase_fails_to_update_user(self):
        firebase_admin.auth.create_user(uid='aid')
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))
        update_user_swap = self.swap_to_always_raise(
            firebase_admin.auth, 'update_user',
            error=firebase_exceptions.UnknownError('could not update'))
        log_capturing_context = self.capture_logging()

        self.assertIsNotNone(
            auth_models.UserIdByFirebaseAuthIdModel.get('aid', strict=False))
        self.assertFalse(firebase_admin.auth.get_user('aid').disabled)

        with update_user_swap, log_capturing_context as logs:
            firebase_auth_services.mark_user_for_deletion('uid')

        self.assert_matches_regexps(logs, ['could not update'])
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get('aid', strict=False))
        self.assertFalse(firebase_admin.auth.get_user('aid').disabled)


class FirebaseSpecificAssociationTests(FirebaseAuthServicesTestBase):

    ENABLE_AUTH_SERVICES_STUB = False

    USER_ID = 'uid'
    AUTH_ID = 'sub'

    def setUp(self):
        super(FirebaseSpecificAssociationTests, self).setUp()
        firebase_admin.auth.create_user(uid=self.AUTH_ID)
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair(self.AUTH_ID, self.USER_ID))

    def test_delete_user_without_firebase_initialization_returns_false(self):
        init_swap = self.swap_to_always_raise(
            firebase_admin, 'initialize_app',
            error=firebase_exceptions.UnknownError('could not init'))

        with init_swap, self.capture_logging() as logs:
            firebase_auth_services.delete_external_auth_associations(
                self.USER_ID)

        self.assertFalse(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.USER_ID))
        self.assert_matches_regexps(logs, ['could not init'])

    def test_is_associated_auth_id_deleted_without_init_returns_false(self):
        init_swap = self.swap_to_always_raise(
            firebase_admin, 'initialize_app',
            error=firebase_exceptions.UnknownError('could not init'))

        with init_swap, self.capture_logging() as logs:
            self.assertFalse(
                firebase_auth_services
                .verify_external_auth_associations_are_deleted(self.USER_ID))

        self.assert_matches_regexps(logs, ['could not init'])

    def test_delete_user_when_firebase_raises_an_error(self):
        delete_swap = self.swap_to_always_raise(
            firebase_admin.auth, 'delete_user',
            error=firebase_exceptions.InternalError('could not connect'))

        with delete_swap, self.capture_logging() as logs:
            firebase_auth_services.delete_external_auth_associations(
                self.USER_ID)

        self.assertFalse(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.USER_ID))
        self.assert_matches_regexps(logs, ['could not connect'])

    def test_delete_user_when_firebase_succeeds(self):
        with self.capture_logging() as logs:
            firebase_auth_services.delete_external_auth_associations(
                self.USER_ID)

        self.assertTrue(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.USER_ID))
        self.assertEqual(logs, [])


class DeleteAuthAssociationsTests(FirebaseAuthServicesTestBase):

    ENABLE_AUTH_SERVICES_STUB = False

    EMAIL = 'some@email.com'
    USERNAME = 'username'
    AUTH_ID = 'authid'

    UNKNOWN_ERROR = firebase_exceptions.UnknownError('error')

    def setUp(self):
        super(DeleteAuthAssociationsTests, self).setUp()
        firebase_admin.auth.create_user(uid=self.AUTH_ID)
        self.signup(self.EMAIL, self.USERNAME)
        self.user_id = self.get_user_id_from_email(self.EMAIL)
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair(self.AUTH_ID, self.user_id))

    def delete_external_auth_associations(self):
        """Runs delete_external_auth_associations on the test user."""
        firebase_auth_services.delete_external_auth_associations(self.user_id)

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

    def test_delete_external_auth_associations_happy_path(self):
        self.delete_external_auth_associations()

        self.assert_firebase_account_is_deleted()
        self.assertTrue(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.user_id))

    def test_delete_external_auth_associations_after_failed_attempt(self):
        with self.swap_initialize_sdk_to_always_fail():
            self.delete_external_auth_associations()

        self.assert_firebase_account_is_not_deleted()
        self.assertFalse(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.user_id))

        self.delete_external_auth_associations()

        self.assert_firebase_account_is_deleted()
        self.assertTrue(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.user_id))

    def test_verify_delete_external_auth_associations_after_failed_attempt(
            self):
        self.delete_external_auth_associations()

        self.assert_firebase_account_is_deleted()

        with self.swap_initialize_sdk_to_always_fail():
            self.assertFalse(
                firebase_auth_services
                .verify_external_auth_associations_are_deleted(self.user_id))

        self.delete_external_auth_associations()

        self.assertTrue(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.user_id))

    def test_delete_external_auth_associations_when_delete_user_fails(self):
        with self.swap_delete_user_to_always_fail():
            self.delete_external_auth_associations()

        self.assert_firebase_account_is_not_deleted()

        self.assertFalse(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.user_id))

    def test_delete_external_auth_associations_when_get_user_fails(self):
        self.delete_external_auth_associations()

        self.assert_firebase_account_is_deleted()

        with self.swap_get_user_to_always_fail():
            self.assertFalse(
                firebase_auth_services
                .verify_external_auth_associations_are_deleted(self.user_id))

        self.assertTrue(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.user_id))

    def test_delete_external_auth_associations_when_init_fails_during_delete(
            self):
        with self.swap_initialize_sdk_to_always_fail():
            self.delete_external_auth_associations()

        self.assert_firebase_account_is_not_deleted()

        self.assertFalse(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.user_id))

    def test_delete_external_auth_associations_when_init_fails_during_verify(
            self):
        self.delete_external_auth_associations()

        self.assert_firebase_account_is_deleted()

        with self.swap_initialize_sdk_to_always_fail():
            self.assertFalse(
                firebase_auth_services
                .verify_external_auth_associations_are_deleted(self.user_id))

        self.assertTrue(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.user_id))
