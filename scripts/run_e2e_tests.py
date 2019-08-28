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

"""Runs the end to end tests."""
from __future__ import absolute_import  # pylint: disable=import-only-modules

import argparse
import atexit
import fileinput
import os
import re
import shutil
import subprocess
import sys
import time

import python_utils

from . import build
from . import common
from . import install_chrome_on_travis
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
_PARSER.add_argument(
    '--prod_env',
    help='optional; if specified, emulate running Oppia in a production '
    'environment.',
    action='store_true')
_PARSER.add_argument(
    '--browserstack',
    help='optional; if specified, run the e2e tests on browserstack.',
    action='store_true')
_PARSER.add_argument(
    '--suite',
    help='Performs test for different suites. Performs a full test by default.',
    default='full')
_PARSER.add_argument(
    '--sharding',
    help='optional; if specified, Disables parallelization of protractor tests',
    action='store_true')
_PARSER.add_argument(
    '--sharding_instances',
    help='Sets the number of parallel browsers to open while sharding',
    default='3')


def cleanup():
    """Send a kill signal to the dev server and Selenium server."""
    common.kill_process(4444)
    common.kill_process(9001)

    # Wait for the servers to go down; suppress 'connection refused' error
    # output from nc since that is exactly what we are expecting to happen.
    while not common.is_port_close(4444) or not common.is_port_close(9001):
        time.sleep(1)

    if os.path.isdir('../protractor-screenshots'):
        common.print_string_after_two_new_lines([
            'Note: If ADD_SCREENSHOT_REPORTER is set to true in',
            'core/tests/protractor.conf.js, you can view screenshots',
            'of the failed tests in ../protractor-screenshots/'])

    python_utils.PRINT('Done!')


def main(argv=None):
    """Runs the end to end tests."""
    setup.main()
    setup_gae.main()
    if os.environ.get('TRAVIS'):
        install_chrome_on_travis.main()

    parsed_args, _ = _PARSER.parse_known_args(args=argv)
    install_third_party_libs.maybe_install_dependencies(
        parsed_args.skip_install, parsed_args.run_minified_tests)

    if not common.is_port_close(8181):
        common.print_string_after_two_new_lines([
            'There is already a server running on localhost:8181.',
            'Please terminate it before running the end-to-end tests.',
            'Exiting.'])
        sys.exit(1)

    # Forces the cleanup function to run on exit.
    # Developers: note that at the end of this script, the cleanup() function at
    # the top of the file is run.
    atexit.register(cleanup)

    if parsed_args.prod_env:
        dev_mode = 'false'
        python_utils.PRINT('Generating files for production mode...')
        constants_env_variable = '\'DEV_MODE\': false'
        for line in fileinput.input(
                files=['assets/constants.ts'], inplace=True):
            # Inside this loop the STDOUT will be redirected to the file.
            # The end='' is needed to avoid double line breaks.
            python_utils.PRINT(
                re.sub(r'\'DEV_MODE\': .*', constants_env_variable, line),
                end='')
        build.main(argv=['--prod_env'])
        app_yaml_filepath = 'app.yaml'
    else:
        dev_mode = 'true'
        constants_env_variable = '\'DEV_MODE\': true'
        for line in fileinput.input(
                files=['assets/constants.ts'], inplace=True):
            # Inside this loop the STDOUT will be redirected to the file.
            # The end='' is needed to avoid double line breaks.
            python_utils.PRINT(
                re.sub(r'\'DEV_MODE\': .*', constants_env_variable, line),
                end='')
        build.main()
        app_yaml_filepath = 'app_dev.yaml'

    # Start a selenium server using chromedriver 2.41.
    # The 'detach' option continues the flow once the server is up and runnning.
    # The 'quiet' option prints only the necessary information about the server
    # start-up process.
    subprocess.call([
        'node_modules/.bin/webdriver-manager', 'update',
        '--versions.chrome', '2.41'])
    subprocess.call([
        'node_modules/.bin/webdriver-manager', 'start',
        '--versions.chrome', '2.41', '--detach', '--quiet'])

    # Start a selenium process. The program sends thousands of lines of useless
    # info logs to stderr so we discard them.
    # TODO(jacob): Find a webdriver or selenium argument that controls log
    # level.
    background_processes = []
    background_processes.append(subprocess.Popen([
        'node_modules/.bin/webdriver-manager', 'start', '2>/dev/null']))
    # Start a demo server.
    background_processes.append(subprocess.Popen(
        'python %s/dev_appserver.py --host=0.0.0.0 --port=9001 '
        '--clear_datastore=yes --dev_appserver_log_level=critical '
        '--log_level=critical --skip_sdk_update_check=true %s' % (
            common.GOOGLE_APP_ENGINE_HOME, app_yaml_filepath), shell=True))

    # Wait for the servers to come up.
    while common.is_port_close(4444) or common.is_port_close(9001):
        time.sleep(1)

    # Delete outdated screenshots.
    if os.path.isdir('../protractor-screenshots'):
        shutil.rmtree('../protractor-screenshots')

    # Run the end-to-end tests. The conditional is used to run protractor
    # without any sharding parameters if it is disabled. This helps with
    # isolated tests. Isolated tests do not work properly unless no sharding
    # parameters are passed in at all.
    # TODO(bhenning): Figure out if this is a bug with protractor.
    if not parsed_args.browserstack:
        if not parsed_args.sharding or parsed_args.sharding_instances == '1':
            subprocess.call([
                'node_modules/protractor/bin/protractor',
                'core/tests/protractor.conf.js', '--suite', parsed_args.suite,
                '--params.devMode="%s"' % dev_mode])
        else:
            subprocess.call([
                'node_modules/protractor/bin/protractor',
                'core/tests/protractor.conf.js',
                '--capabilities.shardTestFiles=%s' % parsed_args.sharding,
                '--capabilities.maxInstances=%s'
                % parsed_args.sharding_instances, '--suite', parsed_args.suite,
                '--params.devMode="%s"' % dev_mode])
    else:
        python_utils.PRINT('Running the tests on browserstack...')
        if not parsed_args.sharding or parsed_args.sharding_instances == '1':
            subprocess.call([
                'node_modules/protractor/bin/protractor',
                'core/tests/protractor-browserstack.conf.js', '--suite',
                parsed_args.suite, '--params.devMode="%s"' % dev_mode])
        else:
            subprocess.call([
                'node_modules/protractor/bin/protractor',
                'core/tests/protractor-browserstack.conf.js',
                '--capabilities.shardTestFiles=%s' % parsed_args.sharding,
                '--capabilities.maxInstances=%s'
                % parsed_args.sharding_instances, '--suite', parsed_args.suite,
                '--params.devMode="%s"' % dev_mode])

    for process in background_processes:
        process.wait()


if __name__ == '__main__':
    main(argv=sys.argv)
