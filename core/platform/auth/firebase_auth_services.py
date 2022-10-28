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

from __future__ import annotations

import logging

from core import feconf
from core.constants import constants
from core.domain import auth_domain
from core.platform import models

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import exceptions as firebase_exceptions
from typing import List, Optional
import webapp2

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import auth_models

auth_models, user_models = (
    models.Registry.import_models([models.Names.AUTH, models.Names.USER]))

transaction_services = models.Registry.import_transaction_services()


def establish_firebase_connection() -> None:
    """Establishes the connection to Firebase needed by the rest of the SDK.

    All Firebase operations require an "app", the abstraction used for a
    Firebase server connection. The initialize_app() function raises an error
    when it's called more than once, however, so we make this function
    idempotent by trying to "get" the app first.

    Returns:
        firebase_admin.App. The App being by the Firebase SDK.

    Raises:
        ValueError. The Firebase app has a genuine problem.
    """
    try:
        firebase_admin.get_app()
    except ValueError as error:
        if 'initialize_app' in str(error):
            firebase_admin.initialize_app(
                options={'projectId': feconf.OPPIA_PROJECT_ID})
        else:
            raise


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
    claims = _get_auth_claims_from_session_cookie(_get_session_cookie(request))

    # If the request already contains a valid session cookie, then there's no
    # action necessary; the session is already established.
    if claims is not None:
        return

    fresh_cookie = firebase_auth.create_session_cookie(
        _get_id_token(request), feconf.FIREBASE_SESSION_COOKIE_MAX_AGE)

    response.set_cookie(
        constants.FIREBASE_AUTH_SESSION_COOKIE_NAME,
        value=fresh_cookie,
        max_age=feconf.FIREBASE_SESSION_COOKIE_MAX_AGE,
        overwrite=True,
        # Toggles https vs http. The production server uses https, but the local
        # developement server uses http.
        secure=(not constants.EMULATOR_MODE),
        # Using the HttpOnly flag when generating a cookie helps mitigate the
        # risk of client side script accessing the protected cookie (if the
        # browser supports it).
        # Learn more: https://owasp.org/www-community/HttpOnly.
        httponly=True)


def destroy_auth_session(response: webapp2.Response) -> None:
    """Clears login cookies from the given response headers.

    Args:
        response: webapp2.Response. Response to clear the cookies from.
    """
    response.delete_cookie(constants.FIREBASE_AUTH_SESSION_COOKIE_NAME)


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
    return _get_auth_claims_from_session_cookie(_get_session_cookie(request))


def mark_user_for_deletion(user_id: str) -> None:
    """Marks the user, and all of their auth associations, as deleted.

    This function also disables the user's Firebase account so that they cannot
    be used to sign in.

    Args:
        user_id: str. The unique ID of the user whose associations should be
            deleted.
    """
    # NOTE: We use get_multi(include_deleted=True) because get() returns None
    # for models with deleted=True, but we need to make changes to those models
    # when managing deletion.
    (assoc_by_user_id_model,) = auth_models.UserAuthDetailsModel.get_multi(
        [user_id], include_deleted=True)

    if assoc_by_user_id_model is not None:
        assoc_by_user_id_model.deleted = True
        assoc_by_user_id_model.update_timestamps()
        assoc_by_user_id_model.put()

    assoc_by_auth_id_model = (
        auth_models.UserIdByFirebaseAuthIdModel.get_by_user_id(user_id)
        if assoc_by_user_id_model is None else
        # NOTE: We use get_multi(include_deleted=True) because get() returns
        # None for models with deleted=True, but we need to make changes to
        # those models when managing deletion.
        auth_models.UserIdByFirebaseAuthIdModel.get_multi(
            [assoc_by_user_id_model.firebase_auth_id], include_deleted=True)[0])

    if assoc_by_auth_id_model is not None:
        assoc_by_auth_id_model.deleted = True
        assoc_by_auth_id_model.update_timestamps()
        assoc_by_auth_id_model.put()
    else:
        logging.error(
            '[WIPEOUT] User with user_id=%s has no Firebase account' % user_id)
        return

    try:
        firebase_auth.update_user(assoc_by_auth_id_model.id, disabled=True)
    except (firebase_exceptions.FirebaseError, ValueError):
        # NOTE: logging.exception appends the stack trace automatically. The
        # errors are not re-raised because wipeout_services, the user of this
        # function, does not use exceptions to keep track of failures. It uses
        # the verify_external_auth_associations_are_deleted() function instead.
        logging.exception(
            '[WIPEOUT] Failed to disable Firebase account! Stack trace:')


def delete_external_auth_associations(user_id: str) -> None:
    """Deletes all associations that refer to the user outside of Oppia.

    Args:
        user_id: str. The unique ID of the user whose associations should be
            deleted.
    """
    auth_id = get_auth_id_from_user_id(user_id, include_deleted=True)
    if auth_id is None:
        return
    try:
        firebase_auth.delete_user(auth_id)
    except firebase_auth.UserNotFoundError:
        logging.exception('[WIPEOUT] Firebase account already deleted')
    except (firebase_exceptions.FirebaseError, ValueError):
        # NOTE: logging.exception appends the stack trace automatically. The
        # errors are not re-raised because wipeout_services, the user of this
        # function, does not use exceptions to keep track of failures. It uses
        # the verify_external_auth_associations_are_deleted() function instead.
        logging.exception('[WIPEOUT] Firebase Admin SDK failed! Stack trace:')


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
    auth_id = get_auth_id_from_user_id(user_id, include_deleted=True)
    if auth_id is None:
        return True
    try:
        result = firebase_auth.get_users([firebase_auth.UidIdentifier(auth_id)])
        return len(result.users) == 0
    except (firebase_exceptions.FirebaseError, ValueError):
        # NOTE: logging.exception appends the stack trace automatically. The
        # errors are not re-raised because wipeout_services, the user of this
        # function, will keep retrying the other "delete" family of functions
        # until this returns True (in 12h intervals).
        logging.exception('[WIPEOUT] Firebase Admin SDK failed! Stack trace:')
    return False


def get_auth_id_from_user_id(
        user_id: str, include_deleted: bool = False
) -> Optional[str]:
    """Returns the auth ID associated with the given user ID.

    Args:
        user_id: str. The user ID.
        include_deleted: bool. Whether to return the ID of models marked for
            deletion.

    Returns:
        str|None. The auth ID associated with the given user ID, or None if no
        association exists.
    """
    (assoc_by_user_id_model,) = auth_models.UserAuthDetailsModel.get_multi(
        [user_id], include_deleted=include_deleted)
    return (
        None if assoc_by_user_id_model is None else
        assoc_by_user_id_model.firebase_auth_id)


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
    return [
        None if model is None else model.firebase_auth_id
        for model in auth_models.UserAuthDetailsModel.get_multi(user_ids)
    ]


def get_user_id_from_auth_id(
        auth_id: str, include_deleted: bool = False
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
    (assoc_by_auth_id_model,) = (
        auth_models.UserIdByFirebaseAuthIdModel.get_multi(
            [auth_id], include_deleted=include_deleted))
    return (
        None if assoc_by_auth_id_model is None else
        assoc_by_auth_id_model.user_id)


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
    return [
        None if model is None else model.user_id
        for model in auth_models.UserIdByFirebaseAuthIdModel.get_multi(auth_ids)
    ]


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
    auth_id, user_id = auth_id_user_id_pair

    user_id_collision = get_user_id_from_auth_id(auth_id, include_deleted=True)
    if user_id_collision is not None:
        raise Exception('auth_id=%r is already associated with user_id=%r' % (
            auth_id, user_id_collision))

    auth_id_collision = get_auth_id_from_user_id(user_id, include_deleted=True)
    if auth_id_collision is not None:
        raise Exception('user_id=%r is already associated with auth_id=%r' % (
            user_id, auth_id_collision))

    # A new {auth_id: user_id} mapping needs to be created. We know the model
    # doesn't exist because get_auth_id_from_user_id returned None, even with
    # include_deleted=True.
    assoc_by_auth_id_model = (
        auth_models.UserIdByFirebaseAuthIdModel(id=auth_id, user_id=user_id))
    assoc_by_auth_id_model.update_timestamps()
    assoc_by_auth_id_model.put()

    # The {user_id: auth_id} mapping needs to be created, but the model used to
    # store the relationship might already exist because other services use it
    # as well (e.g. user_services uses UserAuthDetailsModel.parent_user_id). In
    # such situations, the return value of get_auth_id_from_user_id would be
    # None, so that isn't strong enough to determine whether we need to create a
    # new model rather than update an existing one.
    #
    # NOTE: We use get_multi(include_deleted=True) because get() returns None
    # for models with deleted=True, but we need to make changes to those models
    # when managing deletion.
    (assoc_by_user_id_model,) = auth_models.UserAuthDetailsModel.get_multi(
        [user_id], include_deleted=True)
    if (assoc_by_user_id_model is None or
            assoc_by_user_id_model.firebase_auth_id is None):
        assoc_by_user_id_model = auth_models.UserAuthDetailsModel(
            id=user_id, firebase_auth_id=auth_id)
        assoc_by_user_id_model.update_timestamps()
        assoc_by_user_id_model.put()


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
    # Turn list(pair) to pair(list): https://stackoverflow.com/a/7558990/4859885
    auth_ids, user_ids = zip(*auth_id_user_id_pairs)

    user_id_collisions = get_multi_user_ids_from_auth_ids(auth_ids)
    if any(user_id is not None for user_id in user_id_collisions):
        user_id_collisions_text = ', '.join(
            '{auth_id=%r: user_id=%r}' % (auth_id, user_id)
            for auth_id, user_id in zip(auth_ids, user_id_collisions)
            if user_id is not None)
        raise Exception('already associated: %s' % user_id_collisions_text)

    auth_id_collisions = get_multi_auth_ids_from_user_ids(user_ids)
    if any(auth_id is not None for auth_id in auth_id_collisions):
        auth_id_collisions_text = ', '.join(
            '{user_id=%r: auth_id=%r}' % (user_id, auth_id)
            for user_id, auth_id in zip(user_ids, auth_id_collisions)
            if auth_id is not None)
        raise Exception('already associated: %s' % auth_id_collisions_text)

    # A new {auth_id: user_id} mapping needs to be created. We know the model
    # doesn't exist because get_auth_id_from_user_id returned None.
    assoc_by_auth_id_models = [
        auth_models.UserIdByFirebaseAuthIdModel(id=auth_id, user_id=user_id)
        for auth_id, user_id in zip(auth_ids, user_ids)
    ]
    auth_models.UserIdByFirebaseAuthIdModel.update_timestamps_multi(
        assoc_by_auth_id_models)
    auth_models.UserIdByFirebaseAuthIdModel.put_multi(assoc_by_auth_id_models)

    # The {user_id: auth_id} mapping needs to be created, but the model used to
    # store the relationship might already exist because other services use it
    # as well (e.g. user_services uses UserAuthDetailsModel.parent_user_id). In
    # such situations, the return value of get_multi_auth_ids_from_user_ids
    # would be None, so that isn't strong enough to determine whether we need to
    # create a new model rather than update an existing one.
    assoc_by_user_id_models = [
        auth_models.UserAuthDetailsModel(id=user_id, firebase_auth_id=auth_id)
        for auth_id, user_id, assoc_by_user_id_model in zip(
            auth_ids, user_ids,
            auth_models.UserAuthDetailsModel.get_multi(user_ids))
        if (assoc_by_user_id_model is None or
            assoc_by_user_id_model.firebase_auth_id is None)
    ]
    if assoc_by_user_id_models:
        auth_models.UserAuthDetailsModel.update_timestamps_multi(
            assoc_by_user_id_models)
        auth_models.UserAuthDetailsModel.put_multi(assoc_by_user_id_models)


def grant_super_admin_privileges(user_id: str) -> None:
    """Grants the user super admin privileges.

    Args:
        user_id: str. The Oppia user ID to promote to super admin.

    Raises:
        ValueError. No Firebase account associated with given user ID.
    """
    auth_id = get_auth_id_from_user_id(user_id)
    if auth_id is None:
        raise ValueError('user_id=%s has no Firebase account' % user_id)
    custom_claims = '{"role":"%s"}' % feconf.FIREBASE_ROLE_SUPER_ADMIN
    firebase_auth.set_custom_user_claims(auth_id, custom_claims)
    # NOTE: Revoke session cookies and ID tokens of the user so they are forced
    # to log back in to obtain their updated privileges.
    firebase_auth.revoke_refresh_tokens(auth_id)


def revoke_super_admin_privileges(user_id: str) -> None:
    """Revokes the user's super admin privileges.

    Args:
        user_id: str. The Oppia user ID to revoke privileges from.

    Raises:
        ValueError. No Firebase account associated with given user ID.
    """
    auth_id = get_auth_id_from_user_id(user_id)
    if auth_id is None:
        raise ValueError('user_id=%s has no Firebase account' % user_id)
    firebase_auth.set_custom_user_claims(auth_id, None)
    # NOTE: Revoke session cookies and ID tokens of the user so they are forced
    # to log back in to obtain their updated privileges.
    firebase_auth.revoke_refresh_tokens(auth_id)


def _get_session_cookie(request: webapp2.Request) -> Optional[str]:
    """Returns the session cookie authorizing the signed in user, if present.

    Args:
        request: webapp2.Request. The HTTP request to inspect.

    Returns:
        str|None. Value of the session cookie authorizing the signed in user, if
        present, otherwise None.
    """
    return request.cookies.get(constants.FIREBASE_AUTH_SESSION_COOKIE_NAME)


def _get_id_token(request: webapp2.Request) -> Optional[str]:
    """Returns the ID token authorizing a user, or None if missing.

    Oppia uses the OAuth 2.0's Bearer authentication scheme to send ID Tokens.

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
        request: webapp2.Request. The HTTP request to inspect.

    Returns:
        str|None. The ID Token of the request, if present, otherwise None.
    """
    scheme, _, token = request.headers.get('Authorization', '').partition(' ')
    return token if scheme == 'Bearer' else None


def _get_auth_claims_from_session_cookie(
        cookie: Optional[str]
) -> Optional[auth_domain.AuthClaims]:
    """Returns claims from the session cookie, or None if invalid.

    Args:
        cookie: str|None. The session cookie to extract claims from.

    Returns:
        AuthClaims|None. The claims from the session cookie, if available.
        Otherwise returns None.

    Raises:
        InvalidAuthSessionError. The cookie has an invalid value.
        StaleAuthSessionError. The cookie has lost its authority.
    """
    # It's OK for a session cookie to be None or empty, it just means that the
    # request hasn't been authenticated.
    if not cookie:
        return None
    try:
        claims = firebase_auth.verify_session_cookie(cookie, check_revoked=True)
    except firebase_auth.ExpiredSessionCookieError as e:
        raise auth_domain.StaleAuthSessionError(
            'session has expired') from e
    except firebase_auth.RevokedSessionCookieError as e:
        raise auth_domain.StaleAuthSessionError(
            'session has been revoked') from e
    except firebase_auth.UserDisabledError as e:
        raise auth_domain.UserDisabledError(
            'user is being deleted') from e
    except (
        firebase_exceptions.FirebaseError, ValueError) as error:
        raise auth_domain.InvalidAuthSessionError(
            'session invalid: %s' % error) from error
    else:
        return _create_auth_claims(claims)


def _create_auth_claims(
    firebase_claims: auth_domain.AuthClaimsDict
) -> auth_domain.AuthClaims:
    """Returns a new AuthClaims domain object from Firebase claims.

    Args:
        firebase_claims: dict(str: *). The raw claims returned by the Firebase
            SDK.

    Returns:
        AuthClaims. Oppia's representation of auth claims.
    """
    auth_id = firebase_claims['sub']
    email = firebase_claims.get('email')
    role_is_super_admin = (
        email == feconf.ADMIN_EMAIL_ADDRESS or
        firebase_claims.get('role') == feconf.FIREBASE_ROLE_SUPER_ADMIN)
    return auth_domain.AuthClaims(
        auth_id, email, role_is_super_admin=role_is_super_admin)
