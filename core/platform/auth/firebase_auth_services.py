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

from constants import constants
from core.domain import auth_domain
from core.platform import models
import feconf
import python_utils

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import exceptions as firebase_exceptions

auth_models, user_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))

transaction_services = models.Registry.import_transaction_services()


def establish_firebase_connection():
    """Establishes the connection to Firebase needed by the rest of the SDK.

    All Firebase operations require an "app", the abstraction used for a
    Firebase server connection. The initialize_app() function raises an error
    when it's called more than once, however, so we make this function
    idempotent by trying to "get" the app first.

    Returns:
        firebase_admin.App. The App being by the Firebase SDK.

    Raises:
        Exception. The Firebase app has a genuine problem.
    """
    try:
        firebase_admin.get_app()
    except ValueError as error:
        if 'initialize_app' in python_utils.UNICODE(error):
            firebase_admin.initialize_app(
                options={'projectId': feconf.OPPIA_PROJECT_ID})
        else:
            raise


def establish_auth_session(request, response):
    """Sets login cookies to maintain a user's sign-in session.

    Args:
        request: webapp2.Request. The request with the authorization to begin a
            new session.
        response: webapp2.Response. The response to establish the new session
            upon.
    """
    cookie_claims = (
        _get_auth_claims_from_session_cookie(_get_session_cookie(request)))

    # If the request already contains a valid session cookie, then there's no
    # action necessary; the session is already established.
    if cookie_claims is not None:
        return

    fresh_cookie = firebase_auth.create_session_cookie(
        _get_id_token(request), feconf.FIREBASE_SESSION_COOKIE_MAX_AGE)

    response.set_cookie(
        feconf.FIREBASE_SESSION_COOKIE_NAME,
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


def destroy_auth_session(response):
    """Clears login cookies from the given response headers.

    Args:
        response: webapp2.Response. Response to clear the cookies from.
    """
    response.delete_cookie(feconf.FIREBASE_SESSION_COOKIE_NAME)


def get_auth_claims_from_request(request):
    """Authenticates the request and returns claims about its authorizer.

    Args:
        request: webapp2.Request. The HTTP request to authenticate.

    Returns:
        AuthClaims|None. Claims about the currently signed in user. If no user
        is signed in, then returns None.
    """
    return _get_auth_claims_from_session_cookie(_get_session_cookie(request))


def mark_user_for_deletion(user_id):
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


def delete_external_auth_associations(user_id):
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
    auth_id = get_auth_id_from_user_id(user_id, include_deleted=True)
    if auth_id is None:
        return True
    try:
        # TODO(#11474): Replace with `get_users()` (plural) because `get_user()`
        # (singular) does not distinguish between disabled and deleted users. We
        # can't do it right now because firebase-admin==3.2.1 does not offer the
        # get_users() API. We will need to fix this when we've moved to a more
        # recent version (after the Python 3 migration).
        firebase_auth.get_user(auth_id)
    except firebase_auth.UserNotFoundError:
        return True
    except (firebase_exceptions.FirebaseError, ValueError):
        # NOTE: logging.exception appends the stack trace automatically. The
        # errors are not re-raised because wipeout_services, the user of this
        # function, will keep retrying the other "delete" family of functions
        # until this returns True (in 12h intervals).
        logging.exception('[WIPEOUT] Firebase Admin SDK failed! Stack trace:')
    return False


def get_auth_id_from_user_id(user_id, include_deleted=False):
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


def get_multi_auth_ids_from_user_ids(user_ids):
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


def get_user_id_from_auth_id(auth_id, include_deleted=False):
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


def associate_auth_id_with_user_id(auth_id_user_id_pair):
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


def associate_multi_auth_ids_with_user_ids(auth_id_user_id_pairs):
    """Commits the associations between auth IDs and user IDs.

    Args:
        auth_id_user_id_pairs: list(auth_domain.AuthIdUserIdPair). The
            associations to commit.

    Raises:
        Exception. One or more auth associations already exist.
    """
    # Turn list(pair) to pair(list): https://stackoverflow.com/a/7558990/4859885
    auth_ids, user_ids = python_utils.ZIP(*auth_id_user_id_pairs)

    user_id_collisions = get_multi_user_ids_from_auth_ids(auth_ids)
    if any(user_id is not None for user_id in user_id_collisions):
        user_id_collisions = ', '.join(
            '{auth_id=%r: user_id=%r}' % (auth_id, user_id)
            for auth_id, user_id in python_utils.ZIP(
                auth_ids, user_id_collisions)
            if user_id is not None)
        raise Exception('already associated: %s' % user_id_collisions)

    auth_id_collisions = get_multi_auth_ids_from_user_ids(user_ids)
    if any(auth_id is not None for auth_id in auth_id_collisions):
        auth_id_collisions = ', '.join(
            '{user_id=%r: auth_id=%r}' % (user_id, auth_id)
            for user_id, auth_id in python_utils.ZIP(
                user_ids, auth_id_collisions)
            if auth_id is not None)
        raise Exception('already associated: %s' % auth_id_collisions)

    # A new {auth_id: user_id} mapping needs to be created. We know the model
    # doesn't exist because get_auth_id_from_user_id returned None.
    assoc_by_auth_id_models = [
        auth_models.UserIdByFirebaseAuthIdModel(id=auth_id, user_id=user_id)
        for auth_id, user_id in python_utils.ZIP(auth_ids, user_ids)
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
        for auth_id, user_id, assoc_by_user_id_model in python_utils.ZIP(
            auth_ids, user_ids,
            auth_models.UserAuthDetailsModel.get_multi(user_ids))
        if (assoc_by_user_id_model is None or
            assoc_by_user_id_model.firebase_auth_id is None)
    ]
    if assoc_by_user_id_models:
        auth_models.UserAuthDetailsModel.update_timestamps_multi(
            assoc_by_user_id_models)
        auth_models.UserAuthDetailsModel.put_multi(assoc_by_user_id_models)


def grant_super_admin_privileges(user_id):
    """Grants the user super admin privileges.

    Args:
        user_id: str. The Oppia user ID to promote to super admin.
    """
    auth_id = get_auth_id_from_user_id(user_id)
    if auth_id is None:
        raise ValueError('user_id=%s has no Firebase account' % user_id)
    firebase_admin.auth.set_custom_user_claims(
        auth_id, '{"role":"%s"}' % feconf.FIREBASE_ROLE_SUPER_ADMIN)


def revoke_super_admin_privileges(user_id):
    """Revokes the user's super admin privileges.

    Args:
        user_id: str. The Oppia user ID to revoke privileges from.
    """
    auth_id = get_auth_id_from_user_id(user_id)
    if auth_id is None:
        raise ValueError('user_id=%s has no Firebase account' % user_id)
    firebase_admin.auth.set_custom_user_claims(auth_id, None)


def seed_firebase():
    """Prepares Oppia and Firebase to run the SeedFirebaseOneOffJob.

    NOTE: This function is idempotent.

    TODO(#11462): Delete this handler once the Firebase migration logic is
    rollback-safe and all backup data is using post-migration data.
    """
    seed_model = auth_models.FirebaseSeedModel.get(
        auth_models.ONLY_FIREBASE_SEED_MODEL_ID, strict=False)
    if seed_model is None: # Exactly 1 seed model must exist.
        auth_models.FirebaseSeedModel(
            id=auth_models.ONLY_FIREBASE_SEED_MODEL_ID).put()

    user_ids_with_admin_email = [
        key.id() for key in user_models.UserSettingsModel.query(
            user_models.UserSettingsModel.email == feconf.ADMIN_EMAIL_ADDRESS
        ).iter(keys_only=True)
    ]
    assoc_by_user_id_models = [
        model for model in auth_models.UserAuthDetailsModel.get_multi(
            user_ids_with_admin_email)
        if model is not None and model.gae_id != feconf.SYSTEM_COMMITTER_ID
    ]
    if len(assoc_by_user_id_models) != 1:
        raise Exception(
            '%s must correspond to exactly 1 user (excluding user_id=%s), but '
            'found user_ids=[%s]' % (
                feconf.ADMIN_EMAIL_ADDRESS, feconf.SYSTEM_COMMITTER_ID,
                ', '.join(m.id for m in assoc_by_user_id_models)))
    else:
        assoc_by_user_id_model = assoc_by_user_id_models[0]
        user_id = assoc_by_user_id_model.id

    auth_id = assoc_by_user_id_model.firebase_auth_id
    if auth_id is None:
        auth_id = user_id[4:] if user_id.startswith('uid_') else user_id
        assoc_by_user_id_model.firebase_auth_id = auth_id
        assoc_by_user_id_model.update_timestamps(update_last_updated_time=False)
        assoc_by_user_id_model.put()

    assoc_by_auth_id_model = (
        auth_models.UserIdByFirebaseAuthIdModel.get(auth_id, strict=False))
    if assoc_by_auth_id_model is None:
        auth_models.UserIdByFirebaseAuthIdModel(
            id=auth_id, user_id=user_id).put()
    elif assoc_by_auth_id_model.user_id != user_id:
        assoc_by_auth_id_model.user_id = user_id
        assoc_by_auth_id_model.update_timestamps(update_last_updated_time=False)
        assoc_by_auth_id_model.put()

    custom_claims = '{"role":"%s"}' % feconf.FIREBASE_ROLE_SUPER_ADMIN

    try:
        user = firebase_admin.auth.get_user_by_email(feconf.ADMIN_EMAIL_ADDRESS)
    except firebase_admin.auth.UserNotFoundError:
        create_new_firebase_account = True
    else:
        if user.uid != auth_id:
            firebase_admin.auth.update_user(user.uid, disabled=True)
            firebase_admin.auth.delete_user(user.uid)
            create_new_firebase_account = True
        else:
            firebase_admin.auth.set_custom_user_claims(user.uid, custom_claims)
            create_new_firebase_account = False

    if create_new_firebase_account:
        firebase_admin.auth.import_users([
            firebase_admin.auth.ImportUserRecord(
                auth_id, email=feconf.ADMIN_EMAIL_ADDRESS,
                custom_claims=custom_claims)
        ])


def _get_session_cookie(request):
    """Returns the session cookie authorizing the signed in user, if present.

    Args:
        request: webapp2.Request. The HTTP request to inspect.

    Returns:
        str|None. Value of the session cookie authorizing the signed in user, if
        present, otherwise None.
    """
    return request.cookies.get(feconf.FIREBASE_SESSION_COOKIE_NAME)


def _get_id_token(request):
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


def _get_auth_claims_from_session_cookie(cookie):
    """Returns claims from the session cookie, or None if invalid.

    Args:
        cookie: str|None. The session cookie to extract claims from.

    Returns:
        AuthClaims|None. The claims from the session cookie, if available.
        Otherwise returns None.
    """
    # It's OK for a session cookie to be None, it just means that the request
    # isn't authenticated.
    if cookie:
        try:
            return _create_auth_claims(
                firebase_auth.verify_session_cookie(cookie))
        # NOTE: Session cookies only provide temporary authentication, so they
        # are expected to become obsolete over time. The following errors are
        # situations where this can happen.
        except (
                firebase_auth.ExpiredSessionCookieError,
                firebase_auth.RevokedSessionCookieError):
            # NOTE: logging.exception appends the stack trace automatically.
            logging.exception('User session has ended and must be renewed')
    return None


def _create_auth_claims(firebase_claims):
    """Returns a new AuthClaims domain object from Firebase claims.

    Args:
        firebase_claims: dict(str: *). The raw claims returned by the Firebase
            SDK.

    Returns:
        AuthClaims. Oppia's representation of auth claims.
    """
    auth_id = firebase_claims.get('sub')
    email = firebase_claims.get('email')
    role_is_super_admin = (
        email == feconf.ADMIN_EMAIL_ADDRESS or
        firebase_claims.get('role') == feconf.FIREBASE_ROLE_SUPER_ADMIN)
    return auth_domain.AuthClaims(
        auth_id, email, role_is_super_admin=role_is_super_admin)
