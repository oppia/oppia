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

"""Tests for scripts.run_circular_dependency_checks."""

from __future__ import annotations

import unittest
from unittest import mock

from scripts import run_circular_dependency_checks

from typing import Any


class MockArgs:
    """Mock arguments class for testing."""

    # Here we use type Any because we need to accept various argument
    # types and don't know their specific types in advance.
    def __init__(self, **kwargs: Any) -> None:
        for key, value in kwargs.items():
            setattr(self, key, value)


class TestCheckDependenciesFunction(unittest.TestCase):
    """Tests for the check_circular_dependencies function."""

    def test_madge_installation_check_success(self) -> None:
        """Test successful Madge installation check."""
        with mock.patch('subprocess.run') as mock_subprocess:
            mock_subprocess.return_value = mock.Mock(
                returncode=0, stdout='6.1.0\n'
            )
            result = (
                run_circular_dependency_checks.check_circular_dependencies(
                    files=['file1.js'],
                    verbose=False
                )
            )
            self.assertIsNotNone(result)

    def test_madge_installation_check_failure(self) -> None:
        """Test Madge installation check failure."""
        with mock.patch('subprocess.run') as mock_subprocess:
            mock_subprocess.side_effect = [
                # Madge not found.
                mock.Mock(returncode=1),
            ]
            result = (
                run_circular_dependency_checks.check_circular_dependencies(
                    files=['file1.js'],
                    verbose=False
                )
            )
            self.assertIsNone(result)

    def test_madge_version_check_failure(self) -> None:
        """Test Madge version check failure."""
        with mock.patch('subprocess.run') as mock_subprocess:
            mock_subprocess.side_effect = [
                # Madge found.
                mock.Mock(returncode=0),
                # Version check fails.
                mock.Mock(returncode=1)
            ]
            result = (
                run_circular_dependency_checks.check_circular_dependencies(
                    files=['file1.js'],
                    verbose=False
                )
            )
            self.assertIsNone(result)

    @mock.patch('tempfile.NamedTemporaryFile')
    def test_check_dependencies_with_config_file_creation(
        self, mock_temp_file: mock.Mock
    ) -> None:
        """Test dependencies check with config file creation."""
        # Here we use type Any because mock objects don't have specific
        # types and can represent various return types.
        mock_file: Any = mock.Mock()
        mock_file.name = '/tmp/madge_config.json'
        mock_temp_file.return_value.__enter__.return_value = mock_file

        with mock.patch('subprocess.run') as mock_subprocess:
            mock_subprocess.side_effect = [
                # Version check.
                mock.Mock(returncode=0, stdout='6.1.0\n'),
                mock.Mock(returncode=0, stdout='No circular dependencies')
            ]
            result = (
                run_circular_dependency_checks.check_circular_dependencies(
                    files=['file1.js', 'file1.ts'],
                    verbose=False
                )
            )
            self.assertIsNotNone(result)

    @mock.patch('tempfile.NamedTemporaryFile')
    def test_check_dependencies_with_circular_deps_found(
        self, mock_temp_file: mock.Mock
    ) -> None:
        """Test dependencies check when circular dependencies are found."""
        # Here we use type Any because mock objects don't have specific
        # types and can represent various return types.
        mock_file: Any = mock.Mock()
        mock_file.name = '/tmp/madge_config.json'
        mock_temp_file.return_value.__enter__.return_value = mock_file

        with mock.patch('subprocess.run') as mock_subprocess:
            mock_subprocess.side_effect = [
                # Version check.
                mock.Mock(returncode=0, stdout='6.1.0\n'),
                mock.Mock(
                    returncode=0,
                    stdout='Circular dependency: file1.js -> file2.js'
                )
            ]
            result = (
                run_circular_dependency_checks.check_circular_dependencies(
                    files=['file1.js', 'file1.ts'],
                    verbose=False
                )
            )
            self.assertIsNotNone(result)

    def test_main_with_help_argument(self) -> None:
        """Test main function with help argument."""
        test_args = ['--help']
        with self.assertRaises(SystemExit):
            with mock.patch('sys.argv', ['script_name'] + test_args):
                # Here we use type Any because mock objects don't have
                # specific types and can represent various return types.
                with mock.patch(
                    'argparse.ArgumentParser.parse_args'
                ) as mock_parse:
                    mock_parse.side_effect = SystemExit(0)
                    run_circular_dependency_checks.main()

    @mock.patch('os.path.exists')
    def test_main_with_directory_scanning(
        self, mock_path_exists: mock.Mock
    ) -> None:
        """Test main function with directory scanning."""
        mock_path_exists.return_value = True
        with mock.patch('os.walk') as mock_walk:
            mock_walk.return_value = [
                ('root', ['dir1'], ['file1.js', 'file2.ts'])
            ]

            # Here we use type Any because mock objects don't have
            # specific types and can represent various return types.
            mock_args: Any = MockArgs(
                files=None,
                directory=['src/'],
                extensions=['js', 'ts'],
                config=None,
                timeout=300,
                verbose=False,
                skip_installation_check=False
            )

            with mock.patch(
                'argparse.ArgumentParser.parse_args',
                return_value=mock_args
            ):
                with mock.patch(
                    'run_circular_dependency_checks.'
                    'check_circular_dependencies'
                ) as mock_check:
                    mock_check.return_value = 'No circular dependencies'
                    run_circular_dependency_checks.main()


def main() -> None:
    """Main function for running tests."""
    unittest.main()


if __name__ == '__main__':
    main()
