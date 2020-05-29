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
import os
import re
import shutil
import subprocess

import python_utils
from scripts import build
from scripts import common
from scripts import install_third_party_libs

_PARSER = argparse.ArgumentParser()

_PARSER.add_argument(
    "--enable_compression",
    help='optional; if specified, uses nginx to serve compressed assets',
    action='store_true')

RUNNING_PROCESSES = []

APP_ENGINE_PORT = 8181
NGINX_PORT = 9999


def setup_and_install_dependencies():
    """Runs the setup and installation scripts."""
    install_third_party_libs.main()


def run_lighthouse_checks():
    """Runs the lighthhouse checks through the lighthouserc.json config."""
    node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
    lhci_path = os.path.join(
        'node_modules', '@lhci', 'cli', 'src', 'cli.js')
    bash_command = [node_path, lhci_path, 'autorun']
    process = subprocess.Popen(bash_command, stdout=subprocess.PIPE)

    for line in iter(process.stdout.readline, ''):
        python_utils.PRINT(line[:-1])


def start_google_app_engine_server(prodEnv):
    """Start the Google App Engine server."""
    if prodEnv:
        app_yaml_filepath = 'app.yaml'
    else:
        app_yaml_filepath = 'app_dev.yaml'

    python_utils.PRINT('Starting oppia server...')

    p = subprocess.Popen(
        '%s %s/dev_appserver.py --host 0.0.0.0 --port %s '
        '--clear_datastore=yes --dev_appserver_log_level=critical '
        '--log_level=critical --skip_sdk_update_check=true %s' % (
            common.CURRENT_PYTHON_BIN, common.GOOGLE_APP_ENGINE_HOME,
            APP_ENGINE_PORT, app_yaml_filepath), shell=True)
    RUNNING_PROCESSES.append(p)


def download_and_install_nginx():
    """Download and install nginx"""
    python_utils.PRINT('Installing nginx...')
    update_command = ['sudo', 'apt-get', 'update']
    install_command = ['sudo', 'apt-get', 'install', 'nginx']

    subprocess.check_call(update_command)
    subprocess.check_call(install_command)


def wait_for_port_to_be_open(port_number):
    """Wait until the port is open.

    Args:
        port_number: int. The port number to wait.
    """
    waited_seconds = 0
    while (not common.is_port_open(port_number) and
           waited_seconds < MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS):
        time.sleep(1)
        waited_seconds += 1
    if (waited_seconds ==
            MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS and
            not common.is_port_open(port_number)):
        python_utils.PRINT(
            'Failed to start server on port %s, exiting ...' % port_number)
        sys.exit(1)


def start_proxy_server():
    nginx_conf_file = os.path.join(
        common.OPPIA_TOOLS_DIR, 'nginx.conf')
    with python_utils.open_file(nginx_conf_file, 'w') as f:
        f.write("""
            events {

            }
            http {
                server {
                    listen 9999;

                    gzip                on;
                    gzip_buffers        16 8k;
                    gzip_comp_level     9;
                    gzip_http_version   1.1;
                    gzip_proxied        any;
                    gzip_types          *;
                    gzip_vary           on;

                    location / {
                        proxy_set_header x-real-IP $remote_addr;
                        proxy_set_header x-forwarded-for $proxy_add_x_forwarded_for;
                        proxy_set_header host $host;
                        proxy_pass http://127.0.0.1:8181;
                    }
                }
            }
        """)

    python_utils.PRINT('Starting proxy server...')
    start_server_command = ['sudo', 'nginx', '-c', nginx_conf_file]
    p = subprocess.Popen(start_server_command);

    RUNNING_PROCESSES.append(p)


def run_lighthouse_checks_with_compression():
    """Run lighthouse checks with compression enabled."""
    # Check if nginx is installed
    try:
        python_utils.PRINT('Checking if nginx is installed...')
        check_nginx_command = ['which', 'nginx']
        subprocess.check_call(check_nginx_command)
    except subprocess.CalledProcessError:
        download_and_install_nginx()

    start_proxy_server()
    build.main(args=['--prod_env'])
    start_google_app_engine_server(True)
    wait_for_port_to_be_open(NGINX_PORT)
    wait_for_port_to_be_open(APP_ENGINE_PORT)
    run_lighthouse_checks()


def cleanup():
    """Kill the running subprocesses and server fired in this program."""
    dev_appserver_path = '%s/dev_appserver.py' % common.GOOGLE_APP_ENGINE_HOME
    processes_to_kill = [
        '.*%s.*' % re.escape(dev_appserver_path),
        '.*%s.*' % re.escape('nginx')
    ]

    for p in RUNNING_PROCESSES:
        p.kill()

    for p in processes_to_kill:
        common.kill_processes_based_on_regex(p)


def main(args=None):
    """Runs lighthouse checks and deletes reports."""
    parsed_args = _PARSER.parse_args(args=args)
    atexit.register(cleanup)
    setup_and_install_dependencies()
    if parsed_args.enable_compression:
        run_lighthouse_checks_with_compression()
    else:
        start_google_app_engine_server(False)
        wait_for_port_to_be_open(APP_ENGINE_PORT)
        run_lighthouse_checks()


if __name__ == '__main__':
    main()
