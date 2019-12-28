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
import os
import re
import subprocess
import sys
import time

import python_utils
from scripts import build
from scripts import common
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
WAIT_PORT_TIMEOUT = 1000
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
    '--browserstack',
    help='Run the tests on browserstack using the'
         'protractor-browserstack.conf.js file.',
    action='store_true')
_PARSER.add_argument(
    '--skip-install',
    help='If true, skips installing dependencies. The default value is false.',
    action='store_true')
_PARSER.add_argument(
    '--sharding', default=True, type=bool,
    help='Disables/Enables parallelization of protractor tests.'
         'Sharding must be disabled (either by passing in false to --sharding'
         ' or 1 to --sharding-instances) if running any tests in isolation'
         ' (fit or fdescribe).',
    )
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

SUBPROCESSES = []


def check_screenshot():
    """Check if screenshot directory exists, if so, delete it."""
    screeenshots_dir = os.path.join(os.pardir, 'protractor-screenshots')
    if not os.path.isdir(screeenshots_dir):
        return
    python_utils.PRINT("""
Note: If ADD_SCREENSHOT_REPORTER is set to true in
core/tests/protractor.conf.js, you can view screenshots
of the failed tests in ../protractor-screenshots/
""")
    os.rmdir(screeenshots_dir)


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


def check_running_instance(*ports):
    """Check if exists running oppia instance.

    Args:
        ports: list[int]. A list of ports that oppia instances may be running.

    Return:
        boolean represents whether the ports are open.
    """
    running = False
    for port in ports:
        if common.is_port_open(port):
            python_utils.PRINT("""
There is already a server running on localhost:%s.
Please terminate it before running the end-to-end tests.
    Exiting.
            """ % port)
            running = True
            break
    return running


def wait_for_port(port):
    """Wait until the port is open.

    Args:
        port: int. The port number to wait.
    """
    current_time = 0
    while not common.is_port_open(port) and current_time < WAIT_PORT_TIMEOUT:
        time.sleep(1)
        current_time += 1
    if current_time == WAIT_PORT_TIMEOUT and not common.is_port_open(port):
        python_utils.PRINT(
            'Failed to start server on port %s, exiting ...' % port)
        sys.exit(1)


def tweak_constant_file(constant_file, dev_mode):
    """Change constant file based on the running mode. Only the `DEV_MODE` line
    should be changed.

    Args:
        constant_file: str. File path to the constant file.
        dev_mode: boolean. Represents whether the program is running on dev
            mode.
    """
    pattern = '"DEV_MODE": .*'
    replace = '"DEV_MODE": %s' % (
        'true' if dev_mode else 'false')
    common.inplace_replace_file(constant_file, pattern, replace)


def tweak_feconf_file(feconf_file_path, enable_community_dashboard):
    """Change feconf.py file based on whether the community dashboard is
    enabled.

    Args:
        feconf_file_path: str. Path to the feconf.py file.
        enable_community_dashboard: boolean. Represents whether community
            dashboard is enabled.
    """
    pattern = 'COMMUNITY_DASHBOARD_ENABLED = .*'
    replace = 'COMMUNITY_DASHBOARD_ENABLED = %s' % enable_community_dashboard
    common.inplace_replace_file(feconf_file_path, pattern, replace)


def run_webdriver_manager(parameters):
    """Run commands of webdriver manager.

    Args:
        parameters: list[str]. A list of parameters to pass to webdriver
            manager.
    """
    web_driver_command = [common.NODE_BIN_PATH, WEBDRIVER_MANAGER_BIN_PATH]
    web_driver_command.extend(parameters)
    python_utils.PRINT(common.run_cmd(web_driver_command))


def setup_and_install_dependencies(skip_install):
    """Run the setup and installation scripts."""
    if not skip_install:
        install_third_party_libs.main(args=[])
    setup.main(args=[])
    setup_gae.main(args=[])


def build_js_files(dev_mode):
    """Build the javascript files.

    Args:
        dev_mode: boolean. Represents whether run the related commands in dev
            mode.
    """
    tweak_constant_file(CONSTANT_FILE_PATH, dev_mode)
    if not dev_mode:
        python_utils.PRINT('  Generating files for production mode...')
    else:
        # The 'hashes.json' file is used by the `url-interpolation` service.
        if not os.path.isfile(HASHES_FILE_PATH):
            with open(HASHES_FILE_PATH, 'w') as hash_file:
                hash_file.write('{}')
        try:
            common.run_cmd(
                [common.NODE_BIN_PATH, WEBPACK_BIN_PATH, '--config',
                 'webpack.dev.config.ts'])
        except subprocess.CalledProcessError as error:
            python_utils.PRINT(error.output)
            sys.exit(error.returncode)
    build.main(args=(['--prod_env'] if not dev_mode else []))


def tweak_webdriver_manager():
    """webdriver-manager (version 13.0.0) uses `os.arch()` to determine the
    architecture of the operation system, however, this function can only be
    used to determine the architecture of the machine that compiled `node`
    (great job!). In the case of Windows, we are using the portable version,
    which was compiled on `ia32` machine so that is the value returned by this
    `os.arch` function. While clearly the author of webdriver-manager never
    considered windows would run on this architecture, so its own help function
    will return null for this. This is causing the application has no idea
    about where to download the correct version. So we need to change the
    lines in webdriver-manager to explicitly tell the architecture.

    https://github.com/angular/webdriver-manager/blob/b7539a5a3897a8a76abae7245f0de8175718b142/lib/provider/chromedriver.ts#L16
    https://github.com/angular/webdriver-manager/blob/b7539a5a3897a8a76abae7245f0de8175718b142/lib/provider/geckodriver.ts#L21
    https://github.com/angular/webdriver-manager/blob/b7539a5a3897a8a76abae7245f0de8175718b142/lib/provider/chromedriver.ts#L167
    https://github.com/nodejs/node/issues/17036
    """
    regex_pattern = PATTERN_FOR_REPLACE_WEBDRIVER_CODE
    arch = 'x64' if common.is_x64_architecture() else 'x86'
    replace = 'this.osArch = "%s";' % arch
    common.inplace_replace_file(
        CHROME_PROVIDER_FILE_PATH, regex_pattern, replace)
    common.inplace_replace_file(
        GECKO_PROVIDER_FILE_PATH, regex_pattern, replace)


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
    if common.is_windows_os():
        tweak_webdriver_manager()

    run_webdriver_manager(
        ['update', '--versions.chrome', CHROME_DRIVER_VERSION])
    run_webdriver_manager(
        ['start', '--versions.chrome', CHROME_DRIVER_VERSION,
         '--detach', '--quiet'])

    if common.is_windows_os():
        undo_webdriver_tweak()


def get_parameter_for_config_file(run_on_browserstack):
    """Return the parameter for the target configuration file based on whether
    the test is running on browserstack.

    Args:
        run_on_browserstack: bool. Whether run the test on browserstack.

    Returns:
        str. Represents the config file path.
    """
    if not run_on_browserstack:
        return PROTRACTOR_CONFIG_FILE_PATH
    else:
        python_utils.PRINT('Running the tests on browsertack...')
        return BROWSER_STACK_CONFIG_FILE_PATH


def get_parameter_for_sharding(sharding, sharding_instances):
    """Return the parameter for sharding. Based on the sharding instances

    Args:
        sharding: bool. Whether run the test with sharding.
        sharding_instances: int. How many sharding instances to be running.

    Returns:
        list[str]. A list of parameters to represent the sharding configuration.
    """
    if not sharding or sharding_instances == 1:
        return []
    else:
        return ['--capabilities.shardTestFiles=%s' % sharding,
                '--capabilities.maxInstances=%s' % sharding_instances]


def get_parameter_for_dev_mode(dev_mode):
    """Return parameter for whether the test should be running on dev_mode

    Args:
        dev_mode: bool. Whether the test is running on dev_mode.

    Returns:
        str. A string for the testing mode command line parameter.
    """
    return '--params.devMode=%s' % dev_mode


def get_parameter_for_suite(suite):
    """Return parameter for which suite to be running on the tests.

    Args:
        suite: str. The suite name to be running on the tests. If the value is
            `full`, all tests will run.

    Returns:
        list[str]. A list of command line parameter for suite.
    """
    return ['--suite', suite]


def get_e2e_test_parameters(
        run_on_browserstack, sharding, sharding_instances, suite, dev_mode):
    """Return parameters for the end-2-end tests.

    Args:
        run_on_browserstack: boolean. Represents whether the tests should run
            on browserstack.
        sharding: boolean. Disables/Enables parallelization of protractor tests.
        sharding_instances: str. Sets the number of parallel browsers to open
            while sharding.
        suite: str. Performs test for different suites.
        dev_mode: boolean. Represents whether run the related commands in dev
            mode.
    Returns:
        list[str] Parameters for running the tests.
    """
    config_file = get_parameter_for_config_file(run_on_browserstack)
    sharding_parameters = get_parameter_for_sharding(
        sharding, sharding_instances)
    dev_mode_parameters = get_parameter_for_dev_mode(dev_mode)
    suite_parameter = get_parameter_for_suite(suite)

    commands = [config_file]
    commands.extend(sharding_parameters)
    commands.extend(suite_parameter)
    commands.append(dev_mode_parameters)

    return commands


def start_google_engine(dev_mode):
    """Start the google engine server.

    Args:
        dev_mode: boolean. Represents whether run the related commands in dev
            mode.
    """
    app_yaml_filepath = 'app%s.yaml' % ('_dev' if dev_mode else '')

    p = subprocess.Popen(
        '%s %s/dev_appserver.py  --host 0.0.0.0 --port %s '
        '--clear_datastore=yes --dev_appserver_log_level=critical '
        '--log_level=critical --skip_sdk_update_check=true %s' % (
            common.CURRENT_PYTHON_BIN, common.GOOGLE_APP_ENGINE_HOME,
            GOOGLE_APP_ENGINE_PORT, app_yaml_filepath), shell=True)
    SUBPROCESSES.append(p)


def main(args=None):
    """Run the scripts to start end-to-end tests."""

    parsed_args = _PARSER.parse_args(args=args)
    other_instance_running = check_running_instance(
        OPPIA_SERVER_PORT, GOOGLE_APP_ENGINE_PORT)

    if other_instance_running:
        sys.exit(1)
    setup_and_install_dependencies(parsed_args.skip_install)


    atexit.register(cleanup)

    dev_mode = not parsed_args.prod_env
    run_on_browserstack = parsed_args.browserstack
    tweak_feconf_file(FECONF_FILE_PATH, parsed_args.community_dashboard_enabled)
    build_js_files(dev_mode)
    start_webdriver_manager()

    start_google_engine(dev_mode)

    wait_for_port(WEB_DRIVER_PORT)
    wait_for_port(GOOGLE_APP_ENGINE_PORT)
    check_screenshot()
    commands = [common.NODE_BIN_PATH, PROTRACTOR_BIN_PATH]
    commands.extend(get_e2e_test_parameters(
        run_on_browserstack, parsed_args.sharding,
        parsed_args.sharding_instances, parsed_args.suite, dev_mode))

    p = subprocess.Popen(commands)
    p.communicate()
    sys.exit(p.returncode)


if __name__ == '__main__':  # pragma: no cover
    main()
