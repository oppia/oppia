# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""MyPy test runner script."""

from __future__ import annotations

import argparse
import os
import site
import subprocess
import sys

from scripts import common

from typing import Final, List, Optional, Tuple

# List of directories whose files won't be type-annotated ever.
EXCLUDED_DIRECTORIES: Final = [
    'proto_files/',
    'scripts/linters/test_files/',
    'third_party/',
    'venv/',
    # The files in 'build_sources' and 'data' directories can be
    # ignored while type checking, because these files are only
    # used as resources for the tests.
    'core/tests/build_sources/',
    'core/tests/data/'
]

CONFIG_FILE_PATH: Final = os.path.join('.', 'mypy.ini')
MYPY_REQUIREMENTS_FILE_PATH: Final = os.path.join('.', 'mypy_requirements.txt')
MYPY_TOOLS_DIR: Final = os.path.join(os.getcwd(), 'third_party', 'python3_libs')
PYTHON3_CMD: Final = 'python3'

_PATHS_TO_INSERT: Final = [MYPY_TOOLS_DIR, ]

_PARSER: Final = argparse.ArgumentParser(
    description='Python type checking using mypy script.'
)

_PARSER.add_argument(
    '--skip-install',
    help='If passed, skips installing dependencies.'
    ' By default, they are installed.',
    action='store_true')

_PARSER.add_argument(
    '--install-globally',
    help='optional; if specified, installs mypy and its requirements globally.'
    ' By default, they are installed to %s' % MYPY_TOOLS_DIR,
    action='store_true')

_PARSER.add_argument(
    '--files',
    help='Files to type-check',
    action='store',
    nargs='+'
)


def get_mypy_cmd(
    files: Optional[List[str]],
    mypy_exec_path: str,
    using_global_mypy: bool
) -> List[str]:
    """Return the appropriate command to be run.

    Args:
        files: Optional[List[str]]. List of files provided to check for MyPy
            type checking, or None if no file is provided explicitly.
        mypy_exec_path: str. Path of mypy executable.
        using_global_mypy: bool. Whether generated command should run using
            global mypy.

    Returns:
        list(str). List of command line arguments.
    """
    if using_global_mypy:
        mypy_cmd = 'mypy'
    else:
        mypy_cmd = mypy_exec_path
    if files:
        cmd = [mypy_cmd, '--config-file', CONFIG_FILE_PATH] + files
    else:
        excluded_files_regex = (
            '|'.join(EXCLUDED_DIRECTORIES)
        )
        cmd = [
            mypy_cmd, '--exclude', excluded_files_regex,
            '--config-file', CONFIG_FILE_PATH, '.'
        ]
    return cmd


def main(args: Optional[List[str]] = None) -> int:
    """Runs the MyPy type checks."""
    parsed_args = _PARSER.parse_args(args=args)

    for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
        # The directories should only be inserted starting at index 1. See
        # https://stackoverflow.com/a/10095099 and
        # https://stackoverflow.com/q/10095037 for more details.
        sys.path.insert(1, directory)

    mypy_exec_path = os.path.join(MYPY_TOOLS_DIR, 'bin', 'mypy')

    print('Starting Mypy type checks.')
    cmd = get_mypy_cmd(
        parsed_args.files, mypy_exec_path, parsed_args.install_globally)

    env = os.environ.copy()
    for path in _PATHS_TO_INSERT:
        env['PATH'] = '%s%s' % (path, os.pathsep) + env['PATH']
    env['PYTHONPATH'] = MYPY_TOOLS_DIR

    process = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
    stdout, stderr = process.communicate()
    # Standard and error output is in bytes, we need to decode the line to
    # print it.
    print(stdout.decode('utf-8'))
    print(stderr.decode('utf-8'))
    if process.returncode == 0:
        print('Mypy type checks successful.')
    else:
        print(
            'Mypy type checks unsuccessful. Please fix the errors. '
            'For more information, visit: '
            'https://github.com/oppia/oppia/wiki/Backend-Type-Annotations')
        sys.exit(2)
    return process.returncode


if __name__ == '__main__': # pragma: no cover
    main()
