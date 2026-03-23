# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Firebase Authentication module.

This module contains functions for minting and verifying JWTs used for
authenticating against Firebase services. It also provides functions for
creating and managing user accounts in Firebase projects.
"""

from firebase_admin import _auth_client
from firebase_admin import _auth_providers
from firebase_admin import _auth_utils
from firebase_admin import _user_identifier
from firebase_admin import _token_gen
from firebase_admin import _user_import
from firebase_admin import _user_mgt
from firebase_admin import _utils


_AUTH_ATTRIBUTE = '_auth'


__all__ = [
    'ActionCodeSettings',
    'CertificateFetchError',
    'Client',
    'ConfigurationNotFoundError',
    'DELETE_ATTRIBUTE',
    'EmailAlreadyExistsError',
    'EmailNotFoundError',
    'ErrorInfo',
    'ExpiredIdTokenError',
    'ExpiredSessionCookieError',
    'ExportedUserRecord',
    'DeleteUsersResult',
    'GetUsersResult',
    'ImportUserRecord',
    'InsufficientPermissionError',
    'InvalidDynamicLinkDomainError',
    'InvalidIdTokenError',
    'InvalidSessionCookieError',
    'ListProviderConfigsPage',
    'ListUsersPage',
    'OIDCProviderConfig',
    'PhoneNumberAlreadyExistsError',
    'ProviderConfig',
    'ResetPasswordExceedLimitError',
    'RevokedIdTokenError',
    'RevokedSessionCookieError',
    'SAMLProviderConfig',
    'TokenSignError',
    'TooManyAttemptsTryLaterError',
    'UidAlreadyExistsError',
    'UnexpectedResponseError',
    'UserDisabledError',
    'UserImportHash',
    'UserImportResult',
    'UserInfo',
    'UserMetadata',
    'UserNotFoundError',
    'UserProvider',
    'UserRecord',

    'UserIdentifier',
    'UidIdentifier',
    'EmailIdentifier',
    'PhoneIdentifier',
    'ProviderIdentifier',

    'create_custom_token',
    'create_oidc_provider_config',
    'create_saml_provider_config',
    'create_session_cookie',
    'create_user',
    'delete_oidc_provider_config',
    'delete_saml_provider_config',
    'delete_user',
    'delete_users',
    'generate_email_verification_link',
    'generate_password_reset_link',
    'generate_sign_in_with_email_link',
    'get_oidc_provider_config',
    'get_saml_provider_config',
    'get_user',
    'get_user_by_email',
    'get_user_by_phone_number',
    'get_users',
    'import_users',
    'list_saml_provider_configs',
    'list_users',
    'revoke_refresh_tokens',
    'set_custom_user_claims',
    'update_oidc_provider_config',
    'update_saml_provider_config',
    'update_user',
    'verify_id_token',
    'verify_session_cookie',
]

ActionCodeSettings = _user_mgt.ActionCodeSettings
CertificateFetchError = _token_gen.CertificateFetchError
Client = _auth_client.Client
ConfigurationNotFoundError = _auth_utils.ConfigurationNotFoundError
DELETE_ATTRIBUTE = _user_mgt.DELETE_ATTRIBUTE
DeleteUsersResult = _user_mgt.DeleteUsersResult
EmailAlreadyExistsError = _auth_utils.EmailAlreadyExistsError
EmailNotFoundError = _auth_utils.EmailNotFoundError
ErrorInfo = _user_import.ErrorInfo
ExpiredIdTokenError = _token_gen.ExpiredIdTokenError
ExpiredSessionCookieError = _token_gen.ExpiredSessionCookieError
ExportedUserRecord = _user_mgt.ExportedUserRecord
GetUsersResult = _user_mgt.GetUsersResult
ImportUserRecord = _user_import.ImportUserRecord
InsufficientPermissionError = _auth_utils.InsufficientPermissionError
InvalidDynamicLinkDomainError = _auth_utils.InvalidDynamicLinkDomainError
InvalidIdTokenError = _auth_utils.InvalidIdTokenError
InvalidSessionCookieError = _token_gen.InvalidSessionCookieError
ListProviderConfigsPage = _auth_providers.ListProviderConfigsPage
ListUsersPage = _user_mgt.ListUsersPage
OIDCProviderConfig = _auth_providers.OIDCProviderConfig
PhoneNumberAlreadyExistsError = _auth_utils.PhoneNumberAlreadyExistsError
ProviderConfig = _auth_providers.ProviderConfig
ResetPasswordExceedLimitError = _auth_utils.ResetPasswordExceedLimitError
RevokedIdTokenError = _token_gen.RevokedIdTokenError
RevokedSessionCookieError = _token_gen.RevokedSessionCookieError
SAMLProviderConfig = _auth_providers.SAMLProviderConfig
TokenSignError = _token_gen.TokenSignError
TooManyAttemptsTryLaterError = _auth_utils.TooManyAttemptsTryLaterError
UidAlreadyExistsError = _auth_utils.UidAlreadyExistsError
UnexpectedResponseError = _auth_utils.UnexpectedResponseError
UserDisabledError = _auth_utils.UserDisabledError
UserImportHash = _user_import.UserImportHash
UserImportResult = _user_import.UserImportResult
UserInfo = _user_mgt.UserInfo
UserMetadata = _user_mgt.UserMetadata
UserNotFoundError = _auth_utils.UserNotFoundError
UserProvider = _user_import.UserProvider
UserRecord = _user_mgt.UserRecord

UserIdentifier = _user_identifier.UserIdentifier
UidIdentifier = _user_identifier.UidIdentifier
EmailIdentifier = _user_identifier.EmailIdentifier
PhoneIdentifier = _user_identifier.PhoneIdentifier
ProviderIdentifier = _user_identifier.ProviderIdentifier


def _get_client(app):
    """Returns a client instance for an App.

    If the App already has a client associated with it, simply returns
    it. Otherwise creates a new client, and adds it to the App before
    returning it.

    Args:
        app: A Firebase App instance (or ``None`` to use the default App).

    Returns:
        Client: A client for the specified App instance.

    Raises:
        ValueError: If the app argument is invalid.
    """
    return _utils.get_app_service(app, _AUTH_ATTRIBUTE, Client)


def create_custom_token(uid, developer_claims=None, app=None):
    """Builds and signs a Firebase custom auth token.

    Args:
        uid: ID of the user for whom the token is created.
        developer_claims: A dictionary of claims to be included in the token
            (optional).
        app: An App instance (optional).

    Returns:
        bytes: A token minted from the input parameters.

    Raises:
        ValueError: If input parameters are invalid.
        TokenSignError: If an error occurs while signing the token using the remote IAM service.
    """
    client = _get_client(app)
    return client.create_custom_token(uid, developer_claims)


def verify_id_token(id_token, app=None, check_revoked=False, clock_skew_seconds=0):
    """Verifies the signature and data for the provided JWT.

    Accepts a signed token string, verifies that it is current, and issued
    to this project, and that it was correctly signed by Google.

    Args:
        id_token: A string of the encoded JWT.
        app: An App instance (optional).
        check_revoked: Boolean, If true, checks whether the token has been revoked or
            the user disabled (optional).
        clock_skew_seconds: The number of seconds to tolerate when checking the token.
            Must be between 0-60. Defaults to 0.
    Returns:
        dict: A dictionary of key-value pairs parsed from the decoded JWT.

    Raises:
        ValueError: If ``id_token`` is a not a string or is empty.
        InvalidIdTokenError: If ``id_token`` is not a valid Firebase ID token.
        ExpiredIdTokenError: If the specified ID token has expired.
        RevokedIdTokenError: If ``check_revoked`` is ``True`` and the ID token has been revoked.
        CertificateFetchError: If an error occurs while fetching the public key certificates
            required to verify the ID token.
        UserDisabledError: If ``check_revoked`` is ``True`` and the corresponding user
            record is disabled.
    """
    client = _get_client(app)
    return client.verify_id_token(
        id_token, check_revoked=check_revoked, clock_skew_seconds=clock_skew_seconds)


def create_session_cookie(id_token, expires_in, app=None):
    """Creates a new Firebase session cookie from the given ID token and options.

    The returned JWT can be set as a server-side session cookie with a custom cookie policy.

    Args:
        id_token: The Firebase ID token to exchange for a session cookie.
        expires_in: Duration until the cookie is expired. This can be specified
            as a numeric seconds value or a ``datetime.timedelta`` instance.
        app: An App instance (optional).

    Returns:
        bytes: A session cookie generated from the input parameters.

    Raises:
        ValueError: If input parameters are invalid.
        FirebaseError: If an error occurs while creating the cookie.
    """
    client = _get_client(app)
    # pylint: disable=protected-access
    return client._token_generator.create_session_cookie(id_token, expires_in)


def verify_session_cookie(session_cookie, check_revoked=False, app=None, clock_skew_seconds=0):
    """Verifies a Firebase session cookie.

    Accepts a session cookie string, verifies that it is current, and issued
    to this project, and that it was correctly signed by Google.

    Args:
        session_cookie: A session cookie string to verify.
        check_revoked: Boolean, if true, checks whether the cookie has been revoked or the
            user disabled (optional).
        app: An App instance (optional).
        clock_skew_seconds: The number of seconds to tolerate when checking the cookie.

    Returns:
        dict: A dictionary of key-value pairs parsed from the decoded JWT.

    Raises:
        ValueError: If ``session_cookie`` is a not a string or is empty.
        InvalidSessionCookieError: If ``session_cookie`` is not a valid Firebase session cookie.
        ExpiredSessionCookieError: If the specified session cookie has expired.
        RevokedSessionCookieError: If ``check_revoked`` is ``True`` and the cookie has been revoked.
        CertificateFetchError: If an error occurs while fetching the public key certificates
            required to verify the session cookie.
        UserDisabledError: If ``check_revoked`` is ``True`` and the corresponding user
            record is disabled.
    """
    client = _get_client(app)
    # pylint: disable=protected-access
    verified_claims = client._token_verifier.verify_session_cookie(
        session_cookie, clock_skew_seconds)
    if check_revoked:
        client._check_jwt_revoked_or_disabled(
            verified_claims, RevokedSessionCookieError, 'session cookie')
    return verified_claims


def revoke_refresh_tokens(uid, app=None):
    """Revokes all refresh tokens for an existing user.

    This function updates the user's ``tokens_valid_after_timestamp`` to the current UTC
    in seconds since the epoch. It is important that the server on which this is called has its
    clock set correctly and synchronized.

    While this revokes all sessions for a specified user and disables any new ID tokens for
    existing sessions from getting minted, existing ID tokens may remain active until their
    natural expiration (one hour). To verify that ID tokens are revoked, use
    ``verify_id_token(idToken, check_revoked=True)``.

    Args:
        uid: A user ID string.
        app: An App instance (optional).

    Raises:
        ValueError: If the user ID is None, empty or malformed.
        FirebaseError: If an error occurs while revoking the refresh token.
    """
    client = _get_client(app)
    client.revoke_refresh_tokens(uid)


def get_user(uid, app=None):
    """Gets the user data corresponding to the specified user ID.

    Args:
        uid: A user ID string.
        app: An App instance (optional).

    Returns:
        UserRecord: A user record instance.

    Raises:
        ValueError: If the user ID is None, empty or malformed.
        UserNotFoundError: If the specified user ID does not exist.
        FirebaseError: If an error occurs while retrieving the user.
    """
    client = _get_client(app)
    return client.get_user(uid=uid)


def get_user_by_email(email, app=None):
    """Gets the user data corresponding to the specified user email.

    Args:
        email: A user email address string.
        app: An App instance (optional).

    Returns:
        UserRecord: A user record instance.

    Raises:
        ValueError: If the email is None, empty or malformed.
        UserNotFoundError: If no user exists by the specified email address.
        FirebaseError: If an error occurs while retrieving the user.
    """
    client = _get_client(app)
    return client.get_user_by_email(email=email)


def get_user_by_phone_number(phone_number, app=None):
    """Gets the user data corresponding to the specified phone number.

    Args:
        phone_number: A phone number string.
        app: An App instance (optional).

    Returns:
        UserRecord: A user record instance.

    Raises:
        ValueError: If the phone number is None, empty or malformed.
        UserNotFoundError: If no user exists by the specified phone number.
        FirebaseError: If an error occurs while retrieving the user.
    """
    client = _get_client(app)
    return client.get_user_by_phone_number(phone_number=phone_number)


def get_users(identifiers, app=None):
    """Gets the user data corresponding to the specified identifiers.

    There are no ordering guarantees; in particular, the nth entry in the
    result list is not guaranteed to correspond to the nth entry in the input
    parameters list.

    A maximum of 100 identifiers may be supplied. If more than 100
    identifiers are supplied, this method raises a `ValueError`.

    Args:
        identifiers (list[UserIdentifier]): A list of ``UserIdentifier``
            instances used to indicate which user records should be returned.
            Must have <= 100 entries.
        app: An App instance (optional).

    Returns:
        GetUsersResult: A ``GetUsersResult`` instance corresponding to the
        specified identifiers.

    Raises:
        ValueError: If any of the identifiers are invalid or if more than 100
            identifiers are specified.
    """
    client = _get_client(app)
    return client.get_users(identifiers)


def list_users(page_token=None, max_results=_user_mgt.MAX_LIST_USERS_RESULTS, app=None):
    """Retrieves a page of user accounts from a Firebase project.

    The ``page_token`` argument governs the starting point of the page. The ``max_results``
    argument governs the maximum number of user accounts that may be included in the returned page.
    This function never returns None. If there are no user accounts in the Firebase project, this
    returns an empty page.

    Args:
        page_token: A non-empty page token string, which indicates the starting point of the page
            (optional). Defaults to ``None``, which will retrieve the first page of users.
        max_results: A positive integer indicating the maximum number of users to include in the
            returned page (optional). Defaults to 1000, which is also the maximum number allowed.
        app: An App instance (optional).

    Returns:
        ListUsersPage: A page of user accounts.

    Raises:
        ValueError: If ``max_results`` or ``page_token`` are invalid.
        FirebaseError: If an error occurs while retrieving the user accounts.
    """
    client = _get_client(app)
    return client.list_users(page_token=page_token, max_results=max_results)


def create_user(**kwargs): # pylint: disable=differing-param-doc
    """Creates a new user account with the specified properties.

    Args:
        **kwargs: A series of keyword arguments (optional).

    Keyword Args:
        uid: User ID to assign to the newly created user (optional).
        display_name: The user's display name (optional).
        email: The user's primary email (optional).
        email_verified: A boolean indicating whether or not the user's primary email is
            verified (optional).
        phone_number: The user's primary phone number (optional).
        photo_url: The user's photo URL (optional).
        password: The user's raw, unhashed password. (optional).
        disabled: A boolean indicating whether or not the user account is disabled (optional).
        app: An App instance (optional).

    Returns:
        UserRecord: A user record instance for the newly created user.

    Raises:
        ValueError: If the specified user properties are invalid.
        FirebaseError: If an error occurs while creating the user account.
    """
    app = kwargs.pop('app', None)
    client = _get_client(app)
    return client.create_user(**kwargs)


def update_user(uid, **kwargs): # pylint: disable=differing-param-doc
    """Updates an existing user account with the specified properties.

    Args:
        uid: A user ID string.
        **kwargs: A series of keyword arguments (optional).

    Keyword Args:
        display_name: The user's display name (optional). Can be removed by explicitly passing
            ``auth.DELETE_ATTRIBUTE``.
        email: The user's primary email (optional).
        email_verified: A boolean indicating whether or not the user's primary email is
            verified (optional).
        phone_number: The user's primary phone number (optional). Can be removed by explicitly
            passing ``auth.DELETE_ATTRIBUTE``.
        photo_url: The user's photo URL (optional). Can be removed by explicitly passing
            ``auth.DELETE_ATTRIBUTE``.
        password: The user's raw, unhashed password. (optional).
        disabled: A boolean indicating whether or not the user account is disabled (optional).
        custom_claims: A dictionary or a JSON string containing the custom claims to be set on the
            user account (optional). To remove all custom claims, pass ``auth.DELETE_ATTRIBUTE``.
        valid_since: An integer signifying the seconds since the epoch (optional). This field is
            set by ``revoke_refresh_tokens`` and it is discouraged to set this field directly.
        app: An App instance (optional).

    Returns:
        UserRecord: An updated user record instance for the user.

    Raises:
        ValueError: If the specified user ID or properties are invalid.
        FirebaseError: If an error occurs while updating the user account.
    """
    app = kwargs.pop('app', None)
    client = _get_client(app)
    return client.update_user(uid, **kwargs)


def set_custom_user_claims(uid, custom_claims, app=None):
    """Sets additional claims on an existing user account.

    Custom claims set via this function can be used to define user roles and privilege levels.
    These claims propagate to all the devices where the user is already signed in (after token
    expiration or when token refresh is forced), and next time the user signs in. The claims
    can be accessed via the user's ID token JWT. If a reserved OIDC claim is specified (sub, iat,
    iss, etc), an error is thrown. Claims payload must also not be larger then 1000 characters
    when serialized into a JSON string.

    Args:
        uid: A user ID string.
        custom_claims: A dictionary or a JSON string of custom claims. Pass None to unset any
            claims set previously.
        app: An App instance (optional).

    Raises:
        ValueError: If the specified user ID or the custom claims are invalid.
        FirebaseError: If an error occurs while updating the user account.
    """
    client = _get_client(app)
    client.set_custom_user_claims(uid, custom_claims=custom_claims)


def delete_user(uid, app=None):
    """Deletes the user identified by the specified user ID.

    Args:
        uid: A user ID string.
        app: An App instance (optional).

    Raises:
        ValueError: If the user ID is None, empty or malformed.
        FirebaseError: If an error occurs while deleting the user account.
    """
    client = _get_client(app)
    client.delete_user(uid)


def delete_users(uids, app=None):
    """Deletes the users specified by the given identifiers.

    Deleting a non-existing user does not generate an error (the method is
    idempotent.) Non-existing users are considered to be successfully deleted
    and are therefore included in the `DeleteUserResult.success_count` value.

    A maximum of 1000 identifiers may be supplied. If more than 1000
    identifiers are supplied, this method raises a `ValueError`.

    Args:
        uids: A list of strings indicating the uids of the users to be deleted.
            Must have <= 1000 entries.
        app: An App instance (optional).

    Returns:
        DeleteUsersResult: The total number of successful/failed deletions, as
        well as the array of errors that correspond to the failed deletions.

    Raises:
        ValueError: If any of the identifiers are invalid or if more than 1000
            identifiers are specified.
    """
    client = _get_client(app)
    return client.delete_users(uids)


def import_users(users, hash_alg=None, app=None):
    """Imports the specified list of users into Firebase Auth.

    At most 1000 users can be imported at a time. This operation is optimized for bulk imports and
    will ignore checks on identifier uniqueness which could result in duplications. The
    ``hash_alg`` parameter must be specified when importing users with passwords. Refer to the
    ``UserImportHash`` class for supported hash algorithms.

    Args:
        users: A list of ``ImportUserRecord`` instances to import. Length of the list must not
            exceed 1000.
        hash_alg: A ``UserImportHash`` object (optional). Required when importing users with
            passwords.
        app: An App instance (optional).

    Returns:
        UserImportResult: An object summarizing the result of the import operation.

    Raises:
        ValueError: If the provided arguments are invalid.
        FirebaseError: If an error occurs while importing users.
    """
    client = _get_client(app)
    return client.import_users(users, hash_alg)


def generate_password_reset_link(email, action_code_settings=None, app=None):
    """Generates the out-of-band email action link for password reset flows for the specified email
    address.

    Args:
        email: The email of the user whose password is to be reset.
        action_code_settings: ``ActionCodeSettings`` instance (optional). Defines whether
            the link is to be handled by a mobile app and the additional state information to be
            passed in the deep link.
        app: An App instance (optional).
    Returns:
        link: The password reset link created by the API

    Raises:
        ValueError: If the provided arguments are invalid
        FirebaseError: If an error occurs while generating the link
    """
    client = _get_client(app)
    return client.generate_password_reset_link(email, action_code_settings=action_code_settings)


def generate_email_verification_link(email, action_code_settings=None, app=None):
    """Generates the out-of-band email action link for email verification flows for the specified
    email address.

    Args:
        email: The email of the user to be verified.
        action_code_settings: ``ActionCodeSettings`` instance (optional). Defines whether
            the link is to be handled by a mobile app and the additional state information to be
            passed in the deep link.
        app: An App instance (optional).
    Returns:
        link: The email verification link created by the API

    Raises:
        ValueError: If the provided arguments are invalid
        FirebaseError: If an error occurs while generating the link
    """
    client = _get_client(app)
    return client.generate_email_verification_link(
        email, action_code_settings=action_code_settings)


def generate_sign_in_with_email_link(email, action_code_settings, app=None):
    """Generates the out-of-band email action link for email link sign-in flows, using the action
    code settings provided.

    Args:
        email: The email of the user signing in.
        action_code_settings: ``ActionCodeSettings`` instance. Defines whether
            the link is to be handled by a mobile app and the additional state information to be
            passed in the deep link.
        app: An App instance (optional).

    Returns:
        link: The email sign-in link created by the API

    Raises:
        ValueError: If the provided arguments are invalid
        FirebaseError: If an error occurs while generating the link
    """
    client = _get_client(app)
    return client.generate_sign_in_with_email_link(
        email, action_code_settings=action_code_settings)


def get_oidc_provider_config(provider_id, app=None):
    """Returns the ``OIDCProviderConfig`` with the given ID.

    Args:
        provider_id: Provider ID string.
        app: An App instance (optional).

    Returns:
        OIDCProviderConfig: An OIDC provider config instance.

    Raises:
        ValueError: If the provider ID is invalid, empty or does not have ``oidc.`` prefix.
        ConfigurationNotFoundError: If no OIDC provider is available with the given identifier.
        FirebaseError: If an error occurs while retrieving the OIDC provider.
    """
    client = _get_client(app)
    return client.get_oidc_provider_config(provider_id)

def create_oidc_provider_config(
        provider_id, client_id, issuer, display_name=None, enabled=None, client_secret=None,
        id_token_response_type=None, code_response_type=None, app=None):
    """Creates a new OIDC provider config from the given parameters.

    OIDC provider support requires Google Cloud's Identity Platform (GCIP). To learn more about
    GCIP, including pricing and features, see https://cloud.google.com/identity-platform.

    Args:
        provider_id: Provider ID string. Must have the prefix ``oidc.``.
        client_id: Client ID of the new config.
        issuer: Issuer of the new config. Must be a valid URL.
        display_name: The user-friendly display name to the current configuration (optional).
            This name is also used as the provider label in the Cloud Console.
        enabled: A boolean indicating whether the provider configuration is enabled or disabled
            (optional). A user cannot sign in using a disabled provider.
        app: An App instance (optional).
        client_secret: A string which sets the client secret for the new provider.
            This is required for the code flow.
        code_response_type: A boolean which sets whether to enable the code response flow for the
            new provider. By default, this is not enabled if no response type is specified.
            A client secret must be set for this response type.
            Having both the code and ID token response flows is currently not supported.
        id_token_response_type: A boolean which sets whether to enable the ID token response flow
            for the new provider. By default, this is enabled if no response type is specified.
            Having both the code and ID token response flows is currently not supported.

    Returns:
        OIDCProviderConfig: The newly created OIDC provider config instance.

    Raises:
        ValueError: If any of the specified input parameters are invalid.
        FirebaseError: If an error occurs while creating the new OIDC provider config.
    """
    client = _get_client(app)
    return client.create_oidc_provider_config(
        provider_id, client_id=client_id, issuer=issuer, display_name=display_name,
        enabled=enabled, client_secret=client_secret, id_token_response_type=id_token_response_type,
        code_response_type=code_response_type)


def update_oidc_provider_config(
        provider_id, client_id=None, issuer=None, display_name=None, enabled=None,
        client_secret=None, id_token_response_type=None, code_response_type=None, app=None):
    """Updates an existing OIDC provider config with the given parameters.

    Args:
        provider_id: Provider ID string. Must have the prefix ``oidc.``.
        client_id: Client ID of the new config (optional).
        issuer: Issuer of the new config (optional). Must be a valid URL.
        display_name: The user-friendly display name of the current configuration (optional).
            Pass ``auth.DELETE_ATTRIBUTE`` to delete the current display name.
        enabled: A boolean indicating whether the provider configuration is enabled or disabled
            (optional).
        app: An App instance (optional).
        client_secret: A string which sets the client secret for the new provider.
            This is required for the code flow.
        code_response_type: A boolean which sets whether to enable the code response flow for the
            new provider. By default, this is not enabled if no response type is specified.
            A client secret must be set for this response type.
            Having both the code and ID token response flows is currently not supported.
        id_token_response_type: A boolean which sets whether to enable the ID token response flow
            for the new provider. By default, this is enabled if no response type is specified.
            Having both the code and ID token response flows is currently not supported.

    Returns:
        OIDCProviderConfig: The updated OIDC provider config instance.

    Raises:
        ValueError: If any of the specified input parameters are invalid.
        FirebaseError: If an error occurs while updating the OIDC provider config.
    """
    client = _get_client(app)
    return client.update_oidc_provider_config(
        provider_id, client_id=client_id, issuer=issuer, display_name=display_name,
        enabled=enabled, client_secret=client_secret, id_token_response_type=id_token_response_type,
        code_response_type=code_response_type)


def delete_oidc_provider_config(provider_id, app=None):
    """Deletes the ``OIDCProviderConfig`` with the given ID.

    Args:
        provider_id: Provider ID string.
        app: An App instance (optional).

    Raises:
        ValueError: If the provider ID is invalid, empty or does not have ``oidc.`` prefix.
        ConfigurationNotFoundError: If no OIDC provider is available with the given identifier.
        FirebaseError: If an error occurs while deleting the OIDC provider.
    """
    client = _get_client(app)
    client.delete_oidc_provider_config(provider_id)


def list_oidc_provider_configs(
        page_token=None, max_results=_auth_providers.MAX_LIST_CONFIGS_RESULTS, app=None):
    """Retrieves a page of OIDC provider configs from a Firebase project.

    The ``page_token`` argument governs the starting point of the page. The ``max_results``
    argument governs the maximum number of configs that may be included in the returned
    page. This function never returns ``None``. If there are no OIDC configs in the Firebase
    project, this returns an empty page.

    Args:
        page_token: A non-empty page token string, which indicates the starting point of the
            page (optional). Defaults to ``None``, which will retrieve the first page of users.
        max_results: A positive integer indicating the maximum number of users to include in
            the returned page (optional). Defaults to 100, which is also the maximum number
            allowed.
        app: An App instance (optional).

    Returns:
        ListProviderConfigsPage: A page of OIDC provider config instances.

    Raises:
        ValueError: If ``max_results`` or ``page_token`` are invalid.
        FirebaseError: If an error occurs while retrieving the OIDC provider configs.
    """
    client = _get_client(app)
    return client.list_oidc_provider_configs(page_token, max_results)


def get_saml_provider_config(provider_id, app=None):
    """Returns the ``SAMLProviderConfig`` with the given ID.

    Args:
        provider_id: Provider ID string.
        app: An App instance (optional).

    Returns:
        SAMLProviderConfig: A SAML provider config instance.

    Raises:
        ValueError: If the provider ID is invalid, empty or does not have ``saml.`` prefix.
        ConfigurationNotFoundError: If no SAML provider is available with the given identifier.
        FirebaseError: If an error occurs while retrieving the SAML provider.
    """
    client = _get_client(app)
    return client.get_saml_provider_config(provider_id)


def create_saml_provider_config(
        provider_id, idp_entity_id, sso_url, x509_certificates, rp_entity_id, callback_url,
        display_name=None, enabled=None, app=None):
    """Creates a new SAML provider config from the given parameters.

    SAML provider support requires Google Cloud's Identity Platform (GCIP). To learn more about
    GCIP, including pricing and features, see https://cloud.google.com/identity-platform.

    Args:
        provider_id: Provider ID string. Must have the prefix ``saml.``.
        idp_entity_id: The SAML IdP entity identifier.
        sso_url: The SAML IdP SSO URL. Must be a valid URL.
        x509_certificates: The list of SAML IdP X.509 certificates issued by CA for this provider.
            Multiple certificates are accepted to prevent outages during IdP key rotation (for
            example ADFS rotates every 10 days). When the Auth server receives a SAML response, it
            will match the SAML response with the certificate on record. Otherwise the response is
            rejected. Developers are expected to manage the certificate updates as keys are
            rotated.
        rp_entity_id: The SAML relying party (service provider) entity ID. This is defined by the
            developer but needs to be provided to the SAML IdP.
        callback_url: Callback URL string. This is fixed and must always be the same as the OAuth
            redirect URL provisioned by Firebase Auth, unless a custom authDomain is used.
        display_name: The user-friendly display name to the current configuration (optional). This
            name is also used as the provider label in the Cloud Console.
        enabled: A boolean indicating whether the provider configuration is enabled or disabled
            (optional). A user cannot sign in using a disabled provider.
        app: An App instance (optional).

    Returns:
        SAMLProviderConfig: The newly created SAML provider config instance.

    Raises:
        ValueError: If any of the specified input parameters are invalid.
        FirebaseError: If an error occurs while creating the new SAML provider config.
    """
    client = _get_client(app)
    return client.create_saml_provider_config(
        provider_id, idp_entity_id=idp_entity_id, sso_url=sso_url,
        x509_certificates=x509_certificates, rp_entity_id=rp_entity_id, callback_url=callback_url,
        display_name=display_name, enabled=enabled)


def update_saml_provider_config(
        provider_id, idp_entity_id=None, sso_url=None, x509_certificates=None,
        rp_entity_id=None, callback_url=None, display_name=None, enabled=None, app=None):
    """Updates an existing SAML provider config with the given parameters.

    Args:
        provider_id: Provider ID string. Must have the prefix ``saml.``.
        idp_entity_id: The SAML IdP entity identifier (optional).
        sso_url: The SAML IdP SSO URL. Must be a valid URL (optional).
        x509_certificates: The list of SAML IdP X.509 certificates issued by CA for this
            provider  (optional).
        rp_entity_id: The SAML relying party entity ID (optional).
        callback_url: Callback URL string  (optional).
        display_name: The user-friendly display name of the current configuration (optional).
            Pass ``auth.DELETE_ATTRIBUTE`` to delete the current display name.
        enabled: A boolean indicating whether the provider configuration is enabled or disabled
            (optional).
        app: An App instance (optional).

    Returns:
        SAMLProviderConfig: The updated SAML provider config instance.

    Raises:
        ValueError: If any of the specified input parameters are invalid.
        FirebaseError: If an error occurs while updating the SAML provider config.
    """
    client = _get_client(app)
    return client.update_saml_provider_config(
        provider_id, idp_entity_id=idp_entity_id, sso_url=sso_url,
        x509_certificates=x509_certificates, rp_entity_id=rp_entity_id,
        callback_url=callback_url, display_name=display_name, enabled=enabled)


def delete_saml_provider_config(provider_id, app=None):
    """Deletes the ``SAMLProviderConfig`` with the given ID.

    Args:
        provider_id: Provider ID string.
        app: An App instance (optional).

    Raises:
        ValueError: If the provider ID is invalid, empty or does not have ``saml.`` prefix.
        ConfigurationNotFoundError: If no SAML provider is available with the given identifier.
        FirebaseError: If an error occurs while deleting the SAML provider.
    """
    client = _get_client(app)
    client.delete_saml_provider_config(provider_id)


def list_saml_provider_configs(
        page_token=None, max_results=_auth_providers.MAX_LIST_CONFIGS_RESULTS, app=None):
    """Retrieves a page of SAML provider configs from a Firebase project.

    The ``page_token`` argument governs the starting point of the page. The ``max_results``
    argument governs the maximum number of configs that may be included in the returned
    page. This function never returns ``None``. If there are no SAML configs in the Firebase
    project, this returns an empty page.

    Args:
        page_token: A non-empty page token string, which indicates the starting point of the
            page (optional). Defaults to ``None``, which will retrieve the first page of users.
        max_results: A positive integer indicating the maximum number of users to include in
            the returned page (optional). Defaults to 100, which is also the maximum number
            allowed.
        app: An App instance (optional).

    Returns:
        ListProviderConfigsPage: A page of SAML provider config instances.

    Raises:
        ValueError: If ``max_results`` or ``page_token`` are invalid.
        FirebaseError: If an error occurs while retrieving the SAML provider configs.
    """
    client = _get_client(app)
    return client.list_saml_provider_configs(page_token, max_results)
