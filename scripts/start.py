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

"""INSTRUCTIONS:

This script starts up a development server running Oppia. It installs any
missing third-party dependencies and starts up a local GAE development
server.

Run the script from the oppia root folder:

  python -m scripts.start

Note that the root folder MUST be named 'oppia'.
"""
from __future__ import absolute_import  # pylint: disable=import-only-modules

import argparse
import atexit
import fileinput
import os
import re
import subprocess
import time

import python_utils

from . import common
from . import install_third_party_libs
from . import setup
from . import setup_gae
from . import vagrant_lock

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--save_datastore',
    help='optional; if specified, does not clear the datastore.',
    action='store_true')
_PARSER.add_argument(
    '--enable_console',
    help='optional; if specified, enables console.',
    action='store_true')
_PARSER.add_argument(
    '--prod_env',
    help='optional; if specified, runs Oppia in a production environment.',
    action='store_true')
_PARSER.add_argument(
    '--no_browser',
    help='optional; if specified, does not open a browser.',
    action='store_true')


def cleanup():
    """Function for waiting for the servers to go down."""
    python_utils.PRINT('')
    python_utils.PRINT('INFORMATION')
    python_utils.PRINT('Cleaning up the servers.')
    python_utils.PRINT('')
    while not common.is_port_open(8181):
        time.sleep(1)


def main():
    """Starts up a development server running Oppia."""
    if os.path.isfile('/etc/is_vagrant_vm'):
        vagrant_lock.main()

    setup.main()
    setup_gae.main()

    # Runs cleanup function on exit.
    atexit.register(cleanup)

    # Install third party dependencies.
    install_third_party_libs.main()

    python_utils.PRINT('Oppia setup complete!')

    # Check that there isn't a server already running.
    if not common.is_port_open(8181):
        python_utils.PRINT('')
        python_utils.PRINT('WARNING')
        python_utils.PRINT(
            'Could not start new server. There is already an existing server')
        python_utils.PRINT('running at port 8181.')
        python_utils.PRINT('')

    parsed_args = _PARSER.parse_args()
    clear_datastore_arg = (
        '' if parsed_args.save_datastore else '--clear_datastore=true')
    enable_console_arg = (
        '--enable_console=true' if parsed_args.enable_console else '')

    if parsed_args.prod_env:
        constants_env_variable = '\'DEV_MODE\': false'
        for line in fileinput.input(
                files=['assets/constants.js'], inplace=True):
            python_utils.PRINT(
                re.sub(
                    '\'DEV_MODE\': .*', constants_env_variable, line), end='')
        subprocess.call(
            'python -m scripts.build --prod_env --enable_watcher'.split())
        app_yaml_filepath = 'app.yaml'
    else:
        constants_env_variable = '\'DEV_MODE\': true'
        for line in fileinput.input(
                files=['assets/constants.js'], inplace=True):
            python_utils.PRINT(
                re.sub(
                    '\'DEV_MODE\': .*', constants_env_variable, line), end='')
        subprocess.call('python -m scripts.build --enable_watcher'.split())
        app_yaml_filepath = 'app_dev.yaml'

    # Set up a local dev instance.
    # TODO(sll): do this in a new shell.
    # To turn emailing on, add the option '--enable_sendmail=yes' and change the
    # relevant settings in feconf.py. Be careful with this -- you do not want to
    # spam people accidentally.
    background_processes = []
    if not parsed_args.prod_env:
        background_processes.append(subprocess.Popen((
            '%s/bin/node node_modules/gulp/bin/gulp.js watch'
            % common.NODE_PATH).split()))
        # In prod mode webpack is launched through scripts/build.py
        python_utils.PRINT('Compiling webpack...')
        subprocess.call(
            'node_modules/webpack/bin/webpack.js --config webpack.dev.config.ts'
            .split())
        background_processes.append(subprocess.Popen(
            'node_modules/webpack/bin/webpack.js --config webpack.dev.config.ts'
            ' --watch'.split()))

    python_utils.PRINT('Starting GAE development server')
    background_processes.append(subprocess.Popen((
        'python %s/dev_appserver.py %s %s --admin_host 0.0.0.0 --admin_port '
        '8000 --host 0.0.0.0 --port 8181 --skip_sdk_update_check true %s'
        % (
            common.GOOGLE_APP_ENGINE_HOME, clear_datastore_arg,
            enable_console_arg, app_yaml_filepath)).split()))

    # Wait for the servers to come up.
    while common.is_port_open(8181):
        time.sleep(1)

    os_info = os.uname()
    # Launch a browser window.
    if os_info[0] == 'Linux' and not parsed_args.no_browser:
        detect_virtualbox_pattern = re.compile('.*VBOX.*')
        if list(filter(
                detect_virtualbox_pattern.match,
                os.listdir('/dev/disk/by-id/'))):
            python_utils.PRINT('')
            python_utils.PRINT('INFORMATION')
            python_utils.PRINT(
                'Setting up a local development server. You can access this '
                'server')
            python_utils.PRINT(
                'by navigating to localhost:8181 in a browser window.')
            python_utils.PRINT('')
        else:
            python_utils.PRINT('')
            python_utils.PRINT('INFORMATION')
            python_utils.PRINT(
                'Setting up a local development server at localhost:8181. '
                'Opening a')
            python_utils.PRINT('default browser window pointing to this server')
            python_utils.PRINT('')
            time.sleep(5)
            background_processes.append(
                subprocess.Popen('xdg-open http://localhost:8181/'.split()))
    elif os_info[0] == 'Darwin' and not parsed_args.no_browser:
        python_utils.PRINT('')
        python_utils.PRINT('INFORMATION')
        python_utils.PRINT(
            'Setting up a local development server at localhost:8181. '
            'Opening a')
        python_utils.PRINT('default browser window pointing to this server.')
        python_utils.PRINT('')
        time.sleep(5)
        background_processes.append(
            subprocess.Popen('open http://localhost:8181/'.split()))
    else:
        python_utils.PRINT('')
        python_utils.PRINT('INFORMATION')
        python_utils.PRINT(
            'Setting up a local development server. You can access this server')
        python_utils.PRINT(
            'by navigating to localhost:8181 in a browser window.')
        python_utils.PRINT('')

    python_utils.PRINT('Done!')

    for process in background_processes:
        process.wait()


if __name__ == '__main__':
    main()
