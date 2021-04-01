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
from core.domain import user_services
from core.platform import models
from core.platform.auth import firebase_auth_services
from core.tests import test_utils
import feconf
import python_utils
import utils

import contextlib2
import firebase_admin
from firebase_admin import exceptions as firebase_exceptions
import mock
import webapp2

auth_models, user_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))


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

    _IMPLEMENTED_SDK_FUNCTION_NAMES = [
        'create_session_cookie',
        'create_user',
        'delete_user',
        'delete_users',
        'get_user',
        'get_user_by_email',
        'import_users',
        'list_users',
        'set_custom_user_claims',
        'update_user',
        'verify_id_token',
        'verify_session_cookie',
    ]

    _UNIMPLEMENTED_SDK_FUNCTION_NAMES = [
        'create_custom_token',
        'generate_email_verification_link',
        'generate_password_reset_link',
        'generate_sign_in_with_email_link',
        'get_user_by_phone_number',
        'revoke_refresh_tokens',
    ]

    def __init__(self):
        self._users_by_uid = {}
        self._session_cookie_duration_by_id_token = collections.Counter()
        self._swap_stack = None
        self._test = None

    def install(self, test):
        """Installs the stub on the given test instance. Idempotent.

        Args:
            test: test_utils.TestBase. The test to install the stub on.
        """
        self.uninstall()

        self._test = test

        with contextlib2.ExitStack() as swap_stack:
            for name in self._IMPLEMENTED_SDK_FUNCTION_NAMES:
                swap_stack.enter_context(
                    test.swap(firebase_admin.auth, name, getattr(self, name)))

            for name in self._UNIMPLEMENTED_SDK_FUNCTION_NAMES:
                swap_stack.enter_context(test.swap_to_always_raise(
                    firebase_admin.auth, name, NotImplementedError))

            # Allows us to exit the current context manager without closing the
            # entered contexts. They will be exited later by the uninstall()
            # method.
            self._swap_stack = swap_stack.pop_all()

    def uninstall(self):
        """Uninstalls the stub. Idempotent."""
        if self._swap_stack:
            self._swap_stack.close()
            self._swap_stack = None

    def create_session_cookie(self, id_token, max_age):
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

    def create_user(self, uid, email=None, disabled=False):
        """Adds user to storage if new, otherwise raises an error.

        Args:
            uid: str. The unique Firebase account ID for the user.
            email: str|None. The email address for the user, or None.
            disabled: bool. Whether the user account is to be disabled.

        Returns:
            str. An ID token that represents the given user's authorization.

        Raises:
            ValueError. The uid argument was not provided.
            UidAlreadyExistsError. The uid has already been assigned to a user.
        """
        if uid in self._users_by_uid:
            raise firebase_admin.auth.UidAlreadyExistsError(
                'uid=%r already exists' % uid, None, None)
        self._set_user_fragile(uid, email, disabled, None)
        return self._encode_user_claims(self.get_user(uid))

    def delete_user(self, uid):
        """Removes user from storage if found, otherwise raises an error.

        Args:
            uid: str. The Firebase account ID of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        if uid not in self._users_by_uid:
            raise firebase_admin.auth.UserNotFoundError('%s not found' % uid)
        del self._users_by_uid[uid]

    def delete_users(self, uids, force_delete=False):
        """Deletes the users identified by the specified user ids.

        Deleting a non-existing user does not generate an error (the method is
        idempotent). Non-existing users are considered to be successfully
        deleted and are therefore not reported as errors.

        A maximum of 1000 identifiers may be supplied. If more than 1000
        identifiers are supplied, this method raises a `ValueError`.

        Args:
            uids: A list of strings indicating the uids of the users to be
                deleted. Must have <= 1000 entries.
            force_delete: Optional parameter that indicates if users should be
                deleted, even if they're not disabled. Defaults to False.

        Returns:
            BatchDeleteAccountsResponse. Holds the errors encountered, if any.

        Raises:
            ValueError. If any of the identifiers are invalid or if more than
                1000 identifiers are specified.
        """
        if len(uids) > 1000:
            raise ValueError('`uids` paramter must have <= 1000 entries.')

        if force_delete:
            uids_to_delete = set(uids)
            errors = []
        else:
            disabled_uids, enabled_uids = utils.partition(
                uids, predicate=lambda uid: self._users_by_uid[uid].disabled,
                enumerated=True)
            uids_to_delete = {uid for _, uid in disabled_uids}
            errors = [(i, 'uid=%r must be disabled first' % uid)
                      for i, uid in enabled_uids]

        for uid in uids_to_delete.intersection(self._users_by_uid):
            del self._users_by_uid[uid]
        return self._create_delete_users_result_fragile(errors)

    def get_user(self, uid):
        """Returns user with given ID if found, otherwise raises an error.

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

    def get_user_by_email(self, email):
        """Returns user with given email if found, otherwise raises an error.

        Args:
            email: str. The email address of the user.

        Returns:
            UserRecord. The UserRecord object of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        matches = (u for u in self._users_by_uid.values() if u.email == email)
        user = python_utils.NEXT(matches, None)
        if user is None:
            raise firebase_admin.auth.UserNotFoundError('%s not found' % email)
        return user

    def import_users(self, records):
        """Adds the given user records to the stub's storage.

        Args:
            records: list(firebase_admin.auth.ImportUserRecord). The users to
                add.

        Returns:
            firebase_admin.auth.UserImportResult. Object with details about the
            operation.
        """
        for record in records:
            self._set_user_fragile(
                record.uid, record.email, record.disabled, record.custom_claims)
        return self._create_user_import_result_fragile(len(records), [])

    def list_users(self, page_token=None, max_results=1000):
        """Retrieves a page of user accounts from a Firebase project.

        The `page_token` argument governs the starting point of the page. The
        `max_results` argument governs the maximum number of user accounts that
        may be included in the returned page. This function never returns None.
        If there are no user accounts in the Firebase project, this returns an
        empty page.

        Args:
            page_token: str|None. A non-empty page token string, which indicates
                the starting point of the page (optional). Defaults to `None`,
                which will retrieve the first page of users.
            max_results: int|None. A positive integer indicating the maximum
                number of users to include in the returned page (optional).
                Defaults to 1000, which is also the maximum number allowed.

        Returns:
            ListUsersPage. A ListUsersPage instance.

        Raises:
            ValueError. If max_results or page_token are invalid.
            FirebaseError. If an error occurs while retrieving the user
                accounts.
        """
        if max_results > 1000:
            raise ValueError('max_results=%r must be <= 1000' % max_results)

        # NOTE: This is only sorted to make unit testing easier.
        all_users = sorted(self._users_by_uid.values(), key=lambda u: u.uid)
        page_list = [
            [user for user in user_group if user is not None]
            for user_group in utils.grouper(all_users, max_results)
        ]

        if not page_list:
            return self._create_list_users_page_fragile([], 0)

        try:
            page_index = int(page_token) if page_token is not None else 0
        except (ValueError, TypeError):
            raise ValueError('page_token=%r is invalid' % page_token)

        if 0 <= page_index < len(page_list):
            return self._create_list_users_page_fragile(page_list, page_index)
        else:
            raise ValueError('page_token=%r is invalid' % page_token)

    def set_custom_user_claims(self, uid, custom_claims):
        """Updates the custom claims of the given user.

        Args:
            uid: str. The Firebase account ID of the user.
            custom_claims: str|None. A string-encoded JSON with string keys and
                values, e.g. '{"role":"admin"}', or None.

        Returns:
            str. The uid of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        return self.update_user(uid, custom_claims=custom_claims)

    def update_user(self, uid, email=None, disabled=False, custom_claims=None):
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

    def verify_id_token(self, token):
        """Returns claims for the corresponding user if the ID token is valid.

        Args:
            token: str. The ID token.

        Returns:
            dict(str: *). Claims for the user corresponding to the ID token.
        """
        return self._decode_user_claims(token)

    def verify_session_cookie(self, session_cookie):
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

    def assert_is_user(self, uid):
        """Asserts that an account with the given id exists.

        NOTE: This method can only be called after the instance has been
        installed to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        self._test.assertIn(
            uid, self._users_by_uid,
            msg='Firebase account not found: uid=%r' % uid)

    def assert_is_not_user(self, uid):
        """Asserts that an account with the given id does not exist.

        NOTE: This method can only be called after the instance has been
        installed to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        self._test.assertNotIn(
            uid, self._users_by_uid,
            msg='Unexpected Firebase account exists: uid=%r' % uid)

    def assert_is_super_admin(self, uid):
        """Asserts that the given ID has super admin privileges.

        NOTE: This method can only be called after the instance has been
        installed to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        self.assert_is_user(uid)
        custom_claims = self.get_user(uid).custom_claims or {}
        self._test.assertEqual(
            custom_claims.get('role', None), feconf.FIREBASE_ROLE_SUPER_ADMIN)

    def assert_is_not_super_admin(self, uid):
        """Asserts that the given ID does not have super admin privileges.

        NOTE: This method can only be called after the instance has been
        installed to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        self.assert_is_user(uid)
        custom_claims = self.get_user(uid).custom_claims or {}
        self._test.assertNotEqual(
            custom_claims.get('role', None), feconf.FIREBASE_ROLE_SUPER_ADMIN)

    def assert_is_user_multi(self, uids):
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

    def assert_is_not_user_multi(self, uids):
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

    def mock_delete_users_error(
            self,
            batch_error_pattern=(None,), individual_error_pattern=(None,)):
        """Returns a context in which `delete_users` fails according to the
        given patterns.

        Example:
            with mock_delete_users_error(batch_error_pattern=(None, Exception)):
                delete_users(...) # OK.
                delete_users(...) # Raises Exception.
                delete_users(...) # OK.
                delete_users(...) # Raises Exception.
                delete_users(...) # OK.

        Args:
            batch_error_pattern: tuple(Exception|None). Enumerates which
                successive calls will raise an exception. For values of None, no
                exception is raised. The pattern is cycled. By default, an error
                will never be raised.
            individual_error_pattern: tuple(bool). Enumerates which individual
                users will cause an error. The pattern is cycled. By default, an
                error will never be raised.

        Returns:
            Context manager. The context manager with the mocked implementation.
        """
        batch_error_pattern = itertools.cycle(batch_error_pattern)
        individual_error_pattern = itertools.cycle(individual_error_pattern)

        def mock_delete_users(uids, force_delete=False):
            """Mock function that fails according to the input patterns."""
            error_to_raise = python_utils.NEXT(batch_error_pattern)
            if error_to_raise is not None:
                raise error_to_raise

            uids_to_delete, uids_to_fail = utils.partition(
                python_utils.ZIP(uids, individual_error_pattern),
                predicate=lambda uid_and_error: uid_and_error[1] is None,
                enumerated=True)

            uids_to_delete = [uid for _, (uid, _) in uids_to_delete]
            errors = [(i, error) for i, (_, error) in uids_to_fail]

            self.delete_users(uids_to_delete, force_delete=force_delete)

            return self._create_delete_users_result_fragile(errors)

        return self._test.swap(
            firebase_admin.auth, 'delete_users', mock_delete_users)

    def mock_import_users_error(
            self,
            batch_error_pattern=(None,), individual_error_pattern=(None,)):
        """Returns a context in which `import_users` fails according to the
        given patterns.

        Example:
            with mock_import_users_error(batch_error_pattern=(False, True)):
                import_users(...) # OK
                import_users(...) # Raises!
                import_users(...) # OK
                import_users(...) # Raises!
                import_users(...) # OK

        Args:
            batch_error_pattern: tuple(Exception|None). Enumerates which
                successive calls will raise an exception. For values of None, no
                exception is raised. The pattern is cycled. By default, an error
                will never be raised.
            individual_error_pattern: tuple(str|None). Enumerates which
                individual users will cause an error. Each value is either the
                error reason (a string), or None. The pattern is cycled. By
                default, an error will never be raised.

        Returns:
            Context manager. The context manager with the mocked implementation.
        """
        batch_error_pattern = itertools.cycle(batch_error_pattern)
        individual_error_pattern = itertools.cycle(individual_error_pattern)

        def mock_import_users(records):
            """Mock function that fails according to the input patterns."""
            error_to_raise = python_utils.NEXT(batch_error_pattern)
            if error_to_raise is not None:
                raise error_to_raise

            records_to_import, records_to_fail = utils.partition(
                python_utils.ZIP(records, individual_error_pattern),
                predicate=lambda record_and_error: record_and_error[1] is None,
                enumerated=True)

            self.import_users([record for _, (record, _) in records_to_import])

            return self._create_user_import_result_fragile(
                len(records), [(i, error) for i, (_, error) in records_to_fail])

        return self._test.swap(
            firebase_admin.auth, 'import_users', mock_import_users)

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

    def _create_list_users_page_fragile(self, page_list, page_index):
        """Creates a new ListUsersPage mock.

        FRAGILE! The mock is not from the real SDK, so it's vulnerable to
        becoming out-of-sync with the interface of the real ListUsersPage.

        Args:
            page_list: list(list(UserRecord)). The pages of users.
            page_index: int. The starting index of the page.

        Returns:
            Mock. A mock implementation of ListUsersPage.
        """
        page = mock.Mock()
        if page_index < len(page_list):
            page.users = page_list[page_index]
            page.has_next_page = (page_index + 1) < len(page_list)
            page.next_page_token = (
                '' if not page.has_next_page else
                python_utils.UNICODE(page_index + 1))
            page.get_next_page = lambda: (
                None if not page.has_next_page else
                self._create_list_users_page_fragile(page_list, page_index + 1))
            page.iterate_all = lambda: (
                itertools.chain.from_iterable(page_list[page_index:]))
        else:
            page.users = []
            page.has_next_page = False
            page.next_page_token = ''
            page.get_next_page = lambda: None
            page.iterate_all = lambda: iter([])
        return page

    def _create_delete_users_result_fragile(self, errors):
        """Creates a new BatchDeleteAccountsResponse instance with the given
        values.

        FRAGILE! The dict keys used by the BatchDeleteAccountsResponse
        constructor are an implementation detail that may break in future
        versions of the SDK.

        Args:
            errors: list(tuple(int, str)). A list of (index, error) pairs.

        Returns:
            firebase_admin.auth.BatchDeleteAccountsResponse. The response.
        """
        return firebase_admin.auth.BatchDeleteAccountsResponse(
            errors=[{'index': i, 'message': error} for i, error in errors])

    def _create_user_import_result_fragile(self, total, errors):
        """Creates a new UserImportResult instance with the given values.

        FRAGILE! The dict keys used by the UserImportResult constructor are an
        implementation detail that may break in future versions of the SDK.

        Args:
            total: int. The total number of records initially requested.
            errors: list(tuple(int, str)). A list of (index, error) pairs.

        Returns:
            firebase_admin.auth.UserImportResult. The response.
        """
        return firebase_admin.auth.UserImportResult({
            'error': [{'index': i, 'message': error} for i, error in errors],
        }, total)


class EstablishFirebaseConnectionTests(test_utils.TestBase):

    APP = object()

    def test_initializes_when_connection_does_not_exist(self):
        get_app_swap = self.swap_with_call_counter(
            firebase_admin, 'get_app', raises=ValueError('initialize_app'))
        init_app_swap = self.swap_with_call_counter(
            firebase_admin, 'initialize_app', returns=self.APP)

        with get_app_swap as get_app_counter, init_app_swap as init_app_counter:
            firebase_auth_services.establish_firebase_connection()

        self.assertEqual(get_app_counter.times_called, 1)
        self.assertEqual(init_app_counter.times_called, 1)

    def test_returns_existing_connection(self):
        get_app_swap = self.swap_with_call_counter(
            firebase_admin, 'get_app', returns=self.APP)
        init_app_swap = self.swap_with_call_counter(
            firebase_admin, 'initialize_app',
            raises=Exception('unexpected call'))

        with get_app_swap as get_app_counter, init_app_swap as init_app_counter:
            firebase_auth_services.establish_firebase_connection()

        self.assertEqual(get_app_counter.times_called, 1)
        self.assertEqual(init_app_counter.times_called, 0)

    def test_raises_authentic_get_app_error(self):
        get_app_swap = self.swap_with_call_counter(
            firebase_admin, 'get_app', raises=ValueError('uh-oh!'))
        init_app_swap = self.swap_with_call_counter(
            firebase_admin, 'initialize_app',
            raises=Exception('unexpected call'))

        with get_app_swap as get_app_counter, init_app_swap as init_app_counter:
            self.assertRaisesRegexp(
                ValueError, 'uh-oh!',
                firebase_auth_services.establish_firebase_connection)

        self.assertEqual(get_app_counter.times_called, 1)
        self.assertEqual(init_app_counter.times_called, 0)

    def test_raises_authentic_initialize_app_error(self):
        get_app_swap = self.swap_with_call_counter(
            firebase_admin, 'get_app', raises=ValueError('initialize_app'))
        init_app_swap = self.swap_with_call_counter(
            firebase_admin, 'initialize_app', raises=ValueError('uh-oh!'))

        with get_app_swap as get_app_counter, init_app_swap as init_app_counter:
            self.assertRaisesRegexp(
                ValueError, 'uh-oh!',
                firebase_auth_services.establish_firebase_connection)

        self.assertEqual(get_app_counter.times_called, 1)
        self.assertEqual(init_app_counter.times_called, 1)


class FirebaseAuthServicesTestBase(test_utils.AppEngineTestBase):
    """Test base for Firebase-specific tests with helpful default behavior."""

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


class SuperAdminPrivilegesTests(FirebaseAuthServicesTestBase):

    def test_updates_user_successfully(self):
        auth_models.UserAuthDetailsModel(id='uid', firebase_auth_id='aid').put()
        self.firebase_sdk_stub.create_user('aid')

        self.firebase_sdk_stub.assert_is_not_super_admin('aid')

        firebase_auth_services.grant_super_admin_privileges('uid')

        self.firebase_sdk_stub.assert_is_super_admin('aid')

        firebase_auth_services.revoke_super_admin_privileges('uid')

        self.firebase_sdk_stub.assert_is_not_super_admin('aid')

    def test_raises_error_when_user_does_not_exist(self):
        auth_models.UserAuthDetailsModel(id='uid', firebase_auth_id=None).put()

        self.assertRaisesRegexp(
            ValueError, 'user_id=uid has no Firebase account',
            lambda: firebase_auth_services.grant_super_admin_privileges('uid'))

        self.assertRaisesRegexp(
            ValueError, 'user_id=uid has no Firebase account',
            lambda: firebase_auth_services.revoke_super_admin_privileges('uid'))


class SeedFirebaseTests(FirebaseAuthServicesTestBase):

    def set_up_models(self, user_id=None, gae_id=None, firebase_auth_id=None):
        """Creates user and auth models to emulate a real admin account.

        Args:
            user_id: str|None. The Oppia ID of the user. If None, no models are
                created.
            gae_id: str|None. The GAE ID of the user. If None, no GAE auth
                associations are created.
            firebase_auth_id: str|None. The Firebase account ID of the user. If
                None, no Firebase associations are created.
        """
        if user_id is None:
            return
        user_models.UserSettingsModel(
            id=user_id, email=feconf.ADMIN_EMAIL_ADDRESS).put()
        auth_models.UserAuthDetailsModel(
            id=user_id, gae_id=gae_id, firebase_auth_id=firebase_auth_id).put()
        if gae_id is not None:
            auth_models.UserIdentifiersModel(id=gae_id, user_id=user_id).put()
        if firebase_auth_id is not None:
            auth_models.UserIdByFirebaseAuthIdModel(
                id=firebase_auth_id, user_id=user_id).put()

    def test_fails_when_no_admin_exists(self):
        self.assertRaisesRegexp(
            Exception,
            'testadmin@example.com must correspond to exactly 1 user',
            firebase_auth_services.seed_firebase)

    def test_creates_firebase_account_and_models_if_none_exists(self):
        self.set_up_models(user_id='abc')

        self.assertIsNone(
            firebase_auth_services.get_auth_id_from_user_id('abc'))
        self.assertIsNone(
            firebase_auth_services.get_user_id_from_auth_id('abc'))
        self.firebase_sdk_stub.assert_is_not_user('abc')

        firebase_auth_services.seed_firebase()

        self.assertEqual(
            firebase_auth_services.get_auth_id_from_user_id('abc'), 'abc')
        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('abc'), 'abc')
        self.firebase_sdk_stub.assert_is_super_admin('abc')

    def test_assigns_firebase_auth_id_to_user_id_with_uid_prefix_stripped(self):
        self.set_up_models(user_id='uid_abc')

        self.assertIsNone(
            firebase_auth_services.get_auth_id_from_user_id('uid_abc'))
        self.assertIsNone(
            firebase_auth_services.get_user_id_from_auth_id('abc'))
        self.firebase_sdk_stub.assert_is_not_user('abc')

        firebase_auth_services.seed_firebase()

        self.assertEqual(
            firebase_auth_services.get_auth_id_from_user_id('uid_abc'), 'abc')
        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('abc'), 'uid_abc')
        self.firebase_sdk_stub.assert_is_super_admin('abc')

    def test_updates_existing_firebase_account(self):
        self.set_up_models(user_id='abc')
        self.firebase_sdk_stub.create_user('abc')

        self.assertIsNone(
            firebase_auth_services.get_auth_id_from_user_id('abc'))
        self.assertIsNone(
            firebase_auth_services.get_user_id_from_auth_id('abc'))
        self.firebase_sdk_stub.assert_is_not_super_admin('abc')

        firebase_auth_services.seed_firebase()

        self.assertEqual(
            firebase_auth_services.get_auth_id_from_user_id('abc'), 'abc')
        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('abc'), 'abc')
        self.firebase_sdk_stub.assert_is_super_admin('abc')

    def test_creates_firebase_assoc_if_missing(self):
        self.set_up_models(user_id='uid_abc', gae_id='jkl')

        self.assertIsNone(
            firebase_auth_services.get_auth_id_from_user_id('uid_abc'))
        self.assertIsNone(
            firebase_auth_services.get_user_id_from_auth_id('abc'))
        self.assertIsNone(
            firebase_auth_services.get_user_id_from_auth_id('jkl'))

        firebase_auth_services.seed_firebase()

        self.assertEqual(
            firebase_auth_services.get_auth_id_from_user_id('uid_abc'), 'abc')
        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('abc'), 'uid_abc')
        self.assertIsNone(
            firebase_auth_services.get_user_id_from_auth_id('jkl'))

    def test_reuses_existing_firebase_id_if_association_exists(self):
        self.set_up_models(user_id='abc', firebase_auth_id='xyz')

        self.assertEqual(
            firebase_auth_services.get_auth_id_from_user_id('abc'), 'xyz')
        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('xyz'), 'abc')
        self.firebase_sdk_stub.assert_is_not_user('xyz')

        firebase_auth_services.seed_firebase()

        self.assertEqual(
            firebase_auth_services.get_auth_id_from_user_id('abc'), 'xyz')
        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('xyz'), 'abc')
        self.firebase_sdk_stub.assert_is_super_admin('xyz')

    def test_recreates_firebase_account_if_auth_id_is_wrong(self):
        self.set_up_models(user_id='abc', firebase_auth_id='xyz')
        self.firebase_sdk_stub.create_user(
            'jkl', email=feconf.ADMIN_EMAIL_ADDRESS)

        self.firebase_sdk_stub.assert_is_not_super_admin('jkl')
        self.firebase_sdk_stub.assert_is_not_user('xyz')

        firebase_auth_services.seed_firebase()

        self.firebase_sdk_stub.assert_is_not_user('jkl')
        self.firebase_sdk_stub.assert_is_super_admin('xyz')

    def test_grants_super_admin_priviliges_if_firebase_account_exists(self):
        self.set_up_models(user_id='abc', firebase_auth_id='xyz')
        self.firebase_sdk_stub.create_user(
            'xyz', email=feconf.ADMIN_EMAIL_ADDRESS)

        self.firebase_sdk_stub.assert_is_not_super_admin('xyz')

        firebase_auth_services.seed_firebase()

        self.firebase_sdk_stub.assert_is_super_admin('xyz')

    def test_updates_user_id_if_assoc_model_is_inconsistent(self):
        self.set_up_models(user_id='abc', firebase_auth_id='xyz')
        assoc_model = auth_models.UserIdByFirebaseAuthIdModel.get('xyz')
        assoc_model.user_id = 'jkl'
        assoc_model.update_timestamps(update_last_updated_time=False)
        assoc_model.put()

        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('xyz'), 'jkl')

        firebase_auth_services.seed_firebase()

        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id('xyz'), 'abc')


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

    def test_grants_super_admin_privileges_to_feconf_admin_email_address(self):
        cookie = firebase_admin.auth.create_session_cookie(
            self.firebase_sdk_stub.create_user(
                self.AUTH_ID, email=feconf.ADMIN_EMAIL_ADDRESS),
            datetime.timedelta(days=1))

        self.assertEqual(
            firebase_auth_services.get_auth_claims_from_request(
                self.create_request(session_cookie=cookie)),
            auth_domain.AuthClaims(
                self.AUTH_ID, feconf.ADMIN_EMAIL_ADDRESS, True))


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

    def test_disable_association_gives_up_when_auth_assocs_do_not_exist(self):
        with self.capture_logging() as logs:
            firebase_auth_services.mark_user_for_deletion('uid')

        self.assert_matches_regexps(logs, [
            r'\[WIPEOUT\] User with user_id=uid has no Firebase account'
        ])


class FirebaseSpecificAssociationTests(FirebaseAuthServicesTestBase):

    USER_ID = 'uid'
    AUTH_ID = 'sub'

    def setUp(self):
        super(FirebaseSpecificAssociationTests, self).setUp()
        self.firebase_sdk_stub.create_user(self.AUTH_ID)
        firebase_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair(self.AUTH_ID, self.USER_ID))

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
        user_settings = user_services.create_new_user(self.AUTH_ID, self.EMAIL)
        self.user_id = user_settings.user_id

    def swap_get_user_to_always_fail(self):
        """Swaps the get_user function so that it always fails."""
        return self.swap_to_always_raise(
            firebase_admin.auth, 'get_user', error=self.UNKNOWN_ERROR)

    def swap_delete_user_to_always_fail(self):
        """Swaps the delete_user function so that it always fails."""
        return self.swap_to_always_raise(
            firebase_admin.auth, 'delete_user', error=self.UNKNOWN_ERROR)

    def test_delete_external_auth_associations_happy_path(self):
        firebase_auth_services.delete_external_auth_associations(self.user_id)

        self.firebase_sdk_stub.assert_is_not_user(self.AUTH_ID)
        self.assertTrue(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.user_id))

    def test_delete_external_auth_associations_when_user_not_found(self):
        firebase_admin.auth.delete_user(self.AUTH_ID)

        with self.capture_logging() as logs:
            firebase_auth_services.delete_external_auth_associations(
                self.user_id)

        self.assert_matches_regexps(logs, [
            r'\[WIPEOUT\] Firebase account already deleted',
        ])

    def test_delete_external_auth_associations_when_delete_user_fails(self):
        with self.swap_delete_user_to_always_fail():
            firebase_auth_services.delete_external_auth_associations(
                self.user_id)

        self.firebase_sdk_stub.assert_is_user(self.AUTH_ID)

        self.assertFalse(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.user_id))

    def test_delete_external_auth_associations_when_get_user_fails(self):
        firebase_auth_services.delete_external_auth_associations(self.user_id)

        self.firebase_sdk_stub.assert_is_not_user(self.AUTH_ID)

        with self.swap_get_user_to_always_fail():
            self.assertFalse(
                firebase_auth_services
                .verify_external_auth_associations_are_deleted(self.user_id))

        self.assertTrue(
            firebase_auth_services
            .verify_external_auth_associations_are_deleted(self.user_id))
