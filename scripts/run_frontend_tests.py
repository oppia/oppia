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

##########################################################################

# INSTRUCTIONS:
#
# Run this script from the oppia root folder:
#   bash scripts/run_frontend_tests.sh
#
# Optional arguments:
#   --skip-install=true/false If true, skips installing dependencies. The
#         default value is false.
#   --run-minified-tests=true/false Whether to run frontend karma tests on both
#         minified and non-minified code. The default value is false.
#
# The root folder MUST be named 'oppia'.
# It runs unit tests for frontend JavaScript code (using Karma).
#
# Note: You can replace 'it' with 'fit' or 'describe' with 'fdescribe' to run a
# single test or test suite.

import argparse
import os
import subprocess

from . import build

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--generate_coverage_report',
    help='optional; if specified, generates a coverage report',
    action='store_true')
os.environ['DEFAULT_SKIP_INSTALLING_THIRD_PARTY_LIBS'] = 'false'
os.environ['DEFAULT_RUN_MINIFIED_TESTS'] = 'false'
maybeInstallDependencies "$@"
XVFB_PREFIX='/usr/bin/xvfb-run'


def main():
    """Runs the frontend tests."""
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

    if os.environ['RUN_MINIFIED_TESTS'] == "true":
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
