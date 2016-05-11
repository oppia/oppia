# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

# Pre-submission script for Oppia.
# This script checks for unaccepted text patterns in the commit.

import os
import fnmatch
import subprocess

pattern = ["__author__","datetime.datetime.now()"]
_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))

total_files_checked = 0
total_error_count = 0

def _get_changed_filenames():
    """Returns a list of modified files (both staged and unstaged)

    Returns:
        a list of filenames of modified files
    """
    unstaged_files = subprocess.check_output([
        'git', 'diff', '--name-only']).splitlines()
    staged_files = subprocess.check_output([
        'git', 'diff', '--cached', '--name-only',
        '--diff-filter=ACM']).splitlines()
    return unstaged_files + staged_files

def pre_submission_check(dir):
    global total_files_checked
    global total_error_count
    files = _get_changed_filenames()
    if len(files)!=0:
        print files
        for file in files:
            with open(file) as f:
                content = f.read()
                total_files_checked+=1
                for value in pattern:
                    if value in content:
                        total_error_count+=1
                        print file + " --> " + value + " --> Incorrect Pattern"

def main():
    print ''
    print '+------------------+'
    print '| SUMMARY OF TESTS |'
    print '+------------------+'
    print ''
    if total_files_checked == 0:
        print ('WARNING: No files were checked.')
    else:
        if total_files_checked and total_error_count==0:
            print '(%s FILES CHECKED, %s ERRORS FOUND)' % (total_files_checked, total_error_count)
        else:
            exit(1)

if __name__ == '__main__':
    pre_submission_check(_PARENT_DIR)
    main()