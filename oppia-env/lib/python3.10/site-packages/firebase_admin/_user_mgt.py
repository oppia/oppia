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

"""Firebase user management sub module."""

import base64
from collections import defaultdict
import json
from urllib import parse

import requests

from firebase_admin import _auth_utils
from firebase_admin import _rfc3339
from firebase_admin import _user_identifier
from firebase_admin import _user_import
from firebase_admin._user_import import ErrorInfo


MAX_LIST_USERS_RESULTS = 1000
MAX_IMPORT_USERS_SIZE = 1000
B64_REDACTED = base64.b64encode(b'REDACTED')


class Sentinel:

    def __init__(self, description):
        self.description = description


DELETE_ATTRIBUTE = Sentinel('Value used to delete an attribute from a user profile')


class UserMetadata:
    """Contains additional metadata associated with a user account."""

    def __init__(self, creation_timestamp=None, last_sign_in_timestamp=None,
                 last_refresh_timestamp=None):
        self._creation_timestamp = _auth_utils.validate_timestamp(
            creation_timestamp, 'creation_timestamp')
        self._last_sign_in_timestamp = _auth_utils.validate_timestamp(
            last_sign_in_timestamp, 'last_sign_in_timestamp')
        self._last_refresh_timestamp = _auth_utils.validate_timestamp(
            last_refresh_timestamp, 'last_refresh_timestamp')

    @property
    def creation_timestamp(self):
        """ Creation timestamp in milliseconds since the epoch.

        Returns:
          integer: The user creation timestamp in milliseconds since the epoch.
        """
        return self._creation_timestamp

    @property
    def last_sign_in_timestamp(self):
        """ Last sign in timestamp in milliseconds since the epoch.

        Returns:
          integer: The last sign in timestamp in milliseconds since the epoch.
        """
        return self._last_sign_in_timestamp

    @property
    def last_refresh_timestamp(self):
        """The time at which the user was last active (ID token refreshed).

        Returns:
          integer: Milliseconds since epoch timestamp, or `None` if the user was
          never active.
        """
        return self._last_refresh_timestamp


class UserInfo:
    """A collection of standard profile information for a user.

    Used to expose profile information returned by an identity provider.
    """

    @property
    def uid(self):
        """Returns the user ID of this user."""
        raise NotImplementedError

    @property
    def display_name(self):
        """Returns the display name of this user."""
        raise NotImplementedError

    @property
    def email(self):
        """Returns the email address associated with this user."""
        raise NotImplementedError

    @property
    def phone_number(self):
        """Returns the phone number associated with this user."""
        raise NotImplementedError

    @property
    def photo_url(self):
        """Returns the photo URL of this user."""
        raise NotImplementedError

    @property
    def provider_id(self):
        """Returns the ID of the identity provider.

        This can be a short domain name (e.g. google.com), or the identity of an OpenID
        identity provider.
        """
        raise NotImplementedError


class UserRecord(UserInfo):
    """Contains metadata associated with a Firebase user account."""

    def __init__(self, data):
        super(UserRecord, self).__init__()
        if not isinstance(data, dict):
            raise ValueError('Invalid data argument: {0}. Must be a dictionary.'.format(data))
        if not data.get('localId'):
            raise ValueError('User ID must not be None or empty.')
        self._data = data

    @property
    def uid(self):
        """Returns the user ID of this user.

        Returns:
          string: A user ID string. This value is never None or empty.
        """
        return self._data.get('localId')

    @property
    def display_name(self):
        """Returns the display name of this user.

        Returns:
          string: A display name string or None.
        """
        return self._data.get('displayName')

    @property
    def email(self):
        """Returns the email address associated with this user.

        Returns:
          string: An email address string or None.
        """
        return self._data.get('email')

    @property
    def phone_number(self):
        """Returns the phone number associated with this user.

        Returns:
          string: A phone number string or None.
        """
        return self._data.get('phoneNumber')

    @property
    def photo_url(self):
        """Returns the photo URL of this user.

        Returns:
          string: A URL string or None.
        """
        return self._data.get('photoUrl')

    @property
    def provider_id(self):
        """Returns the provider ID of this user.

        Returns:
          string: A constant provider ID value.
        """
        return 'firebase'

    @property
    def email_verified(self):
        """Returns whether the email address of this user has been verified.

        Returns:
          bool: True if the email has been verified, and False otherwise.
        """
        return bool(self._data.get('emailVerified'))

    @property
    def disabled(self):
        """Returns whether this user account is disabled.

        Returns:
          bool: True if the user account is disabled, and False otherwise.
        """
        return bool(self._data.get('disabled'))

    @property
    def tokens_valid_after_timestamp(self):
        """Returns the time, in milliseconds since the epoch, before which tokens are invalid.

        Note: this is truncated to 1 second accuracy.

        Returns:
            int: Timestamp in milliseconds since the epoch, truncated to the second.
            All tokens issued before that time are considered revoked.
        """
        valid_since = self._data.get('validSince')
        if valid_since is not None:
            return 1000 * int(valid_since)
        return 0

    @property
    def user_metadata(self):
        """Returns additional metadata associated with this user.

        Returns:
          UserMetadata: A UserMetadata instance. Does not return None.
        """
        def _int_or_none(key):
            if key in self._data:
                return int(self._data[key])
            return None
        last_refresh_at_millis = None
        last_refresh_at_rfc3339 = self._data.get('lastRefreshAt', None)
        if last_refresh_at_rfc3339:
            last_refresh_at_millis = int(_rfc3339.parse_to_epoch(last_refresh_at_rfc3339) * 1000)
        return UserMetadata(
            _int_or_none('createdAt'), _int_or_none('lastLoginAt'), last_refresh_at_millis)

    @property
    def provider_data(self):
        """Returns a list of UserInfo instances.

        Each object represents an identity from an identity provider that is linked to this user.

        Returns:
          list: A list of UserInfo objects, which may be empty.
        """
        providers = self._data.get('providerUserInfo', [])
        return [ProviderUserInfo(entry) for entry in providers]

    @property
    def custom_claims(self):
        """Returns any custom claims set on this user account.

        Returns:
          dict: A dictionary of claims or None.
        """
        claims = self._data.get('customAttributes')
        if claims:
            parsed = json.loads(claims)
            if parsed != {}:
                return parsed
        return None

    @property
    def tenant_id(self):
        """Returns the tenant ID of this user.

        Returns:
          string: A tenant ID string or None.
        """
        return self._data.get('tenantId')


class ExportedUserRecord(UserRecord):
    """Contains metadata associated with a user including password hash and salt."""

    @property
    def password_hash(self):
        """The user's password hash as a base64-encoded string.

        If the Firebase Auth hashing algorithm (SCRYPT) was used to create the user account, this
        is the base64-encoded password hash of the user. If a different hashing algorithm was
        used to create this user, as is typical when migrating from another Auth system, this
        is an empty string. If no password is set, or if the service account doesn't have permission
        to read the password, then this is ``None``.
        """
        password_hash = self._data.get('passwordHash')

        # If the password hash is redacted (probably due to missing permissions) then clear it out,
        # similar to how the salt is returned. (Otherwise, it *looks* like a b64-encoded hash is
        # present, which is confusing.)
        if password_hash == B64_REDACTED:
            return None
        return password_hash

    @property
    def password_salt(self):
        """The user's password salt as a base64-encoded string.

        If the Firebase Auth hashing algorithm (SCRYPT) was used to create the user account, this
        is the base64-encoded password salt of the user. If a different hashing algorithm was
        used to create this user, as is typical when migrating from another Auth system, this is
        an empty string. If no password is set, or if the service account doesn't have permission to
        read the password, then this is ``None``.
        """
        return self._data.get('salt')


class GetUsersResult:
    """Represents the result of the ``auth.get_users()`` API."""

    def __init__(self, users, not_found):
        """Constructs a `GetUsersResult` object.

        Args:
            users: List of `UserRecord` instances.
            not_found: List of `UserIdentifier` instances.
        """
        self._users = users
        self._not_found = not_found

    @property
    def users(self):
        """Set of `UserRecord` instances, corresponding to the set of users
        that were requested. Only users that were found are listed here. The
        result set is unordered.
        """
        return self._users

    @property
    def not_found(self):
        """Set of `UserIdentifier` instances that were requested, but not
        found.
        """
        return self._not_found


class ListUsersPage:
    """Represents a page of user records exported from a Firebase project.

    Provides methods for traversing the user accounts included in this page, as well as retrieving
    subsequent pages of users. The iterator returned by ``iterate_all()`` can be used to iterate
    through all users in the Firebase project starting from this page.
    """

    def __init__(self, download, page_token, max_results):
        self._download = download
        self._max_results = max_results
        self._current = download(page_token, max_results)

    @property
    def users(self):
        """A list of ``ExportedUserRecord`` instances available in this page."""
        return [ExportedUserRecord(user) for user in self._current.get('users', [])]

    @property
    def next_page_token(self):
        """Page token string for the next page (empty string indicates no more pages)."""
        return self._current.get('nextPageToken', '')

    @property
    def has_next_page(self):
        """A boolean indicating whether more pages are available."""
        return bool(self.next_page_token)

    def get_next_page(self):
        """Retrieves the next page of user accounts, if available.

        Returns:
            ListUsersPage: Next page of users, or None if this is the last page.
        """
        if self.has_next_page:
            return ListUsersPage(self._download, self.next_page_token, self._max_results)
        return None

    def iterate_all(self):
        """Retrieves an iterator for user accounts.

        Returned iterator will iterate through all the user accounts in the Firebase project
        starting from this page. The iterator will never buffer more than one page of users
        in memory at a time.

        Returns:
            iterator: An iterator of ExportedUserRecord instances.
        """
        return _UserIterator(self)


class DeleteUsersResult:
    """Represents the result of the ``auth.delete_users()`` API."""

    def __init__(self, result, total):
        """Constructs a `DeleteUsersResult` object.

        Args:
          result: The proto response, wrapped in a
            `BatchDeleteAccountsResponse` instance.
          total: Total integer number of deletion attempts.
        """
        errors = result.errors
        self._success_count = total - len(errors)
        self._failure_count = len(errors)
        self._errors = errors

    @property
    def success_count(self):
        """Returns the number of users that were deleted successfully (possibly
        zero).

        Users that did not exist prior to calling `delete_users()` are
        considered to be successfully deleted.
        """
        return self._success_count

    @property
    def failure_count(self):
        """Returns the number of users that failed to be deleted (possibly
        zero).
        """
        return self._failure_count

    @property
    def errors(self):
        """A list of `auth.ErrorInfo` instances describing the errors that
        were encountered during the deletion. Length of this list is equal to
        `failure_count`.
        """
        return self._errors


class BatchDeleteAccountsResponse:
    """Represents the results of a `delete_users()` call."""

    def __init__(self, errors=None):
        """Constructs a `BatchDeleteAccountsResponse` instance, corresponding to
        the JSON representing the `BatchDeleteAccountsResponse` proto.

        Args:
            errors: List of dictionaries, with each dictionary representing an
                `ErrorInfo` instance as returned by the server. `None` implies
                an empty list.
        """
        self.errors = [ErrorInfo(err) for err in errors] if errors else []


class ProviderUserInfo(UserInfo):
    """Contains metadata regarding how a user is known by a particular identity provider."""

    def __init__(self, data):
        super(ProviderUserInfo, self).__init__()
        if not isinstance(data, dict):
            raise ValueError('Invalid data argument: {0}. Must be a dictionary.'.format(data))
        if not data.get('rawId'):
            raise ValueError('User ID must not be None or empty.')
        self._data = data

    @property
    def uid(self):
        return self._data.get('rawId')

    @property
    def display_name(self):
        return self._data.get('displayName')

    @property
    def email(self):
        return self._data.get('email')

    @property
    def phone_number(self):
        return self._data.get('phoneNumber')

    @property
    def photo_url(self):
        return self._data.get('photoUrl')

    @property
    def provider_id(self):
        return self._data.get('providerId')


class ActionCodeSettings:
    """Contains required continue/state URL with optional Android and iOS settings.
    Used when invoking the email action link generation APIs.
    """

    def __init__(self, url, handle_code_in_app=None, dynamic_link_domain=None, ios_bundle_id=None,
                 android_package_name=None, android_install_app=None, android_minimum_version=None):
        self.url = url
        self.handle_code_in_app = handle_code_in_app
        self.dynamic_link_domain = dynamic_link_domain
        self.ios_bundle_id = ios_bundle_id
        self.android_package_name = android_package_name
        self.android_install_app = android_install_app
        self.android_minimum_version = android_minimum_version


def encode_action_code_settings(settings):
    """ Validates the provided action code settings for email link generation and
    populates the REST api parameters.

    settings - ``ActionCodeSettings`` object provided to be encoded
    returns  - dict of parameters to be passed for link gereration.
    """

    parameters = {}
    # url
    if not settings.url:
        raise ValueError("Dynamic action links url is mandatory")

    try:
        parsed = parse.urlparse(settings.url)
        if not parsed.netloc:
            raise ValueError('Malformed dynamic action links url: "{0}".'.format(settings.url))
        parameters['continueUrl'] = settings.url
    except Exception:
        raise ValueError('Malformed dynamic action links url: "{0}".'.format(settings.url))

    # handle_code_in_app
    if settings.handle_code_in_app is not None:
        if not isinstance(settings.handle_code_in_app, bool):
            raise ValueError('Invalid value provided for handle_code_in_app: {0}'
                             .format(settings.handle_code_in_app))
        parameters['canHandleCodeInApp'] = settings.handle_code_in_app

    # dynamic_link_domain
    if settings.dynamic_link_domain is not None:
        if not isinstance(settings.dynamic_link_domain, str):
            raise ValueError('Invalid value provided for dynamic_link_domain: {0}'
                             .format(settings.dynamic_link_domain))
        parameters['dynamicLinkDomain'] = settings.dynamic_link_domain

    # ios_bundle_id
    if settings.ios_bundle_id is not None:
        if not isinstance(settings.ios_bundle_id, str):
            raise ValueError('Invalid value provided for ios_bundle_id: {0}'
                             .format(settings.ios_bundle_id))
        parameters['iOSBundleId'] = settings.ios_bundle_id

    # android_* attributes
    if (settings.android_minimum_version or settings.android_install_app) \
        and not settings.android_package_name:
        raise ValueError("Android package name is required when specifying other Android settings")

    if settings.android_package_name is not None:
        if not isinstance(settings.android_package_name, str):
            raise ValueError('Invalid value provided for android_package_name: {0}'
                             .format(settings.android_package_name))
        parameters['androidPackageName'] = settings.android_package_name

    if settings.android_minimum_version is not None:
        if not isinstance(settings.android_minimum_version, str):
            raise ValueError('Invalid value provided for android_minimum_version: {0}'
                             .format(settings.android_minimum_version))
        parameters['androidMinimumVersion'] = settings.android_minimum_version

    if settings.android_install_app is not None:
        if not isinstance(settings.android_install_app, bool):
            raise ValueError('Invalid value provided for android_install_app: {0}'
                             .format(settings.android_install_app))
        parameters['androidInstallApp'] = settings.android_install_app

    return parameters


class UserManager:
    """Provides methods for interacting with the Google Identity Toolkit."""

    ID_TOOLKIT_URL = 'https://identitytoolkit.googleapis.com/v1'

    def __init__(self, http_client, project_id, tenant_id=None, url_override=None):
        self.http_client = http_client
        url_prefix = url_override or self.ID_TOOLKIT_URL
        self.base_url = '{0}/projects/{1}'.format(url_prefix, project_id)
        if tenant_id:
            self.base_url += '/tenants/{0}'.format(tenant_id)

    def get_user(self, **kwargs):
        """Gets the user data corresponding to the provided key."""
        if 'uid' in kwargs:
            key, key_type = kwargs.pop('uid'), 'user ID'
            payload = {'localId' : [_auth_utils.validate_uid(key, required=True)]}
        elif 'email' in kwargs:
            key, key_type = kwargs.pop('email'), 'email'
            payload = {'email' : [_auth_utils.validate_email(key, required=True)]}
        elif 'phone_number' in kwargs:
            key, key_type = kwargs.pop('phone_number'), 'phone number'
            payload = {'phoneNumber' : [_auth_utils.validate_phone(key, required=True)]}
        else:
            raise TypeError('Unsupported keyword arguments: {0}.'.format(kwargs))

        body, http_resp = self._make_request('post', '/accounts:lookup', json=payload)
        if not body or not body.get('users'):
            raise _auth_utils.UserNotFoundError(
                'No user record found for the provided {0}: {1}.'.format(key_type, key),
                http_response=http_resp)
        return body['users'][0]

    def get_users(self, identifiers):
        """Looks up multiple users by their identifiers (uid, email, etc.)

        Args:
            identifiers: UserIdentifier[]: The identifiers indicating the user
                to be looked up. Must have <= 100 entries.

        Returns:
            list[dict[string, string]]: List of dicts representing the JSON
            `UserInfo` responses from the server.

        Raises:
            ValueError: If any of the identifiers are invalid or if more than
                100 identifiers are specified.
            UnexpectedResponseError: If the backend server responds with an
                unexpected message.
        """
        if not identifiers:
            return []
        if len(identifiers) > 100:
            raise ValueError('`identifiers` parameter must have <= 100 entries.')

        payload = defaultdict(list)
        for identifier in identifiers:
            if isinstance(identifier, _user_identifier.UidIdentifier):
                payload['localId'].append(identifier.uid)
            elif isinstance(identifier, _user_identifier.EmailIdentifier):
                payload['email'].append(identifier.email)
            elif isinstance(identifier, _user_identifier.PhoneIdentifier):
                payload['phoneNumber'].append(identifier.phone_number)
            elif isinstance(identifier, _user_identifier.ProviderIdentifier):
                payload['federatedUserId'].append({
                    'providerId': identifier.provider_id,
                    'rawId': identifier.provider_uid
                })
            else:
                raise ValueError(
                    'Invalid entry in "identifiers" list. Unsupported type: {}'
                    .format(type(identifier)))

        body, http_resp = self._make_request(
            'post', '/accounts:lookup', json=payload)
        if not http_resp.ok:
            raise _auth_utils.UnexpectedResponseError(
                'Failed to get users.', http_response=http_resp)
        return body.get('users', [])

    def list_users(self, page_token=None, max_results=MAX_LIST_USERS_RESULTS):
        """Retrieves a batch of users."""
        if page_token is not None:
            if not isinstance(page_token, str) or not page_token:
                raise ValueError('Page token must be a non-empty string.')
        if not isinstance(max_results, int):
            raise ValueError('Max results must be an integer.')
        if max_results < 1 or max_results > MAX_LIST_USERS_RESULTS:
            raise ValueError(
                'Max results must be a positive integer less than '
                '{0}.'.format(MAX_LIST_USERS_RESULTS))

        payload = {'maxResults': max_results}
        if page_token:
            payload['nextPageToken'] = page_token
        body, _ = self._make_request('get', '/accounts:batchGet', params=payload)
        return body

    def create_user(self, uid=None, display_name=None, email=None, phone_number=None,
                    photo_url=None, password=None, disabled=None, email_verified=None):
        """Creates a new user account with the specified properties."""
        payload = {
            'localId': _auth_utils.validate_uid(uid),
            'displayName': _auth_utils.validate_display_name(display_name),
            'email': _auth_utils.validate_email(email),
            'phoneNumber': _auth_utils.validate_phone(phone_number),
            'photoUrl': _auth_utils.validate_photo_url(photo_url),
            'password': _auth_utils.validate_password(password),
            'emailVerified': bool(email_verified) if email_verified is not None else None,
            'disabled': bool(disabled) if disabled is not None else None,
        }
        payload = {k: v for k, v in payload.items() if v is not None}
        body, http_resp = self._make_request('post', '/accounts', json=payload)
        if not body or not body.get('localId'):
            raise _auth_utils.UnexpectedResponseError(
                'Failed to create new user.', http_response=http_resp)
        return body.get('localId')

    def update_user(self, uid, display_name=None, email=None, phone_number=None,
                    photo_url=None, password=None, disabled=None, email_verified=None,
                    valid_since=None, custom_claims=None, providers_to_delete=None):
        """Updates an existing user account with the specified properties"""
        payload = {
            'localId': _auth_utils.validate_uid(uid, required=True),
            'email': _auth_utils.validate_email(email),
            'password': _auth_utils.validate_password(password),
            'validSince': _auth_utils.validate_timestamp(valid_since, 'valid_since'),
            'emailVerified': bool(email_verified) if email_verified is not None else None,
            'disableUser': bool(disabled) if disabled is not None else None,
        }

        remove = []
        remove_provider = _auth_utils.validate_provider_ids(providers_to_delete)
        if display_name is not None:
            if display_name is DELETE_ATTRIBUTE:
                remove.append('DISPLAY_NAME')
            else:
                payload['displayName'] = _auth_utils.validate_display_name(display_name)
        if photo_url is not None:
            if photo_url is DELETE_ATTRIBUTE:
                remove.append('PHOTO_URL')
            else:
                payload['photoUrl'] = _auth_utils.validate_photo_url(photo_url)
        if remove:
            payload['deleteAttribute'] = remove

        if phone_number is not None:
            if phone_number is DELETE_ATTRIBUTE:
                remove_provider.append('phone')
            else:
                payload['phoneNumber'] = _auth_utils.validate_phone(phone_number)

        if custom_claims is not None:
            if custom_claims is DELETE_ATTRIBUTE:
                custom_claims = {}
            json_claims = json.dumps(custom_claims) if isinstance(
                custom_claims, dict) else custom_claims
            payload['customAttributes'] = _auth_utils.validate_custom_claims(json_claims)

        if remove_provider:
            payload['deleteProvider'] = list(set(remove_provider))

        payload = {k: v for k, v in payload.items() if v is not None}
        body, http_resp = self._make_request('post', '/accounts:update', json=payload)
        if not body or not body.get('localId'):
            raise _auth_utils.UnexpectedResponseError(
                'Failed to update user: {0}.'.format(uid), http_response=http_resp)
        return body.get('localId')

    def delete_user(self, uid):
        """Deletes the user identified by the specified user ID."""
        _auth_utils.validate_uid(uid, required=True)
        body, http_resp = self._make_request('post', '/accounts:delete', json={'localId' : uid})
        if not body or not body.get('kind'):
            raise _auth_utils.UnexpectedResponseError(
                'Failed to delete user: {0}.'.format(uid), http_response=http_resp)

    def delete_users(self, uids, force_delete=False):
        """Deletes the users identified by the specified user ids.

        Args:
            uids: A list of strings indicating the uids of the users to be deleted.
                Must have <= 1000 entries.
            force_delete: Optional parameter that indicates if users should be
                deleted, even if they're not disabled. Defaults to False.


        Returns:
            BatchDeleteAccountsResponse: Server's proto response, wrapped in a
            python object.

        Raises:
            ValueError: If any of the identifiers are invalid or if more than 1000
                identifiers are specified.
            UnexpectedResponseError: If the backend server responds with an
                unexpected message.
        """
        if not uids:
            return BatchDeleteAccountsResponse()

        if len(uids) > 1000:
            raise ValueError("`uids` paramter must have <= 1000 entries.")
        for uid in uids:
            _auth_utils.validate_uid(uid, required=True)

        body, http_resp = self._make_request('post', '/accounts:batchDelete',
                                             json={'localIds': uids, 'force': force_delete})
        if not isinstance(body, dict):
            raise _auth_utils.UnexpectedResponseError(
                'Unexpected response from server while attempting to delete users.',
                http_response=http_resp)
        return BatchDeleteAccountsResponse(body.get('errors', []))

    def import_users(self, users, hash_alg=None):
        """Imports the given list of users to Firebase Auth."""
        try:
            if not users or len(users) > MAX_IMPORT_USERS_SIZE:
                raise ValueError(
                    'Users must be a non-empty list with no more than {0} elements.'.format(
                        MAX_IMPORT_USERS_SIZE))
            if any([not isinstance(u, _user_import.ImportUserRecord) for u in users]):
                raise ValueError('One or more user objects are invalid.')
        except TypeError:
            raise ValueError('users must be iterable')

        payload = {'users': [u.to_dict() for u in users]}
        if any(['passwordHash' in u for u in payload['users']]):
            if not isinstance(hash_alg, _user_import.UserImportHash):
                raise ValueError('A UserImportHash is required to import users with passwords.')
            payload.update(hash_alg.to_dict())
        body, http_resp = self._make_request('post', '/accounts:batchCreate', json=payload)
        if not isinstance(body, dict):
            raise _auth_utils.UnexpectedResponseError(
                'Failed to import users.', http_response=http_resp)
        return body

    def generate_email_action_link(self, action_type, email, action_code_settings=None):
        """Fetches the email action links for types

        Args:
            action_type: String. Valid values ['VERIFY_EMAIL', 'EMAIL_SIGNIN', 'PASSWORD_RESET']
            email: Email of the user for which the action is performed
            action_code_settings: ``ActionCodeSettings`` object or dict (optional). Defines whether
                the link is to be handled by a mobile app and the additional state information to be
                passed in the deep link, etc.
        Returns:
            link_url: action url to be emailed to the user

        Raises:
            UnexpectedResponseError: If the backend server responds with an unexpected message
            FirebaseError: If an error occurs while generating the link
            ValueError: If the provided arguments are invalid
        """
        payload = {
            'requestType': _auth_utils.validate_action_type(action_type),
            'email': _auth_utils.validate_email(email),
            'returnOobLink': True
        }

        if action_code_settings:
            payload.update(encode_action_code_settings(action_code_settings))

        body, http_resp = self._make_request('post', '/accounts:sendOobCode', json=payload)
        if not body or not body.get('oobLink'):
            raise _auth_utils.UnexpectedResponseError(
                'Failed to generate email action link.', http_response=http_resp)
        return body.get('oobLink')

    def _make_request(self, method, path, **kwargs):
        url = '{0}{1}'.format(self.base_url, path)
        try:
            return self.http_client.body_and_response(method, url, **kwargs)
        except requests.exceptions.RequestException as error:
            raise _auth_utils.handle_auth_backend_error(error)


class _UserIterator(_auth_utils.PageIterator):

    @property
    def items(self):
        return self._current_page.users
