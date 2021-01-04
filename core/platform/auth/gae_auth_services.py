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
import feconf
import python_utils

from google.appengine.api import users

user_models, = models.Registry.import_models([models.NAMES.user])


def get_provider_id():
    """Returns the name of the provider for these services."""
    return feconf.GAE_AUTH_PROVIDER_ID


def get_auth_claims_from_request(unused_request):
    """Returns Claims for the user currently signed-in and sending requests.

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


def disable_auth_associations(user_id):
    """Disable the auth associations of the given user so they can't be used."""
    assoc_model = user_models.UserIdentifiersModel.get_by_user_id(user_id)
    if assoc_model is not None:
        assoc_model.deleted = True
        assoc_model.update_timestamps()
        assoc_model.put()


def delete_auth_associations(unused_user_id):
    """No special action is necessary for deleting Google AppEngine users."""
    pass


def are_auth_associations_deleted(unused_user_id):
    """No special action is necessary for deleting Google AppEngine users."""
    return True


def get_user_id_from_auth_id(auth_id):
    """Returns the user ID associated with the given auth ID."""
    assoc_model = user_models.UserIdentifiersModel.get_by_gae_id(auth_id)
    return None if assoc_model is None else assoc_model.user_id


def get_multi_user_ids_from_auth_ids(auth_ids):
    """Returns the user IDs associated with the given auth IDs."""
    assoc_models = user_models.UserIdentifiersModel.get_multi(
        auth_ids, include_deleted=True)
    return [None if m is None else m.user_id for m in assoc_models]


def associate_auth_id_to_user_id(auth_id_user_id_pair):
    """Commits the association between auth ID and user ID."""
    auth_id, user_id = auth_id_user_id_pair

    collision = get_user_id_from_auth_id(auth_id)
    if collision is not None:
        raise Exception('auth_id=%r is already associated to user_id=%r' % (
            auth_id, collision))

    assoc_model = user_models.UserIdentifiersModel(id=auth_id, user_id=user_id)
    assoc_model.update_timestamps()
    assoc_model.put()


def associate_multi_auth_ids_to_user_ids(auth_id_user_id_pairs):
    """Commits the associations between auth IDs and user IDs."""
    # Turn list(pair) to pair(list): https://stackoverflow.com/a/7558990/4859885
    auth_ids, user_ids = python_utils.ZIP(*auth_id_user_id_pairs)

    collisions = get_multi_user_ids_from_auth_ids(auth_ids)
    if any(user_id is not None for user_id in collisions):
        collisions = ', '.join(
            '{auth_id=%r: user_id=%r}' % (auth_id, user_id)
            for auth_id, user_id in python_utils.ZIP(auth_ids, collisions)
            if user_id is not None)
        raise Exception('already associated: %s' % collisions)

    assoc_models = [
        user_models.UserIdentifiersModel(id=auth_id, user_id=user_id)
        for auth_id, user_id in python_utils.ZIP(auth_ids, user_ids)
    ]
    user_models.UserIdentifiersModel.update_timestamps_multi(assoc_models)
    user_models.UserIdentifiersModel.put_multi(assoc_models)
