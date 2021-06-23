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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re
import subprocess

import python_utils

from .. import common
from .. import concurrent_task_utils

COMPILED_TYPESCRIPT_TMP_PATH = 'tmpcompiledjs/'


class ThirdPartyJsTsLintChecksManager(python_utils.OBJECT):
    """Manages all the third party Python linting functions."""

    def __init__(self, files_to_lint):
        """Constructs a ThirdPartyJsTsLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
        """
        super(ThirdPartyJsTsLintChecksManager, self).__init__()
        self.files_to_lint = files_to_lint

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.files_to_lint

    @staticmethod
    def _get_trimmed_error_output(eslint_output):
        """Remove extra bits from eslint messages.

        Args:
            eslint_output: str. Output returned by the eslint linter.

        Returns:
            str. A string with the trimmed messages.
        """
        trimmed_error_messages = []
        # Extract the message from list and split the message by newline
        # so that we can use them and remove last four lines from the end.
        # Becuase last two lines are empty strings and third one have a message
        # with number of errors.
        # Example: \u2716 2 problems (2 errors, 0 warnings)
        # 1 error and 0 warnings potentially fixable with the `--fix` option.
        eslint_output_lines = eslint_output.split('\n')
        newlines_present = eslint_output_lines[-1] == '' and (
            eslint_output_lines[-2] == '')
        fix_option_present = eslint_output_lines[-3].endswith('`--fix` option.')
        unicode_x_present = eslint_output_lines[-4].startswith('\u2716')

        if (newlines_present and fix_option_present and unicode_x_present):
            eslint_output_lines = eslint_output_lines[:-4]

        for line in eslint_output_lines:
            # ESlint messages start with line numbers and then a
            # "x" and a message-id in the end. We are matching
            # if the line contains line number because every message start with
            # num:num where num is of type int and we are matching it with regex
            # and if that is True then we are replacing "error" with empty
            # string('') which is at the index 1 and message-id from the end.
            if re.search(r'^\d+:\d+', line.lstrip()):
                error_string = re.search(r'error', line).group(0)
                error_message = line.replace(error_string, '', 1)
            else:
                error_message = line
            trimmed_error_messages.append(error_message)
        return '\n'.join(trimmed_error_messages) + '\n'

    def _lint_js_and_ts_files(self):
        """Prints a list of lint errors in the given list of JavaScript files.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.
        """
        node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
        eslint_path = os.path.join(
            'node_modules', 'eslint', 'bin', 'eslint.js')
        if not os.path.exists(eslint_path):
            raise Exception(
                'ERROR    Please run start.sh first to install node-eslint '
                'and its dependencies.')

        files_to_lint = self.all_filepaths
        error_messages = []
        full_error_messages = []
        failed = False
        name = 'ESLint'

        eslint_cmd_args = [node_path, eslint_path, '--quiet']
        proc_args = eslint_cmd_args + files_to_lint
        proc = subprocess.Popen(
            proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        encoded_linter_stdout, encoded_linter_stderr = proc.communicate()
        linter_stdout = encoded_linter_stdout.decode(encoding='utf-8')
        linter_stderr = encoded_linter_stderr.decode(encoding='utf-8')
        if linter_stderr:
            raise Exception(linter_stderr)

        if linter_stdout:
            failed = True
            full_error_messages.append(linter_stdout)
            error_messages.append(self._get_trimmed_error_output(linter_stdout))

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, full_error_messages)

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """
        if not self.all_filepaths:
            return [
                concurrent_task_utils.TaskResult(
                    'JS TS lint', False, [],
                    ['There are no JavaScript or Typescript files to lint.'])]

        return [self._lint_js_and_ts_files()]
