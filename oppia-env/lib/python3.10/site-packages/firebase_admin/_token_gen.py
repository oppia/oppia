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

"""Firebase token minting and validation sub module."""

import datetime
import time

import cachecontrol
import requests
from google.auth import credentials
from google.auth import iam
from google.auth import jwt
from google.auth import transport
import google.auth.exceptions
import google.oauth2.id_token
import google.oauth2.service_account

from firebase_admin import exceptions
from firebase_admin import _auth_utils
from firebase_admin import _http_client


# ID token constants
ID_TOKEN_ISSUER_PREFIX = 'https://securetoken.google.com/'
ID_TOKEN_CERT_URI = ('https://www.googleapis.com/robot/v1/metadata/x509/'
                     'securetoken@system.gserviceaccount.com')

# Session cookie constants
COOKIE_ISSUER_PREFIX = 'https://session.firebase.google.com/'
COOKIE_CERT_URI = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys'
MIN_SESSION_COOKIE_DURATION_SECONDS = int(datetime.timedelta(minutes=5).total_seconds())
MAX_SESSION_COOKIE_DURATION_SECONDS = int(datetime.timedelta(days=14).total_seconds())

# Custom token constants
MAX_TOKEN_LIFETIME_SECONDS = int(datetime.timedelta(hours=1).total_seconds())
FIREBASE_AUDIENCE = ('https://identitytoolkit.googleapis.com/google.'
                     'identity.identitytoolkit.v1.IdentityToolkit')
RESERVED_CLAIMS = set([
    'acr', 'amr', 'at_hash', 'aud', 'auth_time', 'azp', 'cnf', 'c_hash',
    'exp', 'firebase', 'iat', 'iss', 'jti', 'nbf', 'nonce', 'sub'
])
METADATA_SERVICE_URL = ('http://metadata.google.internal/computeMetadata/v1/instance/'
                        'service-accounts/default/email')
ALGORITHM_RS256 = 'RS256'
ALGORITHM_NONE = 'none'

# Emulator fake account
AUTH_EMULATOR_EMAIL = 'firebase-auth-emulator@example.com'


class _EmulatedSigner(google.auth.crypt.Signer):
    key_id = None

    def __init__(self):
        pass

    def sign(self, message):
        return b''


class _SigningProvider:
    """Stores a reference to a google.auth.crypto.Signer."""

    def __init__(self, signer, signer_email, alg=ALGORITHM_RS256):
        self._signer = signer
        self._signer_email = signer_email
        self._alg = alg

    @property
    def signer(self):
        return self._signer

    @property
    def signer_email(self):
        return self._signer_email

    @property
    def alg(self):
        return self._alg

    @classmethod
    def from_credential(cls, google_cred):
        return _SigningProvider(google_cred.signer, google_cred.signer_email)

    @classmethod
    def from_iam(cls, request, google_cred, service_account):
        signer = iam.Signer(request, google_cred, service_account)
        return _SigningProvider(signer, service_account)

    @classmethod
    def for_emulator(cls):
        return _SigningProvider(_EmulatedSigner(), AUTH_EMULATOR_EMAIL, ALGORITHM_NONE)


class TokenGenerator:
    """Generates custom tokens and session cookies."""

    ID_TOOLKIT_URL = 'https://identitytoolkit.googleapis.com/v1'

    def __init__(self, app, http_client, url_override=None):
        self.app = app
        self.http_client = http_client
        self.request = transport.requests.Request()
        url_prefix = url_override or self.ID_TOOLKIT_URL
        self.base_url = '{0}/projects/{1}'.format(url_prefix, app.project_id)
        self._signing_provider = None

    def _init_signing_provider(self):
        """Initializes a signing provider by following the go/firebase-admin-sign protocol."""
        if _auth_utils.is_emulated():
            return _SigningProvider.for_emulator()
        # If the SDK was initialized with a service account, use it to sign bytes.
        google_cred = self.app.credential.get_credential()
        if isinstance(google_cred, google.oauth2.service_account.Credentials):
            return _SigningProvider.from_credential(google_cred)

        # If the SDK was initialized with a service account email, use it with the IAM service
        # to sign bytes.
        service_account = self.app.options.get('serviceAccountId')
        if service_account:
            return _SigningProvider.from_iam(self.request, google_cred, service_account)

        # If the SDK was initialized with some other credential type that supports signing
        # (e.g. GAE credentials), use it to sign bytes.
        if isinstance(google_cred, credentials.Signing):
            return _SigningProvider.from_credential(google_cred)

        # Attempt to discover a service account email from the local Metadata service. Use it
        # with the IAM service to sign bytes.
        resp = self.request(url=METADATA_SERVICE_URL, headers={'Metadata-Flavor': 'Google'})
        if resp.status != 200:
            raise ValueError(
                'Failed to contact the local metadata service: {0}.'.format(resp.data.decode()))
        service_account = resp.data.decode()
        return _SigningProvider.from_iam(self.request, google_cred, service_account)

    @property
    def signing_provider(self):
        """Initializes and returns the SigningProvider instance to be used."""
        if not self._signing_provider:
            try:
                self._signing_provider = self._init_signing_provider()
            except Exception as error:
                url = 'https://firebase.google.com/docs/auth/admin/create-custom-tokens'
                raise ValueError(
                    'Failed to determine service account: {0}. Make sure to initialize the SDK '
                    'with service account credentials or specify a service account ID with '
                    'iam.serviceAccounts.signBlob permission. Please refer to {1} for more '
                    'details on creating custom tokens.'.format(error, url))
        return self._signing_provider

    def create_custom_token(self, uid, developer_claims=None, tenant_id=None):
        """Builds and signs a Firebase custom auth token."""
        if developer_claims is not None:
            if not isinstance(developer_claims, dict):
                raise ValueError('developer_claims must be a dictionary')

            disallowed_keys = set(developer_claims.keys()) & RESERVED_CLAIMS
            if disallowed_keys:
                if len(disallowed_keys) > 1:
                    error_message = ('Developer claims {0} are reserved and '
                                     'cannot be specified.'.format(
                                         ', '.join(disallowed_keys)))
                else:
                    error_message = ('Developer claim {0} is reserved and '
                                     'cannot be specified.'.format(
                                         ', '.join(disallowed_keys)))
                raise ValueError(error_message)

        if not uid or not isinstance(uid, str) or len(uid) > 128:
            raise ValueError('uid must be a string between 1 and 128 characters.')

        signing_provider = self.signing_provider
        now = int(time.time())
        payload = {
            'iss': signing_provider.signer_email,
            'sub': signing_provider.signer_email,
            'aud': FIREBASE_AUDIENCE,
            'uid': uid,
            'iat': now,
            'exp': now + MAX_TOKEN_LIFETIME_SECONDS,
        }
        if tenant_id:
            payload['tenant_id'] = tenant_id

        if developer_claims is not None:
            payload['claims'] = developer_claims

        header = {'alg': signing_provider.alg}
        try:
            return jwt.encode(signing_provider.signer, payload, header=header)
        except google.auth.exceptions.TransportError as error:
            msg = 'Failed to sign custom token. {0}'.format(error)
            raise TokenSignError(msg, error)


    def create_session_cookie(self, id_token, expires_in):
        """Creates a session cookie from the provided ID token."""
        id_token = id_token.decode('utf-8') if isinstance(id_token, bytes) else id_token
        if not isinstance(id_token, str) or not id_token:
            raise ValueError(
                'Illegal ID token provided: {0}. ID token must be a non-empty '
                'string.'.format(id_token))

        if isinstance(expires_in, datetime.timedelta):
            expires_in = int(expires_in.total_seconds())
        if isinstance(expires_in, bool) or not isinstance(expires_in, int):
            raise ValueError('Illegal expiry duration: {0}.'.format(expires_in))
        if expires_in < MIN_SESSION_COOKIE_DURATION_SECONDS:
            raise ValueError('Illegal expiry duration: {0}. Duration must be at least {1} '
                             'seconds.'.format(expires_in, MIN_SESSION_COOKIE_DURATION_SECONDS))
        if expires_in > MAX_SESSION_COOKIE_DURATION_SECONDS:
            raise ValueError('Illegal expiry duration: {0}. Duration must be at most {1} '
                             'seconds.'.format(expires_in, MAX_SESSION_COOKIE_DURATION_SECONDS))

        url = '{0}:createSessionCookie'.format(self.base_url)
        payload = {
            'idToken': id_token,
            'validDuration': expires_in,
        }
        try:
            body, http_resp = self.http_client.body_and_response('post', url, json=payload)
        except requests.exceptions.RequestException as error:
            raise _auth_utils.handle_auth_backend_error(error)
        else:
            if not body or not body.get('sessionCookie'):
                raise _auth_utils.UnexpectedResponseError(
                    'Failed to create session cookie.', http_response=http_resp)
            return body.get('sessionCookie')


class CertificateFetchRequest(transport.Request):
    """A google-auth transport that supports HTTP cache-control.

    Also injects a timeout to each outgoing HTTP request.
    """

    def __init__(self, timeout_seconds=None):
        self._session = cachecontrol.CacheControl(requests.Session())
        self._delegate = transport.requests.Request(self.session)
        self._timeout_seconds = timeout_seconds

    @property
    def session(self):
        return self._session

    @property
    def timeout_seconds(self):
        return self._timeout_seconds

    def __call__(self, url, method='GET', body=None, headers=None, timeout=None, **kwargs):
        timeout = timeout or self.timeout_seconds
        return self._delegate(
            url, method=method, body=body, headers=headers, timeout=timeout, **kwargs)


class TokenVerifier:
    """Verifies ID tokens and session cookies."""

    def __init__(self, app):
        timeout = app.options.get('httpTimeout', _http_client.DEFAULT_TIMEOUT_SECONDS)
        self.request = CertificateFetchRequest(timeout)
        self.id_token_verifier = _JWTVerifier(
            project_id=app.project_id, short_name='ID token',
            operation='verify_id_token()',
            doc_url='https://firebase.google.com/docs/auth/admin/verify-id-tokens',
            cert_url=ID_TOKEN_CERT_URI,
            issuer=ID_TOKEN_ISSUER_PREFIX,
            invalid_token_error=_auth_utils.InvalidIdTokenError,
            expired_token_error=ExpiredIdTokenError)
        self.cookie_verifier = _JWTVerifier(
            project_id=app.project_id, short_name='session cookie',
            operation='verify_session_cookie()',
            doc_url='https://firebase.google.com/docs/auth/admin/verify-id-tokens',
            cert_url=COOKIE_CERT_URI,
            issuer=COOKIE_ISSUER_PREFIX,
            invalid_token_error=InvalidSessionCookieError,
            expired_token_error=ExpiredSessionCookieError)

    def verify_id_token(self, id_token, clock_skew_seconds=0):
        return self.id_token_verifier.verify(id_token, self.request, clock_skew_seconds)

    def verify_session_cookie(self, cookie, clock_skew_seconds=0):
        return self.cookie_verifier.verify(cookie, self.request, clock_skew_seconds)


class _JWTVerifier:
    """Verifies Firebase JWTs (ID tokens or session cookies)."""

    def __init__(self, **kwargs):
        self.project_id = kwargs.pop('project_id')
        self.short_name = kwargs.pop('short_name')
        self.operation = kwargs.pop('operation')
        self.url = kwargs.pop('doc_url')
        self.cert_url = kwargs.pop('cert_url')
        self.issuer = kwargs.pop('issuer')
        if self.short_name[0].lower() in 'aeiou':
            self.articled_short_name = 'an {0}'.format(self.short_name)
        else:
            self.articled_short_name = 'a {0}'.format(self.short_name)
        self._invalid_token_error = kwargs.pop('invalid_token_error')
        self._expired_token_error = kwargs.pop('expired_token_error')

    def verify(self, token, request, clock_skew_seconds=0):
        """Verifies the signature and data for the provided JWT."""
        token = token.encode('utf-8') if isinstance(token, str) else token
        if not isinstance(token, bytes) or not token:
            raise ValueError(
                'Illegal {0} provided: {1}. {0} must be a non-empty '
                'string.'.format(self.short_name, token))

        if not self.project_id:
            raise ValueError(
                'Failed to ascertain project ID from the credential or the environment. Project '
                'ID is required to call {0}. Initialize the app with a credentials.Certificate '
                'or set your Firebase project ID as an app option. Alternatively set the '
                'GOOGLE_CLOUD_PROJECT environment variable.'.format(self.operation))

        if clock_skew_seconds < 0 or clock_skew_seconds > 60:
            raise ValueError(
                'Illegal clock_skew_seconds value: {0}. Must be between 0 and 60, inclusive.'
                .format(clock_skew_seconds))

        header, payload = self._decode_unverified(token)
        issuer = payload.get('iss')
        audience = payload.get('aud')
        subject = payload.get('sub')
        expected_issuer = self.issuer + self.project_id

        project_id_match_msg = (
            'Make sure the {0} comes from the same Firebase project as the service account used '
            'to authenticate this SDK.'.format(self.short_name))
        verify_id_token_msg = (
            'See {0} for details on how to retrieve {1}.'.format(self.url, self.short_name))

        emulated = _auth_utils.is_emulated()

        error_message = None
        if audience == FIREBASE_AUDIENCE:
            error_message = (
                '{0} expects {1}, but was given a custom '
                'token.'.format(self.operation, self.articled_short_name))
        elif not emulated and not header.get('kid'):
            if header.get('alg') == 'HS256' and payload.get(
                    'v') == 0 and 'uid' in payload.get('d', {}):
                error_message = (
                    '{0} expects {1}, but was given a legacy custom '
                    'token.'.format(self.operation, self.articled_short_name))
            else:
                error_message = 'Firebase {0} has no "kid" claim.'.format(self.short_name)
        elif not emulated and header.get('alg') != 'RS256':
            error_message = (
                'Firebase {0} has incorrect algorithm. Expected "RS256" but got '
                '"{1}". {2}'.format(self.short_name, header.get('alg'), verify_id_token_msg))
        elif audience != self.project_id:
            error_message = (
                'Firebase {0} has incorrect "aud" (audience) claim. Expected "{1}" but '
                'got "{2}". {3} {4}'.format(self.short_name, self.project_id, audience,
                                            project_id_match_msg, verify_id_token_msg))
        elif issuer != expected_issuer:
            error_message = (
                'Firebase {0} has incorrect "iss" (issuer) claim. Expected "{1}" but '
                'got "{2}". {3} {4}'.format(self.short_name, expected_issuer, issuer,
                                            project_id_match_msg, verify_id_token_msg))
        elif subject is None or not isinstance(subject, str):
            error_message = (
                'Firebase {0} has no "sub" (subject) claim. '
                '{1}'.format(self.short_name, verify_id_token_msg))
        elif not subject:
            error_message = (
                'Firebase {0} has an empty string "sub" (subject) claim. '
                '{1}'.format(self.short_name, verify_id_token_msg))
        elif len(subject) > 128:
            error_message = (
                'Firebase {0} has a "sub" (subject) claim longer than 128 characters. '
                '{1}'.format(self.short_name, verify_id_token_msg))

        if error_message:
            raise self._invalid_token_error(error_message)

        try:
            if emulated:
                verified_claims = payload
            else:
                verified_claims = google.oauth2.id_token.verify_token(
                    token,
                    request=request,
                    audience=self.project_id,
                    certs_url=self.cert_url,
                    clock_skew_in_seconds=clock_skew_seconds)
            verified_claims['uid'] = verified_claims['sub']
            return verified_claims
        except google.auth.exceptions.TransportError as error:
            raise CertificateFetchError(str(error), cause=error)
        except ValueError as error:
            if 'Token expired' in str(error):
                raise self._expired_token_error(str(error), cause=error)
            raise self._invalid_token_error(str(error), cause=error)

    def _decode_unverified(self, token):
        try:
            header = jwt.decode_header(token)
            payload = jwt.decode(token, verify=False)
            return header, payload
        except ValueError as error:
            raise self._invalid_token_error(str(error), cause=error)


class TokenSignError(exceptions.UnknownError):
    """Unexpected error while signing a Firebase custom token."""

    def __init__(self, message, cause):
        exceptions.UnknownError.__init__(self, message, cause)


class CertificateFetchError(exceptions.UnknownError):
    """Failed to fetch some public key certificates required to verify a token."""

    def __init__(self, message, cause):
        exceptions.UnknownError.__init__(self, message, cause)


class ExpiredIdTokenError(_auth_utils.InvalidIdTokenError):
    """The provided ID token is expired."""

    def __init__(self, message, cause):
        _auth_utils.InvalidIdTokenError.__init__(self, message, cause)


class RevokedIdTokenError(_auth_utils.InvalidIdTokenError):
    """The provided ID token has been revoked."""

    def __init__(self, message):
        _auth_utils.InvalidIdTokenError.__init__(self, message)


class InvalidSessionCookieError(exceptions.InvalidArgumentError):
    """The provided string is not a valid Firebase session cookie."""

    def __init__(self, message, cause=None):
        exceptions.InvalidArgumentError.__init__(self, message, cause)


class ExpiredSessionCookieError(InvalidSessionCookieError):
    """The provided session cookie is expired."""

    def __init__(self, message, cause):
        InvalidSessionCookieError.__init__(self, message, cause)


class RevokedSessionCookieError(InvalidSessionCookieError):
    """The provided session cookie has been revoked."""

    def __init__(self, message):
        InvalidSessionCookieError.__init__(self, message)
