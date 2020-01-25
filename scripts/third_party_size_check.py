# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Script that runs a size check in third-party folder and errors if
size limit is exceeded. The aim of this is to prevent us accidentally
breaching the 10k file limit on App Engine.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

import python_utils

_YAML_PATH = os.path.join(os.getcwd(), '..', 'oppia_tools', 'pyyaml-5.1.2')
sys.path.insert(0, _YAML_PATH)

import yaml  # isort:skip  #pylint: disable=wrong-import-position

THIRD_PARTY_PATH = os.path.join(os.getcwd(), 'third_party')
THIRD_PARTY_SIZE_LIMIT = 7000


def _get_skip_files_list():
    """This function returns the list of the files which are skipped when
    Oppia is deployed to GAE.

    Returns:
        list. The list of files which are to be skipped.

    Raises:
        yaml.YAMLError if failed to parse app_dev.yaml.
        IOError if failed to open app_dev.yaml in read mode.
    """
    try:
        with python_utils.open_file('./app_dev.yaml', 'r') as app_dev_yaml:
            try:
                app_dev_yaml_dict = yaml.safe_load(app_dev_yaml)
            except yaml.YAMLError as yaml_exception:
                python_utils.PRINT(yaml_exception)
                sys.exit(1)
            skip_files_list = app_dev_yaml_dict.get('skip_files')

            skip_files_list = [os.getcwd() + '/' + skip_files_dir
                               for skip_files_dir in skip_files_list]

        return skip_files_list
    except IOError as io_error:
        python_utils.PRINT(io_error)
        sys.exit(1)


def _check_size_in_dir(dir_path, skip_files_list):
    """Recursive method that checks the number of files inside the given
    directory.

    Args:
         dir_path: str. The directory which files will be counted.
         skip_files_list: list. The list of files which are to be skipped
         from the file count.

    Returns:
        int. The number of files inside the given directory.
    """
    number_of_files_in_dir = 0
    for name in os.listdir(dir_path):
        file_path = os.path.join(dir_path, name)
        # The dir pattern of skip_files in app_dev.yaml ends with '/'.
        file_path += '/' if os.path.isdir(file_path) else ''
        if file_path in skip_files_list:
            continue
        if os.path.isfile(file_path):
            number_of_files_in_dir += 1
        elif os.path.isdir(file_path):
            number_of_files_in_dir += _check_size_in_dir(
                file_path, skip_files_list)
    return number_of_files_in_dir


def _check_third_party_size():
    """Checks if the third-party size limit has been exceeded."""
    skip_files_list = _get_skip_files_list()
    number_of_files_in_third_party = _check_size_in_dir(
        THIRD_PARTY_PATH, skip_files_list)
    python_utils.PRINT('')
    python_utils.PRINT('------------------------------------------------------')
    python_utils.PRINT('    Number of files in third-party folder: %d' % (
        number_of_files_in_third_party))
    python_utils.PRINT('')
    if number_of_files_in_third_party > THIRD_PARTY_SIZE_LIMIT:
        python_utils.PRINT(
            '    ERROR: The third-party folder size exceeded the %d files'
            ' limit.' % THIRD_PARTY_SIZE_LIMIT)
        python_utils.PRINT(
            '------------------------------------------------------')
        python_utils.PRINT('')
        sys.exit(1)
    else:
        python_utils.PRINT(
            '    The size of third-party folder is within the limits.')
        python_utils.PRINT(
            '------------------------------------------------------')
        python_utils.PRINT('')
        python_utils.PRINT('Done!')
        python_utils.PRINT('')


if __name__ == '__main__':
    python_utils.PRINT('Running third-party size check')
    _check_third_party_size()
    python_utils.PRINT('Third-party folder size check passed.')
    python_utils.PRINT('')
