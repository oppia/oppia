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

"""INSTRUCTIONS:
Run this script from the oppia root folder:
    python -m scripts.run_frontend_tests

Optional arguments:
    --skip_install. If specified, skips installing dependencies.
    --run_minified_tests. If specified, runs frontend karma tests on both
        minified and non-minified code.

The root folder MUST be named 'oppia'.
It runs unit tests for frontend JavaScript code (using Karma).

Note: You can replace 'it' with 'fit' or 'describe' with 'fdescribe' to run a
single test or test suite.
"""
from __future__ import absolute_import  # pylint: disable=import-only-modules

import argparse
import os
import subprocess
import sys

import python_utils

from . import build
from . import install_third_party_libs
from . import setup
from . import setup_gae

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--skip_install',
    help='optional; if specified, skips installing dependencies',
    action='store_true')
_PARSER.add_argument(
    '--run_minified_tests',
    help='optional; if specified, runs frontend karma tests on both minified '
    'and non-minified code',
    action='store_true')


def main(argv):
    """Runs the frontend tests."""
    setup.main()
    setup_gae.main()
    xvfb_prefix = ''
    if os.environ.get('VAGRANT') or os.path.isfile('/etc/is_vagrant_vm'):
        xvfb_prefix = '/usr/bin/xvfb-run'
    parsed_args, _ = _PARSER.parse_known_args(args=argv)
    install_third_party_libs.maybe_install_dependencies(
        parsed_args.skip_install, parsed_args.run_minified_tests)
    python_utils.PRINT('')
    python_utils.PRINT(
        'View interactive frontend test coverage reports by navigating to')
    python_utils.PRINT('')
    python_utils.PRINT('    ../karma_coverage_reports')
    python_utils.PRINT('')
    python_utils.PRINT('  on your filesystem.')
    python_utils.PRINT('')
    python_utils.PRINT('')
    python_utils.PRINT('Running test in development environment')
    python_utils.PRINT('')

    build.build([])

    start_tests_cmd = (
        '%s node_modules/karma/bin/karma start core/tests/karma.conf.ts'
        % xvfb_prefix)
    subprocess.call(start_tests_cmd.split())

    if parsed_args.run_minified_tests is True:
        python_utils.PRINT('')
        python_utils.PRINT('Running test in production environment')
        python_utils.PRINT('')

        build.build(['--prod_env', '--minify_third_party_libs_only'])

        start_tests_cmd = (
            '%s node_modules/karma/bin/karma start '
            'core/tests/karma.conf.ts --prodEnv' % xvfb_prefix)
        subprocess.call(start_tests_cmd.split())

    python_utils.PRINT('Done!')


if __name__ == '__main__':
    main(sys.argv)
