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
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r"\b(iit|fit)\(",
        'message': "In tests, please use 'it' instead of 'iit' or 'fit'",
        'excluded_files': (),
        'excluded_dirs': ()
    },
    {
        'regexp': r"templateUrl: \'",
        'message': "The directives must be directly referenced.",
        'excluded_files': (
            'core/templates/dev/head/pages/exploration_player/'
            'FeedbackPopupDirective.js'
        ),
        'excluded_dirs': (
            'extensions/answer_summarizers/',
            'extensions/classifiers/',
            'extensions/dependencies/',
            'extensions/objects/',
            'extensions/value_generators/',
            'extensions/visualizations/')
    }
]

BAD_LINE_PATTERNS_HTML_REGEXP = [
    {
        'regexp': r"text\/ng-template",
        'message': "The directives must be directly referenced.",
        'excluded_files': (
            'core/templates/dev/head/pages/exploration_player/'
            'feedback_popup_container_directive.html',
            'core/templates/dev/head/pages/exploration_player/'
            'input_response_pair_directive.html'
        ),
        'excluded_dirs': (
            'extensions/answer_summarizers/',
            'extensions/classifiers/',
            'extensions/objects/',
            'extensions/value_generators/')
    },
    {
        'regexp': r"[ \t]+$",
        'message': "There should not be any trailing whitespaces.",
        'excluded_files': (),
        'excluded_dirs': ()
    }
]

REQUIRED_STRINGS_FECONF = {
    'FORCE_PROD_MODE = False': {
        'message': 'Please set the FORCE_PROD_MODE variable in feconf.py'
                   'to False before committing.',
        'excluded_files': ()
    }
}

ALLOWED_TERMINATING_PUNCTUATIONS = ['.', '?', '}', ']', ')']

EXCLUDED_PHRASES = [
    'utf', 'pylint:', 'http://', 'https://', 'scripts/', 'extract_node']

EXCLUDED_PATHS = (
    'third_party/*', 'build/*', '.git/*', '*.pyc', 'CHANGELOG',
    'integrations/*', 'integrations_dev/*', '*.svg',
    '*.png', '*.zip', '*.ico', '*.jpg', '*.min.js',
    'assets/scripts/*', 'core/tests/data/*', '*.mp3')


if not os.getcwd().endswith('oppia'):
    print ''
    print 'ERROR    Please run this script from the oppia root directory.'

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYLINT_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-1.8.4')
if not os.path.exists(_PYLINT_PATH):
    print ''
    print 'ERROR    Please run start.sh first to install pylint '
    print '         and its dependencies.'
    sys.exit(1)

_PATHS_TO_INSERT = [
    _PYLINT_PATH,
    os.getcwd(),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.67',
        'google_appengine', 'lib', 'webapp2-2.3'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.67',
        'google_appengine', 'lib', 'yaml-3.10'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.67',
        'google_appengine', 'lib', 'jinja2-2.6'),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.67',
        'google_appengine'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'webtest-1.4.2'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'browsermob-proxy-0.7.1'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'pyjsparser-2.5.2'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'pycodestyle-2.3.1'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'selenium-2.53.2'),
    os.path.join('third_party', 'gae-pipeline-1.9.17.0'),
    os.path.join('third_party', 'bleach-1.2.2'),
    os.path.join('third_party', 'beautifulsoup4-4.6.0'),
    os.path.join('third_party', 'gae-mapreduce-1.9.17.0'),
    os.path.join('third_party', 'mutagen-1.38'),
    os.path.join('third_party', 'gae-cloud-storage-1.9.15.0'),
]
for path in _PATHS_TO_INSERT:
    sys.path.insert(0, path)

# pylint: disable=wrong-import-order
# pylint: disable=wrong-import-position

import isort  # isort:skip
import pycodestyle  # isort:skip
import pyjsparser  # isort:skip
from pylint import lint  # isort:skip

# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

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


def _lint_js_files(
        node_path, eslint_path, files_to_lint, stdout, result):
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


def _lint_py_files(config_pylint, config_pycodestyle, files_to_lint, result):
    """Prints a list of lint errors in the given list of Python files.

    Args:
        config_pylint: str. Path to the .pylintrc file.
        config_pycodestyle: str. Path to the tox.ini file.
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
            current_batch_start_index: current_batch_end_index]
        print 'Linting Python files %s to %s...' % (
            current_batch_start_index + 1, current_batch_end_index)

        # This line invokes Pylint and prints its output to the console.
        pylinter = lint.Run(
            current_files_to_lint + [config_pylint],
            exit=False).linter

        # These lines invoke Pycodestyle.
        style_guide = pycodestyle.StyleGuide(config_file=config_pycodestyle)
        pycodestyle_report = style_guide.check_files(current_files_to_lint)
        # This line prints Pycodestyle's output to the console.
        pycodestyle_report.print_statistics()

        if pylinter.msg_status != 0 or pycodestyle_report.get_count() != 0:
            are_there_errors = True

        current_batch_start_index = current_batch_end_index

    if are_there_errors:
        result.put('%s    Python linting failed' % _MESSAGE_TYPE_FAILED)
    else:
        result.put('%s   %s Python files linted (%.1f secs)' % (
            _MESSAGE_TYPE_SUCCESS, num_py_files, time.time() - start_time))

    print 'Python linting finished.'


def _lint_html_files(all_files):
    """This function is used to check HTML files for linting errors."""
    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))

    node_path = os.path.join(
        parent_dir, 'oppia_tools', 'node-6.9.1', 'bin', 'node')
    htmllint_path = os.path.join(
        parent_dir, 'node_modules', 'htmllint-cli', 'bin', 'cli.js')

    error_summary = []
    total_error_count = 0
    summary_messages = []
    htmllint_cmd_args = [node_path, htmllint_path, '--rc=.htmllintrc']
    html_files_to_lint = [
        filename for filename in all_files if filename.endswith('.html')]
    print 'Starting HTML linter...'
    print '----------------------------------------'
    print ''
    for filename in html_files_to_lint:
        proc_args = htmllint_cmd_args + [filename]
        print 'Linting %s file' % filename
        proc = subprocess.Popen(
            proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        linter_stdout, _ = proc.communicate()
        # This line splits the output of the linter and extracts digits from it.
        # The digits are stored in a list. The second last digit
        # in the list represents the number of errors in the file.
        error_count = [int(s) for s in linter_stdout.split() if s.isdigit()][-2]
        if error_count:
            error_summary.append(error_count)
            print linter_stdout

    print '----------------------------------------'
    for error_count in error_summary:
        total_error_count += error_count
    total_files_checked = len(html_files_to_lint)
    if total_error_count:
        print '(%s files checked, %s errors found)' % (
            total_files_checked, total_error_count)
        summary_message = '%s   HTML linting failed' % (
            _MESSAGE_TYPE_FAILED)
        summary_messages.append(summary_message)
    else:
        summary_message = '%s   HTML linting passed' % (
            _MESSAGE_TYPE_SUCCESS)
        summary_messages.append(summary_message)

    print ''
    print summary_message
    print 'HTML linting finished.'
    print ''
    return summary_messages


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

    config_pycodestyle = os.path.join(os.getcwd(), 'tox.ini')

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
        target=_lint_js_files, args=(
            node_path, eslint_path, js_files_to_lint,
            js_stdout, js_result)))

    py_result = multiprocessing.Queue()
    linting_processes.append(multiprocessing.Process(
        target=_lint_py_files,
        args=(config_pylint, config_pycodestyle, py_files_to_lint, py_result)))
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
    summary_messages.append(js_result.get())
    summary_messages.append(py_result.get())
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


def _check_bad_pattern_in_file(filename, content, pattern):
    """Detects whether the given pattern is present in the file.

    Args:
        filename: str. Name of the file.
        content: str. Contents of the file.
        pattern: dict ( regexp(regex pattern) : pattern to match,
            message(str) : message to show if pattern matches,
            excluded_files(tuple(str)) : files to be excluded from matching,
            excluded_dirs(tuple(str)) : directories to be excluded from
                matching).
            Object containing details for the pattern to be checked.

    Returns:
        bool. True if there is bad pattern else false.
    """
    regexp = pattern['regexp']
    if not (any(filename.startswith(excluded_dir)
                for excluded_dir in pattern['excluded_dirs'])
            or filename in pattern['excluded_files']):
        bad_pattern_count = 0
        for line_num, line in enumerate(content.split('\n'), 1):
            if re.search(regexp, line):
                print '%s --> Line %s: %s' % (
                    filename, line_num, pattern['message'])
                bad_pattern_count += 1
        if bad_pattern_count:
            return True
    return False


def _check_bad_patterns(all_files):
    """This function is used for detecting bad patterns.
    """
    print 'Starting Pattern Checks'
    print '----------------------------------------'
    total_files_checked = 0
    total_error_count = 0
    summary_messages = []
    all_files = [
        filename for filename in all_files if not (
            filename.endswith('pre_commit_linter.py') or
            any(
                fnmatch.fnmatch(filename, pattern)
                for pattern in EXCLUDED_PATHS)
            )]
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
                    if _check_bad_pattern_in_file(filename, content, regexp):
                        failed = True
                        total_error_count += 1

            if filename.endswith('.html'):
                for regexp in BAD_LINE_PATTERNS_HTML_REGEXP:
                    if _check_bad_pattern_in_file(filename, content, regexp):
                        failed = True
                        total_error_count += 1

            if filename == 'feconf.py':
                for pattern in REQUIRED_STRINGS_FECONF:
                    if pattern not in content:
                        failed = True
                        print '%s --> %s' % (
                            filename,
                            REQUIRED_STRINGS_FECONF[pattern]['message'])
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


def _check_import_order(all_files):
    """This function is used to check that each file
    has imports placed in alphabetical order.
    """
    print 'Starting import-order checks'
    print '----------------------------------------'
    summary_messages = []
    files_to_check = [
        filename for filename in all_files if not
        any(fnmatch.fnmatch(filename, pattern) for pattern in EXCLUDED_PATHS)
        and filename.endswith('.py')]
    failed = False
    for filename in files_to_check:
        # This line prints the error message along with file path
        # and returns True if it finds an error else returns False
        # If check is set to True, isort simply checks the file and
        # if check is set to False, it autocorrects import-order errors.
        if (isort.SortImports(
                filename, check=True, show_diff=True).incorrectly_sorted):
            failed = True
    print ''
    print '----------------------------------------'
    print ''
    if failed:
        summary_message = (
            '%s   Import order checks failed' % _MESSAGE_TYPE_FAILED)
        summary_messages.append(summary_message)
    else:
        summary_message = (
            '%s   Import order checks passed' % _MESSAGE_TYPE_SUCCESS)
        summary_messages.append(summary_message)

    return summary_messages


def _check_comments(all_files):
    """This function ensures that comments end in a period."""
    print 'Starting comment checks'
    print '----------------------------------------'
    summary_messages = []
    files_to_check = [
        filename for filename in all_files if not
        any(fnmatch.fnmatch(filename, pattern) for pattern in EXCLUDED_PATHS)
        and filename.endswith('.py')]
    message = 'There should be a period at the end of the comment.'
    failed = False
    for filename in files_to_check:
        with open(filename, 'r') as f:
            file_content = f.readlines()
            file_length = len(file_content)
            for line_num in range(file_length):
                line = file_content[line_num].lstrip().rstrip()
                next_line = ''
                if line_num + 1 < file_length:
                    next_line = file_content[line_num + 1].lstrip().rstrip()

                if line.startswith('#') and not next_line.startswith('#'):
                    # Check that the comment ends with the proper punctuation.
                    last_char_is_invalid = line[-1] not in (
                        ALLOWED_TERMINATING_PUNCTUATIONS)
                    no_word_is_present_in_excluded_phrases = not any(
                        word in line for word in EXCLUDED_PHRASES)
                    if last_char_is_invalid and (
                            no_word_is_present_in_excluded_phrases):
                        failed = True
                        print '%s --> Line %s: %s' % (
                            filename, line_num + 1, message)


    print ''
    print '----------------------------------------'
    print ''
    if failed:
        summary_message = (
            '%s   Comments check failed' % _MESSAGE_TYPE_FAILED)
        print summary_message
        summary_messages.append(summary_message)
    else:
        summary_message = (
            '%s   Comments check passed' % _MESSAGE_TYPE_SUCCESS)
        print summary_message
        summary_messages.append(summary_message)

    return summary_messages


def _check_docstrings(all_files):
    """This function ensures that docstrings end in a period."""
    print 'Starting docstring checks'
    print '----------------------------------------'
    summary_messages = []
    files_to_check = [
        filename for filename in all_files if not
        any(fnmatch.fnmatch(filename, pattern) for pattern in EXCLUDED_PATHS)
        and filename.endswith('.py')]
    missing_period_message = (
        'There should be a period at the end of the docstring.')
    multiline_docstring_message = (
        'Multiline docstring should end with a new line.')
    single_line_docstring_message = (
        'Single line docstring should not span two lines. '
        'If line length exceeds 80 characters, '
        'convert the single line docstring to a multiline docstring.')
    failed = False
    for filename in files_to_check:
        with open(filename, 'r') as f:
            file_content = f.readlines()
            file_length = len(file_content)
            for line_num in range(file_length):
                line = file_content[line_num].lstrip().rstrip()
                prev_line = ''

                if line_num > 0:
                    prev_line = file_content[line_num - 1].lstrip().rstrip()

                # Check for single line docstring.
                if line.startswith('"""') and line.endswith('"""'):
                    # Check for punctuation at line[-4] since last three
                    # characters are double quotes.
                    if (len(line) > 6) and (
                            line[-4] not in ALLOWED_TERMINATING_PUNCTUATIONS):
                        failed = True
                        print '%s --> Line %s: %s' % (
                            filename, line_num + 1, missing_period_message)

                # Check if single line docstring span two lines.
                elif line == '"""' and prev_line.startswith('"""'):
                    failed = True
                    print '%s --> Line %s: %s' % (
                        filename, line_num, single_line_docstring_message)

                # Check for multiline docstring.
                elif line.endswith('"""'):
                    # Case 1: line is """. This is correct for multiline
                    # docstring.
                    if line == '"""':
                        line = file_content[line_num - 1].lstrip().rstrip()
                        # Check for punctuation at end of docstring.
                        last_char_is_invalid = line[-1] not in (
                            ALLOWED_TERMINATING_PUNCTUATIONS)
                        no_word_is_present_in_excluded_phrases = not any(
                            word in line for word in EXCLUDED_PHRASES)
                        if last_char_is_invalid and (
                                no_word_is_present_in_excluded_phrases):
                            failed = True
                            print '%s --> Line %s: %s' % (
                                filename, line_num, missing_period_message)

                    # Case 2: line contains some words before """. """ should
                    # shift to next line.
                    elif not any(word in line for word in EXCLUDED_PHRASES):
                        failed = True
                        print '%s --> Line %s: %s' % (
                            filename, line_num + 1, multiline_docstring_message)

    print ''
    print '----------------------------------------'
    print ''
    if failed:
        summary_message = (
            '%s   Docstring check failed' % _MESSAGE_TYPE_FAILED)
        print summary_message
        summary_messages.append(summary_message)
    else:
        summary_message = (
            '%s   Docstring check passed' % _MESSAGE_TYPE_SUCCESS)
        print summary_message
        summary_messages.append(summary_message)

    return summary_messages


def _check_html_directive_name(all_files):
    """This function checks that all HTML directives end
    with _directive.html.
    """
    print 'Starting HTML directive name check'
    print '----------------------------------------'
    total_files_checked = 0
    total_error_count = 0
    summary_messages = []
    files_to_check = [
        filename for filename in all_files if not
        any(fnmatch.fnmatch(filename, pattern) for pattern in EXCLUDED_PATHS)
        and filename.endswith('.js')]
    failed = False
    summary_messages = []
    # For RegExp explanation, please see https://regex101.com/r/gU7oT6/37.
    pattern_to_match = (
        r"templateUrl: UrlInterpolationService\.[A-z\(]+" +
        r"(?P<directive_name>[^\)]+)")
    for filename in files_to_check:
        with open(filename) as f:
            content = f.read()
        total_files_checked += 1
        matched_patterns = re.findall(pattern_to_match, content)
        for matched_pattern in matched_patterns:
            matched_pattern = matched_pattern.split()
            directive_filename = ''.join(matched_pattern).replace(
                '\'', '').replace('+', '')
            if not directive_filename.endswith('_directive.html'):
                failed = True
                total_error_count += 1
                print (
                    '%s --> Please ensure that this file ends'
                    'with _directive.html.' % directive_filename)
    if failed:
        summary_message = '%s   HTML directive name check failed' % (
            _MESSAGE_TYPE_FAILED)
        summary_messages.append(summary_message)
    else:
        summary_message = '%s   HTML directive name check passed' % (
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


def _check_directive_scope(all_files):
    """This function checks that all directives have an explicit
    scope: {} and it should not be scope: true.
    """
    print 'Starting directive scope check'
    print '----------------------------------------'
    summary_messages = []
    # Select JS files which need to be checked.
    files_to_check = [
        filename for filename in all_files if not
        any(fnmatch.fnmatch(filename, pattern) for pattern in EXCLUDED_PATHS)
        and filename.endswith('.js')]
    failed = False
    summary_messages = []
    # Use Pyjsparser to parse a JS file as a Python dictionary.
    parser = pyjsparser.PyJsParser()
    for filename in files_to_check:
        with open(filename) as f:
            content = f.read()
        # Parse the body of the content as nodes.
        parsed_nodes = parser.parse(content)['body']
        for parsed_node in parsed_nodes:
            # Check the type of the node.
            if parsed_node['type'] != 'ExpressionStatement':
                continue
            # Separate the expression part of the node.
            expression = parsed_node['expression']
            # Check whether the expression belongs to a directive.
            expression_type_is_not_call = (
                expression['type'] != 'CallExpression')
            if expression_type_is_not_call:
                continue
            expression_callee_type_is_not_member = (
                expression['callee']['type'] != 'MemberExpression')
            if expression_callee_type_is_not_member:
                continue
            expression_callee_property_name_is_not_directive = (
                expression['callee']['property']['name'] != 'directive')
            if expression_callee_property_name_is_not_directive:
                continue
            # Separate the arguments of the expression.
            arguments = expression['arguments']
            # The first argument of the expression is the
            # name of the directive.
            if arguments[0]['type'] == 'Literal':
                directive_name = str(arguments[0]['value'])
            arguments = arguments[1:]
            for argument in arguments:
                # Check the type of an argument.
                if argument['type'] != 'ArrayExpression':
                    continue
                # Separate out the elements for the argument.
                elements = argument['elements']
                for element in elements:
                    # Check the type of an element.
                    if element['type'] != 'FunctionExpression':
                        continue
                    # Separate out the body of the element.
                    body = element['body']
                    if body['type'] != 'BlockStatement':
                        continue
                    # Further separate the body elements from the body.
                    body_elements = body['body']
                    for body_element in body_elements:
                        # Check if the body element is a return statement.
                        body_element_type_is_not_return = (
                            body_element['type'] != 'ReturnStatement')
                        body_element_argument_type_is_not_object = (
                            body_element['argument']['type'] != (
                                'ObjectExpression'))
                        if (body_element_type_is_not_return or (
                                body_element_argument_type_is_not_object)):
                            continue
                        # Separate the properties of the return node.
                        return_node_properties = (
                            body_element['argument']['properties'])
                        # Loop over all the properties of the return node
                        # to find out the scope key.
                        for return_node_property in return_node_properties:
                            # Check whether the property is scope.
                            property_key_is_an_identifier = (
                                return_node_property['key']['type'] == (
                                    'Identifier'))
                            property_key_name_is_scope = (
                                return_node_property['key']['name'] == (
                                    'scope'))
                            if (
                                    property_key_is_an_identifier and (
                                        property_key_name_is_scope)):
                                # Separate the scope value and
                                # check if it is an Object Expression.
                                # If it is not, then check for scope: true
                                # and report the error message.
                                scope_value = return_node_property['value']
                                if scope_value['type'] == 'Literal' and (
                                        scope_value['value']):
                                    failed = True
                                    print (
                                        'Please ensure that %s '
                                        'directive in %s file '
                                        'does not have scope set to '
                                        'true.' % (directive_name, filename))
                                elif scope_value['type'] != 'ObjectExpression':
                                    # Check whether the directive has scope: {}
                                    # else report the error message.
                                    failed = True
                                    print (
                                        'Please ensure that %s directive '
                                        'in %s file has a scope: {}.' % (
                                            directive_name, filename))

    if failed:
        summary_message = '%s   Directive scope check failed' % (
            _MESSAGE_TYPE_FAILED)
        print summary_message
        summary_messages.append(summary_message)
    else:
        summary_message = '%s  Directive scope check passed' % (
            _MESSAGE_TYPE_SUCCESS)
        print summary_message
        summary_messages.append(summary_message)

    print ''
    print '----------------------------------------'
    print ''

    return summary_messages


def main():
    all_files = _get_all_files()
    # TODO(apb7): Enable the _check_directive_scope function.
    directive_scope_messages = []
    html_directive_name_messages = _check_html_directive_name(all_files)
    import_order_messages = _check_import_order(all_files)
    newline_messages = _check_newline_character(all_files)
    docstring_messages = _check_docstrings(all_files)
    comment_messages = _check_comments(all_files)
    html_linter_messages = _lint_html_files(all_files)
    linter_messages = _pre_commit_linter(all_files)
    pattern_messages = _check_bad_patterns(all_files)
    all_messages = (
        directive_scope_messages + html_directive_name_messages +
        import_order_messages + newline_messages +
        docstring_messages + comment_messages +
        html_linter_messages + linter_messages +
        pattern_messages)
    if any([message.startswith(_MESSAGE_TYPE_FAILED) for message in
            all_messages]):
        sys.exit(1)


if __name__ == '__main__':
    main()
