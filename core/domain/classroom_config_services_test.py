# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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
# limitations under the License.]

# Currently, the classroom data is stored in the config model and we are
# planning to migrate the storage into a new Classroom model. After the
# successful migration, this file should be renamed as classroom_services_test
# and the exiting classroom services test file should be deleted, until then
# both of the files will exist simultaneously.

"""Tests for classroom services."""

from __future__ import annotations

from core.constants import constants
from core.tests import test_utils

class ClassroomServicesTests(test_utils.GenericTestBase):
    """Tests for classroom services."""

    def setUp(self):
        super().setUp()

