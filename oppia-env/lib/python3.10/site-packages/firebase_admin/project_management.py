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

"""Firebase Project Management module.

This module enables management of resources in Firebase projects, such as Android and iOS apps.
"""

import base64
import re
import time

import requests

import firebase_admin
from firebase_admin import exceptions
from firebase_admin import _http_client
from firebase_admin import _utils


_PROJECT_MANAGEMENT_ATTRIBUTE = '_project_management'


def _get_project_management_service(app):
    return _utils.get_app_service(app, _PROJECT_MANAGEMENT_ATTRIBUTE, _ProjectManagementService)


def android_app(app_id, app=None):
    """Obtains a reference to an Android app in the associated Firebase project.

    Args:
        app_id: The app ID that identifies this Android app.
        app: An App instance (optional).

    Returns:
        AndroidApp: An ``AndroidApp`` instance.
    """
    return AndroidApp(app_id=app_id, service=_get_project_management_service(app))


def ios_app(app_id, app=None):
    """Obtains a reference to an iOS app in the associated Firebase project.

    Args:
        app_id: The app ID that identifies this iOS app.
        app: An App instance (optional).

    Returns:
        IOSApp: An ``IOSApp`` instance.
    """
    return IOSApp(app_id=app_id, service=_get_project_management_service(app))


def list_android_apps(app=None):
    """Lists all Android apps in the associated Firebase project.

    Args:
        app: An App instance (optional).

    Returns:
        list: a list of ``AndroidApp`` instances referring to each Android app in the Firebase
        project.
    """
    return _get_project_management_service(app).list_android_apps()


def list_ios_apps(app=None):
    """Lists all iOS apps in the associated Firebase project.

    Args:
        app: An App instance (optional).

    Returns:
        list: a list of ``IOSApp`` instances referring to each iOS app in the Firebase project.
    """
    return _get_project_management_service(app).list_ios_apps()


def create_android_app(package_name, display_name=None, app=None):
    """Creates a new Android app in the associated Firebase project.

    Args:
        package_name: The package name of the Android app to be created.
        display_name: A nickname for this Android app (optional).
        app: An App instance (optional).

    Returns:
        AndroidApp: An ``AndroidApp`` instance that is a reference to the newly created app.
    """
    return _get_project_management_service(app).create_android_app(package_name, display_name)


def create_ios_app(bundle_id, display_name=None, app=None):
    """Creates a new iOS app in the associated Firebase project.

    Args:
        bundle_id: The bundle ID of the iOS app to be created.
        display_name: A nickname for this iOS app (optional).
        app: An App instance (optional).

    Returns:
        IOSApp: An ``IOSApp`` instance that is a reference to the newly created app.
    """
    return _get_project_management_service(app).create_ios_app(bundle_id, display_name)


def _check_is_string_or_none(obj, field_name):
    if obj is None or isinstance(obj, str):
        return obj
    raise ValueError('{0} must be a string.'.format(field_name))


def _check_is_nonempty_string(obj, field_name):
    if isinstance(obj, str) and obj:
        return obj
    raise ValueError('{0} must be a non-empty string.'.format(field_name))


def _check_is_nonempty_string_or_none(obj, field_name):
    if obj is None:
        return None
    return _check_is_nonempty_string(obj, field_name)


def _check_not_none(obj, field_name):
    if obj is None:
        raise ValueError('{0} cannot be None.'.format(field_name))
    return obj


class AndroidApp:
    """A reference to an Android app within a Firebase project.

    Note: Unless otherwise specified, all methods defined in this class make an RPC.

    Please use the module-level function ``android_app(app_id)`` to obtain instances of this class
    instead of instantiating it directly.
    """

    def __init__(self, app_id, service):
        self._app_id = app_id
        self._service = service

    @property
    def app_id(self):
        """Returns the app ID of the Android app to which this instance refers.

        Note: This method does not make an RPC.

        Returns:
            string: The app ID of the Android app to which this instance refers.
        """
        return self._app_id

    def get_metadata(self):
        """Retrieves detailed information about this Android app.

        Returns:
            AndroidAppMetadata: An ``AndroidAppMetadata`` instance.

        Raises:
            FirebaseError: If an error occurs while communicating with the Firebase Project
                Management Service.
        """
        return self._service.get_android_app_metadata(self._app_id)

    def set_display_name(self, new_display_name):
        """Updates the display name attribute of this Android app to the one given.

        Args:
            new_display_name: The new display name for this Android app.

        Returns:
            NoneType: None.

        Raises:
            FirebaseError: If an error occurs while communicating with the Firebase Project
                Management Service.
        """
        return self._service.set_android_app_display_name(self._app_id, new_display_name)

    def get_config(self):
        """Retrieves the configuration artifact associated with this Android app."""
        return self._service.get_android_app_config(self._app_id)

    def get_sha_certificates(self):
        """Retrieves the entire list of SHA certificates associated with this Android app.

        Returns:
            list: A list of ``SHACertificate`` instances.

        Raises:
            FirebaseError: If an error occurs while communicating with the Firebase Project
                Management Service.
        """
        return self._service.get_sha_certificates(self._app_id)

    def add_sha_certificate(self, certificate_to_add):
        """Adds a SHA certificate to this Android app.

        Args:
            certificate_to_add: The SHA certificate to add.

        Returns:
            NoneType: None.

        Raises:
            FirebaseError: If an error occurs while communicating with the Firebase Project
                Management Service. (For example, if the certificate_to_add already exists.)
        """
        return self._service.add_sha_certificate(self._app_id, certificate_to_add)

    def delete_sha_certificate(self, certificate_to_delete):
        """Removes a SHA certificate from this Android app.

        Args:
            certificate_to_delete: The SHA certificate to delete.

        Returns:
            NoneType: None.

        Raises:
            FirebaseError: If an error occurs while communicating with the Firebase Project
                Management Service. (For example, if the certificate_to_delete is not found.)
        """
        return self._service.delete_sha_certificate(certificate_to_delete)


class IOSApp:
    """A reference to an iOS app within a Firebase project.

    Note: Unless otherwise specified, all methods defined in this class make an RPC.

    Please use the module-level function ``ios_app(app_id)`` to obtain instances of this class
    instead of instantiating it directly.
    """

    def __init__(self, app_id, service):
        self._app_id = app_id
        self._service = service

    @property
    def app_id(self):
        """Returns the app ID of the iOS app to which this instance refers.

        Note: This method does not make an RPC.

        Returns:
            string: The app ID of the iOS app to which this instance refers.
        """
        return self._app_id

    def get_metadata(self):
        """Retrieves detailed information about this iOS app.

        Returns:
            IOSAppMetadata: An ``IOSAppMetadata`` instance.

        Raises:
            FirebaseError: If an error occurs while communicating with the Firebase Project
                Management Service.
        """
        return self._service.get_ios_app_metadata(self._app_id)

    def set_display_name(self, new_display_name):
        """Updates the display name attribute of this iOS app to the one given.

        Args:
            new_display_name: The new display name for this iOS app.

        Returns:
            NoneType: None.

        Raises:
            FirebaseError: If an error occurs while communicating with the Firebase Project
                Management Service.
        """
        return self._service.set_ios_app_display_name(self._app_id, new_display_name)

    def get_config(self):
        """Retrieves the configuration artifact associated with this iOS app."""
        return self._service.get_ios_app_config(self._app_id)


class _AppMetadata:
    """Detailed information about a Firebase Android or iOS app."""

    def __init__(self, name, app_id, display_name, project_id):
        # _name is the fully qualified resource name of this Android or iOS app; currently it is not
        # exposed to client code.
        self._name = _check_is_nonempty_string(name, 'name')
        self._app_id = _check_is_nonempty_string(app_id, 'app_id')
        self._display_name = _check_is_string_or_none(display_name, 'display_name')
        self._project_id = _check_is_nonempty_string(project_id, 'project_id')

    @property
    def app_id(self):
        """The globally unique, Firebase-assigned identifier of this Android or iOS app.

        This ID is unique even across apps of different platforms.
        """
        return self._app_id

    @property
    def display_name(self):
        """The user-assigned display name of this Android or iOS app.

        Note that the display name can be None if it has never been set by the user."""
        return self._display_name

    @property
    def project_id(self):
        """The permanent, globally unique, user-assigned ID of the parent Firebase project."""
        return self._project_id

    def __eq__(self, other):
        if not isinstance(other, type(self)):
            return False
        # pylint: disable=protected-access
        return (self._name == other._name and self.app_id == other.app_id and
                self.display_name == other.display_name and self.project_id == other.project_id)
        # pylint: enable=protected-access


class AndroidAppMetadata(_AppMetadata):
    """Android-specific information about an Android Firebase app."""

    def __init__(self, package_name, name, app_id, display_name, project_id):
        """Clients should not instantiate this class directly."""
        super(AndroidAppMetadata, self).__init__(name, app_id, display_name, project_id)
        self._package_name = _check_is_nonempty_string(package_name, 'package_name')

    @property
    def package_name(self):
        """The canonical package name of this Android app as it would appear in the Play Store."""
        return self._package_name

    def __eq__(self, other):
        return (super(AndroidAppMetadata, self).__eq__(other) and
                self.package_name == other.package_name)

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return hash(
            (self._name, self.app_id, self.display_name, self.project_id, self.package_name))


class IOSAppMetadata(_AppMetadata):
    """iOS-specific information about an iOS Firebase app."""

    def __init__(self, bundle_id, name, app_id, display_name, project_id):
        """Clients should not instantiate this class directly."""
        super(IOSAppMetadata, self).__init__(name, app_id, display_name, project_id)
        self._bundle_id = _check_is_nonempty_string(bundle_id, 'bundle_id')

    @property
    def bundle_id(self):
        """The canonical bundle ID of this iOS app as it would appear in the iOS AppStore."""
        return self._bundle_id

    def __eq__(self, other):
        return super(IOSAppMetadata, self).__eq__(other) and self.bundle_id == other.bundle_id

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return hash((self._name, self.app_id, self.display_name, self.project_id, self.bundle_id))


class SHACertificate:
    """Represents a SHA-1 or SHA-256 certificate associated with an Android app."""

    SHA_1 = 'SHA_1'
    SHA_256 = 'SHA_256'

    _SHA_1_RE = re.compile('^[0-9A-Fa-f]{40}$')
    _SHA_256_RE = re.compile('^[0-9A-Fa-f]{64}$')

    def __init__(self, sha_hash, name=None):
        """Creates a new SHACertificate instance.

        Args:
            sha_hash: A string; the certificate hash for the Android app.
            name: The fully qualified resource name of this certificate; note that this field should
                be omitted if the instance is being constructed for the purpose of calling the
                add_sha_certificate() method on an ``AndroidApp``.

        Raises:
            ValueError: If the sha_hash is not a valid SHA-1 or SHA-256 certificate hash.
        """
        _check_is_nonempty_string(sha_hash, 'sha_hash')
        _check_is_nonempty_string_or_none(name, 'name')
        self._name = name
        self._sha_hash = sha_hash.lower()
        if SHACertificate._SHA_1_RE.match(sha_hash):
            self._cert_type = SHACertificate.SHA_1
        elif SHACertificate._SHA_256_RE.match(sha_hash):
            self._cert_type = SHACertificate.SHA_256
        else:
            raise ValueError(
                'The supplied certificate hash is neither a valid SHA-1 nor SHA_256 hash.')

    @property
    def name(self):
        """Returns the fully qualified resource name of this certificate, if known.

        Returns:
            string: The fully qualified resource name of this certificate, if known; otherwise, the
            empty string.
        """
        return self._name

    @property
    def sha_hash(self):
        """Returns the certificate hash.

        Returns:
            string: The certificate hash.
        """
        return self._sha_hash

    @property
    def cert_type(self):
        """Returns the type of the SHA certificate encoded in the hash.

        Returns:
            string: One of 'SHA_1' or 'SHA_256'.
        """
        return self._cert_type

    def __eq__(self, other):
        if not isinstance(other, SHACertificate):
            return False
        return (self.name == other.name and self.sha_hash == other.sha_hash and
                self.cert_type == other.cert_type)

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return hash((self.name, self.sha_hash, self.cert_type))


class _ProjectManagementService:
    """Provides methods for interacting with the Firebase Project Management Service."""

    BASE_URL = 'https://firebase.googleapis.com'
    MAXIMUM_LIST_APPS_PAGE_SIZE = 100
    MAXIMUM_POLLING_ATTEMPTS = 8
    POLL_BASE_WAIT_TIME_SECONDS = 0.5
    POLL_EXPONENTIAL_BACKOFF_FACTOR = 1.5

    ANDROID_APPS_RESOURCE_NAME = 'androidApps'
    ANDROID_APP_IDENTIFIER_NAME = 'packageName'
    IOS_APPS_RESOURCE_NAME = 'iosApps'
    IOS_APP_IDENTIFIER_NAME = 'bundleId'

    def __init__(self, app):
        project_id = app.project_id
        if not project_id:
            raise ValueError(
                'Project ID is required to access the Firebase Project Management Service. Either '
                'set the projectId option, or use service account credentials. Alternatively, set '
                'the GOOGLE_CLOUD_PROJECT environment variable.')
        self._project_id = project_id
        version_header = 'Python/Admin/{0}'.format(firebase_admin.__version__)
        timeout = app.options.get('httpTimeout', _http_client.DEFAULT_TIMEOUT_SECONDS)
        self._client = _http_client.JsonHttpClient(
            credential=app.credential.get_credential(),
            base_url=_ProjectManagementService.BASE_URL,
            headers={'X-Client-Version': version_header},
            timeout=timeout)

    def get_android_app_metadata(self, app_id):
        return self._get_app_metadata(
            platform_resource_name=_ProjectManagementService.ANDROID_APPS_RESOURCE_NAME,
            identifier_name=_ProjectManagementService.ANDROID_APP_IDENTIFIER_NAME,
            metadata_class=AndroidAppMetadata,
            app_id=app_id)

    def get_ios_app_metadata(self, app_id):
        return self._get_app_metadata(
            platform_resource_name=_ProjectManagementService.IOS_APPS_RESOURCE_NAME,
            identifier_name=_ProjectManagementService.IOS_APP_IDENTIFIER_NAME,
            metadata_class=IOSAppMetadata,
            app_id=app_id)

    def _get_app_metadata(self, platform_resource_name, identifier_name, metadata_class, app_id):
        """Retrieves detailed information about an Android or iOS app."""
        _check_is_nonempty_string(app_id, 'app_id')
        path = '/v1beta1/projects/-/{0}/{1}'.format(platform_resource_name, app_id)
        response = self._make_request('get', path)
        return metadata_class(
            response[identifier_name],
            name=response['name'],
            app_id=response['appId'],
            display_name=response.get('displayName') or None,
            project_id=response['projectId'])

    def set_android_app_display_name(self, app_id, new_display_name):
        self._set_display_name(
            app_id=app_id,
            new_display_name=new_display_name,
            platform_resource_name=_ProjectManagementService.ANDROID_APPS_RESOURCE_NAME)

    def set_ios_app_display_name(self, app_id, new_display_name):
        self._set_display_name(
            app_id=app_id,
            new_display_name=new_display_name,
            platform_resource_name=_ProjectManagementService.IOS_APPS_RESOURCE_NAME)

    def _set_display_name(self, app_id, new_display_name, platform_resource_name):
        """Sets the display name of an Android or iOS app."""
        path = '/v1beta1/projects/-/{0}/{1}?updateMask=displayName'.format(
            platform_resource_name, app_id)
        request_body = {'displayName': new_display_name}
        self._make_request('patch', path, json=request_body)

    def list_android_apps(self):
        return self._list_apps(
            platform_resource_name=_ProjectManagementService.ANDROID_APPS_RESOURCE_NAME,
            app_class=AndroidApp)

    def list_ios_apps(self):
        return self._list_apps(
            platform_resource_name=_ProjectManagementService.IOS_APPS_RESOURCE_NAME,
            app_class=IOSApp)

    def _list_apps(self, platform_resource_name, app_class):
        """Lists all the Android or iOS apps within the Firebase project."""
        path = '/v1beta1/projects/{0}/{1}?pageSize={2}'.format(
            self._project_id,
            platform_resource_name,
            _ProjectManagementService.MAXIMUM_LIST_APPS_PAGE_SIZE)
        response = self._make_request('get', path)
        apps_list = []
        while True:
            apps = response.get('apps')
            if not apps:
                break
            apps_list.extend(app_class(app_id=app['appId'], service=self) for app in apps)
            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break
            # Retrieve the next page of apps.
            path = '/v1beta1/projects/{0}/{1}?pageToken={2}&pageSize={3}'.format(
                self._project_id,
                platform_resource_name,
                next_page_token,
                _ProjectManagementService.MAXIMUM_LIST_APPS_PAGE_SIZE)
            response = self._make_request('get', path)
        return apps_list

    def create_android_app(self, package_name, display_name=None):
        return self._create_app(
            platform_resource_name=_ProjectManagementService.ANDROID_APPS_RESOURCE_NAME,
            identifier_name=_ProjectManagementService.ANDROID_APP_IDENTIFIER_NAME,
            identifier=package_name,
            display_name=display_name,
            app_class=AndroidApp)

    def create_ios_app(self, bundle_id, display_name=None):
        return self._create_app(
            platform_resource_name=_ProjectManagementService.IOS_APPS_RESOURCE_NAME,
            identifier_name=_ProjectManagementService.IOS_APP_IDENTIFIER_NAME,
            identifier=bundle_id,
            display_name=display_name,
            app_class=IOSApp)

    def _create_app(
            self,
            platform_resource_name,
            identifier_name,
            identifier,
            display_name,
            app_class):
        """Creates an Android or iOS app."""
        _check_is_string_or_none(display_name, 'display_name')
        path = '/v1beta1/projects/{0}/{1}'.format(self._project_id, platform_resource_name)
        request_body = {identifier_name: identifier}
        if display_name:
            request_body['displayName'] = display_name
        response = self._make_request('post', path, json=request_body)
        operation_name = response['name']
        poll_response = self._poll_app_creation(operation_name)
        return app_class(app_id=poll_response['appId'], service=self)

    def _poll_app_creation(self, operation_name):
        """Polls the Long-Running Operation repeatedly until it is done with exponential backoff."""
        for current_attempt in range(_ProjectManagementService.MAXIMUM_POLLING_ATTEMPTS):
            delay_factor = pow(
                _ProjectManagementService.POLL_EXPONENTIAL_BACKOFF_FACTOR, current_attempt)
            wait_time_seconds = delay_factor * _ProjectManagementService.POLL_BASE_WAIT_TIME_SECONDS
            time.sleep(wait_time_seconds)
            path = '/v1/{0}'.format(operation_name)
            poll_response, http_response = self._body_and_response('get', path)
            done = poll_response.get('done')
            if done:
                response = poll_response.get('response')
                if response:
                    return response

                raise exceptions.UnknownError(
                    'Polling finished, but the operation terminated in an error.',
                    http_response=http_response)
        raise exceptions.DeadlineExceededError('Polling deadline exceeded.')

    def get_android_app_config(self, app_id):
        return self._get_app_config(
            platform_resource_name=_ProjectManagementService.ANDROID_APPS_RESOURCE_NAME,
            app_id=app_id)

    def get_ios_app_config(self, app_id):
        return self._get_app_config(
            platform_resource_name=_ProjectManagementService.IOS_APPS_RESOURCE_NAME, app_id=app_id)

    def _get_app_config(self, platform_resource_name, app_id):
        path = '/v1beta1/projects/-/{0}/{1}/config'.format(platform_resource_name, app_id)
        response = self._make_request('get', path)
        # In Python 2.7, the base64 module works with strings, while in Python 3, it works with
        # bytes objects. This line works in both versions.
        return base64.standard_b64decode(response['configFileContents']).decode(encoding='utf-8')

    def get_sha_certificates(self, app_id):
        path = '/v1beta1/projects/-/androidApps/{0}/sha'.format(app_id)
        response = self._make_request('get', path)
        cert_list = response.get('certificates') or []
        return [SHACertificate(sha_hash=cert['shaHash'], name=cert['name']) for cert in cert_list]

    def add_sha_certificate(self, app_id, certificate_to_add):
        path = '/v1beta1/projects/-/androidApps/{0}/sha'.format(app_id)
        sha_hash = _check_not_none(certificate_to_add, 'certificate_to_add').sha_hash
        cert_type = certificate_to_add.cert_type
        request_body = {'shaHash': sha_hash, 'certType': cert_type}
        self._make_request('post', path, json=request_body)

    def delete_sha_certificate(self, certificate_to_delete):
        name = _check_not_none(certificate_to_delete, 'certificate_to_delete').name
        path = '/v1beta1/{0}'.format(name)
        self._make_request('delete', path)

    def _make_request(self, method, url, json=None):
        body, _ = self._body_and_response(method, url, json)
        return body

    def _body_and_response(self, method, url, json=None):
        try:
            return self._client.body_and_response(method=method, url=url, json=json)
        except requests.exceptions.RequestException as error:
            raise _utils.handle_platform_error_from_requests(error)
