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
import os
import subprocess
import sys

from constants import constants
import python_utils
from scripts import build
from scripts import common
from scripts import flake_checker
from scripts import install_third_party_libs
from scripts import servers

MAX_RETRY_COUNT = 3
OPPIA_SERVER_PORT = 8181
GOOGLE_APP_ENGINE_PORT = 9001
ELASTICSEARCH_SERVER_PORT = 9200
PORTS_USED_BY_OPPIA_PROCESSES = [
    OPPIA_SERVER_PORT,
    GOOGLE_APP_ENGINE_PORT,
    ELASTICSEARCH_SERVER_PORT,
]

_PARSER = argparse.ArgumentParser(
    description="""
Run this script from the oppia root folder:
   python -m scripts.run_e2e_tests

The root folder MUST be named 'oppia'.

NOTE: You can replace 'it' with 'fit' or 'describe' with 'fdescribe' to run a
single test or test suite.
""")

_PARSER.add_argument(
    '--skip-install',
    help='If true, skips installing dependencies. The default value is false.',
    action='store_true')
_PARSER.add_argument(
    '--skip-build',
    help='If true, skips building files. The default value is false.',
    action='store_true')
_PARSER.add_argument(
    '--sharding-instances', type=int, default=3,
    help='Sets the number of parallel browsers to open while sharding. '
         'Sharding must be disabled (either by passing in false to --sharding '
         'or 1 to --sharding-instances) if running any tests in isolation '
         '(fit or fdescribe).')
_PARSER.add_argument(
    '--prod_env',
    help='Run the tests in prod mode. Static resources are served from '
         'build directory and use cache slugs.',
    action='store_true')
_PARSER.add_argument(
    '--suite', default='full',
    help='Performs test for different suites, here suites are the '
         'name of the test files present in core/tests/protractor_desktop/ and '
         'core/test/protractor/ dirs. e.g. for the file '
         'core/tests/protractor/accessibility.js use --suite=accessibility. '
         'For performing a full test, no argument is required.')
_PARSER.add_argument(
    '--chrome_driver_version',
    help='Uses the specified version of the chrome driver')
_PARSER.add_argument(
    '--debug_mode',
    help='Runs the protractor test in debugging mode. Follow the instruction '
         'provided in following URL to run e2e tests in debugging mode: '
         'https://www.protractortest.org/#/debugging#disabled-control-flow',
    action='store_true')
_PARSER.add_argument(
    '--deparallelize_terser',
    help='Disable parallelism on terser plugin in webpack. Use with prod_env. '
         'This flag is required for tests to run on CircleCI, since CircleCI '
         'sometimes flakes when parallelism is used. It is not required in the '
         'local dev environment. See https://discuss.circleci.com/t/'
         'build-fails-with-error-spawn-enomem/30537/10',
    action='store_true')
_PARSER.add_argument(
    '--server_log_level',
    help='Sets the log level for the appengine server. The default value is '
         'set to error.',
    default='error',
    choices=['critical', 'error', 'warning', 'info'])
_PARSER.add_argument(
    '--source_maps',
    help='Build webpack with source maps.',
    action='store_true')


# Never rerun failing tests, even when they match a known flake.
RERUN_POLICY_NEVER = 'never'
# Only rerun failing tests when they match a known flake.
RERUN_POLICY_KNOWN_FLAKES = 'known flakes'
# Always rerun failing tests, even when they don't match a known flake.
RERUN_POLICY_ALWAYS = 'always'

RERUN_POLICIES = {
    'accessibility': RERUN_POLICY_KNOWN_FLAKES,
    'additionaleditorfeatures': RERUN_POLICY_ALWAYS,
    'additionalplayerfeatures': RERUN_POLICY_ALWAYS,
    'adminpage': RERUN_POLICY_KNOWN_FLAKES,
    'classroompage': RERUN_POLICY_NEVER,
    'classroompagefileuploadfeatures': RERUN_POLICY_KNOWN_FLAKES,
    'collections': RERUN_POLICY_NEVER,
    'contributordashboard': RERUN_POLICY_ALWAYS,
    'coreeditorandplayerfeatures': RERUN_POLICY_KNOWN_FLAKES,
    'creatordashboard': RERUN_POLICY_ALWAYS,
    'emaildashboard': RERUN_POLICY_ALWAYS,
    'embedding': RERUN_POLICY_ALWAYS,
    'explorationfeedbacktab': RERUN_POLICY_NEVER,
    'explorationhistorytab': RERUN_POLICY_ALWAYS,
    'explorationimprovementstab': RERUN_POLICY_ALWAYS,
    'explorationstatisticstab': RERUN_POLICY_KNOWN_FLAKES,
    'explorationtranslationtab': RERUN_POLICY_ALWAYS,
    'extensions': RERUN_POLICY_ALWAYS,
    'featuregating': RERUN_POLICY_ALWAYS,
    'fileuploadextensions': RERUN_POLICY_NEVER,
    'fileuploadfeatures': RERUN_POLICY_ALWAYS,
    'learner': RERUN_POLICY_ALWAYS,
    'learnerdashboard': RERUN_POLICY_KNOWN_FLAKES,
    'library': RERUN_POLICY_ALWAYS,
    'navigation': RERUN_POLICY_NEVER,
    'playvoiceovers': RERUN_POLICY_ALWAYS,
    'preferences': RERUN_POLICY_KNOWN_FLAKES,
    'profilefeatures': RERUN_POLICY_NEVER,
    'profilemenu': RERUN_POLICY_NEVER,
    'publication': RERUN_POLICY_KNOWN_FLAKES,
    'releasecoordinatorpagefeatures': RERUN_POLICY_NEVER,
    'skilleditor': RERUN_POLICY_KNOWN_FLAKES,
    'subscriptions': RERUN_POLICY_KNOWN_FLAKES,
    'topicandstoryeditor': RERUN_POLICY_ALWAYS,
    'topicandstoryeditorfileuploadfeatures': RERUN_POLICY_KNOWN_FLAKES,
    'topicandstoryviewer': RERUN_POLICY_ALWAYS,
    'topicsandskillsdashboard': RERUN_POLICY_ALWAYS,
    'users': RERUN_POLICY_KNOWN_FLAKES,
    'wipeout': RERUN_POLICY_ALWAYS,
    # The suite name is `full` when no --suite argument is passed. This
    # indicates that all the tests should be run.
    'full': RERUN_POLICY_NEVER,
}


def is_oppia_server_already_running():
    """Check if the ports are taken by any other processes. If any one of
    them is taken, it may indicate there is already one Oppia instance running.

    Returns:
        bool. Whether there is a running Oppia instance.
    """
    for port in PORTS_USED_BY_OPPIA_PROCESSES:
        if common.is_port_in_use(port):
            python_utils.PRINT(
                'There is already a server running on localhost:%s. '
                'Please terminate it before running the end-to-end tests. '
                'Exiting.' % port)
            return True
    return False


def run_webpack_compilation(source_maps=False):
    """Runs webpack compilation.

    Args:
        source_maps: bool. Whether to compile with source maps.
    """
    max_tries = 5
    webpack_bundles_dir_name = 'webpack_bundles'

    for _ in python_utils.RANGE(max_tries):
        try:
            managed_webpack_compiler = (
                servers.managed_webpack_compiler(use_source_maps=source_maps))
            with managed_webpack_compiler as proc:
                proc.wait()
        except subprocess.CalledProcessError as error:
            python_utils.PRINT(error.output)
            sys.exit(error.returncode)
            return
        if os.path.isdir(webpack_bundles_dir_name):
            break
    else:
        # We didn't break out of the loop, meaning all attempts have failed.
        python_utils.PRINT('Failed to complete webpack compilation, exiting...')
        sys.exit(1)


def install_third_party_libraries(skip_install):
    """Run the installation script.

    Args:
        skip_install: bool. Whether to skip running the installation script.
    """
    if not skip_install:
        install_third_party_libs.main()


def build_js_files(dev_mode, deparallelize_terser=False, source_maps=False):
    """Build the javascript files.

    Args:
        dev_mode: bool. Represents whether to run the related commands in dev
            mode.
        deparallelize_terser: bool. Represents whether to use webpack
            compilation config that disables parallelism on terser plugin.
        source_maps: bool. Represents whether to use source maps while
            building webpack.
    """
    if not dev_mode:
        python_utils.PRINT('Generating files for production mode...')

        build_args = ['--prod_env']
        if deparallelize_terser:
            build_args.append('--deparallelize_terser')
        if source_maps:
            build_args.append('--source_maps')
        build.main(args=build_args)

    else:
        build.main(args=[])
        run_webpack_compilation(source_maps=source_maps)


def run_tests(args):
    """Run the scripts to start end-to-end tests."""
    if is_oppia_server_already_running():
        sys.exit(1)

    install_third_party_libraries(args.skip_install)

    with python_utils.ExitStack() as stack:
        dev_mode = not args.prod_env

        if args.skip_build:
            build.modify_constants(prod_env=args.prod_env)
        else:
            build_js_files(
                dev_mode, deparallelize_terser=args.deparallelize_terser,
                source_maps=args.source_maps)
        stack.callback(build.set_constants_to_default)

        stack.enter_context(servers.managed_redis_server())
        stack.enter_context(servers.managed_elasticsearch_dev_server())
        if constants.EMULATOR_MODE:
            stack.enter_context(servers.managed_firebase_auth_emulator())

        app_yaml_path = 'app.yaml' if args.prod_env else 'app_dev.yaml'
        stack.enter_context(servers.managed_dev_appserver(
            app_yaml_path,
            port=GOOGLE_APP_ENGINE_PORT,
            log_level=args.server_log_level,
            clear_datastore=True,
            skip_sdk_update_check=True,
            env={'PORTSERVER_ADDRESS': common.PORTSERVER_SOCKET_FILEPATH}))

        stack.enter_context(servers.managed_webdriver_server(
            chrome_version=args.chrome_driver_version))

        proc = stack.enter_context(servers.managed_protractor_server(
            suite_name=args.suite,
            dev_mode=dev_mode,
            debug_mode=args.debug_mode,
            sharding_instances=args.sharding_instances,
            stdout=subprocess.PIPE))

        python_utils.PRINT(
            'Servers have come up.\n'
            'Note: If ADD_SCREENSHOT_REPORTER is set to true in '
            'core/tests/protractor.conf.js, you can view screenshots of the '
            'failed tests in ../protractor-screenshots/')

        output_lines = []
        while True:
            # Keep reading lines until an empty string is returned. Empty
            # strings signal that the process has ended.
            for line in iter(proc.stdout.readline, b''):
                if isinstance(line, str):
                    # Although our unit tests always provide unicode strings,
                    # the actual server needs this failsafe since it can output
                    # non-unicode strings.
                    line = line.decode('utf-8') # pragma: nocover
                output_lines.append(line.rstrip())
                # Replaces non-ASCII characters with '?'.
                sys.stdout.write(line.encode('ascii', errors='replace'))
            # The poll() method returns None while the process is running,
            # otherwise it returns the return code of the process (an int).
            if proc.poll() is not None:
                break

        return output_lines, proc.returncode


def main(args=None):
    """Run tests, rerunning at most MAX_RETRY_COUNT times if they flake."""
    parsed_args = _PARSER.parse_args(args=args)
    policy = RERUN_POLICIES[parsed_args.suite.lower()]

    with servers.managed_portserver():
        for attempt_num in python_utils.RANGE(1, MAX_RETRY_COUNT + 1):
            python_utils.PRINT('***Attempt %d.***' % attempt_num)
            output, return_code = run_tests(parsed_args)

            if not flake_checker.check_if_on_ci():
                # Don't rerun off of CI.
                python_utils.PRINT('No reruns because not running on CI.')
                break

            if return_code == 0:
                # Don't rerun passing tests.
                flake_checker.report_pass(parsed_args.suite)
                break

            # Check whether we should rerun based on this suite's policy.
            test_is_flaky = flake_checker.is_test_output_flaky(
                output, parsed_args.suite)
            if policy == RERUN_POLICY_NEVER:
                break
            if policy == RERUN_POLICY_KNOWN_FLAKES and not test_is_flaky:
                break

    sys.exit(return_code)


if __name__ == '__main__':  # pragma: no cover
    main()
