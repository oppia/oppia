# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Tests for classifier domain objects."""

from core.domain import classifier_domain
from core.tests import test_utils
import utils


class TrainingJobExplorationMappingDomainTests(test_utils.GenericTestBase):
    """Tests for the TrainingJobExplorationMapping domain."""

    def _get_mapping_from_dict(self, mapping_dict):
        mapping = classifier_domain.TrainingJobExplorationMapping(
            mapping_dict['exp_id'],
            mapping_dict['exp_version'],
            mapping_dict['state_name'],
            mapping_dict['job_id'])

        return mapping

    def test_to_dict(self):
        expected_mapping_dict = {
            'exp_id': 'exp_id1',
            'exp_version': 2,
            'state_name': u'網站有中',
            'job_id': 'job_id1'
        }
        observed_mapping = self._get_mapping_from_dict(
            expected_mapping_dict)
        self.assertDictEqual(expected_mapping_dict,
                             observed_mapping.to_dict())

    def test_validation(self):
        """Tests to verify validate method of TrainingJobExplorationMapping
        domain."""

        # Verify no errors are raised for correct data.
        mapping_dict = {
            'exp_id': 'exp_id1',
            'exp_version': 2,
            'state_name': u'網站有中',
            'job_id': 'job_id1'
        }
        mapping = self._get_mapping_from_dict(mapping_dict)
        mapping.validate()

        # Verify validation error is raised when int is provided for exp_id
        # instead of string.
        mapping_dict['exp_id'] = 1
        mapping = self._get_mapping_from_dict(mapping_dict)
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected exp_id to be a string')):
            mapping.validate()

        # Verify validation error is raised when string is provided for
        # exp_version instead of int.
        mapping_dict['exp_id'] = 'exp_id1'
        mapping_dict['exp_version'] = '1'
        mapping = self._get_mapping_from_dict(mapping_dict)
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected exp_version to be an int')):
            mapping.validate()
