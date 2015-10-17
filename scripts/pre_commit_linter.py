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

This script uses the JSCS node module to lint JavaScript code, and prints a
list of lint errors to the terminal. If the --autofix flag is passed, it will
also attempt to automatically fix these errors.

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
    '--autofix',
    help=(
        'optional; if specified, automatically fix errors where possible, and '
        'only display errors which cannot be fixed'),
    action='store_true')


def _get_changed_filenames():
    """Returns a list of modified files (both staged and unstaged)

    Returns:
        a list of filenames of modified files
    """
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


def _lint_js_files(node_path, jscs_path, autofix, config_jscsrc):
    """Prints a list of lint errors in changed JavaScript files.

    Args:
    - node_path: str. Path to the node binary.
    - jscs_path: str. Path to the JSCS binary.
    - autofix: bool. Whether to automatically fix errors.
    """
    changed_filenames = _get_changed_filenames()
    changed_js_filenames = filter(_is_javascript_file, changed_filenames)
    num_js_files = len(changed_js_filenames)

    num_files_with_errors = 0

    if not changed_js_filenames:
        print 'There are no JavaScript files in this commit to lint. Exiting.'
        sys.exit(0)

    start_time = time.time()

    jscs_cmd_args = [node_path, jscs_path, config_jscsrc]
    if autofix:
        jscs_cmd_args.append('-x')

    for ind, filename in enumerate(changed_js_filenames):
        print '\nLinting %s (file %d/%d)...\n' % (
            filename, ind + 1, num_js_files)

        proc_args = jscs_cmd_args + [filename]
        proc = subprocess.Popen(
            proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        linter_stdout, linter_stderr = proc.communicate()
        if linter_stderr:
            print 'LINTER FAILED'
            print linter_stderr
            sys.exit(1)

        if linter_stdout:
            num_files_with_errors += 1
            print linter_stdout

    if num_files_with_errors:
        print 'FAILED    %s JavaScript files' % num_files_with_errors
    else:
        print 'SUCCESS   %s JavaScript files linted (%.1f secs)' % (
            num_js_files, time.time() - start_time)


def _pre_commit_linter():
    """This function is used to check if this script is ran from
    root directory, node-jscs dependencies are installed
    and pass JSCS binary path
    """
    parsed_args = _PARSER.parse_args()
    autofix = bool(parsed_args.autofix)

    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    jscsrc_path = os.path.join(os.getcwd(), '.jscsrc')
    config_jscsrc = '--config=%s' % jscsrc_path
    node_path = os.path.join(
        parent_dir, 'oppia_tools', 'node-0.10.33', 'bin', 'node')
    jscs_path = os.path.join(
        parent_dir, 'node_modules', 'jscs', 'bin', 'jscs')

    if os.getcwd().endswith('oppia'):
        if os.path.exists(jscs_path):
            _lint_js_files(node_path, jscs_path, autofix, config_jscsrc)
        else:
            print ''
            print 'ERROR    Please run start.sh first to install node-jscs '
            print '         and its dependencies.'
    else:
        print ''
        print 'ERROR    Please run this script from the oppia root directory.'


if __name__ == '__main__':
    _pre_commit_linter()
