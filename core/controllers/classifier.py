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

import feconf


def verify_signature(message, vm_id, received_signature):
    """Function that checks if the signature received from the VM is valid.

    Args:
        message: str. The string encoding of the dict that contains job_id and
            classifier_data.
        vm_id: str. The ID of the VM instance.
        received_signature: str. The signature received from the VM.

    Returns:
        bool.

    Raises:
        UnauthorizedUserException.
    """
    secret = str([val['shared_secret_key'] for val in (
        config_domain.VMID_SHARED_SECRET_KEY_MAPPING.value) if val[
            'vm_id'] == vm_id][0])
    generated_signature = hmac.new(
        secret, message, digestmod=hashlib.sha256).hexdigest()
    if generated_signature != received_signature:
        return False
    if vm_id == feconf.DEFAULT_VM_ID and not feconf.DEV_MODE:
        return False
    return True


class TrainedClassifierHandler(base.BaseHandler):
    """This handler stores the result of the training job in datastore and
    updates the status of the job.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    def post(self):
        """Handles POST requests."""
        payload = self.request.get('payload')
        payload = json.loads(payload)
        signature = payload.get('signature')
        message = payload.get('message')
        vm_id = payload.get('vm_id')
        message = json.dumps(message, sort_keys=True)
        if verify_signature(message, vm_id, signature):
            job_id = self.payload.get('message').get('job_id')
            classifier_data = self.payload.get('message').get('classifier_data')
            classifier_training_job = (
                classifier_services.get_classifier_training_job_by_id(job_id))
            state_name = classifier_training_job.state_name
            exp_id = classifier_training_job.exp_id
            exp_version = classifier_training_job.exp_version
            algorithm_id = classifier_training_job.algorithm_id

            data_schema_version = None
            for algorithm_details in (
                    feconf.INTERACTION_CLASSIFIER_MAPPING.values()):
                if algorithm_details['algorithm_id'] == algorithm_id:
                    data_schema_version = algorithm_details[
                        'current_data_schema_version']
            if data_schema_version is None:
                raise self.InternalErrorException

            classifier = classifier_domain.ClassifierData(
                job_id, exp_id, exp_version, state_name, algorithm_id,
                classifier_data, data_schema_version)
            try:
                classifier_services.save_classifier(classifier)
            except Exception:
                raise self.InternalErrorException

            # Update status of the training job to 'COMPLETE'.
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
            return self.render_json({})
        else:
            raise self.UnauthorizedUserException
