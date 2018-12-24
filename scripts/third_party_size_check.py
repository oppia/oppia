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

import os
import sys

THIRD_PARTY_PATH = os.path.join(os.getcwd(), 'third_party')
THIRD_PARTY_SIZE_LIMIT = 7000


def _check_size_in_dir(dir_path):
    """Recursive method that checks the number of files inside the given
    directory.

    Args:
         dir_path: str. The directory which files will be counted.

    Returns:
        The number of files inside the given directory.
    """
    number_of_files_in_dir = 0
    for name in os.listdir(dir_path):
        if os.path.isfile(os.path.join(dir_path, name)):
            number_of_files_in_dir += 1
        else:
            if os.path.isdir(os.path.join(dir_path, name)):
                number_of_files_in_dir += _check_size_in_dir(
                    os.path.join(dir_path, name))
    return number_of_files_in_dir


def _check_third_party_size():
    """Checks if the third-party size limit has been exceeded."""
    number_of_files_in_third_party = _check_size_in_dir(THIRD_PARTY_PATH)
    print ''
    print '------------------------------------------------------'
    print '    Number of files in third-party folder: %d' % (
        number_of_files_in_third_party)
    print ''
    if number_of_files_in_third_party > THIRD_PARTY_SIZE_LIMIT:
        print(
            '    ERROR: The third-party folder size exceeded the %d files'
            ' limit.' % THIRD_PARTY_SIZE_LIMIT)
        print '------------------------------------------------------'
        print ''
        sys.exit(1)
    else:
        print '    The size of third-party folder is within the limits.'
        print '------------------------------------------------------'
        print ''
        print 'Done!'
        print ''


if __name__ == '__main__':
    print 'Running third-party size check'
    _check_third_party_size()
    print 'Third-party folder size check passed.'
    print ''
