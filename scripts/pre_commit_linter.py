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

""" Pre-commit script for oppia
This script checks Javascript coding style using jscs node module
It returns and fix errors

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

import os
import subprocess
import sys


def _get_list_of_current_changed():
    """This function combines all changed files staged
    and not staged
    Returns:
        a list of files about to be commited. """
    changed_and_staged_files = subprocess.check_output(['git', 'diff', '--name-only'])
    changed_and_staged_files += subprocess.check_output(['git', 'diff', '--cached',
                                    '--name-only', '--diff-filter=ACM'])
    files = []
    if changed_and_staged_files:
        for changed_and_staged_file in changed_and_staged_files.splitlines():
            files.append(changed_and_staged_file)
    return files


def _is_javascript_file(filename):
    """Check if the input file looks like a javascript
    Args:
        filename(String): Name of the files to be checked
            if is javascript or not
    Returns:
        bool: True if the filename ends in ".js" and false otherwise.
    """
    if filename.endswith('.js'):
        return True
    else:
        return False


def _check_repo(path_to_jscs):
    """This function checks all changed files in the repo and
    choose only javascript files(those which ends with .js)
    to be linted and the output error is displayed in console
    Args:
        path_to_jscs(String): path to the jscs bin direcory
        auto_fix(Optional[bool]): if true node-jscs auto fix all
           errors that it can and return remaining errors.
    Raises:
        valueError:if file was staged and then deleted
    Returns:
        errors: A list of errors obtained
    """
    # List of checked files and their results
    javascript_files = []
    # List of errors
    errors = []


    # Find all javascript files
    for filename in _get_list_of_current_changed():
        try:
            if _is_javascript_file(filename):
                javascript_files.append(str(filename))
        except IOError:
            print 'File not found (probably deleted): {}\t\tSKIPPED'.format(
                filename)

    # Do nothing if  no Javascript files changed
    if len(javascript_files) == 0:
        print "No Javascript file to check"
        sys.exit(0)

    # lint javascript files
    i = 1
    for javascript_file in javascript_files:

        # Start  linting
        print "Running jscs linting on {} (file {}/{})..\t".format(
            javascript_file, i, len(javascript_files))
        print ""
        try:
            proc = subprocess.Popen(
                [path_to_jscs, javascript_file],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE)
            out, _ = proc.communicate()
            errors.append(out)
            print out
        except OSError:
            print "\nAn error occurred. Is node-jscs installed?"
            sys.exit(1)

        # Bump parsed files
        i += 1
    if len(errors) > 0:
        print "\tWe are striving to make Oppia codebase clean"
        print "\tPlease fix above errors before commiting your changes"
        print "\tThanks."
    else:
        print "\tYour code are clean you can now commit"
        print "\tThanks"

def _pre_commit_linter():
    """This function is used to check if this script is ran from
    root directory, node-jscs dependencies are installed
    and pass path to node-jscs bin folder
    """
    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    path_to_jscs = os.path.join(parent_dir,'node_modules','jscs','bin','jscs')
    if os.getcwd().endswith('oppia'):
        if os.path.exists(path_to_jscs):
            _check_repo(path_to_jscs)
        else:
            print "Please run  start.sh first"
            print "to install node-jscs and its dependencies"
    else:
        print "Please run me from Oppia root directory"


if __name__ == '__main__':
    _pre_commit_linter()
