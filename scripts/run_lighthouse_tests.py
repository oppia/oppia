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
"""This script performs lighthouse checks and creates lighthouse reports."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import atexit
import os
import re
import signal
import subprocess
import sys
import time

import python_utils
from scripts import build
from scripts import common

FECONF_FILE_PATH = os.path.join('feconf.py')
CONSTANTS_FILE_PATH = os.path.join('assets/constants.ts')
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

    google_app_engine_path = '%s/' % common.GOOGLE_APP_ENGINE_SDK_HOME
    processes_to_kill = [
        '.*%s.*' % re.escape(google_app_engine_path),
    ]
    for p in SUBPROCESSES:
        p.kill()

    for p in processes_to_kill:
        common.kill_processes_based_on_regex(p)
    build.set_constants_to_default()


def run_lighthouse_checks():
    """Runs the lighthhouse checks through the lighthouserc.json config."""

    node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
    lhci_path = os.path.join('node_modules', '@lhci', 'cli', 'src', 'cli.js')
    bash_command = [node_path, lhci_path, 'autorun']

    try:
        subprocess.check_call(bash_command)
        python_utils.PRINT('Lighthouse checks completed successfully.')
    except subprocess.CalledProcessError:
        python_utils.PRINT(
            'Lighthouse checks failed. More details can be found above.')
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

    app_yaml_filepath = 'app.yaml'
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

    python_utils.PRINT('Building files in production mode.')
    build.main(args=['--prod_env'])
    build.modify_constants(prod_env=True)
    start_google_app_engine_server()
    common.wait_for_port_to_be_open(GOOGLE_APP_ENGINE_PORT)
    run_lighthouse_checks()


if __name__ == '__main__':
    main()
