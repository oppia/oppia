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

"""Lint checks for files other than HTML, CSS, Python, Js and Ts."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

# pylint: disable=wrong-import-position
from . import linter_manager  # isort:skip
from . import semaphore_utils  # isort:skip

_MESSAGE_TYPE_SUCCESS = 'SUCCESS'
_MESSAGE_TYPE_FAILED = 'FAILED'


class OtherLintChecksManager(linter_manager.LintChecksManager):
    """Manages all the linting functions except the ones against Js and Ts. It
    checks Python, CSS, and HTML files.

    Attributes:
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(
            self, files_to_lint, verbose_mode_enabled):
        """Constructs a OtherLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        super(OtherLintChecksManager, self).__init__()
        self.files_to_lint = files_to_lint
        self.verbose_mode_enabled = verbose_mode_enabled

    @property
    def other_filepaths(self):
        """Return other filepaths."""
        return self.files_to_lint

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.other_filepaths

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        common_messages = super(
            OtherLintChecksManager, self).perform_all_lint_checks()

        all_messages = common_messages
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
    custom_linter = OtherLintChecksManager(   # pylint: disable=no-value-for-parameter
        files_to_lint, verbose_mode_enabled)

    task_custom = semaphore_utils.create_task(
        custom_linter.perform_all_lint_checks, verbose_mode_enabled,
        name=file_extension_type)

    return task_custom
