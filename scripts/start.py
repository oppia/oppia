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

from core import feconf

import psutil
from typing import Callable, ContextManager, Iterator, List, Optional, Sequence

from . import (
    build,
    common,
    extend_index_yaml,
    install_third_party_libs,
    servers,
)

_PARSER = argparse.ArgumentParser(
    description="""
Run the script from the oppia root folder:
    python -m scripts.start
Note that the root folder MUST be named 'oppia'.
"""
)
_PARSER.add_argument(
    '--save_datastore',
    help='optional; if specified, does not clear the datastore.',
    action='store_true',
)
_PARSER.add_argument(
    '--disable_host_checking',
    help='optional; if specified, disables host checking so that the dev '
    'server can be accessed by any device on the same network using the '
    'host device\'s IP address. DO NOT use this flag if you\'re running '
    'on an untrusted network.',
    action='store_true',
)
_PARSER.add_argument(
    '--prod_env',
    help='optional; if specified, runs Oppia in a production environment.',
    action='store_true',
)
_PARSER.add_argument(
    '--maintenance_mode',
    help='optional; if specified, puts Oppia into maintenance mode.',
    action='store_true',
)
_PARSER.add_argument(
    '--no_browser',
    help='optional; if specified, does not open a browser.',
    action='store_true',
)
_PARSER.add_argument(
    '--no_auto_restart',
    help='optional; if specified, does not automatically restart when files '
    'are changed.',
    action='store_true',
)
_PARSER.add_argument(
    '--source_maps',
    help='optional; if specified, build webpack with source maps.',
    action='store_true',
)
_PARSER.add_argument(
    '--skip_install',
    help='optional; if specified, skips the installation of '
    'third party libraries',
    action='store_true',
)

BROWSER_LAUNCH_TIMEOUT_SECS = 10.0
BROWSER_RETRY_INTERVAL_SECS = 0.5
SERVER_READY_MESSAGE = [
    'INFORMATION',
    'Local development server is ready! You can access it by '
    'navigating to http://localhost:%s/ in a web '
    'browser.' % feconf.GAE_DEVELOPMENT_SERVER_PORT,
]


@contextlib.contextmanager
def _alert_on_exit() -> Iterator[None]:
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


def _notify_about_successful_shutdown() -> None:
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


def get_build_args(parsed_args: argparse.Namespace) -> List[str]:
    """Returns the build arguments based on parsed command-line arguments."""
    build_args = []
    if parsed_args.prod_env:
        build_args.append('--prod_env')
    if parsed_args.maintenance_mode:
        build_args.append('--maintenance_mode')
    if parsed_args.source_maps:
        build_args.append('--source_maps')
    return build_args


def make_dev_appserver_env(
    parsed_args: argparse.Namespace,
) -> tuple[dict[str, str], str]:
    """Returns the environment dict and app yaml path for dev appserver."""
    env = os.environ.copy()
    env['PIP_NO_DEPS'] = 'True'
    app_yaml_path = 'app.yaml' if parsed_args.prod_env else 'app_dev.yaml'
    return env, app_yaml_path


def start_services(
    parsed_args: argparse.Namespace, stack: contextlib.ExitStack
) -> psutil.Process:
    """Starts all the required services and returns the dev appserver."""
    stack.enter_context(servers.managed_redis_server())
    stack.enter_context(servers.managed_elasticsearch_dev_server())
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

    env, app_yaml_path = make_dev_appserver_env(parsed_args)
    dev_appserver = stack.enter_context(
        servers.managed_dev_appserver(
            app_yaml_path,
            enable_host_checking=not parsed_args.disable_host_checking,
            automatic_restart=not parsed_args.no_auto_restart,
            skip_sdk_update_check=True,
            port=feconf.GAE_DEVELOPMENT_SERVER_PORT,
            env=env,
        )
    )
    return dev_appserver


def attempt_launch_browser(
    enter_context_fn: Callable[
        [ContextManager[psutil.Process]], psutil.Process
    ],
) -> None:
    """Attempts to launch the web browser."""

    # Try to launch browser with timeout.
    last_error: Optional[Exception] = None
    browser_start_time = time.time()

    while True:
        try:
            enter_context_fn(
                servers.create_managed_web_browser(
                    feconf.GAE_DEVELOPMENT_SERVER_PORT
                )
            )
            common.print_each_string_after_two_new_lines(
                [
                    'INFORMATION',
                    'Local development server is ready! Opening a default web '
                    'browser window pointing to it: '
                    'http://localhost:%s/' % feconf.GAE_DEVELOPMENT_SERVER_PORT,
                ]
            )
            return
        except Exception as error:
            last_error = error
            # If we've exceeded our allotted timeout for browser launch, give
            # up.
            if time.time() - browser_start_time >= BROWSER_LAUNCH_TIMEOUT_SECS:
                common.print_each_string_after_two_new_lines(
                    [
                        'ERROR',
                        'Error occurred while attempting to automatically launch '
                        'the web browser: %s' % last_error,
                    ]
                )
                common.print_each_string_after_two_new_lines(
                    SERVER_READY_MESSAGE
                )
                return
            time.sleep(BROWSER_RETRY_INTERVAL_SECS)


def _get_ports_in_use_with_names(
    required_ports: list[tuple[int, str]],
) -> list[tuple[int, str]]:
    """Gets the list of required ports that are currently in use.

    Args:
        required_ports: list[tuple[int, str]]. List of (port, name) tuples.

    Returns:
        list[tuple[int, str]]. List of (port, name) tuples for ports that are
        in use.
    """
    ports_in_use = common.get_ports_in_use([p for p, _ in required_ports])
    return [(p, n) for p, n in required_ports if p in ports_in_use]


def main(args: Optional[Sequence[str]] = None) -> None:
    """Starts up a development server running Oppia."""
    parsed_args = _PARSER.parse_args(args=args)

    # Verify that none of the ports required by the dev services are in use
    # before starting any service. This avoids partially starting services
    # which could lead to unexpected errors. If a port is in use, print an
    # error and exit.
    required_ports: list[tuple[int, str]] = [
        (feconf.GAE_DEVELOPMENT_SERVER_PORT, 'GAE dev appserver'),
        (feconf.GAE_ADMIN_SERVER_PORT, 'GAE dev appserver admin port'),
        (feconf.REDISPORT, 'Redis server'),
        (feconf.ES_LOCALHOST_PORT, 'ElasticSearch server'),
        (feconf.FIREBASE_EMULATOR_PORT, 'Firebase auth emulator'),
        (feconf.CLOUD_DATASTORE_EMULATOR_PORT, 'Cloud Datastore emulator'),
    ]

    # Collect all ports that are already in use and report them together.
    ports_in_use = _get_ports_in_use_with_names(required_ports)
    if ports_in_use:
        port_msgs = ', '.join([f'{p} ({n})' for p, n in ports_in_use])
        common.print_each_string_after_two_new_lines(
            [
                'ERROR',
                'Could not start new server. The following ports are already in '
                'use and need to be available: %s' % port_msgs,
            ]
        )
        raise SystemExit(1)

    # The build stack ensures the constants are reset if the build is cancelled.
    # Only after the build successfully completes do we create the dev-server
    # stack and register callbacks/contexts which should only run if the server
    # starts.
    # Run build in an isolated block. Only on exception should we reset
    # constants (to satisfy the requirement that cancellations during the
    # build phase should trigger a reset). We avoid registering the reset as
    # a build_stack callback since that would run on successful builds as
    # well.
    if not parsed_args.skip_install:
        install_third_party_libs.main()

    build_args = get_build_args(parsed_args)
    try:
        build.main(args=build_args)
    except BaseException:
        # Reset constants if build fails or is cancelled.
        common.set_constants_to_default()
        raise

    # At this point, build completed successfully. Create the service stack
    # and register callbacks and contexts that must only run if the dev
    # server successfully starts.
    # Ensure port verification after unwinding occurs even if an exception
    # arises while running the services. The finally block will run after
    # the context manager unwinds.
    stack: Optional[contextlib.ExitStack] = None
    try:
        with contextlib.ExitStack() as stack:
            # ExitStack unwinds in reverse-order, so callbacks registered first
            # will run last on exit. Desired shutdown order:
            # 1) _alert_on_exit() (printed first)  -- registered last
            # 2) common.set_constants_to_default
            # 3) extend_index_yaml.main
            # 4) _notify_about_successful_shutdown (printed last)
            stack.callback(_notify_about_successful_shutdown)
            stack.callback(extend_index_yaml.main)
            stack.callback(common.set_constants_to_default)

            # Start the services (they are registered with the stack here so that
            # they are exited before the callbacks above run during unwinding).
            dev_appserver = start_services(parsed_args, stack)

            # Enter the _alert_on_exit context before attempting to launch the
            # browser so that an exception while launching the browser still
            # triggers the alert to be printed during stack unwinding.
            #
            # This must be registered before the attempt to launch the browser so
            # that alert_on_exit is always in the stack when the unwinding begins.
            stack.enter_context(_alert_on_exit())

            # Try launching the default web browser after the server is up.
            # Because we registered `_alert_on_exit` above, a cancel/error while
            # launching the browser will still cause the alert to be printed first
            # during the unwinding of the service stack.
            #
            # following shutdown order on cancellation during this phase:
            # 1) _alert_on_exit() is printed first, then browser/context closures,
            # 2) common.set_constants_to_default,
            # 3) extend_index_yaml.main,
            # 4) _notify_about_successful_shutdown.
            if not parsed_args.no_browser:
                attempt_launch_browser(stack.enter_context)
            else:
                common.print_each_string_after_two_new_lines(
                    SERVER_READY_MESSAGE
                )

            dev_appserver.wait()

    finally:
        # After ExitStack unwinding and shutdown, verify that the ports we
        # attempted to use are now free. This helps detect lingering processes
        # that didn't shut down correctly.
        # NOTE: We use the same required_ports list as above.
        ports_in_use = _get_ports_in_use_with_names(required_ports)
        if ports_in_use:
            port_msgs = ', '.join([f'{p} ({n})' for p, n in ports_in_use])
            common.print_each_string_after_two_new_lines(
                [
                    'WARNING',
                    'The following ports are still in use after exiting: %s'
                    % port_msgs,
                ]
            )


if __name__ == '__main__':  # pragma: no cover
    main()
