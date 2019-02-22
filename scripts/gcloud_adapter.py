# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Module with GCloud-related functions."""

import os
import subprocess

GCLOUD_PATH = os.path.join(
    '..', 'oppia_tools', 'google-cloud-sdk-222.0.0', 'google-cloud-sdk',
    'bin', 'gcloud')


def require_gcloud_to_be_available():
    """Check whether gcloud is installed while undergoing deployment process."""
    try:
        subprocess.check_output([GCLOUD_PATH, '--version'])
    except Exception:
        raise Exception(
            'gcloud required, but could not be found. Please run '
            'scripts/start.sh to install gcloud.')


def update_indexes(index_yaml_path, app_name):
    """Update indexes on the production server.

    Args:
        index_yaml_path: str. The path to the index.yaml file.
        app_name: str. The name of the GCloud project.
    """
    assert os.path.isfile(index_yaml_path)
    subprocess.check_output([
        GCLOUD_PATH, '--quiet', 'datastore', 'indexes', 'create',
        index_yaml_path, '--project=%s' % app_name])


def get_currently_served_version(app_name):
    """Retrieves the default version being served on the specified App Engine
    application.

    Args:
        app_name: str. The name of the GCloud project.

    Returns:
        str: The current serving version.
    """
    listed_versions = subprocess.check_output([
        GCLOUD_PATH, 'app', 'versions', 'list', '--hide-no-traffic',
        '--service=default', '--project=%s' % app_name])
    default_version_line_start_str = 'default  '
    listed_versions = listed_versions[
        listed_versions.index(default_version_line_start_str) + len(
            default_version_line_start_str):]
    return listed_versions[:listed_versions.index(' ')]


def deploy_application(app_yaml_path, app_name, version=None):
    """Deploys the service corresponding to the given app.yaml path to GAE.

    Args:
        app_yaml_path: str. The path to the app.yaml file.
        app_name: str. The name of the GCloud project.
        version: str or None. If provided, the version to use.
    """
    args = [
        GCLOUD_PATH, '--quiet', 'app', 'deploy', app_yaml_path,
        '--no-promote', '--no-stop-previous-version',
        '--project=%s' % app_name]
    if version is not None:
        args.append('--version=%s' % version)
    subprocess.check_output(args)
