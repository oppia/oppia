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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from core.domain import classifier_domain
from core.platform import models
from core.tests import test_utils

(classifier_models,) = models.Registry.import_models(
    [models.NAMES.classifier])


class TrainingJobExplorationMappingModelUnitTests(test_utils.GenericTestBase):
    """Tests for the TrainingJobExplorationMappingModel class."""

    def test_create_and_get_new_mapping_runs_successfully(self):
        mapping_id = (
            classifier_models.TrainingJobExplorationMappingModel.create(
                'exp_id1', 2, 'state_name4', 'job_id4'))

        mapping = classifier_models.TrainingJobExplorationMappingModel.get(
            mapping_id)

        self.assertEqual(mapping.exp_id, 'exp_id1')
        self.assertEqual(mapping.exp_version, 2)
        self.assertEqual(mapping.state_name, 'state_name4')
        self.assertEqual(mapping.job_id, 'job_id4')

        # Test that exception is raised when creating mapping with same id.
        with self.assertRaisesRegexp(Exception, (
            'A model with the same ID already exists.')):
            mapping_id = (
                classifier_models.TrainingJobExplorationMappingModel.create(
                    'exp_id1', 2, 'state_name4', 'job_id4'))

        # Test that state names with unicode characters get saved correctly.
        state_name1 = u'Klüft'
        mapping_id = (
            classifier_models.TrainingJobExplorationMappingModel.create(
                'exp_id1', 2, state_name1, 'job_id4'))

        mapping = classifier_models.TrainingJobExplorationMappingModel.get(
            mapping_id)

        self.assertEqual(mapping_id, 'exp_id1.2.%s' % (state_name1.encode(
            'utf-8')))

        state_name2 = u'टेक्स्ट'
        mapping_id = (
            classifier_models.TrainingJobExplorationMappingModel.create(
                'exp_id1', 2, state_name2, 'job_id4'))

        mapping = classifier_models.TrainingJobExplorationMappingModel.get(
            mapping_id)

        self.assertEqual(mapping_id, 'exp_id1.2.%s' % (state_name2.encode(
            'utf-8')))

    def test_get_model_from_exploration_attributes(self):
        exp_id = 'exp_id1'
        exp_version = 1
        state_name = 'state_name1'
        job_id = 'job_id1'
        classifier_models.TrainingJobExplorationMappingModel.create(
            exp_id, exp_version, state_name, job_id)

        mappings = (
            classifier_models.TrainingJobExplorationMappingModel.get_models(
                exp_id, exp_version, [state_name]))

        self.assertEqual(len(mappings), 1)
        self.assertEqual(mappings[0].exp_id, exp_id)
        self.assertEqual(mappings[0].exp_version, 1)
        self.assertEqual(mappings[0].state_name, state_name)
        self.assertEqual(mappings[0].job_id, job_id)

    def test_create_multi_mappings(self):
        job_exploration_mappings = []
        job_exploration_mappings.append(
            classifier_domain.TrainingJobExplorationMapping(
                u'1', 1, 'Home', 'job_id1'))
        job_exploration_mappings.append(
            classifier_domain.TrainingJobExplorationMapping(
                u'1', 2, 'Home', 'job_id2'))

        mapping_ids = (
            classifier_models.TrainingJobExplorationMappingModel.create_multi(
                job_exploration_mappings))
        self.assertEqual(len(mapping_ids), 2)

        mapping1 = (
            classifier_models.TrainingJobExplorationMappingModel.get(
                mapping_ids[0]))
        self.assertEqual(mapping1.exp_id, '1')
        self.assertEqual(mapping1.exp_version, 1)
        self.assertEqual(mapping1.job_id, 'job_id1')
        self.assertEqual(mapping1.state_name, 'Home')

        mapping2 = (
            classifier_models.TrainingJobExplorationMappingModel.get(
                mapping_ids[1]))
        self.assertEqual(mapping2.exp_id, '1')
        self.assertEqual(mapping2.exp_version, 2)
        self.assertEqual(mapping2.job_id, 'job_id2')
        self.assertEqual(mapping2.state_name, 'Home')
