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

from core.platform import models
from core.tests import test_utils
import feconf

(classifier_models,) = models.Registry.import_models(
    [models.NAMES.classifier])


class ClassifierDataModelUnitTests(test_utils.GenericTestBase):
    """Test the ClassifierDataModel class."""

    def setUp(self):
        super(ClassifierDataModelUnitTests, self).setUp()
        classifier_models.ClassifierDataModel.create(
            'job_request_id1', 'exp_id1', 1, 'state_name1',
            'LDAStringClassifier', {'alpha': 1.0}, 1)
        classifier_models.ClassifierDataModel.create(
            'job_request_id2', 'exp_id1', 1, 'state_name2',
            'LDAStringClassifier', {'alpha': 1.0}, 1)
        classifier_models.ClassifierDataModel.create(
            'job_request_id3', 'exp_id2', 1, 'state_name3',
            'LDAStringClassifier', {'alpha': 1.0}, 1)

    def test_create_new_classifier_runs_successfully(self):
        classifier_id = classifier_models.ClassifierDataModel.create(
            'job_request_id4', 'exp_id3', 1, 'state_name1',
            'LDAStringClassifier', {'alpha': 1.0},
            1)

        classifier = (
            classifier_models.ClassifierDataModel.get(classifier_id))

        self.assertEqual(classifier.id, 'job_request_id4')
        self.assertEqual(classifier.exp_id, 'exp_id3')
        self.assertEqual(classifier.exp_version_when_created, 1)
        self.assertEqual(classifier.state_name, 'state_name1')
        self.assertEqual(classifier.algorithm_id, 'LDAStringClassifier')
        self.assertEqual(classifier.classifier_data, {'alpha': 1.0})
        self.assertEqual(classifier.data_schema_version, 1)


class ClassifierTrainingJobModelUnitTests(test_utils.GenericTestBase):
    """Test the ClassifierTrainingJobModel class."""

    def setUp(self):
        super(ClassifierTrainingJobModelUnitTests, self).setUp()
        classifier_models.ClassifierTrainingJobModel.create(
            'LDAStringClassifier', 'TextInput', 'exp_id1', 1,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name1', feconf.TRAINING_JOB_STATUS_NEW)
        classifier_models.ClassifierTrainingJobModel.create(
            'LDAStringClassifier', 'TextInput', 'exp_id2', 2,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name1', feconf.TRAINING_JOB_STATUS_NEW)
        classifier_models.ClassifierTrainingJobModel.create(
            'LDAStringClassifier', 'TextInput', 'exp_id3', 3,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name1', feconf.TRAINING_JOB_STATUS_NEW)

    def test_create_and_get_new_training_job_runs_successfully(self):
        job_id = classifier_models.ClassifierTrainingJobModel.create(
            'LDAStringClassifier', 'TextInput', 'exp_id1', 1,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name2', feconf.TRAINING_JOB_STATUS_NEW)

        training_job = (
            classifier_models.ClassifierTrainingJobModel.get(job_id))

        self.assertEqual(training_job.algorithm_id, 'LDAStringClassifier')
        self.assertEqual(training_job.interaction_id, 'TextInput')
        self.assertEqual(training_job.exp_id, 'exp_id1')
        self.assertEqual(training_job.exp_version, 1)
        self.assertEqual(training_job.state_name, 'state_name2')
        self.assertEqual(training_job.status,
                         feconf.TRAINING_JOB_STATUS_NEW)
        self.assertEqual(training_job.training_data,
                         [{'answer_group_index': 1, 'answers': ['a1', 'a2']}])


class ClassifierExplorationMappingModelUnitTests(test_utils.GenericTestBase):
    """Tests for the ClassifierExplorationMappingModel class."""

    def test_create_and_get_new_mapping_runs_successfully(self):
        mapping_id = classifier_models.ClassifierExplorationMappingModel.create(
            'exp_id1', 2, 'state_name4', 'classifier_id4')

        mapping = classifier_models.ClassifierExplorationMappingModel.get(
            mapping_id)

        self.assertEqual(mapping.exp_id, 'exp_id1')
        self.assertEqual(mapping.exp_version, 2)
        self.assertEqual(mapping.state_name, 'state_name4')
        self.assertEqual(mapping.classifier_id, 'classifier_id4')

        # Test that exception is raised when creating mapping with same id.
        with self.assertRaisesRegexp(Exception, (
            'A model with the same ID already exists.')):
            mapping_id = (
                classifier_models.ClassifierExplorationMappingModel.create(
                    'exp_id1', 2, 'state_name4', 'classifier_id4'))

        # Test that state names with unicode characters get saved correctly.
        state_name1 = u'Klüft'
        mapping_id = classifier_models.ClassifierExplorationMappingModel.create(
            'exp_id1', 2, state_name1, 'classifier_id4')

        mapping = classifier_models.ClassifierExplorationMappingModel.get(
            mapping_id)

        self.assertEqual(mapping_id, 'exp_id1.2.%s' % (state_name1.encode(
            'utf-8')))

        state_name2 = u'टेक्स्ट'
        mapping_id = classifier_models.ClassifierExplorationMappingModel.create(
            'exp_id1', 2, state_name2, 'classifier_id4')

        mapping = classifier_models.ClassifierExplorationMappingModel.get(
            mapping_id)

        self.assertEqual(mapping_id, 'exp_id1.2.%s' % (state_name2.encode(
            'utf-8')))

    def test_get_model_from_exploration_attributes(self):
        exp_id = 'exp_id1'
        exp_version = 1
        state_name = 'state_name1'
        classifier_id = 'classifier_id1'
        classifier_models.ClassifierExplorationMappingModel.create(
            exp_id, exp_version, state_name, classifier_id)

        mapping = classifier_models.ClassifierExplorationMappingModel.get_model(
            exp_id, exp_version, state_name)

        self.assertEqual(mapping.exp_id, exp_id)
        self.assertEqual(mapping.exp_version, 1)
        self.assertEqual(mapping.state_name, state_name)
        self.assertEqual(mapping.classifier_id, classifier_id)
