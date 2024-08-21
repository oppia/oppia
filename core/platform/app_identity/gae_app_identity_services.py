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

from __future__ import annotations

from core import feconf

_GCS_RESOURCE_BUCKET_NAME_SUFFIX = '-resources'


def get_application_id() -> str:
    """Returns the application's App Engine ID.

    Locally we set the GOOGLE_CLOUD_PROJECT environment variable in
    scripts/servers.py when starting the dev server. In production
    the GOOGLE_CLOUD_PROJECT is set by the server.

    Returns:
        str. The application ID.

    Raises:
        ValueError. Value can't be None for application id.
    """
    app_id = feconf.OPPIA_PROJECT_ID
    if app_id is None:
        raise ValueError('Value None for application id is invalid.')
    return app_id


def get_gcs_resource_bucket_name() -> str:
    """Returns the application's bucket name for GCS resources, which depends
    on the application ID in production mode, or default bucket name in
    development mode.

    This needs to be in sync with deploy.py which adds the bucket name to
    constants.ts

    Also, note that app_identity.get_default_gcs_bucket_name() returns None
    if we try to use it in production mode but the default bucket hasn't been
    enabled through the project console.

    Returns:
        str. The bucket name for the application's GCS resources.
    """
    return '%s%s' % (get_application_id(), _GCS_RESOURCE_BUCKET_NAME_SUFFIX)
