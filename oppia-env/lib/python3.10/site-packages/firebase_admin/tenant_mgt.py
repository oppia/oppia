# Copyright 2020 Google Inc.
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

"""Firebase tenant management module.

This module contains functions for creating and configuring authentication tenants within a
Google Cloud Identity Platform (GCIP) instance.
"""

import re
import threading

import requests

import firebase_admin
from firebase_admin import auth
from firebase_admin import _auth_utils
from firebase_admin import _http_client
from firebase_admin import _utils


_TENANT_MGT_ATTRIBUTE = '_tenant_mgt'
_MAX_LIST_TENANTS_RESULTS = 100
_DISPLAY_NAME_PATTERN = re.compile('^[a-zA-Z][a-zA-Z0-9-]{3,19}$')


__all__ = [
    'ListTenantsPage',
    'Tenant',
    'TenantIdMismatchError',
    'TenantNotFoundError',

    'auth_for_tenant',
    'create_tenant',
    'delete_tenant',
    'get_tenant',
    'list_tenants',
    'update_tenant',
]


TenantIdMismatchError = _auth_utils.TenantIdMismatchError
TenantNotFoundError = _auth_utils.TenantNotFoundError


def auth_for_tenant(tenant_id, app=None):
    """Gets an Auth Client instance scoped to the given tenant ID.

    Args:
        tenant_id: A tenant ID string.
        app: An App instance (optional).

    Returns:
        auth.Client: An ``auth.Client`` object.

    Raises:
        ValueError: If the tenant ID is None, empty or not a string.
    """
    tenant_mgt_service = _get_tenant_mgt_service(app)
    return tenant_mgt_service.auth_for_tenant(tenant_id)


def get_tenant(tenant_id, app=None):
    """Gets the tenant corresponding to the given ``tenant_id``.

    Args:
        tenant_id: A tenant ID string.
        app: An App instance (optional).

    Returns:
        Tenant: A tenant object.

    Raises:
        ValueError: If the tenant ID is None, empty or not a string.
        TenantNotFoundError: If no tenant exists by the given ID.
        FirebaseError: If an error occurs while retrieving the tenant.
    """
    tenant_mgt_service = _get_tenant_mgt_service(app)
    return tenant_mgt_service.get_tenant(tenant_id)


def create_tenant(
        display_name, allow_password_sign_up=None, enable_email_link_sign_in=None, app=None):
    """Creates a new tenant from the given options.

    Args:
        display_name: Display name string for the new tenant. Must begin with a letter and contain
            only letters, digits and hyphens. Length must be between 4 and 20.
        allow_password_sign_up: A boolean indicating whether to enable or disable the email sign-in
            provider (optional).
        enable_email_link_sign_in: A boolean indicating whether to enable or disable email link
            sign-in (optional). Disabling this makes the password required for email sign-in.
        app: An App instance (optional).

    Returns:
        Tenant: A tenant object.

    Raises:
        ValueError: If any of the given arguments are invalid.
        FirebaseError: If an error occurs while creating the tenant.
    """
    tenant_mgt_service = _get_tenant_mgt_service(app)
    return tenant_mgt_service.create_tenant(
        display_name=display_name, allow_password_sign_up=allow_password_sign_up,
        enable_email_link_sign_in=enable_email_link_sign_in)


def update_tenant(
        tenant_id, display_name=None, allow_password_sign_up=None, enable_email_link_sign_in=None,
        app=None):
    """Updates an existing tenant with the given options.

    Args:
        tenant_id: ID of the tenant to update.
        display_name: Updated display name string for the tenant (optional).
        allow_password_sign_up: A boolean indicating whether to enable or disable the email sign-in
            provider.
        enable_email_link_sign_in: A boolean indicating whether to enable or disable email link
            sign-in. Disabling this makes the password required for email sign-in.
        app: An App instance (optional).

    Returns:
        Tenant: The updated tenant object.

    Raises:
        ValueError: If any of the given arguments are invalid.
        TenantNotFoundError: If no tenant exists by the given ID.
        FirebaseError: If an error occurs while creating the tenant.
    """
    tenant_mgt_service = _get_tenant_mgt_service(app)
    return tenant_mgt_service.update_tenant(
        tenant_id, display_name=display_name, allow_password_sign_up=allow_password_sign_up,
        enable_email_link_sign_in=enable_email_link_sign_in)


def delete_tenant(tenant_id, app=None):
    """Deletes the tenant corresponding to the given ``tenant_id``.

    Args:
        tenant_id: A tenant ID string.
        app: An App instance (optional).

    Raises:
        ValueError: If the tenant ID is None, empty or not a string.
        TenantNotFoundError: If no tenant exists by the given ID.
        FirebaseError: If an error occurs while retrieving the tenant.
    """
    tenant_mgt_service = _get_tenant_mgt_service(app)
    tenant_mgt_service.delete_tenant(tenant_id)


def list_tenants(page_token=None, max_results=_MAX_LIST_TENANTS_RESULTS, app=None):
    """Retrieves a page of tenants from a Firebase project.

    The ``page_token`` argument governs the starting point of the page. The ``max_results``
    argument governs the maximum number of tenants that may be included in the returned page.
    This function never returns None. If there are no user accounts in the Firebase project, this
    returns an empty page.

    Args:
        page_token: A non-empty page token string, which indicates the starting point of the page
            (optional). Defaults to ``None``, which will retrieve the first page of users.
        max_results: A positive integer indicating the maximum number of users to include in the
            returned page (optional). Defaults to 100, which is also the maximum number allowed.
        app: An App instance (optional).

    Returns:
        ListTenantsPage: A page of tenants.

    Raises:
        ValueError: If ``max_results`` or ``page_token`` are invalid.
        FirebaseError: If an error occurs while retrieving the user accounts.
    """
    tenant_mgt_service = _get_tenant_mgt_service(app)
    def download(page_token, max_results):
        return tenant_mgt_service.list_tenants(page_token, max_results)
    return ListTenantsPage(download, page_token, max_results)


def _get_tenant_mgt_service(app):
    return _utils.get_app_service(app, _TENANT_MGT_ATTRIBUTE, _TenantManagementService)


class Tenant:
    """Represents a tenant in a multi-tenant application.

    Multi-tenancy support requires Google Cloud Identity Platform (GCIP). To learn more about
    GCIP including pricing and features, see https://cloud.google.com/identity-platform.

    Before multi-tenancy can be used in a Google Cloud Identity Platform project, tenants must be
    enabled in that project via the Cloud Console UI. A Tenant instance provides information
    such as the display name, tenant identifier and email authentication configuration.
    """

    def __init__(self, data):
        if not isinstance(data, dict):
            raise ValueError('Invalid data argument in Tenant constructor: {0}'.format(data))
        if not 'name' in data:
            raise ValueError('Tenant response missing required keys.')

        self._data = data

    @property
    def tenant_id(self):
        name = self._data['name']
        return name.split('/')[-1]

    @property
    def display_name(self):
        return self._data.get('displayName')

    @property
    def allow_password_sign_up(self):
        return self._data.get('allowPasswordSignup', False)

    @property
    def enable_email_link_sign_in(self):
        return self._data.get('enableEmailLinkSignin', False)


class _TenantManagementService:
    """Firebase tenant management service."""

    TENANT_MGT_URL = 'https://identitytoolkit.googleapis.com/v2'

    def __init__(self, app):
        credential = app.credential.get_credential()
        version_header = 'Python/Admin/{0}'.format(firebase_admin.__version__)
        base_url = '{0}/projects/{1}'.format(self.TENANT_MGT_URL, app.project_id)
        self.app = app
        self.client = _http_client.JsonHttpClient(
            credential=credential, base_url=base_url, headers={'X-Client-Version': version_header})
        self.tenant_clients = {}
        self.lock = threading.RLock()

    def auth_for_tenant(self, tenant_id):
        """Gets an Auth Client instance scoped to the given tenant ID."""
        if not isinstance(tenant_id, str) or not tenant_id:
            raise ValueError(
                'Invalid tenant ID: {0}. Tenant ID must be a non-empty string.'.format(tenant_id))

        with self.lock:
            if tenant_id in self.tenant_clients:
                return self.tenant_clients[tenant_id]

            client = auth.Client(self.app, tenant_id=tenant_id)
            self.tenant_clients[tenant_id] = client
            return  client

    def get_tenant(self, tenant_id):
        """Gets the tenant corresponding to the given ``tenant_id``."""
        if not isinstance(tenant_id, str) or not tenant_id:
            raise ValueError(
                'Invalid tenant ID: {0}. Tenant ID must be a non-empty string.'.format(tenant_id))

        try:
            body = self.client.body('get', '/tenants/{0}'.format(tenant_id))
        except requests.exceptions.RequestException as error:
            raise _auth_utils.handle_auth_backend_error(error)
        else:
            return Tenant(body)

    def create_tenant(
            self, display_name, allow_password_sign_up=None, enable_email_link_sign_in=None):
        """Creates a new tenant from the given parameters."""

        payload = {'displayName': _validate_display_name(display_name)}
        if allow_password_sign_up is not None:
            payload['allowPasswordSignup'] = _auth_utils.validate_boolean(
                allow_password_sign_up, 'allowPasswordSignup')
        if enable_email_link_sign_in is not None:
            payload['enableEmailLinkSignin'] = _auth_utils.validate_boolean(
                enable_email_link_sign_in, 'enableEmailLinkSignin')

        try:
            body = self.client.body('post', '/tenants', json=payload)
        except requests.exceptions.RequestException as error:
            raise _auth_utils.handle_auth_backend_error(error)
        else:
            return Tenant(body)

    def update_tenant(
            self, tenant_id, display_name=None, allow_password_sign_up=None,
            enable_email_link_sign_in=None):
        """Updates the specified tenant with the given parameters."""
        if not isinstance(tenant_id, str) or not tenant_id:
            raise ValueError('Tenant ID must be a non-empty string.')

        payload = {}
        if display_name is not None:
            payload['displayName'] = _validate_display_name(display_name)
        if allow_password_sign_up is not None:
            payload['allowPasswordSignup'] = _auth_utils.validate_boolean(
                allow_password_sign_up, 'allowPasswordSignup')
        if enable_email_link_sign_in is not None:
            payload['enableEmailLinkSignin'] = _auth_utils.validate_boolean(
                enable_email_link_sign_in, 'enableEmailLinkSignin')

        if not payload:
            raise ValueError('At least one parameter must be specified for update.')

        url = '/tenants/{0}'.format(tenant_id)
        update_mask = ','.join(_auth_utils.build_update_mask(payload))
        params = 'updateMask={0}'.format(update_mask)
        try:
            body = self.client.body('patch', url, json=payload, params=params)
        except requests.exceptions.RequestException as error:
            raise _auth_utils.handle_auth_backend_error(error)
        else:
            return Tenant(body)

    def delete_tenant(self, tenant_id):
        """Deletes the tenant corresponding to the given ``tenant_id``."""
        if not isinstance(tenant_id, str) or not tenant_id:
            raise ValueError(
                'Invalid tenant ID: {0}. Tenant ID must be a non-empty string.'.format(tenant_id))

        try:
            self.client.request('delete', '/tenants/{0}'.format(tenant_id))
        except requests.exceptions.RequestException as error:
            raise _auth_utils.handle_auth_backend_error(error)

    def list_tenants(self, page_token=None, max_results=_MAX_LIST_TENANTS_RESULTS):
        """Retrieves a batch of tenants."""
        if page_token is not None:
            if not isinstance(page_token, str) or not page_token:
                raise ValueError('Page token must be a non-empty string.')
        if not isinstance(max_results, int):
            raise ValueError('Max results must be an integer.')
        if max_results < 1 or max_results > _MAX_LIST_TENANTS_RESULTS:
            raise ValueError(
                'Max results must be a positive integer less than or equal to '
                '{0}.'.format(_MAX_LIST_TENANTS_RESULTS))

        payload = {'pageSize': max_results}
        if page_token:
            payload['pageToken'] = page_token
        try:
            return self.client.body('get', '/tenants', params=payload)
        except requests.exceptions.RequestException as error:
            raise _auth_utils.handle_auth_backend_error(error)


class ListTenantsPage:
    """Represents a page of tenants fetched from a Firebase project.

    Provides methods for traversing tenants included in this page, as well as retrieving
    subsequent pages of tenants. The iterator returned by ``iterate_all()`` can be used to iterate
    through all tenants in the Firebase project starting from this page.
    """

    def __init__(self, download, page_token, max_results):
        self._download = download
        self._max_results = max_results
        self._current = download(page_token, max_results)

    @property
    def tenants(self):
        """A list of ``ExportedUserRecord`` instances available in this page."""
        return [Tenant(data) for data in self._current.get('tenants', [])]

    @property
    def next_page_token(self):
        """Page token string for the next page (empty string indicates no more pages)."""
        return self._current.get('nextPageToken', '')

    @property
    def has_next_page(self):
        """A boolean indicating whether more pages are available."""
        return bool(self.next_page_token)

    def get_next_page(self):
        """Retrieves the next page of tenants, if available.

        Returns:
            ListTenantsPage: Next page of tenants, or None if this is the last page.
        """
        if self.has_next_page:
            return ListTenantsPage(self._download, self.next_page_token, self._max_results)
        return None

    def iterate_all(self):
        """Retrieves an iterator for tenants.

        Returned iterator will iterate through all the tenants in the Firebase project
        starting from this page. The iterator will never buffer more than one page of tenants
        in memory at a time.

        Returns:
            iterator: An iterator of Tenant instances.
        """
        return _TenantIterator(self)


class _TenantIterator:
    """An iterator that allows iterating over tenants.

    This implementation loads a page of tenants into memory, and iterates on them. When the whole
    page has been traversed, it loads another page. This class never keeps more than one page
    of entries in memory.
    """

    def __init__(self, current_page):
        if not current_page:
            raise ValueError('Current page must not be None.')
        self._current_page = current_page
        self._index = 0

    def next(self):
        if self._index == len(self._current_page.tenants):
            if self._current_page.has_next_page:
                self._current_page = self._current_page.get_next_page()
                self._index = 0
        if self._index < len(self._current_page.tenants):
            result = self._current_page.tenants[self._index]
            self._index += 1
            return result
        raise StopIteration

    def __next__(self):
        return self.next()

    def __iter__(self):
        return self


def _validate_display_name(display_name):
    if not isinstance(display_name, str):
        raise ValueError('Invalid type for displayName')
    if not _DISPLAY_NAME_PATTERN.search(display_name):
        raise ValueError(
            'displayName must start with a letter and only consist of letters, digits and '
            'hyphens with 4-20 characters.')
    return display_name
