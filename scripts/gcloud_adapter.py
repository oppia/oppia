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

import json
import os
import subprocess
import yaml

GCLOUD_PATH = os.path.join(
    '..', 'oppia_tools', 'google-cloud-sdk-251.0.0', 'google-cloud-sdk',
    'bin', 'gcloud')
REMOTE_API_PATH = os.path.join(
    '..', 'oppia_tools', 'google_appengine_1.9.67', 'google_appengine',
    'remote_api_shell.py')


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


def get_indexes(app_name):
    """Obtains indexes serving on the server.

    Args:
        app_name: str. The name of the GCloud project.

    Returns:
        list. A list of dict of serving indexes.
    """
    listed_indexes = subprocess.check_output([
        GCLOUD_PATH, 'datastore', 'indexes', 'list',
        '--project=%s' % app_name, '--format=json'])
    return json.loads(listed_indexes)


def check_indexes(index_yaml_path, app_name):
    """Checks that all indexes in index.yaml are serving.

    Args:
        index_yaml_path: str. The path to the index.yaml file.
        app_name: str. The name of the GCloud project.

    Returns:
        bool. A boolean to indicate whenther all indexes are serving or not.
    """
    indexes_serving = get_indexes(app_name)
    with open(index_yaml_path, 'r') as f:
        retrieved_indexes = yaml.safe_load(f.read())['indexes']

    indexes_serving_dict = {}
    required_indexes_dict = {}

    # Serving indexes is a list of dict of indexes. The format of
    # each dict is as follows:
    # {
    #   "ancestor": "NONE",
    #   "indexId": "CICAgIDAiJ0K",
    #   "kind": "_AE_Pipeline_Record",
    #   "projectId": "test-oppia",
    #   "properties": [
    #     {
    #       "direction": "ASCENDING",
    #       "name": "is_root_pipeline"
    #     },
    #     {
    #       "direction": "DESCENDING",
    #       "name": "start_time"
    #     }
    #   ],
    #   "state": "READY"
    # }
    for index in indexes_serving:
        if index['state'] != 'READY':
            continue
        indexes_serving_dict[index['kind']] = {
            'properties': index['properties']
        }
        indexes_serving_dict[index['kind']]['properties'].sort()

    # Retrieved indexes is a list of dict of indexes. The format of
    # each dict is as follows:
    # {
    #     'kind': 'ClassifierTrainingJobModel',
    #     'properties': [{
    #         'name': 'status'
    #     }, {
    #         'name': 'next_scheduled_check_time',
    #         'direction': 'desc'
    #     }]
    # }
    for index in retrieved_indexes:
        required_indexes_dict[index['kind']] = {
            'properties': []
        }
        for prop in index['properties']:
            direction = prop.get('direction')
            if not direction or direction == 'asc':
                prop['direction'] = 'ASCENDING'
            else:
                prop['direction'] = 'DESCENDING'
            required_indexes_dict[index['kind']]['properties'].append(
                prop)
        required_indexes_dict[index['kind']]['properties'].sort()

    if cmp(indexes_serving_dict, required_indexes_dict):
        return False
    return True


def get_currently_served_version(app_name):
    """Retrieves the default version being served on the specified App Engine
    application.

    Args:
        app_name: str. The name of the GCloud project.

    Returns:
        str. The current serving version.
    """
    listed_versions = subprocess.check_output([
        GCLOUD_PATH, 'app', 'versions', 'list', '--hide-no-traffic',
        '--service=default', '--project=%s' % app_name])
    default_version_line_start_str = 'default  '
    listed_versions = listed_versions[
        listed_versions.index(default_version_line_start_str) + len(
            default_version_line_start_str):]
    return listed_versions[:listed_versions.index(' ')]


def switch_version(app_name, release_version):
    """Switches to the release version and migrates traffic to it.

    Args:
        app_name: str. The name of the GCloud project.
        release_version: str. The release version to switch to.
    """
    subprocess.check_output([
        GCLOUD_PATH, 'app', 'services', 'set-traffic', 'default',
        '--splits', '%s=1' % release_version, '--project=%s' % app_name])


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


def flush_memcache(app_name):
    """Flushes memcache for the server.

    Args:
        app_name: str. The name of the GCloud project.
    """
    # remote_api_shell.py tries to read history file for the shell. It results
    # in permission issues on the system. So, it is removed to avoid the script
    # trying to read the file.
    history_path = os.path.expanduser('~/.remote_api_shell_history')
    if os.path.exists(history_path):
        os.remove(history_path)
    ps = subprocess.Popen([
        'echo', 'memcache.flush_all()'], stdout=subprocess.PIPE)
    subprocess.check_output([
        REMOTE_API_PATH, '-s' '%s.appspot.com' % app_name], stdin=ps.stdout)
