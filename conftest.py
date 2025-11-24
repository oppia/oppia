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
from unittest import mock

import pytest
from typing import Dict, Generator

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

# Add necessary paths BEFORE importing anything.
CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, '..', 'oppia_tools')
OPPIA_TOOLS_DIR_ABS_PATH = os.path.abspath(OPPIA_TOOLS_DIR)
THIRD_PARTY_DIR = os.path.join(CURR_DIR, 'third_party')
THIRD_PARTY_PYTHON_LIBS_DIR = os.path.join(THIRD_PARTY_DIR, 'python_libs')
GOOGLE_CLOUD_SDK_HOME = os.path.join(
    OPPIA_TOOLS_DIR_ABS_PATH, 'google-cloud-sdk-500.0.0', 'google-cloud-sdk'
)
GOOGLE_APP_ENGINE_SDK_HOME = os.path.join(
    GOOGLE_CLOUD_SDK_HOME, 'platform', 'google_appengine'
)

# Add required paths so we can import from scripts module. We need to do this
# at module load time (before importing scripts.common) because Python needs
# to know where to find the scripts package. If we tried to import
# scripts.common before adding these paths, Python would raise ImportError
# because it doesn't know where the 'scripts' module is located.
paths_to_insert = [
    GOOGLE_APP_ENGINE_SDK_HOME,
    CURR_DIR,
    THIRD_PARTY_PYTHON_LIBS_DIR,
]

for path in reversed(paths_to_insert):
    if os.path.exists(path) and path not in sys.path:
        sys.path.insert(0, path)

# Now we can import from the scripts module.
from scripts import common  # pylint: disable=wrong-import-position


def pytest_configure(
    config: pytest.Config,  # pylint: disable=unused-argument
) -> None:
    """Setup test environment before running tests.

    Args:
        config: pytest.Config. Pytest config object (unused but required by
            hook).
    """
    # pytest_configure runs when pytest starts. We add paths again here as a
    # safety measure in case pytest or other code has modified sys.path, and
    # to remove any coverage-related paths that might interfere with tests.
    for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
        if os.path.exists(directory) and directory not in sys.path:
            sys.path.insert(0, directory)
    sys.path[:] = [path for path in sys.path if 'coverage' not in path]


@pytest.fixture(autouse=True)
def mock_redis_clients() -> Generator[Dict[str, mock.MagicMock], None, None]:
    """Mock Redis clients to avoid requiring a running Redis server during
    tests.

    This fixture automatically applies to all tests and replaces the Redis
    client getter functions with mocks that simulate Redis behavior without
    needing an actual Redis server running.

    Yields:
        dict. Dictionary containing mocked Redis clients.
    """
    # Create mock Redis clients with common Redis methods.
    mock_oppia_redis = mock.MagicMock()
    mock_oppia_redis.mget.return_value = []
    mock_oppia_redis.mset.return_value = True
    mock_oppia_redis.delete.return_value = 0
    mock_oppia_redis.flushdb.return_value = None
    mock_oppia_redis.memory_stats.return_value = {
        'total.allocated': 0,
        'peak.allocated': 0,
        'keys.count': 0,
    }

    mock_cloud_ndb_redis = mock.MagicMock()
    mock_cloud_ndb_redis.flushdb.return_value = None

    # Patch the getter functions in redis_cache_services.
    with mock.patch(
        'core.platform.cache.redis_cache_services.get_oppia_redis_client',
        return_value=mock_oppia_redis,
    ), mock.patch(
        'core.platform.cache.redis_cache_services.get_cloud_ndb_redis_client',
        return_value=mock_cloud_ndb_redis,
    ):
        yield {
            'oppia_redis': mock_oppia_redis,
            'cloud_ndb_redis': mock_cloud_ndb_redis,
        }


@pytest.fixture(autouse=True)
def mock_ndb_client() -> Generator[mock.MagicMock, None, None]:
    """Mock NDB client and context to avoid requiring datastore emulator
    during tests.

    This fixture automatically applies to all tests, and replaces the NDB
    client and context with mocks that simulate NDB behavior without needing
    an actual Datastore emulator running.

    Yields:
        MagicMock. Mocked NDB client instance.
    """
    # Create a mock context that can be used as a context manager.
    mock_context = mock.MagicMock()
    mock_context.__enter__ = mock.MagicMock(return_value=mock_context)
    mock_context.__exit__ = mock.MagicMock(return_value=False)

    # Mock the NDB client.
    mock_ndb_client_instance = mock.MagicMock()
    mock_ndb_client_instance.context.return_value = mock_context

    # Mock get_context to always return a context (so NDB operations don't
    # fail).
    mock_active_context = mock.MagicMock()
    mock_active_context.client = mock_ndb_client_instance

    with mock.patch(
        'core.platform.datastore.cloud_datastore_services.get_client',
        return_value=mock_ndb_client_instance,
    ), mock.patch(
        'google.cloud.ndb.context.get_context',
        return_value=mock_active_context,
    ):
        yield mock_ndb_client_instance
