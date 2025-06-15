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
# limitations under the License.

"""Unit tests for change_domain.py"""

from __future__ import annotations

from core import feconf
from core.domain import change_domain
from core.tests import test_utils


# TODO(#14219): Update these tests to fully cover file change_domain.py.
class ChangeDomainTests(test_utils.GenericTestBase):

    def test_that_domain_object_is_created_correctly(self) -> None:
        change_object = change_domain.BaseChange({
            'cmd': feconf.CMD_DELETE_COMMIT
        })
        expected_change_object_dict = {
            'cmd': feconf.CMD_DELETE_COMMIT
        }
        self.assertEqual(change_object.to_dict(), expected_change_object_dict)
