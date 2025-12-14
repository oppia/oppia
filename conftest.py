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

"""Pytest configuration file for Oppia backend tests."""

from __future__ import annotations

import os
import sys

import pytest

# Set up environment variables BEFORE any imports that might use them.
# These tell Google Cloud clients to use local emulator/test mode.
os.environ['DATASTORE_DATASET'] = 'dev-project-id'
os.environ['DATASTORE_EMULATOR_HOST'] = 'localhost:8089'
os.environ['DATASTORE_EMULATOR_HOST_PATH'] = 'localhost:8089/datastore'
os.environ['DATASTORE_HOST'] = 'http://localhost:8089'
os.environ['DATASTORE_PROJECT_ID'] = 'dev-project-id'
os.environ['DATASTORE_USE_PROJECT_ID_AS_APP_ID'] = 'true'
os.environ['GOOGLE_CLOUD_PROJECT'] = 'dev-project-id'
os.environ['APPLICATION_ID'] = 'dev-project-id'

# Add the current directory to sys.path so we can import from scripts module.
# We only add CURR_DIR here at module load time because that's the minimum
# required to import scripts.common, which defines the full list of paths.
CURR_DIR = os.path.abspath(os.getcwd())
sys.path.insert(0, CURR_DIR)

# Now we can import from the scripts module, which defines the canonical
# list of paths to add to sys.path.
from scripts import common  # pylint: disable=wrong-import-position


def pytest_configure(
    config: pytest.Config,  # pylint: disable=unused-argument
) -> None:
    """Setup test environment before running tests.

    Args:
        config: pytest.Config. Pytest config object (unused but required by
            hook).
    """
    # pytest_configure runs when pytest starts. We add paths here to ensure
    # all required directories are in sys.path, using the canonical list
    # from scripts.common as the single source of truth.
    for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
        if os.path.exists(directory) and directory not in sys.path:
            sys.path.insert(0, directory)
