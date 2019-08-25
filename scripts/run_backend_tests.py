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
  python -m scripts.run_backend_tests

It runs all the (Python) backend tests, in parallel.

=====================
CUSTOMIZATION OPTIONS
=====================

(1) Generate a coverage report by adding the argument

  --generate_coverage_report

but note that this will slow down the tests by a factor of 1.5 or more.

(2) Append a test target to make the script run all tests in a given module
or class, or run a particular test. For example, appending

  --test_target='foo.bar.Baz'

runs all tests in test class Baz in the foo/bar.py module, and appending

  --test_target='foo.bar.Baz.quux'

runs the test method quux in the test class Baz in the foo/bar.py module.

(3) Append a test path to make the script run all tests in a given
subdirectory. For example, appending

  --test_path='core/controllers'

runs all tests in the core/controllers/ directory.

(4) Enable the verbose log by add the argument. It will display the outputs of
  the tests being run.

  --verbose or -v

IMPORTANT: Only one of --test_path and --test_target should be specified.
"""
from __future__ import absolute_import  # pylint: disable=import-only-modules

import argparse
import os
import subprocess
import sys

import python_utils

from . import backend_tests
from . import build
from . import common
from . import install_third_party_libs
from . import setup
from . import setup_gae

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--generate_coverage_report',
    help='optional; if specified, generates a coverage report',
    action='store_true')


def main(argv):
    """Runs the backend tests."""
    setup.main()
    setup_gae.main()

    # Install third party dependencies.
    subprocess.call('bash scripts/install_third_party.sh'.split())

    coverage_home = os.path.join(common.OPPIA_TOOLS_DIR, 'coverage-4.5.4')
    coverage_path = os.path.join(coverage_home, 'coverage')

    parsed_args, _ = _PARSER.parse_known_args(args=argv)
    if parsed_args.generate_coverage_report:
        python_utils.PRINT(
            'Checking whether coverage is installed in %s'
            % common.OPPIA_TOOLS_DIR)
        if not os.path.exists(
                os.path.join(common.OPPIA_TOOLS_DIR, 'coverage-4.5.4')):
            python_utils.PRINT('Installing coverage')
            install_third_party_libs.pip_install(
                'coverage', '4.5.4',
                os.path.join(common.OPPIA_TOOLS_DIR, 'coverage-4.5.4'))

    # Compile typescript files.
    python_utils.PRINT('Compiling typescript...')
    subprocess.call('node_modules/typescript/bin/tsc --project .'.split())

    python_utils.PRINT('Compiling webpack...')
    subprocess.call(
        'node_modules/webpack/bin/webpack.js --config webpack.prod.config.ts'
        .split())

    build.build()
    backend_tests.main()

    if parsed_args.generate_coverage_report:
        subprocess.call(('python %s combine' % coverage_path).split())
        subprocess.call(
            ('python %s report --omit="%s*","third_party/*","/usr/share/*" '
             '--show-missing'
             % (coverage_path, common.OPPIA_TOOLS_DIR)).split())

        python_utils.PRINT('Generating xml coverage report...')
        subprocess.call(('python %s xml' % coverage_path).split())

    python_utils.PRINT('')
    python_utils.PRINT('Done!')


if __name__ == '__main__':
    main(sys.argv)
