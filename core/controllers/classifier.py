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

"""Controllers for communicating with the VM for training classifiers."""

import hashlib
import hmac
import json

from core.controllers import base
from core.domain import classifier_domain
from core.domain import classifier_services
from core.domain import config_domain
from core.domain import exp_services

import feconf


def validate_request(handler):
    """Decorator that checks if the incoming request for storing trained
    classifier is valid."""
    def test_is_valid(self, **kwargs):
        message = self.request.get('payload')
        message = json.loads(message)
        signature = message.get('signature')
        vm_id = message.get('vm_id')
        message.pop('signature')
        message = json.dumps(message, sort_keys=True)
        secret = str([val['shared_secret_key'] for val in (
            config_domain.VMID_SHARED_SECRET_KEY_MAPPING.value) if val[
                'vm_id'] == vm_id][0])
        generated_signature = hmac.new(
            secret, message, digestmod=hashlib.sha256).hexdigest()
        if generated_signature != signature:
            raise self.UnauthorizedUserException
        if vm_id == 'vm_default' and not feconf.DEV_MODE:
            raise self.UnauthorizedUserException
        return handler(self, **kwargs)

    return test_is_valid

class TrainedClassifierHandler(base.BaseHandler):
    """This handler stores the result of the training job in datastore and
    updates the status of the job.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @validate_request
    def post(self):
        """Handles POST requests."""
        job_id = self.payload.get('job_id')
        classifier_data = self.payload.get('classifier_data')
        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        state_name = classifier_training_job.state_name
        committer_id = classifier_training_job.committer_id
        exp_id = classifier_training_job.exp_id
        exp_version = classifier_training_job.exp_version
        algorithm_id = classifier_training_job.algorithm_id
        for algorithm_details in feconf.INTERACTION_CLASSIFIER_MAPPING.values():
            if algorithm_details['algorithm_id'] == algorithm_id:
                data_schema_version = algorithm_details[
                    'current_data_schema_version']
        classifier = classifier_domain.ClassifierData(
            job_id, exp_id, exp_version, state_name, algorithm_id,
            classifier_data, data_schema_version)
        classifier_id = classifier_services.save_classifier(classifier)

        change_list = [{
            'cmd': 'edit_state_property',
            'state_name': state_name,
            'property_name': 'classifier_model_id',
            'new_value': classifier_id
        }]
        exp_services.update_exploration(committer_id, exp_id, change_list, '')

        classifier_training_job.update_status(
            feconf.TRAINING_JOB_STATUS_COMPLETE)
        classifier_services.save_classifier_training_job(
            classifier_training_job.algorithm_id,
            classifier_training_job.committer_id,
            classifier_training_job.exp_id,
            classifier_training_job.exp_version,
            classifier_training_job.state_name,
            classifier_training_job.training_data,
            classifier_training_job.status,
            classifier_training_job.job_id)
        if classifier_id:
            return self.render_json({})
        else:
            return self.InternalErrorException
