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
import unittest

from scripts import common


class PytestConfigureHookTests(unittest.TestCase):
    """Tests for pytest_configure hook."""

    def test_hook_sets_environment_variables(self) -> None:
        """Test that pytest_configure sets required environment variables."""
        # Verify key environment variables are set.
        expected_vars = [
            'DATASTORE_DATASET',
            'DATASTORE_EMULATOR_HOST',
            'DATASTORE_PROJECT_ID',
            'GOOGLE_CLOUD_PROJECT',
            'APPLICATION_ID',
        ]

        for var in expected_vars:
            self.assertIn(var, os.environ)

    def test_hook_adds_paths_to_sys_path(self) -> None:
        """Test that pytest_configure adds necessary paths to sys.path."""
        # Verify that required directories are in sys.path.
        for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
            if os.path.exists(directory):
                self.assertIn(directory, sys.path)
