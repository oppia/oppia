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
import sys

import python_utils
from scripts import common

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--disable_compression',
    help='optional; if specified does not serve compressed assets',
    action='store_true')
_PARSER.add_argument(
    '--only_install_nginx',
    help='optional; if specified only instals nginx and does not run the check',
    action='store_true')
FECONF_FILE_PATH = os.path.join('feconf.py')
CONSTANTS_FILE_PATH = os.path.join('assets/constants.ts')
RUNNING_PROCESSES = []
NGINX_PORT = 9999
NGINX_DOWNLOAD_PATH = os.path.join(common.OPPIA_TOOLS_DIR, 'nginx-1.13.1')
NGINX_INSTALL_PATH = os.path.join(common.OPPIA_TOOLS_DIR, 'nginx')
NGINX_BINARY = os.path.join(NGINX_INSTALL_PATH, 'sbin', 'nginx')


def run_lighthouse_checks():
    """Runs the lighthhouse checks through the lighthouserc.json config."""
    node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
    lhci_path = os.path.join(
        'node_modules', '@lhci', 'cli', 'src', 'cli.js')
    bash_command = [node_path, lhci_path, 'autorun']
    process = subprocess.Popen(bash_command, stdout=subprocess.PIPE)

    for line in iter(process.stdout.readline, ''):
        python_utils.PRINT(line[:-1])

    if process.returncode != 0:
        python_utils.PRINT('Checks failed view details above')
        sys.exit(process.returncode)


def download_and_install_nginx():
    """Download and install nginx."""
    python_utils.PRINT('Installing nginx...')
    nginx_download_url = 'https://nginx.org/download/nginx-1.13.1.tar.gz'
    nginx_outfile_name = 'nginx-download'

    python_utils.url_retrieve(nginx_download_url, nginx_outfile_name)
    subprocess.check_call([
        'tar', '-xvzf', nginx_outfile_name, '-C', common.OPPIA_TOOLS_DIR
    ])
    os.remove(nginx_outfile_name)

    #  Nginx depends on zlib for gzip functionality.
    zlib_download_url = 'http://www.zlib.net/zlib-1.2.11.tar.gz'
    zlib_outfile_name = 'zlib-download'
    python_utils.url_retrieve(zlib_download_url, zlib_outfile_name)
    subprocess.check_call([
        'tar', '-xvzf', zlib_outfile_name, '-C', common.OPPIA_TOOLS_DIR
    ])
    zlib_path = os.path.join(common.OPPIA_TOOLS_DIR, 'zlib-1.2.11')
    os.remove(zlib_outfile_name)

    config_filepath = os.path.join(common.CURR_DIR, 'nginx.conf')
    configure_command = [
        './configure', '--prefix=' + NGINX_INSTALL_PATH, '--build=Ubuntu',
        '--without-http_rewrite_module', '--with-zlib=' + zlib_path,
        '--with-http_gzip_static_module', '--conf-path=' + config_filepath
    ]
    with common.CD(NGINX_DOWNLOAD_PATH):
        subprocess.check_call(configure_command)
        subprocess.check_call(['make'])
        subprocess.check_call(['make', 'install'])
        python_utils.PRINT('Installation successful')


def start_proxy_server():
    """Start the nginx proxy server."""
    python_utils.PRINT('Starting proxy server...')
    start_server_command = [NGINX_BINARY]
    proxy_process = subprocess.Popen(start_server_command)
    RUNNING_PROCESSES.append(proxy_process)


def run_lighthouse_checks_with_compression():
    """Run lighthouse checks with compression enabled."""
    python_utils.PRINT('Checking if nginx is installed...')
    if not os.path.exists(NGINX_INSTALL_PATH):
        download_and_install_nginx()

    start_proxy_server()
    common.wait_for_port_to_be_open(NGINX_PORT)
    run_lighthouse_checks()


def cleanup():
    """Kill the running subprocesses and server fired in this program."""
    pattern = 'COMMUNITY_DASHBOARD_ENABLED = .*'
    replace = 'COMMUNITY_DASHBOARD_ENABLED = False'
    common.inplace_replace_file(FECONF_FILE_PATH, pattern, replace)

    pattern = '"ENABLE_ACCOUNT_DELETION": .*'
    replace = '"ENABLE_ACCOUNT_DELETION": false,'
    common.inplace_replace_file(CONSTANTS_FILE_PATH, pattern, replace)

    processes_to_kill = [
        '.*%s.*' % re.escape(NGINX_INSTALL_PATH)
    ]

    for p in RUNNING_PROCESSES:
        p.kill()

    for p in processes_to_kill:
        common.kill_processes_based_on_regex(p)


def enable_webpages():
    """Enables deactivated webpages for testing."""
    pattern = 'COMMUNITY_DASHBOARD_ENABLED = .*'
    replace = 'COMMUNITY_DASHBOARD_ENABLED = True'
    common.inplace_replace_file(FECONF_FILE_PATH, pattern, replace)

    pattern = '"ENABLE_ACCOUNT_DELETION": .*'
    replace = '"ENABLE_ACCOUNT_DELETION": true,'
    common.inplace_replace_file(CONSTANTS_FILE_PATH, pattern, replace)


def main(args=None):
    """Runs lighthouse checks and deletes reports."""
    parsed_args = _PARSER.parse_args(args=args)

    # This is to be used by the CI to only install nginx.
    if parsed_args.only_install_nginx:
        download_and_install_nginx()
        return

    atexit.register(cleanup)
    enable_webpages()
    run_lighthouse_checks_with_compression()


if __name__ == '__main__':
    main()
