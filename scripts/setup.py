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
import subprocess
import sys
import tarfile

import python_utils

from . import clean
from . import common

_PARSER = argparse.ArgumentParser(
    description="""
Python execution environent set up for all scripts.
""")


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
        if common.is_windows_os():
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
        raise Exception('No suitable python version found.')


def download_and_install_package(url_to_retrieve, filename):
    """Downloads and installs package in Oppia tools directory.

    Args:
        url_to_retrieve: string. The url from which package is to be
            downloaded.
        filename: string. The name of the tar file.
    """
    python_utils.url_retrieve(url_to_retrieve, filename=filename)
    tar = tarfile.open(name=filename)
    tar.extractall(path=common.OPPIA_TOOLS_DIR)
    tar.close()
    rename_yarn_folder(filename, common.OPPIA_TOOLS_DIR)
    os.remove(filename)


def rename_yarn_folder(filename, path):
    """Removes the `v` from the yarn folder name.

    Args:
        filename: string. The name of the tar file.
        path: string. The path of the yarn file.
    """
    if 'yarn' in filename:
        old_name = filename.split('.tar.gz')[0]
        new_name = ''.join(old_name.split('v'))
        os.rename(path + '/' + old_name, path + '/' + new_name)


def download_and_install_node():
    """Download and install node to Oppia tools directory."""
    outfile_name = 'node-download'

    if common.is_windows_os():
        if common.is_x64_architecture():
            architecture = 'x64'
        else:
            architecture = 'x86'

        extension = '.zip'
        node_file_name = 'node-v%s-win-%s' % (
            common.NODE_VERSION, architecture)
        url_to_retrieve = 'https://nodejs.org/dist/v%s/%s%s' % (
            common.NODE_VERSION, node_file_name, extension)
        python_utils.url_retrieve(url_to_retrieve, filename=outfile_name)
        subprocess.check_call(
            ['powershell.exe', '-c', 'expand-archive',
             outfile_name, '-DestinationPath',
             common.OPPIA_TOOLS_DIR])
    else:
        extension = '.tar.gz'
        if common.is_x64_architecture():
            if common.is_mac_os():
                node_file_name = 'node-v%s-darwin-x64' % (common.NODE_VERSION)
            elif common.is_linux_os():
                node_file_name = 'node-v%s-linux-x64' % (common.NODE_VERSION)
        else:
            node_file_name = 'node-v%s' % common.NODE_VERSION
        download_and_install_package(
            'https://nodejs.org/dist/v%s/%s%s' % (
                common.NODE_VERSION, node_file_name, extension),
            outfile_name)
    os.rename(
        os.path.join(common.OPPIA_TOOLS_DIR, node_file_name),
        common.NODE_PATH)
    if node_file_name == 'node-v%s' % common.NODE_VERSION:
        with common.CD(common.NODE_PATH):
            subprocess.check_call(['./configure'])
            subprocess.check_call(['make'])


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
        raise Exception('Invalid root directory.')

    # Set COMMON_DIR to the absolute path of the directory above OPPIA_DIR. This
    # is necessary becaue COMMON_DIR (or subsequent variables which refer to it)
    # may use it in a situation where relative paths won't work as expected(such
    # as $PYTHONPATH).
    create_directory(common.OPPIA_TOOLS_DIR)
    create_directory(common.THIRD_PARTY_DIR)
    common.create_readme(
        common.THIRD_PARTY_DIR,
        'This folder contains third party libraries used in Oppia codebase.\n'
        'You can regenerate this folder by deleting it and then running '
        'the start.py script.\n')
    create_directory(common.NODE_MODULES_PATH)
    common.create_readme(
        common.NODE_MODULES_PATH,
        'This folder contains node utilities used in Oppia codebase.\n'
        'You can regenerate this folder by deleting it and then running '
        'the start.py script.\n')

    # Download and install node.js.
    python_utils.PRINT(
        'Checking if node.js is installed in %s' % common.OPPIA_TOOLS_DIR)
    if not os.path.exists(common.NODE_PATH):
        python_utils.PRINT('Installing Node.js')
        download_and_install_node()
    # Change ownership of node_modules.
    # Note: on some machines, these commands seem to take quite a long time.
    if not common.is_windows_os():
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
        yarn_file_name = 'yarn-v%s.tar.gz' % common.YARN_VERSION
        download_and_install_package(
            'https://github.com/yarnpkg/yarn/releases/download/v%s/%s'
            % (common.YARN_VERSION, yarn_file_name), yarn_file_name)

    # Adjust path to support the default Chrome locations for Unix, Windows and
    # Mac OS.
    if os.path.isfile('/usr/bin/google-chrome'):
        # Unix.
        chrome_bin = '/usr/bin/google-chrome'
    elif os.path.isfile('/usr/bin/chromium-browser'):
        # Unix.
        chrome_bin = '/usr/bin/chromium-browser'
    elif os.path.isfile('/usr/bin/chromium'):
        # Arch Linux.
        chrome_bin = '/usr/bin/chromium'
    elif os.path.isfile(
            '/c/Program Files (x86)/Google/Chrome/Application/chrome.exe'):
        # Windows.
        chrome_bin = (
            '/c/Program Files (x86)/Google/Chrome/Application/chrome.exe')
    elif os.path.isfile(
            'c:\\Program Files (x86)\\Google\\Chrome\\Application\\Chrome.exe'):
        chrome_bin = (
            'c:\\Program Files (x86)\\Google\\Chrome\\Application\\Chrome.exe')
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
        raise Exception('Chrome not found.')

    os.environ['CHROME_BIN'] = chrome_bin
    python_utils.PRINT('Environment setup completed.')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when setup.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
