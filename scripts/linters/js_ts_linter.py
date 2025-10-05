# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Lint checks for Js and Ts files."""

from __future__ import annotations

import os
import re
import shutil
import subprocess

from typing import Final, List, Tuple

from .. import common, concurrent_task_utils
from . import linter_utils

MYPY = False
if MYPY:  # pragma: no cover
    from scripts.linters import run_lint_checks

COMPILED_TYPESCRIPT_TMP_PATH: Final = 'tmpcompiledjs/'

# The INJECTABLES_TO_IGNORE contains a list of services that are not supposed
# to be included in angular-services.index.ts. These services are not required
# for our application to run but are only present to aid tests or belong to a
# class of legacy services that will soon be removed from the codebase.
# NOTE TO DEVELOPERS: Don't add any more files to this list. If you have any
# questions, please talk to @srijanreddy98.
INJECTABLES_TO_IGNORE: Final = [
    # This file is required for the js-ts-linter-test.
    'MockIgnoredService',
    # Route guards cannot be made injectables until migration is complete.
    'CanAccessSplashPageGuard',
]


def compile_all_ts_files() -> None:
    """Compiles all project typescript files into
    COMPILED_TYPESCRIPT_TMP_PATH. Previously, we only compiled
    the TS files that were needed, but when a relative import was used, the
    linter would crash with a FileNotFound exception before being able to
    run. For more details, please see issue #9458.
    """
    cmd = ('./node_modules/typescript/bin/tsc -p %s -outDir %s') % (
        './tsconfig-lint.json',
        COMPILED_TYPESCRIPT_TMP_PATH,
    )
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True
    )

    _, encoded_stderr = proc.communicate()
    stderr = encoded_stderr.decode('utf-8')

    if stderr:
        raise Exception(stderr)


class JsTsLintChecksManager(linter_utils.BaseLinter):
    """Manages all the Js and Ts linting functions."""

    def __init__(
        self,
        js_files: List[str],
        ts_files: List[str],
        file_cache: run_lint_checks.FileCache,
    ) -> None:
        """Constructs a JsTsLintChecksManager object.

        Args:
            js_files: list(str). The list of js filepaths to be linted.
            ts_files: list(str). The list of ts filepaths to be linted.
            file_cache: object(FileCache). Provides thread-safe access to cached
                file content.
        """
        os.environ['PATH'] = '%s/bin:' % common.NODE_PATH + os.environ['PATH']

        self.js_files = js_files
        self.ts_files = ts_files
        self.file_cache = file_cache

    @property
    def js_filepaths(self) -> List[str]:
        """Return all js filepaths."""
        return self.js_files

    @property
    def ts_filepaths(self) -> List[str]:
        """Return all ts filepaths."""
        return self.ts_files

    @property
    def all_filepaths(self) -> List[str]:
        """Return all filepaths."""
        return self.js_filepaths + self.ts_filepaths

    def _check_angular_services_index(self) -> concurrent_task_utils.TaskResult:
        """Finds all @Injectable classes and makes sure that they are added to
            Oppia root and Angular Services Index.

        Returns:
            TaskResult. TaskResult having all the messages returned by the
            lint checks.
        """
        name = 'Angular Services Index file'
        error_messages: List[str] = []
        injectable_pattern = '%s%s' % (
            'Injectable\\({\\n*\\s*providedIn: \'root\'\\n*}\\)\\n',
            'export class ([A-Za-z0-9]*)',
        )
        angular_services_index_path = (
            './core/templates/services/angular-services.index.ts'
        )
        angular_services_index = self.file_cache.read(
            angular_services_index_path
        )
        error_messages = []
        failed = False
        for file_path in self.ts_files:
            file_content = self.file_cache.read(file_path)
            class_names = re.findall(injectable_pattern, file_content)
            for class_name in class_names:
                if class_name in INJECTABLES_TO_IGNORE:
                    continue
                import_statement_regex = 'import {[\\s*\\w+,]*%s' % class_name
                if not re.search(
                    import_statement_regex, angular_services_index
                ):
                    error_message = (
                        'Please import %s to Angular Services Index file in %s'
                        'from %s'
                        % (class_name, angular_services_index_path, file_path)
                    )
                    error_messages.append(error_message)
                    failed = True

                service_name_type_pair_regex = '\\[\'%s\',\\n*\\s*%s\\]' % (
                    class_name,
                    class_name,
                )
                service_name_type_pair = '[\'%s\', %s]' % (
                    class_name,
                    class_name,
                )

                if not re.search(
                    service_name_type_pair_regex, angular_services_index
                ):
                    error_message = (
                        'Please add the pair %s to the angularServices in %s'
                        % (service_name_type_pair, angular_services_index_path)
                    )
                    error_messages.append(error_message)
                    failed = True
        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages
        )

    def perform_all_lint_checks(self) -> List[concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """

        if not self.all_filepaths:
            return [
                concurrent_task_utils.TaskResult(
                    'JS TS lint',
                    False,
                    [],
                    ['There are no JavaScript or Typescript files to lint.'],
                )
            ]

        # Clear temp compiled typescript files from the previous runs.
        shutil.rmtree(COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        # Compiles all typescript files into COMPILED_TYPESCRIPT_TMP_PATH.
        compile_all_ts_files()

        linter_stdout = []

        linter_stdout.append(self._check_angular_services_index())

        # Clear temp compiled typescript files.
        shutil.rmtree(COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)

        return linter_stdout


class ThirdPartyJsTsLintChecksManager(linter_utils.BaseLinter):
    """Manages all the third party JavaScript/TypeScript linting functions."""

    def __init__(self, files_to_lint: List[str]) -> None:
        """Constructs a ThirdPartyJsTsLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
        """
        super().__init__()
        self.files_to_lint = files_to_lint

    @property
    def all_filepaths(self) -> List[str]:
        """Return all filepaths."""
        return self.files_to_lint

    @staticmethod
    def _get_trimmed_error_output(eslint_output: str) -> str:
        """Remove extra bits from eslint messages.

        Args:
            eslint_output: str. Output returned by the eslint linter.

        Returns:
            str. A string with the trimmed messages.
        """

        trimmed_error_messages = []
        # Extract the message from list and split the message by newline
        # so that we can use them and remove last four lines from the end.
        # Because last two lines are empty strings and third one have a message
        # with number of errors.
        # Example: \u2716 2 problems (2 errors, 0 warnings)
        # 1 error and 0 warnings potentially fixable with the `--fix` option.
        eslint_output_lines = eslint_output.split('\n')

        # Check if we have enough lines before accessing indices.
        if len(eslint_output_lines) >= 4:
            newlines_present = eslint_output_lines[-1] == '' and (
                eslint_output_lines[-2] == ''
            )
            fix_option_present = eslint_output_lines[-3].endswith(
                '`--fix` option.'
            )
            unicode_x_present = eslint_output_lines[-4].startswith('\u2716')

            if newlines_present and fix_option_present and unicode_x_present:
                eslint_output_lines = eslint_output_lines[:-4]

        for line in eslint_output_lines:
            # ESlint messages start with line numbers and then a
            # "x" and a message-id in the end. We are matching
            # if the line contains line number because every message start with
            # num:num where num is of type int and we are matching it with regex
            # and if that is True then we are replacing "error" with empty
            # string('') which is at the index 1 and message-id from the end.
            if re.search(r'^\d+:\d+', line.lstrip()):
                searched_error_string = re.search(r'error', line)
                # If the regex '^\d+:\d+' is matched then the output line of
                # es-lint is an error message, and in the error message, 'error'
                # keyword is always present. So, 'searched_error_string' is
                # never going to be None here.
                assert searched_error_string is not None
                error_string = searched_error_string.group(0)
                error_message = line.replace(error_string, '', 1)
            else:
                error_message = line
            trimmed_error_messages.append(error_message)
        return '%s\n' % '\n'.join(trimmed_error_messages)

    def _lint_js_and_ts_files(self) -> concurrent_task_utils.TaskResult:
        """Prints a list of lint errors in the given list of JavaScript files.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.

        Raises:
            Exception. The start.py file not executed.
        """
        node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
        eslint_path = os.path.join('node_modules', 'eslint', 'bin', 'eslint.js')
        if not os.path.exists(eslint_path):
            raise Exception(
                'ERROR    Please run start.py first to install node-eslint '
                'and its dependencies.'
            )

        files_to_lint = self.all_filepaths
        error_messages = []
        full_error_messages = []
        failed = False
        name = 'ESLint'

        eslint_cmd_args = [node_path, eslint_path, '--quiet']
        proc_args = eslint_cmd_args + files_to_lint
        proc = subprocess.Popen(
            proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )

        encoded_linter_stdout, encoded_linter_stderr = proc.communicate()
        # Standard and error output is in bytes, we need to decode the line to
        # print it.
        linter_stdout = encoded_linter_stdout.decode('utf-8')
        linter_stderr = encoded_linter_stderr.decode('utf-8')
        if linter_stderr:
            raise Exception(linter_stderr)

        if linter_stdout:
            failed = True
            full_error_messages.append(linter_stdout)
            error_messages.append(self._get_trimmed_error_output(linter_stdout))

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, full_error_messages
        )

    def perform_all_lint_checks(self) -> List[concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """
        if not self.all_filepaths:
            return [
                concurrent_task_utils.TaskResult(
                    'JS TS lint',
                    False,
                    [],
                    ['There are no JavaScript or Typescript files to lint.'],
                )
            ]

        return [self._lint_js_and_ts_files()]


def get_linters(
    js_filepaths: List[str],
    ts_filepaths: List[str],
    file_cache: run_lint_checks.FileCache,
) -> Tuple[JsTsLintChecksManager, ThirdPartyJsTsLintChecksManager]:
    """Creates JsTsLintChecksManager and ThirdPartyJsTsLintChecksManager
        objects and return them.

    Args:
        js_filepaths: list(str). A list of js filepaths to lint.
        ts_filepaths: list(str). A list of ts filepaths to lint.
        file_cache: object(FileCache). Provides thread-safe access to cached
            file content.

    Returns:
        tuple(JsTsLintChecksManager, ThirdPartyJsTsLintChecksManager. A 2-tuple
        of custom and third_party linter objects.
    """
    js_ts_file_paths = js_filepaths + ts_filepaths

    custom_linter = JsTsLintChecksManager(
        js_filepaths, ts_filepaths, file_cache
    )

    third_party_linter = ThirdPartyJsTsLintChecksManager(js_ts_file_paths)

    return custom_linter, third_party_linter
