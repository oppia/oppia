# Copyright 2019 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Runs the performance tests."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import atexit
import os
import signal
import subprocess
import time

import python_utils

from . import clean
from . import common
from . import install_third_party_libs
from . import setup
from . import setup_gae

_PARSER = argparse.ArgumentParser(description="""
The root folder MUST be named 'oppia'.
Run all tests sequentially:
    python -m scripts.run_performance_tests without args in order to run all
    tests sequentially.
Run test for a specific page:
    python -m scripts.run_performance_tests --test_name=page_test
page_test is the name of the file containing that test eg. splash_test.
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
    '--test_name',
    help='If an argument is present then run test for that specific page. '
    'Otherwise run tests for all the pages sequentially.')

PORT_NUMBER_FOR_GAE_SERVER = 9501
USUAL_PORT_NUMBER_FOR_GAE_SERVER_IN_START = 8181


def cleanup(pid):
    """Send a kill signal to the dev server."""
    os.kill(pid, signal.SIGTERM)

    # Wait for the servers to go down; suppress 'connection refused' error
    # output from nc since that is exactly what we are expecting to happen.
    while common.is_port_open(PORT_NUMBER_FOR_GAE_SERVER):
        time.sleep(1)

    python_utils.PRINT('Done!')


def run_performance_test(test_name, xvfb_prefix):
    """Runs the performance tests.

    Args:
        test_name: str. The test name to be run.
        xvfb_prefix: str. The XVFB prefix.
    """
    if xvfb_prefix:
        subprocess.check_call([
            xvfb_prefix, 'python', '-m', 'scripts.run_backend_tests',
            '--test_target=core.tests.performance_tests.%s' % test_name])
    else:
        subprocess.check_call([
            'python', '-m', 'scripts.run_backend_tests',
            '--test_target=core.tests.performance_tests.%s' % test_name])


def main(args=None):
    """Main function to run the performance tests."""
    parsed_args = _PARSER.parse_args(args=args)

    setup.main(args=[])
    setup_gae.main(args=[])

    if not parsed_args.skip_install:
        install_third_party_libs.main()

    if common.is_port_open(USUAL_PORT_NUMBER_FOR_GAE_SERVER_IN_START):
        common.print_each_string_after_two_new_lines([
            'There is already a server running on localhost:%s'
            % python_utils.UNICODE(USUAL_PORT_NUMBER_FOR_GAE_SERVER_IN_START),
            'Please terminate it before running the performance tests.',
            'Exiting.'])
        raise Exception

    browsermob_proxy_path = os.path.join(
        common.OPPIA_TOOLS_DIR, 'browsermob-proxy-2.1.1', 'bin',
        'browsermob-proxy')

    # Change execute status of browsermob-proxy.
    common.recursive_chmod(browsermob_proxy_path, 0o744)

    # Start a demo server.
    background_process = subprocess.Popen(
        'python %s/dev_appserver.py --host=0.0.0.0 --port=%s '
        '--clear_datastore=yes --dev_appserver_log_level=critical '
        '--log_level=critical --skip_sdk_update_check=true app_dev.yaml' % (
            common.GOOGLE_APP_ENGINE_HOME,
            python_utils.UNICODE(PORT_NUMBER_FOR_GAE_SERVER)), shell=True)

    # Forces the cleanup function to run on exit.
    # Developers: note that at the end of this script, the cleanup() function at
    # the top of the file is run.
    atexit.register(cleanup, background_process.pid)

    # Wait for the servers to come up.
    while not common.is_port_open(PORT_NUMBER_FOR_GAE_SERVER):
        time.sleep(1)

    # Install xvfb if not on travis, Used in frontend, e2e tests and performance
    # tests.
    if os.environ.get('TRAVIS'):
        xvfb_prefix = ''
    else:
        # This installs xvfb for systems with apt-get installer like Ubuntu, and
        # will fail for other systems.
        # TODO(gvishal): Install/provide xvfb for other systems.
        subprocess.check_call(['sudo', 'apt-get', 'install', 'xvfb'])
        xvfb_prefix = '/usr/bin/xvfb-run'

    # If an argument is present then run test for that specific page. Otherwise
    # run tests for all the pages sequentially.
    if parsed_args.test_name:
        python_utils.PRINT(
            'Running performance test for: %s' % parsed_args.test_name)
        run_performance_test(parsed_args.test_name, xvfb_prefix)
    else:
        run_performance_test('collection_player_test', xvfb_prefix)
        run_performance_test('creator_dashboard_test', xvfb_prefix)
        run_performance_test('exploration_editor_test', xvfb_prefix)
        run_performance_test('exploration_player_test', xvfb_prefix)
        run_performance_test('library_test', xvfb_prefix)
        run_performance_test('profile_page_test', xvfb_prefix)
        run_performance_test('splash_test', xvfb_prefix)

    common.recursive_chmod(browsermob_proxy_path, 0o644)
    clean.delete_file('bmp.log')
    clean.delete_file('server.log')

    background_process.wait()


if __name__ == '__main__':
    main()
