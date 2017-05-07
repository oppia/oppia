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

This script ignores all filepaths contained within .eslintignore.

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

2.  To lint all files in the folder or to lint just a specific file
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
import re
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
        'excluded_files': (),
        'excluded_dirs': ()},
    'datetime.datetime.now()': {
        'message': 'Please use datetime.datetime.utcnow() instead of'
                   'datetime.datetime.now().',
        'excluded_files': (),
        'excluded_dirs': ()},
    '\t': {
        'message': 'Please use spaces instead of tabs.',
        'excluded_files': (),
        'excluded_dirs': (
            'assets/i18n/',)},
    '\r': {
        'message': 'Please make sure all files only have LF endings (no CRLF).',
        'excluded_files': (),
        'excluded_dirs': ()},
    'glyphicon': {
        'message': 'Please use equivalent material-icons '
                   'instead of glyphicons.',
        'excluded_files': (),
        'excluded_dirs': ()}
}

BAD_PATTERNS_JS_REGEXP = [
    {
        'regexp': r"\b(ddescribe|fdescribe)\(",
        'message': "In tests, please use 'describe' instead of 'ddescribe'"
                   "or 'fdescribe'",
        'excluded_files': ()
    },
    {
        'regexp': r"\b(iit|fit)\(",
        'message': "In tests, please use 'it' instead of 'iit' or 'fit'",
        'excluded_files': ()
    }
]

BAD_PATTERNS_APP_YAML = {
    'MINIFICATION: true': {
        'message': 'Please set the MINIFICATION env variable in app.yaml'
                   'to False before committing.',
        'excluded_files': ()}
}

EXCLUDED_PATHS = (
    'third_party/*', 'build/*', '.git/*', '*.pyc', 'CHANGELOG',
    'scripts/pre_commit_linter.py', 'integrations/*',
    'integrations_dev/*', '*.svg', '*.png', '*.zip', '*.ico', '*.jpg',
    '*.min.js', 'assets/scripts/*')

if not os.getcwd().endswith('oppia'):
    print ''
    print 'ERROR    Please run this script from the oppia root directory.'

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYLINT_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-1.7.1')
if not os.path.exists(_PYLINT_PATH):
    print ''
    print 'ERROR    Please run start.sh first to install pylint '
    print '         and its dependencies.'
    sys.exit(1)

_PATHS_TO_INSERT = [
    _PYLINT_PATH,
    os.getcwd(),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.50',
        'google_appengine', 'lib', 'webapp2-2.3'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.50',
        'google_appengine', 'lib', 'yaml-3.10'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.50',
        'google_appengine', 'lib', 'jinja2-2.6'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.50',
        'google_appengine'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'webtest-1.4.2'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'numpy-1.6.1'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'browsermob-proxy-0.7.1'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'selenium-2.53.2'),
    os.path.join('third_party', 'gae-pipeline-1.9.17.0'),
    os.path.join('third_party', 'bleach-1.2.2'),
    os.path.join('third_party', 'gae-mapreduce-1.9.17.0'),
]
for path in _PATHS_TO_INSERT:
    sys.path.insert(0, path)

from pylint import lint  # pylint: disable=wrong-import-position

_MESSAGE_TYPE_SUCCESS = 'SUCCESS'
_MESSAGE_TYPE_FAILED = 'FAILED'


def _is_filename_excluded_for_bad_patterns_check(pattern, filename):
    """Checks if file is excluded from the bad patterns check.

    Args:
        pattern: str. The pattern to be checked against.
        filename: str. Name of the file.

    Returns:
        bool: Whether to exclude the given file from this
        particular pattern check.
    """
    return (any(filename.startswith(bad_pattern)
                for bad_pattern in BAD_PATTERNS[pattern]['excluded_dirs'])
            or filename in BAD_PATTERNS[pattern]['excluded_files'])


def _get_changed_filenames():
    """Returns a list of modified files (both staged and unstaged)

    Returns:
        a list of filenames of modified files.
    """
    unstaged_files = subprocess.check_output([
        'git', 'diff', '--name-only',
        '--diff-filter=ACM']).splitlines()
    staged_files = subprocess.check_output([
        'git', 'diff', '--cached', '--name-only',
        '--diff-filter=ACM']).splitlines()
    return unstaged_files + staged_files


def _get_glob_patterns_excluded_from_eslint(eslintignore_path):
    """Collects excludeFiles from .eslintignore file.

    Args:
        eslintignore_path: str. Path to .eslintignore file.

    Returns:
        a list of files in excludeFiles.
    """
    file_data = []
    with open(eslintignore_path) as f:
        file_data.extend(f.readlines())
    return file_data


def _get_all_files_in_directory(dir_path, excluded_glob_patterns):
    """Recursively collects all files in directory and
    subdirectories of specified path.

    Args:
        dir_path: str. Path to the folder to be linted.
        excluded_glob_patterns: set(str). Set of all glob patterns
            to be excluded.

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


def _lint_js_files(node_path, eslint_path, files_to_lint, stdout,
                   result):
    """Prints a list of lint errors in the given list of JavaScript files.

    Args:
        node_path: str. Path to the node binary.
        eslint_path: str. Path to the ESLint binary.
        files_to_lint: list(str). A list of filepaths to lint.
        stdout:  multiprocessing.Queue. A queue to store ESLint outputs.
        result: multiprocessing.Queue. A queue to put results of test.

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

    print 'Total js files: ', num_js_files
    eslint_cmd_args = [node_path, eslint_path, '--quiet']
    for _, filename in enumerate(files_to_lint):
        print 'Linting: ', filename
        proc_args = eslint_cmd_args + [filename]
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

    print 'Js linting finished.'


def _lint_py_files(config_pylint, files_to_lint, result):
    """Prints a list of lint errors in the given list of Python files.

    Args:
        config_pylint: str. Path to the .pylintrc file.
        files_to_lint: list(str). A list of filepaths to lint.
        result: multiprocessing.Queue. A queue to put results of test.

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

    print 'Linting %s Python files' % num_py_files

    _BATCH_SIZE = 50
    current_batch_start_index = 0

    while current_batch_start_index < len(files_to_lint):
        # Note that this index is an exclusive upper bound -- i.e., the current
        # batch of files ranges from 'start_index' to 'end_index - 1'.
        current_batch_end_index = min(
            current_batch_start_index + _BATCH_SIZE, len(files_to_lint))
        current_files_to_lint = files_to_lint[
            current_batch_start_index : current_batch_end_index]
        print 'Linting Python files %s to %s...' % (
            current_batch_start_index + 1, current_batch_end_index)

        try:
            # This prints output to the console.
            lint.Run(current_files_to_lint + [config_pylint])
        except SystemExit as e:
            if str(e) != '0':
                are_there_errors = True

        current_batch_start_index = current_batch_end_index

    if are_there_errors:
        result.put('%s    Python linting failed' % _MESSAGE_TYPE_FAILED)
    else:
        result.put('%s   %s Python files linted (%.1f secs)' % (
            _MESSAGE_TYPE_SUCCESS, num_py_files, time.time() - start_time))

    print 'Python linting finished.'

def _get_all_files():
    """This function is used to check if this script is ran from
    root directory and to return a list of all the files for linting and
    pattern checks.
    """
    eslintignore_path = os.path.join(os.getcwd(), '.eslintignore')
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
            excluded_glob_patterns = _get_glob_patterns_excluded_from_eslint(
                eslintignore_path)
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
    all_files = [
        filename for filename in all_files if not
        any(fnmatch.fnmatch(filename, pattern) for pattern in EXCLUDED_PATHS)]
    return all_files


def _pre_commit_linter(all_files):
    """This function is used to check if node-eslint dependencies are installed
    and pass ESLint binary path.
    """
    print 'Starting linter...'

    pylintrc_path = os.path.join(os.getcwd(), '.pylintrc')

    config_pylint = '--rcfile=%s' % pylintrc_path

    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))

    node_path = os.path.join(
        parent_dir, 'oppia_tools', 'node-6.9.1', 'bin', 'node')
    eslint_path = os.path.join(
        parent_dir, 'node_modules', 'eslint', 'bin', 'eslint.js')

    if not os.path.exists(eslint_path):
        print ''
        print 'ERROR    Please run start.sh first to install node-eslint '
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
        target=_lint_js_files, args=(node_path, eslint_path, js_files_to_lint,
                                     js_stdout, js_result)))

    py_result = multiprocessing.Queue()
    linting_processes.append(multiprocessing.Process(
        target=_lint_py_files,
        args=(config_pylint, py_files_to_lint, py_result)))
    print 'Starting Javascript and Python Linting'
    print '----------------------------------------'
    for process in linting_processes:
        process.start()

    for process in linting_processes:
        # Require timeout parameter to prevent against endless waiting for the
        # linting function to return.
        process.join(timeout=600)


    js_messages = []
    while not js_stdout.empty():
        js_messages.append(js_stdout.get())

    print ''
    print '\n'.join(js_messages)
    print '----------------------------------------'
    summary_messages = []
    # Require block = False to prevent unnecessary waiting for the process
    # output.
    summary_messages.append(js_result.get(block=False))
    summary_messages.append(py_result.get(block=False))
    print '\n'.join(summary_messages)
    print ''
    return summary_messages


def _check_newline_character(all_files):
    """This function is used to check that each file
    ends with a single newline character.
    """
    print 'Starting newline-at-EOF checks'
    print '----------------------------------------'
    total_files_checked = 0
    total_error_count = 0
    summary_messages = []
    all_files = [
        filename for filename in all_files if not
        any(fnmatch.fnmatch(filename, pattern) for pattern in EXCLUDED_PATHS)]
    failed = False
    for filename in all_files:
        with open(filename, 'rb') as f:
            total_files_checked += 1
            total_num_chars = 0
            for line in f:
                total_num_chars += len(line)
            if total_num_chars == 1:
                failed = True
                print '%s --> Error: Only one character in file' % filename
                total_error_count += 1
            elif total_num_chars > 1:
                f.seek(-2, 2)
                if not (f.read(1) != '\n' and f.read(1) == '\n'):
                    failed = True
                    print (
                        '%s --> Please ensure that this file ends'
                        'with exactly one newline char.' % filename)
                    total_error_count += 1

    if failed:
        summary_message = '%s   Newline character checks failed' % (
            _MESSAGE_TYPE_FAILED)
        summary_messages.append(summary_message)
    else:
        summary_message = '%s   Newline character checks passed' % (
            _MESSAGE_TYPE_SUCCESS)
        summary_messages.append(summary_message)

    print ''
    print '----------------------------------------'
    print ''
    if total_files_checked == 0:
        print 'There are no files to be checked.'
    else:
        print '(%s files checked, %s errors found)' % (
            total_files_checked, total_error_count)
        print summary_message

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
    failed = False
    for filename in all_files:
        with open(filename) as f:
            content = f.read()
            total_files_checked += 1
            for pattern in BAD_PATTERNS:
                if (pattern in content and
                        not _is_filename_excluded_for_bad_patterns_check(
                            pattern, filename)):
                    failed = True
                    print '%s --> %s' % (
                        filename, BAD_PATTERNS[pattern]['message'])
                    total_error_count += 1
            if filename.endswith('.js'):
                for regexp in BAD_PATTERNS_JS_REGEXP:
                    regexp_pattern = regexp['regexp']
                    if filename not in regexp['excluded_files']:
                        if re.search(regexp_pattern, content):
                            failed = True
                            print '%s --> %s' % (
                                filename,
                                regexp['message'])
                            total_error_count += 1
            if filename == 'app.yaml':
                for pattern in BAD_PATTERNS_APP_YAML:
                    if pattern in content:
                        failed = True
                        print '%s --> %s' % (
                            filename,
                            BAD_PATTERNS_APP_YAML[pattern]['message'])
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
    newline_messages = _check_newline_character(all_files)
    linter_messages = _pre_commit_linter(all_files)
    pattern_messages = _check_bad_patterns(all_files)
    all_messages = linter_messages + newline_messages + pattern_messages
    if any([message.startswith(_MESSAGE_TYPE_FAILED) for message in
            all_messages]):
        sys.exit(1)


if __name__ == '__main__':
    main()
