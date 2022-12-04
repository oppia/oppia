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

"""Tests for core.domain.auth_services."""

from __future__ import annotations

import contextlib
import datetime
import json
import logging

from core import feconf
from core.constants import constants
from core.domain import auth_domain
from core.domain import auth_services
from core.domain import user_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from firebase_admin import auth as firebase_auth
from typing import Dict, List, Optional, Tuple, Union, cast
import webapp2

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import auth_models

auth_models, user_models = (
    models.Registry.import_models([models.Names.AUTH, models.Names.USER]))

UidsPartitionTupleType = Tuple[
    List[Tuple[int, str]],
    List[Tuple[int, str]]
]

UidsZipPartitionTupleType = Tuple[
    List[Tuple[int, Tuple[str, str]]],
    List[Tuple[int, Tuple[str, str]]]
]

RecordsPartitionTupleType = Tuple[
    List[Tuple[int, Tuple[firebase_auth.ImportUserRecord, str]]],
    List[Tuple[int, Tuple[firebase_auth.ImportUserRecord, str]]]
]


class AuthServicesTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.full_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.auth_id = self.get_auth_id_from_email(self.NEW_USER_EMAIL)

        self.modifiable_full_user_data = user_domain.ModifiableUserData(
            'full_user_1', '12345', [constants.DEFAULT_LANGUAGE_CODE],
            None, None, None, user_id=self.full_user_id)
        self.modifiable_profile_user_data = [
            user_domain.ModifiableUserData(
                'profile_user_1', '12345', [constants.DEFAULT_LANGUAGE_CODE],
                None, None, None),
            user_domain.ModifiableUserData(
                'profile_user_2', '12345', [constants.DEFAULT_LANGUAGE_CODE],
                None, None, None),
        ]

        user_services.update_multiple_users_data(
            [self.modifiable_full_user_data])
        profile_users = user_services.create_new_profiles(
            self.auth_id, self.NEW_USER_EMAIL,
            self.modifiable_profile_user_data)
        self.profile_user_1_id = profile_users[0].user_id
        self.profile_user_2_id = profile_users[1].user_id

    def test_create_profile_user_auth_details(self) -> None:
        user_auth_details = auth_services.create_profile_user_auth_details(
            'uid', 'pid')

        self.assertEqual(user_auth_details.user_id, 'uid')
        self.assertEqual(user_auth_details.parent_user_id, 'pid')
        self.assertIsNone(user_auth_details.gae_id)
        self.assertIsNone(user_auth_details.firebase_auth_id)
        self.assertFalse(user_auth_details.deleted)

    def test_create_profile_user_auth_details_with_self_as_parent_is_error(
        self
    ) -> None:
        with self.assertRaisesRegex(ValueError, 'cannot be its own parent'):
            auth_services.create_profile_user_auth_details('uid', 'uid')

    def test_get_all_profiles_for_parent_user_id_returns_all_profiles(
        self
    ) -> None:
        self.assertItemsEqual(
            auth_services.get_all_profiles_by_parent_user_id(self.full_user_id),
            [auth_models.UserAuthDetailsModel.get(self.profile_user_1_id),
             auth_models.UserAuthDetailsModel.get(self.profile_user_2_id)])

    def test_get_auth_claims_from_request(self) -> None:
        request = webapp2.Request.blank('/')

        self.assertIsNone(auth_services.get_auth_claims_from_request(request))

        with self.login_context(self.NEW_USER_EMAIL):
            self.assertEqual(
                auth_services.get_auth_claims_from_request(request),
                auth_domain.AuthClaims(
                    self.get_auth_id_from_email(self.NEW_USER_EMAIL),
                    self.NEW_USER_EMAIL, False))

        with self.super_admin_context():
            self.assertEqual(
                auth_services.get_auth_claims_from_request(request),
                auth_domain.AuthClaims(
                    self.get_auth_id_from_email(self.SUPER_ADMIN_EMAIL),
                    self.SUPER_ADMIN_EMAIL,
                    True))

        self.assertIsNone(auth_services.get_auth_claims_from_request(request))

    def test_mark_user_for_deletion_will_force_auth_id_to_be_none(self) -> None:
        self.assertIsNotNone(
            auth_services.get_auth_id_from_user_id(self.full_user_id))

        auth_services.mark_user_for_deletion(self.full_user_id)

        self.assertIsNone(
            auth_services.get_auth_id_from_user_id(self.full_user_id))

    def test_get_association_that_is_present(self) -> None:
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertEqual(auth_services.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(auth_services.get_auth_id_from_user_id('uid'), 'aid')

    def test_get_association_that_is_missing(self) -> None:
        self.assertIsNone(
            auth_services.get_user_id_from_auth_id('does_not_exist'))
        self.assertIsNone(
            auth_services.get_auth_id_from_user_id('does_not_exist'))

    def test_get_multi_associations_with_all_present(self) -> None:
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid2', 'uid2'))
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3'))

        self.assertEqual(
            auth_services.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', 'uid2', 'uid3'])
        self.assertEqual(
            auth_services.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']),
            ['aid1', 'aid2', 'aid3'])

    def test_get_multi_associations_with_one_missing(self) -> None:
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        # The aid2 <-> uid2 association is missing.
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3'))

        self.assertEqual(
            auth_services.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', None, 'uid3'])
        self.assertEqual(
            auth_services.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']),
            ['aid1', None, 'aid3'])

    def test_associate_auth_id_with_user_id_without_collision(self) -> None:
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertEqual(auth_services.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(auth_services.get_auth_id_from_user_id('uid'), 'aid')

    def test_associate_auth_id_with_user_id_with_collision_raises(self) -> None:
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        with self.assertRaisesRegex(Exception, 'already associated'):
            auth_services.associate_auth_id_with_user_id(
                auth_domain.AuthIdUserIdPair('aid', 'uid'))

    def test_associate_multi_auth_ids_with_user_ids_without_collisions(
        self
    ) -> None:
        auth_services.associate_multi_auth_ids_with_user_ids(
            [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
             auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
             auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

        self.assertEqual(
            [auth_services.get_user_id_from_auth_id('aid1'),
             auth_services.get_user_id_from_auth_id('aid2'),
             auth_services.get_user_id_from_auth_id('aid3')],
            ['uid1', 'uid2', 'uid3'])

    def test_associate_multi_auth_ids_with_user_ids_with_collision_raises(
        self
    ) -> None:
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))

        with self.assertRaisesRegex(Exception, 'already associated'):
            auth_services.associate_multi_auth_ids_with_user_ids(
                [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
                 auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
                 auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

    def test_present_association_is_not_considered_to_be_deleted(self) -> None:
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))
        self.assertFalse(
            auth_services.verify_external_auth_associations_are_deleted('uid'))

    def test_missing_association_is_considered_to_be_deleted(self) -> None:
        self.assertTrue(
            auth_services.verify_external_auth_associations_are_deleted(
                'does_not_exist'))

    def test_delete_association_when_it_is_present(self) -> None:
        self.assertFalse(
            auth_services.verify_external_auth_associations_are_deleted(
                self.full_user_id))

        auth_services.delete_external_auth_associations(self.full_user_id)

        self.assertTrue(
            auth_services.verify_external_auth_associations_are_deleted(
                self.full_user_id))

    def test_delete_association_when_it_is_missing_does_not_raise(self) -> None:
        # Should not raise.
        auth_services.delete_external_auth_associations('does_not_exist')


class FirebaseAdminSdkStub:
    """Helper class for swapping the Firebase Admin SDK with a stateful stub
    (Extend from firebase_auth_services_test).
    """

    _IMPLEMENTED_SDK_FUNCTION_NAMES = [
        'create_session_cookie',
        'create_user',
        'get_user',
        'get_users',
        'revoke_refresh_tokens',
        'set_custom_user_claims',
    ]

    _UNIMPLEMENTED_SDK_FUNCTION_NAMES = [
        'create_custom_token',
        'generate_email_verification_link',
        'generate_password_reset_link',
        'generate_sign_in_with_email_link',
        'get_user_by_phone_number',
    ]

    def __init__(self) -> None:
        self._users_by_uid: Dict[str, firebase_auth.UserRecord] = {}
        self._uid_by_session_cookie: Dict[str, str] = {}
        self._swap_stack: Optional[contextlib.ExitStack] = None
        self._test: Optional[test_utils.TestBase] = None

    def install(self, test: test_utils.TestBase) -> None:
        """Installs the stub on the given test instance. Idempotent.

        Args:
            test: test_utils.TestBase. The test to install the stub on.
        """
        self.uninstall()

        self._test = test

        with contextlib.ExitStack() as swap_stack:
            for name in self._IMPLEMENTED_SDK_FUNCTION_NAMES:
                swap_stack.enter_context(
                    test.swap(firebase_auth, name, getattr(self, name)))

            for name in self._UNIMPLEMENTED_SDK_FUNCTION_NAMES:
                swap_stack.enter_context(test.swap_to_always_raise(
                    firebase_auth, name, NotImplementedError))

            # Allows us to exit the current context manager without closing the
            # entered contexts. They will be exited later by the uninstall()
            # method.
            self._swap_stack = swap_stack.pop_all()

    def uninstall(self) -> None:
        """Uninstalls the stub. Idempotent."""
        if self._swap_stack:
            self._swap_stack.close()
            self._swap_stack = None

    def create_session_cookie(
            self, id_token: str, unused_max_age: datetime.timedelta
    ) -> str:
        """Creates a new session cookie which expires after given duration.

        Args:
            id_token: str. The ID Token to generate the cookie from.
            unused_max_age: datetime.timedelta. The duration the cookie remains
                valid. Unused by our stub implementation.

        Returns:
            str. A session cookie that can validate the user.
        """
        if not id_token:
            raise firebase_auth.InvalidIdTokenError('missing id_token')
        # NOTE: Session cookies are fundamentally different, in terms of
        # encoding and security, from ID Tokens. Regardless, for the purposes of
        # this stub, we use the same values for both.
        session_cookie = id_token
        # NOTE: `uid` (Firebase account ID) is the 'sub' claim of the ID token.
        claims = self._decode_user_claims(id_token)

        # Letting mypy know that 'claims' is not None and
        # claims['sub'] is of type str.
        assert claims and isinstance(claims['sub'], str)
        self._uid_by_session_cookie[session_cookie] = claims['sub']
        return session_cookie

    def create_user(
            self, uid: str, email: Optional[str] = None, disabled: bool = False
    ) -> str:
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
            raise firebase_auth.UidAlreadyExistsError(
                'uid=%r already exists' % uid, None, None)
        self._set_user_fragile(uid, email, disabled, None)
        return self._encode_user_claims(uid)

    def get_user(self, uid: str) -> firebase_auth.UserRecord:
        """Returns user with given ID if found, otherwise raises an error.

        Args:
            uid: str. The Firebase account ID of the user.

        Returns:
            firebase_auth.UserRecord. The UserRecord object of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        users = self.get_users([firebase_auth.UidIdentifier(uid)]).users
        if len(users) == 0:
            raise firebase_auth.UserNotFoundError('%s not found' % uid)
        return users[0]

    def get_users(
            self, identifiers: List[firebase_auth.UidIdentifier]
    ) -> firebase_auth.GetUsersResult:
        """Returns user with given ID if found, otherwise raises an error.

        Args:
            identifiers: list(firebase_auth.UserIdentifier). The Firebase
                account IDs of the user.

        Returns:
            firebase_auth.GetUsersResult. The UserRecord object of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        found_users = [
            self._users_by_uid[identifier.uid] for identifier in identifiers
            if identifier.uid in self._users_by_uid
        ]
        not_found_identifiers = [
            identifier for identifier in identifiers
            if identifier.uid not in self._users_by_uid
        ]
        return firebase_auth.GetUsersResult(found_users, not_found_identifiers)

    def revoke_refresh_tokens(self, uid: str) -> None:
        """Revokes all refresh tokens for an existing user.

        Args:
            uid: str. The uid (Firebase account ID) of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        if uid not in self._users_by_uid:
            raise firebase_auth.UserNotFoundError('%s not found' % uid)
        self._uid_by_session_cookie = {
            k: v for k, v in self._uid_by_session_cookie.items() if v != uid
        }

    def set_custom_user_claims(
            self, uid: str, custom_claims: Optional[str]
    ) -> str:
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

    def update_user(
            self,
            uid: str,
            email: Optional[str] = None,
            disabled: bool = False,
            custom_claims: Optional[str] = None
    ) -> str:
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
            raise firebase_auth.UserNotFoundError('%s not found' % uid)
        self._set_user_fragile(uid, email, disabled, custom_claims)
        return uid

    def assert_is_user(self, uid: str) -> None:
        """Asserts that an account with the given id exists.

        NOTE: This method can only be called after the stub has been installed
        to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        assert self._test is not None
        self._test.assertIn(
            uid, self._users_by_uid,
            msg='Firebase account not found: uid=%r' % uid)

    def assert_is_not_user(self, uid: str) -> None:
        """Asserts that an account with the given id does not exist.

        NOTE: This method can only be called after the stub has been installed
        to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        assert self._test is not None
        self._test.assertNotIn(
            uid, self._users_by_uid,
            msg='Unexpected Firebase account exists: uid=%r' % uid)

    def assert_is_super_admin(self, uid: str) -> None:
        """Asserts that the given ID has super admin privileges.

        NOTE: This method can only be called after the stub has been installed
        to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        self.assert_is_user(uid)
        custom_claims = self.get_user(uid).custom_claims or {}
        assert self._test is not None
        self._test.assertEqual(
            custom_claims.get('role', None), feconf.FIREBASE_ROLE_SUPER_ADMIN)

    def assert_is_not_super_admin(self, uid: str) -> None:
        """Asserts that the given ID does not have super admin privileges.

        NOTE: This method can only be called after the stub has been installed
        to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        self.assert_is_user(uid)
        custom_claims = self.get_user(uid).custom_claims or {}
        assert self._test is not None
        self._test.assertNotEqual(
            custom_claims.get('role', None), feconf.FIREBASE_ROLE_SUPER_ADMIN)

    def _encode_user_claims(self, uid: str) -> str:
        """Returns encoded claims for the given user.

        Args:
            uid: str. The ID of the target user.

        Returns:
            str. An encoded representation of the user's claims.
        """
        user = self.get_user(uid)
        claims = {'sub': user.uid}
        if user.email:
            claims['email'] = user.email
        if user.custom_claims:
            claims.update(user.custom_claims)
        return json.dumps(claims)

    def _decode_user_claims(
            self, encoded_claims: str
    ) -> Optional[Dict[str, Optional[Union[str, bool]]]]:
        """Returns the given decoded claims.

        Args:
            encoded_claims: str. The encoded claims.

        Returns:
            dict(str: *)|None. The decoded claims or None.
        """
        try:
            # Here we use cast because the type stubs for library 'json'
            # returns 'Any' from json.loads.
            # https://github.com/python/typeshed/blob/30ad9e945f42cca1190cdba58c65bdcfc313480f/stdlib/json/__init__.pyi#L36
            return cast(
                Dict[str, Optional[Union[str, bool]]],
                json.loads(encoded_claims))
        except ValueError:
            return None

    def _set_user_fragile(
            self,
            uid: str,
            email: Optional[str],
            disabled: bool,
            custom_claims: Optional[str]
    ) -> None:
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
        self._users_by_uid[uid] = firebase_auth.UserRecord({
            'localId': uid, 'email': email, 'disabled': disabled,
            'customAttributes': custom_claims,
        })


class FirebaseAuthServicesTestBase(test_utils.AppEngineTestBase):
    """Test base for Firebase-specific tests with helpful default behavior."""

    AUTH_ID = 'aid'
    EMAIL = 'foo@bar.com'

    def setUp(self) -> None:
        super().setUp()
        self.firebase_sdk_stub = FirebaseAdminSdkStub()
        self.firebase_sdk_stub.install(self)

    def tearDown(self) -> None:
        self.firebase_sdk_stub.uninstall()
        super().tearDown()

    def capture_logging(
        self, min_level: int = logging.INFO
    ) -> contextlib._GeneratorContextManager[List[str]]:
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
        return super().capture_logging(
            min_level=min_level)

    def create_request(
            self,
            id_token: Optional[str] = None,
            session_cookie: Optional[str] = None
    ) -> webapp2.Request:
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
            req.cookies[constants.FIREBASE_AUTH_SESSION_COOKIE_NAME] = (
                session_cookie)
        return req

    def create_response(
            self, session_cookie: Optional[str] = None
    ) -> webapp2.Response:
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
                constants.FIREBASE_AUTH_SESSION_COOKIE_NAME,
                value=session_cookie)
        return res


class SuperAdminPrivilegesTests(FirebaseAuthServicesTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.id_token = (
            self.firebase_sdk_stub.create_user(self.AUTH_ID, email=self.EMAIL))

    def test_auth_session(self) -> None:
        request = self.create_request(id_token=self.id_token)
        response = self.create_response()
        auth_services.establish_auth_session(request, response)

        self.assert_matches_regexps(
            response.headers.get_all('Set-Cookie'), ['session=.*;'])
        response = self.create_response(session_cookie='abc')
        auth_services.destroy_auth_session(response)
        self.assert_matches_regexps(
            response.headers.get_all('Set-Cookie'),
            ['session=abc;', 'session=; Max-Age=0;'])

    def test_super_admin_privileges(self) -> None:
        auth_models.UserAuthDetailsModel(id='uid', firebase_auth_id='aid').put()
        self.firebase_sdk_stub.assert_is_not_super_admin('aid')
        auth_services.grant_super_admin_privileges('uid')
        self.firebase_sdk_stub.assert_is_super_admin('aid')
        auth_services.revoke_super_admin_privileges('uid')
        self.firebase_sdk_stub.assert_is_not_super_admin('aid')
