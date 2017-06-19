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

"""Tests for the controllers that communicate with VM for training
classifiers."""

from core.controllers import base
from core.domain import classifier_domain
from core.domain import classifier_services
from core.domain import exp_domain
from core.tests import test_utils

import feconf
import hashlib
import hmac
import json
import os

def get_training_data_from_state(state):
    """Retrieves training data from the State domain object."""
    training_data = []
    for (answer_group_index, answer_group) in enumerate(
            state.interaction.answer_groups):
        classifier_rule_spec_index = (
            answer_group.get_classifier_rule_index())
        if classifier_rule_spec_index is not None:
            classifier_rule_spec = answer_group.rule_specs[
                classifier_rule_spec_index]
            answers = []
            for doc in classifier_rule_spec.inputs['training_data']:
                answers.extend([doc])
            training_data.extend([{
                'answer_group_index': answer_group_index,
                'answers': answers
            }])
    return training_data

def generate_signature(data):
    """Generates digital signature for given data."""
    msg = json.dumps(data)
    key = feconf.DEFAULT_VM_SHARED_SECRET
    return hmac.new(key, msg, digestmod=hashlib.sha256).hexdigest()


class TrainedClassifierHandlerTest(test_utils.GenericTestBase):
    """Test the handler for storing job result of training job."""

    def setUp(self):
        super(TrainedClassifierHandlerTest, self).setUp()

        self.exp_id = 'exp_id1'
        self.title = 'Testing Classifier storing'
        self.category = 'Test'
        yaml_path = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                 '../tests/data/string_classifier_test.yaml')
        with open(yaml_path, 'r') as yaml_file:
            self.yaml_content = yaml_file.read()

        self.exploration = exp_domain.Exploration.from_untitled_yaml(
            self.exp_id,
            self.title,
            self.category,
            self.yaml_content)

        state = self.exploration.states['Home']
        algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            state.interaction.id]['algorithm_id']
        training_data = get_training_data_from_state(state)
        job_id = classifier_services.save_classifier_training_job(
            algorithm_id, self.exp_id, self.exploration.version,
            'Home', training_data)

        self.job_result_dict = {
            'job_id' : job_id,
            'classifier_data' : training_data
        }

    def test_trained_classifier_handler(self):
        payload = self.job_result_dict
        payload['vm_id'] = feconf.DEFAULT_VM_ID
        payload['signature'] = generate_signature(payload)
        response = self.post_json('/ml/trainedclassifierhandler', payload)
        self.assertEqual(response['status_int'], 200)
