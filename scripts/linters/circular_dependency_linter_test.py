# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Tests for scripts.linters.circular_dependency_linter."""

from __future__ import annotations

import unittest
from unittest import mock

from scripts.linters import circular_dependency_linter
from scripts.linters import run_lint_checks

from typing import List


class CircularDependencyLintChecksManagerTest(unittest.TestCase):
    """Tests for CircularDependencyLintChecksManager."""

    def test_all_filepaths_property(self) -> None:
        """Test that all_filepaths returns combined JS and TS files."""
        js_files = ['file1.js', 'file2.js']
        ts_files = ['file1.ts', 'file2.ts']

        # Create a proper mock for FileCache.
        file_cache = mock.Mock(spec=run_lint_checks.FileCache)

        linter = (
            circular_dependency_linter.CircularDependencyLintChecksManager(
                js_files, ts_files, file_cache
            )
        )

        expected_files = js_files + ts_files
        self.assertEqual(linter.all_filepaths, expected_files)

    def test_check_madge_installation_success(self) -> None:
        """Test successful Madge installation check."""
        js_files = ['file1.js']
        ts_files = ['file1.ts']

        # Here we use object because we need a simple mock that can
        # represent any file cache type without specific implementation.
        file_cache = mock.Mock(spec=run_lint_checks.FileCache)

        linter = (
            circular_dependency_linter.CircularDependencyLintChecksManager(
                js_files, ts_files, file_cache
            )
        )

        with mock.patch('subprocess.run') as mock_subprocess:
            mock_subprocess.return_value = mock.Mock(
                returncode=0, stdout='6.1.0\n'
            )
            result = linter._check_madge_installation()  # pylint: disable=protected-access
            self.assertTrue(result)

    def test_check_madge_installation_not_found(self) -> None:
        """Test Madge installation check when Madge is not found."""
        js_files = ['file1.js']
        ts_files = ['file1.ts']

        # Here we use object because we need a simple mock that can
        # represent any file cache type without specific implementation.
        file_cache = mock.Mock(spec=run_lint_checks.FileCache)

        linter = (
            circular_dependency_linter.CircularDependencyLintChecksManager(
                js_files, ts_files, file_cache
            )
        )

        with mock.patch('subprocess.run') as mock_subprocess:
            mock_subprocess.side_effect = FileNotFoundError()
            result = linter._check_madge_installation()  # pylint: disable=protected-access
            self.assertFalse(result)

    def test_check_madge_installation_version_failure(self) -> None:
        """Test Madge installation check when version check fails."""
        js_files = ['file1.js']
        ts_files = ['file1.ts']

        # Here we use object because we need a simple mock that can
        # represent any file cache type without specific implementation.
        file_cache = mock.Mock(spec=run_lint_checks.FileCache)

        linter = (
            circular_dependency_linter.CircularDependencyLintChecksManager(
                js_files, ts_files, file_cache
            )
        )

        with mock.patch('subprocess.run') as mock_subprocess:
            # Madge found.
            # Version check fails.
            mock_subprocess.side_effect = [
                mock.Mock(returncode=0),
                mock.Mock(returncode=1)
            ]
            result = linter._check_madge_installation()  # pylint: disable=protected-access
            self.assertFalse(result)

    def test_lint_circular_dependencies_success(self) -> None:
        """Test successful circular dependency linting."""
        js_files = ['file1.js']
        ts_files = ['file1.ts']

        # Here we use object because we need a simple mock that can
        # represent any file cache type without specific implementation.
        file_cache = mock.Mock(spec=run_lint_checks.FileCache)

        linter = (
            circular_dependency_linter.CircularDependencyLintChecksManager(
                js_files, ts_files, file_cache
            )
        )

        result = linter._lint_circular_dependencies()  # pylint: disable=protected-access
        self.assertEqual(result, [])

    def test_lint_circular_dependencies_with_violations(self) -> None:
        """Test circular dependency linting with violations found."""
        js_files = ['file1.js']
        ts_files = ['file1.ts']

        # Here we use object because we need a simple mock that can
        # represent any file cache type without specific implementation.
        file_cache = mock.Mock(spec=run_lint_checks.FileCache)

        linter = (
            circular_dependency_linter.CircularDependencyLintChecksManager(
                js_files, ts_files, file_cache
            )
        )

        with mock.patch(
            'scripts.run_circular_dependency_checks.'
            'check_circular_dependencies'
        ) as mock_check:
            mock_check.return_value = (
                'Circular dependency found:\n  file1.js -> file2.js'
            )
            result = linter._lint_circular_dependencies()  # pylint: disable=protected-access
            self.assertTrue(result.failed)
            self.assertIn('Circular dependency found', result.messages[0])

    def test_perform_all_lint_checks(self) -> None:
        """Test perform_all_lint_checks method."""
        js_files = ['file1.js']
        ts_files = ['file1.ts']

        # Here we use object because we need a simple mock that can
        # represent any file cache type without specific implementation.
        file_cache = mock.Mock(spec=run_lint_checks.FileCache)

        linter = (
            circular_dependency_linter.CircularDependencyLintChecksManager(
                js_files, ts_files, file_cache
            )
        )

        result = linter.perform_all_lint_checks()
        self.assertEqual(result, [])


class ThirdPartyCircularDependencyLintChecksManagerTest(unittest.TestCase):
    """Tests for ThirdPartyCircularDependencyLintChecksManager."""

    def test_initialization(self) -> None:
        """Test ThirdPartyCircularDependencyLintChecksManager init."""
        js_files: List[str] = []
        ts_files: List[str] = []

        # Here we use object because we need a simple mock that can
        # represent any file cache type without specific implementation.
        file_cache = mock.Mock(spec=run_lint_checks.FileCache)

        linter = (
            circular_dependency_linter.
            ThirdPartyCircularDependencyLintChecksManager(
                js_files, ts_files, file_cache
            )
        )

        self.assertIsNotNone(linter)
        self.assertEqual(linter.js_filepaths, [])
        self.assertEqual(linter.ts_filepaths, [])


if __name__ == '__main__':
    unittest.main()
