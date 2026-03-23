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

"""Firebase Admin SDK for Python."""
import datetime
import json
import os
import threading

from google.auth.credentials import Credentials as GoogleAuthCredentials
from google.auth.exceptions import DefaultCredentialsError
from firebase_admin import credentials
from firebase_admin.__about__ import __version__


_apps = {}
_apps_lock = threading.RLock()
_clock = datetime.datetime.utcnow

_DEFAULT_APP_NAME = '[DEFAULT]'
_FIREBASE_CONFIG_ENV_VAR = 'FIREBASE_CONFIG'
_CONFIG_VALID_KEYS = ['databaseAuthVariableOverride', 'databaseURL', 'httpTimeout', 'projectId',
                      'storageBucket']

def initialize_app(credential=None, options=None, name=_DEFAULT_APP_NAME):
    """Initializes and returns a new App instance.

    Creates a new App instance using the specified options
    and the app name. If an instance already exists by the same
    app name a ValueError is raised.
    If options are not provided an attempt is made to load the options from the environment.
    This is done by looking up the ``FIREBASE_CONFIG`` environment variable. If the value of
    the variable starts with ``"{"``, it is parsed as a JSON object. Otherwise it is treated
    as a file name and the JSON content is read from the corresponding file.
    Use this function whenever a new App instance is required. Do not directly invoke the
    App constructor.

    Args:
      credential: A credential object used to initialize the SDK (optional). If none is provided,
          Google Application Default Credentials are used.
      options: A dictionary of configuration options (optional). Supported options include
          ``databaseURL``, ``storageBucket``, ``projectId``, ``databaseAuthVariableOverride``,
          ``serviceAccountId`` and ``httpTimeout``. If ``httpTimeout`` is not set, the SDK uses
          a default timeout of 120 seconds.

      name: Name of the app (optional).
    Returns:
      App: A newly initialized instance of App.

    Raises:
      ValueError: If the app name is already in use, or any of the
          provided arguments are invalid.
    """
    if credential is None:
        credential = credentials.ApplicationDefault()
    app = App(name, credential, options)
    with _apps_lock:
        if app.name not in _apps:
            _apps[app.name] = app
            return app

    if name == _DEFAULT_APP_NAME:
        raise ValueError((
            'The default Firebase app already exists. This means you called '
            'initialize_app() more than once without providing an app name as '
            'the second argument. In most cases you only need to call '
            'initialize_app() once. But if you do want to initialize multiple '
            'apps, pass a second argument to initialize_app() to give each app '
            'a unique name.'))

    raise ValueError((
        'Firebase app named "{0}" already exists. This means you called '
        'initialize_app() more than once with the same app name as the '
        'second argument. Make sure you provide a unique name every time '
        'you call initialize_app().').format(name))


def delete_app(app):
    """Gracefully deletes an App instance.

    Args:
      app: The app instance to be deleted.

    Raises:
      ValueError: If the app is not initialized.
    """
    if not isinstance(app, App):
        raise ValueError('Illegal app argument type: "{}". Argument must be of '
                         'type App.'.format(type(app)))
    with _apps_lock:
        if _apps.get(app.name) is app:
            del _apps[app.name]
            app._cleanup() # pylint: disable=protected-access
            return
    if app.name == _DEFAULT_APP_NAME:
        raise ValueError(
            'The default Firebase app is not initialized. Make sure to initialize '
            'the default app by calling initialize_app().')

    raise ValueError(
        ('Firebase app named "{0}" is not initialized. Make sure to initialize '
         'the app by calling initialize_app() with your app name as the '
         'second argument.').format(app.name))


def get_app(name=_DEFAULT_APP_NAME):
    """Retrieves an App instance by name.

    Args:
      name: Name of the App instance to retrieve (optional).

    Returns:
      App: An App instance with the given name.

    Raises:
      ValueError: If the specified name is not a string, or if the specified
          app does not exist.
    """
    if not isinstance(name, str):
        raise ValueError('Illegal app name argument type: "{}". App name '
                         'must be a string.'.format(type(name)))
    with _apps_lock:
        if name in _apps:
            return _apps[name]

    if name == _DEFAULT_APP_NAME:
        raise ValueError(
            'The default Firebase app does not exist. Make sure to initialize '
            'the SDK by calling initialize_app().')

    raise ValueError(
        ('Firebase app named "{0}" does not exist. Make sure to initialize '
         'the SDK by calling initialize_app() with your app name as the '
         'second argument.').format(name))


class _AppOptions:
    """A collection of configuration options for an App."""

    def __init__(self, options):
        if options is None:
            options = self._load_from_environment()

        if not isinstance(options, dict):
            raise ValueError('Illegal Firebase app options type: {0}. Options '
                             'must be a dictionary.'.format(type(options)))
        self._options = options

    def get(self, key, default=None):
        """Returns the option identified by the provided key."""
        return self._options.get(key, default)

    def _load_from_environment(self):
        """Invoked when no options are passed to __init__, loads options from FIREBASE_CONFIG.

        If the value of the FIREBASE_CONFIG environment variable starts with "{" an attempt is made
        to parse it as a JSON object, otherwise it is assumed to be pointing to a JSON file.
        """

        config_file = os.getenv(_FIREBASE_CONFIG_ENV_VAR)
        if not config_file:
            return {}
        if config_file.startswith('{'):
            json_str = config_file
        else:
            try:
                with open(config_file, 'r') as json_file:
                    json_str = json_file.read()
            except Exception as err:
                raise ValueError('Unable to read file {}. {}'.format(config_file, err))
        try:
            json_data = json.loads(json_str)
        except Exception as err:
            raise ValueError('JSON string "{0}" is not valid json. {1}'.format(json_str, err))
        return {k: v for k, v in json_data.items() if k in _CONFIG_VALID_KEYS}


class App:
    """The entry point for Firebase Python SDK.

    Represents a Firebase app, while holding the configuration and state
    common to all Firebase APIs.
    """

    def __init__(self, name, credential, options):
        """Constructs a new App using the provided name and options.

        Args:
          name: Name of the application.
          credential: A credential object.
          options: A dictionary of configuration options.

        Raises:
          ValueError: If an argument is None or invalid.
        """
        if not name or not isinstance(name, str):
            raise ValueError('Illegal Firebase app name "{0}" provided. App name must be a '
                             'non-empty string.'.format(name))
        self._name = name

        if isinstance(credential, GoogleAuthCredentials):
            self._credential = credentials._ExternalCredentials(credential) # pylint: disable=protected-access
        elif isinstance(credential, credentials.Base):
            self._credential = credential
        else:
            raise ValueError('Illegal Firebase credential provided. App must be initialized '
                             'with a valid credential instance.')
        self._options = _AppOptions(options)
        self._lock = threading.RLock()
        self._services = {}

        App._validate_project_id(self._options.get('projectId'))
        self._project_id_initialized = False

    @classmethod
    def _validate_project_id(cls, project_id):
        if project_id is not None and not isinstance(project_id, str):
            raise ValueError(
                'Invalid project ID: "{0}". project ID must be a string.'.format(project_id))

    @property
    def name(self):
        return self._name

    @property
    def credential(self):
        return self._credential

    @property
    def options(self):
        return self._options

    @property
    def project_id(self):
        if not self._project_id_initialized:
            self._project_id = self._lookup_project_id()
            self._project_id_initialized = True
        return self._project_id

    def _lookup_project_id(self):
        """Looks up the Firebase project ID associated with an App.

        If a ``projectId`` is specified in app options, it is returned. Then tries to
        get the project ID from the credential used to initialize the app. If that also fails,
        attempts to look up the ``GOOGLE_CLOUD_PROJECT`` and ``GCLOUD_PROJECT`` environment
        variables.

        Returns:
            str: A project ID string or None.
        """
        project_id = self._options.get('projectId')
        if not project_id:
            try:
                project_id = self._credential.project_id
            except (AttributeError, DefaultCredentialsError):
                pass
        if not project_id:
            project_id = os.environ.get('GOOGLE_CLOUD_PROJECT',
                                        os.environ.get('GCLOUD_PROJECT'))
        App._validate_project_id(self._options.get('projectId'))
        return project_id

    def _get_service(self, name, initializer):
        """Returns the service instance identified by the given name.

        Services are functional entities exposed by the Admin SDK (e.g. auth, database). Each
        service instance is associated with exactly one App. If the named service
        instance does not exist yet, _get_service() calls the provided initializer function to
        create the service instance. The created instance will be cached, so that subsequent
        calls would always fetch it from the cache.

        Args:
          name: Name of the service to retrieve.
          initializer: A function that can be used to initialize a service for the first time.

        Returns:
          object: The specified service instance.

        Raises:
          ValueError: If the provided name is invalid, or if the App is already deleted.
        """
        if not name or not isinstance(name, str):
            raise ValueError(
                'Illegal name argument: "{0}". Name must be a non-empty string.'.format(name))
        with self._lock:
            if self._services is None:
                raise ValueError(
                    'Service requested from deleted Firebase App: "{0}".'.format(self._name))
            if name not in self._services:
                self._services[name] = initializer(self)
            return self._services[name]

    def _cleanup(self):
        """Cleans up any services associated with this App.

        Checks whether each service contains a close() method, and calls it if available.
        This is to be called when an App is being deleted, thus ensuring graceful termination of
        any services started by the App.
        """
        with self._lock:
            for service in self._services.values():
                if hasattr(service, 'close') and hasattr(service.close, '__call__'):
                    service.close()
            self._services = None
