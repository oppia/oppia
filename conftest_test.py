# coding: utf-8
#
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

"""Tests for conftest.py pytest configuration."""

from __future__ import annotations

import os
import sys
from unittest import mock

import conftest
from scripts import common


class PytestConfigureHookTests:
    """Tests for pytest_configure hook."""

    def test_pytest_configure_adds_missing_paths_to_sys_path(self) -> None:
        """Test that pytest_configure adds directories that aren't in sys.path."""
        # Create a mock config object.
        mock_config = mock.MagicMock()

        # Save the original sys.path.
        original_sys_path = sys.path.copy()

        try:
            # Remove one of the required directories from sys.path to test
            # that pytest_configure adds it back.
            test_dir = common.DIRS_TO_ADD_TO_SYS_PATH[0]
            if test_dir in sys.path:
                sys.path.remove(test_dir)

            # Verify it's not in sys.path.
            assert test_dir not in sys.path

            # Call pytest_configure and verify the directory was added.
            conftest.pytest_configure(mock_config)
            if os.path.exists(test_dir):
                assert test_dir in sys.path
        finally:
            # Restore original sys.path.
            sys.path[:] = original_sys_path

    def test_pytest_configure_does_not_duplicate_paths(self) -> None:
        """Test that pytest_configure doesn't add duplicate paths."""
        # Create a mock config object.
        mock_config = mock.MagicMock()

        # Save the original sys.path.
        original_sys_path = sys.path.copy()

        try:
            # Ensure all paths are already in sys.path.
            for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
                if os.path.exists(directory) and directory not in sys.path:
                    sys.path.insert(0, directory)

            # Count how many times each directory appears.
            path_counts = {
                d: sys.path.count(d)
                for d in common.DIRS_TO_ADD_TO_SYS_PATH
                if os.path.exists(d)
            }

            # Call pytest_configure.
            conftest.pytest_configure(mock_config)

            # Verify no duplicates were added.
            for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
                if os.path.exists(directory):
                    assert (
                        sys.path.count(directory) == path_counts[directory]
                    ), f'Directory {directory} was duplicated in sys.path'
        finally:
            # Restore original sys.path.
            sys.path[:] = original_sys_path

    def test_pytest_configure_adds_all_required_paths(self) -> None:
        """Test that pytest_configure adds all paths from DIRS_TO_ADD_TO_SYS_PATH."""
        # Create a mock config object.
        mock_config = mock.MagicMock()

        # Call pytest_configure (it should have already been called by pytest,
        # but calling it again should be safe).
        conftest.pytest_configure(mock_config)

        # Verify all existing directories are in sys.path.
        for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
            if os.path.exists(directory):
                assert (
                    directory in sys.path
                ), f'Required directory {directory} not found in sys.path'


class EnvironmentSetupTests:
    """Tests for environment variable setup in conftest.py."""

    def test_environment_variables_are_set(self) -> None:
        """Test that required environment variables are set at module load time."""
        # These environment variables should be set when conftest.py is imported.
        expected_vars = {
            'DATASTORE_DATASET': 'dev-project-id',
            'DATASTORE_EMULATOR_HOST': 'localhost:8089',
            'DATASTORE_PROJECT_ID': 'dev-project-id',
            'GOOGLE_CLOUD_PROJECT': 'dev-project-id',
            'APPLICATION_ID': 'dev-project-id',
        }

        for var, expected_value in expected_vars.items():
            assert var in os.environ, f'Environment variable {var} not set'
            assert (
                os.environ[var] == expected_value
            ), f'Environment variable {var} has wrong value'
