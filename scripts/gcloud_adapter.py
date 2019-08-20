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
import sys

GCLOUD_PATH = os.path.join(
    '..', 'oppia_tools', 'google-cloud-sdk-251.0.0', 'google-cloud-sdk',
    'bin', 'gcloud')

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, '..', 'oppia_tools')
THIRD_PARTY_DIR = os.path.join(CURR_DIR, 'third_party')

DIRS_TO_ADD_TO_SYS_PATH = [
    os.path.join(
        OPPIA_TOOLS_DIR, 'google_appengine_1.9.67', 'google_appengine'),
    os.path.join(OPPIA_TOOLS_DIR, 'webtest-2.0.33'),
    os.path.join(
        OPPIA_TOOLS_DIR, 'google_appengine_1.9.67', 'google_appengine',
        'lib', 'webob_0_9'),
    os.path.join(OPPIA_TOOLS_DIR, 'browsermob-proxy-0.8.0'),
    os.path.join(OPPIA_TOOLS_DIR, 'selenium-3.13.0'),
    os.path.join(OPPIA_TOOLS_DIR, 'Pillow-6.0.0'),
    CURR_DIR,
    os.path.join(THIRD_PARTY_DIR, 'backports.functools_lru_cache-1.5'),
    os.path.join(THIRD_PARTY_DIR, 'beautifulsoup4-4.7.1'),
    os.path.join(THIRD_PARTY_DIR, 'bleach-3.1.0'),
    os.path.join(THIRD_PARTY_DIR, 'callbacks-0.3.0'),
    os.path.join(THIRD_PARTY_DIR, 'gae-cloud-storage-1.9.22.1'),
    os.path.join(THIRD_PARTY_DIR, 'gae-mapreduce-1.9.22.0'),
    os.path.join(THIRD_PARTY_DIR, 'gae-pipeline-1.9.22.1'),
    os.path.join(THIRD_PARTY_DIR, 'graphy-1.0.0'),
    os.path.join(THIRD_PARTY_DIR, 'html5lib-python-1.0.1'),
    os.path.join(THIRD_PARTY_DIR, 'mutagen-1.42.0'),
    os.path.join(THIRD_PARTY_DIR, 'simplejson-3.16.0'),
    os.path.join(THIRD_PARTY_DIR, 'six-1.12.0'),
    os.path.join(THIRD_PARTY_DIR, 'soupsieve-1.9.1'),
    os.path.join(THIRD_PARTY_DIR, 'webencodings-0.5.1'),
]

for directory in DIRS_TO_ADD_TO_SYS_PATH:
    if not os.path.exists(os.path.dirname(directory)):
        raise Exception('Directory %s does not exist.' % directory)
    sys.path.insert(0, directory)


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


def check_indexes(app_name):
    """Checks that all indexes are serving.

    Args:
        app_name: str. The name of the GCloud project.

    Returns:
        bool. A boolean to indicate whenther all indexes are serving or not.
    """
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
    indexes_serving = get_indexes(app_name)
    for index in indexes_serving:
        if index['state'] != 'READY':
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


def switch_version(app_name, version_to_switch_to):
    """Switches to the release version and migrates traffic to it.

    Args:
        app_name: str. The name of the GCloud project.
        version_to_switch_to: str. The version to switch to.
    """
    subprocess.check_output([
        GCLOUD_PATH, 'app', 'services', 'set-traffic', 'default',
        '--splits', '%s=1' % version_to_switch_to, '--project=%s' % app_name])


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

    Returns:
        bool. True if memcache is flushed successfully, false otherwise.
    """
    import dev_appserver
    dev_appserver.fix_sys_path()

    from google.appengine.ext.remote_api import remote_api_stub
    from google.appengine.api import memcache

    remote_api_stub.ConfigureRemoteApiForOAuth(
        '%s.appspot.com' % app_name, '/_ah/remote_api', app_id=app_name)
    return memcache.flush_all()
