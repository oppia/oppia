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

import argparse
import os
import subprocess

from . import build
from . import setup

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
XVFB_PREFIX = os.environ['XVFB_PREFIX']


def main():
    """Runs the frontend tests."""
    parsed_args = _PARSER.parse_args()
    setup.maybe_install_dependencies(
        parsed_args.skip_install, parsed_args.run_minified_tests)
    print ''
    print '  View interactive frontend test coverage reports by navigating to'
    print ''
    print '    ../karma_coverage_reports'
    print ''
    print '  on your filesystem.'
    print ''
    print ''
    print '  Running test in development environment'
    print ''

    build.build()

    start_tests_cmd = (
        '%s node_modules/karma/bin/karma start core/tests/karma.conf.ts'
        % XVFB_PREFIX)
    subprocess.call(start_tests_cmd)

    if parsed_args.run_minified_tests is True:
        print ''
        print '  Running test in production environment'
        print ''

        os.system('scripts/build.py prod_env minify_third_party_libs_only')

        start_tests_cmd = (
            '%s node_modules/karma/bin/karma start '
            'core/tests/karma.conf.ts --prodEnv' % XVFB_PREFIX)
        subprocess.call(start_tests_cmd)

    print 'Done!'


if __name__ == '__main__':
    main()
