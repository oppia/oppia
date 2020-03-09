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
        python -m scripts.pre_commit_linter

2.  To lint all files in the folder or to lint just a specific file
        python -m scripts.pre_commit_linter --path filepath

3.  To lint a specific list of files (*.js/*.py only). Separate files by spaces
        python -m scripts.pre_commit_linter --files file_1 file_2 ... file_n

4.  To lint files in verbose mode
        python -m scripts.pre_commit_linter --verbose

5. To lint a specific list of file extensions (*.js/*.py only). Separate file
    extensions by spaces
        python -m scripts.pre_commit_linter --only-check-file-extensions .py .js

Note that the root folder MUST be named 'oppia'.
 """

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

# Pylint has issues with the import order of argparse.
# pylint: disable=wrong-import-order
import argparse
import fnmatch
import multiprocessing
import os
import subprocess
import sys
import threading

# Install third party dependencies before proceeding.
from . import codeowner_linter
from . import css_linter
from . import general_purpose_linter
from . import html_linter
from . import js_ts_linter
from . import python_linter
from .. import concurrent_task_utils
from .. import install_third_party_libs

install_third_party_libs.main()

# pylint: disable=wrong-import-position
import python_utils  # isort:skip

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
    help='specific file extensions to be linted. Space separated list',
    action='store')

EXCLUDED_PATHS = (
    'third_party/*', 'build/*', '.git/*', '*.pyc', 'CHANGELOG',
    'integrations/*', 'integrations_dev/*', '*.svg', '*.gif',
    '*.png', '*.zip', '*.ico', '*.jpg', '*.min.js', 'backend_prod_files/*',
    'assets/scripts/*', 'core/tests/data/*', 'core/tests/build_sources/*',
    '*.mp3', '*.mp4', 'node_modules/*', 'typings/*', 'local_compiled_js/*',
    'webpack_bundles/*', 'core/tests/services_sources/*',
    'core/tests/release_sources/tmp_unzip.zip',
    'core/tests/release_sources/tmp_unzip.tar.gz')

# NOTE TO DEVELOPERS: This should match the version of Node used in common.py.
NODE_DIR = os.path.abspath(
    os.path.join(os.getcwd(), os.pardir, 'oppia_tools', 'node-10.18.0'))

if not os.getcwd().endswith('oppia'):
    python_utils.PRINT('')
    python_utils.PRINT(
        'ERROR    Please run this script from the oppia root directory.')

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYLINT_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-1.9.4')
if not os.path.exists(_PYLINT_PATH):
    python_utils.PRINT('')
    python_utils.PRINT(
        'ERROR  Please run install_third_party_libs.py first to install pylint')
    python_utils.PRINT('         and its dependencies.')
    sys.exit(1)

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
    os.path.join(_PARENT_DIR, 'oppia_tools', 'webtest-2.0.33'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'browsermob-proxy-0.8.0'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'selenium-3.13.0'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'Pillow-6.0.0'),
    os.path.join(_PARENT_DIR, 'oppia_tools', 'psutil-5.6.7'),
    os.path.join('third_party', 'backports.functools_lru_cache-1.5'),
    os.path.join('third_party', 'beautifulsoup4-4.7.1'),
    os.path.join('third_party', 'bleach-3.1.0'),
    os.path.join('third_party', 'callbacks-0.3.0'),
    os.path.join('third_party', 'gae-cloud-storage-1.9.22.1'),
    os.path.join('third_party', 'gae-mapreduce-1.9.22.0'),
    os.path.join('third_party', 'gae-pipeline-1.9.22.1'),
    os.path.join('third_party', 'mutagen-1.42.0'),
    os.path.join('third_party', 'soupsieve-1.9.1'),
    os.path.join('third_party', 'six-1.12.0'),
    os.path.join('third_party', 'webencodings-0.5.1'),
]
for path in _PATHS_TO_INSERT:
    sys.path.insert(0, path)

_MESSAGE_TYPE_SUCCESS = 'SUCCESS'
_MESSAGE_TYPE_FAILED = 'FAILED'
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
            with python_utils.open_file(filepath, mode) as f:
                lines = f.readlines()
                self._CACHE_DATA_DICT[key] = (''.join(lines), tuple(lines))
        return self._CACHE_DATA_DICT[key]


def _lint_all_files(
        js_filepaths, ts_filepaths, py_filepaths, html_filepaths,
        css_filepaths, file_extension_type, verbose_mode_enabled=False):
    """Run all lint checks.

    Args:
        js_filepaths: list(str). The list of js filepaths to be linted.
        ts_filepaths: list(str). The list of ts filepaths to be linted.
        py_filepaths: list(str). The list of python filepaths to be linted.
        html_filepaths: list(str). The list of HTML filepaths to be linted.
        css_filepaths: list(str). The list of CSS filepaths to be linted.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
        file_extension_type: list(str). The list of file extensions to be
            linted.

    Returns:
        custom_linter: list. Custom lint checks.
        third_party_linter: list. Third party lint checks.
    """
    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    config_path_for_css_in_html = os.path.join(
        parent_dir, 'oppia', '.stylelintrc')
    config_path_for_oppia_css = os.path.join(
        parent_dir, 'oppia', 'core', 'templates', 'css', '.stylelintrc')
    custom_linters = []
    third_party_linters = []

    js_ts_file_extension = '.js' in file_extension_type or (
        '.ts' in file_extension_type)
    py_file_extension = '.py' in file_extension_type
    html_file_extension = '.html' in file_extension_type
    css_file_extension = '.css' in file_extension_type

    js_ts_file_paths = js_filepaths + ts_filepaths

    custom_linter = general_purpose_linter.GeneralPurposeLinter(
        _FILES[file_extension_type], verbose_mode_enabled=verbose_mode_enabled)
    custom_linters.append(custom_linter)

    if js_ts_file_extension:
        custom_linter = js_ts_linter.JsTsLintChecksManager(
            js_filepaths, ts_filepaths,
            verbose_mode_enabled=verbose_mode_enabled)
        third_party_linter = js_ts_linter.ThirdPartyJsTsLintChecksManager(
            js_ts_file_paths, verbose_mode_enabled=verbose_mode_enabled)
        custom_linters.append(custom_linter)
        third_party_linters.append(third_party_linter)

    if html_file_extension:
        custom_linter = html_linter.HTMLLintChecksManager(
            html_filepaths, verbose_mode_enabled=verbose_mode_enabled)
        third_party_linter = html_linter.ThirdPartyHTMLLintChecksManager(
            html_filepaths, verbose_mode_enabled=verbose_mode_enabled)
        custom_linters.append(custom_linter)
        third_party_linters.append(third_party_linter)

        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            config_path_for_css_in_html, html_filepaths,
            verbose_mode_enabled=verbose_mode_enabled)
        third_party_linters.append(third_party_linter)

    if css_file_extension:
        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            config_path_for_oppia_css, css_filepaths,
            verbose_mode_enabled=verbose_mode_enabled)
        third_party_linters.append(third_party_linter)

    if py_file_extension:
        custom_linter = python_linter.PythonLintChecksManager(
            py_filepaths, verbose_mode_enabled=verbose_mode_enabled)
        third_party_linter = python_linter.ThirdPartyPythonLintChecksManager(
            py_filepaths, verbose_mode_enabled=verbose_mode_enabled)
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


def _get_file_extensions(file_extension_type):
    """This function is used to return the file extensions which need to be
    linted and checked.

    Args:
        file_extension_type: list(str). The list of file extensions to be
        linted checked.

    Returns:
        all_file_extensions_type: list(str). The list of all file extensions
        to be linted and checked.
    """
    all_file_extensions_type = ['.js', '.py', '.html', '.css']

    if file_extension_type:
        return file_extension_type

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
        any(fnmatch.fnmatch(filename, pattern) for pattern in EXCLUDED_PATHS)]
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

    max_concurrent_runs = 1

    # Prepare tasks.
    concurrent_count = min(multiprocessing.cpu_count(), max_concurrent_runs)
    semaphore = threading.Semaphore(concurrent_count)

    custom_linters = []
    third_party_linters = []
    for file_extension_type in file_extension_types:
        custom_linter, third_party_linter = _lint_all_files(
            _FILES['.js'], _FILES['.ts'], _FILES['.py'], _FILES['.html'],
            _FILES['.css'], file_extension_type,
            verbose_mode_enabled=verbose_mode_enabled)
        custom_linters += custom_linter
        third_party_linters += third_party_linter

    tasks_custom = []
    tasks_third_party = []

    for linter in custom_linters:
        task_custom = concurrent_task_utils.create_task(
            linter.perform_all_lint_checks,
            verbose=verbose_mode_enabled, name='custom')
        tasks_custom.append(task_custom)

    for linter in third_party_linters:
        task_third_party = concurrent_task_utils.create_task(
            linter.perform_all_lint_checks,
            verbose=verbose_mode_enabled, semaphore=semaphore,
            name='third_party')
        tasks_third_party.append(task_third_party)

    concurrent_task_utils.execute_tasks(tasks_custom)
    concurrent_task_utils.execute_tasks(tasks_third_party, semaphore=semaphore)

    all_messages = []

    for task in tasks_custom:
        all_messages += task.output

    for task in tasks_third_party:
        all_messages += task.output

    code_owner_message = codeowner_linter.check_codeowner_file(
        verbose_mode_enabled)
    all_messages += code_owner_message

    if any([message.startswith(_MESSAGE_TYPE_FAILED) for message in
            all_messages]):
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
