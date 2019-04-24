# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for File System services."""

from constants import constants
from core.domain import fs_domain
from core.domain import fs_services
from core.tests import test_utils


class FileSystemServicesTests(test_utils.GenericTestBase):
    """Tests for File System services."""

    def test_get_exploration_file_system_with_dev_mode_enabled(self):
        with self.swap(constants, 'DEV_MODE', True):
            file_system = fs_services.get_exploration_file_system_class()
            self.assertIsInstance(
                file_system('exploration_id'), fs_domain.ExplorationFileSystem)

    def test_get_exploration_file_system_with_dev_mode_disabled(self):
        with self.swap(constants, 'DEV_MODE', False):
            file_system = fs_services.get_exploration_file_system_class()
            self.assertIsInstance(
                file_system('exploration_id'), fs_domain.GcsFileSystem)
