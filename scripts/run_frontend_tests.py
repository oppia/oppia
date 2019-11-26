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
from . import common
from . import install_third_party_libs
from . import setup
from . import setup_gae

_PARSER = argparse.ArgumentParser(description="""
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


def main(args=None):
    """Runs the frontend tests."""
    parsed_args = _PARSER.parse_args(args=args)

    setup.main(args=[])
    setup_gae.main(args=[])

    if not parsed_args.skip_install:
        install_third_party_libs.main()

    common.print_each_string_after_two_new_lines([
        'View interactive frontend test coverage reports by navigating to',
        '../karma_coverage_reports',
        'on your filesystem.',
        'Running test in development environment'])

    build.main(args=[])

    cmd = [
        os.path.join(common.NODE_MODULES_PATH, 'karma', 'bin', 'karma'),
        'start', os.path.join('core', 'tests', 'karma.conf.ts')]

    task = subprocess.Popen(cmd)
    task.communicate()
    task.wait()

    if parsed_args.run_minified_tests is True:
        python_utils.PRINT('Running test in production environment')

        build.main(args=['--prod_env', '--minify_third_party_libs_only'])

        subprocess.check_call([
            os.path.join(common.NODE_MODULES_PATH, 'karma', 'bin', 'karma'),
            'start', os.path.join('core', 'tests', 'karma.conf.ts'),
            '--prodEnv'])

    python_utils.PRINT('Done!')
    sys.exit(task.returncode)


if __name__ == '__main__':
    main()
