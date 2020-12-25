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

"""Service layer for handling user-authentication with Firebase.

Oppia depends on OpenID Connect 1.0 to handle user authentication. We use
[Firebase authentication](https://firebase.google.com/docs/auth) to do the
heavy-lifting, especially for securely storing user credentials and associating
users to their identity providers. This helps us minimize the contact we make
with private information.

Terminology:
    OpenID Connect 1.0 (OIDC):
        A simple identity layer on top of the OAuth 2.0 protocol. It is a
        specification (i.e. a strict set of algorithms, data structures, and
        rules) that defines how two parties must share data about a user in
        a secure way on that user's behalf.
    OAuth 2.0 (OAuth):
        The industry-standard protocol for authorization. It enables a
        third-party application to obtain limited access to an HTTP service on
        behalf of a user.
    Claim:
        A piece of information about a user (name, address, phone number, etc.)
        that has been encrypted and digitally signed.
    JSON Web Token (JWT):
        A compact and URL-safe protocol primarily designed to send Claims
        between two parties. Claims are organized into JSON objects that map
        "Claim Names" to "Claim Values".
    Identity provider:
        An entity that creates, maintains, and manages identity information and
        provides authentication services. Such services rely on JWTs to send
        identity information. Examples of identity providers include: Google,
        Facebook, Email verification links, and Text message SMS codes.
    Subject Identifier:
        A Claim that can uniquely identify a user. It is locally unique and
        never reassigned with respect to the provider who issued it. The Claim's
        name is 'sub'.
        Example values: `24400320` or `AItOawmwtWwcT0k51BayewNvutrJUqsvl6qs7A4`.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core.platform import models
import python_utils

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import exceptions as firebase_exceptions

auth_models, = models.Registry.import_models([models.NAMES.auth])
transaction_services = models.Registry.import_transaction_services()


def _initialize_firebase():
    """Initializes the Firebase Admin SDK, returns True when successful.
    Otherwise, logs the failure reason and returns False.
    """
    try:
        firebase_admin.initialize_app()
    except (ValueError, firebase_exceptions.FirebaseError) as e:
        logging.exception(e)
        return False
    else:
        return True


def authenticate_request(request):
    """Authenticates the request and returns the user who authorized it, if any.

    Oppia follows the OAuth Bearer authentication scheme.

    Bearer authentication (a.k.a. token authentication) is an HTTP
    authentication scheme based on "bearer tokens", an encrypted JWT generated
    by a trusted identity provider in response to login requests.

    The name "Bearer authentication" can be understood as: "give access to the
    bearer of this token." These tokens _must_ be sent in the `Authorization`
    header of HTTP requests, and _must_ have the format: `Bearer <token>`.

    Oppia specifically expects the token to have a Subject Identifier for the
    user (Claim Name: 'sub').

    Learn more about:
        HTTP authentication schemes:
            https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication
        OAuth 2.0 Bearer authentication scheme:
            https://oauth.net/2/bearer-tokens/
        OpenID Connect 1.0 ID Tokens:
            https://openid.net/specs/openid-connect-core-1_0.html#IDToken

    Args:
        request: webapp2.Request. The HTTP request to inspect.

    Returns:
        str|None. The ID of the user that authorized the request. If the request
        could not be authenticated, then returns None instead.
    """
    if not _initialize_firebase():
        return None

    scheme, _, token = request.headers.get('Authorization', '').partition(' ')
    if scheme != 'Bearer':
        return None

    try:
        claims = firebase_auth.verify_id_token(token)
    except (ValueError, firebase_exceptions.FirebaseError) as e:
        logging.exception(e)
        return None
    else:
        return claims.get('sub', None)


def get_user_id_from_auth_id(auth_id):
    """Returns the user ID associated with the given auth ID.

    Args:
        auth_id: str. The auth ID.

    Returns:
        str|None. The user ID associated with the given auth ID, or None if no
        association exists.
    """
    model = auth_models.UserIdByFirebaseAuthIdModel.get(auth_id, strict=False)
    return None if model is None else model.user_id


def get_multi_user_ids_from_auth_ids(auth_ids):
    """Returns the user IDs associated with the given auth IDs.

    Args:
        auth_ids: list(str). The auth IDs.

    Returns:
        list(str|None). The user IDs associated with each of the given auth IDs,
        or None for associations which don't exist.
    """
    return [
        None if model is None else model.user_id
        for model in auth_models.UserIdByFirebaseAuthIdModel.get_multi(auth_ids)
    ]


@transaction_services.run_in_transaction_wrapper
def associate_auth_id_to_user_id(pair):
    """Commits the association between auth ID and user ID.

    Args:
        pair: auth_domain.AuthIdUserIdPair. The association to commit.

    Raises:
        Exception. The auth ID is already associated with a user ID.
    """
    auth_id, user_id = pair

    claimed_user_id = get_user_id_from_auth_id(auth_id)
    if claimed_user_id is not None:
        raise Exception(
            'auth_id=%r is already mapped to user_id=%r' % (
                auth_id, claimed_user_id))

    mapping = (
        auth_models.UserIdByFirebaseAuthIdModel(id=auth_id, user_id=user_id))
    mapping.update_timestamps()
    mapping.put()


@transaction_services.run_in_transaction_wrapper
def associate_multi_auth_ids_to_user_ids(pairs):
    """Commits the associations between auth IDs and user IDs.

    Args:
        pairs: list(auth_domain.AuthIdUserIdPair). The associations to commit.

    Raises:
        Exception. One or more auth ID associations already exist.
    """
    # Turn list(pair) to pair(list): https://stackoverflow.com/a/7558990/4859885
    auth_ids, user_ids = python_utils.ZIP(*pairs)

    claimed_user_ids = get_multi_user_ids_from_auth_ids(auth_ids)
    if any(user_id is not None for user_id in claimed_user_ids):
        existing_associations = sorted(
            'auth_id=%r, user_id=%r' % (auth_id, user_id)
            for auth_id, user_id in python_utils.ZIP(auth_ids, claimed_user_ids)
            if user_id is not None)
        raise Exception(
            'associations already exist for: %r' % (existing_associations,))

    mappings = [
        auth_models.UserIdByFirebaseAuthIdModel(id=auth_id, user_id=user_id)
        for auth_id, user_id in python_utils.ZIP(auth_ids, user_ids)
    ]
    auth_models.UserIdByFirebaseAuthIdModel.update_timestamps_multi(mappings)
    auth_models.UserIdByFirebaseAuthIdModel.put_multi(mappings)
