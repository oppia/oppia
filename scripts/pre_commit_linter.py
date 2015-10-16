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

"""Pre-commit script for Oppia.

This script uses the JSCS node module to lint JavaScript code
It returns errors

IMPORTANT NOTES:

1.  Before running this script, you must install third-party dependencies by
    running

        bash scripts/start.sh

    at least once.

2.  This script should be run from the oppia root folder:

        python scripts/pre_commit_linter.py

 Note that the root folder MUST be named 'oppia'.
 """

__author__ = "Barnabas Makonda(barnabasmakonda@gmail.com)"

import argparse
import os
import subprocess
import sys
import time


_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--fix',
    help='optional; if specified, autofix errors and display which can not be fixed')


def _get_changed_filenames():
    """Returns a list of modified files (both staged and unstaged)
    Returns:
        a list of files about to be commited. """
    unstaged_files = subprocess.check_output([
        'git', 'diff', '--name-only']).splitlines()
    staged_files  = subprocess.check_output([
        'git', 'diff', '--cached', '--name-only', 
        '--diff-filter=ACM']).splitlines()
    return unstaged_files + staged_files


def _is_javascript_file(filename):
    """Check if the input filename represents a JavaScript file.

    Args:
    - filename: str. The name of the file to be checked.

    Returns:
      bool: True if the filename ends in ".js", and false otherwise.
    """
    return filename.endswith('.js')


def _lint_js_files(jscs_path):
    """Prints a list of lint errors in changed JavaScript files.

    Args:
    - jscs_path: path to the JSCS binary
    """
    start_time = time.time()
    parsed_args = _PARSER.parse_args()

    # List of checked files
    javascript_files = []
    # List of errors
    errors = []

    changed_filenames = _get_changed_filenames()
    # Find all javascript files
    for filename in changed_filenames:
        changed_js_filenames = filter(
                    _is_javascript_file, changed_filenames)

    # Do nothing if  no Javascript files changed
    if len(changed_js_filenames) == 0:
        print "No Javascript file to check"
        sys.exit(0)

    num_js_files = len(changed_js_filenames)

    for ind, filename in enumerate(changed_js_filenames):
        print 'Linting %s (file %d/%d)...\t' % (filename, ind + 1, num_js_files)
        try:
            if parsed_args.fix:
                proc = subprocess.Popen(
                    [jscs_path, '-x', filename],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE)
                linter_stdout, linter_stderr = proc.communicate()
                errors.append(linter_stdout)
            else:
                proc = subprocess.Popen(
                    [jscs_path, filename],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE)
                linter_stdout, linter_stderr = proc.communicate()
                errors.append(linter_stdout)
            print linter_stdout
        except OSError as e:
            print e
            sys.exit(1)

    # This removes empty string added incase no errors
    errors = filter(None, errors)
    if len(errors) > 0:
        print 'FAILED %s JavaScript files: %s failures' % (num_js_files, len(errors))
    else:
        print 'SUCCESS %s JavaScript files linted (%.1f secs)' % (num_js_files,
                time.time() - start_time)


def _pre_commit_linter():
    """This function is used to check if this script is ran from
    root directory, node-jscs dependencies are installed
    and pass JSCS binary path
    """
    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    jscs_path = os.path.join(parent_dir, 'node_modules',
            'jscs', 'bin', 'jscs')
    if os.getcwd().endswith('oppia'):
        if os.path.exists(jscs_path):
            _lint_js_files(jscs_path)
        else:
            print 'Please run  start.sh first'
            print 'to install node-jscs and its dependencies'
    else:
        print 'Please run me from Oppia root directory'


if __name__ == '__main__':
    _pre_commit_linter()
