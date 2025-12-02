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

"""This script contains the main logic for starting up a development server
running Oppia.
"""

from __future__ import annotations

import contextlib
import os
import time

from core.constants import constants
from scripts import build
from scripts import common
from scripts import servers
from scripts import start_utils

from typing import Any, Iterator, Optional, Sequence


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
            '\n\n'
        )
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
        '\n\n'
    )


def call_extend_index_yaml() -> None:
    """Calls the extend_index_yaml.py script."""
    from scripts import extend_index_yaml
    print('\033[94mExtending index.yaml...\033[0m')
    extend_index_yaml.main()


def main(parsed_args: Any) -> None:
    """Starts up a development server running Oppia."""
    if start_utils.is_port_in_use(PORT_NUMBER_FOR_GAE_SERVER):
        start_utils.print_each_string_after_two_new_lines(
            [
                'WARNING',
                'Could not start new server. There is already an existing server '
                'running at port %s.' % PORT_NUMBER_FOR_GAE_SERVER,
            ]
        )

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
            stack.enter_context(
                servers.managed_firebase_auth_emulator(
                    recover_users=parsed_args.save_datastore
                )
            )
            stack.enter_context(
                servers.managed_cloud_datastore_emulator(
                    clear_datastore=not parsed_args.save_datastore
                )
            )

        # NOTE: When prod_env=True the Webpack compiler is run by build.main().
        if not parsed_args.prod_env:
            # We need to create an empty hashes.json file for the build so that
            # we don't get the error "assets/hashes.json file doesn't exist".
            common.write_hashes_json_file({})
            stack.enter_context(servers.managed_ng_build(watch_mode=True))
            stack.enter_context(
                servers.managed_webpack_compiler(
                    use_prod_env=False,
                    use_source_maps=parsed_args.source_maps,
                    watch_mode=True,
                )
            )

        env = os.environ.copy()
        env['PIP_NO_DEPS'] = 'True'
        app_yaml_path = 'app.yaml' if parsed_args.prod_env else 'app_dev.yaml'
        dev_appserver = stack.enter_context(
            servers.managed_dev_appserver(
                app_yaml_path,
                enable_host_checking=not parsed_args.disable_host_checking,
                automatic_restart=not parsed_args.no_auto_restart,
                skip_sdk_update_check=True,
                port=PORT_NUMBER_FOR_GAE_SERVER,
                env=env,
            )
        )

        if parsed_args.no_browser:
            start_utils.print_each_string_after_two_new_lines(
                [
                    'INFORMATION',
                    'Local development server is ready! You can access it by '
                    'navigating to http://localhost:%s/ in a web '
                    'browser.' % PORT_NUMBER_FOR_GAE_SERVER,
                ]
            )
        else:
            try:
                stack.enter_context(
                    servers.create_managed_web_browser(
                        PORT_NUMBER_FOR_GAE_SERVER
                    )
                )
                start_utils.print_each_string_after_two_new_lines(
                    [
                        'INFORMATION',
                        'Local development server is ready! Opening a default web '
                        'browser window pointing to it: '
                        'http://localhost:%s/' % PORT_NUMBER_FOR_GAE_SERVER,
                    ]
                )
            except Exception as error:
                start_utils.print_each_string_after_two_new_lines(
                    [
                        'ERROR',
                        'Error occurred while attempting to automatically launch '
                        'the web browser: %s' % error,
                    ]
                )
                start_utils.print_each_string_after_two_new_lines(
                    [
                        'INFORMATION',
                        'Local development server is ready! You can access it by '
                        'navigating to http://localhost:%s/ in a web '
                        'browser.' % PORT_NUMBER_FOR_GAE_SERVER,
                    ]
                )

        dev_appserver.wait()
