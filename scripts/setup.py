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

"""This file should not be invoked directly, but called from other Python
scripts. Python execution environent set up for all scripts.
"""
from __future__ import absolute_import  # pylint: disable=import-only-modules

import os
import shutil
import subprocess
import sys
import tarfile

import python_utils

from . import common


def delete_directory_tree(directory_path):
    """Recursively delete an existing directory tree. Does not do anything if
    directory does not exists.

    Args:
        directory_path: str. Directory path to be deleted.
    """
    if not os.path.exists(directory_path):
        return
    shutil.rmtree(directory_path)


def create_directory(directory_path):
    """Creates a new directory. Does not do anything if directory already
    exists.

    Args:
        directory_path: str. Directory path to be created.
    """
    if os.path.exists(directory_path):
        return
    os.makedirs(directory_path)


# This function takes a command for python as its only input.
# It checks this input for a specific version of python and returns false
# if it does not match the expected prefix.
def test_python_version():
    running_python_version = '{0[0]}.{0[1]}'.format(sys.version_info)
    if running_python_version != '2.7':
        python_utils.PRINT('Please use Python2.7. Exiting...')
        # If OS is Windows, print helpful error message about adding Python to
        # path.
        os_info = os.uname()
        if os_info[0] != 'Darwin' and os_info[0] != 'Linux':
            python_utils.PRINT(
                'It looks like you are using Windows. If you have Python '
                'installed,')
            python_utils.PRINT(
                'make sure it is in your PATH and that PYTHONPATH is set.')
            python_utils.PRINT(
                'If you have two versions of Python (ie, Python 2.7 and 3), '
                'specify 2.7 before other versions of Python when setting the '
                'PATH.')
            python_utils.PRINT('Here are some helpful articles:')
            python_utils.PRINT(
                'http://docs.python-guide.org/en/latest/starting/install/win/')
            python_utils.PRINT(
                'https://stackoverflow.com/questions/3701646/how-to-add-to-the-'
                'pythonpath-in-windows-7')
        # Exit when no suitable Python environment can be found.
        sys.exit(1)


def main():
    """Runs the script to setup Oppia."""
    test_python_version()

    # The second option allows this script to also be run from deployment
    # folders.
    if not os.getcwd().endswith('oppia') and not os.getcwd().endswith(
            'deploy-'):
        python_utils.PRINT('')
        python_utils.PRINT(
            'WARNING   This script should be run from the oppia/ root folder.')
        python_utils.PRINT('')
        sys.exit(1)

    # Set COMMON_DIR to the absolute path of the directory above OPPIA_DIR. This
    # is necessary becaue COMMON_DIR (or subsequent variables which refer to it)
    # may use it in a situation where relative paths won't work as expected(such
    # as $PYTHONPATH).
    create_directory(common.OPPIA_TOOLS_DIR)
    create_directory('third_party/')
    create_directory('node_modules/')

    os_info = os.uname()
    if os_info[0] != 'Darwin' and os_info[0] != 'Linux':
        # Node is a requirement for all installation scripts. Here, we check if
        # the OS supports node.js installation; if not, we exit with an error.
        python_utils.PRINT('')
        python_utils.PRINT(
            'WARNING: Unsupported OS for installation of node.js.')
        python_utils.PRINT(
            'If you are running this script on Windows, see the instructions')
        python_utils.PRINT(
            'here regarding installation of node.js:')
        python_utils.PRINT('')
        python_utils.PRINT(
            'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Windows'
            '%29')
        python_utils.PRINT('')
        python_utils.PRINT(
            'STATUS: Installation completed except for node.js. Exiting.')
        python_utils.PRINT('')
        sys.exit(1)

    # Download and install node.js.
    python_utils.PRINT(
        'Checking if node.js is installed in %s' % common.OPPIA_TOOLS_DIR)
    if not os.path.exists(common.NODE_PATH):
        python_utils.PRINT('Installing Node.js')
        if os_info[0] == 'Darwin':
            if os_info[4] == 'x86_64':
                node_file_name = 'node-v10.15.3-darwin-x64'
            else:
                node_file_name = 'node-v10.15.3-darwin-x86'
        elif os_info[0] == 'Linux':
            if os_info[4] == 'x86_64':
                node_file_name = 'node-v10.15.3-linux-x64'
            else:
                node_file_name = 'node-v10.15.3-linux-x86'

        python_utils.url_retrieve(
            'https://nodejs.org/dist/v10.15.3/%s.tar.gz' % node_file_name,
            filename='node-download.tgz')
        tar = tarfile.open(name='node-download.tgz')
        tar.extractall(path=common.OPPIA_TOOLS_DIR)
        tar.close()
        os.remove('node-download.tgz')
        os.rename(
            os.path.join(common.OPPIA_TOOLS_DIR, node_file_name),
            common.NODE_PATH)

    # Change ownership of $NODE_MODULE_DIR.
    # Note: on some machines, these commands seem to take quite a long time.
    common.recursive_chown('node_modules/', os.getuid(), -1)
    common.recursive_chmod('node_modules/', 744)

    # Adjust path to support the default Chrome locations for Unix, Windows and
    # Mac OS.
    if os.environ.get('TRAVIS'):
        chrome_bin = '/usr/bin/chromium-browser'
    elif os.environ.get('VAGRANT') or os.path.isfile('/etc/is_vagrant_vm'):
        # XVFB is required for headless testing in Vagrant.
        subprocess.call('sudo apt-get install xvfb chromium-browser'.split())
        chrome_bin = '/usr/bin/chromium-browser'
        # Used in frontend and e2e tests. Only gets set if using Vagrant VM.
        os.environ['XVFB_PREFIX'] = '/usr/bin/xvfb-run'
        # Enforce proper ownership on oppia, oppia_tools, and node_modules or
        # else NPM installs will fail.
        subprocess.call(
            'sudo chown -R vagrant.vagrant /home/vagrant/oppia '
            '/home/vagrant/oppia_tools /home/vagrant/node_modules'.split())
    elif os.path.isfile('/usr/bin/google-chrome'):
        # Unix.
        chrome_bin = '/usr/bin/google-chrome'
    elif os.path.isfile('/usr/bin/chromium-browser'):
        # Unix.
        chrome_bin = '/usr/bin/chromium-browser'
    elif os.path.isfile(
            '/c/Program Files (x86)/Google/Chrome/Application/chrome.exe'):
        # Windows.
        chrome_bin = (
            '/c/Program Files (x86)/Google/Chrome/Application/chrome.exe')
    elif os.path.isfile(
            '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe'):
        # WSL.
        chrome_bin = (
            '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe')
    elif os.path.isfile(
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'):
        # Mac OS.
        chrome_bin = (
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    else:
        python_utils.PRINT('Chrome is not found, stopping ...')
        sys.exit(1)

    os.environ['CHROME_BIN'] = chrome_bin
    python_utils.PRINT('Environment setup completed.')


if __name__ == '__main__':
    main()
