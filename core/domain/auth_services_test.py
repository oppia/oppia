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
import itertools
import json
import logging
from unittest import mock

from core import feconf, utils
from core.constants import constants
from core.domain import auth_domain
from core.domain import auth_services
from core.domain import user_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from firebase_admin import auth as firebase_auth
from firebase_admin import exceptions as firebase_exceptions
from typing import ContextManager, Dict, List, Optional, Tuple, Union, cast
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
    """Helper class for swapping the Firebase Admin SDK with a stateful stub."""

    _IMPLEMENTED_SDK_FUNCTION_NAMES = [
        'create_session_cookie',
        'create_user',
        'delete_user',
        'delete_users',
        'get_user',
        'get_users',
        'get_user_by_email',
        'import_users',
        'list_users',
        'revoke_refresh_tokens',
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

    def delete_user(self, uid: str) -> None:
        """Removes user from storage if found, otherwise raises an error.

        Args:
            uid: str. The Firebase account ID of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        if uid not in self._users_by_uid:
            raise firebase_auth.UserNotFoundError('%s not found' % uid)
        del self._users_by_uid[uid]

    def delete_users(
            self, uids: List[str], force_delete: bool = False
    ) -> firebase_auth.BatchDeleteAccountsResponse:
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
            # Here we use cast because method 'utils.partition' returns a
            # broader type Tuple[Iterable[...], Iterable[...]], thus to
            # narrow down the type to 'UidsPartitionTupleType' we used
            # cast here.
            disabled_uids, enabled_uids = cast(
                UidsPartitionTupleType,
                utils.partition(
                    uids,
                    predicate=lambda uid: self._users_by_uid[uid].disabled,
                    enumerated=True))
            uids_to_delete = {uid for _, uid in disabled_uids}
            errors = [(i, 'uid=%r must be disabled first' % uid)
                      for i, uid in enabled_uids]

        for uid in uids_to_delete.intersection(self._users_by_uid):
            del self._users_by_uid[uid]
        return self._create_delete_users_result_fragile(errors)

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

    def get_user_by_email(self, email: str) -> firebase_auth.UserRecord:
        """Returns user with given email if found, otherwise raises an error.

        Args:
            email: str. The email address of the user.

        Returns:
            UserRecord. The UserRecord object of the user.

        Raises:
            UserNotFoundError. The Firebase account has not been created yet.
        """
        matches = (u for u in self._users_by_uid.values() if u.email == email)
        user = next(matches, None)
        if user is None:
            raise firebase_auth.UserNotFoundError('%s not found' % email)
        return user

    def import_users(
            self, records: List[firebase_admin.auth.ImportUserRecord]
    ) -> firebase_admin.auth.UserImportResult:
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
                record.uid, record.email, record.disabled,
                json.dumps(record.custom_claims))
        return self._create_user_import_result_fragile(len(records), [])

    def list_users(
            self, page_token: Optional[str] = None, max_results: int = 1000
    ) -> firebase_admin.auth.ListUsersPage:
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
            max_results: int. A positive integer indicating the maximum
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
        except (ValueError, TypeError) as e:
            raise ValueError('page_token=%r is invalid' % page_token) from e

        if 0 <= page_index < len(page_list):
            return self._create_list_users_page_fragile(page_list, page_index)
        else:
            raise ValueError('page_token=%r is invalid' % page_token)

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

    def verify_id_token(
            self, token: str
    ) -> Dict[str, Optional[Union[str, bool]]]:
        """Returns claims for the corresponding user if the ID token is valid.

        Args:
            token: str. The ID token.

        Returns:
            dict(str: *). Claims for the user corresponding to the ID token.
        """
        claims = self._decode_user_claims(token)
        assert claims is not None
        uid = claims['sub']
        if uid not in self._users_by_uid:
            raise firebase_auth.UserNotFoundError('%s not found' % uid)
        return claims

    def verify_session_cookie(
            self, session_cookie: str, check_revoked: bool = False
    ) -> Dict[str, Optional[Union[str, bool]]]:
        """Returns claims for the corresponding user if the cookie is valid.

        Args:
            session_cookie: str. The session cookie.
            check_revoked: bool. When true, checks whether the cookie has been
                revoked.

        Returns:
            dict(str: *). Claims for the user corresponding to the session
            cookie.
        """
        if check_revoked and session_cookie not in self._uid_by_session_cookie:
            raise firebase_auth.RevokedSessionCookieError(
                'The provided Firebase session cookie is invalid')
        claims = self._decode_user_claims(session_cookie)
        assert claims is not None
        uid = claims['sub']
        if uid not in self._users_by_uid:
            raise firebase_auth.UserNotFoundError('%s not found' % uid)
        return claims

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

    def assert_is_disabled(self, uid: str) -> None:
        """Asserts that the given ID is a disabled account.

        NOTE: This method can only be called after the stub has been installed
        to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        self.assert_is_user(uid)
        assert self._test is not None
        self._test.assertTrue(self.get_user(uid).disabled)

    def assert_is_not_disabled(self, uid: str) -> None:
        """Asserts that the given ID is not a disabled account.

        NOTE: This method can only be called after the stub has been installed
        to a test case!

        Args:
            uid: str. The ID of the user to confirm.
        """
        self.assert_is_user(uid)
        assert self._test is not None
        self._test.assertFalse(self.get_user(uid).disabled)

    def assert_is_user_multi(self, uids: List[str]) -> None:
        """Asserts that every account with the given ids exist.

        NOTE: This method can only be called after the stub has been installed
        to a test case!

        Args:
            uids: list(str). The IDs of the users to confirm.
        """
        not_found = [uid for uid in uids if uid not in self._users_by_uid]
        assert self._test is not None
        self._test.assertEqual(
            not_found, [],
            msg='Firebase accounts not found: uids=%r' % (not_found,))

    def assert_is_not_user_multi(self, uids: List[str]) -> None:
        """Asserts that every account with the given ids do not exist.

        NOTE: This method can only be called after the stub has been installed
        to a test case!

        Args:
            uids: list(str). The IDs of the users to confirm.
        """
        found = [uid for uid in uids if uid in self._users_by_uid]
        assert self._test is not None
        self._test.assertEqual(
            found, [],
            msg='Unexpected Firebase accounts exists: uids=%r' % (found,))

    def mock_delete_users_error(
            self,
            batch_error_pattern: Tuple[Optional[Exception]] = (None,),
            individual_error_pattern: Tuple[Optional[bool]] = (None,)
    ) -> ContextManager[None]:
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
        updated_batch_error_pattern = itertools.cycle(batch_error_pattern)
        updated_individual_error_pattern = (
            itertools.cycle(individual_error_pattern))

        def mock_delete_users(
            uids: List[str], force_delete: bool = False
        ) -> firebase_auth.BatchDeleteAccountsResponse:
            """Mock function that fails according to the input patterns."""
            error_to_raise = next(updated_batch_error_pattern)
            if error_to_raise is not None:
                raise error_to_raise

            # Here we use cast because method 'utils.partition' returns a
            # broader type Tuple[Iterable[...], Iterable[...]], thus to
            # narrow down the type to 'UidsZipPartitionTupleType' we used
            # cast here.
            uids_to_delete, uids_to_fail = cast(
                UidsZipPartitionTupleType,
                utils.partition(
                    zip(uids, updated_individual_error_pattern),
                    predicate=lambda uid_and_error: uid_and_error[1] is None,
                    enumerated=True))

            updated_uids_to_delete = [uid for _, (uid, _) in uids_to_delete]
            errors = [(i, error) for i, (_, error) in uids_to_fail]

            self.delete_users(updated_uids_to_delete, force_delete=force_delete)

            return self._create_delete_users_result_fragile(errors)

        assert self._test is not None
        return self._test.swap(firebase_auth, 'delete_users', mock_delete_users)

    def mock_import_users_error(
            self,
            batch_error_pattern: Tuple[Optional[Exception]] = (None,),
            individual_error_pattern: Tuple[Optional[str]] = (None,)
    ) -> ContextManager[None]:
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
        updated_batch_error_pattern = itertools.cycle(batch_error_pattern)
        updated_individual_error_pattern = (
            itertools.cycle(individual_error_pattern))

        def mock_import_users(
                records: List[firebase_admin.auth.ImportUserRecord]
        ) -> firebase_auth.UserImportResult:
            """Mock function that fails according to the input patterns."""
            error_to_raise = next(updated_batch_error_pattern)
            if error_to_raise is not None:
                raise error_to_raise

            # Here we use cast because method 'utils.partition' returns a
            # broader type Tuple[Iterable[...], Iterable[...]], thus to
            # narrow down the type to 'RecordsPartitionTupleType' we used
            # cast here.
            records_to_import, records_to_fail = cast(
                RecordsPartitionTupleType,
                utils.partition(
                    zip(records, updated_individual_error_pattern),
                    predicate=(
                        lambda record_and_error: record_and_error[1] is None),
                    enumerated=True))

            self.import_users([record for _, (record, _) in records_to_import])

            errors = [(i, error) for i, (_, error) in records_to_fail]
            return self._create_user_import_result_fragile(
                len(records), errors=errors
            )

        assert self._test is not None
        return self._test.swap(firebase_auth, 'import_users', mock_import_users)

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

    def _create_list_users_page_fragile(
            self,
            page_list: List[List[firebase_auth.UserRecord]],
            page_index: int
    ) -> mock.Mock:
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
                '' if not page.has_next_page else str(page_index + 1))
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

    def _create_delete_users_result_fragile(
        self, errors: List[Tuple[int, str]]
    ) -> firebase_auth.BatchDeleteAccountsResponse:
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
        return firebase_auth.BatchDeleteAccountsResponse(
            errors=[{'index': i, 'message': error} for i, error in errors])

    def _create_user_import_result_fragile(
            self, total: int, errors: List[Tuple[int, str]]
    ) -> firebase_auth.UserImportResult:
        """Creates a new UserImportResult instance with the given values.

        FRAGILE! The dict keys used by the UserImportResult constructor are an
        implementation detail that may break in future versions of the SDK.

        Args:
            total: int. The total number of records initially requested.
            errors: list(tuple(int, str)). A list of (index, error) pairs.

        Returns:
            firebase_admin.auth.UserImportResult. The response.
        """
        return firebase_auth.UserImportResult({
            'error': [{'index': i, 'message': error} for i, error in errors],
        }, total)

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


