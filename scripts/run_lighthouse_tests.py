# Copyright 2020 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""This script performs lighthouse checks and creates lighthouse reports."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import atexit
import fileinput
import os
import re
import subprocess

import python_utils
from scripts import build
from scripts import common

_PARSER = argparse.ArgumentParser()

_PARSER.add_argument(
    '--disable_compression',
    help='optional; if specified does not serve compressed assets',
    action='store_true')

RUNNING_PROCESSES = []

APP_ENGINE_PORT = 8181
NGINX_PORT = 9999


def run_lighthouse_checks():
    """Runs the lighthhouse checks through the lighthouserc.json config."""
    node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
    lhci_path = os.path.join(
        'node_modules', '@lhci', 'cli', 'src', 'cli.js')
    bash_command = [node_path, lhci_path, 'autorun']
    process = subprocess.Popen(bash_command, stdout=subprocess.PIPE)

    for line in iter(process.stdout.readline, ''):
        python_utils.PRINT(line[:-1])


def start_google_app_engine_server():
    """Start the Google App Engine server."""
    app_yaml_filepath = 'app.yaml'

    python_utils.PRINT('Starting oppia server...')

    p = subprocess.Popen(
        '%s %s/dev_appserver.py --host 0.0.0.0 --port %s '
        '--clear_datastore=yes --dev_appserver_log_level=critical '
        '--log_level=critical --skip_sdk_update_check=true %s' % (
            common.CURRENT_PYTHON_BIN, common.GOOGLE_APP_ENGINE_HOME,
            APP_ENGINE_PORT, app_yaml_filepath), shell=True)
    RUNNING_PROCESSES.append(p)


def download_and_install_nginx():
    """Download and install nginx."""
    python_utils.PRINT('Installing nginx...')
    update_command = ['sudo', 'apt', 'update']
    install_command = ['sudo', 'apt', 'install', 'nginx']

    subprocess.check_call(update_command)
    subprocess.check_call(install_command)


def start_proxy_server():
    """Start the nginx proxy server."""
    filepath = os.path.join(common.CURR_DIR, 'nginx.conf')

    python_utils.PRINT('Starting proxy server...')
    start_server_command = ['sudo', 'nginx', '-c', filepath]
    subprocess.Popen(start_server_command)



def run_lighthouse_checks_with_compression():
    """Run lighthouse checks with compression enabled."""
    try:
        python_utils.PRINT('Checking if nginx is installed...')
        check_nginx_command = ['which', 'nginx']
        subprocess.check_call(check_nginx_command)
    except subprocess.CalledProcessError:
        download_and_install_nginx()

    constants_env_variable = '"DEV_MODE": false'
    for line in fileinput.input(
            files=[os.path.join('assets', 'constants.ts')], inplace=True):
        # Inside this loop the STDOUT will be redirected to the file,
        # constants.ts. The end='' is needed to avoid double line breaks.
        python_utils.PRINT(
            re.sub(
                r'"DEV_MODE": .*', constants_env_variable, line), end='')

    start_google_app_engine_server()
    common.wait_for_port_to_be_open(APP_ENGINE_PORT)
    start_proxy_server()
    common.wait_for_port_to_be_open(NGINX_PORT)
    run_lighthouse_checks()


def cleanup():
    """Kill the running subprocesses and server fired in this program."""
    dev_appserver_path = '%s/dev_appserver.py' % common.GOOGLE_APP_ENGINE_HOME
    processes_to_kill = [
        '.*%s.*' % re.escape(dev_appserver_path)
    ]

    for p in RUNNING_PROCESSES:
        p.kill()

    for p in processes_to_kill:
        common.kill_processes_based_on_regex(p)

    stop_server_command = ['sudo', 'service', 'nginx', 'stop']
    subprocess.Popen(stop_server_command)


def main(args=None):
    """Runs lighthouse checks and deletes reports."""
    parsed_args = _PARSER.parse_args(args=args)
    atexit.register(cleanup)
    build.main(args=['--prod_env'])

    if parsed_args.disable_compression:
        start_google_app_engine_server()
        common.wait_for_port_to_be_open(APP_ENGINE_PORT)
        run_lighthouse_checks()
    else:
        run_lighthouse_checks_with_compression()


if __name__ == '__main__':
    main()
