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

import os
import shutil
import subprocess

import python_utils
from scripts import common
from . import install_third_party_libs


def setup_and_install_dependencies():
    """Runs the setup and installation scripts."""
    install_third_party_libs.main()


def delete_reports():
    """Deletes the .lighthouse ci folder to handle a bug where
    lighthouse html reports are never deleted.
    """
    shutil.rmtree('.lighthouseci')


def run_lighthouse_checks():
    """Runs the lighthhouse checks through the lighthouserc.json config."""
    node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
    lhci_path = os.path.join(
        'node_modules', '@lhci', 'cli', 'src', 'cli.js')
    bash_command = [node_path, lhci_path, 'autorun']
    process = subprocess.Popen(bash_command, stdout=subprocess.PIPE)

    for line in iter(process.stdout.readline, ''):
        python_utils.PRINT(line[:-1])


def main():
    """Runs lighthouse checks and deletes reports."""
    setup_and_install_dependencies()
    run_lighthouse_checks()
    delete_reports()


if __name__ == '__main__':
    main()
