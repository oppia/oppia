# Copyright 2018 Google Inc.
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

"""Firebase user import sub module."""

import base64
import json

from firebase_admin import _auth_utils


def b64_encode(bytes_value):
    return base64.urlsafe_b64encode(bytes_value).decode()


class UserProvider:
    """Represents a user identity provider that can be associated with a Firebase user.

    One or more providers can be specified in an ``ImportUserRecord`` when importing users via
    ``auth.import_users()``.

    Args:
        uid: User's unique ID assigned by the identity provider.
        provider_id: ID of the identity provider. This can be a short domain name or the identifier
            of an OpenID identity provider.
        email: User's email address (optional).
        display_name: User's display name (optional).
        photo_url: User's photo URL (optional).
    """

    def __init__(self, uid, provider_id, email=None, display_name=None, photo_url=None):
        self.uid = uid
        self.provider_id = provider_id
        self.email = email
        self.display_name = display_name
        self.photo_url = photo_url

    @property
    def uid(self):
        return self._uid

    @uid.setter
    def uid(self, uid):
        self._uid = _auth_utils.validate_uid(uid, required=True)

    @property
    def provider_id(self):
        return self._provider_id

    @provider_id.setter
    def provider_id(self, provider_id):
        self._provider_id = _auth_utils.validate_provider_id(provider_id, required=True)

    @property
    def email(self):
        return self._email

    @email.setter
    def email(self, email):
        self._email = _auth_utils.validate_email(email)

    @property
    def display_name(self):
        return self._display_name

    @display_name.setter
    def display_name(self, display_name):
        self._display_name = _auth_utils.validate_display_name(display_name)

    @property
    def photo_url(self):
        return self._photo_url

    @photo_url.setter
    def photo_url(self, photo_url):
        self._photo_url = _auth_utils.validate_photo_url(photo_url)

    def to_dict(self):
        payload = {
            'rawId': self.uid,
            'providerId': self.provider_id,
            'displayName': self.display_name,
            'email': self.email,
            'photoUrl': self.photo_url,
        }
        return {k: v for k, v in payload.items() if v is not None}


class ImportUserRecord:
    """Represents a user account to be imported to Firebase Auth.

    Must specify the ``uid`` field at a minimum. A sequence of ``ImportUserRecord`` objects can be
    passed to the ``auth.import_users()`` function, in order to import those users into Firebase
    Auth in bulk. If the ``password_hash`` is set on a user, a hash configuration must be
    specified when calling ``import_users()``.

    Args:
        uid: User's unique ID. Must be a non-empty string not longer than 128 characters.
        email: User's email address (optional).
        email_verified: A boolean indicating whether the user's email has been verified (optional).
        display_name: User's display name (optional).
        phone_number: User's phone number (optional).
        photo_url: User's photo URL (optional).
        disabled: A boolean indicating whether this user account has been disabled (optional).
        user_metadata: An ``auth.UserMetadata`` instance with additional user metadata (optional).
        provider_data: A list of ``auth.UserProvider`` instances (optional).
        custom_claims: A ``dict`` of custom claims to be set on the user account (optional).
        password_hash: User's password hash as a ``bytes`` sequence (optional).
        password_salt: User's password salt as a ``bytes`` sequence (optional).

    Raises:
        ValueError: If provided arguments are invalid.
    """

    def __init__(self, uid, email=None, email_verified=None, display_name=None, phone_number=None,
                 photo_url=None, disabled=None, user_metadata=None, provider_data=None,
                 custom_claims=None, password_hash=None, password_salt=None):
        self.uid = uid
        self.email = email
        self.display_name = display_name
        self.phone_number = phone_number
        self.photo_url = photo_url
        self.password_hash = password_hash
        self.password_salt = password_salt
        self.email_verified = email_verified
        self.disabled = disabled
        self.user_metadata = user_metadata
        self.provider_data = provider_data
        self.custom_claims = custom_claims

    @property
    def uid(self):
        return self._uid

    @uid.setter
    def uid(self, uid):
        self._uid = _auth_utils.validate_uid(uid, required=True)

    @property
    def email(self):
        return self._email

    @email.setter
    def email(self, email):
        self._email = _auth_utils.validate_email(email)

    @property
    def display_name(self):
        return self._display_name

    @display_name.setter
    def display_name(self, display_name):
        self._display_name = _auth_utils.validate_display_name(display_name)

    @property
    def phone_number(self):
        return self._phone_number

    @phone_number.setter
    def phone_number(self, phone_number):
        self._phone_number = _auth_utils.validate_phone(phone_number)

    @property
    def photo_url(self):
        return self._photo_url

    @photo_url.setter
    def photo_url(self, photo_url):
        self._photo_url = _auth_utils.validate_photo_url(photo_url)

    @property
    def password_hash(self):
        return self._password_hash

    @password_hash.setter
    def password_hash(self, password_hash):
        self._password_hash = _auth_utils.validate_bytes(password_hash, 'password_hash')

    @property
    def password_salt(self):
        return self._password_salt

    @password_salt.setter
    def password_salt(self, password_salt):
        self._password_salt = _auth_utils.validate_bytes(password_salt, 'password_salt')

    @property
    def user_metadata(self):
        return self._user_metadata

    @user_metadata.setter
    def user_metadata(self, user_metadata):
        created_at = user_metadata.creation_timestamp if user_metadata is not None else None
        last_login_at = user_metadata.last_sign_in_timestamp if user_metadata is not None else None
        self._created_at = _auth_utils.validate_timestamp(created_at, 'creation_timestamp')
        self._last_login_at = _auth_utils.validate_timestamp(
            last_login_at, 'last_sign_in_timestamp')
        self._user_metadata = user_metadata

    @property
    def provider_data(self):
        return self._provider_data

    @provider_data.setter
    def provider_data(self, provider_data):
        if provider_data is not None:
            try:
                if any([not isinstance(p, UserProvider) for p in provider_data]):
                    raise ValueError('One or more provider data instances are invalid.')
            except TypeError:
                raise ValueError('provider_data must be iterable.')
        self._provider_data = provider_data

    @property
    def custom_claims(self):
        return self._custom_claims

    @custom_claims.setter
    def custom_claims(self, custom_claims):
        json_claims = json.dumps(custom_claims) if isinstance(
            custom_claims, dict) else custom_claims
        self._custom_claims_str = _auth_utils.validate_custom_claims(json_claims)
        self._custom_claims = custom_claims

    def to_dict(self):
        """Returns a dict representation of the user. For internal use only."""
        payload = {
            'localId': self.uid,
            'email': self.email,
            'displayName': self.display_name,
            'phoneNumber': self.phone_number,
            'photoUrl': self.photo_url,
            'emailVerified': (bool(self.email_verified)
                              if self.email_verified is not None else None),
            'disabled': bool(self.disabled) if self.disabled is not None else None,
            'customAttributes': self._custom_claims_str,
            'createdAt': self._created_at,
            'lastLoginAt': self._last_login_at,
            'passwordHash': b64_encode(self.password_hash) if self.password_hash else None,
            'salt': b64_encode(self.password_salt) if self.password_salt else None,
        }
        if self.provider_data:
            payload['providerUserInfo'] = [p.to_dict() for p in self.provider_data]
        return {k: v for k, v in payload.items() if v is not None}


class UserImportHash:
    """Represents a hash algorithm used to hash user passwords.

    An instance of this class must be specified when importing users with passwords via the
    ``auth.import_users()`` API. Use one of the provided class methods to obtain new
    instances when required. Refer to `documentation`_ for more details.

    .. _documentation: https://firebase.google.com/docs/auth/admin/import-users
    """

    def __init__(self, name, data=None):
        self._name = name
        self._data = data

    def to_dict(self):
        payload = {'hashAlgorithm': self._name}
        if self._data:
            payload.update(self._data)
        return payload

    @classmethod
    def _hmac(cls, name, key):
        data = {
            'signerKey': b64_encode(_auth_utils.validate_bytes(key, 'key', required=True))
        }
        return UserImportHash(name, data)

    @classmethod
    def hmac_sha512(cls, key):
        """Creates a new HMAC SHA512 algorithm instance.

        Args:
            key: Signer key as a byte sequence.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        return cls._hmac('HMAC_SHA512', key)

    @classmethod
    def hmac_sha256(cls, key):
        """Creates a new HMAC SHA256 algorithm instance.

        Args:
            key: Signer key as a byte sequence.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        return cls._hmac('HMAC_SHA256', key)

    @classmethod
    def hmac_sha1(cls, key):
        """Creates a new HMAC SHA1 algorithm instance.

        Args:
            key: Signer key as a byte sequence.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        return cls._hmac('HMAC_SHA1', key)

    @classmethod
    def hmac_md5(cls, key):
        """Creates a new HMAC MD5 algorithm instance.

        Args:
            key: Signer key as a byte sequence.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        return cls._hmac('HMAC_MD5', key)

    @classmethod
    def md5(cls, rounds):
        """Creates a new MD5 algorithm instance.

        Args:
            rounds: Number of rounds. Must be an integer between 0 and 8192.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        return UserImportHash(
            'MD5',
            {'rounds': _auth_utils.validate_int(rounds, 'rounds', 0, 8192)})

    @classmethod
    def sha1(cls, rounds):
        """Creates a new SHA1 algorithm instance.

        Args:
            rounds: Number of rounds. Must be an integer between 1 and 8192.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        return UserImportHash(
            'SHA1',
            {'rounds': _auth_utils.validate_int(rounds, 'rounds', 1, 8192)})

    @classmethod
    def sha256(cls, rounds):
        """Creates a new SHA256 algorithm instance.

        Args:
            rounds: Number of rounds. Must be an integer between 1 and 8192.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        return UserImportHash(
            'SHA256',
            {'rounds': _auth_utils.validate_int(rounds, 'rounds', 1, 8192)})

    @classmethod
    def sha512(cls, rounds):
        """Creates a new SHA512 algorithm instance.

        Args:
            rounds: Number of rounds. Must be an integer between 1 and 8192.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        return UserImportHash(
            'SHA512',
            {'rounds': _auth_utils.validate_int(rounds, 'rounds', 1, 8192)})

    @classmethod
    def pbkdf_sha1(cls, rounds):
        """Creates a new PBKDF SHA1 algorithm instance.

        Args:
            rounds: Number of rounds. Must be an integer between 0 and 120000.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        return UserImportHash(
            'PBKDF_SHA1',
            {'rounds': _auth_utils.validate_int(rounds, 'rounds', 0, 120000)})

    @classmethod
    def pbkdf2_sha256(cls, rounds):
        """Creates a new PBKDF2 SHA256 algorithm instance.

        Args:
            rounds: Number of rounds. Must be an integer between 0 and 120000.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        return UserImportHash(
            'PBKDF2_SHA256',
            {'rounds': _auth_utils.validate_int(rounds, 'rounds', 0, 120000)})

    @classmethod
    def scrypt(cls, key, rounds, memory_cost, salt_separator=None):
        """Creates a new Scrypt algorithm instance.

        This is the modified Scrypt algorithm used by Firebase Auth. See ``standard_scrypt()``
        function for the standard Scrypt algorith,

        Args:
            key: Signer key as a byte sequence.
            rounds: Number of rounds. Must be an integer between 1 and 8.
            memory_cost: Memory cost as an integer between 1 and 14.
            salt_separator: Salt separator as a byte sequence (optional).

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        data = {
            'signerKey': b64_encode(_auth_utils.validate_bytes(key, 'key', required=True)),
            'rounds': _auth_utils.validate_int(rounds, 'rounds', 1, 8),
            'memoryCost': _auth_utils.validate_int(memory_cost, 'memory_cost', 1, 14),
        }
        if salt_separator:
            data['saltSeparator'] = b64_encode(_auth_utils.validate_bytes(
                salt_separator, 'salt_separator'))
        return UserImportHash('SCRYPT', data)

    @classmethod
    def bcrypt(cls):
        """Creates a new Bcrypt algorithm instance.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        return UserImportHash('BCRYPT')

    @classmethod
    def standard_scrypt(cls, memory_cost, parallelization, block_size, derived_key_length):
        """Creates a new standard Scrypt algorithm instance.

        Args:
            memory_cost: CPU Memory cost as a non-negative integer.
            parallelization: Parallelization as a non-negative integer.
            block_size: Block size as a non-negative integer.
            derived_key_length: Derived key length as a non-negative integer.

        Returns:
            UserImportHash: A new ``UserImportHash``.
        """
        data = {
            'cpuMemCost': _auth_utils.validate_int(memory_cost, 'memory_cost', low=0),
            'parallelization': _auth_utils.validate_int(parallelization, 'parallelization', low=0),
            'blockSize': _auth_utils.validate_int(block_size, 'block_size', low=0),
            'dkLen': _auth_utils.validate_int(derived_key_length, 'derived_key_length', low=0),
        }
        return UserImportHash('STANDARD_SCRYPT', data)


class ErrorInfo:
    """Represents an error encountered while performing a batch operation such
    as importing users or deleting multiple user accounts.
    """
    # TODO(rsgowman): This class used to be specific to importing users (hence
    # it's home in _user_import.py). It's now also used by bulk deletion of
    # users. Move this to a more common location.

    def __init__(self, error):
        self._index = error['index']
        self._reason = error['message']

    @property
    def index(self):
        return self._index

    @property
    def reason(self):
        return self._reason


class UserImportResult:
    """Represents the result of a bulk user import operation.

    See ``auth.import_users()`` API for more details.
    """

    def __init__(self, result, total):
        errors = result.get('error', [])
        self._success_count = total - len(errors)
        self._failure_count = len(errors)
        self._errors = [ErrorInfo(err) for err in errors]

    @property
    def success_count(self):
        """Returns the number of users successfully imported."""
        return self._success_count

    @property
    def failure_count(self):
        """Returns the number of users that failed to be imported."""
        return self._failure_count

    @property
    def errors(self):
        """Returns a list of ``auth.ErrorInfo`` instances describing the errors encountered."""
        return self._errors
