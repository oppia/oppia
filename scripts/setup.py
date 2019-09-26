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

"""Python execution environent set up for all scripts."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import os
import shutil
import sys
import tarfile

import python_utils

from . import clean
from . import common

_PARSER = argparse.ArgumentParser(description="""
Python execution environent set up for all scripts.
""")


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
            common.print_each_string_after_two_new_lines([
                'It looks like you are using Windows. If you have Python '
                'installed,',
                'make sure it is in your PATH and that PYTHONPATH is set.',
                'If you have two versions of Python (ie, Python 2.7 and 3), '
                'specify 2.7 before other versions of Python when setting the '
                'PATH.',
                'Here are some helpful articles:',
                'http://docs.python-guide.org/en/latest/starting/install/win/',
                'https://stackoverflow.com/questions/3701646/how-to-add-to-the-'
                'pythonpath-in-windows-7'])
        # Exit when no suitable Python environment can be found.
        raise Exception


def main(args=None):
    """Runs the script to setup Oppia."""
    unused_parsed_args = _PARSER.parse_args(args=args)
    test_python_version()

    # The second option allows this script to also be run from deployment
    # folders.
    if not os.getcwd().endswith('oppia') and not os.getcwd().endswith(
            'deploy-'):
        python_utils.PRINT('')
        python_utils.PRINT(
            'WARNING   This script should be run from the oppia/ root folder.')
        python_utils.PRINT('')
        raise Exception

    # Set COMMON_DIR to the absolute path of the directory above OPPIA_DIR. This
    # is necessary becaue COMMON_DIR (or subsequent variables which refer to it)
    # may use it in a situation where relative paths won't work as expected(such
    # as $PYTHONPATH).
    create_directory(common.OPPIA_TOOLS_DIR)
    create_directory(common.THIRD_PARTY_DIR)
    create_directory(common.NODE_MODULES_PATH)

    os_info = os.uname()
    if os_info[0] != 'Darwin' and os_info[0] != 'Linux':
        # Node is a requirement for all installation scripts. Here, we check if
        # the OS supports node.js installation; if not, we exit with an error.
        common.print_each_string_after_two_new_lines([
            'WARNING: Unsupported OS for installation of node.js.',
            'If you are running this script on Windows, see the instructions',
            'here regarding installation of node.js:',
            'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Windows'
            '%29',
            'STATUS: Installation completed except for node.js. Exiting.'])
        raise Exception

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

    # Change ownership of node_modules.
    # Note: on some machines, these commands seem to take quite a long time.
    common.recursive_chown(common.NODE_MODULES_PATH, os.getuid(), -1)
    common.recursive_chmod(common.NODE_MODULES_PATH, 0o744)

    # Download and install yarn.
    python_utils.PRINT(
        'Checking if yarn is installed in %s' % common.OPPIA_TOOLS_DIR)
    if not os.path.exists(common.YARN_PATH):
        python_utils.PRINT('Removing package-lock.json')
        clean.delete_file('package-lock.json')
        common.print_each_string_after_two_new_lines([
            'Installing yarn',
            'WARNING: Please note that Oppia uses Yarn to manage node packages',
            'do *NOT* use npm. For more information on how to use yarn,',
            'visit https://yarnpkg.com/en/docs/usage.'])

        # NB: Update .yarnrc if the yarn version below is changed.
        yarn_version = 'v1.17.3'
        yarn_file_name = 'yarn-%s.tar.gz' % yarn_version
        python_utils.url_retrieve(
            'https://github.com/yarnpkg/yarn/releases/download/%s/%s'
            % (yarn_version, yarn_file_name),
            filename=yarn_file_name)
        tar = tarfile.open(name=yarn_file_name)
        tar.extractall(path=common.OPPIA_TOOLS_DIR)
        tar.close()
        os.remove(yarn_file_name)

    # Adjust path to support the default Chrome locations for Unix, Windows and
    # Mac OS.
    if os.environ.get('TRAVIS'):
        chrome_bin = '/usr/bin/chromium-browser'
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
        raise Exception

    os.environ['CHROME_BIN'] = chrome_bin
    python_utils.PRINT('Environment setup completed.')


if __name__ == '__main__':
    main()
