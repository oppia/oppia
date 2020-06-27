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

=====================
CUSTOMIZATION OPTIONS
=====================
1.  To lint only files that have been touched in this commit
        python -m scripts.linters.pre_commit_linter

2.  To lint all files in the folder or to lint just a specific file
        python -m scripts.linters.pre_commit_linter --path filepath

3.  To lint a specific list of files. Separate filepaths by spaces
        python -m scripts.linters.pre_commit_linter
            --files filepath_1 filepath_2 ... filepath_n

4.  To lint files in verbose mode
        python -m scripts.linters.pre_commit_linter --verbose

5. To lint a specific list of file extensions. Separate file
    extensions by spaces
        python -m scripts.linters.pre_commit_linter
            --only-check-file-extensions py js

Note that the root folder MUST be named 'oppia'.
 """

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import fnmatch
import multiprocessing
import os
import subprocess
import sys
import threading

import python_utils

# Install third party dependencies before proceeding.
from . import codeowner_linter
from . import css_linter
from . import general_purpose_linter
from . import html_linter
from . import js_ts_linter
from . import linter_utils
from . import python_linter
from . import third_party_typings_linter
from .. import common
from .. import concurrent_task_utils
from .. import install_third_party_libs

install_third_party_libs.main()

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
_PARSER.add_argument(
    '--verbose',
    help='verbose mode. All details will be printed.',
    action='store_true')
_EXCLUSIVE_GROUP.add_argument(
    '--only-check-file-extensions',
    nargs='+',
    choices=['html', 'css', 'js', 'ts', 'py', 'other'],
    help='specific file extensions to be linted. Space separated list. '
    'If either of js or ts used then both js and ts files will be linted.',
    action='store')

if not os.getcwd().endswith('oppia'):
    python_utils.PRINT('')
    python_utils.PRINT(
        'ERROR    Please run this script from the oppia root directory.')

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))

_PATHS_TO_INSERT = [
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
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'webtest-%s' % common.WEBTEST_VERSION),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'PyGithub-%s' % common.PYGITHUB_VERSION),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'Pillow-%s' % common.PILLOW_VERSION),
    os.path.join(
        _PARENT_DIR, 'oppia_tools', 'psutil-%s' % common.PSUTIL_VERSION),
    os.path.join('third_party', 'backports.functools_lru_cache-1.6.1'),
    os.path.join('third_party', 'beautifulsoup4-4.9.0'),
    os.path.join('third_party', 'bleach-3.1.5'),
    os.path.join('third_party', 'callbacks-0.3.0'),
    os.path.join('third_party', 'gae-cloud-storage-1.9.22.1'),
    os.path.join('third_party', 'gae-mapreduce-1.9.22.0'),
    os.path.join('third_party', 'gae-pipeline-1.9.22.1'),
    os.path.join('third_party', 'mutagen-1.43.0'),
    os.path.join('third_party', 'packaging-20.3'),
    os.path.join('third_party', 'soupsieve-1.9.5'),
    os.path.join('third_party', 'six-1.12.0'),
    os.path.join('third_party', 'webencodings-0.5.1'),
]
for path in _PATHS_TO_INSERT:
    sys.path.insert(0, path)

_TARGET_STDOUT = python_utils.string_io()
_STDOUT_LIST = multiprocessing.Manager().list()
_FILES = multiprocessing.Manager().dict()


class FileCache(python_utils.OBJECT):
    """Provides thread-safe access to cached file content."""

    def __init__(self):
        self._CACHE_DATA_DICT = {}

    def read(self, filepath, mode='r'):
        """Returns the data read from the file in unicode form.

        Args:
            filepath: str. The file path from which data is to be read.
            mode: str. The mode in which the file is to be opened.

        Returns:
            str. The data read from the file.
        """
        return self._get_data(filepath, mode)[0]

    def readlines(self, filepath, mode='r'):
        """Returns the tuple containing data line by line as read from the
        file in unicode form.

        Args:
            filepath: str. The file path from which data is to be read.
            mode: str. The mode in which the file is to be opened.

        Returns:
            tuple(str). The tuple containing data line by line as read from the
                file.
        """
        return self._get_data(filepath, mode)[1]

    def _get_data(self, filepath, mode):
        """Returns the collected data from the file corresponding to the given
        filepath.

        Args:
            filepath: str. The file path from which data is to be read.
            mode: str. The mode in which the file is to be opened.

        Returns:
            tuple(str, tuple(str)). The tuple containing data read from the file
                as first element and tuple containing the text line by line as
                second element.
        """
        key = (filepath, mode)
        if key not in self._CACHE_DATA_DICT:
            with python_utils.open_file(filepath, mode, newline='') as f:
                lines = f.readlines()
                self._CACHE_DATA_DICT[key] = (''.join(lines), tuple(lines))
        return self._CACHE_DATA_DICT[key]


def _get_linters_for_file_extension(
        file_extension_to_lint, verbose_mode_enabled=False):
    """Return linters for the file extension type.

    Args:
        file_extension_to_lint: str. The file extension to be linted.
        verbose_mode_enabled: bool. True if verbose mode is enabled.

    Returns:
        custom_linter: list. Custom lint checks.
        third_party_linter: list. Third party lint checks.
    """
    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    custom_linters = []
    third_party_linters = []

    file_extension_type_js_ts = file_extension_to_lint == 'js' or (
        file_extension_to_lint == 'ts')

    if file_extension_type_js_ts:
        general_files_to_lint = _FILES['.js'] + _FILES['.ts']
    elif file_extension_to_lint == 'other':
        general_files_to_lint = _FILES['other']
    else:
        general_files_to_lint = _FILES['.%s' % file_extension_to_lint]

    custom_linter, third_party_linter = general_purpose_linter.get_linters(
        general_files_to_lint,
        verbose_mode_enabled=verbose_mode_enabled)
    custom_linters.append(custom_linter)

    if file_extension_type_js_ts:
        custom_linter, third_party_linter = js_ts_linter.get_linters(
            _FILES['.js'], _FILES['.ts'],
            verbose_mode_enabled=verbose_mode_enabled)
        custom_linters.append(custom_linter)
        third_party_linters.append(third_party_linter)

    elif file_extension_to_lint == 'html':
        custom_linter, third_party_linter = html_linter.get_linters(
            _FILES['.html'], verbose_mode_enabled=verbose_mode_enabled)
        custom_linters.append(custom_linter)
        third_party_linters.append(third_party_linter)

        config_path_for_css_in_html = os.path.join(
            parent_dir, 'oppia', '.stylelintrc')
        custom_linter, third_party_linter = css_linter.get_linters(
            config_path_for_css_in_html, _FILES['.html'],
            verbose_mode_enabled=verbose_mode_enabled)
        third_party_linters.append(third_party_linter)

    elif file_extension_to_lint == 'css':
        config_path_for_oppia_css = os.path.join(
            parent_dir, 'oppia', 'core', 'templates', 'css', '.stylelintrc')
        custom_linter, third_party_linter = css_linter.get_linters(
            config_path_for_oppia_css, _FILES['.css'],
            verbose_mode_enabled=verbose_mode_enabled)
        third_party_linters.append(third_party_linter)

    elif file_extension_to_lint == 'py':
        custom_linter, third_party_linter = python_linter.get_linters(
            _FILES['.py'], verbose_mode_enabled=verbose_mode_enabled)
        custom_linters.append(custom_linter)
        third_party_linters.append(third_party_linter)

    return custom_linters, third_party_linters


def _get_changed_filepaths():
    """Returns a list of modified files (both staged and unstaged)

    Returns:
        a list of filepaths of modified files.
    """
    unstaged_files = subprocess.check_output([
        'git', 'diff', '--name-only',
        '--diff-filter=ACM']).splitlines()
    staged_files = subprocess.check_output([
        'git', 'diff', '--cached', '--name-only',
        '--diff-filter=ACM']).splitlines()
    all_changed_filepaths = unstaged_files + staged_files
    return [filepath for filepath in all_changed_filepaths]


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
            filepath = os.path.relpath(
                os.path.join(_dir, file_name), os.getcwd())
            if not any([fnmatch.fnmatch(filepath, gp) for gp in
                        excluded_glob_patterns]):
                files_in_directory.append(filepath)
    return files_in_directory


def _get_file_extensions(file_extensions_to_lint):
    """This function is used to return the file extensions which need to be
    linted and checked.

    Args:
        file_extensions_to_lint: list(str). The list of file extensions to be
        linted checked.

    Returns:
        all_file_extensions_type: list(str). The list of all file extensions
        to be linted and checked.
    """
    all_file_extensions_type = ['js', 'py', 'html', 'css', 'other']

    if file_extensions_to_lint:
        # Check if 'js' and 'ts' both are present in file_extensions_to_lint.
        js_and_ts_is_present = 'js' in file_extensions_to_lint and (
            'ts' in file_extensions_to_lint)

        if js_and_ts_is_present:
            python_utils.PRINT(
                'Please use only one of "js" or "ts", as we do not have '
                'separate linters for JS and TS files. If both these options '
                'are used together, then the JS/TS linter will be run twice.')
            python_utils.PRINT('Exiting...')
            sys.exit(1)

        return set(file_extensions_to_lint)

    return all_file_extensions_type


def _get_all_filepaths(input_path, input_filenames):
    """This function is used to return the filepaths which needs to be linted
    and checked.

    Args:
        input_path: str. The path of the directory to be linted and checked.
        input_filenames: list(str). The list of filenames to be linted and
            checked, ignored if input_path is specified.

    Returns:
        all_filepaths: list(str). The list of filepaths to be linted and
            checked.
    """
    eslintignore_path = os.path.join(os.getcwd(), '.eslintignore')
    if input_path:
        input_path = os.path.join(os.getcwd(), input_path)
        if not os.path.exists(input_path):
            python_utils.PRINT(
                'Could not locate file or directory %s. Exiting.' % input_path)
            python_utils.PRINT('----------------------------------------')
            sys.exit(1)
        if os.path.isfile(input_path):
            all_filepaths = [input_path]
        else:
            excluded_glob_patterns = FILE_CACHE.readlines(eslintignore_path)
            all_filepaths = _get_all_files_in_directory(
                input_path, excluded_glob_patterns)
    elif input_filenames:
        valid_filepaths = []
        invalid_filepaths = []
        for filename in input_filenames:
            if os.path.isfile(filename):
                valid_filepaths.append(filename)
            else:
                invalid_filepaths.append(filename)
        if invalid_filepaths:
            python_utils.PRINT(
                'The following file(s) do not exist: %s\n'
                'Exiting.' % invalid_filepaths)
            sys.exit(1)
        all_filepaths = valid_filepaths
    else:
        all_filepaths = _get_changed_filepaths()
    all_filepaths = [
        filename for filename in all_filepaths if not
        any(fnmatch.fnmatch(filename, pattern) for pattern in(
            general_purpose_linter.EXCLUDED_PATHS))]
    return all_filepaths


def read_files(file_paths):
    """Read all files to be checked and cache them. This will spin off multiple
    threads to increase the efficiency.
    """
    threads = []
    for file_path in file_paths:
        thread = threading.Thread(target=FILE_CACHE.read, args=(file_path,))
        thread.start()
        threads.append(thread)

    for thread in threads:
        thread.join()


def categorize_files(file_paths):
    """Categorize all the files and store them in shared variable _FILES."""
    all_filepaths_dict = {
        '.py': [], '.html': [], '.ts': [], '.js': [], 'other': [], '.css': []
    }
    for file_path in file_paths:
        _, extension = os.path.splitext(file_path)
        if extension in all_filepaths_dict:
            all_filepaths_dict[extension].append(file_path)
        else:
            all_filepaths_dict['other'].append(file_path)
    _FILES.update(all_filepaths_dict)


def _print_complete_summary_of_lint_messages(lint_messages):
    """Print complete summary of lint messages."""
    if lint_messages != '':
        python_utils.PRINT('Summary of Errors:')
        python_utils.PRINT('----------------------------------------')
        for message in lint_messages:
            python_utils.PRINT(message)


def _get_task_output(lint_messages, task, semaphore):
    """Returns output of running tasks.

    Args:
        lint_messages: list(str). List of summary messages of linter output.
        task: object(TestingTaskSpec). The task object to get output of linter.
        semaphore: threading.Semaphore. The object that controls how many tasks
            can run at any time.
    """
    if task.output:
        lint_messages += task.output
    semaphore.release()


def _print_errors_stacktrace(errors_stacktrace):
    """Print errors stacktrace caught during linter execution.

    Args:
        errors_stacktrace: list(str). List of error stacktrace of lint
            execution failure.
    """
    python_utils.PRINT('')
    python_utils.PRINT(
        'Unable to run the complete lint test, please check '
        'the following stack trace and fix the errors:')
    python_utils.PRINT('+--------------------------+')
    for stacktrace in errors_stacktrace:
        python_utils.PRINT(stacktrace)
        python_utils.PRINT('--------------------------------------------------')
        python_utils.PRINT('')
    python_utils.PRINT('--------------------------------------------------')
    python_utils.PRINT(
        'Some of the linting functions may not run until the'
        ' above errors gets fixed')


def main(args=None):
    """Main method for pre commit linter script that lints Python, JavaScript,
    HTML, and CSS files.
    """
    parsed_args = _PARSER.parse_args(args=args)
    # File extension to be linted.
    file_extension_types = _get_file_extensions(
        parsed_args.only_check_file_extensions)
    # Default mode is non-verbose mode, if arguments contains --verbose flag it
    # will be made True, which will represent verbose mode.
    verbose_mode_enabled = bool(parsed_args.verbose)
    all_filepaths = _get_all_filepaths(parsed_args.path, parsed_args.files)

    python_utils.PRINT('Starting Linter....')

    if len(all_filepaths) == 0:
        python_utils.PRINT('---------------------------')
        python_utils.PRINT('No files to check.')
        python_utils.PRINT('---------------------------')
        return

    read_files(all_filepaths)
    categorize_files(all_filepaths)

    # Prepare custom tasks.
    custom_max_concurrent_runs = 25
    custom_concurrent_count = min(
        multiprocessing.cpu_count(), custom_max_concurrent_runs)
    custom_semaphore = threading.Semaphore(custom_concurrent_count)

    # Prepare third_party tasks.
    third_party_max_concurrent_runs = 2
    third_party_concurrent_count = min(
        multiprocessing.cpu_count(), third_party_max_concurrent_runs)
    third_party_semaphore = threading.Semaphore(third_party_concurrent_count)

    custom_linters = []
    third_party_linters = []
    for file_extension_type in file_extension_types:
        custom_linter, third_party_linter = _get_linters_for_file_extension(
            file_extension_type, verbose_mode_enabled=verbose_mode_enabled)
        custom_linters += custom_linter
        third_party_linters += third_party_linter

    # Create tasks.
    tasks_custom = []
    tasks_third_party = []

    for linter in custom_linters:
        task_custom = concurrent_task_utils.create_task(
            linter.perform_all_lint_checks, verbose_mode_enabled,
            custom_semaphore, name='custom')
        tasks_custom.append(task_custom)

    for linter in third_party_linters:
        task_third_party = concurrent_task_utils.create_task(
            linter.perform_all_lint_checks, verbose_mode_enabled,
            third_party_semaphore, name='third_party')
        tasks_third_party.append(task_third_party)

    # Execute tasks.
    # Here we set Concurrency limit for custom task to 25 because we need to
    # parallelize the tasks to work on full capacity of CPU.
    # Concurrency limit for third party tasks is set to 2 because these
    # third party libraries have their own ways to lint at their fastest
    # (ie. might parallelize on their own)

    # Concurrency limit: 25.
    concurrent_task_utils.execute_tasks(tasks_custom, custom_semaphore)

    # Concurrency limit: 2.
    concurrent_task_utils.execute_tasks(
        tasks_third_party, third_party_semaphore)

    lint_messages = []

    # Prepare semaphore for locking mechanism.
    semaphore = threading.Semaphore(1)

    for task in tasks_custom:
        semaphore.acquire()
        _get_task_output(lint_messages, task, semaphore)

    for task in tasks_third_party:
        semaphore.acquire()
        _get_task_output(lint_messages, task, semaphore)

    lint_messages += codeowner_linter.check_codeowner_file(
        verbose_mode_enabled)

    lint_messages += (
        third_party_typings_linter.check_third_party_libs_type_defs(
            verbose_mode_enabled))

    _print_complete_summary_of_lint_messages(lint_messages)

    errors_stacktrace = concurrent_task_utils.ALL_ERRORS
    if errors_stacktrace:
        _print_errors_stacktrace(errors_stacktrace)

    if any([message.startswith(linter_utils.FAILED_MESSAGE_PREFIX) for
            message in lint_messages]) or errors_stacktrace:
        python_utils.PRINT('---------------------------')
        python_utils.PRINT('Checks Not Passed.')
        python_utils.PRINT('---------------------------')
        sys.exit(1)
    else:
        python_utils.PRINT('---------------------------')
        python_utils.PRINT('All Checks Passed.')
        python_utils.PRINT('---------------------------')


NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = FileCache()
__builtins__.FILE_CACHE = NAME_SPACE.files


if __name__ == '__main__':
    main()
