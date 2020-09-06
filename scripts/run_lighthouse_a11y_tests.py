# Copyright 2020 The Oppia Authors. All Rights Reserved.
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
"""This script runs lighthouse accessibility checks in the development
environment.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import atexit
import os
import re
import subprocess
import sys
import time

import python_utils
from scripts import build
from scripts import common


FECONF_FILE_PATH = common.FECONF_PATH
CONSTANTS_FILE_PATH = common.CONSTANTS_FILE_PATH
WEBPACK_BIN_PATH = os.path.join(
    common.CURR_DIR, 'node_modules', 'webpack', 'bin', 'webpack.js')
GOOGLE_APP_ENGINE_PORT = 8181
SUBPROCESSES = []


def cleanup():
    """Deactivates webpages and deletes html lighthouse reports."""

    pattern = 'CONTRIBUTOR_DASHBOARD_ENABLED = .*'
    replace = 'CONTRIBUTOR_DASHBOARD_ENABLED = False'
    common.inplace_replace_file(FECONF_FILE_PATH, pattern, replace)

    pattern = '"ENABLE_ACCOUNT_DELETION": .*'
    replace = '"ENABLE_ACCOUNT_DELETION": false,'
    common.inplace_replace_file(CONSTANTS_FILE_PATH, pattern, replace)

    build.set_constants_to_default()

    google_app_engine_path = '%s/' % common.GOOGLE_APP_ENGINE_SDK_HOME
    processes_to_kill = [
        '.*%s.*' % re.escape(google_app_engine_path),
    ]
    for p in SUBPROCESSES:
        p.kill()

    for p in processes_to_kill:
        common.kill_processes_based_on_regex(p)

    common.stop_redis_server()


def run_lighthouse_puppeteer_script():
    """Runs puppeteer script to collect dynamic urls."""
    puppeteer_path = os.path.join(
        'core', 'tests', 'puppeteer', 'lighthouse_setup.js')
    bash_command = [common.NODE_BIN_PATH, puppeteer_path]

    try:
        script_output = subprocess.check_output(bash_command).split('\n')
        python_utils.PRINT(script_output)
        for url in script_output:
            export_url(url)
        python_utils.PRINT(
            'Puppeteer script completed successfully.')

    except subprocess.CalledProcessError:
        python_utils.PRINT(
            'Puppeteer script failed. More details can be found above.')
        sys.exit(1)


def export_url(url):
    """Exports the url to an environmental variable."""
    url_list = url.split('/')
    if 'collection_editor' in url:
        os.environ['collection_editor'] = url_list[5]
    elif 'create' in url:
        os.environ['exploration_editor'] = url_list[4]
    elif 'topic_editor' in url:
        os.environ['topic_editor'] = url_list[4]
    elif 'story_editor' in url:
        os.environ['story_editor'] = url_list[4]
    elif 'skill_editor' in url:
        os.environ['skill_editor'] = url_list[4]

def run_webpack_compilation(source_maps=False):
    """Runs webpack compilation."""
    max_tries = 5
    webpack_bundles_dir_name = 'webpack_bundles'
    for _ in python_utils.RANGE(max_tries):
        try:
            webpack_config_file = (
                build.WEBPACK_DEV_SOURCE_MAPS_CONFIG if source_maps
                else build.WEBPACK_DEV_CONFIG)
            subprocess.check_call([
                common.NODE_BIN_PATH, WEBPACK_BIN_PATH, '--config',
                webpack_config_file])
        except subprocess.CalledProcessError as error:
            python_utils.PRINT(error.output)
            sys.exit(error.returncode)
            return
        if os.path.isdir(webpack_bundles_dir_name):
            break
    if not os.path.isdir(webpack_bundles_dir_name):
        python_utils.PRINT(
            'Failed to complete webpack compilation, exiting ...')
        sys.exit(1)

def run_lighthouse_checks():
    """Runs the lighthouse accessibility checks."""

    lhci_path = os.path.join('node_modules', '@lhci', 'cli', 'src', 'cli.js')
    bash_command = [
        common.NODE_BIN_PATH, lhci_path, 'autorun',
         '--config=.lighthouserc-a11y.js']

    try:
        subprocess.check_call(bash_command)
        python_utils.PRINT(
            'Lighthouse accessibility checks completed successfully.')
    except subprocess.CalledProcessError:
        python_utils.PRINT(
            'Lighthouse accessibility checks failed.' +
             'More details can be found above.')
        sys.exit(1)


def enable_webpages():
    """Enables deactivated webpages for testing."""

    pattern = 'CONTRIBUTOR_DASHBOARD_ENABLED = .*'
    replace = 'CONTRIBUTOR_DASHBOARD_ENABLED = True'
    common.inplace_replace_file(FECONF_FILE_PATH, pattern, replace)

    pattern = '"ENABLE_ACCOUNT_DELETION": .*'
    replace = '"ENABLE_ACCOUNT_DELETION": true,'
    common.inplace_replace_file(CONSTANTS_FILE_PATH, pattern, replace)


def start_google_app_engine_server():
    """Start the Google App Engine server."""

    app_yaml_filepath = 'app_dev.yaml'
    p = subprocess.Popen(
        '%s %s/dev_appserver.py --host 0.0.0.0 --port %s '
        '--clear_datastore=yes --dev_appserver_log_level=critical '
        '--log_level=critical --skip_sdk_update_check=true %s' %
        (
            common.CURRENT_PYTHON_BIN, common.GOOGLE_APP_ENGINE_SDK_HOME,
            GOOGLE_APP_ENGINE_PORT, app_yaml_filepath
        ), shell=True)
    SUBPROCESSES.append(p)


def main():
    """Runs lighthouse checks and deletes reports."""

    enable_webpages()
    atexit.register(cleanup)

    build.main(args=[])
    run_webpack_compilation()

    common.start_redis_server()
    start_google_app_engine_server()
    common.wait_for_port_to_be_open(GOOGLE_APP_ENGINE_PORT)
    run_lighthouse_puppeteer_script()
    run_lighthouse_checks()


if __name__ == '__main__':
    main()
