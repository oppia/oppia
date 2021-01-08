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

"""Service layer for handling user-authentication with GAE's built-in system."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import auth_domain
from core.platform import models
import python_utils

from google.appengine.api import users

auth_models, = models.Registry.import_models([models.NAMES.auth])


def get_auth_claims_from_request(unused_request):
    """Authenticates request and returns claims about its authorizer.

    Args:
        unused_request: webapp2.Request. Unused because Google AppEngine handles
            user authentication internally.

    Returns:
        AuthClaims|None. Claims about the currently signed in user. If no user
        is signed in, then returns None.
    """
    gae_user = users.get_current_user()
    if gae_user is not None:
        return auth_domain.AuthClaims(
            gae_user.user_id(), gae_user.email(), users.is_current_user_admin())
    return None


def mark_user_for_deletion(user_id):
    """Set the 'deleted' property of the user with given user_id to True.

    Args:
        user_id: str. The unique ID of the user who should be deleted.
    """
    assoc_by_user_id_model = (
        auth_models.UserAuthDetailsModel.get(user_id, strict=False))

    if assoc_by_user_id_model is not None:
        assoc_by_user_id_model.deleted = True
        assoc_by_user_id_model.update_timestamps()
        assoc_by_user_id_model.put()

    assoc_by_auth_id_model = (
        auth_models.UserIdentifiersModel.get_by_user_id(user_id)
        if assoc_by_user_id_model is None else
        auth_models.UserIdentifiersModel.get(
            assoc_by_user_id_model.gae_id, strict=False))

    if assoc_by_auth_id_model is not None:
        assoc_by_auth_id_model.deleted = True
        assoc_by_auth_id_model.update_timestamps()
        assoc_by_auth_id_model.put()


def delete_auth_associations(unused_user_id):
    """Deletes associations outside of Oppia that refer to the given user.

    There are no associations to GAE models managed outside of Oppia.

    Args:
        unused_user_id: str. The unique ID of the user whose associations should
            be deleted.
    """
    pass


def are_auth_associations_deleted(unused_user_id):
    """Returns whether all associations outside of Oppia referring to the given
    user have been deleted.

    There are no associations to GAE models managed outside of Oppia, so always
    returns True.

    Args:
        unused_user_id: str. The unique ID of the user whose associations should
            be deleted.

    Returns:
        bool. Whether all associations outside of Oppia referring to the given
        user have been deleted.
    """
    return True


def get_auth_id_from_user_id(user_id):
    """Returns the auth ID associated with the given user ID.

    Args:
        user_id: str. The auth ID.

    Returns:
        str|None. The user ID associated with the given auth ID, or None if no
        association exists.
    """
    assoc_by_user_id_model = (
        auth_models.UserAuthDetailsModel.get(user_id, strict=False))
    return (
        None if assoc_by_user_id_model is None else
        assoc_by_user_id_model.gae_id)


def get_user_id_from_auth_id(auth_id):
    """Returns the user ID associated with the given auth ID.

    Args:
        auth_id: str. The auth ID.

    Returns:
        str|None. The user ID associated with the given auth ID, or None if no
        association exists.
    """
    assoc_by_auth_id_model = (
        auth_models.UserIdentifiersModel.get(auth_id, strict=False))
    return (
        None if assoc_by_auth_id_model is None else
        assoc_by_auth_id_model.user_id)


def get_multi_user_ids_from_auth_ids(auth_ids):
    """Returns the user IDs associated with the given auth IDs.

    Args:
        auth_ids: list(str). The auth IDs.

    Returns:
        list(str|None). The user IDs associated with each of the given auth IDs,
        or None for associations which don't exist.
    """
    assoc_by_auth_id_models = auth_models.UserIdentifiersModel.get_multi(
        auth_ids, include_deleted=True)
    return [None if m is None else m.user_id for m in assoc_by_auth_id_models]


def associate_auth_id_to_user_id(auth_id_user_id_pair):
    """Commits the association between auth ID and user ID.

    Args:
        auth_id_user_id_pair: auth_domain.AuthIdUserIdPair. The association to
            commit.

    Raises:
        Exception. The auth ID is already associated with a user ID.
    """
    auth_id, user_id = auth_id_user_id_pair

    collision = get_user_id_from_auth_id(auth_id)
    if collision is not None:
        raise Exception('auth_id=%r is already associated to user_id=%r' % (
            auth_id, collision))

    assoc_by_auth_id_model = (
        auth_models.UserIdentifiersModel(id=auth_id, user_id=user_id))
    assoc_by_auth_id_model.update_timestamps()
    assoc_by_auth_id_model.put()

    assoc_by_user_id_model = (
        auth_models.UserAuthDetailsModel(id=user_id, gae_id=auth_id))
    assoc_by_user_id_model.update_timestamps()
    assoc_by_user_id_model.put()


def associate_multi_auth_ids_to_user_ids(auth_id_user_id_pairs):
    """Commits the associations between auth IDs and user IDs.

    Args:
        auth_id_user_id_pairs: list(auth_domain.AuthIdUserIdPair). The
            associations to commit.

    Raises:
        Exception. One or more auth ID associations already exist.
    """
    # Turn list(pair) to pair(list): https://stackoverflow.com/a/7558990/4859885
    auth_ids, user_ids = python_utils.ZIP(*auth_id_user_id_pairs)

    collisions = get_multi_user_ids_from_auth_ids(auth_ids)
    if any(user_id is not None for user_id in collisions):
        collisions = ', '.join(
            '{auth_id=%r: user_id=%r}' % (auth_id, user_id)
            for auth_id, user_id in python_utils.ZIP(auth_ids, collisions)
            if user_id is not None)
        raise Exception('already associated: %s' % collisions)

    assoc_by_auth_id_models = [
        auth_models.UserIdentifiersModel(id=auth_id, user_id=user_id)
        for auth_id, user_id in python_utils.ZIP(auth_ids, user_ids)
    ]
    auth_models.UserIdentifiersModel.update_timestamps_multi(
        assoc_by_auth_id_models)
    auth_models.UserIdentifiersModel.put_multi(assoc_by_auth_id_models)

    assoc_by_user_id_models = [
        auth_models.UserAuthDetailsModel(id=user_id, gae_id=auth_id)
        for auth_id, user_id in python_utils.ZIP(auth_ids, user_ids)
    ]
    auth_models.UserAuthDetailsModel.update_timestamps_multi(
        assoc_by_user_id_models)
    auth_models.UserAuthDetailsModel.put_multi(assoc_by_user_id_models)
