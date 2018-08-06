# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for calculation registry."""

from core.domain import calculation_registry
from core.tests import test_utils
from extensions.answer_summarizers import models


class CalculationRegistryTests(test_utils.GenericTestBase):
    """Provides testing of the calculation registry."""

    def test_get_calculation_by_id(self):
        self.assertTrue(
            isinstance(
                calculation_registry.Registry.get_calculation_by_id(
                    'AnswerFrequencies'),
                models.AnswerFrequencies))
        with self.assertRaises(TypeError):
            calculation_registry.Registry.get_calculation_by_id('a')
