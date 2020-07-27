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
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for algorithm proto registry."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import algorithm_proto_registry
from core.tests import test_utils
import feconf


class AlgorithmProtoRegistryTests(test_utils.GenericTestBase):
    """Test the Algorithm Proto Registry."""

    def test_that_protobuf_mapping_exists_for_all_classifier(self):
        """Ensure that all algorithm_id and algorithm_version have corresponding
        protobuf mapping.
        """
        mapping = algorithm_proto_registry.Registry.CLASSIFIER_TO_PROTO_MAPPING
        for interaction in feconf.INTERACTION_CLASSIFIER_MAPPING:
            algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
                interaction]['algorithm_id']
            algorithm_version = feconf.INTERACTION_CLASSIFIER_MAPPING[
                interaction]['algorithm_version']
            self.assertTrue(algorithm_id in mapping)
            self.assertTrue(isinstance(mapping[algorithm_id], dict))
            self.assertTrue(algorithm_version in mapping[algorithm_id])
