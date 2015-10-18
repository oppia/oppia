# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

__author__ = 'Sean Lip'

from core.domain import value_generators_domain
from core.tests import test_utils


class ValueGeneratorsUnitTests(test_utils.GenericTestBase):
    """Test the value generator registry."""

    def test_value_generator_registry(self):
        COPIER_ID = 'Copier'

        copier = value_generators_domain.Registry.get_generator_class_by_id(
            COPIER_ID)
        self.assertEqual(copier().id, COPIER_ID)

        all_generator_classes = (
            value_generators_domain.Registry.get_all_generator_classes())
        self.assertEqual(len(all_generator_classes), 4)
