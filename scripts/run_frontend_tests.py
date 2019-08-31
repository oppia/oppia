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


def main(argv=None):
    """Runs the frontend tests."""
    setup.main()
    setup_gae.main()

    parsed_args, _ = _PARSER.parse_known_args(args=argv)
    install_third_party_libs.maybe_install_dependencies(
        parsed_args.skip_install, parsed_args.run_minified_tests)
    common.print_each_string_after_two_new_lines([
        'View interactive frontend test coverage reports by navigating to',
        '../karma_coverage_reports',
        'on your filesystem.',
        'Running test in development environment'])

    build.main()

    subprocess.call([
        os.path.join(common.NODE_MODULES_PATH, 'karma', 'bin', 'karma'),
        'start', os.path.join('core', 'tests', 'karma.conf.ts')])

    if parsed_args.run_minified_tests is True:
        python_utils.PRINT('Running test in production environment')

        build.main(argv=['--prod_env', '--minify_third_party_libs_only'])

        subprocess.call([
            os.path.join(common.NODE_MODULES_PATH, 'karma', 'bin', 'karma'),
            'start', os.path.join('core', 'tests', 'karma.conf.ts'),
            '--prodEnv'])

    python_utils.PRINT('Done!')


if __name__ == '__main__':
    main(argv=sys.argv)
