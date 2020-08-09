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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import atexit
import os
import re
import subprocess
import time

import python_utils

from . import build
from . import common
from . import install_third_party_libs
# Install third party libraries before importing other files.
install_third_party_libs.main()

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
    '--enable_console',
    help='optional; if specified, enables console.',
    action='store_true')
_PARSER.add_argument(
    '--disable_host_checking',
    help=(
        'optional; if specified, disables host checking so that the dev '
        'server can be accessed by any device on the same network using the '
        'host device\'s IP address. DO NOT use this flag if you\'re running '
        'on an untrusted network.'),
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
    help=(
        'optional; if specified, does not automatically restart when files are '
        'changed.'),
    action='store_true')

PORT_NUMBER_FOR_GAE_SERVER = 8181


def cleanup():
    """Wait for the servers to go down and set constants back to default
    values.
    """
    common.print_each_string_after_two_new_lines([
        'INFORMATION',
        'Cleaning up the servers.'])
    while common.is_port_open(PORT_NUMBER_FOR_GAE_SERVER):
        time.sleep(1)
    build.set_constants_to_default()

    if not common.is_windows_os():
        # Redis does not run on Windows machines.
        python_utils.PRINT('Cleaning up the redis_servers.')
        # Shutdown the redis server before exiting.
        common.stop_redis_server()


def main(args=None):
    """Starts up a development server running Oppia."""
    parsed_args = _PARSER.parse_args(args=args)

    # Runs cleanup function on exit.
    atexit.register(cleanup)

    # Check that there isn't a server already running.
    if common.is_port_open(PORT_NUMBER_FOR_GAE_SERVER):
        common.print_each_string_after_two_new_lines([
            'WARNING',
            'Could not start new server. There is already an existing server',
            'running at port %s.'
            % python_utils.UNICODE(PORT_NUMBER_FOR_GAE_SERVER)])

    clear_datastore_arg = (
        '' if parsed_args.save_datastore else '--clear_datastore=true')
    enable_console_arg = (
        '--enable_console=true' if parsed_args.enable_console else '')
    disable_host_checking_arg = (
        '--enable_host_checking=false'
        if parsed_args.disable_host_checking else '')
    no_auto_restart = (
        '--automatic_restart=no' if parsed_args.no_auto_restart else '')

    build_args = ['--prod_env'] if parsed_args.prod_env else []
    if parsed_args.maintenance_mode:
        build_args.append('--maintenance_mode')
    build.main(args=build_args)
    app_yaml_filepath = 'app.yaml' if parsed_args.prod_env else 'app_dev.yaml'

    # Set up a local dev instance.
    # TODO(sll): Do this in a new shell.
    # To turn emailing on, add the option '--enable_sendmail=yes' and change the
    # relevant settings in feconf.py. Be careful with this -- you do not want to
    # spam people accidentally.
    background_processes = []
    if not parsed_args.prod_env:
        # In prod mode webpack is launched through scripts/build.py
        python_utils.PRINT('Compiling webpack...')
        background_processes.append(subprocess.Popen([
            common.NODE_BIN_PATH,
            os.path.join(
                common.NODE_MODULES_PATH, 'webpack', 'bin', 'webpack.js'),
            '--config', 'webpack.dev.config.ts', '--watch']))
        # Give webpack few seconds to do the initial compilation.
        time.sleep(10)
        # Redis-cli is only required in a development environment.
        python_utils.PRINT('Starting Redis development server.')
        # Start the redis local development server. Redis doesn't run on
        # Windows machines.
        if not common.is_windows_os():
            background_processes.append(common.start_redis_server())
        else:
            raise Exception(
                'Redis command line interface is not installed because your ' +
                'machine is on the Windows operating system. Caching will ' +
                'not work on a Windows machine.')

    python_utils.PRINT('Starting GAE development server')
    background_processes.append(subprocess.Popen(
        'python %s/dev_appserver.py %s %s %s --admin_host 0.0.0.0 --admin_port '
        '8000 --host 0.0.0.0 --port %s %s --skip_sdk_update_check true %s' % (
            common.GOOGLE_APP_ENGINE_HOME, clear_datastore_arg,
            enable_console_arg, disable_host_checking_arg, no_auto_restart,
            python_utils.UNICODE(PORT_NUMBER_FOR_GAE_SERVER),
            app_yaml_filepath), shell=True))

    # Wait for the servers to come up.
    while not common.is_port_open(PORT_NUMBER_FOR_GAE_SERVER):
        time.sleep(1)

    # Launch a browser window.
    if common.is_linux_os() and not parsed_args.no_browser:
        detect_virtualbox_pattern = re.compile('.*VBOX.*')
        if list(filter(
                detect_virtualbox_pattern.match,
                os.listdir('/dev/disk/by-id/'))):
            common.print_each_string_after_two_new_lines([
                'INFORMATION',
                'Setting up a local development server. You can access this '
                'server',
                'by navigating to localhost:%s in a browser window.'
                % python_utils.UNICODE(PORT_NUMBER_FOR_GAE_SERVER)])
        else:
            common.print_each_string_after_two_new_lines([
                'INFORMATION',
                'Setting up a local development server at localhost:%s. '
                % python_utils.UNICODE(PORT_NUMBER_FOR_GAE_SERVER),
                'Opening a default browser window pointing to this server'])
            time.sleep(5)
            background_processes.append(
                subprocess.Popen([
                    'xdg-open', 'http://localhost:%s/'
                    % python_utils.UNICODE(PORT_NUMBER_FOR_GAE_SERVER)]))
    elif common.is_mac_os() and not parsed_args.no_browser:
        common.print_each_string_after_two_new_lines([
            'INFORMATION',
            'Setting up a local development server at localhost:%s. '
            % python_utils.UNICODE(PORT_NUMBER_FOR_GAE_SERVER),
            'Opening a default browser window pointing to this server.'])
        time.sleep(5)
        background_processes.append(
            subprocess.Popen([
                'open', 'http://localhost:%s/'
                % python_utils.UNICODE(PORT_NUMBER_FOR_GAE_SERVER)]))
    else:
        common.print_each_string_after_two_new_lines([
            'INFORMATION',
            'Setting up a local development server. You can access this server',
            'by navigating to localhost:%s in a browser window.'
            % python_utils.UNICODE(PORT_NUMBER_FOR_GAE_SERVER)])

    python_utils.PRINT('Done!')

    for process in background_processes:
        process.wait()


if __name__ == '__main__':
    main()
