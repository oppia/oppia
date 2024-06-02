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

"""This script starts up a development server running Oppia. It installs any
missing third-party dependencies and starts up a local GAE development
server.
"""

from __future__ import annotations

import argparse
import contextlib
import os
import time
from typing import Iterator, Optional, Sequence

# Do not import any Oppia modules here,
# import them below the "install_third_party_libs.main()" line.
from . import install_third_party_libs
# This installs third party libraries before importing other files or importing
# libraries that use the builtins python module (e.g. build).
install_third_party_libs.main()

from . import build # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import common # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import extend_index_yaml # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import servers # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

from core.constants import constants # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

_PARSER = argparse.ArgumentParser(
    description="""
Run the script from the oppia root folder:
    python -m scripts.start
Note that the root folder MUST be named 'oppia'.
""")

_PARSER.add_argument(
    '--save_datastore',
    help='optional; if specified, does not clear the datastore.',
    action='store_true')
_PARSER.add_argument(
    '--disable_host_checking',
    help='optional; if specified, disables host checking so that the dev '
         'server can be accessed by any device on the same network using the '
         'host device\'s IP address. DO NOT use this flag if you\'re running '
         'on an untrusted network.',
    action='store_true')
_PARSER.add_argument(
    '--prod_env',
    help='optional; if specified, runs Oppia in a production environment.',
    action='store_true')
_PARSER.add_argument(
    '--maintenance_mode',
    help='optional; if specified, puts Oppia into maintenance mode.',
    action='store_true')
_PARSER.add_argument(
    '--no_browser',
    help='optional; if specified, does not open a browser.',
    action='store_true')
_PARSER.add_argument(
    '--no_auto_restart',
    help='optional; if specified, does not automatically restart when files '
         'are changed.',
    action='store_true')
_PARSER.add_argument(
    '--source_maps',
    help='optional; if specified, build webpack with source maps.',
    action='store_true')

PORT_NUMBER_FOR_GAE_SERVER = 8181


@contextlib.contextmanager
def alert_on_exit() -> Iterator[None]:
    """Context manager that alerts developers to wait for a graceful shutdown.

    Yields:
        None. Nothing.
    """
    try:
        yield
    finally:
        print(
            '\n\n'
            # ANSI escape sequence for bright yellow text color.
            '\033[93m'
            # ANSI escape sequence for bold font.
            '\033[1m'
            'Servers are shutting down, please wait for them to end gracefully!'
            # ANSI escape sequence for resetting formatting.
            '\033[0m'
            '\n\n')
        # Give developers an opportunity to read the alert.
        time.sleep(5)


def notify_about_successful_shutdown() -> None:
    """Notifies developers that the servers have shutdown gracefully."""
    print(
        '\n\n'
        # ANSI escape sequence for bright green text color.
        '\033[92m'
        # ANSI escape sequence for bold font.
        '\033[1m'
        # The notification.
        'Done! Thank you for waiting.'
        # ANSI escape sequence for resetting formatting.
        '\033[0m'
        '\n\n')


def call_extend_index_yaml() -> None:
    """Calls the extend_index_yaml.py script."""
    print('\033[94mExtending index.yaml...\033[0m')
    extend_index_yaml.main()


def main(args: Optional[Sequence[str]] = None) -> None:
    """Starts up a development server running Oppia."""
    parsed_args = _PARSER.parse_args(args=args)

    if common.is_port_in_use(PORT_NUMBER_FOR_GAE_SERVER):
        common.print_each_string_after_two_new_lines([
            'WARNING',
            'Could not start new server. There is already an existing server '
            'running at port %s.' % PORT_NUMBER_FOR_GAE_SERVER,
        ])

    # NOTE: The ordering of alert_on_exit() is important because we want the
    # alert to be printed _before_ the ExitStack unwinds, hence its placement as
    # the "latter" context (context managers exit in reverse-order).
    with contextlib.ExitStack() as stack, alert_on_exit():
        # ExitStack unwinds in reverse-order, so this will be the final action.
        stack.callback(notify_about_successful_shutdown)
        stack.callback(call_extend_index_yaml)

        build_args = []
        if parsed_args.prod_env:
            build_args.append('--prod_env')
        if parsed_args.maintenance_mode:
            build_args.append('--maintenance_mode')
        if parsed_args.source_maps:
            build_args.append('--source_maps')
        build.main(args=build_args)
        stack.callback(common.set_constants_to_default)

        stack.enter_context(servers.managed_redis_server())
        stack.enter_context(servers.managed_elasticsearch_dev_server())

        if constants.EMULATOR_MODE:
            stack.enter_context(servers.managed_firebase_auth_emulator(
                recover_users=parsed_args.save_datastore))
            stack.enter_context(servers.managed_cloud_datastore_emulator(
                clear_datastore=not parsed_args.save_datastore))

        # NOTE: When prod_env=True the Webpack compiler is run by build.main().
        if not parsed_args.prod_env:
            # We need to create an empty hashes.json file for the build so that
            # we don't get the error "assets/hashes.json file doesn't exist".
            build.save_hashes_to_file({})
            stack.enter_context(servers.managed_ng_build(watch_mode=True))
            stack.enter_context(servers.managed_webpack_compiler(
                use_prod_env=False, use_source_maps=parsed_args.source_maps,
                watch_mode=True))

        env = os.environ.copy()
        env['PIP_NO_DEPS'] = 'True'
        app_yaml_path = 'app.yaml' if parsed_args.prod_env else 'app_dev.yaml'
        dev_appserver = stack.enter_context(servers.managed_dev_appserver(
            app_yaml_path,
            enable_host_checking=not parsed_args.disable_host_checking,
            automatic_restart=not parsed_args.no_auto_restart,
            skip_sdk_update_check=True,
            port=PORT_NUMBER_FOR_GAE_SERVER,
            env=env))

        if parsed_args.no_browser:
            common.print_each_string_after_two_new_lines([
                'INFORMATION',
                'Local development server is ready! You can access it by '
                'navigating to http://localhost:%s/ in a web '
                'browser.' % PORT_NUMBER_FOR_GAE_SERVER,
            ])
        else:
            try:
                stack.enter_context(servers.create_managed_web_browser(
                    PORT_NUMBER_FOR_GAE_SERVER))
                common.print_each_string_after_two_new_lines([
                    'INFORMATION',
                    'Local development server is ready! Opening a default web '
                    'browser window pointing to it: '
                    'http://localhost:%s/' % PORT_NUMBER_FOR_GAE_SERVER,
                ])
            except Exception as error:
                common.print_each_string_after_two_new_lines([
                    'ERROR',
                    'Error occurred while attempting to automatically launch '
                    'the web browser: %s' % error,
                ])
                common.print_each_string_after_two_new_lines([
                    'INFORMATION',
                    'Local development server is ready! You can access it by '
                    'navigating to http://localhost:%s/ in a web '
                    'browser.' % PORT_NUMBER_FOR_GAE_SERVER,
                ])

        dev_appserver.wait()


if __name__ == '__main__':  # pragma: no cover
    main()
