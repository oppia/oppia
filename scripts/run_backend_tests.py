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

"""This script runs all the (Python) backend tests, in parallel."""
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


def main(argv=None):
    """Runs the backend tests."""
    setup.main()
    setup_gae.main()

    # Install third party dependencies.
    install_third_party_libs.main()

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

    build.main()

    # Compile typescript files.
    python_utils.PRINT('Compiling typescript...')
    subprocess.call([
        os.path.join(common.NODE_MODULES_PATH, 'typescript', 'bin', 'tsc'),
        '--project', '.'])

    python_utils.PRINT('Compiling webpack...')
    subprocess.call([
        os.path.join(common.NODE_MODULES_PATH, 'webpack', 'bin', 'webpack.js'),
        '--config', 'webpack.dev.config.ts'])

    backend_tests.main(argv=argv)

    if parsed_args.generate_coverage_report:
        subprocess.call(['python', coverage_path, 'combine'])
        subprocess.call([
            'python', coverage_path, 'report',
            '--omit="%s*","third_party/*","/usr/share/*"'
            % common.OPPIA_TOOLS_DIR, '--show-missing'])

        python_utils.PRINT('Generating xml coverage report...')
        subprocess.call(['python', coverage_path, 'xml'])

    python_utils.PRINT('')
    python_utils.PRINT('Done!')


if __name__ == '__main__':
    main(argv=sys.argv)
