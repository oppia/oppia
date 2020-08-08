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

"""This script runs unit tests for frontend JavaScript code (using Karma)."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import os
import subprocess
import sys

import python_utils

from . import build
from . import check_frontend_coverage
from . import common
from . import install_third_party_libs

_PARSER = argparse.ArgumentParser(
    description="""
Run this script from the oppia root folder:
    python -m scripts.run_frontend_tests
The root folder MUST be named 'oppia'.
Note: You can replace 'it' with 'fit' or 'describe' with 'fdescribe' to run
a single test or test suite.
""")

_PARSER.add_argument(
    '--skip_install',
    help='optional; if specified, skips installing dependencies',
    action='store_true')
_PARSER.add_argument(
    '--run_minified_tests',
    help='optional; if specified, runs frontend karma tests on both minified '
    'and non-minified code',
    action='store_true')
_PARSER.add_argument(
    '--check_coverage',
    help='option; if specified, checks frontend test coverage',
    action='store_true'
)


def main(args=None):
    """Runs the frontend tests."""
    parsed_args = _PARSER.parse_args(args=args)

    if not parsed_args.skip_install:
        install_third_party_libs.main()

    common.print_each_string_after_two_new_lines([
        'View interactive frontend test coverage reports by navigating to',
        '../karma_coverage_reports',
        'on your filesystem.',
        'Running test in development environment'])


    if parsed_args.run_minified_tests:
        python_utils.PRINT('Running test in production environment')

        build.main(args=['--prod_env', '--minify_third_party_libs_only'])

        cmd = [
            os.path.join(common.NODE_MODULES_PATH, 'karma', 'bin', 'karma'),
            'start', os.path.join('core', 'tests', 'karma.conf.ts'),
            '--prodEnv']
    else:
        build.main(args=[])

        cmd = [
            os.path.join(common.NODE_MODULES_PATH, 'karma', 'bin', 'karma'),
            'start', os.path.join('core', 'tests', 'karma.conf.ts')]

    task = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    output_lines = []
    # Reads and prints realtime output from the subprocess until it terminates.
    while True:
        line = task.stdout.readline()
        # No more output from the subprocess, and the subprocess has ended.
        if len(line) == 0 and task.poll() is not None:
            break
        if line:
            python_utils.PRINT(line, end='')
            output_lines.append(line)
    concatenated_output = ''.join(
        line.decode('utf-8') for line in output_lines)

    python_utils.PRINT('Done!')

    if 'Trying to get the Angular injector' in concatenated_output:
        python_utils.PRINT(
            'If you run into the error "Trying to get the Angular injector",'
            ' please see https://github.com/oppia/oppia/wiki/'
            'Frontend-test-best-practices#fixing-frontend-test-errors'
            ' for details on how to fix it.')

    if parsed_args.check_coverage:
        if task.returncode:
            sys.exit(
                'The frontend tests failed. Please fix it before running the'
                ' test coverage check.')
        else:
            check_frontend_coverage.main()
    elif task.returncode:
        sys.exit(task.returncode)


if __name__ == '__main__':
    main()
