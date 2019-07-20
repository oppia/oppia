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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from constants import constants
from core.domain import fs_domain
from core.domain import fs_services
from core.tests import test_utils

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class FileSystemServicesTests(test_utils.GenericTestBase):
    """Tests for File System services."""

    def test_get_exploration_file_system_with_dev_mode_enabled(self):
        with self.swap(constants, 'DEV_MODE', True):
            file_system = fs_services.get_exploration_file_system_class()
            self.assertIsInstance(
                file_system(fs_domain.ENTITY_TYPE_EXPLORATION, 'entity_id'),
                fs_domain.DatastoreBackedFileSystem)

    def test_get_exploration_file_system_with_dev_mode_disabled(self):
        with self.swap(constants, 'DEV_MODE', False):
            file_system = fs_services.get_exploration_file_system_class()
            self.assertIsInstance(
                file_system(fs_domain.ENTITY_TYPE_EXPLORATION, 'entity_id'),
                fs_domain.GcsFileSystem)
