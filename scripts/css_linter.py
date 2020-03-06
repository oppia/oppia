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

import multiprocessing
import os
import subprocess
import sys
import threading
import time

NODE_DIR = os.path.abspath(
    os.path.join(os.getcwd(), os.pardir, 'oppia_tools', 'node-10.18.0'))

sys.path.insert(0, os.getcwd())

# pylint: disable=wrong-import-position
from . import linter_manager  # isort:skip
from . import semaphore_utils  # isort:skip

# pylint: disable=wrong-import-position
import python_utils  # isort:skip

_MESSAGE_TYPE_SUCCESS = 'SUCCESS'
_MESSAGE_TYPE_FAILED = 'FAILED'


class CSSLintChecksManager(linter_manager.LintChecksManager):
    """Manages all the CSS linting functions.

    Attributes:
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(
            self, files_to_lint, verbose_mode_enabled):
        """Constructs a CSSLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        super(CSSLintChecksManager, self).__init__()
        self.files_to_lint = files_to_lint
        self.verbose_mode_enabled = verbose_mode_enabled

    @property
    def css_filepaths(self):
        """Return css filepaths."""
        return self.files_to_lint

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.css_filepaths

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """

        if not self.all_filepaths:
            python_utils.PRINT('')
            python_utils.PRINT('There are no CSS files to lint.')
            return []

        common_messages = super(
            CSSLintChecksManager, self).perform_all_lint_checks()

        all_messages = common_messages
        return all_messages


class ThirdPartyCSSLintChecksManager(python_utils.OBJECT):
    """Manages all the third party Python linting functions.

    Attributes:
        config_path: str. Path to the configuration file.
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(
            self, config_path, files_to_lint,
            verbose_mode_enabled=False):
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

    def _lint_css_files(self):
        """Prints a list of lint errors in the given list of CSS files.

        Returns:
            summary_messages: list(str). Return summary of lint checks.
        """
        node_path = os.path.join(NODE_DIR, 'bin', 'node')
        stylelint_path = os.path.join(
            'node_modules', 'stylelint', 'bin', 'stylelint.js')
        if not os.path.exists(stylelint_path):
            python_utils.PRINT('')
            python_utils.PRINT(
                'ERROR    Please run start.sh first to install node-eslint ')
            python_utils.PRINT(
                '         or node-stylelint and its dependencies.')
            sys.exit(1)
        files_to_lint = self.all_filepaths
        start_time = time.time()
        num_files_with_errors = 0
        summary_messages = []

        num_css_files = len(files_to_lint)
        python_utils.PRINT('Total css files: ', num_css_files)
        stylelint_cmd_args = [
            node_path, stylelint_path, '--config=' + self.config_path]
        result_list = []
        if not self.verbose_mode_enabled:
            python_utils.PRINT('Linting CSS files.')
        for _, filepath in enumerate(files_to_lint):
            if self.verbose_mode_enabled:
                python_utils.PRINT('Linting: ', filepath)
            proc_args = stylelint_cmd_args + [filepath]
            proc = subprocess.Popen(
                proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            encoded_linter_stdout, encoded_linter_stderr = proc.communicate()
            linter_stdout = encoded_linter_stdout.decode(encoding='utf-8')
            linter_stderr = encoded_linter_stderr.decode(encoding='utf-8')
            if linter_stderr:
                python_utils.PRINT('LINTER FAILED')
                python_utils.PRINT(linter_stderr)
                sys.exit(1)

            if linter_stdout:
                num_files_with_errors += 1
                result_list.append(linter_stdout)

        if num_files_with_errors:
            for error in result_list:
                python_utils.PRINT(error)
                summary_messages.append(error)
            summary_message = ('%s    %s CSS file' % (
                _MESSAGE_TYPE_FAILED, num_files_with_errors))
        else:
            summary_message = ('%s   %s CSS file linted (%.1f secs)' % (
                _MESSAGE_TYPE_SUCCESS, num_css_files, time.time() - start_time))
        python_utils.PRINT(summary_message)
        summary_messages.append(summary_message)

        python_utils.PRINT('CSS linting finished.')
        return summary_messages

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        all_messages = []
        if not self.all_filepaths:
            python_utils.PRINT('')
            python_utils.PRINT(
                'There are no HTML or CSS files to lint.')
            return all_messages

        css_linter_messages = self._lint_css_files()

        all_messages += css_linter_messages

        return all_messages


def perform_all_lint_checks(
        files_to_lint, file_extension_type, verbose_mode_enabled=False):
    """Perform all the lint checks and returns the messages returned by all
    the checks.

    Args:
        files_to_lint: list(str). A list of filepaths to lint.
        file_extension_type: list(str). The list of file extensions to be
            linted.
        verbose_mode_enabled: bool. True if verbose mode is enabled.

    Returns:
        all_messages: str. All the messages returned by the lint checks.
    """
    # Prepare tasks.
    max_concurrent_runs = 25
    concurrent_count = min(multiprocessing.cpu_count(), max_concurrent_runs)
    semaphore = threading.Semaphore(concurrent_count)

    parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))

    if file_extension_type == 'html':
        config_path = os.path.join(
            parent_dir, 'oppia', '.stylelintrc')

    if file_extension_type == 'css':
        config_path = os.path.join(
            parent_dir, 'oppia', 'core', 'templates', 'css', '.stylelintrc')

    custom_linter = CSSLintChecksManager(   # pylint: disable=no-value-for-parameter
        files_to_lint, verbose_mode_enabled)

    task_custom = semaphore_utils.create_task(
        custom_linter.perform_all_lint_checks, verbose_mode_enabled,
        name=file_extension_type)

    if file_extension_type == 'css':
        third_party_linter = ThirdPartyCSSLintChecksManager(
            config_path, files_to_lint, verbose_mode_enabled)

        task_third_party = semaphore_utils.create_task(
            third_party_linter.perform_all_lint_checks, verbose_mode_enabled,
            semaphore=semaphore, name=file_extension_type)

        return task_custom, task_third_party

    return task_custom
