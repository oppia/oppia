# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Provides app identity services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants

from google.appengine.api import app_identity

_GCS_RESOURCE_BUCKET_NAME_SUFFIX = '-resources'


def get_application_id():
    """Returns the application's App Engine ID.

    For more information, see
    https://cloud.google.com/appengine/docs/python/appidentity/

    Returns:
        str. The application ID.
    """
    return app_identity.get_application_id()


def get_access_token(scopes):
    """The OAuth 2.0 access token to act on behalf of the application.

    This token will be cached.

    A token will be generated and cached for the service account for the App
    Engine application.

    Each application has an associated Google account. This function returns an
    OAuth 2.0 access token that corresponds to the running app. Access tokens
    are safe to cache and reuse until their expiry time as returned. This method
    caches access tokens using both an in-process cache and memcache.

    Args:
        scopes: str | list(str). The requested API scope as a string, or a list
            of strings.

    Returns:
        tuple(str, float). The token string and expiration time in seconds since
        the epoch.
    """
    return app_identity.get_access_token(scopes)


def get_gcs_resource_bucket_name():
    """Returns the application's bucket name for GCS resources, which depends
    on the application ID in production mode, or default bucket name in
    development mode.

    This needs to be in sync with deploy.py which adds the bucket name to
    constants.js

    Also, note that app_identity.get_default_gcs_bucket_name() returns None
    if we try to use it in production mode but the default bucket hasn't been
    enabled through the project console.

    Returns:
        str. The bucket name for the application's GCS resources.
    """
    if constants.DEV_MODE:
        return get_default_gcs_bucket_name()
    else:
        return get_application_id() + _GCS_RESOURCE_BUCKET_NAME_SUFFIX


def get_default_gcs_bucket_name(deadline=None):
    """Gets the default Google Cloud Storage bucket name for the app.

    Args:
        deadline: float. Optional deadline in seconds for the operation; the
            default value is a system-specific deadline, typically 5 seconds.

    Returns:
        str. Default bucket name for the app.
    """
    return app_identity.get_default_gcs_bucket_name(deadline=deadline)
