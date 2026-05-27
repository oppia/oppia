# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Stubs for the Firebase Admin SDK."""

from __future__ import annotations

import contextlib
import os

from core.domain import auth_domain
from core.platform import models

import webapp2
from typing import TYPE_CHECKING, Callable, Dict, List, Optional, Set

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        auth_models,
        datastore_services,
        platform_auth_services,
    )

if TYPE_CHECKING:
    from core.tests import test_utils

(auth_models,) = models.Registry.import_models([models.Names.AUTH])

datastore_services = models.Registry.import_datastore_services()
platform_auth_services = models.Registry.import_auth_services()


class FirebaseAdminSdkStub:
    """Test-only implementation of the public API in core.platform.auth."""

    class AuthUser:
        """Authentication user with ID and deletion status."""

        def __init__(self, user_id: str, deleted: bool = False) -> None:
            self.id = user_id
            self.deleted = deleted

        def mark_as_deleted(self) -> None:
            """Marks the user as deleted."""
            self.deleted = True

    def __init__(self) -> None:
        """Initializes a new instance that emulates an empty auth server."""
        self._user_id_by_auth_id: Dict[str, FirebaseAdminSdkStub.AuthUser] = {}
        self._external_user_id_associations: Set[str] = set()
        self._is_session_active: bool = False

    @classmethod
    def install_stub(
        cls, test: 'test_utils.GenericTestBase'
    ) -> Callable[..., None]:
        """Installs a new instance of the stub onto the given test instance.

        Args:
            test: GenericTestBase. The test instance to install the stub on.

        Returns:
            callable. A function that will uninstall the stub when called.
        """
        with contextlib.ExitStack() as stack:
            stub = cls()

            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'establish_auth_session',
                    stub.establish_auth_session,
                )
            )
            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'destroy_auth_session',
                    stub.destroy_auth_session,
                )
            )
            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'get_auth_claims_from_request',
                    stub.get_auth_claims_from_request,
                )
            )
            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'mark_user_for_deletion',
                    stub.mark_user_for_deletion,
                )
            )
            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'delete_external_auth_associations',
                    stub.delete_external_auth_associations,
                )
            )
            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'verify_external_auth_associations_are_deleted',
                    stub.verify_external_auth_associations_are_deleted,
                )
            )
            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'get_auth_id_from_user_id',
                    stub.get_auth_id_from_user_id,
                )
            )
            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'get_user_id_from_auth_id',
                    stub.get_user_id_from_auth_id,
                )
            )
            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'get_multi_user_ids_from_auth_ids',
                    stub.get_multi_user_ids_from_auth_ids,
                )
            )
            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'get_multi_auth_ids_from_user_ids',
                    stub.get_multi_auth_ids_from_user_ids,
                )
            )
            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'associate_auth_id_with_user_id',
                    stub.associate_auth_id_with_user_id,
                )
            )
            stack.enter_context(
                test.swap(
                    platform_auth_services,
                    'associate_multi_auth_ids_with_user_ids',
                    stub.associate_multi_auth_ids_with_user_ids,
                )
            )

            close = stack.pop_all().close
        return close

    def establish_auth_session(
        self, _: webapp2.Request, __: webapp2.Response
    ) -> None:
        """Sets login cookies to maintain a user's sign-in session."""
        self._is_session_active = True

    def destroy_auth_session(self, _: webapp2.Response) -> None:
        """Clears login cookies from the given response headers."""
        self._is_session_active = False

    def get_auth_claims_from_request(
        self, _: webapp2.Request
    ) -> Optional[auth_domain.AuthClaims]:
        """Authenticates the request and returns claims about its authorizer."""
        if not self._is_session_active:
            return None

        auth_id = os.environ.get('USER_ID', '')
        email = os.environ.get('USER_EMAIL', '')
        role_is_super_admin = os.environ.get('USER_IS_ADMIN', '0') == '1'
        if auth_id:
            return auth_domain.AuthClaims(auth_id, email, role_is_super_admin)
        return None

    def mark_user_for_deletion(self, user_id: str) -> None:
        """Marks the user, and all of their auth associations, as deleted.

        Since the stub does not use models, this operation actually deletes the
        user's association. The "external" associations, however, are not
        deleted yet.

        Args:
            user_id: str. The unique ID of the user whose associations should be
                deleted.
        """
        for user in self._user_id_by_auth_id.values():
            if user.id == user_id:
                user.mark_as_deleted()

    def delete_external_auth_associations(self, user_id: str) -> None:
        """Deletes all associations that refer to the user outside of Oppia.

        Args:
            user_id: str. The unique ID of the user whose associations should be
                deleted.
        """
        self._external_user_id_associations.discard(user_id)

    def verify_external_auth_associations_are_deleted(
        self, user_id: str
    ) -> bool:
        """Returns true if and only if we have successfully verified that all
        external associations have been deleted.

        Args:
            user_id: str. The unique ID of the user whose associations should be
                checked.

        Returns:
            bool. True if and only if we have successfully verified that all
            external associations have been deleted.
        """
        return user_id not in self._external_user_id_associations

    def get_auth_id_from_user_id(self, user_id: str) -> Optional[str]:
        """Returns the auth ID associated with the given user ID.

        Args:
            user_id: str. The user ID.

        Returns:
            str|None. The auth ID associated with the given user ID, or None if
            no association exists.
        """
        for auth_id, user in self._user_id_by_auth_id.items():
            if user.id == user_id and not user.deleted:
                return auth_id
        return None

    def get_user_id_from_auth_id(
        self, auth_id: str, include_deleted: bool = False
    ) -> Optional[str]:
        """Returns the user ID associated with the given auth ID.

        Args:
            auth_id: str. The auth ID.
            include_deleted: bool. Whether to return the ID of models marked for
                deletion.

        Returns:
            str|None. The user ID associated with the given auth ID, or None if
            no association exists.
        """
        user = self._user_id_by_auth_id.get(auth_id, None)
        if user is None:
            return None

        if include_deleted or not user.deleted:
            return user.id

        return None

    def get_multi_user_ids_from_auth_ids(
        self, auth_ids: List[str]
    ) -> List[Optional[str]]:
        """Returns the user IDs associated with the given auth IDs.

        Args:
            auth_ids: list(str). The auth IDs.

        Returns:
            list(str|None). The user IDs associated with each of the given auth
            IDs, or None for associations which don't exist.
        """
        return [self.get_user_id_from_auth_id(auth_id) for auth_id in auth_ids]

    def get_multi_auth_ids_from_user_ids(
        self, user_ids: List[str]
    ) -> List[Optional[str]]:
        """Returns the auth IDs associated with the given user IDs.

        Args:
            user_ids: list(str). The user IDs.

        Returns:
            list(str|None). The auth IDs associated with each of the given user
            IDs, or None for associations which don't exist.
        """
        auth_id_by_user_id = {
            user.id: auth_id
            for auth_id, user in self._user_id_by_auth_id.items()
        }
        return [auth_id_by_user_id.get(user_id, None) for user_id in user_ids]

    def associate_auth_id_with_user_id(
        self, auth_id_user_id_pair: auth_domain.AuthIdUserIdPair
    ) -> None:
        """Commits the association between auth ID and user ID.

        This method also adds the user to the "external" set of associations.

        Args:
            auth_id_user_id_pair: auth_domain.AuthIdUserIdPair. The association
                to commit.

        Raises:
            Exception. The IDs are already associated with a value.
        """
        auth_id, user_id = auth_id_user_id_pair
        if auth_id in self._user_id_by_auth_id:
            raise Exception(
                'auth_id=%r is already associated with user_id=%r'
                % (auth_id, self._user_id_by_auth_id[auth_id].id)
            )
        auth_models.UserAuthDetailsModel(
            id=user_id, firebase_auth_id=auth_id
        ).put()
        self._external_user_id_associations.add(user_id)
        self._user_id_by_auth_id[auth_id] = FirebaseAdminSdkStub.AuthUser(
            user_id
        )

    def associate_multi_auth_ids_with_user_ids(
        self, auth_id_user_id_pairs: List[auth_domain.AuthIdUserIdPair]
    ) -> None:
        """Commits the associations between auth IDs and user IDs.

        This method also adds the users to the "external" set of associations.

        Args:
            auth_id_user_id_pairs: list(auth_domain.AuthIdUserIdPair). The
                associations to commit.

        Raises:
            Exception. One or more auth associations already exist.
        """
        collisions = ', '.join(
            '{auth_id=%r: user_id=%r}' % (a, self._user_id_by_auth_id[a].id)
            for a, _ in auth_id_user_id_pairs
            if a in self._user_id_by_auth_id
        )
        if collisions:
            raise Exception('already associated: %s' % collisions)
        datastore_services.put_multi(
            [
                auth_models.UserAuthDetailsModel(
                    id=user_id, firebase_auth_id=auth_id
                )
                for auth_id, user_id in auth_id_user_id_pairs
            ]
        )
        external_user_ids: Set[str] = {u for _, u in auth_id_user_id_pairs}
        self._external_user_id_associations.update(external_user_ids)
        auth_id_user_id_pairs_with_deletion = {
            auth_id: FirebaseAdminSdkStub.AuthUser(user_id)
            for auth_id, user_id in auth_id_user_id_pairs
        }
        self._user_id_by_auth_id.update(auth_id_user_id_pairs_with_deletion)
