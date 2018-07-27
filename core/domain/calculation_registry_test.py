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

import inspect
import random

from core.domain import calculation_registry
from core.tests import test_utils
from extensions.answer_summarizers import models

class CalculationRegistryTests(test_utils.GenericTestBase):
    """Provides testing of the calculation registry."""

    def test_refresh_registry(self):
        for name, clazz in inspect.getmembers(models, inspect.isclass):
            if name.endswith('_test') or name == 'BaseCalculation':
                self.assertNotIn(
                    name, calculation_registry.Registry.calculations_dict)
                continue
            if 'BaseCalculation' not in [
                    base_class.__name__
                    for base_class in inspect.getmro(clazz)]:
                self.assertNotIn(
                    name, calculation_registry.Registry.calculations_dict)
                continue
            self.assertIn(name, calculation_registry.Registry.calculations_dict)
            self.assertEqual(
                clazz, calculation_registry.Registry.calculations_dict[name])

    def test_get_calculation_by_id(self):
        if len(calculation_registry.Registry.calculations_dict) > 0:
            calc_id = random.choice(
                calculation_registry.Registry.calculations_dict.keys())
            self.assertEqual(
                calculation_registry.Registry.calculations_dict[calc_id],
                calculation_registry.Registry.get_calculation_by_id(calc_id))
            with self.assertRaises(TypeError):
                calculation_registry.Registry.get_calculation_by_id('a')
