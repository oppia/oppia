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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re
import subprocess

import python_utils

from .. import common
from .. import concurrent_task_utils


class ThirdPartyCSSLintChecksManager(python_utils.OBJECT):
    """Manages all the third party Python linting functions."""

    def __init__(self, config_path, files_to_lint):
        """Constructs a ThirdPartyCSSLintChecksManager object.

        Args:
            config_path: str. Path to the configuration file.
            files_to_lint: list(str). A list of filepaths to lint.
        """
        super(ThirdPartyCSSLintChecksManager, self).__init__()
        self.config_path = config_path
        self.files_to_lint = files_to_lint

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.files_to_lint

    @staticmethod
    def _get_trimmed_error_output(css_lint_output):
        """Remove extra bits from stylelint error messages.

        Args:
            css_lint_output: str. Output returned by the css linter.

        Returns:
            str. A string with the trimmed error messages.
        """
        trimmed_error_messages = []
        # We need to extract messages from the list and split them line by
        # line so we can loop through them.
        css_output_lines = css_lint_output.split('\n')
        for line in css_output_lines:
            # Stylelint messages starts with line numbers and then a
            # "x"(\u2716) and a message-id in the end. We are capturing these
            # and then replacing them with empty string('').
            if re.search(r'^\d+:\d+', line.lstrip()):
                error_message = line.replace(u'\u2716 ', '')
            else:
                error_message = line
            trimmed_error_messages.append(error_message)
        return '\n'.join(trimmed_error_messages) + '\n'

    def lint_css_files(self):
        """Prints a list of lint errors in the given list of CSS files.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.
        """
        node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
        stylelint_path = os.path.join(
            'node_modules', 'stylelint', 'bin', 'stylelint.js')
        if not os.path.exists(stylelint_path):
            raise Exception(
                'ERROR    Please run start.sh first to install node-eslint '
                'or node-stylelint and its dependencies.')

        failed = False
        stripped_error_messages = []
        full_error_messages = []
        name = 'Stylelint'

        stylelint_cmd_args = [
            node_path, stylelint_path, '--config=' + self.config_path]
        proc_args = stylelint_cmd_args + self.all_filepaths
        proc = subprocess.Popen(
            proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        encoded_linter_stdout, encoded_linter_stderr = proc.communicate()
        linter_stdout = encoded_linter_stdout.decode(encoding='utf-8')
        linter_stderr = encoded_linter_stderr.decode(encoding='utf-8')

        if linter_stderr:
            raise Exception(linter_stderr)

        if linter_stdout:
            full_error_messages.append(linter_stdout)
            stripped_error_messages.append(
                self._get_trimmed_error_output(linter_stdout))
            failed = True

        return concurrent_task_utils.TaskResult(
            name, failed, stripped_error_messages, full_error_messages)

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
                    'CSS lint', False, [],
                    ['There are no HTML or CSS files to lint.'])]

        return [self.lint_css_files()]


def get_linters(config_path, files_to_lint):
    """Creates ThirdPartyCSSLintChecksManager and returns it.

    Args:
        config_path: str. Path to the configuration file.
        files_to_lint: list(str). A list of filepaths to lint.

    Returns:
        tuple(None, ThirdPartyCSSLintChecksManager). A 2-tuple of custom and
        third_party linter objects.
    """
    third_party_linter = ThirdPartyCSSLintChecksManager(
        config_path, files_to_lint)

    return None, third_party_linter
