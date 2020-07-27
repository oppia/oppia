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

"""Lint checks for proto files."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import subprocess
import sys
import time

import python_utils

from . import linter_utils
from .. import common


class ThirdPartyProtoLintChecksManager(python_utils.OBJECT):
    """Manages all the third party proto linting functions.

    Attributes:
        config_path: str. Path to the configuration file.
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(
            self, files_to_lint, verbose_mode_enabled):
        """Constructs a ThirdPartyProtoLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        super(ThirdPartyProtoLintChecksManager, self).__init__()
        self.files_to_lint = files_to_lint
        self.verbose_mode_enabled = verbose_mode_enabled

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.files_to_lint

    def _lint_proto_files(self):
        """Prints a list of lint errors in the given list of Proto files.

        Returns:
            summary_messages: list(str). Return summary of lint checks.
        """
        prototool_path = os.path.join(
            common.THIRD_PARTY_DIR, 'prototool-%s' % common.PROTOTOOL_VERSION,
            'bin', 'prototool')

        files_to_lint = self.all_filepaths
        start_time = time.time()
        num_files_with_errors = 0
        summary_messages = []

        num_proto_files = len(files_to_lint)
        python_utils.PRINT('Total proto files: ', num_proto_files)
        stylelint_cmd_args = [prototool_path, 'lint']
        result_list = []
        if not self.verbose_mode_enabled:
            python_utils.PRINT('Linting Proto files.')
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
            summary_message = ('%s %s Proto file' % (
                linter_utils.FAILED_MESSAGE_PREFIX, num_files_with_errors))
        else:
            summary_message = ('%s %s Proto file linted (%.1f secs)' % (
                linter_utils.SUCCESS_MESSAGE_PREFIX, num_proto_files,
                time.time() - start_time))
        python_utils.PRINT(summary_message)
        summary_messages.append(summary_message)

        python_utils.PRINT('Proto linting finished.')
        return summary_messages

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        if not self.all_filepaths:
            python_utils.PRINT('')
            python_utils.PRINT(
                'There are no Proto files to lint.')
            return []

        return self._lint_proto_files()


def get_linters(files_to_lint, verbose_mode_enabled=False):
    """Creates ThirdPartyProtoLintChecksManager and returns it.

    Args:
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.

    Returns:
        tuple(None, ThirdPartyProtoLintChecksManager). A 2-tuple of custom and
        third_party linter objects.
    """
    third_party_linter = ThirdPartyProtoLintChecksManager(
        files_to_lint, verbose_mode_enabled)

    return None, third_party_linter
