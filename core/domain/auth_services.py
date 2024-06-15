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

"""Services for managing user authentication."""

from __future__ import annotations

import base64
import os

from core.domain import auth_domain
from core.domain import caching_services
from core.platform import models
from core.platform.auth import firebase_auth_services

from typing import Final, List, Optional
import webapp2

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import auth_models
    from mypy_imports import platform_auth_services

auth_models, = models.Registry.import_models([models.Names.AUTH])

platform_auth_services = models.Registry.import_auth_services()

# NOTE TO DEVELOPERS: Don't modify this constant since it is used to
# identify a specific datastore entity in production.
CSRF_SECRET_INSTANCE_ID: Final = 'csrf_secret'


def create_profile_user_auth_details(
    user_id: str, parent_user_id: str
) -> auth_domain.UserAuthDetails:
    """Returns a domain object for a new profile user.

    Args:
        user_id: str. A user ID produced by Oppia for the new profile user.
        parent_user_id: str. The user ID of the full user account which will own
            the new profile account.

    Returns:
        UserAuthDetails. Auth details for the new user.

    Raises:
        ValueError. The new user's parent is itself.
    """
    if user_id == parent_user_id:
        raise ValueError('user cannot be its own parent')
    return auth_domain.UserAuthDetails(user_id, None, None, parent_user_id)


def get_all_profiles_by_parent_user_id(
    parent_user_id: str
) -> List[auth_models.UserAuthDetailsModel]:
    """Fetch the auth details of all profile users with the given parent user.

    Args:
        parent_user_id: str. The user ID of the parent user.

    Returns:
        list(UserAuthDetailsModel). List of UserAuthDetailsModel instances
        with the given parent user.
    """
    return list(
        auth_models.UserAuthDetailsModel.query(
            auth_models.UserAuthDetailsModel.parent_user_id == parent_user_id
        ).fetch()
    )


def establish_auth_session(
    request: webapp2.Request,
    response: webapp2.Response
) -> None:
    """Sets login cookies to maintain a user's sign-in session.

    Args:
        request: webapp2.Request. The request with the authorization to begin a
            new session.
        response: webapp2.Response. The response to establish the new session
            upon.
    """
    platform_auth_services.establish_auth_session(request, response)


def destroy_auth_session(response: webapp2.Response) -> None:
    """Clears login cookies from the given response headers.

    Args:
        response: webapp2.Response. Response to clear the cookies from.
    """
    platform_auth_services.destroy_auth_session(response)


def get_user_auth_details_from_model(
    user_auth_details_model: auth_models.UserAuthDetailsModel
) -> auth_domain.UserAuthDetails:
    """Returns a UserAuthDetails domain object from the given model.

    Args:
        user_auth_details_model: UserAuthDetailsModel. The source model.

    Returns:
        UserAuthDetails. The domain object with values taken from the model.
    """
    return auth_domain.UserAuthDetails(
        user_auth_details_model.id,
        user_auth_details_model.gae_id,
        user_auth_details_model.firebase_auth_id,
        user_auth_details_model.parent_user_id,
        deleted=user_auth_details_model.deleted)


def get_auth_claims_from_request(
    request: webapp2.Request
) -> Optional[auth_domain.AuthClaims]:
    """Authenticates the request and returns claims about its authorizer.

    Args:
        request: webapp2.Request. The HTTP request to authenticate.

    Returns:
        AuthClaims|None. Claims about the currently signed in user. If no user
        is signed in, then returns None.

    Raises:
        InvalidAuthSessionError. The request contains an invalid session.
        StaleAuthSessionError. The cookie has lost its authority.
    """
    return platform_auth_services.get_auth_claims_from_request(request)


def mark_user_for_deletion(user_id: str) -> None:
    """Marks the user, and all of their auth associations, as deleted.

    Args:
        user_id: str. The unique ID of the user whose associations should be
            deleted.
    """
    platform_auth_services.mark_user_for_deletion(user_id)


def delete_external_auth_associations(user_id: str) -> None:
    """Deletes all associations that refer to the user outside of Oppia.

    Args:
        user_id: str. The unique ID of the user whose associations should be
            deleted.
    """
    platform_auth_services.delete_external_auth_associations(user_id)


def verify_external_auth_associations_are_deleted(user_id: str) -> bool:
    """Returns true if and only if we have successfully verified that all
    external associations have been deleted.

    Args:
        user_id: str. The unique ID of the user whose associations should be
            checked.

    Returns:
        bool. True if and only if we have successfully verified that all
        external associations have been deleted.
    """
    return platform_auth_services.verify_external_auth_associations_are_deleted(
        user_id)


def get_auth_id_from_user_id(user_id: str) -> Optional[str]:
    """Returns the auth ID associated with the given user ID.

    Args:
        user_id: str. The auth ID.

    Returns:
        str|None. The user ID associated with the given auth ID, or None if no
        association exists.
    """
    return platform_auth_services.get_auth_id_from_user_id(user_id)


def get_multi_auth_ids_from_user_ids(
    user_ids: List[str]
) -> List[Optional[str]]:
    """Returns the auth IDs associated with the given user IDs.

    Args:
        user_ids: list(str). The user IDs.

    Returns:
        list(str|None). The auth IDs associated with each of the given user IDs,
        or None for associations which don't exist.
    """
    return platform_auth_services.get_multi_auth_ids_from_user_ids(user_ids)


def get_user_id_from_auth_id(
    auth_id: str,
    include_deleted: bool = False
) -> Optional[str]:
    """Returns the user ID associated with the given auth ID.

    Args:
        auth_id: str. The auth ID.
        include_deleted: bool. Whether to return the ID of models marked for
            deletion.

    Returns:
        str|None. The user ID associated with the given auth ID, or None if no
        association exists.
    """
    return platform_auth_services.get_user_id_from_auth_id(
        auth_id, include_deleted=include_deleted)


def get_multi_user_ids_from_auth_ids(
    auth_ids: List[str]
) -> List[Optional[str]]:
    """Returns the user IDs associated with the given auth IDs.

    Args:
        auth_ids: list(str). The auth IDs.

    Returns:
        list(str|None). The user IDs associated with each of the given auth IDs,
        or None for associations which don't exist.
    """
    return platform_auth_services.get_multi_user_ids_from_auth_ids(auth_ids)


def associate_auth_id_with_user_id(
    auth_id_user_id_pair: auth_domain.AuthIdUserIdPair
) -> None:
    """Commits the association between auth ID and user ID.

    Args:
        auth_id_user_id_pair: auth_domain.AuthIdUserIdPair. The association to
            commit.

    Raises:
        Exception. The IDs are already associated with a value.
    """
    platform_auth_services.associate_auth_id_with_user_id(auth_id_user_id_pair)


def associate_multi_auth_ids_with_user_ids(
    auth_id_user_id_pairs: List[auth_domain.AuthIdUserIdPair]
) -> None:
    """Commits the associations between auth IDs and user IDs.

    Args:
        auth_id_user_id_pairs: list(auth_domain.AuthIdUserIdPair). The
            associations to commit.

    Raises:
        Exception. One or more auth associations already exist.
    """
    platform_auth_services.associate_multi_auth_ids_with_user_ids(
        auth_id_user_id_pairs)


def grant_super_admin_privileges(user_id: str) -> None:
    """Grants the user super admin privileges.

    Args:
        user_id: str. The Oppia user ID to promote to super admin.
    """
    firebase_auth_services.grant_super_admin_privileges(user_id)


def revoke_super_admin_privileges(user_id: str) -> None:
    """Revokes the user's super admin privileges.

    Args:
        user_id: str. The Oppia user ID to revoke privileges from.
    """
    firebase_auth_services.revoke_super_admin_privileges(user_id)


def get_csrf_secret_value() -> str:
    """Returns the CSRF secret value. If this value does not exist,
    creates a new secret value and returns it.

    Returns:
        str. Returns the csrf secret value.
    """
    memcached_items = caching_services.get_multi(
        caching_services.CACHE_NAMESPACE_DEFAULT,
        None,
        [CSRF_SECRET_INSTANCE_ID]
    )
    if CSRF_SECRET_INSTANCE_ID in memcached_items:
        csrf_value = memcached_items[CSRF_SECRET_INSTANCE_ID]
        # Ruling out the possibility for csrf_value of being type other
        # than str in order to avoid mypy error.
        assert isinstance(csrf_value, str)
        return csrf_value

    csrf_secret_model = auth_models.CsrfSecretModel.get(
        CSRF_SECRET_INSTANCE_ID, strict=False)

    if csrf_secret_model is None:
        csrf_secret_value = base64.urlsafe_b64encode(os.urandom(20)).decode()
        auth_models.CsrfSecretModel(
            id=CSRF_SECRET_INSTANCE_ID,
            oppia_csrf_secret=csrf_secret_value
        ).put()
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT,
            None,
            {
                CSRF_SECRET_INSTANCE_ID: csrf_secret_value
            }
        )
        csrf_secret_model = auth_models.CsrfSecretModel.get(
            CSRF_SECRET_INSTANCE_ID, strict=False)

    # Ruling out the possibility of csrf_secret_model being None in
    # order to avoid mypy error.
    assert csrf_secret_model is not None
    csrf_secret_value = csrf_secret_model.oppia_csrf_secret
    # Ruling out the possibility for csrf_secret_value of being type other
    # than str in order to avoid mypy error.
    assert isinstance(csrf_secret_value, str)
    return csrf_secret_value
