import os
import python_utils
import subprocess
import sys
import re
import atexit
import time

from . import common
from . import install_third_party_libs
from . import setup
from . import setup_gae
from . import build

OPPIA_SERVER_PORT = 8181
COMPY_SERVER_PORT = 9999
RUNNING_PROCESSES = []
GO_VERSION = "1.12.9"
GO_PATH = os.path.join(common.OPPIA_TOOLS_DIR, 'go-%s' % GO_VERSION)
GO_BINARY = os.path.join(GO_PATH, 'bin', 'go')
GO_HOME_PATH = os.path.join(os.path.expanduser('~'), 'go')

COMPY_BINARY = os.path.join(GO_HOME_PATH, 'bin', 'compy')
COMPY_DOWNLOAD_PATH = os.path.join(
    GO_HOME_PATH, 'src', 'github.com', 'barnacs', 'compy')
MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS = 1000


def setup_and_install_dependencies():
    """Run the setup and installation scripts."""

    # install_third_party_libs.main()
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

    if(common.is_windows_os()):
        pass
    else:
        extension = '.tar.gz'

        if (common.is_mac_os()):
            go_file_name = 'go%s.darwin-amd64' % (GO_VERSION)
        elif(common.is_linux_os()):
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


def start_proxy_server():
    """Start compy proxy server to serve gzipped assets."""
    ssl_options = '-cert cert.crt -key cert.key -ca ca.crt -cakey ca.key'
    p = subprocess.Popen([COMPY_BINARY, '-host', ':%s' % COMPY_SERVER_PORT,
        '-gzip', '9'])
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
    """Run lighthouse checks."""
    pass


def main():
    cleanup()
    if(common.is_port_open(OPPIA_SERVER_PORT)):
        python_utils.PRINT(
                'There is already a server running on localhost:%s.'
                'Please terminate it before running the lighthouse checks.'
                'Exiting.' % OPPIA_SERVER_PORT)
        sys.exit(1)

    setup_and_install_dependencies()

    python_utils.PRINT('Checking if GO is installed in %s' % GO_PATH)
    if not os.path.exists(GO_PATH):
        python_utils.PRINT('Downloading and installing GO...')
        download_and_install_go()

    python_utils.PRINT('Checking if Compy is installed in %s' % COMPY_BINARY)
    if not os.path.exists(COMPY_BINARY):
        python_utils.PRINT('Downloading and installing Compy Proxy Server...')
        download_and_install_compy()


    atexit.register(cleanup)


    python_utils.PRINT('Generating files for production mode...')
    build.main(args=['--prod_env'])

    start_google_app_engine_server()
    wait_for_port_to_be_open(OPPIA_SERVER_PORT)
    start_proxy_server()

    # Action to run lighthouse checks.
    run_lighthouse_checks()


if __name__ == "__main__":
    main()
