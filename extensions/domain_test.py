# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for extensions domain."""

from __future__ import annotations

from core.tests import test_utils
from extensions import domain


class CustomizationArgSpecDomainUnitTests(test_utils.GenericTestBase):
    """Tests for CustomizationArgSpec domain object methods."""

    def test_to_dict(self) -> None:
        ca_spec = domain.CustomizationArgSpec(
            'name', 'description', {}, None)
        self.assertEqual(ca_spec.to_dict(), {
            'name': 'name',
            'description': 'description',
            'schema': {},
            'default_value': None
        })
