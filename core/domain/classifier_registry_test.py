# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Tests for classifier registry."""

from core.domain import classifier_registry
from core.tests import test_utils


class ClassifierRegistryTest(test_utils.GenericTestBase):
    """Test the classifier registry class."""

    def test_get_all_classifier_algorithm_ids(self):
        expected_algorithm_ids = [
            'LDAStringClassifier'
        ]
        algorithm_ids = (
            classifier_registry.Registry.get_all_classifier_algorithm_ids())
        self.assertItemsEqual(expected_algorithm_ids, algorithm_ids)

    def test_get_all_classifiers(self):
        classifier_instances = (
            classifier_registry.Registry.get_all_classifiers())
        self.assertEquals(len(classifier_instances), 1)
