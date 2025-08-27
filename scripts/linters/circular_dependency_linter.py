# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at.
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software.
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and.
# limitations under the License.

"""Lint checks for circular dependencies in Js and Ts files."""

from __future__ import annotations

import os
import subprocess
from typing import List

from . import linter_utils
from .. import common
from .. import concurrent_task_utils

MYPY = False
if MYPY:  # pragma: no cover.
    from scripts.linters import run_lint_checks

# Exclusion patterns for files that should not be checked for circular.
# dependencies. These patterns are passed to Madge's exclude option.
CIRCULAR_DEPENDENCY_EXCLUDE_PATTERNS = [
    'node_modules/',
    'third_party/',
    '*.spec.ts',
    '*.test.ts',
    'core/tests/',
    'scripts/',
    'typings/',
    '*.d.ts'
]


class CircularDependencyLintChecksManager(linter_utils.BaseLinter):
    """Manages all the custom circular dependency linting functions."""

    def __init__(
        self,
        js_files: List[str],
        ts_files: List[str],
        file_cache: run_lint_checks.FileCache
    ) -> None:
        """Constructs a CircularDependencyLintChecksManager object.

        Args:
            js_files: list(str). The list of js filepaths to be checked.
            ts_files: list(str). The list of ts filepaths to be checked.
            file_cache: object(FileCache). Provides thread-safe access to cached
                file content.
        """
        super().__init__()
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

    def perform_all_lint_checks(self) -> List[concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and return the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """
        # Currently, all circular dependency checks are handled by the.
        # third-party linter (Madge), so custom checks return empty results.
        if not self.all_filepaths:
            return [
                concurrent_task_utils.TaskResult(
                    'Circular Dependencies Custom', False, [],
                    ['There are no JavaScript or Typescript files to check.'])]

        return []


class ThirdPartyCircularDependencyLintChecksManager(linter_utils.BaseLinter):
    """Manages all the third party circular dependency linting functions."""

    def __init__(self, files_to_lint: List[str]) -> None:
        """Constructs a ThirdPartyCircularDependencyLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
        """
        super().__init__()
        self.files_to_lint = files_to_lint

    @property
    def all_filepaths(self) -> List[str]:
        """Return all filepaths."""
        return self.files_to_lint

    def _check_madge_installation(self) -> bool:
        """Checks if Madge is installed and accessible.

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

    def _lint_circular_dependencies(self) -> concurrent_task_utils.TaskResult:
        """Check for circular dependencies using Madge.

        Returns:
            TaskResult. A TaskResult object representing the result of the
            circular dependency check.
        """
        name = 'Circular Dependencies'
        files_to_lint = self.all_filepaths

        if not files_to_lint:
            return concurrent_task_utils.TaskResult(
                name, False, [],
                ['There are no JavaScript or Typescript files to check.'])

        if not self._check_madge_installation():
            return concurrent_task_utils.TaskResult(
                name, True,
                ['ERROR: Madge is not installed. Please run start.py to '
                 'install dependencies.'],
                ['ERROR: Madge is not installed. Please run start.py to '
                 'install dependencies.'])

        try:
            # Prepare Madge command.
            madge_cmd = [
                common.NODE_BIN_PATH,
                os.path.join('node_modules', '.bin', 'madge'),
                '--circular',
                '--extensions', 'ts,js'
            ]

            # Add exclusion patterns.
            for pattern in CIRCULAR_DEPENDENCY_EXCLUDE_PATTERNS:
                madge_cmd.extend(['--exclude', pattern])

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
                return concurrent_task_utils.TaskResult(
                    name, True, [stderr], [stderr])

            if stdout.strip():
                # Circular dependencies found.
                error_messages = [f'Circular dependencies detected:\n{stdout}']
                full_error_messages = [
                    f'Circular dependencies detected:\n{stdout}\n\n'
                    f'To fix circular dependencies, consider:\n'
                    f'1. Move shared code to a separate module\n'
                    f'2. Use dependency injection instead of direct imports\n'
                    f'3. Refactor to remove circular references\n'
                    f'4. Use interfaces to break circular type dependencies'
                ]
                return concurrent_task_utils.TaskResult(
                    name, True, error_messages, full_error_messages)
            else:
                # No circular dependencies found.
                return concurrent_task_utils.TaskResult(
                    name, False, [], ['No circular dependencies found.'])

        except (FileNotFoundError, OSError) as e:
            error_msg = f'Error running Madge: {e}'
            return concurrent_task_utils.TaskResult(
                name, True, [error_msg], [error_msg])

    def perform_all_lint_checks(self) -> List[concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and return the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """
        return [self._lint_circular_dependencies()]


def get_linters(
    js_filepaths: List[str],
    ts_filepaths: List[str],
    file_cache: run_lint_checks.FileCache
) -> tuple[CircularDependencyLintChecksManager,
           ThirdPartyCircularDependencyLintChecksManager]:
    """Creates CircularDependencyLintChecksManager and
    ThirdPartyCircularDependencyLintChecksManager objects and return them.

    Args:
        js_filepaths: list(str). A list of js filepaths to lint.
        ts_filepaths: list(str). A list of ts filepaths to lint.
        file_cache: object(FileCache). Provides thread-safe access to cached
            file content.

    Returns:
        tuple(CircularDependencyLintChecksManager,
        ThirdPartyCircularDependencyLintChecksManager). A 2-tuple
        of custom and third_party linter objects.
    """
    js_ts_file_paths = js_filepaths + ts_filepaths

    custom_linter = CircularDependencyLintChecksManager(
        js_filepaths, ts_filepaths, file_cache)

    third_party_linter = ThirdPartyCircularDependencyLintChecksManager(
        js_ts_file_paths)

    return custom_linter, third_party_linter
