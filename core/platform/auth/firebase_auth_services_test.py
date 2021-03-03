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

import collections
import datetime
import itertools
import json
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
                self.firebase_sdk_stub = FirebaseAdminSdkStub(self)
                self.firebase_sdk_stub.install()

                self.firebase_sdk_stub.create_user('foo')

            def tearDown(self):
                self.firebase_sdk_stub.uninstall()
                super(Test, self).tearDown()

            def test_sdk(self):
                user_record = firebase_admin.get_user('uid')
                self.assertEqual(user_record.uid, 'uid')
    """

    _UNIMPLEMENTED_SDK_FUNCTION_NAMES = [
        'create_custom_token',
        'create_user',
        'generate_email_verification_link',
        'generate_password_reset_link',
        'generate_sign_in_with_email_link',
        'get_user_by_email',
        'get_user_by_phone_number',
        'list_users',
        'revoke_refresh_tokens',
        'set_custom_user_claims',
    ]

    def __init__(self):
        self._users_by_uid = {}
        self._session_cookie_duration_by_id_token = collections.Counter()
        self._swap_stack = None
        self._test = None

    def install(self, test):
        """Installs a new instance of the stub on the given test class.

        The stub will emulate an initially-empty Firebase authentication server.

        Args:
            test: test_utils.TestBase. The test to install the stub on.
        """
        self._test = test

        with contextlib2.ExitStack() as swap_stack:
            swap_stack.enter_context(test.swap_to_always_return(
                firebase_admin, 'initialize_app', value=object()))
            swap_stack.enter_context(test.swap_to_always_return(
                firebase_admin, 'delete_app'))
            swap_stack.enter_context(test.swap(
                firebase_admin.auth,
                'create_session_cookie', self._create_session_cookie))
            swap_stack.enter_context(test.swap(
                firebase_admin.auth,
                'verify_session_cookie', self._verify_session_cookie))
            swap_stack.enter_context(test.swap(
                firebase_admin.auth, 'import_users', self._import_users))
            swap_stack.enter_context(test.swap(
                firebase_admin.auth, 'verify_id_token', self._verify_id_token))
            swap_stack.enter_context(test.swap(
                firebase_admin.auth, 'get_user', self._get_user))
            swap_stack.enter_context(test.swap(
                firebase_admin.auth, 'delete_user', self._delete_user))
            swap_stack.enter_context(test.swap(
                firebase_admin.auth, 'update_user', self._update_user))

            for function_name in self._UNIMPLEMENTED_SDK_FUNCTION_NAMES:
                swap_stack.enter_context(test.swap_to_always_raise(
                    firebase_admin.auth, function_name, NotImplementedError))

            # Standard usage of ExitStack: enter a bunch of context managers
            # from the safety of an ExitStack's context. Once they've all been
            # opened, pop_all() of them off of the original context so they can
            # *stay* open. Calling the function returned will exit all of them
            # in reverse order.
            # https://docs.python.org/3/library/contextlib.html#cleaning-up-in-an-enter-implementation
            self._swap_stack = swap_stack.pop_all()

    def uninstall(self):
        """Uninstalls the stub."""
        if self._swap_stack:
            self._swap_stack.close()
            self._swap_stack = None

    def create_user(
            self, uid, email=None, disabled=False, role_is_super_admin=False):
        """Adds user to storage if new, otherwise raises an error.

        Args:
            uid: str. The unique Firebase account ID for the user.
            email: str|None. The email address for the user, or None.
            disabled: bool. Whether the user account is to be disabled.
            role_is_super_admin: bool. Whether the user account has super admin
                privilages.

        Returns:
            str. An ID token that represents the given user's authorization.

        Raises:
            ValueError. The uid argument was not provided.
            UidAlreadyExistsError. The uid has already been assigned to a user.
        """
        if uid in self._users_by_uid:
            raise ValueError('uid=%r already exists' % uid)
        custom_claims = (
            {'role': feconf.FIREBASE_ROLE_SUPER_ADMIN}
            if role_is_super_admin else None)
        self._set_user_fragile(uid, email, disabled, custom_claims)
        return self._encode_user_claims(self._get_user(uid))

    def mock_initialize_app_error(self):
        """Returns a context in which `initialize_app` raises an exception."""
        return self._test.swap_to_always_raise(
            firebase_admin, 'initialize_app',
            error=firebase_exceptions.UnknownError('could not init'))

    def mock_delete_app_error(self):
        """Returns a context in which `delete_app` raises an exception."""
        return self._test.swap_to_always_raise(
            firebase_admin, 'delete_app',
            error=firebase_exceptions.UnknownError('could not delete app'))

    def mock_import_users_error(
            self, call_error_sequence=(False,), user_error_sequence=(False,)):
        """Returns a context in which `import_users` raises an exception.

        Example:
            with mock_import_users_error(call_error_sequence=(False, True)):
                import_users() # OK
                import_users() # Raises!
                import_users() # OK
                import_users() # Raises!
                import_users() # OK

        Args:
            call_error_sequence: tuple(bool). Enumerates which successive calls
                will raise an exception. The pattern is cycled.
            user_error_sequence: tuple(bool). Enumerates which individual users
                will cause an error. The pattern is cycled.

        Returns:
            Context manager. The context manager with the mocked implementation.
        """
        call_error_sequence = itertools.cycle(call_error_sequence)
        user_error_sequence = itertools.cycle(user_error_sequence)
        def mock_import_users(user_records):
            """Mock function that fails according to the given input values."""
            if python_utils.NEXT(call_error_sequence):
                raise firebase_exceptions.DataLossError('Failed to connect')

            total_records = len(user_records)

            kept_records, error_indices = [], []
            for i, (record, error) in enumerate(
                    python_utils.ZIP(user_records, user_error_sequence)):
                if error:
                    error_indices.append(i)
                else:
                    kept_records.append(record)

            if kept_records:
                self._import_users(kept_records)

            return self._create_user_import_result_fragile(
                total_records, error_indices=error_indices)

        return self._test.swap(
            firebase_admin.auth, 'import_users', mock_import_users)

    def assert_firebase_user_exists(self, uid):
        """Asserts that an account with the given id exists.

        NOTE: This method can only be called after the instance has been
        installed to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        self._test.assertIn(
            uid, self._users_by_uid,
            msg='Firebase account not found: uid=%r' % uid)

    def assert_firebase_user_does_not_exist(self, uid):
        """Asserts that an account with the given id does not exist.

        NOTE: This method can only be called after the instance has been
        installed to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        self._test.assertNotIn(
            uid, self._users_by_uid,
            msg='Unexpected Firebase account exists: uid=%r' % uid)

    def assert_multi_firebase_users_exist(self, uids):
        """Asserts that every account with the given ids exist.

        NOTE: This method can only be called after the instance has been
        installed to a test case!

        Args:
            uids: list(str). The IDs of the users to confirm.
        """
        not_found = [uid for uid in uids if uid not in self._users_by_uid]
        self._test.assertEqual(
            not_found, [],
            msg='Firebase accounts not found: uids=%r' % (not_found,))

    def assert_multi_firebase_users_do_not_exist(self, uids):
        """Asserts that every account with the given ids do not exist.

        NOTE: This method can only be called after the instance has been
        installed to a test case!

        Args:
            uids: list(str). The IDs of the users to confirm.
        """
        found = [uid for uid in uids if uid in self._users_by_uid]
        self._test.assertEqual(
            found, [],
            msg='Unexpected Firebase accounts exists: uids=%r' % (found,))

    def _import_users(self, user_records):
        """Adds the given user records to the stub's storage.

        Args:
            user_records: list(firebase_admin.auth.ImportUserRecord). The users
                to add.

        Returns:
            firebase_admin.auth.UserImportResult. Object with details about the
            operation.
        """
        for record in user_records:
            self._set_user_fragile(
                record.uid, record.email, record.disabled, record.custom_claims)
        return self._create_user_import_result_fragile(len(user_records))

    def _create_session_cookie(self, id_token, max_age):
        """Creates a new session cookie which expires after given duration.

        Args:
            id_token: str. The ID Token to generate the cookie from.
            max_age: datetime.timedelta. The duration the cookie remains valid.

        Returns:
            str. A session cookie that can validate the user.
        """
        if not id_token:
            raise firebase_admin.auth.InvalidIdTokenError('missing id_token')
        if max_age > datetime.timedelta(days=0):
            self._session_cookie_duration_by_id_token[id_token] = max_age
        # NOTE: Session cookies are often completely different, in terms of
        # encoding and security, to ID Tokens. Regardless, for the purposes of
        # this stub, we treat them the same.
        session_cookie = id_token
        return session_cookie

    def _verify_session_cookie(self, session_cookie):
        """Returns claims for the corresponding user if the cookie is valid.

        Args:
            session_cookie: str. The session cookie.

        Returns:
            dict(str: *). Claims for the user corresponding to the session
            cookie.
        """
        # NOTE: Session cookies are often completely different, in terms of
        # encoding and security, to ID Tokens. Regardless, for the purposes of
        # this stub, we treat them the same.
        id_token = session_cookie
        if id_token not in self._session_cookie_duration_by_id_token:
            raise firebase_admin.auth.ExpiredSessionCookieError(
                'The provided Firebase session cookie is invalid', None)
        return self._decode_user_claims(id_token)

    def _verify_id_token(self, token):
        """Returns claims for the corresponding user if the ID token is valid.

        Args:
            token: str. The ID token.

        Returns:
            dict(str: *). Claims for the user corresponding to the ID token.
        """
        return self._decode_user_claims(token)

    def _create_user_import_result_fragile(self, total, error_indices=None):
        """Creates a new UserImportResult instance with the given values.

        FRAGILE! The dict keys used by the UserImportResult constructor are an
        implementation detail that may break in future versions of the SDK.

        Args:
            total: int. The total number of records initially requested.
            error_indices: list(int)|None. The indicies of the records which
                have failed. If None, then the result will not contain any
                errors.

        Returns:
            firebase_admin.auth.UserImportResult. A UserImportResult with the
            given results.
        """
        if error_indices is None:
            error_indices = []
        return firebase_admin.auth.UserImportResult({
            'error': [
                {'index': i, 'message': 'FirebaseError'} for i in error_indices
            ],
        }, total)

    def _set_user_fragile(self, uid, email, disabled, custom_claims):
        """Sets the given properties for the corresponding user.

        FRAGILE! The dict keys used by the UserRecord constructor are an
        implementation detail that may break in future versions of the SDK.

        Args:
            uid: str. The Firebase account ID of the user.
            email: str. The email address for the user.
            disabled: bool. Whether the user account is to be disabled.
            custom_claims: str. A string-encoded JSON with string keys and
                values, e.g. '{"role":"admin"}'.
        """
        self._users_by_uid[uid] = firebase_admin.auth.UserRecord({
            'localId': uid, 'email': email, 'disabled': disabled,
            'customAttributes': custom_claims,
        })

    def _get_user(self, uid):
        """Returns the user with given ID if found, otherwise raises an error.

        Args:
            uid: str. The Firebase account ID of the user.

        Returns:
            UserRecord. The UserRecord object of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        if uid not in self._users_by_uid:
            raise firebase_admin.auth.UserNotFoundError('%s not found' % uid)
        return self._users_by_uid[uid]

    def _update_user(self, uid, email=None, disabled=False, custom_claims=None):
        """Updates the user in storage if found, otherwise raises an error.

        Args:
            uid: str. The Firebase account ID of the user.
            email: str|None. The email address for the user, or None.
            disabled: bool. Whether the user account is to be disabled.
            custom_claims: str|None. A string-encoded JSON with string keys and
                values, e.g. '{"role":"admin"}', or None.

        Returns:
            str. The uid of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        if uid not in self._users_by_uid:
            raise firebase_admin.auth.UserNotFoundError('%s not found' % uid)
        self._set_user_fragile(uid, email, disabled, custom_claims)
        return uid

    def _delete_user(self, uid):
        """Removes user from storage if found, otherwise raises an error.

        Args:
            uid: str. The Firebase account ID of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        if uid not in self._users_by_uid:
            raise firebase_admin.auth.UserNotFoundError('%s not found' % uid)
        del self._users_by_uid[uid]

    def _encode_user_claims(self, user):
        """Returns encoded claims for the given user.

        Args:
            user: firebase_admin.auth.UserRecord. The source of the claims.

        Returns:
            str. An encoded representation of the user's claims.
        """
        claims = {'sub': user.uid}
        if user.email:
            claims['email'] = user.email
        if user.custom_claims:
            claims.update(user.custom_claims)
        return json.dumps(claims)

    def _decode_user_claims(self, encoded_claims):
        """Returns the given decoded claims.

        Args:
            encoded_claims: str. The encoded claims.

        Returns:
            dict(str: *). The decoded claims.
        """
        try:
            return json.loads(encoded_claims)
        except ValueError:
            return None


class FirebaseAuthServicesTestBase(test_utils.AppEngineTestBase):
    """Test base for Firebase-specific tests with helpful default behavior."""

    ENABLE_AUTH_SERVICES_STUB = False

    AUTH_ID = 'aid'
    EMAIL = 'foo@bar.com'

    def setUp(self):
        super(FirebaseAuthServicesTestBase, self).setUp()
        self.firebase_sdk_stub = FirebaseAdminSdkStub()
        self.firebase_sdk_stub.install(self)

    def tearDown(self):
        self.firebase_sdk_stub.uninstall()
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

    def create_request(self, id_token=None, session_cookie=None):
        """Returns a new request with the given auth values.

        Args:
            id_token: str|None. The ID token to be placed into the Authorization
                header.
            session_cookie: str|None. The value to be placed into the request's
                cookies.

        Returns:
            webapp2.Request. A new request with the given auth values set.
        """
        req = webapp2.Request.blank('/')
        if id_token:
            req.headers['Authorization'] = 'Bearer %s' % id_token
        if session_cookie:
            req.cookies[feconf.FIREBASE_SESSION_COOKIE_NAME] = session_cookie
        return req

    def create_response(self, session_cookie=None):
        """Returns a new response with the given session cookie.

        Args:
            session_cookie: str|None. The value to be placed into the response's
                cookies.

        Returns:
            webapp2.Response. A new response with the given cookie.
        """
        res = webapp2.Response()
        if session_cookie:
            res.set_cookie(
                feconf.FIREBASE_SESSION_COOKIE_NAME, value=session_cookie)
        return res


class EstablishAuthSessionTests(FirebaseAuthServicesTestBase):

    def setUp(self):
        super(EstablishAuthSessionTests, self).setUp()
        self.id_token = (
            self.firebase_sdk_stub.create_user(self.AUTH_ID, email=self.EMAIL))

    def test_adds_cookie_to_response_from_id_token_in_request(self):
        req = self.create_request(id_token=self.id_token)
        res = self.create_response()

        firebase_auth_services.establish_auth_session(req, res)

        self.assert_matches_regexps(
            res.headers.get_all('Set-Cookie'), ['session=.*;'])

    def test_does_nothing_if_request_has_cookie(self):
        cookie = firebase_admin.auth.create_session_cookie(
            self.id_token, feconf.FIREBASE_SESSION_COOKIE_MAX_AGE)
        req = self.create_request(session_cookie=cookie)
        res = self.create_response()

        firebase_auth_services.establish_auth_session(req, res)

        self.assertEqual(res.headers.get_all('Set-Cookie'), [])

    def test_reports_error_if_request_missing_both_cookie_and_id_token(self):
        req = self.create_request()
        res = self.create_response()

        self.assertRaisesRegexp(
            firebase_admin.auth.InvalidIdTokenError,
            'missing id_token',
            lambda: firebase_auth_services.establish_auth_session(req, res))

        self.assertEqual(res.headers.get_all('Set-Cookie'), [])


class DestroyAuthSessionTests(FirebaseAuthServicesTestBase):

    def test_deletes_cookie_from_response(self):
        res = self.create_response(session_cookie='abc')
        self.assert_matches_regexps(
            res.headers.get_all('Set-Cookie'),
            ['session=abc;'])

        firebase_auth_services.destroy_auth_session(res)
        self.assert_matches_regexps(
            res.headers.get_all('Set-Cookie'),
            ['session=abc;', 'session=; Max-Age=0;'])


class GetAuthClaimsFromRequestTests(FirebaseAuthServicesTestBase):

    def test_returns_none_if_cookie_is_missing(self):
        id_token = self.firebase_sdk_stub.create_user(self.AUTH_ID)

        self.assertIsNone(firebase_auth_services.get_auth_claims_from_request(
            self.create_request()))
        self.assertIsNone(firebase_auth_services.get_auth_claims_from_request(
            self.create_request(id_token=id_token)))

    def test_returns_claims_if_cookie_is_present(self):
        cookie = firebase_admin.auth.create_session_cookie(
            self.firebase_sdk_stub.create_user(self.AUTH_ID, email=self.EMAIL),
            datetime.timedelta(days=1))

        self.assertEqual(
            firebase_auth_services.get_auth_claims_from_request(
                self.create_request(session_cookie=cookie)),
            auth_domain.AuthClaims(self.AUTH_ID, self.EMAIL, False))

    def test_logs_error_when_cookie_is_invalid(self):
        cookie = firebase_admin.auth.create_session_cookie(
            self.firebase_sdk_stub.create_user(self.AUTH_ID, email=self.EMAIL),
            datetime.timedelta(days=0))

        with self.capture_logging() as logs:
            self.assertIsNone(
                firebase_auth_services.get_auth_claims_from_request(
                    self.create_request(session_cookie=cookie)))

        self.assertTrue(
            logs[0].startswith('User session has ended and must be renewed'))


class GenericAssociationTests(FirebaseAuthServicesTestBase):

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
        self.firebase_sdk_stub.create_user('aid')
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
        self.firebase_sdk_stub.create_user('aid')
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
        self.firebase_sdk_stub.create_user('aid')
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
        self.firebase_sdk_stub.create_user('aid')
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
        self.firebase_sdk_stub.create_user('aid')
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

    USER_ID = 'uid'
    AUTH_ID = 'sub'

    def setUp(self):
        super(FirebaseSpecificAssociationTests, self).setUp()
        self.firebase_sdk_stub.create_user(self.AUTH_ID)
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

    EMAIL = 'some@email.com'
    USERNAME = 'username'
    AUTH_ID = 'authid'

    UNKNOWN_ERROR = firebase_exceptions.UnknownError('error')

    def setUp(self):
        super(DeleteAuthAssociationsTests, self).setUp()
        self.firebase_sdk_stub.create_user(self.AUTH_ID)
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
