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
import shutil
import subprocess

import python_utils
from scripts import common

from . import install_third_party_libs


FECONF_FILE_PATH = os.path.join('feconf.py')
CONSTANTS_FILE_PATH = os.path.join('assets/constants.ts')


def setup_and_install_dependencies():
    """Runs the setup and installation scripts."""
    install_third_party_libs.main()


def cleanup():
    """Deactivates webpages and deletes html lighthouse reports."""
    shutil.rmtree('.lighthouseci')

    pattern = 'COMMUNITY_DASHBOARD_ENABLED = .*'
    replace = 'COMMUNITY_DASHBOARD_ENABLED = False'
    common.inplace_replace_file(FECONF_FILE_PATH, pattern, replace)

    pattern = '"ENABLE_ACCOUNT_DELETION": .*'
    replace = '"ENABLE_ACCOUNT_DELETION": false,'
    common.inplace_replace_file(CONSTANTS_FILE_PATH, pattern, replace)


def run_lighthouse_checks():
    """Runs the lighthhouse checks through the lighthouserc.json config."""
    node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
    lhci_path = os.path.join(
        'node_modules', '@lhci', 'cli', 'src', 'cli.js')
    bash_command = [node_path, lhci_path, 'autorun']
    process = subprocess.Popen(bash_command, stdout=subprocess.PIPE)

    for line in iter(process.stdout.readline, ''):
        python_utils.PRINT(line[:-1])


def enable_webpages():
    """Enables deactivated webpages for testing."""
    pattern = 'COMMUNITY_DASHBOARD_ENABLED = .*'
    replace = 'COMMUNITY_DASHBOARD_ENABLED = True'
    common.inplace_replace_file(FECONF_FILE_PATH, pattern, replace)

    pattern = '"ENABLE_ACCOUNT_DELETION": .*'
    replace = '"ENABLE_ACCOUNT_DELETION": true,'
    common.inplace_replace_file(CONSTANTS_FILE_PATH, pattern, replace)


def main():
    """Runs lighthouse checks and deletes reports."""
    setup_and_install_dependencies()
    enable_webpages()
    atexit.register(cleanup)
    run_lighthouse_checks()


if __name__ == '__main__':
    main()
