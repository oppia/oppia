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
list of lint errors to the terminal. If the directory path is passed,
it will lint all JavaScript files in that directory; otherwise,
it will only lint files that have been touched in this commit.

IMPORTANT NOTES:

1.  Before running this script, you must install third-party dependencies by
    running

        bash scripts/start.sh

    at least once.

=====================
CUSTOMIZATION OPTIONS
=====================
1.  To lint only files that have been touched in this commit
       python scripts/pre_commit_linter.py

2.  To lint all files in  the folder or to lint just a specific file
        python scripts/pre_commit_linter.py --path filepath

Note that the root folder MUST be named 'oppia'.
 """

import argparse
import os
import subprocess
import sys
import time

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--path',
    help='path to the directory with files to be linted',
    action='store')

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))


_PYLINT_PATH = os.path.join(
    _PARENT_DIR, 'oppia_tools', 'pylint-1.5.2')
if not os.path.exists(_PYLINT_PATH):
    print ''
    print 'ERROR    Please run start.sh first to install pylint '
    print '         and its dependencies.'
    sys.exit(1)

sys.path.insert(0, _PYLINT_PATH)
from pylint import lint  # pylint: disable=wrong-import-position

# Allows Python linter to import files in the oppia/ folder.
sys.path.insert(0, os.getcwd())
sys.path.insert(0, os.path.join(
    _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.19',
    'google_appengine', 'lib', 'webapp2-2.3'))
sys.path.insert(0, os.path.join(
    _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.19',
    'google_appengine'))
sys.path.insert(0, os.path.join(
    _PARENT_DIR, 'oppia_tools', 'webtest-1.4.2'))
sys.path.insert(0, os.path.join('third_party', 'gae-pipeline-1.9.17.0'))


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


def _get_all_files_in_directory(dir_path):
    """Recursively collects all files in directory and
    subdirectories of specified path.

    Args:
    - dir_path: str. Path to the folder to be linted.

    Returns:
        a list of files in directory and subdirectories.
    """
    files_in_directory = []
    for _dir, _, files in os.walk(dir_path):
        for file_name in files:
            files_in_directory.append(
                os.path.relpath(os.path.join(_dir, file_name), os.getcwd()))

    return files_in_directory


def _lint_js_files(node_path, jscs_path, config_jscsrc, files_to_lint):
    """Prints a list of lint errors in the given input_dir, or in all changed
    JavaScript files if input_dir is not specified.

    Args:
    - node_path: str. Path to the node binary.
    - jscs_path: str. Path to the JSCS binary.
    - input_dir: str. Path to the folder to be linted (optional).
    """

    print '----------------------------------------'

    start_time = time.time()
    num_files_with_errors = 0

    num_js_files = len(files_to_lint)
    if not files_to_lint:
        print 'There are no JavaScript files to lint.'
        print '----------------------------------------'
        return

    jscs_cmd_args = [node_path, jscs_path, config_jscsrc]

    for ind, filename in enumerate(files_to_lint):
        print 'Linting file %d/%d: %s ...' % (
            ind + 1, num_js_files, filename)

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

    print '----------------------------------------'

    if num_files_with_errors:
        print 'FAILED    %s JavaScript files' % num_files_with_errors
    else:
        print 'SUCCESS   %s JavaScript files linted (%.1f secs)' % (
            num_js_files, time.time() - start_time)


def _lint_py_files(config_pylint, files_to_lint):
    """Prints a list of lint errors in the given input_dir, or in all changed
    Python files if input_dir is not specified.

    Args:
    - config_pylint: str. Path to the .pylintrc file.
    - input_dir: str. Path to the folder to be linted (optional).
    """

    print '----------------------------------------'

    start_time = time.time()
    are_there_errors = False

    num_py_files = len(files_to_lint)
    if not files_to_lint:
        print 'There are no Python files to lint.'
        print '----------------------------------------'
        return

    print 'Linting %d files' % num_py_files

    try:
        # This prints output to the console.
        lint.Run(files_to_lint + [config_pylint])
    except SystemExit as e:
        if str(e) != '0':
            are_there_errors = True

    print '----------------------------------------'

    if are_there_errors:
        print 'FAILED    Python linting failed'
    else:
        print 'SUCCESS   %s Python files linted (%.1f secs)' % (
            num_py_files, time.time() - start_time)


def _pre_commit_linter():
    """This function is used to check if this script is ran from
    root directory, node-jscs dependencies are installed
    and pass JSCS binary path
    """
    parsed_args = _PARSER.parse_args()
    input_dir = parsed_args.path
    if input_dir:
        input_dir = os.path.join(os.getcwd(), parsed_args.path)
        if not os.path.exists(input_dir):
            print 'Could not locate directory %s. Exiting.' % input_dir
            print '----------------------------------------'
            sys.exit(0)

    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))

    jscsrc_path = os.path.join(os.getcwd(), '.jscsrc')
    pylintrc_path = os.path.join(os.getcwd(), '.pylintrc')

    config_jscsrc = '--config=%s' % jscsrc_path
    config_pylint = '--rcfile=%s' % pylintrc_path

    node_path = os.path.join(
        parent_dir, 'oppia_tools', 'node-4.2.1', 'bin', 'node')
    jscs_path = os.path.join(
        parent_dir, 'node_modules', 'jscs', 'bin', 'jscs')

    if input_dir:
        if os.path.isfile(input_dir):
            all_files = [input_dir]
        else:
            all_files = _get_all_files_in_directory(input_dir)
    else:
        all_files = _get_changed_filenames()

    js_files_to_lint = [
        filename for filename in all_files if filename.endswith('.js')]
    py_files_to_lint = [
        filename for filename in all_files if filename.endswith('.py')]

    if os.getcwd().endswith('oppia'):
        if os.path.exists(jscs_path):
            print ''
            print 'Starting jscs linter...'
            _lint_js_files(node_path, jscs_path, config_jscsrc,
                           js_files_to_lint)
        else:
            print ''
            print 'ERROR    Please run start.sh first to install node-jscs '
            print '         and its dependencies.'

        # Pylint
        print ''
        print 'Starting Pylint...'
        _lint_py_files(config_pylint, py_files_to_lint)
    else:
        print ''
        print 'ERROR    Please run this script from the oppia root directory.'


if __name__ == '__main__':
    _pre_commit_linter()
