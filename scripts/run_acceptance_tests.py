# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Python execution for running acceptance tests."""

from __future__ import annotations

import argparse
import contextlib
import os
import subprocess
import sys

from typing import Final, List, Optional, Tuple

from scripts import common  # isort:skip pylint: disable=wrong-import-position, unused-import

from core.constants import constants  # isort:skip
from scripts import build  # isort:skip
from scripts import install_third_party_libs  # isort:skip
from scripts import servers  # isort:skip

GOOGLE_APP_ENGINE_PORT: Final = 8181
ELASTICSEARCH_SERVER_PORT: Final = 9200
PORTS_USED_BY_OPPIA_PROCESSES: Final = [
    GOOGLE_APP_ENGINE_PORT,
    ELASTICSEARCH_SERVER_PORT,
]

_PARSER: Final = argparse.ArgumentParser(
    description="""
Run this script from the oppia root folder:
   python -m scripts.run_acceptance_tests

The root folder MUST be named 'oppia'.
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
    '--prod_env',
    help='Run the tests in prod mode. Static resources are served from '
         'build directory and use cache slugs.',
    action='store_true')
_PARSER.add_argument(
    '--suite', default='full',
    help='Performs test for different suites'
         'For performing a full test, no argument is required.')
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
        common.run_ng_compilation()
        run_webpack_compilation(source_maps=source_maps)


def run_tests(args: argparse.Namespace) -> Tuple[List[bytes], int]:
    """Run the scripts to start end-to-end tests."""
    if common.is_oppia_server_already_running(PORTS_USED_BY_OPPIA_PROCESSES):
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

        proc = stack.enter_context(servers.managed_acceptance_tests_server(
                suite_name=args.suite,
                stdout=subprocess.PIPE))

        print('Servers have come up.\n')

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
    """Run acceptance tests"""
    parsed_args = _PARSER.parse_args(args=args)

    with servers.managed_portserver():
        _, return_code = run_tests(parsed_args)

    sys.exit(return_code)


if __name__ == '__main__':  # pragma: no cover
    main()
