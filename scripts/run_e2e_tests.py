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

from __future__ import annotations

import argparse
import contextlib
import os
import subprocess
import sys

from typing import Final, List, Optional, Tuple

# TODO(#15567): This can be removed after Literal in utils.py is loaded
# from typing instead of typing_extensions, this will be possible after
# we migrate to Python 3.8.
from scripts import common  # isort:skip pylint: disable=wrong-import-position, unused-import

from core.constants import constants  # isort:skip
from scripts import build  # isort:skip
from scripts import flake_checker  # isort:skip
from scripts import install_third_party_libs  # isort:skip
from scripts import servers  # isort:skip

MAX_RETRY_COUNT: Final = 3
GOOGLE_APP_ENGINE_PORT: Final = 9001
ELASTICSEARCH_SERVER_PORT: Final = 9200
PORTS_USED_BY_OPPIA_PROCESSES: Final = [
    GOOGLE_APP_ENGINE_PORT,
    ELASTICSEARCH_SERVER_PORT,
]

_PARSER: Final = argparse.ArgumentParser(
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
         'name of the test files present in core/tests/webdriverio_desktop/ '
         'and core/test/webdriverio/ dirs. e.g. for the file '
         'core/tests/webdriverio/accessibility.js use --suite=accessibility. '
         'For performing a full test, no argument is required.')
_PARSER.add_argument(
    '--chrome_driver_version',
    help='Uses the specified version of the chrome driver')
_PARSER.add_argument(
    '--debug_mode',
    help='Runs the webdriverio test in debugging mode. Follow the instruction '
         'provided in following URL to run e2e tests in debugging mode: '
         'https://webdriver.io/docs/debugging/',
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
_PARSER.add_argument(
    '--mobile',
    help='Run e2e test in mobile viewport.',
    action='store_true')


MOBILE_SUITES = [
    'contributorDashboard'
]


def is_oppia_server_already_running() -> bool:
    """Check if the ports are taken by any other processes. If any one of
    them is taken, it may indicate there is already one Oppia instance running.

    Returns:
        bool. Whether there is a running Oppia instance.
    """
    for port in PORTS_USED_BY_OPPIA_PROCESSES:
        if common.is_port_in_use(port):
            print(
                'There is already a server running on localhost:%s. '
                'Please terminate it before running the end-to-end tests. '
                'Exiting.' % port)
            return True
    return False


def run_webpack_compilation(source_maps: bool = False) -> None:
    """Runs webpack compilation.

    Args:
        source_maps: bool. Whether to compile with source maps.
    """
    max_tries = 5
    webpack_bundles_dir_name = 'webpack_bundles'

    for _ in range(max_tries):
        try:
            managed_webpack_compiler = (
                servers.managed_webpack_compiler(use_source_maps=source_maps))
            with managed_webpack_compiler as proc:
                proc.wait()
        except subprocess.CalledProcessError as error:
            print(error.output)
            sys.exit(error.returncode)
            return
        if os.path.isdir(webpack_bundles_dir_name):
            break
    else:
        # We didn't break out of the loop, meaning all attempts have failed.
        print('Failed to complete webpack compilation, exiting...')
        sys.exit(1)


def install_third_party_libraries(skip_install: bool) -> None:
    """Run the installation script.

    Args:
        skip_install: bool. Whether to skip running the installation script.
    """
    if not skip_install:
        install_third_party_libs.main()


def build_js_files(dev_mode: bool, source_maps: bool = False) -> None:
    """Build the javascript files.

    Args:
        dev_mode: bool. Represents whether to run the related commands in dev
            mode.
        source_maps: bool. Represents whether to use source maps while
            building webpack.
    """
    if not dev_mode:
        print('Generating files for production mode...')

        build_args = ['--prod_env']
        if source_maps:
            build_args.append('--source_maps')
        build.main(args=build_args)

    else:
        build.main(args=[])
        run_webpack_compilation(source_maps=source_maps)


def run_tests(args: argparse.Namespace) -> Tuple[List[bytes], int]:
    """Run the scripts to start end-to-end tests."""
    if is_oppia_server_already_running():
        sys.exit(1)

    install_third_party_libraries(args.skip_install)

    with contextlib.ExitStack() as stack:
        dev_mode = not args.prod_env

        if args.skip_build:
            build.modify_constants(prod_env=args.prod_env)
        else:
            build_js_files(dev_mode, source_maps=args.source_maps)
        stack.callback(build.set_constants_to_default)

        stack.enter_context(servers.managed_redis_server())
        stack.enter_context(servers.managed_elasticsearch_dev_server())
        if constants.EMULATOR_MODE:
            stack.enter_context(servers.managed_firebase_auth_emulator())
            stack.enter_context(
                servers.managed_cloud_datastore_emulator(clear_datastore=True))

        app_yaml_path = 'app.yaml' if args.prod_env else 'app_dev.yaml'
        stack.enter_context(servers.managed_dev_appserver(
            app_yaml_path,
            port=GOOGLE_APP_ENGINE_PORT,
            log_level=args.server_log_level,
            # Automatic restart can be disabled since we don't expect code
            # changes to happen while the e2e tests are running.
            automatic_restart=False,
            skip_sdk_update_check=True,
            env={
                **os.environ,
                'PORTSERVER_ADDRESS': common.PORTSERVER_SOCKET_FILEPATH,
            }))

        if (args.mobile) and (args.suite not in MOBILE_SUITES):
            print(
                f'The {args.suite} suite should not be run ' +
                'in the mobile viewport'
                )
            sys.exit(1)

        proc = stack.enter_context(servers.managed_webdriverio_server(
                suite_name=args.suite,
                dev_mode=dev_mode,
                debug_mode=args.debug_mode,
                chrome_version=args.chrome_driver_version,
                sharding_instances=args.sharding_instances,
                mobile=args.mobile,
                stdout=subprocess.PIPE))

        print(
            'Servers have come up.\n'
            'Note: You can view screenshots of failed tests '
            'in ../webdriverio-screenshots/')

        output_lines = []
        while True:
            # Keep reading lines until an empty string is returned. Empty
            # strings signal that the process has ended.
            for line in iter(proc.stdout.readline, b''):
                if isinstance(line, str):
                    # Although our unit tests always provide unicode strings,
                    # the actual server needs this failsafe since it can output
                    # non-unicode strings.
                    line = line.encode('utf-8')  # pragma: no cover
                output_lines.append(line.rstrip())
                # Replaces non-ASCII characters with '?'.
                common.write_stdout_safe(line.decode('ascii', errors='replace'))
            # The poll() method returns None while the process is running,
            # otherwise it returns the return code of the process (an int).
            if proc.poll() is not None:
                break

        return_value = output_lines, proc.returncode
    return return_value


def main(args: Optional[List[str]] = None) -> None:
    """Run tests, rerunning at most MAX_RETRY_COUNT times if they flake."""
    parsed_args = _PARSER.parse_args(args=args)

    with servers.managed_portserver():
        for attempt_num in range(1, MAX_RETRY_COUNT + 1):
            print('***Attempt %d.***' % attempt_num)
            output, return_code = run_tests(parsed_args)

            if not flake_checker.check_if_on_ci():
                # Don't rerun off of CI.
                print('No reruns because not running on CI.')
                break

            if return_code == 0:
                # Don't rerun passing tests.
                flake_checker.report_pass(parsed_args.suite)
                break

            # Check whether we should rerun based on the instructions from the
            # flake checker server.
            rerun = flake_checker.check_test_flakiness(
                output, parsed_args.suite)
            if rerun:
                print('Rerunning.')
            else:
                print('Not rerunning.')
                break

    sys.exit(return_code)


if __name__ == '__main__':  # pragma: no cover
    main()
