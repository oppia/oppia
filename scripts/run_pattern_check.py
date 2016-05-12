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

import subprocess

BAD_PATTERNS = {'__author__': 'Please remove author tags from \
this file.',
                'datetime.datetime.now()': 'Please use datetime.datetime.u\
tcnow() instead of datetime.datetime.now().'
               }

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


def check_for_bad_patterns():
    total_files_checked = 0
    total_error_count = 0
    filenames = _get_changed_filenames()
    if len(filenames) != 0:
        for i in filenames:
            with open(i) as f:
                content = f.read()
                total_files_checked += 1
                if '__author__' in content:
                    print i, ' --> ', BAD_PATTERNS['__author__']
                    total_error_count += 1
                if 'datetime.datetime.now()' in content:
                    print i, ' --> ', BAD_PATTERNS['datetime.datetime.now()']
                    total_error_count += 1

    return total_files_checked, total_error_count


def main():
    total_files_checked, total_error_count = check_for_bad_patterns()
    print ''
    print '+------------------+'
    print '| SUMMARY OF TESTS |'
    print '+------------------+'
    print ''
    if total_files_checked == 0:
        print "WARNING: No files were checked."
    else:
        if total_files_checked and total_error_count == 0:
            print '(%s FILES CHECKED, %s ERRORS FOUND)' % (total_files_checked\
            , total_error_count)
        else:
            exit(1)


if __name__ == '__main__':
    main()
