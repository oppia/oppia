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
import subprocess

from typing import Final, List, Tuple

from .. import common, concurrent_task_utils
from . import linter_utils

MYPY = False

COMPILED_TYPESCRIPT_TMP_PATH: Final = 'tmpcompiledjs/'


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
) -> Tuple[ThirdPartyJsTsLintChecksManager, None]:
    """Creates ThirdPartyJsTsLintChecksManager
        objects and return them.

    Args:
        js_filepaths: list(str). A list of js filepaths to lint.
        ts_filepaths: list(str). A list of ts filepaths to lint.

    Returns:
        tuple(ThirdPartyJsTsLintChecksManager, None). A 2-tuple of custom and
        third_party linter objects.
    """
    js_ts_file_paths = js_filepaths + ts_filepaths

    third_party_linter = ThirdPartyJsTsLintChecksManager(js_ts_file_paths)

    return third_party_linter, None
