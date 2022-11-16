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

"""Lint checks for python files."""

from __future__ import annotations

import os
import subprocess

from typing import Final, List, Tuple

from . import linter_utils
from .. import common
from .. import concurrent_task_utils

STYLELINT_CONFIG: Final = os.path.join('.stylelintrc')


class ThirdPartyCSSLintChecksManager(linter_utils.BaseLinter):
    """Manages all the third party Python linting functions."""

    def __init__(self, files_to_lint: List[str]) -> None:
        """Constructs a ThirdPartyCSSLintChecksManager object.

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
    def _get_trimmed_error_output(css_lint_output: str) -> str:
        """Remove extra bits from stylelint error messages.

        Args:
            css_lint_output: str. Output returned by the css linter.

        Returns:
            str. A string with the trimmed error messages.
        """
        return '%s\n' % css_lint_output

    def lint_css_files(self) -> concurrent_task_utils.TaskResult:
        """Prints a list of lint errors in the given list of CSS files.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.

        Raises:
            Exception. The start.py file not executed.
        """
        node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
        stylelint_path = os.path.join(
            'node_modules', 'stylelint', 'bin', 'stylelint.js')
        if not os.path.exists(stylelint_path):
            raise Exception(
                'ERROR    Please run start.py first to install node-eslint '
                'or node-stylelint and its dependencies.')

        failed = False
        stripped_error_messages = []
        full_error_messages = []
        name = 'Stylelint'

        stylelint_cmd_args = [
            node_path, stylelint_path, '--config=' + STYLELINT_CONFIG]
        proc_args = stylelint_cmd_args + self.all_filepaths
        proc = subprocess.Popen(
            proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        encoded_linter_stdout, encoded_linter_stderr = proc.communicate()
        # Standard and error output is in bytes, we need to decode the line to
        # print it.
        linter_stdout = encoded_linter_stdout.decode('utf-8')
        linter_stderr = encoded_linter_stderr.decode('utf-8')

        if linter_stderr:
            raise Exception(linter_stderr)

        if linter_stdout:
            full_error_messages.append(linter_stdout)
            stripped_error_messages.append(
                self._get_trimmed_error_output(linter_stdout))
            failed = True

        return concurrent_task_utils.TaskResult(
            name, failed, stripped_error_messages, full_error_messages)

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
                    'CSS lint', False, [],
                    ['There are no HTML or CSS files to lint.'])]

        return [self.lint_css_files()]


def get_linters(
    files_to_lint: List[str]
) -> Tuple[None, ThirdPartyCSSLintChecksManager]:
    """Creates ThirdPartyCSSLintChecksManager and returns it.

    Args:
        files_to_lint: list(str). A list of filepaths to lint.

    Returns:
        tuple(None, ThirdPartyCSSLintChecksManager). A 2-tuple of custom and
        third_party linter objects.
    """
    return None, ThirdPartyCSSLintChecksManager(files_to_lint)
