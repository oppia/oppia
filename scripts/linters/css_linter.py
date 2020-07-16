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
import sys
import time

import python_utils

from . import linter_utils
from .. import common
from .. import concurrent_task_utils


class ThirdPartyCSSLintChecksManager(python_utils.OBJECT):
    """Manages all the third party Python linting functions.

    Attributes:
        config_path: str. Path to the configuration file.
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """

    def __init__(
            self, config_path, files_to_lint,
            verbose_mode_enabled):
        """Constructs a ThirdPartyCSSLintChecksManager object.

        Args:
            config_path: str. Path to the configuration file.
            files_to_lint: list(str). A list of filepaths to lint.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        super(ThirdPartyCSSLintChecksManager, self).__init__()
        self.config_path = config_path
        self.files_to_lint = files_to_lint
        self.verbose_mode_enabled = verbose_mode_enabled

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
                # Replacing message-id with an empty string('').
                line = re.sub(r'(\w+-*)+$', '', line)
                unicode_x = re.search(r'\u2716', line).group(0)
                error_message = line.replace(unicode_x, '', 1)
            else:
                error_message = line
            trimmed_error_messages.append(error_message)
        return '\n'.join(trimmed_error_messages) + '\n'

    def _lint_css_files(self):
        """Prints a list of lint errors in the given list of CSS files.

        Returns:
            summary_messages: list(str). Return summary of lint checks.
        """
        node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
        stylelint_path = os.path.join(
            'node_modules', 'stylelint', 'bin', 'stylelint.js')
        if not os.path.exists(stylelint_path):
            concurrent_task_utils.log('')
            concurrent_task_utils.log(
                'ERROR    Please run start.sh first to install node-eslint ')
            concurrent_task_utils.log(
                '         or node-stylelint and its dependencies.')
            sys.exit(1)
        files_to_lint = self.all_filepaths
        start_time = time.time()
        num_files_with_errors = 0
        summary_messages = []

        num_css_files = len(files_to_lint)
        concurrent_task_utils.log('Total css files: %s' % num_css_files)
        stylelint_cmd_args = [
            node_path, stylelint_path, '--config=' + self.config_path]
        result_list = []
        if not self.verbose_mode_enabled:
            concurrent_task_utils.log('Linting CSS files.')
        for _, filepath in enumerate(files_to_lint):
            if self.verbose_mode_enabled:
                concurrent_task_utils.log('Linting: %s' % filepath)
            proc_args = stylelint_cmd_args + [filepath]
            proc = subprocess.Popen(
                proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            encoded_linter_stdout, encoded_linter_stderr = proc.communicate()
            linter_stdout = encoded_linter_stdout.decode(encoding='utf-8')
            linter_stderr = encoded_linter_stderr.decode(encoding='utf-8')
            if linter_stderr:
                concurrent_task_utils.log('LINTER FAILED')
                concurrent_task_utils.log(linter_stderr)
                sys.exit(1)

            if linter_stdout:
                num_files_with_errors += 1
                result_list.append(linter_stdout)

        if num_files_with_errors:
            for result in result_list:
                concurrent_task_utils.log(result)
                summary_messages.append(
                    self._get_trimmed_error_output(result))
            summary_message = ('%s %s CSS file' % (
                linter_utils.FAILED_MESSAGE_PREFIX, num_files_with_errors))
        else:
            summary_message = ('%s %s CSS file linted (%.1f secs)' % (
                linter_utils.SUCCESS_MESSAGE_PREFIX, num_css_files,
                time.time() - start_time))
        concurrent_task_utils.log(summary_message)
        summary_messages.append(summary_message)

        concurrent_task_utils.log('CSS linting finished.')
        return summary_messages

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        if not self.all_filepaths:
            concurrent_task_utils.log('')
            concurrent_task_utils.log(
                'There are no HTML or CSS files to lint.')
            return []

        return self._lint_css_files()


def get_linters(config_path, files_to_lint, verbose_mode_enabled=False):
    """Creates ThirdPartyCSSLintChecksManager and returns it.

    Args:
        config_path: str. Path to the configuration file.
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.

    Returns:
        tuple(None, ThirdPartyCSSLintChecksManager). A 2-tuple of custom and
        third_party linter objects.
    """
    third_party_linter = ThirdPartyCSSLintChecksManager(
        config_path, files_to_lint, verbose_mode_enabled)

    return None, third_party_linter
