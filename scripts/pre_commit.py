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

        python scripts/pre_commit.py
 Note that the root folder MUST be named 'oppia'.
 """

__author__ = "Barnabas Makonda(barnabasmakonda@gmail.com)"

import os
import sys
import subprocess


def _current_changed():
    """This function looks for all files changed but not
    yet staged.
    Returns:
        list of files changed but not staged files
    """
    changed_files = os.popen("git diff --name-only")
    return changed_files

def _current_staged():
    """This function looks for all files that are changed
    and staged but not yet commited.
    Returns:
        list of staged files but not commited
    """
    staged_files = os.popen("git diff --cached --name-only --diff-filter=ACM")
    return staged_files


def _get_list_of_current_changed():
    """This function combines all changed files staged
    and not staged
    Returns:
        a list of files about to be commited. """
    files = []
    if _current_changed():
        for js_file in _current_changed().read().splitlines():
            files.append(js_file)

    if _current_staged():
        for js_file in _current_staged().read().splitlines():
            if js_file not in files:
                files.append(js_file)
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


def check_repo(path_to_jscs, auto_fix=False):
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
            if auto_fix:
                proc = subprocess.Popen(
                    [path_to_jscs, "-x", javascript_file],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE)
                out, _ = proc.communicate()
            else:
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

def _pre_commit():
    """This function is used to check if this script is ran from
    root directory, node-jscs dependencies are installed
    and pass path to node-jscs bin folder
    """
    jscs_bin_dir = "/oppia_tools/node-jscs/bin/jscs"
    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    path_to_jscs = parent_dir + jscs_bin_dir
    if os.getcwd().endswith("oppia"):
        if os.path.exists(path_to_jscs):
            check_repo(path_to_jscs)
        else:
            print "Please run  start.sh first"
            print "to install node-jscs and its dependencies"
    else:
        print "Please run me from Oppia root directory"


if __name__ == '__main__':
    _pre_commit()
