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

"""Lighthouse checks and store reports script."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re
import subprocess
import sys
import time
import python_utils

from . import common
from . import install_third_party_libs
from . import setup
from . import setup_gae

OPPIA_SERVER_PORT = 8181
COMPY_SERVER_PORT = 9999
RUNNING_PROCESSES = []
GO_VERSION = '1.14.1'
GO_PATH = os.path.join(common.OPPIA_TOOLS_DIR, 'go-%s' % GO_VERSION)
GO_BINARY = os.path.join(GO_PATH, 'bin', 'go')
GO_HOME_PATH = os.path.join(os.path.expanduser('~'), 'go')

COMPY_BINARY = os.path.join(GO_HOME_PATH, 'bin', 'compy')
COMPY_DOWNLOAD_PATH = os.path.join(
    GO_HOME_PATH, 'src', 'github.com', 'barnacs', 'compy')
MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS = 1000


def setup_and_install_dependencies():
    """Run the setup and installation scripts."""

    install_third_party_libs.main()
    setup.main(args=[])
    setup_gae.main(args=[])


def start_google_app_engine_server():
    """Start the Google App Engine server."""
    app_yaml_filepath = 'app.yaml'

    p = subprocess.Popen(
        '%s %s/dev_appserver.py --host 0.0.0.0 --port %s '
        '--clear_datastore=yes --dev_appserver_log_level=critical '
        '--log_level=critical --skip_sdk_update_check=true %s' % (
            common.CURRENT_PYTHON_BIN, common.GOOGLE_APP_ENGINE_HOME,
            OPPIA_SERVER_PORT, app_yaml_filepath), shell=True)
    RUNNING_PROCESSES.append(p)


def download_and_install_go():
    """Download and install GO."""
    outfile_name = 'go-download'

    if common.is_windows_os():
        pass
    else:
        extension = '.tar.gz'

        if common.is_mac_os():
            go_file_name = 'go%s.darwin-amd64' % (GO_VERSION)
        elif common.is_linux_os():
            go_file_name = 'go%s.linux-amd64' % (GO_VERSION)

        url_to_retrieve = 'https://storage.googleapis.com/golang/%s%s' % (
            go_file_name, extension)

        python_utils.url_retrieve(url_to_retrieve, outfile_name)

        subprocess.check_call([
            'tar', '-xvzf', outfile_name, '-C', common.OPPIA_TOOLS_DIR
        ])

    os.rename(
        os.path.join(common.OPPIA_TOOLS_DIR, 'go'),
        GO_PATH)
    python_utils.PRINT('Installation successful')


def download_and_install_compy():
    """Download and install the compy proxy server."""

    subprocess.check_call([GO_BINARY, 'get', 'github.com/barnacs/compy'])
    with common.CD(COMPY_DOWNLOAD_PATH):
        subprocess.check_call([GO_BINARY, 'install'])
    python_utils.PRINT('Installation successful')


def cleanup():
    """Kill the running subprocesses and server fired in this program."""
    dev_appserver_path = '%s/dev_appserver.py' % common.GOOGLE_APP_ENGINE_HOME
    processes_to_kill = [
        '.*%s.*' % re.escape(dev_appserver_path),
        '.*%s.*' % re.escape(COMPY_BINARY)
    ]

    for p in RUNNING_PROCESSES:
        p.kill()

    for p in processes_to_kill:
        common.kill_processes_based_on_regex(p)


def delete_reports():
    """"Delete the reports that are stored in the lighthouse ci folder."""
    bash_command = 'rm -r .lighthouseci'
    process = subprocess.Popen(bash_command.split(), stdout=subprocess.PIPE)
    process.communicate()


def start_proxy_server():
    """Start compy proxy server to serve gzipped assets."""
    ssl_options = '-cert cert.crt -key cert.key -ca ca.crt -cakey ca.key'
    p = subprocess.Popen([COMPY_BINARY, '-host', ':%s' % COMPY_SERVER_PORT,
                          '-gzip', '9', ssl_options])
    RUNNING_PROCESSES.append(p)


def wait_for_port_to_be_open(port_number):
    """Wait until the port is open.
    Args:
        port_number: int. The port number to wait.
    """
    waited_seconds = 0
    while (not common.is_port_open(port_number) and
           waited_seconds < MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS):
        time.sleep(10)
        waited_seconds += 2
    if (waited_seconds ==
            MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS and
            not common.is_port_open(port_number)):
        python_utils.PRINT(
            'Failed to start server on port %s, exiting ...' % port_number)
        sys.exit(1)


def run_lighthouse_checks():
    """Runs the lighthouserc.js config with bash command lhci autorun."""
    bash_command = ['lhci', 'autorun']
    process = subprocess.Popen(bash_command, stdout=subprocess.PIPE)

    for line in iter(process.stdout.readline, ''):
        python_utils.PRINT(line[:-1])

    process.wait()


def main():
    """Runs lighthouse checks and deletes reports."""
    setup_and_install_dependencies()
    run_lighthouse_checks()
    delete_reports()


if __name__ == '__main__':
    main()
