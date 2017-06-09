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
            'LDAStringClassifier', 'exp_id1', 1,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name1')
        classifier_models.ClassifierTrainingJobModel.create(
            'LDAStringClassifier', 'exp_id2', 2,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name1')
        classifier_models.ClassifierTrainingJobModel.create(
            'LDAStringClassifier', 'exp_id3', 3,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name1')

    def test_create_and_get_new_training_job_runs_successfully(self):
        job_id = classifier_models.ClassifierTrainingJobModel.create(
            'LDAStringClassifier', 'exp_id1', 1,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name2')

        training_job = (
            classifier_models.ClassifierTrainingJobModel.get(job_id))

        self.assertEqual(training_job.algorithm_id, 'LDAStringClassifier')
        self.assertEqual(training_job.exp_id, 'exp_id1')
        self.assertEqual(training_job.exp_version_when_created, 1)
        self.assertEqual(training_job.state_name, 'state_name2')
        self.assertEqual(training_job.status,
                         feconf.TRAINING_JOB_STATUS_NEW)
        self.assertEqual(training_job.training_data,
                         [{'answer_group_index': 1, 'answers': ['a1', 'a2']}])
