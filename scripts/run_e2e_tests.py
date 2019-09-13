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
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import atexit
import fileinput
import os
import re
import shutil
import signal
import subprocess
import time

import python_utils

from . import build
from . import common
from . import install_chrome_on_travis
from . import install_third_party_libs
from . import setup
from . import setup_gae

_PARSER = argparse.ArgumentParser(description="""
    Run this script from the oppia root folder:

        python -m scripts.run_e2e_tests

    The root folder MUST be named 'oppia'.

    Note: You can replace 'it' with 'fit' or 'describe' with 'fdescribe' to run
    a single test or test suite.""")

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

PORT_NUMBER_FOR_SELENIUM_SERVER = 4444
PORT_NUMBER_FOR_GAE_SERVER = 9001
USUAL_PORT_NUMBER_FOR_GAE_SERVER_IN_START = 8181


def cleanup():
    """Send a kill signal to the dev server and Selenium server."""
    if common.is_port_open(PORT_NUMBER_FOR_GAE_SERVER):
        pid_of_gae_server = subprocess.check_output([
            'lsof', '-ti', ':%s' % PORT_NUMBER_FOR_GAE_SERVER]).rstrip()
        os.kill(int(pid_of_gae_server), signal.SIGKILL)

    if common.is_port_open(PORT_NUMBER_FOR_SELENIUM_SERVER):
        pid_of_selenium_server = subprocess.check_output([
            'lsof', '-ti', ':%s' % PORT_NUMBER_FOR_SELENIUM_SERVER]).rstrip()
        os.kill(int(pid_of_selenium_server), signal.SIGKILL)

    # Wait for the servers to go down; suppress 'connection refused' error
    # output from nc since that is exactly what we are expecting to happen.
    while common.is_port_open(
            PORT_NUMBER_FOR_SELENIUM_SERVER) or common.is_port_open(
                PORT_NUMBER_FOR_GAE_SERVER):
        pass

    if os.path.isdir(os.path.join('..', 'protractor-screenshots')):
        common.print_each_string_after_two_new_lines([
            'Note: If ADD_SCREENSHOT_REPORTER is set to true in',
            'core/tests/protractor.conf.js, you can view screenshots',
            'of the failed tests in ../protractor-screenshots/'])

    python_utils.PRINT('Done!')


def main(args=None):
    """Runs the end to end tests."""
    parsed_args = _PARSER.parse_args(args=args)

    setup.main(args=[])
    setup_gae.main(args=[])
    if os.environ.get('TRAVIS'):
        install_chrome_on_travis.main()

    install_third_party_libs.maybe_install_dependencies(
        parsed_args.skip_install, parsed_args.run_minified_tests)

    if common.is_port_open(USUAL_PORT_NUMBER_FOR_GAE_SERVER_IN_START):
        common.print_each_string_after_two_new_lines([
            'There is already a server running on localhost:%s.'
            % python_utils.UNICODE(USUAL_PORT_NUMBER_FOR_GAE_SERVER_IN_START),
            'Please terminate it before running the end-to-end tests.',
            'Exiting.'])
        raise Exception

    if common.is_port_open(PORT_NUMBER_FOR_GAE_SERVER):
        common.print_each_string_after_two_new_lines([
            'There is already a server running on localhost:%s.'
            % python_utils.UNICODE(PORT_NUMBER_FOR_GAE_SERVER),
            'Please terminate it before running the end-to-end tests.',
            'Exiting.'])
        raise Exception

    if parsed_args.prod_env:
        dev_mode = 'false'
        python_utils.PRINT('Generating files for production mode...')
        constants_env_variable = '\'DEV_MODE\': false'
        for line in fileinput.input(
                files=[os.path.join('assets', 'constants.ts')], inplace=True):
            # Inside this loop the STDOUT will be redirected to the file,
            # constants.ts. The end='' is needed to avoid double line breaks.
            python_utils.PRINT(
                re.sub(r'\'DEV_MODE\': .*', constants_env_variable, line),
                end='')
        build.main(args=['--prod_env'])
        app_yaml_filepath = 'app.yaml'
    else:
        dev_mode = 'true'
        constants_env_variable = '\'DEV_MODE\': true'
        for line in fileinput.input(
                files=[os.path.join('assets', 'constants.ts')], inplace=True):
            # Inside this loop the STDOUT will be redirected to the file,
            # constants.ts. The end='' is needed to avoid double line breaks.
            python_utils.PRINT(
                re.sub(r'\'DEV_MODE\': .*', constants_env_variable, line),
                end='')
        build.main(args=[])
        app_yaml_filepath = 'app_dev.yaml'

    # Start a selenium server using chromedriver 2.41.
    # The 'detach' option continues the flow once the server is up and runnning.
    # The 'quiet' option prints only the necessary information about the server
    # start-up process.
    subprocess.call([
        os.path.join(common.NODE_MODULES_PATH, '.bin', 'webdriver-manager'),
        'update', '--versions.chrome', '2.41'])
    subprocess.call([
        os.path.join(common.NODE_MODULES_PATH, '.bin', 'webdriver-manager'),
        'start', '--versions.chrome', '2.41', '--detach', '--quiet'])

    # Start a selenium process. The program sends thousands of lines of useless
    # info logs to stderr so we discard them.
    # TODO(jacob): Find a webdriver or selenium argument that controls log
    # level.
    subprocess.Popen([
        os.path.join(common.NODE_MODULES_PATH, '.bin', 'webdriver-manager'),
        'start', '2>/dev/null'])
    # Start a demo server.
    subprocess.Popen(
        'python %s/dev_appserver.py --host=0.0.0.0 --port=%s '
        '--clear_datastore=yes --dev_appserver_log_level=critical '
        '--log_level=critical --skip_sdk_update_check=true %s' % (
            common.GOOGLE_APP_ENGINE_HOME,
            python_utils.UNICODE(PORT_NUMBER_FOR_GAE_SERVER),
            app_yaml_filepath), shell=True)
    time.sleep(10)

    # Forces the cleanup function to run on exit.
    # Developers: note that at the end of this script, the cleanup() function at
    # the top of the file is run.
    atexit.register(cleanup)

    # Wait for the servers to come up.
    while not common.is_port_open(
            PORT_NUMBER_FOR_SELENIUM_SERVER) or not common.is_port_open(
                PORT_NUMBER_FOR_GAE_SERVER):
        pass

    # Delete outdated screenshots.
    if os.path.isdir(os.path.join('..', 'protractor-screenshots')):
        shutil.rmtree(os.path.join('..', 'protractor-screenshots'))

    # Run the end-to-end tests. The conditional is used to run protractor
    # without any sharding parameters if it is disabled. This helps with
    # isolated tests. Isolated tests do not work properly unless no sharding
    # parameters are passed in at all.
    # TODO(bhenning): Figure out if this is a bug with protractor.
    if not parsed_args.browserstack:
        if not parsed_args.sharding or parsed_args.sharding_instances == '1':
            subprocess.call([
                os.path.join(
                    common.NODE_MODULES_PATH, 'protractor', 'bin',
                    'protractor'),
                os.path.join('core', 'tests', 'protractor-ci.conf.js'), '--suite',
                parsed_args.suite, '--params.devMode="%s"' % dev_mode])
        else:
            subprocess.call([
                os.path.join(
                    common.NODE_MODULES_PATH, 'protractor', 'bin',
                    'protractor'),
                os.path.join('core', 'tests', 'protractor-ci.conf.js'),
                '--capabilities.shardTestFiles=%s' % parsed_args.sharding,
                '--capabilities.maxInstances=%s'
                % parsed_args.sharding_instances, '--suite', parsed_args.suite,
                '--params.devMode="%s"' % dev_mode])
    else:
        python_utils.PRINT('Running the tests on browserstack...')
        if not parsed_args.sharding or parsed_args.sharding_instances == '1':
            subprocess.call([
                os.path.join(
                    common.NODE_MODULES_PATH, 'protractor', 'bin',
                    'protractor'),
                os.path.join(
                    'core', 'tests', 'protractor-browserstack.conf.js'),
                '--suite', parsed_args.suite,
                '--params.devMode="%s"' % dev_mode])
        else:
            subprocess.call([
                os.path.join(
                    common.NODE_MODULES_PATH, 'protractor', 'bin',
                    'protractor'),
                os.path.join(
                    'core', 'tests', 'protractor-browserstack.conf.js'),
                '--capabilities.shardTestFiles=%s' % parsed_args.sharding,
                '--capabilities.maxInstances=%s'
                % parsed_args.sharding_instances, '--suite', parsed_args.suite,
                '--params.devMode="%s"' % dev_mode])


if __name__ == '__main__':
    main()
