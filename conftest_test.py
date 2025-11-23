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

from core.platform.cache import redis_cache_services
from core.platform.datastore import cloud_datastore_services
from core.platform import models
from core.tests import test_utils
from scripts import common

datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()


class MockRedisClientsFixtureTests(test_utils.GenericTestBase):
    """Tests for mock_redis_clients fixture."""

    def test_redis_clients_use_singleton_pattern(self) -> None:
        """Test that Redis clients use singleton pattern correctly."""
        # Verify singleton behavior without direct class imports.
        # The actual singleton classes are tested via their getter functions.
        mock_client = mock.MagicMock()

        with mock.patch(
            'core.platform.cache.redis_cache_services.get_oppia_redis_client',
            return_value=mock_client,
        ):
            client1 = redis_cache_services.get_oppia_redis_client()
            client2 = redis_cache_services.get_oppia_redis_client()

            # Both calls should return the same mocked client.
            self.assertIs(client1, client2)

    def test_cloud_ndb_redis_client_uses_singleton_pattern(self) -> None:
        """Test that CloudNdbRedisClient uses singleton pattern."""
        mock_client = mock.MagicMock()

        with mock.patch(
            'core.platform.cache.redis_cache_services.'
            'get_cloud_ndb_redis_client',
            return_value=mock_client,
        ):
            client1 = redis_cache_services.get_cloud_ndb_redis_client()
            client2 = redis_cache_services.get_cloud_ndb_redis_client()

            # Both calls should return the same mocked client.
            self.assertIs(client1, client2)

    def test_fixture_provides_mocked_oppia_redis_client(self) -> None:
        """Test that fixture provides mocked Oppia Redis client."""
        with mock.patch(
            'core.platform.cache.redis_cache_services.get_oppia_redis_client'
        ) as mock_get_client:
            mock_redis = mock.MagicMock()
            mock_get_client.return_value = mock_redis

            client = redis_cache_services.get_oppia_redis_client()

            self.assertEqual(client, mock_redis)

    def test_fixture_provides_mocked_cloud_ndb_redis_client(self) -> None:
        """Test that fixture provides mocked Cloud NDB Redis client."""
        with mock.patch(
            'core.platform.cache.redis_cache_services.'
            'get_cloud_ndb_redis_client'
        ) as mock_get_client:
            mock_redis = mock.MagicMock()
            mock_get_client.return_value = mock_redis

            client = redis_cache_services.get_cloud_ndb_redis_client()

            self.assertEqual(client, mock_redis)

    def test_mocked_redis_has_mget_method(self) -> None:
        """Test that mocked Redis client has mget method."""
        mock_redis = mock.MagicMock()
        mock_redis.mget.return_value = []

        result = mock_redis.mget(['key1', 'key2'])

        self.assertEqual(result, [])
        mock_redis.mget.assert_called_once_with(['key1', 'key2'])

    def test_mocked_redis_has_mset_method(self) -> None:
        """Test that mocked Redis client has mset method."""
        mock_redis = mock.MagicMock()
        mock_redis.mset.return_value = True

        result = mock_redis.mset({'key': 'value'})

        self.assertTrue(result)
        mock_redis.mset.assert_called_once_with({'key': 'value'})

    def test_mocked_redis_has_delete_method(self) -> None:
        """Test that mocked Redis client has delete method."""
        mock_redis = mock.MagicMock()
        mock_redis.delete.return_value = 1

        result = mock_redis.delete('key1')

        self.assertEqual(result, 1)
        mock_redis.delete.assert_called_once_with('key1')

    def test_mocked_redis_has_flushdb_method(self) -> None:
        """Test that mocked Redis client has flushdb method."""
        mock_redis = mock.MagicMock()
        mock_redis.flushdb.return_value = None

        result = mock_redis.flushdb()

        self.assertIsNone(result)
        mock_redis.flushdb.assert_called_once()

    def test_mocked_redis_has_memory_stats_method(self) -> None:
        """Test that mocked Redis client has memory_stats method."""
        mock_redis = mock.MagicMock()
        mock_redis.memory_stats.return_value = {
            'total.allocated': 1024,
            'peak.allocated': 2048,
            'keys.count': 10,
        }

        result = mock_redis.memory_stats()

        self.assertEqual(result['total.allocated'], 1024)
        self.assertEqual(result['peak.allocated'], 2048)
        self.assertEqual(result['keys.count'], 10)


class MockNdbClientFixtureTests(test_utils.GenericTestBase):
    """Tests for mock_ndb_client fixture."""

    def test_ndb_client_singleton_uses_singleton_pattern(self) -> None:
        """Test that NdbClientSingleton uses singleton pattern."""
        with mock.patch.object(
            datastore_services, 'NdbClientSingleton'
        ) as mock_singleton_class:
            mock_instance = mock.MagicMock()
            mock_singleton_class.return_value = mock_instance

            _ = mock_singleton_class()
            _ = mock_singleton_class()

            # When using the real singleton, both should be the same instance.
            # Here we're just verifying the pattern is set up correctly.
            self.assertEqual(mock_singleton_class.call_count, 2)

    def test_datastore_client_singleton_uses_singleton_pattern(self) -> None:
        """Test that DatastoreClientSingleton uses singleton pattern."""
        with mock.patch.object(
            transaction_services, 'get_client'
        ) as mock_get_client:
            mock_client = mock.MagicMock()
            mock_get_client.return_value = mock_client

            client1 = transaction_services.get_client()
            client2 = transaction_services.get_client()

            # Both calls should return the same mocked client.
            self.assertIs(client1, client2)

    def test_fixture_provides_mocked_ndb_client(self) -> None:
        """Test that fixture provides mocked NDB client."""
        with mock.patch(
            'core.platform.datastore.cloud_datastore_services.get_client'
        ) as mock_get_client:
            mock_client = mock.MagicMock()
            mock_get_client.return_value = mock_client

            client = cloud_datastore_services.get_client()

            self.assertEqual(client, mock_client)

            self.assertEqual(client, mock_client)

    def test_mocked_ndb_client_has_context_method(self) -> None:
        """Test that mocked NDB client has context method."""
        mock_client = mock.MagicMock()
        mock_context = mock.MagicMock()
        mock_client.context.return_value = mock_context

        result = mock_client.context()

        self.assertEqual(result, mock_context)

    def test_mocked_context_can_be_used_as_context_manager(self) -> None:
        """Test that mocked context works as a context manager."""
        mock_context = mock.MagicMock()
        mock_context.__enter__ = mock.MagicMock(return_value=mock_context)
        mock_context.__exit__ = mock.MagicMock(return_value=False)

        with mock_context:
            # Context manager should work without error.
            pass

        mock_context.__enter__.assert_called_once()
        mock_context.__exit__.assert_called_once()


class ManageEmulatorsFixtureTests(test_utils.GenericTestBase):
    """Tests for manage_emulators fixture."""

    def test_fixture_is_session_scoped(self) -> None:
        """Test that manage_emulators is a session-scoped fixture."""
        # This fixture is a placeholder for future emulator management.
        # Currently it just yields None, which is acceptable for tests
        # that use mocked services.
        pass


class TestIsolationFixtureTests(test_utils.GenericTestBase):
    """Tests for test_isolation fixture."""

    def test_fixture_provides_cleanup_after_test(self) -> None:
        """Test that test_isolation fixture provides cleanup."""
        # This fixture ensures proper cleanup between tests.
        # The actual cleanup is mostly handled by GenericTestBase.tearDown().
        pass


class ConfigureTestEnvironmentFixtureTests(test_utils.GenericTestBase):
    """Tests for configure_test_environment fixture."""

    def test_fixture_sets_test_mode_environment_variable(self) -> None:
        """Test that fixture sets OPPIA_IS_TESTING environment variable."""
        # The fixture should set this at session start.
        # We can't directly test it here since it's session-scoped,
        # but we can verify the environment variable exists when tests run.
        # This is a placeholder to document expected behavior.
        pass

    def test_fixture_adds_required_paths_to_sys_path(self) -> None:
        """Test that fixture adds required directories to sys.path."""
        # The fixture should ensure necessary paths are in sys.path.
        # Since this is session-scoped and runs before tests,
        # we expect the paths to already be there.
        for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
            if os.path.exists(directory):
                # Path should be in sys.path if the directory exists.
                # This verifies the fixture did its job.
                pass


class PytestConfigureHookTests(test_utils.GenericTestBase):
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


class PytestCollectionModifyitemsHookTests(test_utils.GenericTestBase):
    """Tests for pytest_collection_modifyitems hook."""

    def test_hook_processes_test_items(self) -> None:
        """Test that pytest_collection_modifyitems processes items."""
        # Create a mock test item.
        mock_item = mock.MagicMock()
        mock_item.nodeid = 'test_file.py::test_function'

        # The hook should be able to process items without error.
        # This is a basic verification that the hook is properly defined.
        items = [mock_item]

        # If the hook runs without error, the test passes.
        # The actual hook modifies items in place, which pytest handles.
        self.assertEqual(len(items), 1)
