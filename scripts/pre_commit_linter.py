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

This script lints Python and JavaScript code, and prints a
list of lint errors to the terminal. If the directory path is passed,
it will lint all Python and JavaScript files in that directory; otherwise,
it will only lint files that have been touched in this commit.

This script ignores all filepaths contained within the excludeFiles
argument in .jscsrc. Note that, as a side-effect, these filepaths will also
prevent Python files in those paths from being linted.

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

3.  To lint a specific list of files (*.js/*.py only). Separate files by spaces
        python scripts/pre_commit_linter.py --files file_1 file_2 ... file_n

Note that the root folder MUST be named 'oppia'.
 """

# Pylint has issues with the import order of argparse.
# pylint: disable=wrong-import-order
import argparse
import fnmatch
import multiprocessing
import os
import json
import subprocess
import sys
import time
# pylint: enable=wrong-import-order

_PARSER = argparse.ArgumentParser()
_EXCLUSIVE_GROUP = _PARSER.add_mutually_exclusive_group()
_EXCLUSIVE_GROUP.add_argument(
    '--path',
    help='path to the directory with files to be linted',
    action='store')
_EXCLUSIVE_GROUP.add_argument(
    '--files',
    nargs='+',
    help='specific files to be linted. Space separated list',
    action='store')

BAD_PATTERNS = {
    '__author__': {
        'message': 'Please remove author tags from this file.',
        'excluded_files': ()},
    'datetime.datetime.now()': {
        'message': 'Please use datetime.datetime.utcnow() instead of'
                   'datetime.datetime.now().',
        'excluded_files': ()},
    '\t': {
        'message': 'Please use spaces instead of tabs.',
        'excluded_files': ()},
    '\r': {
        'message': 'Please make sure all files only have LF endings (no CRLF).',
        'excluded_files': ()},
    'glyphicon': {
        'message': 'Please use equivalent material-icons '
                   'instead of glyphicons.',
        'excluded_files': ()}
}

BAD_PATTERNS_JS = {
    ' == ': {
        'message': 'Please replace == with === in this file.',
        'excluded_files': (
            'core/templates/dev/head/expressions/parserSpec.js',
            'core/templates/dev/head/expressions/evaluatorSpec.js',
            'core/templates/dev/head/expressions/typeParserSpec.js')},
    ' != ': {
        'message': 'Please replace != with !== in this file.',
        'excluded_files': (
            'core/templates/dev/head/expressions/parserSpec.js',
            'core/templates/dev/head/expressions/evaluatorSpec.js',
            'core/templates/dev/head/expressions/typeParserSpec.js')}
}

EXCLUDED_PATHS = (
    'third_party/*', '.git/*', '*.pyc', 'CHANGELOG',
    'scripts/pre_commit_linter.py', 'integrations/*',
    'integrations_dev/*', '*.svg', '*.png', '*.zip', '*.ico', '*.jpg')

if not os.getcwd().endswith('oppia'):
    print ''
    print 'ERROR    Please run this script from the oppia root directory.'

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYLINT_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-1.5.2')
if not os.path.exists(_PYLINT_PATH):
    print ''
    print 'ERROR    Please run start.sh first to install pylint '
    print '         and its dependencies.'
    sys.exit(1)

_PATHS_TO_INSERT = [
    _PYLINT_PATH,
    os.getcwd(),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.19',
        'google_appengine', 'lib', 'webapp2-2.3'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.19',
        'google_appengine', 'lib', 'yaml-3.10'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.19',
        'google_appengine', 'lib', 'jinja2-2.6'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.19',
        'google_appengine'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'webtest-1.4.2'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'numpy-1.6.1'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'browsermob-proxy-0.7.1'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'selenium-2.53.2'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'xvfbwrapper-0.2.8'),
    os.path.join('third_party', 'gae-pipeline-1.9.17.0'),
    os.path.join('third_party', 'bleach-1.2.2'),
    os.path.join('third_party', 'gae-mapreduce-1.9.17.0'),
]
for path in _PATHS_TO_INSERT:
    sys.path.insert(0, path)

from pylint import lint  # pylint: disable=wrong-import-position

_MESSAGE_TYPE_SUCCESS = 'SUCCESS'
_MESSAGE_TYPE_FAILED = 'FAILED'


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


def _get_glob_patterns_excluded_from_jscsrc(config_jscsrc):
    """Collects excludeFiles from jscsrc file.

    Args:
    - config_jscsrc: str. Path to .jscsrc file.

    Returns:
        a list of files in excludeFiles.
    """
    with open(config_jscsrc) as f:
        f.readline()  # First three lines are comments
        f.readline()
        f.readline()
        json_data = json.loads(f.read())

    return json_data['excludeFiles']


def _get_all_files_in_directory(dir_path, excluded_glob_patterns):
    """Recursively collects all files in directory and
    subdirectories of specified path.

    Args:
    - dir_path: str. Path to the folder to be linted.
    - excluded_glob_patterns: set. Set of all files to be excluded.

    Returns:
        a list of files in directory and subdirectories without excluded files.
    """
    files_in_directory = []
    for _dir, _, files in os.walk(dir_path):
        for file_name in files:
            filename = os.path.relpath(
                os.path.join(_dir, file_name), os.getcwd())
            if not any([fnmatch.fnmatch(filename, gp) for gp in
                        excluded_glob_patterns]):
                files_in_directory.append(filename)
    return files_in_directory


def _lint_js_files(node_path, jscs_path, config_jscsrc, files_to_lint, stdout,
                   result):
    """Prints a list of lint errors in the given list of JavaScript files.

    Args:
    - node_path: str. Path to the node binary.
    - jscs_path: str. Path to the JSCS binary.
    - config_jscsrc: str. Configuration args for the call to the JSCS binary.
    - files_to_lint: list of str. A list of filepaths to lint.
    - stdout:  multiprocessing.Queue. A queue to store JSCS outputs
    - result: multiprocessing.Queue. A queue to put results of test

    Returns:
        None
    """
    start_time = time.time()
    num_files_with_errors = 0

    num_js_files = len(files_to_lint)
    if not files_to_lint:
        result.put('')
        print 'There are no JavaScript files to lint.'
        return

    jscs_cmd_args = [node_path, jscs_path, config_jscsrc]
    for _, filename in enumerate(files_to_lint):
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
            stdout.put(linter_stdout)

    if num_files_with_errors:
        result.put('%s    %s JavaScript files' % (
            _MESSAGE_TYPE_FAILED, num_files_with_errors))
    else:
        result.put('%s   %s JavaScript files linted (%.1f secs)' % (
            _MESSAGE_TYPE_SUCCESS, num_js_files, time.time() - start_time))


def _lint_py_files(config_pylint, files_to_lint, result):
    """Prints a list of lint errors in the given list of Python files.

    Args:
    - config_pylint: str. Path to the .pylintrc file.
    - files_to_lint: list of str. A list of filepaths to lint.
    - result: multiprocessing.Queue. A queue to put results of test

    Returns:
        None
    """
    start_time = time.time()
    are_there_errors = False

    num_py_files = len(files_to_lint)
    if not files_to_lint:
        result.put('')
        print 'There are no Python files to lint.'
        return

    try:
        # This prints output to the console.
        lint.Run(files_to_lint + [config_pylint])
    except SystemExit as e:
        if str(e) != '0':
            are_there_errors = True

    if are_there_errors:
        result.put('%s    Python linting failed' % _MESSAGE_TYPE_FAILED)
    else:
        result.put('%s   %s Python files linted (%.1f secs)' % (
            _MESSAGE_TYPE_SUCCESS, num_py_files, time.time() - start_time))


def _get_all_files():
    """This function is used to check if this script is ran from
    root directory and to return a list of all the files for linting and
    pattern checks.
    """
    jscsrc_path = os.path.join(os.getcwd(), '.jscsrc')
    parsed_args = _PARSER.parse_args()
    if parsed_args.path:
        input_path = os.path.join(os.getcwd(), parsed_args.path)
        if not os.path.exists(input_path):
            print 'Could not locate file or directory %s. Exiting.' % input_path
            print '----------------------------------------'
            sys.exit(1)
        if os.path.isfile(input_path):
            all_files = [input_path]
        else:
            excluded_glob_patterns = _get_glob_patterns_excluded_from_jscsrc(
                jscsrc_path)
            all_files = _get_all_files_in_directory(
                input_path, excluded_glob_patterns)
    elif parsed_args.files:
        valid_filepaths = []
        invalid_filepaths = []
        for f in parsed_args.files:
            if os.path.isfile(f):
                valid_filepaths.append(f)
            else:
                invalid_filepaths.append(f)
        if invalid_filepaths:
            print ('The following file(s) do not exist: %s\n'
                   'Exiting.' % invalid_filepaths)
            sys.exit(1)
        all_files = valid_filepaths
    else:
        all_files = _get_changed_filenames()
    return all_files


def _pre_commit_linter(all_files):
    """This function is used to check if node-jscs dependencies are installed
    and pass JSCS binary path
    """
    jscsrc_path = os.path.join(os.getcwd(), '.jscsrc')
    pylintrc_path = os.path.join(os.getcwd(), '.pylintrc')

    config_jscsrc = '--config=%s' % jscsrc_path
    config_pylint = '--rcfile=%s' % pylintrc_path

    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))

    node_path = os.path.join(
        parent_dir, 'oppia_tools', 'node-4.2.1', 'bin', 'node')
    jscs_path = os.path.join(
        parent_dir, 'node_modules', 'jscs', 'bin', 'jscs')

    if not os.path.exists(jscs_path):
        print ''
        print 'ERROR    Please run start.sh first to install node-jscs '
        print '         and its dependencies.'
        sys.exit(1)

    js_files_to_lint = [
        filename for filename in all_files if filename.endswith('.js')]
    py_files_to_lint = [
        filename for filename in all_files if filename.endswith('.py')]

    js_result = multiprocessing.Queue()
    linting_processes = []
    js_stdout = multiprocessing.Queue()
    linting_processes.append(multiprocessing.Process(
        target=_lint_js_files, args=(node_path, jscs_path, config_jscsrc,
                                     js_files_to_lint, js_stdout, js_result)))

    py_result = multiprocessing.Queue()
    linting_processes.append(multiprocessing.Process(
        target=_lint_py_files,
        args=(config_pylint, py_files_to_lint, py_result)))
    print 'Starting Javascript and Python Linting'
    print '----------------------------------------'
    for process in linting_processes:
        process.start()

    for process in linting_processes:
        process.join()

    js_messages = []
    while not js_stdout.empty():
        js_messages.append(js_stdout.get())

    print ''
    print '\n'.join(js_messages)
    print '----------------------------------------'
    summary_messages = []
    summary_messages.append(js_result.get())
    summary_messages.append(py_result.get())
    print '\n'.join(summary_messages)
    print ''
    return summary_messages


def _check_bad_patterns(all_files):
    """This function is used for detecting bad patterns.
    """
    print 'Starting Pattern Checks'
    print '----------------------------------------'
    total_files_checked = 0
    total_error_count = 0
    summary_messages = []
    all_files = [
        filename for filename in all_files if not
        any(fnmatch.fnmatch(filename, pattern) for pattern in EXCLUDED_PATHS)]
    all_js_files = [
        filename for filename in all_files if filename.endswith('.js')]
    failed = False
    for filename in all_files:
        with open(filename) as f:
            content = f.read()
            total_files_checked += 1
            for pattern in BAD_PATTERNS:
                if pattern in content and filename not in (
                        BAD_PATTERNS[pattern]['excluded_files']):
                    failed = True
                    print '%s --> %s' % (
                        filename, BAD_PATTERNS[pattern]['message'])
                    total_error_count += 1
            if filename in all_js_files:
                for pattern in BAD_PATTERNS_JS:
                    if filename not in (
                            BAD_PATTERNS_JS[pattern]['excluded_files']):
                        if pattern in content:
                            failed = True
                            print '%s --> %s' % (
                                filename,
                                BAD_PATTERNS_JS[pattern]['message'])
                            total_error_count += 1
    if failed:
        summary_message = '%s   Pattern checks failed' % _MESSAGE_TYPE_FAILED
        summary_messages.append(summary_message)
    else:
        summary_message = '%s   Pattern checks passed' % _MESSAGE_TYPE_SUCCESS
        summary_messages.append(summary_message)

    print ''
    print '----------------------------------------'
    print ''
    if total_files_checked == 0:
        print "There are no files to be checked."
    else:
        print '(%s files checked, %s errors found)' % (
            total_files_checked, total_error_count)
        print summary_message

    return summary_messages


def main():
    all_files = _get_all_files()
    linter_messages = _pre_commit_linter(all_files)
    pattern_messages = _check_bad_patterns(all_files)
    all_messages = linter_messages + pattern_messages
    if any([message.startswith(_MESSAGE_TYPE_FAILED) for message in
            all_messages]):
        sys.exit(1)


if __name__ == '__main__':
    main()
