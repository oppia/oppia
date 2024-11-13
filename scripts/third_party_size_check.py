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

from __future__ import annotations

import fnmatch
import os
import sys

from core import utils
from typing import List

THIRD_PARTY_PATH = os.path.join(os.getcwd(), 'third_party')
THIRD_PARTY_SIZE_LIMIT = 15000


def get_skip_files_list() -> List[str]:
    """This function returns the list of the files which are skipped when
    Oppia is deployed to GAE.

    Returns:
        list. The list of files which are to be skipped.

    Raises:
        yaml.YAMLError. If failed to parse .gcloudignore.
        IOError. If failed to open .gcloudignore in read mode.
    """
    try:
        with utils.open_file('.gcloudignore', 'r') as gcloudignore:
            gcloudignore_lines = gcloudignore.read().split('\n')

            skip_files_list = [
                os.path.join(os.getcwd(), gcloudignore_line)
                for gcloudignore_line in gcloudignore_lines
                if not gcloudignore_line.strip().startswith('#')
            ]
        return skip_files_list
    except IOError as io_error:
        print(io_error)
        sys.exit(1)


def _check_size_in_dir(dir_path: str, skip_files_list: List[str]) -> int:
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
            matches_skip_files = any(
                fnmatch.fnmatch(file_path, pattern)
                for pattern in skip_files_list
            )
            if not matches_skip_files:
                number_of_files_in_dir += 1
        elif os.path.isdir(file_path):
            number_of_files_in_dir += _check_size_in_dir(
                file_path, skip_files_list)
    return number_of_files_in_dir


def check_third_party_size() -> None:
    """Checks if the third-party size limit has been exceeded."""
    skip_files_list = get_skip_files_list()
    number_of_files_in_third_party = _check_size_in_dir(
        THIRD_PARTY_PATH, skip_files_list)
    print('')
    print('------------------------------------------------------')
    print('    Number of files in third-party folder: %d' % (
        number_of_files_in_third_party))
    print('')
    if number_of_files_in_third_party > THIRD_PARTY_SIZE_LIMIT:
        print(
            '    ERROR: The third-party folder size exceeded the %d files'
            ' limit.' % THIRD_PARTY_SIZE_LIMIT)
        print('------------------------------------------------------')
        print('')
        sys.exit(1)
    else:
        print('    The size of third-party folder is within the limits.')
        print('------------------------------------------------------')
        print('')
        print('Done!')
        print('')


if __name__ == '__main__': # pragma: no cover
    print('Running third-party size check')
    check_third_party_size()
    print('Third-party folder size check passed.')
    print('')
