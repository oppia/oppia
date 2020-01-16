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

"""Python execution for running e2e tests."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import atexit
import contextlib
import os
import re
import subprocess
import sys
import time

import python_utils
from scripts import build
from scripts import common
from scripts import install_chrome_on_travis
from scripts import install_third_party_libs
from scripts import setup
from scripts import setup_gae

CHROME_DRIVER_VERSION = '2.41'

WEB_DRIVER_PORT = 4444
GOOGLE_APP_ENGINE_PORT = 9001
OPPIA_SERVER_PORT = 8181
PROTRACTOR_BIN_PATH = os.path.join(
    common.NODE_MODULES_PATH, 'protractor', 'bin', 'protractor')

CONSTANT_FILE_PATH = os.path.join(common.CURR_DIR, 'assets', 'constants.ts')
FECONF_FILE_PATH = os.path.join('feconf.py')
MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS = 1000
WEBDRIVER_HOME_PATH = os.path.join(
    common.NODE_MODULES_PATH, 'webdriver-manager')
WEBDRIVER_MANAGER_BIN_PATH = os.path.join(
    WEBDRIVER_HOME_PATH, 'bin', 'webdriver-manager')

WEBDRIVER_PROVIDER_PATH = os.path.join(
    WEBDRIVER_HOME_PATH, 'dist', 'lib', 'provider')

GECKO_PROVIDER_FILE_PATH = os.path.join(
    WEBDRIVER_PROVIDER_PATH, 'geckodriver.js')

CHROME_PROVIDER_FILE_PATH = os.path.join(
    WEBDRIVER_PROVIDER_PATH, 'chromedriver.js')

CHROME_PROVIDER_BAK_FILE_PATH = os.path.join(
    WEBDRIVER_PROVIDER_PATH, 'chromedriver.js.bak')

GECKO_PROVIDER_BAK_FILE_PATH = os.path.join(
    WEBDRIVER_PROVIDER_PATH, 'geckodriver.js.bak')

WEBPACK_BIN_PATH = os.path.join(
    common.CURR_DIR, 'node_modules', 'webpack', 'bin', 'webpack.js')
PATTERN_FOR_REPLACE_WEBDRIVER_CODE = r'this\.osArch = os\.arch\(\);'
PROTRACTOR_CONFIG_FILE_PATH = os.path.join(
    'core', 'tests', 'protractor.conf.js')
BROWSER_STACK_CONFIG_FILE_PATH = os.path.join(
    'core', 'tests', 'protractor-browserstack.conf.js')
HASHES_FILE_PATH = os.path.join('assets', 'hashes.json')

_PARSER = argparse.ArgumentParser(description="""
Run this script from the oppia root folder:
   bash scripts/run_e2e_tests.sh

The root folder MUST be named 'oppia'.


  --suite=suite_name Performs test for different suites, here suites are the
        name of the test files present in core/tests/protractor_desktop/ and
        core/test/protractor/ dirs. e.g. for the file
        core/tests/protractor/accessibility.js use --suite=accessibility.
        For performing a full test, no argument is required.
Note: You can replace 'it' with 'fit' or 'describe' with 'fdescribe' to run a
single test or test suite.
""")


_PARSER.add_argument(
    '--skip-install',
    help='If true, skips installing dependencies. The default value is false.',
    action='store_true')
_PARSER.add_argument(
    '--sharding-instances', type=int, default=3,
    help='Sets the number of parallel browsers to open while sharding.'
         'Sharding must be disabled (either by passing in false to --sharding'
         ' or 1 to --sharding-instances) if running any tests in isolation'
         ' (fit or fdescribe).')
_PARSER.add_argument(
    '--prod_env',
    help='Run the tests in prod mode. Static resources are served from'
         ' build directory and use cache slugs.',
    action='store_true')
_PARSER.add_argument(
    '--community_dashboard_enabled', action='store_true',
    help='Run the test after enabling the community dashboard page.')

_PARSER.add_argument(
    '--suite', default='full',
    help='Performs test for different suites, here suites are the'
         'name of the test files present in core/tests/protractor_desktop/ and'
         'core/test/protractor/ dirs. e.g. for the file'
         'core/tests/protractor/accessibility.js use --suite=accessibility.'
         'For performing a full test, no argument is required.')

# This list contains the sub process triggered by this script. This includes
# the oppia web server.
SUBPROCESSES = []


def ensure_screenshots_dir_is_removed():
    """Check if screenshot directory exists, if so, delete it."""
    screenshots_dir = os.path.join(os.pardir, 'protractor-screenshots')
    if not os.path.isdir(screenshots_dir):
        return
    python_utils.PRINT(
        'Note: If ADD_SCREENSHOT_REPORTER is set to true in'
        'core/tests/protractor.conf.js, you can view screenshots'
        'of the failed tests in ../protractor-screenshots/')
    os.rmdir(screenshots_dir)


def cleanup():
    """Kill the running subprocesses and server fired in this program."""
    dev_appserver_path = '%s/dev_appserver.py' % common.GOOGLE_APP_ENGINE_HOME
    webdriver_download_path = '%s/downloads' % WEBDRIVER_HOME_PATH
    if common.is_windows_os():
        # In windows system, the java command line will use absolute path.
        webdriver_download_path = os.path.abspath(webdriver_download_path)
    processes_to_kill = [
        '.*%s.*' % re.escape(dev_appserver_path),
        '.*%s.*' % re.escape(webdriver_download_path)
    ]
    for p in SUBPROCESSES:
        p.kill()

    for p in processes_to_kill:
        common.kill_processes_based_on_regex(p)


def is_oppia_server_already_running():
    """Check if the ports are taken by any other processes. If any one of
    them is taken, it may indicate there is already one Oppia instance running.

    Return:
        bool: Whether there is a running Oppia instance.
    """
    running = False
    for port in [OPPIA_SERVER_PORT, GOOGLE_APP_ENGINE_PORT]:
        if common.is_port_open(port):
            python_utils.PRINT(
                'There is already a server running on localhost:%s.'
                'Please terminate it before running the end-to-end tests.'
                'Exiting.' % port)
            running = True
            break
    return running


def wait_for_port_to_be_open(port_number):
    """Wait until the port is open.

    Args:
        port_number: int. The port number to wait.
    """
    waited_seconds = 0
    while (not common.is_port_open(port_number) and
           waited_seconds < MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS):
        time.sleep(1)
        waited_seconds += 1
    if (waited_seconds ==
            MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS and
            not common.is_port_open(port_number)):
        python_utils.PRINT(
            'Failed to start server on port %s, exiting ...' % port_number)
        sys.exit(1)


def update_dev_mode_in_constants_js(constant_file, dev_mode_setting):
    """Change constant file based on the running mode. Only the `DEV_MODE` line
    should be changed.

    Args:
        constant_file: str. File path to the constant file.
        dev_mode_setting: bool. Represents whether the program is running on dev
            mode.
    """
    pattern = '"DEV_MODE": .*'
    replace = '"DEV_MODE": %s' % (
        'true' if dev_mode_setting else 'false')
    common.inplace_replace_file(constant_file, pattern, replace)


def update_community_dashboard_status_in_feconf_file(
        feconf_file_path, enable_community_dashboard):
    """Change feconf.py file based on whether the community dashboard is
    enabled.

    Args:
        feconf_file_path: str. Path to the feconf.py file.
        enable_community_dashboard: bool. Represents whether community
            dashboard is enabled.
    """
    pattern = 'COMMUNITY_DASHBOARD_ENABLED = .*'
    replace = 'COMMUNITY_DASHBOARD_ENABLED = %s' % enable_community_dashboard
    common.inplace_replace_file(feconf_file_path, pattern, replace)


def run_webdriver_manager(parameters):
    """Run commands of webdriver manager.

    Args:
        parameters: list(str). A list of parameters to pass to webdriver
            manager.
    """
    web_driver_command = [common.NODE_BIN_PATH, WEBDRIVER_MANAGER_BIN_PATH]
    web_driver_command.extend(parameters)
    python_utils.PRINT(common.run_cmd(web_driver_command))


def setup_and_install_dependencies(skip_install):
    """Run the setup and installation scripts."""
    if not skip_install:
        install_third_party_libs.main()
    setup.main(args=[])
    setup_gae.main(args=[])
    if os.getenv('TRAVIS'):
        install_chrome_on_travis.main(args=[])


def build_js_files(dev_mode_setting):
    """Build the javascript files.

    Args:
        dev_mode_setting: bool. Represents whether to run the related commands
        in dev mode.
    """
    update_dev_mode_in_constants_js(CONSTANT_FILE_PATH, dev_mode_setting)
    if not dev_mode_setting:
        python_utils.PRINT('  Generating files for production mode...')
    else:
        # The 'hashes.json' file is used by the `url-interpolation` service.
        if not os.path.isfile(HASHES_FILE_PATH):
            with python_utils.open_file(HASHES_FILE_PATH, 'w') as hash_file:
                hash_file.write('{}')
        try:
            common.run_cmd(
                [common.NODE_BIN_PATH, WEBPACK_BIN_PATH, '--config',
                 'webpack.dev.config.ts'])
        except subprocess.CalledProcessError as error:
            python_utils.PRINT(error.output)
            sys.exit(error.returncode)
    build.main(args=(['--prod_env'] if not dev_mode_setting else []))


@contextlib.contextmanager
def tweak_webdriver_manager():
    """webdriver-manager (version 13.0.0) uses `os.arch()` to determine the
    architecture of the operating system, however, this function can only be
    used to determine the architecture of the machine that compiled `node`.
    In the case of Windows, we are using the portable version,
    which was compiled on `ia32` machine so that is the value returned by this
    `os.arch` function. Unfortunately, webdriver-manager seems to assume that
    Windows wouldn't run on the ia32 architecture, so its help function used to
    determine download link returns null for this, which means that the
    application has no idea about where to download the correct version.

    https://github.com/angular/webdriver-manager/blob/b7539a5a3897a8a76abae7245f0de8175718b142/lib/provider/chromedriver.ts#L16
    https://github.com/angular/webdriver-manager/blob/b7539a5a3897a8a76abae7245f0de8175718b142/lib/provider/geckodriver.ts#L21
    https://github.com/angular/webdriver-manager/blob/b7539a5a3897a8a76abae7245f0de8175718b142/lib/provider/chromedriver.ts#L167
    https://github.com/nodejs/node/issues/17036
    """
    try:
        if common.is_windows_os():
            regex_pattern = PATTERN_FOR_REPLACE_WEBDRIVER_CODE
            arch = 'x64' if common.is_x64_architecture() else 'x86'
            replace = 'this.osArch = "%s";' % arch
            common.inplace_replace_file(
                CHROME_PROVIDER_FILE_PATH, regex_pattern, replace)
            common.inplace_replace_file(
                GECKO_PROVIDER_FILE_PATH, regex_pattern, replace)
        yield
    finally:
        if common.is_windows_os():
            undo_webdriver_tweak()


def undo_webdriver_tweak():
    """Undo the tweak on webdriver manager's source code."""
    if os.path.isfile(CHROME_PROVIDER_BAK_FILE_PATH):
        os.remove(CHROME_PROVIDER_FILE_PATH)
        os.rename(CHROME_PROVIDER_BAK_FILE_PATH, CHROME_PROVIDER_FILE_PATH)
    if os.path.isfile(GECKO_PROVIDER_BAK_FILE_PATH):
        os.remove(GECKO_PROVIDER_FILE_PATH)
        os.rename(GECKO_PROVIDER_BAK_FILE_PATH, GECKO_PROVIDER_FILE_PATH)


def start_webdriver_manager():
    """Update and start webdriver manager."""
    with tweak_webdriver_manager():
        run_webdriver_manager(
            ['update', '--versions.chrome', CHROME_DRIVER_VERSION])
        run_webdriver_manager(
            ['start', '--versions.chrome', CHROME_DRIVER_VERSION,
             '--detach', '--quiet'])


def get_parameter_for_sharding(sharding_instances):
    """Return the parameter for sharding, based on the given number of
    sharding instances.

    Args:
        sharding_instances: int. How many sharding instances to be running.

    Returns:
        list(str): A list of parameters to represent the sharding configuration.
    """
    if sharding_instances <= 0:
        raise ValueError('Sharding instance should be larger than 0')
    if sharding_instances == 1:
        return []
    else:
        return ['--capabilities.shardTestFiles=True',
                '--capabilities.maxInstances=%s' % sharding_instances]


def get_parameter_for_dev_mode(dev_mode_setting):
    """Return parameter for whether the test should be running on dev_mode.

    Args:
        dev_mode_setting: bool. Whether the test is running on dev_mode.

    Returns:
        str: A string for the testing mode command line parameter.
    """
    return '--params.devMode=%s' % dev_mode_setting


def get_parameter_for_suite(suite_name):
    """Return a parameter for which suite to run the tests for.

    Args:
        suite_name: str. The suite name whose tests should be run. If the value
            is `full`, all tests will run.

    Returns:
        list(str): A list of command line parameters for the suite.
    """
    return ['--suite', suite_name]


def get_e2e_test_parameters(
        sharding_instances, suite_name, dev_mode_setting):
    """Return parameters for the end-2-end tests.

    Args:
        sharding_instances: str. Sets the number of parallel browsers to open
            while sharding.
        suite_name: str. Performs test for different suites.
        dev_mode_setting: bool. Represents whether run the related commands in
            dev mode.
    Returns:
        list(str): Parameters for running the tests.
    """
    sharding_parameters = get_parameter_for_sharding(sharding_instances)
    dev_mode_parameters = get_parameter_for_dev_mode(dev_mode_setting)
    suite_parameter = get_parameter_for_suite(suite_name)

    commands = [PROTRACTOR_CONFIG_FILE_PATH]
    commands.extend(sharding_parameters)
    commands.extend(suite_parameter)
    commands.append(dev_mode_parameters)

    return commands


def start_google_app_engine_server(dev_mode_setting):
    """Start the Google App Engine server.

    Args:
        dev_mode_setting: bool. Represents whether to run the related commands
            in dev mode.
    """
    app_yaml_filepath = 'app%s.yaml' % ('_dev' if dev_mode_setting else '')

    p = subprocess.Popen(
        '%s %s/dev_appserver.py --host 0.0.0.0 --port %s '
        '--clear_datastore=yes --dev_appserver_log_level=critical '
        '--log_level=critical --skip_sdk_update_check=true %s' % (
            common.CURRENT_PYTHON_BIN, common.GOOGLE_APP_ENGINE_HOME,
            GOOGLE_APP_ENGINE_PORT, app_yaml_filepath), shell=True)
    SUBPROCESSES.append(p)


def main(args=None):
    """Run the scripts to start end-to-end tests."""

    parsed_args = _PARSER.parse_args(args=args)
    oppia_instance_is_already_running = is_oppia_server_already_running()

    if oppia_instance_is_already_running:
        sys.exit(1)
    setup_and_install_dependencies(parsed_args.skip_install)


    atexit.register(cleanup)

    dev_mode = not parsed_args.prod_env
    update_community_dashboard_status_in_feconf_file(
        FECONF_FILE_PATH, parsed_args.community_dashboard_enabled)
    build_js_files(dev_mode)
    start_webdriver_manager()

    start_google_app_engine_server(dev_mode)

    wait_for_port_to_be_open(WEB_DRIVER_PORT)
    wait_for_port_to_be_open(GOOGLE_APP_ENGINE_PORT)
    ensure_screenshots_dir_is_removed()
    commands = [common.NODE_BIN_PATH, PROTRACTOR_BIN_PATH]
    commands.extend(get_e2e_test_parameters(
        parsed_args.sharding_instances, parsed_args.suite, dev_mode))

    p = subprocess.Popen(commands)
    p.communicate()
    sys.exit(p.returncode)


if __name__ == '__main__':  # pragma: no cover
    main()
