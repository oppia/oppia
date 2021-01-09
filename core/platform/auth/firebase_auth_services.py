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

import contextlib
import logging

from core.domain import auth_domain
from core.platform import models
import feconf
import python_utils

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import exceptions as firebase_exceptions

auth_models, = models.Registry.import_models([models.NAMES.auth])

transaction_services = models.Registry.import_transaction_services()


@contextlib.contextmanager
def _acquire_firebase_context():
    """Returns a context for calling the Firebase Admin SDK."""
    app = firebase_admin.initialize_app()
    try:
        yield
    finally:
        if app is not None:
            firebase_admin.delete_app(app)


def _verify_id_token(auth_header):
    """Verifies whether auth_header has a valid Firebase-provided ID token.

    Oppia's authorization headers use OAuth 2.0's Bearer authentication scheme.

    Bearer authentication (a.k.a. token authentication) is an HTTP
    authentication scheme based on "bearer tokens", an encrypted JWT generated
    by a trusted identity provider in response to login requests.

    The name "Bearer authentication" can be understood as: "give access to the
    bearer of this token." These tokens _must_ be sent in the `Authorization`
    header of HTTP requests, and _must_ have the format: `Bearer <token>`.

    Learn more about:
        HTTP authentication schemes:
            https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication
        OAuth 2.0 Bearer authentication scheme:
            https://oauth.net/2/bearer-tokens/
        OpenID Connect 1.0 ID Tokens:
            https://openid.net/specs/openid-connect-core-1_0.html#IDToken

    Args:
        auth_header: str. The Authorization header taken from the request.

    Returns:
        dict(str: *). The Claims embedded into the Authorization header if
        valid. Otherwise, returns an empty dict.
    """
    scheme, _, token = auth_header.partition(' ')
    if scheme != 'Bearer':
        return {}
    try:
        with _acquire_firebase_context():
            return firebase_auth.verify_id_token(token)
    except (ValueError, firebase_exceptions.FirebaseError) as e:
        logging.exception(e)
        return {}


def create_user_auth_details(user_id, auth_id):
    """Returns a UserAuthDetails object configured with Firebase properties.

    Args:
        user_id: str. The unique ID of the user.
        auth_id: str. The ID of the user retrieved from Firebase.

    Returns:
        UserAuthDetails. A UserAuthDetails domain object.
    """
    return auth_domain.UserAuthDetails(user_id, firebase_auth_id=auth_id)


def get_auth_claims_from_request(request):
    """Authenticates request and returns claims about its authorizer.

    Oppia specifically expects the request to have a Subject Identifier for the
    user (Claim Name: 'sub'), and an optional custom claim for super-admin users
    (Claim Name: 'role').

    Args:
        request: webapp2.Request. The HTTP request to authenticate.

    Returns:
        AuthClaims|None. Claims about the user who authorized the request, or
        None if the request could not be authenticated.
    """
    claims = _verify_id_token(request.headers.get('Authorization', ''))
    auth_id = claims.get('sub', None)
    email = claims.get('email', None)
    role_is_super_admin = (
        claims.get('role', None) == feconf.FIREBASE_ROLE_SUPER_ADMIN)
    if auth_id:
        return auth_domain.AuthClaims(auth_id, email, role_is_super_admin)
    return None


def mark_user_for_deletion(user_id):
    """Set the 'deleted' property of the user with given user_id to True, and
    disables the user's Firebase account so that they cannot use it to sign in.

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
        auth_models.UserIdByFirebaseAuthIdModel.get_by_user_id(user_id)
        if assoc_by_user_id_model is None else
        auth_models.UserIdByFirebaseAuthIdModel.get(
            assoc_by_user_id_model.firebase_auth_id, strict=False))

    if assoc_by_auth_id_model is not None:
        assoc_by_auth_id_model.deleted = True
        assoc_by_auth_id_model.update_timestamps()
        assoc_by_auth_id_model.put()

    try:
        with _acquire_firebase_context():
            firebase_auth.update_user(assoc_by_auth_id_model.id, disabled=True)
    except (ValueError, firebase_exceptions.FirebaseError) as e:
        logging.exception(e)


def delete_external_auth_associations(user_id):
    """Deletes associations outside of Oppia that refer to the given user.

    Args:
        user_id: str. The unique ID of the user whose associations should be
            deleted.
    """
    auth_id = get_auth_id_from_user_id(user_id)
    if auth_id is None:
        return
    try:
        with _acquire_firebase_context():
            firebase_auth.delete_user(auth_id)
    except (ValueError, firebase_exceptions.FirebaseError) as e:
        logging.exception(e)


def are_external_auth_associations_deleted(user_id):
    """Returns whether all associations outside of Oppia referring to the given
    user have been deleted.

    Args:
        user_id: str. The unique ID of the user whose associations should be
            deleted.

    Returns:
        bool. Whether all associations outside of Oppia referring to the given
        user have been deleted.
    """
    auth_id = get_auth_id_from_user_id(user_id)
    if auth_id is None:
        return True
    try:
        with _acquire_firebase_context():
            firebase_auth.get_user(auth_id)
    except firebase_auth.UserNotFoundError:
        return True
    except (ValueError, firebase_exceptions.FirebaseError) as e:
        logging.exception(e)
    return False


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
        assoc_by_user_id_model.firebase_auth_id)


def get_user_id_from_auth_id(auth_id):
    """Returns the user ID associated with the given auth ID.

    Args:
        auth_id: str. The auth ID.

    Returns:
        str|None. The user ID associated with the given auth ID, or None if no
        association exists.
    """
    assoc_by_auth_id_model = (
        auth_models.UserIdByFirebaseAuthIdModel.get(auth_id, strict=False))
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
    return [
        None if model is None else model.user_id
        for model in auth_models.UserIdByFirebaseAuthIdModel.get_multi(auth_ids)
    ]


@transaction_services.run_in_transaction_wrapper
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
        auth_models.UserIdByFirebaseAuthIdModel(id=auth_id, user_id=user_id))
    assoc_by_auth_id_model.update_timestamps()
    assoc_by_auth_id_model.put()

    assoc_by_user_id_model = (
        auth_models.UserAuthDetailsModel.get(user_id, strict=False))
    # Do not depend on the non-platform layers to create these models because
    # they are required by firebase_auth_services.
    if (assoc_by_user_id_model is None or
            assoc_by_user_id_model.firebase_auth_id is None):
        assoc_by_user_id_model = auth_models.UserAuthDetailsModel(
            id=user_id, firebase_auth_id=auth_id)
        assoc_by_user_id_model.update_timestamps()
        assoc_by_user_id_model.put()


@transaction_services.run_in_transaction_wrapper
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
        auth_models.UserIdByFirebaseAuthIdModel(id=auth_id, user_id=user_id)
        for auth_id, user_id in python_utils.ZIP(auth_ids, user_ids)
    ]
    auth_models.UserIdByFirebaseAuthIdModel.update_timestamps_multi(
        assoc_by_auth_id_models)
    auth_models.UserIdByFirebaseAuthIdModel.put_multi(assoc_by_auth_id_models)

    assoc_by_user_id_models = [
        auth_models.UserAuthDetailsModel(id=user_id, firebase_auth_id=auth_id)
        for auth_id, user_id, assoc_by_user_id_model in python_utils.ZIP(
            auth_ids, user_ids,
            auth_models.UserAuthDetailsModel.get_multi(user_ids))
        if (assoc_by_user_id_model is None or
            assoc_by_user_id_model.firebase_auth_id is None)
    ]
    # Do not depend on the non-platform layers to create these models because
    # they are required by firebase_auth_services.
    if assoc_by_user_id_models:
        auth_models.UserAuthDetailsModel.update_timestamps_multi(
            assoc_by_user_id_models)
        auth_models.UserAuthDetailsModel.put_multi(assoc_by_user_id_models)
