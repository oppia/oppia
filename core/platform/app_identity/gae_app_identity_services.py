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

import logging
import os

from core.constants import constants

from google.cloud import resourcemanager_v3
from typing import Optional

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
    oppia_project_id = os.environ.get('GOOGLE_CLOUD_PROJECT', 'dev-project-id')
    assert isinstance(oppia_project_id, str)
    if not oppia_project_id:
        raise ValueError('Value "" for application id is invalid.')
    return oppia_project_id


def get_gcs_resource_bucket_name(oppia_project_id: Optional[str] = None) -> str:
    """Returns the application's bucket name for GCS resources, which depends
    on the application ID in production mode, or default bucket name in
    development mode.

    This needs to be in sync with deploy.py which adds the bucket name to
    constants.ts

    Also, note that app_identity.get_default_gcs_bucket_name() returns None
    if we try to use it in production mode but the default bucket hasn't been
    enabled through the project console.

    Args:
        oppia_project_id: Optional[str]. The Google Cloud Project ID. Explicitly
            required when running on Beam Dataflow, as workers cannot
            retrieve the ID from environment variables.

    Returns:
        str. The bucket name for the application's GCS resources.
    """
    project_id = oppia_project_id or get_application_id()
    return '%s%s' % (project_id, _GCS_RESOURCE_BUCKET_NAME_SUFFIX)


def get_compute_engine_default_service_account_email() -> str | None:
    """Returns the Compute Engine default service account email for the project.

    The Compute Engine default service account email follows the format:
    `{PROJECT_NUMBER}-compute@developer.gserviceaccount.com`

    `PROJECT_NUMBER` is NOT the same as `PROJECT_ID` (returned by the function:
    `get_application_id()`), and it is NOT available as an environment variable.
    Instead, we must query against the Google Cloud SDK to retrieve _all_
    high-level project info and then extract the number from its "name" field.

    NOTE: The local developer server doesn't correspond to a project, so when
    running in dev mode we simply return `None`.

    Documentation:
    https://docs.cloud.google.com/compute/docs/access/service-accounts#default_service_account

    Returns:
        str | None. The default service account email, or None when running in
        dev mode or when the request fails for any reason. A warning message
        will also be logged to help with debugging.
    """
    if constants.DEV_MODE:
        return None
    try:
        client = resourcemanager_v3.ProjectsClient()
        request = resourcemanager_v3.GetProjectRequest(
            name=f'projects/{get_application_id()}'
        )
        response = client.get_project(request=request)
        project_number = int(response.name.removeprefix('projects/'))
        return f'{project_number}-compute@developer.gserviceaccount.com'
    except Exception as err:
        logging.warning(
            'Failed to fetch the numeric project id from the '
            'Google Cloud SDK: %s' % err
        )
        return None
