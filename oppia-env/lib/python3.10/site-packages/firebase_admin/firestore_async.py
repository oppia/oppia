# Copyright 2022 Google Inc.
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

"""Cloud Firestore Async module.

This module contains utilities for asynchronusly accessing the Google Cloud Firestore databases
associated with Firebase apps. This requires the ``google-cloud-firestore`` Python module.
"""

from __future__ import annotations
from typing import Optional, Dict
from firebase_admin import App
from firebase_admin import _utils

try:
    from google.cloud import firestore
    from google.cloud.firestore_v1.base_client import DEFAULT_DATABASE
    existing = globals().keys()
    for key, value in firestore.__dict__.items():
        if not key.startswith('_') and key not in existing:
            globals()[key] = value
except ImportError as error:
    raise ImportError('Failed to import the Cloud Firestore library for Python. Make sure '
                      'to install the "google-cloud-firestore" module.') from error


_FIRESTORE_ASYNC_ATTRIBUTE: str = '_firestore_async'


def client(app: Optional[App] = None, database_id: Optional[str] = None) -> firestore.AsyncClient:
    """Returns an async client that can be used to interact with Google Cloud Firestore.

    Args:
        app: An App instance (optional).
        database_id: The database ID of the Google Cloud Firestore database to be used.
            Defaults to the default Firestore database ID if not specified or an empty string
            (optional).

    Returns:
        google.cloud.firestore.Firestore_Async: A `Firestore Async Client`_.

    Raises:
        ValueError: If the specified database ID is not a valid string, or if a project ID is not
            specified either via options, credentials or environment variables, or if the specified
            project ID is not a valid string.

    .. _Firestore Async Client: https://cloud.google.com/python/docs/reference/firestore/latest/\
        google.cloud.firestore_v1.async_client.AsyncClient
    """
    # Validate database_id
    if database_id is not None and not isinstance(database_id, str):
        raise ValueError(f'database_id "{database_id}" must be a string or None.')

    fs_service = _utils.get_app_service(app, _FIRESTORE_ASYNC_ATTRIBUTE, _FirestoreAsyncService)
    return fs_service.get_client(database_id)

class _FirestoreAsyncService:
    """Service that maintains a collection of firestore async clients."""

    def __init__(self, app: App) -> None:
        self._app: App = app
        self._clients: Dict[str, firestore.AsyncClient] = {}

    def get_client(self, database_id: Optional[str]) -> firestore.AsyncClient:
        """Creates an async client based on the database_id. These clients are cached."""
        database_id = database_id or DEFAULT_DATABASE
        if database_id not in self._clients:
            # Create a new client and cache it in _clients
            credentials = self._app.credential.get_credential()
            project = self._app.project_id
            if not project:
                raise ValueError(
                    'Project ID is required to access Firestore. Either set the projectId option, '
                    'or use service account credentials. Alternatively, set the '
                    'GOOGLE_CLOUD_PROJECT environment variable.')

            fs_client = firestore.AsyncClient(
                credentials=credentials, project=project, database=database_id)
            self._clients[database_id] = fs_client

        return self._clients[database_id]
