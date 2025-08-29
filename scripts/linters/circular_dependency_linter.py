# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Circular dependency linter for JavaScript and TypeScript files."""

from __future__ import annotations

import os
import subprocess

from scripts import common
from scripts.linters import linter_utils

from typing import TYPE_CHECKING, List

if TYPE_CHECKING:  # pragma: no cover
    from scripts.linters import run_lint_checks


class CircularDependencyLintChecksManager(linter_utils.BaseLinter):
    """Manages circular dependency lint checks for JS and TS files."""

    def __init__(
        self,
        js_filepaths: List[str],
        ts_filepaths: List[str],
        file_cache: run_lint_checks.FileCache
    ) -> None:
        """Constructs a CircularDependencyLintChecksManager object.

        Args:
            js_filepaths: List[str]. A list of JavaScript file paths.
            ts_filepaths: List[str]. A list of TypeScript file paths.
            file_cache: FileCache. Provides thread-safe access to cached
                file content.
        """
        self.js_filepaths = js_filepaths
        self.ts_filepaths = ts_filepaths
        self.file_cache = file_cache

    @property
    def all_filepaths(self) -> List[str]:
        """Return all JavaScript and TypeScript file paths."""
        return self.js_filepaths + self.ts_filepaths

    def _check_madge_installation(self) -> bool:
        """Check if Madge is installed and accessible.

        Returns:
            bool. True if Madge is available, False otherwise.
        """
        try:
            madge_path = os.path.join('node_modules', '.bin', 'madge')
            if os.path.exists(madge_path):
                return True

            # Try global installation.
            proc = subprocess.run(
                [common.NPX_BIN_PATH, 'madge', '--version'],
                capture_output=True,
                text=True,
                check=False,
                timeout=10
            )
            return proc.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            return False

    def _lint_circular_dependencies(
        self
    ) -> linter_utils.concurrent_task_utils.TaskResult:
        """Check for circular dependencies using Madge.

        Returns:
            TaskResult. A TaskResult object representing the result of the
            circular dependency check.
        """
        name = 'Circular Dependencies'
        files_to_lint = self.all_filepaths

        if not files_to_lint:
            return linter_utils.concurrent_task_utils.TaskResult(
                name, False, [],
                ['There are no JavaScript or Typescript files to check.'])

        if not self._check_madge_installation():
            error_msg = (
                'ERROR: Madge is not installed. Please run start.py to '
                'install dependencies.'
            )
            return linter_utils.concurrent_task_utils.TaskResult(
                name, True, [error_msg], [error_msg])

        try:
            # Prepare Madge command.
            madge_cmd = [
                os.path.join('node_modules', '.bin', 'madge'),
                '--circular',
                '--extensions', 'ts,js'
            ]

            # Analyze the main TypeScript directories.
            directories_to_check = [
                'core/templates/',
                'extensions/',
                'assets/'
            ]

            # Only check directories that exist.
            existing_dirs = [
                d for d in directories_to_check if os.path.exists(d)]
            madge_cmd.extend(existing_dirs)

            # Run Madge.
            proc = subprocess.Popen(
                madge_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            encoded_stdout, encoded_stderr = proc.communicate()
            stdout = encoded_stdout.decode('utf-8')
            stderr = encoded_stderr.decode('utf-8')

            if stderr:
                return linter_utils.concurrent_task_utils.TaskResult(
                    name, True, [stderr], [stderr])

            if stdout.strip():
                # Circular dependencies found.
                error_messages = ['Circular dependencies detected:\n{}'.format(
                    stdout)]
                full_error_messages = [
                    'Circular dependencies detected:\n{}\n\n'
                    'To fix circular dependencies, consider:\n'
                    '1. Move shared code to a separate module\n'
                    '2. Use dependency injection instead of direct imports\n'
                    '3. Refactor to remove circular references\n'
                    '4. Use interfaces to break circular type dependencies'
                    .format(stdout)
                ]
                return linter_utils.concurrent_task_utils.TaskResult(
                    name, True, error_messages, full_error_messages)
            else:
                # No circular dependencies found.
                return linter_utils.concurrent_task_utils.TaskResult(
                    name, False, [], ['No circular dependencies found.'])

        except (FileNotFoundError, OSError) as e:
            error_msg = 'Error running Madge: {}'.format(e)
            return linter_utils.concurrent_task_utils.TaskResult(
                name, True, [error_msg], [error_msg])

    def perform_all_lint_checks(
        self
    ) -> List[linter_utils.concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and return the messages returned by all
        the checks.

        Returns:
            List[TaskResult]. A list of TaskResult objects representing the
            results of the lint checks.
        """
        return [self._lint_circular_dependencies()]


class ThirdPartyCircularDependencyLintChecksManager(linter_utils.BaseLinter):
    """Manages third-party circular dependency lint checks for JS and TS."""

    def __init__(
        self,
        js_filepaths: List[str],
        ts_filepaths: List[str],
        file_cache: run_lint_checks.FileCache
    ) -> None:
        """Constructs a ThirdPartyCircularDependencyLintChecksManager object.

        Args:
            js_filepaths: List[str]. A list of JavaScript file paths.
            ts_filepaths: List[str]. A list of TypeScript file paths.
            file_cache: FileCache. Provides thread-safe access to cached
                file content.
        """
        self.js_filepaths = js_filepaths
        self.ts_filepaths = ts_filepaths
        self.file_cache = file_cache

    def perform_all_lint_checks(
        self
    ) -> List[linter_utils.concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and return the messages returned by all
        the checks.

        Returns:
            List[TaskResult]. A list of TaskResult objects representing the
            results of the lint checks.
        """
        return []


def get_linters(
    js_filepaths: List[str],
    ts_filepaths: List[str],
    file_cache: run_lint_checks.FileCache
) -> tuple[CircularDependencyLintChecksManager,
           ThirdPartyCircularDependencyLintChecksManager]:
    """Creates CircularDependencyLintChecksManager and
    ThirdPartyCircularDependencyLintChecksManager objects and return them.

    Args:
        js_filepaths: List[str]. A list of JavaScript file paths.
        ts_filepaths: List[str]. A list of TypeScript file paths.
        file_cache: FileCache. Provides thread-safe access to cached
            file content.

    Returns:
        Tuple[CircularDependencyLintChecksManager,
              ThirdPartyCircularDependencyLintChecksManager]. A 2-tuple of
        corresponding objects.
    """
    custom_linter = CircularDependencyLintChecksManager(
        js_filepaths, ts_filepaths, file_cache)
    third_party_linter = ThirdPartyCircularDependencyLintChecksManager(
        js_filepaths, ts_filepaths, file_cache)
    return custom_linter, third_party_linter
