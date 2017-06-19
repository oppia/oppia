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

"""Controllers for communicating with the VM for training classifiers."""

from core.controllers import base
from core.domain import classifier_domain
from core.domain import classifier_services

import feconf
import hashlib
import hmac

def validate_request(handler):
    """Decorator that checks if the incoming request for storing trained
    classifier is valid."""
    def test_is_valid(self, **kwargs):
        signature = self.request.pop('signature')
        vm_id = self.request.pop('vm_id')
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        generated_signature = hmac.new(
            secret, self.request, digestmod=hashlib.sha256).hexdigest()
        if generated_signature != signature:
            response['status_int'] = 401
        if vm_id == 'vm_default' and not feconf.DEV_MODE:
            response['status_int'] = 401
        return handler(self, **kwargs)

    return test_is_valid

class TrainedClassifierHandler(base.BaseHandler):
    """This handler stores thre result of the training job in datastore and
    updates the status of the job.
    """
    @validate_request
    def post(self):
        """Handles POST requests."""
        job_id = self.payload.get('job_id')
        classifier_data = self.payload.get('classifier_data')
        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        state_name = classifier_training_job.state_name
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
        classifier_id = save_classifier(classifier)
        classifier_training_job.update_status(
            feconf.TRAINING_JOB_STATUS_COMPLETE)
        classifier_services.save_classifier_training_job(
            classifier_training_job.algorithm_id,
            classifier_training_job.exp_id,
            classifier_training_job.exp_version,
            classifier_training_job.state_name,
            classifier_training_job.training_data,
            classifier_training_job.status,
            classifier_training_job.job_id)
        if classifier_id:
            response['status_int'] = 200
        else:
            response['status_int'] = 400
