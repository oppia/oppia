# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Tests for the controllers that communicate with VM for training
classifiers."""

import os

from core.controllers import classifier
from core.domain import classifier_services
from core.domain import exp_services
from core.platform import models
from core.tests import test_utils
import feconf

(classifier_models,) = models.Registry.import_models([models.NAMES.classifier])


class TrainedClassifierHandlerTest(test_utils.GenericTestBase):
    """Test the handler for storing job result of training job."""

    def setUp(self):
        super(TrainedClassifierHandlerTest, self).setUp()

        self.exp_id = 'exp_id1'
        self.title = 'Testing Classifier storing'
        self.category = 'Test'
        yaml_path = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        with open(yaml_path, 'r') as yaml_file:
            self.yaml_content = yaml_file.read()

        assets_list = []
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.save_new_exploration_from_yaml_and_assets(
                feconf.SYSTEM_COMMITTER_ID, self.yaml_content, self.exp_id,
                assets_list)
        self.exploration = exp_services.get_exploration_by_id(self.exp_id)

        self.classifier_data = {
            '_alpha': 0.1,
            '_beta': 0.001,
            '_prediction_threshold': 0.5,
            '_training_iterations': 25,
            '_prediction_iterations': 5,
            '_num_labels': 10,
            '_num_docs': 12,
            '_num_words': 20,
            '_label_to_id': {'text': 1},
            '_word_to_id': {'hello': 2},
            '_w_dp': [],
            '_b_dl': [],
            '_l_dp': [],
            '_c_dl': [],
            '_c_lw': [],
            '_c_l': []
        }
        classifier_training_jobs = (
            classifier_services.get_classifier_training_jobs(
                self.exp_id, self.exploration.version, ['Home']))
        self.assertEqual(len(classifier_training_jobs), 1)
        classifier_training_job = classifier_training_jobs[0]
        self.job_id = classifier_training_job.job_id

        # TODO(pranavsid98): Replace the three commands below with
        # mark_training_job_pending after Giritheja's PR gets merged.
        classifier_training_job_model = (
            classifier_models.ClassifierTrainingJobModel.get(
                self.job_id, strict=False))
        classifier_training_job_model.status = (
            feconf.TRAINING_JOB_STATUS_PENDING)
        classifier_training_job_model.put()

        self.job_result_dict = {
            'job_id' : self.job_id,
            'classifier_data' : self.classifier_data,
        }

        self.payload = {}
        self.payload['vm_id'] = feconf.DEFAULT_VM_ID
        self.payload['message'] = self.job_result_dict
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        self.payload['signature'] = classifier.generate_signature(
            secret, self.payload['message'])

    def test_trained_classifier_handler(self):
        # Normal end-to-end test.
        self.post_json('/ml/trainedclassifierhandler', self.payload,
                       expect_errors=False, expected_status_int=200)
        classifier_training_jobs = (
            classifier_services.get_classifier_training_jobs(
                self.exp_id, self.exploration.version, ['Home']))
        self.assertEqual(len(classifier_training_jobs), 1)
        classifier_obj = classifier_services.get_classifier_by_id(
            classifier_training_jobs[0].job_id)
        self.assertEqual(classifier_obj.id, classifier_training_jobs[0].job_id)
        self.assertEqual(classifier_obj.exp_id, self.exp_id)
        self.assertEqual(classifier_obj.state_name, 'Home')
        self.assertEqual(classifier_obj.algorithm_id, 'LDAStringClassifier')
        self.assertEqual(classifier_obj.classifier_data, self.classifier_data)

    def test_error_on_prod_mode_and_default_vm_id(self):
        # Turn off DEV_MODE.
        with self.swap(feconf, 'DEV_MODE', False):
            self.post_json('/ml/trainedclassifierhandler', self.payload,
                           expect_errors=True, expected_status_int=401)

    def test_error_on_different_signatures(self):
        # Altering data to result in different signatures.
        self.payload['message']['job_id'] = 'different_job_id'
        self.post_json('/ml/trainedclassifierhandler', self.payload,
                       expect_errors=True, expected_status_int=401)

    def test_error_on_invalid_message(self):
        # Altering message dict to result in invalid dict.
        self.payload['message']['job_id'] = 1
        self.post_json('/ml/trainedclassifierhandler', self.payload,
                       expect_errors=True, expected_status_int=400)

    def test_error_on_existing_classifier(self):
        # Create ClassifierDataModel before the controller is called.
        classifier_services.create_classifier(self.job_id, self.classifier_data)
        self.post_json('/ml/trainedclassifierhandler', self.payload,
                       expect_errors=True, expected_status_int=500)
