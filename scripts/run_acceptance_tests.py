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
import json
import os
import shutil
import subprocess
import sys

from scripts import build, common, servers

from typing import Final, List, Optional, Tuple, cast

_PARSER: Final = argparse.ArgumentParser(
    description="""
Run this script from the oppia root folder:
   python -m scripts.run_acceptance_tests

The root folder MUST be named 'oppia'.
"""
)

_PARSER.add_argument(
    '--skip_build',
    help='If true, skips building files. The default value is false.',
    action='store_true',
)
_PARSER.add_argument(
    '--prod_env',
    help='Run the tests in prod mode. Static resources are served from '
    'build directory and use cache slugs.',
    action='store_true',
)
_PARSER.add_argument(
    '--suite',
    required=True,
    help='Specifies the test suite to run. '
    'For performing a full test, no argument is required.',
)
_PARSER.add_argument(
    '--server_log_level',
    help='Sets the log level for the appengine server. The default value is '
    'set to error.',
    default='error',
    choices=['critical', 'error', 'warning', 'info'],
)
_PARSER.add_argument(
    '--source_maps', help='Build webpack with source maps.', action='store_true'
)

_PARSER.add_argument(
    '--headless', help='Run the tests in headless mode.', action='store_true'
)

_PARSER.add_argument(
    '--mobile', help='Run the tests in mobile mode.', action='store_true'
)

_PARSER.add_argument(
    '--update_snapshots',
    help='Update screenshot baselines instead of comparing against them.',
    action='store_true',
)


def compile_test_ts_files() -> None:
    """Compiles the test typescript files into a build directory."""
    puppeteer_acceptance_tests_dir_path = os.path.join(
        common.CURR_DIR, 'core', 'tests', 'puppeteer-acceptance-tests'
    )
    build_dir_path = os.path.join(
        puppeteer_acceptance_tests_dir_path,
        'build',
        'puppeteer-acceptance-tests',
    )

    if os.path.exists(build_dir_path):
        shutil.rmtree(build_dir_path)

    cmd = (
        './node_modules/typescript/bin/tsc -p %s'
        % './tsconfig.puppeteer-acceptance-tests.json'
    )
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True
    )

    _, encoded_stderr = proc.communicate()
    stderr = encoded_stderr.decode('utf-8')

    if stderr:
        raise Exception(stderr)

    shutil.copytree(
        os.path.join(puppeteer_acceptance_tests_dir_path, 'data'),
        os.path.join(build_dir_path, 'data'),
    )


def install_playwright_dependencies() -> None:
    """Installs Playwright npm dependencies and browsers."""
    # TODO(#26264): Remove the separate Node 20 PATH
    # override once Oppia upgrades its default Node version to 20.
    playwright_dir = os.path.join(
        common.CURR_DIR, 'core', 'tests', 'playwright-acceptance-tests'
    )
    playwright_node_modules = os.path.join(playwright_dir, 'node_modules')

    if os.path.exists(playwright_node_modules):
        return

    install_env = {
        **os.environ,
        'PATH': os.pathsep.join(
            [
                os.path.join(common.PLAYWRIGHT_NODE_PATH, 'bin'),
                os.environ['PATH'],
            ]
        ),
        'NODE': os.path.join(common.PLAYWRIGHT_NODE_PATH, 'bin', 'node'),
    }
    subprocess.check_call(
        [common.PLAYWRIGHT_NPM_BIN_PATH, '--prefix', playwright_dir, 'ci'],
        env=install_env,
    )
    playwright_bin = os.path.join(
        playwright_dir, 'node_modules', '.bin', 'playwright'
    )
    subprocess.check_call(
        [playwright_bin, 'install', 'chromium'], env=install_env
    )


def get_suite_framework(suite_name: str) -> str:
    """Returns the framework for the given suite name."""
    # TODO(#24715): Remove the framework lookup once the
    # migration from Puppeteer to Playwright is complete.
    with open(
        common.ACCEPTANCE_TEST_CONFIG_FILE_PATH, 'r', encoding='utf-8'
    ) as f:
        # Here we use cast because we are narrowing down the type
        # since we know the structure of the acceptance test config
        # file and it contains suite configuration dictionaries.
        filedata = cast(dict[str, list[dict[str, str]]], json.load(f))

    for suites in filedata.values():
        for suite in suites:
            if suite['name'] == suite_name:
                return suite['framework']

    raise ValueError(f'Suite \'{suite_name}\' not found in config.')


def run_tests(args: argparse.Namespace) -> Tuple[List[bytes], int]:
    """Run the scripts to start acceptance tests."""
    if common.is_oppia_server_already_running():
        sys.exit(
            """
            Oppia server is already running. Try shutting all the servers down
            before running the script.
        """
        )

    suite_framework = get_suite_framework(args.suite)

    with contextlib.ExitStack() as stack:
        dev_mode = not args.prod_env

        # Only compile Puppeteer TypeScript for Puppeteer suites.
        if suite_framework == 'puppeteer':
            compile_test_ts_files()

        # Install Playwright deps for Playwright suites.
        if suite_framework == 'playwright':
            install_playwright_dependencies()

        if args.skip_build:
            common.modify_constants(prod_env=args.prod_env)
        else:
            build.build_js_files(dev_mode, source_maps=args.source_maps)
        stack.callback(common.set_constants_to_default)

        stack.enter_context(servers.managed_redis_server())
        stack.enter_context(servers.managed_elasticsearch_dev_server())
        stack.enter_context(servers.managed_firebase_auth_emulator())
        stack.enter_context(
            servers.managed_cloud_datastore_emulator(clear_datastore=True)
        )

        app_yaml_path = 'app.yaml' if args.prod_env else 'app_dev.yaml'
        stack.enter_context(
            servers.managed_dev_appserver(
                app_yaml_path,
                port=common.GAE_PORT_FOR_E2E_TESTING,
                log_level=args.server_log_level,
                # Automatic restart can be disabled since we don't expect code
                # changes to happen while the acceptance tests are running.
                automatic_restart=False,
                skip_sdk_update_check=True,
                env={
                    **os.environ,
                    'PORTSERVER_ADDRESS': common.PORTSERVER_SOCKET_FILEPATH,
                    'PIP_NO_DEPS': 'True',
                },
            )
        )

        proc = stack.enter_context(
            servers.managed_acceptance_tests_server(
                suite_name=args.suite,
                headless=args.headless,
                mobile=args.mobile,
                prod_env=args.prod_env,
                update_snapshots=args.update_snapshots,
                stdout=subprocess.PIPE,
            )
        )

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
    """Run acceptance tests."""
    parsed_args = _PARSER.parse_args(args=args)

    with servers.managed_portserver():
        _, return_code = run_tests(parsed_args)

    sys.exit(return_code)


if __name__ == '__main__':  # pragma: no cover
    main()
