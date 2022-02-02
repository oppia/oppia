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

"""Installation script for Oppia python backend libraries."""

from __future__ import annotations

import collections
import json
import os
import re
import shutil
import subprocess
import sys

from core import python_utils
from core import utils

import pkg_resources

from . import common

# This is the version that is set in install_prerequisites.sh.
OPPIA_REQUIRED_PIP_VERSION = '21.2.3'
GIT_DIRECT_URL_REQUIREMENT_PATTERN = (
    # NOTE: Direct URLs to GitHub must specify a specific commit hash in their
    # definition. This helps stabilize the implementation we depend upon.
    re.compile(r'^(git\+git://github\.com/.*?@[0-9a-f]{40})#egg=([^\s]*)'))


def verify_pip_is_installed():
    """Verify that pip is installed.

    Raises:
        ImportError. Error importing pip.
    """
    print('Checking if pip is installed on the local machine')
    try:
        import pip
    except ImportError as e:
        common.print_each_string_after_two_new_lines([
            'Pip is required to install Oppia dependencies, but pip wasn\'t '
            'found on your local machine.',
            'Please see \'Installing Oppia\' on the Oppia developers\' wiki '
            'page:'])

        if common.is_mac_os():
            print(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Mac-'
                'OS%29')
        elif common.is_linux_os():
            print(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Linux'
                '%29')
        else:
            print(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28'
                'Windows%29')
        raise ImportError('Error importing pip: %s' % e)
    else:
        if pip.__version__ != OPPIA_REQUIRED_PIP_VERSION:
            common.print_each_string_after_two_new_lines([
                'Oppia requires pip==%s, but you have pip==%s installed.' % (
                    OPPIA_REQUIRED_PIP_VERSION, pip.__version__),
                'Upgrading pip to %s on your behalf...' % (
                    OPPIA_REQUIRED_PIP_VERSION),
            ])
            _run_pip_command(
                ['install', 'pip==%s' % OPPIA_REQUIRED_PIP_VERSION])


def _run_pip_command(cmd_parts):
    """Run pip command with some flags and configs. If it fails try to rerun it
    with additional flags and else raise an exception.

    Args:
        cmd_parts: list(str). List of cmd parts to be run with pip.

    Raises:
        Exception. Error installing package.
    """
    # The call to python -m is used to ensure that Python and Pip versions are
    # compatible.
    command = [sys.executable, '-m', 'pip'] + cmd_parts
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        encoding='utf-8')
    stdout, stderr = process.communicate()
    if process.returncode == 0:
        print(stdout)
    elif 'can\'t combine user with prefix' in stderr:
        print('Trying by setting --user and --prefix flags.')
        subprocess.check_call(
            command + ['--user', '--prefix=', '--system'])
    else:
        print(stderr)
        print('Refer to https://github.com/oppia/oppia/wiki/Troubleshooting')
        raise Exception('Error installing package')


def regenerate_txt():
    print('Regenerating "requirements.txt" file...')
    # Calls the script to regenerate requirements. The reason we cannot call the
    # regenerate requirements functionality inline is because the python script
    # that regenerates the file is a command-line interface (CLI). Once the CLI
    # finishes execution, it forces itself and any python scripts in the current
    # callstack to exit.
    # Therefore, in order to allow continued execution after the requirements
    # file is generated, we must call it as a separate process.
    # The option --no-emit-index-url is specified to prevent pip compile from
    # generating an index configuration line(s) in requirements.txt when the
    # local pip configuration uses one or more custom index servers.
    subprocess.check_call(
        [
            'python',
            '-m',
            'scripts.regenerate_requirements',
            '--no-emit-index-url',
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE)
    # Adds a note to the beginning of the 'requirements.txt' file to make sure
    # developers understand that they should not append or change this
    # autogenerated file.
    with python_utils.open_file(
        common.COMPILED_REQUIREMENTS_FILE_PATH, 'r+'
    ) as f:
        content = f.read()
        f.seek(0, 0)
        f.write(
            '# Developers: Please do not modify this auto-generated file. If\n'
            '# you want to add, remove, upgrade, or downgrade libraries,\n'
            '# please change the `requirements.in` file, and then follow\n'
            '# the instructions there to regenerate this file.\n' + content)


def main():
    """Compares the state of the current 'third_party/python_libs' directory to
    the libraries listed in the 'requirements.txt' file. If there are
    mismatches, regenerate the 'requirements.txt' file and correct the
    mismatches.
    """
    verify_pip_is_installed()

    subprocess.check_call(
        ['pip', 'install', '--upgrade', '-r', 'requirements.txt'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE
    )


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when install_third_party_libs.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
