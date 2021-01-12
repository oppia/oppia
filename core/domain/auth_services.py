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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import auth_domain
from core.platform import models

auth_models, = models.Registry.import_models([models.NAMES.auth])

platform_auth_services = models.Registry.import_auth_services()


def create_profile_user_auth_details(user_id, parent_user_id):
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


def get_all_profiles_by_parent_user_id(parent_user_id):
    """Fetch the auth details of all profile users with the given parent user.

    Args:
        parent_user_id: str. The user ID of the parent user.

    Returns:
        list(UserAuthDetailsModel). List of UserAuthDetailsModel instances
        with the given parent user.
    """
    return auth_models.UserAuthDetailsModel.query(
        auth_models.UserAuthDetailsModel.parent_user_id == parent_user_id
    ).fetch()


def get_user_auth_details_from_model(user_auth_details_model):
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


def get_auth_claims_from_request(request):
    """Authenticates the request and returns claims about its authorizer.

    Args:
        request: webapp2.Request. The HTTP request to authenticate.

    Returns:
        AuthClaims|None. Claims about the currently signed in user. If no user
        is signed in, then returns None.
    """
    return platform_auth_services.get_auth_claims_from_request(request)


def mark_user_for_deletion(user_id):
    """Marks the user, and all of their auth associations, as deleted.

    Args:
        user_id: str. The unique ID of the user whose associations should be
            deleted.
    """
    platform_auth_services.mark_user_for_deletion(user_id)


def delete_external_auth_associations(user_id):
    """Deletes all associations that refer to the user outside of Oppia.

    Args:
        user_id: str. The unique ID of the user whose associations should be
            deleted.
    """
    platform_auth_services.delete_external_auth_associations(user_id)


def verify_external_auth_associations_are_deleted(user_id):
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


def get_auth_id_from_user_id(user_id):
    """Returns the auth ID associated with the given user ID.

    Args:
        user_id: str. The auth ID.

    Returns:
        str|None. The user ID associated with the given auth ID, or None if no
        association exists.
    """
    return platform_auth_services.get_auth_id_from_user_id(user_id)


def get_multi_auth_ids_from_user_ids(user_ids):
    """Returns the auth IDs associated with the given user IDs.

    Args:
        user_ids: list(str). The user IDs.

    Returns:
        list(str|None). The auth IDs associated with each of the given user IDs,
        or None for associations which don't exist.
    """
    return platform_auth_services.get_multi_auth_ids_from_user_ids(user_ids)


def get_user_id_from_auth_id(auth_id):
    """Returns the user ID associated with the given auth ID.

    Args:
        auth_id: str. The auth ID.

    Returns:
        str|None. The user ID associated with the given auth ID, or None if no
        association exists.
    """
    return platform_auth_services.get_user_id_from_auth_id(auth_id)


def get_multi_user_ids_from_auth_ids(auth_ids):
    """Returns the user IDs associated with the given auth IDs.

    Args:
        auth_ids: list(str). The auth IDs.

    Returns:
        list(str|None). The user IDs associated with each of the given auth IDs,
        or None for associations which don't exist.
    """
    return platform_auth_services.get_multi_user_ids_from_auth_ids(auth_ids)


def associate_auth_id_with_user_id(auth_id_user_id_pair):
    """Commits the association between auth ID and user ID.

    Args:
        auth_id_user_id_pair: auth_domain.AuthIdUserIdPair. The association to
            commit.

    Raises:
        Exception. The IDs are already associated with a value.
    """
    platform_auth_services.associate_auth_id_with_user_id(auth_id_user_id_pair)


def associate_multi_auth_ids_with_user_ids(auth_id_user_id_pairs):
    """Commits the associations between auth IDs and user IDs.

    Args:
        auth_id_user_id_pairs: list(auth_domain.AuthIdUserIdPair). The
            associations to commit.

    Raises:
        Exception. One or more auth associations already exist.
    """
    platform_auth_services.associate_multi_auth_ids_with_user_ids(
        auth_id_user_id_pairs)
